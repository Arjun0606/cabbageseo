/**
 * AI Visibility Intelligence Service
 *
 * Three intelligence tools that turn scan data into action:
 *
 * 1. Citation Gap Analysis — "Why isn't AI citing me for this query?"
 *    Uses GPT-5.2 + actual site content + web research for specific answers.
 *
 * 2. Content Recommendations — "What to publish next to get cited"
 *    Researches real topics via Perplexity, cross-references existing pages.
 *
 * 3. Weekly Action Plan — "Your AI Search To-Do List"
 *    Consultant-grade weekly priorities based on real scan data.
 *
 * All intelligence uses GPT-5.2 (primary LLM) with site context and
 * web research for grounded, actionable recommendations.
 */

import { createClient } from "@supabase/supabase-js";
import { fetchSiteContext, formatSiteContextForPrompt } from "@/lib/geo/site-context";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// ============================================
// TYPES
// ============================================

interface GapAnalysisResult {
  query: string;
  aiAnswer: string;
  citedDomains: string[];
  yourDomain: string;
  wasYouCited: boolean;
  whyNotYou: string[];
  missingElements: string[];
  authorityGaps: string[];
  contentGaps: string[];
  actionItems: string[];
  confidence: "high" | "medium" | "low";
}

interface ContentRecommendation {
  title: string;
  description: string;
  targetQueries: string[];
  entities: string[];
  suggestedHeadings: string[];
  faqQuestions: string[];
  priority: "high" | "medium" | "low";
  rationale: string;
}

interface WeeklyActionPlan {
  weekOf: string;
  summary: string;
  priorities: {
    title: string;
    description: string;
    impact: "high" | "medium" | "low";
    effort: "low" | "medium" | "high";
  }[];
  queriesWon: { query: string; platform: string }[];
  queriesMissing: { query: string; platform: string }[];
  contentToDo: ContentRecommendation[];
  insights: string[];
}

// ============================================
// LLM — GPT-5.2 for all intelligence
// ============================================

const GEO_EXPERT_SYSTEM = `You are a Generative Engine Optimization (GEO) expert. You understand exactly how ChatGPT, Perplexity, and Google AI Overview decide which websites to cite.

KEY CITATION FACTORS:
1. Direct answer positioning — first 1-2 sentences must directly answer the query
2. Quotable specificity — specific numbers, dates, named entities get cited; generic statements never do
3. Source authority — verified profiles on G2, Trustpilot, etc. are strong trust signals
4. Content structure — clear H2/H3 hierarchy, FAQ sections, comparison tables, Schema.org markup
5. Topical authority — comprehensive coverage across multiple pages beats one-off pages
6. Freshness — current-year references, recent data, and timestamps signal relevance
7. Entity density — mentioning specific companies, standards, and people signals expertise
8. Third-party citations — referencing real studies and reports builds credibility

RULES:
- Be specific. Never generic. Every recommendation must be immediately actionable.
- Reference the actual site content you've been given — don't guess.
- Use the research data provided — ground your analysis in real, current information.
- Always respond in valid JSON.`;

function extractJSON(text: string): string {
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (fenceMatch) return fenceMatch[1].trim();
  return text.trim();
}

async function askLLM(prompt: string, maxTokens: number = 4096): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OpenAI API key not configured");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-5.2",
      messages: [
        { role: "system", content: GEO_EXPERT_SYSTEM },
        { role: "user", content: prompt },
      ],
      max_completion_tokens: maxTokens,
    }),
    signal: AbortSignal.timeout(90000),
  });

  if (!response.ok) {
    const err = await response.text().catch(() => "");
    throw new Error(`OpenAI API error: ${response.status} ${err}`);
  }

  const data = await response.json();
  const rawContent = data.choices?.[0]?.message?.content || "";
  return extractJSON(rawContent);
}

// ============================================
// WEB RESEARCH (Perplexity)
// ============================================

async function researchQuery(query: string): Promise<string> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) return "";

  try {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          { role: "system", content: "Provide a thorough, factual answer with specific sources. Include real company names, real pricing, real features." },
          { role: "user", content: query },
        ],
        return_citations: true,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) return "";
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const citations: string[] = data.citations || [];
    return `${content}\n\nSources: ${citations.join(", ")}`;
  } catch {
    return "";
  }
}

// ============================================
// 1. CITATION GAP ANALYSIS
// Uses site content + richer geo_analyses data + web research
// ============================================

