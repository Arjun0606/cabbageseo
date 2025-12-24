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
  Rocket,
  Image,
  Clock,
  RefreshCw,
  ExternalLink
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
  siteId: string;
  domain: string;
  seoScore: number;
  aioScore: number;        // NEW: AI Optimization score
  combinedScore: number;   // NEW: Combined visibility score
  pagesAnalyzed: number;
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
    count?: number;
  }>;
  topSeoFixes?: string[];
  topAioFixes?: string[];
}

// ============================================
// STEP INDICATOR
// ============================================

function StepIndicator({ step }: { step: AnalysisStep }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
      step.status === "complete" ? "bg-green-500/10" :
      step.status === "loading" ? "bg-primary/10" :
      step.status === "error" ? "bg-red-500/10" :
      "bg-muted/50"
    }`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
        step.status === "complete" ? "bg-green-500 text-white" :
        step.status === "loading" ? "bg-primary text-white" :
        step.status === "error" ? "bg-red-500 text-white" :
        "bg-muted text-muted-foreground"
      }`}>
        {step.status === "loading" ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : step.status === "complete" ? (
          <CheckCircle2 className="w-4 h-4" />
        ) : step.status === "error" ? (
          <AlertTriangle className="w-4 h-4" />
        ) : (
          <span className="text-sm font-medium">{step.id}</span>
        )}
      </div>
      <div className="flex-1">
        <p className={`text-sm font-medium ${step.status === "loading" ? "text-primary" : ""}`}>
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

