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
  ExternalLink,
  Loader2,
  Target,
  Zap,
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
  const { currentSite, sites, loading: siteLoading, refreshData, organization, usage } = useSite();
  
  const isWelcome = searchParams.get("welcome") === "true";
  const justScanned = searchParams.get("justScanned") === "true";
  
  const [citations, setCitations] = useState<Citation[]>([]);
  const [recentCheckResults, setRecentCheckResults] = useState<Array<{
    query: string;
    platform: string;
    cited: boolean;
    competitors: string[];
    snippet: string;
    isLoss: boolean;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [previousLosses, setPreviousLosses] = useState(0);

  // Fetch citations when site changes
  useEffect(() => {
    if (currentSite?.id) {
      // Load recent check results from localStorage FIRST (synchronous, prevents flicker)
      const stored = localStorage.getItem(`recent_check_${currentSite.id}`);
      let hasStoredData = false;
      
      if (stored) {
        try {
          const data = JSON.parse(stored);
          // Only use if less than 24 hours old
          if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
            setRecentCheckResults(data.results || []);
            hasStoredData = true;
            setLoading(false); // Set loading false immediately if we have stored data
          }
        } catch (e) {
          // Continue to fetch
        }
      }
      
      // Fetch citations (will set loading false in finally block)
      // But if we have stored data, don't show loading spinner
      if (!hasStoredData) {
        setLoading(true);
      }
      fetchCitations();
    } else {
      setLoading(false);
    }
  }, [currentSite?.id]);

  // If user just scanned, fetch fresh results immediately
  useEffect(() => {
    if (justScanned && currentSite?.id) {
      // Small delay to ensure check completed
      setTimeout(() => {
        fetchCitations();
        refreshData();
        // Reload from localStorage (check saves there)
        const stored = localStorage.getItem(`recent_check_${currentSite.id}`);
        if (stored) {
          try {
            const data = JSON.parse(stored);
            setRecentCheckResults(data.results || []);
          } catch (e) {
            // Ignore
          }
        }
      }, 2000);
    }
  }, [justScanned, currentSite?.id]);

  const fetchCitations = async () => {
    if (!currentSite?.id) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/geo/citations?siteId=${currentSite.id}&full=true`);
      if (response.ok) {
        const data = await response.json();
        // API returns { success: true, data: { citations: [...], recent: [...] } }
        const citationsData = data.data?.citations || data.data?.recent || data.citations || [];
        // Citations in table = WINS (user WAS mentioned)
        // Add cited: true to all citations since they exist in the table
        setCitations(citationsData.map((c: any) => ({
          ...c,
          cited: true, // If citation exists, user was cited
        })));
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
      
      // Get check results to show losses
      const checkData = await response.json();
      if (checkData.results) {
        // Store recent check results (including losses) for display
        const results = checkData.results.map((r: any) => ({
          query: r.query,
          platform: r.platform,
          cited: r.cited,
          competitors: r.competitors || [],
          snippet: r.snippet || "",
          isLoss: !r.cited && !r.error,
        }));
        setRecentCheckResults(results);
        // Store in localStorage for persistence
        localStorage.setItem(`recent_check_${currentSite.id}`, JSON.stringify({
          results,
          timestamp: Date.now(),
        }));
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
  // Citations in table = WINS (user WAS mentioned)
  const queryResults: QueryResult[] = [];
  const queryMap = new Map<string, QueryResult>();
  
  for (const citation of citations) {
    const key = citation.query;
    if (!queryMap.has(key)) {
      queryMap.set(key, {
        query: citation.query,
        platform: citation.platform,
        cited: true, // Citation exists = user was cited (WIN)
        competitors: [],
        snippet: citation.snippet || "",
      });
    }
    // If multiple citations for same query, keep the first one
  }
  
  queryMap.forEach(v => queryResults.push(v));
  
  // NOTE: To show LOSSES, we'd need to track which queries were checked
  // but didn't result in citations. Currently we only show WINS (citations that exist).
  // This is a limitation - we can't show historical losses without query history.

  // Calculate stats from recent check results (includes losses)
  const losses = recentCheckResults.filter(r => r.isLoss).length;
  const wins = recentCheckResults.filter(r => r.cited).length;
  const totalQueries = recentCheckResults.length || queryResults.length;
  
  // If no recent check results, use citations (wins only)
  const effectiveWins = recentCheckResults.length > 0 ? wins : queryResults.length;
  const effectiveLosses = recentCheckResults.length > 0 ? losses : 0;

  // Calculate real week-over-week changes from site data
  const citationsThisWeek = currentSite?.citationsThisWeek || 0;
  const citationsLastWeek = currentSite?.citationsLastWeek || 0;
  const winsChange = citationsThisWeek - citationsLastWeek;
  
  // Calculate losses change from stored historical data
  useEffect(() => {
    if (currentSite?.id && effectiveLosses > 0) {
      // Load previous losses count from localStorage
      const storedPrevLosses = localStorage.getItem(`prev_losses_${currentSite.id}`);
      if (storedPrevLosses) {
        const prevCount = parseInt(storedPrevLosses) || 0;
        if (prevCount !== previousLosses) {
          setPreviousLosses(prevCount);
        }
      }
      
      // Store current losses for next comparison (only update on change)
      const currentStored = localStorage.getItem(`prev_losses_${currentSite.id}`);
      if (!currentStored || parseInt(currentStored) !== effectiveLosses) {
        localStorage.setItem(`prev_losses_${currentSite.id}`, String(effectiveLosses));
      }
    }
  }, [currentSite?.id, effectiveLosses, previousLosses]);
  
  const lossesChange = effectiveLosses - previousLosses;

  // Use real usage data from context
  const checksRemaining = Math.max(0, usage.checksLimit - usage.checksUsed);
  const checksMax = usage.checksLimit;

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
              Is AI recommending you?
            </h1>
            <p className="text-sm text-zinc-500 mb-2">
              {currentSite?.domain || "Add a site to check"}
            </p>
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

          {/* Starter Tier Progress Summary */}
          {organization?.plan === "starter" && effectiveLosses > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 min-w-[280px]">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-white font-medium text-sm">Your AI Visibility Progress</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Steps completed:</span>
                  <span className="text-white font-medium">1 / 6</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Sources covered:</span>
                  <span className="text-white font-medium">1 / 5</span>
                </div>
                <div className="flex justify-between mb-3">
                  <span className="text-zinc-400">Queries targeted:</span>
                  <span className="text-white font-medium">{recentCheckResults.length}</span>
                </div>
                <div className="pt-3 border-t border-zinc-800">
                  <p className="text-emerald-400 text-xs font-medium mb-1">Next best action:</p>
                  <p className="text-zinc-300 text-xs">→ Finish G2 listing (30–60 min)</p>
                </div>
              </div>
            </div>
          )}
          
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

        {/* THE ONE KPI - High-Intent Queries Missed (LOSSES FIRST) */}
        <div className="bg-gradient-to-r from-red-950/80 to-red-900/50 rounded-2xl p-8 mb-8 border-2 border-red-500/50">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium mb-2 text-red-400">
                    <AlertTriangle className="w-5 h-5" />
                QUERIES WHERE YOU'RE INVISIBLE
              </div>
              <div className="flex items-baseline gap-4">
                <span className="text-6xl font-bold text-white">
                  {effectiveLosses > 0 ? effectiveLosses : recentCheckResults.length === 0 ? "?" : 0}
                </span>
                {recentCheckResults.length === 0 && (
                  <span className="text-lg text-red-300/80">
                    Run a check to see
                  </span>
                )}
              </div>
              <p className="mt-2 text-red-300/80">
                {recentCheckResults.length === 0
                  ? "AI recommended competitors instead of you"
                  : effectiveLosses === 0
                  ? "Great! AI is recommending you in all checked queries."
                  : `AI recommended ${effectiveLosses === 1 ? "a competitor" : `${effectiveLosses} competitors`} instead of you`
                }
              </p>
            </div>
            
            {recentCheckResults.length === 0 && (
              <button
                onClick={runCheck}
                disabled={checking}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-red-600 font-semibold rounded-xl hover:bg-zinc-100 transition-colors whitespace-nowrap disabled:opacity-50"
              >
                {checking ? "Checking..." : "Run Check Now"}
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Main content */}
        {loading ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
            <Loader2 className="w-8 h-8 text-red-400 animate-spin mx-auto mb-4" />
            <p className="text-zinc-400">Checking if AI recommends you...</p>
          </div>
        ) : recentCheckResults.length === 0 && queryResults.length === 0 ? (
          /* NO BLANK STATES - Compelling CTA instead */
          <div className="bg-gradient-to-br from-red-950/30 to-zinc-900 border-2 border-red-500/30 rounded-xl p-12 text-center">
            <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">
              AI is choosing your competitors right now
            </h3>
            <p className="text-zinc-400 mb-6 max-w-md mx-auto">
              Run a check to see which queries AI answers with your competitors' names instead of yours.
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
                  Run Check Now
                </>
              )}
            </button>
            <p className="text-zinc-500 text-sm mt-4">
              Takes about 30 seconds • See results immediately
            </p>
          </div>
        ) : (
          <>
            {/* LOSSES SECTION FIRST - Visually Dominant, Red, Urgent */}
            {effectiveLosses > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    ⚠️ Where AI ignores you ({effectiveLosses})
                  </h2>
                </div>
                
                <div className="bg-gradient-to-br from-red-950/30 to-zinc-900 border-2 border-red-500/30 rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-red-500/20 bg-red-950/20">
                        <th className="text-left px-6 py-4 text-red-300 font-semibold text-sm">Query</th>
                        <th className="text-left px-6 py-4 text-red-300 font-semibold text-sm">Platform</th>
                        <th className="text-left px-6 py-4 text-red-300 font-semibold text-sm">Who AI recommends instead</th>
                        <th className="text-left px-6 py-4 text-red-300 font-semibold text-sm">Why?</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentCheckResults.filter(r => r.isLoss).map((result, i) => (
                        <tr key={i} className="border-b border-red-500/10 last:border-b-0 hover:bg-red-950/10">
                          <td className="px-6 py-4">
                            <p className="text-white font-medium">"{result.query}"</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 bg-zinc-800 text-zinc-300 rounded text-sm">
                              {result.platform}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-2">
                              {result.competitors.slice(0, 3).map((comp, idx) => (
                                <span key={idx} className="px-2 py-1 bg-red-500/20 text-red-300 rounded text-sm">
                                  {comp}
                                </span>
                              ))}
                              {result.competitors.length > 3 && (
                                <span className="px-2 py-1 bg-zinc-800 text-zinc-400 rounded text-sm">
                                  +{result.competitors.length - 3} more
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                  <Link
                              href={`/dashboard/query?q=${encodeURIComponent(result.query)}`}
                              className="inline-flex items-center gap-1 text-red-400 hover:text-red-300 font-semibold text-sm"
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

            {/* WINS SECTION SECONDARY - Smaller, Muted Green */}
            {effectiveWins > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                    <Check className="w-4 h-4 text-emerald-400" />
                  </div>
                  <h2 className="text-lg font-semibold text-zinc-300">
                    AI is recommending you ({effectiveWins})
                  </h2>
                </div>
                
                <div className="bg-zinc-900 border border-emerald-500/10 rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-800">
                        <th className="text-left px-6 py-3 text-zinc-400 font-medium text-sm">Query</th>
                        <th className="text-left px-6 py-3 text-zinc-400 font-medium text-sm">Platform</th>
                        <th className="text-left px-6 py-3 text-zinc-400 font-medium text-sm">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentCheckResults.length > 0 
                        ? recentCheckResults.filter(r => r.cited).map((result, i) => (
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
                          ))
                        : queryResults.filter(q => q.cited).map((result, i) => (
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
                          ))
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* INSTANT VALUE - Show clear next steps based on plan */}
            {effectiveLosses > 0 && (
              <div className="space-y-4 mb-8">
                {/* Free Tier - Show ONE actionable step + micro-win indicator */}
                {organization?.plan === "free" && (
                  <div className="space-y-4">
                    {/* Micro-win indicator */}
                    <div className="bg-gradient-to-r from-emerald-950/30 to-zinc-900 border border-emerald-500/20 rounded-xl p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Target className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-white mb-2">
                            🎯 Your Fastest Path to First AI Mention
                          </h3>
                          <p className="text-zinc-300 mb-3">
                            Most solo founders get their first AI mention by:
                          </p>
                          <ul className="space-y-2 text-sm text-zinc-300 mb-4 ml-4">
                            <li className="list-disc">Getting listed on 1 review site (G2 or Capterra)</li>
                            <li className="list-disc">Creating 1 comparison-style page</li>
                          </ul>
                          <p className="text-emerald-400 font-medium text-sm">
                            You can finish Step 1 today.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* ONE ACTIONABLE STEP - Free users can do this NOW */}
                    <div className="bg-gradient-to-r from-emerald-950/30 to-zinc-900 border border-emerald-500/20 rounded-xl p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Target className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-white mb-2">
                            Start here: Get listed on G2 (free, takes 2-3 hours)
                          </h3>
                          <p className="text-zinc-400 mb-4">
                            G2 is the #1 source AI uses. Your competitors are listed here. You're not. 
                            This is why AI recommends them instead of you.
                          </p>
                          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-4">
                            <p className="text-white font-medium mb-2">Step 1: Create a G2 seller account</p>
                            <ol className="space-y-2 text-sm text-zinc-300 ml-4">
                              <li className="list-decimal">Go to <a href="https://sell.g2.com" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">g2.com/sellers</a></li>
                              <li className="list-decimal">Sign up with your work email</li>
                              <li className="list-decimal">Claim or create your product listing</li>
                            </ol>
                          </div>
                          <div className="flex items-center gap-3">
                            <a
                              href="https://sell.g2.com"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors"
                            >
                              Get started on G2
                              <ArrowRight className="w-5 h-5" />
                            </a>
                            <Link
                              href="/settings/billing"
                              className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-xl transition-colors"
                            >
                              Show me the full checklist
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Starter Tier - Show Trust Map access */}
                {(organization?.plan === "starter" || organization?.plan === "pro") && (
                  <div className="bg-gradient-to-r from-red-950/30 to-zinc-900 border border-red-500/20 rounded-xl p-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-white mb-1">
                          See where AI gets its answers
                        </h3>
                        <p className="text-zinc-400">
                          Your competitors are on these sources. You're not. Get listed and start being recommended.
                        </p>
                      </div>
                      <Link
                        href="/dashboard/sources"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors whitespace-nowrap"
                      >
                        View AI Trust Map
                        <ArrowRight className="w-5 h-5" />
                      </Link>
                    </div>
                  </div>
                )}

                {/* Pro Tier - Show control room status */}
                {organization?.plan === "pro" && (
                  <div className="space-y-4">
                    {/* AI Visibility Mode Status */}
                    <div className="bg-gradient-to-r from-emerald-950/30 to-zinc-900 border border-emerald-500/20 rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                          <Zap className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-white font-semibold">
                            🧠 AI Visibility Mode: Active
                          </p>
                          <p className="text-zinc-400 text-sm">
                            Monitoring competitors every hour.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Full roadmap CTA */}
                    <div className="bg-gradient-to-r from-emerald-950/30 to-zinc-900 border border-emerald-500/20 rounded-xl p-6">
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-bold text-white mb-1">
                            Get your complete visibility roadmap
                          </h3>
                          <p className="text-zinc-400">
                            Step-by-step instructions to get listed on every source AI trusts. Track your progress as you go.
                          </p>
                        </div>
                        <Link
                          href="/dashboard/roadmap"
                          className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors whitespace-nowrap"
                        >
                          View Full Roadmap
                          <ArrowRight className="w-5 h-5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* First win guidance - show when user has no wins yet AND no losses (just signed up) */}
            {wins === 0 && effectiveLosses === 0 && recentCheckResults.length === 0 && (
              <div className="bg-gradient-to-r from-emerald-950/30 to-zinc-900 border border-emerald-500/20 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Zap className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">
                      Run your first check to see if AI recommends you
                    </h3>
                    <p className="text-zinc-400 mb-4">
                      We'll check ChatGPT, Perplexity, and Google AI to see who they mention for queries about your product.
                    </p>
                    <button
                      onClick={runCheck}
                      disabled={checking}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
                    >
                      {checking ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Checking...
                        </>
                      ) : (
                        <>
                          Run Check Now
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </button>
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
