"use client";

import React from "react";
import { useRaceStore } from "../../store/useRaceStore";
import { 
  Brain, 
  Activity, 
  AlertCircle, 
  Heart, 
  Zap, 
  TrendingUp, 
  ShieldAlert, 
  Clock,
  Eye,
  Crosshair
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar
} from "recharts";

export function DriverBiometricsCenter() {
  const { telemetry, driverAnalytics } = useRaceStore();

  // Synthetic trend data if driverAnalytics has few records
  const trendData = driverAnalytics.length > 0 
    ? driverAnalytics.map((d) => ({
        lap: `L${d.lap}`,
        fatigue: Math.round(d.fatigue * 100),
        stress: Math.round(d.stress * 100),
        hrp: Math.round(d.hrp * 100),
        efficiency: Math.round(d.efficiency * 100)
      }))
    : Array.from({ length: 12 }, (_, i) => ({
        lap: `L${i + 1}`,
        fatigue: Math.round(10 + i * 2.1 + (Math.sin(i) * 3)),
        stress: Math.round(18 + i * 1.5 + (Math.cos(i) * 4)),
        hrp: Math.round(7 + i * 1.2),
        efficiency: Math.max(60, Math.round(98 - i * 1.8))
      }));

  const reactionDelayMs = Math.round(telemetry.reaction_delay * 1000);
  const fatiguePct = Math.round(telemetry.fatigue * 100);
  const stressPct = Math.round(telemetry.stress * 100);
  const hrpPct = Math.round(telemetry.hrp_score * 100);
  const focusPct = Math.round(telemetry.focus_level * 100);

  return (
    <div className="p-6 max-w-7xl mx-auto font-mono space-y-6">
      
      {/* Top Header Banner */}
      <div className="pb-6 border-b border-neutral-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-1">
            <Brain className="w-4 h-4" />
            <span>Human Driver Model (HDM) Telematics</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white uppercase">
            Driver Neuro-Biometrics &amp; Risk Analytics
          </h1>
          <p className="text-xs text-neutral-400 font-sans mt-1">
            Real-time biometric monitoring of cognitive attention, neuromuscular reaction delay, and Human Risk Penalty (HRP) score.
          </p>
        </div>

        {/* Biometric Link Status */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
          <Activity className="w-4 h-4 animate-pulse" />
          <span>NEURO-TELEMETRY SYNCED</span>
        </div>
      </div>

      {/* 4 Hero KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Focus Capacity */}
        <div className="bg-[#0c0c10] border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs uppercase tracking-wider">Cognitive Focus</span>
            <Eye className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <span className="text-3xl font-black text-white">{focusPct}%</span>
            <div className="w-full bg-neutral-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-cyan-400 h-full rounded-full transition-all duration-300" style={{ width: `${focusPct}%` }} />
            </div>
          </div>
          <span className="text-[10px] text-neutral-500 mt-2 font-sans">Attention stability within nominal bounds</span>
        </div>

        {/* Card 2: Fatigue Accumulation */}
        <div className="bg-[#0c0c10] border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs uppercase tracking-wider">Fatigue Index</span>
            <Heart className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <span className="text-3xl font-black text-white">{fatiguePct}%</span>
            <div className="w-full bg-neutral-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${fatiguePct > 45 ? "bg-amber-400" : "bg-emerald-400"}`} 
                style={{ width: `${fatiguePct}%` }} 
              />
            </div>
          </div>
          <span className="text-[10px] text-neutral-500 mt-2 font-sans">Neuromuscular stamina reservoir</span>
        </div>

        {/* Card 3: Braking Reaction Delay */}
        <div className="bg-[#0c0c10] border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs uppercase tracking-wider">Reaction Latency</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <span className="text-3xl font-black text-white">{reactionDelayMs} <span className="text-sm font-normal text-neutral-500">ms</span></span>
            <div className="w-full bg-neutral-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${reactionDelayMs > 240 ? "bg-red-500" : "bg-amber-400"}`} 
                style={{ width: `${Math.min(100, (reactionDelayMs / 300) * 100)}%` }} 
              />
            </div>
          </div>
          <span className="text-[10px] text-neutral-500 mt-2 font-sans">Delta relative to 180ms baseline</span>
        </div>

        {/* Card 4: Human Risk Penalty (HRP) */}
        <div className="bg-[#0c0c10] border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs uppercase tracking-wider">HRP Risk Score</span>
            <ShieldAlert className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <span className="text-3xl font-black text-red-400">{hrpPct}%</span>
            <div className="w-full bg-neutral-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-red-500 h-full rounded-full transition-all duration-300" style={{ width: `${hrpPct}%` }} />
            </div>
          </div>
          <span className="text-[10px] text-neutral-500 mt-2 font-sans">Driver error probability weight</span>
        </div>

      </div>

      {/* Primary Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Chart: Cognitive Fatigue & Stress Progression */}
        <div className="lg:col-span-8 bg-[#0c0c10] border border-neutral-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Multi-Lap Cognitive Stress &amp; Fatigue Timeline
              </h3>
              <p className="text-[11px] text-neutral-400 font-sans">
                Correlating cognitive exhaustion with high G-force cornering sectors and tire wear slip.
              </p>
            </div>
            <span className="text-[10px] text-neutral-500 font-mono">LIVE STINT</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="fatigueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="stressGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="lap" stroke="#666" tick={{ fontSize: 10 }} />
                <YAxis stroke="#666" tick={{ fontSize: 10 }} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: "#111116", borderColor: "#333", borderRadius: 8, fontSize: 11 }} />
                <Area type="monotone" dataKey="fatigue" stroke="#10b981" fillOpacity={1} fill="url(#fatigueGrad)" strokeWidth={2} name="Fatigue %" />
                <Area type="monotone" dataKey="stress" stroke="#f59e0b" fillOpacity={1} fill="url(#stressGrad)" strokeWidth={2} name="Stress %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Chart: HRP Penalty Bar Chart */}
        <div className="lg:col-span-4 bg-[#0c0c10] border border-neutral-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                HRP Error Probability
              </h3>
              <p className="text-[11px] text-neutral-400 font-sans">
                Human Risk Penalty model score per lap.
              </p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="lap" stroke="#666" tick={{ fontSize: 10 }} />
                <YAxis stroke="#666" tick={{ fontSize: 10 }} domain={[0, 30]} />
                <Tooltip contentStyle={{ backgroundColor: "#111116", borderColor: "#333", borderRadius: 8, fontSize: 11 }} />
                <Bar dataKey="hrp" fill="#ef4444" radius={[4, 4, 0, 0]} name="HRP Risk %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}
