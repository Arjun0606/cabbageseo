"use client";

/**
 * ============================================
 * CITATION INTELLIGENCE - DASHBOARD
 * ============================================
 * 
 * Beautiful, focused dashboard for tracking AI citations.
 * Clean design, clear metrics, actionable insights.
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  ExternalLink,
  ChevronRight,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

// ============================================
// TYPES
// ============================================

interface Citation {
  id: string;
  platform: "perplexity" | "google_aio" | "chatgpt";
  query: string;
  snippet: string;
  pageUrl: string;
  confidence: "high" | "medium" | "low";
  firstSeenAt: string;
}

interface SiteData {
  id: string;
  domain: string;
  name: string;
}

// ============================================
// PLATFORM COMPONENTS
// ============================================

const platformConfig = {
  perplexity: {
    name: "Perplexity",
    icon: Search,
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    glow: "shadow-violet-500/10",
  },
  google_aio: {
    name: "Google AI",
    icon: Sparkles,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    glow: "shadow-blue-500/10",
  },
  chatgpt: {
    name: "ChatGPT",
    icon: Bot,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    glow: "shadow-emerald-500/10",
  },
};

function PlatformBadge({ platform }: { platform: keyof typeof platformConfig }) {
  const config = platformConfig[platform];
  const Icon = config.icon;
  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full ${config.bg} ${config.border} border`}>
      <Icon className={`w-3 h-3 ${config.color}`} />
      <span className={`text-xs font-medium ${config.color}`}>{config.name}</span>
    </div>
  );
}

// ============================================
// STORAGE
// ============================================

const SITE_KEY = "cabbageseo_site";

function loadSite(): SiteData | null {
  if (typeof window === "undefined") return null;
  try {
    const data = localStorage.getItem(SITE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

function saveSite(site: SiteData) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SITE_KEY, JSON.stringify(site));
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function CitationDashboard() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [site, setSite] = useState<SiteData | null>(null);
  const [newDomain, setNewDomain] = useState("");
  const [addingSite, setAddingSite] = useState(false);
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    thisWeek: 0,
    lastWeek: 0,
    byPlatform: { perplexity: 0, googleAio: 0, chatgpt: 0 },
  });
  const [recentCitations, setRecentCitations] = useState<Citation[]>([]);
  const [checking, setChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  
  // Plan
  const [checksRemaining, setChecksRemaining] = useState(100);
  const [plan, setPlan] = useState("starter");

  // ============================================
  // LOAD DATA
  // ============================================

  useEffect(() => {
    const cached = loadSite();
    if (cached) {
      setSite(cached);
      fetchCitations(cached.id);
    }
    
    // Fetch plan and usage
    Promise.all([
      fetch("/api/me").then(r => r.json()),
      fetch("/api/billing/usage").then(r => r.json()),
    ]).then(([meData, usageData]) => {
      setPlan(meData.organization?.plan || "free");
      const used = usageData.data?.usage?.checksUsed || 0;
      const limit = usageData.data?.limits?.checks || 100;
      setChecksRemaining(Math.max(0, limit - used));
    }).catch(() => {});
    
    setLoading(false);
  }, []);

  const fetchCitations = useCallback(async (siteId: string) => {
    try {
      const res = await fetch(`/api/geo/citations?siteId=${siteId}`);
      if (!res.ok) return;
      
      const data = await res.json();
      if (data.data) {
        setStats({
          total: data.data.total || 0,
          thisWeek: data.data.thisWeek || 0,
          lastWeek: data.data.lastWeek || 0,
          byPlatform: {
            perplexity: data.data.byPlatform?.perplexity || 0,
            googleAio: data.data.byPlatform?.google_aio || 0,
            chatgpt: data.data.byPlatform?.chatgpt || 0,
          },
        });
        if (data.data.recent) {
          setRecentCitations(data.data.recent.slice(0, 5));
        }
      }
    } catch (error) {
      console.error("Failed to fetch citations:", error);
    }
  }, []);

  // ============================================
  // ADD SITE
  // ============================================

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
      
      if (!res.ok) throw new Error("Failed to add site");
      
      const data = await res.json();
      const newSite: SiteData = {
        id: data.site?.id || data.id,
        domain,
        name: domain,
      };
      
      setSite(newSite);
      saveSite(newSite);
      setNewDomain("");
      runCitationCheck(newSite.id, domain);
    } catch (error) {
      console.error("Error adding site:", error);
    } finally {
      setAddingSite(false);
    }
  };

  // ============================================
  // CHECK CITATIONS
  // ============================================

  const runCitationCheck = async (siteId?: string, domain?: string) => {
    const checkSiteId = siteId || site?.id;
    const checkDomain = domain || site?.domain;
    if (!checkSiteId || !checkDomain) return;
    
    setChecking(true);
    try {
      const res = await fetch("/api/geo/citations/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId: checkSiteId, domain: checkDomain }),
      });
      
      if (res.ok) {
        setLastCheck(new Date());
        await fetchCitations(checkSiteId);
        setChecksRemaining(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Citation check failed:", error);
    } finally {
      setChecking(false);
    }
  };

  // ============================================
  // RENDER: LOADING
  // ============================================

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center animate-pulse">
            <Eye className="w-6 h-6 text-white" />
          </div>
          <p className="text-zinc-500">Loading...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER: ONBOARDING
  // ============================================

  if (!site) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="max-w-md w-full">
          {/* Decorative glow */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px]" />
          </div>
          
          <div className="relative bg-[#0a0a0f] border border-white/10 rounded-3xl p-8 shadow-2xl">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
                <Eye className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Track Your AI Citations
              </h1>
              <p className="text-zinc-400">
                Know when ChatGPT, Perplexity, or Google AI mentions your website.
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-zinc-400 block mb-2">Your website</label>
                <Input
                  placeholder="yoursite.com"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addSite()}
                  className="bg-white/5 border-white/10 text-white h-12 rounded-xl focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              
              <Button
                onClick={addSite}
                disabled={addingSite || !newDomain.trim()}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-medium shadow-lg shadow-emerald-500/25"
              >
                {addingSite ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Start Tracking
                  </>
                )}
              </Button>
            </div>
            
            {/* Platform badges */}
            <div className="mt-8 pt-6 border-t border-white/5">
              <p className="text-xs text-zinc-500 text-center mb-4">We monitor these AI platforms</p>
              <div className="flex justify-center gap-3">
                <PlatformBadge platform="perplexity" />
                <PlatformBadge platform="google_aio" />
                <PlatformBadge platform="chatgpt" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER: DASHBOARD
  // ============================================

  const weekChange = stats.lastWeek > 0 
    ? Math.round(((stats.thisWeek - stats.lastWeek) / stats.lastWeek) * 100)
    : stats.thisWeek > 0 ? 100 : 0;

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400/20 to-emerald-600/20 flex items-center justify-center border border-emerald-500/20">
              <Globe className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{site.domain}</h1>
              <div className="flex items-center gap-2 text-sm text-zinc-500">
                <Activity className="w-3 h-3 text-emerald-400" />
                <span>Tracking active</span>
                {lastCheck && (
                  <>
                    <span>•</span>
                    <span>Last check {lastCheck.toLocaleTimeString()}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="border-white/10 text-zinc-400 font-mono">
            {checksRemaining} checks left
          </Badge>
          <Button
            onClick={() => runCitationCheck()}
            disabled={checking || checksRemaining <= 0}
            className="gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 shadow-lg shadow-emerald-500/20"
          >
            {checking ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Check Now
              </>
            )}
          </Button>
        </div>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Citations */}
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 shadow-xl shadow-emerald-500/5">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-400/80">Total Citations</p>
                <p className="text-4xl font-bold text-white mt-2 font-mono">{stats.total}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Eye className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* This Week */}
        <Card className="bg-[#0a0a0f] border-white/5">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-500">This Week</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <p className="text-4xl font-bold text-white font-mono">{stats.thisWeek}</p>
                  {weekChange !== 0 && (
                    <Badge className={weekChange > 0 
                      ? "bg-emerald-500/20 text-emerald-400 border-0" 
                      : "bg-red-500/20 text-red-400 border-0"
                    }>
                      {weekChange > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                      {Math.abs(weekChange)}%
                    </Badge>
                  )}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-zinc-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Perplexity */}
        <Card className="bg-[#0a0a0f] border-white/5">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-violet-400/80 flex items-center gap-1.5">
                  <Search className="w-3 h-3" /> Perplexity
                </p>
                <p className="text-4xl font-bold text-white mt-2 font-mono">{stats.byPlatform.perplexity}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                <Search className="w-5 h-5 text-violet-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Google AI */}
        <Card className="bg-[#0a0a0f] border-white/5">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-blue-400/80 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" /> Google AI
                </p>
                <p className="text-4xl font-bold text-white mt-2 font-mono">{stats.byPlatform.googleAio}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MAIN CONTENT */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Citations */}
        <div className="lg:col-span-2">
          <Card className="bg-[#0a0a0f] border-white/5 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-zinc-400" />
                </div>
                <CardTitle className="text-white font-semibold">Recent Citations</CardTitle>
              </div>
              {recentCitations.length > 0 && (
                <Link href="/citations">
                  <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white gap-1">
                    View all <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {recentCitations.length === 0 ? (
                <div className="text-center py-16 px-6">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                    <Eye className="w-8 h-8 text-zinc-700" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">No citations yet</h3>
                  <p className="text-zinc-500 max-w-sm mx-auto">
                    Click "Check Now" to scan AI platforms for mentions of your website.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {recentCitations.map((citation) => {
                    const config = platformConfig[citation.platform];
                    const Icon = config.icon;
                    return (
                      <div
                        key={citation.id}
                        className="p-4 hover:bg-white/[0.02] transition-colors"
                      >
                        <div className="flex gap-3">
                          <div className={`w-9 h-9 rounded-xl ${config.bg} flex items-center justify-center shrink-0`}>
                            <Icon className={`w-4 h-4 ${config.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-sm font-medium ${config.color}`}>
                                {config.name}
                              </span>
                              <Badge
                                variant="outline"
                                className={
                                  citation.confidence === "high"
                                    ? "border-emerald-500/30 text-emerald-400 text-[10px]"
                                    : citation.confidence === "medium"
                                    ? "border-amber-500/30 text-amber-400 text-[10px]"
                                    : "border-zinc-500/30 text-zinc-400 text-[10px]"
                                }
                              >
                                {citation.confidence}
                              </Badge>
                              <span className="text-xs text-zinc-600 ml-auto">
                                {new Date(citation.firstSeenAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-zinc-300 mb-1 line-clamp-1">
                              "{citation.query}"
                            </p>
                            {citation.snippet && (
                              <p className="text-xs text-zinc-600 line-clamp-1 italic">
                                {citation.snippet}
                              </p>
                            )}
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
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <CardTitle className="text-white font-semibold text-base">Quick Actions</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/citations" className="block">
                <Button variant="ghost" className="w-full justify-between h-11 px-3 hover:bg-white/5 text-zinc-400 hover:text-white">
                  <span className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-emerald-400" />
                    All Citations
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/competitors" className="block">
                <Button variant="ghost" className="w-full justify-between h-11 px-3 hover:bg-white/5 text-zinc-400 hover:text-white">
                  <span className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-orange-400" />
                    Competitors
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/settings/notifications" className="block">
                <Button variant="ghost" className="w-full justify-between h-11 px-3 hover:bg-white/5 text-zinc-400 hover:text-white">
                  <span className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-blue-400" />
                    Alert Settings
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/analyze" className="block">
                <Button variant="ghost" className="w-full justify-between h-11 px-3 hover:bg-white/5 text-zinc-400 hover:text-white">
                  <span className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-violet-400" />
                    Analyze Page
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Upgrade CTA */}
          {plan !== "pro" && plan !== "pro_plus" && (
            <Card className="bg-gradient-to-br from-emerald-500/10 via-cyan-500/5 to-blue-500/10 border-emerald-500/20 overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <Crown className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Upgrade to Pro</h3>
                    <p className="text-xs text-zinc-400">Unlock all features</p>
                  </div>
                </div>
                <ul className="space-y-2 mb-4 text-sm text-zinc-400">
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-emerald-400" />
                    Unlimited citation checks
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-emerald-400" />
                    Track 10 competitors
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-emerald-400" />
                    Hourly monitoring
                  </li>
                </ul>
                <Link href="/pricing">
                  <Button className="w-full bg-white text-zinc-900 hover:bg-zinc-100 font-medium">
                    View Plans
                    <ArrowRight className="w-4 h-4 ml-2" />
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
