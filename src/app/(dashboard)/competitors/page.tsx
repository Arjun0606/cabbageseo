"use client";

/**
 * Competitors Page
 * 
 * Track competitor AI visibility:
 * - Add competitors to monitor
 * - See who AI recommends
 * - Compare citations
 */

import { useState, useEffect } from "react";
import { 
  Users, 
  Plus, 
  Trash2,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Crown,
  Lock
} from "lucide-react";
import { useSite } from "@/context/site-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface Competitor {
  id: string;
  domain: string;
  totalCitations: number;
  citationsChange: number;
  lastCheckedAt: string | null;
}

export default function CompetitorsPage() {
  const { currentSite, organization, loading } = useSite();
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loadingCompetitors, setLoadingCompetitors] = useState(true);
  const [newDomain, setNewDomain] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const plan = organization?.plan || "free";
  const isPaid = plan !== "free";
  const competitorLimit = plan === "pro" ? 10 : plan === "starter" ? 2 : 0;

  // Fetch competitors
  useEffect(() => {
    if (!currentSite) return;
    
    const fetchCompetitors = async () => {
      setLoadingCompetitors(true);
      try {
        const res = await fetch(`/api/seo/competitors?siteId=${currentSite.id}`);
        const result = await res.json();
        if (result.competitors) {
          setCompetitors(result.competitors);
        }
      } catch (err) {
        console.error("Failed to fetch competitors:", err);
      } finally {
        setLoadingCompetitors(false);
      }
    };

    fetchCompetitors();
  }, [currentSite]);

  // Add competitor
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain.trim() || !currentSite) return;

    if (competitors.length >= competitorLimit) {
      setError(`Limit reached (${competitorLimit}). Upgrade for more.`);
      return;
    }

    setAdding(true);
    setError("");

    try {
      const res = await fetch("/api/seo/competitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          siteId: currentSite.id,
          domain: newDomain.trim() 
        }),
      });

      const result = await res.json();
      
      if (res.ok && result.competitor) {
        setCompetitors([...competitors, result.competitor]);
        setNewDomain("");
      } else {
        setError(result.error || "Failed to add competitor");
      }
    } catch (err) {
      setError("Failed to add competitor");
    } finally {
      setAdding(false);
    }
  };

  // Remove competitor
  const handleRemove = async (id: string) => {
    try {
      await fetch(`/api/seo/competitors?id=${id}`, { method: "DELETE" });
      setCompetitors(competitors.filter(c => c.id !== id));
    } catch (err) {
      console.error("Failed to remove competitor:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (!currentSite) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-zinc-500 mx-auto mb-4" />
          <p className="text-zinc-400">Add a site first</p>
        </div>
      </div>
    );
  }

  // Free plan - show upgrade prompt
  if (!isPaid) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">
            Competitor Tracking
          </h2>
          <p className="text-zinc-400 mb-6">
            See who AI recommends instead of you. Upgrade to Starter to track competitors.
          </p>
          <Link href="/settings/billing">
            <Button className="bg-emerald-500 hover:bg-emerald-400 text-black">
              Upgrade to Starter
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Build leaderboard
  const leaderboard = [
    { domain: currentSite.domain, citations: currentSite.totalCitations, isYou: true },
    ...competitors.map(c => ({ domain: c.domain, citations: c.totalCitations, isYou: false }))
  ].sort((a, b) => b.citations - a.citations);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Competitors</h1>
        <p className="text-sm text-zinc-500">
          Track who AI recommends in your space
        </p>
      </div>

      {/* Add competitor form */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="pt-6">
          <form onSubmit={handleAdd} className="flex items-center gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                placeholder="competitor.com"
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <Button 
              type="submit"
              disabled={adding || !newDomain.trim() || competitors.length >= competitorLimit}
              className="bg-emerald-500 hover:bg-emerald-400 text-black"
            >
              {adding ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </>
              )}
            </Button>
          </form>
          {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
          <p className="text-xs text-zinc-500 mt-2">
            {competitors.length}/{competitorLimit} competitors used
          </p>
        </CardContent>
      </Card>

      {/* Leaderboard */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-400" />
            AI Citation Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingCompetitors ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin" />
            </div>
          ) : leaderboard.length === 1 ? (
            <p className="text-zinc-500 text-center py-8">
              Add competitors to see the leaderboard
            </p>
          ) : (
            <div className="space-y-3">
              {leaderboard.map((item, idx) => (
                <div 
                  key={item.domain}
                  className={`flex items-center justify-between p-4 rounded-xl ${
                    item.isYou 
                      ? "bg-emerald-500/10 border border-emerald-500/30" 
                      : "bg-zinc-800/50"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className={`text-2xl font-bold ${
                      idx === 0 ? "text-amber-400" : 
                      idx === 1 ? "text-zinc-400" : 
                      idx === 2 ? "text-amber-600" : 
                      "text-zinc-600"
                    }`}>
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{item.domain}</span>
                        {item.isYou && (
                          <Badge className="bg-emerald-500 text-black text-xs">You</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-white">{item.citations}</div>
                    <p className="text-xs text-zinc-500">citations</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Competitor list with remove */}
      {competitors.length > 0 && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Tracked Competitors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {competitors.map((competitor) => (
                <div 
                  key={competitor.id}
                  className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-zinc-500" />
                    <span className="text-white">{competitor.domain}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-white font-medium">{competitor.totalCitations}</span>
                      <span className="text-zinc-500 text-sm ml-1">citations</span>
                      {competitor.citationsChange !== 0 && (
                        <span className={`ml-2 text-sm ${
                          competitor.citationsChange > 0 ? "text-emerald-400" : "text-red-400"
                        }`}>
                          {competitor.citationsChange > 0 ? "+" : ""}{competitor.citationsChange}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemove(competitor.id)}
                      className="text-zinc-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
