"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Loader2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  MinusCircle,
  AlertTriangle,
  TrendingDown,
  Twitter,
  Copy,
  Check,
  Sparkles,
  FileText,
  HelpCircle,
  Search,
  Lock,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ContentPreview from "@/app/(marketing)/teaser/[id]/content-preview";
import ShareButtons from "@/app/(marketing)/teaser/[id]/share-buttons";
import { AnimateIn } from "@/components/motion/animate-in";
import type { ContentPreviewData } from "@/lib/db/schema";

export interface TeaserResult {
  query: string;
  platform: "perplexity" | "gemini" | "chatgpt";
  aiRecommends: string[];
  mentionedYou: boolean;
  snippet: string;
  inCitations?: boolean;
  domainFound?: boolean;
  mentionPosition?: number;
  mentionCount?: number;
}

export interface TeaserData {
  domain: string;
  results: TeaserResult[];
  summary: {
    totalQueries: number;
    mentionedCount: number;
    isInvisible: boolean;
    brandsDetected?: string[];
    message: string;
    visibilityScore?: number;
    platformScores?: Record<string, number>;
    scoreBreakdown?: {
      citationPresence: number;
      domainVisibility: number;
      brandRecognition: number;
      mentionProminence: number;
      mentionDepth: number;
    };
    scoreExplanation?: string;
    businessSummary?: string;
  };
  reportId?: string;
  contentPreview?: ContentPreviewData;
}

const PLATFORM_LABELS: Record<string, { name: string; color: string; icon: string }> = {
  perplexity: { name: "Perplexity", color: "text-blue-400", icon: "P" },
  gemini: { name: "Google AI", color: "text-purple-400", icon: "G" },
  chatgpt: { name: "ChatGPT", color: "text-emerald-400", icon: "C" },
};

const FACTOR_LABELS: Record<string, { label: string; max: number; description: string }> = {
  citationPresence: { label: "Cited as source", max: 40, description: "Your domain appears in citation links" },
  domainVisibility: { label: "Domain referenced", max: 25, description: "Your full domain is mentioned in AI responses" },
  brandRecognition: { label: "Brand recognized", max: 15, description: "AI knows your brand and can describe it" },
  mentionProminence: { label: "Mention prominence", max: 12, description: "You appear early in AI responses" },
  mentionDepth: { label: "Consistent mentions", max: 8, description: "You are mentioned across multiple responses" },
};

function getCtaHeadline(score: number): string {
  if (score < 15) return "AI doesn't know you yet. Let's fix that and keep it fixed.";
  if (score < 40) return "AI barely knows you. Start closing gaps automatically.";
  if (score <= 60) return "AI recognizes you. Stay on top with continuous monitoring.";
  return "Strong visibility. Don't let it slip — keep monitoring.";
}

function getScoreColor(score: number): string {
  if (score < 20) return "text-red-500";
  if (score < 40) return "text-red-400";
  if (score < 60) return "text-amber-400";
  if (score < 80) return "text-emerald-400";
  return "text-emerald-500";
}

function getScoreGlow(score: number): string {
  if (score < 40) return "shadow-red-500/20";
  if (score < 60) return "shadow-amber-500/20";
  return "shadow-emerald-500/20";
}

function getScoreBorderColor(score: number): string {
  if (score < 40) return "border-red-500/30";
  if (score < 60) return "border-amber-500/30";
  return "border-emerald-500/30";
}

function getScoreBg(score: number): string {
  if (score < 40) return "from-red-950/80 via-zinc-900 to-zinc-900";
  if (score < 60) return "from-amber-950/80 via-zinc-900 to-zinc-900";
  return "from-emerald-950/80 via-zinc-900 to-zinc-900";
}

