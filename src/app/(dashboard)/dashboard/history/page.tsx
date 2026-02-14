"use client";

/**
 * History Page — Browse past AI visibility scans
 *
 * Shows trend chart + scrollable scan log with per-day breakdown.
 * Respects plan-based history retention (Scout=30d, Command/Dominate=365d).
 */

import { useState } from "react";
import { useSite } from "@/context/site-context";
import { useHistory } from "@/hooks/api/queries";
import { getCitationPlanLimits } from "@/lib/billing/citation-plans";
import { TrendChart } from "@/components/dashboard/trend-chart";
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  BarChart3,
} from "lucide-react";

const RANGE_OPTIONS = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
  { label: "1y", days: 365 },
] as const;

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatFullDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function HistoryPage() {
  const { currentSite, organization, loading: siteLoading } = useSite();
  const plan = organization?.plan || "free";
  const planLimits = getCitationPlanLimits(plan);
  const maxDays = planLimits.historyDays;

  // Default range: show all available history or 30d, whichever is smaller
  const [selectedDays, setSelectedDays] = useState(Math.min(maxDays, 30));
  const { data: snapshots = [], isLoading } = useHistory(currentSite?.id, selectedDays);

  const loading = siteLoading || isLoading;

  // Compute summary stats
  const latestSnapshot = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
  const firstSnapshot = snapshots.length > 0 ? snapshots[0] : null;
  const wonDelta =
    latestSnapshot && firstSnapshot
      ? latestSnapshot.queriesWon - firstSnapshot.queriesWon
      : 0;
  const winRate =
    latestSnapshot && latestSnapshot.totalQueries > 0
      ? Math.round((latestSnapshot.queriesWon / latestSnapshot.totalQueries) * 100)
      : 0;

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">History</h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            {snapshots.length} scan{snapshots.length !== 1 ? "s" : ""} in the last {selectedDays} days
            {maxDays <= 30 && (
              <span className="text-zinc-600"> · Upgrade for up to 365 days</span>
            )}
          </p>
        </div>

        {/* Range selector */}
        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
          {RANGE_OPTIONS.map((opt) => {
            const disabled = opt.days > maxDays;
            const active = selectedDays === opt.days;
            return (
              <button
                key={opt.days}
                onClick={() => !disabled && setSelectedDays(opt.days)}
                disabled={disabled}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  active
                    ? "bg-emerald-500/20 text-emerald-400"
                    : disabled
                      ? "text-zinc-700 cursor-not-allowed"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                }`}
                title={disabled ? `Requires Command plan or higher (${opt.days}-day history)` : undefined}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary cards */}
      {snapshots.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <p className="text-zinc-500 text-xs uppercase tracking-wide mb-1">Total Scans</p>
            <p className="text-2xl font-bold text-white">{snapshots.length}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <p className="text-zinc-500 text-xs uppercase tracking-wide mb-1">Latest Win Rate</p>
            <p className="text-2xl font-bold text-white">{winRate}%</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <p className="text-zinc-500 text-xs uppercase tracking-wide mb-1">Queries Won</p>
            <p className="text-2xl font-bold text-emerald-400">
              {latestSnapshot?.queriesWon || 0}
              <span className="text-zinc-500 text-sm font-normal">
                /{latestSnapshot?.totalQueries || 0}
              </span>
            </p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <p className="text-zinc-500 text-xs uppercase tracking-wide mb-1">Change</p>
            <div className="flex items-center gap-1.5">
              {wonDelta > 0 ? (
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              ) : wonDelta < 0 ? (
                <TrendingDown className="w-4 h-4 text-red-400" />
              ) : (
                <Minus className="w-4 h-4 text-zinc-500" />
              )}
              <p className={`text-2xl font-bold ${
                wonDelta > 0 ? "text-emerald-400" : wonDelta < 0 ? "text-red-400" : "text-zinc-400"
              }`}>
                {wonDelta > 0 ? "+" : ""}{wonDelta}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Trend chart */}
      <TrendChart snapshots={snapshots} loading={false} />

      {/* Scan log */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-zinc-500" />
          <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wide">
            Scan Log
          </h2>
        </div>

        {snapshots.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
            <Calendar className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-white font-medium mb-1">No scan history yet</h3>
            <p className="text-zinc-500 text-sm">
              Run your first AI visibility check from the dashboard to start tracking progress.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {[...snapshots].reverse().map((snapshot, i) => {
              const prevSnapshot = i < snapshots.length - 1
                ? [...snapshots].reverse()[i + 1]
                : null;
              const delta = prevSnapshot
                ? snapshot.queriesWon - prevSnapshot.queriesWon
                : 0;
              const rate = snapshot.totalQueries > 0
                ? Math.round((snapshot.queriesWon / snapshot.totalQueries) * 100)
                : 0;

              return (
                <div
                  key={snapshot.date}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 flex items-center justify-between hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-lg bg-zinc-800">
                      <Calendar className="w-4 h-4 text-zinc-400" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">
                        {formatDate(snapshot.date)}
                      </p>
                      <p className="text-zinc-500 text-xs">
                        {formatFullDate(snapshot.date)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {/* Won / Lost */}
                    <div className="text-right">
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-emerald-400 font-medium">
                          {snapshot.queriesWon} won
                        </span>
                        <span className="text-red-400 font-medium">
                          {snapshot.queriesLost} lost
                        </span>
                      </div>
                      <p className="text-zinc-600 text-xs">
                        {snapshot.totalQueries} queries · {rate}% win rate
                      </p>
                    </div>

                    {/* Delta badge */}
                    {prevSnapshot && (
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        delta > 0
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : delta < 0
                            ? "bg-red-500/10 text-red-400 border border-red-500/20"
                            : "bg-zinc-800 text-zinc-500 border border-zinc-700"
                      }`}>
                        {delta > 0 ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : delta < 0 ? (
                          <TrendingDown className="w-3 h-3" />
                        ) : (
                          <Minus className="w-3 h-3" />
                        )}
                        {delta > 0 ? "+" : ""}{delta}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