export async function analyzeCitationGap(
  siteId: string,
  query: string,
  organizationId: string
): Promise<GapAnalysisResult> {
  const supabase = createClient(supabaseUrl, serviceKey);

  const { data: site } = await supabase
    .from("sites")
    .select("domain, main_topics, category")
    .eq("id", siteId)
    .single();

  if (!site) throw new Error("Site not found");

  // Fetch everything in parallel: site content, citations, geo_analyses, existing pages, web research
  const [siteContext, citationResult, geoResult, pagesResult, webResearch] = await Promise.all([
    fetchSiteContext(site.domain),
    supabase.from("citations").select("*").eq("site_id", siteId).eq("query", query),
    supabase
      .from("geo_analyses")
      .select("queries")
      .eq("site_id", siteId)
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("generated_pages")
      .select("query, title")
      .eq("site_id", siteId),
    researchQuery(query),
  ]);

  const citations = citationResult.data || [];
  const citedDomains = (citations
    .map(c => c.source_domain || c.snippet?.match(/https?:\/\/([^/\s]+)/)?.[1])
    .filter(Boolean) as string[]) || [];
  const wasYouCited = citedDomains.some(d => d?.includes(site.domain));

  // Extract richer data from geo_analyses
  const geoAnalyses = geoResult.data || [];
  let queryGeoData: {
    buyerIntent?: string;
    citedOnPlatforms?: string[];
    missedOnPlatforms?: string[];
    citedDomains?: string[];
  } | null = null;

  for (const analysis of geoAnalyses) {
    const queries = analysis.queries as Array<{
      query: string;
      buyerIntent?: string;
      citedOnPlatforms?: string[];
      missedOnPlatforms?: string[];
      citedDomains?: string[];
    }> | null;
    if (queries) {
      const match = queries.find(q => q.query.toLowerCase() === query.toLowerCase());
      if (match) {
        queryGeoData = match;
        break;
      }
    }
  }

  // Check if there's already a fix page for this query
  const existingPages = pagesResult.data || [];
  const hasExistingPage = existingPages.some(
    p => p.query.toLowerCase() === query.toLowerCase()
  );

  const siteContextText = formatSiteContextForPrompt(site.domain, siteContext);

  const prompt = `Analyze why ${site.domain} ${wasYouCited ? "is inconsistently cited" : "is NOT being cited"} for this query, and provide a specific remediation plan.

QUERY: "${query}"
${queryGeoData?.buyerIntent ? `BUYER INTENT: ${queryGeoData.buyerIntent}` : ""}

USER'S SITE (actual scraped content):
${siteContextText}
Category: ${site.category || "Unknown"}
Topics: ${(site.main_topics || []).join(", ") || "Not specified"}

WAS CITED: ${wasYouCited ? "Yes" : "No"}
${queryGeoData?.citedOnPlatforms ? `CITED ON: ${queryGeoData.citedOnPlatforms.join(", ")}` : ""}
${queryGeoData?.missedOnPlatforms ? `MISSED ON: ${queryGeoData.missedOnPlatforms.join(", ")}` : ""}
${queryGeoData?.citedDomains ? `DOMAINS CITED INSTEAD: ${queryGeoData.citedDomains.join(", ")}` : citedDomains.length > 0 ? `DOMAINS CITED INSTEAD: ${citedDomains.join(", ")}` : ""}

${citations.length > 0 ? `AI RESPONSES:\n${citations.map(c => `- ${c.platform}: "${(c.snippet || "").slice(0, 300)}"`).join("\n")}` : "No citation data yet."}

${webResearch ? `LIVE WEB RESEARCH ON THIS TOPIC:\n${webResearch.slice(0, 2000)}` : ""}

${hasExistingPage ? `NOTE: A fix page already exists for this query. Focus on what else needs to change beyond the page.` : ""}

ANALYSIS STEPS:
1. What does the user asking this query actually want? What kind of source answers this best?
2. Looking at the ACTUAL site content above, what's specifically missing that would make AI cite it?
3. What do the cited domains have that this site doesn't? Use the web research to be specific.
4. What exact changes would fix this gap? Be concrete — name specific content to create, specific structure to use.

Return JSON:
{
  "whyNotYou": ["Specific reason with evidence from the site content — reference what you actually see on the site"],
  "missingElements": ["Specific element the site needs — reference the research data for what works"],
  "authorityGaps": ["Specific authority signal needed — be concrete"],
  "contentGaps": ["Specific content to create with exact title and structure — don't suggest what already exists"],
  "actionItems": ["Concrete action with expected impact. If a fix page exists, focus on site changes instead."],
  "confidence": "high | medium | low"
}`;

  const response = await askLLM(prompt, 6000);

  try {
    const parsed = JSON.parse(response);
    return {
      query,
      aiAnswer: citations[0]?.snippet || "",
      citedDomains: queryGeoData?.citedDomains || citedDomains,
      yourDomain: site.domain,
      wasYouCited,
      whyNotYou: parsed.whyNotYou || [],
      missingElements: parsed.missingElements || [],
      authorityGaps: parsed.authorityGaps || [],
      contentGaps: parsed.contentGaps || [],
      actionItems: parsed.actionItems || [],
      confidence: parsed.confidence || "medium",
    };
  } catch {
    return {
      query,
      aiAnswer: citations[0]?.snippet || "",
      citedDomains: queryGeoData?.citedDomains || citedDomains,
      yourDomain: site.domain,
      wasYouCited,
      whyNotYou: ["Analysis could not be completed — try again"],
      missingElements: [],
      authorityGaps: [],
      contentGaps: [],
      actionItems: ["Run a citation check to gather more data"],
      confidence: "low",
    };
  }
}

