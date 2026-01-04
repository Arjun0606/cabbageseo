"use client";

/**
 * ============================================
 * COMPETITORS PAGE
 * ============================================
 * 
 * Track competitor citations and compare to your own.
 * See who's winning in AI search.
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
  ArrowLeft,
  Crown,
  Search,
  Bot,
  Sparkles,
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
  try {
    localStorage.setItem(COMPETITORS_KEY, JSON.stringify(competitors));
  } catch {
    // Ignore
  }
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
      .then(data => {
        setYourCitations(data.data?.total || 0);
      })
      .catch(() => {});
    
    // Fetch plan
    fetch("/api/me")
      .then(res => res.json())
      .then(data => {
        setPlan(data.organization?.plan || "free");
      })
      .catch(() => {});
    
    setLoading(false);
  }, [router]);

  // Add competitor
  const addCompetitor = async () => {
    if (!newDomain.trim()) return;
    
    // Clean domain
    let domain = newDomain.trim().toLowerCase();
    domain = domain.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    
    // Check if already exists
    if (competitors.some(c => c.domain === domain)) {
      setNewDomain("");
      return;
    }
    
    setAdding(true);
    
    // Create competitor entry
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
    
    // Check citations for this competitor
    checkCompetitor(newCompetitor.id, domain);
  };

  // Check competitor citations
  const checkCompetitor = async (id: string, domain: string) => {
    setChecking(id);
    
    try {
      // Note: This would call a dedicated competitor check API
      // For now, we simulate with a slight delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update with mock data (replace with real API call)
      const updated = competitors.map(c => {
        if (c.id === id) {
          return {
            ...c,
            citations: Math.floor(Math.random() * 20),
            change: Math.floor(Math.random() * 10) - 3,
            lastChecked: new Date().toISOString(),
            byPlatform: {
              perplexity: Math.floor(Math.random() * 10),
              googleAio: Math.floor(Math.random() * 8),
              chatgpt: Math.floor(Math.random() * 5),
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

  // Max competitors based on plan
  const maxCompetitors = plan === "pro" || plan === "pro-plus" ? 10 : 2;
  const canAddMore = competitors.length < maxCompetitors;

  // Sort by citations (descending)
  const sorted = [...competitors].sort((a, b) => b.citations - a.citations);
  
  // Find max citations for progress bars
  const maxCitations = Math.max(yourCitations, ...competitors.map(c => c.citations), 1);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Target className="h-6 w-6 text-orange-500" />
              <h1 className="text-2xl font-bold text-white">Competitors</h1>
            </div>
            <p className="text-zinc-400">
              Track how your AI visibility compares to competitors
            </p>
          </div>
        </div>

        {/* ADD COMPETITOR */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Input
                placeholder="competitor.com"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && canAddMore && addCompetitor()}
                disabled={!canAddMore}
                className="flex-1 bg-zinc-800 border-zinc-700"
              />
              <Button
                onClick={addCompetitor}
                disabled={adding || !canAddMore || !newDomain.trim()}
                className="bg-orange-600 hover:bg-orange-500"
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
              <p className="text-xs text-zinc-500 mt-2">
                Upgrade to Pro to track more competitors ({competitors.length}/{maxCompetitors})
              </p>
            )}
          </CardContent>
        </Card>

        {/* COMPARISON CHART */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Citation Comparison</CardTitle>
            <CardDescription>See who's winning in AI search</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Your site */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-500 text-white">You</Badge>
                  <span className="text-white font-medium">{site?.domain}</span>
                </div>
                <span className="text-2xl font-bold text-emerald-400">{yourCitations}</span>
              </div>
              <Progress value={(yourCitations / maxCitations) * 100} className="h-3" />
            </div>

            {/* Competitors */}
            {sorted.length === 0 ? (
              <div className="text-center py-8">
                <Target className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-400">No competitors added yet</p>
                <p className="text-sm text-zinc-500">Add a competitor above to start tracking</p>
              </div>
            ) : (
              sorted.map((comp) => (
                <div key={comp.id} className="space-y-2 p-3 bg-zinc-800/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-white font-medium">{comp.domain}</span>
                      {comp.change !== 0 && (
                        <Badge className={comp.change > 0 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                          {comp.change > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                          {Math.abs(comp.change)}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-bold text-white">{comp.citations}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => checkCompetitor(comp.id, comp.domain)}
                        disabled={checking === comp.id}
                      >
                        {checking === comp.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCompetitor(comp.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Progress 
                    value={(comp.citations / maxCitations) * 100} 
                    className="h-2"
                  />
                  
                  {/* Platform breakdown */}
                  <div className="flex gap-4 text-xs text-zinc-500 mt-2">
                    <span className="flex items-center gap-1">
                      <Search className="w-3 h-3 text-purple-400" />
                      {comp.byPlatform.perplexity}
                    </span>
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-blue-400" />
                      {comp.byPlatform.googleAio}
                    </span>
                    <span className="flex items-center gap-1">
                      <Bot className="w-3 h-3 text-green-400" />
                      {comp.byPlatform.chatgpt}
                    </span>
                    {comp.lastChecked && (
                      <span className="ml-auto">
                        Checked: {new Date(comp.lastChecked).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* UPGRADE CTA */}
        {plan !== "pro" && plan !== "pro-plus" && (
          <Card className="bg-gradient-to-r from-orange-900/30 to-zinc-900 border-orange-500/30">
            <CardContent className="py-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Crown className="w-10 h-10 text-orange-400" />
                <div>
                  <h3 className="text-lg font-bold text-white">Track More Competitors</h3>
                  <p className="text-zinc-400">
                    Upgrade to Pro to track up to 10 competitors
                  </p>
                </div>
              </div>
              <Link href="/pricing">
                <Button className="bg-orange-600 hover:bg-orange-500">
                  Upgrade
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* BACK LINK */}
        <Link href="/dashboard" className="text-zinc-500 hover:text-white flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

