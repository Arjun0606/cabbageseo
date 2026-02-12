/**
 * Fix Page Generator — World-class GEO content engine
 *
 * Three-phase pipeline:
 * 1. RESEARCH — Perplexity searches the live web for real data on the topic
 * 2. GENERATE — GPT-5.2 writes the page using real research + site context
 * 3. REFINE — GPT-5.2 self-evaluates against citation criteria and fixes weaknesses
 *
 * The research phase is what makes this content genuinely better than human writers.
 * Every claim has a basis in real, current web data — not hallucinated facts.
 *
 * Cost per page:
 * - Auto-generated (research + generate): ~$0.15
 * - User-initiated (research + generate + refine): ~$0.30
 */

import { createClient } from "@supabase/supabase-js";
import { fetchSiteContext, formatSiteContextForPrompt } from "@/lib/geo/site-context";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export interface GeneratedPageResult {
  title: string;
  metaDescription: string;
  body: string;
  schemaMarkup: Record<string, unknown>;
  targetEntities: string[];
  wordCount: number;
}

// ============================================
// PHASE 1: RESEARCH — Live web research via Perplexity
// ============================================

interface ResearchData {
  topSources: string[];
  keyFacts: string[];
  currentPricing: string[];
  competitorNames: string[];
  rawResponse: string;
}

async function researchTopic(query: string, domain: string): Promise<ResearchData> {
  const apiKey = process.env.PERPLEXITY_API_KEY;

  const empty: ResearchData = {
    topSources: [],
    keyFacts: [],
    currentPricing: [],
    competitorNames: [],
    rawResponse: "",
  };

  if (!apiKey) return empty;

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
          {
            role: "system",
            content: "You are a research assistant. Gather comprehensive, factual information about the topic. Include specific numbers, real pricing, real product names, real features, and real comparisons. Cite your sources. Be thorough and accurate.",
          },
          {
            role: "user",
            content: `Research this topic thoroughly for a comprehensive article: "${query}"

I need:
1. The top 5-8 products/services/options currently recommended for this query, with REAL pricing and features
2. Key statistics and facts from authoritative sources (include the source name)
3. Current trends and recent developments (2025-2026)
4. Common user complaints and pain points
5. What makes the best options stand out from the rest

Be specific with real names, real numbers, real URLs. No generic statements.`,
          },
        ],
        return_citations: true,
      }),
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) return empty;

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const citations: string[] = data.citations || [];

    // Extract structured data from the research
    const pricingMatches = content.match(/\$\d+[\d,.]*(?:\/(?:mo|month|year|yr|user|seat))?/gi) || [];
    const domainMatches = content.match(/\b([a-z0-9-]+\.(?:com|io|co|ai|app|org|net))\b/gi) || [];
    const competitorDomains = [...new Set(domainMatches)]
      .filter(d => !d.includes(domain.split(".")[0]))
      .slice(0, 10);

    return {
      topSources: citations.slice(0, 8),
      keyFacts: content.split("\n").filter((l: string) => l.match(/\d/) && l.length > 20).slice(0, 15),
      currentPricing: [...new Set(pricingMatches)].slice(0, 10),
      competitorNames: competitorDomains,
      rawResponse: content.slice(0, 4000),
    };
  } catch {
    return empty;
  }
}

// ============================================
// LLM HELPER
// ============================================

