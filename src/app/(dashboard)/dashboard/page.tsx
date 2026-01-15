"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSite } from "@/context/site-context";
import {
  AlertTriangle,
  Check,
  X,
  ArrowRight,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Eye,
  Lock,
  Loader2,
  ExternalLink,
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
  const { currentSite, sites, loading: siteLoading, refreshData } = useSite();
  
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
  const mentionShare = totalQueries > 0 ? Math.round((wins / totalQueries) * 100) : 0;

  // No site yet - show onboarding
  if (!siteLoading && (!sites || sites.length === 0)) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Eye className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Add your first site
            </h2>
            <p className="text-zinc-400 mb-6">
              Let's see if AI is recommending your product or sending customers to competitors.
            </p>
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors"
            >
              Start AI visibility scan
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
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3">
            <Check className="w-5 h-5 text-emerald-400" />
            <p className="text-emerald-400">
              Welcome! Your first AI visibility scan is complete. Here's what we found.
            </p>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">
              AI Visibility Report
            </h1>
            <p className="text-zinc-400">
              {currentSite?.domain || "Select a site"} • Last checked: {
                currentSite?.lastCheckedAt 
                  ? new Date(currentSite.lastCheckedAt).toLocaleDateString()
                  : "Never"
              }
            </p>
          </div>
          
          <button
            onClick={runCheck}
            disabled={checking}
            className="inline-flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 disabled:bg-zinc-700 text-white font-semibold rounded-xl transition-colors"
          >
            {checking ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Checking...
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

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* AI Mention Share */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center gap-2 text-zinc-400 text-sm mb-2">
              <TrendingUp className="w-4 h-4" />
              AI Mention Share
            </div>
            <div className="text-4xl font-bold text-white mb-1">
              {mentionShare}%
            </div>
            <p className="text-zinc-500 text-sm">
              of tracked queries mention you
            </p>
          </div>

          {/* Wins */}
          <div className="bg-zinc-900 border border-emerald-500/20 rounded-xl p-6">
            <div className="flex items-center gap-2 text-emerald-400 text-sm mb-2">
              <Check className="w-4 h-4" />
              Queries Won
            </div>
            <div className="text-4xl font-bold text-emerald-400 mb-1">
              {wins}
            </div>
            <p className="text-zinc-500 text-sm">
              AI recommended you
            </p>
          </div>

          {/* Losses */}
          <div className="bg-zinc-900 border border-red-500/20 rounded-xl p-6">
            <div className="flex items-center gap-2 text-red-400 text-sm mb-2">
              <X className="w-4 h-4" />
              Queries Lost
            </div>
            <div className="text-4xl font-bold text-red-400 mb-1">
              {losses}
            </div>
            <p className="text-zinc-500 text-sm">
              AI recommended competitors
            </p>
          </div>
        </div>

        {/* Main content */}
        {loading ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
            <Loader2 className="w-8 h-8 text-zinc-400 animate-spin mx-auto mb-4" />
            <p className="text-zinc-400">Loading your AI visibility data...</p>
          </div>
        ) : queryResults.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
            <Eye className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              No data yet
            </h3>
            <p className="text-zinc-400 mb-6">
              Run your first AI visibility check to see if you're being recommended.
            </p>
            <button
              onClick={runCheck}
              disabled={checking}
              className="inline-flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors"
            >
              {checking ? "Checking..." : "Run Check"}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <>
            {/* Losses section - THE MAIN EVENT */}
            {losses > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <h2 className="text-xl font-semibold text-white">
                    AI is choosing your competitors
                  </h2>
                </div>
                
                <div className="bg-zinc-900 border border-red-500/20 rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-800">
                        <th className="text-left px-6 py-4 text-zinc-400 font-medium">Query</th>
                        <th className="text-left px-6 py-4 text-zinc-400 font-medium">Platform</th>
                        <th className="text-left px-6 py-4 text-zinc-400 font-medium">You</th>
                        <th className="text-right px-6 py-4 text-zinc-400 font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {queryResults.filter(q => !q.cited).map((result, i) => (
                        <tr key={i} className="border-b border-zinc-800 last:border-b-0">
                          <td className="px-6 py-4">
                            <p className="text-white font-medium">"{result.query}"</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 bg-zinc-800 text-zinc-300 rounded text-sm">
                              {result.platform}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1 text-red-400">
                              <X className="w-4 h-4" />
                              Not mentioned
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Link
                              href={`/dashboard/query?q=${encodeURIComponent(result.query)}`}
                              className="inline-flex items-center gap-1 text-red-400 hover:text-red-300 text-sm font-medium"
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

            {/* Wins section */}
            {wins > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Check className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-xl font-semibold text-white">
                    AI is recommending you
                  </h2>
                </div>
                
                <div className="bg-zinc-900 border border-emerald-500/20 rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-800">
                        <th className="text-left px-6 py-4 text-zinc-400 font-medium">Query</th>
                        <th className="text-left px-6 py-4 text-zinc-400 font-medium">Platform</th>
                        <th className="text-left px-6 py-4 text-zinc-400 font-medium">You</th>
                      </tr>
                    </thead>
                    <tbody>
                      {queryResults.filter(q => q.cited).map((result, i) => (
                        <tr key={i} className="border-b border-zinc-800 last:border-b-0">
                          <td className="px-6 py-4">
                            <p className="text-white font-medium">"{result.query}"</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 bg-zinc-800 text-zinc-300 rounded text-sm">
                              {result.platform}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1 text-emerald-400">
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

            {/* Trust Map CTA */}
            <div className="bg-gradient-to-r from-red-950/50 to-zinc-900 border border-red-500/20 rounded-xl p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    See where AI learns about your competitors
                  </h3>
                  <p className="text-zinc-400">
                    Discover the trusted sources (G2, Capterra, Product Hunt) 
                    where competitors are listed and you're not.
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
        <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
