"use client";

/**
 * ============================================
 * CABBAGESEO DASHBOARD - BUILT FROM SCRATCH
 * ============================================
 * 
 * Ultra-simple, bulletproof dashboard.
 * NO context dependency. Direct API calls only.
 * localStorage as source of truth for site ID.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Globe,
  Sparkles,
  Zap,
  Search,
  FileText,
  Eye,
  ArrowRight,
  Loader2,
  RefreshCw,
  Bot,
  Brain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";

// ============================================
// TYPES
// ============================================

interface SiteData {
  id: string;
  domain: string;
  geoScore: number;
  autopilotEnabled: boolean;
}

interface UserData {
  authenticated: boolean;
  organization?: {
    plan: string;
  };
  sites?: SiteData[];
  currentSite?: SiteData;
}

// ============================================
// STORAGE - Uses same keys as useSite() hook
// ============================================

const SITE_KEY = "cabbageseo_site";
const SITES_KEY = "cabbageseo_sites";

function saveSite(site: SiteData) {
  // Save current site
  localStorage.setItem(SITE_KEY, JSON.stringify(site));
  
  // Also save to sites array (for other pages that use useSite())
  try {
    const existingSites = localStorage.getItem(SITES_KEY);
    let sites: SiteData[] = existingSites ? JSON.parse(existingSites) : [];
    
    // Add or update the site in the array
    const index = sites.findIndex(s => s.id === site.id);
    if (index >= 0) {
      sites[index] = site;
    } else {
      sites = [site, ...sites];
    }
    
    localStorage.setItem(SITES_KEY, JSON.stringify(sites));
  } catch (e) {
    // If parsing fails, just set the new site as the only site
    localStorage.setItem(SITES_KEY, JSON.stringify([site]));
  }
}

function loadSite(): SiteData | null {
  try {
    const data = localStorage.getItem(SITE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

// ============================================
// GEO SCORE RING
// ============================================

function GEOScoreRing({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";
  
  return (
    <div className="relative w-32 h-32">
      <svg className="w-full h-full -rotate-90">
        <circle cx="64" cy="64" r="45" fill="none" stroke="#27272a" strokeWidth="8" />
        <circle
          cx="64" cy="64" r="45" fill="none" stroke={color} strokeWidth="8"
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold">{score}</span>
        <span className="text-xs text-zinc-400">GEO Score</span>
      </div>
    </div>
  );
}

// ============================================
// PLATFORM SCORE
// ============================================

function PlatformScore({ name, score, icon: Icon, color }: {
  name: string;
  score: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
      <Icon className={`w-6 h-6 mb-2 ${color}`} />
      <span className="text-2xl font-bold">{score}</span>
      <span className="text-xs text-zinc-400">{name}</span>
    </div>
  );
}

// ============================================
// MAIN DASHBOARD COMPONENT
// ============================================

export default function DashboardPage() {
  // State
  const [phase, setPhase] = useState<"loading" | "add-site" | "dashboard">("loading");
  const [site, setSite] = useState<SiteData | null>(null);
  const [plan, setPlan] = useState("starter");
  const [url, setUrl] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState("");

  // ============================================
  // LOAD DATA ON MOUNT
  // ============================================
  
  useEffect(() => {
    async function init() {
      // Step 1: Check localStorage first
      const cachedSite = loadSite();
      
      // Step 2: Fetch from API
      try {
        const res = await fetch("/api/me", { credentials: "include" });
        const data: UserData = await res.json();
        
        if (!data.authenticated) {
          window.location.href = "/login";
          return;
        }
        
        setPlan(data.organization?.plan || "starter");
        
        // Use API site if available
        if (data.currentSite) {
          setSite(data.currentSite);
          saveSite(data.currentSite);
          setPhase("dashboard");
          return;
        }
        
        if (data.sites && data.sites.length > 0) {
          const firstSite = data.sites[0];
          setSite(firstSite);
          saveSite(firstSite);
          setPhase("dashboard");
          return;
        }
        
        // Fall back to cached site
        if (cachedSite) {
          setSite(cachedSite);
          setPhase("dashboard");
          return;
        }
        
        // No site found
        setPhase("add-site");
        
      } catch (err) {
        console.error("Init error:", err);
        
        // Use cached site if API fails
        if (cachedSite) {
          setSite(cachedSite);
          setPhase("dashboard");
        } else {
          setPhase("add-site");
        }
      }
    }
    
    init();
  }, []);

  // ============================================
  // ADD SITE
  // ============================================
  
  async function handleAddSite() {
    if (!url.trim()) return;
    
    setIsAdding(true);
    setError("");
    
    try {
      const res = await fetch("/api/me/site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
        credentials: "include",
      });
      
      const data = await res.json();
      
      if (data.success && data.site) {
        // Save to localStorage IMMEDIATELY
        saveSite(data.site);
        setSite(data.site);
        setPhase("dashboard");
      } else {
        setError(data.error || "Failed to add site");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsAdding(false);
    }
  }

  // ============================================
  // TOGGLE AUTOPILOT
  // ============================================
  
  async function toggleAutopilot(enabled: boolean) {
    if (!site) return;
    
    // Optimistic update
    const updatedSite = { ...site, autopilotEnabled: enabled };
    setSite(updatedSite);
    saveSite(updatedSite);
    
    // API call
    try {
      await fetch("/api/me/site", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId: site.id, autopilotEnabled: enabled }),
        credentials: "include",
      });
    } catch (err) {
      console.error("Autopilot toggle error:", err);
    }
  }

  // ============================================
  // REFRESH
  // ============================================
  
  async function refresh() {
    try {
      const res = await fetch("/api/me", { credentials: "include" });
      const data: UserData = await res.json();
      
      if (data.currentSite) {
        setSite(data.currentSite);
        saveSite(data.currentSite);
      } else if (data.sites && data.sites.length > 0) {
        setSite(data.sites[0]);
        saveSite(data.sites[0]);
      }
    } catch (err) {
      console.error("Refresh error:", err);
    }
  }

  // ============================================
  // RENDER: LOADING
  // ============================================
  
  if (phase === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
          <p className="text-zinc-400">Loading...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER: ADD SITE
  // ============================================
  
  if (phase === "add-site") {
    return (
      <div className="max-w-xl mx-auto text-center py-16">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-8">
          <Bot className="w-10 h-10 text-emerald-500" />
        </div>
        
        <h1 className="text-3xl font-bold mb-3">Get Cited by AI</h1>
        <p className="text-zinc-400 mb-8">
          Enter your website. We&apos;ll optimize it for ChatGPT, Perplexity &amp; Google AI.
        </p>
        
        <div className="flex gap-3 max-w-md mx-auto mb-4">
          <div className="relative flex-1">
            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddSite()}
              placeholder="yourwebsite.com"
              className="pl-12 h-12 bg-zinc-800/50 border-zinc-700 text-lg"
              disabled={isAdding}
            />
          </div>
          <Button
            onClick={handleAddSite}
            disabled={isAdding || !url.trim()}
            className="h-12 px-6 bg-emerald-600 hover:bg-emerald-500"
          >
            {isAdding ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Start <ArrowRight className="w-4 h-4 ml-2" /></>}
          </Button>
        </div>
        
        {error && <p className="text-red-400 text-sm">{error}</p>}
        
        <div className="grid grid-cols-3 gap-6 max-w-md mx-auto mt-12">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-800 mb-3">
              <Eye className="w-6 h-6 text-emerald-400" />
            </div>
            <p className="text-xs text-zinc-400">GEO Score</p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-800 mb-3">
              <Sparkles className="w-6 h-6 text-emerald-400" />
            </div>
            <p className="text-xs text-zinc-400">Auto Content</p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-800 mb-3">
              <Zap className="w-6 h-6 text-emerald-400" />
            </div>
            <p className="text-xs text-zinc-400">Autopilot</p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER: DASHBOARD
  // ============================================
  
  if (!site) return null;
  
  const geoScore = site.geoScore || 55;
  const chatgptScore = Math.round(geoScore * 0.95);
  const perplexityScore = Math.round(geoScore * 0.85);
  const googleScore = Math.round(geoScore * 0.91);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Globe className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{site.domain}</h1>
            <p className="text-sm text-zinc-400">AI optimization active</p>
          </div>
        </div>
        <Button variant="outline" size="icon" onClick={refresh} className="border-zinc-700">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* AI Visibility */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardContent className="p-6">
          <div className="flex items-center gap-8">
            <GEOScoreRing score={geoScore} />
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-4">AI Visibility</h3>
              <div className="grid grid-cols-3 gap-4">
                <PlatformScore name="ChatGPT" score={chatgptScore} icon={Bot} color="text-green-400" />
                <PlatformScore name="Perplexity" score={perplexityScore} icon={Brain} color="text-purple-400" />
                <PlatformScore name="Google AI" score={googleScore} icon={Sparkles} color="text-yellow-400" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Autopilot */}
      <Card className={`border ${site.autopilotEnabled ? "border-emerald-500/30 bg-emerald-500/5" : "border-zinc-800 bg-zinc-900/50"}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${site.autopilotEnabled ? "bg-emerald-500/20" : "bg-zinc-800"}`}>
                <Zap className={`w-6 h-6 ${site.autopilotEnabled ? "text-emerald-400" : "text-zinc-400"}`} />
              </div>
              <div>
                <h3 className="font-semibold">Autopilot is {site.autopilotEnabled ? "ON" : "OFF"}</h3>
                <p className="text-sm text-zinc-400">
                  {site.autopilotEnabled ? "Generating AI-optimized content weekly" : "Enable to auto-generate content"}
                </p>
              </div>
            </div>
            <Switch checked={site.autopilotEnabled} onCheckedChange={toggleAutopilot} />
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/content/new">
          <Card className="h-full bg-emerald-600 hover:bg-emerald-500 border-0 transition-colors cursor-pointer">
            <CardContent className="p-6 text-center">
              <Sparkles className="w-8 h-8 mx-auto mb-3" />
              <p className="font-semibold">Generate Article</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/keywords">
          <Card className="h-full bg-zinc-900/50 hover:bg-zinc-800/50 border-zinc-800 transition-colors cursor-pointer">
            <CardContent className="p-6 text-center">
              <Search className="w-8 h-8 mx-auto mb-3 text-zinc-400" />
              <p className="font-semibold">Keywords</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/content">
          <Card className="h-full bg-zinc-900/50 hover:bg-zinc-800/50 border-zinc-800 transition-colors cursor-pointer">
            <CardContent className="p-6 text-center">
              <FileText className="w-8 h-8 mx-auto mb-3 text-zinc-400" />
              <p className="font-semibold">Content</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/geo">
          <Card className="h-full bg-zinc-900/50 hover:bg-zinc-800/50 border-zinc-800 transition-colors cursor-pointer">
            <CardContent className="p-6 text-center">
              <Eye className="w-8 h-8 mx-auto mb-3 text-zinc-400" />
              <p className="font-semibold">GEO Details</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Plan */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold capitalize">{plan} Plan</h3>
            {plan !== "pro_plus" && (
              <Link href="/pricing">
                <Button variant="outline" size="sm" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
                  Upgrade <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            )}
          </div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-zinc-400">Articles</span>
            <span>0 / {plan === "starter" ? 50 : plan === "pro" ? 100 : 200}</span>
          </div>
          <Progress value={0} className="h-2" />
        </CardContent>
      </Card>
    </div>
  );
}
