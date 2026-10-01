"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ACTIVE_CIRCUITS, Circuit } from "../../store/circuits";
import { useRaceStore } from "../../store/useRaceStore";
import { 
  Search, 
  MapPin, 
  Flag, 
  Clock, 
  Gauge, 
  ArrowRight, 
  CheckCircle2, 
  Activity,
  Compass,
  Layers,
  X,
  Eye
} from "lucide-react";

type RegionFilter = "ALL" | "EUROPE" | "AMERICAS" | "ASIA_PACIFIC" | "MIDDLE_EAST";

export function CircuitExplorer() {
  const router = useRouter();
  const { currentCircuitId, selectCircuit, season } = useRaceStore();
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState<RegionFilter>("ALL");
  const [selectedCircuitModal, setSelectedCircuitModal] = useState<Circuit | null>(null);
  const [manifestMap, setManifestMap] = useState<Record<string, any>>({});

  React.useEffect(() => {
    const currentSeason = season || "2025";
    fetch(`/data/circuits/${currentSeason}/circuits_manifest.json`)
      .then((res) => {
        if (!res.ok) throw new Error("Current season manifest missing");
        return res.json();
      })
      .then((data: any[]) => {
        const map: Record<string, any> = {};
        if (Array.isArray(data)) {
          data.forEach((item) => {
            map[item.id] = item;
          });
        }
        setManifestMap(map);
      })
      .catch(() => {
        fetch("/data/circuits/2026/circuits_manifest.json")
          .then((res) => res.json())
          .then((data: any[]) => {
            const map: Record<string, any> = {};
            if (Array.isArray(data)) {
              data.forEach((item) => {
                map[item.id] = item;
              });
            }
            setManifestMap(map);
          })
          .catch(() => {
            fetch(`http://127.0.0.1:8000/circuits/manifest?season=${currentSeason}`)
              .then((res) => res.json())
              .then((data: any[]) => {
                const map: Record<string, any> = {};
                if (Array.isArray(data)) {
                  data.forEach((item) => {
                    map[item.id] = item;
                  });
                }
                setManifestMap(map);
              })
              .catch(() => {});
          });
      });
  }, [season]);

  // Region categorizer based on country
  const getRegion = (country: string): RegionFilter => {
    switch (country) {
      case "Great Britain":
      case "Italy":
      case "Belgium":
      case "Monaco":
      case "Austria":
      case "Spain":
      case "Hungary":
      case "Netherlands":
      case "Azerbaijan":
        return "EUROPE";
      case "USA":
      case "Canada":
      case "Mexico":
      case "Brazil":
        return "AMERICAS";
      case "Japan":
      case "Australia":
      case "China":
      case "Singapore":
        return "ASIA_PACIFIC";
      case "Bahrain":
      case "Saudi Arabia":
      case "Qatar":
      case "UAE":
        return "MIDDLE_EAST";
      default:
        return "EUROPE";
    }
  };

  const filteredCircuits = ACTIVE_CIRCUITS.filter((c) => {
    const matchesSearch = 
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.gpName.toLowerCase().includes(search.toLowerCase()) ||
      c.country.toLowerCase().includes(search.toLowerCase()) ||
      c.characteristics.toLowerCase().includes(search.toLowerCase());

    const matchesRegion = 
      regionFilter === "ALL" || getRegion(c.country) === regionFilter;

    return matchesSearch && matchesRegion;
  });

  const handleDeployCircuit = (circuitId: string) => {
    selectCircuit(circuitId);
    router.push(`/?circuit=${circuitId}`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto font-mono space-y-6">
      
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-800/80">
        <div>
          <div className="flex items-center space-x-2 text-red-500 text-xs font-bold uppercase tracking-widest mb-1">
            <Compass className="w-4 h-4" />
            <span>2026 World Championship Calendar</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white uppercase">
            Formula 1 Circuit Paddock
          </h1>
          <p className="text-xs text-neutral-400 font-sans mt-1">
            Complete telemetric registry of all 24 official Grand Prix venues with real-world track models, sector splits, and pit deltas.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Search venue, country, layout..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#111116] border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500/60"
          />
        </div>
      </div>

      {/* Region Filter Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: "ALL", label: "All Circuits (24)" },
          { id: "EUROPE", label: "Europe (10)" },
          { id: "AMERICAS", label: "Americas (6)" },
          { id: "ASIA_PACIFIC", label: "Asia-Pacific (4)" },
          { id: "MIDDLE_EAST", label: "Middle East (4)" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setRegionFilter(tab.id as RegionFilter)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              regionFilter === tab.id
                ? "bg-red-500/20 text-red-400 border border-red-500/40 shadow-lg shadow-red-500/10"
                : "bg-[#111115] text-neutral-400 hover:text-white border border-neutral-800/80"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 24 Circuits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCircuits.map((circuit) => {
          const isActive = circuit.id === currentCircuitId;

          return (
            <div
              key={circuit.id}
              className={`group bg-[#0c0c10] border rounded-2xl p-4 flex flex-col justify-between transition-all hover:border-neutral-700 relative overflow-hidden ${
                isActive ? "border-red-500/50 bg-gradient-to-b from-red-950/10 to-[#0c0c10]" : "border-neutral-800/80"
              }`}
            >
              {/* Top Meta */}
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2.5">
                    <span className="text-2xl leading-none">{circuit.flag}</span>
                    <div>
                      <h3 className="text-sm font-bold text-white leading-snug group-hover:text-red-400 transition-colors">
                        {circuit.gpName}
                      </h3>
                      <span className="text-[11px] text-neutral-500 block truncate max-w-[200px]">
                        {circuit.name}
                      </span>
                    </div>
                  </div>

                  {isActive ? (
                    <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 text-[10px] font-bold shrink-0">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>ACTIVE</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-neutral-500 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800 shrink-0">
                      {circuit.flagCode}
                    </span>
                  )}
                </div>

                {/* SVG Track Silhouette */}
                <div className="h-32 w-full bg-[#111116] rounded-xl p-2.5 flex items-center justify-center relative overflow-hidden border border-neutral-800/60 mb-3.5">
                  <svg 
                    className="w-full h-full max-h-28 text-neutral-400" 
                    viewBox={circuit.viewBox} 
                    fill="none"
                  >
                    <path
                      d={circuit.svgPath}
                      stroke={isActive ? "#ff1e1e" : "#52525b"}
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* Start/Finish check mark */}
                    <circle
                      cx={circuit.sectorSplitPoints.s1.x}
                      cy={circuit.sectorSplitPoints.s1.y}
                      r="4"
                      fill="#22c55e"
                    />
                  </svg>
                  <span className="absolute bottom-2 right-2.5 text-[9px] text-neutral-500 uppercase tracking-wider font-mono">
                    {circuit.lengthKm} KM
                  </span>
                </div>

                {/* Track Specifications */}
                <div className="grid grid-cols-3 gap-2 py-2 border-t border-b border-neutral-800/60 text-center text-xs mb-3">
                  <div>
                    <span className="text-[9px] text-neutral-500 block uppercase">Laps</span>
                    <span className="font-bold text-neutral-200">{circuit.totalLaps}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-neutral-500 block uppercase">Pit Delta</span>
                    <span className="font-bold text-neutral-200">{circuit.pitLaneDelta}s</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-neutral-500 block uppercase">Base Lap</span>
                    <span className="font-bold text-emerald-400">
                      {(circuit.sectorBest[0] + circuit.sectorBest[1] + circuit.sectorBest[2]).toFixed(1)}s
                    </span>
                  </div>
                </div>

                {manifestMap[circuit.id]?.data_source && (
                  <div className="flex items-center justify-between text-[9px] font-mono text-cyan-400 bg-cyan-950/20 border border-cyan-500/20 px-2 py-1 rounded mb-2.5">
                    <span className="truncate">FastF1: {manifestMap[circuit.id].data_source}</span>
                    {manifestMap[circuit.id].fastest_lap && (
                      <span className="text-white font-bold shrink-0 ml-1">{manifestMap[circuit.id].fastest_lap}</span>
                    )}
                  </div>
                )}

                <p className="text-[11px] text-neutral-400 line-clamp-2 mb-4 font-sans leading-relaxed">
                  {circuit.characteristics}
                </p>
              </div>

              {/* Action Button */}
              <div className="flex items-center space-x-2 pt-2 border-t border-neutral-800/60">
                <button
                  onClick={() => setSelectedCircuitModal(circuit)}
                  className="flex-1 flex items-center justify-center space-x-1.5 py-2 rounded-xl bg-[#131318] hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-bold transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-neutral-400" />
                  <span>INSPECT</span>
                </button>
                {isActive ? (
                  <button
                    onClick={() => router.push("/")}
                    className="flex-1 flex items-center justify-center space-x-1.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors"
                  >
                    <span>COCKPIT</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleDeployCircuit(circuit.id)}
                    className="flex-1 flex items-center justify-center space-x-1.5 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-400 hover:text-red-300 text-xs font-bold transition-colors"
                  >
                    <span>DEPLOY</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Circuit Detail Inspection Modal */}
      {selectedCircuitModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setSelectedCircuitModal(null)}
        >
          <div 
            className="bg-[#0e0e13] border border-neutral-700/80 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-neutral-800">
              <div className="flex items-center space-x-3">
                <span className="text-3xl">{selectedCircuitModal.flag}</span>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-xl font-black text-white uppercase tracking-tight">
                      {selectedCircuitModal.gpName}
                    </h2>
                    <span className="text-xs font-mono text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                      {selectedCircuitModal.flagCode}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 font-sans mt-0.5">
                    {selectedCircuitModal.name} · {selectedCircuitModal.country}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCircuitModal(null)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Track SVG Enlarged Silhouette */}
            <div className="my-4 h-48 w-full bg-[#131319] rounded-xl p-4 flex items-center justify-center relative border border-neutral-800">
              <svg 
                className="w-full h-full max-h-44 text-neutral-400" 
                viewBox={selectedCircuitModal.viewBox} 
                fill="none"
              >
                <path
                  d={selectedCircuitModal.svgPath}
                  stroke={selectedCircuitModal.id === currentCircuitId ? "#ff1e1e" : "#e4e4e7"}
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Sector splits */}
                <circle cx={selectedCircuitModal.sectorSplitPoints.s1.x} cy={selectedCircuitModal.sectorSplitPoints.s1.y} r="5" fill="#22c55e" />
                <circle cx={selectedCircuitModal.sectorSplitPoints.s2.x} cy={selectedCircuitModal.sectorSplitPoints.s2.y} r="5" fill="#eab308" />
                <circle cx={selectedCircuitModal.sectorSplitPoints.s3.x} cy={selectedCircuitModal.sectorSplitPoints.s3.y} r="5" fill="#ef4444" />
                {/* Corner markers */}
                {selectedCircuitModal.cornerMarkers.map((cm, idx) => (
                  <g key={idx}>
                    <circle cx={cm.x} cy={cm.y} r="3" fill="#60a5fa" />
                    <text x={cm.x + 5} y={cm.y + 3} fontSize="8" fill="#93c5fd" fontFamily="monospace">
                      {cm.name}
                    </text>
                  </g>
                ))}
              </svg>
              <div className="absolute top-2.5 right-3 flex items-center space-x-2 text-[10px] font-mono text-neutral-400">
                <span className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span><span>S1</span></span>
                <span className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-yellow-500 inline-block"></span><span>S2</span></span>
                <span className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span><span>S3</span></span>
              </div>
            </div>

            {/* Spec Stats Grid */}
            <div className="grid grid-cols-4 gap-3 py-3 border-t border-b border-neutral-800 text-center text-xs mb-4">
              <div className="bg-[#121217] p-2 rounded-lg border border-neutral-800/80">
                <span className="text-[10px] text-neutral-400 block uppercase">Length</span>
                <span className="font-bold text-white">{selectedCircuitModal.lengthKm} KM</span>
              </div>
              <div className="bg-[#121217] p-2 rounded-lg border border-neutral-800/80">
                <span className="text-[10px] text-neutral-400 block uppercase">Laps</span>
                <span className="font-bold text-white">{selectedCircuitModal.totalLaps}</span>
              </div>
              <div className="bg-[#121217] p-2 rounded-lg border border-neutral-800/80">
                <span className="text-[10px] text-neutral-400 block uppercase">Pit Loss</span>
                <span className="font-bold text-white">{selectedCircuitModal.pitLaneDelta}s</span>
              </div>
              <div className="bg-[#121217] p-2 rounded-lg border border-neutral-800/80">
                <span className="text-[10px] text-neutral-400 block uppercase">Base Pace</span>
                <span className="font-bold text-emerald-400">
                  {(selectedCircuitModal.sectorBest[0] + selectedCircuitModal.sectorBest[1] + selectedCircuitModal.sectorBest[2]).toFixed(1)}s
                </span>
              </div>
            </div>

            {/* Sector Times */}
            <div className="flex items-center justify-between text-xs font-mono bg-[#111116] border border-neutral-800 px-3 py-2 rounded-xl mb-4">
              <span className="text-neutral-400 text-[11px]">Sector Bests:</span>
              <div className="flex space-x-4">
                <span>S1: <strong className="text-emerald-400">{selectedCircuitModal.sectorBest[0].toFixed(3)}s</strong></span>
                <span>S2: <strong className="text-emerald-400">{selectedCircuitModal.sectorBest[1].toFixed(3)}s</strong></span>
                <span>S3: <strong className="text-emerald-400">{selectedCircuitModal.sectorBest[2].toFixed(3)}s</strong></span>
              </div>
            </div>

            {/* Key Corners */}
            {selectedCircuitModal.keyCorners?.length > 0 && (
              <div className="mb-4">
                <span className="text-[11px] text-neutral-400 font-bold uppercase block mb-1.5">Key Corners:</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedCircuitModal.keyCorners.map((corner, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-md bg-neutral-800/80 border border-neutral-700/60 text-[11px] text-neutral-300 font-mono">
                      {corner}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Characteristics */}
            <p className="text-xs text-neutral-300 font-sans leading-relaxed mb-6">
              {selectedCircuitModal.characteristics}
            </p>

            {/* Actions */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSelectedCircuitModal(null)}
                className="flex-1 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-bold transition-colors"
              >
                CLOSE
              </button>
              <button
                onClick={() => {
                  handleDeployCircuit(selectedCircuitModal.id);
                  setSelectedCircuitModal(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center justify-center space-x-2 transition-colors shadow-lg shadow-red-600/30"
              >
                <span>DEPLOY TO LIVE COCKPIT</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
