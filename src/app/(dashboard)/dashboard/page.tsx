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
  Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

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

// ============================================
// LOADING SKELETON
// ============================================

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-16" />
          </Card>
        ))}
      </div>
      
      {/* Main content */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </Card>
        <Card className="p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ============================================
// EMPTY STATE
// ============================================

function EmptyDashboard() {
  const router = useRouter();
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="relative p-6 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl">
          <Rocket className="w-16 h-16 text-primary" />
        </div>
      </div>
      
      <h1 className="text-3xl font-bold mb-4">Welcome to CabbageSEO!</h1>
      <p className="text-muted-foreground max-w-md mb-8">
        Let&apos;s get started by analyzing your first website. Our AI will scan your site
        and create a complete SEO strategy in minutes.
      </p>
      
      <div className="flex gap-4">
        <Button size="lg" className="gap-2" onClick={() => router.push("/onboarding")}>
          <Plus className="w-5 h-5" />
          Add Your First Site
        </Button>
      </div>
      
      <div className="grid grid-cols-3 gap-8 mt-16 max-w-2xl">
        <div className="text-center">
          <div className="p-3 bg-primary/10 rounded-xl inline-block mb-3">
            <Search className="w-6 h-6 text-primary" />
          </div>
          <p className="text-sm font-medium">Keyword Research</p>
          <p className="text-xs text-muted-foreground">AI-powered opportunities</p>
        </div>
        <div className="text-center">
          <div className="p-3 bg-primary/10 rounded-xl inline-block mb-3">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <p className="text-sm font-medium">Content Creation</p>
          <p className="text-xs text-muted-foreground">SEO-optimized articles</p>
        </div>
        <div className="text-center">
          <div className="p-3 bg-primary/10 rounded-xl inline-block mb-3">
            <TrendingUp className="w-6 h-6 text-primary" />
          </div>
          <p className="text-sm font-medium">Rank Tracking</p>
          <p className="text-xs text-muted-foreground">Monitor progress</p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// STAT CARD COMPONENT
// ============================================

function StatCard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  trend,
  href
}: { 
  title: string; 
  value: string | number; 
  change?: number; 
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
  href?: string;
}) {
  const content = (
    <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {change !== undefined && (
              <div className="flex items-center gap-1 text-sm">
                {trend === "up" ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : trend === "down" ? (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                ) : null}
                <span className={trend === "up" ? "text-green-500" : trend === "down" ? "text-red-500" : "text-muted-foreground"}>
                  {change > 0 ? "+" : ""}{change}%
                </span>
              </div>
            )}
          </div>
          <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

// ============================================
// SITE CARD
// ============================================

function SiteCard({ site }: { site: DashboardData["sites"][0] }) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    if (score >= 40) return "text-orange-500";
    return "text-red-500";
  };

  const getScoreStroke = (score: number) => {
    if (score >= 80) return "stroke-green-500";
    if (score >= 60) return "stroke-yellow-500";
    if (score >= 40) return "stroke-orange-500";
    return "stroke-red-500";
  };

  return (
    <Link href={`/sites/${site.id}`}>
      <Card className="p-4 hover:shadow-md transition-all hover:border-primary/30 group cursor-pointer">
        <div className="flex items-center gap-4">
          {/* Score Ring */}
          <div className="relative w-14 h-14 flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="28"
                cy="28"
                r="24"
                fill="none"
                strokeWidth="4"
                className="stroke-muted/30"
              />
              <circle
                cx="28"
                cy="28"
                r="24"
                fill="none"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 24}
                strokeDashoffset={2 * Math.PI * 24 * (1 - site.seoScore / 100)}
                className={getScoreStroke(site.seoScore)}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-sm font-bold ${getScoreColor(site.seoScore)}`}>
                {site.seoScore}
              </span>
            </div>
          </div>

          {/* Site Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium truncate">{site.domain}</span>
              <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
              <span>{site.pagesCount} pages</span>
              {site.issuesCount > 0 && (
                <span className="text-red-500 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {site.issuesCount} issues
                </span>
              )}
            </div>
          </div>

          {/* Arrow */}
          <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </Card>
    </Link>
  );
}

// ============================================
// ACTION CARD
// ============================================

function ActionCard({ action, onClick }: { 
  action: DashboardData["nextActions"][0];
  onClick?: () => void;
}) {
  const getIcon = () => {
    switch (action.type) {
      case "write": return PenSquare;
      case "optimize": return Sparkles;
      case "fix": return Wrench;
      case "research": return Search;
      case "publish": return Send;
      default: return Zap;
    }
  };

  const Icon = getIcon();

  return (
    <Card 
      className="p-4 hover:shadow-md transition-all hover:border-primary/30 group cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${
          action.priority === "high" ? "bg-red-500/10 text-red-500" :
          action.priority === "medium" ? "bg-yellow-500/10 text-yellow-500" :
          "bg-muted text-muted-foreground"
        }`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
            {action.title}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {action.siteDomain}
          </p>
        </div>
        <Badge variant={
          action.priority === "high" ? "destructive" : 
          action.priority === "medium" ? "secondary" : "outline"
        } className="text-xs">
          {action.priority}
        </Badge>
      </div>
    </Card>
  );
}

