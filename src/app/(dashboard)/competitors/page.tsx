"use client";

/**
 * ============================================
 * COMPETITORS PAGE
 * ============================================
 * 
 * Track competitor AI citations.
 * Compare your visibility to competitors.
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

const platforms = {
  perplexity: { icon: Search, color: "text-violet-400" },
  google_aio: { icon: Sparkles, color: "text-blue-400" },
  chatgpt: { icon: Bot, color: "text-emerald-400" },
};

interface Competitor {
  id: string;
  domain: string;
  total_citations: number;
  citations_change: number;
  last_checked_at: string | null;
}

interface Site {
  id: string;
  domain: string;
  total_citations: number;
}

export default function CompetitorsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [site, setSite] = useState<Site | null>(null);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [newDomain, setNewDomain] = useState("");
  const [adding, setAdding] = useState(false);
  const [checking, setChecking] = useState<string | null>(null);
  const [plan, setPlan] = useState("starter");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Get sites
      const sitesRes = await fetch("/api/sites");
      if (!sitesRes.ok) {
        router.push("/dashboard");
        return;
      }

      const sitesData = await sitesRes.json();
      const sites = sitesData.sites || [];
      
      if (sites.length === 0) {
        router.push("/dashboard");
        return;
      }

      const savedId = localStorage.getItem("cabbageseo_site_id");
      const selectedSite = sites.find((s: Site) => s.id === savedId) || sites[0];
      setSite(selectedSite);

      // Get plan
      const meRes = await fetch("/api/me");
      if (meRes.ok) {
        const meData = await meRes.json();
        setPlan(meData.organization?.plan || "free");
      }

      // Load competitors from localStorage (for now - could be API later)
      const saved = localStorage.getItem(`competitors_${selectedSite.id}`);
      if (saved) {
        setCompetitors(JSON.parse(saved));
      }
    } catch (err) {
      console.error("Failed to load:", err);
    } finally {
      setLoading(false);
    }
  };

  const saveCompetitors = (comps: Competitor[]) => {
    if (site) {
      localStorage.setItem(`competitors_${site.id}`, JSON.stringify(comps));
    }
    setCompetitors(comps);
  };

  const addCompetitor = async () => {
    if (!newDomain.trim() || !site) return;

    let domain = newDomain.trim().toLowerCase();
    domain = domain.replace(/^https?:\/\//, "").replace(/\/.*$/, "");

    if (competitors.some(c => c.domain === domain)) {
      setNewDomain("");
      return;
    }

    setAdding(true);

    const newComp: Competitor = {
      id: Date.now().toString(),
      domain,
      total_citations: 0,
      citations_change: 0,
      last_checked_at: null,
    };

    const updated = [...competitors, newComp];
    saveCompetitors(updated);
    setNewDomain("");
    setAdding(false);

    // Check this competitor
    checkCompetitor(newComp);
  };

  const checkCompetitor = async (comp: Competitor) => {
    setChecking(comp.id);

    try {
      // Create a temp site for this domain to check
      const siteRes = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: comp.domain }),
      });

      if (siteRes.ok) {
        const siteData = await siteRes.json();
        const tempSiteId = siteData.site?.id;

        if (tempSiteId) {
          // Run check
          const checkRes = await fetch("/api/geo/citations/check", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ siteId: tempSiteId, domain: comp.domain }),
          });

          if (checkRes.ok) {
            const checkData = await checkRes.json();
            const totalCitations = checkData.totalNewCitations || 0;

            // Update competitor
            const updated = competitors.map(c => {
              if (c.id === comp.id) {
                return {
                  ...c,
                  total_citations: totalCitations,
                  citations_change: totalCitations - c.total_citations,
                  last_checked_at: new Date().toISOString(),
                };
              }
              return c;
            });
            saveCompetitors(updated);
          }

          // Clean up temp site (optional - could keep for tracking)
          // await fetch(`/api/sites?id=${tempSiteId}`, { method: "DELETE" });
        }
      }
    } catch (err) {
      console.error("Failed to check competitor:", err);
    } finally {
      setChecking(null);
    }
  };

  const removeCompetitor = (id: string) => {
    saveCompetitors(competitors.filter(c => c.id !== id));
  };

  // Limits
  const maxCompetitors = plan === "pro" || plan === "pro_plus" ? 10 : plan === "starter" ? 2 : 0;
  const canAddMore = competitors.length < maxCompetitors;

  // Leaderboard
  const allEntries = [
    { domain: site?.domain || "", citations: site?.total_citations || 0, isYou: true },
    ...competitors.map(c => ({ domain: c.domain, citations: c.total_citations, isYou: false })),
  ].sort((a, b) => b.citations - a.citations);

  const maxCitations = Math.max(...allEntries.map(e => e.citations), 1);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
          <Target className="w-5 h-5 text-orange-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Competitors</h1>
          <p className="text-sm text-zinc-500">Compare AI visibility</p>
        </div>
      </div>

      {/* Add Competitor */}
      <Card className="bg-[#0a0a0f] border-white/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input
                placeholder="competitor.com"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && canAddMore && addCompetitor()}
                disabled={!canAddMore}
                className="pl-10 bg-white/5 border-white/10"
              />
            </div>
            <Button
              onClick={addCompetitor}
              disabled={adding || !canAddMore || !newDomain.trim()}
              className="bg-orange-600 hover:bg-orange-500"
            >
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4 mr-2" /> Add</>}
            </Button>
          </div>
          {!canAddMore && maxCompetitors > 0 && (
            <p className="text-xs text-zinc-500 mt-3 flex items-center gap-2">
              <Crown className="w-3 h-3 text-amber-400" />
              Upgrade to track more competitors ({competitors.length}/{maxCompetitors})
              <Link href="/pricing" className="text-emerald-400 hover:underline">Upgrade →</Link>
            </p>
          )}
          {maxCompetitors === 0 && (
            <p className="text-xs text-zinc-500 mt-3 flex items-center gap-2">
              <Crown className="w-3 h-3 text-amber-400" />
              Upgrade to Starter or Pro to track competitors
              <Link href="/pricing" className="text-emerald-400 hover:underline">Upgrade →</Link>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Leaderboard */}
      <Card className="bg-[#0a0a0f] border-white/5">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <CardTitle className="text-white">Citation Leaderboard</CardTitle>
          </div>
          <CardDescription>Who's winning in AI search</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {competitors.length === 0 ? (
            <div className="text-center py-12 px-6">
              <Target className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No competitors yet</h3>
              <p className="text-zinc-500">Add competitor domains above to compare</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {allEntries.map((entry, idx) => {
                const isYou = entry.isYou;
                const comp = !isYou ? competitors.find(c => c.domain === entry.domain) : null;
                
                return (
                  <div
                    key={entry.domain}
                    className={`p-5 ${isYou ? "bg-emerald-500/5" : "hover:bg-white/[0.02]"} transition-colors`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Rank */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        idx === 0 ? "bg-amber-500/20 text-amber-400" :
                        idx === 1 ? "bg-zinc-500/20 text-zinc-400" :
                        idx === 2 ? "bg-orange-500/20 text-orange-400" :
                        "bg-white/5 text-zinc-500"
                      }`}>
                        {idx + 1}
                      </div>

                      {/* Domain */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {isYou && (
                            <Badge className="bg-emerald-500 text-white text-[10px]">YOU</Badge>
                          )}
                          <span className={`font-medium ${isYou ? "text-emerald-400" : "text-white"}`}>
                            {entry.domain}
                          </span>
                          {comp?.citations_change !== undefined && comp.citations_change !== 0 && (
                            <Badge className={comp.citations_change > 0 
                              ? "bg-emerald-500/20 text-emerald-400" 
                              : "bg-red-500/20 text-red-400"
                            }>
                              {comp.citations_change > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                              {Math.abs(comp.citations_change)}
                            </Badge>
                          )}
                        </div>
                        <Progress
                          value={(entry.citations / maxCitations) * 100}
                          className={`h-2 ${isYou ? "[&>div]:bg-emerald-500" : "[&>div]:bg-zinc-600"}`}
                        />
                      </div>

                      {/* Citations */}
                      <div className="text-right">
                        <span className={`text-2xl font-bold font-mono ${isYou ? "text-emerald-400" : "text-white"}`}>
                          {entry.citations}
                        </span>
                        <p className="text-xs text-zinc-500">citations</p>
                      </div>

                      {/* Actions */}
                      {!isYou && comp && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => checkCompetitor(comp)}
                            disabled={checking === comp.id}
                            className="h-8 w-8 text-zinc-500 hover:text-white"
                          >
                            {checking === comp.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <RefreshCw className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeCompetitor(comp.id)}
                            className="h-8 w-8 text-zinc-500 hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Upgrade CTA */}
      {plan !== "pro" && plan !== "pro_plus" && (
        <Card className="bg-gradient-to-br from-orange-500/10 to-amber-500/5 border-orange-500/20">
          <CardContent className="py-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Crown className="w-10 h-10 text-orange-400" />
              <div>
                <h3 className="font-medium text-white">Track More Competitors</h3>
                <p className="text-sm text-zinc-400">Pro plan: up to 10 competitors</p>
              </div>
            </div>
            <Link href="/pricing">
              <Button className="bg-orange-600 hover:bg-orange-500">Upgrade</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
