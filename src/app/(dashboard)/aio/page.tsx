"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Brain,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  CheckCircle2,
  Zap,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { PLATFORM_LABELS, PLATFORM_WEIGHTS } from "@/lib/aio/types";
import type { AIOPlatform } from "@/lib/aio/types";

// Platform icons/colors
const platformConfig: Record<AIOPlatform, { color: string; bgColor: string }> = {
  google_aio: { color: "text-blue-500", bgColor: "bg-blue-500/10" },
  chatgpt: { color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
  perplexity: { color: "text-violet-500", bgColor: "bg-violet-500/10" },
  claude: { color: "text-orange-500", bgColor: "bg-orange-500/10" },
  gemini: { color: "text-cyan-500", bgColor: "bg-cyan-500/10" },
};

function ScoreRing({ score, size = 120, label }: { score: number | null; size?: number; label?: string }) {
  const displayScore = score ?? 0;
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (displayScore / 100) * circumference;

  const getScoreColor = (s: number) => {
    if (s >= 80) return "stroke-emerald-500";
    if (s >= 60) return "stroke-yellow-500";
    if (s >= 40) return "stroke-orange-500";
    return "stroke-red-500";
  };

  return (
    <div className="relative flex flex-col items-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-muted/30"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={cn("transition-all duration-700", getScoreColor(displayScore))}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold">{score !== null ? displayScore : "—"}</span>
        <span className="text-xs text-muted-foreground">/ 100</span>
      </div>
      {label && (
        <span className="mt-2 text-sm font-medium text-muted-foreground">{label}</span>
      )}
    </div>
  );
}

function PlatformScoreBar({ 
  platform, 
  score, 
  weight 
}: { 
  platform: AIOPlatform; 
  score: number | null; 
  weight: number;
}) {
  const config = platformConfig[platform];
  const displayScore = score ?? 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full", config.color.replace("text-", "bg-"))} />
          <span className="text-sm font-medium">{PLATFORM_LABELS[platform]}</span>
          <Badge variant="outline" className="text-xs">
            {Math.round(weight * 100)}%
          </Badge>
        </div>
        <span className="text-sm font-bold">{score !== null ? displayScore : "—"}</span>
      </div>
      <Progress 
        value={displayScore} 
        className={cn("h-2", config.bgColor)} 
      />
    </div>
  );
}

function IssueCard({ 
  title, 
  description, 
  priority, 
  impact,
  autoFixable,
}: { 
  title: string;
  description: string;
  priority: "critical" | "high" | "medium" | "low";
  impact: string;
  autoFixable: boolean;
}) {
  const priorityColors = {
    critical: "border-red-500/50 bg-red-500/5",
    high: "border-orange-500/50 bg-orange-500/5",
    medium: "border-yellow-500/50 bg-yellow-500/5",
    low: "border-blue-500/50 bg-blue-500/5",
  };

  const priorityBadges = {
    critical: "bg-red-500/20 text-red-500",
    high: "bg-orange-500/20 text-orange-500",
    medium: "bg-yellow-500/20 text-yellow-500",
    low: "bg-blue-500/20 text-blue-500",
  };

  return (
    <div className={cn("rounded-lg border p-4", priorityColors[priority])}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn("px-2 py-0.5 rounded text-xs font-medium", priorityBadges[priority])}>
              {priority.toUpperCase()}
            </span>
            {autoFixable && (
              <Badge variant="outline" className="text-xs">
                <Zap className="w-3 h-3 mr-1" />
                Auto-fix
              </Badge>
            )}
          </div>
          <h4 className="font-medium mb-1">{title}</h4>
          <p className="text-sm text-muted-foreground">{description}</p>
          <p className="text-xs text-emerald-500 mt-2">
            Expected impact: {impact}
          </p>
        </div>
        {autoFixable && (
          <Button size="sm" variant="outline">
            Fix
          </Button>
        )}
      </div>
    </div>
  );
}

