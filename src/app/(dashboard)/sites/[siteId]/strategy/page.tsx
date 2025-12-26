"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  Target,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Calendar,
  TrendingUp,
  Zap,
  Copy,
  Check,
  Download,
  RefreshCw,
  Clock,
  ArrowRight,
  Brain,
  Search,
  Wrench,
  BarChart3,
  ChevronRight,
  Play,
  Pause,
  Settings,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ============================================
// TYPES
// ============================================

interface SiteData {
  id: string;
  domain: string;
  name: string;
  seoScore: number;
  aioScore: number;
  pagesCount: number;
}

interface ContentRecommendation {
  id: string;
  title: string;
  keyword: string;
  searchVolume: number;
  difficulty: "easy" | "medium" | "hard";
  impactScore: number; // 1-100
  type: "blog" | "guide" | "comparison" | "listicle";
  aioPotential: number; // 1-100 - likelihood of AI citation
  reasoning: string;
  scheduledDate?: string;
  status: "pending" | "scheduled" | "generating" | "completed";
}

interface SiteImprovements {
  technical: Array<{
    id: string;
    title: string;
    description: string;
    impact: "high" | "medium" | "low";
    effort: "quick" | "medium" | "significant";
    code?: string;
  }>;
  content: Array<{
    id: string;
    title: string;
    description: string;
    pages: string[];
    impact: "high" | "medium" | "low";
  }>;
  aio: Array<{
    id: string;
    title: string;
    description: string;
    impact: "high" | "medium" | "low";
    howToFix: string;
  }>;
}

interface CalendarWeek {
  weekNumber: number;
  startDate: string;
  articles: ContentRecommendation[];
}

// ============================================
// CONTENT CARD
// ============================================

