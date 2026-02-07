"use client";

/**
 * DASHBOARD — Sprint + Momentum
 *
 * New design:
 * 1. Sprint Progress (top) — "Day X of 30 — X/Y actions done"
 * 2. Momentum Score (hero) — "+23% this week" with trend
 * 3. Do This Next (single card) — ONE action, prominent
 * 4. Activity Feed — Recent changes
 * 5. Competitor Alerts — Who moved where
 */

import { useEffect, useState, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSite } from "@/context/site-context";
import { MomentumScore } from "@/components/dashboard/momentum-score";
import { SprintProgress } from "@/components/dashboard/sprint-progress";
import { DoThisNext } from "@/components/dashboard/do-this-next";
import { ActivityFeed, type ActivityItem } from "@/components/dashboard/activity-feed";
import { CompetitorAlerts } from "@/components/dashboard/competitor-alerts";
import {
  RefreshCw,
  Loader2,
  ArrowRight,
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

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const {
    currentSite,
    sites,
    loading: siteLoading,
    refreshData,
    organization,
    runCheck,
  } = useSite();

  const isWelcome = searchParams.get("welcome") === "true";

  // State
  const [momentum, setMomentum] = useState<MomentumData | null>(null);
  const [sprint, setSprint] = useState<SprintData | null>(null);
  const [nextAction, setNextAction] = useState<NextActionData | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [competitors, setCompetitors] = useState<
    Array<{
      domain: string;
      citationsThisWeek: number;
      citationsChange: number;
      queriesWon: string[];
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  // Fetch all dashboard data
  const fetchDashboardData = useCallback(async () => {
    if (!currentSite?.id) return;

    setLoading(true);
    try {
      // Fetch momentum, sprint, and next-action in parallel
      const [momentumRes, sprintRes, nextActionRes, citationsRes, competitorsRes] =
        await Promise.all([
          fetch(`/api/geo/momentum?siteId=${currentSite.id}`).catch(() => null),
          fetch(`/api/geo/sprint?siteId=${currentSite.id}`).catch(() => null),
          fetch(`/api/geo/next-action?siteId=${currentSite.id}`).catch(() => null),
          fetch(`/api/geo/citations?siteId=${currentSite.id}&full=true`).catch(() => null),
          fetch(`/api/seo/competitors?siteId=${currentSite.id}`).catch(() => null),
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
          queriesTotal: total + 5,
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

      // Parse citations into activity feed
      if (citationsRes?.ok) {
        const data = await citationsRes.json();
        const citations = data.citations || data.data?.citations || [];
        const activityItems: ActivityItem[] = citations
          .slice(0, 10)
          .map((c: { id: string; query: string; platform: string; cited_at: string }) => ({
            id: c.id,
            type: "citation_won" as const,
            title: `AI mentioned you for "${c.query}"`,
            description: `${c.platform} cited your site`,
            timestamp: c.cited_at || new Date().toISOString(),
          }));
        setActivity(activityItems);
      }

      // Parse competitors
      if (competitorsRes?.ok) {
        const data = await competitorsRes.json();
        const comps = data.competitors || data.data || [];
        setCompetitors(
          comps.map(
            (c: {
              domain: string;
              citations_this_week?: number;
              citationsThisWeek?: number;
              citations_change?: number;
              citationsChange?: number;
            }) => ({
              domain: c.domain,
              citationsThisWeek: c.citations_this_week || c.citationsThisWeek || 0,
              citationsChange: c.citations_change || c.citationsChange || 0,
              queriesWon: [],
            })
          )
        );
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
      await runCheck();
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

  // Redirect to onboarding if no sites
  if (!siteLoading && sites.length === 0) {
    router.push("/onboarding");
    return null;
  }

  const plan = organization?.plan || "free";
  const isPaid = plan !== "free";

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
            Welcome to CabbageSEO! Your first scan is running. Results will appear below.
          </p>
        </div>
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

      {/* Row 2: Sprint Progress (full width for paid users) */}
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
          <p className="text-zinc-400 text-sm mb-4">
            Get a structured 4-week program to become AI's recommended choice.
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

      {/* Row 3: Activity Feed + Competitor Alerts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <ActivityFeed items={activity} loading={loading} />
        <CompetitorAlerts competitors={competitors} loading={loading} />
      </div>
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
