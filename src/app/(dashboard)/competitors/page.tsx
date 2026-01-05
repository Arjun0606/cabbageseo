"use client";

/**
 * ============================================
 * COMPETITORS PAGE - Track Competitor Citations
 * ============================================
 * 
 * Shows:
 * - Add competitors
 * - Leaderboard comparison
 * - Citation tracking per competitor
 */

import { useState, useEffect } from "react";
import {
  Loader2,
  Target,
  Plus,
  Trash2,
  RefreshCw,
  Trophy,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { useSite } from "@/context/site-context";

interface Competitor {
  id: string;
  domain: string;
  total_citations: number;
  citations_change: number;
  last_checked_at: string | null;
}

export default function CompetitorsPage() {
  const { currentSite, organization, usage, loading: siteLoading } = useSite();
  
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDomain, setNewDomain] = useState("");
  const [adding, setAdding] = useState(false);
  const [checking, setChecking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const plan = organization?.plan || "free";
  const canAddCompetitors = usage.competitorsUsed < usage.competitorsLimit;

  // Load competitors
  useEffect(() => {
    async function loadCompetitors() {
      if (!currentSite?.id) return;
      
      setLoading(true);
      try {
        const res = await fetch(`/api/seo/competitors?siteId=${currentSite.id}`);
        if (res.ok) {
          const data = await res.json();
          setCompetitors(data.competitors || []);
        }
      } catch (err) {
        console.error("Failed to load competitors:", err);
      } finally {
        setLoading(false);
      }
    }
    
    loadCompetitors();
  }, [currentSite?.id]);

  // Add competitor
  const handleAddCompetitor = async () => {
    if (!newDomain.trim() || !currentSite?.id) return;
    
    setAdding(true);
    setError(null);
    
    try {
      // Clean domain
      let domain = newDomain.trim().toLowerCase();
      domain = domain.replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "");
      
      const res = await fetch("/api/seo/competitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId: currentSite.id, domain }),
      });
      
      const data = await res.json();
      
      if (res.ok && data.competitor) {
        setCompetitors((prev) => [...prev, data.competitor]);
        setNewDomain("");
      } else {
        setError(data.error || "Failed to add competitor");
      }
    } catch (err) {
      setError("Failed to add competitor");
    } finally {
      setAdding(false);
    }
  };

  // Remove competitor
  const handleRemoveCompetitor = async (competitorId: string) => {
    try {
      const res = await fetch(`/api/seo/competitors?id=${competitorId}`, { method: "DELETE" });
      if (res.ok) {
        setCompetitors((prev) => prev.filter((c) => c.id !== competitorId));
      }
    } catch (err) {
      console.error("Failed to remove competitor:", err);
    }
  };

  // Check competitor citations
  const handleCheckCompetitor = async (competitor: Competitor) => {
    setChecking(competitor.id);
    
    try {
      // This would call a competitor-specific check endpoint
      const res = await fetch("/api/geo/citations/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          domain: competitor.domain,
          competitorId: competitor.id,
          siteId: currentSite?.id 
        }),
      });
      
      if (res.ok) {
        // Reload competitors to get updated data
        const refreshRes = await fetch(`/api/seo/competitors?siteId=${currentSite?.id}`);
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          setCompetitors(data.competitors || []);
        }
      }
    } catch (err) {
      console.error("Check failed:", err);
    } finally {
      setChecking(null);
    }
  };

  // Build leaderboard
  const leaderboard = [
    {
      domain: currentSite?.domain || "",
      citations: currentSite?.totalCitations || 0,
      change: (currentSite?.citationsThisWeek || 0) - (currentSite?.citationsLastWeek || 0),
      isYou: true,
    },
    ...competitors.map((c) => ({
      domain: c.domain,
      citations: c.total_citations,
      change: c.citations_change,
      isYou: false,
    })),
  ].sort((a, b) => b.citations - a.citations);

  // Loading state
  if (siteLoading || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-4" />
          <p className="text-zinc-500">Loading competitors...</p>
        </div>
      </div>
    );
  }

  // No site
  if (!currentSite) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Target className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">No Site Selected</h2>
          <p className="text-zinc-400">Add a website from the Dashboard first.</p>
        </div>
      </div>
    );
  }

  // Plan restriction for free users
  if (plan === "free" && usage.competitorsLimit === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="max-w-md bg-zinc-900/50 border-zinc-800">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-amber-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Competitor Tracking</h2>
            <p className="text-zinc-400 mb-4">
              Track your competitors&apos; AI citations and see how you compare.
            </p>
            <Badge className="bg-amber-500/10 text-amber-400 border-0 mb-4">
              Requires Starter plan or higher
            </Badge>
            <Link href="/pricing">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-500">
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to Track Competitors
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Target className="w-6 h-6 text-violet-500" />
          Competitors
        </h1>
        <p className="text-zinc-500 text-sm mt-1">
          Track how your competitors perform in AI search
        </p>
      </div>

      {/* Add Competitor */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="competitor.com"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && canAddCompetitors && handleAddCompetitor()}
              disabled={!canAddCompetitors || adding}
              className="flex-1 bg-zinc-800 border-zinc-700"
            />
            <Button
              onClick={handleAddCompetitor}
              disabled={!canAddCompetitors || adding || !newDomain.trim()}
              className="bg-emerald-600 hover:bg-emerald-500"
            >
              {adding ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Adding...</>
              ) : (
                <><Plus className="w-4 h-4 mr-2" /> Add Competitor</>
              )}
            </Button>
          </div>
          
          {error && (
            <p className="text-sm text-red-400 mt-2">{error}</p>
          )}
          
          <div className="flex items-center justify-between mt-3 text-sm">
            <span className="text-zinc-500">
              {competitors.length} / {usage.competitorsLimit} competitors
            </span>
            {!canAddCompetitors && (
              <Link href="/pricing" className="text-emerald-400 hover:underline">
                Upgrade for more
              </Link>
            )}
          </div>
          <Progress 
            value={(competitors.length / usage.competitorsLimit) * 100} 
            className="h-1 mt-2 bg-zinc-800" 
          />
        </CardContent>
      </Card>

      {/* Leaderboard */}
      {leaderboard.length > 1 && (
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              Citation Leaderboard
            </CardTitle>
            <CardDescription>See how you rank against competitors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {leaderboard.map((entry, index) => (
                <div
                  key={entry.domain}
                  className={`flex items-center gap-4 p-3 rounded-lg ${
                    entry.isYou 
                      ? "bg-emerald-500/10 border border-emerald-500/20" 
                      : "bg-zinc-800/50"
                  }`}
                >
                  {/* Rank */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    index === 0 ? "bg-amber-500 text-amber-950" :
                    index === 1 ? "bg-zinc-300 text-zinc-800" :
                    index === 2 ? "bg-amber-600 text-amber-950" :
                    "bg-zinc-700 text-zinc-300"
                  }`}>
                    {index + 1}
                  </div>
                  
                  {/* Domain */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium truncate">{entry.domain}</span>
                      {entry.isYou && (
                        <Badge className="bg-emerald-500/20 text-emerald-400 text-xs border-0">You</Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Citations */}
                  <div className="text-right">
                    <div className="text-xl font-bold text-white">{entry.citations}</div>
                    {entry.change !== 0 && (
                      <div className={`flex items-center justify-end text-xs ${
                        entry.change > 0 ? "text-emerald-400" : "text-red-400"
                      }`}>
                        {entry.change > 0 ? (
                          <TrendingUp className="w-3 h-3 mr-0.5" />
                        ) : (
                          <TrendingDown className="w-3 h-3 mr-0.5" />
                        )}
                        {entry.change > 0 ? "+" : ""}{entry.change}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Competitors List */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Your Competitors</CardTitle>
        </CardHeader>
        <CardContent>
          {competitors.length === 0 ? (
            <div className="text-center py-8">
              <Target className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500">No competitors added yet</p>
              <p className="text-zinc-600 text-sm mt-1">Add a competitor domain above to start tracking</p>
            </div>
          ) : (
            <div className="space-y-3">
              {competitors.map((competitor) => (
                <div
                  key={competitor.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/50 border border-zinc-700/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                      <Target className="w-5 h-5 text-violet-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{competitor.domain}</span>
                        <a
                          href={`https://${competitor.domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-zinc-500 hover:text-white"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
                        <span>{competitor.total_citations} citations</span>
                        {competitor.citations_change !== 0 && (
                          <span className={competitor.citations_change > 0 ? "text-emerald-400" : "text-red-400"}>
                            ({competitor.citations_change > 0 ? "+" : ""}{competitor.citations_change} this week)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCheckCompetitor(competitor)}
                      disabled={checking === competitor.id}
                      className="border-zinc-700"
                    >
                      {checking === competitor.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveCompetitor(competitor.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