// ============================================
// 2. CONTENT RECOMMENDATIONS
// Uses web research + cross-references existing pages
// ============================================

export async function generateContentRecommendations(
  siteId: string,
  organizationId: string,
  limit: number = 5
): Promise<ContentRecommendation[]> {
  const supabase = createClient(supabaseUrl, serviceKey);

  const { data: site } = await supabase
    .from("sites")
    .select("domain, main_topics, category")
    .eq("id", siteId)
    .single();

  if (!site) throw new Error("Site not found");

  // Fetch everything in parallel
  const [siteContext, citationResult, listingsResult, pagesResult, geoResult] = await Promise.all([
    fetchSiteContext(site.domain),
    supabase.from("citations").select("query, snippet, platform, confidence").eq("site_id", siteId).order("cited_at", { ascending: false }).limit(50),
    supabase.from("source_listings").select("source_domain, status").eq("site_id", siteId),
    supabase.from("generated_pages").select("query, title").eq("site_id", siteId),
    supabase.from("geo_analyses").select("queries").eq("site_id", siteId).order("created_at", { ascending: false }).limit(3),
  ]);

  const citations = citationResult.data || [];
  const verifiedSources = (listingsResult.data || []).filter(l => l.status === "verified").map(l => l.source_domain);
  const existingPages = (pagesResult.data || []).map(p => p.query.toLowerCase());

  const wins = citations.filter(c => c.confidence === "high" || c.confidence === "medium");
  const gaps = citations.filter(c => c.confidence === "low" || c.confidence === "none");

  // Extract richer gap data from geo_analyses
  const geoAnalyses = geoResult.data || [];
  const allGapQueries: Array<{
    query: string;
    buyerIntent?: string;
    citedDomains?: string[];
    missedOnPlatforms?: string[];
  }> = [];
  for (const analysis of geoAnalyses) {
    const queries = analysis.queries as Array<{
      query: string;
      won: boolean;
      buyerIntent?: string;
      citedDomains?: string[];
      missedOnPlatforms?: string[];
    }> | null;
    if (queries) {
      for (const q of queries) {
        if (!q.won && !allGapQueries.some(g => g.query.toLowerCase() === q.query.toLowerCase())) {
          allGapQueries.push(q);
        }
      }
    }
  }

  // Research the top gap queries to ground recommendations in real data
  const topGaps = allGapQueries.slice(0, 3);
  const researchPromises = topGaps.map(g => researchQuery(g.query));
  const researchResults = await Promise.all(researchPromises);

  const siteContextText = formatSiteContextForPrompt(site.domain, siteContext);

  const prompt = `Generate ${limit} high-impact content recommendations for this site. Each should target queries where AI platforms currently DON'T cite this site. DO NOT recommend content that already exists.

SITE (actual content):
${siteContextText}
Category: ${site.category || "General"}
Topics: ${(site.main_topics || []).join(", ") || "General"}
Trust sources verified: ${verifiedSources.length > 0 ? verifiedSources.join(", ") : "None yet"}

QUERIES WHERE ALREADY CITED (build on this):
${wins.slice(0, 10).map(c => `  + "${c.query}" on ${c.platform}`).join("\n") || "No confirmed citations yet"}

VISIBILITY GAPS (with buyer intent and competitive data):
${allGapQueries.slice(0, 10).map(g =>
    `  - "${g.query}"${g.buyerIntent ? ` [${g.buyerIntent}]` : ""}${g.citedDomains?.length ? ` — cited: ${g.citedDomains.join(", ")}` : ""}${g.missedOnPlatforms?.length ? ` — missed on: ${g.missedOnPlatforms.join(", ")}` : ""}`
  ).join("\n") || gaps.slice(0, 10).map(c => `  - "${c.query}" on ${c.platform}`).join("\n") || "No gap data yet — recommend foundational content"}

${researchResults.some(r => r) ? `LIVE WEB RESEARCH ON TOP GAPS:\n${researchResults.filter(r => r).map((r, i) => `--- "${topGaps[i]?.query}" ---\n${r.slice(0, 800)}`).join("\n\n")}` : ""}

ALREADY EXISTING PAGES (do NOT recommend these topics again):
${existingPages.length > 0 ? existingPages.map(q => `  ✓ ${q}`).join("\n") : "  No pages generated yet"}

For each recommendation:
1. Target specific queries AI platforms get asked — use the research data to identify real, high-value queries
2. Explain why AI will cite this content (which citation factor)
3. Suggest exact heading structure based on what actually works (from research)
4. Include FAQ questions real users ask
5. Don't overlap with existing pages — each targets a different query cluster
6. Prioritize high buyer-intent queries first

Return JSON:
{
  "recommendations": [
    {
      "title": "Specific page title targeting a real query",
      "description": "What makes this the best resource for this topic — reference the research",
      "targetQueries": ["query 1", "query 2", "query 3"],
      "entities": ["real entity from research", "another"],
      "suggestedHeadings": ["## Real user question as heading", "## Another heading"],
      "faqQuestions": ["Real question users ask based on research?"],
      "priority": "high | medium | low",
      "rationale": "Which citation factor this addresses, why this query matters, expected impact"
    }
  ]
}`;

  const response = await askLLM(prompt, 8000);

  try {
    const parsed = JSON.parse(response);
    return parsed.recommendations || [];
  } catch {
    return [];
  }
}

