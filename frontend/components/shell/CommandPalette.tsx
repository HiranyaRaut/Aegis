"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ACTIVE_CIRCUITS } from "../../store/circuits";
import { useRaceStore } from "../../store/useRaceStore";
import { 
  Search, 
  MapPin, 
  Gauge, 
  Layers, 
  Brain, 
  Database, 
  Settings, 
  Zap, 
  RotateCcw,
  X,
  Compass
} from "lucide-react";

interface CommandItem {
  id: string;
  title: string;
  category: "Navigation" | "Circuits" | "Tactical Actions";
  icon: React.ReactNode;
  hint?: string;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { 
    selectCircuit, 
    sendAction
  } = useRaceStore();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const navigationCommands: CommandItem[] = [
    {
      id: "nav-cockpit",
      title: "Live Telemetry Cockpit",
      category: "Navigation",
      icon: <Gauge className="w-4 h-4 text-f1-red" />,
      hint: "Main 3-column live HUD",
      action: () => router.push("/")
    },
    {
      id: "nav-circuits",
      title: "24-Circuit Paddock Explorer",
      category: "Navigation",
      icon: <Compass className="w-4 h-4 text-cyan-400" />,
      hint: "All 24 active F1 tracks",
      action: () => router.push("/circuits")
    },
    {
      id: "nav-strategy",
      title: "MCTS Strategy Workbench",
      category: "Navigation",
      icon: <Layers className="w-4 h-4 text-amber-400" />,
      hint: "What-If stint simulator",
      action: () => router.push("/strategy")
    },
    {
      id: "nav-driver",
      title: "HDM Driver Neuro-Biometrics",
      category: "Navigation",
      icon: <Brain className="w-4 h-4 text-emerald-400" />,
      hint: "Fatigue & cognitive analytics",
      action: () => router.push("/driver")
    },
    {
      id: "nav-ledger",
      title: "Cryptographic Telemetry Ledger",
      category: "Navigation",
      icon: <Database className="w-4 h-4 text-purple-400" />,
      hint: "SHA-256 block explorer",
      action: () => router.push("/ledger")
    },
    {
      id: "nav-settings",
      title: "Mission Control Settings",
      category: "Navigation",
      icon: <Settings className="w-4 h-4 text-neutral-400" />,
      hint: "Telemetry rate & audio",
      action: () => router.push("/settings")
    }
  ];

  const actionCommands: CommandItem[] = [
    {
      id: "act-push",
      title: "Engine Mode: PUSH (Overtake Delta)",
      category: "Tactical Actions",
      icon: <Zap className="w-4 h-4 text-amber-400" />,
      hint: "High RPM & maximum ERS deployment",
      action: () => sendAction("toggle_engine_mode", { mode: "PUSH" })
    },
    {
      id: "act-conserve",
      title: "Engine Mode: CONSERVE (Fuel/Tire Save)",
      category: "Tactical Actions",
      icon: <Zap className="w-4 h-4 text-emerald-400" />,
      hint: "Thermal management pacing",
      action: () => sendAction("toggle_engine_mode", { mode: "CONSERVE" })
    },
    {
      id: "act-box",
      title: "Confirm Pit Strategy: BOX THIS LAP",
      category: "Tactical Actions",
      icon: <RotateCcw className="w-4 h-4 text-f1-red" />,
      hint: "Trigger pit lane ingress flag",
      action: () => sendAction("trigger_pit_stop", { compound: "HARD" })
    }
  ];

  const circuitCommands: CommandItem[] = ACTIVE_CIRCUITS.map((c) => ({
    id: `circuit-${c.id}`,
    title: `${c.flag} ${c.gpName} (${c.name})`,
    category: "Circuits",
    icon: <MapPin className="w-4 h-4 text-red-400" />,
    hint: `${c.lengthKm} km · ${c.totalLaps} Laps`,
    action: () => {
      selectCircuit(c.id);
      router.push(`/?circuit=${c.id}`);
    }
  }));

  const allCommands = [...navigationCommands, ...actionCommands, ...circuitCommands];

  const filtered = allCommands.filter((cmd) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      cmd.title.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q) ||
      (cmd.hint && cmd.hint.toLowerCase().includes(q))
    );
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
        onClose();
      }
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-[#0c0c10] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col font-mono"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="flex items-center px-4 py-3.5 border-b border-neutral-800/80 bg-[#111116]">
          <Search className="w-5 h-5 text-neutral-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command, circuit name, or workspace (e.g. Suzuka, Strategy, Push)..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent text-sm text-white placeholder-neutral-500 focus:outline-none"
          />
          <button 
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded-md hover:bg-neutral-800/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Command List */}
        <div className="max-h-[380px] overflow-y-auto p-2 space-y-1 scrollbar-thin">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-neutral-500">
              No matching commands or circuits found for &quot;{query}&quot;
            </div>
          ) : (
            filtered.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={cmd.id}
                  onClick={() => {
                    cmd.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all ${
                    isSelected 
                      ? "bg-red-500/15 border border-red-500/30 text-white" 
                      : "text-neutral-300 hover:bg-neutral-800/40 border border-transparent"
                  }`}
                >
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <div className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 shrink-0">
                      {cmd.icon}
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-bold text-white truncate">
                        {cmd.title}
                      </div>
                      {cmd.hint && (
                        <div className="text-[10px] text-neutral-400 truncate">
                          {cmd.hint}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800/80 shrink-0 ml-2">
                    {cmd.category}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-[#09090c] border-t border-neutral-800/60 flex items-center justify-between text-[11px] text-neutral-500">
          <div className="flex items-center space-x-3">
            <span><kbd className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 text-[10px]">↑</kbd> <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 text-[10px]">↓</kbd> Navigate</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 text-[10px]">↵</kbd> Select</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 text-[10px]">ESC</kbd> Close</span>
          </div>
          <span className="text-neutral-400 font-bold">AEGIS COMMAND MATRIX</span>
        </div>
      </div>
    </div>
  );
}
