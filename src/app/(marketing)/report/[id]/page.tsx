/**
 * Public AI Visibility Report Page
 *
 * Server-rendered public report card for a site.
 * Fetches data via Supabase service client (no auth required).
 * Shows momentum score, citations, anonymized competitors.
 *
 * OG meta tags for social sharing via generateMetadata.
 */

import { Metadata } from "next";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

// ============================================
// TYPES
// ============================================

interface ReportData {
  site: {
    domain: string;
    momentumScore: number;
    momentumChange: number;
  };
  citations: {
    total: number;
    thisWeek: number;
    topPlatforms: string[];
  };
  competitors: Array<{
    domain: string;
    citations: number;
  }>;
  generatedAt: string;
}

// ============================================
// DATA FETCHING
// ============================================

const PLATFORM_NAMES: Record<string, string> = {
  chatgpt: "ChatGPT",
  perplexity: "Perplexity",
  google_aio: "Google AI",
  gemini: "Google AI",
  claude: "Claude",
};

async function getReportData(siteId: string): Promise<ReportData | null> {
  let db;
  try {
    db = createServiceClient();
  } catch {
    return null;
  }

  // Get site — only if public profile is enabled
  const { data: siteRaw } = await db
    .from("sites")
    .select("id, domain, momentum_score, momentum_change, total_citations, citations_this_week, public_profile_enabled")
    .eq("id", siteId)
    .maybeSingle();

  const site = siteRaw as {
    id: string;
    domain: string;
    momentum_score: number | null;
    momentum_change: number | null;
    total_citations: number | null;
    citations_this_week: number | null;
    public_profile_enabled: boolean | null;
  } | null;

  if (!site || !site.public_profile_enabled) {
    return null;
  }

  // Get recent citations (last 30 days) for platform breakdown
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: citations } = await db
    .from("citations")
    .select("platform")
    .eq("site_id", siteId)
    .gte("cited_at", thirtyDaysAgo.toISOString());

  const citationList = (citations || []) as Array<{ platform: string }>;

  // Calculate top platforms
  const platformCounts: Record<string, number> = {};
  for (const c of citationList) {
    platformCounts[c.platform] = (platformCounts[c.platform] || 0) + 1;
  }
  const topPlatforms = Object.entries(platformCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([platform]) => PLATFORM_NAMES[platform] || platform);

  // Get competitors — anonymized
  const { data: competitors } = await db
    .from("competitors")
    .select("total_citations")
    .eq("site_id", siteId)
    .order("total_citations", { ascending: false })
    .limit(10);

  const competitorList = (competitors || []).map(
    (c: { total_citations: number }, i: number) => ({
      domain: `Competitor ${i + 1}`,
      citations: c.total_citations || 0,
    })
  );

  return {
    site: {
      domain: site.domain,
      momentumScore: site.momentum_score || 0,
      momentumChange: site.momentum_change || 0,
    },
    citations: {
      total: site.total_citations || 0,
      thisWeek: site.citations_this_week || 0,
      topPlatforms,
    },
    competitors: competitorList,
    generatedAt: new Date().toISOString(),
  };
}

// ============================================
// METADATA (OG tags for social sharing)
// ============================================

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const data = await getReportData(id);

  if (!data) {
    return {
      title: "Report Not Found — CabbageSEO",
      description: "This report is not available. Check your own AI visibility for free.",
    };
  }

  const { domain, momentumScore } = data.site;

  return {
    title: `${domain} AI Visibility Report — CabbageSEO`,
    description: `Momentum Score: ${momentumScore}/100. See how AI platforms cite ${domain}.`,
    openGraph: {
      title: `${domain} AI Visibility Report — CabbageSEO`,
      description: `Momentum Score: ${momentumScore}/100. See how AI platforms cite ${domain}.`,
      type: "website",
      siteName: "CabbageSEO",
    },
    twitter: {
      card: "summary_large_image",
      title: `${domain} AI Visibility Report`,
      description: `Momentum Score: ${momentumScore}/100. See how AI platforms cite ${domain}.`,
    },
  };
}

// ============================================
// HELPER COMPONENTS (inline server components)
// ============================================

function MomentumTrend({ change }: { change: number }) {
  if (change > 0) {
    return <span style={{ color: "#10b981", fontWeight: 600 }}>↑ +{change}</span>;
  }
  if (change < 0) {
    return <span style={{ color: "#ef4444", fontWeight: 600 }}>↓ {change}</span>;
  }
  return <span style={{ color: "#a1a1aa", fontWeight: 600 }}>→ 0</span>;
}