function getStatusBadge(result: TeaserResult) {
  if (result.inCitations) {
    return {
      label: "Cited",
      icon: CheckCircle2,
      className: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    };
  }
  if (result.domainFound) {
    return {
      label: "Domain found",
      icon: CheckCircle2,
      className: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    };
  }
  if (result.mentionedYou) {
    return {
      label: "Recognized",
      icon: MinusCircle,
      className: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    };
  }
  return {
    label: "Not found",
    icon: XCircle,
    className: "bg-red-500/10 text-red-400 border border-red-500/20",
  };
}

function FixPageTeaser({ domain, gapCount, visibilityScore }: { domain: string; gapCount: number; visibilityScore: number }) {
  return (
    <div className="relative bg-zinc-900 border border-emerald-500/20 rounded-2xl overflow-hidden mb-8 shadow-2xl shadow-emerald-500/[0.06]">
      {/* Ambient glow */}
      <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-emerald-500/[0.06] rounded-full blur-[100px] pointer-events-none" />

      {/* Header banner */}
      <div className="relative bg-gradient-to-r from-emerald-500/15 via-emerald-500/10 to-teal-500/15 border-b border-emerald-500/20 px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-400">
              We can build fix pages for {domain}
            </p>
            <p className="text-xs text-emerald-400/60">
              AI-optimized content that earns citations
            </p>
          </div>
        </div>
      </div>

      <div className="relative p-6">
        {/* Mock page preview — blurred */}
        <div className="mb-5">
          <div className="flex flex-wrap gap-2 mb-4">
            {[
              { icon: FileText, label: "1,000+ words" },
              { icon: HelpCircle, label: "FAQ schema" },
              { icon: Search, label: "AI-citable structure" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-800/80 border border-zinc-700/50 rounded-lg">
                <Icon className="w-3 h-3 text-emerald-400" />
                <span className="text-xs text-zinc-400">{label}</span>
              </div>
            ))}
          </div>

          <div className="relative">
            {/* Blurred mock content */}
            <div className="bg-zinc-800/30 border border-zinc-800 rounded-xl p-5 select-none blur-[6px] pointer-events-none space-y-3" aria-hidden="true">
              <div className="h-6 bg-zinc-700/40 rounded w-3/4" />
              <div className="h-3 bg-zinc-700/30 rounded w-full" />
              <div className="h-3 bg-zinc-700/30 rounded w-5/6" />
              <div className="h-3 bg-zinc-700/30 rounded w-full" />
              <div className="h-3 bg-zinc-700/30 rounded w-2/3" />
              <div className="h-5 bg-zinc-700/40 rounded w-1/2 mt-4" />
              <div className="h-3 bg-zinc-700/30 rounded w-full" />
              <div className="h-3 bg-zinc-700/30 rounded w-4/5" />
              <div className="h-3 bg-zinc-700/30 rounded w-full" />
              <div className="h-3 bg-zinc-700/30 rounded w-3/4" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-zinc-900/95 backdrop-blur-sm border border-zinc-700/80 rounded-xl px-6 py-5 text-center shadow-2xl max-w-xs">
                <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center mx-auto mb-3">
                  <Lock className="w-4 h-4 text-zinc-400" />
                </div>
                <p className="text-white font-semibold text-sm mb-1">
                  {gapCount > 0
                    ? `${gapCount} fix page${gapCount > 1 ? "s" : ""} ready to generate`
                    : "Fix pages ready to generate"
                  }
                </p>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Comparison content, FAQ schema, and meta tags — targeted at the exact queries where AI doesn&rsquo;t mention you
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* What's included checklist */}
        <div className="mb-6 bg-emerald-500/[0.04] border border-emerald-500/10 rounded-xl p-4">
          <p className="text-xs font-medium text-emerald-400 uppercase tracking-wide mb-3">
            Each fix page includes
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              "SEO-optimized comparison content",
              "FAQ schema for rich results",
              "AI-citable page structure",
              "Natural brand positioning",
              "Ready to copy-paste & publish",
              "Auto-generated meta tags",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500/60 shrink-0" />
                <span className="text-xs text-zinc-400">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <Link
          href={`/signup?domain=${encodeURIComponent(domain)}&score=${visibilityScore}`}
          className="group flex items-center justify-center gap-2 w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98]"
        >
          Get your fix pages + full action plan
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
        <p className="text-xs text-zinc-500 text-center mt-2">
          We generate the content — you just publish it
        </p>
      </div>
    </div>
  );
}

