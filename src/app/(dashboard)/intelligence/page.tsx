"use client";

/**
 * ============================================
 * INTELLIGENCE PAGE - GEO Score & Tips
 * ============================================
 * 
 * Shows:
 * - GEO Score with breakdown
 * - Actionable tips
 * - Query intelligence
 * - Citation opportunities
 */

import { useState, useEffect } from "react";
import {
  Loader2,
  Brain,
  Lightbulb,
  Search,
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  BarChart3,
  Zap,
  BookOpen,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSite } from "@/context/site-context";

interface GEOScore {
  overall: number;
  breakdown: {
    contentClarity: number;
    authoritySignals: number;
    structuredData: number;
    citability: number;
    freshness: number;
    topicalDepth: number;
  } | null;
  grade: string;
  summary: string;
}

interface Tip {
  id: string;
  category: string;
  priority: string;
  title: string;
  description: string;
  impact: string;
  example?: string;
}

interface QueryIntel {
  query: string;
  searchVolume: string;
  yourPosition: string;
  opportunity: boolean;
}

interface Opportunity {
  query: string;
  competitor: string;
  platform: string;
  suggestedAction: string;
  difficulty: string;
}

export default function IntelligencePage() {
  const { currentSite, loading: siteLoading } = useSite();
  
  const [score, setScore] = useState<GEOScore | null>(null);
  const [tips, setTips] = useState<Tip[]>([]);
  const [queries, setQueries] = useState<QueryIntel[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [needsAnalysis, setNeedsAnalysis] = useState(true);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  // Load existing analysis
  useEffect(() => {
    async function loadAnalysis() {
      if (!currentSite?.id) return;
      
      setLoading(true);
      try {
        const res = await fetch(`/api/geo/intelligence?siteId=${currentSite.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            setScore(data.data.score);
            setTips(data.data.tips || []);
            setQueries(data.data.queries || []);
            setOpportunities(data.data.opportunities || []);
            setNeedsAnalysis(data.data.needsAnalysis || false);
          }
        }
      } catch (err) {
        console.error("Failed to load analysis:", err);
      } finally {
        setLoading(false);
      }
    }
    
    loadAnalysis();
  }, [currentSite?.id]);

  // Run new analysis
  const runAnalysis = async () => {
    if (!currentSite?.id) return;
    
    setAnalyzing(true);
    try {
      const res = await fetch("/api/geo/intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId: currentSite.id }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setScore(data.data.score);
          setTips(data.data.tips || []);
          setQueries(data.data.queries || []);
          setOpportunities(data.data.opportunities || []);
          setNeedsAnalysis(false);
        }
      }
    } catch (err) {
      console.error("Analysis failed:", err);
    } finally {
      setAnalyzing(false);
    }
  };

  // Loading state
  if (siteLoading || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-4" />
          <p className="text-zinc-500">Loading GEO Intelligence...</p>
        </div>
      </div>
    );
  }

  // No site
  if (!currentSite) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Brain className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">No Site Selected</h2>
          <p className="text-zinc-400">Add a website from the Dashboard to analyze.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Brain className="w-7 h-7 text-emerald-500" />
            GEO Intelligence
          </h1>
          <p className="text-zinc-400 mt-1">
            Understand why AI does (or doesn&apos;t) cite {currentSite.domain}
          </p>
        </div>
        <Button
          onClick={runAnalysis}
          disabled={analyzing}
          className="bg-emerald-600 hover:bg-emerald-500"
        >
          {analyzing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              {needsAnalysis ? "Run Analysis" : "Refresh Analysis"}
            </>
          )}
        </Button>
      </div>

      {/* Needs Analysis Prompt */}
      {needsAnalysis && !analyzing && (
        <Card className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border-emerald-500/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                <Brain className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Run Your First GEO Analysis</h3>
                <p className="text-zinc-400 text-sm mb-3">
                  Get your GEO Score, actionable tips, query intelligence, and discover citation opportunities.
                </p>
                <Button onClick={runAnalysis} size="sm" className="bg-emerald-600 hover:bg-emerald-500">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Analyze Now
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* GEO Score Card */}
      {score && (
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-500" />
              GEO Score
            </CardTitle>
            <CardDescription>How AI-friendly is your content?</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Overall Score */}
              <div className="text-center">
                <div className="relative inline-flex items-center justify-center w-32 h-32">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-zinc-800"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${(score.overall / 100) * 352} 352`}
                      className={
                        score.overall >= 75 ? "text-emerald-500" :
                        score.overall >= 50 ? "text-yellow-500" :
                        "text-red-500"
                      }
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-white">{score.overall}</span>
                    <span className="text-lg font-bold text-zinc-400">/ 100</span>
                  </div>
                </div>
                <div className="mt-2">
                  <Badge className={
                    score.grade === "A" ? "bg-emerald-500" :
                    score.grade === "B" ? "bg-blue-500" :
                    score.grade === "C" ? "bg-yellow-500" :
                    "bg-red-500"
                  }>
                    Grade: {score.grade}
                  </Badge>
                </div>
                <p className="text-sm text-zinc-400 mt-2">{score.summary}</p>
              </div>

              {/* Breakdown */}
              {score.breakdown && (
                <div className="space-y-3">
                  {[
                    { key: "contentClarity", label: "Content Clarity", icon: BookOpen },
                    { key: "authoritySignals", label: "Authority Signals", icon: CheckCircle2 },
                    { key: "structuredData", label: "Structured Data", icon: BarChart3 },
                    { key: "citability", label: "Citability", icon: Target },
                    { key: "freshness", label: "Freshness", icon: Zap },
                    { key: "topicalDepth", label: "Topical Depth", icon: Brain },
                  ].map((item) => {
                    const value = score.breakdown![item.key as keyof typeof score.breakdown];
                    const Icon = item.icon;
                    return (
                      <div key={item.key}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-zinc-400 flex items-center gap-1.5">
                            <Icon className="w-3.5 h-3.5" />
                            {item.label}
                          </span>
                          <span className="text-white font-medium">{value}</span>
                        </div>
                        <Progress value={value} className="h-2 bg-zinc-800" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs for Tips, Queries, Opportunities */}
      <Tabs defaultValue="tips" className="space-y-4">
        <TabsList className="bg-zinc-900 border border-zinc-800">
          <TabsTrigger value="tips" className="data-[state=active]:bg-emerald-600">
            <Lightbulb className="w-4 h-4 mr-2" />
            Tips ({tips.length})
          </TabsTrigger>
          <TabsTrigger value="queries" className="data-[state=active]:bg-emerald-600">
            <Search className="w-4 h-4 mr-2" />
            Queries ({queries.length})
          </TabsTrigger>
          <TabsTrigger value="opportunities" className="data-[state=active]:bg-emerald-600">
            <Target className="w-4 h-4 mr-2" />
            Opportunities ({opportunities.length})
          </TabsTrigger>
        </TabsList>

        {/* Tips Tab */}
        <TabsContent value="tips" className="space-y-3">
          {tips.length === 0 ? (
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardContent className="py-8 text-center">
                <Lightbulb className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                <p className="text-zinc-400">Run an analysis to get personalized GEO tips</p>
              </CardContent>
            </Card>
          ) : (
            tips.map((tip) => (
              <Card key={tip.id} className="bg-zinc-900/50 border-zinc-800">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      tip.priority === "high" ? "bg-red-500/10" :
                      tip.priority === "medium" ? "bg-yellow-500/10" :
                      "bg-zinc-800"
                    }`}>
                      {tip.priority === "high" ? (
                        <AlertCircle className="w-4 h-4 text-red-400" />
                      ) : tip.priority === "medium" ? (
                        <TrendingUp className="w-4 h-4 text-yellow-400" />
                      ) : (
                        <Lightbulb className="w-4 h-4 text-zinc-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-white">{tip.title}</h4>
                        <Badge variant="outline" className={
                          tip.priority === "high" ? "border-red-500/50 text-red-400" :
                          tip.priority === "medium" ? "border-yellow-500/50 text-yellow-400" :
                          "border-zinc-700 text-zinc-500"
                        }>
                          {tip.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-zinc-400 mb-2">{tip.description}</p>
                      <p className="text-xs text-emerald-400">Impact: {tip.impact}</p>
                      {tip.example && (
                        <p className="text-xs text-zinc-500 mt-2 p-2 bg-zinc-800/50 rounded">
                          💡 {tip.example}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Queries Tab */}
        <TabsContent value="queries" className="space-y-3">
          {queries.length === 0 ? (
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardContent className="py-8 text-center">
                <Search className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                <p className="text-zinc-400">Run an analysis to discover queries in your niche</p>
              </CardContent>
            </Card>
          ) : (
            queries.map((q, i) => (
              <Card key={i} className={`bg-zinc-900/50 border-zinc-800 ${
                q.opportunity ? "border-l-2 border-l-emerald-500" : ""
              }`}>
                <CardContent className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{q.query}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={
                          q.searchVolume === "high" ? "border-emerald-500/50 text-emerald-400" :
                          q.searchVolume === "medium" ? "border-yellow-500/50 text-yellow-400" :
                          "border-zinc-700 text-zinc-500"
                        }>
                          {q.searchVolume} volume
                        </Badge>
                        {q.yourPosition === "cited" ? (
                          <Badge className="bg-emerald-500/10 text-emerald-400 border-0">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            You&apos;re cited!
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-500/10 text-yellow-400 border-0">
                            Opportunity
                          </Badge>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-zinc-600" />
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Opportunities Tab */}
        <TabsContent value="opportunities" className="space-y-3">
          {opportunities.length === 0 ? (
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardContent className="py-8 text-center">
                <Target className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                <p className="text-zinc-400">
                  {needsAnalysis 
                    ? "Run an analysis to find citation opportunities" 
                    : "Add competitors to discover citation gaps"}
                </p>
              </CardContent>
            </Card>
          ) : (
            opportunities.map((opp, i) => (
              <Card key={i} className="bg-zinc-900/50 border-zinc-800">
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-white font-medium">{opp.query}</p>
                        <p className="text-sm text-zinc-500">
                          {opp.competitor} is cited on {opp.platform}
                        </p>
                      </div>
                      <Badge variant="outline" className={
                        opp.difficulty === "easy" ? "border-emerald-500/50 text-emerald-400" :
                        opp.difficulty === "medium" ? "border-yellow-500/50 text-yellow-400" :
                        "border-red-500/50 text-red-400"
                      }>
                        {opp.difficulty}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Lightbulb className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="text-emerald-400">{opp.suggestedAction}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
