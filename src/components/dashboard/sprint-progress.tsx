"use client";

import { CheckCircle, Circle, SkipForward } from "lucide-react";

interface SprintAction {
  id: string;
  actionType: string;
  title: string;
  description: string;
  actionUrl?: string | null;
  priority: number;
  estimatedMinutes: number;
  week: number;
  status: string;
  completedAt: string | null;
  proofUrl?: string | null;
  notes?: string | null;
}

interface SprintProgressProps {
  progress: {
    totalActions: number;
    completedActions: number;
    percentComplete: number;
    currentDay: number;
    currentWeek: number;
    daysRemaining: number;
    isComplete: boolean;
  };
  actions: SprintAction[];
  onComplete: (actionId: string, proofUrl?: string, notes?: string) => void;
  onSkip: (actionId: string) => void;
  loading?: boolean;
}

export function SprintProgress({
  progress,
  actions,
  onComplete,
  onSkip,
  loading,
}: SprintProgressProps) {
  if (loading) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 animate-pulse">
        <div className="h-5 w-48 bg-zinc-800 rounded mb-4" />
        <div className="h-3 w-full bg-zinc-800 rounded-full mb-6" />
        <div className="space-y-3">
          <div className="h-12 bg-zinc-800 rounded" />
          <div className="h-12 bg-zinc-800 rounded" />
          <div className="h-12 bg-zinc-800 rounded" />
        </div>
      </div>
    );
  }

  const weekActions = actions.filter((a) => a.week === progress.currentWeek);
  const weekDone = weekActions.filter(
    (a) => a.status === "completed" || a.status === "skipped"
  ).length;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      {/* Header */}
      <h3 className="text-lg font-semibold text-white mb-4">
        30-Day AI Visibility Sprint
      </h3>

      {/* Progress bar */}
      <div className="h-3 bg-zinc-800 rounded-full overflow-hidden mb-2">
        <div
          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
          style={{ width: `${progress.percentComplete}%` }}
        />
      </div>
      <p className="text-sm text-zinc-400 mb-6">
        Week {progress.currentWeek} &middot; {weekDone} of {weekActions.length} done
      </p>

      {/* Action checklist */}
      <div className="space-y-2">
        {weekActions.map((action) => {
          const isDone = action.status === "completed" || action.status === "skipped";

          return (
            <div
              key={action.id}
              className={`flex items-center gap-3 rounded-lg border p-3 ${
                isDone
                  ? "border-zinc-800 bg-zinc-900/50 opacity-60"
                  : "border-zinc-700 bg-zinc-900"
              }`}
            >
              {isDone ? (
                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-zinc-600 flex-shrink-0" />
              )}

              <span
                className={`flex-1 text-sm ${isDone ? "text-zinc-500 line-through" : "text-white"}`}
              >
                {action.title}
              </span>

              {!isDone && (
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => onComplete(action.id)}
                    className="px-3 py-1 bg-emerald-500 text-white text-xs font-medium rounded-lg hover:bg-emerald-600 transition-colors"
                  >
                    Done
                  </button>
                  <button
                    onClick={() => onSkip(action.id)}
                    className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
                    title="Skip"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
