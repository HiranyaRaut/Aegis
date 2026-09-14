"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRaceStore } from "@/store/useRaceStore";
import { ACTIVE_CIRCUITS, getCircuitById } from "@/store/circuits";
import { LiveTrackMap } from "../track/LiveTrackMap";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";
import { Play, Pause, RotateCcw, Send, CloudRain, ChevronDown, Search } from "lucide-react";

export function AegisCockpit() {
  const {
    telemetry,
    sessionFlag,
    isRunning,
    targetRain,
    isWeatherAuto,
    driverAnalytics,
    activeEvents,
    mctsStrategy,
    blockchainVerified,
    blockchainLastHash,
    connectionStatus,
    hasRealSocketData,
    currentCircuitId,
    totalRaceLaps,
    selectCircuit,
    sendAction
  } = useRaceStore();

  const [circuitDropdownOpen, setCircuitDropdownOpen] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("menu") === "open";
    }
    return false;
  });
  const [circuitSearch, setCircuitSearch] = useState("");
  const currentCircuit = getCircuitById(currentCircuitId);

  const filteredCircuits = ACTIVE_CIRCUITS.filter(c => 
    c.gpName.toLowerCase().includes(circuitSearch.toLowerCase()) ||
    c.name.toLowerCase().includes(circuitSearch.toLowerCase()) ||
    c.country.toLowerCase().includes(circuitSearch.toLowerCase())
  );

  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ sender: "user" | "ai"; text: string }>>([
    {
      sender: "ai",
      text: "Tire wear is stable at 19%. Temps nominal. No box required yet."
    },
    {
      sender: "user",
      text: "Why is lap time slower?"
    },
    {
      sender: "ai",
      text: "Rear wear at 22% is adding a small thermal slip cost. Nothing urgent."
    }
  ]);

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("menu") === "open") {
        setCircuitDropdownOpen(true);
      }
      const circuitParam = params.get("circuit");
      if (circuitParam) {
        selectCircuit(circuitParam);
      }
    }

    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setCircuitDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, aiLoading]);

  const handleSendAi = async (promptText?: string) => {
    const textToSend = promptText || aiInput;
    if (!textToSend.trim() || aiLoading) return;

    const newMsgs = [...messages, { sender: "user" as const, text: textToSend }];
    setMessages(newMsgs);
    if (!promptText) setAiInput("");
    setAiLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: textToSend })
      });
      if (res.ok) {
        const data = await res.json();
        setMessages([...newMsgs, { sender: "ai", text: data.answer }]);
      } else {
        setMessages([
          ...newMsgs,
          { sender: "ai", text: `Radio telemetry copy: Lap ${telemetry.lap} Sector ${telemetry.sector}. Sector times within expected delta.` }
        ]);
      }
    } catch (e) {
      setMessages([
        ...newMsgs,
        { sender: "ai", text: `Radio link degraded. Sector ${telemetry.sector} pacing telemetry nominal.` }
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  // 60 FPS continuous GPS racing line car tracker
  const [carTransform, setCarTransform] = useState<{ x: number; y: number; angle: number }>({ x: 100, y: 140, angle: 0 });
  const circuitPathRef = useRef<SVGPathElement | null>(null);
  const progressRef = useRef<number>(0.05);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const speedRef = useRef<number>(telemetry.speed);
  const sectorRef = useRef<number>(telemetry.sector);
  const isRunningRef = useRef<boolean>(isRunning);

  useEffect(() => {
    speedRef.current = telemetry.speed;
    sectorRef.current = telemetry.sector;
    isRunningRef.current = isRunning;
  }, [telemetry.speed, telemetry.sector, isRunning]);

  // Reset progress to start line when switching circuits
  useEffect(() => {
    progressRef.current = 0.02;
  }, [currentCircuitId]);

  useEffect(() => {
    let isMounted = true;
    lastTimeRef.current = performance.now();

    const animateCar = (currentTime: number) => {
      if (!isMounted) return;

      const dt = Math.min(0.08, Math.max(0.001, (currentTime - lastTimeRef.current) / 1000));
      lastTimeRef.current = currentTime;

      try {
        const path = circuitPathRef.current || (document.getElementById("cockpit-circuit-path") as SVGPathElement | null);
        if (path) {
          const pathLength = path.getTotalLength();
          if (pathLength > 0) {
            // Dynamic lap progression scaled to actual telemetry speed and track length
            const spd = speedRef.current > 40 ? speedRef.current : 240;
            // In visual cockpit time, a lap completes in ~24-28 seconds at 250 km/h
            const lapDuration = Math.max(16, (currentCircuit.lengthKm / (spd / 3600)) * 0.28);
            
            // Sector guide: gentle circular drift nudge towards current telemetry sector
            const currentSector = Math.max(1, Math.min(3, sectorRef.current || 1));
            const sectorCenter = (currentSector - 0.5) / 3;
            let sectorDiff = sectorCenter - progressRef.current;
            // Circular wrap-around for lap boundary
            if (sectorDiff > 0.5) sectorDiff -= 1.0;
            if (sectorDiff < -0.5) sectorDiff += 1.0;

            // Smoothly adapt rate by up to +/- 18% based on target sector center
            const driftAdjustment = Math.max(-0.18, Math.min(0.18, sectorDiff * 0.6));

            // Advance continuous progress only if simulation is running
            if (isRunningRef.current) {
              const baseRate = 1 / lapDuration;
              const effectiveRate = baseRate * (1 + driftAdjustment);
              let nextProgress = progressRef.current + effectiveRate * dt;
              if (nextProgress >= 1.0) {
                nextProgress -= 1.0;
              }
              progressRef.current = nextProgress;
            }

            // Exact coordinate on track curve
            const currentDist = progressRef.current * pathLength;
            const pt = path.getPointAtLength(currentDist);

            // Forward point for tangential directional heading
            const aheadDist = (currentDist + 2.0) % pathLength;
            const ptAhead = path.getPointAtLength(aheadDist);
            const angleRad = Math.atan2(ptAhead.y - pt.y, ptAhead.x - pt.x);
            const angleDeg = (angleRad * 180) / Math.PI;

            setCarTransform({ x: pt.x, y: pt.y, angle: angleDeg });
          }
        }
      } catch (_) {}

      animFrameRef.current = requestAnimationFrame(animateCar);
    };

    animFrameRef.current = requestAnimationFrame(animateCar);

    return () => {
      isMounted = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [currentCircuitId, currentCircuit.lengthKm]);

  // Chart data: synthesize historical trend up to current lap
  const chartData = driverAnalytics.length > 0
    ? driverAnalytics.map((d) => ({
        lap: `L${d.lap}`,
        fatigue: Math.round(d.fatigue * 100),
        stress: Math.round(d.stress * 100),
        hrp: Math.round(d.hrp * 100)
      }))
    : [
        { lap: "L10", fatigue: 8, stress: 14, hrp: 5 },
        { lap: "L12", fatigue: 9, stress: 16, hrp: 6 },
        { lap: "L14", fatigue: 11, stress: 18, hrp: 7 },
        { lap: "L16", fatigue: 12, stress: 20, hrp: 8 },
        { lap: `L${telemetry.lap}`, fatigue: Math.round(telemetry.fatigue * 100), stress: Math.round(telemetry.stress * 100), hrp: Math.round(telemetry.hrp_score * 100) }
      ];

  const getFlagClasses = () => {
    switch (sessionFlag) {
      case "CHEQUERED":
        return "border-white text-white bg-white/20";
      case "YELLOW":
        return "border-amber-500/40 text-amber-400 bg-amber-500/10";
      case "VSC":
      case "SAFETY_CAR":
        return "border-orange-500/40 text-orange-400 bg-orange-500/10";
      case "RED":
        return "border-red-500/40 text-red-400 bg-red-500/10";
      default:
        return "border-emerald-500/40 text-emerald-400 bg-emerald-500/10";
    }
  };

  return (
    <div className="p-4 font-mono select-none flex flex-col gap-3.5">
      
      {/* 1. TOP SUB-HEADER: CIRCUIT SELECTION & RACE PROGRESS */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-800/80">
        {/* Left: Active Circuit Dropdown */}
        <div className="flex items-center space-x-3">
          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest hidden sm:inline">
            CIRCUIT VENUE:
          </span>
          
          {/* Active Grand Prix Circuit Selector Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setCircuitDropdownOpen(!circuitDropdownOpen)}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-[#111115] hover:bg-[#18181f] border border-neutral-800 hover:border-neutral-700 text-xs font-bold tracking-wider text-neutral-200 uppercase transition-all shadow-md"
              title="Select Active F1 Circuit"
            >
              <span className="text-base leading-none">{currentCircuit.flag}</span>
              <span className="text-white">{currentCircuit.gpName.toUpperCase()}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${circuitDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {circuitDropdownOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-80 max-h-[420px] bg-[#0d0d10]/95 border border-neutral-800 rounded-xl shadow-2xl py-2 z-50 backdrop-blur-md flex flex-col">
                <div className="px-3 pb-2 border-b border-neutral-800/80">
                  <div className="flex items-center justify-between text-[10px] text-neutral-400 uppercase tracking-widest font-bold mb-1.5">
                    <span>Active Grand Prix</span>
                    <span className="text-neutral-500 font-mono">{filteredCircuits.length} / 24</span>
                  </div>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input
                      type="text"
                      placeholder="Search GP, circuit, or country..."
                      value={circuitSearch}
                      onChange={(e) => setCircuitSearch(e.target.value)}
                      className="w-full bg-[#141418] border border-neutral-800 rounded-lg pl-8 pr-2.5 py-1 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500/60"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="overflow-y-auto max-h-[300px] scrollbar-thin px-1 py-1 space-y-0.5">
                  {filteredCircuits.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        selectCircuit(c.id);
                        setCircuitDropdownOpen(false);
                        setCircuitSearch("");
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left text-xs font-bold transition-colors ${
                        c.id === currentCircuitId
                          ? "bg-red-500/15 text-red-400 border border-red-500/30"
                          : "text-neutral-300 hover:bg-neutral-800/60 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <span className="text-base leading-none">{c.flag}</span>
                        <div>
                          <div className="text-xs font-bold leading-none">{c.gpName}</div>
                          <div className="text-[10px] text-neutral-500 font-normal mt-0.5">{c.name}</div>
                        </div>
                      </div>
                      <div className="text-right font-mono shrink-0 pl-2">
                        <span className="text-[11px] text-neutral-300 font-bold">{c.totalLaps} L</span>
                        <div className="text-[9px] text-neutral-500">{c.lengthKm} km</div>
                      </div>
                    </button>
                  ))}
                  {filteredCircuits.length === 0 && (
                    <div className="p-4 text-center text-xs text-neutral-500">
                      No circuits match &quot;{circuitSearch}&quot;
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-1.5 border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>STREAM LIVE</span>
          </div>
        </div>

        {/* Right: Lap / Sector / Flag */}
        <div className="flex items-center space-x-4 text-xs font-bold tracking-wider">
          <span className="text-neutral-400">
            LAP <strong className="text-white">{telemetry.lap}</strong>/{totalRaceLaps}
          </span>
          <span className="text-neutral-400">
            SECTOR <strong className="text-white">{telemetry.sector}</strong>
          </span>
          <div className={`px-2.5 py-0.5 rounded-full border text-[10px] font-black uppercase tracking-wider ${getFlagClasses()}`}>
            {sessionFlag} FLAG
          </div>
        </div>
      </div>

      {/* 2. MAIN 3-COLUMN COCKPIT GRID */}
      <div className="grid grid-cols-12 gap-3.5 flex-grow">
        
        {/* ============================================================== */}
        {/* LEFT COLUMN: TELEMETRY, TIRE STATUS, DRIVER STATE */}
        {/* ============================================================== */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-3.5">
          
          {/* Card 1: TELEMETRY */}
          <div className="bg-[#0a0a0c] border border-neutral-800/80 rounded-xl p-4 flex flex-col justify-between flex-1">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-2">
              TELEMETRY
            </span>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between items-baseline">
                <span className="text-neutral-400 uppercase tracking-wider">SPEED</span>
                <span className="text-lg font-bold text-white tracking-tight">
                  {telemetry.speed.toFixed(1)} <span className="text-[10px] text-neutral-500 font-normal">KM/H</span>
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-neutral-400 uppercase tracking-wider">RPM</span>
                <span className="text-lg font-bold text-white tracking-tight">{Math.round(telemetry.rpm)}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-neutral-400 uppercase tracking-wider">GEAR</span>
                <span className="text-lg font-bold text-white tracking-tight">{telemetry.gear}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-neutral-400 uppercase tracking-wider">FUEL</span>
                <span className="text-lg font-bold text-white tracking-tight">
                  {telemetry.fuel_load.toFixed(1)} <span className="text-[10px] text-neutral-500 font-normal">KG</span>
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-neutral-400 uppercase tracking-wider">ERS</span>
                <span className="text-lg font-bold text-emerald-400 tracking-tight">{Math.round(telemetry.ers_charge)}%</span>
              </div>
            </div>
          </div>

          {/* Card 2: TIRE STATUS · MEDIUM */}
          <div className="bg-[#0a0a0c] border border-neutral-800/80 rounded-xl p-4 flex flex-col justify-between flex-1">
            <div className="flex justify-between items-center mb-2.5">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                TIRE STATUS · {telemetry.tire_compound}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* Front Left */}
              <div className="bg-[#111114] border border-neutral-800/70 rounded-lg p-2 flex flex-col justify-between">
                <div className="flex justify-between items-baseline">
                  <span className="text-[10px] text-neutral-400">FL</span>
                  <span className={`text-sm font-bold ${telemetry.tire_temp_fl >= 93 ? "text-amber-400" : "text-emerald-400"}`}>
                    {Math.round(telemetry.tire_temp_fl)}°C
                  </span>
                </div>
                <div className="w-full bg-neutral-800 h-1 rounded-full mt-1.5 overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${telemetry.tire_temp_fl >= 93 ? "bg-amber-400" : "bg-emerald-400"}`}
                    style={{ width: `${Math.max(10, Math.min(100, (1 - telemetry.tire_wear_fl) * 100))}%` }}
                  />
                </div>
              </div>

              {/* Front Right */}
              <div className="bg-[#111114] border border-neutral-800/70 rounded-lg p-2 flex flex-col justify-between">
                <div className="flex justify-between items-baseline">
                  <span className="text-[10px] text-neutral-400">FR</span>
                  <span className={`text-sm font-bold ${telemetry.tire_temp_fr >= 93 ? "text-amber-400" : "text-emerald-400"}`}>
                    {Math.round(telemetry.tire_temp_fr)}°C
                  </span>
                </div>
                <div className="w-full bg-neutral-800 h-1 rounded-full mt-1.5 overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${telemetry.tire_temp_fr >= 93 ? "bg-amber-400" : "bg-emerald-400"}`}
                    style={{ width: `${Math.max(10, Math.min(100, (1 - telemetry.tire_wear_fr) * 100))}%` }}
                  />
                </div>
              </div>

              {/* Rear Left */}
              <div className="bg-[#111114] border border-neutral-800/70 rounded-lg p-2 flex flex-col justify-between">
                <div className="flex justify-between items-baseline">
                  <span className="text-[10px] text-neutral-400">RL</span>
                  <span className={`text-sm font-bold ${telemetry.tire_temp_rl >= 93 ? "text-amber-400" : "text-emerald-400"}`}>
                    {Math.round(telemetry.tire_temp_rl)}°C
                  </span>
                </div>
                <div className="w-full bg-neutral-800 h-1 rounded-full mt-1.5 overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${telemetry.tire_temp_rl >= 93 ? "bg-amber-400" : "bg-emerald-400"}`}
                    style={{ width: `${Math.max(10, Math.min(100, (1 - telemetry.tire_wear_rl) * 100))}%` }}
                  />
                </div>
              </div>

              {/* Rear Right */}
              <div className="bg-[#111114] border border-neutral-800/70 rounded-lg p-2 flex flex-col justify-between">
                <div className="flex justify-between items-baseline">
                  <span className="text-[10px] text-neutral-400">RR</span>
                  <span className={`text-sm font-bold ${telemetry.tire_temp_rr >= 93 ? "text-amber-400" : "text-emerald-400"}`}>
                    {Math.round(telemetry.tire_temp_rr)}°C
                  </span>
                </div>
                <div className="w-full bg-neutral-800 h-1 rounded-full mt-1.5 overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${telemetry.tire_temp_rr >= 93 ? "bg-amber-400" : "bg-emerald-400"}`}
                    style={{ width: `${Math.max(10, Math.min(100, (1 - telemetry.tire_wear_rr) * 100))}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: DRIVER STATE (HDM) */}
          <div className="bg-[#0a0a0c] border border-neutral-800/80 rounded-xl p-4 flex flex-col justify-between flex-1">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-2">
              DRIVER STATE (HDM)
            </span>
            <div className="space-y-2.5 text-xs">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-neutral-400 uppercase tracking-wider">FATIGUE</span>
                  <span className="text-white font-bold">{Math.round(telemetry.fatigue * 100)}%</span>
                </div>
                <div className="w-full bg-neutral-800 h-1 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-400 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.round(telemetry.fatigue * 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-neutral-400 uppercase tracking-wider">STRESS</span>
                  <span className="text-white font-bold">{Math.round(telemetry.stress * 100)}%</span>
                </div>
                <div className="w-full bg-neutral-800 h-1 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-400 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.round(telemetry.stress * 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-neutral-400 uppercase tracking-wider">HRP RISK</span>
                  <span className="text-emerald-400 font-bold">{Math.round(telemetry.hrp_score * 100)}%</span>
                </div>
                <div className="w-full bg-neutral-800 h-1 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-400 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.round(telemetry.hrp_score * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* ============================================================== */}
        {/* CENTER COLUMN: TRACK MAP, FATIGUE TREND, RACE EVENTS */}
        {/* ============================================================== */}
        <div className="col-span-12 lg:col-span-6 flex flex-col gap-3.5">
          
          {/* Card 1: FASTF1 LIVE TRACK MAP & TELEMETRY */}
          <LiveTrackMap />

          {/* Card 2: FATIGUE / STRESS TREND */}
          <div className="bg-[#0a0a0c] border border-neutral-800/80 rounded-xl p-4 h-[175px] flex flex-col justify-between">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
              FATIGUE / STRESS TREND
            </span>

            <div className="h-[120px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                  <XAxis dataKey="lap" stroke="#333333" fontSize={10} tickLine={false} />
                  <YAxis stroke="#333333" fontSize={10} domain={[0, 100]} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#0e0e11", border: "1px solid #2a2a2e", fontSize: "11px", borderRadius: "6px" }}
                  />
                  <Line type="monotone" dataKey="fatigue" stroke="#ef4444" strokeWidth={1.8} dot={false} name="Fatigue %" />
                  <Line type="monotone" dataKey="stress" stroke="#f59e0b" strokeWidth={1.8} dot={false} name="Stress %" />
                  <Line type="monotone" dataKey="hrp" stroke="#10b981" strokeWidth={1.8} dot={false} name="HRP %" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Card 3: RACE CONTROL EVENTS */}
          <div className="bg-[#0a0a0c] border border-neutral-800/80 rounded-xl p-4 h-[135px] flex flex-col">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-2">
              RACE CONTROL EVENTS
            </span>

            <div className="space-y-1.5 overflow-y-auto text-xs scrollbar-none flex-grow">
              {activeEvents.length > 0 ? (
                activeEvents.slice(-3).reverse().map((evt, idx) => {
                  const tag = evt.event_type.toUpperCase().includes("FLAG") 
                    ? "FLAG" 
                    : evt.event_type.toUpperCase().includes("WEATHER") 
                    ? "WEATHER" 
                    : evt.event_type.toUpperCase().includes("STRESS") || evt.event_type.toUpperCase().includes("TIRE") 
                    ? "TIRE" 
                    : "FLAG";
                  
                  const tagColor = tag === "TIRE" 
                    ? "text-[#ff1e1e]" 
                    : tag === "WEATHER" 
                    ? "text-cyan-400" 
                    : "text-cyan-400";

                  return (
                    <div key={idx} className="flex items-center space-x-2 text-[11px]">
                      <span className="text-neutral-500 font-bold shrink-0">L{evt.lap}</span>
                      <span className={`${tagColor} font-black shrink-0`}>{tag}</span>
                      <span className="text-neutral-300 truncate">{evt.description}</span>
                    </div>
                  );
                })
              ) : (
                <>
                  <div className="flex items-center space-x-2 text-[11px]">
                    <span className="text-neutral-500 font-bold">L18</span>
                    <span className="text-cyan-400 font-black">FLAG</span>
                    <span className="text-neutral-300">DRS enabled, Sector 1 clear</span>
                  </div>
                  <div className="flex items-center space-x-2 text-[11px]">
                    <span className="text-neutral-500 font-bold">L17</span>
                    <span className="text-[#ff1e1e] font-black">TIRE</span>
                    <span className="text-neutral-300">RL/RR approaching thermal limit</span>
                  </div>
                  <div className="flex items-center space-x-2 text-[11px]">
                    <span className="text-neutral-500 font-bold">L14</span>
                    <span className="text-cyan-400 font-black">WEATHER</span>
                    <span className="text-neutral-300">Radar clear, grip nominal</span>
                  </div>
                </>
              )}
            </div>
          </div>

        </div>

        {/* ============================================================== */}
        {/* RIGHT COLUMN: MCTS STRATEGY, AI RACE ENGINEER, LEDGER */}
        {/* ============================================================== */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-3.5">
          
          {/* Card 1: MCTS STRATEGY */}
          <div className="bg-[#0a0a0c] border border-neutral-800/80 rounded-xl p-4 flex flex-col justify-between flex-1">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-2">
              MCTS STRATEGY
            </span>

            <div className="space-y-1.5 text-xs mb-3">
              <div className="flex justify-between items-baseline">
                <span className="text-neutral-400 uppercase tracking-wider">RECOMMENDED</span>
                <span className="text-sm font-black text-emerald-400 uppercase">
                  {mctsStrategy.recommended_action.includes("BOX") ? mctsStrategy.recommended_action : "STAY OUT"}
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-neutral-400 uppercase tracking-wider">CONFIDENCE</span>
                <span className="text-sm font-bold text-white">
                  {Math.round(mctsStrategy.confidence_score * 100)}%
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-neutral-400 uppercase tracking-wider">PIT WINDOW</span>
                <span className="text-sm font-bold text-white">
                  L{mctsStrategy.pit_window_start} - L{mctsStrategy.pit_window_end}
                </span>
              </div>
              <div className="text-[10px] text-neutral-500 mt-1">
                {mctsStrategy.strategy_string || "MEDIUM (L1-24) → HARD (L25-50)"}
              </div>
            </div>

            {/* Engine Mode Buttons */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button
                onClick={() => sendAction("set_engine_mode", { mode: "PUSH" })}
                className={`py-2 rounded-lg text-xs font-black tracking-wider uppercase transition-all ${
                  telemetry.engine_mode === "PUSH"
                    ? "bg-[#ff1e1e] text-white shadow-[0_0_10px_rgba(255,30,30,0.5)]"
                    : "bg-[#141416] border border-neutral-800 text-neutral-400 hover:text-white"
                }`}
              >
                PUSH
              </button>
              <button
                onClick={() => sendAction("set_engine_mode", { mode: "CONSERVE" })}
                className={`py-2 rounded-lg text-xs font-black tracking-wider uppercase transition-all ${
                  telemetry.engine_mode === "CONSERVE"
                    ? "bg-emerald-500 text-black font-black"
                    : "bg-[#141416] border border-neutral-800 text-neutral-400 hover:text-white"
                }`}
              >
                CONSERVE
              </button>
            </div>

            {/* Compound Buttons */}
            <div className="grid grid-cols-4 gap-1.5">
              {(["SOFT", "MEDIUM", "HARD", "WET"] as const).map((comp) => {
                const isActive = telemetry.tire_compound === comp;
                const isWet = comp === "WET";
                return (
                  <button
                    key={comp}
                    onClick={() => sendAction("box", { compound: comp })}
                    className={`py-1.5 rounded text-[10px] font-bold uppercase transition-all ${
                      isActive 
                        ? "border border-white bg-white/15 text-white" 
                        : isWet 
                        ? "border border-blue-500/40 text-blue-400 bg-[#111114] hover:bg-blue-500/10" 
                        : "border border-neutral-800 text-neutral-400 hover:text-white bg-[#111114]"
                    }`}
                  >
                    {comp}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card 2: AI RACE ENGINEER */}
          <div className="bg-[#0a0a0c] border border-neutral-800/80 rounded-xl p-4 flex flex-col justify-between flex-1 min-h-[200px]">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-2">
              AI RACE ENGINEER
            </span>

            {/* Messages Container */}
            <div ref={chatScrollRef} className="space-y-2 overflow-y-auto max-h-[140px] text-xs pr-1 mb-2 scrollbar-none">
              {messages.map((m, idx) => (
                <div key={idx} className="flex flex-col">
                  {m.sender === "ai" ? (
                    <div className="bg-[#180e0f] border border-red-950/70 text-neutral-300 p-2.5 rounded-xl text-[11px] leading-relaxed">
                      {m.text}
                    </div>
                  ) : (
                    <div 
                      onClick={() => handleSendAi(m.text)}
                      className="bg-[#141418] border border-neutral-800/90 text-neutral-400 p-2 rounded-lg text-[11px] text-right cursor-pointer hover:border-neutral-700 my-1 self-end max-w-[85%]"
                    >
                      {m.text}
                    </div>
                  )}
                </div>
              ))}
              {aiLoading && (
                <div className="text-[10px] text-neutral-500 animate-pulse">
                  Analyzing telemetry radio...
                </div>
              )}
            </div>

            {/* Radio Input Box */}
            <div className="flex items-center space-x-1.5 pt-2 border-t border-neutral-800/80">
              <input
                type="text"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendAi()}
                placeholder="Why is lap time slower?"
                className="flex-1 bg-[#121216] border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500/50"
              />
              <button
                onClick={() => handleSendAi()}
                disabled={aiLoading || !aiInput.trim()}
                className="p-1.5 rounded-lg bg-[#ff1e1e] hover:bg-[#e01b1b] disabled:opacity-40 text-white transition-colors"
              >
                <Send className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Card 3: LEDGER INTEGRITY */}
          <div className="bg-[#0a0a0c] border border-neutral-800/80 rounded-xl p-4">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-2">
              LEDGER INTEGRITY
            </span>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between items-baseline">
                <span className="text-neutral-400 uppercase tracking-wider">STATUS</span>
                <span className="text-xs font-bold text-emerald-400 uppercase">
                  {blockchainVerified ? "VERIFIED" : "COMPROMISED"}
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-neutral-400 uppercase tracking-wider">SHA-256</span>
                <span className="text-xs font-mono text-neutral-400">
                  {blockchainLastHash || "ff65d321..."}
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
