"use client";

import { TrendingUp, TrendingDown, Calendar, Target, BarChart3 } from "lucide-react";

interface ROISummaryProps {
  firstCheckDate: string;
  latestCheckDate: string;
  checksCount: number;
  firstQueriesWon: number;
  firstQueriesTotal: number;
  latestQueriesWon: number;
  latestQueriesTotal: number;
  momentumScore: number | null;
  loading?: boolean;
}

export function ROISummary({
  firstCheckDate,
  latestCheckDate,
  checksCount,
  firstQueriesWon,
  firstQueriesTotal,
  latestQueriesWon,
  latestQueriesTotal,
  momentumScore,
  loading,
}: ROISummaryProps) {
  if (loading) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 animate-pulse">
        <div className="h-4 w-32 bg-zinc-800 rounded mb-4" />
        <div className="grid grid-cols-3 gap-4">
          <div className="h-16 bg-zinc-800 rounded-xl" />
          <div className="h-16 bg-zinc-800 rounded-xl" />
          <div className="h-16 bg-zinc-800 rounded-xl" />
        </div>
      </div>
    );
  }

  // Need at least 2 checks to show ROI
  if (checksCount < 2) return null;

  const firstWinRate = firstQueriesTotal > 0
    ? Math.round((firstQueriesWon / firstQueriesTotal) * 100)
    : 0;
  const latestWinRate = latestQueriesTotal > 0
    ? Math.round((latestQueriesWon / latestQueriesTotal) * 100)
    : 0;
  const winRateDelta = latestWinRate - firstWinRate;
  const queriesDelta = latestQueriesWon - firstQueriesWon;

  // Days tracking
  const daysSinceFirst = Math.max(
    1,
    Math.floor(
      (new Date(latestCheckDate).getTime() - new Date(firstCheckDate).getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const isImproving = queriesDelta > 0 || winRateDelta > 0;
  const isDecline = queriesDelta < 0 && winRateDelta < 0;

  // Build summary sentence
  let summary: string;
  if (isImproving) {
    if (winRateDelta > 0) {
      summary = `AI cites you in ${latestWinRate}% of queries about your market, up from ${firstWinRate}% when you started.`;
    } else {
      summary = `You've gained ${queriesDelta} more AI citation${queriesDelta !== 1 ? "s" : ""} since your first check.`;
    }
  } else if (isDecline) {
    summary = `Your AI win rate dropped from ${firstWinRate}% to ${latestWinRate}%. Check your sprint actions for ways to recover.`;
  } else {
    summary = `Your AI visibility is holding steady at ${latestWinRate}% win rate across ${latestQueriesTotal} queries.`;
  }

  return (
    <div
      className={`rounded-2xl p-6 border ${
        isImproving
          ? "border-emerald-500/20 bg-emerald-500/5"
          : isDecline
            ? "border-red-500/20 bg-red-500/5"
            : "border-zinc-800 bg-zinc-900"
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {isImproving ? (
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          ) : isDecline ? (
            <TrendingDown className="w-4 h-4 text-red-400" />
          ) : (
            <BarChart3 className="w-4 h-4 text-zinc-400" />
          )}
          <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wide">
            Your Progress
          </h3>
        </div>
        <span className="text-xs text-zinc-600">
          Since {formatDate(firstCheckDate)} ({daysSinceFirst}d)
        </span>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="rounded-xl bg-zinc-800/50 p-3 text-center">
          <p
            className={`text-xl font-bold ${
              queriesDelta > 0
                ? "text-emerald-400"
                : queriesDelta < 0
                  ? "text-red-400"
                  : "text-white"
            }`}
          >
            {queriesDelta > 0 ? "+" : ""}
            {queriesDelta}
          </p>
          <p className="text-xs text-zinc-500 mt-0.5">Queries Won</p>
        </div>
        <div className="rounded-xl bg-zinc-800/50 p-3 text-center">
          <p
            className={`text-xl font-bold ${
              winRateDelta > 0
                ? "text-emerald-400"
                : winRateDelta < 0
                  ? "text-red-400"
                  : "text-white"
            }`}
          >
            {firstWinRate}% → {latestWinRate}%
          </p>
          <p className="text-xs text-zinc-500 mt-0.5">Win Rate</p>
        </div>
        <div className="rounded-xl bg-zinc-800/50 p-3 text-center">
          <p className="text-xl font-bold text-white">
            {momentumScore !== null ? momentumScore : "—"}
            <span className="text-sm text-zinc-500 font-normal">/100</span>
          </p>
          <p className="text-xs text-zinc-500 mt-0.5">Momentum</p>
        </div>
      </div>

      {/* Summary */}
      <p className="text-sm text-zinc-400 leading-relaxed">{summary}</p>

      {/* Check count */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-1.5 text-xs text-zinc-600">
          <Calendar className="w-3 h-3" />
          {checksCount} checks run
        </div>
        <div className="flex items-center gap-1.5 text-xs text-zinc-600">
          <Target className="w-3 h-3" />
          {latestQueriesTotal} queries tracked
        </div>
      </div>
    </div>
  );
}
