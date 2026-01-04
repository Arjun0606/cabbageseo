"use client";

/**
 * ============================================
 * CITATION INTELLIGENCE DASHBOARD
 * ============================================
 * 
 * The heart of CabbageSEO - track when AI cites you.
 * 
 * Core Features:
 * - Total citation count across platforms
 * - Citation trend graph
 * - Recent citations list
 * - Competitor comparison
 * - Quick stats
 * 
 * "Know the moment AI starts citing you."
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Globe,
  TrendingUp,
  TrendingDown,
  Bell,
  Plus,
  RefreshCw,
  ExternalLink,
  Search,
  Bot,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  Calendar,
  Target,
  Zap,
  Crown,
  BarChart3,
  Clock,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  lastSeenAt: string;
}

interface CitationStats {
  total: number;
  thisWeek: number;
  lastWeek: number;
  change: number;
  byPlatform: {
    perplexity: number;
    googleAio: number;
    chatgpt: number;
  };
}

interface Competitor {
  domain: string;
  citations: number;
  change: number;
}

interface SiteData {
  id: string;
  domain: string;
  name: string;
}

// ============================================
// PLATFORM ICONS
// ============================================

function PlatformIcon({ platform }: { platform: string }) {
  switch (platform) {
    case "perplexity":
      return <Search className="w-4 h-4 text-purple-400" />;
    case "google_aio":
      return <Sparkles className="w-4 h-4 text-blue-400" />;
    case "chatgpt":
      return <Bot className="w-4 h-4 text-green-400" />;
    default:
      return <Globe className="w-4 h-4 text-zinc-400" />;
  }
}

function PlatformName({ platform }: { platform: string }) {
  switch (platform) {
    case "perplexity":
      return "Perplexity";
    case "google_aio":
      return "Google AI";
    case "chatgpt":
      return "ChatGPT";
    default:
      return platform;
  }
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
  try {
    localStorage.setItem(SITE_KEY, JSON.stringify(site));
  } catch {
    // Ignore
  }
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function CitationDashboard() {
  const router = useRouter();
  
  // State
  const [loading, setLoading] = useState(true);
  const [site, setSite] = useState<SiteData | null>(null);
  const [showAddSite, setShowAddSite] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [addingSite, setAddingSite] = useState(false);
  
  // Citation data
  const [stats, setStats] = useState<CitationStats>({
    total: 0,
    thisWeek: 0,
    lastWeek: 0,
    change: 0,
    byPlatform: { perplexity: 0, googleAio: 0, chatgpt: 0 },
  });
  const [recentCitations, setRecentCitations] = useState<Citation[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [checking, setChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  
  // Plan
  const [plan, setPlan] = useState("starter");
  const [checksRemaining, setChecksRemaining] = useState(100);

  // ============================================
  // LOAD SITE & DATA
  // ============================================

  useEffect(() => {
    const cached = loadSite();
    if (cached) {
      setSite(cached);
      fetchCitations(cached.id);
    }
    
    // Fetch plan info
    fetch("/api/me")
      .then(res => res.json())
      .then(data => {
        setPlan(data.organization?.plan || "free");
      })
      .catch(() => {});
    
    setLoading(false);
  }, []);

  // ============================================
  // FETCH CITATIONS
  // ============================================

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
          change: data.data.change || 0,
          byPlatform: {
            perplexity: data.data.byPlatform?.perplexity || 0,
            googleAio: data.data.byPlatform?.google_aio || 0,
            chatgpt: data.data.byPlatform?.chatgpt || 0,
          },
        });
        
        if (data.data.recent) {
          setRecentCitations(data.data.recent);
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
      // Clean domain
      let domain = newDomain.trim().toLowerCase();
      domain = domain.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
      
      // Create site via API
      const res = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add site");
      }
      
      const data = await res.json();
      
      const newSite: SiteData = {
        id: data.site?.id || data.id,
        domain: domain,
        name: domain,
      };
      
      setSite(newSite);
      saveSite(newSite);
      setShowAddSite(false);
      setNewDomain("");
      
      // Trigger initial citation check
      runCitationCheck(newSite.id, domain);
      
    } catch (error) {
      console.error("Error adding site:", error);
    } finally {
      setAddingSite(false);
    }
  };

  // ============================================
  // RUN CITATION CHECK
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
        // Refresh citations
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
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  // ============================================
  // RENDER: NO SITE - ONBOARDING
  // ============================================

  if (!site) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <Card className="max-w-lg w-full bg-zinc-900 border-zinc-800">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
              <Eye className="w-8 h-8 text-emerald-500" />
            </div>
            <CardTitle className="text-2xl text-white">Track Your AI Citations</CardTitle>
            <CardDescription className="text-zinc-400">
              Know the moment ChatGPT, Perplexity, or Google AI cites your website.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-zinc-400 block mb-2">Your Website</label>
              <Input
                placeholder="example.com"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addSite()}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            <Button
              onClick={addSite}
              disabled={addingSite || !newDomain.trim()}
              className="w-full bg-emerald-600 hover:bg-emerald-500"
            >
              {addingSite ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Setting up tracking...
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  Start Tracking Citations
                </>
              )}
            </Button>
            
            <div className="pt-4 space-y-2">
              <p className="text-xs text-zinc-500 text-center">We'll check these AI platforms:</p>
              <div className="flex justify-center gap-4">
                <Badge variant="outline" className="border-purple-500/50 text-purple-400">
                  <Search className="w-3 h-3 mr-1" /> Perplexity
                </Badge>
                <Badge variant="outline" className="border-blue-500/50 text-blue-400">
                  <Sparkles className="w-3 h-3 mr-1" /> Google AI
                </Badge>
                <Badge variant="outline" className="border-green-500/50 text-green-400">
                  <Bot className="w-3 h-3 mr-1" /> ChatGPT
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ============================================
  // RENDER: DASHBOARD
  // ============================================

  const changePercent = stats.lastWeek > 0 
    ? Math.round(((stats.thisWeek - stats.lastWeek) / stats.lastWeek) * 100)
    : stats.thisWeek > 0 ? 100 : 0;

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Globe className="w-6 h-6 text-emerald-500" />
              {site.domain}
            </h1>
            <p className="text-zinc-400 mt-1">
              Citation tracking active • Last check: {lastCheck ? lastCheck.toLocaleTimeString() : "Not yet"}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="border-zinc-700 text-zinc-400">
              {checksRemaining} checks left
            </Badge>
            <Button
              onClick={() => runCitationCheck()}
              disabled={checking}
              className="bg-emerald-600 hover:bg-emerald-500"
            >
              {checking ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Check Now
                </>
              )}
            </Button>
          </div>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Total Citations */}
          <Card className="bg-gradient-to-br from-emerald-900/30 to-zinc-900 border-emerald-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">Total Citations</p>
                  <p className="text-4xl font-bold text-white mt-1">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* This Week */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">This Week</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-4xl font-bold text-white">{stats.thisWeek}</p>
                    {changePercent !== 0 && (
                      <Badge className={changePercent > 0 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                        {changePercent > 0 ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                        {Math.abs(changePercent)}%
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-zinc-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Perplexity */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-400 flex items-center gap-1">
                    <Search className="w-3 h-3" /> Perplexity
                  </p>
                  <p className="text-4xl font-bold text-white mt-1">{stats.byPlatform.perplexity}</p>
                </div>
                <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <Search className="w-6 h-6 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Google AI */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Google AI
                  </p>
                  <p className="text-4xl font-bold text-white mt-1">{stats.byPlatform.googleAio}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RECENT CITATIONS */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-emerald-500" />
                  Recent Citations
                </CardTitle>
                <CardDescription>When AI platforms mentioned your website</CardDescription>
              </div>
              <Link href="/citations">
                <Button variant="outline" size="sm" className="border-zinc-700">
                  View All
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentCitations.length === 0 ? (
              <div className="text-center py-12">
                <Eye className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-400 mb-2">No citations found yet</p>
                <p className="text-sm text-zinc-500">
                  Click "Check Now" to scan AI platforms for mentions of your website.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentCitations.slice(0, 5).map((citation) => (
                  <div
                    key={citation.id}
                    className="bg-zinc-800/50 rounded-lg p-4 hover:bg-zinc-800 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center mt-1">
                          <PlatformIcon platform={citation.platform} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white font-medium">
                              <PlatformName platform={citation.platform} />
                            </span>
                            <Badge
                              className={
                                citation.confidence === "high"
                                  ? "bg-green-500/20 text-green-400"
                                  : citation.confidence === "medium"
                                  ? "bg-yellow-500/20 text-yellow-400"
                                  : "bg-zinc-500/20 text-zinc-400"
                              }
                            >
                              {citation.confidence}
                            </Badge>
                          </div>
                          <p className="text-sm text-zinc-400 mb-1">
                            Query: "{citation.query}"
                          </p>
                          {citation.snippet && (
                            <p className="text-sm text-zinc-500 italic">
                              "{citation.snippet.slice(0, 150)}..."
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-zinc-500">
                        {new Date(citation.firstSeenAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* BOTTOM ROW */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Competitors */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <Target className="w-5 h-5 text-orange-500" />
                  Competitors
                </CardTitle>
                <Link href="/competitors">
                  <Button variant="outline" size="sm" className="border-zinc-700">
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {competitors.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-400 mb-2">Track competitor citations</p>
                  <p className="text-sm text-zinc-500 mb-4">
                    See how your AI visibility compares
                  </p>
                  <Link href="/competitors">
                    <Button variant="outline" size="sm" className="border-zinc-700">
                      <Plus className="w-4 h-4 mr-1" />
                      Add Competitor
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Your site first */}
                  <div className="flex items-center justify-between p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-emerald-500 text-white">You</Badge>
                      <span className="text-white font-medium">{site.domain}</span>
                    </div>
                    <span className="text-2xl font-bold text-emerald-400">{stats.total}</span>
                  </div>
                  
                  {competitors.map((comp, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                      <span className="text-zinc-300">{comp.domain}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-white">{comp.citations}</span>
                        {comp.change !== 0 && (
                          <span className={comp.change > 0 ? "text-green-400" : "text-red-400"}>
                            {comp.change > 0 ? "+" : ""}{comp.change}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/citations" className="block">
                <Button variant="outline" className="w-full justify-start border-zinc-700 hover:bg-zinc-800">
                  <Eye className="w-4 h-4 mr-3 text-emerald-400" />
                  View All Citations
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </Button>
              </Link>
              
              <Link href="/competitors" className="block">
                <Button variant="outline" className="w-full justify-start border-zinc-700 hover:bg-zinc-800">
                  <Target className="w-4 h-4 mr-3 text-orange-400" />
                  Track Competitors
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </Button>
              </Link>
              
              <Link href="/settings/notifications" className="block">
                <Button variant="outline" className="w-full justify-start border-zinc-700 hover:bg-zinc-800">
                  <Bell className="w-4 h-4 mr-3 text-blue-400" />
                  Configure Alerts
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </Button>
              </Link>
              
              <Link href="/analyze" className="block">
                <Button variant="outline" className="w-full justify-start border-zinc-700 hover:bg-zinc-800">
                  <Search className="w-4 h-4 mr-3 text-purple-400" />
                  Analyze a Page
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* UPGRADE CTA (for free/starter) */}
        {plan !== "pro" && plan !== "pro-plus" && (
          <Card className="bg-gradient-to-r from-emerald-900/30 to-blue-900/30 border-emerald-500/30">
            <CardContent className="py-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
                  <Crown className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Upgrade to Pro</h3>
                  <p className="text-zinc-400">
                    Hourly checks, competitor tracking, unlimited history
                  </p>
                </div>
              </div>
              <Link href="/pricing">
                <Button className="bg-emerald-600 hover:bg-emerald-500">
                  Upgrade Now
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