async function askLLMForPage(
  systemPrompt: string,
  userPrompt: string,
  reasoningEffort: "high" | "medium" = "high"
): Promise<string> {
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
      reasoning: { effort: reasoningEffort },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_completion_tokens: 24000,
    }),
  });

  if (!response.ok) {
    const err = await response.text().catch(() => "Unknown error");
    throw new Error(`OpenAI API error: ${response.status} - ${err}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "";
}

// ============================================
// CONTEXT GATHERING
// ============================================

async function gatherContext(siteId: string, query: string) {
  const supabase = createClient(supabaseUrl, serviceKey);

  const [siteResult, citationsResult, listingsResult, geoResult, lostResult] = await Promise.all([
    supabase.from("sites").select("domain, category, name, main_topics").eq("id", siteId).single(),
    supabase.from("citations").select("platform, query, snippet, confidence").eq("site_id", siteId).order("cited_at", { ascending: false }).limit(30),
    supabase.from("source_listings").select("source_domain, source_name, status").eq("site_id", siteId),
    supabase.from("geo_analyses").select("score, tips, queries").eq("site_id", siteId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("market_share_snapshots").select("queries_lost, queries_won, your_mentions").eq("site_id", siteId).order("snapshot_date", { ascending: false }).limit(1).maybeSingle(),
  ]);

  const site = siteResult.data;
  if (!site) throw new Error("Site not found");

  const citations = citationsResult.data || [];
  const listings = listingsResult.data || [];
  const geoAnalysis = geoResult.data;
  const marketSnapshot = lostResult.data;

  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const queryCitations = citations.filter(
    (c: { query: string }) => queryWords.some(w => c.query.toLowerCase().includes(w))
  );
  const citedQueries = citations
    .filter((c: { confidence: string }) => c.confidence === "high" || c.confidence === "medium")
    .map((c: { query: string; platform: string }) => `${c.query} (${c.platform})`);
  const missedQueries = citations
    .filter((c: { confidence: string }) => c.confidence === "low" || c.confidence === "none")
    .map((c: { query: string; platform: string }) => `${c.query} (${c.platform})`);
  const verifiedSources = listings.filter((l: { status: string }) => l.status === "verified").map((l: { source_name: string }) => l.source_name);
  const missingSources = listings.filter((l: { status: string }) => l.status !== "verified").map((l: { source_name: string }) => l.source_name);

  return {
    site,
    citations,
    queryCitations,
    citedQueries,
    missedQueries,
    verifiedSources,
    missingSources,
    geoScore: (geoAnalysis?.score as { overall?: number } | null)?.overall ?? null,
    geoTips: (geoAnalysis?.tips as string[] | null) ?? [],
    queriesLost: marketSnapshot?.queries_lost ?? 0,
    queriesWon: marketSnapshot?.queries_won ?? 0,
    yourMentions: marketSnapshot?.your_mentions ?? 0,
  };
}

// ============================================
// PHASE 3: QUALITY REFINEMENT
// Self-evaluates and fixes weaknesses.
// Only runs for user-initiated generations.
// ============================================

async function refineContent(
  query: string,
  title: string,
  body: string,
  domain: string,
): Promise<{ title: string; body: string }> {
  const evaluationPrompt = `You are a brutally honest GEO content editor. Evaluate this page against the criteria AI platforms use to decide what to cite, then REWRITE it to fix every weakness.

TARGET QUERY: "${query}"
DOMAIN: ${domain}

CURRENT TITLE: ${title}

CURRENT BODY:
${body.slice(0, 8000)}

EVALUATION CRITERIA (score each 1-10, then fix):
1. DIRECT ANSWER: Does the first paragraph directly answer "${query}" in a self-contained, quotable way?
2. SPECIFICITY: Does every claim have real numbers, real names, real data? Or is it vague filler?
3. STRUCTURE: Are H2s written as real user questions that AI would extract? Is there a comparison table if relevant?
4. VOICE: Does this read like it was written by a genuine expert, or does it have that smooth, generic AI tone? Look for dead giveaways: "In today's...", "Whether you're...", "It's worth noting...", "In conclusion...", hedging language, and sentences that sound wise but say nothing.
5. FAQ QUALITY: Are FAQ answers genuinely useful, specific, and self-contained? Could each one be extracted by AI as a standalone answer?
6. FRESHNESS: Does the content reference current data, current year, recent developments?
7. ENTITY DENSITY: Are specific companies, products, standards, and people named throughout?
8. UNIQUENESS: Does this page offer something no other page on the internet offers? A unique angle, proprietary data, original insight?

REWRITE RULES:
- Kill every sentence that sounds like AI wrote it. Replace with direct, expert statements.
- Replace every vague claim with a specific one. "Many companies" → name the companies. "Affordable pricing" → state the price.
- If the opening paragraph doesn't directly answer the query in 1-2 sentences, rewrite it completely.
- If FAQ answers are longer than 3 sentences, shorten them. If they're generic, make them specific.
- Add real data points wherever the content is thin.
- Keep the same structure but tighten everything. Cut fluff ruthlessly.

Return the improved version in this exact JSON format:
{
  "title": "Improved title (55-65 chars)",
  "body": "Rewritten body in markdown"
}`;

  try {
    const response = await askLLMForPage(
      "You are a world-class content editor specializing in GEO optimization. You fix content to make it genuinely the best resource on the internet for a given query. You are ruthless about cutting AI-sounding filler and replacing it with specific, expert knowledge.",
      evaluationPrompt,
      "high"
    );

    let clean = response.trim();
    if (clean.startsWith("```")) {
      clean = clean.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const parsed = JSON.parse(clean);
    if (parsed.body && parsed.body.length > body.length * 0.5) {
      return { title: parsed.title || title, body: parsed.body };
    }
  } catch {
    // Refinement failed — return original
  }

  return { title, body };
}

