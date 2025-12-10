"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// ============================================
// TYPES
// ============================================

interface DashboardStats {
  totalKeywords: number;
  keywordsChange: number;
  totalContent: number;
  contentChange: number;
  avgPosition: number;
  positionChange: number;
  issuesCount: number;
  issuesChange: number;
}

interface RecentActivity {
  id: string;
  type: "content" | "keyword" | "audit" | "publish";
  title: string;
  description: string;
  timestamp: string;
  status: "completed" | "in_progress" | "failed";
}

interface NextAction {
  id: string;
  type: "write" | "optimize" | "fix" | "research";
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  estimatedTime: string;
}

interface Site {
  id: string;
  name: string;
  domain: string;
  seoScore: number;
  lastCrawl: string;
  issues: number;
}

// ============================================
// STAT CARD COMPONENT
// ============================================

function StatCard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  trend 
}: { 
  title: string; 
  value: string | number; 
  change?: number; 
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
}) {
  return (
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
                <span className="text-muted-foreground">vs last week</span>
              </div>
            )}
          </div>
          <div className="p-3 rounded-xl bg-primary/10 text-primary">
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// SEO SCORE RING
// ============================================

function SEOScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  
  const getColor = (s: number) => {
    if (s >= 80) return "text-green-500";
    if (s >= 60) return "text-yellow-500";
    if (s >= 40) return "text-orange-500";
    return "text-red-500";
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-muted/20"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${getColor(score)} transition-all duration-1000 ease-out`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-bold ${getColor(score)}`}>{score}</span>
        <span className="text-xs text-muted-foreground">SEO Score</span>
      </div>
    </div>
  );
}

// ============================================
// ACTIVITY ITEM
// ============================================

function ActivityItem({ activity }: { activity: RecentActivity }) {
  const icons = {
    content: FileText,
    keyword: Search,
    audit: AlertTriangle,
    publish: Globe,
  };
  
  const Icon = icons[activity.type];
  
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <div className={`p-2 rounded-lg ${
        activity.status === "completed" ? "bg-green-500/10 text-green-500" :
        activity.status === "in_progress" ? "bg-blue-500/10 text-blue-500" :
        "bg-red-500/10 text-red-500"
      }`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{activity.title}</p>
        <p className="text-xs text-muted-foreground">{activity.description}</p>
      </div>
      <div className="flex items-center gap-2">
        {activity.status === "completed" && <CheckCircle2 className="w-4 h-4 text-green-500" />}
        {activity.status === "in_progress" && <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />}
        <span className="text-xs text-muted-foreground">{activity.timestamp}</span>
      </div>
    </div>
  );
}

// ============================================
// NEXT ACTION CARD
// ============================================

