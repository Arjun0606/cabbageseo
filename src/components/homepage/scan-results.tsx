"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  TrendingDown,
  Loader2,
  Mail,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ContentPreview from "@/app/(marketing)/teaser/[id]/content-preview";
import ShareButtons from "@/app/(marketing)/teaser/[id]/share-buttons";
import { AnimateIn } from "@/components/motion/animate-in";
import { GlassCard } from "@/components/ui/glass-card";
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
    competitorsMentioned: string[];
    message: string;
    visibilityScore?: number;
    platformScores?: Record<string, number>;
    scoreBreakdown?: {
      citationPresence: number;
      domainVisibility: number;
      brandEcho: number;
      positionBonus: number;
      mentionDepth: number;
      competitorDensity: number;
    };
    scoreExplanation?: string;
  };
  reportId?: string;
  contentPreview?: ContentPreviewData;
}

const PLATFORM_LABELS: Record<string, { name: string; color: string }> = {
  perplexity: { name: "Perplexity", color: "text-blue-400" },
  gemini: { name: "Google AI", color: "text-purple-400" },
  chatgpt: { name: "ChatGPT", color: "text-emerald-400" },
};

const FACTOR_LABELS: Record<string, { label: string; max: number }> = {
  citationPresence: { label: "Cited as source", max: 40 },
  domainVisibility: { label: "Domain referenced", max: 25 },
  brandEcho: { label: "Brand echo (weak)", max: 8 },
  positionBonus: { label: "Mention prominence", max: 12 },
  mentionDepth: { label: "Mention depth", max: 10 },
  competitorDensity: { label: "Market crowding", max: 5 },
};

function getCtaHeadline(score: number): string {
  if (score < 30) return "You're invisible to AI. Start your 30-day fix.";
  if (score <= 60) return "AI knows you exist. Now dominate your category.";
  return "You're ahead of most. Lock in your lead.";
}

function getScoreColor(score: number): string {
  if (score < 20) return "text-red-500";
  if (score < 40) return "text-red-400";
  if (score < 60) return "text-amber-400";
  if (score < 80) return "text-emerald-400";
  return "text-emerald-500";
}

interface ScanResultsProps {
  data: TeaserData;
  gated?: boolean;
  onEmailSubmit?: () => void;
}

