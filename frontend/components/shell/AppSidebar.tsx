"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRaceStore } from "../../store/useRaceStore";
import { getCircuitById } from "../../store/circuits";
import { 
  Gauge, 
  Compass, 
  Layers, 
  Brain, 
  Database, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Command,
  Activity,
  ShieldCheck
} from "lucide-react";

interface AppSidebarProps {
  onOpenCommandPalette: () => void;
  collapsed: boolean;
  setCollapsed: (val: boolean) => void;
}

export function AppSidebar({ onOpenCommandPalette, collapsed, setCollapsed }: AppSidebarProps) {
  const pathname = usePathname();
  const { currentCircuitId, telemetry, sessionFlag, isRunning } = useRaceStore();
  const currentCircuit = getCircuitById(currentCircuitId);

  // Keyboard shortcut Ctrl+B or Cmd+B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setCollapsed(!collapsed);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [collapsed, setCollapsed]);

  const navItems = [
    {
      label: "Live Cockpit",
      href: "/",
      icon: Gauge,
      description: "Mission Control HUD",
      badge: isRunning ? "SIM ACTIVE" : "STANDBY",
      badgeColor: isRunning ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" : "text-neutral-500 bg-neutral-800"
    },
    {
      label: "24-Circuit Paddock",
      href: "/circuits",
      icon: Compass,
      description: "F1 World Calendar",
      badge: "24 GP",
      badgeColor: "text-red-400 bg-red-500/10 border-red-500/30"
    },
    {
      label: "Strategy Workbench",
      href: "/strategy",
      icon: Layers,
      description: "MCTS Stint Simulator",
      badge: "MCTS",
      badgeColor: "text-amber-400 bg-amber-500/10 border-amber-500/30"
    },
    {
      label: "Driver HDM Center",
      href: "/driver",
      icon: Brain,
      description: "Cognitive Biometrics",
      badge: `${Math.round(telemetry.fatigue * 100)}% FAT`,
      badgeColor: telemetry.fatigue > 0.4 ? "text-red-400 bg-red-500/10 border-red-500/30" : "text-cyan-400 bg-cyan-500/10 border-cyan-500/30"
    },
    {
      label: "Cryptographic Ledger",
      href: "/ledger",
      icon: Database,
      description: "SHA-256 Audit Trail",
      badge: "VERIFIED",
      badgeColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
    },
    {
      label: "System Settings",
      href: "/settings",
      icon: Settings,
      description: "Telemetry & Audio",
      badge: undefined,
      badgeColor: undefined
    }
  ];

  return (
    <aside 
      className={`relative z-40 flex flex-col justify-between border-r border-neutral-800/80 bg-[#070709] transition-all duration-300 select-none ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Top Brand & Workspace Selector */}
      <div>
        <div className="flex items-center justify-between h-14 px-3.5 border-b border-neutral-800/80">
          {!collapsed ? (
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-lg bg-red-600 flex items-center justify-center font-black text-white text-xs tracking-tighter shadow-lg shadow-red-600/30">
                Ω
              </div>
              <div>
                <span className="text-sm font-black tracking-widest text-white uppercase leading-none block">AEGIS</span>
                <span className="text-[9px] text-neutral-500 font-mono tracking-wider block">ENTERPRISE F1 OS</span>
              </div>
            </div>
          ) : (
            <div className="w-full flex justify-center">
              <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center font-black text-white text-xs shadow-lg shadow-red-600/30">
                Ω
              </div>
            </div>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`p-1 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800/60 transition-colors ${
              collapsed ? "hidden" : "block"
            }`}
            title="Collapse Sidebar (Ctrl+B)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Command Trigger */}
        <div className="p-2.5">
          <button
            onClick={onOpenCommandPalette}
            className={`w-full flex items-center justify-between rounded-xl bg-[#111116] hover:bg-[#181820] border border-neutral-800/80 hover:border-neutral-700 text-neutral-400 hover:text-white transition-all text-xs font-mono ${
              collapsed ? "p-2 justify-center" : "px-3 py-2"
            }`}
            title="Open Command Palette (Ctrl+K)"
          >
            <div className="flex items-center space-x-2">
              <Command className="w-3.5 h-3.5 text-neutral-400" />
              {!collapsed && <span className="text-xs">Quick Command</span>}
            </div>
            {!collapsed && (
              <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700 font-mono">
                ⌘K
              </kbd>
            )}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="px-2 space-y-1 mt-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center rounded-xl transition-all ${
                  collapsed ? "justify-center p-2.5" : "px-3 py-2.5 space-x-3"
                } ${
                  isActive
                    ? "bg-red-500/15 text-red-400 border border-red-500/30 font-bold"
                    : "text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200 border border-transparent"
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-red-500" : "text-neutral-400"}`} />
                {!collapsed && (
                  <div className="flex-grow flex items-center justify-between overflow-hidden">
                    <div className="truncate">
                      <div className="text-xs font-medium truncate leading-tight text-white">{item.label}</div>
                      <div className="text-[10px] text-neutral-500 truncate font-mono">{item.description}</div>
                    </div>
                    {item.badge && (
                      <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border ml-1 shrink-0 ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Collapsed Toggle & Active Circuit Pill */}
      <div className="p-2 border-t border-neutral-800/80 bg-[#0a0a0d]">
        {collapsed ? (
          <div className="flex flex-col items-center space-y-2 py-1">
            <button
              onClick={() => setCollapsed(false)}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              title="Expand Sidebar (Ctrl+B)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="text-base" title={`${currentCircuit.gpName} (Lap ${telemetry.lap}/${currentCircuit.totalLaps})`}>
              {currentCircuit.flag}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Active Track Mini Summary */}
            <div className="p-2.5 rounded-xl bg-[#121217] border border-neutral-800">
              <div className="flex items-center justify-between mb-1 text-[10px] text-neutral-400 font-mono">
                <span className="uppercase tracking-wider">Active Venue</span>
                <span className={`font-bold uppercase ${sessionFlag === "GREEN" ? "text-emerald-400" : "text-amber-400"}`}>
                  {sessionFlag} FLAG
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-lg leading-none">{currentCircuit.flag}</span>
                <div className="truncate">
                  <div className="text-xs font-bold text-white truncate">{currentCircuit.gpName}</div>
                  <div className="text-[10px] text-neutral-400 font-mono">
                    Lap {telemetry.lap} / {currentCircuit.totalLaps} · S{telemetry.sector}
                  </div>
                </div>
              </div>
            </div>

            {/* Application Footer Meta */}
            <div className="flex items-center justify-between px-1 text-[10px] text-neutral-500 font-mono">
              <span className="flex items-center">
                <Activity className="w-3 h-3 text-emerald-400 mr-1 animate-pulse" />
                TELEMETRY SYNC
              </span>
              <span>v1.0.4</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
