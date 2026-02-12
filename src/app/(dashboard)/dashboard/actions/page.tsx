"use client";

/**
 * ACTIONS PAGE — Trust Sources + AI Analysis Tools
 *
 * Merges:
 * - /dashboard/sources (Trust Map)
 * - /dashboard/intelligence (AI Tools)
 * - /dashboard/roadmap (Redirected here)
 */

import { useState, useEffect } from "react";
import { useSite } from "@/context/site-context";
import { useCheckout } from "@/hooks/use-checkout";
import { CITATION_PLANS, type CitationPlanId } from "@/lib/billing/citation-plans";
import {
  Check,
  X,
  ExternalLink,
  Loader2,
  Globe,
  AlertTriangle,
  ChevronDown,
  Search,
  FileText,
  Target,
  Lock,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

const PREVIEW_DATA: Record<string, string> = {
  "gap-analysis":
    "Your site is missing citations for 12 high-intent queries including 'best project management tool' and 'top CRM for startups'. Filling these gaps with comparison pages and FAQ schema can boost your visibility...",
  "content-recommendations":
    "Create a comparison page: 'YourBrand vs Alternatives' — AI platforms cite comparison content 3.2x more often. Add JSON-LD FAQ schema targeting 'how to choose...' queries...",
  "action-plan":
    "Week 1: Publish FAQ page targeting 'how to choose...' queries. Week 2: Get listed on G2 and Capterra. Week 3: Create comparison content covering top alternatives...",
};

// ============================================
// TYPES
// ============================================

interface TrustSource {
  name: string;
  domain: string;
  category: string;
  trustScore: number;
  howToGetListed: string;
  estimatedEffort: string;
  estimatedTime: string;
  youListed: boolean;
  profileUrl: string | null;
}

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
}

interface CardState {
  generating: boolean;
  result: Record<string, unknown> | null;
  error: string | null;
}

// Icon map based on source category / trustScore
function getSourceIcon(source: TrustSource): string {
  if (source.trustScore >= 9) return "🏆";
  if (source.category === "review") return "⭐";
  if (source.category === "directory") return "🚀";
  if (source.category === "community") return "💬";
  if (source.category === "media") return "📰";
  if (source.category === "comparison") return "📊";
  return "🌐";
}

function getImportance(trustScore: number): "critical" | "high" | "medium" {
  if (trustScore >= 9) return "critical";
  if (trustScore >= 7) return "high";
  return "medium";
}

// ============================================
// RESULT RENDERER (for AI tools)
// ============================================

