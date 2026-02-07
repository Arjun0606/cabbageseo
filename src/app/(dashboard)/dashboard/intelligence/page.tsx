"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSite } from "@/context/site-context";
import {
  Search,
  FileText,
  Target,
  Users,
  Loader2,
  Lock,
  Zap,
  ChevronDown,
  AlertCircle,
} from "lucide-react";

// ============================================
// TYPES
// ============================================

interface FeatureInfo {
  available: boolean;
  fullVersion?: boolean;
  unlimited?: boolean;
  used?: number;
  limit?: number;
  remaining?: number | string;
}

interface FeaturesData {
  gapAnalysis: FeatureInfo;
  contentRecommendations: FeatureInfo;
  actionPlan: FeatureInfo;
  competitorDeepDive: FeatureInfo;
}

interface CardState {
  loading: boolean;
  generating: boolean;
  result: Record<string, unknown> | null;
  error: string | null;
}

// ============================================
// RESULT RENDERER
// ============================================

function renderValue(value: unknown, depth: number = 0): React.ReactNode {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string") {
    return <p className="text-zinc-300 text-sm leading-relaxed">{value}</p>;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return <p className="text-zinc-300 text-sm">{String(value)}</p>;
  }

  if (Array.isArray(value)) {
    return (
      <ul className="space-y-1.5">
        {value.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
            <span className="text-emerald-500 mt-1 flex-shrink-0">&#8226;</span>
            <span>{typeof item === "object" ? renderValue(item, depth + 1) : String(item)}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    return (
      <div className={depth > 0 ? "ml-3 border-l border-zinc-700/50 pl-3" : ""}>
        {entries.map(([key, val]) => (
          <div key={key} className="mb-3 last:mb-0">
            <h4 className="text-zinc-200 text-sm font-medium capitalize mb-1">
              {key.replace(/([A-Z])/g, " $1").replace(/_/g, " ").trim()}
            </h4>
            {renderValue(val, depth + 1)}
          </div>
        ))}
      </div>
    );
  }

  return <p className="text-zinc-300 text-sm">{String(value)}</p>;
}

function ResultPanel({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="mt-4 bg-zinc-800/30 border border-zinc-700/30 rounded-xl p-6 space-y-4">
      {Object.entries(data).map(([key, value]) => (
        <div key={key}>
          <h3 className="text-white text-sm font-semibold uppercase tracking-wider mb-2">
            {key.replace(/([A-Z])/g, " $1").replace(/_/g, " ").trim()}
          </h3>
          {renderValue(value)}
        </div>
      ))}
    </div>
  );
}

// ============================================
// USAGE BADGE
// ============================================

function UsageBadge({ feature }: { feature: FeatureInfo }) {
  if (!feature.available) return null;

  if (feature.unlimited || feature.remaining === "unlimited") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-xs rounded-full">
        <Zap className="w-3 h-3" />
        Unlimited
      </span>
    );
  }

  if (typeof feature.used === "number" && typeof feature.limit === "number") {
    const isLow = typeof feature.remaining === "number" && feature.remaining <= 1;
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${
          isLow
            ? "bg-amber-500/10 text-amber-400"
            : "bg-zinc-700/50 text-zinc-400"
        }`}
      >
        {feature.used} of {feature.limit} used
      </span>
    );
  }

  return null;
}

// ============================================
// FEATURE CARDS
// ============================================

function GapAnalysisCard({
  feature,
  siteId,
}: {
  feature: FeatureInfo | null;
  siteId: string;
}) {
  const [query, setQuery] = useState("");
  const [state, setState] = useState<CardState>({
    loading: false,
    generating: false,
    result: null,
    error: null,
  });

  const isLocked = !feature?.available;

  const handleAnalyze = async () => {
    if (!query.trim() || state.generating) return;

    setState((s) => ({ ...s, generating: true, error: null, result: null }));

    try {
      const res = await fetch("/api/geo/intelligence/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "gap-analysis", siteId, query: query.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.upgradeRequired) {
          setState((s) => ({
            ...s,
            generating: false,
            error: "Upgrade required to use this feature.",
          }));
        } else {
          setState((s) => ({
            ...s,
            generating: false,
            error: data.error || "Something went wrong.",
          }));
        }
        return;
      }

      setState((s) => ({
        ...s,
        generating: false,
        result: data.data || {},
      }));
    } catch {
      setState((s) => ({
        ...s,
        generating: false,
        error: "Network error. Please try again.",
      }));
    }
  };

  if (isLocked) {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 opacity-60">
        <div className="flex items-start gap-3 mb-3">
          <div className="p-2 bg-zinc-800 rounded-lg">
            <Lock className="w-5 h-5 text-zinc-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-semibold">Citation Gap Analysis</h3>
            <p className="text-zinc-500 text-sm mt-0.5">
              Find out why AI cites your competitors instead of you
            </p>
          </div>
        </div>
        <p className="text-zinc-500 text-sm mb-3">Available on Scout plan</p>
        <Link
          href="/settings/billing"
          className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-colors"
        >
          <Zap className="w-4 h-4" />
          Upgrade to unlock
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <Search className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Citation Gap Analysis</h3>
            <p className="text-zinc-400 text-sm mt-0.5">
              Find out why AI cites your competitors instead of you
            </p>
          </div>
        </div>
        {feature && <UsageBadge feature={feature} />}
      </div>

      <div className="flex gap-2 mt-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
          placeholder="e.g., best CRM for startups"
          className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
        />
        <button
          onClick={handleAnalyze}
          disabled={!query.trim() || state.generating}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          {state.generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            "Analyze Gap"
          )}
        </button>
      </div>

      {state.error && (
        <div className="mt-3 flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {state.error}
        </div>
      )}

      {state.result && <ResultPanel data={state.result} />}
    </div>
  );
}

function ContentRecommendationsCard({
  feature,
  siteId,
}: {
  feature: FeatureInfo | null;
  siteId: string;
}) {
  const [state, setState] = useState<CardState>({
    loading: false,
    generating: false,
    result: null,
    error: null,
  });

  const isLocked = !feature?.available;

  const handleGenerate = async () => {
    if (state.generating) return;

    setState((s) => ({ ...s, generating: true, error: null, result: null }));

    try {
      const res = await fetch("/api/geo/intelligence/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "content-recommendations", siteId }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.upgradeRequired) {
          setState((s) => ({
            ...s,
            generating: false,
            error: "Upgrade required to use this feature.",
          }));
        } else {
          setState((s) => ({
            ...s,
            generating: false,
            error: data.error || "Something went wrong.",
          }));
        }
        return;
      }

      setState((s) => ({
        ...s,
        generating: false,
        result: data.data || {},
      }));
    } catch {
      setState((s) => ({
        ...s,
        generating: false,
        error: "Network error. Please try again.",
      }));
    }
  };

  if (isLocked) {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 opacity-60">
        <div className="flex items-start gap-3 mb-3">
          <div className="p-2 bg-zinc-800 rounded-lg">
            <Lock className="w-5 h-5 text-zinc-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-semibold">Content Ideas</h3>
            <p className="text-zinc-500 text-sm mt-0.5">
              AI-powered content recommendations to boost citations
            </p>
          </div>
        </div>
        <p className="text-zinc-500 text-sm mb-3">Available on Scout plan</p>
        <Link
          href="/settings/billing"
          className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-colors"
        >
          <Zap className="w-4 h-4" />
          Upgrade to unlock
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <FileText className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Content Ideas</h3>
            <p className="text-zinc-400 text-sm mt-0.5">
              AI-powered content recommendations to boost citations
            </p>
          </div>
        </div>
        {feature && <UsageBadge feature={feature} />}
      </div>

      <button
        onClick={handleGenerate}
        disabled={state.generating}
        className="mt-4 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
      >
        {state.generating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating...
          </>
        ) : (
          "Generate Ideas"
        )}
      </button>

      {state.error && (
        <div className="mt-3 flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {state.error}
        </div>
      )}

      {state.result && <ResultPanel data={state.result} />}
    </div>
  );
}

function ActionPlanCard({
  feature,
  siteId,
  plan,
}: {
  feature: FeatureInfo | null;
  siteId: string;
  plan: string;
}) {
  const [state, setState] = useState<CardState>({
    loading: false,
    generating: false,
    result: null,
    error: null,
  });

  const isLocked = !feature?.available || plan === "free" || plan === "scout";

  const handleGenerate = async () => {
    if (state.generating) return;

    setState((s) => ({ ...s, generating: true, error: null, result: null }));

    try {
      const res = await fetch("/api/geo/intelligence/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "action-plan", siteId }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.upgradeRequired) {
          setState((s) => ({
            ...s,
            generating: false,
            error: "Upgrade required to use this feature.",
          }));
        } else {
          setState((s) => ({
            ...s,
            generating: false,
            error: data.error || "Something went wrong.",
          }));
        }
        return;
      }

      setState((s) => ({
        ...s,
        generating: false,
        result: data.data || {},
      }));
    } catch {
      setState((s) => ({
        ...s,
        generating: false,
        error: "Network error. Please try again.",
      }));
    }
  };

  if (isLocked) {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 opacity-60">
        <div className="flex items-start gap-3 mb-3">
          <div className="p-2 bg-zinc-800 rounded-lg">
            <Lock className="w-5 h-5 text-zinc-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-semibold">Weekly Action Plan</h3>
            <p className="text-zinc-500 text-sm mt-0.5">
              Your personalized GEO playbook for this week
            </p>
          </div>
        </div>
        <p className="text-zinc-500 text-sm mb-3">Available on Command plan</p>
        <Link
          href="/settings/billing"
          className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-colors"
        >
          <Zap className="w-4 h-4" />
          Upgrade to unlock
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
      <div className="flex items-start gap-3 mb-3">
        <div className="p-2 bg-emerald-500/10 rounded-lg">
          <Target className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-white font-semibold">Weekly Action Plan</h3>
          <p className="text-zinc-400 text-sm mt-0.5">
            Your personalized GEO playbook for this week
          </p>
        </div>
      </div>

      <button
        onClick={handleGenerate}
        disabled={state.generating}
        className="mt-4 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
      >
        {state.generating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating...
          </>
        ) : (
          "Generate Plan"
        )}
      </button>

      {state.error && (
        <div className="mt-3 flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {state.error}
        </div>
      )}

      {state.result && <ResultPanel data={state.result} />}
    </div>
  );
}

function CompetitorDeepDiveCard({
  feature,
  siteId,
  plan,
}: {
  feature: FeatureInfo | null;
  siteId: string;
  plan: string;
}) {
  const [competitorDomain, setCompetitorDomain] = useState("");
  const [state, setState] = useState<CardState>({
    loading: false,
    generating: false,
    result: null,
    error: null,
  });

  const isLocked = !feature?.available || plan === "free" || plan === "scout";

  const handleAnalyze = async () => {
    if (!competitorDomain.trim() || state.generating) return;

    setState((s) => ({ ...s, generating: true, error: null, result: null }));

    try {
      const res = await fetch("/api/geo/intelligence/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "competitor-deep-dive",
          siteId,
          competitorId: competitorDomain.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.upgradeRequired) {
          setState((s) => ({
            ...s,
            generating: false,
            error: "Upgrade required to use this feature.",
          }));
        } else {
          setState((s) => ({
            ...s,
            generating: false,
            error: data.error || "Something went wrong.",
          }));
        }
        return;
      }

      setState((s) => ({
        ...s,
        generating: false,
        result: data.data || {},
      }));
    } catch {
      setState((s) => ({
        ...s,
        generating: false,
        error: "Network error. Please try again.",
      }));
    }
  };

  if (isLocked) {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 opacity-60">
        <div className="flex items-start gap-3 mb-3">
          <div className="p-2 bg-zinc-800 rounded-lg">
            <Lock className="w-5 h-5 text-zinc-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-semibold">Competitor Deep Dive</h3>
            <p className="text-zinc-500 text-sm mt-0.5">
              Full analysis of a competitor&apos;s AI citation strategy
            </p>
          </div>
        </div>
        <p className="text-zinc-500 text-sm mb-3">Available on Command plan</p>
        <Link
          href="/settings/billing"
          className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-colors"
        >
          <Zap className="w-4 h-4" />
          Upgrade to unlock
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
      <div className="flex items-start gap-3 mb-3">
        <div className="p-2 bg-emerald-500/10 rounded-lg">
          <Users className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-white font-semibold">Competitor Deep Dive</h3>
          <p className="text-zinc-400 text-sm mt-0.5">
            Full analysis of a competitor&apos;s AI citation strategy
          </p>
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <input
          type="text"
          value={competitorDomain}
          onChange={(e) => setCompetitorDomain(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
          placeholder="e.g., competitor.com"
          className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
        />
        <button
          onClick={handleAnalyze}
          disabled={!competitorDomain.trim() || state.generating}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          {state.generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            "Analyze"
          )}
        </button>
      </div>

      {state.error && (
        <div className="mt-3 flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {state.error}
        </div>
      )}

      {state.result && <ResultPanel data={state.result} />}
    </div>
  );
}

// ============================================
// LOADING SKELETON
// ============================================

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <div className="h-8 w-48 bg-zinc-800 rounded-lg animate-pulse mb-2" />
          <div className="h-4 w-32 bg-zinc-800/60 rounded animate-pulse" />
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="w-9 h-9 bg-zinc-800 rounded-lg animate-pulse" />
                <div className="flex-1">
                  <div className="h-5 w-36 bg-zinc-800 rounded animate-pulse mb-2" />
                  <div className="h-3 w-full bg-zinc-800/60 rounded animate-pulse" />
                </div>
              </div>
              <div className="h-9 w-28 bg-zinc-800 rounded-lg animate-pulse mt-4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// PAGE
// ============================================

export default function IntelligencePage() {
  const { currentSite, organization, loading: siteLoading } = useSite();
  const [features, setFeatures] = useState<FeaturesData | null>(null);
  const [featuresLoading, setFeaturesLoading] = useState(true);
  const [featuresError, setFeaturesError] = useState<string | null>(null);

  const plan = organization?.plan || "free";

  // Fetch available features for current plan
  useEffect(() => {
    const fetchFeatures = async () => {
      setFeaturesLoading(true);
      setFeaturesError(null);

      try {
        const res = await fetch("/api/geo/intelligence/actions");
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setFeaturesError(data.error || "Failed to load intelligence features.");
          return;
        }

        const data = await res.json();
        setFeatures(data.features || null);
      } catch {
        setFeaturesError("Failed to connect. Please try again.");
      } finally {
        setFeaturesLoading(false);
      }
    };

    if (!siteLoading) {
      fetchFeatures();
    }
  }, [siteLoading]);

  // Show skeleton while loading site context or features
  if (siteLoading || featuresLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Intelligence</h1>
          {currentSite?.domain && (
            <p className="text-zinc-500 text-sm mt-1">{currentSite.domain}</p>
          )}
        </div>

        {/* Error state */}
        {featuresError && (
          <div className="mb-6 flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {featuresError}
          </div>
        )}

        {/* 2x2 Feature Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          <GapAnalysisCard
            feature={features?.gapAnalysis || null}
            siteId={currentSite?.id || ""}
          />
          <ContentRecommendationsCard
            feature={features?.contentRecommendations || null}
            siteId={currentSite?.id || ""}
          />
          <ActionPlanCard
            feature={features?.actionPlan || null}
            siteId={currentSite?.id || ""}
            plan={plan}
          />
          <CompetitorDeepDiveCard
            feature={features?.competitorDeepDive || null}
            siteId={currentSite?.id || ""}
            plan={plan}
          />
        </div>
      </div>
    </div>
  );
}
