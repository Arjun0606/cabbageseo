"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
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
  ChevronDown,
  ChevronUp,
  Info,
  Lightbulb,
  Mail,
  Lock,
  Share2,
  Twitter,
  Linkedin,
  Copy,
  Check,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ExitIntentPopup } from "@/components/marketing/exit-intent-popup";

// ============================================
// TYPES
// ============================================

interface ScoreItem {
  name: string;
  score: number;
  maxScore: number;
  status: "pass" | "warning" | "fail";
  reason: string;
  howToFix?: string;
}

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
    details: {
      technical: ScoreItem[];
      content: ScoreItem[];
      meta: ScoreItem[];
      performance: ScoreItem[];
      accessibility: ScoreItem[];
    };
    issueCount: {
      critical: number;
      warning: number;
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
    details: {
      structure: ScoreItem[];
      authority: ScoreItem[];
      schema: ScoreItem[];
      contentQuality: ScoreItem[];
      quotability: ScoreItem[];
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
      bingCopilot: number;
    };
    platformScoresAreReal: boolean; // true = real visibility check, false = estimate
    realVisibilityData: {
      citations: Array<{ platform: string; query: string; url?: string }>;
      checkedAt: string;
    } | null;
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
      {sublabel && <p className="text-xs text-zinc-500">{sublabel}</p>}
    </div>
  );
}

// ============================================
// SCORE ITEM ROW
// ============================================

function ScoreItemRow({ item }: { item: ScoreItem }) {
  const statusIcon = {
    pass: <CheckCircle2 className="w-4 h-4 text-green-500" />,
    warning: <AlertTriangle className="w-4 h-4 text-yellow-500" />,
    fail: <XCircle className="w-4 h-4 text-red-500" />,
  };

  return (
    <div className="py-2 border-b border-muted/50 last:border-0">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          {statusIcon[item.status]}
          <span className="text-sm font-medium">{item.name}</span>
        </div>
        <span className={`text-sm font-bold ${
          item.status === "pass" ? "text-green-500" : 
          item.status === "warning" ? "text-yellow-500" : "text-red-500"
        }`}>
          {item.score}/{item.maxScore}
        </span>
      </div>
      <p className="text-xs text-zinc-500 ml-6">{item.reason}</p>
      {item.howToFix && item.status !== "pass" && (
        <div className="ml-6 mt-1 flex items-start gap-1">
          <Lightbulb className="w-3 h-3 text-yellow-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-yellow-600 dark:text-yellow-400">{item.howToFix}</p>
        </div>
      )}
    </div>
  );
}

// ============================================
// CATEGORY BREAKDOWN
// ============================================

