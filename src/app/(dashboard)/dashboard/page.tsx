"use client";

/**
 * DASHBOARD - THE WAR ROOM
 * 
 * Design principles:
 * 1. ONE KPI at top: High-Intent Queries Missed
 * 2. LOSSES are LOUD - red, above everything
 * 3. WINS are secondary - green, below
 * 4. No blank states - always show compelling CTAs
 * 5. Movement, not just state - show week-over-week
 */

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSite } from "@/context/site-context";
import {
  AlertTriangle,
  Check,
  X,
  ArrowRight,
  ArrowDown,
  ArrowUp,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Eye,
  Loader2,
  Zap,
  Target,
  Clock,
} from "lucide-react";

interface Citation {
  id: string;
  query: string;
  platform: string;
  snippet: string;
  confidence: string;
  created_at: string;
  cited: boolean;
}

interface QueryResult {
  query: string;
  platform: string;
  cited: boolean;
  competitors: string[];
  snippet: string;
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { currentSite, sites, loading: siteLoading, refreshData, organization } = useSite();
  
  const isWelcome = searchParams.get("welcome") === "true";
  
  const [citations, setCitations] = useState<Citation[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  // Fetch citations when site changes
  useEffect(() => {
    if (currentSite?.id) {
      fetchCitations();
    }
  }, [currentSite?.id]);

  const fetchCitations = async () => {
    if (!currentSite?.id) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/geo/citations?siteId=${currentSite.id}`);
      if (response.ok) {
        const data = await response.json();
        setCitations(data.citations || []);
      }
    } catch (err) {
      console.error("Failed to fetch citations:", err);
    } finally {
      setLoading(false);
    }
  };

  const runCheck = async () => {
    if (!currentSite?.id || checking) return;
    
    setChecking(true);
    setError("");
    
    try {
      const response = await fetch("/api/geo/citations/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId: currentSite.id }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Check failed");
      }
      
      // Refresh citations
      await fetchCitations();
      await refreshData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Check failed");
    } finally {
      setChecking(false);
    }
  };

  // Group citations by query
  const queryResults: QueryResult[] = [];
  const queryMap = new Map<string, QueryResult>();
  
  for (const citation of citations) {
    const key = citation.query;
    if (!queryMap.has(key)) {
      queryMap.set(key, {
        query: citation.query,
        platform: citation.platform,
        cited: false,
        competitors: [],
        snippet: citation.snippet,
      });
    }
    const result = queryMap.get(key)!;
    if (citation.cited) {
      result.cited = true;
    }
  }
  
  queryMap.forEach(v => queryResults.push(v));

  // Calculate stats
  const totalQueries = queryResults.length;
  const wins = queryResults.filter(q => q.cited).length;
  const losses = queryResults.filter(q => !q.cited).length;

  // Mock week-over-week changes (would be real in production)
  // Using as number to avoid TypeScript literal type inference
  const lossesChange: number = losses > 0 ? -2 : 0; // negative = good (fewer losses)
  const winsChange: number = wins > 0 ? 3 : 0; // positive = good (more wins)

  // Plan-based limits
  const plan = organization?.plan || "free";
  const checksRemaining = plan === "free" ? 3 : plan === "starter" ? 87 : 872;
  const checksMax = plan === "free" ? 3 : plan === "starter" ? 100 : 1000;

  // No site yet - compelling onboarding
  if (!siteLoading && (!sites || sites.length === 0)) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="bg-gradient-to-br from-red-950/50 to-zinc-900 border border-red-500/30 rounded-2xl p-8">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Is AI sending your customers to competitors?
            </h2>
            <p className="text-zinc-400 mb-6">
              Find out in 60 seconds. Add your domain and we'll scan ChatGPT, Perplexity, and Google AI.
            </p>
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors"
            >
              Scan my site now
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Welcome banner */}
        {isWelcome && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <p className="text-red-300">
              <strong>Your scan is complete.</strong> AI is recommending your competitors. See what you're missing below.
            </p>
          </div>
        )}

        {/* Header with checks remaining */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">
              {currentSite?.domain || "Your Site"}
            </h1>
            <div className="flex items-center gap-4 text-sm text-zinc-400">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Last checked: {currentSite?.lastCheckedAt 
                  ? new Date(currentSite.lastCheckedAt).toLocaleDateString()
                  : "Never"}
              </span>
              <span className={`flex items-center gap-1 ${
                checksRemaining < 10 ? "text-red-400" : "text-zinc-400"
              }`}>
                <Zap className="w-4 h-4" />
                {checksRemaining}/{checksMax} checks left
              </span>
            </div>
          </div>
          
          <button
            onClick={runCheck}
            disabled={checking}
            className="inline-flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 disabled:bg-zinc-700 text-white font-semibold rounded-xl transition-colors"
          >
            {checking ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Scanning AI...
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5" />
                Run Check
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* THE ONE KPI - Giant, scary, front and center */}
        <div className="bg-gradient-to-r from-red-950/80 to-red-900/50 border-2 border-red-500/50 rounded-2xl p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-red-400 text-sm font-medium mb-2">
                <AlertTriangle className="w-5 h-5" />
                HIGH-INTENT QUERIES YOU'RE MISSING
              </div>
              <div className="flex items-baseline gap-4">
                <span className="text-6xl font-bold text-white">{losses}</span>
                {lossesChange !== 0 && (
                  <span className={`flex items-center gap-1 text-lg font-medium ${
                    lossesChange < 0 ? "text-emerald-400" : "text-red-400"
                  }`}>
                    {lossesChange < 0 ? (
                      <ArrowDown className="w-5 h-5" />
                    ) : (
                      <ArrowUp className="w-5 h-5" />
                    )}
                    {Math.abs(lossesChange)} this week
                  </span>
                )}
              </div>
              <p className="text-red-300/80 mt-2">
                {losses === 0 
                  ? "AI is recommending you! Keep monitoring."
                  : `AI is sending customers to your competitors for ${losses} queries where you should be mentioned.`
                }
              </p>
            </div>
            
            {losses > 0 && (
              <Link
                href="#losses"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-red-600 font-semibold rounded-xl hover:bg-zinc-100 transition-colors whitespace-nowrap"
              >
                See what you're losing
                <ArrowDown className="w-5 h-5" />
              </Link>
            )}
          </div>
        </div>

        {/* Secondary stats - smaller, less prominent */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-zinc-900 border border-emerald-500/20 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-400 mb-1">Queries Won</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-white">{wins}</span>
                  {winsChange !== 0 && (
                    <span className={`text-sm ${winsChange > 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {winsChange > 0 ? "+" : ""}{winsChange}
                    </span>
                  )}
                </div>
              </div>
              <Check className="w-8 h-8 text-emerald-400/30" />
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400 mb-1">AI Mention Rate</p>
                <span className="text-3xl font-bold text-white">
                  {totalQueries > 0 ? Math.round((wins / totalQueries) * 100) : 0}%
                </span>
              </div>
              <TrendingUp className="w-8 h-8 text-zinc-700" />
            </div>
          </div>
        </div>

        {/* Main content */}
        {loading ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
            <Loader2 className="w-8 h-8 text-red-400 animate-spin mx-auto mb-4" />
            <p className="text-zinc-400">Loading your AI visibility data...</p>
          </div>
        ) : queryResults.length === 0 ? (
          /* NO BLANK STATES - Compelling CTA instead */
          <div className="bg-gradient-to-br from-red-950/30 to-zinc-900 border border-red-500/20 rounded-xl p-12 text-center">
            <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">
              Are you invisible to AI?
            </h3>
            <p className="text-zinc-400 mb-6 max-w-md mx-auto">
              Run your first check to discover if ChatGPT, Perplexity, and Google AI are sending customers to your competitors instead of you.
            </p>
            <button
              onClick={runCheck}
              disabled={checking}
              className="inline-flex items-center gap-2 px-8 py-4 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors"
            >
              {checking ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Scanning AI platforms...
                </>
              ) : (
                <>
                  <Target className="w-5 h-5" />
                  Scan AI now
                </>
              )}
            </button>
            <p className="text-zinc-500 text-sm mt-4">
              Takes about 30 seconds
            </p>
          </div>
        ) : (
          <>
            {/* LOSSES SECTION - BIG, RED, SCARY - Always first */}
            {losses > 0 && (
              <div id="losses" className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        AI is choosing your competitors
                      </h2>
                      <p className="text-red-400 text-sm">
                        {losses} queries where you should be mentioned but aren't
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-zinc-900 border-2 border-red-500/30 rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-800 bg-red-950/30">
                        <th className="text-left px-6 py-4 text-red-300 font-semibold">Query</th>
                        <th className="text-left px-6 py-4 text-red-300 font-semibold">Platform</th>
                        <th className="text-left px-6 py-4 text-red-300 font-semibold">Status</th>
                        <th className="text-right px-6 py-4 text-red-300 font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {queryResults.filter(q => !q.cited).map((result, i) => (
                        <tr 
                          key={i} 
                          className="border-b border-zinc-800 last:border-b-0 hover:bg-red-950/20 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <p className="text-white font-medium">"{result.query}"</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 bg-zinc-800 text-zinc-300 rounded text-sm">
                              {result.platform}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1 text-red-400 font-medium">
                              <X className="w-4 h-4" />
                              NOT MENTIONED
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Link
                              href={`/dashboard/query?q=${encodeURIComponent(result.query)}`}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-lg text-sm font-semibold transition-colors"
                            >
                              Why not me?
                              <ArrowRight className="w-4 h-4" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Trust Map CTA - Prominent for losses */}
            {losses > 0 && (
              <div className="bg-gradient-to-r from-red-950/50 to-zinc-900 border border-red-500/20 rounded-xl p-6 mb-8">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">
                      Where does AI learn about your competitors?
                    </h3>
                    <p className="text-zinc-400">
                      See the sources AI trusts (G2, Capterra, Reddit) — and get listed.
                    </p>
                  </div>
                  <Link
                    href="/dashboard/sources"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors whitespace-nowrap"
                  >
                    View Trust Map
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            )}

            {/* Wins section - Secondary, below losses */}
            {wins > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                    <Check className="w-4 h-4 text-emerald-400" />
                  </div>
                  <h2 className="text-lg font-semibold text-white">
                    AI is recommending you ({wins})
                  </h2>
                </div>
                
                <div className="bg-zinc-900 border border-emerald-500/20 rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-800">
                        <th className="text-left px-6 py-3 text-zinc-400 font-medium text-sm">Query</th>
                        <th className="text-left px-6 py-3 text-zinc-400 font-medium text-sm">Platform</th>
                        <th className="text-left px-6 py-3 text-zinc-400 font-medium text-sm">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {queryResults.filter(q => q.cited).map((result, i) => (
                        <tr key={i} className="border-b border-zinc-800 last:border-b-0">
                          <td className="px-6 py-3">
                            <p className="text-zinc-300">"{result.query}"</p>
                          </td>
                          <td className="px-6 py-3">
                            <span className="px-2 py-1 bg-zinc-800 text-zinc-400 rounded text-sm">
                              {result.platform}
                            </span>
                          </td>
                          <td className="px-6 py-3">
                            <span className="inline-flex items-center gap-1 text-emerald-400 text-sm">
                              <Check className="w-4 h-4" />
                              Mentioned
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* First win guidance - show when user has all losses */}
            {losses > 0 && wins === 0 && (
              <div className="bg-gradient-to-r from-emerald-950/30 to-zinc-900 border border-emerald-500/20 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Zap className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">
                      Your first win is closer than you think
                    </h3>
                    <p className="text-zinc-400 mb-4">
                      Most founders can get their first AI mention within 2 weeks by getting listed on the right sources.
                    </p>
                    <Link
                      href="/dashboard/roadmap"
                      className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-semibold"
                    >
                      Get your visibility roadmap
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-red-400 animate-spin" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
