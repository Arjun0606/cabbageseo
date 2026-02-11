/**
 * NEXT-ACTION ENGINE
 *
 * Determines the SINGLE most impactful next action for a site.
 * Category-aware: recommends different trust sources based on whether
 * the site is SaaS, e-commerce, local business, agency, etc.
 *
 * Priority order:
 * 1. Lost queries without fix pages (generate content to win them back)
 * 2. Zero citations anywhere (run first check)
 * 3. Missing key trust source for site category
 * 4. No comparison/alternative content
 * 5. No community presence (Reddit, forums)
 * 6. Low GEO score (< 50)
 * 7. Default: run another check
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

// Category-specific trust sources that AI platforms rely on
interface TrustSource {
  domain: string;
  name: string;
  signupUrl: string;
  description: string;
  priority: "critical" | "high";
}

function getTrustSourcesForCategory(category: string | null): TrustSource[] {
  const cat = (category || "").toLowerCase();

  // SaaS / Software
  if (cat.includes("saas") || cat.includes("software") || cat.includes("tech") || cat.includes("app") || cat.includes("tool")) {
    return [
      { domain: "g2.com", name: "G2", signupUrl: "https://www.g2.com/products/new", description: "G2 is the #1 software review platform that AI models trust. When ChatGPT or Perplexity recommend software, they heavily weight G2 reviews, ratings, and category rankings.", priority: "critical" },
      { domain: "capterra.com", name: "Capterra", signupUrl: "https://www.capterra.com/vendors/sign-up", description: "Capterra is a major software comparison platform. AI models cite Capterra reviews when users ask for tool recommendations. A verified profile with reviews builds citation-earning trust signals.", priority: "critical" },
      { domain: "producthunt.com", name: "Product Hunt", signupUrl: "https://www.producthunt.com/posts/new", description: "Product Hunt launches create permanent backlinks and social proof that AI models use when deciding which products to recommend. Even a modest launch significantly boosts discoverability.", priority: "high" },
    ];
  }

  // E-commerce / Retail / DTC
  if (cat.includes("ecommerce") || cat.includes("e-commerce") || cat.includes("retail") || cat.includes("shop") || cat.includes("store") || cat.includes("dtc")) {
    return [
      { domain: "trustpilot.com", name: "Trustpilot", signupUrl: "https://business.trustpilot.com/signup", description: "Trustpilot is the most-cited review platform for e-commerce. When AI recommends where to buy products, it heavily weights Trustpilot ratings and review volume. A verified profile is essential.", priority: "critical" },
      { domain: "bbb.org", name: "Better Business Bureau", signupUrl: "https://www.bbb.org/get-accredited", description: "BBB accreditation is a strong trust signal for consumer-facing businesses. AI platforms cite BBB ratings when users ask about business reliability and legitimacy.", priority: "high" },
      { domain: "sitejabber.com", name: "Sitejabber", signupUrl: "https://www.sitejabber.com/for-businesses", description: "Sitejabber reviews appear in AI recommendations for online stores. Building a review presence here creates additional trust signals that AI models aggregate.", priority: "high" },
    ];
  }

  // Agency / Consulting / Services
  if (cat.includes("agency") || cat.includes("consulting") || cat.includes("service") || cat.includes("marketing") || cat.includes("design")) {
    return [
      { domain: "clutch.co", name: "Clutch", signupUrl: "https://clutch.co/getting-listed", description: "Clutch is the top directory for agencies and service providers. AI platforms cite Clutch reviews and rankings when recommending agencies. A verified profile with client reviews is essential.", priority: "critical" },
      { domain: "trustpilot.com", name: "Trustpilot", signupUrl: "https://business.trustpilot.com/signup", description: "Trustpilot reviews create broad trust signals that AI platforms aggregate when recommending service providers. A verified profile with client reviews boosts your citation probability.", priority: "high" },
      { domain: "goodfirms.co", name: "GoodFirms", signupUrl: "https://www.goodfirms.co/get-listed", description: "GoodFirms is an established agency directory that AI models reference. Getting listed and reviewed builds category authority that AI uses for recommendations.", priority: "high" },
    ];
  }

  // Local business
  if (cat.includes("local") || cat.includes("restaurant") || cat.includes("clinic") || cat.includes("dental") || cat.includes("real estate") || cat.includes("plumb") || cat.includes("law")) {
    return [
      { domain: "yelp.com", name: "Yelp", signupUrl: "https://biz.yelp.com/signup", description: "Yelp is the most-cited local business platform by AI. When users ask ChatGPT or Google AI for local recommendations, Yelp ratings and reviews are primary trust signals.", priority: "critical" },
      { domain: "bbb.org", name: "Better Business Bureau", signupUrl: "https://www.bbb.org/get-accredited", description: "BBB accreditation signals legitimacy to AI platforms. For local businesses, BBB ratings are frequently cited when AI recommends service providers in your area.", priority: "high" },
      { domain: "trustpilot.com", name: "Trustpilot", signupUrl: "https://business.trustpilot.com/signup", description: "Trustpilot reviews complement Google Business reviews. AI platforms aggregate review data across platforms — more verified review sources means stronger trust signals.", priority: "high" },
    ];
  }

  // Default / General — universal trust sources
  return [
    { domain: "trustpilot.com", name: "Trustpilot", signupUrl: "https://business.trustpilot.com/signup", description: "Trustpilot is the most universally cited review platform by AI. A verified Trustpilot profile with reviews creates trust signals that ChatGPT, Perplexity, and Google AI all rely on.", priority: "critical" },
    { domain: "producthunt.com", name: "Product Hunt", signupUrl: "https://www.producthunt.com/posts/new", description: "Product Hunt creates permanent backlinks and social proof that AI models reference. A launch on Product Hunt signals innovation and builds the kind of third-party validation AI trusts.", priority: "high" },
    { domain: "g2.com", name: "G2", signupUrl: "https://www.g2.com/products/new", description: "G2 is a major review platform. If your product or service can be listed on G2, the verified reviews and ratings significantly boost how often AI platforms cite and recommend you.", priority: "high" },
  ];
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
 * Category-aware — recommends trust sources relevant to the site's industry.
 */
