"use client";

import React, { useState } from "react";
import { useRaceStore } from "../../store/useRaceStore";
import { 
  Settings, 
  Wifi, 
  Volume2, 
  Sliders, 
  ShieldCheck, 
  RotateCcw, 
  Check, 
  Radio,
  Server,
  Zap
} from "lucide-react";

export function SettingsCenter() {
  const { connectionStatus, sendAction } = useRaceStore();
  
  const [telemetryRate, setTelemetryRate] = useState("150");
  const [soundRadio, setSoundRadio] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [apiUrl, setApiUrl] = useState(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000");
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto font-mono space-y-6">
      
      {/* Header */}
      <div className="pb-6 border-b border-neutral-800/80">
        <div className="flex items-center space-x-2 text-neutral-400 text-xs font-bold uppercase tracking-widest mb-1">
          <Settings className="w-4 h-4" />
          <span>Application Preferences</span>
        </div>
        <h1 className="text-2xl font-black tracking-tight text-white uppercase">
          Mission Control Settings &amp; Diagnostics
        </h1>
        <p className="text-xs text-neutral-400 font-sans mt-1">
          Configure telemetry update cadence, audio synthesizer alerts, and backend WebSocket endpoints.
        </p>
      </div>

      {/* Settings Sections */}
      <div className="space-y-4">
        
        {/* Section 1: Telemetry Stream Cadence */}
        <div className="bg-[#0c0c10] border border-neutral-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center space-x-2 border-b border-neutral-800/80 pb-3">
            <Sliders className="w-4 h-4 text-red-500" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Telemetry Pacing Engine
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: "100", label: "Ultra High (100ms)", desc: "10 Hz telemetry polling" },
              { id: "150", label: "Nominal (150ms)", desc: "Balanced performance (Default)" },
              { id: "300", label: "Battery Saver (300ms)", desc: "Reduced CPU utilization" },
            ].map((rate) => (
              <button
                key={rate.id}
                onClick={() => setTelemetryRate(rate.id)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  telemetryRate === rate.id
                    ? "bg-red-500/15 border-red-500/40 text-white"
                    : "bg-[#111116] border-neutral-800 text-neutral-400 hover:border-neutral-700"
                }`}
              >
                <div className="text-xs font-bold text-white">{rate.label}</div>
                <div className="text-[10px] text-neutral-500 mt-1 font-sans">{rate.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Section 2: Audio Radio Synthesis */}
        <div className="bg-[#0c0c10] border border-neutral-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center space-x-2 border-b border-neutral-800/80 pb-3">
            <Volume2 className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Acoustic Synthesizer Alerts
            </h3>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 rounded-xl bg-[#111116] border border-neutral-800 cursor-pointer">
              <div>
                <span className="text-xs font-bold text-white block">AI Race Engineer Radio Bleeps</span>
                <span className="text-[10px] text-neutral-500 font-sans">Radio mic click sounds when pit wall transmits</span>
              </div>
              <input 
                type="checkbox" 
                checked={soundRadio} 
                onChange={(e) => setSoundRadio(e.target.checked)}
                className="w-4 h-4 accent-red-500 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-[#111116] border border-neutral-800 cursor-pointer">
              <div>
                <span className="text-xs font-bold text-white block">Critical Driver Instability Siren</span>
                <span className="text-[10px] text-neutral-500 font-sans">Audible notification on HRP risk peaks and yellow flags</span>
              </div>
              <input 
                type="checkbox" 
                checked={soundAlerts} 
                onChange={(e) => setSoundAlerts(e.target.checked)}
                className="w-4 h-4 accent-red-500 cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Section 3: Connection Endpoint */}
        <div className="bg-[#0c0c10] border border-neutral-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center space-x-2 border-b border-neutral-800/80 pb-3">
            <Server className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Backend Service Cluster
            </h3>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] text-neutral-400 uppercase tracking-wider block">
              FastAPI Telemetry API Host
            </label>
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              className="w-full bg-[#111116] border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500/60"
            />
            <div className="flex items-center space-x-2 pt-1">
              <span className={`w-2 h-2 rounded-full ${connectionStatus === "connected" ? "bg-emerald-400" : "bg-red-500"}`} />
              <span className="text-[11px] text-neutral-400">
                Current status: <strong className="text-white uppercase">{connectionStatus}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => sendAction("reset_sim_state")}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#14141a] hover:bg-neutral-800 text-neutral-400 hover:text-white text-xs font-bold transition-colors border border-neutral-800"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>RESET SESSION CACHE</span>
          </button>

          <button
            onClick={handleSave}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-lg shadow-red-600/20"
          >
            {savedSuccess ? <Check className="w-4 h-4 text-white" /> : null}
            <span>{savedSuccess ? "PREFERENCES SAVED" : "SAVE PREFERENCES"}</span>
          </button>
        </div>

      </div>

    </div>
  );
}
