import React from "react";
import { useRaceStore } from "@/store/useRaceStore";
import { Trophy, Flag, RotateCcw, X, Clock, Zap } from "lucide-react";

export function RaceCompletionModal() {
  const { isRaceCompleted, raceSummary, telemetry, dismissRaceSummary, sendAction } = useRaceStore();

  if (!isRaceCompleted) return null;

  const totalTimeStr = telemetry?.elapsed_time
    ? `${Math.floor(telemetry.elapsed_time / 60)}:${String(Math.floor(telemetry.elapsed_time % 60)).padStart(2, "0")}.${Math.floor((telemetry.elapsed_time % 1) * 1000)}`
    : "01:24:32.410";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-[#0c0c0c] border-2 border-f1-red/80 rounded-2xl max-w-lg w-full p-6 shadow-[0_0_40px_rgba(255,30,30,0.3)] relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-f1-red/20 rounded-full blur-3xl pointer-events-none" />

        <button 
          onClick={dismissRaceSummary}
          className="absolute top-4 right-4 text-text-secondaryDark hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-f1-red/20 border border-f1-red text-f1-red mb-3 shadow-[0_0_15px_rgba(255,30,30,0.4)]">
            <Trophy className="w-7 h-7 animate-bounce" />
          </div>

          <div className="flex items-center justify-center space-x-2 text-xs font-black font-telemetry tracking-widest text-emerald-400 uppercase">
            <Flag className="w-3.5 h-3.5" />
            <span>CHEQUERED FLAG DEPLOYED</span>
          </div>

          <h2 className="text-2xl font-black font-telemetry uppercase tracking-tight text-white mt-1">
            GRAND PRIX COMPLETED
          </h2>
          <p className="text-xs text-text-secondaryDark font-telemetry mt-0.5">
            Silverstone Circuit — 50 / 50 Laps Official Finish
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 my-6 text-left">
          <div className="p-3 rounded-lg bg-neutral-900/80 border border-border-light dark:border-border-dark">
            <div className="flex items-center space-x-1.5 text-text-secondaryDark text-[10px] uppercase font-telemetry">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span>Total Elapsed Time</span>
            </div>
            <div className="text-lg font-black font-telemetry text-white mt-1">
              {raceSummary?.total_elapsed_time || totalTimeStr}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-neutral-900/80 border border-border-light dark:border-border-dark">
            <div className="flex items-center space-x-1.5 text-text-secondaryDark text-[10px] uppercase font-telemetry">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Final Tyre Compound</span>
            </div>
            <div className="text-lg font-black font-telemetry text-amber-400 mt-1">
              {telemetry?.tire_compound || "HARD"}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-neutral-900/80 border border-border-light dark:border-border-dark">
            <div className="flex items-center space-x-1.5 text-text-secondaryDark text-[10px] uppercase font-telemetry">
              <span>Driver Cognitive Efficacy</span>
            </div>
            <div className="text-lg font-black font-telemetry text-emerald-400 mt-1">
              {Math.round((telemetry?.cognitive_efficiency || 0.85) * 100)}%
            </div>
          </div>

          <div className="p-3 rounded-lg bg-neutral-900/80 border border-border-light dark:border-border-dark">
            <div className="flex items-center space-x-1.5 text-text-secondaryDark text-[10px] uppercase font-telemetry">
              <span>Audit Ledger Blocks</span>
            </div>
            <div className="text-lg font-black font-telemetry text-white mt-1">
              {raceSummary?.audit_blocks || 150} SECURED
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={() => {
              sendAction("reset_simulation");
              dismissRaceSummary();
            }}
            className="flex-1 py-2.5 px-4 rounded-lg bg-f1-red hover:bg-f1-red/90 text-white text-xs font-black font-telemetry uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-all shadow-[0_0_12px_rgba(255,30,30,0.4)]"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset & Race Again</span>
          </button>

          <button
            onClick={dismissRaceSummary}
            className="py-2.5 px-4 rounded-lg border border-border-light dark:border-border-dark hover:bg-white/5 text-text-secondaryDark hover:text-white text-xs font-black font-telemetry uppercase tracking-wider transition-all"
          >
            Review Telemetry
          </button>
        </div>
      </div>
    </div>
  );
}
