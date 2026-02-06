"use client";

import { ArrowRight, ExternalLink, Zap } from "lucide-react";

interface NextAction {
  id: string;
  title: string;
  description: string;
  priority: "critical" | "high" | "medium" | "low";
  estimatedMinutes: number;
  actionUrl?: string;
  category: "source" | "content" | "technical" | "monitoring";
}

interface DoThisNextProps {
  action: NextAction | null;
  loading?: boolean;
}

export function DoThisNext({ action, loading }: DoThisNextProps) {
  if (loading) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 animate-pulse">
        <div className="h-4 w-24 bg-zinc-800 rounded mb-3" />
        <div className="h-6 w-64 bg-zinc-800 rounded mb-2" />
        <div className="h-4 w-full bg-zinc-800 rounded" />
      </div>
    );
  }

  if (!action) {
    return (
      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium text-emerald-400 uppercase tracking-wide">
            All caught up
          </span>
        </div>
        <p className="text-white font-semibold text-lg">
          No pending actions right now
        </p>
        <p className="text-zinc-400 text-sm mt-1">
          Run a new check to discover more opportunities.
        </p>
      </div>
    );
  }

  const priorityColors = {
    critical: "border-red-500/30 bg-red-500/5",
    high: "border-amber-500/30 bg-amber-500/5",
    medium: "border-zinc-700 bg-zinc-900",
    low: "border-zinc-800 bg-zinc-900",
  };

  const priorityBadge = {
    critical: "bg-red-500/10 text-red-400",
    high: "bg-amber-500/10 text-amber-400",
    medium: "bg-zinc-800 text-zinc-400",
    low: "bg-zinc-800 text-zinc-500",
  };

  return (
    <div className={`rounded-2xl p-6 border ${priorityColors[action.priority]}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" />
          <span className="text-sm font-medium text-zinc-400 uppercase tracking-wide">
            Do this next
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-0.5 rounded text-xs font-medium ${priorityBadge[action.priority]}`}
          >
            {action.priority}
          </span>
          <span className="text-xs text-zinc-600">
            ~{action.estimatedMinutes} min
          </span>
        </div>
      </div>

      <h3 className="text-xl font-bold text-white mb-2">{action.title}</h3>
      <p className="text-zinc-400 text-sm mb-4">{action.description}</p>

      <div className="flex items-center gap-3">
        {action.actionUrl && (
          <a
            href={action.actionUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition-colors"
          >
            Take action
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
        <span className="text-xs text-zinc-600">
          {action.category === "source"
            ? "Trust source"
            : action.category === "content"
              ? "Content"
              : action.category === "technical"
                ? "Technical"
                : "Monitoring"}
        </span>
      </div>
    </div>
  );
}
