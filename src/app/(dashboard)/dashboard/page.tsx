"use client";

/**
 * ============================================
 * CITATION INTELLIGENCE - DASHBOARD
 * ============================================
 * 
 * FIXED: Properly loads from API, no mock data.
 * Clean, working dashboard.
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Loader2,
  Globe,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Search,
  Bot,
  Sparkles,
  Eye,
  ArrowRight,
  ExternalLink,
  Brain,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

// Platform config
const platformConfig = {
  perplexity: { name: "Perplexity", icon: Search, color: "text-violet-400", bg: "bg-violet-500/10" },
  google_aio: { name: "Google AI", icon: Sparkles, color: "text-blue-400", bg: "bg-blue-500/10" },
  chatgpt: { name: "ChatGPT", icon: Bot, color: "text-emerald-400", bg: "bg-emerald-500/10" },
};

interface Site {
  id: string;
  domain: string;
  totalCitations: number;
  citationsThisWeek: number;
  lastCheckedAt: string | null;
}

interface Citation {
  id: string;
  platform: "perplexity" | "google_aio" | "chatgpt";
  query: string;
  snippet: string;
  confidence: number;
  discovered_at: string;
}

export default function Dashboard() {
  // State
  const [loading, setLoading] = useState(true);
  const [site, setSite] = useState<Site | null>(null);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    thisWeek: 0,
    lastWeek: 0,
    byPlatform: { perplexity: 0, google_aio: 0, chatgpt: 0 },
  });
  const [plan, setPlan] = useState("free");
  const [checksUsed, setChecksUsed] = useState(0);
  const [checksLimit, setChecksLimit] = useState(100);
  
  // Add site form
  const [newDomain, setNewDomain] = useState("");
  const [addingSite, setAddingSite] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load all data
  const loadData = useCallback(async () => {
    try {
      setError(null);
      
      // Get user data including sites
      const meRes = await fetch("/api/me");
      const meData = await meRes.json();
      
      if (!meData.authenticated) {
        window.location.href = "/login";
        return;
      }
      
      setPlan(meData.organization?.plan || "free");
      
      // Get sites from /api/sites (more reliable)
      const sitesRes = await fetch("/api/sites");
      const sitesData = await sitesRes.json();
      const sites = sitesData.sites || [];
      
      if (sites.length > 0) {
        // Use the first site or saved site
        const savedSiteId = localStorage.getItem("cabbageseo_site_id");
        const selectedSite = sites.find((s: any) => s.id === savedSiteId) || sites[0];
        
        setSite({
          id: selectedSite.id,
          domain: selectedSite.domain,
          totalCitations: selectedSite.total_citations || 0,
          citationsThisWeek: selectedSite.citations_this_week || 0,
          lastCheckedAt: selectedSite.last_checked_at,
        });
        
        localStorage.setItem("cabbageseo_site_id", selectedSite.id);
        
        // Load citations for this site
        await loadCitations(selectedSite.id);
      } else {
        setSite(null);
        // Clear stale localStorage
        localStorage.removeItem("cabbageseo_site_id");
        localStorage.removeItem("cabbageseo_site");
      }
      
      // Get usage
      const usageRes = await fetch("/api/billing/usage");
      if (usageRes.ok) {
        const usageData = await usageRes.json();
        setChecksUsed(usageData.data?.usage?.checksUsed || 0);
        setChecksLimit(usageData.data?.limits?.checks || 100);
      }
    } catch (err) {
      console.error("Dashboard load error:", err);
      setError("Failed to load data. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load citations for a site
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

  // Add a new site
  const addSite = async () => {
    if (!newDomain.trim()) return;
    setAddingSite(true);
    setError(null);

    try {
      let domain = newDomain.trim().toLowerCase();
      domain = domain.replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "");

      const res = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      });

      const data = await res.json();

      if (res.ok && data.site) {
        setSite({
          id: data.site.id,
          domain: data.site.domain,
          totalCitations: 0,
          citationsThisWeek: 0,
          lastCheckedAt: null,
        });
        localStorage.setItem("cabbageseo_site_id", data.site.id);
        setNewDomain("");
        
        // Run initial check
        await runCheck(data.site.id, data.site.domain);
      } else {
        setError(data.error || "Failed to add site");
      }
    } catch (err) {
      console.error("Failed to add site:", err);
      setError("Failed to add site. Please try again.");
    } finally {
      setAddingSite(false);
    }
  };

  // Run citation check
  const runCheck = async (siteId?: string, domain?: string) => {
    const id = siteId || site?.id;
    const dom = domain || site?.domain;
    if (!id || !dom) return;

    setChecking(true);
    setError(null);

    try {
      const res = await fetch("/api/geo/citations/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId: id, domain: dom }),
      });

      const data = await res.json();

      if (res.ok) {
        setChecksUsed(prev => prev + 1);
        // Reload citations
        await loadCitations(id);
        // Refresh site data
        await loadData();
      } else {
        setError(data.error || "Check failed. Try again.");
      }
    } catch (err) {
      console.error("Check failed:", err);
      setError("Check failed. Please try again.");
    } finally {
      setChecking(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Listen for site changes from SiteSwitcher
  useEffect(() => {
    const handleSiteChange = (e: CustomEvent) => {
      if (e.detail?.id && e.detail?.id !== site?.id) {
        loadData();
      }
    };
    window.addEventListener("site-changed", handleSiteChange as EventListener);
    return () => window.removeEventListener("site-changed", handleSiteChange as EventListener);
  }, [site?.id, loadData]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-4" />
          <p className="text-zinc-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // No site - onboarding
  if (!site) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="max-w-md w-full relative">
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
              
              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}
              
              <div className="space-y-3">
                <Input
                  placeholder="yoursite.com"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addSite()}
                  className="h-12 bg-white/5 border-white/10 text-center"
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

  // Calculate week change
  const weekChange = stats.lastWeek > 0 
    ? Math.round(((stats.thisWeek - stats.lastWeek) / stats.lastWeek) * 100) 
    : stats.thisWeek > 0 ? 100 : 0;

  // Main dashboard
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{site.domain}</h1>
          <p className="text-zinc-500 text-sm mt-1">
            {site.lastCheckedAt 
              ? `Last checked ${new Date(site.lastCheckedAt).toLocaleDateString()}`
              : "Never checked"
            }
          </p>
        </div>
        <Button
          onClick={() => runCheck()}
          disabled={checking || checksUsed >= checksLimit}
          className="bg-emerald-600 hover:bg-emerald-500"
        >
          {checking ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Checking...</>
          ) : (
            <><RefreshCw className="w-4 h-4 mr-2" /> Check Now</>
          )}
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4">
            <div className="text-3xl font-bold text-white">{stats.total}</div>
            <p className="text-sm text-zinc-500">Total Citations</p>
          </CardContent>
        </Card>
        
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-white">{stats.thisWeek}</span>
              {weekChange !== 0 && (
                <Badge className={weekChange > 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}>
                  {weekChange > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                  {weekChange > 0 ? "+" : ""}{weekChange}%
                </Badge>
              )}
            </div>
            <p className="text-sm text-zinc-500">This Week</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4">
            <div className="text-3xl font-bold text-white">{checksUsed}/{checksLimit === -1 ? "∞" : checksLimit}</div>
            <p className="text-sm text-zinc-500">Checks Used</p>
            <Progress value={checksLimit === -1 ? 0 : (checksUsed / checksLimit) * 100} className="h-1 mt-2 bg-zinc-800" />
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4">
            <div className="text-3xl font-bold text-white capitalize">{plan}</div>
            <p className="text-sm text-zinc-500">Current Plan</p>
            {plan === "free" && (
              <Link href="/pricing">
                <Button size="sm" variant="outline" className="mt-2 h-7 text-xs border-emerald-500/30 text-emerald-400">
                  Upgrade
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Platform Breakdown */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-white">Platform Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(platformConfig).map(([key, config]) => {
              const count = stats.byPlatform[key as keyof typeof stats.byPlatform] || 0;
              const Icon = config.icon;
              return (
                <div key={key} className={`p-4 rounded-xl ${config.bg}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-4 h-4 ${config.color}`} />
                    <span className={`text-sm font-medium ${config.color}`}>{config.name}</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{count}</div>
                  <p className="text-xs text-zinc-500">citations</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Citations */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-lg text-white">Recent Citations</CardTitle>
          <Link href="/citations">
            <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {citations.length === 0 ? (
            <div className="text-center py-8">
              <Eye className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500">No citations found yet</p>
              <p className="text-zinc-600 text-sm mt-1">Click "Check Now" to scan AI platforms</p>
            </div>
          ) : (
            <div className="space-y-3">
              {citations.slice(0, 5).map((citation) => {
                const platform = platformConfig[citation.platform];
                const Icon = platform?.icon || Search;
                return (
                  <div key={citation.id} className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5">
                    <div className={`p-2 rounded-lg ${platform?.bg || "bg-zinc-800"}`}>
                      <Icon className={`w-4 h-4 ${platform?.color || "text-zinc-400"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">"{citation.query}"</p>
                      <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{citation.snippet}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-zinc-600">{platform?.name}</span>
                        <span className="text-zinc-700">•</span>
                        <span className="text-xs text-zinc-600">
                          {new Date(citation.discovered_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Link href="/intelligence">
          <Card className="bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border-emerald-500/20 hover:border-emerald-500/40 transition-all cursor-pointer">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-500/20">
                <Brain className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">GEO Intelligence</h3>
                <p className="text-sm text-zinc-400">Get your GEO Score & tips</p>
              </div>
              <ArrowRight className="w-5 h-5 text-zinc-600 ml-auto" />
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/competitors">
          <Card className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-violet-500/10">
                <Target className="w-6 h-6 text-violet-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Competitors</h3>
                <p className="text-sm text-zinc-400">Track competitor citations</p>
              </div>
              <ArrowRight className="w-5 h-5 text-zinc-600 ml-auto" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
