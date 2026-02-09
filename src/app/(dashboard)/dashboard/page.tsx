"use client";

/**
 * DASHBOARD — Score → Fix → Proof
 *
 * Layout:
 * 1. Momentum Score + Do This Next (2-col)
 * 2. Your Improvement (before/after)
 * 3. Queries You're Losing (with fix pipeline)
 * 4. Impact Stats (pages generated)
 * 5. Sprint Progress (paid) / Upgrade CTA (free)
 */

import { useEffect, useState, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSite } from "@/context/site-context";
import { MomentumScore } from "@/components/dashboard/momentum-score";
import { SprintProgress } from "@/components/dashboard/sprint-progress";
import { DoThisNext } from "@/components/dashboard/do-this-next";
import { FirstCitationGoal } from "@/components/dashboard/first-citation-goal";
import { RevenueAtRisk, type LostQuery } from "@/components/dashboard/revenue-at-risk";
import { TrendChart, type Snapshot } from "@/components/dashboard/trend-chart";
import { CustomQueries } from "@/components/dashboard/custom-queries";
import { BenchmarkCard } from "@/components/dashboard/benchmark-card";
import { getCitationPlanLimits } from "@/lib/billing/citation-plans";
import {
  RefreshCw,
  Loader2,
  ArrowRight,
  FileText,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

interface MomentumData {
  score: number;
  change: number;
  trend: "gaining" | "losing" | "stable";
  citationsWon: number;
  citationsLost: number;
  queriesWon: number;
  queriesTotal: number;
  sourceCoverage: number;
  topCompetitor: { domain: string; citations: number } | null;
}

interface SprintData {
  progress: {
    totalActions: number;
    completedActions: number;
    percentComplete: number;
    currentDay: number;
    currentWeek: number;
    daysRemaining: number;
    isComplete: boolean;
  };
  actions: Array<{
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
  }>;
}

interface NextActionData {
  id: string;
  title: string;
  description: string;
  priority: "critical" | "high" | "medium" | "low";
  estimatedMinutes: number;
  actionUrl?: string;
  category: "source" | "content" | "technical" | "monitoring";
}

interface CheckSnapshot {
  date: string;
  queriesWon: number;
  queriesLost: number;
  totalQueries: number;
}

interface ImprovementData {
  firstCheck: CheckSnapshot | null;
  latestCheck: CheckSnapshot | null;
  checksCount: number;
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const {
    currentSite,
    sites,
    loading: siteLoading,
    organization,
    runCheck,
  } = useSite();

  const isWelcome = searchParams.get("welcome") === "true";

  // State
  const [momentum, setMomentum] = useState<MomentumData | null>(null);
  const [sprint, setSprint] = useState<SprintData | null>(null);
  const [nextAction, setNextAction] = useState<NextActionData | null>(null);
  const [improvement, setImprovement] = useState<ImprovementData | null>(null);
  const [listings, setListings] = useState<{ listedCount: number } | null>(null);
  const [generatedPages, setGeneratedPages] = useState<
    Array<{ id: string; query: string; status: string; wordCount: number | null; updatedAt: string | null }>
  >([]);
  const [checkResult, setCheckResult] = useState<{ lostQueries: LostQuery[] } | null>(null);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [benchmark, setBenchmark] = useState<{
    domain: string;
    totalRecommendations: number;
    percentileRank: number;
    totalDomainsTracked: number;
    platforms: string[];
    weekOverWeek: { current: number; previous: number; change: number; changePercent: number };
  } | null>(null);
  const [customQueries, setCustomQueries] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  // Fetch all dashboard data
  const fetchDashboardData = useCallback(async () => {
    if (!currentSite?.id) return;

    setLoading(true);
    try {
      // Fetch dashboard data in parallel
      const [momentumRes, sprintRes, nextActionRes, listingsRes, pagesRes, improvementRes, lostQueriesRes, historyRes, benchmarkRes] =
        await Promise.all([
          fetch(`/api/geo/momentum?siteId=${currentSite.id}`).catch(() => null),
          fetch(`/api/geo/sprint?siteId=${currentSite.id}`).catch(() => null),
          fetch(`/api/geo/next-action?siteId=${currentSite.id}`).catch(() => null),
          fetch(`/api/sites/listings?siteId=${currentSite.id}`).catch(() => null),
          fetch(`/api/geo/pages?siteId=${currentSite.id}`).catch(() => null),
          fetch(`/api/geo/improvement?siteId=${currentSite.id}`).catch(() => null),
          fetch(`/api/geo/lost-queries?siteId=${currentSite.id}`).catch(() => null),
          fetch(`/api/geo/history?siteId=${currentSite.id}`).catch(() => null),
          fetch(`/api/geo/benchmark?siteId=${currentSite.id}`).catch(() => null),
        ]);

      // Parse momentum
      if (momentumRes?.ok) {
        const data = await momentumRes.json();
        setMomentum(data.data || data);
      } else {
        // Fallback momentum from site data
        const won = currentSite.citationsThisWeek || 0;
        const last = currentSite.citationsLastWeek || 0;
        const total = currentSite.totalCitations || 0;
        const change = last > 0 ? Math.round(((won - last) / last) * 100) : 0;
        setMomentum({
          score: Math.min(100, total * 5),
          change,
          trend: change > 0 ? "gaining" : change < 0 ? "losing" : "stable",
          citationsWon: won,
          citationsLost: Math.max(0, last - won),
          queriesWon: total,
          queriesTotal: total,
          sourceCoverage: 0,
          topCompetitor: null,
        });
      }

      // Parse sprint
      if (sprintRes?.ok) {
        const data = await sprintRes.json();
        setSprint(data.data);
      }

      // Parse next action
      if (nextActionRes?.ok) {
        const data = await nextActionRes.json();
        setNextAction(data.data || data);
      }

      // Parse listings (for first citation goal)
      if (listingsRes?.ok) {
        const data = await listingsRes.json();
        setListings({ listedCount: data.listedCount || 0 });
      }
      // Parse generated pages (for fix pipeline + impact stats)
      if (pagesRes?.ok) {
        const data = await pagesRes.json();
        const pages = data.data?.pages || [];
        setGeneratedPages(
          pages.map((p: { id: string; query: string; status: string; wordCount: number | null; updatedAt: string | null }) => ({
            id: p.id,
            query: p.query,
            status: p.status,
            wordCount: p.wordCount,
            updatedAt: p.updatedAt,
          }))
        );
      }
      // Parse improvement (before/after)
      if (improvementRes?.ok) {
        const data = await improvementRes.json();
        setImprovement(data.data || null);
      }
      // Parse persisted lost queries (so they survive page refresh)
      if (lostQueriesRes?.ok) {
        const data = await lostQueriesRes.json();
        const lostQueries = data.data?.lostQueries || [];
        if (lostQueries.length > 0) {
          setCheckResult({ lostQueries });
        }
      }
      // Parse historical snapshots for trend chart
      if (historyRes?.ok) {
        const data = await historyRes.json();
        setSnapshots(data.data?.snapshots || []);
      }
      // Parse benchmark data
      if (benchmarkRes?.ok) {
        const data = await benchmarkRes.json();
        setBenchmark(data.data || null);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [currentSite]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Handle check
  const handleCheck = async () => {
    if (checking) return;
    setChecking(true);
    try {
      const result = await runCheck();
      if (result) {
        setCheckResult({ lostQueries: result.lostQueries });
      }
      await fetchDashboardData();
    } finally {
      setChecking(false);
    }
  };

  // Handle sprint action complete/skip
  const handleSprintAction = async (actionId: string, status: "completed" | "skipped", proofUrl?: string, notes?: string) => {
    try {
      await fetch("/api/geo/sprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionId, status, proofUrl, notes }),
      });
      // Re-fetch sprint data
      const res = await fetch(`/api/geo/sprint?siteId=${currentSite?.id}`);
      if (res.ok) {
        const data = await res.json();
        setSprint(data.data);
      }
    } catch (err) {
      console.error("Sprint action error:", err);
    }
  };

  // Initialize custom queries from site data
  useEffect(() => {
    if (currentSite) {
      setCustomQueries(currentSite.customQueries || []);
    }
  }, [currentSite]);

  // Redirect to onboarding if no sites
  if (!siteLoading && sites.length === 0) {
    router.push("/onboarding");
    return null;
  }

  const plan = organization?.plan || "free";
  const isPaid = plan !== "free";
  const planLimits = getCitationPlanLimits(plan);
  const maxCustomQueries = planLimits.customQueriesPerSite;

  // Build pages map for fix pipeline (query → page info)
  const pagesMap = new Map(
    generatedPages.map((p) => [p.query.toLowerCase(), { id: p.id, status: p.status }])
  );
  const pagesGenerated = generatedPages.length;
  const totalWords = generatedPages.reduce((sum, p) => sum + (p.wordCount || 0), 0);
  const publishedPages = generatedPages.filter((p) => p.status === "published");
  const lastCheckDate = currentSite?.lastCheckedAt ? new Date(currentSite.lastCheckedAt) : null;
  const pagesPublishedSinceLastCheck = publishedPages.filter((p) => {
    if (!lastCheckDate || !p.updatedAt) return true; // no check yet = needs re-check
    return new Date(p.updatedAt) > lastCheckDate;
  });
  const needsFollowUpCheck = pagesPublishedSinceLastCheck.length > 0;

  const totalCitations = currentSite?.totalCitations || 0;
  const showFirstCitationGoal = totalCitations === 0;
  const goalSteps = showFirstCitationGoal
    ? [
        {
          label: "Set up your trust sources",
          completed: (listings?.listedCount || 0) > 0,
          href: "/dashboard/sources",
        },
        {
          label: "Run your first AI check",
          completed: !!currentSite?.lastCheckedAt,
        },
        {
          label: "Get your first citation",
          completed: totalCitations > 0,
        },
      ]
    : [];

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {currentSite?.domain || "Dashboard"}
          </h1>
          <p className="text-zinc-500 text-sm">
            Your AI visibility command center
          </p>
        </div>
        <button
          onClick={handleCheck}
          disabled={checking}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {checking ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Checking...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Run Check
            </>
          )}
        </button>
      </div>

      {/* Welcome banner */}
      {isWelcome && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
          <p className="text-emerald-300 font-medium">
            Your first scan is running. We&apos;re checking which competitors AI recommends instead of you — results appear below.
          </p>
        </div>
      )}

      {/* First Citation Goal (shown when 0 citations) */}
      {showFirstCitationGoal && (
        <FirstCitationGoal
          steps={goalSteps}
          loading={loading}
          onRecheck={handleCheck}
          checking={checking}
        />
      )}

      {/* Row 1: Momentum Score + Do This Next */}
      <div className="grid lg:grid-cols-2 gap-6">
        <MomentumScore
          score={momentum?.score || 0}
          change={momentum?.change || 0}
          trend={momentum?.trend || "stable"}
          queriesWon={momentum?.queriesWon || 0}
          queriesTotal={momentum?.queriesTotal || 0}
          loading={loading}
        />
        <DoThisNext action={nextAction} loading={loading} />
      </div>

      {/* Your Improvement (before/after) */}
      {improvement && improvement.checksCount >= 2 && improvement.firstCheck && improvement.latestCheck ? (
        (() => {
          const wonDelta = improvement.latestCheck.queriesWon - improvement.firstCheck.queriesWon;
          const lostDelta = improvement.latestCheck.queriesLost - improvement.firstCheck.queriesLost;
          const isImproving = wonDelta > 0 || lostDelta < 0;
          const formatDate = (d: string) =>
            new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });

          return (
            <div className={`rounded-2xl p-6 border ${isImproving ? "border-emerald-500/20 bg-emerald-500/5" : "border-zinc-800 bg-zinc-900"}`}>
              <div className="flex items-center gap-2 mb-4">
                {isImproving ? (
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-zinc-400" />
                )}
                <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wide">
                  Your Improvement
                </h3>
                <span className="text-xs text-zinc-600 ml-auto">
                  Based on {improvement.checksCount} checks
                </span>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-4">
                <div>
                  <p className="text-xs text-zinc-500 mb-1">
                    First Check ({formatDate(improvement.firstCheck.date)})
                  </p>
                  <p className="text-lg font-semibold text-zinc-400">
                    {improvement.firstCheck.queriesWon} of {improvement.firstCheck.totalQueries} queries won
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 mb-1">
                    Latest Check ({formatDate(improvement.latestCheck.date)})
                  </p>
                  <p className="text-lg font-semibold text-white">
                    {improvement.latestCheck.queriesWon} of {improvement.latestCheck.totalQueries} queries won
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-3 border-t border-zinc-800">
                {wonDelta !== 0 && (
                  <span className={`text-sm font-medium ${wonDelta > 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {wonDelta > 0 ? "+" : ""}{wonDelta} queries won
                  </span>
                )}
                {lostDelta !== 0 && (
                  <span className={`text-sm font-medium ${lostDelta < 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {lostDelta < 0 ? "" : "+"}{lostDelta} queries lost
                  </span>
                )}
                {wonDelta === 0 && lostDelta === 0 && (
                  <span className="text-sm text-zinc-500">No change yet — keep publishing Authority Pages</span>
                )}
              </div>
            </div>
          );
        })()
      ) : improvement && improvement.checksCount < 2 ? (
        <div className="rounded-2xl p-4 border border-zinc-800 bg-zinc-900">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-zinc-500" />
            <span className="text-sm text-zinc-500">
              Run another check to start tracking your improvement
            </span>
          </div>
        </div>
      ) : null}

      {/* AI Visibility Over Time */}
      <TrendChart snapshots={snapshots} loading={loading} />

      {/* Industry Benchmark */}
      <BenchmarkCard
        domain={benchmark?.domain || currentSite?.domain || ""}
        totalRecommendations={benchmark?.totalRecommendations || 0}
        percentileRank={benchmark?.percentileRank || 0}
        totalDomainsTracked={benchmark?.totalDomainsTracked || 0}
        platforms={benchmark?.platforms || []}
        weekOverWeek={benchmark?.weekOverWeek || { current: 0, previous: 0, change: 0, changePercent: 0 }}
        loading={loading}
      />

      {/* Queries You're Losing */}
      <RevenueAtRisk
        queriesLost={(momentum?.queriesTotal || 0) - (momentum?.queriesWon || 0)}
        queriesTotal={momentum?.queriesTotal || 0}
        topCompetitor={momentum?.topCompetitor}
        lostQueries={checkResult?.lostQueries}
        existingPages={pagesMap}
        checking={checking}
        loading={loading}
        onRunCheck={handleCheck}
      />

      {/* Custom Query Tracking */}
      {currentSite && (
        <CustomQueries
          siteId={currentSite.id}
          queries={customQueries}
          maxQueries={maxCustomQueries}
          onUpdate={setCustomQueries}
        />
      )}

      {/* Impact stats (shown when pages have been generated) */}
      {pagesGenerated > 0 && (
        <div className="flex items-center gap-6 px-4 py-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-emerald-300">
              {pagesGenerated} authority page{pagesGenerated !== 1 ? "s" : ""} generated
            </span>
          </div>
          {totalWords > 0 && (
            <span className="text-sm text-zinc-500">
              {totalWords.toLocaleString()} words of AI-optimized content
            </span>
          )}
        </div>
      )}

      {/* Follow-up check nudge (when pages published since last check) */}
      {needsFollowUpCheck && !checking && (
        <div className="rounded-2xl p-5 border border-amber-500/20 bg-amber-500/5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-semibold text-sm mb-1">
                {pagesPublishedSinceLastCheck.length} page{pagesPublishedSinceLastCheck.length !== 1 ? "s" : ""} published since your last check
              </h3>
              <p className="text-zinc-400 text-sm">
                Run a follow-up check to see if AI is starting to recommend you for these queries.
              </p>
            </div>
            <button
              onClick={handleCheck}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors flex-shrink-0 ml-4"
            >
              <RefreshCw className="w-4 h-4" />
              Re-Check Now
            </button>
          </div>
        </div>
      )}

      {/* Sprint Progress (full width for paid users) */}
      {isPaid ? (
        <SprintProgress
          progress={
            sprint?.progress || {
              totalActions: 0,
              completedActions: 0,
              percentComplete: 0,
              currentDay: 1,
              currentWeek: 1,
              daysRemaining: 30,
              isComplete: false,
            }
          }
          actions={sprint?.actions || []}
          onComplete={(id, proofUrl, notes) => handleSprintAction(id, "completed", proofUrl, notes)}
          onSkip={(id) => handleSprintAction(id, "skipped")}
          loading={loading}
        />
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-2">
            30-Day AI Visibility Sprint
          </h3>
          <p className="text-red-400/80 text-sm mb-2">
            Every recommendation you&apos;re missing is a customer going to a competitor you can&apos;t track.
          </p>
          <p className="text-zinc-400 text-sm mb-4">
            Get a structured 4-week program to become AI&apos;s recommended choice.
            Week-by-week actions, progress tracking, and momentum scoring.
          </p>
          <Link
            href="/settings/billing"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition-colors"
          >
            Upgrade to Scout
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
