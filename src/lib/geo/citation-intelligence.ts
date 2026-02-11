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
          content: `You are an AI Search Optimization expert. You analyze why AI platforms (ChatGPT, Perplexity, Google AI) cite certain websites and help sites become more citable. You provide specific, actionable recommendations focused on what the site can do to improve. Always respond in valid JSON format when asked.`,
        },
        { role: "user", content: prompt },
      ],
      max_completion_tokens: 16000,
      reasoning: { effort: "medium" },
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

  const prompt = `Analyze this AI search query and explain what ${site.domain} needs to do to get cited.

QUERY: "${query}"

SITES THAT WERE CITED: ${citedDomains.length > 0 ? citedDomains.join(", ") : "Unknown (need to check)"}

USER'S SITE: ${site.domain}
USER'S TOPICS: ${(site.main_topics || []).join(", ") || "Not specified"}

WAS USER CITED: ${wasYouCited ? "Yes" : "No"}

${citations?.length ? `CITATION SNIPPETS:\n${citations.map(c => `- ${c.platform}: "${c.snippet}"`).join("\n")}` : "No citation data available yet."}

Analyze what ${site.domain} needs to improve to ${wasYouCited ? "maintain and strengthen their" : "earn"} citations for this query. Focus on what THEY can do — content to create, authority signals to build, structural improvements to make.

Respond in this exact JSON format:
{
  "whyNotYou": ["Reason 1 why you're not being cited", "Reason 2", "Reason 3"],
  "missingElements": ["Content element you're missing", "Another missing element"],
  "authorityGaps": ["Authority signal you need to build"],
  "contentGaps": ["Content you should create to get cited"],
  "actionItems": ["Specific action 1", "Specific action 2", "Specific action 3"],
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

  const prompt = `Based on AI citation data, recommend content this site should create to get more AI citations.

SITE: ${site.domain}
TOPICS: ${(site.main_topics || []).join(", ") || "General"}

TRUST SOURCES VERIFIED: ${verifiedSources.length > 0 ? verifiedSources.join(", ") : "None yet"}

RECENT QUERIES WHERE THIS SITE WAS MENTIONED:
${citations?.slice(0, 20).map(c => `- "${c.query}" (${c.platform}, ${c.confidence} confidence)`).join("\n") || "No citations yet"}

QUERIES WHERE THIS SITE WAS NOT CITED (from recent checks):
${citations?.filter(c => c.confidence === "low").slice(0, 10).map(c => `- "${c.query}"`).join("\n") || "No low-confidence citations"}

Generate ${limit} content recommendations that would help this site become more citable by AI platforms. Focus on:
- Content that directly answers queries AI gets asked
- Structured, authoritative pages with clear expertise signals
- FAQ content, comparison pages, and "best of" guides
- Content that builds topical authority in their niche

Respond in this exact JSON format:
{
  "recommendations": [
    {
      "title": "Article/Page Title",
      "description": "Brief description of what to create",
      "targetQueries": ["query 1", "query 2"],
      "entities": ["entity 1", "entity 2"],
      "suggestedHeadings": ["H2 heading 1", "H2 heading 2"],
      "faqQuestions": ["FAQ question 1?", "FAQ question 2?"],
      "priority": "high" | "medium" | "low",
      "rationale": "Why this will help get citations"
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

  const prompt = `Create a weekly AI search action plan for this site.

SITE: ${site.domain}
GEO SCORE: ${geoAnalysis?.score || "Not analyzed yet"}
CITATIONS THIS WEEK: ${site.citations_this_week || 0}
CITATIONS LAST WEEK: ${site.citations_last_week || 0}
TOTAL CITATIONS: ${site.total_citations || 0}
TRUST SOURCES VERIFIED: ${verifiedSources.length > 0 ? verifiedSources.join(", ") : "None yet"}

THIS WEEK'S CITATIONS:
${recentCitations?.map(c => `- "${c.query}" on ${c.platform}`).join("\n") || "No new citations"}

GEO TIPS:
${JSON.stringify(geoAnalysis?.tips || [])}

Create a prioritized action plan for next week focused entirely on improving this site's AI visibility. Focus on:
- Content they should create or improve
- Authority signals they should build
- Technical improvements for AI readability
- Trust source listings they should pursue

Respond in this exact JSON format:
{
  "summary": "One sentence summary of what to focus on this week",
  "priorities": [
    {
      "title": "Priority title",
      "description": "What to do and why",
      "impact": "high" | "medium" | "low",
      "effort": "low" | "medium" | "high"
    }
  ],
  "queriesWon": [{"query": "query text", "platform": "perplexity"}],
  "queriesMissing": [{"query": "query text", "platform": "chatgpt"}],
  "insights": ["Insight about your AI visibility trends"]
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
