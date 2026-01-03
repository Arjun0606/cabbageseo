"use client";

/**
 * Simplified GEO Dashboard
 * 
 * Focus on what matters for AI citations:
 * - GEO Score
 * - Citations count
 * - Autopilot status
 * - Quick wins
 * 
 * "Enter your URL. We get you cited by AI."
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSite } from "@/contexts/app-context";
import {
  Brain,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  CheckCircle2,
  AlertCircle,
  Play,
  Pause,
  RefreshCw,
  ExternalLink,
  Quote,
  Target,
  Rocket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

// ============================================
// GEO SCORE RING - The Hero Metric
// ============================================

function GEOScoreRing({ score, size = 200 }: { score: number; size?: number }) {
  const radius = (size - 24) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  
  const getColor = (s: number) => {
    if (s >= 80) return { stroke: "#10b981", text: "Excellent" };
    if (s >= 60) return { stroke: "#eab308", text: "Good" };
    if (s >= 40) return { stroke: "#f97316", text: "Needs Work" };
    return { stroke: "#ef4444", text: "Low" };
  };

  const { stroke, text } = getColor(score);

  return (
    <div className="relative flex flex-col items-center">
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#27272a"
          strokeWidth="16"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth="16"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-bold text-white">{score}</span>
        <span className="text-sm text-zinc-400 mt-1">GEO Score</span>
        <Badge 
          variant="outline" 
          className="mt-2"
          style={{ borderColor: stroke, color: stroke }}
        >
          {text}
        </Badge>
      </div>
    </div>
  );
}

// ============================================
// PLATFORM CARD
// ============================================

function PlatformCard({ 
  name, 
  score, 
  icon: Icon,
  color 
}: { 
  name: string; 
  score: number; 
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", color)}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1">
        <p className="text-sm text-zinc-400">{name}</p>
        <p className="text-xl font-semibold text-white">{score}</p>
      </div>
      <div className="w-20 h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-500"
          style={{ 
            width: `${score}%`,
            backgroundColor: score >= 70 ? "#10b981" : score >= 50 ? "#eab308" : "#ef4444"
          }}
        />
      </div>
    </div>
  );
}

// ============================================
// CITATION CARD
// ============================================

function CitationCard({ 
  platform, 
  query, 
  citedAt 
}: { 
  platform: string; 
  query: string; 
  citedAt: string;
}) {
  const platformColors: Record<string, string> = {
    perplexity: "bg-violet-500",
    chatgpt: "bg-emerald-500",
    google_aio: "bg-blue-500",
  };

  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
      <Quote className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white truncate">&ldquo;{query}&rdquo;</p>
        <div className="flex items-center gap-2 mt-1">
          <Badge className={cn("text-xs", platformColors[platform] || "bg-zinc-600")}>
            {platform}
          </Badge>
          <span className="text-xs text-zinc-500">{citedAt}</span>
        </div>
      </div>
    </div>
  );
}

// ============================================
// QUICK WIN CARD
// ============================================

function QuickWinCard({ 
  title, 
  impact 
}: { 
  title: string; 
  impact: "high" | "medium" | "low";
}) {
  const impactColors = {
    high: "text-emerald-500 bg-emerald-500/10",
    medium: "text-yellow-500 bg-yellow-500/10",
    low: "text-zinc-400 bg-zinc-500/10",
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900/30 border border-zinc-800/50">
      <Zap className={cn("w-4 h-4", impactColors[impact].split(" ")[0])} />
      <span className="text-sm text-zinc-300 flex-1">{title}</span>
      <Badge variant="outline" className={impactColors[impact]}>
        {impact}
      </Badge>
    </div>
  );
}

// ============================================
// MAIN DASHBOARD
// ============================================

export default function GEODashboardPage() {
  const { selectedSite } = useSite();
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch GEO data
  const { data: geoData, isLoading } = useQuery({
    queryKey: ["geo-dashboard", selectedSite?.id],
    queryFn: async () => {
      if (!selectedSite?.id) return null;
      const res = await fetch(`/api/geo/improvement?siteId=${selectedSite.id}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!selectedSite?.id,
  });

  // Fetch citations
  const { data: citationsData } = useQuery({
    queryKey: ["citations", selectedSite?.id],
    queryFn: async () => {
      if (!selectedSite?.id) return null;
      const res = await fetch(`/api/geo/citations?siteId=${selectedSite.id}`);
      if (!res.ok) return { citations: [] };
      return res.json();
    },
    enabled: !!selectedSite?.id,
  });

  // Toggle autopilot
  const toggleAutopilot = useMutation({
    mutationFn: async (enabled: boolean) => {
      const res = await fetch(`/api/sites/${selectedSite?.id}/autopilot`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      if (!res.ok) throw new Error("Failed to toggle");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["geo-dashboard"] });
    },
  });

  // Generate content now
  const generateNow = async () => {
    setIsGenerating(true);
    try {
      await fetch(`/api/geo/autopilot/run?siteId=${selectedSite?.id}`, {
        method: "POST",
      });
      queryClient.invalidateQueries({ queryKey: ["geo-dashboard"] });
    } finally {
      setIsGenerating(false);
    }
  };

  const improvement = geoData?.data?.improvement;
  const trend = geoData?.data?.trend || "stable";
  const current = geoData?.data?.current;
  const citations = citationsData?.citations || [];

  // Mock data for demo (remove in production)
  const geoScore = current?.overallScore || (selectedSite as any)?.geo_score_avg || 72;
  const platformScores = {
    chatgpt: current?.chatgptScore || 75,
    perplexity: current?.perplexityScore || 68,
    googleAio: current?.googleAioScore || 71,
  };

  const quickWins = [
    { title: "Add FAQ section to your top 5 pages", impact: "high" as const },
    { title: "Include expert quotes in articles", impact: "high" as const },
    { title: "Add structured data (FAQ Schema)", impact: "medium" as const },
    { title: "Update content with recent statistics", impact: "medium" as const },
  ];

  if (!selectedSite) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Brain className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">No Site Selected</h2>
          <p className="text-zinc-400">Add a site to start tracking your GEO performance</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Brain className="w-7 h-7 text-emerald-500" />
            GEO Dashboard
          </h1>
          <p className="text-zinc-400 mt-1">
            {selectedSite.domain} · AI Citation Optimization
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Autopilot Toggle */}
          <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800">
            <span className="text-sm text-zinc-400">Autopilot</span>
            <Switch
              checked={(selectedSite as any).autopilot_enabled || false}
              onCheckedChange={(checked) => toggleAutopilot.mutate(checked)}
            />
            {(selectedSite as any).autopilot_enabled ? (
              <Play className="w-4 h-4 text-emerald-500" />
            ) : (
              <Pause className="w-4 h-4 text-zinc-500" />
            )}
          </div>
          <Button
            onClick={generateNow}
            disabled={isGenerating}
            className="bg-emerald-600 hover:bg-emerald-500"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Now
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* GEO Score Card */}
        <Card className="lg:row-span-2 bg-gradient-to-br from-zinc-900 via-zinc-900 to-emerald-900/20 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Overall GEO Score</CardTitle>
            <CardDescription>
              How likely AI is to cite your content
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center pt-4">
            <GEOScoreRing score={geoScore} />
            
            {/* Trend */}
            <div className="flex items-center gap-2 mt-6">
              {trend === "up" && improvement && (
                <>
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                  <span className="text-emerald-500 font-medium">
                    +{improvement.overall} in {improvement.periodDays} days
                  </span>
                </>
              )}
              {trend === "down" && improvement && (
                <>
                  <TrendingDown className="w-5 h-5 text-red-500" />
                  <span className="text-red-500 font-medium">
                    {improvement.overall} in {improvement.periodDays} days
                  </span>
                </>
              )}
              {trend === "stable" && (
                <>
                  <Minus className="w-5 h-5 text-zinc-400" />
                  <span className="text-zinc-400">Stable</span>
                </>
              )}
            </div>

            {/* Platform Breakdown */}
            <div className="w-full mt-8 space-y-3">
              <PlatformCard 
                name="ChatGPT" 
                score={platformScores.chatgpt} 
                icon={Brain}
                color="bg-emerald-600"
              />
              <PlatformCard 
                name="Perplexity" 
                score={platformScores.perplexity} 
                icon={Target}
                color="bg-violet-600"
              />
              <PlatformCard 
                name="Google AI" 
                score={platformScores.googleAio} 
                icon={Rocket}
                color="bg-blue-600"
              />
            </div>
          </CardContent>
        </Card>

        {/* Citations Card */}
        <Card className="lg:col-span-2 bg-zinc-900/50 border-zinc-800">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Quote className="w-5 h-5 text-emerald-500" />
                  Recent Citations
                </CardTitle>
                <CardDescription>
                  When AI platforms cite your content
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-emerald-500 border-emerald-500">
                {citations.length} total
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {citations.length > 0 ? (
              <div className="space-y-3">
                {citations.slice(0, 5).map((citation: any, i: number) => (
                  <CitationCard
                    key={i}
                    platform={citation.platform}
                    query={citation.query}
                    citedAt={new Date(citation.cited_at).toLocaleDateString()}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Quote className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-400">No citations detected yet</p>
                <p className="text-sm text-zinc-500 mt-1">
                  Keep publishing GEO-optimized content!
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Wins Card */}
        <Card className="lg:col-span-2 bg-zinc-900/50 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              Quick Wins
            </CardTitle>
            <CardDescription>
              Actions to improve your GEO score fast
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {quickWins.map((win, i) => (
                <QuickWinCard key={i} title={win.title} impact={win.impact} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Autopilot Status */}
      {(selectedSite as any).autopilot_enabled && (
        <Card className="bg-gradient-to-r from-emerald-900/30 to-zinc-900 border-emerald-800/50">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Autopilot is Active</h3>
                  <p className="text-zinc-400">
                    Next article scheduled for{" "}
                    <span className="text-emerald-400">
                      {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span className="text-sm text-emerald-400">1 article/week</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

