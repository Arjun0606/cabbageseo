"use client";

/**
 * ============================================
 * CITATION INTELLIGENCE - DASHBOARD
 * ============================================
 * 
 * Main dashboard - shows sites, citations, quick actions.
 * Simple, focused, working.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Loader2,
  Globe,
  TrendingUp,
  TrendingDown,
  Plus,
  RefreshCw,
  ArrowRight,
  Search,
  Bot,
  Sparkles,
  Crown,
  Clock,
  Eye,
  Target,
  Bell,
  Zap,
  ChevronRight,
  Activity,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

// Platform config
const platforms = {
  perplexity: { name: "Perplexity", icon: Search, color: "text-violet-400", bg: "bg-violet-500/10" },
  google_aio: { name: "Google AI", icon: Sparkles, color: "text-blue-400", bg: "bg-blue-500/10" },
  chatgpt: { name: "ChatGPT", icon: Bot, color: "text-emerald-400", bg: "bg-emerald-500/10" },
};

interface Site {
  id: string;
  domain: string;
  total_citations: number;
  citations_this_week: number;
  citations_last_week: number;
  last_checked_at: string | null;
}

interface Citation {
  id: string;
  platform: "perplexity" | "google_aio" | "chatgpt";
  query: string;
  snippet: string;
  confidence: string;
  cited_at: string;
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [stats, setStats] = useState({ total: 0, thisWeek: 0, lastWeek: 0, byPlatform: { perplexity: 0, google_aio: 0, chatgpt: 0 } });
  
  const [showAddSite, setShowAddSite] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [addingSite, setAddingSite] = useState(false);
  const [checking, setChecking] = useState(false);
  const [checksRemaining, setChecksRemaining] = useState(100);
  const [plan, setPlan] = useState("starter");

  // Load sites on mount
  useEffect(() => {
    loadData();
  }, []);

  // Load citations when site changes
  useEffect(() => {
    if (selectedSite) {
      loadCitations(selectedSite.id);
      localStorage.setItem("cabbageseo_site_id", selectedSite.id);
    }
  }, [selectedSite]);

  const loadData = async () => {
    try {
      // Load sites
      const sitesRes = await fetch("/api/sites");
      if (sitesRes.ok) {
        const sitesData = await sitesRes.json();
        const siteList = sitesData.sites || [];
        setSites(siteList);
        
        // Select first site or previously selected
        const savedSiteId = localStorage.getItem("cabbageseo_site_id");
        const savedSite = siteList.find((s: Site) => s.id === savedSiteId);
        setSelectedSite(savedSite || siteList[0] || null);
      }

      // Load usage
      const usageRes = await fetch("/api/billing/usage");
      if (usageRes.ok) {
        const usageData = await usageRes.json();
        const used = usageData.data?.usage?.checksUsed || 0;
        const limit = usageData.data?.limits?.checks || 100;
        setChecksRemaining(Math.max(0, limit - used));
      }

      // Load plan
      const meRes = await fetch("/api/me");
      if (meRes.ok) {
        const meData = await meRes.json();
        setPlan(meData.organization?.plan || "free");
      }
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadCitations = async (siteId: string) => {
    try {
      const res = await fetch(`/api/geo/citations?siteId=${siteId}`);
      if (res.ok) {
        const data = await res.json();
        setCitations(data.data?.recent || []);
        setStats({
          total: data.data?.total || 0,
          thisWeek: data.data?.thisWeek || 0,
          lastWeek: data.data?.lastWeek || 0,
          byPlatform: data.data?.byPlatform || { perplexity: 0, google_aio: 0, chatgpt: 0 },
        });
      }
    } catch (err) {
      console.error("Failed to load citations:", err);
    }
  };

  const addSite = async () => {
    if (!newDomain.trim()) return;
    setAddingSite(true);

    try {
      let domain = newDomain.trim().toLowerCase();
      domain = domain.replace(/^https?:\/\//, "").replace(/\/.*$/, "");

      const res = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.site) {
          setSites(prev => [data.site, ...prev]);
          setSelectedSite(data.site);
          setShowAddSite(false);
          setNewDomain("");
          // Run initial check
          runCheck(data.site.id, domain);
        }
      }
    } catch (err) {
      console.error("Failed to add site:", err);
    } finally {
      setAddingSite(false);
    }
  };

  const runCheck = async (siteId?: string, domain?: string) => {
    const id = siteId || selectedSite?.id;
    const dom = domain || selectedSite?.domain;
    if (!id || !dom) return;

    setChecking(true);
    try {
      const res = await fetch("/api/geo/citations/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId: id, domain: dom }),
      });

      if (res.ok) {
        setChecksRemaining(prev => Math.max(0, prev - 1));
        await loadCitations(id);
        // Refresh sites to get updated counts
        const sitesRes = await fetch("/api/sites");
        if (sitesRes.ok) {
          const sitesData = await sitesRes.json();
          setSites(sitesData.sites || []);
        }
      }
    } catch (err) {
      console.error("Check failed:", err);
    } finally {
      setChecking(false);
    }
  };

  const deleteSite = async (siteId: string) => {
    try {
      await fetch(`/api/sites?id=${siteId}`, { method: "DELETE" });
      setSites(prev => prev.filter(s => s.id !== siteId));
      if (selectedSite?.id === siteId) {
        setSelectedSite(sites.find(s => s.id !== siteId) || null);
      }
    } catch (err) {
      console.error("Failed to delete site:", err);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  // No sites - onboarding
  if (sites.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px]" />
          </div>
          
          <Card className="relative bg-[#0a0a0f] border-white/10">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/30">
                <Eye className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Track Your AI Citations</h1>
              <p className="text-zinc-400 mb-6">
                Know when ChatGPT, Perplexity, or Google AI mentions your website.
              </p>
              
              <div className="space-y-3">
                <Input
                  placeholder="yoursite.com"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addSite()}
                  className="h-12 bg-white/5 border-white/10"
                />
                <Button
                  onClick={addSite}
                  disabled={addingSite || !newDomain.trim()}
                  className="w-full h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500"
                >
                  {addingSite ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Setting up...</>
                  ) : (
                    <><Eye className="w-4 h-4 mr-2" /> Start Tracking</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Main dashboard
  const weekChange = stats.lastWeek > 0 
    ? Math.round(((stats.thisWeek - stats.lastWeek) / stats.lastWeek) * 100) 
    : stats.thisWeek > 0 ? 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Globe className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">{selectedSite?.domain}</h1>
              {sites.length > 1 && (
                <select
                  value={selectedSite?.id}
                  onChange={(e) => setSelectedSite(sites.find(s => s.id === e.target.value) || null)}
                  className="bg-transparent text-zinc-400 text-sm cursor-pointer hover:text-white"
                >
                  {sites.map(s => (
                    <option key={s.id} value={s.id} className="bg-zinc-900">{s.domain}</option>
                  ))}
                </select>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <Activity className="w-3 h-3 text-emerald-400" />
              Tracking active
              {selectedSite?.last_checked_at && (
                <> • Last check {new Date(selectedSite.last_checked_at).toLocaleTimeString()}</>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddSite(true)}
            className="border-white/10"
          >
            <Plus className="w-4 h-4 mr-1" /> Add Site
          </Button>
          <Badge variant="outline" className="border-white/10 text-zinc-400 font-mono">
            {checksRemaining} checks
          </Badge>
          <Button
            onClick={() => runCheck()}
            disabled={checking || checksRemaining <= 0}
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500"
          >
            {checking ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Checking...</>
            ) : (
              <><RefreshCw className="w-4 h-4 mr-2" /> Check Now</>
            )}
          </Button>
        </div>
      </div>

      {/* Add Site Modal */}
      {showAddSite && (
        <Card className="bg-[#0a0a0f] border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Input
                placeholder="newsite.com"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addSite()}
                className="bg-white/5 border-white/10"
              />
              <Button onClick={addSite} disabled={addingSite} className="bg-emerald-600">
                {addingSite ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}
              </Button>
              <Button variant="ghost" onClick={() => setShowAddSite(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-emerald-400/80">Total Citations</p>
                <p className="text-3xl font-bold text-white font-mono mt-1">{stats.total}</p>
              </div>
              <Eye className="w-5 h-5 text-emerald-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0a0a0f] border-white/5">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-zinc-500">This Week</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-3xl font-bold text-white font-mono">{stats.thisWeek}</p>
                  {weekChange !== 0 && (
                    <Badge className={weekChange > 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}>
                      {weekChange > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                      {Math.abs(weekChange)}%
                    </Badge>
                  )}
                </div>
              </div>
              <TrendingUp className="w-5 h-5 text-zinc-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0a0a0f] border-white/5">
          <CardContent className="p-5">
            <p className="text-sm text-violet-400/80 flex items-center gap-1"><Search className="w-3 h-3" /> Perplexity</p>
            <p className="text-3xl font-bold text-white font-mono mt-1">{stats.byPlatform.perplexity}</p>
          </CardContent>
        </Card>

        <Card className="bg-[#0a0a0f] border-white/5">
          <CardContent className="p-5">
            <p className="text-sm text-blue-400/80 flex items-center gap-1"><Sparkles className="w-3 h-3" /> Google AI</p>
            <p className="text-3xl font-bold text-white font-mono mt-1">{stats.byPlatform.google_aio}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Citations */}
        <div className="lg:col-span-2">
          <Card className="bg-[#0a0a0f] border-white/5">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-zinc-500" />
                <CardTitle className="text-white text-lg">Recent Citations</CardTitle>
              </div>
              {citations.length > 0 && (
                <Link href="/citations">
                  <Button variant="ghost" size="sm" className="text-zinc-400">
                    View all <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {citations.length === 0 ? (
                <div className="text-center py-12 px-6">
                  <Eye className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No citations yet</h3>
                  <p className="text-zinc-500">Click "Check Now" to scan AI platforms</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {citations.slice(0, 5).map((c) => {
                    const p = platforms[c.platform];
                    const Icon = p.icon;
                    return (
                      <div key={c.id} className="p-4 hover:bg-white/[0.02]">
                        <div className="flex gap-3">
                          <div className={`w-9 h-9 rounded-lg ${p.bg} flex items-center justify-center shrink-0`}>
                            <Icon className={`w-4 h-4 ${p.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-sm font-medium ${p.color}`}>{p.name}</span>
                              <Badge variant="outline" className="text-[10px] border-white/10 text-zinc-500">
                                {c.confidence}
                              </Badge>
                              <span className="text-xs text-zinc-600 ml-auto">
                                {new Date(c.cited_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-zinc-300 line-clamp-1">"{c.query}"</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="bg-[#0a0a0f] border-white/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" /> Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <Link href="/citations">
                <Button variant="ghost" className="w-full justify-between h-10 text-zinc-400 hover:text-white hover:bg-white/5">
                  <span className="flex items-center gap-2"><Eye className="w-4 h-4 text-emerald-400" /> All Citations</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/competitors">
                <Button variant="ghost" className="w-full justify-between h-10 text-zinc-400 hover:text-white hover:bg-white/5">
                  <span className="flex items-center gap-2"><Target className="w-4 h-4 text-orange-400" /> Competitors</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/analyze">
                <Button variant="ghost" className="w-full justify-between h-10 text-zinc-400 hover:text-white hover:bg-white/5">
                  <span className="flex items-center gap-2"><Search className="w-4 h-4 text-violet-400" /> Analyze Domain</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Sites List */}
          {sites.length > 1 && (
            <Card className="bg-[#0a0a0f] border-white/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-base">Your Sites</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {sites.map(site => (
                  <div
                    key={site.id}
                    className={`p-3 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                      selectedSite?.id === site.id ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-white/5 hover:bg-white/10"
                    }`}
                    onClick={() => setSelectedSite(site)}
                  >
                    <div>
                      <p className="text-sm text-white font-medium">{site.domain}</p>
                      <p className="text-xs text-zinc-500">{site.total_citations} citations</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => { e.stopPropagation(); deleteSite(site.id); }}
                      className="h-8 w-8 text-zinc-500 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Upgrade */}
          {plan !== "pro" && plan !== "pro_plus" && (
            <Card className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/5 border-emerald-500/20">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Crown className="w-8 h-8 text-emerald-400" />
                  <div>
                    <h3 className="font-medium text-white">Upgrade to Pro</h3>
                    <p className="text-xs text-zinc-400">Unlimited checks</p>
                  </div>
                </div>
                <Link href="/pricing">
                  <Button className="w-full bg-white text-zinc-900 hover:bg-zinc-100">
                    View Plans <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
