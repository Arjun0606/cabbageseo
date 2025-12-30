"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Bot,
  Sparkles,
  TrendingUp,
  Plus,
  ArrowRight,
  Globe,
  Target,
  FileText,
  Zap,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Play,
  RefreshCw,
  Download,
  ExternalLink,
  ChevronRight,
  Clock,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useSite } from "@/contexts/site-context";

// ============================================
// TYPES
// ============================================

interface Site {
  id: string;
  domain: string;
  geoScore: number;
  seoScore: number;
  lastAnalyzed: string | null;
  articlesGenerated: number;
  keywordsTracked: number;
  autopilotEnabled: boolean;
}

interface GEOPlatformScore {
  platform: string;
  icon: string;
  score: number;
  trend: "up" | "down" | "stable";
  cited: boolean;
}

// ============================================
// GEO SCORE RING - The Hero Metric
// ============================================

function GEOScoreRing({ score, size = 180 }: { score: number; size?: number }) {
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  
  const getColor = (s: number) => {
    if (s >= 80) return "#10b981"; // emerald
    if (s >= 60) return "#eab308"; // yellow
    if (s >= 40) return "#f97316"; // orange
    return "#ef4444"; // red
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#27272a"
          strokeWidth="12"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor(score)}
          strokeWidth="12"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-white">{score}</span>
        <span className="text-sm text-zinc-500">GEO Score</span>
      </div>
    </div>
  );
}

// ============================================
// AI PLATFORM CARD
// ============================================

function AIPlatformCard({ platform }: { platform: GEOPlatformScore }) {
  return (
    <div className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{platform.icon}</span>
          <span className="text-sm font-medium text-zinc-300">{platform.platform}</span>
        </div>
        {platform.cited ? (
          <Badge className="bg-emerald-500/20 text-emerald-400 border-0">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Cited
          </Badge>
        ) : (
          <Badge className="bg-zinc-700 text-zinc-400 border-0">
            Not yet
          </Badge>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-white">{platform.score}</span>
        <span className="text-sm text-zinc-500">/100</span>
        {platform.trend === "up" && (
          <TrendingUp className="w-4 h-4 text-emerald-400 ml-auto" />
        )}
      </div>
    </div>
  );
}

// ============================================
// QUICK ACTION BUTTON
// ============================================

function QuickActionButton({ 
  icon: Icon, 
  label, 
  onClick,
  variant = "default",
  loading = false,
}: { 
  icon: React.ElementType; 
  label: string; 
  onClick: () => void;
  variant?: "default" | "primary";
  loading?: boolean;
}) {
  return (
    <Button
      onClick={onClick}
      disabled={loading}
      className={`flex-1 h-auto py-4 flex-col gap-2 ${
        variant === "primary" 
          ? "bg-emerald-600 hover:bg-emerald-500 text-white" 
          : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
      }`}
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <Icon className="w-5 h-5" />
      )}
      <span className="text-xs font-medium">{label}</span>
    </Button>
  );
}

// ============================================
// EMPTY STATE - Ultra Simple
// ============================================