function NextActionCard({ action }: { action: NextAction }) {
  const icons = {
    write: FileText,
    optimize: Sparkles,
    fix: AlertTriangle,
    research: Search,
  };
  
  const Icon = icons[action.type];
  
  const priorityColors = {
    high: "bg-red-500/10 text-red-500 border-red-500/20",
    medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    low: "bg-green-500/10 text-green-500 border-green-500/20",
  };

  return (
    <Card className="group hover:shadow-md transition-all duration-300 cursor-pointer border-border/50 hover:border-primary/30">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            <Icon className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-medium truncate">{action.title}</p>
              <Badge variant="outline" className={priorityColors[action.priority]}>
                {action.priority}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">{action.description}</p>
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{action.estimatedTime}</span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// MAIN DASHBOARD
// ============================================

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [nextActions, setNextActions] = useState<NextAction[]>([]);
  const [sites, setSites] = useState<Site[]>([]);

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setStats({
        totalKeywords: 1247,
        keywordsChange: 12,
        totalContent: 48,
        contentChange: 8,
        avgPosition: 14.3,
        positionChange: -2.1,
        issuesCount: 23,
        issuesChange: -15,
      });

      setActivities([
        {
          id: "1",
          type: "content",
          title: "Article Generated",
          description: "\"10 Best SEO Tools for 2025\" - 2,500 words",
          timestamp: "5m ago",
          status: "completed",
        },
        {
          id: "2",
          type: "keyword",
          title: "Keyword Research Complete",
          description: "Found 45 new opportunities in your niche",
          timestamp: "1h ago",
          status: "completed",
        },
        {
          id: "3",
          type: "audit",
          title: "Technical Audit Running",
          description: "Scanning 234 pages for issues...",
          timestamp: "2h ago",
          status: "in_progress",
        },
        {
          id: "4",
          type: "publish",
          title: "Content Published",
          description: "\"How to Improve Core Web Vitals\" is now live",
          timestamp: "3h ago",
          status: "completed",
        },
      ]);

      setNextActions([
        {
          id: "1",
          type: "write",
          title: "Write: \"Local SEO Guide 2025\"",
          description: "High-volume keyword with low competition. Perfect opportunity!",
          priority: "high",
          estimatedTime: "~15 min",
        },
        {
          id: "2",
          type: "optimize",
          title: "Optimize: Homepage Meta Tags",
          description: "Your homepage is missing optimal title and description",
          priority: "high",
          estimatedTime: "~2 min",
        },
        {
          id: "3",
          type: "fix",
          title: "Fix: 5 Broken Internal Links",
          description: "These broken links are hurting your SEO score",
          priority: "medium",
          estimatedTime: "~5 min",
        },
        {
          id: "4",
          type: "research",
          title: "Research: Competitor Gap Analysis",
          description: "Discover keywords your competitors rank for but you don't",
          priority: "low",
          estimatedTime: "~10 min",
        },
      ]);

      setSites([
        {
          id: "1",
          name: "Main Website",
          domain: "example.com",
          seoScore: 78,
          lastCrawl: "2 hours ago",
          issues: 12,
        },
      ]);

      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <Sparkles className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-muted-foreground animate-pulse">Loading your SEO command center...</p>
        </div>
      </div>
    );
  }

  const hasSites = sites.length > 0;

  // Empty state for new users
  if (!hasSites) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl animate-pulse" />
          <div className="relative p-6 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full">
            <Rocket className="w-16 h-16 text-primary" />
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-3">Welcome to CabbageSEO! 🥬</h1>
        <p className="text-muted-foreground max-w-md mb-8">
          Your AI-powered SEO autopilot is ready. Connect your first site and watch the magic happen in 30 seconds.
        </p>
        <div className="flex gap-4">
          <Button size="lg" asChild className="gap-2">
            <Link href="/onboarding">
              <Sparkles className="w-5 h-5" />
              Start Magic Setup
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="gap-2">
            <Link href="/sites/new">
              <Plus className="w-5 h-5" />
              Add Site Manually
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mission Control</h1>
          <p className="text-muted-foreground">Your SEO autopilot is running smoothly</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Sync All
          </Button>
          <Button size="sm" className="gap-2" asChild>
            <Link href="/content/new">
              <Plus className="w-4 h-4" />
              New Content
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Keywords Tracked"
          value={stats?.totalKeywords.toLocaleString() || "0"}
          change={stats?.keywordsChange}
          icon={Target}
          trend="up"
        />
        <StatCard
          title="Content Pieces"
          value={stats?.totalContent || "0"}
          change={stats?.contentChange}
          icon={FileText}
          trend="up"
        />
        <StatCard
          title="Avg. Position"
          value={stats?.avgPosition || "0"}
          change={stats?.positionChange}
          icon={BarChart3}
          trend="up"
        />
        <StatCard
          title="Issues Found"
          value={stats?.issuesCount || "0"}
          change={stats?.issuesChange}
          icon={AlertTriangle}
          trend="down"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Activity & Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Next Actions */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" />
                    Next Actions
                  </CardTitle>
                  <CardDescription>AI-recommended tasks to improve your SEO</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-primary">
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {nextActions.map((action) => (
                <NextActionCard key={action.id} action={action} />
              ))}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>What your SEO autopilot has been doing</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-primary">
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              {activities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Site Overview */}
        <div className="space-y-6">
          {/* Site Score Card */}
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                {sites[0]?.name || "Your Site"}
              </CardTitle>
              <CardDescription>{sites[0]?.domain}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-4">
                <SEOScoreRing score={sites[0]?.seoScore || 0} />
              </div>
              <div className="space-y-3 mt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Last Crawl</span>
                  <span>{sites[0]?.lastCrawl}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Open Issues</span>
                  <Badge variant="secondary">{sites[0]?.issues}</Badge>
                </div>
                <Button className="w-full mt-2" variant="outline" asChild>
                  <Link href="/audit">
                    View Full Audit
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Button variant="outline" className="justify-start gap-2" asChild>
                <Link href="/keywords">
                  <Search className="w-4 h-4" />
                  Research Keywords
                </Link>
              </Button>
              <Button variant="outline" className="justify-start gap-2" asChild>
                <Link href="/content">
                  <FileText className="w-4 h-4" />
                  Generate Content
                </Link>
              </Button>
              <Button variant="outline" className="justify-start gap-2" asChild>
                <Link href="/audit">
                  <AlertTriangle className="w-4 h-4" />
                  Run Site Audit
                </Link>
              </Button>
              <Button variant="outline" className="justify-start gap-2" asChild>
                <Link href="/analytics">
                  <BarChart3 className="w-4 h-4" />
                  View Analytics
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Usage Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Usage This Month</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Articles</span>
                  <span>12 / 50</span>
                </div>
                <Progress value={24} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Keywords</span>
                  <span>450 / 1000</span>
                </div>
                <Progress value={45} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">API Calls</span>
                  <span>2,340 / 10,000</span>
                </div>
                <Progress value={23.4} className="h-2" />
              </div>
              <Button variant="link" size="sm" className="px-0 text-primary" asChild>
                <Link href="/settings/billing">
                  Upgrade Plan →
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
