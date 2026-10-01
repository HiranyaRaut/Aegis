import React, { useEffect, useState, useRef } from "react";
import { useRaceStore } from "@/store/useRaceStore";
import { getCircuitById, DEFAULT_CIRCUIT_ID } from "@/store/circuits";
import { GlassCard } from "../shared/GlassCard";
import { Map, Flag, Image as ImageIcon, Navigation, ExternalLink, Gauge, Disc, Cog } from "lucide-react";

interface TelemetrySample {
  x: number;
  y: number;
  distance: number;
  speed: number;
  gear: number;
  brake?: boolean;
  throttle?: number;
}

interface CornerInfo {
  number: number;
  number_str?: string;
  name: string;
  x: number;
  y: number;
  label_x?: number;
  label_y?: number;
  min_speed?: number;
  gear?: number;
  distance?: number;
}

interface DrsZone {
  id: number;
  name: string;
  start_pct?: number;
  end_pct?: number;
  svg_path_segment?: string;
}

interface DrsDetectionZone {
  id: number;
  name: string;
  x: number;
  y: number;
  label_x?: number;
  label_y?: number;
}

interface LoadedGeometry {
  id: string;
  name: string;
  gp_name: string;
  country: string;
  viewBox: string;
  svg_path: string;
  corners: CornerInfo[];
  sector_split_points: {
    s1: { x: number; y: number; label: string };
    s2: { x: number; y: number; label: string };
    s3: { x: number; y: number; label: string };
  };
  sector_best?: [number, number, number];
  length_km?: number;
  fastest_driver?: string;
  fastest_lap_time?: string;
  data_source?: string;
  official_map_sheet?: string;
  f1chronicle_source_url?: string;
  telemetry_samples?: TelemetrySample[];
  drs_zones?: DrsZone[];
  drs_detection_zones?: DrsDetectionZone[];
  speed_trap?: { x: number; y: number; label: string };
  start_line?: { x: number; y: number; label: string };
  sector_watermarks?: Array<{ label: string; x: number; y: number }>;
}

interface CarTelemetry {
  x: number;
  y: number;
  angle: number;
  speed: number;
  gear: number;
  brake: boolean;
  throttle: number;
  distance: number;
}