function CitationsPanel({ siteId }: { siteId: string | null }) {
  const { data: citationsData, isLoading } = useQuery({
    queryKey: ["aio-citations", siteId],
    queryFn: async () => {
      if (!siteId) return null;
      const response = await fetch(`/api/aio/citations?siteId=${siteId}`);
      if (!response.ok) throw new Error("Failed to fetch citations");
      return response.json();
    },
    enabled: !!siteId,
  });

  const citations = citationsData?.data?.citations || [];
  const platformCounts = citationsData?.data?.platformCounts || {};

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Citations</CardTitle>
          <CardDescription>Loading citation data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalCitations = Object.values(platformCounts).reduce((a: number, b) => a + (b as number), 0);

  return (
    <div className="space-y-6">
      {/* Citation Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        {(Object.keys(PLATFORM_WEIGHTS) as AIOPlatform[]).map((platform) => {
          const config = platformConfig[platform];
          const count = (platformCounts[platform] as number) || 0;
          return (
            <Card key={platform} className={cn("border", config.bgColor)}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn("w-2 h-2 rounded-full", config.color.replace("text-", "bg-"))} />
                  <span className="text-sm font-medium">{PLATFORM_LABELS[platform]}</span>
                </div>
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-xs text-muted-foreground">citations</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Citations List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Recent Citations</span>
            <Badge variant="outline">{totalCitations} total</Badge>
          </CardTitle>
          <CardDescription>
            When AI platforms cite your content in their responses
          </CardDescription>
        </CardHeader>
        <CardContent>
          {citations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ExternalLink className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No citations discovered yet.</p>
              <p className="text-sm mt-2">
                As AI platforms cite your content, they&apos;ll appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {citations.slice(0, 20).map((citation: {
                id: string;
                platform: AIOPlatform;
                query: string;
                citation_type: string;
                snippet?: string;
                discovered_at: string;
                pages?: { url: string; title: string };
              }) => {
                const config = platformConfig[citation.platform];
                return (
                  <div
                    key={citation.id}
                    className="flex items-start gap-4 p-3 rounded-lg bg-muted/30"
                  >
                    <div className={cn("p-2 rounded", config.bgColor)}>
                      <ExternalLink className={cn("w-4 h-4", config.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {PLATFORM_LABELS[citation.platform]}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(citation.discovered_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="font-medium truncate">Query: &quot;{citation.query}&quot;</p>
                      {citation.snippet && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {citation.snippet}
                        </p>
                      )}
                      {citation.pages && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Page: {citation.pages.title || citation.pages.url}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AIODashboardPage() {
  const [selectedSite, setSelectedSite] = useState<string | null>(null);

  // Fetch sites
  const { data: sitesData } = useQuery({
    queryKey: ["sites"],
    queryFn: async () => {
      const response = await fetch("/api/sites");
      if (!response.ok) throw new Error("Failed to fetch sites");
      return response.json();
    },
  });

  const sites = sitesData?.sites || [];
  const activeSiteId = selectedSite || sites[0]?.id;

  // Fetch AIO data for the selected site
  const { data: aioData, isLoading, refetch } = useQuery({
    queryKey: ["aio-stats", activeSiteId],
    queryFn: async () => {
      if (!activeSiteId) return null;
      const response = await fetch(`/api/aio/analyze?siteId=${activeSiteId}`);
      if (!response.ok) throw new Error("Failed to fetch AIO data");
      return response.json();
    },
    enabled: !!activeSiteId,
  });

  // Fetch pages with AIO scores
  const { data: pagesData } = useQuery({
    queryKey: ["pages-aio", activeSiteId],
    queryFn: async () => {
      if (!activeSiteId) return null;
      const response = await fetch(`/api/pages?siteId=${activeSiteId}&hasAioScore=true`);
      if (!response.ok) throw new Error("Failed to fetch pages");
      return response.json();
    },
    enabled: !!activeSiteId,
  });

  const pages = pagesData?.pages || [];
  const stats = aioData?.data || {
    averageScore: null,
    pagesAnalyzed: 0,
    platformAverages: {},
  };

  // Fetch recommendations from audit
  const { data: recommendationsData } = useQuery({
    queryKey: ["aio-recommendations", activeSiteId],
    queryFn: async () => {
      if (!activeSiteId) return null;
      // Get pages that need improvement
      const response = await fetch(`/api/pages?siteId=${activeSiteId}&hasAioScore=true&limit=50`);
      if (!response.ok) return null;
      const data = await response.json();
      return data.pages || [];
    },
    enabled: !!activeSiteId,
  });

  // Generate recommendations based on AIO scores
  const recommendations = (() => {
    const pagesWithScores = recommendationsData || [];
    const recs: Array<{
      title: string;
      description: string;
      priority: "critical" | "high" | "medium" | "low";
      impact: string;
      autoFixable: boolean;
    }> = [];

    // Check for pages with low AIO scores
    const lowScorePages = pagesWithScores.filter((p: { aio_score?: number }) => (p.aio_score || 0) < 50);
    if (lowScorePages.length > 0) {
      recs.push({
        title: `Optimize ${lowScorePages.length} pages with low AIO scores`,
        description: "These pages score below 50 and need significant optimization for AI visibility.",
        priority: "high",
        impact: "+20-30 points",
        autoFixable: true,
      });
    }

    // Check for pages without FAQ
    const noFAQPages = pagesWithScores.filter((p: { quotability_score?: number }) => (p.quotability_score || 0) < 60);
    if (noFAQPages.length > 0) {
      recs.push({
        title: `Improve quotability on ${noFAQPages.length} pages`,
        description: "Break up long paragraphs into quotable 50-150 word chunks for better AI citation.",
        priority: "medium",
        impact: "+10-15 points",
        autoFixable: true,
      });
    }

    // Generic recommendations if no specific data
    if (recs.length === 0) {
      recs.push(
        {
          title: "Add FAQ sections to key pages",
          description: "Pages with FAQ schema are 3x more likely to be cited in AI Overviews.",
          priority: "high",
          impact: "+15-20 points",
          autoFixable: true,
        },
        {
          title: "Improve entity density across content",
          description: "Add more named entities (people, products, concepts) to help AI understand content.",
          priority: "medium",
          impact: "+10-15 points",
          autoFixable: true,
        },
        {
          title: "Add expert attribution to articles",
          description: "Content with author credentials is more likely to be cited by Perplexity.",
          priority: "medium",
          impact: "+10-15 points",
          autoFixable: false,
        },
        {
          title: "Keep content fresh and updated",
          description: "Content older than 6 months loses AI visibility. Refresh with new data.",
          priority: "low",
          impact: "+5-10 points",
          autoFixable: false,
        }
      );
    }

    return recs;
  })();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Brain className="w-8 h-8 text-violet-500" />
            AI Visibility
          </h1>
          <p className="text-muted-foreground mt-1">
            Optimize for AI search platforms: Google AI Overviews, ChatGPT, Perplexity, Claude, Gemini
          </p>
        </div>
        <div className="flex items-center gap-3">
          {sites.length > 1 && (
            <select
              className="px-3 py-2 bg-muted/50 rounded-lg text-sm"
              value={activeSiteId || ""}
              onChange={(e) => setSelectedSite(e.target.value)}
            >
              {sites.map((site: { id: string; domain: string }) => (
                <option key={site.id} value={site.id}>
                  {site.domain}
                </option>
              ))}
            </select>
          )}
          <Button 
            variant="outline" 
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
            Refresh
          </Button>
          <Button>
            <Sparkles className="w-4 h-4 mr-2" />
            Analyze All Pages
          </Button>
        </div>
      </div>

      {/* Main Score + Platform Breakdown */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Combined AIO Score */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              Combined AIO Score
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Weighted average of all platform scores. Higher scores mean better visibility in AI search results.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
            <CardDescription>
              {stats.pagesAnalyzed} pages analyzed
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center pt-4">
            <ScoreRing score={stats.averageScore} size={160} />
            <div className="flex items-center gap-2 mt-4">
              {stats.averageScore !== null ? (
                <>
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm text-emerald-500">+8 from last month</span>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">No data yet</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Platform Breakdown */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Platform Scores</CardTitle>
            <CardDescription>
              How well optimized your content is for each AI platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {(Object.keys(PLATFORM_WEIGHTS) as AIOPlatform[]).map((platform) => (
              <PlatformScoreBar
                key={platform}
                platform={platform}
                score={stats.platformAverages?.[platform] ?? null}
                weight={PLATFORM_WEIGHTS[platform]}
              />
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Tabs: Recommendations / Pages / Citations */}
      <Tabs defaultValue="recommendations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="recommendations" className="gap-2">
            <AlertCircle className="w-4 h-4" />
            Recommendations
          </TabsTrigger>
          <TabsTrigger value="pages" className="gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Pages
          </TabsTrigger>
          <TabsTrigger value="citations" className="gap-2">
            <ExternalLink className="w-4 h-4" />
            AI Citations
          </TabsTrigger>
        </TabsList>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Optimization Opportunities</CardTitle>
              <CardDescription>
                Actions that will have the biggest impact on your AI visibility
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recommendations.map((rec, i) => (
                <IssueCard key={i} {...rec} />
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pages Tab */}
        <TabsContent value="pages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Page-by-Page Scores</CardTitle>
              <CardDescription>
                AIO visibility scores for individual pages
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No pages have been analyzed yet.</p>
                  <Button className="mt-4" variant="outline">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Analyze Pages
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {pages.slice(0, 10).map((page: {
                    id: string;
                    path: string;
                    title: string;
                    aio_score: number | null;
                    aio_google_score: number | null;
                    aio_chatgpt_score: number | null;
                    aio_perplexity_score: number | null;
                  }) => (
                    <div
                      key={page.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{page.title || page.path}</p>
                        <p className="text-sm text-muted-foreground truncate">{page.path}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-sm font-bold",
                            (page.aio_score ?? 0) >= 70 ? "text-emerald-500" :
                            (page.aio_score ?? 0) >= 50 ? "text-yellow-500" : "text-red-500"
                          )}>
                            {page.aio_score ?? "—"}
                          </span>
                          <span className="text-xs text-muted-foreground">AIO</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Citations Tab */}
        <TabsContent value="citations" className="space-y-4">
          <CitationsPanel siteId={activeSiteId} />
        </TabsContent>
      </Tabs>

      {/* What Each Platform Values */}
      <Card>
        <CardHeader>
          <CardTitle>What Each AI Platform Values</CardTitle>
          <CardDescription>
            Understand how to optimize for different AI search engines
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Google AI Overviews */}
            <div className={cn("p-4 rounded-lg border", platformConfig.google_aio.bgColor)}>
              <h4 className={cn("font-semibold flex items-center gap-2 mb-2", platformConfig.google_aio.color)}>
                {PLATFORM_LABELS.google_aio}
              </h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• E-E-A-T signals (expertise, authority)</li>
                <li>• FAQ & HowTo schema markup</li>
                <li>• Direct answer formatting</li>
                <li>• Entity presence & context</li>
              </ul>
            </div>

            {/* ChatGPT */}
            <div className={cn("p-4 rounded-lg border", platformConfig.chatgpt.bgColor)}>
              <h4 className={cn("font-semibold flex items-center gap-2 mb-2", platformConfig.chatgpt.color)}>
                {PLATFORM_LABELS.chatgpt}
              </h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Quotable paragraphs (50-150 words)</li>
                <li>• Key Takeaways sections</li>
                <li>• Statistics with sources</li>
                <li>• Entity-rich language</li>
              </ul>
            </div>

            {/* Perplexity */}
            <div className={cn("p-4 rounded-lg border", platformConfig.perplexity.bgColor)}>
              <h4 className={cn("font-semibold flex items-center gap-2 mb-2", platformConfig.perplexity.color)}>
                {PLATFORM_LABELS.perplexity}
              </h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Original research & data</li>
                <li>• Expert credentials</li>
                <li>• Comprehensive coverage</li>
                <li>• Citation-worthy snippets</li>
              </ul>
            </div>

            {/* Claude */}
            <div className={cn("p-4 rounded-lg border", platformConfig.claude.bgColor)}>
              <h4 className={cn("font-semibold flex items-center gap-2 mb-2", platformConfig.claude.color)}>
                {PLATFORM_LABELS.claude}
              </h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Semantic clarity</li>
                <li>• Define terms before use</li>
                <li>• Logical structure</li>
                <li>• Clear entity relationships</li>
              </ul>
            </div>

            {/* Gemini */}
            <div className={cn("p-4 rounded-lg border", platformConfig.gemini.bgColor)}>
              <h4 className={cn("font-semibold flex items-center gap-2 mb-2", platformConfig.gemini.color)}>
                {PLATFORM_LABELS.gemini}
              </h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Similar to Google AI Overviews</li>
                <li>• Multimodal (images, video)</li>
                <li>• YouTube integration</li>
                <li>• Schema.org markup</li>
              </ul>
            </div>

            {/* Tips */}
            <div className="p-4 rounded-lg border bg-primary/5">
              <h4 className="font-semibold flex items-center gap-2 mb-2 text-primary">
                <Sparkles className="w-4 h-4" />
                Pro Tips
              </h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Lead with direct answers</li>
                <li>• Add FAQ sections to key pages</li>
                <li>• Include author credentials</li>
                <li>• Update content regularly</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

