import React, { useEffect } from "react";
import { useRaceStore } from "@/store/useRaceStore";
import { AlertTriangle, X } from "lucide-react";

export function DriverMistakeAlert() {
  const { driverMistake, dismissMistake } = useRaceStore();

  useEffect(() => {
    if (driverMistake?.active) {
      const timer = setTimeout(() => {
        dismissMistake();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [driverMistake, dismissMistake]);

  if (!driverMistake?.active) return null;

  return (
    <div className="fixed top-20 right-6 z-50 animate-bounce-short">
      <div className="bg-red-950/90 border-2 border-f1-red text-white px-4 py-3 rounded-xl shadow-[0_0_20px_rgba(255,30,30,0.5)] backdrop-blur-md flex items-start space-x-3 max-w-md">
        <AlertTriangle className="w-5 h-5 text-f1-red shrink-0 mt-0.5 animate-pulse" />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black font-telemetry uppercase tracking-wider text-f1-red">
              HDM DRIVER INSTABILITY EVENT
            </span>
            <button 
              onClick={dismissMistake}
              className="text-text-secondaryDark hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs font-telemetry text-neutral-200 mt-1">
            {driverMistake.description}
          </p>
          <span className="text-[9px] text-text-secondaryDark uppercase font-telemetry block mt-1.5">
            Biometric Link: HRP Cognitive Penalty Surge Active
          </span>
        </div>
      </div>
    </div>
  );
}