function ScoreColor(score: number): string {
  if (score >= 70) return "#10b981";
  if (score >= 40) return "#f59e0b";
  return "#ef4444";
}

// ============================================
// PAGE
// ============================================

export default async function PublicReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getReportData(id);

  // Not found / not public
  if (!data) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto px-6 text-center">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
            <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">🔒</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">
              This report is not public
            </h1>
            <p className="text-zinc-400 mb-8">
              The site owner hasn't enabled public sharing for this report.
              Want to check your own AI visibility?
            </p>
            <Link
              href="/teaser"
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-colors"
            >
              Check your AI visibility — free
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { site, citations, competitors } = data;
  const scoreColor = ScoreColor(site.momentumScore);

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Header / Branding */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <img
              src="/apple-touch-icon.png"
              alt="CabbageSEO"
              className="w-8 h-8 rounded-lg"
            />
            <span className="text-xl font-bold text-white">CabbageSEO</span>
          </Link>
          <p className="text-zinc-500 text-sm">AI Visibility Report</p>
        </div>

        {/* Report Card */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 p-8 mb-8">
          {/* Dot pattern overlay */}
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
            <div className="text-center mb-8">
              <p className="text-zinc-400 text-sm mb-1">AI Visibility Report for</p>
              <h1 className="text-3xl font-bold text-white">{site.domain}</h1>
            </div>

            {/* Momentum Score — big number */}
            <div className="text-center mb-8">
              <div
                className="text-8xl font-black"
                style={{ color: scoreColor }}
              >
                {site.momentumScore}
              </div>
              <p className="text-zinc-400 mt-2 text-lg">Momentum Score</p>
              <div className="mt-2 text-lg">
                <MomentumTrend change={site.momentumChange} />
                <span className="text-zinc-500 ml-2 text-sm">week-over-week</span>
              </div>
            </div>

            {/* Citation Stats */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-zinc-800/50 rounded-xl p-5 text-center border border-zinc-700/50">
                <div className="text-3xl font-bold text-white mb-1">
                  {citations.total}
                </div>
                <p className="text-zinc-400 text-sm">Total Citations</p>
                {citations.topPlatforms.length > 0 && (
                  <p className="text-emerald-400/80 text-xs mt-2">
                    powered by {citations.topPlatforms.length} AI platform{citations.topPlatforms.length !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
              <div className="bg-zinc-800/50 rounded-xl p-5 text-center border border-zinc-700/50">
                <div className="text-3xl font-bold text-emerald-400 mb-1">
                  {citations.thisWeek}
                </div>
                <p className="text-zinc-400 text-sm">This Week</p>
                {citations.topPlatforms.length > 0 && (
                  <p className="text-zinc-500 text-xs mt-2">
                    {citations.topPlatforms.join(", ")}
                  </p>
                )}
              </div>
            </div>

            {/* Competitor Comparison — anonymized */}
            {competitors.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wide mb-3">
                  Competitor Comparison
                </h3>
                <div className="space-y-2">
                  {/* Site itself */}
                  <div className="flex items-center justify-between px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                    <span className="text-white font-medium">{site.domain}</span>
                    <span className="text-emerald-400 text-sm font-semibold">
                      {citations.total} citations
                    </span>
                  </div>
                  {/* Competitors */}
                  {competitors.map((comp, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between px-4 py-3 bg-zinc-800/50 border border-zinc-700/30 rounded-lg"
                    >
                      <span className="text-zinc-400">{comp.domain}</span>
                      <span className="text-zinc-500 text-sm">
                        {comp.citations} citations
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Watermark */}
            <p className="text-center text-zinc-600 text-xs mt-6">
              cabbageseo.com — AI Visibility Intelligence
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-emerald-950/40 border border-emerald-500/20 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">
            Check your AI visibility — free
          </h2>
          <p className="text-zinc-400 mb-6 max-w-lg mx-auto">
            See if AI platforms like ChatGPT and Perplexity recommend your product.
            Takes 10 seconds. No signup required.
          </p>
          <Link
            href="/teaser"
            className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-emerald-500/20"
          >
            Check Your AI Visibility
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-zinc-600 text-sm">
            Powered by <Link href="/" className="text-emerald-500/80 hover:text-emerald-400">CabbageSEO</Link> — AI Visibility Intelligence
          </p>
        </div>
      </div>
    </div>
  );
}
