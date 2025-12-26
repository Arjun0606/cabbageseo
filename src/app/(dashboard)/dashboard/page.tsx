"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  TrendingUp, 
  TrendingDown,
  FileText, 
  Search, 
  AlertTriangle,
  Zap,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  Sparkles,
  Globe,
  BarChart3,
  Target,
  Rocket,
  RefreshCw,
  ExternalLink,
  Loader2,
  AlertCircle,
  Wrench,
  PenSquare,
  Send,
  Bot,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { NextSteps } from "@/components/onboarding/next-steps";

// ============================================
// TYPES
// ============================================

interface DashboardData {
  sites: Array<{
    id: string;
    domain: string;
    name: string;
    seoScore: number;
    status: string;
    pagesCount: number;
    issuesCount: number;
    lastCrawled: string | null;
  }>;
  stats: {
    totalKeywords: number;
    trackedKeywords: number;
    totalContent: number;
    publishedContent: number;
    avgPosition: number | null;
    totalIssues: number;
    criticalIssues: number;
  };
  recentActivity: Array<{
    id: string;
    type: "content" | "keyword" | "audit" | "publish" | "crawl";
    title: string;
    description: string;
    timestamp: string;
    siteId: string;
    siteDomain: string;
  }>;
  nextActions: Array<{
    id: string;
    type: "write" | "optimize" | "fix" | "research" | "publish";
    title: string;
    description: string;
    priority: "high" | "medium" | "low";
    siteId: string;
    siteDomain: string;
  }>;
}

interface UsageData {
  articles: { used: number; limit: number };
  keywords: { used: number; limit: number };
  audits: { used: number; limit: number };
  planName: string;
}

// ============================================
// LOADING SKELETON
// ============================================

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        <Skeleton className="md:col-span-2 h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}

// ============================================
// HERO ACTION CARD - The Money Path
// ============================================

