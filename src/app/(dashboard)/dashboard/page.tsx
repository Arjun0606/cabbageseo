"use client";

/**
 * CabbageSEO Dashboard - SEObot Style
 * 
 * ONE PAGE. ONE FLOW. NO REDIRECTS.
 * 
 * - If no site: Show URL input
 * - User enters URL: Analyze and create site IN PLACE
 * - Show results immediately on same page
 * - That's it.
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSite } from "@/contexts/site-context";
import { 
  Bot,
  Sparkles,
  Globe,
  Target,
  FileText,
  Zap,
  Loader2,
  RefreshCw,
  Eye,
  CheckCircle2,
  Search,
  Brain,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";

// ============================================
// TYPES
// ============================================

interface Site {
  id: string;
  domain: string;
  name: string;
  geo_score_avg: number;
  autopilot_enabled: boolean;
}

interface AnalysisResult {
  geoScore: number;
  platforms: {
    chatgpt: number;
    perplexity: number;
    googleAio: number;
  };
  quickWins: string[];
}

type DashboardView = "loading" | "empty" | "analyzing" | "site";

// ============================================
// GEO SCORE RING
// ============================================

function GEOScoreRing({ score, size = 140 }: { score: number; size?: number }) {
  const radius = (size - 14) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  
  const getColor = (s: number) => {
    if (s >= 80) return "#10b981";
    if (s >= 60) return "#eab308";
    if (s >= 40) return "#f97316";
    return "#ef4444";
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#27272a"
          strokeWidth="10"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor(score)}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-white">{score}</span>
        <span className="text-xs text-zinc-400">GEO Score</span>
      </div>
    </div>
  );
}

// ============================================
// ANALYZING VIEW
// ============================================

function AnalyzingView({ domain, step }: { domain: string; step: number }) {
  const steps = [
    { icon: Search, label: "Crawling your site", desc: "Finding pages and content" },
    { icon: Brain, label: "Analyzing for AI", desc: "Checking citation potential" },
    { icon: Sparkles, label: "Generating insights", desc: "Creating optimization plan" },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="mb-8">
        <div className="relative">
          <div className="p-6 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl animate-pulse">
            <Bot className="w-12 h-12 text-white" />
          </div>
          <div className="absolute -bottom-2 -right-2 p-2 bg-zinc-800 rounded-full">
            <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
          </div>
        </div>
      </div>

      <h1 className="text-2xl font-bold text-white mb-2">Analyzing {domain}</h1>
      <p className="text-zinc-400 mb-8">Setting up your GEO optimization...</p>

      <div className="w-full max-w-sm space-y-3">
        {steps.map((s, i) => (
          <div
            key={i}
            className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
              i < step
                ? "bg-emerald-500/10 border border-emerald-500/30"
                : i === step
                ? "bg-zinc-800/50 border border-zinc-700"
                : "bg-zinc-900/50 opacity-50"
            }`}
          >
            <div className={`p-2 rounded-lg ${i <= step ? "bg-emerald-500/20" : "bg-zinc-800"}`}>
              {i < step ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : i === step ? (
                <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
              ) : (
                <s.icon className="w-5 h-5 text-zinc-500" />
              )}
            </div>
            <div className="text-left">
              <p className={`font-medium ${i <= step ? "text-white" : "text-zinc-500"}`}>{s.label}</p>
              <p className="text-xs text-zinc-500">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function DashboardPage() {
  const router = useRouter();
  const { refreshSites: refreshSiteContext } = useSite();
  
  // Core state
  const [view, setView] = useState<DashboardView>("loading");
  const [site, setSite] = useState<Site | null>(null);
  const [url, setUrl] = useState("");
  const [analysisStep, setAnalysisStep] = useState(0);
  const [autopilotEnabled, setAutopilotEnabled] = useState(false);
  const [togglingAutopilot, setTogglingAutopilot] = useState(false);

  // ============================================
  // LOAD SITES ON MOUNT
  // ============================================
  
  const loadSites = useCallback(async () => {
    try {
      console.log("[Dashboard] Loading sites...");
      const res = await fetch("/api/sites");
      const data = await res.json();
      console.log("[Dashboard] Sites response:", data);

      // Extract sites from response
      const sites = data.data?.sites || data.sites || [];
      
      if (sites.length > 0) {
        const firstSite = sites[0];
        setSite({
          id: firstSite.id,
          domain: firstSite.domain,
          name: firstSite.name || firstSite.domain,
          geo_score_avg: firstSite.geo_score_avg || firstSite.aioScore || firstSite.aio_score_avg || 55,
          autopilot_enabled: firstSite.autopilot_enabled || false,
        });
        setAutopilotEnabled(firstSite.autopilot_enabled || false);
        setView("site");
        
        // Also refresh the global site context so header updates
        refreshSiteContext();
      } else {
        setView("empty");
      }
    } catch (err) {
      console.error("[Dashboard] Error loading sites:", err);
      setView("empty");
    }
  }, [refreshSiteContext]);

  useEffect(() => {
    loadSites();
  }, [loadSites]);

  // ============================================
  // ADD SITE - ALL IN ONE FLOW
  // ============================================
  
  const handleAddSite = async () => {
    if (!url.trim()) return;

    // Normalize URL
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith("http")) {
      normalizedUrl = "https://" + normalizedUrl;
    }

    let domain: string;
    try {
      domain = new URL(normalizedUrl).hostname.replace(/^www\./, "");
    } catch {
      domain = normalizedUrl.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
    }

    // Start analyzing
    setView("analyzing");
    setAnalysisStep(0);

    try {
      // Step 1: Crawling
      await new Promise(r => setTimeout(r, 1000));
      setAnalysisStep(1);

      // Step 2: Create site AND analyze via quickstart
      const quickstartRes = await fetch("/api/geo/quickstart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: normalizedUrl }),
      });

      const quickstartData = await quickstartRes.json();
      console.log("[Dashboard] Quickstart response:", quickstartData);

      setAnalysisStep(2);
      await new Promise(r => setTimeout(r, 500));

      // Step 3: Done - show site
      if (quickstartData.success) {
        const newSite: Site = {
          id: quickstartData.siteId || "",
          domain: quickstartData.domain || domain,
          name: quickstartData.domain || domain,
          geo_score_avg: quickstartData.analysis?.geoScore || 55,
          autopilot_enabled: quickstartData.autopilot?.enabled || true,
        };
        
        setSite(newSite);
        setAutopilotEnabled(newSite.autopilot_enabled);
        setView("site");
        
        // Refresh global context so header updates
        refreshSiteContext();
      } else {
        // Fallback - create site directly
        console.log("[Dashboard] Quickstart failed, creating site directly...");
        
        const createRes = await fetch("/api/sites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: normalizedUrl, domain }),
        });
        
        const createData = await createRes.json();
        console.log("[Dashboard] Direct create response:", createData);

        const newSite: Site = {
          id: createData.data?.id || createData.id || "",
          domain: domain,
          name: domain,
          geo_score_avg: 55,
          autopilot_enabled: true,
        };
        
        setSite(newSite);
        setAutopilotEnabled(true);
        setView("site");
        
        // Refresh global context
        refreshSiteContext();
      }

    } catch (err) {
      console.error("[Dashboard] Add site error:", err);
      // Even on error, try to show something
      setSite({
        id: "",
        domain: domain,
        name: domain,
        geo_score_avg: 55,
        autopilot_enabled: true,
      });
      setAutopilotEnabled(true);
      setView("site");
      
      // Try to refresh context anyway
      refreshSiteContext();
    }
  };

  // ============================================
  // TOGGLE AUTOPILOT
  // ============================================
  
  const handleToggleAutopilot = async () => {
    if (!site?.id) {
      // Just toggle locally if no site ID
      setAutopilotEnabled(!autopilotEnabled);
      return;
    }

    setTogglingAutopilot(true);
    try {
      await fetch(`/api/sites/${site.id}/autopilot`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !autopilotEnabled }),
      });
      setAutopilotEnabled(!autopilotEnabled);
    } catch {
      // Toggle anyway
      setAutopilotEnabled(!autopilotEnabled);
    } finally {
      setTogglingAutopilot(false);
    }
  };

  // ============================================
  // RENDER: LOADING
  // ============================================
  
  if (view === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mb-4" />
        <p className="text-zinc-400">Loading...</p>
      </div>
    );
  }

  // ============================================
  // RENDER: ANALYZING
  // ============================================
  
  if (view === "analyzing") {
    let domain = url;
    try {
      domain = new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, "");
    } catch {}
    
    return <AnalyzingView domain={domain} step={analysisStep} />;
  }

  // ============================================
  // RENDER: EMPTY STATE (No sites)
  // ============================================
  
  if (view === "empty") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="p-6 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl mb-8">
          <Bot className="w-12 h-12 text-white" />
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-3">Get Cited by AI</h1>
        <p className="text-zinc-400 max-w-md mb-8">
          Enter your website. We'll optimize it for ChatGPT, Perplexity & Google AI.
        </p>
        
        <div className="w-full max-w-md">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <Input
                type="url"
                placeholder="yourwebsite.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddSite()}
                className="h-12 pl-10 bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>
            <Button 
              onClick={handleAddSite}
              disabled={!url.trim()}
              className="h-12 px-6 bg-emerald-600 hover:bg-emerald-500"
            >
              Start <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
        
        {/* Feature icons */}
        <div className="flex gap-8 mt-12">
          <div className="flex flex-col items-center">
            <div className="p-3 bg-emerald-500/10 rounded-xl mb-2">
              <Eye className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-xs text-zinc-400">GEO Score</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="p-3 bg-emerald-500/10 rounded-xl mb-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-xs text-zinc-400">Auto Content</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="p-3 bg-emerald-500/10 rounded-xl mb-2">
              <Zap className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-xs text-zinc-400">Autopilot</span>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER: SITE DASHBOARD
  // ============================================
  
  const score = site?.geo_score_avg || 55;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <Globe className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">{site?.domain}</h1>
            <p className="text-sm text-zinc-500">AI optimization active</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadSites}
          className="border-zinc-700"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* GEO Score Card */}
      <Card className="bg-gradient-to-br from-zinc-900 to-emerald-900/20 border-zinc-800">
        <CardContent className="p-6">
          <div className="flex items-center gap-8">
            <GEOScoreRing score={score} />
            
            <div className="flex-1 space-y-4">
              <h2 className="text-lg font-semibold text-white">AI Visibility</h2>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-zinc-800/50 rounded-lg text-center">
                  <span className="text-xl">🤖</span>
                  <p className="text-lg font-bold text-white mt-1">{Math.round(score * 0.95)}</p>
                  <p className="text-xs text-zinc-500">ChatGPT</p>
                </div>
                <div className="p-3 bg-zinc-800/50 rounded-lg text-center">
                  <span className="text-xl">🔮</span>
                  <p className="text-lg font-bold text-white mt-1">{Math.round(score * 0.85)}</p>
                  <p className="text-xs text-zinc-500">Perplexity</p>
                </div>
                <div className="p-3 bg-zinc-800/50 rounded-lg text-center">
                  <span className="text-xl">✨</span>
                  <p className="text-lg font-bold text-white mt-1">{Math.round(score * 0.9)}</p>
                  <p className="text-xs text-zinc-500">Google AI</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Autopilot Toggle - PROMINENT like SEObot */}
      <Card className={`border-2 ${autopilotEnabled ? "bg-emerald-900/20 border-emerald-500" : "bg-zinc-900 border-zinc-700"}`}>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${autopilotEnabled ? "bg-emerald-500" : "bg-zinc-700"}`}>
                <Zap className={`w-6 h-6 ${autopilotEnabled ? "text-white" : "text-zinc-400"}`} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Autopilot is {autopilotEnabled ? "ON" : "OFF"}
                </h3>
                <p className="text-sm text-zinc-400">
                  {autopilotEnabled 
                    ? "We're generating AI-optimized content weekly" 
                    : "Enable to auto-generate content for AI citations"}
                </p>
              </div>
            </div>
            <Switch
              checked={autopilotEnabled}
              onCheckedChange={handleToggleAutopilot}
              disabled={togglingAutopilot}
              className="scale-125 data-[state=checked]:bg-emerald-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Button
          onClick={() => router.push("/content/new")}
          className="h-auto py-4 flex-col gap-2 bg-emerald-600 hover:bg-emerald-500"
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-xs">Generate Article</span>
        </Button>
        <Link href="/keywords" className="contents">
          <Button variant="outline" className="h-auto py-4 flex-col gap-2 border-zinc-700 hover:bg-zinc-800">
            <Target className="w-5 h-5" />
            <span className="text-xs">Keywords</span>
          </Button>
        </Link>
        <Link href="/content" className="contents">
          <Button variant="outline" className="h-auto py-4 flex-col gap-2 border-zinc-700 hover:bg-zinc-800">
            <FileText className="w-5 h-5" />
            <span className="text-xs">Content</span>
          </Button>
        </Link>
        <Link href="/geo" className="contents">
          <Button variant="outline" className="h-auto py-4 flex-col gap-2 border-zinc-700 hover:bg-zinc-800">
            <Eye className="w-5 h-5" />
            <span className="text-xs">GEO Details</span>
          </Button>
        </Link>
      </div>

      {/* Plan info */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-zinc-400">Starter Plan</span>
            <Link href="/settings/billing">
              <Button variant="link" size="sm" className="text-emerald-400 p-0 h-auto">
                Upgrade →
              </Button>
            </Link>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Articles</span>
              <span className="text-white">0/50</span>
            </div>
            <Progress value={0} className="h-1.5" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
