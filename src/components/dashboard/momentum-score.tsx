"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, Lightbulb } from "lucide-react";
import type { MomentumBreakdown } from "@/lib/geo/momentum";

interface MomentumScoreProps {
  score: number | null;
  change: number;
  trend: "gaining" | "losing" | "stable";
  queriesWon: number;
  queriesTotal: number;
  loading?: boolean;
  breakdown?: MomentumBreakdown | null;
}

export function MomentumScore({
  score,
  change,
  trend,
  queriesWon,
  queriesTotal,
  loading,
  breakdown,
}: MomentumScoreProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);

  if (loading) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 animate-pulse">
        <div className="h-6 w-32 bg-zinc-800 rounded mb-4" />
        <div className="h-16 w-24 bg-zinc-800 rounded mb-2" />
        <div className="h-4 w-48 bg-zinc-800 rounded" />
      </div>
    );
  }

  // Empty state — no data yet
  if (score === null) {
    return (
      <div className="rounded-2xl p-8 border bg-zinc-800 border-zinc-700">
        <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wide mb-4">
          AI Momentum
        </h3>
        <div className="flex items-end gap-4 mb-3">
          <span className="text-6xl font-bold text-zinc-600">&mdash;</span>
          <span className="text-2xl text-zinc-600 mb-2">/100</span>
        </div>
        <p className="text-sm text-zinc-500">
          Run your first check to see your AI momentum score
        </p>
      </div>
    );
  }

  const trendColor =
    trend === "gaining"
      ? "text-emerald-400"
      : trend === "losing"
        ? "text-red-400"
        : "text-zinc-400";

  const trendBg =
    trend === "gaining"
      ? "bg-emerald-500/10 border-emerald-500/20"
      : trend === "losing"
        ? "bg-red-500/10 border-red-500/20"
        : "bg-zinc-800 border-zinc-700";

  const TrendIcon =
    trend === "gaining"
      ? TrendingUp
      : trend === "losing"
        ? TrendingDown
        : Minus;

  const changeText =
    change > 0 ? `+${change}%` : change < 0 ? `${change}%` : "No change";

  const trendLabel =
    trend === "gaining"
      ? "Gaining ground"
      : trend === "losing"
        ? "Losing ground"
        : "Holding steady";

  return (
    <div className={`rounded-2xl p-8 border ${trendBg} relative`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wide">
          AI Momentum
        </h3>
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${trendColor} ${
            trend === "gaining"
              ? "bg-emerald-500/10"
              : trend === "losing"
                ? "bg-red-500/10"
                : "bg-zinc-800"
          }`}
        >
          <TrendIcon className="w-4 h-4" />
          {changeText} this week
        </div>
      </div>

      <div className="flex items-end gap-4 mb-3">
        <span className="text-6xl font-bold text-white">{score}</span>
        <span className="text-2xl text-zinc-500 mb-2">/100</span>
      </div>

      <p className={`text-lg font-medium ${trendColor} mb-1`}>{trendLabel}</p>
      <p className="text-sm text-zinc-500">
        AI mentions you in {queriesWon} of {queriesTotal} queries checked
      </p>

      {/* Score breakdown toggle */}
      {breakdown && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-300 transition-colors"
          >
            {showBreakdown ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
            Why this score?
          </button>

          {showBreakdown && (
            <div className="mt-3 space-y-2">
              <BreakdownRow
                label="AI Citations"
                points={breakdown.baseScore}
                max={50}
              />
              <BreakdownRow
                label="Trust Sources"
                points={breakdown.sourceBonus}
                max={30}
                prefix="+"
              />
              <BreakdownRow
                label="Week-over-week"
                points={breakdown.momentumBonus}
                max={20}
                prefix={breakdown.momentumBonus >= 0 ? "+" : ""}
              />

              {breakdown.tip && (
                <div className="mt-3 flex items-start gap-2 text-xs text-amber-400/80 bg-amber-500/5 rounded-lg px-3 py-2">
                  <Lightbulb className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>{breakdown.tip}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BreakdownRow({
  label,
  points,
  max,
  prefix = "",
}: {
  label: string;
  points: number;
  max: number;
  prefix?: string;
}) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (Math.abs(points) / max) * 100)) : 0;
  const isNegative = points < 0;

  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="text-zinc-500 w-28 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isNegative ? "bg-red-500/60" : "bg-emerald-500/60"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`w-10 text-right font-mono ${isNegative ? "text-red-400" : "text-zinc-300"}`}>
        {prefix}{points}
      </span>
    </div>
  );
}