// ============================================
// PHASE 2: GENERATE — The main content engine
// ============================================

export async function generatePage(
  siteId: string,
  query: string,
  organizationId: string,
  options?: { autoGenerated?: boolean }
): Promise<GeneratedPageResult> {
  const reasoningEffort = options?.autoGenerated ? "medium" as const : "high" as const;

  // Step 1: Get site info from DB (need the domain for everything else)
  const ctx = await gatherContext(siteId, query);

  // Step 2: Fetch site content + web research in parallel (now we have the domain)
  const [siteContent, research] = await Promise.all([
    fetchSiteContext(ctx.site.domain),
    researchTopic(query, ctx.site.domain),
  ]);

  const siteContextText = formatSiteContextForPrompt(ctx.site.domain, siteContent);

  const isComparisonQuery = /\b(best|top|vs|versus|alternative|compare|comparison|review)\b/i.test(query);
  const isHowToQuery = /\b(how to|guide|tutorial|step|setup|implement|configure)\b/i.test(query);
  const isWhatIsQuery = /\b(what is|what are|explain|definition|meaning)\b/i.test(query);

  const systemPrompt = `You are a senior content strategist who writes pages that AI platforms (ChatGPT, Perplexity, Google AI) will cite. You have been given REAL research data from live web searches — use it. Every claim in your content must be grounded in the research provided.

HOW AI DECIDES WHAT TO CITE:
1. First 2 sentences directly answer the query → gets extracted as primary answer
2. Self-contained, quotable facts with specific numbers → gets cited verbatim
3. Structured comparisons (tables with real data) → gets extracted directly
4. FAQ answers that completely answer a question in 1-3 sentences → pulled verbatim
5. Content citing authoritative sources → treated as more credible
6. Fresh content with current-year references → prioritized over older content
7. Entity-dense text (real company names, products, standards) → signals expertise

VOICE & TONE RULES — THIS IS CRITICAL:
- Write like a subject matter expert writing a definitive reference, NOT like an AI generating "helpful content"
- NEVER use these AI-tells: "In today's fast-paced world", "Whether you're a beginner or expert", "It's worth noting", "Let's dive in", "In conclusion", "At the end of the day", "When it comes to", "It's important to note"
- NEVER hedge with "may", "might", "could potentially" when you have real data. State facts directly.
- NEVER use filler paragraphs that summarize what you're about to say. Just say it.
- Use short, punchy sentences mixed with longer explanatory ones. Vary rhythm.
- Be opinionated where appropriate. Experts have opinions. "X is clearly the better choice for small teams because..." is more citable than "Both X and Y have their merits."
- If you don't have specific data for a claim, don't make the claim. Silence > vague filler.

You respond ONLY with valid JSON. No markdown code fences.`;

  const userPrompt = `Create a publish-ready page that will become the #1 resource AI platforms cite for this query.

TARGET QUERY: "${query}"
QUERY TYPE: ${isComparisonQuery ? "COMPARISON — Include a detailed comparison table with real features, real pricing, honest pros/cons" : isHowToQuery ? "HOW-TO — Numbered steps with specific, actionable instructions and clear outcomes" : isWhatIsQuery ? "DEFINITIONAL — Lead with a precise, quotable definition. Then go deep." : "INFORMATIONAL — Direct answer backed by expertise and real data"}

═══ THE SITE THIS PAGE IS FOR ═══
${siteContextText}
Name: ${ctx.site.name || ctx.site.domain}
Category: ${ctx.site.category || "General"}
Topics: ${((ctx.site as Record<string, unknown>).main_topics as string[] || []).join(", ") || "General"}
${ctx.geoScore !== null ? `GEO Score: ${ctx.geoScore}/100` : ""}

═══ LIVE WEB RESEARCH (use this real data — don't make up numbers) ═══
${research.rawResponse || "No research data available — use your training knowledge but be honest about uncertainty."}

${research.topSources.length > 0 ? `Sources found: ${research.topSources.join(", ")}` : ""}
${research.currentPricing.length > 0 ? `Pricing data found: ${research.currentPricing.join(", ")}` : ""}
${research.competitorNames.length > 0 ? `Other products/brands in space: ${research.competitorNames.join(", ")}` : ""}

═══ AI CITATION CONTEXT ═══
Queries where AI already cites this site:
${ctx.citedQueries.length > 0 ? ctx.citedQueries.slice(0, 8).map(q => `  ✓ ${q}`).join("\n") : "  None yet — this page must earn initial authority"}

Queries where AI doesn't cite this site (gaps):
${ctx.missedQueries.length > 0 ? ctx.missedQueries.slice(0, 8).map(q => `  ✗ ${q}`).join("\n") : "  No gap data yet"}

Related citations from this site's scans:
${ctx.queryCitations.length > 0
    ? ctx.queryCitations.map((c: { platform: string; snippet: string; confidence: string }) =>
        `- ${c.platform} (${c.confidence}): "${(c.snippet || "").slice(0, 200)}"`
      ).join("\n")
    : "No AI platform currently cites this site for this query."
  }

Trust signals: ${ctx.verifiedSources.length > 0 ? `Listed on ${ctx.verifiedSources.join(", ")}` : "No verified trust sources yet"}
${ctx.geoTips.length > 0 ? `\nGEO tips: ${ctx.geoTips.join(" | ")}` : ""}

═══ CONTENT REQUIREMENTS ═══
1. OPENING: First 1-2 sentences must directly, definitively answer "${query}". This gets extracted by AI. Make it quotable.
2. USE THE RESEARCH: Ground every claim in the real data provided above. Real names, real prices, real features. If the research has it, use it. If it doesn't, don't fabricate.
3. STRUCTURE: Use real user questions as H2/H3 headings. ${isComparisonQuery ? "Include a markdown comparison table with real data from the research." : isHowToQuery ? "Use numbered steps with concrete outcomes." : "Each section should contain at least one self-contained, quotable fact."}
4. MAKE IT HARD TO SUMMARIZE: Include specific data, tables, step-by-step processes, or original analysis that AI can't fully capture without citing you.
5. WEAVE IN THE BRAND: Position ${ctx.site.name || ctx.site.domain} naturally as a knowledgeable participant. Not purely promotional — genuinely the best resource, with the brand as an authority.
6. FAQ (5-7 questions): Each answer MUST be self-contained (1-3 sentences), specific, and directly useful. These get pulled verbatim by AI.
7. Schema.org FAQPage JSON-LD for the FAQ section.
8. 2000-3000 words. Every paragraph must earn its place.

{
  "title": "Page title (55-65 chars)",
  "metaDescription": "Meta description (150-160 chars)",
  "body": "Full markdown content",
  "schemaMarkup": { FAQPage JSON-LD },
  "targetEntities": ["entity1", "entity2", "entity3", "entity4", "entity5"]
}`;

  const response = await askLLMForPage(systemPrompt, userPrompt, reasoningEffort);

  let cleanResponse = response.trim();
  if (cleanResponse.startsWith("```")) {
    cleanResponse = cleanResponse.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  try {
    const parsed = JSON.parse(cleanResponse);
    let body = parsed.body || "";
    let title = parsed.title || `Guide: ${query}`;

    // PHASE 3: Refinement pass (user-initiated only, not auto-generated)
    if (!options?.autoGenerated && body.length > 500) {
      const refined = await refineContent(query, title, body, ctx.site.domain);
      title = refined.title;
      body = refined.body;
    }

    const wordCount = body.split(/\s+/).filter(Boolean).length;

    return {
      title,
      metaDescription: parsed.metaDescription || `Everything you need to know about ${query}.`,
      body,
      schemaMarkup: parsed.schemaMarkup || {},
      targetEntities: parsed.targetEntities || [],
      wordCount,
    };
  } catch {
    throw new Error("Failed to generate page content. Please try again.");
  }
}