function SEOScoreDisplay({ 
  score, 
  animate = false,
  size = "large",
  color,
}: { 
  score: number; 
  animate?: boolean;
  size?: "small" | "medium" | "large";
  color?: "default" | "purple" | "emerald";
}) {
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

  // Size configurations
  const sizes = {
    small: { container: "w-20 h-20", radius: 35, strokeWidth: 6, textSize: "text-2xl", subSize: "text-xs", cx: 40, cy: 40 },
    medium: { container: "w-28 h-28", radius: 50, strokeWidth: 8, textSize: "text-3xl", subSize: "text-sm", cx: 56, cy: 56 },
    large: { container: "w-40 h-40", radius: 70, strokeWidth: 12, textSize: "text-5xl", subSize: "text-lg", cx: 80, cy: 80 },
  };
  const sizeConfig = sizes[size];

  const getColor = (s: number) => {
    if (color === "purple") return "text-purple-500";
    if (color === "emerald") return "text-emerald-500";
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

  const getBgColor = (s: number) => {
    if (color === "purple") return "stroke-purple-500";
    if (color === "emerald") return "stroke-emerald-500";
    if (s >= 80) return "stroke-green-500";
    if (s >= 60) return "stroke-yellow-500";
    if (s >= 40) return "stroke-orange-500";
    return "stroke-red-500";
  };

  return (
    <div className="relative flex flex-col items-center">
      <div className={`relative ${sizeConfig.container}`}>
        <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${sizeConfig.cx * 2} ${sizeConfig.cy * 2}`}>
          <circle
            cx={sizeConfig.cx}
            cy={sizeConfig.cy}
            r={sizeConfig.radius}
            fill="none"
            strokeWidth={sizeConfig.strokeWidth}
            className="stroke-muted/20"
          />
          <circle
            cx={sizeConfig.cx}
            cy={sizeConfig.cy}
            r={sizeConfig.radius}
            fill="none"
            strokeWidth={sizeConfig.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * sizeConfig.radius}
            strokeDashoffset={2 * Math.PI * sizeConfig.radius * (1 - displayScore / 100)}
            className={`${getBgColor(displayScore)} transition-all duration-500`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`${sizeConfig.textSize} font-bold ${getColor(displayScore)}`}>{displayScore}</span>
          {size !== "small" && (
            <span className={`${sizeConfig.subSize} font-semibold text-muted-foreground`}>/ 100</span>
          )}
        </div>
      </div>
      {size === "large" && (
        <Badge className={`mt-4 ${getColor(score)}`} variant="secondary">
          Grade: {getGrade(score)}
        </Badge>
      )}
    </div>
  );
}

// ============================================
// QUICK WIN ICON
// ============================================

function QuickWinIcon({ type }: { type: string }) {
  switch (type) {
    case "meta":
      return <FileText className="w-4 h-4" />;
    case "title":
      return <FileText className="w-4 h-4" />;
    case "images":
      return <Image className="w-4 h-4" />;
    case "speed":
      return <Clock className="w-4 h-4" />;
    case "links":
      return <Link2 className="w-4 h-4" />;
    case "content":
      return <FileText className="w-4 h-4" />;
    default:
      return <Zap className="w-4 h-4" />;
  }
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
  const [error, setError] = useState<string | null>(null);
  const [steps, setSteps] = useState<AnalysisStep[]>([
    { id: "1", label: "Connecting to your website...", status: "pending" },
    { id: "2", label: "Discovering pages...", status: "pending" },
    { id: "3", label: "Analyzing SEO factors...", status: "pending" },
    { id: "4", label: "Researching keywords...", status: "pending" },
    { id: "5", label: "Generating recommendations...", status: "pending" },
    { id: "6", label: "Finalizing analysis...", status: "pending" },
  ]);

  const updateStep = useCallback((index: number, updates: Partial<AnalysisStep>) => {
    setSteps(prev => prev.map((step, i) => 
      i === index ? { ...step, ...updates } : step
    ));
  }, []);

  const runAnalysis = async () => {
    if (!url) return;

    // Normalize URL for display
    let displayUrl = url.trim();
    if (!displayUrl.startsWith("http")) {
      displayUrl = "https://" + displayUrl;
    }

    setIsAnalyzing(true);
    setProgress(0);
    setError(null);

    // Reset steps
    setSteps([
      { id: "1", label: "Connecting to your website...", status: "pending" },
      { id: "2", label: "Discovering pages...", status: "pending" },
      { id: "3", label: "Analyzing SEO factors...", status: "pending" },
      { id: "4", label: "Researching keywords...", status: "pending" },
      { id: "5", label: "Generating recommendations...", status: "pending" },
      { id: "6", label: "Finalizing analysis...", status: "pending" },
    ]);

    try {
      // Step 1: Connecting
      updateStep(0, { status: "loading" });
      setProgress(10);
      
      // Start the actual API call
      const response = await fetch("/api/onboarding/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: displayUrl }),
      });

      // Check response IMMEDIATELY before showing any success states
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Analysis failed");
      }

      const result = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error(result.error || "Analysis failed");
      }

      const data = result.data as SiteAnalysis;

      // Only show progress updates AFTER we've confirmed API success
      updateStep(0, { status: "complete", result: "Connected successfully" });
      setProgress(20);
      
      updateStep(1, { status: "loading" });
      await new Promise(r => setTimeout(r, 300));
      updateStep(1, { status: "complete", result: `Found ${data.pagesAnalyzed} pages` });
      setProgress(35);
      
      updateStep(2, { status: "loading" });
      await new Promise(r => setTimeout(r, 300));
      updateStep(2, { status: "complete", result: `Score: ${data.seoScore}/100` });
      setProgress(50);
      
      updateStep(3, { status: "loading" });
      await new Promise(r => setTimeout(r, 250));
      updateStep(3, { status: "complete", result: `${data.keywords.length} keyword opportunities` });
      setProgress(75);
      
      updateStep(4, { status: "loading" });
      await new Promise(r => setTimeout(r, 250));
      updateStep(4, { status: "complete", result: `${data.quickWins.length} quick wins identified` });
      
      // Final step
      updateStep(5, { status: "loading" });
      await new Promise(r => setTimeout(r, 200));
      updateStep(5, { status: "complete", result: "Analysis complete!" });
      setProgress(100);

      setAnalysis(data);
      setAnalysisComplete(true);

    } catch (err) {
      console.error("Analysis error:", err);
      setError(err instanceof Error ? err.message : "Analysis failed. Please try again.");
      
      // Mark current loading step as error
      setSteps(prev => prev.map(step => 
        step.status === "loading" ? { ...step, status: "error" } : step
      ));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runAnalysis();
  };

  const handleRetry = () => {
    setError(null);
    setAnalysisComplete(false);
    setAnalysis(null);
    setProgress(0);
    setSteps([
      { id: "1", label: "Connecting to your website...", status: "pending" },
      { id: "2", label: "Discovering pages...", status: "pending" },
      { id: "3", label: "Analyzing SEO factors...", status: "pending" },
      { id: "4", label: "Researching keywords...", status: "pending" },
      { id: "5", label: "Generating recommendations...", status: "pending" },
      { id: "6", label: "Finalizing analysis...", status: "pending" },
    ]);
  };

  // Initial state - URL input
  if (!isAnalyzing && !analysisComplete && !error) {
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
                Let&apos;s check your AI visibility
              </h1>
              <p className="text-xl text-muted-foreground max-w-md mx-auto">
                See if ChatGPT and AI search cite your content, plus a complete SEO audit
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
                  autoFocus
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
              <Sparkles className="w-8 h-8 mx-auto mb-2 text-purple-500" />
              <p className="text-sm font-medium">AI Visibility</p>
              <p className="text-xs text-muted-foreground">ChatGPT, Perplexity, Google AI</p>
            </div>
            <div className="text-center p-4">
              <Search className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">SEO Analysis</p>
              <p className="text-xs text-muted-foreground">100+ ranking factors</p>
            </div>
            <div className="text-center p-4">
              <Zap className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
              <p className="text-sm font-medium">Quick Wins</p>
              <p className="text-xs text-muted-foreground">Actionable improvements</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-lg space-y-8 text-center">
          <div className="inline-flex items-center justify-center p-4 bg-red-500/10 rounded-2xl">
            <AlertTriangle className="w-12 h-12 text-red-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Analysis Failed</h2>
            <p className="text-muted-foreground">{error}</p>
          </div>
          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={handleRetry}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Start Over
            </Button>
            <Button onClick={() => {
              setError(null);
              runAnalysis();
            }}>
              Retry Analysis
            </Button>
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
            <h2 className="text-2xl font-bold">Analyzing your site...</h2>
            <p className="text-muted-foreground">
              This usually takes 30-60 seconds
            </p>
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground">{progress}% complete</p>
          </div>

          {/* Steps */}
          <Card>
            <CardContent className="p-4 space-y-2">
              {steps.map((step) => (
                <StepIndicator key={step.id} step={step} />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Results state
  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center p-3 bg-green-500/10 rounded-xl">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
        </div>
        <h1 className="text-3xl font-bold">Analysis Complete!</h1>
        <p className="text-muted-foreground flex items-center justify-center gap-2">
          Here&apos;s what we found for 
          <span className="font-medium text-foreground">{analysis?.domain}</span>
          <a 
            href={`https://${analysis?.domain}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </p>
      </div>

      {/* Score Display - All 3 scores prominently shown */}
      <Card className="p-6 mb-6">
        <div className="grid grid-cols-3 gap-8 justify-items-center">
          <div className="text-center">
            <SEOScoreDisplay score={analysis?.seoScore || 0} animate size="medium" />
            <h3 className="text-sm font-medium mt-2">SEO Score</h3>
            <p className="text-xs text-muted-foreground">Search Optimization</p>
          </div>
          <div className="text-center">
            <SEOScoreDisplay score={analysis?.aioScore || 0} animate size="medium" color="purple" />
            <h3 className="text-sm font-medium mt-2">AIO Score</h3>
            <p className="text-xs text-muted-foreground">AI Visibility</p>
          </div>
          <div className="text-center">
            <SEOScoreDisplay score={analysis?.combinedScore || 0} animate size="medium" color="emerald" />
            <h3 className="text-sm font-medium mt-2">Combined</h3>
            <p className="text-xs text-muted-foreground">Overall Visibility</p>
          </div>
        </div>
        
        {/* Issues summary */}
        <div className="mt-6 pt-4 border-t flex items-center justify-center gap-8 text-center">
          <div>
            <p className="text-xl font-bold text-red-500">{analysis?.issues.critical}</p>
            <p className="text-xs text-muted-foreground">Critical</p>
          </div>
          <div>
            <p className="text-xl font-bold text-yellow-500">{analysis?.issues.warnings}</p>
            <p className="text-xs text-muted-foreground">Warnings</p>
          </div>
          <div>
            <p className="text-xl font-bold text-green-500">{analysis?.issues.passed}</p>
            <p className="text-xs text-muted-foreground">Passed</p>
          </div>
          <div className="text-muted-foreground">|</div>
          <div>
            <p className="text-xl font-bold text-primary">{analysis?.pagesAnalyzed}</p>
            <p className="text-xs text-muted-foreground">Pages Analyzed</p>
          </div>
        </div>
      </Card>

      {/* Quick Wins and Top Fixes */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Wins</h3>
          {analysis?.quickWins && analysis.quickWins.length > 0 ? (
            <div className="space-y-3">
              {analysis.quickWins.map((win, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className={`p-2 rounded-lg ${
                    win.impact === "high" ? "bg-red-500/10 text-red-500" :
                    "bg-yellow-500/10 text-yellow-500"
                  }`}>
                    <QuickWinIcon type={win.type} />
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
          ) : (
            <p className="text-muted-foreground text-sm">No immediate issues found. Great job!</p>
          )}
        </Card>

        {/* Top AIO Fixes */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            Top AI Visibility Fixes
          </h3>
          {analysis?.topAioFixes && analysis.topAioFixes.length > 0 ? (
            <div className="space-y-3">
              {analysis.topAioFixes.slice(0, 5).map((fix, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-purple-500/5">
                  <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-500 flex items-center justify-center text-sm font-medium">
                    {i + 1}
                  </div>
                  <p className="text-sm">{fix}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Your site is well optimized for AI visibility!</p>
          )}
        </Card>
      </div>

      {/* Keywords */}
      {analysis?.keywords && analysis.keywords.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Keyword Opportunities
            </h3>
            <Badge variant="secondary">{analysis.keywords.length} found</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-muted-foreground border-b">
                  <th className="pb-3 font-medium">Keyword</th>
                  <th className="pb-3 font-medium">Volume</th>
                  <th className="pb-3 font-medium">Difficulty</th>
                  <th className="pb-3 font-medium">Opportunity</th>
                </tr>
              </thead>
              <tbody>
                {analysis.keywords.map((kw, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-3 font-medium">{kw.keyword}</td>
                    <td className="py-3 text-muted-foreground">
                      {kw.volume.toLocaleString()}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <Progress value={kw.difficulty} className="h-2 w-16" />
                        <span className="text-sm text-muted-foreground">{kw.difficulty}</span>
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
      )}

      {/* Content Ideas */}
      {analysis?.contentIdeas && analysis.contentIdeas.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              AI Content Ideas
            </h3>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {analysis.contentIdeas.map((idea, i) => (
              <Card key={i} className="p-4 hover:shadow-md transition-shadow cursor-pointer group border-dashed">
                <h4 className="font-medium mb-2 group-hover:text-primary transition-colors line-clamp-2">
                  {idea.title}
                </h4>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="w-4 h-4" />
                  <span>{idea.trafficPotential.toLocaleString()} potential visits/mo</span>
                </div>
                <Badge variant="outline" className="mt-2">
                  {idea.keyword}
                </Badge>
              </Card>
            ))}
          </div>
        </Card>
      )}

      {/* CTA - Push to Subscribe */}
      <Card className="p-8 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-emerald-500/20 rounded-xl">
            <Sparkles className="w-8 h-8 text-emerald-400" />
          </div>
          <h3 className="text-2xl font-bold">Ready to rank higher?</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Choose a plan to unlock AI content generation, keyword tracking, and full SEO optimization tools.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button 
              size="lg" 
              className="gap-2 px-8 bg-emerald-600 hover:bg-emerald-500" 
              onClick={() => router.push("/pricing")}
            >
              <Sparkles className="w-5 h-5" />
              Choose Your Plan
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="gap-2"
              onClick={() => router.push("/analyze")}
            >
              Try Free Analyzer
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-sm text-zinc-500 pt-2">
            Starting at <span className="text-emerald-400 font-semibold">$29/month</span> · Cancel anytime
          </p>
        </div>
      </Card>
    </div>
  );
}
