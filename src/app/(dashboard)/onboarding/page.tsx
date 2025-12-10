"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  Sparkles, 
  Globe, 
  Search, 
  FileText, 
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Zap,
  TrendingUp,
  Link2,
  Target,
  Rocket
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// ============================================
// TYPES
// ============================================

interface AnalysisStep {
  id: string;
  label: string;
  status: "pending" | "loading" | "complete" | "error";
  result?: string;
}

interface SiteAnalysis {
  seoScore: number;
  issues: {
    critical: number;
    warnings: number;
    passed: number;
  };
  keywords: Array<{
    keyword: string;
    volume: number;
    difficulty: number;
    opportunity: "high" | "medium" | "low";
  }>;
  contentIdeas: Array<{
    title: string;
    keyword: string;
    trafficPotential: number;
  }>;
  quickWins: Array<{
    type: string;
    title: string;
    impact: "high" | "medium" | "low";
  }>;
}

// ============================================
// STEP INDICATOR
// ============================================

function StepIndicator({ step, status }: { step: AnalysisStep; status: "pending" | "loading" | "complete" | "error" }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
      status === "complete" ? "bg-green-500/10" :
      status === "loading" ? "bg-primary/10" :
      status === "error" ? "bg-red-500/10" :
      "bg-muted/50"
    }`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
        status === "complete" ? "bg-green-500 text-white" :
        status === "loading" ? "bg-primary text-white" :
        status === "error" ? "bg-red-500 text-white" :
        "bg-muted text-muted-foreground"
      }`}>
        {status === "loading" ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : status === "complete" ? (
          <CheckCircle2 className="w-4 h-4" />
        ) : status === "error" ? (
          <AlertTriangle className="w-4 h-4" />
        ) : (
          <span className="text-sm font-medium">{step.id}</span>
        )}
      </div>
      <div className="flex-1">
        <p className={`text-sm font-medium ${status === "loading" ? "text-primary" : ""}`}>
          {step.label}
        </p>
        {step.result && (
          <p className="text-xs text-muted-foreground">{step.result}</p>
        )}
      </div>
    </div>
  );
}

// ============================================
// SEO SCORE DISPLAY
// ============================================

