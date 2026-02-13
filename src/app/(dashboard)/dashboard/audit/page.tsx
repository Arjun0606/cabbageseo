"use client";

/**
 * SITE GEO AUDIT PAGE
 *
 * Analyzes your site's pages for AI-citability. Shows an overall score,
 * per-dimension breakdowns, actionable tips, and raw analysis data.
 *
 * API:
 *   GET  /api/geo/audit?siteId=X  -> latest audit
 *   POST /api/geo/audit { siteId } -> run new audit
 */

import { useState, useEffect, useCallback } from "react";
import { useSite } from "@/context/site-context";
import { useCheckout } from "@/hooks/use-checkout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  BarChart3,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Clock,
  FileSearch,
  Lightbulb,
  Loader2,
  Lock,
  Puzzle,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";

// ============================================
// TYPES
// ============================================

interface ScoreBreakdown {
  contentClarity: number;
  authoritySignals: number;
  structuredData: number;
  citability: number;
  freshness: number;
  topicalDepth: number;
}

interface AuditTip {
  id: string;
  category: string;
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  impact: string;
}

interface AuditQuery {
  query: string;
  searchVolume: string;
  yourPosition: string;
  opportunity: boolean;
}

interface AuditOpportunity {
  query: string;
  platform: string;
  suggestedAction: string;
  difficulty: string;
}

interface AuditRawData {
  pagesAnalyzed: number;
  structuredDataFound: string[];
  headingsCount: number;
  listsCount: number;
  hasAuthorInfo: boolean;
  hasDates: boolean;
  wordCount: number;
  externalLinksCount: number;
}

interface AuditData {
  id: string | null;
  score: {
    overall: number;
    breakdown: ScoreBreakdown;
    grade: string;
    summary: string;
  };
  tips: AuditTip[];
  queries: AuditQuery[];
  opportunities: AuditOpportunity[];
  rawData: AuditRawData;
  createdAt: string;
}

// ============================================
// CONSTANTS
// ============================================

const SCORE_DIMENSIONS: {
  key: keyof ScoreBreakdown;
  label: string;
  icon: React.ElementType;
}[] = [
  { key: "contentClarity", label: "Content Clarity", icon: BookOpen },
  { key: "authoritySignals", label: "Authority Signals", icon: ShieldCheck },
  { key: "structuredData", label: "Structured Data", icon: Puzzle },
  { key: "citability", label: "Citability", icon: Sparkles },
  { key: "freshness", label: "Freshness", icon: Clock },
  { key: "topicalDepth", label: "Topical Depth", icon: BarChart3 },
];

const TIP_ICONS: Record<string, React.ElementType> = {
  Technical: Puzzle,
  "Content Structure": BookOpen,
  Authority: ShieldCheck,
  Content: Lightbulb,
  Maintenance: Clock,
};

const GRADE_COLORS: Record<string, string> = {
  "A+": "text-emerald-400",
  A: "text-emerald-400",
  "B+": "text-emerald-500",
  B: "text-lime-400",
  "C+": "text-amber-400",
  C: "text-amber-500",
  "D+": "text-red-400",
  D: "text-red-500",
  F: "text-red-600",
};

// ============================================
// HELPERS
// ============================================

function getBarColor(score: number): string {
  if (score >= 70) return "bg-emerald-500";
  if (score >= 40) return "bg-amber-500";
  return "bg-red-500";
}

function getBarBgColor(score: number): string {
  if (score >= 70) return "bg-emerald-500/10";
  if (score >= 40) return "bg-amber-500/10";
  return "bg-red-500/10";
}

