/**
 * /r/[domain] — Shareable AI Visibility Report
 *
 * Human-readable, SEO-friendly URL for any domain's AI visibility score.
 * This is the viral page — what gets shared on Twitter, embedded in OpenClaw
 * responses, and indexed by Google.
 *
 * - If a report exists: shows the full report with OG tags
 * - If no report: shows a "scan now" CTA
 */

import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";
import { db, teaserReports } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { ReportShareButtons, ReportBadgeEmbed, ReportScoreAlert } from "./report-actions";
import DomainScanner from "./domain-scanner";
import CheckYoursForm from "./check-yours-form";
import UpgradeGate from "../../teaser/[id]/upgrade-gate";
import ContentPreview from "../../teaser/[id]/content-preview";
import FixPageFallback from "../../teaser/[id]/fix-page-fallback";
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
  message: string;
  visibilityScore?: number;
  platformScores?: Record<string, number>;
  scoreBreakdown?: Record<string, number>;
  scoreExplanation?: string;
  businessSummary?: string;
}

const PLATFORM_LABELS: Record<string, { name: string; color: string }> = {
  perplexity: { name: "Perplexity AI", color: "text-blue-400" },
  gemini: { name: "Google AI", color: "text-purple-400" },
  chatgpt: { name: "ChatGPT", color: "text-emerald-400" },
};

// ============================================
// DATA FETCHING
// ============================================

function cleanDomain(raw: string): string {
  return decodeURIComponent(raw)
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0];
}

async function getLatestReport(domain: string) {
  try {
    const [report] = await db
      .select()
      .from(teaserReports)
      .where(eq(teaserReports.domain, domain))
      .orderBy(desc(teaserReports.createdAt))
      .limit(1);
    return report || null;
  } catch {
    return null;
  }
}

// ============================================
// METADATA (OG tags for social sharing)
// ============================================