interface ScanResultsProps {
  data: TeaserData;
}

export function ScanResults({ data }: ScanResultsProps) {
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showStickyCta, setShowStickyCta] = useState(false);
  const [tweetCopied, setTweetCopied] = useState(false);
  const scoreCardRef = useRef<HTMLDivElement>(null);
  const mainCtaRef = useRef<HTMLDivElement>(null);

  const { domain, summary, reportId, contentPreview } = data;
  const visibilityScore = summary.visibilityScore ?? (summary.isInvisible ? 0 : Math.min(100, summary.mentionedCount * 25));
  const platformScores = summary.platformScores || {};
  const scoreBreakdown = summary.scoreBreakdown;

  // Gaps = platforms where you're NOT cited or found
  const gaps = data.results.filter(r => !r.inCitations && !r.domainFound && !r.mentionedYou);
  const gapCount = gaps.length;

  // Show sticky CTA after scrolling past score card, hide near main CTA
  useEffect(() => {
    const handleScroll = () => {
      const scoreBottom = scoreCardRef.current?.getBoundingClientRect().bottom ?? 0;
      const ctaTop = mainCtaRef.current?.getBoundingClientRect().top ?? Infinity;
      setShowStickyCta(scoreBottom < -100 && ctaTop > window.innerHeight + 50);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleGoogleSignup = async () => {
    setAuthLoading(true);
    setAuthError("");

    const supabase = createClient();
    if (!supabase) {
      setAuthError("Authentication is not configured");
      setAuthLoading(false);
      return;
    }

    let callbackUrl = `${window.location.origin}/auth/callback`;
    if (domain) {
      callbackUrl += `?domain=${encodeURIComponent(domain)}`;
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) {
      setAuthError(error.message);
      setAuthLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 relative">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-emerald-500/[0.04] rounded-full blur-[120px] pointer-events-none" />

      {/* ========== VISIBILITY SCORE CARD ========== */}
      <AnimateIn>
        <div
          ref={scoreCardRef}
          className={`relative overflow-hidden rounded-2xl p-8 mb-8 bg-gradient-to-br ${getScoreBg(visibilityScore)} border-2 ${getScoreBorderColor(visibilityScore)} shadow-2xl ${getScoreGlow(visibilityScore)}`}
        >
          {/* Dot pattern */}
          <div className="absolute inset-0 opacity-5">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
                backgroundSize: "24px 24px",
              }}
            />
          </div>

          <div className="relative">
            <div className="text-center mb-6">
              <p className="text-zinc-400 text-sm mb-1">
                AI Visibility Report for
              </p>
              <p className="text-2xl font-bold text-white">{domain}</p>
              {summary.businessSummary && (
                <p className="text-zinc-500 text-sm mt-1">{summary.businessSummary}</p>
              )}
            </div>

            {/* Score */}
            <div className="text-center mb-6">
              <div className={`text-8xl font-black tabular-nums ${getScoreColor(visibilityScore)}`}>
                {visibilityScore}
              </div>
              <p className="text-zinc-400 mt-2 text-lg">out of 100</p>
            </div>

            {/* Per-platform results */}
            {Object.keys(platformScores).length > 0 && (
              <div className="grid grid-cols-3 gap-3 mb-6 max-w-md mx-auto">
                {data.results.map((r) => {
                  const pl = PLATFORM_LABELS[r.platform];
                  const ps = platformScores[r.platform] ?? 0;
                  const status = getStatusBadge(r);
                  const StatusIcon = status.icon;
                  return (
                    <div key={r.platform} className="bg-white/[0.04] rounded-xl p-3 text-center border border-white/[0.06] hover:border-white/[0.12] transition-colors">
                      <p className={`text-xs font-medium mb-1 ${pl?.color || "text-zinc-400"}`}>
                        {pl?.name || r.platform}
                      </p>
                      <div className={`text-2xl font-bold tabular-nums ${ps > 30 ? "text-white" : "text-zinc-500"}`}>
                        {ps}
                      </div>
                      <div className="flex items-center justify-center gap-1 mt-1">
                        <StatusIcon className={`w-3 h-3 ${status.className.includes("emerald") ? "text-emerald-400" : status.className.includes("amber") ? "text-amber-400" : "text-red-400"}`} />
                        <span className="text-xs text-zinc-500">{status.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Score breakdown toggle */}
            {scoreBreakdown && (
              <div className="mb-6">
                <button
                  onClick={() => setShowBreakdown(!showBreakdown)}
                  className="mx-auto flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  How is this scored?
                  {showBreakdown ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {showBreakdown && (
                  <div className="mt-3 bg-black/30 backdrop-blur-sm rounded-xl p-4 space-y-3 border border-white/[0.04]">
                    {Object.entries(scoreBreakdown).map(([key, value]) => {
                      const factor = FACTOR_LABELS[key];
                      if (!factor) return null;
                      const pct = (value / factor.max) * 100;
                      return (
                        <div key={key}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-zinc-300 text-sm">{factor.label}</span>
                            <span className="text-zinc-500 text-xs tabular-nums">
                              {value}/{factor.max}
                            </span>
                          </div>
                          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-1000 ${
                                pct > 60 ? "bg-emerald-500" : pct > 30 ? "bg-amber-500" : "bg-red-500"
                              }`}
                              style={{ width: `${Math.max(pct, 2)}%` }}
                            />
                          </div>
                          <p className="text-zinc-600 text-xs mt-0.5">{factor.description}</p>
                        </div>
                      );
                    })}
                    {summary.scoreExplanation && (
                      <p className="text-zinc-400 text-sm pt-3 border-t border-zinc-800">
                        {summary.scoreExplanation}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Verdict */}
            <div className="text-center mb-6">
              {visibilityScore < 15 ? (
                <>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    AI doesn&rsquo;t know <span className="text-red-400">{domain}</span> yet
                  </h2>
                  <p className="text-zinc-400 text-lg max-w-lg mx-auto">
                    When people ask AI about your space, your brand doesn&rsquo;t come up.
                    This is fixable.
                  </p>
                </>
              ) : visibilityScore < 40 ? (
                <>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    AI has <span className="text-amber-400">limited awareness</span> of you
                  </h2>
                  <p className="text-zinc-400 text-lg max-w-lg mx-auto">
                    Some platforms recognize your brand, but you&rsquo;re not being cited or
                    recommended consistently.
                  </p>
                </>
              ) : visibilityScore < 60 ? (
                <>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    AI <span className="text-amber-400">recognizes you</span> but rarely cites you
                  </h2>
                  <p className="text-zinc-400 text-lg max-w-lg mx-auto">
                    {summary.message}
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    AI <span className="text-emerald-400">actively recommends</span> you
                  </h2>
                  <p className="text-zinc-400 text-lg max-w-lg mx-auto">
                    You&rsquo;re being cited and referenced. Keep building on this.
                  </p>
                </>
              )}
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 max-w-md mx-auto mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{summary.totalQueries}</div>
                <p className="text-zinc-500 text-xs">Platforms checked</p>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${summary.mentionedCount > 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {summary.mentionedCount}
                </div>
                <p className="text-zinc-500 text-xs">Recognized you</p>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${data.results.filter(r => r.inCitations || r.domainFound).length > 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {data.results.filter(r => r.inCitations || r.domainFound).length}
                </div>
                <p className="text-zinc-500 text-xs">Cited you</p>
              </div>
            </div>

            <p className="text-center text-zinc-600 text-xs">
              cabbageseo.com &middot; Free AI Visibility Scan
            </p>
          </div>
        </div>
      </AnimateIn>

      {/* ========== SHARE ON X ========== */}
      <AnimateIn delay={0.05}>
        {(() => {
          const reportLink = `https://cabbageseo.com/r/${domain}`;

          const tweetText = visibilityScore < 20
            ? `I just checked if AI recommends ${domain}...\n\nAI Visibility Score: ${visibilityScore}/100\n\nChatGPT, Perplexity & Google AI don't know we exist yet.\n\nCheck yours free 👇\n${reportLink}`
            : visibilityScore < 50
              ? `I just checked if AI recommends ${domain}...\n\nAI Visibility Score: ${visibilityScore}/100\n\nAI barely knows us. ${gapCount > 0 ? `${gapCount} gap${gapCount > 1 ? "s" : ""} to fix.` : ""}\n\nCheck yours free 👇\n${reportLink}`
              : `I just checked if AI recommends ${domain}...\n\nAI Visibility Score: ${visibilityScore}/100 ✅\n\n${summary.mentionedCount}/${summary.totalQueries} platforms recognize us.\n\nCheck yours free 👇\n${reportLink}`;

          const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;

          const handleCopyTweet = () => {
            navigator.clipboard.writeText(tweetText);
            setTweetCopied(true);
            setTimeout(() => setTweetCopied(false), 2500);
          };

          return (
            <div className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-6 mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Twitter className="w-5 h-5 text-white" />
                <h3 className="text-white font-semibold">Share your score on X</h3>
              </div>

              <div className="bg-black/40 border border-zinc-700/50 rounded-xl p-4 mb-4 font-mono text-sm leading-relaxed whitespace-pre-line text-zinc-300">
                {tweetText}
              </div>

              <div className="flex items-center gap-3">
                <a
                  href={tweetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-zinc-200 text-black font-bold rounded-lg transition-all duration-200 text-sm hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Twitter className="w-4 h-4" />
                  Post to X
                </a>
                <button
                  onClick={handleCopyTweet}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg transition-all duration-200"
                >
                  {tweetCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  {tweetCopied ? "Copied!" : "Copy text"}
                </button>
              </div>
            </div>
          );
        })()}
      </AnimateIn>

      {/* ========== GAPS ALERT ========== */}
      {gapCount > 0 && (
        <AnimateIn delay={0.08}>
          <div className="relative bg-red-950/40 border border-red-500/20 rounded-2xl p-6 mb-8 overflow-hidden">
            <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-red-500/[0.06] rounded-full blur-[80px] pointer-events-none" />

            <div className="relative">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/20 flex items-center justify-center shrink-0 shadow-lg shadow-red-500/10">
                  <TrendingDown className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {gapCount === data.results.length
                      ? "You're invisible to AI right now"
                      : `${gapCount} of ${data.results.length} AI platforms don't mention you`}
                  </h3>
                  <p className="text-zinc-400 text-sm mt-1">
                    When someone asks AI about your space, these platforms recommend others instead of you.
                    Every day this continues, potential customers go elsewhere.
                  </p>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                {gaps.slice(0, 3).map((gap, i) => {
                  const pl = PLATFORM_LABELS[gap.platform];
                  return (
                    <div key={i} className="flex items-center gap-3 bg-black/30 border border-red-500/10 rounded-lg px-4 py-2.5">
                      <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">&ldquo;{gap.query}&rdquo;</p>
                        <p className="text-zinc-500 text-xs">{pl?.name || gap.platform} &mdash; doesn&apos;t mention you</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <Link
                href={`/signup?domain=${encodeURIComponent(domain)}&score=${visibilityScore}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-400 text-white font-bold rounded-lg transition-all duration-200 text-sm hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-red-500/20"
              >
                Start fixing these gaps
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </AnimateIn>
      )}

      {/* Gradient divider */}
      <div className="w-2/3 h-px mx-auto bg-gradient-to-r from-transparent via-zinc-700/50 to-transparent mb-8" />

      {/* ========== WHAT EACH PLATFORM SAID ========== */}
      <AnimateIn delay={0.1}>
        <div className="space-y-3 mb-8">
          <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wide">
            What each platform said
          </h3>
          {data.results.map((result, i) => {
            const pl = PLATFORM_LABELS[result.platform];
            const ps = platformScores[result.platform];
            const status = getStatusBadge(result);
            const StatusIcon = status.icon;
            return (
              <div
                key={i}
                className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-800/50 rounded-xl p-5 hover:border-zinc-700/50 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className={`text-xs font-medium uppercase tracking-wide ${pl?.color || "text-zinc-500"}`}>
                        {pl?.name || result.platform}
                      </p>
                      {ps !== undefined && (
                        <span className="text-xs text-zinc-600 tabular-nums">{ps}/100</span>
                      )}
                    </div>
                    <p className="text-white font-medium">
                      &ldquo;{result.query}&rdquo;
                    </p>
                  </div>
                  <div
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${status.className}`}
                  >
                    <StatusIcon className="w-3 h-3" />
                    {status.label}
                  </div>
                </div>

                {result.snippet && (
                  <p className="text-zinc-500 text-sm line-clamp-4 leading-relaxed">{result.snippet}</p>
                )}

                {result.aiRecommends && result.aiRecommends.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-zinc-800/50">
                    <p className="text-zinc-600 text-xs mb-1.5">Also mentioned in this response:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {result.aiRecommends.map((brand) => (
                        <span
                          key={brand}
                          className="px-2 py-0.5 bg-zinc-800/80 text-zinc-400 text-xs rounded-md border border-zinc-700/50"
                        >
                          {brand}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </AnimateIn>

      {/* ========== CO-CITATION SUMMARY ========== */}
      {(() => {
        const allCoCited = Array.from(new Set(data.results.flatMap(r => r.aiRecommends || [])));
        if (allCoCited.length === 0) return null;
        return (
          <AnimateIn delay={0.12}>
            <div className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-800/50 rounded-xl p-5 mb-8">
              <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wide mb-1">
                Your co-citation landscape
              </h3>
              <p className="text-zinc-600 text-xs mb-3">
                Brands AI mentions alongside yours. Being cited in the same context as these brands strengthens your semantic positioning.
              </p>
              <div className="flex flex-wrap gap-2">
                {allCoCited.map((brand) => {
                  const appearsIn = data.results.filter(r => r.aiRecommends?.includes(brand)).length;
                  return (
                    <span
                      key={brand}
                      className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${
                        appearsIn >= 2
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-sm shadow-emerald-500/10"
                          : "bg-zinc-800 text-zinc-400 border-zinc-700/50"
                      }`}
                    >
                      {brand}
                      {appearsIn >= 2 && (
                        <span className="ml-1 text-emerald-500/60">{appearsIn}x</span>
                      )}
                    </span>
                  );
                })}
              </div>
            </div>
          </AnimateIn>
        );
      })()}

      {/* Gradient divider before content preview */}
      <div className="w-2/3 h-px mx-auto bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent mb-8" />

      {/* ========== AI CONTENT PREVIEW ========== */}
      <AnimateIn delay={0.15}>
        {contentPreview ? (
          <ContentPreview domain={domain} preview={contentPreview} />
        ) : (
          <FixPageTeaser domain={domain} gapCount={gapCount} visibilityScore={visibilityScore} />
        )}
      </AnimateIn>

      {/* ========== MAIN CTA ========== */}
      <AnimateIn delay={0.2}>
        <div ref={mainCtaRef} className="rounded-2xl overflow-hidden mb-8 shadow-2xl shadow-emerald-500/10">
          {/* Urgency banner */}
          <div className="bg-red-500/10 border-b border-red-500/20 px-6 py-3 flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <p className="text-red-300 text-sm font-medium">
              AI models retrain weekly. Your visibility can shift any day.
            </p>
          </div>

          <div className="bg-emerald-500 p-8 relative overflow-hidden">
            {/* Subtle dot pattern */}
            <div className="absolute inset-0 opacity-[0.04]">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `radial-gradient(circle at 1px 1px, black 1px, transparent 0)`,
                  backgroundSize: "20px 20px",
                }}
              />
            </div>

            <div className="text-center relative">
              <h2 className="text-2xl font-bold text-black mb-2">
                {getCtaHeadline(visibilityScore)}
              </h2>
              <p className="text-black/70 text-sm mb-6 max-w-lg mx-auto">
                {gapCount > 0
                  ? `We found ${gapCount} gap${gapCount > 1 ? "s" : ""} where AI talks about your space but doesn't mention you. CabbageSEO monitors these daily, generates fix pages, and tracks your progress automatically.`
                  : "CabbageSEO monitors your AI visibility daily, generates optimized content when gaps appear, and tracks your progress automatically."
                }
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 max-w-xl mx-auto">
                <div className="bg-black/10 rounded-lg px-3 py-2.5 text-left backdrop-blur-sm">
                  <p className="text-black font-bold text-sm">Daily scans</p>
                  <p className="text-black/60 text-xs">Track shifts across 3 AI platforms</p>
                </div>
                <div className="bg-black/10 rounded-lg px-3 py-2.5 text-left backdrop-blur-sm">
                  <p className="text-black font-bold text-sm">Fix pages</p>
                  <p className="text-black/60 text-xs">AI writes pages that earn citations</p>
                </div>
                <div className="bg-black/10 rounded-lg px-3 py-2.5 text-left backdrop-blur-sm">
                  <p className="text-black font-bold text-sm">Action plans</p>
                  <p className="text-black/60 text-xs">Exact steps to close each gap</p>
                </div>
              </div>

              <button
                onClick={handleGoogleSignup}
                disabled={authLoading}
                className="inline-flex items-center gap-3 px-8 py-4 bg-black hover:bg-zinc-900 text-white font-bold rounded-xl transition-all duration-300 shadow-lg shadow-black/20 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
              >
                {authLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                )}
                Start fixing my AI visibility
              </button>

              {authError && (
                <p className="mt-3 text-red-900 text-sm font-medium">{authError}</p>
              )}

              <div className="mt-4">
                <Link
                  href={`/signup?domain=${encodeURIComponent(domain)}&score=${visibilityScore}`}
                  className="text-sm text-black/70 hover:text-black font-medium underline underline-offset-2 transition-colors"
                >
                  or sign up with email
                </Link>
              </div>

              <p className="mt-3 text-black/60 text-sm">
                From $39/mo &middot; Cancel anytime
              </p>
            </div>
          </div>
        </div>
      </AnimateIn>

      {/* ========== STICKY BOTTOM CTA BAR ========== */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ${
          showStickyCta
            ? "translate-y-0 opacity-100"
            : "translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        <div className="bg-zinc-900/95 backdrop-blur-lg border-t border-zinc-800 shadow-2xl">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div className="hidden sm:block min-w-0">
              <p className="text-white font-semibold text-sm truncate">
                {visibilityScore < 30
                  ? `${domain} is invisible to AI`
                  : `${domain} needs work`}
              </p>
              <p className="text-zinc-400 text-xs truncate">
                {gapCount > 0
                  ? `${gapCount} gap${gapCount > 1 ? "s" : ""} found — fix them automatically`
                  : "Monitor and improve your AI presence"
                }
              </p>
            </div>
            <Link
              href={`/signup?domain=${encodeURIComponent(domain)}&score=${visibilityScore}`}
              className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-lg transition-all duration-200 text-sm hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-emerald-500/20"
            >
              Start fixing this
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
