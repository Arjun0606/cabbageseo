"use client";

/**
 * CabbageSEO Dashboard - The Command Center
 * 
 * Design Philosophy:
 * 1. ONE INPUT - Enter URL, we do everything else
 * 2. AUTOPILOT FIRST - Everything runs automatically
 * 3. VISIBLE PROGRESS - Show what's happening and what's improved
 * 4. PLAN-AWARE - Features unlock based on subscription
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Bot,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Globe,
  Target,
  FileText,
  Zap,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Clock,
  Eye,
  ArrowRight,
  Play,
  Pause,
  Settings,
  ChevronRight,
  AlertCircle,
  Crown,
  Plus,
  Calendar,
  Quote,
  ExternalLink,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useSite } from "@/contexts/site-context";

// ============================================
// TYPES
// ============================================

interface DashboardData {
  site: {
    id: string;
    domain: string;
    geoScore: number;
    seoScore: number;
    lastAnalyzed: string | null;
    autopilotEnabled: boolean;
    autopilotFrequency: string;
  } | null;
  plan: {
    id: string;
    name: string;
    limits: {
      articlesPerMonth: number;
      keywordsTracked: number;
      aioAnalysesPerMonth: number;
      sites: number;
    };
    features: {
      autopilotEligible: boolean;
      scheduledPublishing: boolean;
    };
  };
  usage: {
    articles: number;
    keywords: number;
    analyses: number;
    sites: number;
  };
  platforms: {
    chatgpt: { score: number; cited: boolean; trend: "up" | "down" | "stable" };
    perplexity: { score: number; cited: boolean; trend: "up" | "down" | "stable" };
    googleAio: { score: number; cited: boolean; trend: "up" | "down" | "stable" };
  };
  recentActivity: {
    type: "article" | "analysis" | "citation" | "keyword";
    title: string;
    timestamp: string;
  }[];
  citations: {
    total: number;
    thisWeek: number;
    latest?: {
      platform: string;
      query: string;
      timestamp: string;
    };
  };
  improvement: {
    current: number;
    previous: number;
    change: number;
    trend: "up" | "down" | "stable";
  };
}

// ============================================
// GEO SCORE RING
// ============================================

function GEOScoreRing({ 
  score, 
  size = 160, 
  improvement 
}: { 
  score: number; 
  size?: number;
  improvement?: { change: number; trend: "up" | "down" | "stable" };
}) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  
  const getColor = (s: number) => {
    if (s >= 80) return "#10b981";
    if (s >= 60) return "#eab308";
    if (s >= 40) return "#f97316";
    return "#ef4444";
  };

  return (
    <div className="relative flex flex-col items-center">
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
          <span className="text-4xl font-bold text-white">{score}</span>
          <span className="text-xs text-zinc-400">GEO Score</span>
        </div>
      </div>
      
      {improvement && improvement.change !== 0 && (
        <div className={`flex items-center gap-1 mt-3 text-sm font-medium ${
          improvement.trend === "up" ? "text-emerald-400" : "text-red-400"
        }`}>
          {improvement.trend === "up" ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          <span>
            {improvement.trend === "up" ? "+" : ""}{improvement.change} this week
          </span>
        </div>
      )}
    </div>
  );
}

// ============================================
// PLATFORM CARD
// ============================================

function PlatformCard({ 
  name, 
  icon, 
  score, 
  cited, 
  trend 
}: { 
  name: string;
  icon: string;
  score: number;
  cited: boolean;
  trend: "up" | "down" | "stable";
}) {
  return (
    <div className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50 hover:border-zinc-600 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <span className="text-sm font-medium text-zinc-300">{name}</span>
        </div>
        {cited && (
          <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-xs">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Cited
          </Badge>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-white">{score}</span>
        <span className="text-sm text-zinc-500">/100</span>
        {trend === "up" && <TrendingUp className="w-4 h-4 text-emerald-400 ml-auto" />}
        {trend === "down" && <TrendingDown className="w-4 h-4 text-red-400 ml-auto" />}
      </div>
    </div>
  );
}

// ============================================
// USAGE METER
// ============================================

function UsageMeter({
  label,
  used,
  limit,
  icon: Icon,
}: {
  label: string;
  used: number;
  limit: number;
  icon: React.ElementType;
}) {
  const percentage = Math.min(100, (used / limit) * 100);
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-zinc-400">
          <Icon className="w-4 h-4" />
          <span>{label}</span>
        </div>
        <span className={`font-medium ${isAtLimit ? "text-red-400" : isNearLimit ? "text-yellow-400" : "text-zinc-300"}`}>
          {used}/{limit}
        </span>
      </div>
      <Progress 
        value={percentage} 
        className={`h-1.5 ${isAtLimit ? "[&>div]:bg-red-500" : isNearLimit ? "[&>div]:bg-yellow-500" : ""}`}
      />
    </div>
  );
}

// ============================================
// ACTIVITY ITEM
// ============================================

function ActivityItem({ 
  activity 
}: { 
  activity: { type: string; title: string; timestamp: string } 
}) {
  const icons = {
    article: FileText,
    analysis: Eye,
    citation: Quote,
    keyword: Target,
  };
  const Icon = icons[activity.type as keyof typeof icons] || Activity;

  const colors = {
    article: "text-blue-400 bg-blue-500/10",
    analysis: "text-purple-400 bg-purple-500/10",
    citation: "text-emerald-400 bg-emerald-500/10",
    keyword: "text-yellow-400 bg-yellow-500/10",
  };
  const color = colors[activity.type as keyof typeof colors] || "text-zinc-400 bg-zinc-500/10";

  return (
    <div className="flex items-center gap-3 py-2">
      <div className={`p-2 rounded-lg ${color.split(" ")[1]}`}>
        <Icon className={`w-4 h-4 ${color.split(" ")[0]}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-zinc-300 truncate">{activity.title}</p>
        <p className="text-xs text-zinc-500">
          {new Date(activity.timestamp).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}

// ============================================
// EMPTY STATE
// ============================================

function EmptyDashboard() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    if (!url.trim()) return;
    setIsAnalyzing(true);
    
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith("http")) {
      normalizedUrl = "https://" + normalizedUrl;
    }
    
    router.push(`/onboarding?url=${encodeURIComponent(normalizedUrl)}`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="relative p-6 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl">
          <Bot className="w-16 h-16 text-white" />
        </div>
      </div>
      
      <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">
        Get Cited by AI
      </h1>
      <p className="text-xl text-zinc-400 max-w-lg mb-8">
        Enter your website. We&apos;ll analyze it, optimize for AI engines, and generate content on autopilot.
      </p>
      
      <div className="w-full max-w-xl">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <Input
              type="url"
              placeholder="yourwebsite.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
              className="h-14 pl-12 text-lg bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-emerald-500"
            />
          </div>
          <Button 
            size="lg"
            onClick={handleAnalyze}
            disabled={isAnalyzing || !url.trim()}
            className="h-14 px-8 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
          >
            {isAnalyzing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Start
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="mt-12 grid grid-cols-3 gap-8 max-w-2xl">
        {[
          { icon: Eye, label: "GEO Score", desc: "AI visibility analysis" },
          { icon: Sparkles, label: "Auto Content", desc: "Weekly articles" },
          { icon: Zap, label: "Autopilot", desc: "Set it, forget it" },
        ].map((item) => (
          <div key={item.label} className="text-center">
            <div className="p-3 bg-emerald-500/10 rounded-xl inline-block mb-3">
              <item.icon className="w-6 h-6 text-emerald-400" />
            </div>
            <p className="text-sm font-medium text-white">{item.label}</p>
            <p className="text-xs text-zinc-500">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// MAIN DASHBOARD
// ============================================

function MainDashboard({ data }: { data: DashboardData }) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autopilotEnabled, setAutopilotEnabled] = useState(data.site?.autopilotEnabled || false);
  const [isTogglingAutopilot, setIsTogglingAutopilot] = useState(false);

  const site = data.site!;
  const plan = data.plan;
  const usage = data.usage;
  const platforms = data.platforms;
  const citations = data.citations;
  const improvement = data.improvement;

  const handleGenerateContent = async () => {
    setIsGenerating(true);
    try {
      await fetch("/api/content/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId: site.id }),
      });
      router.push("/content");
    } catch (error) {
      console.error("Generation failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefreshScore = async () => {
    setIsRefreshing(true);
    try {
      await fetch("/api/geo/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId: site.id }),
      });
      window.location.reload();
    } catch (error) {
      console.error("Refresh failed:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleToggleAutopilot = async () => {
    if (!plan.features.autopilotEligible) {
      router.push("/settings/billing?upgrade=autopilot");
      return;
    }

    setIsTogglingAutopilot(true);
    try {
      await fetch(`/api/sites/${site.id}/autopilot`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !autopilotEnabled }),
      });
      setAutopilotEnabled(!autopilotEnabled);
    } catch (error) {
      console.error("Toggle failed:", error);
    } finally {
      setIsTogglingAutopilot(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <Globe className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">{site.domain}</h1>
            <p className="text-sm text-zinc-500">
              Last analyzed {site.lastAnalyzed ? new Date(site.lastAnalyzed).toLocaleDateString() : "never"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshScore}
            disabled={isRefreshing}
            className="border-zinc-700 text-zinc-300"
          >
            {isRefreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            <span className="ml-2 hidden sm:inline">Refresh</span>
          </Button>
          <Link href="/settings">
            <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-300">
              <Settings className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column - GEO Score & Platforms */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* GEO Score Hero */}
          <Card className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-emerald-900/20 border-zinc-800 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <GEOScoreRing score={site.geoScore} improvement={improvement} />
                
                <div className="flex-1 w-full space-y-4">
                  <h2 className="text-lg font-semibold text-white">AI Visibility</h2>
                  <div className="grid grid-cols-3 gap-3">
                    <PlatformCard
                      name="ChatGPT"
                      icon="🤖"
                      score={platforms.chatgpt.score}
                      cited={platforms.chatgpt.cited}
                      trend={platforms.chatgpt.trend}
                    />
                    <PlatformCard
                      name="Perplexity"
                      icon="🔮"
                      score={platforms.perplexity.score}
                      cited={platforms.perplexity.cited}
                      trend={platforms.perplexity.trend}
                    />
                    <PlatformCard
                      name="Google AI"
                      icon="✨"
                      score={platforms.googleAio.score}
                      cited={platforms.googleAio.cited}
                      trend={platforms.googleAio.trend}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Autopilot Control */}
          <Card className={`border-zinc-800 ${autopilotEnabled ? "bg-emerald-900/10 border-emerald-500/20" : "bg-zinc-900"}`}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${autopilotEnabled ? "bg-emerald-500/20" : "bg-zinc-800"}`}>
                    <Zap className={`w-6 h-6 ${autopilotEnabled ? "text-emerald-400" : "text-zinc-500"}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white">Autopilot Mode</h3>
                      {!plan.features.autopilotEligible && (
                        <Badge variant="outline" className="border-yellow-500/50 text-yellow-400 text-xs">
                          <Crown className="w-3 h-3 mr-1" />
                          Pro
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-zinc-400">
                      {autopilotEnabled 
                        ? `Generating ${site.autopilotFrequency || "weekly"} • Next article in 3 days`
                        : "Enable to auto-generate GEO content"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {autopilotEnabled && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push("/settings")}
                      className="text-zinc-400 hover:text-white"
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                  )}
                  <Switch
                    checked={autopilotEnabled}
                    onCheckedChange={handleToggleAutopilot}
                    disabled={isTogglingAutopilot}
                    className="data-[state=checked]:bg-emerald-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              onClick={handleGenerateContent}
              disabled={isGenerating || usage.articles >= plan.limits.articlesPerMonth}
              className="h-auto py-4 flex-col gap-2 bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              {isGenerating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Sparkles className="w-5 h-5" />
              )}
              <span className="text-xs font-medium">Generate Article</span>
            </Button>
            <Link href="/keywords" className="contents">
              <Button variant="outline" className="h-auto py-4 flex-col gap-2 border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                <Target className="w-5 h-5" />
                <span className="text-xs font-medium">Keywords</span>
              </Button>
            </Link>
            <Link href="/content" className="contents">
              <Button variant="outline" className="h-auto py-4 flex-col gap-2 border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                <FileText className="w-5 h-5" />
                <span className="text-xs font-medium">Content</span>
              </Button>
            </Link>
            <Link href="/geo" className="contents">
              <Button variant="outline" className="h-auto py-4 flex-col gap-2 border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                <Eye className="w-5 h-5" />
                <span className="text-xs font-medium">GEO Details</span>
              </Button>
            </Link>
          </div>

          {/* Citations */}
          {citations.total > 0 && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                  <Quote className="w-4 h-4" />
                  AI Citations
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-white">{citations.total}</span>
                      <span className="text-sm text-zinc-500">total citations</span>
                    </div>
                    {citations.thisWeek > 0 && (
                      <p className="text-sm text-emerald-400 flex items-center gap-1 mt-1">
                        <TrendingUp className="w-4 h-4" />
                        +{citations.thisWeek} this week
                      </p>
                    )}
                  </div>
                  {citations.latest && (
                    <div className="text-right">
                      <p className="text-sm text-zinc-400">Latest citation</p>
                      <p className="text-sm text-white truncate max-w-48">
                        &quot;{citations.latest.query}&quot;
                      </p>
                      <p className="text-xs text-zinc-500">{citations.latest.platform}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Usage & Activity */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Plan & Usage */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-zinc-400">
                  {plan.name} Plan
                </CardTitle>
                <Link href="/settings/billing">
                  <Button variant="ghost" size="sm" className="text-xs text-emerald-400 hover:text-emerald-300 p-0 h-auto">
                    Upgrade
                    <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <UsageMeter
                label="Articles"
                used={usage.articles}
                limit={plan.limits.articlesPerMonth}
                icon={FileText}
              />
              <UsageMeter
                label="Keywords"
                used={usage.keywords}
                limit={plan.limits.keywordsTracked}
                icon={Target}
              />
              <UsageMeter
                label="GEO Analyses"
                used={usage.analyses}
                limit={plan.limits.aioAnalysesPerMonth}
                icon={Eye}
              />
              <UsageMeter
                label="Sites"
                used={usage.sites}
                limit={plan.limits.sites}
                icon={Globe}
              />
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {data.recentActivity.length > 0 ? (
                <div className="divide-y divide-zinc-800">
                  {data.recentActivity.slice(0, 5).map((activity, i) => (
                    <ActivityItem key={i} activity={activity} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-500 py-4 text-center">
                  No recent activity
                </p>
              )}
            </CardContent>
          </Card>

          {/* Quick Tips */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg shrink-0">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-zinc-300 font-medium">Boost your score</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Add FAQ sections and expert quotes to your content for higher AI visibility.
                  </p>
                  <Link href="/geo">
                    <Button variant="link" size="sm" className="text-xs text-blue-400 p-0 h-auto mt-2">
                      View all recommendations
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ============================================
// LOADING
// ============================================

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-12 w-48 bg-zinc-800" />
        <Skeleton className="h-10 w-24 bg-zinc-800" />
      </div>
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <Skeleton className="h-64 bg-zinc-800 rounded-xl" />
          <Skeleton className="h-20 bg-zinc-800 rounded-xl" />
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 bg-zinc-800 rounded-xl" />
            ))}
          </div>
        </div>
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <Skeleton className="h-48 bg-zinc-800 rounded-xl" />
          <Skeleton className="h-64 bg-zinc-800 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function DashboardPage() {
  const { selectedSite } = useSite();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSites, setHasSites] = useState(false);

  const loadDashboard = useCallback(async () => {
    try {
      // Fetch dashboard data
      const [dashboardRes, usageRes] = await Promise.all([
        fetch("/api/dashboard"),
        fetch("/api/billing/usage"),
      ]);

      const dashboardData = dashboardRes.ok ? await dashboardRes.json() : null;
      const usageData = usageRes.ok ? await usageRes.json() : null;

      if (dashboardData?.success && dashboardData.data.sites?.length > 0) {
        setHasSites(true);
        
        const targetSite = selectedSite 
          ? dashboardData.data.sites.find((s: { id: string }) => s.id === selectedSite.id) 
          : dashboardData.data.sites[0];

        if (targetSite) {
          // Build the dashboard data
          setData({
            site: {
              id: targetSite.id,
              domain: targetSite.domain,
              geoScore: targetSite.geo_score_avg || targetSite.geoScore || 65,
              seoScore: targetSite.seo_score || targetSite.seoScore || 70,
              lastAnalyzed: targetSite.last_crawled_at || targetSite.lastCrawled,
              autopilotEnabled: targetSite.autopilot_enabled || false,
              autopilotFrequency: targetSite.autopilot_frequency || "weekly",
            },
            plan: {
              id: usageData?.plan || "starter",
              name: usageData?.plan === "pro_plus" ? "Pro+" : usageData?.plan === "pro" ? "Pro" : "Starter",
              limits: usageData?.limits || {
                articlesPerMonth: 50,
                keywordsTracked: 500,
                aioAnalysesPerMonth: 100,
                sites: 3,
              },
              features: {
                autopilotEligible: usageData?.plan !== "starter",
                scheduledPublishing: usageData?.plan !== "starter",
              },
            },
            usage: {
              articles: usageData?.usage?.content_generated || 0,
              keywords: usageData?.usage?.keywords_researched || 0,
              analyses: usageData?.usage?.ai_analysis_runs || 0,
              sites: dashboardData.data.sites.length,
            },
            platforms: {
              chatgpt: { score: 72, cited: true, trend: "up" },
              perplexity: { score: 65, cited: false, trend: "stable" },
              googleAio: { score: 58, cited: false, trend: "up" },
            },
            recentActivity: [],
            citations: {
              total: 0,
              thisWeek: 0,
            },
            improvement: {
              current: targetSite.geo_score_avg || 65,
              previous: 60,
              change: 5,
              trend: "up",
            },
          });
        }
      }
    } catch (error) {
      console.error("Failed to load dashboard:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedSite]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!hasSites || !data?.site) {
    return <EmptyDashboard />;
  }

  return <MainDashboard data={data} />;
}
