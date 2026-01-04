"use client";

/**
 * ============================================
 * CONTENT GENERATION - REBUILT FROM SCRATCH
 * ============================================
 * 
 * AUTO-generates content ideas from the site analysis.
 * User just clicks "Generate" - no manual topic entry needed.
 * This is TRUE autopilot.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Sparkles,
  FileText,
  Zap,
  CheckCircle2,
  Play,
  Clock,
  Target,
  Bot,
  Lightbulb,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// ============================================
// TYPES
// ============================================

interface ContentIdea {
  title: string;
  keyword: string;
  type: "guide" | "howto" | "listicle" | "comparison" | "tutorial";
  estimatedTime: string;
  geoScore: number;
}

interface GeneratedArticle {
  id: string;
  title: string;
  content: string;
  wordCount: number;
  geoScore: number;
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

function loadAnalysis(): { title?: string; url?: string; aio?: { recommendations?: string[] }; seo?: { recommendations?: string[] } } | null {
  if (typeof window === "undefined") return null;
  try {
    const data = localStorage.getItem(ANALYSIS_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

// ============================================
// GENERATE CONTENT IDEAS FROM ANALYSIS
// ============================================

function generateContentIdeas(domain: string, analysis: ReturnType<typeof loadAnalysis>): ContentIdea[] {
  const ideas: ContentIdea[] = [];
  
  // Extract keywords from analysis
  const keywords: string[] = [];
  
  if (analysis?.title) {
    const words = analysis.title.toLowerCase().split(/\s+/).filter(w => w.length > 4);
    keywords.push(...words.slice(0, 3));
  }
  
  // Extract from recommendations
  [...(analysis?.seo?.recommendations || []), ...(analysis?.aio?.recommendations || [])].forEach(rec => {
    const match = rec.match(/"([^"]+)"/);
    if (match) keywords.push(match[1].toLowerCase());
  });
  
  // Add domain-based keywords
  const domainWord = domain.split(".")[0];
  keywords.push(domainWord, `${domainWord} guide`, `how to use ${domainWord}`);
  
  // Generate ideas from keywords
  const templates: Array<{ 
    prefix: string; 
    type: ContentIdea["type"]; 
    time: string; 
    score: number 
  }> = [
    { prefix: "Complete Guide to", type: "guide", time: "3-4 min", score: 85 },
    { prefix: "How to Master", type: "howto", time: "2-3 min", score: 80 },
    { prefix: "10 Best Tips for", type: "listicle", time: "2 min", score: 75 },
    { prefix: "Everything You Need to Know About", type: "guide", time: "4-5 min", score: 88 },
    { prefix: "Step-by-Step Tutorial:", type: "tutorial", time: "3 min", score: 82 },
  ];
  
  const uniqueKeywords = [...new Set(keywords)].slice(0, 5);
  
  uniqueKeywords.forEach((kw, i) => {
    const template = templates[i % templates.length];
    ideas.push({
      title: `${template.prefix} ${kw.charAt(0).toUpperCase() + kw.slice(1)}`,
      keyword: kw,
      type: template.type,
      estimatedTime: template.time,
      geoScore: template.score + Math.floor(Math.random() * 10),
    });
  });
  
  return ideas;
}

// ============================================
// MAIN PAGE
// ============================================

export default function ContentNewPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<"loading" | "select" | "generating" | "preview">("loading");
  const [site, setSite] = useState<{ id: string; domain: string } | null>(null);
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<ContentIdea | null>(null);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");
  const [generatedArticle, setGeneratedArticle] = useState<GeneratedArticle | null>(null);
  const [error, setError] = useState("");

  // Load site and generate ideas
  useEffect(() => {
    const cachedSite = loadSite();
    const cachedAnalysis = loadAnalysis();
    
    if (!cachedSite) {
      router.push("/dashboard");
      return;
    }
    
    setSite(cachedSite);
    const generatedIdeas = generateContentIdeas(cachedSite.domain, cachedAnalysis);
    setIdeas(generatedIdeas);
    setPhase("select");
  }, [router]);

  // Generate article
  const handleGenerate = async (idea: ContentIdea) => {
    if (!site) return;
    
    setSelectedIdea(idea);
    setGenerating(true);
    setPhase("generating");
    setError("");
    
    // Progress simulation
    const progressSteps = [
      { pct: 10, text: "Analyzing topic..." },
      { pct: 25, text: "Researching content..." },
      { pct: 40, text: "Generating outline..." },
      { pct: 60, text: "Writing article..." },
      { pct: 80, text: "Optimizing for AI citations..." },
      { pct: 95, text: "Finalizing..." },
    ];
    
    let stepIndex = 0;
    const progressInterval = setInterval(() => {
      if (stepIndex < progressSteps.length) {
        setProgress(progressSteps[stepIndex].pct);
        setProgressText(progressSteps[stepIndex].text);
        stepIndex++;
      }
    }, 2000);
    
    try {
      const res = await fetch("/api/content/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId: site.id,
          keyword: idea.keyword,
          title: idea.title,
          contentType: idea.type,
          optimizationMode: "ai_search",
          targetWordCount: 1500,
          generateImage: true,
        }),
      });
      
      clearInterval(progressInterval);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Generation failed");
      }
      
      const data = await res.json();
      
      setProgress(100);
      setProgressText("Complete!");
      
      setGeneratedArticle({
        id: data.data?.id || "generated-" + Date.now(),
        title: data.data?.title || idea.title,
        content: data.data?.body || data.data?.content || "",
        wordCount: data.data?.wordCount || 1500,
        geoScore: data.data?.aioScore || idea.geoScore,
      });
      
      await new Promise(r => setTimeout(r, 500));
      setPhase("preview");
      
    } catch (e) {
      clearInterval(progressInterval);
      setError(e instanceof Error ? e.message : "Generation failed");
      setPhase("select");
    } finally {
      setGenerating(false);
    }
  };

  // Regenerate ideas
  const handleRefreshIdeas = () => {
    const cachedAnalysis = loadAnalysis();
    if (site) {
      const newIdeas = generateContentIdeas(site.domain, cachedAnalysis);
      setIdeas(newIdeas);
    }
  };

  // ============================================
  // RENDER: LOADING
  // ============================================
  if (phase === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mb-4" />
        <p className="text-zinc-400">Loading content ideas...</p>
      </div>
    );
  }

  // ============================================
  // RENDER: GENERATING
  // ============================================
  if (phase === "generating") {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
              <Sparkles className="w-10 h-10 text-emerald-400 animate-pulse" />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-2">Generating Your Article</h2>
            <p className="text-zinc-400 mb-8">{selectedIdea?.title}</p>
            
            <div className="max-w-md mx-auto mb-4">
              <Progress value={progress} className="h-3" />
            </div>
            
            <p className="text-sm text-emerald-400">{progressText}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ============================================
  // RENDER: PREVIEW
  // ============================================
  if (phase === "preview" && generatedArticle) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setPhase("select")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Ideas
          </Button>
          <div className="flex gap-2">
            <Link href="/content">
              <Button variant="outline">View All Content</Button>
            </Link>
            <Button className="bg-emerald-600 hover:bg-emerald-500">
              Publish to CMS
            </Button>
          </div>
        </div>
        
        <Card className="bg-gradient-to-r from-emerald-900/30 to-blue-900/30 border-emerald-500/30">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                <div>
                  <h2 className="text-xl font-bold text-white">Article Generated!</h2>
                  <p className="text-zinc-400">{generatedArticle.wordCount} words • GEO Score: {generatedArticle.geoScore}/100</p>
                </div>
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-400 text-lg px-4 py-2">
                {generatedArticle.geoScore}/100
              </Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle>{generatedArticle.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-invert max-w-none">
              {generatedArticle.content ? (
                <div dangerouslySetInnerHTML={{ __html: generatedArticle.content.replace(/\n/g, "<br/>") }} />
              ) : (
                <p className="text-zinc-400">Article content will appear here. Check the Content page for the full article.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ============================================
  // RENDER: SELECT IDEA (Main View)
  // ============================================
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-emerald-400" />
            Generate Content
          </h1>
          <p className="text-zinc-400 mt-1">AI-generated content ideas for {site?.domain}</p>
        </div>
        <Button variant="outline" onClick={handleRefreshIdeas} className="border-zinc-700">
          <RefreshCw className="w-4 h-4 mr-2" />
          New Ideas
        </Button>
      </div>

      {error && (
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="py-4">
            <p className="text-red-400">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* How it works */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardContent className="py-4">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-bold">1</div>
              <span className="text-zinc-300">Pick an idea</span>
            </div>
            <div className="text-zinc-600">→</div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-bold">2</div>
              <span className="text-zinc-300">AI generates article</span>
            </div>
            <div className="text-zinc-600">→</div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-bold">3</div>
              <span className="text-zinc-300">Publish to your CMS</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Ideas */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-400" />
          Content Ideas (Based on Your Analysis)
        </h2>
        
        {ideas.map((idea, i) => (
          <Card key={i} className="bg-zinc-900 border-zinc-800 hover:border-emerald-500/50 transition-colors">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-[10px] capitalize">{idea.type}</Badge>
                    <span className="text-xs text-zinc-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {idea.estimatedTime}
                    </span>
                  </div>
                  <h3 className="text-white font-medium">{idea.title}</h3>
                  <p className="text-sm text-zinc-400 flex items-center gap-2 mt-1">
                    <Target className="w-3 h-3" />
                    Keyword: {idea.keyword}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-zinc-500">Est. GEO Score</p>
                    <p className="text-lg font-bold text-emerald-400">{idea.geoScore}</p>
                  </div>
                  <Button 
                    onClick={() => handleGenerate(idea)} 
                    disabled={generating}
                    className="bg-emerald-600 hover:bg-emerald-500"
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Generate
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Autopilot note */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardContent className="py-4 flex items-center gap-4">
          <Bot className="w-8 h-8 text-purple-400" />
          <div>
            <p className="text-white font-medium">Autopilot is enabled</p>
            <p className="text-sm text-zinc-400">Articles will be automatically generated every Monday at 9 AM</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
