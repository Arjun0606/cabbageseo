/**
 * NEXT-ACTION ENGINE
 *
 * Determines the SINGLE most impactful next action for a site.
 * Checks conditions in strict priority order and returns the first
 * action that applies. This keeps the dashboard focused on ONE thing.
 *
 * Priority order:
 * 1. Lost queries without Authority Pages (generate content to win them back)
 * 2. No G2 listing
 * 3. No Capterra listing
 * 4. Zero citations anywhere
 * 5. No Product Hunt listing
 * 6. No comparison content (no "vs" or "alternative" queries)
 * 7. No Reddit presence
 * 8. Low GEO score (< 50)
 * 9. Default: run another check
 */

import type { SupabaseClient } from "@supabase/supabase-js";

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
 *
 * Queries source_listings, citations, sites, and geo_analyses tables
 * to evaluate each condition in priority order.
 */
export async function getNextAction(
  siteId: string,
  db: SupabaseClient,
): Promise<NextAction> {
  // Pre-fetch data we need for multiple checks in parallel
  const [
    hasG2,
    hasCapterra,
    hasProductHunt,
    hasReddit,
    siteResult,
    citationCountResult,
    comparisonCitationResult,
    analysisResult,
    snapshotResult,
    pagesCountResult,
  ] = await Promise.all([
    // Source listings
    hasSourceListing(siteId, "g2.com", db),
    hasSourceListing(siteId, "capterra.com", db),
    hasSourceListing(siteId, "producthunt.com", db),
    hasSourceListing(siteId, "reddit.com", db),

    // Site data
    db
      .from("sites")
      .select("id, domain, total_citations, geo_score_avg")
      .eq("id", siteId)
      .maybeSingle(),

    // Total citation count
    db
      .from("citations")
      .select("id", { count: "exact", head: true })
      .eq("site_id", siteId),

    // Comparison-related citations (queries containing "vs" or "alternative")
    db
      .from("citations")
      .select("id", { count: "exact", head: true })
      .eq("site_id", siteId)
      .or("query.ilike.%vs %,query.ilike.% vs%,query.ilike.%alternative%"),

    // Most recent GEO analysis
    db
      .from("geo_analyses")
      .select("score")
      .eq("site_id", siteId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),

    // Latest market share snapshot (queries lost count)
    db
      .from("market_share_snapshots")
      .select("queries_lost")
      .eq("site_id", siteId)
      .order("snapshot_date", { ascending: false })
      .limit(1)
      .maybeSingle(),

    // Count of generated Authority Pages for this site
    db
      .from("generated_pages")
      .select("id", { count: "exact", head: true })
      .eq("site_id", siteId),
  ]);

  const site = siteResult.data;
  const totalCitations = citationCountResult.count ?? 0;
  const comparisonCitations = comparisonCitationResult.count ?? 0;
  const geoScore =
    (analysisResult.data?.score as { overall?: number } | null)?.overall ??
    site?.geo_score_avg ??
    null;

  const queriesLost = snapshotResult.data?.queries_lost ?? 0;
  const pagesCount = pagesCountResult.count ?? 0;

  const topCompetitorDomain = await getTopCompetitorDomain(siteId, db);

  // --- Priority 1: Lost queries without Authority Pages ---
  if (queriesLost > 0 && pagesCount < queriesLost) {
    const remaining = queriesLost - pagesCount;
    return {
      id: "generate_authority_pages",
      title: `Generate Authority Pages for ${remaining} lost quer${remaining === 1 ? "y" : "ies"}`,
      description:
        `You're losing ${queriesLost} quer${queriesLost === 1 ? "y" : "ies"} to competitors. ` +
        "Generate Authority Pages — AI-optimized content specifically " +
        "crafted to make AI recommend you instead. Each page targets " +
        "a query you're currently losing.",
      priority: "critical",
      estimatedMinutes: 5,
      actionUrl: "/dashboard/pages",
      category: "content",
    };
  }

  // --- Priority 2: No G2 listing ---
  if (!hasG2) {
    return {
      id: "get_listed_g2",
      title: "Get listed on G2",
      description:
        "G2 is the #1 software review site that AI platforms trust. " +
        "Getting a verified G2 profile dramatically increases your chances " +
        "of being recommended by ChatGPT, Perplexity, and Google AI.",
      priority: "critical",
      estimatedMinutes: 120,
      actionUrl: "https://www.g2.com/products/new",
      category: "source",
    };
  }

  // --- Priority 3: No Capterra listing ---
  if (!hasCapterra) {
    return {
      id: "get_listed_capterra",
      title: "Get listed on Capterra",
      description:
        "Capterra is a top software comparison platform. AI models frequently " +
        "cite Capterra reviews and rankings when recommending tools. " +
        "A Capterra listing builds trust signals that AI relies on.",
      priority: "critical",
      estimatedMinutes: 120,
      actionUrl: "https://www.capterra.com/vendors/sign-up",
      category: "source",
    };
  }

  // --- Priority 4: Zero citations anywhere ---
  if (totalCitations === 0) {
    return {
      id: "run_first_check",
      title: "Run your first AI visibility check",
      description:
        "You haven't checked your AI visibility yet. Run a quick scan to see " +
        "if ChatGPT, Perplexity, and Google AI are recommending you " +
        "or sending users to competitors instead.",
      priority: "critical",
      estimatedMinutes: 1,
      category: "monitoring",
    };
  }

  // --- Priority 5: No Product Hunt listing ---
  if (!hasProductHunt) {
    return {
      id: "launch_product_hunt",
      title: "Launch on Product Hunt",
      description:
        "Product Hunt launches create a permanent backlink and social proof " +
        "that AI models use when deciding which products to recommend. " +
        "Even a modest launch significantly boosts AI discoverability.",
      priority: "high",
      estimatedMinutes: 90,
      actionUrl: "https://www.producthunt.com/posts/new",
      category: "source",
    };
  }

  // --- Priority 6: No comparison content ---
  if (comparisonCitations === 0) {
    const competitorLabel = topCompetitorDomain || "Top Competitor";
    return {
      id: "publish_comparison_page",
      title: `Publish a comparison page: You vs ${competitorLabel}`,
      description:
        "AI models love structured comparison content. When someone asks " +
        '"What is the best alternative to X?" AI looks for head-to-head ' +
        "comparisons. Publishing a comparison page puts you in the conversation.",
      priority: "high",
      estimatedMinutes: 60,
      category: "content",
    };
  }

  // --- Priority 7: No Reddit presence ---
  if (!hasReddit) {
    return {
      id: "post_on_reddit",
      title: "Post about your tool on relevant subreddits",
      description:
        "Reddit is one of the most-cited sources by AI platforms. " +
        "Authentic posts and comments about your tool in relevant " +
        "subreddits create citations that AI models trust and reference.",
      priority: "medium",
      estimatedMinutes: 30,
      actionUrl: "https://www.reddit.com",
      category: "source",
    };
  }

  // --- Priority 8: Low GEO score ---
  if (geoScore !== null && geoScore < 50) {
    return {
      id: "improve_ai_readability",
      title: "Improve your website's AI-readability",
      description:
        "Your GEO score is below 50, which means AI models struggle to " +
        "understand and extract information from your website. Adding " +
        "structured data (JSON-LD), clear headings, and concise descriptions " +
        "can dramatically improve how AI interprets your content.",
      priority: "medium",
      estimatedMinutes: 120,
      category: "technical",
    };
  }

  // --- Priority 9: Default ---
  return {
    id: "run_another_check",
    title: "Run another check to track your progress",
    description:
      "You're in good shape! Keep monitoring your AI visibility " +
      "to catch any changes. Regular checks help you spot trends " +
      "and react before competitors pull ahead.",
    priority: "low",
    estimatedMinutes: 1,
    category: "monitoring",
  };
}

/**
 * Get the top competitor's domain for comparison page suggestion.
 */
async function getTopCompetitorDomain(
  siteId: string,
  db: SupabaseClient,
): Promise<string | null> {
  const { data } = await db
    .from("competitors")
    .select("domain")
    .eq("site_id", siteId)
    .order("total_citations", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data?.domain as string) ?? null;
}
