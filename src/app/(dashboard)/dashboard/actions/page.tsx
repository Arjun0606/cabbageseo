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
    "Your site is missing citations for 12 high-intent queries including 'best project management tool' and 'top CRM for startups'. Other brands rank here with comparison pages and FAQ schema...",
  "content-recommendations":
    "Create a comparison page: 'YourBrand vs Competitor' — AI platforms cite comparison content 3.2x more often. Add JSON-LD FAQ schema targeting 'how to choose...' queries...",
  "action-plan":
    "Week 1: Publish FAQ page targeting 'how to choose...' queries. Week 2: Get listed on G2 and Capterra. Week 3: Create comparison content vs top 3 competitors...",
};

// ============================================
// TYPES
// ============================================

interface TrustSource {
  name: string;
  domain: string;
  icon: string;
  description: string;
  importance: "critical" | "high" | "medium";
  submissionUrl: string;
  youListed: boolean;
  howToGetListed: string[];
  timeToList: string;
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

// ============================================
// TRUST SOURCES DATA
// ============================================

const TRUST_SOURCES: Omit<TrustSource, "youListed">[] = [
  {
    name: "G2",
    domain: "g2.com",
    icon: "🏆",
    description: "Software reviews and ratings platform",
    importance: "critical",
    submissionUrl: "https://sell.g2.com/create-a-profile",
    howToGetListed: [
      "Create a free G2 seller account",
      "Claim your product listing",
      "Add product details and screenshots",
      "Invite customers to leave reviews",
    ],
    timeToList: "2-3 hours",
  },
  {
    name: "Capterra",
    domain: "capterra.com",
    icon: "📊",
    description: "Business software comparison platform",
    importance: "critical",
    submissionUrl: "https://vendors.capterra.com/sign-up",
    howToGetListed: [
      "Create a Capterra vendor account",
      "Submit your product for review",
      "Complete your product profile",
      "Gather customer reviews",
    ],
    timeToList: "2-3 hours",
  },
  {
    name: "Product Hunt",
    domain: "producthunt.com",
    icon: "🚀",
    description: "Product discovery and launch platform",
    importance: "high",
    submissionUrl: "https://www.producthunt.com/posts/new",
    howToGetListed: [
      "Create a Product Hunt account",
      "Prepare launch assets (images, tagline)",
      "Schedule your launch day",
      "Engage with the community",
    ],
    timeToList: "1-2 hours",
  },
  {
    name: "Reddit",
    domain: "reddit.com",
    icon: "💬",
    description: "Community discussions and recommendations",
    importance: "high",
    submissionUrl: "https://www.reddit.com/subreddits/search",
    howToGetListed: [
      "Find relevant subreddits for your niche",
      "Participate in discussions genuinely",
      "Share when contextually relevant",
      "Build community presence over time",
    ],
    timeToList: "Ongoing",
  },
  {
    name: "Trustpilot",
    domain: "trustpilot.com",
    icon: "⭐",
    description: "Consumer review platform",
    importance: "medium",
    submissionUrl: "https://business.trustpilot.com/signup",
    howToGetListed: [
      "Claim your business profile",
      "Verify your business",
      "Invite customers to review",
      "Respond to reviews",
    ],
    timeToList: "1-2 hours",
  },
  {
    name: "TrustRadius",
    domain: "trustradius.com",
    icon: "🎯",
    description: "B2B software reviews",
    importance: "medium",
    submissionUrl: "https://www.trustradius.com/vendor",
    howToGetListed: [
      "Create vendor profile",
      "Add product information",
      "Invite verified buyers to review",
      "Engage with reviewers",
    ],
    timeToList: "2-3 hours",
  },
];

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

  // Fetch trust source listings
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
          const listings = data.listings || [];
          const listingsByDomain = new Map<string, boolean>();
          listings.forEach((l: { source_domain: string; status: string }) => {
            listingsByDomain.set(l.source_domain, l.status === "verified");
          });
          setSources(TRUST_SOURCES.map(source => ({
            ...source,
            youListed: listingsByDomain.get(source.domain) || false,
          })));
        } else {
          setSources(TRUST_SOURCES.map(source => ({ ...source, youListed: false })));
        }
      } catch {
        setSources(TRUST_SOURCES.map(source => ({ ...source, youListed: false })));
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
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
        <div className="space-y-2">
          {sources.map((source) => (
            <div
              key={source.domain}
              className={`border rounded-xl overflow-hidden ${
                source.importance === "critical" && !source.youListed
                  ? "border-red-500/20"
                  : "border-zinc-800"
              }`}
            >
              {/* Row header */}
              <button
                onClick={() => setExpandedSource(expandedSource === source.name ? null : source.name)}
                className="w-full flex items-center gap-3 p-4 hover:bg-zinc-900/50 transition-colors text-left"
              >
                <span className="text-xl">{source.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-medium text-sm">{source.name}</h3>
                    {source.importance === "critical" && (
                      <span className="px-1.5 py-0.5 bg-red-500/10 text-red-400 text-[10px] rounded">Critical</span>
                    )}
                  </div>
                  <p className="text-zinc-500 text-xs truncate">{source.description}</p>
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
                  {!isPaid && source.importance !== "critical" ? (
                    <SourceUpgradeGate />
                  ) : (
                    <>
                      <p className="text-xs text-zinc-500 mb-3">
                        Time to get listed: ~{source.timeToList}
                      </p>
                      <ol className="space-y-2 mb-4">
                        {(isPaid ? source.howToGetListed : source.howToGetListed.slice(0, 1)).map((step, j) => (
                          <li key={j} className="flex items-start gap-2.5">
                            <span className="flex-shrink-0 w-5 h-5 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center text-xs font-medium">
                              {j + 1}
                            </span>
                            <span className="text-zinc-300 text-sm">{step}</span>
                          </li>
                        ))}
                      </ol>
                      {!isPaid && source.howToGetListed.length > 1 && (
                        <p className="text-zinc-500 text-xs mb-3">
                          See all {source.howToGetListed.length} steps — <button onClick={() => checkout("scout", "yearly")} className="text-emerald-400 hover:text-emerald-300">upgrade to Scout ($39/mo)</button>
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <a
                          href={source.submissionUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm"
                        >
                          Submit Listing
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
                            Mark as Done
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
          ))}
        </div>
      </section>

      {/* ═══ SECTION 2: AI Analysis Tools ═══ */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4">
          AI Analysis Tools
        </h2>

        <div className="space-y-2">
          <AIToolRow
            title="Citation Gap Analysis"
            description="Find gaps where AI recommends others instead of you"
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
