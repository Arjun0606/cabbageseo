"use client";

/**
 * ============================================
 * CABBAGESEO DASHBOARD - SAME AS FREE ANALYZER
 * ============================================
 * 
 * Uses the EXACT same analysis as the free analyzer.
 * Shows the EXACT same detail level.
 * PLUS: Keywords, Content Ideas, Autopilot.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Globe,
  Sparkles,
  Zap,
  ArrowRight,
  Loader2,
  RefreshCw,
  CheckCircle,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  FileText,
  Search,
  Eye,
  Settings,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Play,
  Calendar,
  Target,
  Brain,
  BarChart3,
  Bell,
  ExternalLink,
  AlertCircle,
  AlertTriangle,
  Info,
  Rocket,
  Award,
  MessageSquare,
  Lightbulb,
  Bot,
  Quote,
  Shield,
  Code,
  BookOpen,
  Plus,
  Edit3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

// ============================================
// TYPES - SAME AS FREE ANALYZER
// ============================================

interface ScoreItem {
  name: string;
  score: number;
  maxScore: number;
  status: "pass" | "warning" | "fail";
  reason: string;
  howToFix?: string;
}

interface AnalysisResult {
  url: string;
  title: string;
  seoScore: number;
  aioScore: number;
  combinedScore: number;
  seo: {
    score: number;
    breakdown: {
      technicalScore: number;
      contentScore: number;
      metaScore: number;
      performanceScore: number;
      accessibilityScore: number;
    };
    details: {
      technical: ScoreItem[];
      content: ScoreItem[];
      meta: ScoreItem[];
      performance: ScoreItem[];
      accessibility: ScoreItem[];
    };
    issueCount: {
      critical: number;
      warning: number;
    };
    recommendations: string[];
  };
  aio: {
    score: number;
    breakdown: {
      structureScore: number;
      authorityScore: number;
      schemaScore: number;
      contentQualityScore: number;
      quotabilityScore: number;
    };
    details: {
      structure: ScoreItem[];
      authority: ScoreItem[];
      schema: ScoreItem[];
      contentQuality: ScoreItem[];
      quotability: ScoreItem[];
    };
    factors: {
      hasDirectAnswers: boolean;
      hasFAQSection: boolean;
      hasSchema: boolean;
      hasAuthorInfo: boolean;
      hasCitations: boolean;
      hasKeyTakeaways: boolean;
      avgSentenceLength: number;
    };
    platformScores: {
      googleAIO: number;
      perplexity: number;
      chatGPT: number;
      bingCopilot: number;
    };
    recommendations: string[];
  };
  keywords: string[];
  contentIdeas: Array<{
    title: string;
    keyword: string;
    priority: "high" | "medium" | "low";
  }>;
}

interface SiteData {
  id: string;
  domain: string;
  geoScore: number;
  autopilotEnabled: boolean;
}

interface UsageData {
  articles: { used: number; limit: number };
  keywords: { used: number; limit: number };
}

interface CitationData {
  total: number;
  byPlatform: { chatgpt: number; perplexity: number; googleAI: number };
  recent: Array<{ platform: string; query: string; foundAt: string }>;
}

// ============================================
// STORAGE
// ============================================

const SITE_KEY = "cabbageseo_site";
const SITES_KEY = "cabbageseo_sites";
const ANALYSIS_KEY = "cabbageseo_analysis";

function saveSite(site: SiteData) {
  localStorage.setItem(SITE_KEY, JSON.stringify(site));
  const existing = localStorage.getItem(SITES_KEY);
  let sites: SiteData[] = existing ? JSON.parse(existing) : [];
  const idx = sites.findIndex(s => s.id === site.id);
  if (idx >= 0) sites[idx] = site; else sites = [site, ...sites];
  localStorage.setItem(SITES_KEY, JSON.stringify(sites));
}

function loadSite(): SiteData | null {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem(SITE_KEY) || "null"); } catch { return null; }
}

function saveAnalysis(analysis: AnalysisResult) {
  localStorage.setItem(ANALYSIS_KEY, JSON.stringify(analysis));
}

function loadAnalysis(): AnalysisResult | null {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem(ANALYSIS_KEY) || "null"); } catch { return null; }
}

// ============================================
// SCORE RING - SAME AS FREE ANALYZER
// ============================================

function ScoreRing({ 
  score, 
  size = 140,
  label,
  sublabel,
}: { 
  score: number | null; 
  size?: number;
  label?: string;
  sublabel?: string;
}) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const displayScore = score ?? 0;
  const offset = circumference - (displayScore / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 80) return "text-emerald-500";
    if (s >= 60) return "text-yellow-500";
    if (s >= 40) return "text-orange-500";
    return "text-red-500";
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="currentColor" strokeWidth="8"
            className="text-zinc-800"
          />
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset}
            className={cn("transition-all duration-1000", getColor(displayScore))}
            stroke="currentColor"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("text-3xl font-bold", getColor(displayScore))}>
            {score !== null ? displayScore : "—"}
          </span>
        </div>
      </div>
      {label && <p className="mt-2 font-medium text-white">{label}</p>}
      {sublabel && <p className="text-xs text-zinc-400">{sublabel}</p>}
    </div>
  );
}

// ============================================
// SCORE ITEM ROW - SAME AS FREE ANALYZER
// ============================================

function ScoreItemRow({ item }: { item: ScoreItem }) {
  const statusIcon = {
    pass: <CheckCircle2 className="w-4 h-4 text-green-500" />,
    warning: <AlertTriangle className="w-4 h-4 text-yellow-500" />,
    fail: <XCircle className="w-4 h-4 text-red-500" />,
  };

  return (
    <div className="py-2 border-b border-zinc-700/50 last:border-0">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          {statusIcon[item.status]}
          <span className="text-sm font-medium text-white">{item.name}</span>
        </div>
        <span className={cn("text-sm font-bold", 
          item.status === "pass" ? "text-green-500" : 
          item.status === "warning" ? "text-yellow-500" : "text-red-500"
        )}>
          {item.score}/{item.maxScore}
        </span>
      </div>
      <p className="text-xs text-zinc-400 ml-6">{item.reason}</p>
      {item.howToFix && item.status !== "pass" && (
        <div className="ml-6 mt-1 flex items-start gap-1">
          <Lightbulb className="w-3 h-3 text-yellow-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-yellow-400">{item.howToFix}</p>
        </div>
      )}
    </div>
  );
}

// ============================================
// CATEGORY BREAKDOWN - SAME AS FREE ANALYZER
// ============================================

function CategoryBreakdown({ 
  title, 
  score, 
  maxScore, 
  items,
  icon,
  defaultOpen = false,
}: { 
  title: string; 
  score: number; 
  maxScore: number;
  items: ScoreItem[];
  icon: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
  const statusColor = percentage >= 80 ? "text-green-500" : percentage >= 50 ? "text-yellow-500" : "text-red-500";

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border border-zinc-700 rounded-lg bg-zinc-800/30">
      <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-zinc-800/50 transition-colors rounded-lg">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-8 h-8 rounded-lg bg-zinc-700/50 flex items-center justify-center text-zinc-400">
            {icon}
          </div>
          <div className="flex-1 text-left">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-white">{title}</span>
              <span className={cn("font-bold", statusColor)}>{score}/{maxScore}</span>
            </div>
            <Progress value={percentage} className="h-1.5" />
          </div>
        </div>
        <div className="ml-3 text-zinc-400">
          {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 pb-4">
        <div className="pt-2 border-t border-zinc-700">
          {items.map((item, idx) => (
            <ScoreItemRow key={idx} item={item} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ============================================
// FACTOR CHECK - SAME AS FREE ANALYZER
// ============================================

function FactorCheck({ 
  label, 
  checked, 
  impact = "medium",
  tooltip,
}: { 
  label: string; 
  checked: boolean; 
  impact?: "high" | "medium" | "low";
  tooltip?: string;
}) {
  const content = (
    <div className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-zinc-800/50 transition-colors">
      {checked ? (
        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
      ) : (
        <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
      )}
      <span className={cn("text-sm", checked ? "text-white" : "text-zinc-400")}>
        {label}
      </span>
      {impact === "high" && !checked && (
        <Badge variant="destructive" className="text-[10px] px-1.5 py-0 ml-auto">Fix This</Badge>
      )}
    </div>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent><p className="max-w-xs text-xs">{tooltip}</p></TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}

// ============================================
// PLATFORM SCORE BAR
// ============================================

function PlatformScoreBar({ 
  name, 
  score, 
  icon,
  color 
}: { 
  name: string; 
  score: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", color)}>
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-white">{name}</span>
          <span className="text-sm font-bold text-white">{score}%</span>
        </div>
        <Progress value={score} className="h-1.5" />
      </div>
    </div>
  );
}

// ============================================
// USAGE METER
// ============================================

function UsageMeter({ label, used, limit, icon }: { label: string; used: number; limit: number; icon: React.ReactNode }) {
  const pct = limit > 0 ? (used / limit) * 100 : 0;
  return (
    <div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-zinc-400">
          {icon}
          <span className="text-sm">{label}</span>
        </div>
        <span className={cn("text-sm font-medium", pct > 80 ? "text-orange-400" : "text-white")}>
          {used}/{limit}
        </span>
      </div>
      <Progress value={pct} className="h-1.5" />
    </div>
  );
}

// ============================================
// CONTENT IDEA CARD
// ============================================

function ContentIdeaCard({ 
  idea, 
  index,
  onGenerate 
}: { 
  idea: { title: string; keyword: string; priority: string };
  index: number;
  onGenerate: () => void;
}) {
  const colors = {
    high: "border-emerald-500/50 bg-emerald-500/5",
    medium: "border-yellow-500/50 bg-yellow-500/5",
    low: "border-blue-500/50 bg-blue-500/5",
  };

  return (
    <div className={cn("p-3 rounded-lg border transition-all hover:scale-[1.01]", colors[idea.priority as keyof typeof colors] || colors.medium)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-[10px]">{idea.priority}</Badge>
          </div>
          <h4 className="font-medium text-white text-sm">{idea.title}</h4>
          <p className="text-xs text-zinc-400 mt-1">
            <Target className="w-3 h-3 inline mr-1" />{idea.keyword}
          </p>
        </div>
        <Button size="sm" variant="ghost" onClick={onGenerate} className="shrink-0">
          <Sparkles className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ============================================
// CITATION COUNTER
// ============================================

function CitationCounter({ citations }: { citations: CitationData }) {
  return (
    <Card className="bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            AI Citations
          </CardTitle>
          <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400 text-[10px]">Live</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center py-2">
          <p className="text-4xl font-bold text-emerald-400">{citations.total}</p>
          <p className="text-xs text-zinc-400">Times cited by AI</p>
        </div>
        <div className="grid grid-cols-3 gap-1 mt-3">
          {[
            { name: "ChatGPT", count: citations.byPlatform.chatgpt },
            { name: "Perplexity", count: citations.byPlatform.perplexity },
            { name: "Google AI", count: citations.byPlatform.googleAI },
          ].map((p) => (
            <div key={p.name} className="text-center p-2 rounded bg-zinc-800/50">
              <p className="text-lg font-bold text-white">{p.count}</p>
              <p className="text-[10px] text-zinc-400">{p.name}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// SCHEDULE CARD
// ============================================

function ScheduleCard({ 
  articlesPerWeek,
  remaining,
  nextPublish,
  autopilotEnabled,
  onToggle 
}: { 
  articlesPerWeek: number;
  remaining: number;
  nextPublish: string;
  autopilotEnabled: boolean;
  onToggle: (enabled: boolean) => void;
}) {
  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-400" />
            Autopilot
          </CardTitle>
          <Switch 
            checked={autopilotEnabled} 
            onCheckedChange={onToggle}
            className="data-[state=checked]:bg-emerald-500"
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 rounded bg-zinc-800/50 text-center">
            <p className="text-xl font-bold text-white">{articlesPerWeek}</p>
            <p className="text-[10px] text-zinc-400">Articles/Week</p>
          </div>
          <div className="p-2 rounded bg-zinc-800/50 text-center">
            <p className="text-xl font-bold text-emerald-400">{remaining}</p>
            <p className="text-[10px] text-zinc-400">Remaining</p>
          </div>
        </div>
        {autopilotEnabled && (
          <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-center">
            <p className="text-xs text-emerald-400">
              <Clock className="w-3 h-3 inline mr-1" />
              Next: {nextPublish}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// ONBOARDING STEP
// ============================================

function OnboardingStep({ step, currentStep, title, isComplete }: {
  step: number; currentStep: number; title: string; isComplete: boolean;
}) {
  const isActive = step === currentStep;
  return (
    <div className={cn(
      "flex items-center gap-2 p-2 rounded-lg",
      isActive && "bg-emerald-500/10 border border-emerald-500/30",
      isComplete && "opacity-60"
    )}>
      <div className={cn(
        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
        isComplete ? "bg-emerald-500 text-white" : isActive ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500" : "bg-zinc-800 text-zinc-400"
      )}>
        {isComplete ? <CheckCircle className="w-3 h-3" /> : step}
      </div>
      <span className={cn("text-sm", isActive ? "text-white font-medium" : "text-zinc-400")}>{title}</span>
    </div>
  );
}

// ============================================
// MAIN DASHBOARD
// ============================================

export default function DashboardPage() {
  const [phase, setPhase] = useState<"loading" | "onboarding" | "analyzing" | "dashboard">("loading");
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [url, setUrl] = useState("");
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStatus, setAnalysisStatus] = useState("");
  
  const [site, setSite] = useState<SiteData | null>(null);
  const [plan, setPlan] = useState("starter");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [usage, setUsage] = useState<UsageData>({ articles: { used: 0, limit: 50 }, keywords: { used: 0, limit: 500 } });
  const [citations, setCitations] = useState<CitationData>({ total: 0, byPlatform: { chatgpt: 0, perplexity: 0, googleAI: 0 }, recent: [] });
  const [autopilotEnabled, setAutopilotEnabled] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  // Editable state
  const [editableKeywords, setEditableKeywords] = useState<string[]>([]);
  const [editableContentIdeas, setEditableContentIdeas] = useState<AnalysisResult["contentIdeas"]>([]);
  const [showAddKeyword, setShowAddKeyword] = useState(false);
  const [newKeyword, setNewKeyword] = useState("");
  const [editingIdeaIndex, setEditingIdeaIndex] = useState<number | null>(null);
  const [editingIdeaTitle, setEditingIdeaTitle] = useState("");
  const [articlesPerWeek, setArticlesPerWeek] = useState(2);

  // Load on mount
  useEffect(() => {
    async function init() {
      const cachedSite = loadSite();
      const cachedAnalysis = loadAnalysis();
      
      try {
        const res = await fetch("/api/me", { credentials: "include" });
        const data = await res.json();

        if (!data.authenticated) {
          window.location.href = "/login";
          return;
        }

        setPlan(data.organization?.plan || "starter");

        if (data.currentSite || (data.sites && data.sites.length > 0)) {
          const s = data.currentSite || data.sites[0];
          setSite(s);
          saveSite(s);
          setAutopilotEnabled(s.autopilotEnabled);
          
          if (cachedAnalysis && cachedAnalysis.url.includes(s.domain)) {
            setAnalysis(cachedAnalysis);
          } else {
            await runFullAnalysis(s.domain);
          }
          
          await loadDashboardData(s.id);
          setPhase("dashboard");
          return;
        }

        if (cachedSite) {
          setSite(cachedSite);
          if (cachedAnalysis) setAnalysis(cachedAnalysis);
          setPhase("dashboard");
          return;
        }

        setPhase("onboarding");
      } catch (e) {
        console.error("Init error:", e);
        if (cachedSite) {
          setSite(cachedSite);
          if (cachedAnalysis) setAnalysis(cachedAnalysis);
          setPhase("dashboard");
        } else {
          setPhase("onboarding");
        }
      }
    }
    init();
  }, []);

  // Run full analysis - SAME API as free analyzer
  const runFullAnalysis = async (domain: string) => {
    try {
      const res = await fetch("/api/public/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: `https://${domain}` }),
      });
      
      if (res.ok) {
        const response = await res.json();
        // API returns { success: true, data: {...} } - extract the data
        const analysisData = response.data || response;
        
        // Extract keywords from analysis
        const extractedKeywords = extractKeywords(analysisData);
        const contentIdeas = generateContentIdeas(extractedKeywords, domain);
        
        const fullAnalysis: AnalysisResult = {
          ...analysisData,
          keywords: extractedKeywords,
          contentIdeas,
        };
        
        setAnalysis(fullAnalysis);
        saveAnalysis(fullAnalysis);
      }
    } catch (e) {
      console.error("Analysis error:", e);
    }
  };

  // Extract keywords from analysis
  const extractKeywords = (data: Partial<AnalysisResult>): string[] => {
    const keywords: string[] = [];
    
    // Extract from title
    if (data.title) {
      const titleWords = data.title.toLowerCase().split(/\s+/).filter(w => w.length > 4);
      keywords.push(...titleWords.slice(0, 3));
    }
    
    // Extract from recommendations
    const recs = [...(data.seo?.recommendations || []), ...(data.aio?.recommendations || [])];
    recs.forEach(rec => {
      const match = rec.match(/"([^"]+)"/);
      if (match) keywords.push(match[1].toLowerCase());
    });
    
    // Add GEO-focused keywords
    keywords.push("ai optimization", "chatgpt seo", "perplexity ranking", "ai citations", "generative engine optimization");
    
    return [...new Set(keywords)].slice(0, 10);
  };

  // Generate content ideas from keywords
  const generateContentIdeas = (keywords: string[], domain: string): AnalysisResult["contentIdeas"] => {
    const templates = [
      { template: "How to Optimize {keyword} for AI Search", priority: "high" as const },
      { template: "Complete Guide to {keyword}", priority: "high" as const },
      { template: "{keyword}: Best Practices for 2025", priority: "medium" as const },
      { template: "Why {keyword} Matters for AI Visibility", priority: "medium" as const },
      { template: "Common Mistakes with {keyword}", priority: "low" as const },
    ];
    
    const ideas: AnalysisResult["contentIdeas"] = [];
    
    keywords.slice(0, 5).forEach((keyword, i) => {
      const template = templates[i % templates.length];
      ideas.push({
        title: template.template.replace("{keyword}", keyword.charAt(0).toUpperCase() + keyword.slice(1)),
        keyword,
        priority: template.priority,
      });
    });
    
    return ideas;
  };

  // Load dashboard data
  const loadDashboardData = async (siteId: string) => {
    try {
      const usageRes = await fetch("/api/billing/usage");
      if (usageRes.ok) {
        const data = await usageRes.json();
        setUsage({
          articles: { used: data.usage?.articles || 0, limit: data.limits?.articles || 50 },
          keywords: { used: data.usage?.keywords || 0, limit: data.limits?.keywords || 500 }
        });
      }

      const citRes = await fetch(`/api/aio/citations?siteId=${siteId}`);
      if (citRes.ok) {
        const data = await citRes.json();
        const pc = data.data?.platformCounts || {};
        setCitations({
          total: Object.values(pc).reduce((a: number, b) => a + (b as number), 0),
          byPlatform: { chatgpt: pc.chatgpt || 0, perplexity: pc.perplexity || 0, googleAI: pc.google_ai || 0 },
          recent: data.data?.citations?.slice(0, 3).map((c: { platform: string; query_text: string; discovered_at: string }) => ({
            platform: c.platform, query: c.query_text, foundAt: c.discovered_at,
          })) || []
        });
      }
    } catch (e) {
      console.error("Error loading data:", e);
    }
  };

  // Handle analyze
  const handleAnalyze = async () => {
    if (!url.trim()) { setError("Please enter your website URL"); return; }

    setError("");
    setPhase("analyzing");

    const steps = [
      { p: 10, s: "Connecting to your website..." },
      { p: 25, s: "Crawling pages..." },
      { p: 40, s: "Analyzing content structure..." },
      { p: 55, s: "Checking AI visibility factors..." },
      { p: 70, s: "Extracting keywords..." },
      { p: 85, s: "Generating content ideas..." },
      { p: 95, s: "Creating your schedule..." },
    ];

    for (const step of steps) {
      setAnalysisProgress(step.p);
      setAnalysisStatus(step.s);
      await new Promise(r => setTimeout(r, 600));
    }

    try {
      // Create site
      const siteRes = await fetch("/api/me/site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!siteRes.ok) throw new Error("Failed to add site");
      const siteData = await siteRes.json();
      const newSite = siteData.site;
      
      setSite(newSite);
      saveSite(newSite);

      // Run FULL analysis - same as free analyzer
      let normalizedUrl = url.trim();
      if (!normalizedUrl.startsWith("http")) normalizedUrl = "https://" + normalizedUrl;

      const analysisRes = await fetch("/api/public/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: normalizedUrl }),
      });

      if (analysisRes.ok) {
        const response = await analysisRes.json();
        // API returns { success: true, data: {...} } - extract the data
        const analysisData = response.data || response;
        const extractedKeywords = extractKeywords(analysisData);
        const contentIdeas = generateContentIdeas(extractedKeywords, newSite.domain);
        
        const fullAnalysis: AnalysisResult = {
          ...analysisData,
          keywords: extractedKeywords,
          contentIdeas,
        };
        
        setAnalysis(fullAnalysis);
        saveAnalysis(fullAnalysis);
      }

      setAnalysisProgress(100);
      setAnalysisStatus("Complete!");
      
      await new Promise(r => setTimeout(r, 500));
      setPhase("dashboard");
      
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to analyze site");
      setPhase("onboarding");
    }
  };

  const handleToggleAutopilot = async (enabled: boolean) => {
    setAutopilotEnabled(enabled);
    if (site) {
      await fetch("/api/me/site", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId: site.id, autopilotEnabled: enabled }),
      }).catch(console.error);
    }
  };

  // Sync editable state with analysis
  useEffect(() => {
    if (analysis) {
      setEditableKeywords(analysis.keywords || []);
      setEditableContentIdeas(analysis.contentIdeas || []);
    }
  }, [analysis]);

  // Set articles per week based on plan
  useEffect(() => {
    if (plan === "pro_plus") setArticlesPerWeek(5);
    else if (plan === "pro") setArticlesPerWeek(3);
    else setArticlesPerWeek(2);
  }, [plan]);

  // ============================================
  // EDIT HANDLERS
  // ============================================

  const handleAddKeyword = () => {
    if (newKeyword.trim() && !editableKeywords.includes(newKeyword.trim().toLowerCase())) {
      setEditableKeywords([...editableKeywords, newKeyword.trim().toLowerCase()]);
      setNewKeyword("");
      setShowAddKeyword(false);
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setEditableKeywords(editableKeywords.filter(k => k !== keyword));
  };

  const handleRegenerateIdeas = () => {
    if (editableKeywords.length > 0 && site) {
      const newIdeas = generateContentIdeas(editableKeywords, site.domain);
      setEditableContentIdeas(newIdeas);
    }
  };

  const handleMoveIdea = (index: number, direction: number) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= editableContentIdeas.length) return;
    const newIdeas = [...editableContentIdeas];
    [newIdeas[index], newIdeas[newIndex]] = [newIdeas[newIndex], newIdeas[index]];
    setEditableContentIdeas(newIdeas);
  };

  const handleSaveIdeaTitle = (index: number) => {
    if (editingIdeaTitle.trim()) {
      const newIdeas = [...editableContentIdeas];
      newIdeas[index] = { ...newIdeas[index], title: editingIdeaTitle.trim() };
      setEditableContentIdeas(newIdeas);
    }
    setEditingIdeaIndex(null);
    setEditingIdeaTitle("");
  };

  const handleRemoveIdea = (index: number) => {
    setEditableContentIdeas(editableContentIdeas.filter((_, i) => i !== index));
  };

  const handleGenerateNext = () => {
    if (editableContentIdeas.length > 0) {
      const nextIdea = editableContentIdeas[0];
      window.location.href = `/content/new?topic=${encodeURIComponent(nextIdea.title)}&keyword=${encodeURIComponent(nextIdea.keyword)}`;
    }
  };

  // ============================================
  // RENDER: LOADING
  // ============================================

  if (phase === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mb-4" />
        <p className="text-zinc-400">Loading your dashboard...</p>
      </div>
    );
  }

  // ============================================
  // RENDER: ONBOARDING
  // ============================================

  if (phase === "onboarding") {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
            <Rocket className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-emerald-400">Get cited by AI</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to CabbageSEO</h1>
          <p className="text-zinc-400">Enter your website and we'll handle everything</p>
        </div>

        <Card className="bg-zinc-900 border-zinc-700">
          <CardContent className="pt-8 pb-8">
            <div className="max-w-md mx-auto text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
                <Globe className="w-8 h-8 text-emerald-400" />
              </div>
              
              <h2 className="text-xl font-bold text-white mb-2">What's your website?</h2>
              <p className="text-sm text-zinc-400 mb-6">We'll analyze everything and create your personalized plan</p>

              <div className="flex gap-2">
                <Input
                  type="url"
                  placeholder="https://yourcompany.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                  className="flex-1 bg-zinc-800 border-zinc-700 text-white h-11"
                />
                <Button onClick={handleAnalyze} className="bg-emerald-600 hover:bg-emerald-500 px-6 h-11">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Analyze
                </Button>
              </div>

              {error && (
                <p className="text-red-400 text-sm mt-3 flex items-center justify-center gap-2">
                  <AlertCircle className="w-4 h-4" />{error}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ============================================
  // RENDER: ANALYZING
  // ============================================

  if (phase === "analyzing") {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <Card className="bg-zinc-900 border-zinc-700">
          <CardContent className="pt-8 pb-8">
            <div className="max-w-md mx-auto text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center mb-6 relative">
                <Brain className="w-8 h-8 text-emerald-400 animate-pulse" />
                <div className="absolute inset-0 rounded-full border-2 border-emerald-500/30 animate-ping" />
              </div>
              
              <h2 className="text-xl font-bold text-white mb-2">Analyzing your website...</h2>
              <p className="text-sm text-zinc-400 mb-6">{analysisStatus}</p>

              <Progress value={analysisProgress} className="h-2 mb-2" />
              <p className="text-xs text-zinc-500">{analysisProgress}% complete</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ============================================
  // RENDER: DASHBOARD - SAME DETAIL AS FREE ANALYZER
  // ============================================

  const seoDetails = analysis?.seo?.details;
  const aioDetails = analysis?.aio?.details;
  const factors = analysis?.aio?.factors;
  const platformScores = analysis?.aio?.platformScores;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Globe className="w-5 h-5 text-zinc-400" />
          <h1 className="text-xl font-bold text-white">{site?.domain}</h1>
          <Badge className="bg-emerald-500/20 text-emerald-400 capitalize text-xs">{plan}</Badge>
          {autopilotEnabled && (
            <Badge variant="outline" className="border-emerald-500/50 text-emerald-400 text-xs">
              <Zap className="w-3 h-3 mr-1" />Autopilot
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => site && runFullAnalysis(site.domain)}>
            <RefreshCw className="w-4 h-4 mr-1" />Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-zinc-800 border-zinc-700">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="seo">SEO Details</TabsTrigger>
          <TabsTrigger value="aio">AI Visibility</TabsTrigger>
          <TabsTrigger value="content">Content & Keywords</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Score Cards */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="pt-6 flex flex-col items-center">
                <ScoreRing score={analysis?.aioScore || site?.geoScore || null} size={120} />
                <p className="mt-2 font-medium text-white">AI Visibility</p>
                <p className="text-xs text-zinc-400">Optimized for ChatGPT, Perplexity</p>
              </CardContent>
            </Card>
            
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="pt-6 flex flex-col items-center">
                <ScoreRing score={analysis?.seoScore || null} size={120} />
                <p className="mt-2 font-medium text-white">SEO Score</p>
                <p className="text-xs text-zinc-400">Technical & content health</p>
              </CardContent>
            </Card>

            <CitationCounter citations={citations} />
          </div>

          {/* Platform Scores */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Platform Visibility</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <PlatformScoreBar name="Google AI Overviews" score={platformScores?.googleAIO || 45} icon={<Brain className="w-4 h-4" />} color="bg-blue-500/20 text-blue-400" />
              <PlatformScoreBar name="ChatGPT" score={platformScores?.chatGPT || 35} icon={<MessageSquare className="w-4 h-4" />} color="bg-green-500/20 text-green-400" />
              <PlatformScoreBar name="Perplexity" score={platformScores?.perplexity || 20} icon={<Search className="w-4 h-4" />} color="bg-purple-500/20 text-purple-400" />
              <PlatformScoreBar name="Bing Copilot" score={platformScores?.bingCopilot || 30} icon={<Bot className="w-4 h-4" />} color="bg-cyan-500/20 text-cyan-400" />
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-4">
            <Link href="/content/new">
              <Card className="bg-zinc-900 border-zinc-800 hover:border-emerald-500/50 transition-all cursor-pointer h-full">
                <CardContent className="pt-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Generate Article</p>
                    <p className="text-xs text-zinc-400">AI-optimized content</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/keywords">
              <Card className="bg-zinc-900 border-zinc-800 hover:border-purple-500/50 transition-all cursor-pointer h-full">
                <CardContent className="pt-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <Target className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Keywords</p>
                    <p className="text-xs text-zinc-400">{analysis?.keywords?.length || 0} extracted</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/geo">
              <Card className="bg-zinc-900 border-zinc-800 hover:border-blue-500/50 transition-all cursor-pointer h-full">
                <CardContent className="pt-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Full GEO Report</p>
                    <p className="text-xs text-zinc-400">Detailed analysis</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Sidebar Cards */}
          <div className="grid md:grid-cols-2 gap-4">
            <ScheduleCard
              articlesPerWeek={plan === "pro_plus" ? 10 : plan === "pro" ? 5 : 2}
              remaining={usage.articles.limit - usage.articles.used}
              nextPublish="Tomorrow 9:00 AM"
              autopilotEnabled={autopilotEnabled}
              onToggle={handleToggleAutopilot}
            />
            
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Plan Usage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <UsageMeter label="Articles" used={usage.articles.used} limit={usage.articles.limit} icon={<FileText className="w-4 h-4" />} />
                <UsageMeter label="Keywords" used={usage.keywords.used} limit={usage.keywords.limit} icon={<Target className="w-4 h-4" />} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* SEO DETAILS TAB - SAME AS FREE ANALYZER */}
        <TabsContent value="seo" className="space-y-4 mt-6">
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="pt-6 flex flex-col items-center">
                <ScoreRing score={analysis?.seoScore || null} size={140} />
                <p className="mt-2 font-medium text-white">Overall SEO Score</p>
              </CardContent>
            </Card>
            
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Issue Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded bg-red-500/10">
                  <span className="text-sm text-red-400">Critical Issues</span>
                  <Badge variant="destructive">{analysis?.seo?.issueCount?.critical || 0}</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-yellow-500/10">
                  <span className="text-sm text-yellow-400">Warnings</span>
                  <Badge className="bg-yellow-500/20 text-yellow-400">{analysis?.seo?.issueCount?.warning || 0}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-3">
            {seoDetails?.technical && (
              <CategoryBreakdown title="Technical SEO" score={analysis?.seo?.breakdown?.technicalScore || 0} maxScore={30} items={seoDetails.technical} icon={<Code className="w-4 h-4" />} defaultOpen={true} />
            )}
            {seoDetails?.content && (
              <CategoryBreakdown title="Content Quality" score={analysis?.seo?.breakdown?.contentScore || 0} maxScore={25} items={seoDetails.content} icon={<FileText className="w-4 h-4" />} />
            )}
            {seoDetails?.meta && (
              <CategoryBreakdown title="Meta Tags" score={analysis?.seo?.breakdown?.metaScore || 0} maxScore={20} items={seoDetails.meta} icon={<Eye className="w-4 h-4" />} />
            )}
            {seoDetails?.performance && (
              <CategoryBreakdown title="Performance" score={analysis?.seo?.breakdown?.performanceScore || 0} maxScore={15} items={seoDetails.performance} icon={<Zap className="w-4 h-4" />} />
            )}
            {seoDetails?.accessibility && (
              <CategoryBreakdown title="Accessibility" score={analysis?.seo?.breakdown?.accessibilityScore || 0} maxScore={10} items={seoDetails.accessibility} icon={<Eye className="w-4 h-4" />} />
            )}
          </div>
        </TabsContent>

        {/* AI VISIBILITY TAB - SAME AS FREE ANALYZER */}
        <TabsContent value="aio" className="space-y-4 mt-6">
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="pt-6 flex flex-col items-center">
                <ScoreRing score={analysis?.aioScore || null} size={140} />
                <p className="mt-2 font-medium text-white">AI Visibility Score</p>
              </CardContent>
            </Card>
            
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">AI Visibility Factors</CardTitle>
              </CardHeader>
              <CardContent className="space-y-0">
                <FactorCheck label="Direct Answer Format" checked={factors?.hasDirectAnswers || false} impact="high" tooltip="Content starts with clear, direct definitions" />
                <FactorCheck label="FAQ Section" checked={factors?.hasFAQSection || false} impact="high" tooltip="Has Q&A format that AI can extract" />
                <FactorCheck label="Schema Markup" checked={factors?.hasSchema || false} impact="high" tooltip="Structured data for AI understanding" />
                <FactorCheck label="Author Attribution" checked={factors?.hasAuthorInfo || false} impact="medium" tooltip="Shows expertise and credibility" />
                <FactorCheck label="Citations/Sources" checked={factors?.hasCitations || false} impact="medium" tooltip="References authoritative sources" />
                <FactorCheck label="Key Takeaways" checked={factors?.hasKeyTakeaways || false} impact="medium" tooltip="Summary bullets for quick extraction" />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-3">
            {aioDetails?.structure && (
              <CategoryBreakdown title="Content Structure" score={analysis?.aio?.breakdown?.structureScore || 0} maxScore={25} items={aioDetails.structure} icon={<BookOpen className="w-4 h-4" />} defaultOpen={true} />
            )}
            {aioDetails?.authority && (
              <CategoryBreakdown title="Authority Signals" score={analysis?.aio?.breakdown?.authorityScore || 0} maxScore={25} items={aioDetails.authority} icon={<Shield className="w-4 h-4" />} />
            )}
            {aioDetails?.schema && (
              <CategoryBreakdown title="Schema & Structured Data" score={analysis?.aio?.breakdown?.schemaScore || 0} maxScore={20} items={aioDetails.schema} icon={<Code className="w-4 h-4" />} />
            )}
            {aioDetails?.quotability && (
              <CategoryBreakdown title="Quotability" score={analysis?.aio?.breakdown?.quotabilityScore || 0} maxScore={15} items={aioDetails.quotability} icon={<Quote className="w-4 h-4" />} />
            )}
            {aioDetails?.contentQuality && (
              <CategoryBreakdown title="Content Quality" score={analysis?.aio?.breakdown?.contentQualityScore || 0} maxScore={15} items={aioDetails.contentQuality} icon={<FileText className="w-4 h-4" />} />
            )}
          </div>

          {/* Recommendations */}
          {analysis?.aio?.recommendations && analysis.aio.recommendations.length > 0 && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-yellow-400" />
                  AI Visibility Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.aio.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <ArrowRight className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span className="text-zinc-300">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* CONTENT & KEYWORDS TAB - FULLY EDITABLE */}
        <TabsContent value="content" className="space-y-4 mt-6">
          {/* Editable Keywords */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="w-4 h-4 text-purple-400" />
                  Your Keywords
                  <Badge variant="outline" className="text-[10px]">Editable</Badge>
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowAddKeyword(true)}>
                    <Plus className="w-3 h-3 mr-1" />Add
                  </Button>
                  <Link href="/keywords">
                    <Button variant="ghost" size="sm">Full Editor <ChevronRight className="w-4 h-4 ml-1" /></Button>
                  </Link>
                </div>
              </div>
              <CardDescription>Click to remove, or add your own keywords to track</CardDescription>
            </CardHeader>
            <CardContent>
              {showAddKeyword && (
                <div className="flex gap-2 mb-3">
                  <Input
                    placeholder="Enter a keyword..."
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddKeyword()}
                    className="flex-1 bg-zinc-800 border-zinc-700 text-white h-9"
                  />
                  <Button size="sm" onClick={handleAddKeyword} className="bg-purple-600 hover:bg-purple-500">Add</Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowAddKeyword(false)}>Cancel</Button>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {editableKeywords.map((kw, i) => (
                  <Badge 
                    key={i} 
                    variant="secondary" 
                    className="bg-purple-500/10 text-purple-300 border border-purple-500/20 cursor-pointer hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-300 transition-colors group"
                    onClick={() => handleRemoveKeyword(kw)}
                  >
                    {kw}
                    <XCircle className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Badge>
                ))}
                {editableKeywords.length === 0 && (
                  <p className="text-sm text-zinc-400">No keywords yet. Click "Add" to add your first keyword.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Editable Content Ideas */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-yellow-400" />
                  Content Queue
                  <Badge variant="outline" className="text-[10px]">Editable</Badge>
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleRegenerateIdeas}>
                    <RefreshCw className="w-3 h-3 mr-1" />Regenerate
                  </Button>
                  <Link href="/content">
                    <Button variant="ghost" size="sm">Manage All <ChevronRight className="w-4 h-4 ml-1" /></Button>
                  </Link>
                </div>
              </div>
              <CardDescription>These will be auto-generated. Drag to reorder, click to edit.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {editableContentIdeas.map((idea, i) => (
                  <div 
                    key={i}
                    className={cn(
                      "p-3 rounded-lg border transition-all",
                      idea.priority === "high" ? "border-emerald-500/50 bg-emerald-500/5" :
                      idea.priority === "medium" ? "border-yellow-500/50 bg-yellow-500/5" :
                      "border-blue-500/50 bg-blue-500/5"
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex flex-col items-center text-zinc-500">
                          <ChevronUp className="w-4 h-4 cursor-pointer hover:text-white" onClick={() => handleMoveIdea(i, -1)} />
                          <span className="text-xs">{i + 1}</span>
                          <ChevronDown className="w-4 h-4 cursor-pointer hover:text-white" onClick={() => handleMoveIdea(i, 1)} />
                        </div>
                        <div className="flex-1">
                          {editingIdeaIndex === i ? (
                            <Input
                              value={editingIdeaTitle}
                              onChange={(e) => setEditingIdeaTitle(e.target.value)}
                              onBlur={() => handleSaveIdeaTitle(i)}
                              onKeyDown={(e) => e.key === "Enter" && handleSaveIdeaTitle(i)}
                              className="bg-zinc-800 border-zinc-600 text-white h-8"
                              autoFocus
                            />
                          ) : (
                            <p 
                              className="font-medium text-white text-sm cursor-pointer hover:text-emerald-400 transition-colors"
                              onClick={() => { setEditingIdeaIndex(i); setEditingIdeaTitle(idea.title); }}
                            >
                              {idea.title}
                              <Edit3 className="w-3 h-3 inline ml-2 opacity-50" />
                            </p>
                          )}
                          <p className="text-xs text-zinc-400 mt-0.5">
                            <Target className="w-3 h-3 inline mr-1" />{idea.keyword}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">{idea.priority}</Badge>
                        <Link href={`/content/new?topic=${encodeURIComponent(idea.title)}&keyword=${encodeURIComponent(idea.keyword)}`}>
                          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500">
                            <Sparkles className="w-3 h-3 mr-1" />Generate
                          </Button>
                        </Link>
                        <Button size="sm" variant="ghost" onClick={() => handleRemoveIdea(i)}>
                          <XCircle className="w-4 h-4 text-zinc-400 hover:text-red-400" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {editableContentIdeas.length === 0 && (
                  <div className="text-center py-8">
                    <Lightbulb className="w-8 h-8 mx-auto text-zinc-600 mb-2" />
                    <p className="text-sm text-zinc-400">No content ideas yet</p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={handleRegenerateIdeas}>
                      Generate Ideas
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Schedule Settings - Editable */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-400" />
                  Publishing Schedule
                  <Badge variant="outline" className="text-[10px]">Customizable</Badge>
                </CardTitle>
              </div>
              <CardDescription>Adjust how often we publish content for you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 5].map((n) => (
                  <Button 
                    key={n}
                    variant={articlesPerWeek === n ? "default" : "outline"}
                    className={articlesPerWeek === n ? "bg-purple-600 hover:bg-purple-500" : ""}
                    onClick={() => setArticlesPerWeek(n)}
                  >
                    {n} / week
                  </Button>
                ))}
              </div>
              <div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">At this rate, your {usage.articles.limit} articles will last:</span>
                  <span className="font-bold text-white">
                    {Math.ceil((usage.articles.limit - usage.articles.used) / articlesPerWeek)} weeks
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">Autopilot Mode</p>
                  <p className="text-xs text-zinc-400">We handle everything automatically</p>
                </div>
                <Switch 
                  checked={autopilotEnabled} 
                  onCheckedChange={handleToggleAutopilot}
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* Quick Generate */}
          <Card className="bg-gradient-to-r from-emerald-500/10 to-transparent border-emerald-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-white">Ready to create content?</h3>
                  <p className="text-sm text-zinc-400">Generate AI-optimized articles that get cited</p>
                </div>
                <div className="flex gap-2">
                  <Link href="/content/new">
                    <Button className="bg-emerald-600 hover:bg-emerald-500">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Article
                    </Button>
                  </Link>
                  {editableContentIdeas.length > 0 && (
                    <Button variant="outline" onClick={() => handleGenerateNext()}>
                      <Play className="w-4 h-4 mr-2" />
                      Generate Next in Queue
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
