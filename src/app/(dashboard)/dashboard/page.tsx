"use client";

/**
 * ============================================
 * CABBAGESEO DASHBOARD - SEOBOT-INSPIRED
 * ============================================
 * 
 * Clean, seamless, single-path flow.
 * One primary CTA. Minimal friction.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Globe,
  Sparkles,
  Zap,
  ArrowRight,
  Loader2,
  RefreshCw,
  CheckCircle,
  Clock,
  TrendingUp,
  FileText,
  Search,
  Eye,
  Settings,
  ChevronDown,
  Play,
  Pause,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  organization?: { plan: string };
  sites?: SiteData[];
  currentSite?: SiteData;
}

// ============================================
// STORAGE - Syncs everywhere
// ============================================

const SITE_KEY = "cabbageseo_site";
const SITES_KEY = "cabbageseo_sites";

function saveSite(site: SiteData) {
  localStorage.setItem(SITE_KEY, JSON.stringify(site));
  try {
    const existing = localStorage.getItem(SITES_KEY);
    let sites: SiteData[] = existing ? JSON.parse(existing) : [];
    const idx = sites.findIndex(s => s.id === site.id);
    if (idx >= 0) sites[idx] = site;
    else sites = [site, ...sites];
    localStorage.setItem(SITES_KEY, JSON.stringify(sites));
  } catch {
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
// SCORE RING - Compact
// ============================================

function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="w-full h-full -rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#27272a" strokeWidth="6" />
        <circle
          cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth="6"
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold">{score}</span>
      </div>
    </div>
  );
}

// ============================================
// ONBOARDING - Add Site (First Visit Only)
// ============================================

function Onboarding({ onComplete }: { onComplete: (site: SiteData) => void }) {
  const [url, setUrl] = useState("");
  const [step, setStep] = useState<"input" | "analyzing" | "done">("input");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);

  const handleSubmit = async () => {
    if (!url.trim()) return;
    setStep("analyzing");
    setError("");
    
    // Animate progress
    const interval = setInterval(() => {
      setProgress(p => Math.min(p + Math.random() * 15, 90));
    }, 300);

    try {
      const res = await fetch("/api/me/site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
        credentials: "include",
      });
      
      const data = await res.json();
      clearInterval(interval);
      
      if (data.success && data.site) {
        setProgress(100);
        saveSite(data.site);
        setStep("done");
        setTimeout(() => onComplete(data.site), 800);
      } else {
        setError(data.error || "Failed to add site");
        setStep("input");
        setProgress(0);
      }
    } catch {
      clearInterval(interval);
      setError("Network error. Please try again.");
      setStep("input");
      setProgress(0);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-lg text-center">
        {/* Logo */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/25 mb-4">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Welcome to CabbageSEO</h1>
          <p className="text-zinc-400">Get your content cited by ChatGPT, Perplexity & Google AI</p>
        </div>

        {step === "input" && (
          <div className="space-y-4">
            <div className="relative">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="Enter your website URL"
                className="pl-12 h-14 text-lg bg-zinc-900 border-zinc-700 focus:border-emerald-500"
              />
            </div>
            
            <Button
              onClick={handleSubmit}
              disabled={!url.trim()}
              className="w-full h-14 text-lg bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/25"
            >
              Start Optimization <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            
            {error && <p className="text-red-400 text-sm">{error}</p>}
            
            <p className="text-xs text-zinc-500 mt-6">
              We'll analyze your site and start generating AI-optimized content automatically
            </p>
          </div>
        )}

        {step === "analyzing" && (
          <div className="space-y-6">
            <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-center gap-3 text-emerald-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Analyzing your website...</span>
            </div>
          </div>
        )}

        {step === "done" && (
          <div className="space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
            <p className="text-lg text-emerald-400">Analysis complete!</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// MAIN DASHBOARD
// ============================================

function MainDashboard({ site, plan, onRefresh }: { 
  site: SiteData; 
  plan: string;
  onRefresh: () => void;
}) {
  const [autopilot, setAutopilot] = useState(site.autopilotEnabled);
  const [isToggling, setIsToggling] = useState(false);

  const toggleAutopilot = async () => {
    setIsToggling(true);
    const newState = !autopilot;
    setAutopilot(newState);
    
    // Optimistic update
    const updatedSite = { ...site, autopilotEnabled: newState };
    saveSite(updatedSite);

    try {
      await fetch("/api/me/site", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId: site.id, autopilotEnabled: newState }),
        credentials: "include",
      });
    } catch (e) {
      console.error("Toggle error:", e);
    }
    setIsToggling(false);
  };

  const geoScore = site.geoScore || 55;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Site Header - Clean & Minimal */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30 flex items-center justify-center">
            <Globe className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">{site.domain}</h1>
              <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-400">
                {plan}
              </Badge>
            </div>
            <p className="text-sm text-zinc-500">AI optimization active</p>
          </div>
        </div>
        
        <Button variant="ghost" size="icon" onClick={onRefresh} className="text-zinc-400 hover:text-white">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Main Stats Card */}
      <Card className="bg-gradient-to-br from-zinc-900 to-zinc-900/50 border-zinc-800 overflow-hidden">
        <CardContent className="p-0">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Left: Score */}
            <div className="p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-zinc-800">
              <ScoreRing score={geoScore} size={120} />
              <p className="mt-4 text-sm text-zinc-400">GEO Visibility Score</p>
              <div className="flex items-center gap-4 mt-4 text-xs text-zinc-500">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500" /> ChatGPT
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-purple-500" /> Perplexity
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500" /> Google AI
                </span>
              </div>
            </div>
            
            {/* Right: Autopilot Control */}
            <div className="p-8 flex flex-col justify-center">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  {autopilot ? (
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                      <Play className="w-5 h-5 text-emerald-400" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                      <Pause className="w-5 h-5 text-zinc-400" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium">Autopilot</p>
                    <p className="text-xs text-zinc-500">
                      {autopilot ? "Running weekly" : "Paused"}
                    </p>
                  </div>
                </div>
                <Switch 
                  checked={autopilot} 
                  onCheckedChange={toggleAutopilot}
                  disabled={isToggling}
                />
              </div>
              
              {autopilot && (
                <div className="space-y-2 text-xs text-zinc-500 bg-zinc-800/50 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    <span>Next article: Tomorrow 9:00 AM</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                    <span>Last run: Generated 1 article</span>
                  </div>
                </div>
              )}
              
              {!autopilot && (
                <p className="text-xs text-zinc-500 bg-zinc-800/50 rounded-lg p-3">
                  Enable autopilot to automatically generate and publish AI-optimized articles weekly.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Primary CTA */}
      <Link href="/content/new" className="block">
        <Card className="bg-emerald-600 hover:bg-emerald-500 border-0 transition-all cursor-pointer group shadow-lg shadow-emerald-600/20">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="text-white">
                <p className="font-semibold text-lg">Generate New Article</p>
                <p className="text-sm text-white/70">AI-optimized content for citations</p>
              </div>
            </div>
            <ArrowRight className="w-6 h-6 text-white group-hover:translate-x-1 transition-transform" />
          </CardContent>
        </Card>
      </Link>

      {/* Quick Actions Row */}
      <div className="grid grid-cols-3 gap-4">
        <Link href="/keywords" className="block">
          <Card className="bg-zinc-900/50 hover:bg-zinc-800/50 border-zinc-800 transition-all cursor-pointer h-full">
            <CardContent className="p-4 text-center">
              <Search className="w-6 h-6 mx-auto mb-2 text-zinc-400" />
              <p className="text-sm font-medium">Keywords</p>
              <p className="text-xs text-zinc-500">Research & track</p>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/content" className="block">
          <Card className="bg-zinc-900/50 hover:bg-zinc-800/50 border-zinc-800 transition-all cursor-pointer h-full">
            <CardContent className="p-4 text-center">
              <FileText className="w-6 h-6 mx-auto mb-2 text-zinc-400" />
              <p className="text-sm font-medium">Content</p>
              <p className="text-xs text-zinc-500">View articles</p>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/geo" className="block">
          <Card className="bg-zinc-900/50 hover:bg-zinc-800/50 border-zinc-800 transition-all cursor-pointer h-full">
            <CardContent className="p-4 text-center">
              <Eye className="w-6 h-6 mx-auto mb-2 text-zinc-400" />
              <p className="text-sm font-medium">GEO Details</p>
              <p className="text-xs text-zinc-500">Deep analysis</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Getting Started Guide - Collapsed */}
      <Card className="bg-zinc-900/30 border-zinc-800">
        <CardContent className="p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-between text-zinc-400 hover:text-white">
                <span className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  How to improve your GEO score
                </span>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 bg-zinc-900 border-zinc-700">
              <DropdownMenuItem className="flex items-start gap-3 p-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs text-emerald-400">1</span>
                </div>
                <div>
                  <p className="font-medium text-sm">Generate AI Content</p>
                  <p className="text-xs text-zinc-400">Articles optimized for AI citations</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-start gap-3 p-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs text-emerald-400">2</span>
                </div>
                <div>
                  <p className="font-medium text-sm">Connect Your CMS</p>
                  <p className="text-xs text-zinc-400">Auto-publish to WordPress, Webflow, etc.</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-start gap-3 p-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs text-emerald-400">3</span>
                </div>
                <div>
                  <p className="font-medium text-sm">Enable Autopilot</p>
                  <p className="text-xs text-zinc-400">Weekly content generation on autopilot</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings/integrations" className="flex items-center gap-2 p-3 text-emerald-400">
                  <Settings className="w-4 h-4" />
                  Connect Integrations
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// PAGE COMPONENT
// ============================================

export default function DashboardPage() {
  const [phase, setPhase] = useState<"loading" | "onboarding" | "dashboard">("loading");
  const [site, setSite] = useState<SiteData | null>(null);
  const [plan, setPlan] = useState("Starter");

  useEffect(() => {
    async function init() {
      const cached = loadSite();
      
      try {
        const res = await fetch("/api/me", { credentials: "include" });
        const data: UserData = await res.json();
        
        if (!data.authenticated) {
          window.location.href = "/login";
          return;
        }
        
        setPlan(data.organization?.plan || "Starter");
        
        if (data.currentSite) {
          saveSite(data.currentSite);
          setSite(data.currentSite);
          setPhase("dashboard");
        } else if (data.sites && data.sites.length > 0) {
          saveSite(data.sites[0]);
          setSite(data.sites[0]);
          setPhase("dashboard");
        } else if (cached) {
          setSite(cached);
          setPhase("dashboard");
        } else {
          setPhase("onboarding");
        }
      } catch {
        if (cached) {
          setSite(cached);
          setPhase("dashboard");
        } else {
          setPhase("onboarding");
        }
      }
    }
    
    init();
  }, []);

  const handleSiteAdded = (newSite: SiteData) => {
    setSite(newSite);
    setPhase("dashboard");
  };

  const handleRefresh = async () => {
    try {
      const res = await fetch("/api/me", { credentials: "include" });
      const data: UserData = await res.json();
      if (data.currentSite) {
        saveSite(data.currentSite);
        setSite(data.currentSite);
      }
    } catch {}
  };

  if (phase === "loading") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (phase === "onboarding") {
    return <Onboarding onComplete={handleSiteAdded} />;
  }

  if (site) {
    return <MainDashboard site={site} plan={plan} onRefresh={handleRefresh} />;
  }

  return null;
}
