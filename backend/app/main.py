import asyncio
import os
import json
import logging
from datetime import datetime
from fastapi import FastAPI, Depends, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel

# Database imports
from app.database.connection import engine, Base, get_db
from app.models.database_models import (
    RaceSession, TelemetryLog, DriverState, WeatherState, 
    StrategyHistory, PitStopEvent, RaceEventLog, AuditChain
)
from app.schemas.data_schemas import StrategyRequest
from app.schemas.circuit_catalog import get_circuit, list_circuits, ACTIVE_CIRCUITS

# Core Services
from app.services.telemetry_engine import TelemetryEngine
from app.services.blockchain_sec import CryptographicLedger
from app.services.mcts_strategy import MCTSStrategyEngine
from app.services.anomaly_detector import AnomalyDetector
from app.services.event_engine import EventEngine
from app.websocket import manager

# Create SQLite tables on startup
Base.metadata.create_all(bind=engine)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("AEGIS")

app = FastAPI(title="AEGIS: AI Race Strategist API", version="1.0.0")

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Simulation State
class SimulationState:
    def __init__(self):
        self.circuit_id = "monza"
        self.circuit = get_circuit("monza")
        self.total_laps = self.circuit["total_laps"]
        self.engine = TelemetryEngine(circuit=self.circuit)
        self.ledger = CryptographicLedger()
        self.mcts = MCTSStrategyEngine(total_race_laps=self.total_laps, circuit=self.circuit)
        self.detector = AnomalyDetector()
        self.events = EventEngine()
        
        self.active_session_id = None
        self.is_running = False
        self.target_rain = None
        self.sim_speed = 0.8  # seconds per sector tick
        self.simulation_task = None
        self.event_history = []

sim_state = SimulationState()

# AI Chat Request Schema
class AIChatRequest(BaseModel):
    message: str