// ============================================
// 3. WEEKLY ACTION PLAN
// Data-driven with richer scan data
// ============================================

export async function generateWeeklyActionPlan(
  siteId: string,
  organizationId: string
): Promise<WeeklyActionPlan> {
  const startTime = Date.now();
  const supabase = createClient(supabaseUrl, serviceKey);

  const { data: site } = await supabase
    .from("sites")
    .select("*")
    .eq("id", siteId)
    .single();

  if (!site) throw new Error("Site not found");

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  // Fetch all context in parallel
  const [siteContext, recentCitationsResult, geoAnalysisResult, listingsResult, pagesResult] = await Promise.all([
    fetchSiteContext(site.domain),
    supabase.from("citations").select("*").eq("site_id", siteId).gte("cited_at", weekAgo.toISOString()).order("cited_at", { ascending: false }),
    supabase.from("geo_analyses").select("score, tips, queries").eq("site_id", siteId).order("created_at", { ascending: false }).limit(2),
    supabase.from("source_listings").select("source_domain, source_name, status").eq("site_id", siteId),
    supabase.from("generated_pages").select("query, status, created_at").eq("site_id", siteId),
  ]);

  const recentCitations = recentCitationsResult.data || [];
  const geoAnalyses = geoAnalysisResult.data || [];
  const latestAnalysis = geoAnalyses[0];
  const previousAnalysis = geoAnalyses[1];
  const allListings = listingsResult.data || [];
  const verifiedSources = allListings.filter(l => l.status === "verified");
  const missingSources = allListings.filter(l => l.status !== "verified");
  const pages = pagesResult.data || [];
  const draftPages = pages.filter(p => p.status === "draft");
  const publishedPages = pages.filter(p => p.status === "published");

  const citationsThisWeek = site.citations_this_week || 0;
  const citationsLastWeek = site.citations_last_week || 0;
  const trend = citationsThisWeek > citationsLastWeek ? "IMPROVING" : citationsThisWeek < citationsLastWeek ? "DECLINING" : "STABLE";
  const trendDelta = citationsThisWeek - citationsLastWeek;

  // Score change over time
  const currentScore = (latestAnalysis?.score as { overall?: number } | null)?.overall ?? null;
  const previousScore = (previousAnalysis?.score as { overall?: number } | null)?.overall ?? null;
  const scoreChange = currentScore !== null && previousScore !== null ? currentScore - previousScore : null;

  // Count gaps from latest analysis
  const latestQueries = (latestAnalysis?.queries as Array<{ won: boolean; query: string }> | null) || [];
  const totalQueries = latestQueries.length;
  const wonQueries = latestQueries.filter(q => q.won);
  const lostQueries = latestQueries.filter(q => !q.won);

  const byPlatform: Record<string, number> = {};
  for (const c of recentCitations) {
    byPlatform[c.platform] = (byPlatform[c.platform] || 0) + 1;
  }

  const siteContextText = formatSiteContextForPrompt(site.domain, siteContext);

  const prompt = `Create a strategic weekly AI visibility action plan for ${site.domain}. Be extremely specific and data-driven.

SITE (actual content):
${siteContextText}

PERFORMANCE SNAPSHOT:
- GEO Score: ${currentScore !== null ? `${currentScore}/100` : "Not analyzed"}${scoreChange !== null ? ` (${scoreChange >= 0 ? "+" : ""}${scoreChange} from last scan)` : ""}
- Citations this week: ${citationsThisWeek} (${trend}: ${trendDelta >= 0 ? "+" : ""}${trendDelta} vs last week)
- Total lifetime citations: ${site.total_citations || 0}
- By platform: ${Object.entries(byPlatform).map(([p, n]) => `${p}: ${n}`).join(", ") || "None this week"}
- Queries checked: ${totalQueries} total, ${wonQueries.length} won, ${lostQueries.length} lost
- Trust sources: ${verifiedSources.length} verified (${verifiedSources.map(l => l.source_name).join(", ") || "none"}), ${missingSources.length} missing
- Fix pages: ${pages.length} total (${publishedPages.length} published, ${draftPages.length} draft)

QUERIES WON THIS SCAN:
${wonQueries.slice(0, 8).map(q => `  + "${q.query}"`).join("\n") || "None"}

QUERIES LOST (GAPS):
${lostQueries.slice(0, 8).map(q => `  - "${q.query}"`).join("\n") || "None"}

UNPUBLISHED DRAFT PAGES (user needs to publish these):
${draftPages.slice(0, 5).map(p => `  📄 "${p.query}" (created ${new Date(p.created_at).toLocaleDateString()})`).join("\n") || "None"}

GEO TIPS FROM LAST ANALYSIS: ${JSON.stringify(latestAnalysis?.tips || [])}

Create:
1. SUMMARY: One sharp sentence identifying the #1 priority, referencing specific data
2. PRIORITIES (3-5 items): Specific executable tasks ranked by impact/effort. Include expected outcome. If there are unpublished draft pages, publishing them should be a priority.
3. INSIGHTS (2-3): Patterns in the data, risks to watch, and opportunities

Return JSON:
{
  "summary": "Sharp strategic priority with specific data",
  "priorities": [{"title": "Specific task", "description": "Details with expected outcome and why it matters", "impact": "high|medium|low", "effort": "low|medium|high"}],
  "queriesWon": [{"query": "text", "platform": "platform"}],
  "queriesMissing": [{"query": "text", "platform": "platform"}],
  "insights": ["Data-driven insight referencing actual numbers"]
}`;

  const response = await askLLM(prompt, 8000);

  try {
    const parsed = JSON.parse(response);

    // Only fetch content recommendations if we have time budget remaining (avoid 120s timeout)
    const elapsedMs = Date.now() - startTime;
    let contentRecs: ContentRecommendation[] = [];
    if (elapsedMs < 50000) {
      try {
        contentRecs = await generateContentRecommendations(siteId, organizationId, 3);
      } catch {
        // Swallow — content recs are supplementary, don't fail the whole action plan
      }
    }

    return {
      weekOf: new Date().toISOString().split("T")[0],
      summary: parsed.summary || "Focus on creating content that earns AI citations.",
      priorities: parsed.priorities || [],
      queriesWon: parsed.queriesWon || wonQueries.slice(0, 5).map(q => ({ query: q.query, platform: "multi" })),
      queriesMissing: parsed.queriesMissing || lostQueries.slice(0, 5).map(q => ({ query: q.query, platform: "multi" })),
      contentToDo: contentRecs,
      insights: parsed.insights || [],
    };
  } catch {
    return {
      weekOf: new Date().toISOString().split("T")[0],
      summary: "Run more citation checks to generate your action plan.",
      priorities: [],
      queriesWon: [],
      queriesMissing: [],
      contentToDo: [],
      insights: [],
    };
  }
}

// ============================================
// EXPORTS
// ============================================

export type { GapAnalysisResult, ContentRecommendation, WeeklyActionPlan };

export const citationIntelligence = {
  analyzeCitationGap,
  generateContentRecommendations,
  generateWeeklyActionPlan,
};

export default citationIntelligence;