function EmptyDashboard() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    if (!url.trim()) return;
    setIsAnalyzing(true);
    
    // Normalize URL
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith("http")) {
      normalizedUrl = "https://" + normalizedUrl;
    }
    
    router.push(`/onboarding?url=${encodeURIComponent(normalizedUrl)}`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      {/* Hero */}
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="relative">
          <Bot className="w-20 h-20 text-emerald-400" />
        </div>
      </div>
      
      <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">
        Is AI citing your content?
      </h1>
      <p className="text-xl text-zinc-400 max-w-lg mb-8">
        Get your GEO Score in 30 seconds
      </p>
      
      {/* URL Input - The Only Thing That Matters */}
      <div className="w-full max-w-xl mb-8">
        <div className="flex gap-2">
          <Input
            type="url"
            placeholder="yourwebsite.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
            className="h-14 text-lg bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-emerald-500"
          />
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
                Analyze
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* What You Get */}
      <div className="grid grid-cols-3 gap-6 max-w-2xl">
        <div className="text-center">
          <div className="p-3 bg-emerald-500/10 rounded-xl inline-block mb-3">
            <Eye className="w-6 h-6 text-emerald-400" />
          </div>
          <p className="text-sm font-medium text-white">GEO Score</p>
          <p className="text-xs text-zinc-500">ChatGPT • Perplexity • Google AI</p>
        </div>
        <div className="text-center">
          <div className="p-3 bg-emerald-500/10 rounded-xl inline-block mb-3">
            <Sparkles className="w-6 h-6 text-emerald-400" />
          </div>
          <p className="text-sm font-medium text-white">Generate GEO Content</p>
          <p className="text-xs text-zinc-500">Optimized for AI engines</p>
        </div>
        <div className="text-center">
          <div className="p-3 bg-emerald-500/10 rounded-xl inline-block mb-3">
            <Zap className="w-6 h-6 text-emerald-400" />
          </div>
          <p className="text-sm font-medium text-white">Autopilot Mode</p>
          <p className="text-xs text-zinc-500">Set it and forget it</p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN DASHBOARD - GEO Focused
// ============================================

