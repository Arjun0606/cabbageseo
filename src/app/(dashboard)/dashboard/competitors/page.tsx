"use client";

import { useEffect, useState } from "react";
import { useSite } from "@/context/site-context";
import { Users, TrendingUp, TrendingDown, Minus, Trophy, ArrowRight, Lock } from "lucide-react";
import Link from "next/link";

interface Competitor {
  id: string;
  domain: string;
  name: string | null;
  total_citations: number;
  citations_this_week: number;
  citations_change: number;
  last_checked_at: string | null;
}

interface CompetitorData {
  competitors: Competitor[];
  yourDomain: string;
  yourCitations: number;
  competitorLimit: number;
}

export default function CompetitorsPage() {
  const { currentSite, organization } = useSite();
  const plan = organization?.plan || "free";
  const [data, setData] = useState<CompetitorData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentSite?.id) return;

    async function fetchCompetitors() {
      setLoading(true);
      try {
        const res = await fetch(`/api/geo/competitors?siteId=${currentSite!.id}`);
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (err) {
        console.error("Failed to fetch competitors:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchCompetitors();
  }, [currentSite?.id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Competitors</h1>
          <p className="text-zinc-400 mt-1">See who AI recommends instead of you</p>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-zinc-800 rounded-lg" />
                <div className="flex-1">
                  <div className="h-4 w-40 bg-zinc-800 rounded mb-2" />
                  <div className="h-3 w-24 bg-zinc-800 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const competitors = data?.competitors || [];
  const yourCitations = data?.yourCitations || 0;
  const yourDomain = data?.yourDomain || currentSite?.domain || "";

  // Empty state
  if (competitors.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Competitors</h1>
          <p className="text-zinc-400 mt-1">See who AI recommends instead of you</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
          <Users className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No competitors found yet</h3>
          <p className="text-sm text-zinc-400 max-w-md mx-auto mb-6">
            Competitors are auto-discovered when you run citation checks. They show up when AI mentions other domains in response to queries about your market.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm transition-colors"
          >
            Run a check to discover competitors
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // Sort: your site first, then competitors by citations descending
  const allEntries = [
    { domain: yourDomain, citations: yourCitations, change: 0, isYou: true },
    ...competitors.map((c) => ({
      domain: c.domain,
      citations: c.total_citations,
      change: c.citations_change,
      isYou: false,
    })),
  ].sort((a, b) => b.citations - a.citations);

  const yourRank = allEntries.findIndex((e) => e.isYou) + 1;
  const topCompetitor = competitors[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Competitors</h1>
        <p className="text-zinc-400 mt-1">
          {competitors.length} competitor{competitors.length !== 1 ? "s" : ""} discovered from AI citations
        </p>
      </div>

      {/* Your position summary */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-zinc-400">Your position</p>
            <p className="text-lg font-bold text-white">
              #{yourRank} of {allEntries.length}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-zinc-400">{yourDomain}</p>
            <p className="text-lg font-bold text-emerald-400">{yourCitations} citations</p>
          </div>
        </div>
      </div>

      {/* Competitor leaderboard */}
      <div className="space-y-2">
        {allEntries.map((entry, index) => {
          const maxCitations = Math.max(...allEntries.map((e) => e.citations), 1);
          const barWidth = (entry.citations / maxCitations) * 100;

          return (
            <div
              key={entry.domain}
              className={`relative overflow-hidden rounded-xl border p-4 transition-colors ${
                entry.isYou
                  ? "bg-emerald-500/5 border-emerald-500/20"
                  : "bg-zinc-900 border-zinc-800"
              }`}
            >
              {/* Citation bar (background) */}
              <div
                className={`absolute inset-y-0 left-0 ${
                  entry.isYou ? "bg-emerald-500/8" : "bg-zinc-800/50"
                }`}
                style={{ width: `${barWidth}%` }}
              />

              <div className="relative flex items-center gap-4">
                <span className="text-sm font-mono text-zinc-500 w-6 text-center">
                  #{index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium truncate ${entry.isYou ? "text-emerald-400" : "text-white"}`}>
                    {entry.domain}
                    {entry.isYou && (
                      <span className="ml-2 text-xs text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        You
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {entry.change !== 0 && (
                    <span
                      className={`flex items-center gap-1 text-xs ${
                        entry.change > 0 ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {entry.change > 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {entry.change > 0 ? "+" : ""}
                      {entry.change}
                    </span>
                  )}
                  {entry.change === 0 && !entry.isYou && (
                    <span className="flex items-center gap-1 text-xs text-zinc-500">
                      <Minus className="w-3 h-3" />
                    </span>
                  )}
                  <span className={`text-sm font-bold tabular-nums ${entry.isYou ? "text-emerald-400" : "text-zinc-300"}`}>
                    {entry.citations}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Plan upgrade hint */}
      {plan === "free" && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-center gap-4">
          <Lock className="w-5 h-5 text-zinc-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-white font-medium">Track more competitors</p>
            <p className="text-xs text-zinc-400">
              Subscribe to Scout to track up to 3 competitors, or Command for 10.
            </p>
          </div>
          <Link
            href="/settings/billing"
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-lg transition-colors shrink-0"
          >
            Upgrade
          </Link>
        </div>
      )}
    </div>
  );
}
