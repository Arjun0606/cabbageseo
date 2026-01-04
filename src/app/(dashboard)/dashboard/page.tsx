"use client";

/**
 * ============================================
 * CABBAGESEO DASHBOARD - REBUILT FROM SCRATCH
 * ============================================
 * 
 * This is a COMPLETE rebuild using the FREE ANALYZER as the base.
 * SAME API, SAME components, SAME data.
 * PLUS: Autopilot controls, content generation.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Search,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Zap,
  Bot,
  Globe,
  FileText,
  BarChart3,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Settings,
  Play,
  Calendar,
  Target,
  Plus,
  Rocket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
    issueCount: { critical: number; warning: number };
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
    };
    platformScores: {
      googleAIO: number;
      perplexity: number;
      chatGPT: number;
      bingCopilot: number;
    };
    recommendations: string[];
  };
}

// ============================================
// COMPONENTS - SAME AS FREE ANALYZER
// ============================================

function ScoreRing({ score, size = 120, label, sublabel }: { 
  score: number; 
  size?: number; 
  label: string;
  sublabel?: string;
}) {
  const strokeWidth = size / 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;
  
  const getColor = (s: number) => {
    if (s >= 80) return "stroke-green-500";
    if (s >= 60) return "stroke-yellow-500";
    if (s >= 40) return "stroke-orange-500";
    return "stroke-red-500";
  };

  return (
    <div className="flex flex-col items-center">
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-zinc-800" />
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className={`transition-all duration-1000 ${getColor(score)}`} />
      </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl font-bold text-white">{score}</span>
        </div>
      </div>
      <p className="mt-2 font-medium text-white">{label}</p>
      {sublabel && <p className="text-xs text-zinc-400">{sublabel}</p>}
    </div>
  );
}

function ScoreItemRow({ item }: { item: ScoreItem }) {
  const statusIcon = {
    pass: <CheckCircle2 className="w-4 h-4 text-green-500" />,
    warning: <AlertTriangle className="w-4 h-4 text-yellow-500" />,
    fail: <XCircle className="w-4 h-4 text-red-500" />,
  };

  return (
    <div className="py-2 border-b border-zinc-800 last:border-0">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          {statusIcon[item.status]}
          <span className="text-sm font-medium text-white">{item.name}</span>
        </div>
        <span className={`text-sm font-bold ${item.status === "pass" ? "text-green-500" : item.status === "warning" ? "text-yellow-500" : "text-red-500"}`}>
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

function CategoryBreakdown({ title, score, maxScore, items, defaultOpen = false }: { 
  title: string; 
  score: number; 
  maxScore: number;
  items: ScoreItem[];
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const percentage = (score / maxScore) * 100;
  const statusColor = percentage >= 80 ? "text-green-500" : percentage >= 50 ? "text-yellow-500" : "text-red-500";

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border border-zinc-800 rounded-lg bg-zinc-900">
      <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-zinc-800/50 transition-colors">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium text-white">{title}</span>
            <span className={`font-bold ${statusColor}`}>{score}/{maxScore}</span>
          </div>
          <Progress value={percentage} className="h-2" />
        </div>
        <div className="ml-3 text-zinc-400">
          {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 pb-4">
        <div className="pt-2 border-t border-zinc-800">
          {items.map((item, idx) => (
            <ScoreItemRow key={idx} item={item} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function FactorCheck({ label, checked, impact = "medium" }: { 
  label: string; 
  checked: boolean; 
  impact?: "high" | "medium" | "low";
}) {
  return (
    <div className="flex items-center gap-2 py-1.5">
      {checked ? (
        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
      ) : (
        <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
      )}
      <span className={`text-sm ${checked ? "text-zinc-100" : "text-zinc-400"}`}>{label}</span>
      {impact === "high" && !checked && (
        <Badge variant="destructive" className="text-[10px] px-1 py-0">Fix This</Badge>
      )}
    </div>
  );
}

function PlatformBar({ name, score, icon }: { name: string; score: number; icon: React.ReactNode }) {
  const getColor = (s: number) => {
    if (s >= 70) return "bg-green-500";
    if (s >= 50) return "bg-yellow-500";
    if (s >= 30) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <div className="flex items-center gap-3">
      <div className="w-6 text-zinc-400">{icon}</div>
      <div className="flex-1">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-zinc-300">{name}</span>
          <span className="font-medium text-white">{score}%</span>
        </div>
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div className={`h-full ${getColor(score)} rounded-full transition-all duration-500`} style={{ width: `${score}%` }} />
        </div>
      </div>
    </div>
  );
}

// ============================================
// STORAGE - PERSIST SITE DATA
// ============================================

const SITE_KEY = "cabbageseo_site";
const ANALYSIS_KEY = "cabbageseo_analysis";

function saveSite(site: { id: string; domain: string }) {
  try {
    localStorage.setItem(SITE_KEY, JSON.stringify(site));
  } catch {}
}

function loadSite(): { id: string; domain: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const data = localStorage.getItem(SITE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

function saveAnalysis(analysis: AnalysisResult) {
  try {
    localStorage.setItem(ANALYSIS_KEY, JSON.stringify(analysis));
  } catch {}
}

function loadAnalysis(): AnalysisResult | null {
  if (typeof window === "undefined") return null;
  try {
    const data = localStorage.getItem(ANALYSIS_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

// ============================================
// MAIN DASHBOARD
// ============================================

export default function DashboardPage() {
  // State
  const [phase, setPhase] = useState<"loading" | "onboarding" | "analyzing" | "ready">("loading");
  const [url, setUrl] = useState("");
  const [domain, setDomain] = useState("");
  const [siteId, setSiteId] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [plan, setPlan] = useState("starter");
  const [autopilotEnabled, setAutopilotEnabled] = useState(true);
  const [articlesPerWeek, setArticlesPerWeek] = useState("2");
  const [analyzing, setAnalyzing] = useState(false);
  
  // Real data from APIs
  const [usage, setUsage] = useState({ articles: 0, articlesLimit: 50, keywords: 0, keywordsLimit: 500 });
  const [citations, setCitations] = useState({ total: 0, chatgpt: 0, perplexity: 0, google: 0 });
  const [keywords, setKeywords] = useState<string[]>([]);
  const [contentIdeas, setContentIdeas] = useState<Array<{ title: string; keyword: string }>>([]);

  // Load real usage and citations
  const loadDashboardData = async (id: string) => {
    try {
      // Get usage
      const usageRes = await fetch("/api/billing/usage");
      if (usageRes.ok) {
        const data = await usageRes.json();
        setUsage({
          articles: data.usage?.articles || 0,
          articlesLimit: data.limits?.articles || 50,
          keywords: data.usage?.keywords || 0,
          keywordsLimit: data.limits?.keywords || 500,
        });
      }

      // Get citations
      const citRes = await fetch(`/api/aio/citations?siteId=${id}`);
      if (citRes.ok) {
        const data = await citRes.json();
        const pc = data.data?.platformCounts || {};
        setCitations({
          total: data.data?.total || 0,
          chatgpt: pc.chatgpt || 0,
          perplexity: pc.perplexity || 0,
          google: pc.google_ai || 0,
        });
      }

      // Get keywords
      const kwRes = await fetch(`/api/keywords?siteId=${id}&limit=20`);
      if (kwRes.ok) {
        const data = await kwRes.json();
        setKeywords((data.data?.keywords || []).map((k: { keyword: string }) => k.keyword).slice(0, 10));
      }
    } catch (e) {
      console.error("Failed to load dashboard data:", e);
    }
  };

  // Extract keywords from analysis
  const extractKeywords = (data: AnalysisResult): string[] => {
    const kws: string[] = [];
    
    // From title
    if (data.title) {
      const words = data.title.toLowerCase().split(/\s+/).filter(w => w.length > 4 && !["with", "from", "your", "that", "this", "about"].includes(w));
      kws.push(...words.slice(0, 3));
    }
    
    // From recommendations (quoted keywords)
    [...(data.seo?.recommendations || []), ...(data.aio?.recommendations || [])].forEach(rec => {
      const match = rec.match(/"([^"]+)"/);
      if (match) kws.push(match[1].toLowerCase());
    });
    
    // Add GEO-focused keywords
    const domain = data.url.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0].split(".")[0];
    kws.push(`${domain} guide`, `what is ${domain}`, `${domain} tips`, "ai seo", "get cited by chatgpt");
    
    return [...new Set(kws)].slice(0, 10);
  };

  // Generate content ideas from keywords
  const generateContentIdeas = (kws: string[]): Array<{ title: string; keyword: string }> => {
    const templates = [
      (k: string) => ({ title: `Complete Guide to ${k.charAt(0).toUpperCase() + k.slice(1)}`, keyword: k }),
      (k: string) => ({ title: `How to Master ${k.charAt(0).toUpperCase() + k.slice(1)} in 2025`, keyword: k }),
      (k: string) => ({ title: `${k.charAt(0).toUpperCase() + k.slice(1)}: Everything You Need to Know`, keyword: k }),
      (k: string) => ({ title: `10 Best ${k.charAt(0).toUpperCase() + k.slice(1)} Tips for Beginners`, keyword: k }),
      (k: string) => ({ title: `Why ${k.charAt(0).toUpperCase() + k.slice(1)} Matters (Expert Guide)`, keyword: k }),
    ];
    
    return kws.slice(0, 5).map((k, i) => templates[i % templates.length](k));
  };

  // Load on mount
  useEffect(() => {
    async function init() {
      // First check localStorage for cached site and analysis
      const cachedSite = loadSite();
      const cachedAnalysis = loadAnalysis();
      
      // If we have cached data, show it immediately while we refresh
      if (cachedSite && cachedAnalysis) {
        setDomain(cachedSite.domain);
        setSiteId(cachedSite.id);
        setAnalysis(cachedAnalysis);
        setKeywords(extractKeywords(cachedAnalysis));
        setContentIdeas(generateContentIdeas(extractKeywords(cachedAnalysis)));
        setPhase("ready");
      }

      try {
        // Check auth
        const res = await fetch("/api/me", { credentials: "include" });
        const data = await res.json();

        if (!data.authenticated) {
          window.location.href = "/login";
          return;
        }

        setPlan(data.organization?.plan || "starter");

        // Check if we have a site from API
        if (data.currentSite || (data.sites && data.sites.length > 0)) {
          const site = data.currentSite || data.sites[0];
          setDomain(site.domain);
          setSiteId(site.id);
          setAutopilotEnabled(site.autopilotEnabled || false);
          
          // Save to localStorage for persistence
          saveSite({ id: site.id, domain: site.domain });
          
          // Load real dashboard data
          await loadDashboardData(site.id);
          
          // Run fresh analysis (in background if we already showed cached)
          await runAnalysis(site.domain);
          return;
        }

        // Check localStorage as fallback
        if (cachedSite) {
          await loadDashboardData(cachedSite.id);
          if (!cachedAnalysis) {
            await runAnalysis(cachedSite.domain);
          }
          return;
        }

        // No site anywhere - show onboarding
        setPhase("onboarding");
      } catch (e) {
        console.error("Init error:", e);
        // If we have cached data, stay on ready, otherwise onboarding
        if (!cachedSite) {
          setPhase("onboarding");
        }
      }
    }
    init();
  }, []);

  // Run analysis - SAME API AS FREE ANALYZER
  const runAnalysis = async (targetDomain: string) => {
    setAnalyzing(true);
    setPhase("analyzing");
    setError("");

    try {
      const targetUrl = targetDomain.startsWith("http") ? targetDomain : `https://${targetDomain}`;
      
      const res = await fetch("/api/public/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl }),
      });

      if (!res.ok) {
        throw new Error("Analysis failed");
      }

      const response = await res.json();
      const analysisData = response.data || response;

      setAnalysis(analysisData);
      saveAnalysis(analysisData); // Persist to localStorage
      
      const cleanDomain = targetDomain.replace(/^https?:\/\//, "").replace(/^www\./, "");
      setDomain(cleanDomain);
      
      // Extract keywords and generate content ideas
      const extractedKws = extractKeywords(analysisData);
      setKeywords(extractedKws);
      setContentIdeas(generateContentIdeas(extractedKws));
      
      setPhase("ready");
    } catch (e) {
      console.error("Analysis error:", e);
      setError(e instanceof Error ? e.message : "Analysis failed");
      setPhase("onboarding");
    } finally {
      setAnalyzing(false);
    }
  };

  // Handle initial site submit
  const handleSubmit = async () => {
    if (!url.trim()) return;

    let targetUrl = url.trim();
    if (!targetUrl.startsWith("http")) {
      targetUrl = "https://" + targetUrl;
    }

    let targetDomain: string;
    try {
      targetDomain = new URL(targetUrl).hostname.replace(/^www\./, "");
    } catch {
      targetDomain = targetUrl.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
    }

    // Save site to API and localStorage
    try {
      const siteRes = await fetch("/api/me/site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl }),
      });
      if (siteRes.ok) {
        const siteData = await siteRes.json();
        if (siteData.site?.id) {
          setSiteId(siteData.site.id);
          // PERSIST to localStorage so it never asks again
          saveSite({ id: siteData.site.id, domain: targetDomain });
          await loadDashboardData(siteData.site.id);
        }
      }
    } catch (e) {
      console.error("Failed to save site:", e);
      // Still save to localStorage even if API fails
      saveSite({ id: "local-" + Date.now(), domain: targetDomain });
    }

    // Run analysis
    await runAnalysis(targetDomain);
  };

  // Toggle autopilot
  const handleToggleAutopilot = async (enabled: boolean) => {
    setAutopilotEnabled(enabled);
    try {
      await fetch("/api/me/site", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autopilotEnabled: enabled }),
      });
    } catch (e) {
      console.error("Failed to update autopilot:", e);
    }
  };

  // ============================================
  // RENDER: LOADING
  // ============================================
  if (phase === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mb-4" />
        <p className="text-zinc-400">Loading dashboard...</p>
      </div>
    );
  }

  // ============================================
  // RENDER: ONBOARDING
  // ============================================
  if (phase === "onboarding") {
  return (
      <div className="max-w-xl mx-auto py-16 px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
            <Rocket className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-emerald-400">Get Cited by AI</span>
        </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to CabbageSEO</h1>
          <p className="text-zinc-400">Enter your website to get started</p>
      </div>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-8 pb-8">
            <div className="text-center mb-6">
              <Globe className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-white mb-1">What&apos;s your website?</h2>
              <p className="text-sm text-zinc-400">We&apos;ll analyze it and show you exactly how to improve</p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <Input
                type="url"
                placeholder="https://yourwebsite.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                className="flex-1 bg-zinc-800 border-zinc-700 text-white h-12"
              />
              <Button onClick={handleSubmit} disabled={!url.trim()} className="bg-emerald-600 hover:bg-emerald-500 h-12 px-6">
                <Search className="w-4 h-4 mr-2" />
                Analyze
              </Button>
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
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Analyzing {domain}...</h2>
        <p className="text-zinc-400">This takes about 10-15 seconds</p>
      </div>
    );
  }

  // ============================================
  // RENDER: DASHBOARD (SAME AS FREE ANALYZER)
  // ============================================
  if (!analysis) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-zinc-400">No analysis data</p>
        <Button onClick={() => setPhase("onboarding")} className="mt-4">
          Start Over
        </Button>
      </div>
    );
  }

  const { seo, aio } = analysis;

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Globe className="w-6 h-6 text-emerald-400" />
          <div>
            <h1 className="text-xl font-bold text-white">{domain}</h1>
            <p className="text-sm text-zinc-400">Last analyzed just now</p>
          </div>
          <Badge className="ml-2 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
            {plan.charAt(0).toUpperCase() + plan.slice(1)}
          </Badge>
        </div>
        <Button onClick={() => runAnalysis(domain)} disabled={analyzing} variant="outline" className="border-zinc-700">
          <RefreshCw className={`w-4 h-4 mr-2 ${analyzing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* SCORE CARDS + CITATIONS */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6 flex flex-col items-center">
            <ScoreRing score={analysis.seoScore} size={100} label="SEO Score" sublabel="Technical health" />
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6 flex flex-col items-center">
            <ScoreRing score={analysis.aioScore} size={100} label="AI Visibility" sublabel="ChatGPT, Perplexity" />
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6 flex flex-col items-center">
            <ScoreRing score={analysis.combinedScore} size={100} label="Combined" sublabel="AI-readiness" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 border-purple-500/30">
          <CardHeader className="pb-1 pt-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              AI Citations
              <Badge className="bg-green-500/20 text-green-400 text-[10px]">Live</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <p className="text-4xl font-bold text-white">{citations.total}</p>
            <p className="text-xs text-zinc-400 mt-1">Times cited by AI</p>
            <div className="flex gap-2 mt-2 text-xs">
              <span className="text-green-400">{citations.chatgpt} GPT</span>
              <span className="text-blue-400">{citations.perplexity} Perp</span>
              <span className="text-yellow-400">{citations.google} Google</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* PLATFORM VISIBILITY */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Bot className="w-4 h-4 text-purple-400" />
            AI Platform Visibility
            <Badge variant="outline" className="text-[10px]">Estimated</Badge>
          </CardTitle>
          <CardDescription>How likely each AI platform is to cite your content</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <PlatformBar name="Google AI Overviews" score={aio.platformScores.googleAIO} icon={<Globe className="w-4 h-4" />} />
          <PlatformBar name="ChatGPT / SearchGPT" score={aio.platformScores.chatGPT} icon={<Bot className="w-4 h-4" />} />
          <PlatformBar name="Perplexity" score={aio.platformScores.perplexity} icon={<Search className="w-4 h-4" />} />
          <PlatformBar name="Bing Copilot" score={aio.platformScores.bingCopilot} icon={<Sparkles className="w-4 h-4" />} />
        </CardContent>
      </Card>

      {/* TABS FOR DETAILED BREAKDOWN */}
      <Tabs defaultValue="seo" className="space-y-4">
        <TabsList className="bg-zinc-900 border border-zinc-800">
          <TabsTrigger value="seo">SEO Details</TabsTrigger>
          <TabsTrigger value="aio">AI Visibility</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        {/* SEO TAB - SAME AS FREE ANALYZER */}
        <TabsContent value="seo" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Issue Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded bg-red-500/10">
                  <span className="text-sm text-red-400">Critical Issues</span>
                  <Badge variant="destructive">{seo.issueCount.critical}</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-yellow-500/10">
                  <span className="text-sm text-yellow-400">Warnings</span>
                  <Badge className="bg-yellow-500/20 text-yellow-400">{seo.issueCount.warning}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Top Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
                <ul className="space-y-2">
                  {seo.recommendations.slice(0, 3).map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <ArrowRight className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span className="text-zinc-300">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-3">
            <CategoryBreakdown title="Technical SEO" score={seo.breakdown.technicalScore} maxScore={20} items={seo.details.technical} defaultOpen={true} />
            <CategoryBreakdown title="Content Quality" score={seo.breakdown.contentScore} maxScore={25} items={seo.details.content} />
            <CategoryBreakdown title="Meta Tags" score={seo.breakdown.metaScore} maxScore={20} items={seo.details.meta} />
            <CategoryBreakdown title="Performance" score={seo.breakdown.performanceScore} maxScore={20} items={seo.details.performance} />
            <CategoryBreakdown title="Accessibility" score={seo.breakdown.accessibilityScore} maxScore={15} items={seo.details.accessibility} />
          </div>
        </TabsContent>

        {/* AI VISIBILITY TAB - SAME AS FREE ANALYZER */}
        <TabsContent value="aio" className="space-y-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">AI Visibility Factors</CardTitle>
              <CardDescription>What AI platforms look for when citing sources</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-x-8">
              <div>
                <FactorCheck label="Direct Answer Format" checked={aio.factors.hasDirectAnswers} impact="high" />
                <FactorCheck label="FAQ Section" checked={aio.factors.hasFAQSection} impact="high" />
                <FactorCheck label="Schema Markup" checked={aio.factors.hasSchema} impact="high" />
              </div>
              <div>
                <FactorCheck label="Author Attribution" checked={aio.factors.hasAuthorInfo} impact="medium" />
                <FactorCheck label="Citations/Sources" checked={aio.factors.hasCitations} impact="medium" />
                <FactorCheck label="Key Takeaways" checked={aio.factors.hasKeyTakeaways} impact="medium" />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <CategoryBreakdown title="Content Structure" score={aio.breakdown.structureScore} maxScore={25} items={aio.details.structure} defaultOpen={true} />
            <CategoryBreakdown title="Authority Signals" score={aio.breakdown.authorityScore} maxScore={25} items={aio.details.authority} />
            <CategoryBreakdown title="Schema & Structured Data" score={aio.breakdown.schemaScore} maxScore={20} items={aio.details.schema} />
            <CategoryBreakdown title="Content Quality" score={aio.breakdown.contentQualityScore} maxScore={15} items={aio.details.contentQuality} />
            <CategoryBreakdown title="Quotability" score={aio.breakdown.quotabilityScore} maxScore={15} items={aio.details.quotability} />
            </div>

          {aio.recommendations.length > 0 && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-yellow-400" />
                  AI Visibility Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {aio.recommendations.map((rec, i) => (
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

        {/* ACTIONS TAB - DASHBOARD SPECIFIC */}
        <TabsContent value="actions" className="space-y-4">
          {/* CITATIONS CARD */}
          <Card className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border-purple-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Bot className="w-5 h-5 text-purple-400" />
                AI Citations
                <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">Live</Badge>
              </CardTitle>
              <CardDescription>Times your content has been cited by AI platforms</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-3xl font-bold text-white">{citations.total}</p>
                  <p className="text-xs text-zinc-400">Total</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-400">{citations.chatgpt}</p>
                  <p className="text-xs text-zinc-400">ChatGPT</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-400">{citations.perplexity}</p>
                  <p className="text-xs text-zinc-400">Perplexity</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-400">{citations.google}</p>
                  <p className="text-xs text-zinc-400">Google AI</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AUTOPILOT CONTROL */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  <CardTitle className="text-base">Autopilot</CardTitle>
                  {autopilotEnabled && <Badge className="bg-green-500/20 text-green-400">Active</Badge>}
                </div>
                <Switch checked={autopilotEnabled} onCheckedChange={handleToggleAutopilot} />
              </div>
              <CardDescription>Automatically generate AI-optimized content every week</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-sm text-zinc-400 mb-1 block">Articles per week</label>
                  <Select value={articlesPerWeek} onValueChange={setArticlesPerWeek}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 article/week</SelectItem>
                      <SelectItem value="2">2 articles/week</SelectItem>
                      <SelectItem value="3">3 articles/week</SelectItem>
                      <SelectItem value="5">5 articles/week</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <label className="text-sm text-zinc-400 mb-1 block">Next scheduled</label>
                  <div className="flex items-center gap-2 text-sm text-emerald-400">
                    <Calendar className="w-4 h-4" />
                    <span>Monday 9:00 AM</span>
                  </div>
                </div>
              </div>
              {autopilotEnabled && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <p className="text-sm text-emerald-400">✨ Autopilot will generate {articlesPerWeek} GEO-optimized article(s) this week</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* KEYWORDS EXTRACTED */}
          {keywords.length > 0 && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="w-4 h-4 text-purple-400" />
                    Extracted Keywords
                  </CardTitle>
                  <Link href="/keywords">
                    <Button variant="ghost" size="sm" className="text-xs">View All →</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {keywords.map((kw, i) => (
                    <Badge key={i} variant="secondary" className="bg-purple-500/10 text-purple-300 border border-purple-500/20">
                      {kw}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* CONTENT IDEAS */}
          {contentIdeas.length > 0 && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-400" />
                    Content Ideas (Ready to Generate)
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {contentIdeas.map((idea, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors">
                    <div>
                      <p className="text-sm text-white font-medium">{idea.title}</p>
                      <p className="text-xs text-zinc-400">Keyword: {idea.keyword}</p>
                    </div>
                    <Link href={`/content/new?topic=${encodeURIComponent(idea.title)}&keyword=${encodeURIComponent(idea.keyword)}`}>
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500">
                        <Play className="w-3 h-3 mr-1" />
                        Generate
                      </Button>
                    </Link>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* QUICK ACTIONS */}
          <div className="grid md:grid-cols-3 gap-4">
            <Link href="/content/new">
              <Card className="bg-zinc-900 border-zinc-800 hover:border-emerald-500/50 transition-colors cursor-pointer">
                <CardContent className="pt-6 text-center">
                  <FileText className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <h3 className="font-medium text-white">Generate Article</h3>
                  <p className="text-xs text-zinc-400 mt-1">AI-optimized content</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/keywords">
              <Card className="bg-zinc-900 border-zinc-800 hover:border-purple-500/50 transition-colors cursor-pointer">
                <CardContent className="pt-6 text-center">
                  <Target className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                  <h3 className="font-medium text-white">Keyword Research</h3>
                  <p className="text-xs text-zinc-400 mt-1">Find opportunities</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/settings/integrations">
              <Card className="bg-zinc-900 border-zinc-800 hover:border-blue-500/50 transition-colors cursor-pointer">
                <CardContent className="pt-6 text-center">
                  <Settings className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  <h3 className="font-medium text-white">Integrations</h3>
                  <p className="text-xs text-zinc-400 mt-1">Connect your CMS</p>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* USAGE */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-zinc-400" />
                Plan Usage ({plan.charAt(0).toUpperCase() + plan.slice(1)})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-zinc-400">Articles Generated</span>
                  <span className="text-white">{usage.articles} / {usage.articlesLimit}</span>
                </div>
                <Progress value={(usage.articles / usage.articlesLimit) * 100} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-zinc-400">Keywords Tracked</span>
                  <span className="text-white">{usage.keywords} / {usage.keywordsLimit}</span>
                </div>
                <Progress value={(usage.keywords / usage.keywordsLimit) * 100} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
