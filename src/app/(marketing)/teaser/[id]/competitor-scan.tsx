"use client";

import { Search, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface CompetitorScanProps {
  domain: string;
  competitors: string[];
}

export default function CompetitorScan({ domain, competitors }: CompetitorScanProps) {
  const router = useRouter();
  const [customDomain, setCustomDomain] = useState("");

  const handleScan = (targetDomain: string) => {
    router.push(`/teaser?domain=${encodeURIComponent(targetDomain)}`);
  };

  const topCompetitors = competitors.slice(0, 4);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8">
      <div className="text-center mb-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm mb-3">
          <Search className="w-3.5 h-3.5" />
          Competitor Intelligence
        </div>
        <h3 className="text-lg font-bold text-white">
          Now scan a competitor
        </h3>
        <p className="text-zinc-400 text-sm mt-1">
          See how {domain}&apos;s rivals score — and who AI actually prefers
        </p>
      </div>

      {/* Quick-scan competitor buttons */}
      {topCompetitors.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          {topCompetitors.map((comp) => (
            <button
              key={comp}
              onClick={() => handleScan(comp)}
              className="flex items-center justify-between px-4 py-3 bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/50 hover:border-emerald-500/30 rounded-xl text-left transition-all group"
            >
              <span className="text-white text-sm font-medium truncate mr-2">
                {comp}
              </span>
              <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-emerald-400 shrink-0 transition-colors" />
            </button>
          ))}
        </div>
      )}

      {/* Custom domain input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (customDomain.trim()) handleScan(customDomain.trim());
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={customDomain}
          onChange={(e) => setCustomDomain(e.target.value)}
          placeholder="Or enter any domain..."
          className="flex-1 px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
        />
        <button
          type="submit"
          disabled={!customDomain.trim()}
          className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-semibold text-sm rounded-xl transition-colors"
        >
          Scan
        </button>
      </form>
    </div>
  );
}