function renderValue(value: unknown, depth: number = 0): React.ReactNode {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return <p className="text-zinc-300 text-sm leading-relaxed">{value}</p>;
  if (typeof value === "number" || typeof value === "boolean") return <p className="text-zinc-300 text-sm">{String(value)}</p>;
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
    return (
      <div className={depth > 0 ? "ml-3 border-l border-zinc-700/50 pl-3" : ""}>
        {Object.entries(value as Record<string, unknown>).map(([key, val]) => (
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

// ============================================
// AI TOOL ROW
// ============================================

function AIToolRow({
  title,
  description,
  icon: Icon,
  isLocked,
  requiredPlan,
  siteId,
  actionKey,
  hasInput,
  inputPlaceholder,
  buttonLabel,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  isLocked: boolean;
  requiredPlan: CitationPlanId;
  siteId: string;
  actionKey: string;
  hasInput?: boolean;
  inputPlaceholder?: string;
  buttonLabel: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [input, setInput] = useState("");
  const [state, setState] = useState<CardState>({ generating: false, result: null, error: null });
  const { checkout, loading: checkoutLoading } = useCheckout();

  const handleRun = async () => {
    if (state.generating) return;
    setState({ generating: true, result: null, error: null });
    try {
      const body: Record<string, string> = { action: actionKey, siteId };
      if (hasInput && input.trim()) body.query = input.trim();

      const res = await fetch("/api/geo/intelligence/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setState({ generating: false, result: null, error: data.error || "Something went wrong." });
        return;
      }
      setState({ generating: false, result: data.data || {}, error: null });
    } catch {
      setState({ generating: false, result: null, error: "Network error. Please try again." });
    }
  };

  if (isLocked) {
    const planInfo = CITATION_PLANS[requiredPlan];
    const preview = PREVIEW_DATA[actionKey] || "";

    return (
      <div className="border border-zinc-800 rounded-xl overflow-hidden relative">
        {/* Header */}
        <div className="flex items-center gap-3 p-4">
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <Icon className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex-1">
            <h4 className="text-white font-medium text-sm">{title}</h4>
            <p className="text-zinc-500 text-xs">{description}</p>
          </div>
        </div>

        {/* Blurred preview + overlay */}
        <div className="relative border-t border-zinc-800">
          <div className="p-4 blur-sm select-none pointer-events-none" aria-hidden="true">
            <div className="bg-zinc-800/30 border border-zinc-700/30 rounded-xl p-4">
              <p className="text-zinc-300 text-sm leading-relaxed">{preview}</p>
            </div>
          </div>

          {/* CTA overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/60 backdrop-blur-[1px]">
            <div className="text-center px-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-2">
                <Lock className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-white font-medium text-sm mb-1">
                Unlock {title}
              </p>
              <button
                onClick={() => checkout(requiredPlan, "yearly")}
                disabled={checkoutLoading}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {checkoutLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    {planInfo?.name || "Upgrade"} — ${planInfo?.yearlyPrice || 39}/mo
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-zinc-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 hover:bg-zinc-900/50 transition-colors text-left"
      >
        <div className="p-2 bg-emerald-500/10 rounded-lg">
          <Icon className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="flex-1">
          <h4 className="text-white font-medium text-sm">{title}</h4>
          <p className="text-zinc-500 text-xs">{description}</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-zinc-800 pt-3">
          <div className="flex gap-2">
            {hasInput && (
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRun()}
                placeholder={inputPlaceholder}
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            )}
            <button
              onClick={handleRun}
              disabled={state.generating || (hasInput && !input.trim())}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              {state.generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Running...
                </>
              ) : (
                buttonLabel
              )}
            </button>
          </div>

          {state.error && (
            <div className="mt-3 flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {state.error}
            </div>
          )}

          {state.result && (
            <div className="mt-4 bg-zinc-800/30 border border-zinc-700/30 rounded-xl p-4 space-y-3">
              {Object.entries(state.result).map(([key, value]) => (
                <div key={key}>
                  <h3 className="text-white text-sm font-semibold uppercase tracking-wider mb-2">
                    {key.replace(/([A-Z])/g, " $1").replace(/_/g, " ").trim()}
                  </h3>
                  {renderValue(value)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// SOURCE UPGRADE GATE
// ============================================

function SourceUpgradeGate() {
  const { checkout, loading } = useCheckout();
  return (
    <div className="text-center py-3">
      <p className="text-zinc-400 text-sm mb-3">
        Get step-by-step instructions for all trust sources
      </p>
      <button
        onClick={() => checkout("scout", "yearly")}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            Unlock with Scout — $39/mo
            <ArrowRight className="w-3.5 h-3.5" />
          </>
        )}
      </button>
    </div>
  );
}

// ============================================
// PAGE
// ============================================

export default function ActionsPage() {
  const { currentSite, organization, loading: siteLoading } = useSite();
  const { checkout } = useCheckout();
  const [sourcesLoading, setSourcesLoading] = useState(true);
  const [sources, setSources] = useState<TrustSource[]>([]);
  const [expandedSource, setExpandedSource] = useState<string | null>(null);
  const [features, setFeatures] = useState<FeaturesData | null>(null);

  const plan = organization?.plan || "free";
  const isPaid = plan === "scout" || plan === "command" || plan === "dominate";

  // Fetch trust source listings (dynamically selected per business)
  useEffect(() => {
    const fetchSources = async () => {
      if (!currentSite?.id) {
        setSourcesLoading(false);
        return;
      }
      try {
        const response = await fetch(`/api/sites/listings?siteId=${currentSite.id}`);
        if (response.ok) {
          const data = await response.json();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const listings: any[] = data.listings || [];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setSources(listings.map((l: any) => ({
            name: l.source_name,
            domain: l.source_domain,
            category: l.category || "review",
            trustScore: l.trust_score || 5,
            howToGetListed: l.how_to_get_listed || "",
            estimatedEffort: l.estimated_effort || "medium",
            estimatedTime: l.estimated_time || "Varies",
            youListed: l.status === "verified",
            profileUrl: l.profile_url || null,
          })));
        } else {
          setSources([]);
        }
      } catch {
        setSources([]);
      } finally {
        setSourcesLoading(false);
      }
    };

    fetchSources();
  }, [currentSite?.id]);

  // Fetch AI tool features
  useEffect(() => {
    if (siteLoading) return;
    fetch("/api/geo/intelligence/actions")
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.features) setFeatures(data.features);
      })
      .catch(() => {});
  }, [siteLoading]);

  const handleMarkListed = async (sourceDomain: string, sourceName: string) => {
    if (!currentSite?.id) return;
    try {
      const res = await fetch("/api/sites/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId: currentSite.id,
          sourceDomain,
          sourceName,
          status: "verified",
        }),
      });
      if (res.ok) {
        setSources(prev => prev.map(s =>
          s.domain === sourceDomain ? { ...s, youListed: true } : s
        ));
      }
    } catch {
      // Silently fail
    }
  };

  const listedCount = sources.filter(s => s.youListed).length;
  const missingCount = sources.filter(s => !s.youListed).length;

  if (sourcesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Actions</h1>
        <p className="text-zinc-500 text-sm">
          Get listed on trust sources and run AI analysis tools
        </p>
      </div>

      {/* ═══ SECTION 1: Trust Sources ═══ */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4">
          Get Listed on Trust Sources
        </h2>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 text-zinc-400 text-xs mb-1">
              <Globe className="w-3 h-3" />
              Total
            </div>
            <div className="text-2xl font-bold text-white">{sources.length}</div>
          </div>
          <div className="bg-zinc-900 border border-red-500/20 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 text-red-400 text-xs mb-1">
              <AlertTriangle className="w-3 h-3" />
              Missing
            </div>
            <div className="text-2xl font-bold text-red-400">{missingCount}</div>
          </div>
          <div className="bg-zinc-900 border border-emerald-500/20 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 text-emerald-400 text-xs mb-1">
              <Check className="w-3 h-3" />
              Listed
            </div>
            <div className="text-2xl font-bold text-emerald-400">{listedCount}</div>
          </div>
        </div>

        {/* Source list */}
        {sources.length === 0 ? (
          <div className="border border-zinc-800 rounded-xl p-8 text-center">
            <Globe className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400 text-sm mb-1">No trust sources detected yet</p>
            <p className="text-zinc-600 text-xs">Run an AI visibility scan to discover the platforms that matter for your business.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sources.map((source) => {
              const importance = getImportance(source.trustScore);
              const icon = getSourceIcon(source);
              return (
                <div
                  key={source.domain}
                  className={`border rounded-xl overflow-hidden ${
                    importance === "critical" && !source.youListed
                      ? "border-red-500/20"
                      : "border-zinc-800"
                  }`}
                >
                  {/* Row header */}
                  <button
                    onClick={() => setExpandedSource(expandedSource === source.name ? null : source.name)}
                    className="w-full flex items-center gap-3 p-4 hover:bg-zinc-900/50 transition-colors text-left"
                  >
                    <span className="text-xl">{icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-white font-medium text-sm">{source.name}</h3>
                        {importance === "critical" && (
                          <span className="px-1.5 py-0.5 bg-red-500/10 text-red-400 text-[10px] rounded">Critical</span>
                        )}
                        <span className="px-1.5 py-0.5 bg-zinc-800 text-zinc-400 text-[10px] rounded capitalize">{source.category}</span>
                      </div>
                      <p className="text-zinc-500 text-xs truncate">
                        Trust score: {source.trustScore}/10 · {source.estimatedEffort} effort · ~{source.estimatedTime}
                      </p>
                    </div>
                    <span className={`flex items-center gap-1 text-xs font-medium ${
                      source.youListed ? "text-emerald-400" : "text-red-400"
                    }`}>
                      {source.youListed ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      {source.youListed ? "Listed" : "Not listed"}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${
                      expandedSource === source.name ? "rotate-180" : ""
                    }`} />
                  </button>

                  {/* Expanded content */}
                  {expandedSource === source.name && (
                    <div className="border-t border-zinc-800 p-4 bg-zinc-950/50">
                      {!isPaid && importance !== "critical" ? (
                        <SourceUpgradeGate />
                      ) : (
                        <>
                          <div className="mb-4">
                            <p className="text-zinc-300 text-sm leading-relaxed">
                              {source.howToGetListed}
                            </p>
                          </div>
                          {source.profileUrl && (
                            <div className="mb-3">
                              <a
                                href={source.profileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-400 hover:text-emerald-300 text-sm flex items-center gap-1"
                              >
                                View your profile
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <a
                              href={`https://${source.domain}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm"
                            >
                              Visit {source.name}
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                            {!source.youListed && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkListed(source.domain, source.name);
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 rounded-lg transition-colors text-sm"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Mark as Listed
                              </button>
                            )}
                            {source.youListed && (
                              <span className="inline-flex items-center gap-1.5 text-emerald-400 text-sm">
                                <Check className="w-3.5 h-3.5" />
                                Listed
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ═══ SECTION 2: AI Analysis Tools ═══ */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4">
          AI Analysis Tools
        </h2>

        <div className="space-y-2">
          <AIToolRow
            title="Citation Gap Analysis"
            description="Find visibility gaps where you're not being cited"
            icon={Search}
            isLocked={!features?.gapAnalysis?.available}
            requiredPlan="scout"
            siteId={currentSite?.id || ""}
            actionKey="gap-analysis"
            hasInput
            inputPlaceholder="e.g., best CRM for startups"
            buttonLabel="Analyze"
          />

          <AIToolRow
            title="Content Ideas"
            description="AI-powered content recommendations to boost citations"
            icon={FileText}
            isLocked={!features?.contentRecommendations?.available}
            requiredPlan="scout"
            siteId={currentSite?.id || ""}
            actionKey="content-recommendations"
            buttonLabel="Generate"
          />

          <AIToolRow
            title="Weekly Action Plan"
            description="Your personalized GEO playbook for this week"
            icon={Target}
            isLocked={!features?.actionPlan?.available || plan === "free" || plan === "scout"}
            requiredPlan="command"
            siteId={currentSite?.id || ""}
            actionKey="action-plan"
            buttonLabel="Generate"
          />

        </div>
      </section>
    </div>
  );
}
