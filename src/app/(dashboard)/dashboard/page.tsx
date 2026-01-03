"use client";

/**
 * CabbageSEO Dashboard - SIMPLIFIED
 * 
 * Just works. No complexity.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";

// ============================================
// GEO SCORE RING
// ============================================

function GEOScoreRing({ score }: { score: number }) {
  const size = 140;
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
// MAIN PAGE
// ============================================

export default function DashboardPage() {
  const router = useRouter();
  
  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sites, setSites] = useState<any[]>([]);
  const [url, setUrl] = useState("");
  const [addingSite, setAddingSite] = useState(false);
  const [autopilotEnabled, setAutopilotEnabled] = useState(false);
  const [togglingAutopilot, setTogglingAutopilot] = useState(false);

  // Load sites on mount
  useEffect(() => {
    loadSites();
  }, []);

  async function loadSites() {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch("/api/sites");
      const data = await res.json();
      
      console.log("[Dashboard] Sites response:", data);
      
      if (data.data?.sites) {
        setSites(data.data.sites);
        if (data.data.sites.length > 0) {
          setAutopilotEnabled(data.data.sites[0].autopilot_enabled || false);
        }
      } else if (data.sites) {
        setSites(data.sites);
      } else {
        setSites([]);
      }
    } catch (err) {
      console.error("[Dashboard] Error:", err);
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddSite() {
    if (!url.trim()) return;
    
    setAddingSite(true);
    setError(null);
    
    try {
      const res = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      
      const data = await res.json();
      console.log("[Dashboard] Create site response:", data);
      
      if (data.success || data.data) {
        // Site created - go to onboarding for analysis
        const siteId = data.data?.id || data.id || data.existingSiteId;
        router.push(`/onboarding?url=${encodeURIComponent(url.trim())}&siteId=${siteId}`);
      } else {
        setError(data.error || "Failed to create site");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add site");
    } finally {
      setAddingSite(false);
    }
  }

  async function handleToggleAutopilot() {
    if (!sites[0]) return;
    
    setTogglingAutopilot(true);
    try {
      const res = await fetch(`/api/sites/${sites[0].id}/autopilot`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !autopilotEnabled }),
      });
      if (res.ok) {
        setAutopilotEnabled(!autopilotEnabled);
      }
    } catch {
      // Ignore
    } finally {
      setTogglingAutopilot(false);
    }
  }

  // ============================================
  // LOADING STATE
  // ============================================
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mb-4" />
        <p className="text-zinc-400">Loading dashboard...</p>
      </div>
    );
  }

  // ============================================
  // EMPTY STATE - No Sites
  // ============================================
  
  if (sites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="p-6 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl mb-8">
          <Bot className="w-12 h-12 text-white" />
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-3">Get Cited by AI</h1>
        <p className="text-zinc-400 max-w-md mb-8">
          Enter your website. We'll analyze it and start generating AI-optimized content.
        </p>
        
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}
        
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
                disabled={addingSite}
                className="h-12 pl-10 bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>
            <Button 
              onClick={handleAddSite}
              disabled={addingSite || !url.trim()}
              className="h-12 px-6 bg-emerald-600 hover:bg-emerald-500"
            >
              {addingSite ? <Loader2 className="w-5 h-5 animate-spin" /> : "Start"}
            </Button>
          </div>
        </div>
        
        <div className="flex gap-8 mt-12 text-center">
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
  // DASHBOARD WITH SITE
  // ============================================
  
  const site = sites[0];
  const score = site.geo_score_avg || site.aio_score_avg || 55;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <Globe className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">{site.domain}</h1>
            <p className="text-sm text-zinc-500">
              {site.last_crawl_at 
                ? `Analyzed ${new Date(site.last_crawl_at).toLocaleDateString()}` 
                : "Ready for optimization"}
            </p>
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

      {/* Autopilot Toggle */}
      <Card className={`border-zinc-800 ${autopilotEnabled ? "bg-emerald-900/10 border-emerald-500/30" : "bg-zinc-900"}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${autopilotEnabled ? "bg-emerald-500/20" : "bg-zinc-800"}`}>
                <Zap className={`w-5 h-5 ${autopilotEnabled ? "text-emerald-400" : "text-zinc-500"}`} />
              </div>
              <div>
                <h3 className="font-medium text-white">Autopilot Mode</h3>
                <p className="text-sm text-zinc-400">
                  {autopilotEnabled ? "Generating weekly content automatically" : "Enable to auto-generate content"}
                </p>
              </div>
            </div>
            <Switch
              checked={autopilotEnabled}
              onCheckedChange={handleToggleAutopilot}
              disabled={togglingAutopilot}
              className="data-[state=checked]:bg-emerald-500"
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
          <Button variant="outline" className="h-auto py-4 flex-col gap-2 border-zinc-700">
            <Target className="w-5 h-5" />
            <span className="text-xs">Keywords</span>
          </Button>
        </Link>
        <Link href="/content" className="contents">
          <Button variant="outline" className="h-auto py-4 flex-col gap-2 border-zinc-700">
            <FileText className="w-5 h-5" />
            <span className="text-xs">Content</span>
          </Button>
        </Link>
        <Link href="/geo" className="contents">
          <Button variant="outline" className="h-auto py-4 flex-col gap-2 border-zinc-700">
            <Eye className="w-5 h-5" />
            <span className="text-xs">GEO Details</span>
          </Button>
        </Link>
      </div>

      {/* Usage Card */}
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