function SEOScoreDisplay({ score, animate = false }: { score: number; animate?: boolean }) {
  const [displayScore, setDisplayScore] = useState(0);
  
  useEffect(() => {
    if (animate && score > 0) {
      let current = 0;
      const interval = setInterval(() => {
        current += 1;
        setDisplayScore(current);
        if (current >= score) {
          clearInterval(interval);
        }
      }, 20);
      return () => clearInterval(interval);
    } else {
      setDisplayScore(score);
    }
  }, [score, animate]);

  const getColor = (s: number) => {
    if (s >= 80) return "text-green-500";
    if (s >= 60) return "text-yellow-500";
    if (s >= 40) return "text-orange-500";
    return "text-red-500";
  };

  const getGrade = (s: number) => {
    if (s >= 90) return "A+";
    if (s >= 80) return "A";
    if (s >= 70) return "B";
    if (s >= 60) return "C";
    if (s >= 50) return "D";
    return "F";
  };

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative w-40 h-40">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="80"
            cy="80"
            r="70"
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            className="text-muted/20"
          />
          <circle
            cx="80"
            cy="80"
            r="70"
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 70}
            strokeDashoffset={2 * Math.PI * 70 * (1 - displayScore / 100)}
            className={`${getColor(displayScore)} transition-all duration-500`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-5xl font-bold ${getColor(displayScore)}`}>{displayScore}</span>
          <span className="text-lg font-semibold text-muted-foreground">/ 100</span>
        </div>
      </div>
      <Badge className={`mt-4 ${getColor(score)} bg-current/10`}>
        Grade: {getGrade(score)}
      </Badge>
    </div>
  );
}

// ============================================
// MAIN ONBOARDING PAGE
// ============================================

export default function OnboardingPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysis, setAnalysis] = useState<SiteAnalysis | null>(null);
  const [steps, setSteps] = useState<AnalysisStep[]>([
    { id: "1", label: "Scanning your website...", status: "pending" },
    { id: "2", label: "Analyzing SEO factors...", status: "pending" },
    { id: "3", label: "Discovering keywords...", status: "pending" },
    { id: "4", label: "Finding content opportunities...", status: "pending" },
    { id: "5", label: "Generating recommendations...", status: "pending" },
  ]);

  const updateStep = useCallback((index: number, updates: Partial<AnalysisStep>) => {
    setSteps(prev => prev.map((step, i) => 
      i === index ? { ...step, ...updates } : step
    ));
  }, []);

  const runAnalysis = async () => {
    if (!url) return;

    // Normalize URL
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith("http")) {
      normalizedUrl = "https://" + normalizedUrl;
    }

    setIsAnalyzing(true);
    setProgress(0);

    // Step 1: Scanning
    updateStep(0, { status: "loading" });
    await new Promise(r => setTimeout(r, 1500));
    updateStep(0, { status: "complete", result: "Found 47 pages" });
    setProgress(20);

    // Step 2: Analyzing SEO
    updateStep(1, { status: "loading" });
    await new Promise(r => setTimeout(r, 2000));
    updateStep(1, { status: "complete", result: "Analyzed 12 SEO factors" });
    setProgress(40);

    // Step 3: Keywords
    updateStep(2, { status: "loading" });
    await new Promise(r => setTimeout(r, 1800));
    updateStep(2, { status: "complete", result: "Discovered 156 keywords" });
    setProgress(60);

    // Step 4: Content
    updateStep(3, { status: "loading" });
    await new Promise(r => setTimeout(r, 1500));
    updateStep(3, { status: "complete", result: "Found 23 content gaps" });
    setProgress(80);

    // Step 5: Recommendations
    updateStep(4, { status: "loading" });
    await new Promise(r => setTimeout(r, 1200));
    updateStep(4, { status: "complete", result: "Generated 8 quick wins" });
    setProgress(100);

    // Generate mock analysis results
    setAnalysis({
      seoScore: 67,
      issues: {
        critical: 3,
        warnings: 12,
        passed: 47,
      },
      keywords: [
        { keyword: "seo tools", volume: 12000, difficulty: 45, opportunity: "high" },
        { keyword: "keyword research", volume: 8500, difficulty: 38, opportunity: "high" },
        { keyword: "content optimization", volume: 3200, difficulty: 32, opportunity: "medium" },
        { keyword: "technical seo", volume: 5400, difficulty: 52, opportunity: "medium" },
        { keyword: "link building", volume: 9800, difficulty: 61, opportunity: "low" },
      ],
      contentIdeas: [
        { title: "Complete Guide to SEO in 2025", keyword: "seo guide", trafficPotential: 5200 },
        { title: "How to Do Keyword Research (Step-by-Step)", keyword: "keyword research how to", trafficPotential: 3800 },
        { title: "10 Best Free SEO Tools for Beginners", keyword: "free seo tools", trafficPotential: 4500 },
      ],
      quickWins: [
        { type: "meta", title: "Add missing meta descriptions to 8 pages", impact: "high" },
        { type: "speed", title: "Optimize 12 images for faster loading", impact: "high" },
        { type: "links", title: "Fix 5 broken internal links", impact: "medium" },
        { type: "content", title: "Expand thin content on 3 pages", impact: "medium" },
      ],
    });

    setAnalysisComplete(true);
    setIsAnalyzing(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runAnalysis();
  };

  // Initial state - URL input
  if (!isAnalyzing && !analysisComplete) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-2xl space-y-8 text-center">
          {/* Animated header */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 bg-primary/20 rounded-full blur-3xl animate-pulse" />
            </div>
            <div className="relative">
              <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl mb-6">
                <Sparkles className="w-12 h-12 text-primary" />
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
                Let&apos;s analyze your site
              </h1>
              <p className="text-xl text-muted-foreground max-w-md mx-auto">
                Paste your URL and watch the magic happen in 30 seconds
              </p>
            </div>
          </div>

          {/* URL Input */}
          <form onSubmit={handleSubmit} className="relative">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-primary/30 rounded-xl blur-lg opacity-0 group-hover:opacity-50 transition-opacity" />
              <div className="relative flex gap-2 p-2 bg-background border rounded-xl shadow-lg">
                <div className="flex items-center pl-3 text-muted-foreground">
                  <Globe className="w-5 h-5" />
                </div>
                <Input
                  type="text"
                  placeholder="example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="flex-1 border-0 text-lg focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <Button 
                  type="submit" 
                  size="lg" 
                  disabled={!url.trim()}
                  className="gap-2 px-6"
                >
                  <Zap className="w-5 h-5" />
                  Analyze
                </Button>
              </div>
            </div>
          </form>

          {/* Features */}
          <div className="grid grid-cols-3 gap-4 pt-8">
            <div className="text-center p-4">
              <Search className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">Keyword Discovery</p>
              <p className="text-xs text-muted-foreground">Find untapped opportunities</p>
            </div>
            <div className="text-center p-4">
              <FileText className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">Content Ideas</p>
              <p className="text-xs text-muted-foreground">AI-generated topics</p>
            </div>
            <div className="text-center p-4">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">Issue Detection</p>
              <p className="text-xs text-muted-foreground">Find & fix problems</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Analyzing state
  if (isAnalyzing) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-lg space-y-8">
          {/* Progress */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-xl">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <h2 className="text-2xl font-bold">Analyzing {url}...</h2>
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground">{progress}% complete</p>
          </div>

          {/* Steps */}
          <Card>
            <CardContent className="p-4 space-y-2">
              {steps.map((step, index) => (
                <StepIndicator key={step.id} step={step} status={step.status} />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Results state
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center p-3 bg-green-500/10 rounded-xl">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
        </div>
        <h1 className="text-3xl font-bold">Analysis Complete!</h1>
        <p className="text-muted-foreground">Here&apos;s what we found for {url}</p>
      </div>

      {/* Score and Issues */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-6 text-center">Your SEO Score</h3>
          <SEOScoreDisplay score={analysis?.seoScore || 0} animate />
          <div className="mt-6 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-red-500">{analysis?.issues.critical}</p>
              <p className="text-xs text-muted-foreground">Critical</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-500">{analysis?.issues.warnings}</p>
              <p className="text-xs text-muted-foreground">Warnings</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-500">{analysis?.issues.passed}</p>
              <p className="text-xs text-muted-foreground">Passed</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Wins</h3>
          <div className="space-y-3">
            {analysis?.quickWins.map((win, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className={`p-2 rounded-lg ${
                  win.impact === "high" ? "bg-red-500/10 text-red-500" :
                  "bg-yellow-500/10 text-yellow-500"
                }`}>
                  {win.type === "meta" ? <FileText className="w-4 h-4" /> :
                   win.type === "speed" ? <Zap className="w-4 h-4" /> :
                   win.type === "links" ? <Link2 className="w-4 h-4" /> :
                   <AlertTriangle className="w-4 h-4" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{win.title}</p>
                </div>
                <Badge variant={win.impact === "high" ? "destructive" : "secondary"}>
                  {win.impact}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Keywords */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Keyword Opportunities
          </h3>
          <Badge variant="secondary">{analysis?.keywords.length} found</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-muted-foreground border-b">
                <th className="pb-2">Keyword</th>
                <th className="pb-2">Volume</th>
                <th className="pb-2">Difficulty</th>
                <th className="pb-2">Opportunity</th>
              </tr>
            </thead>
            <tbody>
              {analysis?.keywords.map((kw, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-3 font-medium">{kw.keyword}</td>
                  <td className="py-3">{kw.volume.toLocaleString()}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <Progress value={kw.difficulty} className="h-2 w-16" />
                      <span className="text-sm">{kw.difficulty}</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <Badge variant={
                      kw.opportunity === "high" ? "default" :
                      kw.opportunity === "medium" ? "secondary" : "outline"
                    }>
                      {kw.opportunity}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Content Ideas */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Content Ideas
          </h3>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {analysis?.contentIdeas.map((idea, i) => (
            <Card key={i} className="p-4 hover:shadow-md transition-shadow cursor-pointer group">
              <h4 className="font-medium mb-2 group-hover:text-primary transition-colors">
                {idea.title}
              </h4>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="w-4 h-4" />
                <span>{idea.trafficPotential.toLocaleString()} potential visits/mo</span>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {/* CTA */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
        <Button size="lg" className="gap-2" onClick={() => router.push("/dashboard")}>
          <Rocket className="w-5 h-5" />
          Go to Dashboard
        </Button>
        <Button size="lg" variant="outline" className="gap-2" onClick={() => router.push("/sites/new")}>
          Complete Site Setup
          <ArrowRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
