"use client";

/**
 * ============================================
 * GEO PAGE - FIXED VERSION
 * ============================================
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  Sparkles,
  TrendingUp,
  Bot,
  Globe,
  Search,
  CheckCircle2,
  AlertCircle,
  ArrowUp,
  ArrowRight,
  RefreshCw,
  Target,
  Zap,
  MessageSquare,
  Database,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// ============================================
// TYPES - No React nodes in state!
// ============================================

interface Platform {
  id: string;
  name: string;
  score: number;
  status: "cited" | "possible" | "not_cited";
}

interface Factor {
  name: string;
  status: "pass" | "warning" | "fail";
  impact: "high" | "medium" | "low";
  tip: string;
}

// ============================================
// STORAGE
// ============================================

const SITE_KEY = "cabbageseo_site";
const ANALYSIS_KEY = "cabbageseo_analysis";

function loadSite(): { id: string; domain: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const data = localStorage.getItem(SITE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

function loadAnalysis(): Record<string, unknown> | null {
  if (typeof window === "undefined") return null;
  try {
    const data = localStorage.getItem(ANALYSIS_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

// ============================================
// PLATFORM ICON COMPONENT
// ============================================

function PlatformIcon({ id }: { id: string }) {
  switch (id) {
    case "chatgpt":
      return <Bot className="w-5 h-5 text-green-400" />;
    case "perplexity":
      return <Search className="w-5 h-5 text-purple-400" />;
    case "google":
      return <Globe className="w-5 h-5 text-blue-400" />;
    case "bing":
      return <MessageSquare className="w-5 h-5 text-cyan-400" />;
    default:
      return <Target className="w-5 h-5 text-zinc-400" />;
  }
}

// ============================================
// SCORE RING
// ============================================

function ScoreRing({ score, size = 120, label, sublabel }: {
  score: number;
  size?: number;
  label: string;
  sublabel?: string;
}) {
  const strokeWidth = size / 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;
  
  const color = score >= 70 ? "#22c55e" : score >= 50 ? "#eab308" : "#ef4444";
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#27272a"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl font-bold text-white">{score}</span>
        </div>
      </div>
      <p className="text-white font-medium mt-2">{label}</p>
      {sublabel && <p className="text-xs text-zinc-500">{sublabel}</p>}
    </div>
  );
}

// ============================================
// DEFAULT DATA
// ============================================

const DEFAULT_PLATFORMS: Platform[] = [
  { id: "chatgpt", name: "ChatGPT / SearchGPT", score: 45, status: "possible" },
  { id: "perplexity", name: "Perplexity", score: 55, status: "possible" },
  { id: "google", name: "Google AI Overviews", score: 50, status: "possible" },
  { id: "bing", name: "Bing Copilot", score: 42, status: "possible" },
];

const DEFAULT_FACTORS: Factor[] = [
  { name: "Entity Coverage", status: "pass", impact: "high", tip: "Good entity coverage" },
  { name: "Quotable Passages", status: "warning", impact: "high", tip: "Add more quotable statements" },
  { name: "Structured Data", status: "fail", impact: "medium", tip: "Add schema markup" },
  { name: "Expert Attribution", status: "warning", impact: "high", tip: "Add author credentials" },
  { name: "Source Citations", status: "pass", impact: "medium", tip: "Good source linking" },
  { name: "Freshness Signals", status: "pass", impact: "low", tip: "Content is recent" },
];

// ============================================
// MAIN PAGE
// ============================================

export default function GEOPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [site, setSite] = useState<{ id: string; domain: string } | null>(null);
  const [geoScore, setGeoScore] = useState(50);
  const [seoScore, setSeoScore] = useState(50);
  const [platforms, setPlatforms] = useState<Platform[]>(DEFAULT_PLATFORMS);
  const [factors, setFactors] = useState<Factor[]>(DEFAULT_FACTORS);
  const [citations, setCitations] = useState({ total: 0, chatgpt: 0, perplexity: 0, google: 0 });
  const [recommendations, setRecommendations] = useState<string[]>([]);

  // Load on mount
  useEffect(() => {
    const cachedSite = loadSite();
    
    if (!cachedSite) {
      router.push("/dashboard");
      return;
    }
    
    setSite(cachedSite);
    
    // Load analysis
    const cachedAnalysis = loadAnalysis();
    if (cachedAnalysis) {
      // Extract scores
      const aio = cachedAnalysis.aio as { score?: number; recommendations?: string[]; platforms?: Array<{ name: string; score: number }> } | undefined;
      const seo = cachedAnalysis.seo as { score?: number } | undefined;
      
      if (aio?.score) setGeoScore(aio.score);
      if (seo?.score) setSeoScore(seo.score);
      if (aio?.recommendations) setRecommendations(aio.recommendations);
      
      // Extract platforms if available
      if (aio?.platforms && Array.isArray(aio.platforms)) {
        const platformData: Platform[] = aio.platforms.map((p: { name: string; score: number }) => ({
          id: p.name.toLowerCase().includes("chatgpt") ? "chatgpt" :
              p.name.toLowerCase().includes("perplexity") ? "perplexity" :
              p.name.toLowerCase().includes("google") ? "google" : "bing",
          name: p.name,
          score: p.score,
          status: p.score >= 60 ? "possible" : "not_cited" as const,
        }));
        if (platformData.length > 0) {
          setPlatforms(platformData);
        }
      }
    }
    
    // Fetch citations
    fetchCitations(cachedSite.id);
    
    setLoading(false);
  }, [router]);

  async function fetchCitations(siteId: string) {
    try {
      const res = await fetch(`/api/aio/citations?siteId=${siteId}`);
      if (res.ok) {
        const data = await res.json();
        setCitations({
          total: data.data?.total || 0,
          chatgpt: data.data?.byPlatform?.chatgpt || 0,
          perplexity: data.data?.byPlatform?.perplexity || 0,
          google: data.data?.byPlatform?.google || 0,
        });
      }
    } catch {}
  }

  const combinedScore = Math.round((geoScore + seoScore) / 2);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mb-4" />
        <p className="text-zinc-400">Loading GEO data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-emerald-400" />
            GEO Dashboard
          </h1>
          <p className="text-zinc-400 mt-1">AI Visibility for {site?.domain}</p>
        </div>
        <Button variant="outline" onClick={() => window.location.reload()} className="border-zinc-700">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-zinc-900 border-zinc-800 flex items-center justify-center py-8">
          <ScoreRing score={geoScore} label="AI Visibility" sublabel="GEO Score" />
        </Card>
        <Card className="bg-zinc-900 border-zinc-800 flex items-center justify-center py-8">
          <ScoreRing score={seoScore} label="SEO Score" sublabel="Technical" />
        </Card>
        <Card className="bg-zinc-900 border-zinc-800 flex items-center justify-center py-8">
          <ScoreRing score={combinedScore} label="Combined" sublabel="Overall" />
        </Card>
        <Card className="bg-gradient-to-br from-emerald-900/50 to-zinc-900 border-emerald-500/30">
          <CardContent className="py-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Database className="w-5 h-5 text-emerald-400" />
              <Badge className="bg-emerald-500/20 text-emerald-400">Live</Badge>
            </div>
            <p className="text-4xl font-bold text-white mb-1">{citations.total}</p>
            <p className="text-sm text-zinc-400">AI Citations</p>
            <div className="mt-4 flex justify-center gap-4 text-xs">
              <span className="text-green-400">{citations.chatgpt} GPT</span>
              <span className="text-purple-400">{citations.perplexity} Perp</span>
              <span className="text-blue-400">{citations.google} Google</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Visibility */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-400" />
            Platform Visibility
          </CardTitle>
          <CardDescription>How likely each AI platform is to cite your content</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {platforms.map((platform) => (
            <div key={platform.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <PlatformIcon id={platform.id} />
                  <span className="text-white font-medium">{platform.name}</span>
                  {platform.status === "cited" && (
                    <Badge className="bg-emerald-500/20 text-emerald-400">Cited!</Badge>
                  )}
                </div>
                <span className={`font-bold ${
                  platform.score >= 60 ? "text-emerald-400" :
                  platform.score >= 40 ? "text-yellow-400" :
                  "text-red-400"
                }`}>
                  {platform.score}%
                </span>
              </div>
              <Progress value={platform.score} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* GEO Factors */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            GEO Factors
          </CardTitle>
          <CardDescription>Key factors that influence AI citation likelihood</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {factors.map((factor, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50">
                {factor.status === "pass" && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
                {factor.status === "warning" && <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0" />}
                {factor.status === "fail" && <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{factor.name}</span>
                    <Badge variant="outline" className={`text-[10px] ${
                      factor.impact === "high" ? "border-red-500/50 text-red-400" :
                      factor.impact === "medium" ? "border-yellow-500/50 text-yellow-400" :
                      "border-zinc-500/50 text-zinc-400"
                    }`}>
                      {factor.impact}
                    </Badge>
                  </div>
                  <p className="text-xs text-zinc-400 truncate">{factor.tip}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              AI Optimization Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {recommendations.slice(0, 5).map((rec, i) => (
                <li key={i} className="flex items-start gap-2 text-zinc-300">
                  <ArrowRight className="w-4 h-4 text-emerald-400 mt-1 shrink-0" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* CTA */}
      <Card className="bg-gradient-to-r from-emerald-900/30 to-blue-900/30 border-emerald-500/30">
        <CardContent className="py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Sparkles className="w-10 h-10 text-emerald-400" />
            <div>
              <h3 className="text-xl font-bold text-white">Improve Your GEO Score</h3>
              <p className="text-zinc-400">Generate AI-optimized content to boost your citations</p>
            </div>
          </div>
          <Link href="/content/new">
            <Button className="bg-emerald-600 hover:bg-emerald-500">
              Generate Content
              <ArrowUp className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