function getImpactColor(priority: string): string {
  if (priority === "high") return "bg-red-500/10 text-red-400 border-red-500/20";
  if (priority === "medium") return "bg-amber-500/10 text-amber-400 border-amber-500/20";
  return "bg-zinc-800 text-zinc-400 border-zinc-700";
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ============================================
// SKELETON LOADER
// ============================================

function SkeletonLoader() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-pulse">
      {/* Header skeleton */}
      <div>
        <div className="h-8 w-48 bg-zinc-800 rounded-lg" />
        <div className="h-4 w-72 bg-zinc-800/60 rounded-lg mt-2" />
      </div>

      {/* Score overview skeleton */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center gap-6">
          <div className="w-28 h-28 bg-zinc-800 rounded-full" />
          <div className="flex-1 space-y-3">
            <div className="h-5 w-64 bg-zinc-800 rounded" />
            <div className="h-4 w-full bg-zinc-800/60 rounded" />
          </div>
        </div>
      </div>

      {/* Score bars skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="h-4 w-32 bg-zinc-800 rounded mb-3" />
            <div className="h-2.5 w-full bg-zinc-800 rounded-full" />
          </div>
        ))}
      </div>

      {/* Tips skeleton */}
      <div className="space-y-3">
        <div className="h-6 w-40 bg-zinc-800 rounded" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="h-4 w-48 bg-zinc-800 rounded mb-2" />
            <div className="h-3 w-full bg-zinc-800/60 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// RUNNING STATE
// ============================================

function RunningState() {
  const messages = [
    "Fetching your site pages...",
    "Analyzing content structure...",
    "Checking structured data...",
    "Evaluating authority signals...",
    "Measuring citability...",
    "Generating recommendations...",
  ];

  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-full border-2 border-emerald-500/20 flex items-center justify-center">
            <FileSearch className="w-8 h-8 text-emerald-500 animate-pulse" />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
            <Loader2 className="w-3.5 h-3.5 text-black animate-spin" />
          </div>
        </div>

        <h2 className="text-xl font-semibold text-white mb-2">
          Analyzing your site...
        </h2>
        <p className="text-zinc-400 text-sm mb-6 text-center max-w-sm">
          This usually takes 15-30 seconds. We&apos;re checking your pages the
          same way AI systems do.
        </p>

        {/* Animated step indicator */}
        <div className="w-full max-w-xs space-y-2">
          {messages.map((msg, i) => (
            <div
              key={msg}
              className={`flex items-center gap-2.5 text-sm transition-all duration-500 ${
                i < messageIndex
                  ? "text-emerald-400"
                  : i === messageIndex
                    ? "text-white"
                    : "text-zinc-600"
              }`}
            >
              {i < messageIndex ? (
                <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                </div>
              ) : i === messageIndex ? (
                <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full bg-zinc-800 flex-shrink-0" />
              )}
              {msg}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// EMPTY STATE
// ============================================

function EmptyState({ onRunAudit, running }: { onRunAudit: () => void; running: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[450px] text-center px-4">
      <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6">
        <FileSearch className="w-10 h-10 text-emerald-500" />
      </div>
      <h2 className="text-xl font-semibold text-white mb-2">
        No audit yet
      </h2>
      <p className="text-zinc-400 text-sm max-w-sm mb-6">
        Run your first GEO audit to see how AI-citable your site is.
        We&apos;ll analyze your pages, structured data, authority signals, and
        more.
      </p>
      <button
        onClick={onRunAudit}
        disabled={running}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-lg transition-colors disabled:opacity-50"
      >
        {running ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Running...
          </>
        ) : (
          <>
            <Zap className="w-4 h-4" />
            Run Your First Audit
          </>
        )}
      </button>
    </div>
  );
}

// ============================================
// UPGRADE CTA
// ============================================

function UpgradeCTA({ message }: { message: string }) {
  const { checkout, loading } = useCheckout();

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-5">
        <Lock className="w-8 h-8 text-amber-400" />
      </div>
      <h2 className="text-xl font-semibold text-white mb-2">
        Upgrade Required
      </h2>
      <p className="text-zinc-400 text-sm max-w-sm mb-6">{message}</p>
      <button
        onClick={() => checkout("scout", "yearly")}
        disabled={loading}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-lg transition-colors disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            Upgrade to Scout — $39/mo
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </div>
  );
}

// ============================================
// SCORE RING
// ============================================

function ScoreRing({ score, grade }: { score: number; grade: string }) {
  const circumference = 2 * Math.PI * 52;
  const filled = (score / 100) * circumference;
  const gradeColor = GRADE_COLORS[grade] || "text-zinc-400";

  return (
    <div className="relative w-32 h-32 flex-shrink-0">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        {/* Background circle */}
        <circle
          cx="60"
          cy="60"
          r="52"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-zinc-800"
        />
        {/* Score arc */}
        <circle
          cx="60"
          cy="60"
          r="52"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference}`}
          className={
            score >= 70
              ? "text-emerald-500"
              : score >= 40
                ? "text-amber-500"
                : "text-red-500"
          }
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-white">{score}</span>
        <span className={`text-sm font-semibold ${gradeColor}`}>{grade}</span>
      </div>
    </div>
  );
}

// ============================================
// SCORE BAR
// ============================================

function ScoreBar({
  label,
  score,
  icon: Icon,
}: {
  label: string;
  score: number;
  icon: React.ElementType;
}) {
  return (
    <div className={`rounded-xl border border-zinc-800 p-4 ${getBarBgColor(score)}`}>
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-zinc-400" />
          <span className="text-sm font-medium text-zinc-300">{label}</span>
        </div>
        <span
          className={`text-sm font-semibold ${
            score >= 70
              ? "text-emerald-400"
              : score >= 40
                ? "text-amber-400"
                : "text-red-400"
          }`}
        >
          {score}
          <span className="text-zinc-500 font-normal">/100</span>
        </span>
      </div>
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${getBarColor(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

// ============================================
// TIP CARD
// ============================================

function TipCard({ tip }: { tip: AuditTip }) {
  const Icon = TIP_ICONS[tip.category] || Lightbulb;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-emerald-500/10 rounded-lg flex-shrink-0 mt-0.5">
          <Icon className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h4 className="text-white font-medium text-sm">{tip.title}</h4>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${getImpactColor(tip.priority)}`}
            >
              {tip.priority} impact
            </span>
          </div>
          <p className="text-zinc-400 text-sm leading-relaxed mb-2">
            {tip.description}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400">
            <TrendingUp className="w-3 h-3" />
            {tip.impact}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// RAW DATA SECTION (Collapsible)
// ============================================

function RawDataSection({ rawData }: { rawData: AuditRawData }) {
  const [open, setOpen] = useState(false);

  const items = [
    { label: "Pages Analyzed", value: rawData.pagesAnalyzed },
    { label: "Total Word Count", value: rawData.wordCount.toLocaleString() },
    { label: "Headings Found", value: rawData.headingsCount },
    { label: "Lists Found", value: rawData.listsCount },
    { label: "External Links", value: rawData.externalLinksCount },
    { label: "Author Info", value: rawData.hasAuthorInfo ? "Found" : "Not found" },
    { label: "Publication Dates", value: rawData.hasDates ? "Found" : "Not found" },
  ];

  return (
    <div className="border border-zinc-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 hover:bg-zinc-900/50 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-zinc-500" />
          <span className="text-sm font-medium text-zinc-300">
            Raw Analysis Data
          </span>
        </div>
        {open ? (
          <ChevronDown className="w-4 h-4 text-zinc-500" />
        ) : (
          <ChevronRight className="w-4 h-4 text-zinc-500" />
        )}
      </button>

      {open && (
        <div className="border-t border-zinc-800 p-4 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {items.map((item) => (
              <div key={item.label} className="bg-zinc-800/30 rounded-lg p-3">
                <div className="text-xs text-zinc-500 mb-1">{item.label}</div>
                <div className="text-sm font-medium text-white">
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          {rawData.structuredDataFound.length > 0 && (
            <div>
              <div className="text-xs text-zinc-500 mb-2">
                Structured Data Types
              </div>
              <div className="flex flex-wrap gap-1.5">
                {rawData.structuredDataFound.map((type, i) => (
                  <Badge
                    key={`${type}-${i}`}
                    className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs"
                  >
                    {type}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {rawData.structuredDataFound.length === 0 && (
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <AlertCircle className="w-4 h-4" />
              No structured data (JSON-LD) found
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function AuditPage() {
  const { currentSite, loading: siteLoading } = useSite();

  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [audit, setAudit] = useState<AuditData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [upgradeRequired, setUpgradeRequired] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState("");

  // ------------------------------------------
  // Fetch existing audit
  // ------------------------------------------
  const fetchAudit = useCallback(async () => {
    if (!currentSite?.id) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/geo/audit?siteId=${currentSite.id}`);
      if (!res.ok) {
        if (res.status === 401) {
          setError("Please log in to view audits.");
        } else {
          setError("Failed to load audit data.");
        }
        setLoading(false);
        return;
      }

      const json = await res.json();

      if (json.success && json.data?.hasAudit && json.data.audit) {
        setAudit(json.data.audit);
      } else {
        setAudit(null);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [currentSite?.id]);

  // ------------------------------------------
  // Run a new audit
  // ------------------------------------------
  const runAudit = useCallback(async () => {
    if (!currentSite?.id || running) return;

    setRunning(true);
    setError(null);
    setUpgradeRequired(false);

    try {
      const res = await fetch("/api/geo/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId: currentSite.id }),
      });

      if (res.status === 403) {
        const data = await res.json();
        setUpgradeRequired(true);
        setUpgradeMessage(
          data.error || "You've reached your audit limit. Upgrade to run more audits."
        );
        setRunning(false);
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to run audit. Please try again.");
        setRunning(false);
        return;
      }

      const json = await res.json();

      if (json.success && json.data?.audit) {
        setAudit(json.data.audit);
      } else {
        setError("Unexpected response from audit. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setRunning(false);
    }
  }, [currentSite?.id, running]);

  // ------------------------------------------
  // Load audit on mount / site change
  // ------------------------------------------
  useEffect(() => {
    if (!siteLoading && currentSite?.id) {
      fetchAudit();
    } else if (!siteLoading && !currentSite?.id) {
      // No site available — stop loading so "no site" state renders
      setLoading(false);
    }
  }, [siteLoading, currentSite?.id, fetchAudit]);

  // ------------------------------------------
  // Render: site loading
  // ------------------------------------------
  if (siteLoading || (loading && !audit)) {
    return <SkeletonLoader />;
  }

  // ------------------------------------------
  // Render: running audit
  // ------------------------------------------
  if (running) {
    return <RunningState />;
  }

  // ------------------------------------------
  // Render: upgrade required
  // ------------------------------------------
  if (upgradeRequired) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <UpgradeCTA message={upgradeMessage} />
      </div>
    );
  }

  // ------------------------------------------
  // Render: no site selected
  // ------------------------------------------
  if (!currentSite) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <AlertCircle className="w-10 h-10 text-zinc-600 mb-4" />
          <h2 className="text-lg font-semibold text-white mb-1">No site selected</h2>
          <p className="text-zinc-400 text-sm">
            Add a site from the sidebar to get started with GEO audits.
          </p>
        </div>
      </div>
    );
  }

  // ------------------------------------------
  // Render: main page
  // ------------------------------------------
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">
            Site GEO Audit
          </h1>
          <p className="text-zinc-500 text-sm">
            Analyze your pages for AI-citability
          </p>
        </div>
        <Button
          onClick={runAudit}
          disabled={running}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-lg transition-colors disabled:opacity-50 self-start sm:self-auto"
        >
          {running ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Running...
            </>
          ) : audit ? (
            <>
              <RefreshCw className="w-4 h-4" />
              Re-run Audit
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Run GEO Audit
            </>
          )}
        </Button>
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Empty state */}
      {!audit && !error && (
        <EmptyState onRunAudit={runAudit} running={running} />
      )}

      {/* Audit results */}
      {audit && (
        <>
          {/* Score Overview */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <ScoreRing score={audit.score.overall} grade={audit.score.grade} />
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-lg font-semibold text-white mb-1">
                  Overall GEO Score
                </h2>
                <p className="text-zinc-400 text-sm leading-relaxed mb-3">
                  {audit.score.summary}
                </p>
                {audit.createdAt && (
                  <p className="text-xs text-zinc-600">
                    Last analyzed: {formatDate(audit.createdAt)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Score Breakdown */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-4">
              Score Breakdown
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SCORE_DIMENSIONS.map(({ key, label, icon }) => (
                <ScoreBar
                  key={key}
                  label={label}
                  score={audit.score.breakdown[key]}
                  icon={icon}
                />
              ))}
            </div>
          </section>

          {/* Tips Section */}
          {audit.tips.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5 text-emerald-500" />
                <h2 className="text-lg font-semibold text-white">
                  Actionable Tips
                </h2>
                <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs ml-1">
                  {audit.tips.length}
                </Badge>
              </div>
              <div className="space-y-3">
                {audit.tips
                  .sort((a, b) => {
                    const order = { high: 0, medium: 1, low: 2 };
                    return order[a.priority] - order[b.priority];
                  })
                  .map((tip) => (
                    <TipCard key={tip.id} tip={tip} />
                  ))}
              </div>
            </section>
          )}

          {/* Opportunities Section */}
          {audit.opportunities && audit.opportunities.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-emerald-500" />
                <h2 className="text-lg font-semibold text-white">
                  Citation Opportunities
                </h2>
              </div>
              <div className="space-y-2">
                {audit.opportunities.map((opp, i) => (
                  <div
                    key={`opp-${i}`}
                    className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-start gap-3"
                  >
                    <div className="p-2 bg-amber-500/10 rounded-lg flex-shrink-0">
                      <Search className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-white text-sm font-medium">
                          &ldquo;{opp.query}&rdquo;
                        </span>
                        <Badge className="bg-zinc-800 text-zinc-400 border border-zinc-700 text-[10px]">
                          {opp.platform}
                        </Badge>
                      </div>
                      <p className="text-zinc-400 text-sm">
                        {opp.suggestedAction}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Raw Data Section */}
          {audit.rawData && <RawDataSection rawData={audit.rawData} />}
        </>
      )}
    </div>
  );
}
