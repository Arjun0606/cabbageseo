"use client";

import { BarChart3, TrendingUp, TrendingDown, Minus, Globe } from "lucide-react";

interface BenchmarkCardProps {
  domain: string;
  totalRecommendations: number;
  percentileRank: number;
  totalDomainsTracked: number;
  platforms: string[];
  weekOverWeek: {
    current: number;
    previous: number;
    change: number;
    changePercent: number;
  };
  loading?: boolean;
}

export function BenchmarkCard({
  domain,
  totalRecommendations,
  percentileRank,
  totalDomainsTracked,
  platforms,
  weekOverWeek,
  loading,
}: BenchmarkCardProps) {
  if (loading) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 animate-pulse">
        <div className="h-5 w-40 bg-zinc-800 rounded mb-4" />
        <div className="h-12 w-32 bg-zinc-800 rounded mb-3" />
        <div className="h-4 w-56 bg-zinc-800 rounded" />
      </div>
    );
  }

  if (totalRecommendations === 0 && percentileRank === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-4 h-4 text-zinc-500" />
          <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wide">
            Industry Benchmark
          </h3>
        </div>
        <p className="text-zinc-500 text-sm">
          No benchmark data yet. As AI platforms recommend your brand,
          you&apos;ll see how you rank
          {totalDomainsTracked > 0 && (
            <> against {totalDomainsTracked.toLocaleString()} other brands tracked</>
          )}
          .
        </p>
      </div>
    );
  }

  const isUp = weekOverWeek.change > 0;
  const isDown = weekOverWeek.change < 0;
  const TrendIcon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;
  const trendColor = isUp
    ? "text-emerald-400"
    : isDown
      ? "text-red-400"
      : "text-zinc-400";

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-zinc-500" />
          <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wide">
            Industry Benchmark
          </h3>
        </div>
        {weekOverWeek.change !== 0 && (
          <div
            className={`flex items-center gap-1 text-sm font-medium ${trendColor}`}
          >
            <TrendIcon className="w-3.5 h-3.5" />
            {isUp ? "+" : ""}
            {weekOverWeek.change} this week
          </div>
        )}
      </div>

      <div className="flex items-end gap-3 mb-3">
        <span className="text-4xl font-bold text-white">
          Top {percentileRank}%
        </span>
      </div>

      <p className="text-sm text-zinc-400 mb-4">
        AI recommended{" "}
        <span className="text-white font-medium">{domain}</span>{" "}
        <span className="text-emerald-400 font-semibold">
          {totalRecommendations} time{totalRecommendations !== 1 ? "s" : ""}
        </span>{" "}
        this week
        {totalDomainsTracked > 0 && (
          <> across {totalDomainsTracked.toLocaleString()} brands tracked</>
        )}
      </p>

      {platforms.length > 0 && (
        <div className="flex items-center gap-2 pt-3 border-t border-zinc-800">
          <Globe className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-xs text-zinc-500">Recommended on</span>
          {platforms.map((p) => (
            <span
              key={p}
              className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-xs rounded capitalize"
            >
              {p}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
