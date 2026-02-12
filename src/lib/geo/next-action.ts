/**
 * NEXT-ACTION ENGINE
 *
 * Determines the SINGLE most impactful next action for a site.
 * Uses AI-powered trust source selection (not hardcoded tag matching)
 * to recommend sources relevant to the actual business.
 *
 * Priority order:
 * 1. Unpublished draft pages (low-hanging fruit — just publish them)
 * 2. Lost queries without fix pages (generate content to win them back)
 * 3. Zero citations anywhere (run first check)
 * 4. Missing key trust source (dynamically selected per business)
 * 5. No comparison/alternative content
 * 6. No community presence (Reddit, forums)
 * 7. Low GEO score (< 50)
 * 8. Default: run another check
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { selectRelevantTrustSources, type TrustSource } from "@/lib/ai-revenue/sources";
import { fetchSiteContext } from "@/lib/geo/site-context";

export interface NextAction {
  id: string;
  title: string;
  description: string;
  priority: "critical" | "high" | "medium" | "low";
  estimatedMinutes: number;
  actionUrl?: string;
  category: "source" | "content" | "technical" | "monitoring";
}

/**
 * Check whether a specific source domain has a verified listing for this site.
 */
async function hasSourceListing(
  siteId: string,
  sourceDomain: string,
  db: SupabaseClient,
): Promise<boolean> {
  const { data } = await db
    .from("source_listings")
    .select("id")
    .eq("site_id", siteId)
    .eq("source_domain", sourceDomain)
    .eq("status", "verified")
    .limit(1)
    .maybeSingle();

  return !!data;
}

/**
 * Determine the single most impactful next action for a site.
 */
