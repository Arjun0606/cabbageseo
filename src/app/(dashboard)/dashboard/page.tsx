"use client";

/**
 * ============================================
 * DASHBOARD - Main Overview Page
 * ============================================
 */

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Search,
  Bot,
  Sparkles,
  Eye,
  ArrowRight,
  Brain,
  Target,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useSite } from "@/context/site-context";

// Platform config
const platformConfig = {
  perplexity: { name: "Perplexity", icon: Search, color: "text-violet-400", bg: "bg-violet-500/10" },
  google_aio: { name: "Google AI", icon: Sparkles, color: "text-blue-400", bg: "bg-blue-500/10" },
  chatgpt: { name: "ChatGPT", icon: Bot, color: "text-emerald-400", bg: "bg-emerald-500/10" },
};

interface Citation {
  id: string;
  platform: "perplexity" | "google_aio" | "chatgpt";
  query: string;
  snippet: string;
  confidence: number;
  discovered_at: string;
}

interface Stats {
  total: number;
  thisWeek: number;
  lastWeek: number;
  byPlatform: { perplexity: number; google_aio: number; chatgpt: number };
}

// Inner component that uses useSearchParams
function DashboardContent() {
  const searchParams = useSearchParams();
  const showAddForm = searchParams.get("add") === "true";
  
  const { 
    currentSite, 
    sites, 
    usage, 
    organization, 
    loading, 
    error, 
    addSite, 
    runCheck,
  } = useSite();
  
  const [citations, setCitations] = useState<Citation[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    thisWeek: 0,
    lastWeek: 0,
    byPlatform: { perplexity: 0, google_aio: 0, chatgpt: 0 },
  });
  const [loadingCitations, setLoadingCitations] = useState(false);
  
  const [newDomain, setNewDomain] = useState("");
  const [addingSite, setAddingSite] = useState(false);
  const [checking, setChecking] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Load citations when site changes
  useEffect(() => {
    async function loadCitations() {
      if (!currentSite?.id) return;
      
      setLoadingCitations(true);
      try {
        const res = await fetch(`/api/geo/citations?siteId=${currentSite.id}`);
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
      } finally {
        setLoadingCitations(false);
      }
    }
    
    loadCitations();
  }, [currentSite?.id]);

  // Handle add site
  const handleAddSite = async () => {
    if (!newDomain.trim()) return;
    
    setAddingSite(true);
    setLocalError(null);
    
    const site = await addSite(newDomain);
    
    if (site) {
      setNewDomain("");
      setChecking(true);
      await runCheck(site.id);
      setChecking(false);
    } else {
      setLocalError("Failed to add site. Please try again.");
    }
    
    setAddingSite(false);
  };

  // Handle run check
  const handleRunCheck = async () => {
    setChecking(true);
    setLocalError(null);
    
    const success = await runCheck();
    
    if (success && currentSite?.id) {
      const res = await fetch(`/api/geo/citations?siteId=${currentSite.id}`);
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
    } else if (!success) {
      setLocalError("Check failed. Please try again.");
    }
    
    setChecking(false);
  };

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

  // No sites - onboarding
  if (sites.length === 0 || showAddForm) {
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
              <h1 className="text-2xl font-bold text-white mb-2">
                {sites.length === 0 ? "Track Your AI Citations" : "Add Another Website"}
              </h1>
              <p className="text-zinc-400 mb-6">
                {sites.length === 0 
                  ? "Know when ChatGPT, Perplexity, or Google AI mentions your website."
                  : "Add another website to track its AI citations."
                }
              </p>
              
              {(localError || error) && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  {localError || error}
                </div>
              )}
              
              <div className="space-y-3">
                <Input
                  placeholder="yoursite.com"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddSite()}
                  className="h-12 bg-white/5 border-white/10 text-center"
                />
                <Button
                  onClick={handleAddSite}
                  disabled={addingSite || checking || !newDomain.trim()}
                  className="w-full h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500"
                >
                  {addingSite || checking ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {checking ? "Checking AI platforms..." : "Setting up..."}</>
                  ) : (
                    <><Plus className="w-4 h-4 mr-2" /> Add & Start Tracking</>
                  )}
                </Button>
                
                {sites.length > 0 && (
                  <Link href="/dashboard">
                    <Button variant="ghost" className="w-full text-zinc-400">
                      Cancel
                    </Button>
                  </Link>
                )}
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

  const plan = organization?.plan || "free";

  // Main dashboard
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{currentSite?.domain}</h1>
          <p className="text-zinc-500 text-sm mt-1">
            {currentSite?.lastCheckedAt 
              ? `Last checked ${new Date(currentSite.lastCheckedAt).toLocaleDateString()}`
              : "Never checked"
            }
          </p>
        </div>
        <Button
          onClick={handleRunCheck}
          disabled={checking || usage.checksUsed >= usage.checksLimit}
          className="bg-emerald-600 hover:bg-emerald-500"
        >
          {checking ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Checking...</>
          ) : (
            <><RefreshCw className="w-4 h-4 mr-2" /> Check Now</>
          )}
        </Button>
      </div>

      {(localError || error) && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {localError || error}
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
            <div className="text-3xl font-bold text-white">
              {usage.checksUsed}/{usage.checksLimit === 999999 ? "∞" : usage.checksLimit}
            </div>
            <p className="text-sm text-zinc-500">Checks Used</p>
            <Progress value={usage.checksLimit === 999999 ? 0 : (usage.checksUsed / usage.checksLimit) * 100} className="h-1 mt-2 bg-zinc-800" />
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
          {loadingCitations ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
            </div>
          ) : citations.length === 0 ? (
            <div className="text-center py-8">
              <Eye className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500">No citations found yet</p>
              <p className="text-zinc-600 text-sm mt-1">Click &quot;Check Now&quot; to scan AI platforms</p>
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
                      <p className="text-sm text-white font-medium truncate">&quot;{citation.query}&quot;</p>
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
          <Card className="bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border-emerald-500/20 hover:border-emerald-500/40 transition-all cursor-pointer h-full">
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
          <Card className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer h-full">
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

// Loading fallback
function DashboardLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-4" />
        <p className="text-zinc-500">Loading dashboard...</p>
      </div>
    </div>
  );
}

// Main export with Suspense boundary
export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent />
    </Suspense>
  );
}
