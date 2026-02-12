/**
 * Shareable Teaser Report Page
 *
 * Server-rendered public page for a saved teaser scan.
 * OG meta tags for social sharing. No auth required.
 */

import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db, teaserReports } from "@/lib/db";
import { eq } from "drizzle-orm";
import ShareButtons from "./share-buttons";
import CopyBadgeCode from "./copy-badge";
import UpgradeGate from "./upgrade-gate";
import ScoreAlertSignup from "./score-alert-signup";
import ContentPreview from "./content-preview";
import type { ContentPreviewData } from "@/lib/db/schema";

// ============================================
// TYPES
// ============================================

interface TeaserResult {
  query: string;
  platform: "perplexity" | "gemini" | "chatgpt";
  aiRecommends: string[];
  mentionedYou: boolean;
  snippet: string;
  inCitations?: boolean;
  domainFound?: boolean;
}

interface TeaserSummary {
  totalQueries: number;
  mentionedCount: number;
  isInvisible: boolean;
  brandsDetected: string[];
  message: string;
  visibilityScore?: number;
  platformScores?: Record<string, number>;
  scoreBreakdown?: Record<string, number>;
  scoreExplanation?: string;
}

const PLATFORM_LABELS: Record<string, { name: string; color: string }> = {
  perplexity: { name: "Perplexity AI", color: "text-blue-400" },
  gemini: { name: "Google AI", color: "text-purple-400" },
  chatgpt: { name: "ChatGPT", color: "text-emerald-400" },
};

// ============================================
// DATA FETCHING
// ============================================

async function getReport(id: string) {
  try {
    const [report] = await db
      .select()
      .from(teaserReports)
      .where(eq(teaserReports.id, id))
      .limit(1);
    return report || null;
  } catch {
    return null;
  }
}

