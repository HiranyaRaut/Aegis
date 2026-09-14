"use client";

import React, { useState, useEffect } from "react";
import { useRaceWebSocket } from "../../hooks/useRaceWebSocket";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { CommandPalette } from "./CommandPalette";
import { DriverMistakeAlert } from "../telemetry/DriverMistakeAlert";
import { RaceCompletionModal } from "../dashboard/RaceCompletionModal";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  // Persistent WebSocket Telemetry Stream active across all routes
  useRaceWebSocket();

  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      if (p.get("cmd") === "open") {
        setCommandPaletteOpen(true);
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#050507] text-white font-sans">
      {/* 1. Collapsible Tactical Sidebar Dock */}
      <AppSidebar 
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

      {/* 2. Main Mission Control Content Stage */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        {/* Top Application Header */}
        <AppHeader 
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        />

        {/* Dynamic Route Workspace Viewport */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-[#07070a] relative scrollbar-thin">
          {children}
        </main>
      </div>

      {/* 3. Global Modal Overlays */}
      <CommandPalette 
        isOpen={commandPaletteOpen} 
        onClose={() => setCommandPaletteOpen(false)} 
      />
      <DriverMistakeAlert />
      <RaceCompletionModal />
    </div>
  );
}
