"use client";

import Link from "next/link";
import { CheckCircle, Circle, ArrowRight, Loader2 } from "lucide-react";

interface GoalStep {
  label: string;
  completed: boolean;
  href?: string;
}

interface FirstCitationGoalProps {
  steps: GoalStep[];
  loading?: boolean;
  onRecheck: () => void;
  checking?: boolean;
}

export function FirstCitationGoal({
  steps,
  loading,
  onRecheck,
  checking,
}: FirstCitationGoalProps) {
  if (loading) {
    return (
      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6 animate-pulse">
        <div className="h-7 w-72 bg-zinc-800 rounded mb-2" />
        <div className="h-4 w-96 bg-zinc-800 rounded mb-6" />
        <div className="h-3 bg-zinc-800 rounded-full mb-6" />
        <div className="space-y-3">
          <div className="h-5 w-48 bg-zinc-800 rounded" />
          <div className="h-5 w-44 bg-zinc-800 rounded" />
          <div className="h-5 w-40 bg-zinc-800 rounded" />
        </div>
      </div>
    );
  }

  const completedCount = steps.filter((s) => s.completed).length;
  const progressPercent = steps.length > 0 ? (completedCount / steps.length) * 100 : 0;

  return (
    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6">
      <h2 className="text-xl font-bold text-white mb-1">
        Get your first AI citation in 14 days
      </h2>
      <p className="text-zinc-400 text-sm mb-5">
        Complete these steps to start appearing in AI recommendations
      </p>

      {/* Progress bar */}
      <div className="mb-1">
        <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
      <p className="text-xs text-zinc-500 mb-5">
        {completedCount} of {steps.length} steps complete
      </p>

      {/* Steps */}
      <ol className="space-y-3">
        {steps.map((step, i) => (
          <li key={i} className="flex items-center gap-3">
            {step.completed ? (
              <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            ) : (
              <Circle className="w-5 h-5 text-zinc-600 flex-shrink-0" />
            )}
            <span
              className={`text-sm flex-1 ${
                step.completed ? "text-zinc-500 line-through" : "text-zinc-200"
              }`}
            >
              {step.label}
            </span>

            {/* Action for incomplete steps */}
            {!step.completed && step.href && (
              <Link
                href={step.href}
                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
              >
                Go <ArrowRight className="w-3 h-3" />
              </Link>
            )}
            {!step.completed && !step.href && i === 1 && (
              <button
                onClick={onRecheck}
                disabled={checking}
                className="text-xs text-emerald-400 hover:text-emerald-300 disabled:text-zinc-600 flex items-center gap-1 transition-colors"
              >
                {checking ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    Re-check now <ArrowRight className="w-3 h-3" />
                  </>
                )}
              </button>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