export async function getNextAction(
  siteId: string,
  db: SupabaseClient,
): Promise<NextAction> {
  // Get site data
  const siteResult = await db
    .from("sites")
    .select("id, domain, category, total_citations, geo_score_avg")
    .eq("id", siteId)
    .maybeSingle();

  const site = siteResult.data;

  // Use AI-powered trust source selection instead of hardcoded tags
  let relevantSources: TrustSource[] = [];
  try {
    const siteCtx = await fetchSiteContext(site?.domain || "");
    relevantSources = await selectRelevantTrustSources(site?.domain || "", siteCtx);
  } catch {
    // Fallback handled inside selectRelevantTrustSources
  }
  // Take top 3 most important sources
  const trustSources = relevantSources
    .sort((a, b) => b.trustScore - a.trustScore)
    .slice(0, 3);

  // Pre-fetch all data in parallel
  const sourceChecks = trustSources.map(s => hasSourceListing(siteId, s.domain, db));
  const [...sourceResults] = await Promise.all([...sourceChecks]);

  const [
    citationCountResult,
    comparisonCitationResult,
    analysisResult,
    snapshotResult,
    pagesCountResult,
    draftPagesResult,
    hasReddit,
  ] = await Promise.all([
    db.from("citations").select("id", { count: "exact", head: true }).eq("site_id", siteId),
    db.from("citations").select("id", { count: "exact", head: true }).eq("site_id", siteId).or("query.ilike.%vs %,query.ilike.% vs%,query.ilike.%alternative%"),
    db.from("geo_analyses").select("score").eq("site_id", siteId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    db.from("market_share_snapshots").select("queries_lost").eq("site_id", siteId).order("snapshot_date", { ascending: false }).limit(1).maybeSingle(),
    db.from("generated_pages").select("id", { count: "exact", head: true }).eq("site_id", siteId),
    db.from("generated_pages").select("id", { count: "exact", head: true }).eq("site_id", siteId).eq("status", "draft"),
    hasSourceListing(siteId, "reddit.com", db),
  ]);

  const totalCitations = citationCountResult.count ?? 0;
  const comparisonCitations = comparisonCitationResult.count ?? 0;
  const geoScore =
    (analysisResult.data?.score as { overall?: number } | null)?.overall ??
    site?.geo_score_avg ??
    null;
  const queriesLost = snapshotResult.data?.queries_lost ?? 0;
  const pagesCount = pagesCountResult.count ?? 0;
  const draftPagesCount = draftPagesResult.count ?? 0;

  // --- Priority 1: Unpublished draft pages (just publish them!) ---
  if (draftPagesCount > 0) {
    return {
      id: "publish_draft_pages",
      title: `Publish ${draftPagesCount} draft page${draftPagesCount === 1 ? "" : "s"} to start earning citations`,
      description:
        `You have ${draftPagesCount} AI-optimized page${draftPagesCount === 1 ? "" : "s"} ready to go. ` +
        "Copy the content to your site and mark them as published. " +
        "AI models typically discover new pages within 1-2 weeks.",
      priority: "critical",
      estimatedMinutes: 10 * draftPagesCount,
      actionUrl: "/dashboard/pages",
      category: "content",
    };
  }

  // --- Priority 2: Lost queries without fix pages ---
  if (queriesLost > 0 && pagesCount < queriesLost) {
    const remaining = queriesLost - pagesCount;
    return {
      id: "generate_fix_pages",
      title: `Generate fix pages for ${remaining} gap${remaining === 1 ? "" : "s"} in your AI visibility`,
      description:
        `AI platforms are answering ${queriesLost} quer${queriesLost === 1 ? "y" : "ies"} in your space without mentioning you. ` +
        "Fix pages are AI-optimized content backed by real web research, specifically crafted to earn citations. " +
        `You've covered ${pagesCount} so far. Generate pages for the remaining ${remaining} to close the gap.`,
      priority: "critical",
      estimatedMinutes: 5,
      actionUrl: "/dashboard/pages",
      category: "content",
    };
  }

  // --- Priority 3: Zero citations — run first check ---
  if (totalCitations === 0) {
    return {
      id: "run_first_check",
      title: "Run your first AI visibility scan",
      description:
        "You haven't scanned your AI visibility yet. Run a scan to discover " +
        "which queries AI platforms answer about your space and whether they mention you. " +
        "This takes about 60 seconds.",
      priority: "critical",
      estimatedMinutes: 1,
      category: "monitoring",
    };
  }

  // --- Priority 4: Missing trust sources (AI-selected per business) ---
  for (let i = 0; i < trustSources.length; i++) {
    const source = trustSources[i];
    const hasListing = sourceResults[i];
    if (!hasListing) {
      return {
        id: `get_listed_${source.name.toLowerCase().replace(/\s+/g, "_")}`,
        title: `Get listed on ${source.name}`,
        description:
          `${source.name} (trust score: ${source.trustScore}/10) is a key platform AI uses to decide ` +
          `whether to recommend businesses like yours. ${source.howToGetListed}`,
        priority: source.trustScore >= 9 ? "critical" : "high",
        estimatedMinutes: source.estimatedEffort === "low" ? 30 : source.estimatedEffort === "medium" ? 120 : 240,
        actionUrl: `https://${source.domain}`,
        category: "source",
      };
    }
  }

  // --- Priority 5: No comparison content ---
  if (comparisonCitations === 0) {
    return {
      id: "publish_comparison_page",
      title: "Publish a comparison page for your category",
      description:
        "When users ask AI \"What's the best tool for X?\" or \"X vs Y\", " +
        "AI platforms look for structured comparison content with tables, " +
        "pros/cons, and clear rankings. Publishing a detailed comparison page " +
        "with your product included puts you directly in those conversations.",
      priority: "high",
      estimatedMinutes: 60,
      category: "content",
    };
  }

  // --- Priority 6: No Reddit / community presence ---
  if (!hasReddit) {
    return {
      id: "build_community_presence",
      title: "Build presence on Reddit and community forums",
      description:
        "Reddit is one of the most-cited sources by AI platforms, especially Perplexity " +
        "and ChatGPT. Authentic posts, comments, and discussions about your product " +
        "in relevant subreddits create the kind of organic mentions AI trusts most. " +
        "Focus on being genuinely helpful, not promotional.",
      priority: "medium",
      estimatedMinutes: 30,
      actionUrl: "https://www.reddit.com",
      category: "source",
    };
  }

  // --- Priority 7: Low GEO score ---
  if (geoScore !== null && geoScore < 50) {
    return {
      id: "improve_ai_readability",
      title: "Improve your website's AI-readability score",
      description:
        `Your GEO score is ${geoScore}/100. AI models are struggling to understand ` +
        "and extract information from your website. The highest-impact improvements: " +
        "add Schema.org JSON-LD markup (FAQPage, Product, Organization), use clear " +
        "H2/H3 heading hierarchy, write concise meta descriptions, and ensure your " +
        "homepage directly states what you do in the first sentence.",
      priority: "medium",
      estimatedMinutes: 120,
      category: "technical",
    };
  }

  // --- Priority 8: Default ---
  return {
    id: "run_another_check",
    title: "Run another scan to track your progress",
    description:
      "You're in good shape! Your trust sources are set up, your content covers key queries, " +
      "and your GEO score is solid. Keep scanning regularly to catch new queries where " +
      "AI mentions your space. Each scan can auto-generate fix pages for new gaps it finds.",
    priority: "low",
    estimatedMinutes: 1,
    category: "monitoring",
  };
}