// ============================================
// METADATA (OG tags)
// ============================================

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const report = await getReport(id);

  if (!report) {
    return {
      title: "Report Not Found — CabbageSEO",
      description:
        "This report is not available. Check your own AI visibility for free.",
    };
  }

  const title = `AI Visibility Report: ${report.domain} — Score: ${report.visibilityScore}/100`;
  const description = report.isInvisible
    ? `${report.domain} is invisible to AI search. ChatGPT and Perplexity don't recommend them.`
    : `${report.domain} has an AI visibility score of ${report.visibilityScore}/100. See the full report.`;

  const brandCount = (report.competitorsMentioned || []).length;
  const brandNames = (report.competitorsMentioned || []).slice(0, 3).join(",");
  const ogImageUrl = `/api/og/score?domain=${encodeURIComponent(report.domain)}&score=${report.visibilityScore}&invisible=${report.isInvisible}&brands=${brandCount}&names=${encodeURIComponent(brandNames)}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "CabbageSEO",
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title: `AI Visibility Report: ${report.domain}`,
      description,
      images: [ogImageUrl],
    },
  };
}

// ============================================
// PAGE
// ============================================

export default async function ShareableTeaserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const report = await getReport(id);

  if (!report) {
    notFound();
  }

  const summary = (report.summary as TeaserSummary) || { totalQueries: 0, mentionedCount: 0, isInvisible: true, brandsDetected: [], message: "" };
  const results = (report.results as TeaserResult[]) || [];
  const brandCount = (report.competitorsMentioned || []).length;
  const gapCount = results.filter(r => !r.mentionedYou).length;

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-7xl mx-auto px-6 py-12">
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

        {/* Verdict Card */}
        <div
          className={`relative overflow-hidden rounded-2xl p-8 mb-8 ${
            report.visibilityScore < 40
              ? "bg-gradient-to-br from-red-950/80 via-zinc-900 to-zinc-900 border-2 border-red-500/30"
              : "bg-gradient-to-br from-emerald-950/80 via-zinc-900 to-zinc-900 border-2 border-emerald-500/30"
          }`}
        >
          {/* Dot pattern */}
          <div className="absolute inset-0 opacity-5">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
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
              <p className="text-2xl font-bold text-white">{report.domain}</p>
            </div>

            {/* Score */}
            <div className="text-center mb-4">
              <div
                className={`text-8xl font-black tabular-nums ${
                  report.visibilityScore < 20 ? "text-red-500"
                    : report.visibilityScore < 40 ? "text-red-400"
                    : report.visibilityScore < 60 ? "text-amber-400"
                    : "text-emerald-500"
                }`}
              >
                {report.visibilityScore}
              </div>
              <p className="text-zinc-400 mt-2">AI Visibility Score</p>
            </div>

            {/* Per-platform mini scores */}
            {summary.platformScores && Object.keys(summary.platformScores).length > 0 && (
              <div className="flex justify-center gap-4 mb-6">
                {results.map((r) => {
                  const pl = PLATFORM_LABELS[r.platform];
                  const ps = summary.platformScores?.[r.platform] ?? 0;
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

            {/* Verdict */}
            <div className="text-center mb-8">
              {report.visibilityScore < 15 ? (
                <>
                  <h1 className="text-3xl font-bold text-white mb-2">
                    {report.domain} is{" "}
                    <span className="text-red-400">invisible</span> to AI
                  </h1>
                  <p className="text-zinc-400 text-lg">
                    When buyers ask AI for recommendations &mdash; {report.domain}{" "}
                    doesn&rsquo;t appear.
                  </p>
                </>
              ) : report.visibilityScore < 40 ? (
                <>
                  <h1 className="text-3xl font-bold text-white mb-2">
                    AI{" "}
                    <span className="text-amber-400">
                      barely knows {report.domain}
                    </span>
                  </h1>
                  <p className="text-zinc-400 text-lg">
                    More citations and domain references are needed.
                  </p>
                </>
              ) : report.visibilityScore < 60 ? (
                <>
                  <h1 className="text-3xl font-bold text-white mb-2">
                    AI{" "}
                    <span className="text-amber-400">
                      sometimes mentions {report.domain}
                    </span>
                  </h1>
                  <p className="text-zinc-400 text-lg">
                    {summary.message}
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-3xl font-bold text-white mb-2">
                    AI{" "}
                    <span className="text-emerald-400">
                      recommends {report.domain}
                    </span>
                  </h1>
                  <p className="text-zinc-400 text-lg">
                    Being cited and recommended. Focus on maintaining strong visibility.
                  </p>
                </>
              )}
            </div>

            {/* Visibility stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-zinc-800/50 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-zinc-500 mb-1">
                  {summary.mentionedCount}
                </div>
                <p className="text-zinc-400 text-sm">
                  Times AI mentions you
                </p>
              </div>
              <div className="bg-zinc-800/50 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-emerald-400 mb-1">
                  {summary.totalQueries}
                </div>
                <p className="text-zinc-400 text-sm">
                  Queries checked
                </p>
              </div>
            </div>

            {/* Share buttons */}
            <ShareButtons domain={report.domain} reportId={id} isInvisible={report.isInvisible} visibilityScore={report.visibilityScore} brandCount={brandCount} mentionedCount={summary.mentionedCount} />

            {/* Watermark */}
            <p className="text-center text-zinc-600 text-xs">
              cabbageseo.com &bull; Free AI Visibility Report
            </p>
          </div>
        </div>


        {/* Brands mentioned by AI */}
        {report.competitorsMentioned && report.competitorsMentioned.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">
              Brands AI mentions for your queries
            </h3>
            <div className="space-y-2">
              {report.competitorsMentioned.map((brand, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg"
                >
                  <span className="text-white font-medium">{brand}</span>
                  <span className="text-zinc-400 text-sm">
                    Cited by AI
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Raw AI Responses */}
        <div className="space-y-4 mb-8">
          <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wide">
            Raw AI Responses
          </h3>
          {results.map((result, i) => {
            const pl = PLATFORM_LABELS[result.platform];
            return (
            <div
              key={i}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className={`text-xs uppercase tracking-wide mb-1 ${pl?.color || "text-zinc-500"}`}>
                    {pl?.name || result.platform}
                  </p>
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

              {result.aiRecommends.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {result.aiRecommends.slice(0, 6).map((brand, j) => (
                    <span
                      key={j}
                      className="px-2 py-1 bg-zinc-800 text-zinc-400 rounded text-xs"
                    >
                      {brand}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
          })}
        </div>

        {/* AI Content Preview — the conversion driver */}
        {report.contentPreview && (
          <ContentPreview
            domain={report.domain}
            preview={report.contentPreview as ContentPreviewData}
          />
        )}

        {/* Upgrade Gate — blurred action plan */}
        <UpgradeGate
          domain={report.domain}
          isInvisible={report.isInvisible}
          brandCount={brandCount}
          visibilityScore={report.visibilityScore}
          gapCount={gapCount}
        />

        {/* Email Capture — score change notifications */}
        <ScoreAlertSignup domain={report.domain} reportId={id} />

        {/* Embed Badge */}
        <CopyBadgeCode domain={report.domain} reportId={id} />

        {/* Viral Loop CTA — inline domain scanner */}
        <div className="bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-emerald-950/40 border border-emerald-500/20 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">
            What&apos;s <span className="text-emerald-400">your</span> AI visibility score?
          </h2>
          <p className="text-zinc-400 mb-6 max-w-lg mx-auto">
            You just saw {report.domain}&apos;s score. Now check yours — takes 10 seconds, no signup.
          </p>
          <form
            action="/teaser"
            method="GET"
            className="max-w-md mx-auto mb-4"
          >
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                name="domain"
                placeholder="yourdomain.com"
                required
                className="flex-1 px-5 py-3.5 bg-zinc-800 border-2 border-zinc-700 rounded-xl text-white text-lg placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
              <button
                type="submit"
                className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
              >
                Check mine
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
              </button>
            </div>
          </form>
          <p className="text-xs text-zinc-500 mb-4">
            Free &bull; No signup &bull; Real AI responses from ChatGPT, Perplexity &amp; Google
          </p>
          <div className="pt-4 border-t border-zinc-800">
            <Link
              href={`/signup?domain=${encodeURIComponent(report.domain)}`}
              className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              or start fixing {report.domain}&apos;s AI visibility with targeted fix pages →
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-zinc-600 text-sm">
            Powered by{" "}
            <Link
              href="/"
              className="text-emerald-500/80 hover:text-emerald-400"
            >
              CabbageSEO
            </Link>{" "}
            — AI Visibility Intelligence
          </p>
        </div>
      </div>
    </div>
  );
}
