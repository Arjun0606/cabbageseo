/**
 * Programmatic SEO Page — /ai-visibility/[domain]
 *
 * Server-rendered public page for a specific domain's AI visibility.
 * Generates unique, indexable content for popular SaaS tools.
 * If no data exists, prompts the user to scan.
 */

import { Metadata } from "next";
import Link from "next/link";
import { db, teaserReports } from "@/lib/db";
import { eq, desc, ne, sql } from "drizzle-orm";

// ============================================
// DATA FETCHING
// ============================================

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

async function getRecentlyScannedDomains(excludeDomain: string): Promise<string[]> {
  try {
    const results = await db
      .select({ domain: teaserReports.domain })
      .from(teaserReports)
      .where(ne(teaserReports.domain, excludeDomain))
      .groupBy(teaserReports.domain)
      .orderBy(sql`max(${teaserReports.createdAt}) desc`)
      .limit(8);
    return results.map((r) => r.domain);
  } catch {
    return [];
  }
}

// ============================================
// METADATA
// ============================================

export async function generateMetadata({
  params,
}: {
  params: Promise<{ domain: string }>;
}): Promise<Metadata> {
  const { domain } = await params;
  const cleanDomain = decodeURIComponent(domain);
  const brandName = cleanDomain.replace(/\.(com|io|co|ai|app|dev|org|net)$/, "");
  const titleBrand = brandName.charAt(0).toUpperCase() + brandName.slice(1);

  const report = await getLatestReport(cleanDomain);

  const title = report
    ? `${titleBrand} AI Visibility Score: ${report.visibilityScore}/100 – Is ${cleanDomain} Recommended by AI?`
    : `${titleBrand} AI Visibility – Is ${cleanDomain} Recommended by ChatGPT & Perplexity?`;

  const description = report
    ? report.isInvisible
      ? `${cleanDomain} is invisible to AI search. ChatGPT and Perplexity don't recommend ${titleBrand}. See the full AI visibility report.`
      : `${cleanDomain} has an AI visibility score of ${report.visibilityScore}/100. See who AI recommends instead and how ${titleBrand} compares.`
    : `Check if ChatGPT, Perplexity & Google AI recommend ${cleanDomain}. Get a free AI visibility score in 10 seconds.`;

  const brandCount = report ? (report.competitorsMentioned as string[] || []).length : 0;
  const brandNames = report ? (report.competitorsMentioned as string[] || []).slice(0, 3).join(",") : "";
  const ogImageUrl = report
    ? `/api/og/score?domain=${encodeURIComponent(cleanDomain)}&score=${report.visibilityScore}&invisible=${report.isInvisible}&brands=${brandCount}&names=${encodeURIComponent(brandNames)}`
    : `/og-image.png`;

  return {
    title,
    description,
    keywords: [
      `${cleanDomain} AI visibility`,
      `is ${cleanDomain} on ChatGPT`,
      `${titleBrand} AI recommendation`,
      `${titleBrand} AI recommendations`,
      `${cleanDomain} Perplexity recommendation`,
    ],
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "CabbageSEO",
      images: [{ url: ogImageUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

// ============================================
// PAGE
// ============================================

export default async function AiVisibilityPage({
  params,
}: {
  params: Promise<{ domain: string }>;
}) {
  const { domain } = await params;
  const cleanDomain = decodeURIComponent(domain);
  const brandName = cleanDomain.replace(/\.(com|io|co|ai|app|dev|org|net)$/, "");
  const titleBrand = brandName.charAt(0).toUpperCase() + brandName.slice(1);

  const [report, relatedDomains] = await Promise.all([
    getLatestReport(cleanDomain),
    getRecentlyScannedDomains(cleanDomain),
  ]);
  const brands = (report?.competitorsMentioned as string[] || []);

  // JSON-LD for the page
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${titleBrand} AI Visibility Report`,
    description: `AI visibility analysis for ${cleanDomain}`,
    url: `https://cabbageseo.com/ai-visibility/${encodeURIComponent(cleanDomain)}`,
    mainEntity: {
      "@type": "Product",
      name: titleBrand,
      url: `https://${cleanDomain}`,
    },
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* Breadcrumb */}
        <nav className="text-sm text-zinc-500 mb-8">
          <Link href="/" className="hover:text-emerald-400 transition-colors">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/leaderboard" className="hover:text-emerald-400 transition-colors">AI Visibility</Link>
          <span className="mx-2">/</span>
          <span className="text-zinc-300">{cleanDomain}</span>
        </nav>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Is <span className="text-emerald-400">{cleanDomain}</span> recommended by AI?
        </h1>

        {report ? (
          <>
            {/* Score Card */}
            <div className={`rounded-2xl p-8 mb-8 ${
              report.isInvisible
                ? "bg-gradient-to-br from-red-950/50 via-zinc-900 to-zinc-900 border-2 border-red-500/20"
                : "bg-gradient-to-br from-emerald-950/50 via-zinc-900 to-zinc-900 border-2 border-emerald-500/20"
            }`}>
              <div className="text-center mb-6">
                <div className={`text-7xl font-black ${report.isInvisible ? "text-red-500" : "text-emerald-500"}`}>
                  {report.visibilityScore}
                </div>
                <p className="text-zinc-400 mt-2">AI Visibility Score</p>
              </div>

              {report.isInvisible ? (
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {titleBrand} is <span className="text-red-400">invisible</span> to AI
                  </h2>
                  <p className="text-zinc-400">
                    When buyers ask ChatGPT or Perplexity for {brandName} alternatives,
                    {cleanDomain} doesn&apos;t appear in the recommendations.
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    AI <span className="text-emerald-400">knows about</span> {titleBrand}
                  </h2>
                  <p className="text-zinc-400">
                    {cleanDomain} appears in some AI recommendations, but other brands
                    may still be winning more citations.
                  </p>
                </div>
              )}
            </div>

            {/* Brands AI Recommends */}
            {brands.length > 0 && (
              <div className="bg-white/[0.03] backdrop-blur-md border border-white/[0.06] rounded-xl p-6 mb-8">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Other brands AI recommends in this space
                </h3>
                <div className="space-y-2">
                  {brands.map((comp, i) => (
                    <Link
                      key={i}
                      href={`/ai-visibility/${encodeURIComponent(comp)}`}
                      className="flex items-center justify-between px-4 py-3 bg-red-500/5 border border-red-500/10 rounded-lg hover:border-red-500/20 transition-colors"
                    >
                      <span className="text-white font-medium">{comp}</span>
                      <span className="text-red-400 text-sm">Recommended by AI →</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Content section for SEO */}
            <div className="prose prose-invert max-w-none mb-8">
              <h2 className="text-xl font-bold text-white mb-4">
                What does AI say about {titleBrand}?
              </h2>
              <p className="text-zinc-400 leading-relaxed mb-4">
                When users ask AI assistants like ChatGPT, Perplexity, and Google AI for
                product recommendations in {titleBrand}&apos;s category, the AI{" "}
                {report.isInvisible
                  ? `does not mention ${cleanDomain}. This means potential customers who use AI-powered search are being directed to other brands instead.`
                  : `mentions ${cleanDomain} in some queries, scoring ${report.visibilityScore} out of 100 on AI visibility.`}
              </p>
              {brands.length > 0 && (
                <p className="text-zinc-400 leading-relaxed mb-4">
                  AI currently recommends {brands.length} other brand{brands.length !== 1 ? "s" : ""} in
                  {" "}{titleBrand}&apos;s space, including {brands.slice(0, 3).join(", ")}
                  {brands.length > 3 ? `, and ${brands.length - 3} more` : ""}.
                </p>
              )}
              <p className="text-zinc-400 leading-relaxed">
                AI visibility is becoming increasingly important as more buyers use ChatGPT
                and Perplexity instead of Google to research products. Brands that optimize
                for AI recommendations now gain a significant advantage.
              </p>
            </div>

            {/* View full report */}
            <div className="text-center mb-8">
              <Link
                href={`/teaser?domain=${encodeURIComponent(cleanDomain)}`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-colors"
              >
                Run a fresh scan for {cleanDomain}
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
              </Link>
            </div>
          </>
        ) : (
          <>
            {/* No data — prompt scan */}
            <div className="bg-white/[0.03] backdrop-blur-md border border-white/[0.06] rounded-2xl p-8 text-center mb-8">
              <div className="text-5xl font-black text-zinc-600 mb-4">?</div>
              <h2 className="text-xl font-bold text-white mb-2">
                No data yet for {cleanDomain}
              </h2>
              <p className="text-zinc-400 mb-6 max-w-md mx-auto">
                We haven&apos;t scanned {cleanDomain} yet. Run a free AI visibility check
                to see if ChatGPT and Perplexity recommend {titleBrand}.
              </p>
              <Link
                href={`/teaser?domain=${encodeURIComponent(cleanDomain)}`}
                className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-colors"
              >
                Scan {cleanDomain} now
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
              </Link>
              <p className="text-xs text-zinc-500 mt-4">Free &bull; No signup &bull; 10 seconds</p>
            </div>

            {/* SEO content for the no-data case */}
            <div className="prose prose-invert max-w-none mb-8">
              <h2 className="text-xl font-bold text-white mb-4">
                How to check if AI recommends {titleBrand}
              </h2>
              <p className="text-zinc-400 leading-relaxed mb-4">
                AI-powered search engines like ChatGPT, Perplexity, and Google AI are
                increasingly replacing traditional search for product recommendations.
                When a buyer asks &quot;best {brandName} alternatives&quot; or &quot;top tools like {brandName}&quot;,
                AI gives a direct answer — and if {cleanDomain} isn&apos;t mentioned,
                that&apos;s a customer going to another brand.
              </p>
              <p className="text-zinc-400 leading-relaxed mb-4">
                CabbageSEO&apos;s free AI visibility scanner checks {cleanDomain} across
                multiple AI platforms in real-time and shows you exactly who AI recommends,
                your visibility score, and which brands are winning.
              </p>
              <p className="text-zinc-400 leading-relaxed">
                The scan takes 10 seconds, requires no signup, and uses real API responses
                from ChatGPT, Perplexity, and Google AI — not cached or simulated data.
              </p>
            </div>
          </>
        )}

        {/* Related domains — real-time from DB */}
        {relatedDomains.length > 0 && (
          <div className="border-t border-white/[0.06] pt-8">
            <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wide mb-4">
              Recently scanned brands
            </h3>
            <div className="flex flex-wrap gap-2">
              {relatedDomains.map((d) => (
                <Link
                  key={d}
                  href={`/ai-visibility/${encodeURIComponent(d)}`}
                  className="px-4 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-zinc-400 hover:text-emerald-400 hover:border-emerald-500/20 transition-colors"
                >
                  {d}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
