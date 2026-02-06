"use client";

import { AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";

interface CompetitorAlert {
  domain: string;
  citationsThisWeek: number;
  citationsChange: number;
  queriesWon: string[];
}

interface CompetitorAlertsProps {
  competitors: CompetitorAlert[];
  loading?: boolean;
}

export function CompetitorAlerts({ competitors, loading }: CompetitorAlertsProps) {
  if (loading) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 animate-pulse">
        <div className="h-5 w-40 bg-zinc-800 rounded mb-4" />
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 bg-zinc-800 rounded" />
          ))}
        </div>
      </div>
    );
  }

  const activeAlerts = competitors.filter((c) => c.citationsChange > 0);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-4 h-4 text-amber-400" />
        <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wide">
          Competitor Activity
        </h3>
      </div>

      {competitors.length === 0 ? (
        <p className="text-zinc-500 text-sm">
          No competitors tracked yet. Add competitors to monitor their AI presence.
        </p>
      ) : activeAlerts.length === 0 ? (
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <TrendingDown className="w-4 h-4" />
          No competitor gains detected this week.
        </div>
      ) : (
        <div className="space-y-3">
          {activeAlerts.map((competitor) => (
            <div
              key={competitor.domain}
              className="flex items-center justify-between p-3 rounded-lg bg-red-500/5 border border-red-500/10"
            >
              <div>
                <p className="text-sm font-medium text-white">
                  {competitor.domain}
                </p>
                <p className="text-xs text-red-300">
                  +{competitor.citationsChange} new AI citations this week
                </p>
              </div>
              <div className="flex items-center gap-1 text-red-400">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {competitor.citationsThisWeek}
                </span>
              </div>
            </div>
          ))}

          {competitors
            .filter((c) => c.citationsChange <= 0)
            .map((competitor) => (
              <div
                key={competitor.domain}
                className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-300">
                    {competitor.domain}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {competitor.citationsChange === 0
                      ? "No change"
                      : `${competitor.citationsChange} citations`}{" "}
                    this week
                  </p>
                </div>
                <span className="text-sm text-zinc-500">
                  {competitor.citationsThisWeek}
                </span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
