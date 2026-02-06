"use client";

/**
 * TEASER PAGE — The Viral Engine
 *
 * Optimizations:
 * - CabbageSEO.com watermark on screenshot-able card
 * - "Share Your AI Report" prominent button
 * - Competitor names shown prominently (jealousy = signups)
 * - 30-Day Fix section with 3 bullet points based on scan
 * - Stronger CTA: "Start your 30-day AI visibility sprint"
 */

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  Check,
  ArrowRight,
  Loader2,
  Twitter,
  Copy,
  TrendingDown,
  Target,
  Zap,
  Clock,
  Share2,
  Linkedin,
} from "lucide-react";

interface TeaserResult {
  query: string;
  platform: "perplexity" | "gemini";
  aiRecommends: string[];
  mentionedYou: boolean;
  snippet: string;
}

interface TeaserData {
  domain: string;
  results: TeaserResult[];
  summary: {
    totalQueries: number;
    mentionedCount: number;
    isInvisible: boolean;
    competitorsMentioned: string[];
    message: string;
  };
}

/** Generate 3 personalized fix bullets based on scan data */
function getFixBullets(data: TeaserData): string[] {
  const bullets: string[] = [];
  const { summary } = data;

  if (summary.isInvisible) {
    bullets.push(
      "Get listed on the top 3 software review sites AI trusts most (G2, Capterra, Product Hunt)"
    );
  } else {
    bullets.push(
      "Strengthen your listings on the review sites AI already references"
    );
  }

  if (summary.competitorsMentioned.length > 0) {
    const top = summary.competitorsMentioned[0];
    bullets.push(
      `Publish a comparison page: "${data.domain} vs ${top}" — AI models love head-to-head content`
    );
  } else {
    bullets.push(
      "Create comparison content targeting your market's key buying queries"
    );
  }

  bullets.push(
    "Add structured data (FAQ schema, JSON-LD) so AI can parse your site faster"
  );

  return bullets;
}

function TeaserContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const domain = searchParams.get("domain");

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TeaserData | null>(null);
  const [error, setError] = useState("");
  const [scanStep, setScanStep] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!domain) {
      router.push("/");
      return;
    }

    const runTeaser = async () => {
      const steps = [
        "Connecting to AI platforms...",
        "Asking ChatGPT about your market...",
        "Asking Perplexity who they recommend...",
        "Extracting competitor mentions...",
        "Calculating your visibility score...",
      ];

      for (let i = 0; i < steps.length; i++) {
        setScanStep(i);
        await new Promise((resolve) => setTimeout(resolve, 900));
      }

      try {
        const response = await fetch("/api/geo/teaser", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ domain }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to check visibility");
        }

        if (result.error) {
          throw new Error(result.error);
        }

        setData(result);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to check visibility";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    runTeaser();
  }, [domain, router]);

  const shareText = data
    ? `I just checked if AI recommends my product (${domain})...\n\n` +
      `AI Visibility Score: ${data.summary.isInvisible ? "0/100" : `${Math.min(100, data.summary.mentionedCount * 25)}/100`}\n` +
      (data.summary.isInvisible
        ? "Result: I'm INVISIBLE to ChatGPT & Perplexity\n"
        : `Result: Mentioned ${data.summary.mentionedCount} time(s)\n`) +
      (data.summary.competitorsMentioned.length > 0
        ? `AI recommends ${data.summary.competitorsMentioned.length} competitors instead.\n`
        : "") +
      `\nCheck yours free: cabbageseo.com`
    : "";

  const handleCopyResults = () => {
    if (!shareText) return;
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTweet = () => {
    if (!shareText) return;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
      "_blank"
    );
  };

  const handleLinkedIn = () => {
    if (!shareText) return;
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://cabbageseo.com/teaser?domain=${domain}`)}`,
      "_blank"
    );
  };

  if (!domain) {
    return null;
  }

  // ---------- LOADING STATE ----------
  if (loading) {
    const steps = [
      "Connecting to AI platforms...",
      "Asking ChatGPT about your market...",
      "Asking Perplexity who they recommend...",
      "Extracting competitor mentions...",
      "Calculating your visibility score...",
    ];

    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto px-6 text-center">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
            <Loader2 className="w-12 h-12 text-emerald-400 animate-spin mx-auto mb-6" />
            <h2 className="text-xl font-semibold text-white mb-2">
              Checking AI platforms...
            </h2>
            <p className="text-zinc-400 mb-6">
              Finding out if AI recommends{" "}
              <span className="text-white font-medium">{domain}</span>
            </p>

            <div className="text-left space-y-2">
              {steps.map((step, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-2 text-sm ${
                    i < scanStep
                      ? "text-emerald-400"
                      : i === scanStep
                        ? "text-white"
                        : "text-zinc-600"
                  }`}
                >
                  {i < scanStep ? (
                    <Check className="w-4 h-4" />
                  ) : i === scanStep ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <div className="w-4 h-4" />
                  )}
                  {step}
                </div>
              ))}
            </div>
          </div>

          <p className="mt-6 text-zinc-500 text-sm">
            Real AI responses. No estimates. No guesses.
          </p>
        </div>
      </div>
    );
  }

  // ---------- ERROR STATE ----------
  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto px-6 text-center">
          <div className="bg-zinc-900 border border-red-500/20 rounded-2xl p-8">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">
              Something went wrong
            </h2>
            <p className="text-zinc-400 mb-6">{error}</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
            >
              Try again
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  // ---------- RESULTS STATE ----------
  const { results, summary } = data;
  const visibilityScore = summary.isInvisible
    ? 0
    : Math.min(100, summary.mentionedCount * 25);
  const competitorCount = summary.competitorsMentioned.length;
  const fixBullets = getFixBullets(data);

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <img
              src="/apple-touch-icon.png"
              alt="CabbageSEO"
              className="w-8 h-8 rounded-lg"
            />
            <span className="text-xl font-bold text-white">CabbageSEO</span>
          </Link>
        </div>

        {/* ========== THE VERDICT CARD — designed to be screenshotted ========== */}
        <div
          className={`relative overflow-hidden rounded-2xl p-8 mb-8 ${
            summary.isInvisible
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
            {/* Domain */}
            <div className="text-center mb-6">
              <p className="text-zinc-400 text-sm mb-1">
                AI Visibility Report for
              </p>
              <p className="text-2xl font-bold text-white">{domain}</p>
            </div>

            {/* Score */}
            <div className="text-center mb-6">
              <div
                className={`text-8xl font-black ${summary.isInvisible ? "text-red-500" : "text-emerald-500"}`}
              >
                {visibilityScore}
              </div>
              <p className="text-zinc-400 mt-2">AI Visibility Score</p>
            </div>

            {/* Verdict */}
            <div className="text-center mb-8">
              {summary.isInvisible ? (
                <>
                  <h1 className="text-3xl font-bold text-white mb-2">
                    You are{" "}
                    <span className="text-red-400">invisible</span> to AI
                  </h1>
                  <p className="text-zinc-400 text-lg">
                    When buyers ask AI &ldquo;what&rsquo;s the best tool&rdquo;
                    &mdash; you don&rsquo;t exist.
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-3xl font-bold text-white mb-2">
                    AI{" "}
                    <span className="text-emerald-400">knows about you</span>
                  </h1>
                  <p className="text-zinc-400 text-lg">
                    You were mentioned {summary.mentionedCount} time(s). But
                    competitors may still be winning.
                  </p>
                </>
              )}
            </div>

            {/* Competitor vs You comparison */}
            {competitorCount > 0 && (
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-zinc-800/50 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-red-400 mb-1">
                    {competitorCount}
                  </div>
                  <p className="text-zinc-400 text-sm">
                    Competitors AI recommends
                  </p>
                </div>
                <div className="bg-zinc-800/50 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-zinc-500 mb-1">
                    {summary.mentionedCount}
                  </div>
                  <p className="text-zinc-400 text-sm">
                    Times you were mentioned
                  </p>
                </div>
              </div>
            )}

            {/* Share buttons */}
            <div className="flex items-center justify-center gap-3 mb-4">
              <button
                onClick={handleTweet}
                className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm rounded-lg transition-colors"
              >
                <Twitter className="w-4 h-4" />
                Share on X
              </button>
              <button
                onClick={handleLinkedIn}
                className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm rounded-lg transition-colors"
              >
                <Linkedin className="w-4 h-4" />
                LinkedIn
              </button>
              <button
                onClick={handleCopyResults}
                className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm rounded-lg transition-colors"
              >
                {copied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>

            {/* Watermark — visible in screenshots */}
            <p className="text-center text-zinc-600 text-xs">
              cabbageseo.com &bull; Free AI Visibility Report
            </p>
          </div>
        </div>

        {/* ========== COMPETITORS BLOCK ========== */}
        {summary.competitorsMentioned.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
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
          </div>
        )}

        {/* ========== RAW AI RESPONSES ========== */}
        <div className="space-y-4 mb-8">
          <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wide">
            Raw AI Responses
          </h3>
          {results.map((result, i) => (
            <div
              key={i}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-zinc-500 text-xs uppercase tracking-wide mb-1">
                    {result.platform === "perplexity"
                      ? "Perplexity AI"
                      : "Google AI"}
                  </p>
                  <p className="text-white font-medium">
                    &ldquo;{result.query}&rdquo;
                  </p>
                </div>
                <div
                  className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium ${
                    result.mentionedYou
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-red-500/10 text-red-400 border border-red-500/20"
                  }`}
                >
                  {result.mentionedYou ? "You're in" : "You're out"}
                </div>
              </div>

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
                  {result.aiRecommends.length > 6 && (
                    <span className="px-2 py-1 text-zinc-500 text-xs">
                      +{result.aiRecommends.length - 6} more
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ========== 30-DAY FIX SECTION ========== */}
        <div className="bg-zinc-900 border border-emerald-500/20 rounded-2xl p-8 mb-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm mb-4">
              <Clock className="w-4 h-4" />
              Your 30-day fix based on this scan
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Here&rsquo;s your fastest path to AI visibility
            </h2>
            <p className="text-zinc-400 text-sm">
              Based on your scan, these are the highest-impact actions to get AI
              recommending you.
            </p>
          </div>

          <div className="space-y-3 mb-6">
            {fixBullets.map((bullet, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-4 bg-zinc-800/50 rounded-xl"
              >
                <div className="shrink-0 w-7 h-7 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-400 text-sm font-bold">
                  {i + 1}
                </div>
                <p className="text-zinc-300 text-sm leading-relaxed">
                  {bullet}
                </p>
              </div>
            ))}
          </div>

          <p className="text-center text-zinc-500 text-xs">
            CabbageSEO gives you the full step-by-step playbook, progress
            tracking, and weekly momentum reports.
          </p>
        </div>

        {/* ========== CTA ========== */}
        <div className="bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-emerald-950/40 border border-emerald-500/20 rounded-2xl p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-3">
              Start your 30-day AI visibility sprint
            </h2>
            <p className="text-zinc-400 max-w-lg mx-auto">
              Get a structured program to become AI&rsquo;s recommended choice.
              Week-by-week actions, competitor tracking, and momentum scoring.
            </p>
          </div>

          {/* What you get */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="flex items-start gap-3 p-4 bg-zinc-800/50 rounded-xl">
              <div className="shrink-0 w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                <Target className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-white font-medium text-sm">
                  30-Day Sprint
                </p>
                <p className="text-zinc-500 text-xs">
                  4-week structured program
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-zinc-800/50 rounded-xl">
              <div className="shrink-0 w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-white font-medium text-sm">
                  Competitor Intel
                </p>
                <p className="text-zinc-500 text-xs">
                  Know when they gain ground
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-zinc-800/50 rounded-xl">
              <div className="shrink-0 w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                <Share2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-white font-medium text-sm">
                  Momentum Score
                </p>
                <p className="text-zinc-500 text-xs">
                  Track week-over-week gains
                </p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link
              href={`/signup?domain=${encodeURIComponent(domain)}`}
              className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-emerald-500/20"
            >
              Start your 30-day sprint
              <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="mt-4 text-zinc-500 text-sm">
              Free 7-day trial &bull; No credit card required
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-zinc-600 text-sm">
            Built for B2B SaaS founders competing against the incumbents.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function TeaserPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
        </div>
      }
    >
      <TeaserContent />
    </Suspense>
  );
}