interface PageProps {
  params: Promise<{ domain: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { domain: rawDomain } = await params;
  const domain = cleanDomain(rawDomain);
  const report = await getLatestReport(domain);

  const baseUrl = "https://cabbageseo.com";

  if (!report) {
    return {
      title: `AI Visibility Report: ${domain} — CabbageSEO`,
      description: `Check if ChatGPT, Perplexity & Google AI recommend ${domain}. Free AI visibility scan.`,
      openGraph: {
        title: `Does AI recommend ${domain}?`,
        description: `Check if ChatGPT, Perplexity & Google AI recommend ${domain}. Free AI visibility scan — no signup.`,
        type: "website",
        siteName: "CabbageSEO",
        url: `${baseUrl}/r/${domain}`,
      },
      twitter: {
        card: "summary_large_image",
        title: `Does AI recommend ${domain}?`,
        description: `Check if ChatGPT, Perplexity & Google AI recommend ${domain}.`,
      },
      alternates: {
        canonical: `${baseUrl}/r/${domain}`,
      },
    };
  }

  const title = `${domain} — AI Visibility Score: ${report.visibilityScore}/100`;
  const description = report.isInvisible
    ? `${domain} is invisible to AI search. ChatGPT, Perplexity & Google AI don't recommend them. Check your own score free.`
    : `${domain} has an AI visibility score of ${report.visibilityScore}/100. See how they compare across ChatGPT, Perplexity & Google AI.`;

  const ogImageUrl = `${baseUrl}/api/og/score?domain=${encodeURIComponent(domain)}&score=${report.visibilityScore}&invisible=${report.isInvisible}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "CabbageSEO",
      url: `${baseUrl}/r/${domain}`,
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title: `AI Visibility: ${domain} — ${report.visibilityScore}/100`,
      description,
      images: [ogImageUrl],
    },
    alternates: {
      canonical: `${baseUrl}/r/${domain}`,
    },
  };
}

// ============================================
// PAGE
// ============================================

export default async function DomainReportPage({ params }: PageProps) {
  const { domain: rawDomain } = await params;
  const domain = cleanDomain(rawDomain);
  const report = await getLatestReport(domain);

  // No report — show scanner
  if (!report) {
    return <DomainScanner domain={domain} />;
  }

  const summary = (report.summary as TeaserSummary) || {
    totalQueries: 0,
    mentionedCount: 0,
    isInvisible: true,
    message: "",
  };
  const results = (report.results as TeaserResult[]) || [];
  const gapCount = results.filter(
    (r) => !r.inCitations && !r.domainFound && !r.mentionedYou
  ).length;
  const scanAge = Math.floor(
    (Date.now() - new Date(report.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

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
              <p className="text-2xl font-bold text-white">{domain}</p>
              {scanAge > 0 && (
                <p className="text-zinc-600 text-xs mt-1">
                  Scanned {scanAge === 1 ? "yesterday" : `${scanAge} days ago`}
                </p>
              )}
            </div>

            {/* Score */}
            <div className="text-center mb-4">
              <div
                className={`text-8xl font-black tabular-nums ${
                  report.visibilityScore < 20
                    ? "text-red-500"
                    : report.visibilityScore < 40
                      ? "text-red-400"
                      : report.visibilityScore < 60
                        ? "text-amber-400"
                        : "text-emerald-500"
                }`}
              >
                {report.visibilityScore}
              </div>
              <p className="text-zinc-400 mt-2">AI Visibility Score</p>
            </div>

            {/* Per-platform mini scores */}
            {summary.platformScores &&
              Object.keys(summary.platformScores).length > 0 && (
                <div className="flex justify-center gap-4 mb-6">
                  {results.map((r) => {
                    const pl = PLATFORM_LABELS[r.platform];
                    const ps = summary.platformScores?.[r.platform] ?? 0;
                    return (
                      <div key={r.platform} className="text-center">
                        <div
                          className={`text-lg font-bold tabular-nums ${pl?.color || "text-zinc-400"}`}
                        >
                          {ps}
                        </div>
                        <p className="text-zinc-500 text-xs">
                          {pl?.name || r.platform}
                        </p>
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
                    {domain} is{" "}
                    <span className="text-red-400">invisible</span> to AI
                  </h1>
                  <p className="text-zinc-400 text-lg">
                    When buyers ask AI for recommendations &mdash; {domain}{" "}
                    doesn&rsquo;t appear.
                  </p>
                </>
              ) : report.visibilityScore < 40 ? (
                <>
                  <h1 className="text-3xl font-bold text-white mb-2">
                    AI{" "}
                    <span className="text-amber-400">
                      barely knows {domain}
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
                      sometimes mentions {domain}
                    </span>
                  </h1>
                  <p className="text-zinc-400 text-lg">{summary.message}</p>
                </>
              ) : (
                <>
                  <h1 className="text-3xl font-bold text-white mb-2">
                    AI{" "}
                    <span className="text-emerald-400">
                      recommends {domain}
                    </span>
                  </h1>
                  <p className="text-zinc-400 text-lg">
                    Being cited and recommended. Focus on maintaining strong
                    visibility.
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
                <p className="text-zinc-400 text-sm">Times AI mentions you</p>
              </div>
              <div className="bg-zinc-800/50 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-emerald-400 mb-1">
                  {summary.totalQueries}
                </div>
                <p className="text-zinc-400 text-sm">Queries checked</p>
              </div>
            </div>

            {/* Share buttons */}
            <ReportShareButtons
              domain={domain}
              visibilityScore={report.visibilityScore}
              isInvisible={report.isInvisible}
              mentionedCount={summary.mentionedCount}
            />

            {/* Watermark */}
            <p className="text-center text-zinc-600 text-xs">
              cabbageseo.com &bull; Free AI Visibility Report
            </p>
          </div>
        </div>

        {/* Inline conversion CTA — right after emotional score reveal */}
        {report.visibilityScore < 60 && (
          <div className="mb-8 p-6 bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-emerald-950/40 border border-emerald-500/20 rounded-2xl text-center">
            <p className="text-white font-bold text-lg mb-1">
              {report.visibilityScore < 20
                ? "AI doesn't know you exist. That's fixable."
                : report.visibilityScore < 40
                  ? "You're barely visible. Let's change that."
                  : "You're close — a few fixes will push you over."}
            </p>
            <p className="text-zinc-400 text-sm mb-4">
              CabbageSEO scans daily, finds gaps, and generates fix pages automatically.
            </p>
            <Link
              href={`/signup?domain=${encodeURIComponent(domain)}&score=${report.visibilityScore}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Zap className="w-4 h-4" />
              Start fixing this
              <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="text-xs text-zinc-500 mt-2">
              From $39/mo &middot; Cancel anytime
            </p>
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
                    <p
                      className={`text-xs uppercase tracking-wide mb-1 ${pl?.color || "text-zinc-500"}`}
                    >
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
                    {result.inCitations
                      ? "Cited"
                      : result.domainFound
                        ? "Domain found"
                        : result.mentionedYou
                          ? "Name echoed"
                          : "Not found"}
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

        {/* Content Preview or Fix Page Fallback */}
        {report.contentPreview ? (
          <ContentPreview
            domain={domain}
            preview={report.contentPreview as ContentPreviewData}
          />
        ) : (
          <FixPageFallback domain={domain} gapCount={gapCount} />
        )}

        {/* Upgrade Gate — blurred action plan */}
        <UpgradeGate
          domain={domain}
          isInvisible={report.isInvisible}
          brandCount={0}
          visibilityScore={report.visibilityScore}
          gapCount={gapCount}
        />

        {/* Email Capture */}
        <ReportScoreAlert domain={domain} reportId={report.id} />

        {/* Badge Embed */}
        <ReportBadgeEmbed domain={domain} />

        {/* Viral Loop CTA — scan your own domain */}
        <CheckYoursForm currentDomain={domain} />

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
            &mdash; AI Visibility Intelligence
          </p>
        </div>
      </div>
    </div>
  );
}