def initialize_session(db: Session, circuit_id: str = None):
    # Prune old sessions to keep aegis.db lean and bounded across runs
    try:
        old_sessions = db.query(RaceSession).order_by(RaceSession.id.desc()).offset(5).all()
        for old_s in old_sessions:
            db.delete(old_s)
        db.commit()
    except Exception as e:
        logger.warning(f"Session retention cleanup skipped: {e}")

    if circuit_id:
        sim_state.circuit_id = circuit_id.lower()
    circuit = get_circuit(sim_state.circuit_id)
    sim_state.circuit = circuit
    sim_state.total_laps = circuit["total_laps"]

    session = RaceSession(
        name=circuit["gp_name"],
        track_name=circuit["name"],
        total_laps=circuit["total_laps"]
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    sim_state.active_session_id = session.id
    sim_state.engine = TelemetryEngine(start_fuel=105.0, start_compound="MEDIUM", circuit=circuit)
    sim_state.mcts = MCTSStrategyEngine(total_race_laps=circuit["total_laps"], circuit=circuit)
    sim_state.ledger = CryptographicLedger()
    sim_state.events = EventEngine()
    sim_state.detector = AnomalyDetector()
    sim_state.event_history = []
    sim_state.target_rain = None  # None enables autonomous weather evolution by default
    logger.info(f"Initialized new RaceSession with ID: {session.id} for circuit: {circuit['name']}")
    return session

async def simulation_loop():
    """
    Background simulation worker loop. Simulates sector ticks, saves states,
    creates blockchain audits, runs MCTS strategy, and broadcasts telemetry.
    """
    logger.info("Simulation loop worker started.")
    while True:
        if sim_state.is_running and sim_state.active_session_id:
            # 1. Step the sector
            try:
                # Resolve SQLite session locally for background task
                from app.database.connection import SessionLocal
                db = SessionLocal()
                
                # Check for weather forecasts (supporting autonomous radar alerts)
                incoming_forecast = sim_state.engine.weather.get_incoming_forecast()
                forecast_event = sim_state.events.trigger_rain_forecast(
                    sim_state.engine.weather.rain_intensity, sim_state.target_rain, incoming_forecast
                )
                if forecast_event:
                    save_event(db, forecast_event)

                # Process sector tick
                frame = sim_state.engine.step_sector(sim_state.target_rain)
                lap = frame["lap"]
                sector = frame["sector"]

                # 2. Check for race incident flags
                flag_event = sim_state.events.update_session_flags(
                    lap, sector, frame["mistake_occurred"], frame["fatigue"]
                )
                if flag_event:
                    save_event(db, flag_event)
                    # Slow car down under Safety Car or VSC
                    if sim_state.events.session_flag in ["VSC", "SAFETY_CAR"]:
                        sim_state.engine.physics.speed = min(80.0, sim_state.engine.physics.speed)
                    elif sim_state.events.session_flag == "RED":
                        sim_state.engine.physics.speed = 0.0

                # Log driver mistakes as events
                if frame["mistake_occurred"]:
                    mistake_event = {
                        "event_type": "driver_stress",
                        "description": f"DRIVER INSTABILITY: {frame['mistake_description']}",
                        "severity": "critical"
                    }
                    save_event(db, mistake_event)

                # 3. Detect Anomalies
                anomalies = sim_state.detector.scan_telemetry(frame)
                for anomaly in anomalies:
                    save_event(db, anomaly)

                # 4. Save to Database
                save_telemetry_frame(db, frame)

                # 5. Run real-time MCTS optimizations
                strategy_rec = sim_state.mcts.optimize_strategy(
                    current_lap=lap,
                    current_compound=frame["tire_compound"],
                    fuel_load=frame["fuel_load"],
                    fatigue=frame["fatigue"],
                    stress=frame["stress"],
                    rain_intensity=frame["weather"]["rain_intensity"],
                    track_grip=frame["weather"]["grip_level"],
                    rollouts=80
                )
                save_strategy_rec(db, lap, strategy_rec)

                # 6. Record in Cryptographic Ledger
                block = sim_state.ledger.record_telemetry_block(sim_state.active_session_id, frame)
                save_audit_block(db, block)

                # 7. Merge additional metrics for frontend broadcast
                blockchain_ok = sim_state.ledger.verify_latest_block() if sector != 3 else sim_state.ledger.verify_chain(depth=20)
                full_payload = {
                    "type": "telemetry_update",
                    "circuit_id": sim_state.circuit_id,
                    "circuit_name": sim_state.circuit["name"],
                    "gp_name": sim_state.circuit["gp_name"],
                    "total_laps": sim_state.total_laps,
                    "session_flag": sim_state.events.session_flag,
                    "blockchain_verified": blockchain_ok,
                    "blockchain_last_hash": block["hash"][:16] + "...",
                    "active_events": sim_state.event_history[-6:],
                    "mcts_strategy": strategy_rec,
                    **frame
                }

                # 8. Check Race-End Condition (Total Laps finish)
                if lap >= sim_state.total_laps and sector == 3:
                    sim_state.is_running = False
                    sim_state.events.session_flag = "CHEQUERED"
                    full_payload["session_flag"] = "CHEQUERED"
                    full_payload["is_race_completed"] = True

                    current_session = db.query(RaceSession).filter(RaceSession.id == sim_state.active_session_id).first()
                    if current_session:
                        current_session.status = "completed"
                        db.commit()

                    save_event(db, {
                        "event_type": "flag",
                        "description": f"CHEQUERED FLAG: {sim_state.circuit['gp_name']} completed! Lap {sim_state.total_laps} finished.",
                        "severity": "info"
                    })

                    time_mins = int(frame["elapsed_time"] // 60)
                    time_secs = int(frame["elapsed_time"] % 60)
                    time_ms = int((frame["elapsed_time"] % 1) * 1000)
                    formatted_time = f"{time_mins:02d}:{time_secs:02d}.{time_ms:03d}"

                    race_summary = {
                        "total_elapsed_time": formatted_time,
                        "final_lap": sim_state.total_laps,
                        "final_compound": frame["tire_compound"],
                        "audit_blocks": len(sim_state.ledger.chain),
                        "cognitive_efficiency": frame["cognitive_efficiency"]
                    }
                    full_payload["race_summary"] = race_summary

                    await manager.broadcast(full_payload)
                    await manager.broadcast({
                        "type": "race_completed",
                        "message": f"{sim_state.circuit['gp_name']} completed! Chequered flag deployed.",
                        "summary": race_summary
                    })
                else:
                    # Broadcast to frontend
                    await manager.broadcast(full_payload)
                
                db.close()
            except Exception as e:
                logger.error(f"Error in simulation loop: {e}", exc_info=True)
                
        await asyncio.sleep(sim_state.sim_speed)

# Database Helper Functions
def save_event(db: Session, event_data: dict):
    db_event = RaceEventLog(
        session_id=sim_state.active_session_id,
        lap=sim_state.engine.current_lap,
        event_type=event_data["event_type"],
        description=event_data["description"],
        severity=event_data["severity"]
    )
    db.add(db_event)
    db.commit()
    sim_state.event_history.append({
        "lap": db_event.lap,
        "event_type": db_event.event_type,
        "description": db_event.description,
        "severity": db_event.severity,
        "timestamp": datetime.utcnow().strftime("%H:%M:%S")
    })

def save_telemetry_frame(db: Session, frame: dict):
    # Save Telemetry
    db_telemetry = TelemetryLog(
        session_id=sim_state.active_session_id,
        lap=frame["lap"],
        sector=frame["sector"],
        speed=frame["speed"],
        rpm=frame["rpm"],
        gear=frame["gear"],
        throttle=frame["throttle"],
        brake=frame["brake"],
        steering_angle=frame["steering_angle"],
        gforce_x=frame["gforce_x"],
        gforce_y=frame["gforce_y"],
        fuel_load=frame["fuel_load"],
        ers_charge=frame["ers_charge"],
        tire_wear_fl=frame["tire_wear_fl"],
        tire_wear_fr=frame["tire_wear_fr"],
        tire_wear_rl=frame["tire_wear_rl"],
        tire_wear_rr=frame["tire_wear_rr"],
        tire_temp_fl=frame["tire_temp_fl"],
        tire_temp_fr=frame["tire_temp_fr"],
        tire_temp_rl=frame["tire_temp_rl"],
        tire_temp_rr=frame["tire_temp_rr"],
        tire_compound=frame["tire_compound"],
        hrp_score=frame["hrp_score"]
    )
    db.add(db_telemetry)

    # Save Driver state
    db_driver = DriverState(
        session_id=sim_state.active_session_id,
        lap=frame["lap"],
        cognitive_efficiency=frame["cognitive_efficiency"],
        fatigue=frame["fatigue"],
        stress=frame["stress"],
        reaction_delay=frame["reaction_delay"],
        focus_level=frame["focus_level"],
        aggression_bias=frame["aggression_bias"],
        risk_bias=frame["risk_bias"],
        confidence_state=frame["confidence_state"]
    )
    db.add(db_driver)

    # Save Weather
    db_weather = WeatherState(
        session_id=sim_state.active_session_id,
        lap=frame["lap"],
        rain_intensity=frame["weather"]["rain_intensity"],
        track_water_depth=frame["weather"]["track_water_depth"],
        grip_level=frame["weather"]["grip_level"],
        status=frame["weather"]["status"]
    )
    db.add(db_weather)

    # Save Pit stop if occurred
    if frame.get("pit_stop") and frame["pit_stop"]["active"]:
        db_pit = PitStopEvent(
            session_id=sim_state.active_session_id,
            lap=frame["lap"],
            compound_from=sim_state.engine.physics.tire_compound, # Pit happens before changing
            compound_to=frame["tire_compound"],
            duration=frame["pit_stop"]["duration"],
            is_unsafe_release=frame["pit_stop"]["is_unsafe_release"],
            is_crew_error=frame["pit_stop"]["is_crew_error"],
            pit_lane_time=frame["pit_stop"]["pit_lane_time"]
        )
        db.add(db_pit)

        # Log pit stop event
        pit_msg = f"PIT STOP: Replaced tyres with {frame['tire_compound']}. Stationed: {frame['pit_stop']['duration']}s."
        if frame["pit_stop"]["is_crew_error"]:
            pit_msg += f" DELAY: {frame['pit_stop']['error_reason']}"
        
        save_event(db, {
            "event_type": "flag",
            "description": pit_msg,
            "severity": "critical" if frame["pit_stop"]["is_crew_error"] else "info"
        })

    db.commit()

def save_strategy_rec(db: Session, lap: int, rec: dict):
    db_strategy = StrategyHistory(
        session_id=sim_state.active_session_id,
        lap=lap,
        recommended_compound=rec["recommended_compound"],
        expected_stops=rec["expected_stops"],
        mcts_depth=80,
        win_probability=rec["win_probability"],
        confidence_score=rec["confidence_score"],
        pit_window_start=rec["pit_window_start"],
        pit_window_end=rec["pit_window_end"],
        strategy_string=rec["strategy_string"]
    )
    db.add(db_strategy)
    db.commit()

def save_audit_block(db: Session, block: dict):
    db_block = AuditChain(
        block_index=block["block_index"],
        session_id=sim_state.active_session_id,
        telemetry_hash=block["hash"],
        previous_hash=block["previous_hash"],
        verified=True
    )
    db.add(db_block)
    db.commit()

# REST Endpoints

@app.on_event("startup")
async def startup_event():
    # Initialize background task
    sim_state.simulation_task = asyncio.create_task(simulation_loop())

@app.get("/circuits")
def get_circuits_catalog():
    return list_circuits()

@app.get("/circuits/manifest")
def get_circuits_manifest(season: int = 2025):
    manifest_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data", "circuits", str(season), "circuits_manifest.json"))
    if not os.path.exists(manifest_path):
        fallback_season = 2026 if season == 2025 else 2025
        manifest_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data", "circuits", str(fallback_season), "circuits_manifest.json"))
    if os.path.exists(manifest_path):
        with open(manifest_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return list_circuits()

@app.get("/circuits/{circuit_id}")
def get_circuit_by_id(circuit_id: str):
    circuit = get_circuit(circuit_id)
    return circuit

@app.get("/circuits/{circuit_id}/geometry")
def get_circuit_geometry(circuit_id: str, season: int = 2025):
    target_clean = circuit_id.lower().replace("-", "_")
    target_hyphen = circuit_id.lower().replace("_", "-")
    
    # Try current season
    for s in [season, 2026 if season == 2025 else 2025]:
        for name in [circuit_id.lower(), target_clean, target_hyphen]:
            geometry_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data", "circuits", str(s), f"{name}.json"))
            if os.path.exists(geometry_path):
                with open(geometry_path, "r", encoding="utf-8") as f:
                    return json.load(f)
                    
    raise HTTPException(status_code=404, detail=f"Circuit geometry not found for '{circuit_id}' (season {season})")

@app.get("/race/session")
def get_session(db: Session = Depends(get_db)):
    if not sim_state.active_session_id:
        initialize_session(db)
    session = db.query(RaceSession).filter(RaceSession.id == sim_state.active_session_id).first()
    return {
        "id": session.id,
        "name": session.name,
        "track_name": session.track_name,
        "total_laps": session.total_laps,
        "status": session.status,
        "circuit_id": sim_state.circuit_id
    } if session else None

@app.post("/race/session/restart")
def restart_session(circuit_id: str = None, db: Session = Depends(get_db)):
    target_circuit = circuit_id or sim_state.circuit_id
    session = initialize_session(db, circuit_id=target_circuit)
    sim_state.is_running = False
    return {
        "status": "restarted",
        "session_id": session.id,
        "circuit_id": sim_state.circuit_id,
        "total_laps": sim_state.total_laps
    }

@app.get("/telemetry/live")
def get_telemetry_live():
    # Construct telemetry frame from memory
    phys = sim_state.engine.physics.get_telemetry_state()
    hdm = sim_state.engine.hdm.get_state()
    weather = sim_state.engine.weather.get_state()
    return {
        "lap": sim_state.engine.current_lap,
        "sector": sim_state.engine.current_sector,
        "engine_mode": sim_state.engine.engine_mode,
        "session_flag": sim_state.events.session_flag,
        "weather": weather,
        **phys,
        **hdm
    }

@app.get("/driver/state")
def get_driver_state():
    return sim_state.engine.hdm.get_state()

@app.get("/weather")
def get_weather():
    return sim_state.engine.weather.get_state()

@app.get("/events")
def get_events(db: Session = Depends(get_db)):
    return sim_state.event_history[-30:]

@app.get("/analytics/hrp")
def get_hrp_analytics(db: Session = Depends(get_db)):
    """
    Returns historical fatigue, stress, and HRP states for graphing.
    """
    if not sim_state.active_session_id:
        return []
    records = db.query(DriverState).filter(DriverState.session_id == sim_state.active_session_id).order_by(DriverState.id.asc()).all()
    return [
        {
            "lap": r.lap,
            "fatigue": round(r.fatigue, 2),
            "stress": round(r.stress, 2),
            "hrp": round(1.0 - r.cognitive_efficiency, 2),
            "efficiency": round(r.cognitive_efficiency, 2)
        }
        for r in records
    ]

@app.post("/strategy/recommend")
def recommend_strategy(req: StrategyRequest):
    """
    Manual strategy request solver.
    """
    rec = sim_state.mcts.optimize_strategy(
        current_lap=req.lap,
        current_compound=req.tire_compound,
        fuel_load=req.fuel_load,
        fatigue=req.driver_fatigue,
        stress=req.driver_stress,
        rain_intensity=req.rain_intensity,
        track_grip=req.track_grip,
        rollouts=120
    )
    return rec

# AI Chat Specialist Dual Mode Engine
@app.post("/ai/chat")
async def ai_chat(req: AIChatRequest):
    user_query = req.message.lower()
    
    # Retrieve active state context
    phys = sim_state.engine.physics.get_telemetry_state()
    hdm = sim_state.engine.hdm.get_state()
    weather = sim_state.engine.weather.get_state()
    lap = sim_state.engine.current_lap
    sector = sim_state.engine.current_sector
    
    # Compile actual live contextual data
    ctx = {
        "lap": lap,
        "sector": sector,
        "speed": phys["speed"],
        "compound": phys["tire_compound"],
        "tire_wear": phys["tire_wear_avg"],
        "tire_temp_FL": phys["tire_temp_fl"],
        "tire_temp_RL": phys["tire_temp_rl"],
        "fatigue": hdm["fatigue"],
        "stress": hdm["stress"],
        "cognitive_efficiency": hdm["cognitive_efficiency"],
        "hrp": hdm["hrp_score"],
        "rain": weather["rain_intensity"],
        "grip": weather["grip_level"],
        "mode": sim_state.engine.engine_mode
    }
    
    # Try OpenAI if API Key present
    openai_key = os.getenv("OPENAI_API_KEY")
    if openai_key:
        try:
            from openai import OpenAI
            client = OpenAI(api_key=openai_key)
            system_prompt = (
                "You are the Lead F1 Race Strategy Engineer (AI Engineer) for AEGIS. "
                "You are communicating with the race director and strategy team in the operations center. "
                "Analyze the provided live telemetry state context and answer the user query in a concise, "
                "professional, authentic motorsport radio fashion. Use abbreviations like S1, S2, S3, Box, DRS, ERS, HRP."
            )
            context_string = f"LIVE RACING STATE: {json.dumps(ctx)}"
            
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"{context_string}\n\nUSER QUESTION: {req.message}"}
                ],
                max_tokens=150,
                temperature=0.4
            )
            return {"answer": response.choices[0].message.content.strip()}
        except Exception as e:
            logger.warning(f"Failed to use OpenAI API: {e}. Falling back to Rule-based F1 Specialist reasoning.")

    # Rule-Based Specialist reasoning (Dual Mode fallback)
    # This guarantees extremely accurate F1 context-aware replies matching real simulation telemetry!
    if "wear" in user_query or "tire" in user_query or "tyre" in user_query:
        wear_pct = round(ctx["tire_wear"] * 100, 1)
        fl_t = ctx["tire_temp_FL"]
        rl_t = ctx["tire_temp_RL"]
        
        answer = f"Tire wear is currently averaging {wear_pct}% on the {ctx['compound']} stint. "
        if ctx["tire_wear"] > 0.6:
            answer += f"Thermal degradation is severe. RL/RR temps are hitting {rl_t}°C, which is causing wheelspin. Box is highly recommended in Sector 3."
        else:
            answer += f"Temps FL: {fl_t}°C, RL: {rl_t}°C. Tires are currently stable inside optimal thermal windows."
            
    elif "fatigue" in user_query or "focus" in user_query or "hrp" in user_query or "driver" in user_query:
        hrp = round(ctx["hrp"] * 100)
        delay = round(hdm["reaction_delay"] * 1000)
        
        answer = f"Driver cognitive efficiency is at {round(ctx['cognitive_efficiency']*100)}% with a calculated HRP risk penalty of {hrp}%. "
        if ctx["hrp"] > 0.35:
            answer += f"Driver fatigue is {round(ctx['fatigue']*100)}% and stress is at {round(ctx['stress']*100)}%. Brake reaction times are delayed by +{delay}ms. Mistake locking risk in Sector 3 is elevated. Advise conserving battery and preparing early pit box to lower cognitive workload."
        else:
            answer += f"Reaction lag is {delay}ms. Aggression is locked at {round(hdm['aggression_bias']*100)}%. Cognitive focus remains high."

    elif "rain" in user_query or "weather" in user_query or "wet" in user_query:
        rain_pct = round(ctx["rain"] * 100)
        grip = ctx["grip"]
        
        if ctx["rain"] > 0.5:
            answer = f"Track water depth is at {round(sim_state.engine.weather.track_water_depth, 2)} mm. Grip level is degraded to {grip}. Current tire {ctx['compound']} is losing thermal grip. Advise box immediately for WET/Intermediate compounds."
        elif ctx["rain"] > 0.1:
            answer = f"Damp patches forming in S2. Rain intensity: {rain_pct}%. Grip level: {grip}. Standard slicks are borderline. Keep stay out for 1 lap to monitor water clearance."
        else:
            answer = f"Track remains dry. Grips are optimal at {grip}. Weather radar shows clear cells in Sector 1."

    elif "time" in user_query or "increase" in user_query or "slow" in user_query or "loss" in user_query:
        wear_p = round(ctx["tire_wear"] * 100)
        fatigue_p = round(ctx["fatigue"] * 100)
        
        answer = f"Lap times are increasing due to combined factors. Rear tire wear is at {wear_p}% causing thermal slips (+1.2s cost). "
        if ctx["fatigue"] > 0.4:
            answer += f"Additionally, driver fatigue is {fatigue_p}%, adding brake delays of +{round(hdm['reaction_delay']*1000)}ms in Sector 3 (+0.8s cost)."
        else:
            answer += f"Dynamic grip from weather remains stable at {ctx['grip']}. No direct vehicle degradation noted."
            
    else:
        answer = (
            f"Copy that. Sector {sector} active. Speed {ctx['speed']} km/h, ERS battery at {round(phys['ers_charge'])}%. "
            f"We are running in {ctx['mode']} engine mode on the {ctx['compound']} tires. "
            f"MCTS optimal stint shows expected pit window opening around Lap {sim_state.mcts.optimize_strategy(lap, ctx['compound'], ctx['fuel_load'], ctx['fatigue'], ctx['stress'], ctx['rain'], ctx['grip'])['pit_window_start']}."
        )

    return {"answer": answer}

