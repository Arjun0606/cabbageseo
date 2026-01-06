"use client";

/**
 * GEO Intelligence Page
 * 
 * The $100k features:
 * - GEO Score (how AI-friendly your site is)
 * - "Why Not Me?" Analysis - why competitors get cited
 * - Content Recommendations - what to publish next
 * - Weekly Action Plan - your AI search to-do list (Pro)
 * - Competitor Deep Dive - full competitor analysis (Pro)
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
  Zap,
  HelpCircle,
  FileText,
  Calendar,
  Users,
  Sparkles,
  Crown,
  CheckCircle
} from "lucide-react";
import { useSite } from "@/context/site-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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

// Intelligence action results
interface GapAnalysisResult {
  whyNotYou: string[];
  missingElements: string[];
  actionItems: string[];
  confidence: string;
}

interface ContentRecommendation {
  title: string;
  description: string;
  targetQueries: string[];
  priority: string;
  rationale: string;
}

export default function IntelligencePage() {
  const { currentSite, organization, loading } = useSite();
  const [analysis, setAnalysis] = useState<GEOAnalysis | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  
  // Intelligence features state
  const [gapAnalysis, setGapAnalysis] = useState<GapAnalysisResult | null>(null);
  const [contentIdeas, setContentIdeas] = useState<ContentRecommendation[]>([]);
  const [loadingGap, setLoadingGap] = useState(false);
  const [loadingContent, setLoadingContent] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [actionPlan, setActionPlan] = useState<{ summary: string; priorities: Array<{ title: string; description: string; impact: string }> } | null>(null);
  const [intelligenceUsage, setIntelligenceUsage] = useState<{ gapRemaining: number | string; contentRemaining: number | string } | null>(null);

  const plan = organization?.plan || "free";
  const isPaid = plan !== "free";
  const isPro = plan === "pro";

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

  // Fetch intelligence usage limits
  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const res = await fetch("/api/geo/intelligence/actions");
        if (res.ok) {
          const data = await res.json();
          setIntelligenceUsage({
            gapRemaining: data.features?.gapAnalysis?.remaining ?? 0,
            contentRemaining: data.features?.contentRecommendations?.remaining ?? 0,
          });
        }
      } catch (err) {
        console.error("Failed to fetch usage:", err);
      }
    };
    if (isPaid) fetchUsage();
  }, [isPaid]);

  // Run "Why Not Me?" analysis
  const runGapAnalysis = async (query: string) => {
    if (!currentSite) return;
    
    setLoadingGap(true);
    try {
      const res = await fetch("/api/geo/intelligence/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "gap-analysis",
          siteId: currentSite.id,
          query,
        }),
      });
      const result = await res.json();
      if (result.success) {
        setGapAnalysis(result.data);
        if (result.remaining !== undefined) {
          setIntelligenceUsage(prev => ({ ...prev!, gapRemaining: result.remaining }));
        }
      } else if (result.upgradeRequired) {
        alert(result.error);
      }
    } catch (err) {
      console.error("Gap analysis failed:", err);
    } finally {
      setLoadingGap(false);
    }
  };

  // Get content recommendations
  const getContentIdeas = async () => {
    if (!currentSite) return;
    
    setLoadingContent(true);
    try {
      const res = await fetch("/api/geo/intelligence/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "content-recommendations",
          siteId: currentSite.id,
        }),
      });
      const result = await res.json();
      if (result.success) {
        setContentIdeas(result.data || []);
        if (result.remaining !== undefined) {
          setIntelligenceUsage(prev => ({ ...prev!, contentRemaining: result.remaining }));
        }
      } else if (result.upgradeRequired) {
        alert(result.error);
      }
    } catch (err) {
      console.error("Content ideas failed:", err);
    } finally {
      setLoadingContent(false);
    }
  };

  // Get weekly action plan (Pro only)
  const getActionPlan = async () => {
    if (!currentSite) return;
    
    setLoadingAction(true);
    try {
      const res = await fetch("/api/geo/intelligence/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "action-plan",
          siteId: currentSite.id,
        }),
      });
      const result = await res.json();
      if (result.success) {
        setActionPlan(result.data);
      } else if (result.upgradeRequired) {
        alert(result.error);
      }
    } catch (err) {
      console.error("Action plan failed:", err);
    } finally {
      setLoadingAction(false);
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
                      <div className="flex items-center gap-2">
                        {isPaid && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs"
                            onClick={() => runGapAnalysis(query.query)}
                            disabled={loadingGap}
                          >
                            <HelpCircle className="w-3 h-3 mr-1" />
                            Why not me?
                          </Button>
                        )}
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

          {/* ============================================ */}
          {/* INTELLIGENCE ACTIONS - The $100k Features */}
          {/* ============================================ */}
          
          <div className="border-t border-zinc-800 pt-6">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-5 h-5 text-violet-400" />
              <h2 className="text-xl font-bold text-white">Citation Intelligence</h2>
              {isPro && <Badge className="bg-violet-500/20 text-violet-400">Pro</Badge>}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* "Why Not Me?" Analysis */}
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2 text-base">
                    <HelpCircle className="w-5 h-5 text-amber-400" />
                    "Why Not Me?" Analysis
                  </CardTitle>
                  <CardDescription className="text-zinc-500">
                    Understand why AI cites competitors instead of you
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!isPaid ? (
                    <div className="text-center py-4">
                      <Lock className="w-6 h-6 text-zinc-500 mx-auto mb-2" />
                      <p className="text-sm text-zinc-500 mb-3">Requires Starter plan</p>
                      <Link href="/settings/billing">
                        <Button size="sm" className="bg-emerald-500 hover:bg-emerald-400 text-black">
                          Upgrade
                        </Button>
                      </Link>
                    </div>
                  ) : gapAnalysis ? (
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-zinc-400 mb-2">Why competitors win:</h4>
                        <ul className="space-y-1">
                          {gapAnalysis.whyNotYou.map((reason, i) => (
                            <li key={i} className="text-sm text-zinc-300 flex items-start gap-2">
                              <span className="text-red-400 mt-0.5">•</span>
                              {reason}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-zinc-400 mb-2">Action items:</h4>
                        <ul className="space-y-1">
                          {gapAnalysis.actionItems.map((item, i) => (
                            <li key={i} className="text-sm text-zinc-300 flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-zinc-500 mb-3">
                        Click "Why not me?" on any query above to analyze
                      </p>
                      {intelligenceUsage && (
                        <p className="text-xs text-zinc-600">
                          {intelligenceUsage.gapRemaining === "unlimited" 
                            ? "Unlimited analyses" 
                            : `${intelligenceUsage.gapRemaining} analyses remaining this month`}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Content Recommendations */}
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2 text-base">
                    <FileText className="w-5 h-5 text-blue-400" />
                    What to Publish Next
                  </CardTitle>
                  <CardDescription className="text-zinc-500">
                    Content ideas to increase AI citations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!isPaid ? (
                    <div className="text-center py-4">
                      <Lock className="w-6 h-6 text-zinc-500 mx-auto mb-2" />
                      <p className="text-sm text-zinc-500 mb-3">Requires Starter plan</p>
                      <Link href="/settings/billing">
                        <Button size="sm" className="bg-emerald-500 hover:bg-emerald-400 text-black">
                          Upgrade
                        </Button>
                      </Link>
                    </div>
                  ) : contentIdeas.length > 0 ? (
                    <div className="space-y-3">
                      {contentIdeas.slice(0, 3).map((idea, i) => (
                        <div key={i} className="p-3 bg-zinc-800/50 rounded-lg">
                          <h4 className="font-medium text-white text-sm">{idea.title}</h4>
                          <p className="text-xs text-zinc-500 mt-1">{idea.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={`text-xs ${
                              idea.priority === "high" 
                                ? "bg-red-500/20 text-red-400" 
                                : "bg-blue-500/20 text-blue-400"
                            }`}>
                              {idea.priority} priority
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <Button
                        onClick={getContentIdeas}
                        disabled={loadingContent}
                        size="sm"
                        className="bg-blue-500 hover:bg-blue-400 text-white"
                      >
                        {loadingContent ? (
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4 mr-2" />
                        )}
                        Generate Ideas
                      </Button>
                      {intelligenceUsage && (
                        <p className="text-xs text-zinc-600 mt-2">
                          {intelligenceUsage.contentRemaining === "unlimited" 
                            ? "Unlimited ideas" 
                            : `${intelligenceUsage.contentRemaining} ideas remaining this month`}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Weekly Action Plan - Pro Only */}
            <Card className="bg-zinc-900 border-zinc-800 mt-6">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-violet-400" />
                  Weekly Action Playbook
                  {!isPro && <Badge className="bg-violet-500/20 text-violet-400">Pro</Badge>}
                </CardTitle>
                <CardDescription className="text-zinc-500">
                  Your personalized AI search to-do list for this week
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!isPro ? (
                  <div className="text-center py-6">
                    <Crown className="w-8 h-8 text-violet-400 mx-auto mb-3" />
                    <h3 className="font-semibold text-white mb-2">Pro Feature</h3>
                    <p className="text-sm text-zinc-500 mb-4 max-w-md mx-auto">
                      Get a weekly action plan with prioritized tasks to beat your competitors in AI search
                    </p>
                    <Link href="/settings/billing">
                      <Button className="bg-violet-500 hover:bg-violet-400 text-white">
                        Upgrade to Pro
                      </Button>
                    </Link>
                  </div>
                ) : actionPlan ? (
                  <div className="space-y-4">
                    <p className="text-zinc-300">{actionPlan.summary}</p>
                    <div className="space-y-3">
                      {actionPlan.priorities.map((priority, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-zinc-800/50 rounded-lg">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                            priority.impact === "high" ? "bg-red-500/20 text-red-400" :
                            priority.impact === "medium" ? "bg-amber-500/20 text-amber-400" :
                            "bg-blue-500/20 text-blue-400"
                          }`}>
                            {i + 1}
                          </div>
                          <div>
                            <h4 className="font-medium text-white">{priority.title}</h4>
                            <p className="text-sm text-zinc-500">{priority.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Button
                      onClick={getActionPlan}
                      disabled={loadingAction}
                      className="bg-violet-500 hover:bg-violet-400 text-white"
                    >
                      {loadingAction ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Calendar className="w-4 h-4 mr-2" />
                      )}
                      Generate This Week's Plan
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
