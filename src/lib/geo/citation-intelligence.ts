/**
 * AI Visibility Intelligence Service
 *
 * Turns monitoring into actionable intelligence:
 *
 * 1. Citation Gap Analysis - "Why isn't AI citing me for this query?"
 * 2. Content Recommendations - "What to publish next to get cited"
 * 3. Weekly Action Plan - "Your AI Search To-Do List"
 *
 * Uses existing citation data + LLM to generate self-focused insights.
 * All analysis is about improving YOUR visibility, not tracking competitors.
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface GapAnalysisResult {
  query: string;
  aiAnswer: string;
  citedDomains: string[];
  yourDomain: string;
  wasYouCited: boolean;
  whyNotYou: string[];          // Bullet points explaining why
  missingElements: string[];     // What you're missing
  authorityGaps: string[];       // Authority signals you need
  contentGaps: string[];         // Content you should create
  actionItems: string[];         // What to do
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
// LLM HELPER
// ============================================

const GEO_EXPERT_SYSTEM_PROMPT = `You are a world-class Generative Engine Optimization (GEO) analyst. You have deep expertise in how AI platforms (ChatGPT, Perplexity, Google AI Overview) decide which websites to cite, quote, and recommend.

YOUR KNOWLEDGE BASE:

HOW AI CITATION WORKS:
- AI platforms use retrieval-augmented generation (RAG) to find and cite sources. They rank sources by relevance, authority, freshness, and structural clarity.
- ChatGPT uses Bing search index + its own training data. It prefers comprehensive, well-structured pages with clear H2/H3 hierarchy and direct answers in the first paragraph.
- Perplexity runs real-time web searches and assembles answers from multiple sources. It prefers pages with specific facts, inline statistics, and clear attribution. It heavily weights recency.
- Google AI Overview uses Google's search index and knowledge graph. It heavily weights traditional SEO signals (E-E-A-T, backlinks, domain authority) plus Schema.org markup.

THE 8 FACTORS THAT DETERMINE IF AI CITES YOU:
1. **Direct answer positioning** — First 1-2 sentences must directly answer the query. AI models extract the opening as their answer.
2. **Quotable specificity** — AI cites sentences with specific numbers, dates, named entities, and concrete claims. Generic statements are never cited.
3. **Source authority** — Sites with verified profiles on G2, Capterra, Product Hunt, Trustpilot, etc. are trusted more. Third-party review presence is a strong signal.
4. **Content structure** — Clear heading hierarchy, FAQ sections, comparison tables, and schema markup make content parseable by AI.
5. **Topical authority** — Sites that cover a topic comprehensively across multiple pages (topic clusters) are cited more than one-off pages.
6. **Freshness** — Content mentioning current year, recent data, or recent events is prioritized. "As of 2026" is a strong freshness signal.
7. **Entity density** — Mentioning specific companies, products, standards, certifications, and people throughout content signals expertise.
8. **Third-party citations** — Content that references real studies, reports, and data sources is treated as more credible and cited more frequently.

WHAT MAKES A RECOMMENDATION ACTIONABLE:
- Specify exactly WHAT content to create (title, structure, key points to cover)
- Specify WHERE it should live (new page, existing page addition, FAQ, etc.)
- Specify WHY it will work (which AI citation factor it addresses)
- Estimate the expected IMPACT (which queries it could win citations for)
- Give PRIORITY based on effort vs. impact ratio

Always respond in valid JSON format when asked. Be specific, never generic. Every recommendation should be something the user can act on today.`;

function extractJSON(text: string): string {
  // Strip markdown code fences if present
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (fenceMatch) return fenceMatch[1].trim();
  return text.trim();
}

async function askLLM(prompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OpenAI API key not configured");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-5.2",
      messages: [
        {
          role: "system",
          content: GEO_EXPERT_SYSTEM_PROMPT,
        },
        { role: "user", content: prompt },
      ],
      max_completion_tokens: 16000,
      reasoning: { effort: "high" },
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const rawContent = data.choices[0]?.message?.content || "";
  return extractJSON(rawContent);
}

// ============================================
// 1. CITATION GAP ANALYSIS
// ============================================

export async function analyzeCitationGap(
  siteId: string,
  query: string,
  organizationId: string
): Promise<GapAnalysisResult> {
  const supabase = createClient(supabaseUrl, serviceKey);

  // Get the site info
  const { data: site } = await supabase
    .from("sites")
    .select("domain, main_topics")
    .eq("id", siteId)
    .single();

  if (!site) throw new Error("Site not found");

  // Get citations for this query
  const { data: citations } = await supabase
    .from("citations")
    .select("*")
    .eq("site_id", siteId)
    .eq("query", query);

  const citedDomains = (citations?.map(c => c.source_domain || c.snippet?.match(/https?:\/\/([^/\s]+)/)?.[1])?.filter(Boolean) as string[]) || [];
  const wasYouCited = citedDomains.some(d => d?.includes(site.domain));

  const prompt = `Perform a deep citation gap analysis for this query. Explain exactly why ${site.domain} ${wasYouCited ? "is or isn't consistently cited" : "is NOT being cited"} and provide a specific, actionable remediation plan.

QUERY: "${query}"
QUERY INTENT: What would a user asking this actually want to know? Think about this first.

USER'S SITE: ${site.domain}
USER'S TOPICS: ${(site.main_topics || []).join(", ") || "Not specified"}
WAS USER CITED: ${wasYouCited ? "Yes" : "No"}

SITES THAT WERE CITED INSTEAD: ${citedDomains.length > 0 ? citedDomains.join(", ") : "Unknown — analyze what type of sites would typically be cited for this query"}

${citations?.length ? `ACTUAL AI RESPONSES (what the AI platform said):\n${citations.map(c => `- ${c.platform}: "${c.snippet}"`).join("\n")}` : "No citation data available yet."}

ANALYSIS INSTRUCTIONS:
1. First, analyze the QUERY INTENT — what does the user really want? What kind of source would best answer this?
2. Then analyze WHY the cited sites were chosen — what do they have that ${site.domain} doesn't? Be specific (e.g., "G2 has 500+ verified reviews for this category" not just "they have more authority").
3. Identify the SPECIFIC content, authority, and structural gaps — not generic advice.
4. Create ACTION ITEMS that are immediately executable. Each action should be a single, concrete step (e.g., "Create a page titled 'Best [Category] Tools in 2026' with a comparison table covering pricing, features, and integration options for the top 8 tools" — NOT "create comparison content").

Respond in this exact JSON format:
{
  "whyNotYou": ["Specific reason 1 — explain the exact gap with evidence from the citation data", "Specific reason 2", "Specific reason 3"],
  "missingElements": ["Specific content element missing — e.g., 'No pricing comparison table for top alternatives'", "Another specific missing element"],
  "authorityGaps": ["Specific authority signal needed — e.g., 'No G2 profile with verified reviews in this category'"],
  "contentGaps": ["Specific content to create with title and structure — e.g., 'Create FAQ page: Top 10 questions about [topic] with data-backed answers'"],
  "actionItems": ["Concrete action with specific deliverable and expected impact", "Another concrete action", "Third concrete action"],
  "confidence": "high" | "medium" | "low"
}`;

  const response = await askLLM(prompt);

  try {
    const parsed = JSON.parse(response);
    return {
      query,
      aiAnswer: citations?.[0]?.snippet || "",
      citedDomains,
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
      aiAnswer: citations?.[0]?.snippet || "",
      citedDomains,
      yourDomain: site.domain,
      wasYouCited,
      whyNotYou: ["Analysis in progress - check back soon"],
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
// ============================================

export async function generateContentRecommendations(
  siteId: string,
  organizationId: string,
  limit: number = 5
): Promise<ContentRecommendation[]> {
  const supabase = createClient(supabaseUrl, serviceKey);

  // Get site info
  const { data: site } = await supabase
    .from("sites")
    .select("domain, main_topics")
    .eq("id", siteId)
    .single();

  if (!site) throw new Error("Site not found");

  // Get recent citations
  const { data: citations } = await supabase
    .from("citations")
    .select("query, snippet, platform, confidence")
    .eq("site_id", siteId)
    .order("cited_at", { ascending: false })
    .limit(50);

  // Get source listings for context
  const { data: listings } = await supabase
    .from("source_listings")
    .select("source_domain, status")
    .eq("site_id", siteId);

  const verifiedSources = (listings || []).filter(l => l.status === "verified").map(l => l.source_domain);

  // Separate high-confidence citations (wins) from low-confidence (gaps)
  const wins = (citations || []).filter(c => c.confidence === "high" || c.confidence === "medium");
  const gaps = (citations || []).filter(c => c.confidence === "low" || c.confidence === "none");

  const prompt = `Analyze this site's citation data and generate ${limit} high-impact content recommendations. Each recommendation should target specific queries where AI platforms currently DON'T cite this site.

SITE: ${site.domain}
TOPICS: ${(site.main_topics || []).join(", ") || "General"}
TRUST SOURCES VERIFIED: ${verifiedSources.length > 0 ? verifiedSources.join(", ") : "None yet"}

QUERIES WHERE THIS SITE IS ALREADY CITED (build on this authority):
${wins.slice(0, 15).map(c => `  ✓ "${c.query}" on ${c.platform}`).join("\n") || "No confirmed citations yet — all content is foundational"}

QUERIES WHERE THIS SITE IS NOT CITED (the gaps to close):
${gaps.slice(0, 15).map(c => `  ✗ "${c.query}" on ${c.platform}`).join("\n") || "No gap data yet — recommend foundational content"}

CONTENT STRATEGY FRAMEWORK:
For each recommendation, think through:
1. WHICH queries will this content win? Be specific — map each recommendation to 2-4 real queries AI platforms get asked.
2. WHY will AI cite this content? Reference specific citation factors: direct-answer positioning, comparison tables, FAQ extraction, entity density, freshness signals.
3. WHAT structure should the content have? Specify the exact heading structure, whether it needs tables, FAQs, step-by-step sections, etc.
4. HOW does this build topical authority? Explain how this piece fits into the site's content cluster.

QUALITY STANDARDS:
- Every recommendation should be genuinely useful content, not thin SEO bait
- Titles should be specific and query-targeted (e.g., "Best Project Management Tools for Remote Teams in 2026: Complete Comparison" — NOT "Project Management Guide")
- Each recommendation should address a DIFFERENT cluster of queries — no overlap
- Prioritize by impact: which content would win the most valuable citations?

Respond in this exact JSON format:
{
  "recommendations": [
    {
      "title": "Specific, query-targeted page title",
      "description": "What this page covers and what makes it the best resource on the internet for this topic",
      "targetQueries": ["specific query 1 that AI platforms receive", "specific query 2", "specific query 3"],
      "entities": ["specific entity to mention", "another entity"],
      "suggestedHeadings": ["## Specific H2 heading", "## Another H2", "### Relevant H3"],
      "faqQuestions": ["Specific question users actually ask?", "Another real question?", "Third question?"],
      "priority": "high" | "medium" | "low",
      "rationale": "Exactly which citation factor this addresses and why it will win citations for the target queries"
    }
  ]
}`;

  const response = await askLLM(prompt);

  try {
    const parsed = JSON.parse(response);
    return parsed.recommendations || [];
  } catch {
    return [];
  }
}

// ============================================
// 3. WEEKLY ACTION PLAN
// ============================================

export async function generateWeeklyActionPlan(
  siteId: string,
  organizationId: string
): Promise<WeeklyActionPlan> {
  const supabase = createClient(supabaseUrl, serviceKey);

  // Get site info
  const { data: site } = await supabase
    .from("sites")
    .select("*")
    .eq("id", siteId)
    .single();

  if (!site) throw new Error("Site not found");

  // Get this week's citations
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const { data: recentCitations } = await supabase
    .from("citations")
    .select("*")
    .eq("site_id", siteId)
    .gte("cited_at", weekAgo.toISOString())
    .order("cited_at", { ascending: false });

  // Get GEO analysis
  const { data: geoAnalysis } = await supabase
    .from("geo_analyses")
    .select("score, tips, queries")
    .eq("site_id", siteId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // Get source listings
  const { data: listings } = await supabase
    .from("source_listings")
    .select("source_domain, status")
    .eq("site_id", siteId);

  const verifiedSources = (listings || []).filter(l => l.status === "verified").map(l => l.source_domain);

  // Calculate citation trend
  const citationsThisWeek = site.citations_this_week || 0;
  const citationsLastWeek = site.citations_last_week || 0;
  const trend = citationsThisWeek > citationsLastWeek ? "IMPROVING" : citationsThisWeek < citationsLastWeek ? "DECLINING" : "STABLE";
  const trendDelta = citationsThisWeek - citationsLastWeek;

  // Categorize recent citations by platform
  const byPlatform: Record<string, number> = {};
  for (const c of recentCitations || []) {
    byPlatform[c.platform] = (byPlatform[c.platform] || 0) + 1;
  }

  const prompt = `Create a strategic weekly AI visibility action plan for ${site.domain}. This should be a consultant-grade analysis that a marketing director would act on immediately.

PERFORMANCE SNAPSHOT:
- Site: ${site.domain}
- GEO Score: ${geoAnalysis?.score || "Not analyzed yet"} / 100
- Citations this week: ${citationsThisWeek} (${trend}: ${trendDelta >= 0 ? "+" : ""}${trendDelta} vs last week)
- Total lifetime citations: ${site.total_citations || 0}
- Citations by platform: ${Object.entries(byPlatform).map(([p, n]) => `${p}: ${n}`).join(", ") || "None this week"}
- Trust sources verified: ${verifiedSources.length > 0 ? verifiedSources.join(", ") : "None yet"}

THIS WEEK'S CITATIONS (what AI platforms are citing you for):
${recentCitations?.map(c => `- "${c.query}" on ${c.platform}`).join("\n") || "No new citations this week — this is the core problem to solve"}

GEO ANALYSIS TIPS:
${JSON.stringify(geoAnalysis?.tips || [])}

ACTION PLAN REQUIREMENTS:
1. SUMMARY: One powerful sentence that identifies the #1 priority for this week based on the data above. Not generic — reference specific numbers or trends.
2. PRIORITIES (3-5 items, ranked by impact/effort ratio):
   - Each priority must be a SPECIFIC, EXECUTABLE task — not "improve content" but "Create a comparison page titled '[specific title]' targeting [specific queries]"
   - Include estimated time and expected outcome for each
   - Tag each with impact (high/medium/low) and effort (low/medium/high)
   - Focus on quick wins first (high impact + low effort)
3. QUERIES WON: List queries where you gained or maintained citations this week
4. QUERIES MISSING: List queries where you're still invisible — these are your targets
5. INSIGHTS (2-3 strategic observations):
   - Identify patterns in the data (e.g., "You're being cited on Perplexity but not ChatGPT — this suggests...")
   - Highlight risks (e.g., "Your citation count dropped by 3 this week — likely due to...")
   - Spot opportunities (e.g., "You're cited for 'best X' queries — create more comparison content to compound this")

Respond in this exact JSON format:
{
  "summary": "Strategic one-sentence priority for this week, referencing specific data",
  "priorities": [
    {
      "title": "Specific, actionable priority title",
      "description": "Exactly what to do, why it matters based on the data, and what the expected outcome is",
      "impact": "high" | "medium" | "low",
      "effort": "low" | "medium" | "high"
    }
  ],
  "queriesWon": [{"query": "query text", "platform": "perplexity"}],
  "queriesMissing": [{"query": "query text", "platform": "chatgpt"}],
  "insights": ["Data-driven insight about AI visibility trends with specific numbers"]
}`;

  const response = await askLLM(prompt);

  try {
    const parsed = JSON.parse(response);

    // Generate content recommendations too
    const contentRecs = await generateContentRecommendations(siteId, organizationId, 3);

    return {
      weekOf: new Date().toISOString().split("T")[0],
      summary: parsed.summary || "Focus on creating content that makes your site more citable by AI.",
      priorities: parsed.priorities || [],
      queriesWon: parsed.queriesWon || [],
      queriesMissing: parsed.queriesMissing || [],
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
