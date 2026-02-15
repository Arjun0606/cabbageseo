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
import { useOpportunities, useGeneratedPages, useAudit } from "@/hooks/api/queries";
import type { AuditData } from "@/hooks/api/queries";
import { trackEvent } from "@/lib/analytics/posthog";
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
  Shield,
  Code,
  HelpCircle,
  User,
  List,
  Quote,
  CheckCircle2,
  ExternalLink,
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

// ── Site Health Issue Detection ──

interface SiteHealthIssue {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  severity: "red" | "amber";
  score: number; // for sorting by severity
}

function detectHealthIssues(audit: AuditData): SiteHealthIssue[] {
  if (!audit.hasAudit || !audit.breakdown) return [];

  const issues: SiteHealthIssue[] = [];
  const b = audit.breakdown;
  const raw = audit.rawData;

  // Score-based issues
  if (b.structuredData < 50) {
    issues.push({
      icon: Code,
      label: "Missing structured data — add FAQPage or Article schema",
      severity: b.structuredData < 30 ? "red" : "amber",
      score: b.structuredData,
    });
  } else if (raw && !raw.structuredDataFound.includes("FAQPage")) {
    issues.push({
      icon: HelpCircle,
      label: "No FAQ schema — AI extracts Q&A pairs from FAQPage markup",
      severity: "amber",
      score: 55,
    });
  }

  if (raw && !raw.hasAuthorInfo) {
    issues.push({
      icon: User,
      label: "No author bios found — AI trusts content with named experts",
      severity: b.authoritySignals < 40 ? "red" : "amber",
      score: b.authoritySignals,
    });
  } else if (b.authoritySignals < 50) {
    issues.push({
      icon: Shield,
      label: "Weak authority signals — link to authoritative sources (.edu, .gov)",
      severity: b.authoritySignals < 30 ? "red" : "amber",
      score: b.authoritySignals,
    });
  }

  if (b.contentClarity < 50) {
    issues.push({
      icon: List,
      label: "Poor heading structure — use clear H1 → H2 → H3 hierarchy",
      severity: b.contentClarity < 30 ? "red" : "amber",
      score: b.contentClarity,
    });
  }

  if (b.freshness < 40) {
    issues.push({
      icon: Clock,
      label: "Content appears outdated — add or update publication dates",
      severity: b.freshness < 25 ? "red" : "amber",
      score: b.freshness,
    });
  }

  if (b.citability < 50) {
    issues.push({
      icon: Quote,
      label: "Low citability — add specific stats, numbers, and quotable statements",
      severity: b.citability < 30 ? "red" : "amber",
      score: b.citability,
    });
  }

  if (raw && raw.pagesAnalyzed > 0 && raw.wordCount / raw.pagesAnalyzed < 800) {
    issues.push({
      icon: FileText,
      label: "Thin content — aim for 1,500+ words on key topic pages",
      severity: "amber",
      score: b.topicalDepth,
    });
  }

  // Sort by severity (lowest score first)
  issues.sort((a, b) => a.score - b.score);
  return issues.slice(0, 5);
}

const DIMENSION_LABELS: { key: keyof NonNullable<AuditData["breakdown"]>; label: string }[] = [
  { key: "contentClarity", label: "Content" },
  { key: "authoritySignals", label: "Authority" },
  { key: "structuredData", label: "Schema" },
  { key: "citability", label: "Citability" },
  { key: "freshness", label: "Freshness" },
  { key: "topicalDepth", label: "Depth" },
];

function scoreColor(score: number) {
  if (score >= 70) return "bg-emerald-500";
  if (score >= 40) return "bg-amber-500";
  return "bg-red-500";
}