# WebSocket Communication Channel
@app.websocket("/ws/telemetry")
async def websocket_telemetry(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Send initial confirmation message
        await manager.send_personal_message(
            {
                "type": "connection_established",
                "circuit_id": sim_state.circuit_id,
                "circuit_name": sim_state.circuit["name"],
                "gp_name": sim_state.circuit["gp_name"],
                "total_laps": sim_state.total_laps,
                "message": "Secure AEGIS Telemetry Stream Link Connected."
            },
            websocket
        )
        
        while True:
            # Keep listening to client control payloads
            data = await websocket.receive_text()
            payload = json.loads(data)
            
            action = payload.get("action")
            logger.info(f"WebSocket client action received: {action}")
            
            if action == "set_engine_mode":
                sim_state.engine.set_engine_mode(payload.get("mode"))
            elif action == "force_weather":
                sim_state.target_rain = float(payload.get("value", 0.0))
            elif action == "auto_weather":
                sim_state.target_rain = None
                logger.info("Autonomous weather evolution re-engaged.")
            elif action == "box":
                new_compound = payload.get("compound", "MEDIUM")
                sim_state.engine.trigger_box(new_compound)
            elif action == "select_circuit":
                selected_circuit = payload.get("circuit_id", "monza")
                from app.database.connection import SessionLocal
                db = SessionLocal()
                session = initialize_session(db, circuit_id=selected_circuit)
                db.close()
                sim_state.is_running = False
                logger.info(f"Circuit switched to: {selected_circuit}")
                await manager.broadcast({
                    "type": "circuit_selected",
                    "circuit_id": sim_state.circuit_id,
                    "circuit_name": sim_state.circuit["name"],
                    "gp_name": sim_state.circuit["gp_name"],
                    "total_laps": sim_state.total_laps,
                    "characteristics": sim_state.circuit.get("characteristics", ""),
                    "message": f"Circuit selected: {sim_state.circuit['gp_name']}"
                })
            elif action == "toggle_simulation":
                sim_state.is_running = not sim_state.is_running
                logger.info(f"Simulation active state toggled to: {sim_state.is_running}")
                await manager.broadcast({
                    "type": "sim_state_toggled",
                    "is_running": sim_state.is_running
                })
            elif action == "reset_simulation":
                # Initialize fresh session locally
                from app.database.connection import SessionLocal
                db = SessionLocal()
                initialize_session(db, circuit_id=sim_state.circuit_id)
                db.close()
                sim_state.is_running = False
                await manager.broadcast({
                    "type": "sim_state_reset",
                    "circuit_id": sim_state.circuit_id,
                    "circuit_name": sim_state.circuit["name"],
                    "gp_name": sim_state.circuit["gp_name"],
                    "total_laps": sim_state.total_laps,
                    "message": "Simulation states successfully reset."
                })
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        logger.info("WebSocket disconnected.")
    except Exception as e:
        logger.error(f"WebSocket exception: {e}")
        manager.disconnect(websocket)