function MainDashboard({ site }: { site: Site }) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Mock AI platform scores - in real app, fetch from API
  const platformScores: GEOPlatformScore[] = [
    { platform: "ChatGPT", icon: "🤖", score: 72, trend: "up", cited: true },
    { platform: "Perplexity", icon: "🔮", score: 65, trend: "up", cited: false },
    { platform: "Google AI", icon: "🔍", score: 58, trend: "stable", cited: false },
  ];

  const handleGenerateContent = async () => {
    setIsGenerating(true);
    router.push("/content/new");
  };

  const handleRefreshScore = async () => {
    setIsRefreshing(true);
    try {
      await fetch(`/api/geo/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId: site.id }),
      });
      // Reload page to show new score
      window.location.reload();
    } catch (error) {
      console.error("Failed to refresh:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Globe className="w-6 h-6 text-emerald-400" />
            {site.domain}
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Last analyzed: {site.lastAnalyzed ? new Date(site.lastAnalyzed).toLocaleDateString() : "Never"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefreshScore}
            disabled={isRefreshing}
            className="border-zinc-700 text-zinc-300"
          >
            {isRefreshing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span className="ml-2">Refresh Score</span>
          </Button>
          <Link href={`/geo?export=true`}>
            <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-300">
              <Download className="w-4 h-4 mr-2" />
              Export for Cursor
            </Button>
          </Link>
        </div>
      </div>

      {/* GEO Score Hero Section */}
      <Card className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-emerald-900/20 border-zinc-800">
        <CardContent className="p-8">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            {/* Score Ring */}
            <div className="flex-shrink-0">
              <GEOScoreRing score={site.geoScore || 65} />
            </div>

            {/* Platform Breakdown */}
            <div className="flex-1 w-full">
              <h2 className="text-lg font-semibold text-white mb-4">AI Platform Visibility</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {platformScores.map((platform) => (
                  <AIPlatformCard key={platform.platform} platform={platform} />
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 pt-6 border-t border-zinc-800">
            <div className="flex gap-3">
              <QuickActionButton
                icon={Sparkles}
                label="Generate GEO Article"
                onClick={handleGenerateContent}
                variant="primary"
                loading={isGenerating}
              />
              <QuickActionButton
                icon={Target}
                label="Research Keywords"
                onClick={() => router.push("/keywords")}
              />
              <QuickActionButton
                icon={FileText}
                label="View Issues"
                onClick={() => router.push("/audit")}
              />
              <QuickActionButton
                icon={Bot}
                label="GEO Details"
                onClick={() => router.push("/geo")}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <FileText className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{site.articlesGenerated}</p>
                <p className="text-xs text-zinc-500">Articles Generated</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <Target className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{site.keywordsTracked}</p>
                <p className="text-xs text-zinc-500">Keywords Tracked</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{site.seoScore}</p>
                <p className="text-xs text-zinc-500">SEO Score</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-zinc-800 ${site.autopilotEnabled ? "bg-emerald-900/20 border-emerald-500/30" : "bg-zinc-900"}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${site.autopilotEnabled ? "bg-emerald-500/20" : "bg-zinc-800"}`}>
                <Zap className={`w-5 h-5 ${site.autopilotEnabled ? "text-emerald-400" : "text-zinc-500"}`} />
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${site.autopilotEnabled ? "text-emerald-400" : "text-zinc-500"}`}>
                  {site.autopilotEnabled ? "Autopilot ON" : "Autopilot OFF"}
                </p>
                <p className="text-xs text-zinc-500">
                  {site.autopilotEnabled ? "Generating weekly" : "Manual mode"}
                </p>
              </div>
              <Link href="/settings">
                <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Getting Started / Next Steps */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-emerald-400" />
            Get Cited by AI
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Step 1 */}
            <div className="flex items-start gap-4 p-4 rounded-lg bg-zinc-800/50 border border-emerald-500/30">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
                1
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-white">Generate GEO-optimized content</h4>
                <p className="text-sm text-zinc-400 mt-1">
                  Create articles with FAQ sections, citations, and entity-rich language that AI loves.
                </p>
              </div>
              <Button 
                onClick={handleGenerateContent}
                className="bg-emerald-600 hover:bg-emerald-500"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Generate
              </Button>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-4 p-4 rounded-lg bg-zinc-800/50">
              <div className="w-8 h-8 rounded-full bg-zinc-700 text-zinc-300 flex items-center justify-center text-sm font-bold shrink-0">
                2
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-white">Publish to your CMS</h4>
                <p className="text-sm text-zinc-400 mt-1">
                  One-click publish to WordPress, Webflow, Shopify, Ghost, and more.
                </p>
              </div>
              <Link href="/settings/integrations">
                <Button variant="outline" className="border-zinc-700 text-zinc-300">
                  Connect CMS
                </Button>
              </Link>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-4 p-4 rounded-lg bg-zinc-800/50">
              <div className="w-8 h-8 rounded-full bg-zinc-700 text-zinc-300 flex items-center justify-center text-sm font-bold shrink-0">
                3
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-white">Enable Autopilot</h4>
                <p className="text-sm text-zinc-400 mt-1">
                  Let us generate and publish GEO content weekly while you focus on your product.
                </p>
              </div>
              <Link href="/settings">
                <Button variant="outline" className="border-zinc-700 text-zinc-300">
                  Enable
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// LOADING
// ============================================

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-10 w-48 bg-zinc-800" />
      <Skeleton className="h-80 bg-zinc-800" />
      <div className="grid grid-cols-4 gap-4">
        <Skeleton className="h-24 bg-zinc-800" />
        <Skeleton className="h-24 bg-zinc-800" />
        <Skeleton className="h-24 bg-zinc-800" />
        <Skeleton className="h-24 bg-zinc-800" />
      </div>
    </div>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function DashboardPage() {
  const { selectedSite } = useSite();
  const [site, setSite] = useState<Site | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSites, setHasSites] = useState(false);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const response = await fetch("/api/dashboard");
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data.sites && data.data.sites.length > 0) {
            setHasSites(true);
            
            // Use selected site or first site
            const targetSite = selectedSite 
              ? data.data.sites.find((s: Site) => s.id === selectedSite.id) || data.data.sites[0]
              : data.data.sites[0];
            
            setSite({
              id: targetSite.id,
              domain: targetSite.domain,
              geoScore: targetSite.geoScore || targetSite.geo_score_avg || targetSite.aio_score_avg || 65,
              seoScore: targetSite.seoScore || targetSite.seo_score || 70,
              lastAnalyzed: targetSite.lastCrawled || targetSite.last_crawled_at,
              articlesGenerated: targetSite.contentCount || 0,
              keywordsTracked: targetSite.keywordsCount || 0,
              autopilotEnabled: targetSite.autopilotEnabled || targetSite.autopilot_enabled || false,
            });
          }
        }
      } catch (error) {
        console.error("Failed to load dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboard();
  }, [selectedSite]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!hasSites || !site) {
    return <EmptyDashboard />;
  }

  return <MainDashboard site={site} />;
}
