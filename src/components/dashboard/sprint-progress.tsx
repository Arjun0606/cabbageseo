"use client";

import { CheckCircle, Circle, Clock, ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import { useState } from "react";

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
  const [expandedWeek, setExpandedWeek] = useState<number>(progress.currentWeek);

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

  const weeks = [1, 2, 3, 4];

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      {/* Progress header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">
          30-Day AI Visibility Sprint
        </h3>
        <span className="text-sm text-zinc-400">
          Day {progress.currentDay} of 30
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative mb-2">
        <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${progress.percentComplete}%` }}
          />
        </div>
      </div>
      <div className="flex justify-between text-xs text-zinc-500 mb-6">
        <span>
          {progress.completedActions} of {progress.totalActions} actions done
        </span>
        <span>{progress.daysRemaining} days remaining</span>
      </div>

      {/* Weeks accordion */}
      <div className="space-y-3">
        {weeks.map((week) => {
          const weekActions = actions.filter((a) => a.week === week);
          if (weekActions.length === 0) return null;

          const weekCompleted = weekActions.filter(
            (a) => a.status === "completed"
          ).length;
          const isExpanded = expandedWeek === week;
          const isCurrent = progress.currentWeek === week;
          const isComplete = weekCompleted === weekActions.length;

          const weekLabel =
            week === 1
              ? "Critical Sources"
              : week === 2
                ? "Content & Discovery"
                : week === 3
                  ? "Authority Building"
                  : "Review & Optimize";

          return (
            <div key={week} className="border border-zinc-800 rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedWeek(isExpanded ? 0 : week)}
                className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isComplete ? (
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  ) : isCurrent ? (
                    <Clock className="w-5 h-5 text-amber-400" />
                  ) : (
                    <Circle className="w-5 h-5 text-zinc-600" />
                  )}
                  <div className="text-left">
                    <p className="text-sm font-medium text-white">
                      Week {week}: {weekLabel}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {weekCompleted}/{weekActions.length} complete
                    </p>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-zinc-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-zinc-500" />
                )}
              </button>

              {isExpanded && (
                <div className="border-t border-zinc-800 p-4 space-y-3">
                  {weekActions.map((action) => (
                    <SprintActionCard
                      key={action.id}
                      action={action}
                      onComplete={onComplete}
                      onSkip={onSkip}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SprintActionCard({
  action,
  onComplete,
  onSkip,
}: {
  action: SprintAction;
  onComplete: (id: string, proofUrl?: string, notes?: string) => void;
  onSkip: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [proofUrl, setProofUrl] = useState("");
  const [notes, setNotes] = useState("");
  const isDone = action.status === "completed" || action.status === "skipped";

  const handleConfirm = () => {
    onComplete(action.id, proofUrl || undefined, notes || undefined);
    setConfirming(false);
    setProofUrl("");
    setNotes("");
  };

  return (
    <div
      className={`rounded-lg border p-4 ${
        isDone
          ? "border-zinc-800 bg-zinc-900/50 opacity-60"
          : "border-zinc-700 bg-zinc-900"
      }`}
    >
      <div className="flex items-start gap-3">
        {isDone ? (
          <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
        ) : (
          <Circle className="w-5 h-5 text-zinc-600 mt-0.5 flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p
              className={`text-sm font-medium ${isDone ? "text-zinc-500 line-through" : "text-white"}`}
            >
              {action.title}
            </p>
            <span className="text-xs text-zinc-600">~{action.estimatedMinutes}min</span>
          </div>

          {/* Completed state: show proof link if provided */}
          {isDone && action.proofUrl && (
            <a
              href={action.proofUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 mt-1"
            >
              View proof
              <ExternalLink className="w-3 h-3" />
            </a>
          )}

          {expanded && !confirming && (
            <div className="mt-2">
              <p className="text-sm text-zinc-400 mb-3">{action.description}</p>
              {!isDone && (
                <div className="flex items-center gap-2">
                  {action.actionUrl && (
                    <a
                      href={action.actionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 text-xs font-medium rounded-lg hover:bg-emerald-500/20 transition-colors"
                    >
                      Go to site
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  <button
                    onClick={() => setConfirming(true)}
                    className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-medium rounded-lg hover:bg-emerald-600 transition-colors"
                  >
                    I did this
                  </button>
                  <button
                    onClick={() => onSkip(action.id)}
                    className="px-3 py-1.5 text-zinc-500 text-xs hover:text-zinc-300 transition-colors"
                  >
                    Not relevant
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Proof confirmation step */}
          {confirming && (
            <div className="mt-3 space-y-3">
              <input
                type="url"
                value={proofUrl}
                onChange={(e) => setProofUrl(e.target.value)}
                placeholder="Paste link to prove it (optional)"
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any notes? (optional)"
                rows={2}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 resize-none"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleConfirm}
                  className="px-4 py-1.5 bg-emerald-500 text-white text-xs font-medium rounded-lg hover:bg-emerald-600 transition-colors"
                >
                  Confirm
                </button>
                <button
                  onClick={() => { setConfirming(false); setProofUrl(""); setNotes(""); }}
                  className="px-3 py-1.5 text-zinc-500 text-xs hover:text-zinc-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {!isDone && !confirming && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-zinc-500 hover:text-zinc-300 mt-1"
            >
              {expanded ? "Show less" : "Show details"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