export async function getNextAction(
  siteId: string,
  db: SupabaseClient,
): Promise<NextAction> {
  // First, get site data to determine category
  const siteResult = await db
    .from("sites")
    .select("id, domain, category, total_citations, geo_score_avg")
    .eq("id", siteId)
    .maybeSingle();

  const site = siteResult.data;
  const trustSources = getTrustSourcesForCategory(site?.category ?? null);

  // Pre-fetch all data in parallel
  const sourceChecks = trustSources.map(s => hasSourceListing(siteId, s.domain, db));
  const [
    ...sourceResults
  ] = await Promise.all([
    ...sourceChecks,
  ]);

  const [
    citationCountResult,
    comparisonCitationResult,
    analysisResult,
    snapshotResult,
    pagesCountResult,
    hasReddit,
  ] = await Promise.all([
    db.from("citations").select("id", { count: "exact", head: true }).eq("site_id", siteId),
    db.from("citations").select("id", { count: "exact", head: true }).eq("site_id", siteId).or("query.ilike.%vs %,query.ilike.% vs%,query.ilike.%alternative%"),
    db.from("geo_analyses").select("score").eq("site_id", siteId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    db.from("market_share_snapshots").select("queries_lost").eq("site_id", siteId).order("snapshot_date", { ascending: false }).limit(1).maybeSingle(),
    db.from("generated_pages").select("id", { count: "exact", head: true }).eq("site_id", siteId),
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

  // --- Priority 1: Lost queries without fix pages ---
  if (queriesLost > 0 && pagesCount < queriesLost) {
    const remaining = queriesLost - pagesCount;
    return {
      id: "generate_fix_pages",
      title: `Generate fix pages for ${remaining} gap${remaining === 1 ? "" : "s"} in your AI visibility`,
      description:
        `AI platforms are answering ${queriesLost} quer${queriesLost === 1 ? "y" : "ies"} in your space without mentioning you. ` +
        "Fix pages are AI-optimized content specifically crafted to earn citations — " +
        "each one targets a query where you're currently invisible. " +
        `You've covered ${pagesCount} so far. Generate pages for the remaining ${remaining} to close the gap.`,
      priority: "critical",
      estimatedMinutes: 5,
      actionUrl: "/dashboard/pages",
      category: "content",
    };
  }

  // --- Priority 2: Zero citations — run first check ---
  if (totalCitations === 0) {
    return {
      id: "run_first_check",
      title: "Run your first AI visibility scan",
      description:
        "You haven't scanned your AI visibility yet. Run a scan to discover " +
        "which queries AI platforms answer about your space — and whether they're " +
        "recommending you or sending users elsewhere. This takes about 60 seconds.",
      priority: "critical",
      estimatedMinutes: 1,
      category: "monitoring",
    };
  }

  // --- Priority 3: Missing trust sources (category-specific) ---
  for (let i = 0; i < trustSources.length; i++) {
    const source = trustSources[i];
    const hasListing = sourceResults[i];
    if (!hasListing) {
      return {
        id: `get_listed_${source.name.toLowerCase().replace(/\s+/g, "_")}`,
        title: `Get listed on ${source.name}`,
        description: source.description,
        priority: source.priority,
        estimatedMinutes: 120,
        actionUrl: source.signupUrl,
        category: "source",
      };
    }
  }

  // --- Priority 4: No comparison content ---
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

  // --- Priority 5: No Reddit / community presence ---
  if (!hasReddit) {
    return {
      id: "build_community_presence",
      title: "Build presence on Reddit and community forums",
      description:
        "Reddit is one of the most-cited sources by AI platforms — especially Perplexity " +
        "and ChatGPT. Authentic posts, comments, and discussions about your product " +
        "in relevant subreddits create the kind of organic mentions AI trusts most. " +
        "Focus on being genuinely helpful, not promotional.",
      priority: "medium",
      estimatedMinutes: 30,
      actionUrl: "https://www.reddit.com",
      category: "source",
    };
  }

  // --- Priority 6: Low GEO score ---
  if (geoScore !== null && geoScore < 50) {
    return {
      id: "improve_ai_readability",
      title: "Improve your website's AI-readability score",
      description:
        `Your GEO score is ${geoScore}/100 — AI models are struggling to understand ` +
        "and extract information from your website. The highest-impact improvements: " +
        "add Schema.org JSON-LD markup (FAQPage, Product, Organization), use clear " +
        "H2/H3 heading hierarchy, write concise meta descriptions, and ensure your " +
        "homepage directly states what you do in the first sentence.",
      priority: "medium",
      estimatedMinutes: 120,
      category: "technical",
    };
  }

  // --- Priority 7: Default ---
  return {
    id: "run_another_check",
    title: "Run another scan to track your progress",
    description:
      "You're in good shape! Your trust sources are set up, your content covers key queries, " +
      "and your GEO score is solid. Keep scanning regularly to catch new queries where " +
      "AI mentions your space — each scan can auto-generate fix pages for new gaps it finds.",
    priority: "low",
    estimatedMinutes: 1,
    category: "monitoring",
  };
}

