"use client";

import { CheckCircle, XCircle, AlertTriangle, TrendingUp, Clock } from "lucide-react";

export interface ActivityItem {
  id: string;
  type: "citation_won" | "citation_lost" | "competitor_gained" | "source_listed" | "check_completed";
  title: string;
  description: string;
  timestamp: string;
}

interface ActivityFeedProps {
  items: ActivityItem[];
  loading?: boolean;
}

export function ActivityFeed({ items, loading }: ActivityFeedProps) {
  if (loading) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <div className="h-5 w-32 bg-zinc-800 rounded mb-4 animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-8 h-8 bg-zinc-800 rounded-full" />
              <div className="flex-1">
                <div className="h-4 w-48 bg-zinc-800 rounded mb-1" />
                <div className="h-3 w-32 bg-zinc-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const getIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "citation_won":
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case "citation_lost":
        return <XCircle className="w-4 h-4 text-red-400" />;
      case "competitor_gained":
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case "source_listed":
        return <TrendingUp className="w-4 h-4 text-emerald-400" />;
      case "check_completed":
        return <Clock className="w-4 h-4 text-zinc-400" />;
    }
  };

  const getIconBg = (type: ActivityItem["type"]) => {
    switch (type) {
      case "citation_won":
      case "source_listed":
        return "bg-emerald-500/10";
      case "citation_lost":
        return "bg-red-500/10";
      case "competitor_gained":
        return "bg-amber-500/10";
      case "check_completed":
        return "bg-zinc-800";
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wide mb-4">
        Recent Activity
      </h3>

      {items.length === 0 ? (
        <p className="text-zinc-500 text-sm">
          No activity yet. Run a check to get started.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-start gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getIconBg(item.type)}`}
              >
                {getIcon(item.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white">{item.title}</p>
                <p className="text-xs text-zinc-500">{item.description}</p>
              </div>
              <span className="text-xs text-zinc-600 flex-shrink-0">
                {formatTimeAgo(item.timestamp)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return then.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
