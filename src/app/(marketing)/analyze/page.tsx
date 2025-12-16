"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Zap,
  TrendingUp,
  Bot,
  Globe,
  FileText,
  Link2,
  BarChart3,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// ============================================
// TYPES
// ============================================

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
    issueCount: {
      critical: number;
      warning: number;
      info: number;
    };
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
    factors: {
      hasDirectAnswers: boolean;
      hasFAQSection: boolean;
      hasSchema: boolean;
      hasAuthorInfo: boolean;
      hasCitations: boolean;
      hasKeyTakeaways: boolean;
      avgSentenceLength: number;
    };
    platformScores: {
      googleAIO: number;
      perplexity: number;
      chatGPT: number;
      claude: number;
    };
    recommendations: string[];
  };
  pageInfo: {
    wordCount: number;
    hasH1: boolean;
    hasMetaDescription: boolean;
    schemaTypes: string[];
  };
  cta: {
    message: string;
    signupUrl: string;
    features: string[];
  };
}

// ============================================
// SCORE RING COMPONENT
// ============================================

function ScoreRing({ 
  score, 
  size = 120, 
  label,
  sublabel,
}: { 
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
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted/20"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={`transition-all duration-1000 ${getColor(score)}`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl font-bold">{score}</span>
        </div>
      </div>
      <p className="mt-2 font-medium">{label}</p>
      {sublabel && <p className="text-xs text-muted-foreground">{sublabel}</p>}
    </div>
  );
}

// ============================================
// FACTOR CHECK COMPONENT
// ============================================

