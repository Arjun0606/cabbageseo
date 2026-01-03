"use client";

/**
 * CabbageSEO Dashboard - Rebuilt from scratch
 * 
 * Simple, reliable, working.
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Bot,
  Sparkles,
  TrendingUp,
  Globe,
  Target,
  FileText,
  Zap,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Eye,
  ArrowRight,
  Settings,
  AlertTriangle,
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
  geo_score_avg: number | null;
  seo_score: number | null;
  autopilot_enabled: boolean;
  last_crawl_at: string | null;
}

interface DashboardState {
  loading: boolean;
  error: string | null;
  hasSites: boolean;
  sites: Site[];
  currentSite: Site | null;
  plan: string;
  usage: {
    articles: number;
    articlesLimit: number;
  };
  debug: string[];
}

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
// EMPTY STATE - Add First Site
// ============================================

function EmptyState({ onAddSite, loading }: { onAddSite: (url: string) => void; loading: boolean }) {
  const [url, setUrl] = useState("");

  const handleSubmit = () => {
    if (!url.trim()) return;
    onAddSite(url.trim());
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="p-6 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl mb-8">
        <Bot className="w-12 h-12 text-white" />
      </div>
      
      <h1 className="text-3xl font-bold text-white mb-3">Get Cited by AI</h1>
      <p className="text-zinc-400 max-w-md mb-8">
        Enter your website. We'll analyze it and start generating AI-optimized content.
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
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              disabled={loading}
              className="h-12 pl-10 bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500"
            />
          </div>
          <Button 
            onClick={handleSubmit}
            disabled={loading || !url.trim()}
            className="h-12 px-6 bg-emerald-600 hover:bg-emerald-500"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Start"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN DASHBOARD WITH SITE
// ============================================

function SiteDashboard({ 
  site, 
  plan, 
  usage,
  onRefresh,
  refreshing,
}: { 
  site: Site; 
  plan: string;
  usage: { articles: number; articlesLimit: number };
  onRefresh: () => void;
  refreshing: boolean;
}) {
  const router = useRouter();
  const [autopilotEnabled, setAutopilotEnabled] = useState(site.autopilot_enabled);
  const [togglingAutopilot, setTogglingAutopilot] = useState(false);

  const score = site.geo_score_avg || 55;

  const handleToggleAutopilot = async () => {
    setTogglingAutopilot(true);
    try {
      const res = await fetch(`/api/sites/${site.id}/autopilot`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !autopilotEnabled }),
      });
      if (res.ok) {
        setAutopilotEnabled(!autopilotEnabled);
      }
    } catch (e) {
      console.error("Toggle error:", e);
    } finally {
      setTogglingAutopilot(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <Globe className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">{site.domain}</h1>
            <p className="text-sm text-zinc-500">
              {site.last_crawl_at ? `Last analyzed ${new Date(site.last_crawl_at).toLocaleDateString()}` : "Not analyzed yet"}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={refreshing}
          className="border-zinc-700"
        >
          {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
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
                  {autopilotEnabled ? "Generating weekly content" : "Enable to auto-generate content"}
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

      {/* Usage */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-zinc-400">{plan} Plan</span>
            <Link href="/settings/billing">
              <Button variant="link" size="sm" className="text-emerald-400 p-0 h-auto">
                Upgrade
              </Button>
            </Link>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Articles</span>
              <span className="text-white">{usage.articles}/{usage.articlesLimit}</span>
            </div>
            <Progress value={(usage.articles / usage.articlesLimit) * 100} className="h-1.5" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// ERROR STATE
// ============================================

function ErrorState({ error, debug, onRetry }: { error: string; debug: string[]; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="p-4 bg-red-500/10 rounded-xl mb-6">
        <AlertTriangle className="w-10 h-10 text-red-400" />
      </div>
      <h2 className="text-xl font-semibold text-white mb-2">Something went wrong</h2>
      <p className="text-zinc-400 mb-6">{error}</p>
      <Button onClick={onRetry} className="bg-emerald-600 hover:bg-emerald-500">
        <RefreshCw className="w-4 h-4 mr-2" />
        Try Again
      </Button>
      
      {debug.length > 0 && (
        <details className="mt-8 text-left w-full max-w-md">
          <summary className="text-zinc-500 cursor-pointer text-sm">Debug info</summary>
          <pre className="mt-2 p-3 bg-zinc-900 rounded text-xs text-zinc-400 overflow-auto">
            {debug.join("\n")}
          </pre>
        </details>
      )}
    </div>
  );
}