// ============================================
// ACTIVITY ITEM
// ============================================

function ActivityItem({ activity }: { activity: DashboardData["recentActivity"][0] }) {
  const getIcon = () => {
    switch (activity.type) {
      case "content": return FileText;
      case "keyword": return Search;
      case "audit": return AlertTriangle;
      case "publish": return Send;
      case "crawl": return Globe;
      default: return CheckCircle2;
    }
  };

  const Icon = getIcon();
  const timeAgo = getTimeAgo(activity.timestamp);

  return (
    <div className="flex items-start gap-3 py-3">
      <div className="p-2 rounded-lg bg-primary/10 text-primary">
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{activity.title}</p>
        <p className="text-xs text-muted-foreground">{activity.siteDomain}</p>
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {timeAgo}
      </span>
    </div>
  );
}

function getTimeAgo(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return then.toLocaleDateString();
}

// ============================================
// MAIN DASHBOARD PAGE
// ============================================

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const response = await fetch("/api/dashboard");
        
        if (!response.ok) {
          if (response.status === 401) {
            router.push("/login");
            return;
          }
          throw new Error("Failed to load dashboard");
        }

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || "Failed to load dashboard");
        }

        setData(result.data);
      } catch (err) {
        console.error("Dashboard error:", err);
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboard();
  }, [router]);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Loading your SEO command center...</p>
        </div>
        <DashboardSkeleton />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Failed to load dashboard</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  // Empty state (no sites)
  if (!data || data.sites.length === 0) {
    return <EmptyDashboard />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Your SEO command center
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push("/sites/new")}>
            <Plus className="w-4 h-4 mr-2" />
            Add Site
          </Button>
          <Button size="sm" onClick={() => router.push("/content")}>
            <Sparkles className="w-4 h-4 mr-2" />
            Create Content
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Keywords"
          value={data.stats.totalKeywords.toLocaleString()}
          icon={Target}
          href="/keywords"
        />
        <StatCard
          title="Content"
          value={data.stats.totalContent}
          icon={FileText}
          href="/content"
        />
        <StatCard
          title="Avg. Position"
          value={data.stats.avgPosition ? `#${data.stats.avgPosition}` : "—"}
          icon={BarChart3}
          href="/analytics"
        />
        <StatCard
          title="Issues"
          value={data.stats.totalIssues}
          icon={AlertTriangle}
          trend={data.stats.criticalIssues > 0 ? "down" : "neutral"}
          href="/audit"
        />
      </div>

      {/* Main Content */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Sites */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Your Sites</h2>
            <Link href="/sites" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {data.sites.slice(0, 5).map((site) => (
              <SiteCard key={site.id} site={site} />
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Next Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                Next Actions
              </CardTitle>
              <CardDescription>
                Recommended tasks to improve SEO
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.nextActions.length > 0 ? (
                data.nextActions.map((action) => (
                  <ActionCard 
                    key={action.id} 
                    action={action}
                    onClick={() => {
                      if (action.type === "write") router.push("/content");
                      else if (action.type === "fix") router.push("/audit");
                      else if (action.type === "research") router.push("/keywords");
                      else router.push(`/sites/${action.siteId}`);
                    }}
                  />
                ))
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No pending actions. Great job!
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.recentActivity.length > 0 ? (
                <div className="divide-y">
                  {data.recentActivity.slice(0, 5).map((activity) => (
                    <ActivityItem key={activity.id} activity={activity} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No recent activity yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions Footer */}
      <Card className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Rocket className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Ready to grow?</h3>
                <p className="text-sm text-muted-foreground">
                  Let our AI autopilot handle your SEO automatically
                </p>
              </div>
            </div>
            <Button onClick={() => router.push("/autopilot")} className="gap-2">
              <Sparkles className="w-4 h-4" />
              Enable Autopilot
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
