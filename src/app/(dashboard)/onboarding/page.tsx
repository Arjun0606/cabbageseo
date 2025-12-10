"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Globe,
  Zap,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Sparkles,
  Target,
  FileText,
  Link2,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Layers,
  Search,
  Clock,
  Rocket,
} from "lucide-react";

// Analysis phases
const ANALYSIS_PHASES = [
  { id: "crawl", label: "Crawling your site", duration: 3000 },
  { id: "analyze", label: "Analyzing content & structure", duration: 4000 },
  { id: "keywords", label: "Discovering keyword opportunities", duration: 3000 },
  { id: "competitors", label: "Analyzing top competitors", duration: 3000 },
  { id: "content", label: "Generating content plan", duration: 2000 },
  { id: "links", label: "Finding internal link opportunities", duration: 2000 },
  { id: "score", label: "Calculating SEO score", duration: 1000 },
];

// Mock analysis results
const mockResults = {
  seoScore: 67,
  metrics: {
    pagesFound: 47,
    indexedPages: 42,
    avgLoadTime: 2.3,
    mobileScore: 78,
  },
  topIssues: [
    { type: "critical", count: 3, label: "Missing meta descriptions" },
    { type: "warning", count: 8, label: "Thin content pages" },
    { type: "info", count: 12, label: "Missing alt tags" },
  ],
  keywordOpportunities: [
    { keyword: "your main topic", volume: 5400, difficulty: 42, potential: "high" },
    { keyword: "related keyword 1", volume: 2900, difficulty: 38, potential: "high" },
    { keyword: "related keyword 2", volume: 1800, difficulty: 45, potential: "medium" },
    { keyword: "long tail keyword", volume: 890, difficulty: 28, potential: "high" },
    { keyword: "another opportunity", volume: 650, difficulty: 35, potential: "medium" },
  ],
  contentPlan: [
    { title: "Complete Guide to [Your Topic]", type: "Pillar", priority: 1 },
    { title: "How to [Solve Main Problem]", type: "How-to", priority: 2 },
    { title: "Best [Your Category] in 2024", type: "Listicle", priority: 3 },
    { title: "[Your Topic] vs [Competitor]", type: "Comparison", priority: 4 },
  ],
  internalLinks: [
    { from: "/blog/post-1", to: "/services", anchor: "our services", impact: "high" },
    { from: "/about", to: "/blog/case-study", anchor: "case study", impact: "medium" },
    { from: "/services", to: "/blog/how-to", anchor: "learn more", impact: "high" },
  ],
  estimatedTraffic: {
    current: 1250,
    potential: 8500,
    growth: "+580%",
  },
};