function scoreTextColor(score: number) {
  if (score >= 70) return "text-emerald-400";
  if (score >= 40) return "text-amber-400";
  return "text-red-400";
}

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
  const { data: auditData } = useAudit(siteId);
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
  const [genElapsed, setGenElapsed] = useState(0);

  // Timer for generation progress feedback
  useEffect(() => {
    if (!generatePage.isPending) {
      setGenElapsed(0);
      return;
    }
    const interval = setInterval(() => setGenElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, [generatePage.isPending]);

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
      trackEvent("page_generation_started", { query: q });
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
            Auto-detected gaps in your AI visibility — one-click fix
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Fix Your AI Visibility</h2>
          <p className="text-zinc-400 max-w-md mx-auto mb-3">
            We scan AI platforms for queries where you&apos;re missing,
            then let you generate a targeted page with one click.
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
            Scout: 5 pages/mo &bull; Command: 25 pages/mo &bull; Dominate: 50 pages/mo
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
          <p className="text-zinc-500 text-sm mt-1">Auto-detected gaps in your AI visibility — one-click fix</p>
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

      {/* ═══ SITE HEALTH ═══ */}
      {auditData?.hasAudit && auditData.breakdown ? (() => {
        const issues = detectHealthIssues(auditData);
        const daysAgo = auditData.createdAt
          ? Math.floor((Date.now() - new Date(auditData.createdAt).getTime()) / 86400000)
          : null;

        return (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <h2 className="text-white font-semibold text-sm">Site Health</h2>
              </div>
              <div className="flex items-center gap-3">
                {daysAgo !== null && (
                  <span className="text-zinc-600 text-xs">
                    Audited {daysAgo === 0 ? "today" : daysAgo === 1 ? "yesterday" : `${daysAgo}d ago`}
                  </span>
                )}
                <Link
                  href="/dashboard/audit"
                  className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                >
                  Full audit <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Score overview row */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                  (auditData.score ?? 0) >= 70 ? "border-emerald-500 text-emerald-400" :
                  (auditData.score ?? 0) >= 40 ? "border-amber-500 text-amber-400" :
                  "border-red-500 text-red-400"
                }`}>
                  <span className="text-sm font-bold">{auditData.grade}</span>
                </div>
                <div>
                  <p className={`text-lg font-bold ${scoreTextColor(auditData.score ?? 0)}`}>{auditData.score}</p>
                  <p className="text-zinc-600 text-[10px] -mt-0.5">/ 100</p>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-6 gap-2">
                {DIMENSION_LABELS.map(({ key, label }) => {
                  const val = auditData.breakdown![key];
                  return (
                    <div key={key} className="text-center">
                      <p className="text-[10px] text-zinc-500 mb-1">{label}</p>
                      <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${scoreColor(val)} transition-all`}
                          style={{ width: `${val}%` }}
                        />
                      </div>
                      <p className={`text-[10px] mt-0.5 ${scoreTextColor(val)}`}>{val}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Issues checklist */}
            {issues.length > 0 ? (
              <div className="space-y-1.5 border-t border-zinc-800 pt-3">
                <p className="text-zinc-500 text-xs font-medium mb-2">Issues to fix</p>
                {issues.map((issue, i) => (
                  <div key={i} className="flex items-center gap-2.5 py-1">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      issue.severity === "red" ? "bg-red-400" : "bg-amber-400"
                    }`} />
                    <issue.icon className={`w-3.5 h-3.5 shrink-0 ${
                      issue.severity === "red" ? "text-red-400" : "text-amber-400"
                    }`} />
                    <span className="text-zinc-300 text-xs">{issue.label}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 border-t border-zinc-800 pt-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 text-xs">Your site structure looks good for AI citation</span>
              </div>
            )}
          </div>
        );
      })() : !auditData?.hasAudit && auditData !== undefined && auditData !== null ? (
        <div className="bg-zinc-900/50 border border-zinc-800/50 border-dashed rounded-xl p-5 text-center">
          <Shield className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
          <p className="text-zinc-400 text-sm mb-1">Run a Site Audit</p>
          <p className="text-zinc-600 text-xs mb-3">
            Check your heading structure, schema markup, author signals, and more
          </p>
          <Link
            href="/dashboard/audit"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium rounded-lg transition-colors"
          >
            <Shield className="w-3.5 h-3.5" />Run audit
          </Link>
        </div>
      ) : null}

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
              const missedCount = opp.missedPlatformCount ?? 1;
              const citedDomains = opp.citedDomains ?? [];
              const impactReason = opp.impactReason ?? "";
              return (
                <div key={opp.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-[10px] uppercase tracking-wider font-medium ${impactStyle.text}`}>{impactStyle.label}</span>
                        {missedCount >= 2 && (
                          <span className="text-[10px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">
                            Missed on {missedCount} platforms
                          </span>
                        )}
                        <span className="text-zinc-600 text-[10px]">{PLATFORM_LABELS[opp.platform] || opp.platform}</span>
                      </div>
                      <p className="text-white font-medium text-sm mb-1">&ldquo;{opp.query}&rdquo;</p>
                      {impactReason && (
                        <p className="text-zinc-500 text-xs mb-1">{impactReason}</p>
                      )}
                      {citedDomains.length > 0 && (
                        <p className="text-zinc-600 text-xs">
                          AI cited: {citedDomains.slice(0, 3).join(", ")}{citedDomains.length > 3 ? ` +${citedDomains.length - 3} more` : ""}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1">
                      <button
                        onClick={() => handleGenerate(opp.query)}
                        disabled={generatePage.isPending}
                        className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-black text-xs font-bold rounded-lg transition-colors"
                      >
                        {isGenerating ? (
                          <><Loader2 className="w-3.5 h-3.5 animate-spin" />Generating... {genElapsed > 0 ? `${genElapsed}s` : ""}</>
                        ) : (
                          <><Sparkles className="w-3.5 h-3.5" />Fix this</>
                        )}
                      </button>
                      {isGenerating && genElapsed >= 5 && (
                        <span className="text-[10px] text-zinc-500">
                          {genElapsed < 20 ? "Researching..." : genElapsed < 45 ? "Writing content..." : "Almost done..."}
                        </span>
                      )}
                    </div>
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
            {generatePage.isPending ? `Generating... ${genElapsed > 0 ? `${genElapsed}s` : ""}` : "Generate"}
          </button>
        </div>
        {generatePage.isPending && genElapsed >= 5 && (
          <p className="mt-2 text-zinc-500 text-xs">
            {genElapsed < 20 ? "Researching your topic..." : genElapsed < 45 ? "Writing 2,000-3,000 word page..." : "Almost done — finalizing content..."}
          </p>
        )}
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
