"use client";

import React, { useState } from "react";
import { useRaceStore } from "../../store/useRaceStore";
import { getCircuitById } from "../../store/circuits";
import { 
  Layers, 
  Cpu, 
  Zap, 
  TrendingDown, 
  AlertTriangle, 
  ShieldAlert, 
  Play, 
  RotateCcw,
  Sparkles,
  ArrowRight
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from "recharts";

export function StrategyWorkbench() {
  const { 
    currentCircuitId, 
    telemetry, 
    mctsStrategy, 
    sendAction 
  } = useRaceStore();
  const currentCircuit = getCircuitById(currentCircuitId);

  const [safetyCarLap, setSafetyCarLap] = useState(24);
  const [targetCompound, setTargetCompound] = useState<"SOFT" | "MEDIUM" | "HARD">("HARD");

  // Simulated 35-lap tire degradation curves based on compound physics
  const degradationData = Array.from({ length: 35 }, (_, i) => {
    const lap = i + 1;
    // Soft: High initial speed, rapid exponential cliff after lap 14
    const softDelta = lap < 12 ? (lap * 0.08) : (lap * 0.08 + Math.pow((lap - 12), 1.7) * 0.15);
    // Medium: Balanced linear wear, gradual cliff after lap 22
    const medDelta = lap < 20 ? (lap * 0.05 + 0.3) : (lap * 0.05 + 0.3 + Math.pow((lap - 20), 1.5) * 0.12);
    // Hard: Slower warmup, ultra-stable lifespan up to lap 32
    const hardDelta = lap < 6 ? (1.0 - lap * 0.08) : (0.55 + lap * 0.035);

    return {
      lap,
      SOFT: parseFloat(softDelta.toFixed(2)),
      MEDIUM: parseFloat(medDelta.toFixed(2)),
      HARD: parseFloat(hardDelta.toFixed(2)),
    };
  });

  // What-If SC Delta Calculation
  const normalPitDelta = currentCircuit.pitLaneDelta;
  const scPitDelta = parseFloat((currentCircuit.pitLaneDelta * 0.55).toFixed(1));
  const timeSavedUnderSC = parseFloat((normalPitDelta - scPitDelta).toFixed(1));

  return (
    <div className="p-6 max-w-7xl mx-auto font-mono space-y-6">
      
      {/* Top Header Banner */}
      <div className="pb-6 border-b border-neutral-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-widest mb-1">
            <Cpu className="w-4 h-4" />
            <span>Autonomous Decision Engine</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white uppercase">
            MCTS Strategy Workbench &amp; What-If Lab
          </h1>
          <p className="text-xs text-neutral-400 font-sans mt-1">
            Simulate probabilistic tire wear cliffs, pit stop time deltas, and Safety Car deployment windows for {currentCircuit.name}.
          </p>
        </div>

        {/* Tactical Quick Action */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => sendAction("trigger_pit_stop", { compound: targetCompound })}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-lg shadow-red-600/20"
          >
            <span>BOX THIS LAP ({targetCompound})</span>
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Grid: 2 Primary Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Active Stint Optimization Card */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-[#0c0c10] border border-neutral-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                MCTS Recommendation
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                {mctsStrategy ? `${Math.round(mctsStrategy.win_probability * 100)}% CONFIDENCE` : "92% CONFIDENCE"}
              </span>
            </div>

            {/* Recommendation Hero */}
            <div className="p-4 rounded-xl bg-[#111116] border border-neutral-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-neutral-500 uppercase tracking-widest block">Action</span>
                <span className="text-xl font-black text-emerald-400 tracking-wider">
                  {mctsStrategy?.recommended_action || "STAY OUT"}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-neutral-500 uppercase tracking-widest block">Optimal Window</span>
                <span className="text-base font-bold text-white">
                  {mctsStrategy ? `L${mctsStrategy.pit_window_start} - L${mctsStrategy.pit_window_end}` : "LAP 22 - 26"}
                </span>
              </div>
            </div>

            {/* Target Compound Selector */}
            <div>
              <label className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-2">
                Planned Stint 2 Compound
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["SOFT", "MEDIUM", "HARD"] as const).map((comp) => (
                  <button
                    key={comp}
                    onClick={() => setTargetCompound(comp)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      targetCompound === comp
                        ? comp === "SOFT"
                          ? "bg-red-500/20 text-red-400 border-red-500/50"
                          : comp === "MEDIUM"
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                          : "bg-neutral-200/20 text-white border-neutral-300"
                        : "bg-[#131318] text-neutral-400 border-neutral-800 hover:border-neutral-700"
                    }`}
                  >
                    {comp}
                  </button>
                ))}
              </div>
            </div>

            {/* Predicted Strategy Sequence */}
            <div className="p-3.5 rounded-xl bg-[#131319] border border-neutral-800/80 space-y-2 text-xs">
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider block font-bold">
                Optimal Multi-Stint Plan
              </span>
              <div className="font-mono text-neutral-300 text-xs leading-relaxed">
                {mctsStrategy?.strategy_string || `MEDIUM (Laps 1-24) → ${targetCompound} (Laps 25-${currentCircuit.totalLaps})`}
              </div>
              <div className="flex justify-between items-center text-[10px] text-neutral-500 pt-1 border-t border-neutral-800">
                <span>Calculated Pit Delta:</span>
                <span className="text-neutral-300 font-bold">+{currentCircuit.pitLaneDelta}s</span>
              </div>
            </div>

            {/* Push / Conserve Engine Delta */}
            <div className="p-3.5 rounded-xl bg-[#131319] border border-neutral-800/80 space-y-2">
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider block font-bold">
                Engine Pace Delta Mode
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => sendAction("toggle_engine_mode", { mode: "PUSH" })}
                  className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-center space-x-1.5 ${
                    telemetry.engine_mode === "PUSH"
                      ? "bg-red-500/20 text-red-400 border-red-500/40"
                      : "bg-[#111116] text-neutral-400 border-neutral-800"
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>PUSH MODE</span>
                </button>
                <button
                  onClick={() => sendAction("toggle_engine_mode", { mode: "CONSERVE" })}
                  className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-center space-x-1.5 ${
                    telemetry.engine_mode === "CONSERVE"
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                      : "bg-[#111116] text-neutral-400 border-neutral-800"
                  }`}
                >
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>CONSERVE</span>
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Right: Compound Degradation Simulator & What-If SC */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Chart 1: Degradation Curves */}
          <div className="bg-[#0c0c10] border border-neutral-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Pirelli Tire Compound Degradation Curves
                </h3>
                <p className="text-[11px] text-neutral-400 font-sans">
                  Lap time delta penalty (+seconds/lap) accumulated over stint lifespan at {currentCircuit.name}.
                </p>
              </div>
              <span className="text-[10px] text-neutral-500 font-mono">35-LAP HORIZON</span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={degradationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis dataKey="lap" stroke="#666" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#666" tick={{ fontSize: 10 }} domain={[0, 4.5]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#111116", borderColor: "#333", borderRadius: 8, fontSize: 11 }}
                    labelFormatter={(val) => `Stint Lap ${val}`}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="SOFT" stroke="#ef4444" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="MEDIUM" stroke="#f59e0b" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="HARD" stroke="#e2e8f0" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* What-If Safety Car Simulator */}
          <div className="bg-[#0c0c10] border border-neutral-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Safety Car &amp; VSC Tactical Ingress Delta
                </h3>
              </div>
              <span className="text-[10px] text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                WHAT-IF SIMULATOR
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-[#111116] border border-neutral-800 rounded-xl">
                <span className="text-[10px] text-neutral-500 uppercase block">Green Flag Pit Delta</span>
                <span className="text-lg font-bold text-white block mt-0.5">+{normalPitDelta}s</span>
              </div>
              <div className="p-3 bg-[#111116] border border-neutral-800 rounded-xl">
                <span className="text-[10px] text-neutral-500 uppercase block">Safety Car Pit Delta</span>
                <span className="text-lg font-bold text-amber-400 block mt-0.5">+{scPitDelta}s</span>
              </div>
              <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-xl">
                <span className="text-[10px] text-emerald-400 uppercase block">Net Cheap Stop Delta</span>
                <span className="text-lg font-bold text-emerald-400 block mt-0.5">-{timeSavedUnderSC}s GAIN</span>
              </div>
            </div>

            {/* Slider to test SC Lap */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs text-neutral-400">
                <span>Simulated Safety Car Incident Lap:</span>
                <span className="text-white font-bold">Lap {safetyCarLap} / {currentCircuit.totalLaps}</span>
              </div>
              <input
                type="range"
                min="1"
                max={currentCircuit.totalLaps}
                value={safetyCarLap}
                onChange={(e) => setSafetyCarLap(parseInt(e.target.value))}
                className="w-full accent-amber-400 bg-neutral-800 h-1.5 rounded-lg cursor-pointer"
              />
              <p className="text-[10px] text-neutral-500">
                If Race Control declares a Safety Car on Lap {safetyCarLap}, boxing saves {timeSavedUnderSC} seconds relative to green-flag pit stops, preventing undercut risks.
              </p>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
