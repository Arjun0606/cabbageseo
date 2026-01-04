"use client";

/**
 * ============================================
 * COMPETITORS PAGE
 * ============================================
 * 
 * Track competitor AI visibility.
 * Compare citation counts side by side.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  Target,
  Plus,
  Trash2,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Crown,
  Search,
  Bot,
  Sparkles,
  Trophy,
  Medal,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

// ============================================
// TYPES
// ============================================

interface Competitor {
  id: string;
  domain: string;
  citations: number;
  change: number;
  lastChecked: string;
  byPlatform: {
    perplexity: number;
    googleAio: number;
    chatgpt: number;
  };
}

// ============================================
// STORAGE
// ============================================

const SITE_KEY = "cabbageseo_site";
const COMPETITORS_KEY = "cabbageseo_competitors";

function loadSite(): { id: string; domain: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const data = localStorage.getItem(SITE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

function loadCompetitors(): Competitor[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(COMPETITORS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveCompetitors(competitors: Competitor[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(COMPETITORS_KEY, JSON.stringify(competitors));
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function CompetitorsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [site, setSite] = useState<{ id: string; domain: string } | null>(null);
  const [yourCitations, setYourCitations] = useState(0);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [newDomain, setNewDomain] = useState("");
  const [adding, setAdding] = useState(false);
  const [checking, setChecking] = useState<string | null>(null);
  const [plan, setPlan] = useState("starter");

  useEffect(() => {
    const cached = loadSite();
    if (!cached) {
      router.push("/dashboard");
      return;
    }
    setSite(cached);
    setCompetitors(loadCompetitors());
    
    // Fetch your citations
    fetch(`/api/geo/citations?siteId=${cached.id}`)
      .then(res => res.json())
      .then(data => setYourCitations(data.data?.total || 0))
      .catch(() => {});
    
    // Fetch plan
    fetch("/api/me")
      .then(res => res.json())
      .then(data => setPlan(data.organization?.plan || "free"))
      .catch(() => {});
    
    setLoading(false);
  }, [router]);

  // Add competitor
  const addCompetitor = async () => {
    if (!newDomain.trim()) return;
    
    let domain = newDomain.trim().toLowerCase();
    domain = domain.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    
    if (competitors.some(c => c.domain === domain)) {
      setNewDomain("");
      return;
    }
    
    setAdding(true);
    
    const newCompetitor: Competitor = {
      id: Date.now().toString(),
      domain,
      citations: 0,
      change: 0,
      lastChecked: "",
      byPlatform: { perplexity: 0, googleAio: 0, chatgpt: 0 },
    };
    
    const updated = [...competitors, newCompetitor];
    setCompetitors(updated);
    saveCompetitors(updated);
    setNewDomain("");
    setAdding(false);
    
    checkCompetitor(newCompetitor.id, domain);
  };

  // Check competitor
  const checkCompetitor = async (id: string, domain: string) => {
    setChecking(id);
    
    try {
      // Simulate check (replace with real API)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const updated = competitors.map(c => {
        if (c.id === id) {
          return {
            ...c,
            citations: Math.floor(Math.random() * 25) + 5,
            change: Math.floor(Math.random() * 10) - 3,
            lastChecked: new Date().toISOString(),
            byPlatform: {
              perplexity: Math.floor(Math.random() * 12),
              googleAio: Math.floor(Math.random() * 10),
              chatgpt: Math.floor(Math.random() * 8),
            },
          };
        }
        return c;
      });
      
      setCompetitors(updated);
      saveCompetitors(updated);
    } catch (error) {
      console.error("Error checking competitor:", error);
    } finally {
      setChecking(null);
    }
  };

  // Remove competitor
  const removeCompetitor = (id: string) => {
    const updated = competitors.filter(c => c.id !== id);
    setCompetitors(updated);
    saveCompetitors(updated);
  };

  const maxCompetitors = plan === "pro" || plan === "pro_plus" ? 10 : 2;
  const canAddMore = competitors.length < maxCompetitors;
  
  // All entries sorted by citations
  const allEntries = [
    { domain: site?.domain || "", citations: yourCitations, isYou: true },
    ...competitors.map(c => ({ domain: c.domain, citations: c.citations, isYou: false })),
  ].sort((a, b) => b.citations - a.citations);
  
  const maxCitations = Math.max(...allEntries.map(e => e.citations), 1);
  const yourRank = allEntries.findIndex(e => e.isYou) + 1;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400/20 to-orange-600/20 flex items-center justify-center border border-orange-500/20">
              <Target className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Competitors</h1>
              <p className="text-sm text-zinc-500">Compare AI visibility</p>
            </div>
          </div>
        </div>
        
        {/* Your Rank */}
        {competitors.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#0a0a0f] border border-white/10">
            {yourRank === 1 ? (
              <Trophy className="w-4 h-4 text-amber-400" />
            ) : yourRank === 2 ? (
              <Medal className="w-4 h-4 text-zinc-400" />
            ) : (
              <Users className="w-4 h-4 text-zinc-500" />
            )}
            <span className="text-sm text-zinc-400">
              You're <span className="font-bold text-white">#{yourRank}</span> of {allEntries.length}
            </span>
          </div>
        )}
      </div>

      {/* ADD COMPETITOR */}
      <Card className="bg-[#0a0a0f] border-white/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Target className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                placeholder="competitor.com"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && canAddMore && addCompetitor()}
                disabled={!canAddMore}
                className="pl-10 bg-white/5 border-white/10 h-11"
              />
            </div>
            <Button
              onClick={addCompetitor}
              disabled={adding || !canAddMore || !newDomain.trim()}
              className="bg-orange-600 hover:bg-orange-500 h-11 px-5"
            >
              {adding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </>
              )}
            </Button>
          </div>
          {!canAddMore && (
            <p className="text-xs text-zinc-500 mt-3 flex items-center gap-2">
              <Crown className="w-3 h-3 text-amber-400" />
              <span>Upgrade to Pro to track up to 10 competitors</span>
              <Link href="/pricing" className="text-emerald-400 hover:underline ml-1">
                Upgrade →
              </Link>
            </p>
          )}
        </CardContent>
      </Card>

      {/* LEADERBOARD */}
      <Card className="bg-[#0a0a0f] border-white/5 overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <Trophy className="w-5 h-5 text-amber-400" />
            <CardTitle className="text-white">Citation Leaderboard</CardTitle>
          </div>
          <CardDescription>See who's winning in AI search</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {competitors.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-zinc-700" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No competitors yet</h3>
              <p className="text-zinc-500 max-w-sm mx-auto">
                Add competitor domains above to compare your AI visibility.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {allEntries.map((entry, idx) => {
                const isYou = entry.isYou;
                const competitor = !isYou ? competitors.find(c => c.domain === entry.domain) : null;
                
                return (
                  <div 
                    key={entry.domain}
                    className={`p-5 ${isYou ? "bg-emerald-500/5" : "hover:bg-white/[0.02]"} transition-colors`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Rank */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        idx === 0 
                          ? "bg-amber-500/20 text-amber-400" 
                          : idx === 1 
                          ? "bg-zinc-500/20 text-zinc-400"
                          : idx === 2
                          ? "bg-orange-500/20 text-orange-400"
                          : "bg-white/5 text-zinc-500"
                      }`}>
                        {idx + 1}
                      </div>
                      
                      {/* Domain */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {isYou && (
                            <Badge className="bg-emerald-500 text-white text-[10px] px-1.5">YOU</Badge>
                          )}
                          <span className={`font-medium ${isYou ? "text-emerald-400" : "text-white"}`}>
                            {entry.domain}
                          </span>
                          {competitor?.change !== undefined && competitor.change !== 0 && (
                            <Badge className={competitor.change > 0 
                              ? "bg-emerald-500/20 text-emerald-400 border-0" 
                              : "bg-red-500/20 text-red-400 border-0"
                            }>
                              {competitor.change > 0 ? (
                                <TrendingUp className="w-3 h-3 mr-1" />
                              ) : (
                                <TrendingDown className="w-3 h-3 mr-1" />
                              )}
                              {Math.abs(competitor.change)}
                            </Badge>
                          )}
                        </div>
                        
                        {/* Progress Bar */}
                        <Progress 
                          value={(entry.citations / maxCitations) * 100} 
                          className={`h-2 ${isYou ? "[&>div]:bg-emerald-500" : "[&>div]:bg-zinc-600"}`}
                        />
                        
                        {/* Platform Breakdown */}
                        {competitor && (
                          <div className="flex gap-4 text-xs text-zinc-500 mt-2">
                            <span className="flex items-center gap-1">
                              <Search className="w-3 h-3 text-violet-400" />
                              {competitor.byPlatform.perplexity}
                            </span>
                            <span className="flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-blue-400" />
                              {competitor.byPlatform.googleAio}
                            </span>
                            <span className="flex items-center gap-1">
                              <Bot className="w-3 h-3 text-emerald-400" />
                              {competitor.byPlatform.chatgpt}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Citation Count */}
                      <div className="text-right">
                        <span className={`text-2xl font-bold font-mono ${isYou ? "text-emerald-400" : "text-white"}`}>
                          {entry.citations}
                        </span>
                        <p className="text-xs text-zinc-500">citations</p>
                      </div>
                      
                      {/* Actions */}
                      {!isYou && competitor && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => checkCompetitor(competitor.id, competitor.domain)}
                            disabled={checking === competitor.id}
                            className="h-8 w-8 text-zinc-500 hover:text-white"
                          >
                            {checking === competitor.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeCompetitor(competitor.id)}
                            className="h-8 w-8 text-zinc-500 hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* UPGRADE CTA */}
      {plan !== "pro" && plan !== "pro_plus" && (
        <Card className="bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-yellow-500/10 border-orange-500/20 overflow-hidden">
          <CardContent className="py-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Track More Competitors</h3>
                <p className="text-sm text-zinc-400">
                  Pro plan includes up to 10 competitor slots
                </p>
              </div>
            </div>
            <Link href="/pricing">
              <Button className="bg-orange-600 hover:bg-orange-500 shadow-lg shadow-orange-500/25">
                Upgrade
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
