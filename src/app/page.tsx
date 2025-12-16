"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  ArrowRight,
  Zap,
  Target,
  FileText,
  BarChart3,
  Sparkles,
  Globe,
  Bot,
  Code2,
  Layers,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  RefreshCw,
} from "lucide-react";

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
  cta: {
    message: string;
    features: string[];
  };
}

// ============================================
// SCORE RING COMPONENT
// ============================================

function ScoreRing({ 
  score, 
  size = 100, 
  label,
}: { 
  score: number; 
  size?: number; 
  label: string;
}) {
  const strokeWidth = size / 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;
  
  const getColor = (s: number) => {
    if (s >= 80) return "stroke-emerald-400";
    if (s >= 60) return "stroke-yellow-400";
    if (s >= 40) return "stroke-orange-400";
    return "stroke-red-400";
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
            className="text-zinc-800"
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
          <span className="text-2xl font-bold text-zinc-100">{score}</span>
        </div>
      </div>
      <p className="mt-2 text-sm font-medium text-zinc-400">{label}</p>
    </div>
  );
}

// ============================================
// FACTOR CHECK
// ============================================

function FactorCheck({ label, checked }: { label: string; checked: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {checked ? (
        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
      ) : (
        <XCircle className="w-4 h-4 text-zinc-600 flex-shrink-0" />
      )}
      <span className={checked ? "text-zinc-300" : "text-zinc-500"}>{label}</span>
    </div>
  );
}

// ============================================
// MAIN LANDING PAGE
// ============================================

