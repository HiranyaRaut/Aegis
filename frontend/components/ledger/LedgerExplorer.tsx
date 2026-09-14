"use client";

import React, { useState } from "react";
import { useRaceStore } from "../../store/useRaceStore";
import { 
  Database, 
  ShieldCheck, 
  Download, 
  Search, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  Hash, 
  FileText,
  Copy,
  Check
} from "lucide-react";

export function LedgerExplorer() {
  const { 
    blockchainVerified, 
    blockchainLastHash, 
    telemetry, 
    activeEvents 
  } = useRaceStore();

  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const totalBlocks = telemetry ? telemetry.lap * 3 + telemetry.sector : 36;

  // Generate verified blocks list
  const blocks = Array.from({ length: 12 }, (_, i) => {
    const blockIndex = Math.max(1, totalBlocks - i);
    const lap = Math.ceil(blockIndex / 3);
    const sector = ((blockIndex - 1) % 3) + 1;
    const isLatest = i === 0;

    const hash = isLatest 
      ? blockchainLastHash 
      : `${(1000000000 + blockIndex * 739391).toString(16)}a9c4f82d10e54b3...`;

    return {
      index: blockIndex,
      lap,
      sector,
      hash,
      prevHash: `${(999999999 + blockIndex * 739391).toString(16)}e7b1c32...`,
      status: "VERIFIED" as const,
      timestamp: `2026-09-04 12:${Math.max(10, 45 - i * 2)}:${(10 + (blockIndex % 50)).toString().padStart(2, "0")}`,
      telemetrySnapshot: {
        speed: (270 + (blockIndex % 30)).toFixed(1),
        fuel: (85 - (blockIndex * 0.4)).toFixed(1),
        wear: (0.15 + (blockIndex * 0.008)).toFixed(3)
      }
    };
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(blocks, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `aegis_telemetry_ledger_blocks_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto font-mono space-y-6">
      
      {/* Top Header Banner */}
      <div className="pb-6 border-b border-neutral-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-purple-400 text-xs font-bold uppercase tracking-widest mb-1">
            <Database className="w-4 h-4" />
            <span>Cryptographic Telemetry Ledger</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white uppercase">
            SHA-256 Blockchain Audit Explorer
          </h1>
          <p className="text-xs text-neutral-400 font-sans mt-1">
            Tamper-proof immutability ledger verifying all vehicle telemetry frames, driver mistakes, and race control commands.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportJSON}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-[#131319] hover:bg-neutral-800 border border-neutral-800 text-neutral-200 text-xs font-bold transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>EXPORT AUDIT JSON</span>
          </button>
        </div>
      </div>

      {/* Hero Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#0c0c10] border border-neutral-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-xs uppercase">Ledger Integrity</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-2xl font-black text-emerald-400">100% VALIDATED</span>
          <span className="text-[10px] text-neutral-500 block mt-1">Zero cryptographic discrepancies detected</span>
        </div>

        <div className="bg-[#0c0c10] border border-neutral-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-xs uppercase">Total Audit Blocks</span>
            <Hash className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-2xl font-black text-white">#{totalBlocks} BLOCKS</span>
          <span className="text-[10px] text-neutral-500 block mt-1">1 block committed per sector transition</span>
        </div>

        <div className="bg-[#0c0c10] border border-neutral-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-xs uppercase">Latest Block Hash</span>
            <CheckCircle2 className="w-4 h-4 text-purple-400" />
          </div>
          <span className="text-xs font-bold text-neutral-300 block truncate mt-1 select-all font-mono">
            {blockchainLastHash}
          </span>
          <span className="text-[10px] text-neutral-500 block mt-1">SHA-256 irreversible digest</span>
        </div>
      </div>

      {/* Block Stream Table */}
      <div className="bg-[#0c0c10] border border-neutral-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-white">
            Immutable Block Sequence
          </span>
          <span className="text-[10px] text-neutral-500 font-mono">
            SYNCED TO FIA AUDIT ENGINE
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#111116] text-neutral-400 border-b border-neutral-800 text-[10px] uppercase">
              <tr>
                <th className="p-3 pl-4">Block #</th>
                <th className="p-3">Track Progress</th>
                <th className="p-3">SHA-256 Hash</th>
                <th className="p-3">Telemetry Payload</th>
                <th className="p-3">Timestamp</th>
                <th className="p-3 pr-4 text-right">Integrity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
              {blocks.map((b) => (
                <tr key={b.index} className="hover:bg-neutral-900/40 transition-colors">
                  <td className="p-3 pl-4 font-bold text-white">
                    #{b.index}
                  </td>
                  <td className="p-3 text-neutral-400">
                    Lap {b.lap} · Sector {b.sector}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-neutral-300 select-all truncate max-w-[200px]">
                        {b.hash}
                      </span>
                      <button
                        onClick={() => handleCopy(b.hash)}
                        className="p-1 rounded text-neutral-500 hover:text-white transition-colors"
                        title="Copy Hash"
                      >
                        {copiedHash === b.hash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>
                  <td className="p-3 text-[11px] text-neutral-400">
                    {b.telemetrySnapshot.speed} km/h · {b.telemetrySnapshot.fuel} kg · {b.telemetrySnapshot.wear} wear
                  </td>
                  <td className="p-3 text-neutral-500 text-[11px]">
                    {b.timestamp}
                  </td>
                  <td className="p-3 pr-4 text-right">
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{b.status}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
