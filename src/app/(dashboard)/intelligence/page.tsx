"use client";

/**
 * GEO Intelligence Page
 * 
 * Shows:
 * - GEO Score (how AI-friendly your site is)
 * - Optimization tips
 * - Query intelligence (what AI answers about your niche)
 */

import { useState, useEffect } from "react";
import { 
  TrendingUp, 
  Lightbulb, 
  Search,
  RefreshCw,
  AlertCircle,
  Lock,
  ArrowUp,
  ArrowDown,
  Zap
} from "lucide-react";
import { useSite } from "@/context/site-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface GEOAnalysis {
  score: {
    overall: number;
    breakdown: {
      contentClarity: number;
      authoritySignals: number;
      structuredData: number;
      citability: number;
      freshness: number;
      topicalDepth: number;
    };
    grade: string;
    summary: string;
  };
  tips: Array<{
    id: string;
    category: string;
    priority: "high" | "medium" | "low";
    title: string;
    description: string;
    impact: string;
  }>;
  queries: Array<{
    query: string;
    searchVolume: string;
    yourPosition: string;
    opportunity: boolean;
  }>;
}

export default function IntelligencePage() {
  const { currentSite, organization, loading } = useSite();
  const [analysis, setAnalysis] = useState<GEOAnalysis | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  const plan = organization?.plan || "free";
  const isPaid = plan !== "free";

  // Fetch analysis
  useEffect(() => {
    if (!currentSite) return;
    
    const fetchAnalysis = async () => {
      setLoadingAnalysis(true);
      try {
        const res = await fetch(`/api/geo/intelligence?siteId=${currentSite.id}`);
        const result = await res.json();
        if (result.data?.score) {
          setAnalysis({
            score: result.data.score,
            tips: result.data.tips || [],
            queries: result.data.queries || [],
          });
        }
      } catch (err) {
        console.error("Failed to fetch analysis:", err);
      } finally {
        setLoadingAnalysis(false);
      }
    };

    fetchAnalysis();
  }, [currentSite]);

  // Run new analysis
  const runAnalysis = async () => {
    if (!currentSite) return;
    
    setAnalyzing(true);
    try {
      const res = await fetch("/api/geo/intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId: currentSite.id }),
      });
      const result = await res.json();
      if (result.data?.score) {
        setAnalysis({
          score: result.data.score,
          tips: result.data.tips || [],
          queries: result.data.queries || [],
        });
      }
    } catch (err) {
      console.error("Analysis failed:", err);
    } finally {
      setAnalyzing(false);
    }
  };

  // Get grade color
  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "A": return "text-emerald-400";
      case "B": return "text-blue-400";
      case "C": return "text-amber-400";
      case "D": return "text-orange-400";
      default: return "text-red-400";
    }
  };

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400";
    if (score >= 60) return "text-blue-400";
    if (score >= 40) return "text-amber-400";
    return "text-red-400";
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500/20 text-red-400";
      case "medium": return "bg-amber-500/20 text-amber-400";
      default: return "bg-blue-500/20 text-blue-400";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (!currentSite) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-zinc-500 mx-auto mb-4" />
          <p className="text-zinc-400">Add a site first</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">GEO Intelligence</h1>
          <p className="text-sm text-zinc-500">
            How AI-friendly is {currentSite.domain}?
          </p>
        </div>
        <Button 
          onClick={runAnalysis}
          disabled={analyzing}
          variant="outline"
          className="border-zinc-700"
        >
          {analyzing ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              Run Analysis
            </>
          )}
        </Button>
      </div>

      {loadingAnalysis ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin" />
        </div>
      ) : !analysis ? (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="py-12 text-center">
            <TrendingUp className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No analysis yet</h3>
            <p className="text-zinc-500 mb-4">
              Run an analysis to see your GEO Score and optimization tips
            </p>
            <Button 
              onClick={runAnalysis}
              disabled={analyzing}
              className="bg-emerald-500 hover:bg-emerald-400 text-black"
            >
              Run First Analysis
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* GEO Score Card */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="py-8">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                {/* Score circle */}
                <div className="text-center">
                  <div className="relative inline-flex items-center justify-center">
                    <svg className="w-40 h-40 transform -rotate-90">
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        fill="none"
                        stroke="#27272a"
                        strokeWidth="12"
                      />
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        fill="none"
                        stroke={analysis.score.overall >= 60 ? "#10b981" : "#f59e0b"}
                        strokeWidth="12"
                        strokeDasharray={`${(analysis.score.overall / 100) * 440} 440`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-5xl font-bold ${getScoreColor(analysis.score.overall)}`}>
                        {analysis.score.overall}
                      </span>
                      <span className={`text-2xl font-bold ${getGradeColor(analysis.score.grade)}`}>
                        {analysis.score.grade}
                      </span>
                    </div>
                  </div>
                  <p className="text-zinc-400 mt-4 max-w-xs mx-auto">
                    {analysis.score.summary}
                  </p>
                </div>

                {/* Breakdown */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-white mb-4">Score Breakdown</h4>
                  {Object.entries(analysis.score.breakdown).map(([key, value]) => {
                    // Format camelCase keys to readable text
                    const formatKey = (k: string) => k
                      .replace(/([A-Z])/g, ' $1')
                      .replace(/^./, (str) => str.toUpperCase())
                      .trim();
                    
                    return (
                      <div key={key}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-zinc-400">{formatKey(key)}</span>
                          <span className={`text-sm font-medium ${getScoreColor(value)}`}>
                            {value}/100
                          </span>
                        </div>
                        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              value >= 60 ? "bg-emerald-500" : "bg-amber-500"
                            }`}
                            style={{ width: `${value}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Optimization Tips */}
          {isPaid ? (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-amber-400" />
                  Optimization Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analysis.tips.length === 0 ? (
                  <p className="text-zinc-500 text-center py-4">
                    Great job! No major issues found.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {analysis.tips.map((tip) => (
                      <div 
                        key={tip.id}
                        className="p-4 bg-zinc-800/50 rounded-xl"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={getPriorityColor(tip.priority)}>
                                {tip.priority}
                              </Badge>
                              <span className="text-xs text-zinc-500">{tip.category}</span>
                            </div>
                            <h4 className="font-medium text-white mb-1">{tip.title}</h4>
                            <p className="text-sm text-zinc-400">{tip.description}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-xs text-emerald-400">{tip.impact}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="py-8 text-center">
                <Lock className="w-8 h-8 text-zinc-500 mx-auto mb-4" />
                <h3 className="font-semibold text-white mb-2">Optimization Tips</h3>
                <p className="text-zinc-500 mb-4">
                  Upgrade to see actionable tips to improve your AI visibility
                </p>
                <Link href="/settings/billing">
                  <Button className="bg-emerald-500 hover:bg-emerald-400 text-black">
                    Upgrade to Starter
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Query Intelligence */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Search className="w-5 h-5 text-blue-400" />
                Query Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analysis.queries.length === 0 ? (
                <p className="text-zinc-500 text-center py-4">
                  No queries discovered yet. Run an analysis to find opportunities.
                </p>
              ) : (
                <div className="space-y-3">
                  {analysis.queries.slice(0, 5).map((query, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="text-white">{query.query}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-zinc-500">
                            Volume: {query.searchVolume}
                          </span>
                          {query.opportunity && (
                            <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">
                              Opportunity
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-sm ${
                          query.yourPosition === "cited" 
                            ? "text-emerald-400" 
                            : query.yourPosition === "mentioned"
                            ? "text-amber-400"
                            : "text-zinc-500"
                        }`}>
                          {query.yourPosition}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