function HeroActionCard({
  title,
  description,
  icon: Icon,
  href,
  variant = "default",
  badge,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  variant?: "default" | "primary" | "secondary";
  badge?: string;
}) {
  const bgClass = variant === "primary" 
    ? "bg-gradient-to-br from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white border-emerald-500"
    : variant === "secondary"
    ? "bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white border-purple-500"
    : "bg-zinc-900 hover:bg-zinc-800 border-zinc-700";

  return (
    <Link href={href}>
      <Card className={`relative overflow-hidden transition-all duration-200 cursor-pointer group ${bgClass}`}>
        {badge && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-white/20 text-white border-0 text-xs">{badge}</Badge>
          </div>
        )}
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl ${variant !== "default" ? "bg-white/20" : "bg-emerald-500/10"}`}>
              <Icon className={`w-6 h-6 ${variant !== "default" ? "text-white" : "text-emerald-400"}`} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
                {title}
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className={`text-sm ${variant !== "default" ? "text-white/80" : "text-zinc-400"}`}>
                {description}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// ============================================
// USAGE INDICATOR
// ============================================

function UsageIndicator({ 
  label, 
  used, 
  limit, 
  icon: Icon 
}: { 
  label: string; 
  used: number; 
  limit: number; 
  icon: React.ElementType;
}) {
  const percentage = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;

  return (
    <div className="p-3 bg-zinc-800/50 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-zinc-500" />
          <span className="text-sm text-zinc-400">{label}</span>
        </div>
        <span className={`text-sm font-medium ${isAtLimit ? "text-red-400" : isNearLimit ? "text-yellow-400" : "text-zinc-300"}`}>
          {used}/{limit}
        </span>
      </div>
      <Progress 
        value={percentage} 
        className={`h-1.5 ${isAtLimit ? "[&>div]:bg-red-500" : isNearLimit ? "[&>div]:bg-yellow-500" : "[&>div]:bg-emerald-500"}`}
      />
      {isNearLimit && !isAtLimit && (
        <p className="text-xs text-yellow-400 mt-1">Approaching limit</p>
      )}
      {isAtLimit && (
        <Link href="/pricing" className="text-xs text-red-400 hover:underline mt-1 block">
          Upgrade to continue →
        </Link>
      )}
    </div>
  );
}

// ============================================
// EMPTY STATE - Action Focused
// ============================================

function EmptyDashboard() {
  const router = useRouter();
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="relative p-6 bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 rounded-2xl">
          <Rocket className="w-16 h-16 text-emerald-400" />
        </div>
      </div>
      
      <h1 className="text-3xl font-bold mb-4 text-white">Welcome to CabbageSEO!</h1>
      <p className="text-zinc-400 max-w-md mb-8">
        Let&apos;s get you ranking. Add your first site and generate 
        content that ranks in both Google and AI search.
      </p>
      
      <div className="flex gap-4">
        <Button 
          size="lg" 
          className="gap-2 bg-emerald-600 hover:bg-emerald-500" 
          onClick={() => router.push("/onboarding")}
        >
          <Plus className="w-5 h-5" />
          Add Your Website
        </Button>
      </div>
      
      {/* Quick value props */}
      <div className="grid grid-cols-3 gap-8 mt-16 max-w-2xl">
        <div className="text-center">
          <div className="p-3 bg-emerald-500/10 rounded-xl inline-block mb-3">
            <Sparkles className="w-6 h-6 text-emerald-400" />
          </div>
          <p className="text-sm font-medium text-white">Generate Articles</p>
          <p className="text-xs text-zinc-500">In 5 minutes</p>
        </div>
        <div className="text-center">
          <div className="p-3 bg-purple-500/10 rounded-xl inline-block mb-3">
            <RefreshCw className="w-6 h-6 text-purple-400" />
          </div>
          <p className="text-sm font-medium text-white">Refresh Content</p>
          <p className="text-xs text-zinc-500">Recover traffic</p>
        </div>
        <div className="text-center">
          <div className="p-3 bg-blue-500/10 rounded-xl inline-block mb-3">
            <Bot className="w-6 h-6 text-blue-400" />
          </div>
          <p className="text-sm font-medium text-white">AI Visibility</p>
          <p className="text-xs text-zinc-500">Get cited by AI</p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// SITE CARD
// ============================================

function SiteCard({ site }: { site: DashboardData["sites"][0] }) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400";
    if (score >= 60) return "text-yellow-400";
    if (score >= 40) return "text-orange-400";
    return "text-red-400";
  };

  return (
    <Link href={`/sites/${site.id}`}>
      <Card className="p-4 bg-zinc-900 border-zinc-800 hover:border-emerald-500/30 transition-all group cursor-pointer">
        <div className="flex items-center gap-4">
          <div className={`text-2xl font-bold ${getScoreColor(site.seoScore)}`}>
            {site.seoScore}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-zinc-500" />
              <span className="font-medium text-white truncate">{site.domain}</span>
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-zinc-500">
              <span>{site.pagesCount} pages</span>
              {site.issuesCount > 0 && (
                <span className="text-red-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {site.issuesCount}
                </span>
              )}
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-zinc-600 group-hover:text-emerald-400 transition-colors" />
        </div>
      </Card>
    </Link>
  );
}

// ============================================
// QUICK ACTION BUTTON
// ============================================

function QuickAction({ 
  icon: Icon, 
  label, 
  href, 
  count 
}: { 
  icon: React.ElementType; 
  label: string; 
  href: string;
  count?: number;
}) {
  return (
    <Link href={href}>
      <div className="flex items-center gap-3 p-3 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer group">
        <div className="p-2 bg-zinc-700 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
          <Icon className="w-4 h-4 text-zinc-400 group-hover:text-emerald-400 transition-colors" />
        </div>
        <span className="text-sm text-zinc-300 group-hover:text-white transition-colors">{label}</span>
        {count !== undefined && count > 0 && (
          <Badge variant="secondary" className="ml-auto text-xs bg-red-500/20 text-red-400 border-0">
            {count}
          </Badge>
        )}
      </div>
    </Link>
  );
}

// ============================================
// MAIN DASHBOARD PAGE
// ============================================

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const [dashRes, usageRes] = await Promise.all([
          fetch("/api/dashboard"),
          fetch("/api/billing/usage"),
        ]);
        
        if (!dashRes.ok) {
          if (dashRes.status === 401) {
            router.push("/login");
            return;
          }
          throw new Error("Failed to load dashboard");
        }

        const dashResult = await dashRes.json();
        if (!dashResult.success) {
          throw new Error(dashResult.error || "Failed to load dashboard");
        }
        setData(dashResult.data);

        // Usage data is optional - don't fail if it errors
        if (usageRes.ok) {
          const usageResult = await usageRes.json();
          if (usageResult.success) {
            setUsage({
              articles: { 
                used: usageResult.data?.usage?.articles || 0, 
                limit: usageResult.data?.limits?.articles || 10 
              },
              keywords: { 
                used: usageResult.data?.usage?.keywords || 0, 
                limit: usageResult.data?.limits?.keywords || 100 
              },
              audits: { 
                used: usageResult.data?.usage?.audits || 0, 
                limit: usageResult.data?.limits?.audits || 5 
              },
              planName: usageResult.data?.plan?.name || "Starter",
            });
          }
        }
      } catch (err) {
        console.error("Dashboard error:", err);
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboard();
  }, [router]);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
          <p className="text-zinc-400">Loading...</p>
        </div>
        <DashboardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2 text-white">Failed to load dashboard</h2>
        <p className="text-zinc-400 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  if (!data || data.sites.length === 0) {
    return <EmptyDashboard />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
          <p className="text-zinc-400">
            Welcome back. What do you want to create today?
          </p>
        </div>
      </div>

      {/* HERO ACTIONS - The Money Path */}
      <div className="grid md:grid-cols-2 gap-4">
        <HeroActionCard
          title="Generate New Article"
          description="Create SEO-optimized content that ranks in Google and gets cited by AI"
          icon={Sparkles}
          href="/content/new"
          variant="primary"
          badge="5 min"
        />
        <HeroActionCard
          title="Refresh Old Content"
          description="Update existing pages to recover lost traffic and match current search intent"
          icon={RefreshCw}
          href="/content?filter=refresh"
          variant="secondary"
          badge="Quick wins"
        />
      </div>

      {/* Next Steps Guide */}
      <NextSteps />

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Sites & Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Sites */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <Globe className="w-5 h-5 text-emerald-400" />
                  Your Sites
                </CardTitle>
                <Link href="/sites/new">
                  <Button size="sm" variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Site
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.sites.slice(0, 4).map((site) => (
                <SiteCard key={site.id} site={site} />
              ))}
              {data.sites.length > 4 && (
                <Link href="/sites" className="block text-center text-sm text-emerald-400 hover:underline py-2">
                  View all {data.sites.length} sites →
                </Link>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <QuickAction icon={Target} label="Research Keywords" href="/keywords" />
              <QuickAction icon={Search} label="Run SEO Audit" href="/audit" count={data.stats.criticalIssues} />
              <QuickAction icon={Bot} label="Check AI Visibility" href="/aio" />
              <QuickAction icon={Sparkles} label="Generate Content" href="/content/new" />
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Usage & Stats */}
        <div className="space-y-6">
          {/* Usage Indicators */}
          {usage && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-base">This Month&apos;s Usage</CardTitle>
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">
                    {usage.planName}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <UsageIndicator 
                  label="Articles" 
                  used={usage.articles.used} 
                  limit={usage.articles.limit} 
                  icon={FileText} 
                />
                <UsageIndicator 
                  label="Keywords" 
                  used={usage.keywords.used} 
                  limit={usage.keywords.limit} 
                  icon={Target} 
                />
                <UsageIndicator 
                  label="Audits" 
                  used={usage.audits.used} 
                  limit={usage.audits.limit} 
                  icon={Search} 
                />
                
                <Link href="/pricing">
                  <Button variant="outline" size="sm" className="w-full mt-2 border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                    <ArrowUpRight className="w-4 h-4 mr-1" />
                    Upgrade for more
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Stats */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base">Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Total Keywords</span>
                <span className="font-semibold text-white">{data.stats.totalKeywords.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Content Pieces</span>
                <span className="font-semibold text-white">{data.stats.totalContent}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Avg. Position</span>
                <span className="font-semibold text-white">
                  {data.stats.avgPosition ? `#${data.stats.avgPosition}` : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Open Issues</span>
                <span className={`font-semibold ${data.stats.criticalIssues > 0 ? "text-red-400" : "text-white"}`}>
                  {data.stats.totalIssues}
                  {data.stats.criticalIssues > 0 && (
                    <span className="text-xs ml-1">({data.stats.criticalIssues} critical)</span>
                  )}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Upgrade CTA */}
          {usage && usage.planName === "Starter" && (
            <Card className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border-emerald-500/30">
              <CardContent className="p-4 text-center">
                <Rocket className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <h4 className="font-semibold text-white mb-1">Unlock More Power</h4>
                <p className="text-xs text-zinc-400 mb-3">
                  Get 25 articles/month, unlimited keywords, and AI visibility tracking
                </p>
                <Link href="/pricing">
                  <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white">
                    Upgrade to Pro
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
