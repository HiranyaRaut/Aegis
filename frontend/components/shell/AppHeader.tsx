"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useRaceStore, ViewportMode } from "../../store/useRaceStore";
import { ACTIVE_CIRCUITS, getCircuitById } from "../../store/circuits";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Command, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  Radio, 
  ShieldCheck,
  ChevronRight,
  Zap,
  ChevronDown,
  Search,
  CloudRain,
  Compass
} from "lucide-react";

interface AppHeaderProps {
  onOpenCommandPalette: () => void;
}

export function AppHeader({ onOpenCommandPalette }: AppHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { 
    currentCircuitId, 
    selectCircuit,
    telemetry, 
    isRunning, 
    sessionFlag, 
    connectionStatus, 
    blockchainVerified,
    sendAction,
    viewportMode,
    setViewportMode,
    isWeatherAuto,
    targetRain,
    setTargetRain
  } = useRaceStore();
  
  const currentCircuit = getCircuitById(currentCircuitId);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);

  // Dropdown states
  const [circuitDropdownOpen, setCircuitDropdownOpen] = useState(false);
  const [circuitSearch, setCircuitSearch] = useState("");
  const [weatherDropdownOpen, setWeatherDropdownOpen] = useState(false);

  const circuitRef = useRef<HTMLDivElement>(null);
  const weatherRef = useRef<HTMLDivElement>(null);

  // Click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (circuitRef.current && !circuitRef.current.contains(event.target as Node)) {
        setCircuitDropdownOpen(false);
      }
      if (weatherRef.current && !weatherRef.current.contains(event.target as Node)) {
        setWeatherDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCircuits = ACTIVE_CIRCUITS.filter(c => 
    c.gpName.toLowerCase().includes(circuitSearch.toLowerCase()) ||
    c.name.toLowerCase().includes(circuitSearch.toLowerCase()) ||
    c.country.toLowerCase().includes(circuitSearch.toLowerCase())
  );

  // Toggle native browser fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    }
  };

  const getPageTitle = (path: string) => {
    switch (path) {
      case "/circuits": return "24-Circuit Paddock Explorer";
      case "/strategy": return "MCTS Strategy Workbench";
      case "/driver": return "Driver HDM & Neuro-Biometrics";
      case "/ledger": return "Cryptographic Telemetry Ledger";
      case "/settings": return "Mission Control Preferences";
      case "/":
      default:
        return "Live Mission Control Cockpit";
    }
  };

  const handleToggleSimulation = () => {
    sendAction("toggle_sim_state");
  };

  const handleResetSimulation = () => {
    sendAction("reset_sim_state");
  };

  const handleToggleEngineMode = () => {
    const nextMode = telemetry.engine_mode === "PUSH" ? "CONSERVE" : "PUSH";
    sendAction("toggle_engine_mode", { mode: nextMode });
  };

  const handleModeChange = (mode: ViewportMode) => {
    setViewportMode(mode);
    if (pathname !== "/") {
      router.push("/");
    }
  };

  const handleWeatherSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setTargetRain(val);
    sendAction("force_weather", { value: val });
  };

  return (
    <header className="h-14 border-b border-neutral-800/80 bg-[#09090c] px-3.5 flex items-center justify-between font-mono select-none z-30 shrink-0">
      
      {/* Left: Breadcrumb Navigation & Interactive Circuit Selector */}
      <div className="flex items-center space-x-2 text-xs">
        <span className="text-neutral-500 font-bold tracking-wider uppercase hidden sm:inline-block">AEGIS</span>
        <ChevronRight className="w-3.5 h-3.5 text-neutral-600 hidden sm:inline-block" />
        <span className="text-white font-bold tracking-wide hidden md:inline-block">{getPageTitle(pathname)}</span>
        
        {/* Interactive Active Circuit Selector Dropdown */}
        <div className="relative ml-1 sm:ml-2" ref={circuitRef}>
          <button
            onClick={() => setCircuitDropdownOpen(!circuitDropdownOpen)}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-[#14141a] hover:bg-[#1c1c24] border border-neutral-800 hover:border-neutral-700 text-[11px] text-neutral-300 transition-colors shadow-sm"
            title="Click to Switch F1 Circuit Venue (All 24 Available)"
          >
            <span className="text-sm leading-none">{currentCircuit.flag}</span>
            <span className="font-bold text-white uppercase">{currentCircuit.gpName}</span>
            <span className="text-neutral-500">·</span>
            <span className="text-red-400 font-bold">L{telemetry.lap}/{currentCircuit.totalLaps}</span>
            <ChevronDown className={`w-3 h-3 text-neutral-400 transition-transform duration-200 ${circuitDropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {circuitDropdownOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-80 max-h-[440px] bg-[#0d0d12]/98 border border-neutral-800 rounded-xl shadow-2xl py-2 z-50 backdrop-blur-lg flex flex-col">
              <div className="px-3 pb-2 border-b border-neutral-800/80">
                <div className="flex items-center justify-between text-[10px] text-neutral-400 uppercase tracking-widest font-bold mb-1.5">
                  <span>Grand Prix Calendar (2025)</span>
                  <span className="text-red-400 font-mono font-black">{filteredCircuits.length} / 24 VENUES</span>
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
              </div>

              <div className="pt-2 px-3 border-t border-neutral-800/80">
                <button
                  onClick={() => {
                    setCircuitDropdownOpen(false);
                    router.push("/circuits");
                  }}
                  className="w-full py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-[11px] font-bold text-neutral-300 hover:text-white transition-colors flex items-center justify-center space-x-1"
                >
                  <Compass className="w-3.5 h-3.5 text-red-400" />
                  <span>Open Full 24-Circuit Paddock Explorer</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Center / Right: Mission Controls & Quick Telemetry Instruments */}
      <div className="flex items-center space-x-2 sm:space-x-2.5">

        {/* Viewport Mode Selector Dropdown */}
        <div className="flex items-center space-x-1.5 bg-[#121217] border border-neutral-800 px-2 py-1 rounded-lg text-xs">
          <span className="text-[9px] text-neutral-500 uppercase tracking-wider hidden lg:inline">Mode:</span>
          <select
            value={viewportMode}
            onChange={(e) => handleModeChange(e.target.value as ViewportMode)}
            className="bg-transparent border-0 text-xs font-black text-red-500 focus:outline-none focus:ring-0 cursor-pointer uppercase font-mono"
            title="Switch Dashboard Presentation Mode"
          >
            <option value="professional" className="bg-[#111] text-white">Professional Cockpit</option>
            <option value="cinematic" className="bg-[#111] text-white">Cinematic Landing</option>
            <option value="minimal" className="bg-[#111] text-white">Minimal Telemetry</option>
            <option value="research" className="bg-[#111] text-white">Research & HDM</option>
          </select>
        </div>

        {/* Weather Injector Quick Popover */}
        <div className="relative" ref={weatherRef}>
          <button
            onClick={() => setWeatherDropdownOpen(!weatherDropdownOpen)}
            className={`flex items-center space-x-1 px-2 py-1 rounded-lg border text-xs font-bold transition-all ${
              (telemetry.weather?.rain_intensity ?? 0) > 0.1 || targetRain > 0.1
                ? "bg-blue-500/20 text-blue-400 border-blue-500/40"
                : "bg-[#121217] text-neutral-300 border-neutral-800 hover:border-neutral-700"
            }`}
            title="Weather Conditions & Dynamic Rain Injection"
          >
            <CloudRain className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[10px] uppercase tracking-wider hidden sm:inline">
              {isWeatherAuto 
                ? `${Math.round((telemetry.weather?.rain_intensity ?? 0) * 100)}% RAIN` 
                : `${Math.round(targetRain * 100)}% FORCED`}
            </span>
          </button>

          {weatherDropdownOpen && (
            <div className="absolute top-full right-0 mt-1.5 w-64 bg-[#0d0d12]/98 border border-neutral-800 rounded-xl shadow-2xl p-3 z-50 backdrop-blur-lg font-mono">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800/80 mb-2.5">
                <span className="text-[10px] text-neutral-400 uppercase font-bold flex items-center">
                  <CloudRain className="w-3 h-3 text-blue-400 mr-1" />
                  Dynamic Weather Engine
                </span>
                <button
                  onClick={() => {
                    if (isWeatherAuto) {
                      sendAction("force_weather", { value: targetRain || 0.3 });
                    } else {
                      sendAction("auto_weather");
                    }
                  }}
                  className={`text-[9px] font-black px-1.5 py-0.5 rounded border uppercase transition-colors ${
                    isWeatherAuto 
                      ? "bg-blue-500/20 text-blue-400 border-blue-500/40" 
                      : "bg-white/10 text-white border-white/20 hover:bg-white/20"
                  }`}
                >
                  {isWeatherAuto ? "AUTO" : "MANUAL"}
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-neutral-400">Track Wetness:</span>
                  <span className="text-blue-400">
                    {isWeatherAuto 
                      ? `${Math.round((telemetry.weather?.rain_intensity ?? 0) * 100)}% (Natural)` 
                      : `${Math.round(targetRain * 100)}% (Forced)`}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={isWeatherAuto ? (telemetry.weather?.rain_intensity ?? 0) : targetRain}
                  onChange={handleWeatherSlider}
                  className="w-full accent-blue-500 bg-neutral-800 h-1.5 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-neutral-500 font-sans">
                  <span>Dry (Slicks)</span>
                  <span>Inter (0.3)</span>
                  <span>Wet (0.7+)</span>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Play/Pause & Reset Quick Sim Controls */}
        <div className="flex items-center space-x-1 bg-[#121217] p-1 rounded-lg border border-neutral-800">
          <button
            onClick={handleToggleSimulation}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-bold transition-all ${
              isRunning
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
            }`}
            title={isRunning ? "Pause Simulation" : "Start Live Simulation"}
          >
            {isRunning ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span className="text-[10px] uppercase tracking-wider">{isRunning ? "PAUSE" : "RUN"}</span>
          </button>

          <button
            onClick={handleResetSimulation}
            className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            title="Reset Race Simulation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Engine Mode Quick Switcher */}
        <button
          onClick={handleToggleEngineMode}
          className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold transition-all ${
            telemetry.engine_mode === "PUSH"
              ? "bg-red-500/20 text-red-400 border-red-500/40"
              : "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
          }`}
          title="Click to toggle Engine Mode (PUSH / CONSERVE)"
        >
          <Zap className="w-3.5 h-3.5 fill-current" />
          <span className="text-[10px] tracking-wider">{telemetry.engine_mode}</span>
        </button>

        {/* Live Network Sync Badge */}
        <div className="hidden xl:flex items-center space-x-1.5 px-2 py-1 rounded-lg bg-[#111116] border border-neutral-800 text-[10px] text-neutral-400">
          <div className={`w-2 h-2 rounded-full ${connectionStatus === "connected" ? "bg-emerald-400 animate-ping" : "bg-red-500"}`} />
          <span>{connectionStatus === "connected" ? "LIVE WS" : "OFFLINE"}</span>
          <span className="text-neutral-500">|</span>
          <span className="text-neutral-300 font-bold">18ms</span>
        </div>

        {/* Command Palette Trigger */}
        <button
          onClick={onOpenCommandPalette}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-white bg-[#111116] hover:bg-[#1a1a22] border border-neutral-800 transition-colors"
          title="Command Palette (Ctrl+K / Cmd+K)"
        >
          <Command className="w-4 h-4" />
        </button>

        {/* Audio Alerts Toggle */}
        <button
          onClick={() => setAudioEnabled(!audioEnabled)}
          className={`p-1.5 rounded-lg border transition-colors ${
            audioEnabled
              ? "text-neutral-300 bg-[#111116] border-neutral-800 hover:text-white"
              : "text-neutral-500 bg-neutral-900 border-neutral-800/60"
          }`}
          title={audioEnabled ? "Mute Telemetry Audio" : "Unmute Telemetry Audio"}
        >
          {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-neutral-600" />}
        </button>

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-white bg-[#111116] hover:bg-[#1a1a22] border border-neutral-800 transition-colors hidden sm:block"
          title="Toggle Native Fullscreen (F11)"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

      </div>
    </header>
  );
}

