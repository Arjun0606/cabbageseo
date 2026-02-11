"use client";

/**
 * DASHBOARD — Score → Task → Progress
 *
 * Three zones:
 * 1. Score Hero (full-width momentum score)
 * 2. The Task (single action card — first citation goal, next action, or recheck)
 * 3. Progress (collapsible — improvement, lost queries, sprint)
 */

import { useState, Suspense, useEffect } from "react";
import { toast } from "sonner";
import { useSearchParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useSite } from "@/context/site-context";
import { MomentumScore } from "@/components/dashboard/momentum-score";
import { SprintProgress } from "@/components/dashboard/sprint-progress";
import { DoThisNext } from "@/components/dashboard/do-this-next";
import { FirstCitationGoal } from "@/components/dashboard/first-citation-goal";
import { RevenueAtRisk, type LostQuery } from "@/components/dashboard/revenue-at-risk";
import { ROISummary } from "@/components/dashboard/roi-summary";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { FixPagesReady } from "@/components/dashboard/fix-pages-ready";
import { RecheckResult } from "@/components/dashboard/recheck-result";
import {
  useMomentum,
  useNextAction,
  useListings,
  useHistory,
  useGeneratedPages,
  useImprovement,
  useOpportunities,
  useAudit,
  useSprint,
  useLostQueries,
} from "@/hooks/api/queries";
import { useSprintAction, useInvalidateDashboard } from "@/hooks/api/mutations";
import {
  RefreshCw,
  Loader2,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  Sparkles,
  Target,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { useCheckout } from "@/hooks/use-checkout";

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    currentSite,
    sites,
    loading: siteLoading,
    organization,
    usage,
    runCheck,
  } = useSite();
  const { checkout, loading: checkoutLoading } = useCheckout();

  const siteId = currentSite?.id;

  // ── React Query hooks (replace 15+ useState + 5 useEffect patterns) ──
  const { data: momentum, isLoading: momentumLoading } = useMomentum(siteId);
  const { data: nextAction } = useNextAction(siteId);
  const { data: listings } = useListings(siteId);
  const { data: snapshots = [] } = useHistory(siteId);
  const { data: generatedPages = [], isLoading: pagesLoading } = useGeneratedPages(siteId);
  const { data: improvement } = useImprovement(siteId);
  const { data: oppsData } = useOpportunities(siteId);
  const { data: auditData } = useAudit(siteId);

  // Deferred data — only load when progress section is open
  const [showProgress, setShowProgress] = useState(false);
  const { data: sprint } = useSprint(siteId, showProgress);
  const { data: lostQueries = [] } = useLostQueries(siteId, showProgress);

  // Mutations
  const sprintAction = useSprintAction(siteId);
  const invalidateDashboard = useInvalidateDashboard(siteId);

  // UI state (the only manual state left)
  const [checking, setChecking] = useState(false);
  const [showRecheckResult, setShowRecheckResult] = useState(false);
  const [recheckDelta, setRecheckDelta] = useState<{
    beforeWon: number; afterWon: number; beforeTotal: number; afterTotal: number; delta: number;
  } | null>(null);

  // First-scan detection
  const justScanned = searchParams.get("justScanned") === "true";
  const [generatingPages, setGeneratingPages] = useState(justScanned);
  const [generationTimedOut, setGenerationTimedOut] = useState(false);

  // Poll for auto-generated pages after first scan
  useEffect(() => {
    if (!justScanned || !siteId || !generatingPages) return;

    const drafts = generatedPages.filter((p) => p.status === "draft");
    if (drafts.length > 0) {
      setGeneratingPages(false);
      setGenerationTimedOut(false);
      return;
    }

    // Keep polling via React Query refetch
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["pages", siteId] });
    }, 3000);

    const timeout = setTimeout(() => {
      setGeneratingPages(false);
      setGenerationTimedOut(true);
      clearInterval(interval);
    }, 180000);

    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [justScanned, siteId, generatingPages, generatedPages, queryClient]);

  // ── Handlers ──

  const handleCheck = async () => {
    if (checking) return;

    const beforeWon = momentum?.queriesWon || 0;
    const beforeTotal = momentum?.queriesTotal || 0;

    setChecking(true);
    setShowRecheckResult(false);
    try {
      await runCheck();
      invalidateDashboard();

      // Wait for fresh momentum data for delta display
      if (beforeTotal > 0 && siteId) {
        try {
          const freshRes = await fetch(`/api/geo/momentum?siteId=${siteId}`);
          if (freshRes.ok) {
            const freshData = await freshRes.json();
            const after = freshData.data || freshData;
            const afterWon = after.queriesWon || 0;
            const afterTotal = after.queriesTotal || 0;
            setRecheckDelta({
              beforeWon,
              afterWon,
              beforeTotal,
              afterTotal,
              delta: afterWon - beforeWon,
            });
            setShowRecheckResult(true);
          }
        } catch {
          // Non-fatal — skip delta display
        }
      }
    } catch {
      toast.error("Check failed. Please try again.");
    } finally {
      setChecking(false);
    }
  };

  const handleActionComplete = async (actionId: string) => {
    try {
      await sprintAction.mutateAsync({ actionId, status: "completed" });
      toast.success("Action completed");
    } catch {
      toast.error("Failed to save. Please try again.");
    }
  };

  const handleActionSkip = async (actionId: string) => {
    sprintAction.mutate({ actionId, status: "skipped" });
  };

  const handleSprintAction = async (
    actionId: string,
    status: "completed" | "skipped",
    proofUrl?: string,
    notes?: string
  ) => {
    sprintAction.mutate({ actionId, status, proofUrl, notes });
  };

  const handleMarkPublished = (pageId: string) => {
    // Optimistic update via React Query cache
    queryClient.setQueryData(["pages", siteId], (old: typeof generatedPages | undefined) =>
      (old || []).map((p) => (p.id === pageId ? { ...p, status: "published" } : p))
    );
  };

  // ── Derived state ──

  if (!siteLoading && sites.length === 0) {
    router.push("/onboarding");
    return null;
  }

  const loading = momentumLoading || pagesLoading;
  const plan = organization?.plan || "free";
  const isPaid = plan !== "free";
  const totalCitations = currentSite?.totalCitations || 0;
  const showFirstCitationGoal = totalCitations === 0;

  const lastCheckDate = currentSite?.lastCheckedAt ? new Date(currentSite.lastCheckedAt) : null;
  const publishedPages = generatedPages.filter((p) => p.status === "published");
  const pagesPublishedSinceLastCheck = publishedPages.filter((p) => {
    if (!lastCheckDate || !p.updatedAt) return true;
    return new Date(p.updatedAt) > lastCheckDate;
  });
  const needsFollowUpCheck = pagesPublishedSinceLastCheck.length > 0 && totalCitations > 0;

  const goalSteps = showFirstCitationGoal
    ? [
        { label: "Set up your trust sources", completed: (listings?.listedCount || 0) > 0, href: "/dashboard/actions" },
        { label: "Run your first AI check", completed: !!currentSite?.lastCheckedAt },
        { label: "Get your first citation", completed: totalCitations > 0 },
      ]
    : [];

  const recentPages = generatedPages.filter((p) => p.status === "draft" || p.status === "published");
  const pagesMap = new Map(
    generatedPages.map((p) => [p.query.toLowerCase(), { id: p.id, status: p.status }])
  );

  // Content engine data (derived from opportunities)
  const contentEngineData = oppsData?.summary
    ? {
        open: oppsData.summary.open || 0,
        pagesGenerated: oppsData.summary.pagesGenerated || 0,
        pagesPublished: oppsData.summary.pagesPublished || 0,
        topOpportunity: oppsData.opportunities.find((o) => !o.hasPage)
          ? { query: oppsData.opportunities.find((o) => !o.hasPage)!.query }
          : null,
      }
    : null;

  const checksCount = improvement?.checksCount || 0;
  const queriesWonDelta =
    improvement?.latestCheck && improvement?.firstCheck
      ? improvement.latestCheck.queriesWon - improvement.firstCheck.queriesWon
      : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {currentSite?.domain || "Dashboard"}
          </h1>
          {plan !== "dominate" && !loading && (
            <p className="text-zinc-500 text-xs mt-0.5">
              {usage.sitesUsed}/{usage.sitesLimit} sites
              {" · "}
              {usage.checksUsed}/{usage.checksLimit === 999999 ? "∞" : usage.checksLimit} checks
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isPaid && currentSite?.id && (
            <a
              href={`/api/geo/citations/export?siteId=${currentSite.id}`}
              download
              className="flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-lg transition-colors border border-zinc-700"
              title="Export citations as CSV"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">CSV</span>
            </a>
          )}
          <button
            onClick={handleCheck}
            disabled={checking}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {checking ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Checking...</>
            ) : (
              <><RefreshCw className="w-4 h-4" />Run Check</>
            )}
          </button>
        </div>
      </div>

      {/* Welcome banner */}
      {searchParams.get("welcome") === "true" && (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3">
          <p className="text-emerald-300 text-sm font-medium">
            Your first AI visibility check is complete. Here&apos;s where you stand.
          </p>
        </div>
      )}

      {/* ═══ ZONE 1: Score Hero ═══ */}
      <MomentumScore
        score={momentum?.score ?? null}
        change={momentum?.change || 0}
        trend={momentum?.trend || "stable"}
        queriesWon={momentum?.queriesWon || 0}
        queriesTotal={momentum?.queriesTotal || 0}
        loading={loading}
        breakdown={momentum?.breakdown}
      />

      {/* ═══ RECHECK RESULT BANNER ═══ */}
      {showRecheckResult && recheckDelta && (
        <RecheckResult
          delta={recheckDelta}
          onDismiss={() => setShowRecheckResult(false)}
        />
      )}

      {/* ═══ ZONE 2: The Task ═══ */}
      {generationTimedOut && generatedPages.filter((p) => p.status === "draft").length === 0 ? (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-white font-semibold">
                Page generation is still running in the background
              </h3>
              <p className="text-zinc-400 text-sm">
                Check the <a href="/dashboard/pages" className="text-emerald-400 hover:text-emerald-300 underline">Pages tab</a> in a few minutes. Your fix pages are being created.
              </p>
            </div>
          </div>
        </div>
      ) : generatingPages ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
            <div className="flex-1">
              <h3 className="text-white font-semibold">Generating your fix pages...</h3>
              <p className="text-zinc-400 text-sm">
                Analyzing your lost queries and creating content to improve your AI visibility
              </p>
            </div>
            <Link href="/dashboard/pages" className="text-xs text-emerald-400 hover:text-emerald-300 shrink-0">
              View pages →
            </Link>
          </div>
        </div>
      ) : recentPages.length > 0 ? (
        <FixPagesReady pages={recentPages} onMarkPublished={handleMarkPublished} onRecheck={handleCheck} checking={checking} />
      ) : showFirstCitationGoal ? (
        <FirstCitationGoal steps={goalSteps} loading={loading} onRecheck={handleCheck} checking={checking} />
      ) : needsFollowUpCheck ? (
        <DoThisNext action={null} needsRecheck onRunCheck={handleCheck} checking={checking} />
      ) : (
        <DoThisNext action={nextAction ?? null} loading={loading} onComplete={handleActionComplete} onSkip={handleActionSkip} />
      )}

      {/* ═══ ZONE 3: Progress (collapsible) ═══ */}
      <div>
        <button
          onClick={() => setShowProgress(!showProgress)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 transition-colors"
        >
          <span className="text-sm text-zinc-400">
            {showProgress
              ? "Hide progress"
              : checksCount > 0
                ? `${checksCount} check${checksCount !== 1 ? "s" : ""} done${queriesWonDelta > 0 ? ` · +${queriesWonDelta} queries won` : ""} · Show progress`
                : "Show progress"}
          </span>
          {showProgress ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
        </button>

        {showProgress && (
          <div className="mt-4 space-y-6">
            {/* ROI Summary */}
            {improvement && improvement.checksCount >= 2 && improvement.firstCheck && improvement.latestCheck && (
              <ROISummary
                firstCheckDate={improvement.firstCheck.date}
                latestCheckDate={improvement.latestCheck.date}
                checksCount={improvement.checksCount}
                firstQueriesWon={improvement.firstCheck.queriesWon}
                firstQueriesTotal={improvement.firstCheck.totalQueries}
                latestQueriesWon={improvement.latestCheck.queriesWon}
                latestQueriesTotal={improvement.latestCheck.totalQueries}
                momentumScore={momentum?.score ?? null}
                loading={loading}
              />
            )}

            {/* Trend Chart */}
            <TrendChart snapshots={snapshots} loading={loading} />

            {/* Site Audit */}
            {!loading && isPaid && auditData && (
              <Link
                href="/dashboard/audit"
                className={`block border rounded-2xl p-5 hover:border-emerald-500/40 transition-colors group ${
                  auditData.hasAudit
                    ? "bg-gradient-to-r from-zinc-900 via-zinc-900 to-emerald-950/20 border-zinc-700/50"
                    : "bg-zinc-900 border-zinc-800 border-dashed"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className={`w-5 h-5 ${auditData.hasAudit ? "text-emerald-400" : "text-zinc-500"}`} />
                    <div>
                      <h3 className="text-white font-semibold text-sm">Site GEO Audit</h3>
                      <p className="text-zinc-400 text-xs">
                        {auditData.hasAudit
                          ? `Score: ${auditData.score}/100 (${auditData.grade}) · ${auditData.tipsCount} tips`
                          : "Analyze your pages for AI-citability"}
                      </p>
                    </div>
                  </div>
                  {auditData.hasAudit && auditData.score !== undefined && (
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      auditData.score >= 70 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                      auditData.score >= 40 ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                      "bg-red-500/10 text-red-400 border border-red-500/20"
                    }`}>
                      {auditData.score}
                    </span>
                  )}
                  {!auditData.hasAudit && (
                    <span className="text-xs text-emerald-400 font-medium">Run audit →</span>
                  )}
                </div>
              </Link>
            )}

            {/* Fix Pages */}
            {!loading && isPaid && contentEngineData && (contentEngineData.open > 0 || contentEngineData.pagesGenerated > 0) && (
              <Link
                href="/dashboard/pages"
                className="block bg-zinc-900 border border-zinc-800 rounded-2xl p-4 hover:border-emerald-500/40 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h3 className="text-white font-semibold text-sm">Fix Pages</h3>
                      <p className="text-zinc-400 text-xs">
                        {contentEngineData.open > 0
                          ? `${contentEngineData.open} citation gap${contentEngineData.open !== 1 ? "s" : ""} detected`
                          : `${contentEngineData.pagesGenerated} page${contentEngineData.pagesGenerated !== 1 ? "s" : ""} generated`}
                        {contentEngineData.pagesPublished > 0 && ` · ${contentEngineData.pagesPublished} published`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {contentEngineData.open > 0 && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-red-500/10 border border-red-500/20 rounded-full text-red-400 text-xs font-medium">
                        <Target className="w-3 h-3" />
                        {contentEngineData.open} open
                      </span>
                    )}
                    <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
                  </div>
                </div>
              </Link>
            )}

            {/* Lost Queries */}
            <RevenueAtRisk
              queriesLost={(momentum?.queriesTotal || 0) - (momentum?.queriesWon || 0)}
              queriesTotal={momentum?.queriesTotal || 0}
              lostQueries={lostQueries.length > 0 ? lostQueries : undefined}
              existingPages={pagesMap}
              checking={checking}
              loading={loading}
              onRunCheck={handleCheck}
            />

            {/* Sprint Progress (paid) / Upgrade CTA (free) */}
            {isPaid ? (
              <SprintProgress
                progress={sprint?.progress || {
                  totalActions: 0, completedActions: 0, percentComplete: 0,
                  currentDay: 1, currentWeek: 1, daysRemaining: 30, isComplete: false,
                }}
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
                  Get a structured 4-week program to become AI&apos;s recommended choice.
                </p>
                <button
                  onClick={() => checkout("scout", "yearly")}
                  disabled={checkoutLoading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  {checkoutLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>Upgrade to Scout — $39/mo<ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
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