function FactorCheck({ 
  label, 
  checked, 
  impact = "medium" 
}: { 
  label: string; 
  checked: boolean; 
  impact?: "high" | "medium" | "low";
}) {
  return (
    <div className="flex items-center gap-2 py-1">
      {checked ? (
        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
      ) : (
        <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
      )}
      <span className={`text-sm ${checked ? "text-foreground" : "text-muted-foreground"}`}>
        {label}
      </span>
      {impact === "high" && !checked && (
        <Badge variant="destructive" className="text-[10px] px-1 py-0">High Impact</Badge>
      )}
    </div>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function FreeScoringPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/public/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      setResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="CabbageSEO" width={32} height={32} />
            <span className="font-bold text-lg">CabbageSEO</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Get Started Free</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero / Form Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <Badge className="mb-4" variant="secondary">
            <Sparkles className="w-3 h-3 mr-1" />
            Free SEO + AIO Analysis
          </Badge>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Is Your Site Visible to{" "}
            <span className="bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
              AI Search?
            </span>
          </h1>
          
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Get your SEO score plus AI visibility score for ChatGPT, Perplexity, and Google AI Overviews. 
            No signup required.
          </p>

          <form onSubmit={handleAnalyze} className="flex gap-2 max-w-xl mx-auto">
            <div className="relative flex-1">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Enter your website URL..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="pl-10 h-12 text-lg"
                disabled={loading}
              />
            </div>
            <Button type="submit" size="lg" disabled={loading || !url.trim()}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Analyze
                </>
              )}
            </Button>
          </form>

          {error && (
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 flex items-center gap-2 max-w-xl mx-auto">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </section>

      {/* Results Section */}
      {result && (
        <section className="pb-20 px-4">
          <div className="container mx-auto max-w-6xl">
            {/* Score Summary */}
            <Card className="mb-8 overflow-hidden">
              <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 p-6 border-b">
                <div className="flex items-center gap-3 mb-2">
                  <Globe className="w-5 h-5" />
                  <span className="font-medium truncate">{result.url}</span>
                </div>
                <h2 className="text-xl font-bold truncate">{result.title}</h2>
              </div>
              
              <CardContent className="p-8">
                <div className="grid grid-cols-3 gap-8 justify-items-center">
                  <ScoreRing 
                    score={result.seoScore} 
                    label="SEO Score"
                    sublabel="Search Engine Optimization"
                  />
                  <ScoreRing 
                    score={result.aioScore} 
                    label="AIO Score"
                    sublabel="AI Optimization"
                  />
                  <ScoreRing 
                    score={result.combinedScore} 
                    label="Combined"
                    sublabel="Overall Visibility"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Detailed Breakdown */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* SEO Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                    SEO Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { label: "Technical", score: result.seo.breakdown.technicalScore, max: 20 },
                    { label: "Content", score: result.seo.breakdown.contentScore, max: 20 },
                    { label: "Meta Tags", score: result.seo.breakdown.metaScore, max: 20 },
                    { label: "Performance", score: result.seo.breakdown.performanceScore, max: 20 },
                    { label: "Accessibility", score: result.seo.breakdown.accessibilityScore, max: 20 },
                  ].map((item) => (
                    <div key={item.label} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{item.label}</span>
                        <span className="font-medium">{item.score}/{item.max}</span>
                      </div>
                      <Progress 
                        value={(item.score / item.max) * 100} 
                        className="h-2"
                      />
                    </div>
                  ))}
                  
                  <div className="flex gap-3 pt-4 border-t">
                    <Badge variant="destructive">{result.seo.issueCount.critical} Critical</Badge>
                    <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-600">{result.seo.issueCount.warning} Warnings</Badge>
                    <Badge variant="outline">{result.seo.issueCount.info} Info</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* AIO Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-purple-500" />
                    AI Visibility Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { label: "Content Structure", score: result.aio.breakdown.structureScore, max: 20 },
                    { label: "Authority Signals", score: result.aio.breakdown.authorityScore, max: 20 },
                    { label: "Schema Markup", score: result.aio.breakdown.schemaScore, max: 20 },
                    { label: "Content Quality", score: result.aio.breakdown.contentQualityScore, max: 20 },
                    { label: "Quotability", score: result.aio.breakdown.quotabilityScore, max: 20 },
                  ].map((item) => (
                    <div key={item.label} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{item.label}</span>
                        <span className="font-medium">{item.score}/{item.max}</span>
                      </div>
                      <Progress 
                        value={(item.score / item.max) * 100} 
                        className="h-2"
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Platform Scores */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>AI Platform Visibility</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { name: "Google AI Overviews", score: result.aio.platformScores.googleAIO, icon: "🔍" },
                    { name: "Perplexity", score: result.aio.platformScores.perplexity, icon: "🔮" },
                    { name: "ChatGPT", score: result.aio.platformScores.chatGPT, icon: "🤖" },
                    { name: "Claude", score: result.aio.platformScores.claude, icon: "🧠" },
                  ].map((platform) => (
                    <div 
                      key={platform.name}
                      className="p-4 rounded-lg border bg-muted/30 text-center"
                    >
                      <span className="text-2xl">{platform.icon}</span>
                      <p className="text-sm text-muted-foreground mt-1">{platform.name}</p>
                      <p className={`text-2xl font-bold mt-1 ${
                        platform.score >= 70 ? "text-green-500" :
                        platform.score >= 50 ? "text-yellow-500" :
                        "text-red-500"
                      }`}>
                        {platform.score}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* AIO Factors Checklist */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>AI Optimization Factors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-x-8">
                  <div>
                    <FactorCheck 
                      label="Direct, factual answers" 
                      checked={result.aio.factors.hasDirectAnswers}
                      impact="high"
                    />
                    <FactorCheck 
                      label="FAQ section" 
                      checked={result.aio.factors.hasFAQSection}
                      impact="high"
                    />
                    <FactorCheck 
                      label="Schema markup" 
                      checked={result.aio.factors.hasSchema}
                      impact="high"
                    />
                    <FactorCheck 
                      label="Author information" 
                      checked={result.aio.factors.hasAuthorInfo}
                      impact="medium"
                    />
                  </div>
                  <div>
                    <FactorCheck 
                      label="Citations & sources" 
                      checked={result.aio.factors.hasCitations}
                      impact="medium"
                    />
                    <FactorCheck 
                      label="Key takeaways section" 
                      checked={result.aio.factors.hasKeyTakeaways}
                      impact="medium"
                    />
                    <FactorCheck 
                      label={`Sentence length (avg: ${result.aio.factors.avgSentenceLength} words)`}
                      checked={result.aio.factors.avgSentenceLength < 25}
                      impact="low"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    SEO Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.seo.recommendations.length > 0 ? (
                      result.seo.recommendations.map((rec, i) => (
                        <li key={i} className="flex gap-2 text-sm">
                          <span className="text-muted-foreground">{i + 1}.</span>
                          <span>{rec}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-green-600 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Great job! No major SEO issues found.
                      </li>
                    )}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Bot className="w-4 h-4" />
                    AI Visibility Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.aio.recommendations.length > 0 ? (
                      result.aio.recommendations.map((rec, i) => (
                        <li key={i} className="flex gap-2 text-sm">
                          <span className="text-muted-foreground">{i + 1}.</span>
                          <span>{rec}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-green-600 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Excellent! Your content is well-optimized for AI.
                      </li>
                    )}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* CTA Section */}
            <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20">
              <CardContent className="p-8 text-center">
                <h3 className="text-2xl font-bold mb-2">{result.cta.message}</h3>
                <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                  This was just your homepage. Sign up to analyze your entire site, 
                  track rankings, generate optimized content, and let CabbageSEO run on autopilot.
                </p>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-2xl mx-auto mb-8">
                  {[
                    { icon: FileText, label: "Full site audit" },
                    { icon: Search, label: "Keyword tracking" },
                    { icon: Sparkles, label: "AI content generation" },
                    { icon: Zap, label: "Auto-fix issues" },
                    { icon: Link2, label: "CMS publishing" },
                    { icon: BarChart3, label: "Rank monitoring" },
                  ].map(({ icon: Icon, label }) => (
                    <div 
                      key={label}
                      className="flex items-center gap-2 text-sm bg-background/50 rounded-lg p-2"
                    >
                      <Icon className="w-4 h-4 text-green-500" />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-4 justify-center">
                  <Link href="/signup">
                    <Button size="lg">
                      Get Full Access
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    size="lg"
                    onClick={() => {
                      setResult(null);
                      setUrl("");
                    }}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Analyze Another
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Features Section (shown when no result) */}
      {!result && !loading && (
        <section className="py-16 px-4 border-t">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold text-center mb-8">
              Why AI Visibility Matters
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-6">
                <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                  <Bot className="w-6 h-6 text-purple-500" />
                </div>
                <h3 className="font-semibold mb-2">ChatGPT & Perplexity</h3>
                <p className="text-sm text-muted-foreground">
                  Millions search through AI. If your content isn't optimized, you're invisible.
                </p>
              </div>
              
              <div className="text-center p-6">
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-6 h-6 text-green-500" />
                </div>
                <h3 className="font-semibold mb-2">Google AI Overviews</h3>
                <p className="text-sm text-muted-foreground">
                  Google shows AI summaries above search results. Get cited or get buried.
                </p>
              </div>
              
              <div className="text-center p-6">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="font-semibold mb-2">Future-Proof SEO</h3>
                <p className="text-sm text-muted-foreground">
                  AI search is the future. Optimize now or play catch-up forever.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} CabbageSEO. The Search Optimization OS.</p>
        </div>
      </footer>
    </div>
  );
}

