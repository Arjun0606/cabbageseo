"use client";

import { TrendingUp, Calendar, CheckCircle2 } from "lucide-react";

interface ProgressCardProps {
  startDate: string | null;
  startingScore: number;
  currentScore: number;
  actionsCompleted: number;
  monthlyScores: Array<{ period: string; score: number }>;
  loading: boolean;
}

export function ProgressCard({
  startDate,
  startingScore,
  currentScore,
  actionsCompleted,
  monthlyScores,
  loading,
}: ProgressCardProps) {
  if (loading) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 animate-pulse">
        <div className="h-5 bg-zinc-800 rounded w-1/3 mb-4" />
        <div className="h-12 bg-zinc-800 rounded w-full mb-3" />
        <div className="h-4 bg-zinc-800 rounded w-2/3" />
      </div>
    );
  }

  // Empty state
  if (!startDate && actionsCompleted === 0 && monthlyScores.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-2">Your Progress</h3>
        <p className="text-zinc-400 text-sm">
          Complete your first sprint action to start tracking progress.
        </p>
      </div>
    );
  }

  const delta = currentScore - startingScore;
  const deltaColor =
    delta > 0 ? "text-emerald-400" : delta < 0 ? "text-red-400" : "text-zinc-400";
  const deltaPrefix = delta > 0 ? "+" : "";

  // Find max score for sparkline normalization
  const allScores = monthlyScores.map((s) => s.score);
  const maxScore = Math.max(...allScores, currentScore, 1);

  // Format start date
  const formattedDate = startDate
    ? new Date(startDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-emerald-400" />
        <h3 className="text-lg font-semibold text-white">Your Progress</h3>
      </div>

      {/* Before → After */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {/* Starting score */}
        <div className="text-center">
          <p className="text-zinc-500 text-xs mb-1">Then</p>
          <p className="text-2xl font-bold text-zinc-400">{startingScore}</p>
          {formattedDate && (
            <p className="text-zinc-600 text-xs mt-1 flex items-center justify-center gap-1">
              <Calendar className="w-3 h-3" />
              {formattedDate}
            </p>
          )}
        </div>

        {/* Arrow / delta */}
        <div className="flex flex-col items-center justify-center">
          <span className="text-zinc-600 text-lg">→</span>
          <span className={`text-sm font-bold ${deltaColor}`}>
            {deltaPrefix}{delta}
          </span>
        </div>

        {/* Current score */}
        <div className="text-center">
          <p className="text-zinc-500 text-xs mb-1">Now</p>
          <p className="text-2xl font-bold text-emerald-400">{currentScore}</p>
        </div>
      </div>

      {/* Actions completed */}
      <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-zinc-800/50 rounded-lg">
        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        <span className="text-sm text-zinc-300">
          <span className="font-semibold text-white">{actionsCompleted}</span>{" "}
          actions completed
        </span>
      </div>

      {/* Sparkline */}
      {monthlyScores.length >= 2 && (
        <div className="mt-3">
          <p className="text-zinc-500 text-xs mb-2">Monthly momentum</p>
          <div className="flex items-end gap-1 h-10">
            {monthlyScores.map((s, i) => {
              const height = Math.max(4, (s.score / maxScore) * 40);
              const isLast = i === monthlyScores.length - 1;
              return (
                <div
                  key={s.period}
                  className={`flex-1 rounded-sm ${isLast ? "bg-emerald-500" : "bg-zinc-700"}`}
                  style={{ height: `${height}px` }}
                  title={`${s.period}: ${s.score}`}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
