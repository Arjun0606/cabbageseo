"use client";

import { useEffect, useState } from "react";
import { Counter } from "@/components/motion/counter";

interface RecentScan {
  domain: string;
  timeAgo: string;
}

interface SocialProofData {
  scanCount: number;
  recentScans: RecentScan[];
}

export function SocialProofBar() {
  const [data, setData] = useState<SocialProofData | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/stats/scans").then((r) => r.json()).catch(() => ({ count: 0 })),
      fetch("/api/stats/recent").then((r) => r.json()).catch(() => ({ scans: [] })),
    ]).then(([scansData, recentData]) => {
      setData({
        scanCount: scansData.count || 0,
        recentScans: recentData.scans || [],
      });
    });
  }, []);

  if (!data || (data.scanCount === 0 && data.recentScans.length === 0)) return null;

  return (
    <div className="mt-16 space-y-6">
      {/* Scan counter */}
      {data.scanCount > 0 && (
        <div className="text-center">
          <p className="text-zinc-500 text-sm">
            <Counter
              value={data.scanCount}
              className="text-white font-semibold"
              suffix=""
            />{" "}
            sites scanned so far
          </p>
        </div>
      )}

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
