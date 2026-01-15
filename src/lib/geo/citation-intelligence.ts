/**
 * AI Visibility Intelligence Service
 * 
 * The $100k features - turning monitoring into actionable intelligence:
 * 
 * 1. Citation Gap Analysis - "Why did AI cite competitor, not me?"
 * 2. Content Recommendations - "What to publish next to get cited"
 * 3. Weekly Action Plan - "Your AI Search To-Do List"
 * 4. Competitor Deep Dive - Full competitor comparison
 * 
 * Uses existing citation data + LLM to generate insights.
 * No new infrastructure needed - just smart prompts.
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface Citation {
  id: string;
  platform: string;
  query: string;
  snippet: string;
  page_url?: string;
  confidence: string;
  cited_at: string;
}

interface Competitor {
  id: string;
  domain: string;
  total_citations: number;
  citations_this_week: number;
}

interface GapAnalysisResult {
  query: string;
  aiAnswer: string;
  citedDomains: string[];
  yourDomain: string;
  wasYouCited: boolean;
  whyNotYou: string[];          // Bullet points explaining why
  missingElements: string[];     // What you're missing
  authorityGaps: string[];       // Authority signals competitors have
  contentGaps: string[];         // Content they have, you don't
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
  queriesLost: { query: string; competitor: string }[];
  contentToDo: ContentRecommendation[];
  competitorInsights: string[];
}

interface CompetitorDeepDive {
  competitor: string;
  totalCitations: number;
  citationsThisWeek: number;
  queriesWinning: string[];
  queriesLosingTo: string[];
  strengthsOverYou: string[];
  weaknessesVsYou: string[];
  contentTheyHave: string[];
  opportunitiesForYou: string[];
}

// ============================================
// LLM HELPER
// ============================================

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
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an AI Search Optimization expert. You analyze why AI platforms (ChatGPT, Perplexity, Google AI) cite certain websites and not others. You provide specific, actionable recommendations. Always respond in valid JSON format when asked.`,
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "";
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
    .select("domain, topics")
    .eq("id", siteId)
    .single();

  if (!site) throw new Error("Site not found");

  // Get citations for this query
  const { data: citations } = await supabase
    .from("citations")
    .select("*")
    .eq("site_id", siteId)
    .eq("query", query);

  // Get competitor citations for this query
  const { data: competitors } = await supabase
    .from("competitors")
    .select("domain")
    .eq("site_id", siteId);

  const citedDomains = citations?.map(c => c.page_url?.replace(/https?:\/\//, "").split("/")[0]) || [];
  const wasYouCited = citedDomains.some(d => d?.includes(site.domain));

  // Build the prompt
  const prompt = `Analyze this AI search scenario and explain why certain sites were cited.

QUERY: "${query}"

SITES THAT WERE CITED: ${citedDomains.length > 0 ? citedDomains.join(", ") : "Unknown (need to check)"}

USER'S SITE: ${site.domain}
USER'S TOPICS: ${(site.topics || []).join(", ") || "Not specified"}

WAS USER CITED: ${wasYouCited ? "Yes" : "No"}

${citations?.length ? `CITATION SNIPPETS:\n${citations.map(c => `- ${c.platform}: "${c.snippet}"`).join("\n")}` : "No citation data available yet."}

Analyze why the AI ${wasYouCited ? "did" : "did NOT"} cite ${site.domain} for this query.

Respond in this exact JSON format:
{
  "whyNotYou": ["Reason 1", "Reason 2", "Reason 3"],
  "missingElements": ["Missing element 1", "Missing element 2"],
  "authorityGaps": ["Authority signal competitors have"],
  "contentGaps": ["Content competitors have that you don't"],
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
    // Fallback if JSON parsing fails
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
    .select("domain, topics")
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

  // Get competitor info
  const { data: competitors } = await supabase
    .from("competitors")
    .select("domain, total_citations")
    .eq("site_id", siteId);

  const prompt = `Based on AI citation data, recommend content this site should create to get more AI citations.

SITE: ${site.domain}
TOPICS: ${(site.topics || []).join(", ") || "General"}

RECENT QUERIES WHERE THIS SITE WAS MENTIONED:
${citations?.slice(0, 20).map(c => `- "${c.query}" (${c.platform}, ${c.confidence} confidence)`).join("\n") || "No citations yet"}

COMPETITORS BEING CITED:
${competitors?.map(c => `- ${c.domain} (${c.total_citations} citations)`).join("\n") || "No competitor data"}

Generate ${limit} content recommendations that would help this site get cited more by AI platforms.

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

  // Get competitors
  const { data: competitors } = await supabase
    .from("competitors")
    .select("*")
    .eq("site_id", siteId);

  // Get GEO analysis
  const { data: geoAnalysis } = await supabase
    .from("geo_analyses")
    .select("score, tips, queries")
    .eq("site_id", siteId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const prompt = `Create a weekly AI search action plan for this site.

SITE: ${site.domain}
GEO SCORE: ${geoAnalysis?.score || "Not analyzed yet"}
CITATIONS THIS WEEK: ${site.citations_this_week || 0}
CITATIONS LAST WEEK: ${site.citations_last_week || 0}
TOTAL CITATIONS: ${site.total_citations || 0}

THIS WEEK'S CITATIONS:
${recentCitations?.map(c => `- "${c.query}" on ${c.platform}`).join("\n") || "No new citations"}

COMPETITORS:
${competitors?.map(c => `- ${c.domain}: ${c.total_citations} total, ${c.citations_this_week} this week`).join("\n") || "No competitors tracked"}

GEO TIPS:
${JSON.stringify(geoAnalysis?.tips || [])}

Create a prioritized action plan for next week.

Respond in this exact JSON format:
{
  "summary": "One sentence summary of the week and what to focus on",
  "priorities": [
    {
      "title": "Priority title",
      "description": "What to do and why",
      "impact": "high" | "medium" | "low",
      "effort": "low" | "medium" | "high"
    }
  ],
  "queriesWon": [{"query": "query text", "platform": "perplexity"}],
  "queriesLost": [{"query": "query text", "competitor": "competitor.com"}],
  "competitorInsights": ["Insight about competitors"]
}`;

  const response = await askLLM(prompt);
  
  try {
    const parsed = JSON.parse(response);
    
    // Generate content recommendations too
    const contentRecs = await generateContentRecommendations(siteId, organizationId, 3);
    
    return {
      weekOf: new Date().toISOString().split("T")[0],
      summary: parsed.summary || "Analyze your citations and competitors to find opportunities.",
      priorities: parsed.priorities || [],
      queriesWon: parsed.queriesWon || [],
      queriesLost: parsed.queriesLost || [],
      contentToDo: contentRecs,
      competitorInsights: parsed.competitorInsights || [],
    };
  } catch {
    return {
      weekOf: new Date().toISOString().split("T")[0],
      summary: "Run more citation checks to generate your action plan.",
      priorities: [],
      queriesWon: [],
      queriesLost: [],
      contentToDo: [],
      competitorInsights: [],
    };
  }
}

// ============================================
// 4. COMPETITOR DEEP DIVE
// ============================================

export async function analyzeCompetitorDeepDive(
  siteId: string,
  competitorId: string,
  organizationId: string
): Promise<CompetitorDeepDive> {
  const supabase = createClient(supabaseUrl, serviceKey);

  // Get site info
  const { data: site } = await supabase
    .from("sites")
    .select("*")
    .eq("id", siteId)
    .single();

  if (!site) throw new Error("Site not found");

  // Get competitor info
  const { data: competitor } = await supabase
    .from("competitors")
    .select("*")
    .eq("id", competitorId)
    .single();

  if (!competitor) throw new Error("Competitor not found");

  // Get your citations
  const { data: yourCitations } = await supabase
    .from("citations")
    .select("query, platform, confidence")
    .eq("site_id", siteId);

  const prompt = `Analyze this competitor vs the user's site for AI search visibility.

USER'S SITE: ${site.domain}
USER'S TOTAL CITATIONS: ${site.total_citations || 0}
USER'S QUERIES CITED FOR:
${yourCitations?.map(c => `- "${c.query}"`).join("\n") || "No citations yet"}

COMPETITOR: ${competitor.domain}
COMPETITOR TOTAL CITATIONS: ${competitor.total_citations || 0}
COMPETITOR CITATIONS THIS WEEK: ${competitor.citations_this_week || 0}

Analyze why this competitor might be getting more/less AI citations and what the user can learn.

Respond in this exact JSON format:
{
  "queriesWinning": ["Queries competitor is likely winning"],
  "queriesLosingTo": ["Queries user is winning"],
  "strengthsOverYou": ["What competitor does better"],
  "weaknessesVsYou": ["What user does better"],
  "contentTheyHave": ["Types of content competitor has"],
  "opportunitiesForYou": ["Specific opportunities to beat them"]
}`;

  const response = await askLLM(prompt);
  
  try {
    const parsed = JSON.parse(response);
    return {
      competitor: competitor.domain,
      totalCitations: competitor.total_citations || 0,
      citationsThisWeek: competitor.citations_this_week || 0,
      queriesWinning: parsed.queriesWinning || [],
      queriesLosingTo: parsed.queriesLosingTo || [],
      strengthsOverYou: parsed.strengthsOverYou || [],
      weaknessesVsYou: parsed.weaknessesVsYou || [],
      contentTheyHave: parsed.contentTheyHave || [],
      opportunitiesForYou: parsed.opportunitiesForYou || [],
    };
  } catch {
    return {
      competitor: competitor.domain,
      totalCitations: competitor.total_citations || 0,
      citationsThisWeek: competitor.citations_this_week || 0,
      queriesWinning: [],
      queriesLosingTo: [],
      strengthsOverYou: [],
      weaknessesVsYou: [],
      contentTheyHave: [],
      opportunitiesForYou: ["Track more data to generate insights"],
    };
  }
}

// ============================================
// EXPORTS
// ============================================

export const citationIntelligence = {
  analyzeCitationGap,
  generateContentRecommendations,
  generateWeeklyActionPlan,
  analyzeCompetitorDeepDive,
};

export default citationIntelligence;

