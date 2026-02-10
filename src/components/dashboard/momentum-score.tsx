"use client";

import { TrendingUp, TrendingDown, Minus, Clock } from "lucide-react";

interface MomentumScoreProps {
  score: number | null;
  change: number;
  trend: "gaining" | "losing" | "stable";
  queriesWon: number;
  queriesTotal: number;
  loading?: boolean;
  trialDaysRemaining?: number;
}

export function MomentumScore({
  score,
  change,
  trend,
  queriesWon,
  queriesTotal,
  loading,
  trialDaysRemaining,
}: MomentumScoreProps) {
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
          <span className="text-6xl font-bold text-zinc-600">—</span>
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
      {/* Trial countdown pill */}
      {typeof trialDaysRemaining === "number" && trialDaysRemaining >= 0 && (
        <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs font-medium text-amber-400">
            {trialDaysRemaining === 0 ? "Trial ends today" : `${trialDaysRemaining}d left in trial`}
          </span>
        </div>
      )}

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
    </div>
  );
}
