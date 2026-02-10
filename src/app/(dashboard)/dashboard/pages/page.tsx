"use client";

/**
 * FIX PAGES — The core product experience
 *
 * Three sections:
 * 1. Opportunities — auto-detected queries where competitors are cited, you aren't
 * 2. Generate — manual query input for custom pages
 * 3. Your Pages — library of generated fix pages with status
 *
 * This is what keeps founders subscribed: new opportunities appear,
 * fix pages get generated, scores improve, cycle repeats.
 */

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSite } from "@/context/site-context";
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

// ============================================
// TYPES
// ============================================

interface Opportunity {
  id: string;
  query: string;
  competitors: string[];
  platform: string;
  snippet: string;
  impact: "high" | "medium" | "low";
  hasPage: boolean;
  pageId: string | null;
  pageStatus: string | null;
}

interface OpportunitySummary {
  total: number;
  open: number;
  addressed: number;
  pagesGenerated: number;
  pagesPublished: number;
}

interface PageSummary {
  id: string;
  siteId: string;
  query: string;
  title: string;
  metaDescription: string | null;
  wordCount: number | null;
  aiModel: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

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

// ============================================
// CONTENT ENGINE PAGE
// ============================================

function ContentEngineContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentSite, organization } = useSite();

  // Data state
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [summary, setSummary] = useState<OpportunitySummary | null>(null);
  const [pages, setPages] = useState<PageSummary[]>([]);
  const [analyzedAt, setAnalyzedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Generation state
  const [generating, setGenerating] = useState<string | null>(null); // query being generated
  const [generateQuery, setGenerateQuery] = useState("");
  const [error, setError] = useState("");

  // UI state
  const [showAllOpps, setShowAllOpps] = useState(false);

  const plan = organization?.plan || "free";
  const canGenerate = plan !== "free";

  // Auto-generate from URL param
  const autoQuery = searchParams.get("generate");

  // ============================================
  // DATA FETCHING
  // ============================================

  const fetchData = useCallback(async () => {
    if (!currentSite?.id) return;
    setLoading(true);

    try {
      const [oppsRes, pagesRes] = await Promise.all([
        fetch(`/api/geo/opportunities?siteId=${currentSite.id}`).catch(() => null),
        fetch(`/api/geo/pages?siteId=${currentSite.id}`).catch(() => null),
      ]);

      if (oppsRes?.ok) {
        const data = await oppsRes.json();
        setOpportunities(data.data?.opportunities || []);
        setSummary(data.data?.summary || null);
        setAnalyzedAt(data.data?.analyzedAt || null);
      }

      if (pagesRes?.ok) {
        const data = await pagesRes.json();
        setPages(data.data?.pages || []);
      }
    } catch {
      // Sections show empty state
    } finally {
      setLoading(false);
    }
  }, [currentSite?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (autoQuery && currentSite?.id && canGenerate && !generating) {
      setGenerateQuery(autoQuery);
      handleGenerate(autoQuery);
    }
  }, [autoQuery, currentSite?.id]);

  // ============================================
  // GENERATION
  // ============================================

  const handleGenerate = async (queryOverride?: string) => {
    const q = queryOverride || generateQuery;
    if (!q.trim() || !currentSite?.id || generating) return;

    setGenerating(q);
    setError("");

    try {
      const res = await fetch("/api/geo/pages/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId: currentSite.id, query: q.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.upgradeRequired) {
          setError("Monthly page limit reached. Upgrade for more.");
        } else {
          setError(data.error || "Failed to generate page.");
        }
        return;
      }

      // Navigate to the new page
      if (data.data?.page?.id) {
        router.push(`/dashboard/pages/${data.data.page.id}`);
      } else {
        await fetchData();
        setGenerateQuery("");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setGenerating(null);
    }
  };

  const handleDelete = async (pageId: string) => {
    if (!confirm("Delete this generated page?")) return;

    try {
      const res = await fetch(`/api/geo/pages/${pageId}`, { method: "DELETE" });
      if (res.ok) {
        setPages((prev) => prev.filter((p) => p.id !== pageId));
        await fetchData(); // Refresh opportunities too
      }
    } catch {
      // Silent
    }
  };

  // ============================================
  // LOADING STATE
  // ============================================

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

  // ============================================
  // FREE USER — LOCKED STATE
  // ============================================

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
          <h2 className="text-xl font-semibold text-white mb-2">
            Fix Your AI Visibility
          </h2>
          <p className="text-zinc-400 max-w-md mx-auto mb-3">
            We detect queries where competitors get cited instead of you,
            then generate targeted pages to address those gaps.
          </p>
          <div className="flex flex-col items-center gap-2 mb-6">
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <Target className="w-4 h-4 text-emerald-400" />
              Auto-detect citation gaps
            </div>
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              One-click page generation
            </div>
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Track what&apos;s working
            </div>
          </div>
          <Link
            href="/settings/billing"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-colors"
          >
            <Zap className="w-5 h-5" />
            Unlock Fix Pages &mdash; $39/mo
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-zinc-600 text-xs mt-3">
            Scout: 3 pages/mo &bull; Command: 15 pages/mo &bull; Dominate: Unlimited
          </p>
        </div>
      </div>
    );
  }

  // ============================================
  // MAIN UI
  // ============================================

  const openOpps = opportunities.filter((o) => !o.hasPage);
  const addressedOpps = opportunities.filter((o) => o.hasPage);
  const visibleOpps = showAllOpps ? openOpps : openOpps.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Fix Pages</h1>
          <p className="text-zinc-500 text-sm mt-1">
            Targeted pages for every query you&apos;re losing
          </p>
        </div>
        {analyzedAt && (
          <p className="text-zinc-600 text-xs">
            Last scan: {new Date(analyzedAt).toLocaleDateString()}
          </p>
        )}
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

      {/* ═══ OPPORTUNITIES SECTION ═══ */}
      {openOpps.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wide">
                Citation Gaps &mdash; {openOpps.length} open
              </h2>
            </div>
          </div>

          <div className="space-y-2">
            {visibleOpps.map((opp) => {
              const impactStyle = IMPACT_STYLES[opp.impact];
              const isGenerating = generating === opp.query;
              return (
                <div
                  key={opp.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] uppercase tracking-wider font-medium ${impactStyle.text}`}>
                          {impactStyle.label}
                        </span>
                        <span className="text-zinc-600 text-[10px]">
                          {PLATFORM_LABELS[opp.platform] || opp.platform}
                        </span>
                      </div>
                      <p className="text-white font-medium text-sm mb-1.5">
                        &ldquo;{opp.query}&rdquo;
                      </p>
                      {opp.competitors.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {opp.competitors.slice(0, 4).map((c, j) => (
                            <span
                              key={j}
                              className="px-1.5 py-0.5 bg-red-500/5 border border-red-500/10 text-red-400 rounded text-[11px]"
                            >
                              {c}
                            </span>
                          ))}
                          {opp.competitors.length > 4 && (
                            <span className="text-zinc-600 text-[11px] self-center">
                              +{opp.competitors.length - 4} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleGenerate(opp.query)}
                      disabled={!!generating}
                      className="shrink-0 flex items-center gap-1.5 px-3 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-black text-xs font-bold rounded-lg transition-colors"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          Fix this
                        </>
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

      {/* Empty state — no opportunities */}
      {opportunities.length === 0 && pages.length === 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
          <Target className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            No opportunities detected yet
          </h3>
          <p className="text-zinc-400 text-sm max-w-md mx-auto mb-4">
            Run a citation check from your dashboard to detect queries where competitors
            are getting cited instead of you. Each gap becomes a content opportunity.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-lg transition-colors text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Go run a check
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
          Target any query &mdash; we use your citation data, competitor intel, and gap analysis.
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
            disabled={!generateQuery.trim() || !!generating}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-black text-sm font-bold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            {generating && generating === generateQuery ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
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
            <div
              key={opp.id}
              className="bg-zinc-900/50 border border-zinc-800/50 rounded-lg p-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-zinc-400 text-sm truncate">
                  &ldquo;{opp.query}&rdquo;
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                  opp.pageStatus === "published"
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-zinc-800 text-zinc-500"
                }`}>
                  {opp.pageStatus || "draft"}
                </span>
              </div>
              {opp.pageId && (
                <Link
                  href={`/dashboard/pages/${opp.pageId}`}
                  className="text-xs text-emerald-400 hover:text-emerald-300 shrink-0 ml-2"
                >
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
              <div
                key={page.id}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors group"
              >
                <div className="flex items-start justify-between mb-2">
                  <Link
                    href={`/dashboard/pages/${page.id}`}
                    className="flex-1 min-w-0"
                  >
                    <p className="text-xs text-emerald-400 mb-0.5 truncate">
                      &ldquo;{page.query}&rdquo;
                    </p>
                    <h3 className="text-white font-medium text-sm leading-tight group-hover:text-emerald-300 transition-colors line-clamp-2">
                      {page.title}
                    </h3>
                  </Link>
                  <button
                    onClick={() => handleDelete(page.id)}
                    className="p-1 text-zinc-600 hover:text-red-400 transition-colors ml-2 shrink-0"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                  {page.wordCount && (
                    <span className="flex items-center gap-1">
                      <Hash className="w-3 h-3" />
                      {page.wordCount.toLocaleString()} words
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(page.createdAt).toLocaleDateString()}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded ${
                    page.status === "published"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-zinc-800 text-zinc-400"
                  }`}>
                    {page.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
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