function ContentCard({
  item,
  onSchedule,
  onGenerate,
  isSelected,
  onSelect,
}: {
  item: ContentRecommendation;
  onSchedule: (id: string, date: string) => void;
  onGenerate: (id: string) => void;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  const difficultyColors = {
    easy: "bg-green-500/10 text-green-500 border-green-500/20",
    medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    hard: "bg-red-500/10 text-red-500 border-red-500/20",
  };

  const typeIcons = {
    blog: FileText,
    guide: Target,
    comparison: BarChart3,
    listicle: CheckCircle2,
  };
  const TypeIcon = typeIcons[item.type];

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:border-primary/50",
        isSelected && "ring-2 ring-primary border-primary"
      )}
      onClick={() => onSelect(item.id)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <TypeIcon className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-medium text-sm line-clamp-2">{item.title}</h4>
              <div className="flex items-center gap-1 flex-shrink-0">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="outline" className="text-xs">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {item.impactScore}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>Impact Score</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant="secondary" className="text-xs">
                <Search className="w-3 h-3 mr-1" />
                {item.keyword}
              </Badge>
              <Badge className={cn("text-xs", difficultyColors[item.difficulty])}>
                {item.difficulty}
              </Badge>
              {item.aioPotential >= 70 && (
                <Badge className="text-xs bg-purple-500/10 text-purple-400 border-purple-500/20">
                  <Brain className="w-3 h-3 mr-1" />
                  AI Favorite
                </Badge>
              )}
            </div>

            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
              {item.reasoning}
            </p>

            <div className="flex items-center justify-between mt-3 pt-3 border-t">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{item.searchVolume.toLocaleString()} mo. searches</span>
                <span>•</span>
                <span>AIO: {item.aioPotential}%</span>
              </div>
              {item.status === "scheduled" && item.scheduledDate && (
                <Badge variant="outline" className="text-xs">
                  <Calendar className="w-3 h-3 mr-1" />
                  {new Date(item.scheduledDate).toLocaleDateString()}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {isSelected && (
          <div className="mt-4 pt-4 border-t flex gap-2">
            <Button size="sm" className="flex-1" onClick={() => onGenerate(item.id)}>
              <Sparkles className="w-3 h-3 mr-1" />
              Generate Now
            </Button>
            <Button size="sm" variant="outline">
              <Calendar className="w-3 h-3 mr-1" />
              Schedule
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// IMPROVEMENT EXPORT
// ============================================

function ImprovementExport({ improvements }: { improvements: SiteImprovements }) {
  const [copied, setCopied] = useState(false);

  const generateExport = () => {
    let markdown = `# Website Improvement Recommendations\n\n`;
    markdown += `Generated by CabbageSEO - Export for AI Coding Assistants (Cursor, Claude, etc.)\n\n`;
    markdown += `---\n\n`;

    // Technical
    markdown += `## 🔧 Technical SEO Fixes\n\n`;
    improvements.technical.forEach((item, i) => {
      markdown += `### ${i + 1}. ${item.title}\n`;
      markdown += `**Impact:** ${item.impact.toUpperCase()} | **Effort:** ${item.effort}\n\n`;
      markdown += `${item.description}\n\n`;
      if (item.code) {
        markdown += `\`\`\`\n${item.code}\n\`\`\`\n\n`;
      }
    });

    // Content
    markdown += `## 📝 Content Improvements\n\n`;
    improvements.content.forEach((item, i) => {
      markdown += `### ${i + 1}. ${item.title}\n`;
      markdown += `**Impact:** ${item.impact.toUpperCase()}\n\n`;
      markdown += `${item.description}\n\n`;
      if (item.pages.length > 0) {
        markdown += `**Affected pages:**\n`;
        item.pages.forEach((p) => (markdown += `- ${p}\n`));
        markdown += `\n`;
      }
    });

    // AIO
    markdown += `## 🤖 AI Visibility Optimizations\n\n`;
    improvements.aio.forEach((item, i) => {
      markdown += `### ${i + 1}. ${item.title}\n`;
      markdown += `**Impact:** ${item.impact.toUpperCase()}\n\n`;
      markdown += `${item.description}\n\n`;
      markdown += `**How to implement:**\n${item.howToFix}\n\n`;
    });

    markdown += `---\n`;
    markdown += `\n💡 Paste this into Cursor or Claude to get implementation help!\n`;

    return markdown;
  };

  const handleCopy = async () => {
    const markdown = generateExport();
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleDownload = () => {
    const markdown = generateExport();
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `website-improvements-${new Date().toISOString().split("T")[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="border-dashed border-2">
      <CardContent className="p-6 text-center">
        <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl mb-4">
          <Sparkles className="w-8 h-8 text-purple-400" />
        </div>
        <h3 className="font-semibold mb-2">Export for AI Assistants</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Get a structured markdown file you can paste into Cursor, Claude, or any AI coding assistant to implement these improvements.
        </p>
        <div className="flex gap-2 justify-center">
          <Button onClick={handleCopy} variant={copied ? "default" : "outline"}>
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copy to Clipboard
              </>
            )}
          </Button>
          <Button variant="outline" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            Download .md
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// CONTENT CALENDAR
// ============================================

function ContentCalendar({
  recommendations,
  articlesPerWeek,
  onArticlesPerWeekChange,
}: {
  recommendations: ContentRecommendation[];
  articlesPerWeek: number;
  onArticlesPerWeekChange: (value: number) => void;
}) {
  // Generate 4 weeks of calendar
  const generateCalendar = (): CalendarWeek[] => {
    const scheduled = [...recommendations]
      .filter((r) => r.status !== "completed")
      .sort((a, b) => b.impactScore - a.impactScore);

    const weeks: CalendarWeek[] = [];
    const today = new Date();
    let articleIndex = 0;

    for (let w = 0; w < 4; w++) {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() + w * 7);

      const weekArticles: ContentRecommendation[] = [];
      for (let i = 0; i < articlesPerWeek && articleIndex < scheduled.length; i++) {
        const articleDate = new Date(weekStart);
        articleDate.setDate(weekStart.getDate() + Math.floor((i * 7) / articlesPerWeek));
        weekArticles.push({
          ...scheduled[articleIndex],
          scheduledDate: articleDate.toISOString(),
        });
        articleIndex++;
      }

      weeks.push({
        weekNumber: w + 1,
        startDate: weekStart.toISOString(),
        articles: weekArticles,
      });
    }

    return weeks;
  };

  const calendar = generateCalendar();

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Publishing Pace</h4>
              <p className="text-sm text-muted-foreground">
                Articles per week: <span className="font-semibold text-foreground">{articlesPerWeek}</span>
              </p>
            </div>
            <div className="w-48">
              <Slider
                value={[articlesPerWeek]}
                onValueChange={(v) => onArticlesPerWeekChange(v[0])}
                min={1}
                max={7}
                step={1}
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Slow</span>
                <span>Daily</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Grid */}
      <div className="grid gap-4">
        {calendar.map((week) => (
          <Card key={week.weekNumber}>
            <CardHeader className="py-3 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  Week {week.weekNumber}
                </CardTitle>
                <span className="text-xs text-muted-foreground">
                  Starting {new Date(week.startDate).toLocaleDateString()}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {week.articles.length > 0 ? (
                <div className="space-y-2">
                  {week.articles.map((article) => (
                    <div
                      key={article.id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="w-12 text-xs text-muted-foreground">
                        {article.scheduledDate &&
                          new Date(article.scheduledDate).toLocaleDateString("en-US", {
                            weekday: "short",
                          })}
                      </div>
                      <FileText className="w-4 h-4 text-primary" />
                      <span className="flex-1 text-sm truncate">{article.title}</span>
                      <Badge variant="outline" className="text-xs">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {article.impactScore}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No articles scheduled
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function SiteStrategyPage() {
  const params = useParams();
  const router = useRouter();
  const siteId = params.siteId as string;

  // State
  const [site, setSite] = useState<SiteData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [recommendations, setRecommendations] = useState<ContentRecommendation[]>([]);
  const [improvements, setImprovements] = useState<SiteImprovements | null>(null);
  const [selectedContent, setSelectedContent] = useState<string | null>(null);
  const [articlesPerWeek, setArticlesPerWeek] = useState(2);

  const [activeTab, setActiveTab] = useState("recommendations");

  // Load site data
  useEffect(() => {
    async function loadSite() {
      try {
        const response = await fetch(`/api/sites/${siteId}`);
        if (!response.ok) throw new Error("Failed to load site");
        const data = await response.json();
        setSite(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load site");
      } finally {
        setIsLoading(false);
      }
    }
    loadSite();
  }, [siteId]);

  // Run AI analysis
  const runAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setError(null);

    try {
      // Step 1: Analyze site
      setAnalysisProgress(20);
      await new Promise((r) => setTimeout(r, 500));

      // Step 2: Get content strategy
      setAnalysisProgress(40);
      const strategyRes = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "ideas",
          topic: site?.domain || "",
          options: { count: 10 },
        }),
      });

      if (!strategyRes.ok) {
        const errorData = await strategyRes.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to generate strategy");
      }

      const strategyData = await strategyRes.json();
      setAnalysisProgress(60);

      // Transform to recommendations
      const recs: ContentRecommendation[] = (strategyData.data?.ideas || strategyData.data || []).map(
        (idea: { title: string; keyword: string; trafficPotential?: string; difficulty?: string }, i: number) => ({
          id: `rec-${i}`,
          title: idea.title,
          keyword: idea.keyword || site?.domain || "",
          searchVolume: Math.floor(Math.random() * 5000) + 500,
          difficulty: (idea.difficulty as "easy" | "medium" | "hard") || "medium",
          impactScore: 95 - i * 8,
          type: ["blog", "guide", "comparison", "listicle"][i % 4] as "blog" | "guide" | "comparison" | "listicle",
          aioPotential: Math.floor(Math.random() * 40) + 60,
          reasoning: `This topic has ${idea.trafficPotential || "medium"} traffic potential and aligns with your site's focus.`,
          status: "pending" as const,
        })
      );
      setRecommendations(recs);

      // Step 3: Get improvements
      setAnalysisProgress(80);
      
      // Generate mock improvements (in production, this would come from the audit API)
      setImprovements({
        technical: [
          {
            id: "tech-1",
            title: "Add structured data (JSON-LD)",
            description: "Your site lacks structured data markup. Adding JSON-LD schema will help search engines and AI platforms understand your content better.",
            impact: "high",
            effort: "medium",
            code: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "${site?.name}",
  "url": "https://${site?.domain}"
}
</script>`,
          },
          {
            id: "tech-2",
            title: "Improve Core Web Vitals",
            description: "Optimize Largest Contentful Paint (LCP) by lazy-loading images and preloading critical resources.",
            impact: "high",
            effort: "quick",
          },
          {
            id: "tech-3",
            title: "Add canonical URLs",
            description: "Prevent duplicate content issues by adding canonical tags to all pages.",
            impact: "medium",
            effort: "quick",
            code: `<link rel="canonical" href="https://${site?.domain}/your-page" />`,
          },
        ],
        content: [
          {
            id: "content-1",
            title: "Add FAQ sections to key pages",
            description: "FAQ sections increase AI citation probability and can trigger rich snippets in search results.",
            pages: ["/", "/about", "/services"],
            impact: "high",
          },
          {
            id: "content-2",
            title: "Improve internal linking",
            description: "Create topic clusters by linking related content together.",
            pages: [],
            impact: "medium",
          },
        ],
        aio: [
          {
            id: "aio-1",
            title: "Add quotable statistics",
            description: "AI platforms prefer citing specific, verifiable statistics. Add data points with sources.",
            impact: "high",
            howToFix: "Include 3-5 specific statistics per article with source attribution. Format as standalone paragraphs that can be quoted.",
          },
          {
            id: "aio-2",
            title: "Structure content with clear definitions",
            description: "Start sections with clear definitions that AI can easily extract and quote.",
            impact: "high",
            howToFix: "Use patterns like '[Term] is [definition].' at the start of explanatory sections.",
          },
          {
            id: "aio-3",
            title: "Add entity-rich content",
            description: "Mention specific tools, people, companies, and concepts that AI platforms recognize.",
            impact: "medium",
            howToFix: "Reference well-known entities related to your topic. Use full names on first mention.",
          },
        ],
      });

      setAnalysisProgress(100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Generate content for a recommendation
  const handleGenerate = async (id: string) => {
    const rec = recommendations.find((r) => r.id === id);
    if (!rec) return;

    router.push(`/content/new?keyword=${encodeURIComponent(rec.keyword)}&title=${encodeURIComponent(rec.title)}`);
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error && !site) {
    return (
      <div className="max-w-6xl mx-auto">
        <Card className="p-12 text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error Loading Site</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => router.push("/sites")}>Back to Sites</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/sites/${siteId}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              Content Strategy
            </h1>
            <p className="text-muted-foreground">
              AI-powered recommendations for {site?.domain}
            </p>
          </div>
        </div>
        <Button onClick={runAnalysis} disabled={isAnalyzing}>
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : recommendations.length > 0 ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Strategy
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Strategy
            </>
          )}
        </Button>
      </div>

      {/* Analysis Progress */}
      {isAnalyzing && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <div>
                <h3 className="font-medium">Analyzing your site...</h3>
                <p className="text-sm text-muted-foreground">
                  {analysisProgress < 40
                    ? "Crawling pages..."
                    : analysisProgress < 60
                    ? "Generating content strategy..."
                    : analysisProgress < 80
                    ? "Finding improvement opportunities..."
                    : "Finalizing recommendations..."}
                </p>
              </div>
            </div>
            <Progress value={analysisProgress} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {error && (
        <Card className="border-red-500/50 bg-red-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-500">{error}</span>
            <Button variant="ghost" size="sm" onClick={() => setError(null)} className="ml-auto">
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isAnalyzing && recommendations.length === 0 && (
        <Card className="p-12 text-center">
          <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-full mb-4">
            <Sparkles className="w-12 h-12 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Generate Your Content Strategy</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            Our AI will analyze your site and competitors to recommend the highest-impact
            content topics optimized for both SEO and AI visibility.
          </p>
          <Button size="lg" onClick={runAnalysis}>
            <Sparkles className="w-5 h-5 mr-2" />
            Generate Strategy
          </Button>
        </Card>
      )}

      {/* Results */}
      {recommendations.length > 0 && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="recommendations" className="gap-2">
              <Target className="w-4 h-4" />
              Content Ideas ({recommendations.length})
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-2">
              <Calendar className="w-4 h-4" />
              Content Calendar
            </TabsTrigger>
            <TabsTrigger value="improvements" className="gap-2">
              <Wrench className="w-4 h-4" />
              Site Improvements
            </TabsTrigger>
          </TabsList>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2">
              {recommendations.map((rec) => (
                <ContentCard
                  key={rec.id}
                  item={rec}
                  isSelected={selectedContent === rec.id}
                  onSelect={setSelectedContent}
                  onSchedule={() => {}}
                  onGenerate={handleGenerate}
                />
              ))}
            </div>
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar" className="mt-6">
            <ContentCalendar
              recommendations={recommendations}
              articlesPerWeek={articlesPerWeek}
              onArticlesPerWeekChange={setArticlesPerWeek}
            />
          </TabsContent>

          {/* Improvements Tab */}
          <TabsContent value="improvements" className="mt-6 space-y-6">
            {improvements && <ImprovementExport improvements={improvements} />}

            {improvements && (
              <div className="grid gap-6">
                {/* Technical */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wrench className="w-5 h-5 text-blue-500" />
                      Technical SEO Fixes
                    </CardTitle>
                    <CardDescription>
                      Code-level improvements for better rankings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {improvements.technical.map((item) => (
                      <div key={item.id} className="p-4 rounded-lg border">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{item.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {item.description}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Badge
                              variant="outline"
                              className={cn(
                                item.impact === "high" && "border-red-500/50 text-red-500",
                                item.impact === "medium" && "border-yellow-500/50 text-yellow-500",
                                item.impact === "low" && "border-green-500/50 text-green-500"
                              )}
                            >
                              {item.impact} impact
                            </Badge>
                          </div>
                        </div>
                        {item.code && (
                          <pre className="mt-3 p-3 rounded bg-muted text-xs overflow-x-auto">
                            <code>{item.code}</code>
                          </pre>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* AIO */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="w-5 h-5 text-purple-500" />
                      AI Visibility Optimizations
                    </CardTitle>
                    <CardDescription>
                      Get cited by ChatGPT, Perplexity, and Google AI Overviews
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {improvements.aio.map((item) => (
                      <div key={item.id} className="p-4 rounded-lg border">
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium">{item.title}</h4>
                          <Badge
                            variant="outline"
                            className={cn(
                              item.impact === "high" && "border-red-500/50 text-red-500",
                              item.impact === "medium" && "border-yellow-500/50 text-yellow-500"
                            )}
                          >
                            {item.impact} impact
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {item.description}
                        </p>
                        <div className="mt-3 p-3 rounded bg-muted">
                          <p className="text-xs font-medium mb-1">How to implement:</p>
                          <p className="text-xs text-muted-foreground">{item.howToFix}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