export function LiveTrackMap() {
  const telemetry = useRaceStore((state) => state.telemetry);
  const sessionFlag = useRaceStore((state) => state.sessionFlag);
  const currentCircuitId = useRaceStore((state) => state.currentCircuitId);
  const isRunning = useRaceStore((state) => state.isRunning);
  const season = useRaceStore((state) => state.season || "2025");

  const fallbackCircuit = getCircuitById(currentCircuitId || DEFAULT_CIRCUIT_ID);
  const [geoData, setGeoData] = useState<LoadedGeometry | null>(null);
  const [viewMode, setViewMode] = useState<"telemetry" | "sheet">("telemetry");

  // Dynamic FastF1 circuit geometry loader with 2025 season support
  useEffect(() => {
    let isMounted = true;
    const targetId = (currentCircuitId || DEFAULT_CIRCUIT_ID).toLowerCase();

    fetch(`/data/circuits/${season}/${targetId}.json`)
      .then((res) => {
        if (!res.ok) throw new Error("Current season local circuit asset not found");
        return res.json();
      })
      .then((data: LoadedGeometry) => {
        if (isMounted) setGeoData(data);
      })
      .catch(() => {
        // Fallback to 2026 local static asset if 2025 is missing
        fetch(`/data/circuits/2026/${targetId}.json`)
          .then((res) => {
            if (!res.ok) throw new Error("Fallback circuit asset not found");
            return res.json();
          })
          .then((data: LoadedGeometry) => {
            if (isMounted) setGeoData(data);
          })
          .catch(() => {
            // FastAPI backend geometry endpoint fallback
            fetch(`http://127.0.0.1:8000/circuits/${targetId}/geometry?season=${season}`)
              .then((res) => {
                if (!res.ok) throw new Error("FastAPI geometry endpoint not found");
                return res.json();
              })
              .then((data: LoadedGeometry) => {
                if (isMounted) setGeoData(data);
              })
              .catch(() => {
                if (isMounted) setGeoData(null);
              });
          });
      });

    return () => {
      isMounted = false;
    };
  }, [currentCircuitId, season]);

  const effectiveSvgPath = geoData?.svg_path || fallbackCircuit.svgPath;
  const effectiveViewBox = geoData?.viewBox || fallbackCircuit.viewBox || "0 0 1000 600";
  const effectiveCorners = geoData?.corners || fallbackCircuit.cornerMarkers;
  const effectiveSectorSplits = geoData?.sector_split_points || fallbackCircuit.sectorSplitPoints;
  const effectiveLengthKm = geoData?.length_km || fallbackCircuit.lengthKm;
  const effectiveSectorBest = geoData?.sector_best || fallbackCircuit.sectorBest;
  const circuitDisplayName = geoData?.name || fallbackCircuit.name;
  const officialMapImage =
    geoData?.official_map_sheet ||
    `/assets/circuit-maps/${(currentCircuitId || DEFAULT_CIRCUIT_ID).toLowerCase()}.jpg`;

  // Real-time FastF1 Telemetry state driving Driver 1 (🔴 Car 1 - VER #1)
  const [carTelemetry, setCarTelemetry] = useState<CarTelemetry>({
    x: 550,
    y: 514,
    angle: 0,
    speed: 285,
    gear: 7,
    brake: false,
    throttle: 100,
    distance: 0,
  });

  // Real-time Rival/Teammate Driver 2 (🔵 Car 2 - NOR #4)
  const [car2Telemetry, setCar2Telemetry] = useState<CarTelemetry>({
    x: 535,
    y: 522,
    angle: 0,
    speed: 282,
    gear: 7,
    brake: false,
    throttle: 98,
    distance: 0,
  });

  const geoDataRef = useRef<LoadedGeometry | null>(null);
  const trackPathRef = useRef<SVGPathElement | null>(null);
  const progressRef = useRef<number>(0.02);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const lastSyncStoreRef = useRef<number>(0);
  const speedRef = useRef<number>(telemetry.speed);
  const sectorRef = useRef<number>(telemetry.sector);
  const isRunningRef = useRef<boolean>(isRunning);

  useEffect(() => {
    geoDataRef.current = geoData;
  }, [geoData]);

  useEffect(() => {
    speedRef.current = telemetry.speed;
    sectorRef.current = telemetry.sector;
    isRunningRef.current = isRunning;
  }, [telemetry.speed, telemetry.sector, isRunning]);

  useEffect(() => {
    progressRef.current = 0.02;
  }, [currentCircuitId]);

  // FastF1 Telemetry Animation Loop: interpolates along authentic FastF1 empirical samples at 60 FPS
  useEffect(() => {
    let isMounted = true;
    lastTimeRef.current = performance.now();

    const animate = (currentTime: number) => {
      if (!isMounted) return;

      const dt = Math.min(0.08, Math.max(0.001, (currentTime - lastTimeRef.current) / 1000));
      lastTimeRef.current = currentTime;

      try {
        const samples = geoDataRef.current?.telemetry_samples;
        const isMoving = isRunningRef.current;

        if (samples && samples.length > 2) {
          const n = samples.length;

          // Driver 1 (VER #1) interpolation along authentic FastF1 track coordinates
          const p1 = progressRef.current;
          const sampleFloat1 = p1 * (n - 1);
          const i0 = Math.floor(sampleFloat1);
          const i1 = (i0 + 1) % n;
          const ratio1 = sampleFloat1 - i0;

          const s0 = samples[i0];
          const s1 = samples[i1];

          const curX1 = s0.x + (s1.x - s0.x) * ratio1;
          const curY1 = s0.y + (s1.y - s0.y) * ratio1;

          // Empirical FastF1 speed, throttle, gear, and braking curve
          const rawSpeed1 = s0.speed + (s1.speed - s0.speed) * ratio1;
          const t0 = s0.throttle ?? 95;
          const t1 = s1.throttle ?? 95;
          const rawThrottle1 = t0 + (t1 - t0) * ratio1;
          const rawGear1 = ratio1 > 0.5 ? s1.gear : s0.gear;
          const rawBrake1 = Boolean(s0.brake || s1.brake || (s0.speed - s1.speed > 8 && rawThrottle1 < 30));

          // Factor in dynamic weather grip and engine mode
          const currentStore = useRaceStore.getState();
          const rain = currentStore.targetRain || 0;
          const isWet = currentStore.telemetry.tire_compound === "WET";
          const gripPenalty = isWet ? (rain < 0.25 ? 0.08 : 0) : (rain * 0.45);
          const gripFactor = Math.max(0.50, 1.0 - gripPenalty);
          const modeMultiplier = currentStore.telemetry.engine_mode === "PUSH" ? 1.03 : 0.98;

          const curSpeed1 = isMoving ? Math.round(rawSpeed1 * gripFactor * modeMultiplier * 10) / 10 : 0;
          const curGear1 = isMoving ? (rawGear1 || Math.min(8, Math.max(1, Math.round(curSpeed1 / 42)))) : 0;
          const curBrake1 = isMoving ? rawBrake1 : true;
          const curThrottle1 = isMoving ? Math.round(rawThrottle1 * gripFactor) : 0;
          const curDist1 = Math.round(s0.distance + (s1.distance - s0.distance) * ratio1);
          const curRpm1 = isMoving ? Math.round(8800 + (curSpeed1 / (Math.max(1, curGear1) * 44)) * 5200) : 0;

          const dx1 = s1.x - s0.x;
          const dy1 = s1.y - s0.y;
          const angleDeg1 = (Math.atan2(dy1, dx1) * 180) / Math.PI;

          setCarTelemetry({
            x: curX1,
            y: curY1,
            angle: angleDeg1,
            speed: curSpeed1,
            gear: curGear1,
            brake: curBrake1,
            throttle: curThrottle1,
            distance: curDist1,
          });

          // Driver 2 (NOR #4 - Rival Chaser ~1.4s behind on track, or P2 grid slot when parked)
          const p2 = isMoving 
            ? ((p1 - 0.018 + 1.0) % 1.0)
            : 0.007; // P2 grid slot right behind pole position
          const sampleFloat2 = p2 * (n - 1);
          const j0 = Math.floor(sampleFloat2);
          const j1 = (j0 + 1) % n;
          const ratio2 = sampleFloat2 - j0;

          const c0 = samples[j0];
          const c1 = samples[j1];

          const curX2 = c0.x + (c1.x - c0.x) * ratio2;
          const curY2 = c0.y + (c1.y - c0.y) * ratio2;

          const rawSpeed2 = c0.speed + (c1.speed - c0.speed) * ratio2;
          const curSpeed2 = isMoving ? Math.round(Math.max(0, rawSpeed2 * gripFactor - 3) * 10) / 10 : 0;
          const curGear2 = isMoving ? (c0.gear || Math.min(8, Math.max(1, Math.round(curSpeed2 / 42)))) : 0;
          const curBrake2 = isMoving ? Boolean(c0.brake || c1.brake) : true;
          const curDist2 = Math.round(c0.distance + (c1.distance - c0.distance) * ratio2);

          const dx2 = c1.x - c0.x;
          const dy2 = c1.y - c0.y;
          const angleDeg2 = (Math.atan2(dy2, dx2) * 180) / Math.PI;

          setCar2Telemetry({
            x: curX2,
            y: curY2,
            angle: angleDeg2,
            speed: curSpeed2,
            gear: curGear2,
            brake: curBrake2,
            throttle: isMoving ? (curBrake2 ? 0 : 96) : 0,
            distance: curDist2,
          });

          // Advance car position proportionally to actual physical speed:
          // Speed (km/h) -> m/s = curSpeed / 3.6
          // Progress per second = (curSpeed_ms / trackLengthMeters) * dt * pacingScale
          if (isMoving) {
            const trackMeters = (effectiveLengthKm || 5.793) * 1000;
            const progressDelta = ((Math.max(45, curSpeed1) / 3.6) / trackMeters) * dt * 1.85;
            let nextProgress = progressRef.current + progressDelta;
            if (nextProgress >= 1.0) nextProgress -= 1.0;
            progressRef.current = nextProgress;
          }

          // Continuously sync high-precision FastF1 speed, RPM, gear, throttle, and brake to the dashboard
          if (isMoving && (currentTime - lastSyncStoreRef.current > 35)) {
            lastSyncStoreRef.current = currentTime;
            currentStore.syncTrackTelemetry({
              speed: curSpeed1,
              gear: curGear1,
              rpm: curRpm1,
              throttle: Math.round((curThrottle1 / 100) * 100) / 100,
              brake: curBrake1 ? 1.0 : 0.0,
              distance: curDist1,
              steering_angle: Math.round((angleDeg1 % 35) * 10) / 10
            });
          }
        } else {
          const path = trackPathRef.current || (document.getElementById("live-track-map-path") as SVGPathElement | null);
          if (path) {
            const pathLength = path.getTotalLength();
            if (pathLength > 0) {
              const currentDist = progressRef.current * pathLength;
              const pt = path.getPointAtLength(currentDist);
              const aheadDist = (currentDist + 2.0) % pathLength;
              const ptAhead = path.getPointAtLength(aheadDist);
              const angleDeg = (Math.atan2(ptAhead.y - pt.y, ptAhead.x - pt.x) * 180) / Math.PI;

              // Corner speed dynamic curve when samples are absent
              const cornerSharpness = Math.abs(angleDeg % 60);
              const fallbackSpeed = isMoving ? Math.round(315 - cornerSharpness * 2.2) : 0;
              const fallbackGear = isMoving ? Math.min(8, Math.max(2, Math.round(fallbackSpeed / 42))) : 0;

              setCarTelemetry({
                x: pt.x,
                y: pt.y,
                angle: angleDeg,
                speed: fallbackSpeed,
                gear: fallbackGear,
                brake: isMoving ? (cornerSharpness > 25) : true,
                throttle: isMoving ? (cornerSharpness > 25 ? 20 : 100) : 0,
                distance: Math.round((currentDist / pathLength) * (effectiveLengthKm || 5.7) * 1000),
              });

              // Car 2
              const p2 = isMoving ? ((progressRef.current - 0.018 + 1.0) % 1.0) : 0.007;
              const dist2 = p2 * pathLength;
              const pt2 = path.getPointAtLength(dist2);
              const aheadDist2 = (dist2 + 2.0) % pathLength;
              const ptAhead2 = path.getPointAtLength(aheadDist2);
              const angleDeg2 = (Math.atan2(ptAhead2.y - pt2.y, ptAhead2.x - pt2.x) * 180) / Math.PI;

              setCar2Telemetry({
                x: pt2.x,
                y: pt2.y,
                angle: angleDeg2,
                speed: isMoving ? Math.max(0, fallbackSpeed - 4) : 0,
                gear: fallbackGear,
                brake: isMoving ? (cornerSharpness > 25) : true,
                throttle: isMoving ? 95 : 0,
                distance: Math.round((dist2 / pathLength) * (effectiveLengthKm || 5.7) * 1000),
              });

              if (isMoving) {
                const trackMeters = (effectiveLengthKm || 5.793) * 1000;
                const progressDelta = ((Math.max(45, fallbackSpeed) / 3.6) / trackMeters) * dt * 1.85;
                let nextProgress = progressRef.current + progressDelta;
                if (nextProgress >= 1.0) nextProgress -= 1.0;
                progressRef.current = nextProgress;
              }
            }
          }
        }
      } catch (_) {}

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      isMounted = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [currentCircuitId, effectiveLengthKm, effectiveSvgPath, telemetry.gear, telemetry.brake, telemetry.throttle]);

  const getMarkerColor = () => {
    if (sessionFlag === "GREEN") return "#ff1e1e";
    if (sessionFlag === "YELLOW") return "#f59e0b";
    return "#3b82f6";
  };

  return (
    <GlassCard className="flex flex-col justify-between min-h-[550px] relative overflow-hidden">
      {/* 1. Header: Circuit Identity & View Switcher */}
      <div className="flex flex-wrap items-center justify-between border-b border-border-light dark:border-border-dark pb-3 gap-2 z-10">
        <div className="flex items-center space-x-2">
          <Map className="w-4 h-4 text-f1-red" />
          <span className="text-xs font-black uppercase font-telemetry tracking-wider">
            {circuitDisplayName} — TRACK MAP
          </span>
          {geoData?.data_source && (
            <span className="text-[9px] bg-cyan-400/10 text-cyan-400 border border-cyan-400/30 px-1.5 py-0.5 rounded font-telemetry font-bold tracking-wider hidden sm:inline">
              FastF1: {geoData.data_source}
            </span>
          )}
        </div>

        {/* View Mode Toggle: Live GPS vs Official FIA Map Sheet */}
        <div className="flex items-center space-x-1 bg-black/40 p-0.5 rounded-lg border border-border-dark text-[10px] font-telemetry">
          <button
            onClick={() => setViewMode("telemetry")}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded transition-colors ${
              viewMode === "telemetry" ? "bg-f1-red text-white font-bold" : "text-text-secondaryDark hover:text-white"
            }`}
          >
            <Navigation className="w-3 h-3" />
            <span>LIVE GPS</span>
          </button>
          <button
            onClick={() => setViewMode("sheet")}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded transition-colors ${
              viewMode === "sheet" ? "bg-cyan-500 text-black font-bold" : "text-text-secondaryDark hover:text-white"
            }`}
          >
            <ImageIcon className="w-3 h-3" />
            <span>OFFICIAL SHEET</span>
          </button>
        </div>
      </div>

      {/* 2. Main Track Display Area */}
      <div className="relative flex-grow flex items-center justify-center py-2 min-h-[420px]">
        {viewMode === "telemetry" ? (
          <>
            {/* Subtle background grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none" />

            <svg
              className="w-full h-full max-w-[680px] max-h-[450px]"
              viewBox={effectiveViewBox}
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                {/* Glowing filter */}
                <filter id="mapGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                {/* Car Beacon filter */}
                <filter id="carGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                {/* Checkered pattern for Start/Finish */}
                <pattern id="checkeredFlag" width="6" height="6" patternUnits="userSpaceOnUse">
                  <rect width="3" height="3" fill="#ffffff" />
                  <rect x="3" width="3" height="3" fill="#000000" />
                  <rect y="3" width="3" height="3" fill="#000000" />
                  <rect x="3" y="3" width="3" height="3" fill="#ffffff" />
                </pattern>
              </defs>

              {/* SECTOR WATERMARKS (as seen in the reference map) */}
              {(geoData?.sector_watermarks || [
                { label: "Sector 1", x: 130, y: 500 },
                { label: "Sector 2", x: 550, y: 140 },
                { label: "Sector 3", x: 880, y: 280 }
              ]).map((sm, idx) => (
                <text
                  key={idx}
                  x={sm.x}
                  y={sm.y}
                  fill="#71717a"
                  opacity="0.32"
                  fontSize="24"
                  fontWeight="900"
                  fontFamily="Inter, sans-serif"
                  letterSpacing="-0.02em"
                  className="select-none pointer-events-none"
                >
                  {sm.label}
                </text>
              ))}

              {/* 1. UNDERLAY TRACK STROKE (Clean grey track line) */}
              <path
                d={effectiveSvgPath}
                stroke="#4b5563"
                strokeWidth="10"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.85"
              />

              {/* 2. DRS ZONES HIGHLIGHTS (Bright cyan stripes along straights) */}
              {geoData?.drs_zones?.map((drs, idx) => (
                <g key={idx}>
                  {drs.svg_path_segment && (
                    <path
                      d={drs.svg_path_segment}
                      stroke="#06b6d4"
                      strokeWidth="11"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity="0.95"
                      filter="url(#mapGlow)"
                    />
                  )}
                </g>
              ))}

              {/* 3. MAIN CORE TRACK LINE */}
              <path
                ref={trackPathRef}
                id="live-track-map-path"
                d={effectiveSvgPath}
                stroke="#6b7280"
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* 4. DRS DETECTION ZONES */}
              {geoData?.drs_detection_zones?.map((ddz, idx) => (
                <g key={idx}>
                  <circle cx={ddz.x} cy={ddz.y} r="4.5" fill="#06b6d4" stroke="#ffffff" strokeWidth="1.5" />
                  <line
                    x1={ddz.x}
                    y1={ddz.y}
                    x2={ddz.label_x || ddz.x}
                    y2={(ddz.label_y || ddz.y - 18) + 8}
                    stroke="#06b6d4"
                    strokeWidth="0.8"
                    strokeDasharray="2 2"
                  />
                  <text
                    x={ddz.label_x || ddz.x}
                    y={ddz.label_y || ddz.y - 18}
                    fill="#22d3ee"
                    fontSize="8.5"
                    fontFamily="Share Tech Mono"
                    fontWeight="bold"
                    textAnchor="start"
                  >
                    {ddz.name}
                  </text>
                </g>
              ))}

              {/* 5. SPEED TRAP PIN */}
              {geoData?.speed_trap && (
                <g>
                  <circle cx={geoData.speed_trap.x} cy={geoData.speed_trap.y} r="4.5" fill="#ffffff" stroke="#1f2937" strokeWidth="2" />
                  <line
                    x1={geoData.speed_trap.x}
                    y1={geoData.speed_trap.y + 5}
                    x2={geoData.speed_trap.x}
                    y2={geoData.speed_trap.y + 20}
                    stroke="#9ca3af"
                    strokeWidth="0.8"
                  />
                  <text
                    x={geoData.speed_trap.x}
                    y={geoData.speed_trap.y + 28}
                    fill="#d1d5db"
                    fontSize="8.5"
                    fontFamily="Share Tech Mono"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {geoData.speed_trap.label}
                  </text>
                </g>
              )}

              {/* 6. START / FINISH CHECKERED LINE */}
              {effectiveSectorSplits?.s3 && (
                <g>
                  {/* Perpendicular checkered flag bar */}
                  <rect
                    x={effectiveSectorSplits.s3.x - 3}
                    y={effectiveSectorSplits.s3.y - 10}
                    width="6"
                    height="20"
                    fill="url(#checkeredFlag)"
                    stroke="#ffffff"
                    strokeWidth="0.8"
                  />
                  {/* Start directional indicator */}
                  <text
                    x={effectiveSectorSplits.s3.x - 14}
                    y={effectiveSectorSplits.s3.y - 14}
                    fill="#ffffff"
                    fontSize="9"
                    fontFamily="Share Tech Mono"
                    fontWeight="900"
                    letterSpacing="1px"
                  >
                    ◄ START
                  </text>
                </g>
              )}

              {/* 7. CORNER NUMBER BADGES & TELEMETRY PILLS (Exact style from reference map) */}
              {effectiveCorners?.map((c: any, idx: number) => {
                const cornerNumStr = c.number_str || `${c.number < 10 ? '0' : ''}${c.number}`;
                const hasMinSpeed = c.min_speed !== undefined;
                const minSpd = c.min_speed ?? 180;
                const gearNum = c.gear ?? (minSpd < 120 ? 3 : minSpd < 200 ? 5 : 7);

                // Offset for telemetry pill beside the corner
                const pillOffsetX = c.label_x ? c.label_x - c.x : 22;
                const pillOffsetY = c.label_y ? c.label_y - c.y : -6;
                const pillX = c.x + pillOffsetX;
                const pillY = c.y + pillOffsetY;

                return (
                  <g key={idx} className="transition-opacity hover:opacity-100">
                    {/* Corner Number Badge (Dark circle with white number) */}
                    <circle
                      cx={c.x}
                      cy={c.y}
                      r="9"
                      fill="#18181b"
                      stroke="#3f3f46"
                      strokeWidth="1.2"
                    />
                    <text
                      x={c.x}
                      y={c.y + 3.2}
                      fill="#ffffff"
                      fontSize="9"
                      fontFamily="Inter, sans-serif"
                      fontWeight="900"
                      textAnchor="middle"
                    >
                      {cornerNumStr}
                    </text>

                    {/* Minimum Corner Speed & Gear Selection Pill */}
                    {hasMinSpeed && (
                      <g transform={`translate(${pillX}, ${pillY})`}>
                        {/* Pill background */}
                        <rect
                          x="-2"
                          y="-10"
                          width="58"
                          height="16"
                          rx="4"
                          fill="#18181b"
                          fillOpacity="0.88"
                          stroke="#3f3f46"
                          strokeWidth="0.8"
                        />
                        {/* Speedometer Icon + Speed */}
                        <text
                          x="3"
                          y="1.5"
                          fill="#e4e4e7"
                          fontSize="8"
                          fontFamily="Share Tech Mono"
                          fontWeight="bold"
                        >
                          ☡{minSpd}
                        </text>
                        {/* Gear Icon + Gear */}
                        <text
                          x="36"
                          y="1.5"
                          fill="#22d3ee"
                          fontSize="8"
                          fontFamily="Share Tech Mono"
                          fontWeight="bold"
                        >
                          ⚙{gearNum}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* 7.5 DYNAMIC 🔵 RIVAL CAR BEACON (Car 2 - NOR #4) */}
              <g
                transform={`translate(${car2Telemetry.x}, ${car2Telemetry.y}) rotate(${car2Telemetry.angle})`}
                style={{ willChange: "transform" }}
              >
                {isRunning ? (
                  <circle cx={0} cy={0} r="14" fill="#06b6d4" opacity="0.25" className="animate-ping" />
                ) : (
                  <circle cx={0} cy={0} r="11" fill="#06b6d4" opacity="0.15" stroke="#06b6d4" strokeWidth="1" strokeDasharray="3 3" />
                )}
                <ellipse cx={-5} cy={0} rx="10" ry="4.5" fill="#06b6d4" opacity="0.4" />
                <path d="M 12 0 L 3 -4.5 L 5.5 0 L 3 4.5 Z" fill="#ffffff" />
                <circle
                  cx={0}
                  cy={0}
                  r="7"
                  fill="#06b6d4"
                  stroke="#ffffff"
                  strokeWidth="2"
                  filter="url(#carGlow)"
                />
                <circle cx={0} cy={0} r="2.5" fill="#ffffff" />
              </g>

              {/* FLOATING RIVAL CAR TELEMETRY HUD PILL */}
              <g
                transform={`translate(${car2Telemetry.x}, ${car2Telemetry.y - 20})`}
                className="pointer-events-none transition-all duration-75"
              >
                <rect
                  x="-38"
                  y="-10"
                  width="76"
                  height="16"
                  rx="4"
                  fill="#000000"
                  fillOpacity="0.88"
                  stroke={isRunning ? "#06b6d4" : "#06b6d4"}
                  strokeWidth="1"
                />
                <text
                  x="0"
                  y="1.5"
                  fill="#22d3ee"
                  fontSize="8"
                  fontFamily="Share Tech Mono"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {isRunning ? `NOR #4 • P2 • +1.4s` : "START GRID • P2"}
                </text>
              </g>

              {/* 8. DYNAMIC 🔴 LEAD CAR BEACON (Car 1 - VER #1) */}
              <g
                transform={`translate(${carTelemetry.x}, ${carTelemetry.y}) rotate(${carTelemetry.angle})`}
                style={{ willChange: "transform" }}
              >
                {isRunning ? (
                  <circle cx={0} cy={0} r="16" fill={getMarkerColor()} opacity="0.25" className="animate-ping" />
                ) : (
                  <circle cx={0} cy={0} r="13" fill="#eab308" opacity="0.15" stroke="#eab308" strokeWidth="1" strokeDasharray="3 3" />
                )}
                <ellipse cx={-6} cy={0} rx="11" ry="5" fill={getMarkerColor()} opacity="0.4" />
                <path d="M 13 0 L 3 -5 L 6 0 L 3 5 Z" fill="#ffffff" />
                <circle
                  cx={0}
                  cy={0}
                  r="7.5"
                  fill={getMarkerColor()}
                  stroke="#ffffff"
                  strokeWidth="2"
                  filter="url(#carGlow)"
                />
                <circle cx={0} cy={0} r="2.5" fill="#ffffff" />
              </g>

              {/* 9. FLOATING LEAD CAR TELEMETRY HUD PILL */}
              <g
                transform={`translate(${carTelemetry.x}, ${carTelemetry.y - 22})`}
                className="pointer-events-none transition-all duration-75"
              >
                <rect
                  x="-46"
                  y="-11"
                  width="92"
                  height="18"
                  rx="4"
                  fill="#000000"
                  fillOpacity="0.88"
                  stroke={isRunning ? (carTelemetry.brake ? "#ff1e1e" : "#22d3ee") : "#eab308"}
                  strokeWidth="1"
                />
                <text
                  x="0"
                  y="2"
                  fill="#ffffff"
                  fontSize="8.5"
                  fontFamily="Share Tech Mono"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {isRunning ? `VER #1 • ${carTelemetry.speed} KM/H • G${carTelemetry.gear}` : "START GRID • P1"}
                </text>
                {carTelemetry.brake && (
                  <circle cx="39" cy="-2" r="3" fill="#ff1e1e" className="animate-pulse" />
                )}
              </g>

              {/* 10. MAP LEGEND (Matching reference image bottom-left) */}
              <g transform="translate(24, 525)" className="select-none">
                <rect x="0" y="0" width="185" height="42" rx="4" fill="#09090b" fillOpacity="0.85" stroke="#27272a" strokeWidth="0.8" />
                <text x="8" y="16" fill="#a1a1aa" fontSize="8" fontFamily="Share Tech Mono" fontWeight="bold">
                  ☡ 180  MINIMUM CORNER SPEED (KM/H)
                </text>
                <text x="8" y="32" fill="#a1a1aa" fontSize="8" fontFamily="Share Tech Mono" fontWeight="bold">
                  ⚙ 5    GEAR SELECTION
                </text>
              </g>
            </svg>
          </>
        ) : (
          /* Official Circuit Sheet View: exact uploaded high-res image */
          <div className="relative w-full h-full flex flex-col items-center justify-center p-2">
            <div className="relative max-w-[660px] max-h-[420px] w-full h-full rounded-xl overflow-hidden border border-border-dark bg-black/60 flex items-center justify-center group shadow-2xl">
              <img
                src={officialMapImage}
                alt={`${circuitDisplayName} Official FIA Map`}
                className="max-w-full max-h-full object-contain p-2 filter contrast-105 drop-shadow-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/assets/circuit-maps/australia.jpg";
                }}
              />
              <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur border border-white/10 px-2 py-1 rounded text-[9px] font-telemetry text-text-secondaryDark flex items-center space-x-1.5">
                <span>FIA Official Sheet</span>
                <a
                  href="https://f1chronicle.com/formula-1-circuit-maps/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-400 hover:underline flex items-center"
                >
                  <ExternalLink className="w-2.5 h-2.5 ml-1" />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. FastF1 Live Telemetry Footer (X / Y / Speed / Gear / Brake) */}
      <div className="border-t border-border-light dark:border-border-dark pt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs font-telemetry uppercase text-text-secondaryDark gap-2 z-10">
        {/* Left: Circuit Geometry Metadata */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1">
            <Flag className="w-3.5 h-3.5 text-white" />
            <span>
              <strong className="text-white">S{telemetry.sector}</strong> • {effectiveLengthKm} KM
            </span>
          </div>

          <span className="text-[10px] text-text-secondaryDark border-l border-border-dark/60 pl-2">
            Turns: <strong className="text-white">{effectiveCorners?.length || 0}</strong>
          </span>

          {geoData?.fastest_driver && (
            <span className="text-[10px] text-text-secondaryDark border-l border-border-dark/60 pl-2 hidden md:inline">
              Fastest Lap: <strong className="text-cyan-400">{geoData.fastest_driver} ({geoData.fastest_lap_time})</strong>
            </span>
          )}
        </div>

        {/* Right: Live FastF1 Telemetry Readout */}
        <div className="flex items-center space-x-2 bg-black/50 px-2.5 py-1 rounded-lg border border-border-dark text-[11px]">
          <span className="text-[10px] text-text-secondaryDark font-mono">
            X:<strong className="text-white ml-0.5">{carTelemetry.x.toFixed(0)}</strong> Y:<strong className="text-white ml-0.5">{carTelemetry.y.toFixed(0)}</strong>
          </span>

          <span className="text-border-dark">•</span>

          <div className="flex items-center space-x-1">
            <Gauge className="w-3 h-3 text-cyan-400" />
            <span className="font-bold text-white">{isRunning ? `${carTelemetry.speed} KM/H` : "PARKED (0 KM/H)"}</span>
          </div>

          <span className="text-border-dark">•</span>

          <span className="bg-white/10 px-1.5 py-0.5 rounded font-black text-cyan-300 text-[10px]">
            {isRunning ? `G${carTelemetry.gear}` : "N"}
          </span>

          <span className="text-border-dark">•</span>

          {isRunning ? (
            carTelemetry.brake ? (
              <span className="flex items-center space-x-1 bg-red-500/20 text-red-400 border border-red-500/50 px-1.5 py-0.5 rounded font-bold animate-pulse text-[10px]">
                <Disc className="w-2.5 h-2.5" />
                <span>BRAKE</span>
              </span>
            ) : (
              <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold text-[10px]">
                THR {carTelemetry.throttle}%
              </span>
            )
          ) : (
            <span className="bg-amber-500/15 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded font-bold text-[10px]">
              READY TO RUN
            </span>
          )}
        </div>
      </div>
    </GlassCard>
  );
}