export default function LandingPage() {
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

  const handleReset = () => {
    setResult(null);
    setUrl("");
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-zinc-100 selection:bg-emerald-500/30 overflow-x-hidden">
      {/* Animated gradient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-violet-500/10 rounded-full blur-[100px] animate-pulse delay-1000" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 border-b border-zinc-800/60 bg-[#0a0a0b]/90 backdrop-blur-md sticky top-0">
        <div className="w-full px-6 lg:px-12 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group transition-transform hover:scale-[1.02]">
            <Image src="/logo.png" alt="CabbageSEO" width={44} height={44} className="rounded-xl transition-transform group-hover:rotate-3" />
            <span className="text-xl font-bold tracking-tight">CabbageSEO</span>
          </Link>
            <div className="flex items-center gap-2">
            <Button variant="ghost" className="text-zinc-400 hover:text-zinc-100 h-10 px-4 transition-all hover:bg-zinc-800" asChild>
              <Link href="/login">Log in</Link>
              </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-500 text-white border-0 h-10 px-5 transition-all hover:shadow-lg hover:shadow-emerald-500/20" asChild>
              <Link href="/signup">Get started</Link>
              </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-16 pb-12">
        <div className="w-full px-6 lg:px-12">
          <div className="max-w-4xl mx-auto text-center">
            {/* Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-sm text-emerald-400 mb-8">
              <div className="relative">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping absolute" />
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              Free instant analysis • No signup required
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.15] mb-6">
              <span className="text-zinc-100">How visible is your site to</span>{" "}
              <span className="bg-gradient-to-r from-emerald-400 via-emerald-500 to-violet-400 bg-clip-text text-transparent pb-1">
                Google & AI Search?
              </span>
            </h1>
            
            <p className="text-lg text-zinc-400 leading-relaxed mb-10 max-w-2xl mx-auto">
              Get your SEO score and AI visibility score for ChatGPT, Perplexity, and Google AI Overviews. 
              Paste your URL below.
            </p>

            {/* URL Input Form */}
            <form onSubmit={handleAnalyze} className="max-w-2xl mx-auto mb-8">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <Input
                    type="text"
                    placeholder="Enter your website URL (e.g., example.com)"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="pl-12 h-14 text-lg bg-zinc-900/80 border-zinc-700/60 text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                    disabled={loading}
                  />
                </div>
                <Button 
                  type="submit" 
                  size="lg" 
                  disabled={loading || !url.trim()}
                  className="h-14 px-8 bg-emerald-600 hover:bg-emerald-500 text-white border-0 font-semibold transition-all hover:scale-105 hover:shadow-xl hover:shadow-emerald-500/25"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5 mr-2" />
                      Analyze
                    </>
                  )}
              </Button>
              </div>
            </form>

            {/* Error Message */}
            {error && (
              <div className="max-w-2xl mx-auto mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="max-w-3xl mx-auto">
                <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/60 p-8">
                  <div className="flex items-center justify-center gap-4 mb-6">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
                    <span className="text-lg">Analyzing your website...</span>
                  </div>
                  <div className="space-y-3 text-sm text-zinc-500">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Crawling homepage...</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Running SEO audit...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Results Section */}
      {result && (
        <section className="pb-16 px-6 lg:px-12">
          <div className="max-w-5xl mx-auto">
            {/* Score Summary Card */}
            <div className="rounded-2xl border border-zinc-700/50 bg-zinc-900/80 overflow-hidden mb-8">
              {/* Header */}
              <div className="bg-gradient-to-r from-emerald-500/10 to-violet-500/10 p-6 border-b border-zinc-800/60">
                <div className="flex items-center justify-between flex-wrap gap-4">
                      <div>
                    <div className="flex items-center gap-2 text-sm text-zinc-400 mb-1">
                      <Globe className="w-4 h-4" />
                      <span className="truncate">{result.url}</span>
                    </div>
                    <h2 className="text-xl font-bold truncate">{result.title}</h2>
                      </div>
                  <Button variant="outline" size="sm" onClick={handleReset} className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Analyze Another
                  </Button>
                        </div>
                      </div>
              
              {/* Scores */}
              <div className="p-8">
                <div className="grid grid-cols-3 gap-8 justify-items-center mb-8">
                  <ScoreRing score={result.seoScore} label="SEO Score" />
                  <ScoreRing score={result.aioScore} label="AIO Score" />
                  <ScoreRing score={result.combinedScore} label="Combined" />
                </div>

                {/* Platform Scores */}
                <div className="grid grid-cols-4 gap-4 p-4 rounded-xl bg-zinc-800/40 mb-8">
                  {[
                    { name: "Google AI", score: result.aio.platformScores.googleAIO, emoji: "🔍" },
                    { name: "Perplexity", score: result.aio.platformScores.perplexity, emoji: "🔮" },
                    { name: "ChatGPT", score: result.aio.platformScores.chatGPT, emoji: "🤖" },
                    { name: "Claude", score: result.aio.platformScores.claude, emoji: "🧠" },
                  ].map((platform) => (
                    <div key={platform.name} className="text-center">
                      <span className="text-xl">{platform.emoji}</span>
                      <p className="text-xs text-zinc-500 mt-1">{platform.name}</p>
                      <p className={`text-lg font-bold ${
                        platform.score >= 70 ? "text-emerald-400" :
                        platform.score >= 50 ? "text-yellow-400" :
                        "text-red-400"
                      }`}>
                        {platform.score}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Breakdowns */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* SEO Breakdown */}
                  <div className="p-5 rounded-xl border border-zinc-800/60 bg-zinc-800/30">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-emerald-400" />
                      SEO Breakdown
                    </h3>
                    <div className="space-y-3">
                      {[
                        { label: "Technical", score: result.seo.breakdown.technicalScore, max: 20 },
                        { label: "Content", score: result.seo.breakdown.contentScore, max: 20 },
                        { label: "Meta Tags", score: result.seo.breakdown.metaScore, max: 20 },
                        { label: "Performance", score: result.seo.breakdown.performanceScore, max: 20 },
                        { label: "Accessibility", score: result.seo.breakdown.accessibilityScore, max: 20 },
                      ].map((item) => (
                        <div key={item.label} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-zinc-400">{item.label}</span>
                            <span className="font-medium">{item.score}/{item.max}</span>
                          </div>
                          <Progress 
                            value={(item.score / item.max) * 100} 
                            className="h-1.5 bg-zinc-700 [&>div]:bg-emerald-500"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-4 pt-4 border-t border-zinc-700/50 text-xs">
                      <span className="px-2 py-1 rounded bg-red-500/20 text-red-400">{result.seo.issueCount.critical} critical</span>
                      <span className="px-2 py-1 rounded bg-yellow-500/20 text-yellow-400">{result.seo.issueCount.warning} warnings</span>
                    </div>
                  </div>

                  {/* AIO Breakdown */}
                  <div className="p-5 rounded-xl border border-zinc-800/60 bg-zinc-800/30">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Bot className="w-4 h-4 text-violet-400" />
                      AI Visibility Factors
                    </h3>
                    <div className="space-y-2">
                      <FactorCheck label="Direct, factual answers" checked={result.aio.factors.hasDirectAnswers} />
                      <FactorCheck label="FAQ section" checked={result.aio.factors.hasFAQSection} />
                      <FactorCheck label="Schema markup" checked={result.aio.factors.hasSchema} />
                      <FactorCheck label="Author information" checked={result.aio.factors.hasAuthorInfo} />
                      <FactorCheck label="Citations & sources" checked={result.aio.factors.hasCitations} />
                      <FactorCheck label="Key takeaways section" checked={result.aio.factors.hasKeyTakeaways} />
                      <FactorCheck 
                        label={`Avg sentence: ${result.aio.factors.avgSentenceLength} words`} 
                        checked={result.aio.factors.avgSentenceLength < 25} 
                      />
                    </div>
                  </div>
                </div>

                {/* Top Recommendations */}
                <div className="mt-6 p-5 rounded-xl border border-zinc-800/60 bg-zinc-800/30">
                  <h3 className="font-semibold mb-4">Top Recommendations</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-zinc-500 mb-2">SEO</p>
                      <ul className="space-y-2">
                        {result.seo.recommendations.slice(0, 3).map((rec, i) => (
                          <li key={i} className="text-sm text-zinc-300 flex gap-2">
                            <span className="text-emerald-400">•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-zinc-500 mb-2">AI Visibility</p>
                      <ul className="space-y-2">
                        {result.aio.recommendations.slice(0, 3).map((rec, i) => (
                          <li key={i} className="text-sm text-zinc-300 flex gap-2">
                            <span className="text-violet-400">•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Card */}
            <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-violet-500/10 p-8 text-center">
              <h3 className="text-2xl font-bold mb-2">{result.cta.message}</h3>
              <p className="text-zinc-400 mb-6 max-w-xl mx-auto">
                This was just your homepage. Sign up to analyze your entire site, 
                track rankings, generate optimized content, and let CabbageSEO run on autopilot.
              </p>
              
              <div className="flex flex-wrap justify-center gap-3 mb-6">
                {result.cta.features.slice(0, 6).map((feature) => (
                  <span key={feature} className="px-3 py-1 text-sm rounded-full bg-zinc-800/60 text-zinc-300 border border-zinc-700/50">
                    {feature}
                  </span>
                ))}
              </div>

              <div className="flex gap-4 justify-center">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-500 text-white" asChild>
                  <Link href="/signup">
                    Get Full Access
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* Features Section (shown when no result) */}
      {!result && !loading && (
        <>
          {/* Features Grid */}
          <section className="py-20 border-t border-zinc-800/50">
            <div className="w-full px-6 lg:px-12">
              <div className="mb-12 text-center">
                <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                  One workspace. SEO + AI visibility.
                </h2>
                <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                  We connect your existing tools and add AI visibility scoring for ChatGPT, Perplexity, and Google AI Overviews.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
                {[
                  { icon: Target, title: "Keyword Research", desc: "Pull real keyword data from DataForSEO. Cluster with AI." },
                  { icon: FileText, title: "Content Generation", desc: "Claude writes SEO + AI-optimized content." },
                  { icon: Sparkles, title: "AI Visibility Score", desc: "See how you rank in ChatGPT, Perplexity, Google AI.", badge: "NEW" },
                  { icon: BarChart3, title: "Technical Audit", desc: "Scan for SEO issues and AI optimization gaps." },
                  { icon: Globe, title: "CMS Publishing", desc: "Publish directly to WordPress, Webflow, Shopify." },
                  { icon: Bot, title: "Autopilot Mode", desc: "Queue tasks. Let the system run." },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="group p-5 rounded-xl border border-zinc-800/60 bg-zinc-900/40 hover:bg-zinc-800/60 hover:border-emerald-500/30 transition-all duration-300"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
                        <item.icon className="h-5 w-5 text-emerald-500" />
                      </div>
                      {"badge" in item && item.badge && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-violet-500/20 text-violet-400 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-lg mb-1.5">{item.title}</h3>
                    <p className="text-sm text-zinc-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

          {/* How it works */}
          <section className="py-20 border-t border-zinc-800/50 bg-gradient-to-b from-zinc-900/50 to-transparent">
            <div className="w-full px-6 lg:px-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-14 text-center">How it works</h2>
              
              <div className="grid sm:grid-cols-3 gap-8 lg:gap-12 max-w-4xl mx-auto">
                {[
                  { step: "01", title: "Paste your URL", desc: "Enter your website above. We'll crawl and analyze it instantly." },
                  { step: "02", title: "Get dual scores", desc: "See your SEO score and AIO score. Know how you rank in Google and AI search." },
                  { step: "03", title: "Optimize both", desc: "Sign up to generate content optimized for traditional search and AI platforms." },
                ].map((item) => (
                  <div key={item.step} className="group text-center">
                    <div className="text-5xl font-black bg-gradient-to-br from-emerald-500/40 to-emerald-500/10 bg-clip-text text-transparent mb-4">{item.step}</div>
                    <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                    <p className="text-zinc-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

          {/* Philosophy Section */}
          <section className="py-20 border-t border-zinc-800/50">
            <div className="w-full px-6 lg:px-12">
              <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
                <div>
                  <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                    SEO is evolving.<br />Your tools should too.
            </h2>
                  <div className="space-y-4 text-zinc-400 leading-relaxed">
                    <p>
                      Google isn&apos;t the only search anymore. ChatGPT, Perplexity, Claude—they&apos;re 
                      answering questions with your content (or your competitor&apos;s).
                    </p>
                    <p>
                      CabbageSEO is the first Search Optimization OS. We unify your existing SEO tools 
                      and add AI Optimization (AIO).
                    </p>
                    <p className="text-emerald-400 font-semibold text-lg">
                      Optimize for search today. And tomorrow.
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { id: "keywords", label: "Keyword Research", tools: "DataForSEO" },
                    { id: "content", label: "Content Generation", tools: "Claude (Anthropic)" },
                    { id: "publishing", label: "Publishing", tools: "WordPress, Webflow" },
                    { id: "analytics", label: "Analytics", tools: "Google Search Console" },
                  ].map((row) => (
                    <div key={row.id} className="flex items-center gap-4 p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/40 hover:bg-zinc-800/50 transition-all hover:translate-x-2">
                      <Layers className="h-5 w-5 text-emerald-500 shrink-0" />
                      <div>
                        <p className="font-medium">{row.label}</p>
                        <p className="text-sm text-zinc-500">{row.tools}</p>
          </div>
        </div>
                  ))}
                  <div className="flex items-center gap-4 p-4 rounded-xl border-2 border-emerald-500/40 bg-emerald-500/10">
                    <Code2 className="h-5 w-5 text-emerald-400 shrink-0" />
                    <div>
                      <p className="font-semibold text-emerald-400">CabbageSEO</p>
                      <p className="text-sm text-zinc-400">Connects everything. Automates the rest.</p>
                  </div>
                  </div>
                </div>
          </div>
        </div>
      </section>
        </>
      )}

      {/* Final CTA */}
      {!result && (
        <section className="py-24 border-t border-zinc-800/50 bg-gradient-to-t from-emerald-950/20 to-transparent">
          <div className="w-full px-6 lg:px-12">
            <div className="max-w-2xl mx-auto text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
                <Sparkles className="h-8 w-8 text-emerald-400" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Ready to simplify your SEO?
              </h2>
              <p className="text-zinc-400 mb-8 text-lg">
                We&apos;re in early access. Analyze your first site for free—no credit card, 
                no 30-day trial countdown, no sales calls.
              </p>
              <Button size="lg" className="h-12 px-8 bg-emerald-600 hover:bg-emerald-500 text-white border-0 gap-2 text-base font-semibold" asChild>
                <Link href="/signup">
                  <Zap className="h-5 w-5" />
                  Start analyzing
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
          </div>
        </div>
      </section>
      )}

      {/* Footer */}
      <footer className="py-8 border-t border-zinc-800/50">
        <div className="w-full px-6 lg:px-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="CabbageSEO" width={32} height={32} className="rounded-lg" />
              <span className="font-medium text-zinc-400">CabbageSEO</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-zinc-500">
              <Link href="/privacy" className="hover:text-zinc-300 transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-zinc-300 transition-colors">Terms</Link>
              <span>© {new Date().getFullYear()}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