function SEOScoreRing({ score, size = 200 }: { score: number; size?: number }) {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;
  
  const getScoreColor = (s: number) => {
    if (s >= 80) return { stroke: "#22c55e", bg: "from-green-500/20 to-green-600/5" };
    if (s >= 60) return { stroke: "#eab308", bg: "from-yellow-500/20 to-yellow-600/5" };
    if (s >= 40) return { stroke: "#f97316", bg: "from-orange-500/20 to-orange-600/5" };
    return { stroke: "#ef4444", bg: "from-red-500/20 to-red-600/5" };
  };
  
  const colors = getScoreColor(score);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          className="text-slate-200 dark:text-slate-700"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="transition-all duration-1000 ease-out"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke={colors.stroke}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className={`absolute inset-4 rounded-full bg-gradient-to-br ${colors.bg} flex flex-col items-center justify-center`}>
        <span className="text-5xl font-bold" style={{ color: colors.stroke }}>{score}</span>
        <span className="text-sm text-slate-500 font-medium">SEO Score</span>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [animatedScore, setAnimatedScore] = useState(0);

  const handleAnalyze = async () => {
    if (!url.trim()) return;
    
    setIsAnalyzing(true);
    setCurrentPhase(0);
    setProgress(0);
    
    // Simulate analysis phases
    let totalTime = 0;
    for (let i = 0; i < ANALYSIS_PHASES.length; i++) {
      setCurrentPhase(i);
      const phase = ANALYSIS_PHASES[i];
      const startProgress = (totalTime / 18000) * 100;
      totalTime += phase.duration;
      const endProgress = (totalTime / 18000) * 100;
      
      // Animate progress
      const steps = 20;
      for (let j = 0; j <= steps; j++) {
        await new Promise(r => setTimeout(r, phase.duration / steps));
        setProgress(startProgress + ((endProgress - startProgress) * j) / steps);
      }
    }
    
    setIsAnalyzing(false);
    setShowResults(true);
    
    // Animate score
    for (let i = 0; i <= mockResults.seoScore; i++) {
      await new Promise(r => setTimeout(r, 20));
      setAnimatedScore(i);
    }
  };

  const handleContinue = () => {
    router.push("/dashboard");
  };

  if (showResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cabbage-50 dark:from-slate-950 dark:via-slate-900 dark:to-cabbage-950">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 mb-4">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">Analysis Complete!</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Here's your SEO snapshot
            </h1>
            <p className="text-slate-500">
              We analyzed <span className="font-medium text-slate-700 dark:text-slate-300">{url}</span> and found some exciting opportunities
            </p>
          </div>

          {/* Main Score Card - THE VIRAL SCREENSHOT */}
          <Card className="mb-8 overflow-hidden border-2 border-cabbage-200 dark:border-cabbage-800 shadow-2xl shadow-cabbage-500/10">
            <CardContent className="p-0">
              <div className="grid md:grid-cols-2">
                {/* Score Section */}
                <div className="p-8 flex flex-col items-center justify-center bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
                  <SEOScoreRing score={animatedScore} />
                  <div className="mt-6 text-center">
                    <p className="text-lg font-semibold text-slate-900 dark:text-white">
                      {animatedScore >= 80 ? "Excellent!" : 
                       animatedScore >= 60 ? "Good, but can be better" : 
                       animatedScore >= 40 ? "Needs improvement" : 
                       "Critical issues found"}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      You're ahead of {Math.min(animatedScore + 10, 95)}% of websites in your industry
                    </p>
                  </div>
                </div>
                
                {/* Quick Stats */}
                <div className="p-8 bg-slate-50 dark:bg-slate-800/50 border-l border-slate-200 dark:border-slate-700">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-cabbage-600" />
                    Quick Stats
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">{mockResults.metrics.pagesFound}</p>
                      <p className="text-sm text-slate-500">Pages found</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">{mockResults.metrics.indexedPages}</p>
                      <p className="text-sm text-slate-500">Indexed</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">{mockResults.metrics.avgLoadTime}s</p>
                      <p className="text-sm text-slate-500">Avg load time</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">{mockResults.metrics.mobileScore}</p>
                      <p className="text-sm text-slate-500">Mobile score</p>
                    </div>
                  </div>
                  
                  {/* Traffic Potential */}
                  <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-cabbage-500 to-cabbage-600 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm opacity-90">Traffic Potential</p>
                        <p className="text-3xl font-bold">{mockResults.estimatedTraffic.potential.toLocaleString()}</p>
                        <p className="text-sm opacity-90">monthly visitors</p>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-white/20 text-white border-0 text-lg px-3 py-1">
                          {mockResults.estimatedTraffic.growth}
                        </Badge>
                        <p className="text-xs opacity-75 mt-1">growth potential</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Three Column Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {/* Issues Found */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Issues to Fix
                </h3>
                <div className="space-y-3">
                  {mockResults.topIssues.map((issue, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        issue.type === "critical" ? "bg-red-500" :
                        issue.type === "warning" ? "bg-yellow-500" : "bg-blue-500"
                      }`} />
                      <span className="text-sm text-slate-600 dark:text-slate-400 flex-1">{issue.label}</span>
                      <Badge variant="secondary">{issue.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Keyword Opportunities */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5 text-cabbage-600" />
                  Keyword Opportunities
                </h3>
                <div className="space-y-3">
                  {mockResults.keywordOpportunities.slice(0, 4).map((kw, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400 truncate flex-1">{kw.keyword}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">{kw.volume}</span>
                        <Badge variant={kw.potential === "high" ? "default" : "secondary"} className="text-xs">
                          {kw.difficulty}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-3">+{mockResults.keywordOpportunities.length - 4} more opportunities</p>
              </CardContent>
            </Card>

            {/* Content Plan */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-600" />
                  AI Content Plan
                </h3>
                <div className="space-y-3">
                  {mockResults.contentPlan.map((content, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cabbage-500 to-cabbage-600 text-white text-xs flex items-center justify-center font-bold shrink-0">
                        {content.priority}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-slate-900 dark:text-white truncate">{content.title}</p>
                        <Badge variant="outline" className="text-xs mt-1">{content.type}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Internal Links Card */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Link2 className="h-5 w-5 text-blue-600" />
                Internal Link Opportunities
                <Badge className="ml-auto">One-Click Fix</Badge>
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                {mockResults.internalLinks.map((link, i) => (
                  <div key={i} className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                      <span className="truncate">{link.from}</span>
                      <ArrowRight className="h-3 w-3 shrink-0" />
                      <span className="truncate">{link.to}</span>
                    </div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">"{link.anchor}"</p>
                    <Badge variant={link.impact === "high" ? "default" : "secondary"} className="mt-2 text-xs">
                      {link.impact} impact
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="text-center">
            <Button size="lg" onClick={handleContinue} className="gap-2 text-lg px-8 h-14">
              <Rocket className="h-5 w-5" />
              Start Optimizing
              <ArrowRight className="h-5 w-5" />
            </Button>
            <p className="text-sm text-slate-500 mt-4">
              Your personalized SEO roadmap is ready. Let's make it happen.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cabbage-50 dark:from-slate-950 dark:via-slate-900 dark:to-cabbage-950 flex items-center justify-center">
      <div className="w-full max-w-2xl mx-auto px-4">
        {!isAnalyzing ? (
          /* Initial State - URL Input */
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cabbage-100 text-cabbage-700 dark:bg-cabbage-900 dark:text-cabbage-300">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-medium">AI-Powered Analysis</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white">
                Let's analyze your site
              </h1>
              <p className="text-xl text-slate-500 max-w-md mx-auto">
                Paste your URL and watch the magic happen in 30 seconds
              </p>
            </div>

            <div className="relative max-w-xl mx-auto">
              <div className="absolute inset-0 bg-gradient-to-r from-cabbage-500 to-cabbage-600 rounded-2xl blur-xl opacity-20" />
              <div className="relative bg-white dark:bg-slate-800 rounded-2xl p-2 shadow-2xl border border-slate-200 dark:border-slate-700">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                      placeholder="https://yourwebsite.com"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                      className="pl-12 h-14 text-lg border-0 bg-transparent focus-visible:ring-0"
                    />
                  </div>
                  <Button 
                    size="lg" 
                    onClick={handleAnalyze}
                    disabled={!url.trim()}
                    className="h-14 px-8 text-lg"
                  >
                    <Zap className="mr-2 h-5 w-5" />
                    Analyze
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-8 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>30 second analysis</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span>Instant insights</span>
              </div>
            </div>
          </div>
        ) : (
          /* Analyzing State */
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <div className="relative inline-flex">
                <div className="absolute inset-0 bg-cabbage-500 rounded-full blur-2xl opacity-30 animate-pulse" />
                <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-cabbage-500 to-cabbage-600 flex items-center justify-center">
                  <Loader2 className="h-12 w-12 text-white animate-spin" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Analyzing {url}
              </h2>
            </div>

            {/* Progress Bar */}
            <div className="max-w-md mx-auto space-y-4">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-slate-500">
                {Math.round(progress)}% complete
              </p>
            </div>

            {/* Phase Indicators */}
            <div className="max-w-md mx-auto space-y-3">
              {ANALYSIS_PHASES.map((phase, i) => (
                <div 
                  key={phase.id}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                    i < currentPhase 
                      ? "bg-green-50 dark:bg-green-950" 
                      : i === currentPhase 
                        ? "bg-cabbage-50 dark:bg-cabbage-950" 
                        : "bg-slate-50 dark:bg-slate-800/50"
                  }`}
                >
                  {i < currentPhase ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                  ) : i === currentPhase ? (
                    <Loader2 className="h-5 w-5 text-cabbage-600 animate-spin shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600 shrink-0" />
                  )}
                  <span className={`text-sm ${
                    i <= currentPhase 
                      ? "text-slate-900 dark:text-white font-medium" 
                      : "text-slate-400"
                  }`}>
                    {phase.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