function CategoryBreakdown({ 
  title, 
  score, 
  maxScore, 
  items,
  defaultOpen = false,
}: { 
  title: string; 
  score: number; 
  maxScore: number;
  items: ScoreItem[];
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const percentage = (score / maxScore) * 100;
  const statusColor = percentage >= 80 ? "text-green-500" : percentage >= 50 ? "text-yellow-500" : "text-red-500";

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border rounded-lg">
      <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium">{title}</span>
            <span className={`font-bold ${statusColor}`}>{score}/{maxScore}</span>
          </div>
          <Progress value={percentage} className="h-2" />
        </div>
        <div className="ml-3">
          {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 pb-4">
        <div className="pt-2 border-t">
          {items.map((item, idx) => (
            <ScoreItemRow key={idx} item={item} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ============================================
// FACTOR CHECK
// ============================================

function FactorCheck({ 
  label, 
  checked, 
  impact = "medium",
  tooltip,
}: { 
  label: string; 
  checked: boolean; 
  impact?: "high" | "medium" | "low";
  tooltip?: string;
}) {
  const content = (
    <div className="flex items-center gap-2 py-1">
      {checked ? (
        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
      ) : (
        <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
      )}
      <span className={`text-sm ${checked ? "text-zinc-100" : "text-zinc-500"}`}>
        {label}
      </span>
      {impact === "high" && !checked && (
        <Badge variant="destructive" className="text-[10px] px-1 py-0">High Impact</Badge>
      )}
      {tooltip && <Info className="w-3 h-3 text-zinc-500" />}
    </div>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent><p className="max-w-xs text-xs">{tooltip}</p></TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}

// ============================================
// MAIN PAGE
// ============================================

function FreeScoringPageContent() {
  const searchParams = useSearchParams();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [hasAutoAnalyzed, setHasAutoAnalyzed] = useState(false);
  
  // Email capture state
  const [showEmailGate, setShowEmailGate] = useState(true);
  const [email, setEmail] = useState("");
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasPaidPlan, setHasPaidPlan] = useState(false);

  // Check if user is logged in and has a paid plan
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setIsLoggedIn(true);
          setShowEmailGate(false);
          
          // Check if user has a paid subscription
          const { data: userData } = await supabase
            .from("users")
            .select("organization_id")
            .eq("id", user.id)
            .single();
          
          const orgId = (userData as { organization_id?: string } | null)?.organization_id;
          if (orgId) {
            const { data: orgData } = await supabase
              .from("organizations")
              .select("plan, subscription_status")
              .eq("id", orgId)
              .single();
            
            const org = orgData as { plan?: string; subscription_status?: string } | null;
            // Check if they have an active paid plan
            const isPaid = org?.plan && 
              org.plan !== "free" && 
              ["active", "trialing"].includes(org?.subscription_status || "");
            setHasPaidPlan(!!isPaid);
          }
        }
      }
    };
    checkAuth();
  }, []);

  // Check if email was previously submitted (localStorage)
  useEffect(() => {
    const savedEmail = localStorage.getItem("cabbageseo_email");
    if (savedEmail) {
      setEmail(savedEmail);
      setEmailSubmitted(true);
      setShowEmailGate(false);
    }
  }, []);

  // Auto-analyze if URL is provided in query params
  useEffect(() => {
    const urlParam = searchParams.get("url");
    if (urlParam && !hasAutoAnalyzed) {
      setUrl(urlParam);
      setHasAutoAnalyzed(true);
      runAnalysis(urlParam);
    }
  }, [searchParams, hasAutoAnalyzed]);

  const runAnalysis = async (targetUrl: string) => {
    if (!targetUrl.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/public/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl.trim() }),
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

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    runAnalysis(url);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) return;
    
    setEmailLoading(true);
    
    try {
      // Store in localStorage for return visits
      localStorage.setItem("cabbageseo_email", email);
      
      // Send to backend for email list
      await fetch("/api/leads", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, url, source: "free_analyzer" }) 
      });
      
      setEmailSubmitted(true);
      setShowEmailGate(false);
    } catch (err) {
      console.error("Failed to save email:", err);
      // Still unlock the content even if save fails
      setEmailSubmitted(true);
      setShowEmailGate(false);
    } finally {
      setEmailLoading(false);
    }
  };

  const handleShare = async (platform: "twitter" | "linkedin" | "copy") => {
    const shareUrl = `${window.location.origin}/analyze?url=${encodeURIComponent(url)}`;
    const shareText = `Just analyzed my site with @CabbageSEO:\n\n🎯 SEO Score: ${result?.seoScore}/100\n🤖 AI Visibility: ${result?.aioScore}/100\n\nIs ChatGPT citing YOUR content? Check free:`;
    
    switch (platform) {
      case "twitter":
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, "_blank");
        break;
      case "linkedin":
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, "_blank");
        break;
      case "copy":
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        break;
    }
  };

  // Calculate issue count for CTA
  const totalIssues = result ? (result.seo.issueCount.critical + result.seo.issueCount.warning + 
    (result.aio.recommendations?.length || 0)) : 0;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/cabbageseo_logo.png" alt="CabbageSEO" className="h-10 w-auto" />
            <span className="font-bold text-xl tracking-tight text-white">CabbageSEO</span>
          </Link>
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              hasPaidPlan ? (
                <Link href="/dashboard">
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white">Go to Dashboard</Button>
                </Link>
              ) : (
                <Link href="/pricing">
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white">Upgrade to Access</Button>
                </Link>
              )
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">Log in</Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white">Get Started Free</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero / Form */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm mb-6">
            <Bot className="w-4 h-4" />
            Free AI Visibility + SEO Analysis
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">
            Is{" "}
            <span className="text-emerald-400">
              ChatGPT
            </span>{" "}
            Citing{" "}
            <span className="text-emerald-400">
              Your Content?
            </span>
          </h1>
          
          <p className="text-lg text-zinc-400 mb-8 max-w-2xl mx-auto">
            See if ChatGPT, Perplexity, and Google AI are citing your content. 
            Plus complete SEO analysis with actionable fixes.
          </p>

          <form onSubmit={handleAnalyze} className="flex gap-2 max-w-xl mx-auto">
            <div className="relative flex-1">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <Input
                type="text"
                placeholder="Enter your website URL..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="pl-10 h-12 text-lg bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20"
                disabled={loading}
              />
            </div>
            <Button 
              type="submit" 
              size="lg" 
              disabled={loading || !url.trim()}
              className="bg-emerald-600 hover:bg-emerald-500 text-white h-12"
            >
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
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 flex items-center gap-2 max-w-xl mx-auto">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </section>

      {/* Results */}
      {result && (
        <section className="pb-20 px-4">
          <div className="container mx-auto max-w-6xl">
            {/* Header with actions */}
            <div className="mb-6 flex justify-between items-center">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleShare("twitter")}
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                >
                  <Twitter className="w-4 h-4 mr-2" />
                  Share
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleShare("copy")}
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                >
                  {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                  {copied ? "Copied!" : "Copy Link"}
                </Button>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setResult(null);
                  setUrl("");
                }}
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Analyze Another
              </Button>
            </div>

            {/* Score Summary - Always visible */}
            <Card className="mb-8 overflow-hidden bg-zinc-900 border-zinc-800">
              <div className="bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 p-6 border-b border-zinc-800">
                <div className="flex items-center gap-3 mb-2">
                  <Globe className="w-5 h-5 text-zinc-400" />
                  <span className="font-medium truncate text-zinc-300">{result.url}</span>
                </div>
                <h2 className="text-xl font-bold truncate text-white">{result.title}</h2>
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

                {/* Urgency message based on scores */}
                {result.aioScore < 60 && (
                  <div className="mt-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-red-400">
                          ⚠️ Your competitors might be getting cited by AI — you're not.
                        </p>
                        <p className="text-sm text-red-400/80 mt-1">
                          With an AIO score of {result.aioScore}/100, ChatGPT and Perplexity are likely 
                          citing other sites instead of yours.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* SIGNUP GATE - Show only for non-logged-in users */}
            {!isLoggedIn && (
              <Card className="mb-8 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border-emerald-500/30">
                <CardContent className="p-8">
                  <div className="text-center max-w-lg mx-auto">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                      <Lock className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">
                      See What&apos;s Hurting Your Rankings
                    </h3>
                    <p className="text-zinc-400 mb-2">
                      We found <span className="text-red-400 font-bold">{totalIssues} issues</span> affecting your visibility.
                    </p>
                    <p className="text-sm text-zinc-500 mb-6">
                      Sign up free to see the full breakdown, detailed recommendations, and AI-powered fixes.
                    </p>
                    
                    <Link href={`/signup?redirect=${encodeURIComponent(`/analyze?url=${encodeURIComponent(result.url)}`)}`}>
                      <Button 
                        size="lg"
                        className="bg-emerald-600 hover:bg-emerald-500 text-white h-12 px-8"
                      >
                        Sign Up Free to Unlock
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                    
                    <p className="text-xs text-zinc-500 mt-4">
                      ✓ Free account · ✓ Full breakdown · ✓ AI recommendations
                    </p>

                    {/* Optional email capture for those not ready to sign up */}
                    <div className="mt-6 pt-6 border-t border-zinc-700">
                      <p className="text-sm text-zinc-500 mb-3">
                        Not ready? Get a summary sent to your email:
                      </p>
                      <form onSubmit={handleEmailSubmit} className="flex gap-2 max-w-md mx-auto">
                        <div className="relative flex-1">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                          <Input
                            type="email"
                            placeholder="Your email..."
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="pl-10 h-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 text-sm"
                            required
                          />
                        </div>
                        <Button 
                          type="submit" 
                          variant="outline"
                          disabled={emailLoading || !email.includes("@")}
                          className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 h-10"
                        >
                          {emailLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Summary"}
                        </Button>
                      </form>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Preview of what they'll get - blurred/locked for non-logged-in users */}
            <div className={!isLoggedIn ? "relative" : ""}>
              {/* Blur overlay - only show for non-logged-in users */}
              {!isLoggedIn && (
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-950/90 to-zinc-950 z-10 pointer-events-none" />
              )}
              
              {/* Full content - blurred for non-logged-in, visible for logged-in */}
              <div className={!isLoggedIn ? "opacity-40 blur-[2px] select-none pointer-events-none" : ""}>

            {/* Platform Scores */}
            <Card className="mb-8 bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Bot className="w-5 h-5 text-emerald-400" />
                  AI Platform Visibility
                  {result.aio.platformScoresAreReal ? (
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Real Data
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Estimated
                    </Badge>
                  )}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-4 h-4 text-zinc-500" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        {result.aio.platformScoresAreReal ? (
                          <p className="text-xs">
                            <strong className="text-green-500">✓ Real visibility data!</strong> We queried these AI 
                            platforms directly and checked if they cite your content.
                          </p>
                        ) : (
                          <p className="text-xs">
                            These are <strong>estimated scores</strong> based on content factors that research 
                            suggests help with AI citations. Configure API keys for real visibility checking.
                          </p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {result.aio.platformScoresAreReal ? (
                  <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Real visibility check performed at {result.aio.realVisibilityData?.checkedAt 
                        ? new Date(result.aio.realVisibilityData.checkedAt).toLocaleString() 
                        : "recently"}
                    </p>
                    {result.aio.realVisibilityData?.citations && result.aio.realVisibilityData.citations.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-green-700 font-medium mb-1">
                          Found {result.aio.realVisibilityData.citations.length} citation(s):
                        </p>
                        <ul className="text-xs text-green-600 space-y-1">
                          {result.aio.realVisibilityData.citations.slice(0, 3).map((c, i) => (
                            <li key={i} className="flex items-start gap-1">
                              <span>•</span>
                              <span><strong>{c.platform}</strong>: "{c.query}"</span>
                            </li>
                          ))}
                          {result.aio.realVisibilityData.citations.length > 3 && (
                            <li className="text-green-500">
                              +{result.aio.realVisibilityData.citations.length - 3} more
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                    {(!result.aio.realVisibilityData?.citations || result.aio.realVisibilityData.citations.length === 0) && (
                      <p className="mt-1 text-xs text-yellow-600">
                        No citations found for tested queries. Try optimizing your content for AI visibility.
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 mb-4 -mt-2">
                    Estimated visibility based on content factors. Sign up for real platform monitoring.
                  </p>
                )}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { name: "Google AI", score: result.aio.platformScores.googleAIO, icon: "🔍", desc: "AI Overviews" },
                    { name: "Perplexity", score: result.aio.platformScores.perplexity, icon: "🔮", desc: "AI Search" },
                    { name: "ChatGPT", score: result.aio.platformScores.chatGPT, icon: "🤖", desc: "SearchGPT" },
                  ].map((platform) => (
                    <div 
                      key={platform.name}
                      className={`p-4 rounded-lg border text-center ${
                        result.aio.platformScoresAreReal 
                          ? "bg-zinc-800 border-zinc-700" 
                          : "bg-zinc-800/50 border-zinc-700"
                      }`}
                    >
                      <span className="text-2xl">{platform.icon}</span>
                      <p className="text-sm font-medium mt-1">{platform.name}</p>
                      <p className="text-[10px] text-zinc-500">{platform.desc}</p>
                      <p className={`text-2xl font-bold mt-1 ${
                        platform.score >= 70 ? "text-green-500" :
                        platform.score >= 50 ? "text-yellow-500" :
                        platform.score > 0 ? "text-orange-500" :
                        "text-red-500"
                      }`}>
                        {result.aio.platformScoresAreReal ? (
                          platform.score > 0 ? `${platform.score}%` : "—"
                        ) : (
                          platform.score
                        )}
                      </p>
                      {result.aio.platformScoresAreReal && (
                        <p className="text-[9px] text-zinc-500 mt-1">
                          {platform.score > 0 ? "cited" : "not found"}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Detailed Breakdown */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* SEO Breakdown */}
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-white">
                      <TrendingUp className="w-5 h-5 text-emerald-400" />
                      SEO Breakdown
                    </CardTitle>
                    <div className="flex gap-2">
                      <Badge variant="destructive">{result.seo.issueCount.critical} Issues</Badge>
                      <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-600">
                        {result.seo.issueCount.warning} Warnings
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {result.seo.details && (
                    <>
                      <CategoryBreakdown 
                        title="Technical" 
                        score={result.seo.breakdown.technicalScore} 
                        maxScore={20}
                        items={result.seo.details.technical}
                        defaultOpen={result.seo.breakdown.technicalScore < 15}
                      />
                      <CategoryBreakdown 
                        title="Content" 
                        score={result.seo.breakdown.contentScore} 
                        maxScore={20}
                        items={result.seo.details.content}
                        defaultOpen={result.seo.breakdown.contentScore < 15}
                      />
                      <CategoryBreakdown 
                        title="Meta Tags" 
                        score={result.seo.breakdown.metaScore} 
                        maxScore={20}
                        items={result.seo.details.meta}
                      />
                      <CategoryBreakdown 
                        title="Performance" 
                        score={result.seo.breakdown.performanceScore} 
                        maxScore={20}
                        items={result.seo.details.performance}
                      />
                      <CategoryBreakdown 
                        title="Accessibility" 
                        score={result.seo.breakdown.accessibilityScore} 
                        maxScore={20}
                        items={result.seo.details.accessibility}
                        defaultOpen={result.seo.breakdown.accessibilityScore < 15}
                      />
                    </>
                  )}
                </CardContent>
              </Card>

              {/* AIO Breakdown */}
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Bot className="w-5 h-5 text-emerald-400" />
                    AI Visibility Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {result.aio.details && (
                    <>
                      <CategoryBreakdown 
                        title="Content Structure" 
                        score={result.aio.breakdown.structureScore} 
                        maxScore={20}
                        items={result.aio.details.structure}
                        defaultOpen={result.aio.breakdown.structureScore < 12}
                      />
                      <CategoryBreakdown 
                        title="Authority Signals" 
                        score={result.aio.breakdown.authorityScore} 
                        maxScore={20}
                        items={result.aio.details.authority}
                      />
                      <CategoryBreakdown 
                        title="Schema Markup" 
                        score={result.aio.breakdown.schemaScore} 
                        maxScore={20}
                        items={result.aio.details.schema}
                        defaultOpen={result.aio.breakdown.schemaScore < 10}
                      />
                      <CategoryBreakdown 
                        title="Content Quality" 
                        score={result.aio.breakdown.contentQualityScore} 
                        maxScore={20}
                        items={result.aio.details.contentQuality}
                      />
                      <CategoryBreakdown 
                        title="Quotability" 
                        score={result.aio.breakdown.quotabilityScore} 
                        maxScore={20}
                        items={result.aio.details.quotability}
                      />
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* AI Factors Checklist */}
            <Card className="mb-8 bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">AI Optimization Factors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-x-8">
                  <div>
                    <FactorCheck 
                      label="Direct, factual answers" 
                      checked={result.aio.factors.hasDirectAnswers}
                      impact="high"
                      tooltip="Start content with 'X is...' or 'X refers to...' definitions"
                    />
                    <FactorCheck 
                      label="FAQ section" 
                      checked={result.aio.factors.hasFAQSection}
                      impact="high"
                      tooltip="Add a Frequently Asked Questions section"
                    />
                    <FactorCheck 
                      label="Schema markup" 
                      checked={result.aio.factors.hasSchema}
                      impact="high"
                      tooltip="Add JSON-LD structured data (FAQ, Article, HowTo)"
                    />
                    <FactorCheck 
                      label="Author information" 
                      checked={result.aio.factors.hasAuthorInfo}
                      impact="medium"
                      tooltip="Include author name and credentials"
                    />
                  </div>
                  <div>
                    <FactorCheck 
                      label="Citations & sources" 
                      checked={result.aio.factors.hasCitations}
                      impact="medium"
                      tooltip="Reference authoritative sources with 'According to...'"
                    />
                    <FactorCheck 
                      label="Key takeaways section" 
                      checked={result.aio.factors.hasKeyTakeaways}
                      impact="medium"
                      tooltip="Add a 'Key Takeaways' or 'Summary' section"
                    />
                    <FactorCheck 
                      label={`Avg sentence: ${result.aio.factors.avgSentenceLength} words`}
                      checked={result.aio.factors.avgSentenceLength < 25}
                      impact="low"
                      tooltip="Keep sentences under 20-25 words for better AI extraction"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Recommendations */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2 text-white">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    Top SEO Fixes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.seo.recommendations.length > 0 ? (
                      result.seo.recommendations.map((rec, i) => (
                        <li key={i} className="flex gap-2 text-sm text-zinc-300">
                          <span className="text-emerald-400 font-bold">{i + 1}.</span>
                          <span>{rec}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-emerald-400 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Great job! No major SEO issues found.
                      </li>
                    )}
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2 text-white">
                    <Bot className="w-4 h-4 text-emerald-400" />
                    Top AI Visibility Fixes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.aio.recommendations.length > 0 ? (
                      result.aio.recommendations.map((rec, i) => (
                        <li key={i} className="flex gap-2 text-sm text-zinc-300">
                          <span className="text-emerald-400 font-bold">{i + 1}.</span>
                          <span>{rec}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-emerald-400 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Excellent! Your content is AI-optimized.
                      </li>
                    )}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* CTA - Strong conversion block */}
            <Card className="bg-gradient-to-br from-emerald-600/20 via-emerald-500/10 to-zinc-900 border-emerald-500/30 overflow-hidden">
              <CardContent className="p-8 relative">
                {/* Urgency banner */}
                <div className="absolute top-0 left-0 right-0 bg-red-500/90 text-white text-center py-2 px-4">
                  <p className="text-sm font-medium">
                    🔥 {totalIssues} issues found — Fix them automatically with CabbageSEO
                  </p>
                </div>

                <div className="text-center pt-8">
                  <h3 className="text-3xl font-bold mb-3 text-white">
                    Ready to Dominate AI Search?
                  </h3>
                  <p className="text-lg text-zinc-400 mb-2 max-w-xl mx-auto">
                    While you're reading this, your competitors are getting cited by ChatGPT.
                  </p>
                  <p className="text-zinc-500 mb-8 max-w-xl mx-auto">
                    CabbageSEO automatically fixes these {totalIssues} issues and keeps your content 
                    AI-optimized. Set it and forget it.
                  </p>
                  
                  {/* Value Props */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl mx-auto mb-8">
                    {[
                      { icon: Zap, label: "Auto-fix all issues", highlight: true },
                      { icon: Bot, label: "Monitor AI citations" },
                      { icon: FileText, label: "AI content generation" },
                      { icon: TrendingUp, label: "Track rankings" },
                      { icon: Link2, label: "Publish to WordPress" },
                      { icon: Sparkles, label: "Daily optimization" },
                    ].map(({ icon: Icon, label, highlight }) => (
                      <div 
                        key={label}
                        className={`flex items-center gap-3 text-sm rounded-lg p-3 ${
                          highlight 
                            ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-300" 
                            : "bg-zinc-800/50 text-zinc-300"
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${highlight ? "text-emerald-400" : "text-zinc-500"}`} />
                        <span className={highlight ? "font-medium" : ""}>{label}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/pricing">
                      <Button size="lg" className="bg-emerald-600 hover:bg-emerald-500 text-white text-lg px-8 h-14">
                        Fix These {totalIssues} Issues Now
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    </Link>
                    <Link href="/pricing">
                      <Button size="lg" variant="outline" className="border-zinc-600 text-zinc-300 hover:bg-zinc-800 h-14">
                        View All Plans
                      </Button>
                    </Link>
                  </div>

                  {/* Trust signals */}
                  <p className="text-xs text-zinc-500 mt-6">
                    ✓ No credit card required &nbsp;•&nbsp; ✓ Cancel anytime &nbsp;•&nbsp; ✓ 14-day free trial
                  </p>
                </div>
              </CardContent>
            </Card>
              </div>
              {/* End blur wrapper */}
            </div>
          </div>
        </section>
      )}

      {/* Features (no result) */}
      {!result && !loading && (
        <section className="py-16 px-4 border-t border-zinc-800">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold text-center mb-8 text-white">
              Why AI Visibility Matters
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-6">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                  <Bot className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="font-semibold mb-2 text-white">ChatGPT & Perplexity</h3>
                <p className="text-sm text-zinc-400">
                  Millions search through AI. If your content isn't optimized, you're invisible.
                </p>
              </div>
              
              <div className="text-center p-6">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="font-semibold mb-2 text-white">Google AI Overviews</h3>
                <p className="text-sm text-zinc-400">
                  Google shows AI summaries above search results. Get cited or get buried.
                </p>
              </div>
              
              <div className="text-center p-6">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="font-semibold mb-2 text-white">Future-Proof SEO</h3>
                <p className="text-sm text-zinc-400">
                  AI search is the future. Optimize now or play catch-up forever.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-8 px-4">
        <div className="container mx-auto text-center text-sm text-zinc-500">
          <p>© {new Date().getFullYear()} CabbageSEO. The AI-Native SEO OS.</p>
        </div>
      </footer>

      {/* Exit Intent Popup */}
      <ExitIntentPopup />
    </div>
  );
}

// Wrap with Suspense for useSearchParams
export default function FreeScoringPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mx-auto mb-4" />
          <p className="text-zinc-400">Loading...</p>
        </div>
      </div>
    }>
      <FreeScoringPageContent />
    </Suspense>
  );
}