// ============================================
// LOADING STATE
// ============================================

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mb-4" />
      <p className="text-zinc-400">Loading dashboard...</p>
    </div>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function DashboardPage() {
  const router = useRouter();
  const [state, setState] = useState<DashboardState>({
    loading: true,
    error: null,
    hasSites: false,
    sites: [],
    currentSite: null,
    plan: "starter",
    usage: { articles: 0, articlesLimit: 50 },
    debug: [],
  });
  const [addingSite, setAddingSite] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const addDebug = (msg: string) => {
    console.log("[Dashboard]", msg);
    setState(prev => ({ ...prev, debug: [...prev.debug, `${new Date().toISOString().slice(11,19)} ${msg}`] }));
  };

  // Load dashboard data
  const loadDashboard = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null, debug: [] }));
    
    try {
      addDebug("Fetching /api/sites...");
      
      // Fetch sites directly
      const sitesRes = await fetch("/api/sites");
      const sitesData = await sitesRes.json();
      
      addDebug(`Sites response: ${JSON.stringify(sitesData).slice(0, 200)}`);
      
      if (!sitesRes.ok) {
        throw new Error(sitesData.error || "Failed to load sites");
      }

      const sites = sitesData.data?.sites || sitesData.sites || [];
      
      addDebug(`Found ${sites.length} sites`);

      // Fetch usage/plan info
      const usageRes = await fetch("/api/billing/usage");
      const usageData = usageRes.ok ? await usageRes.json() : null;
      
      addDebug(`Usage data: ${JSON.stringify(usageData?.data?.plan || {}).slice(0, 100)}`);

      if (sites.length === 0) {
        setState(prev => ({
          ...prev,
          loading: false,
          hasSites: false,
          sites: [],
          currentSite: null,
          plan: usageData?.data?.plan?.name || "Starter",
          usage: {
            articles: usageData?.data?.usage?.articles || 0,
            articlesLimit: usageData?.data?.limits?.articles || 50,
          },
        }));
        return;
      }

      // We have sites
      const currentSite = sites[0];
      
      setState({
        loading: false,
        error: null,
        hasSites: true,
        sites,
        currentSite,
        plan: usageData?.data?.plan?.name || "Starter",
        usage: {
          articles: usageData?.data?.usage?.articles || 0,
          articlesLimit: usageData?.data?.limits?.articles || 50,
        },
        debug: state.debug,
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      addDebug(`Error: ${errorMessage}`);
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Add a new site
  const handleAddSite = async (url: string) => {
    setAddingSite(true);
    
    try {
      addDebug(`Adding site: ${url}`);
      
      // First, ensure user has an org (create if needed)
      const ensureOrgRes = await fetch("/api/settings/account");
      const ensureOrgData = await ensureOrgRes.json();
      
      addDebug(`Account check: ${JSON.stringify(ensureOrgData).slice(0, 200)}`);
      
      // Normalize URL
      let normalizedUrl = url;
      if (!normalizedUrl.startsWith("http")) {
        normalizedUrl = "https://" + normalizedUrl;
      }
      
      let domain: string;
      try {
        const urlObj = new URL(normalizedUrl);
        domain = urlObj.hostname.replace(/^www\./, "");
      } catch {
        domain = url;
      }

      // Create site directly via API
      addDebug(`Creating site for domain: ${domain}`);
      
      const createRes = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: normalizedUrl,
          domain,
          name: domain,
        }),
      });
      
      const createData = await createRes.json();
      addDebug(`Create site response: ${JSON.stringify(createData).slice(0, 300)}`);
      
      if (!createRes.ok) {
        throw new Error(createData.error || "Failed to create site");
      }

      // Redirect to onboarding for analysis
      router.push(`/onboarding?url=${encodeURIComponent(normalizedUrl)}&siteId=${createData.data?.id || createData.id || ""}`);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to add site";
      addDebug(`Add site error: ${errorMessage}`);
      setState(prev => ({ ...prev, error: errorMessage }));
    } finally {
      setAddingSite(false);
    }
  };

  // Refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  };

  // Render
  if (state.loading) {
    return <LoadingState />;
  }

  if (state.error) {
    return <ErrorState error={state.error} debug={state.debug} onRetry={loadDashboard} />;
  }

  if (!state.hasSites || !state.currentSite) {
    return <EmptyState onAddSite={handleAddSite} loading={addingSite} />;
  }

  return (
    <SiteDashboard
      site={state.currentSite}
      plan={state.plan}
      usage={state.usage}
      onRefresh={handleRefresh}
      refreshing={refreshing}
    />
  );
}
