"use client";

/**
 * FIX PAGES — The core product experience
 *
 * Three sections:
 * 1. Opportunities — auto-detected queries where you're not getting cited by AI
 * 2. Generate — manual query input for custom pages
 * 3. Your Pages — library of generated fix pages with status
 */

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSite } from "@/context/site-context";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { getCitationPlan } from "@/lib/billing/citation-plans";
import { useOpportunities, useGeneratedPages } from "@/hooks/api/queries";
import { useGeneratePage, useDeletePage } from "@/hooks/api/mutations";
import {
  Sparkles,
  Loader2,
  Zap,
  ArrowRight,
  FileText,
  Target,
  Clock,
  Hash,
  Trash2,
  Check,
  AlertTriangle,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from "lucide-react";

const IMPACT_STYLES = {
  high: { bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-400", label: "High impact" },
  medium: { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-400", label: "Medium" },
  low: { bg: "bg-zinc-500/10", border: "border-zinc-500/20", text: "text-zinc-400", label: "Low" },
};

const PLATFORM_LABELS: Record<string, string> = {
  perplexity: "Perplexity",
  gemini: "Google AI",
  chatgpt: "ChatGPT",
};

function ContentEngineContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentSite, organization } = useSite();

  const siteId = currentSite?.id;
  const plan = organization?.plan || "free";
  const canGenerate = plan !== "free";

  // ── React Query hooks ──
  const { data: oppsData, isLoading: oppsLoading } = useOpportunities(siteId);
  const { data: pages = [], isLoading: pagesLoading } = useGeneratedPages(siteId);
  const generatePage = useGeneratePage(siteId);
  const deletePage = useDeletePage(siteId);

  const opportunities = oppsData?.opportunities || [];
  const summary = oppsData?.summary || null;
  const analyzedAt = oppsData?.analyzedAt || null;
  const loading = oppsLoading || pagesLoading;

  // UI state
  const [generateQuery, setGenerateQuery] = useState("");
  const [error, setError] = useState("");
  const [showAllOpps, setShowAllOpps] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const citationPlan = getCitationPlan(plan);
  const pagesLimit = citationPlan.intelligenceLimits.pagesPerMonth;
  const pagesUsed = summary?.pagesGenerated || 0;
  const pagesRemaining = pagesLimit === -1 ? Infinity : Math.max(0, pagesLimit - pagesUsed);

  // Auto-generate from URL param
  const autoQuery = searchParams.get("generate");
  useEffect(() => {
    if (autoQuery && siteId && canGenerate && !generatePage.isPending) {
      setGenerateQuery(autoQuery);
      handleGenerate(autoQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoQuery, siteId]);

  // ── Handlers ──

  const handleGenerate = async (queryOverride?: string) => {
    const q = queryOverride || generateQuery;
    if (!q.trim() || !siteId || generatePage.isPending) return;

    setError("");
    try {
      const data = await generatePage.mutateAsync({ query: q });
      if (data.data?.page?.id) {
        router.push(`/dashboard/pages/${data.data.page.id}`);
      } else {
        setGenerateQuery("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error. Please try again.");
    }
  };

  const handleDelete = async (pageId: string) => {
    try {
      await deletePage.mutateAsync({ pageId });
    } catch {
      // Silent — React Query will still show cached data
    }
  };

  // ── Loading ──

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-zinc-800 rounded-lg animate-pulse" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-zinc-800 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-40 bg-zinc-800 rounded-xl animate-pulse" />
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 bg-zinc-800 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // ── Free user locked state ──

  if (!canGenerate) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Fix Pages</h1>
          <p className="text-zinc-500 text-sm mt-1">
            Targeted pages for every query you&apos;re losing
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Fix Your AI Visibility</h2>
          <p className="text-zinc-400 max-w-md mx-auto mb-3">
            We detect queries where you&apos;re not getting cited by AI,
            then generate targeted pages to address those gaps.
          </p>
          <div className="flex flex-col items-center gap-2 mb-6">
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <Target className="w-4 h-4 text-emerald-400" />Auto-detect citation gaps
            </div>
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <Sparkles className="w-4 h-4 text-emerald-400" />One-click page generation
            </div>
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <TrendingUp className="w-4 h-4 text-emerald-400" />Track what&apos;s working
            </div>
          </div>
          <Link
            href="/settings/billing"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-colors"
          >
            <Zap className="w-5 h-5" />Unlock Fix Pages &mdash; $39/mo<ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-zinc-600 text-xs mt-3">
            Scout: 5 pages/mo &bull; Command: 25 pages/mo &bull; Dominate: Unlimited
          </p>
        </div>
      </div>
    );
  }

  // ── Main UI ──

  const openOpps = opportunities.filter((o) => !o.hasPage);
  const addressedOpps = opportunities.filter((o) => o.hasPage);
  const visibleOpps = showAllOpps ? openOpps : openOpps.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Fix Pages</h1>
          <p className="text-zinc-500 text-sm mt-1">Targeted pages for every query you&apos;re losing</p>
        </div>
        <div className="text-right">
          {canGenerate && (
            <p className="text-zinc-400 text-xs">
              {pagesLimit === -1
                ? `${pagesUsed} generated this month`
                : `${pagesRemaining} of ${pagesLimit} remaining this month`}
            </p>
          )}
          {analyzedAt && (
            <p className="text-zinc-600 text-xs mt-0.5">
              Last scan: {new Date(analyzedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      {/* Stats bar */}
      {summary && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl p-3.5 bg-zinc-900 border border-zinc-800">
            <div className="flex items-center gap-2 mb-1.5">
              <Target className="w-3.5 h-3.5 text-red-400" />
              <span className="text-xs text-zinc-500">Open gaps</span>
            </div>
            <p className="text-xl font-bold text-white">{summary.open}</p>
          </div>
          <div className="rounded-xl p-3.5 bg-zinc-900 border border-zinc-800">
            <div className="flex items-center gap-2 mb-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs text-zinc-500">Pages created</span>
            </div>
            <p className="text-xl font-bold text-white">{summary.pagesGenerated}</p>
          </div>
          <div className="rounded-xl p-3.5 bg-zinc-900 border border-zinc-800">
            <div className="flex items-center gap-2 mb-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs text-zinc-500">Published</span>
            </div>
            <p className="text-xl font-bold text-white">{summary.pagesPublished}</p>
          </div>
        </div>
      )}

      {/* ═══ OPPORTUNITIES ═══ */}
      {openOpps.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wide">
              Citation Gaps &mdash; {openOpps.length} open
            </h2>
          </div>

          <div className="space-y-2">
            {visibleOpps.map((opp) => {
              const impactStyle = IMPACT_STYLES[opp.impact];
              const isGenerating = generatePage.isPending && generatePage.variables?.query === opp.query;
              return (
                <div key={opp.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] uppercase tracking-wider font-medium ${impactStyle.text}`}>{impactStyle.label}</span>
                        <span className="text-zinc-600 text-[10px]">{PLATFORM_LABELS[opp.platform] || opp.platform}</span>
                      </div>
                      <p className="text-white font-medium text-sm mb-1.5">&ldquo;{opp.query}&rdquo;</p>
                    </div>
                    <button
                      onClick={() => handleGenerate(opp.query)}
                      disabled={generatePage.isPending}
                      className="shrink-0 flex items-center gap-1.5 px-3 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-black text-xs font-bold rounded-lg transition-colors"
                    >
                      {isGenerating ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" />Generating...</>
                      ) : (
                        <><Sparkles className="w-3.5 h-3.5" />Fix this</>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {openOpps.length > 5 && (
            <button
              onClick={() => setShowAllOpps(!showAllOpps)}
              className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors mx-auto"
            >
              {showAllOpps ? (
                <>Show less <ChevronUp className="w-3.5 h-3.5" /></>
              ) : (
                <>Show all {openOpps.length} gaps <ChevronDown className="w-3.5 h-3.5" /></>
              )}
            </button>
          )}
        </div>
      )}

      {/* Empty state */}
      {opportunities.length === 0 && pages.length === 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
          <Target className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No opportunities detected yet</h3>
          <p className="text-zinc-400 text-sm max-w-md mx-auto mb-4">
            Run a citation check from your dashboard to detect queries where you&apos;re
            not getting cited by AI. Each gap becomes a content opportunity.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-lg transition-colors text-sm"
          >
            <RefreshCw className="w-4 h-4" />Go run a check
          </Link>
        </div>
      )}

      {/* ═══ MANUAL GENERATE ═══ */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <h2 className="text-white font-semibold text-sm">Generate a custom page</h2>
        </div>
        <p className="text-zinc-500 text-xs mb-3">
          Target any query &mdash; we use your citation data, gap analysis, and GEO intelligence.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={generateQuery}
            onChange={(e) => setGenerateQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            placeholder='e.g. "best CRM tools for startups"'
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
          />
          <button
            onClick={() => handleGenerate()}
            disabled={!generateQuery.trim() || generatePage.isPending}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-black text-sm font-bold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            {generatePage.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Generate
          </button>
        </div>
        {error && <p className="mt-2 text-red-400 text-xs">{error}</p>}
      </div>

      {/* ═══ ADDRESSED OPPORTUNITIES ═══ */}
      {addressedOpps.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wide flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            Gaps addressed &mdash; {addressedOpps.length}
          </h2>
          {addressedOpps.map((opp) => (
            <div key={opp.id} className="bg-zinc-900/50 border border-zinc-800/50 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-zinc-400 text-sm truncate">&ldquo;{opp.query}&rdquo;</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                  opp.pageStatus === "published" ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-800 text-zinc-500"
                }`}>
                  {opp.pageStatus || "draft"}
                </span>
              </div>
              {opp.pageId && (
                <Link href={`/dashboard/pages/${opp.pageId}`} className="text-xs text-emerald-400 hover:text-emerald-300 shrink-0 ml-2">
                  View page
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ═══ ALL PAGES ═══ */}
      {pages.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wide">
            All generated pages &mdash; {pages.length}
          </h2>
          <div className="grid md:grid-cols-2 gap-3">
            {pages.map((page) => (
              <div key={page.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors group">
                <div className="flex items-start justify-between mb-2">
                  <Link href={`/dashboard/pages/${page.id}`} className="flex-1 min-w-0">
                    <p className="text-xs text-emerald-400 mb-0.5 truncate">&ldquo;{page.query}&rdquo;</p>
                    <h3 className="text-white font-medium text-sm leading-tight group-hover:text-emerald-300 transition-colors line-clamp-2">
                      {page.title}
                    </h3>
                  </Link>
                  <button
                    onClick={() => setDeleteTarget(page.id)}
                    className="p-1 text-zinc-600 hover:text-red-400 transition-colors ml-2 shrink-0"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-zinc-500 flex-wrap">
                  {page.wordCount && (
                    <span className="flex items-center gap-1">
                      <Hash className="w-3 h-3" />{page.wordCount.toLocaleString()} words
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />{new Date(page.createdAt).toLocaleDateString()}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded ${
                    page.status === "published" ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-800 text-zinc-400"
                  }`}>
                    {page.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
        title="Delete this page?"
        description="This action cannot be undone. The generated content will be permanently removed."
        confirmLabel="Delete"
        variant="destructive"
      />
    </div>
  );
}

export default function PagesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
        </div>
      }
    >
      <ContentEngineContent />
    </Suspense>
  );
}