export function ScanResults({ data, gated = false, onEmailSubmit }: ScanResultsProps) {
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [gateEmail, setGateEmail] = useState("");
  const [gateLoading, setGateLoading] = useState(false);
  const [gateError, setGateError] = useState("");
  const [showBreakdown, setShowBreakdown] = useState(false);

  const handleEmailGate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gateEmail.trim()) return;
    setGateLoading(true);
    setGateError("");

    try {
      const res = await fetch("/api/teaser/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: gateEmail.trim(),
          domain: data.domain,
          reportId: data.reportId || null,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to subscribe");
      onEmailSubmit?.();
    } catch (err) {
      setGateError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setGateLoading(false);
    }
  };

  const { domain, summary, reportId, contentPreview } = data;
  const visibilityScore = summary.visibilityScore ?? (summary.isInvisible ? 0 : Math.min(100, summary.mentionedCount * 25));
  const competitorCount = summary.competitorsMentioned.length;
  const platformScores = summary.platformScores || {};
  const scoreBreakdown = summary.scoreBreakdown;

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
    <div className="max-w-3xl mx-auto px-6 py-12">
      {/* ========== THE VERDICT CARD ========== */}
      <AnimateIn>
        <div
          className={`relative overflow-hidden rounded-2xl p-8 mb-8 ${
            visibilityScore < 40
              ? "bg-gradient-to-br from-red-950/80 via-zinc-900 to-zinc-900 border-2 border-red-500/30"
              : "bg-gradient-to-br from-emerald-950/80 via-zinc-900 to-zinc-900 border-2 border-emerald-500/30"
          }`}
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
            </div>

            {/* Score */}
            <div className="text-center mb-4">
              <div className={`text-8xl font-black tabular-nums ${getScoreColor(visibilityScore)}`}>
                {visibilityScore}
              </div>
              <p className="text-zinc-400 mt-2">AI Visibility Score</p>
            </div>

            {/* Per-platform mini scores */}
            {Object.keys(platformScores).length > 0 && (
              <div className="flex justify-center gap-4 mb-6">
                {data.results.map((r) => {
                  const pl = PLATFORM_LABELS[r.platform];
                  const ps = platformScores[r.platform] ?? 0;
                  return (
                    <div key={r.platform} className="text-center">
                      <div className={`text-lg font-bold tabular-nums ${pl?.color || "text-zinc-400"}`}>
                        {ps}
                      </div>
                      <p className="text-zinc-500 text-xs">{pl?.name || r.platform}</p>
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
                  Why this score?
                  {showBreakdown ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {showBreakdown && (
                  <div className="mt-3 bg-black/30 rounded-xl p-4 space-y-2">
                    {Object.entries(scoreBreakdown).map(([key, value]) => {
                      const factor = FACTOR_LABELS[key];
                      if (!factor) return null;
                      const pct = (value / factor.max) * 100;
                      return (
                        <div key={key} className="flex items-center gap-3">
                          <span className="text-zinc-400 text-xs w-32 shrink-0">{factor.label}</span>
                          <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                pct > 60 ? "bg-emerald-500" : pct > 30 ? "bg-amber-500" : "bg-red-500"
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-zinc-500 text-xs tabular-nums w-12 text-right">
                            {value}/{factor.max}
                          </span>
                        </div>
                      );
                    })}
                    {summary.scoreExplanation && (
                      <p className="text-zinc-500 text-xs pt-2 border-t border-zinc-800">
                        {summary.scoreExplanation}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="text-center mb-8">
              {visibilityScore < 15 ? (
                <>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    You are{" "}
                    <span className="text-red-400">invisible</span> to AI
                  </h2>
                  <p className="text-zinc-400 text-lg">
                    When buyers ask AI for recommendations &mdash; you
                    don&rsquo;t exist.
                  </p>
                </>
              ) : visibilityScore < 40 ? (
                <>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    AI{" "}
                    <span className="text-amber-400">barely knows you</span>
                  </h2>
                  <p className="text-zinc-400 text-lg">
                    You need more citations and domain references to rank.
                  </p>
                </>
              ) : visibilityScore < 60 ? (
                <>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    AI{" "}
                    <span className="text-amber-400">sometimes mentions you</span>
                  </h2>
                  <p className="text-zinc-400 text-lg">
                    {summary.message}
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    AI{" "}
                    <span className="text-emerald-400">recommends you</span>
                  </h2>
                  <p className="text-zinc-400 text-lg">
                    You&rsquo;re being cited and recommended. Keep your lead.
                  </p>
                </>
              )}
            </div>

            {competitorCount > 0 && (
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white/[0.04] rounded-xl p-4 text-center border border-white/[0.06]">
                  <div className="text-3xl font-bold text-red-400 mb-1">
                    {competitorCount}
                  </div>
                  <p className="text-zinc-400 text-sm">
                    Competitors AI recommends
                  </p>
                </div>
                <div className="bg-white/[0.04] rounded-xl p-4 text-center border border-white/[0.06]">
                  <div className="text-3xl font-bold text-zinc-500 mb-1">
                    {summary.mentionedCount}
                  </div>
                  <p className="text-zinc-400 text-sm">
                    Times you were mentioned
                  </p>
                </div>
              </div>
            )}

            <p className="text-center text-zinc-600 text-xs">
              cabbageseo.com &bull; Free AI Visibility Report
            </p>
          </div>
        </div>
      </AnimateIn>

      {/* ========== GATED CONTENT OR EMAIL GATE ========== */}
      {gated ? (
        <AnimateIn delay={0.1}>
          <div className="relative mb-8 min-h-[480px]">
            {/* Blurred preview of competitor list + raw responses */}
            <div className="select-none pointer-events-none" aria-hidden="true">
              <div className="blur-md opacity-60">
                <GlassCard hover={false} glow="red" padding="md" className="mb-4">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingDown className="w-5 h-5 text-red-400" />
                    <h3 className="text-lg font-semibold text-white">
                      AI is sending buyers to these instead
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {summary.competitorsMentioned.length > 0
                      ? summary.competitorsMentioned.map((c, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between px-4 py-3 bg-red-500/5 border border-red-500/10 rounded-lg"
                        >
                          <span className="text-white font-medium">{c}</span>
                          <span className="text-red-400 text-sm">Recommended by AI</span>
                        </div>
                      ))
                      : [1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between px-4 py-3 bg-red-500/5 border border-red-500/10 rounded-lg"
                        >
                          <div className="h-4 w-32 bg-zinc-800 rounded" />
                          <div className="h-3 w-24 bg-zinc-800 rounded" />
                        </div>
                      ))}
                  </div>
                </GlassCard>
                <GlassCard hover={false} padding="md" className="mb-4">
                  <p className="text-zinc-400 text-sm">Raw AI Responses</p>
                  <div className="mt-2 space-y-2">
                    <div className="h-14 bg-white/[0.04] rounded-lg" />
                    <div className="h-14 bg-white/[0.04] rounded-lg" />
                    <div className="h-14 bg-white/[0.04] rounded-lg" />
                  </div>
                </GlassCard>
                <GlassCard hover={false} padding="md">
                  <p className="text-zinc-400 text-sm">Your 30-day action plan</p>
                  <div className="mt-2 space-y-2">
                    <div className="h-10 bg-white/[0.04] rounded-lg" />
                    <div className="h-10 bg-white/[0.04] rounded-lg" />
                  </div>
                </GlassCard>
              </div>
            </div>

            {/* Email gate overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full max-w-md mx-auto bg-zinc-900/95 backdrop-blur-sm border border-zinc-700/50 rounded-2xl p-8 shadow-2xl">
                <div className="text-center mb-6">
                  <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                    <TrendingDown className="w-7 h-7 text-red-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    See who AI recommends instead of you
                  </h3>
                  <p className="text-zinc-400 text-sm">
                    Get your full report with competitor names, raw AI quotes, and a custom action plan.
                  </p>
                </div>

                <form onSubmit={handleEmailGate} className="space-y-3">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input
                        type="email"
                        value={gateEmail}
                        onChange={(e) => setGateEmail(e.target.value)}
                        placeholder="you@company.com"
                        required
                        className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 transition-all"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={gateLoading}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {gateLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Send My Full Report
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                  {gateError && (
                    <p className="text-red-400 text-sm text-center">{gateError}</p>
                  )}
                </form>

                <p className="text-center text-zinc-500 text-xs mt-4">
                  Plus free weekly rescans &bull; Unsubscribe anytime
                </p>
              </div>
            </div>
          </div>
        </AnimateIn>
      ) : (
        <>
          {/* ========== COMPETITORS BLOCK ========== */}
          {summary.competitorsMentioned.length > 0 && (
            <AnimateIn delay={0.1}>
              <GlassCard hover={false} glow="red" padding="md" className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingDown className="w-5 h-5 text-red-400" />
                  <h3 className="text-lg font-semibold text-white">
                    AI is sending buyers to these instead
                  </h3>
                </div>
                <div className="space-y-2">
                  {summary.competitorsMentioned.map((competitor, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between px-4 py-3 bg-red-500/5 border border-red-500/10 rounded-lg"
                    >
                      <span className="text-white font-medium">{competitor}</span>
                      <span className="text-red-400 text-sm">
                        Recommended by AI
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-zinc-500 text-sm mt-4">
                  Every day, potential customers ask AI for recommendations. These
                  are the names they hear &mdash; not yours.
                </p>
              </GlassCard>
            </AnimateIn>
          )}

          {/* ========== RAW AI RESPONSES ========== */}
          <AnimateIn delay={0.12}>
            <div className="space-y-3 mb-8">
              <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wide">
                Raw AI Responses
              </h3>
              {data.results.map((result, i) => {
                const pl = PLATFORM_LABELS[result.platform];
                const ps = platformScores[result.platform];
                return (
                  <div
                    key={i}
                    className="bg-zinc-900 border border-zinc-800 rounded-xl p-5"
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
                        className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium ${
                          result.inCitations || result.domainFound
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : result.mentionedYou
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-red-500/10 text-red-400 border border-red-500/20"
                        }`}
                      >
                        {result.inCitations ? "Cited" : result.domainFound ? "Domain found" : result.mentionedYou ? "Name echoed" : "Not found"}
                      </div>
                    </div>

                    {result.snippet && (
                      <p className="text-zinc-500 text-sm mb-3 line-clamp-3">{result.snippet}</p>
                    )}

                    {result.aiRecommends.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {result.aiRecommends.slice(0, 6).map((competitor, j) => (
                          <span
                            key={j}
                            className="px-2 py-1 bg-zinc-800 text-zinc-400 rounded text-xs"
                          >
                            {competitor}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </AnimateIn>

          {/* ========== AI CONTENT PREVIEW ========== */}
          {contentPreview && (
            <AnimateIn delay={0.15}>
              <ContentPreview domain={domain} preview={contentPreview} />
            </AnimateIn>
          )}
        </>
      )}

      {/* ========== CONVERSION CTA — full-width emerald banner ========== */}
      <AnimateIn delay={0.2}>
        <div className="bg-emerald-500 rounded-2xl p-8 mb-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-black mb-6">
              {getCtaHeadline(visibilityScore)}
            </h2>

            {/* Google OAuth CTA */}
            <button
              onClick={handleGoogleSignup}
              disabled={authLoading}
              className="inline-flex items-center gap-3 px-8 py-4 bg-black hover:bg-zinc-900 text-white font-bold rounded-xl transition-colors shadow-lg shadow-black/20 disabled:opacity-50"
            >
              {authLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
              )}
              Sign up &amp; subscribe
            </button>

            {authError && (
              <p className="mt-3 text-red-900 text-sm font-medium">{authError}</p>
            )}

            <div className="mt-4">
              <Link
                href={`/signup?domain=${encodeURIComponent(domain)}`}
                className="text-sm text-black/70 hover:text-black font-medium underline underline-offset-2 transition-colors"
              >
                or sign up with email
              </Link>
            </div>

            <p className="mt-3 text-black/60 text-sm">
              14-day money-back guarantee &bull; Cancel anytime
            </p>
          </div>
        </div>
      </AnimateIn>

      {/* ========== SHARE BUTTONS (below CTA) ========== */}
      {reportId && (
        <AnimateIn delay={0.25}>
          <div className="mb-8">
            <p className="text-center text-zinc-500 text-sm mb-3">
              Share your report
            </p>
            <ShareButtons
              domain={domain}
              reportId={reportId}
              isInvisible={summary.isInvisible}
              visibilityScore={visibilityScore}
              competitorCount={competitorCount}
              mentionedCount={summary.mentionedCount}
            />
          </div>
        </AnimateIn>
      )}
    </div>
  );
}
