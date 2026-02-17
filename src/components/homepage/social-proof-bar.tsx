"use client";

import { useEffect, useState } from "react";
import { Counter } from "@/components/motion/counter";

interface RecentScan {
  domain: string;
  timeAgo: string;
}

interface Counts {
  totalScans: number;
  totalDomains: number;
  scansToday: number;
}

interface SocialProofData {
  recentScans: RecentScan[];
  counts: Counts;
}

export function SocialProofBar() {
  const [data, setData] = useState<SocialProofData | null>(null);

  useEffect(() => {
    fetch("/api/stats/recent")
      .then((r) => r.json())
      .then((res) => {
        setData({
          recentScans: res.scans || [],
          counts: res.counts || { totalScans: 0, totalDomains: 0, scansToday: 0 },
        });
      })
      .catch(() => {});
  }, []);

  if (!data || data.counts.totalScans === 0) return null;

  return (
    <div className="mt-16 space-y-6">
      {/* Stats row */}
      <div className="flex items-center justify-center gap-6 sm:gap-10">
        <div className="text-center">
          <div className="text-white font-bold text-lg tabular-nums">
            <Counter value={data.counts.totalDomains} suffix="" />
          </div>
          <p className="text-zinc-500 text-xs">Domains scanned</p>
        </div>
        <div className="w-px h-8 bg-zinc-800" />
        <div className="text-center">
          <div className="text-white font-bold text-lg tabular-nums">
            <Counter value={data.counts.totalScans} suffix="" />
          </div>
          <p className="text-zinc-500 text-xs">Total scans</p>
        </div>
        {data.counts.scansToday > 0 && (
          <>
            <div className="w-px h-8 bg-zinc-800" />
            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                </span>
                <span className="text-emerald-400 font-bold text-lg tabular-nums">
                  <Counter value={data.counts.scansToday} suffix="" />
                </span>
              </div>
              <p className="text-zinc-500 text-xs">Scans today</p>
            </div>
          </>
        )}
      </div>

      {/* Recently scanned ticker */}
      {data.recentScans.length > 0 && (
        <div className="relative overflow-hidden">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-zinc-950 to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-zinc-950 to-transparent z-10" />

          <div className="flex animate-ticker gap-6">
            {/* Duplicate for seamless loop */}
            {[...data.recentScans, ...data.recentScans].map((scan, i) => (
              <div
                key={i}
                className="shrink-0 flex items-center gap-2 px-3 py-1.5 bg-zinc-900/50 border border-zinc-800/50 rounded-full"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/60" />
                <span className="text-zinc-500 text-xs whitespace-nowrap">
                  {scan.domain}
                </span>
                <span className="text-zinc-600 text-xs whitespace-nowrap">
                  {scan.timeAgo}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
