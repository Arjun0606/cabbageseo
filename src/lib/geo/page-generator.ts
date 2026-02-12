/**
 * Fix Page Generator
 *
 * Generates authority-building pages, category explainers, and FAQs.
 * Uses existing citation data and gap analysis to create deeply contextual
 * pages that make your site more citable by AI platforms.
 *
 * Cost: ~$0.10-0.20 per generation (gpt-5.2, varies by reasoning effort)
 * - User-initiated (reasoning: high): ~$0.19/page — maximum quality
 * - Auto-generated (reasoning: medium): ~$0.10/page — great quality, half the cost
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export interface GeneratedPageResult {
  title: string;
  metaDescription: string;
  body: string; // Full markdown
  schemaMarkup: Record<string, unknown>;
  targetEntities: string[];
  wordCount: number;
}

// ============================================
// LLM HELPER (higher token limit than citation-intelligence)
// ============================================

async function askLLMForPage(
  systemPrompt: string,
  userPrompt: string,
  reasoningEffort: "high" | "medium" = "high"
): Promise<string> {
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

  // Fetch all context data in parallel
  const [siteResult, citationsResult, listingsResult, geoResult, lostResult] = await Promise.all([
    supabase
      .from("sites")
      .select("domain, category, name, main_topics")
      .eq("id", siteId)
      .single(),
    supabase
      .from("citations")
      .select("platform, query, snippet, confidence")
      .eq("site_id", siteId)
      .order("cited_at", { ascending: false })
      .limit(30),
    supabase
      .from("source_listings")
      .select("source_domain, source_name, status")
      .eq("site_id", siteId),
    supabase
      .from("geo_analyses")
      .select("score, tips, queries")
      .eq("site_id", siteId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    // Get recent lost queries from market share snapshots
    supabase
      .from("market_share_snapshots")
      .select("queries_lost, queries_won, your_mentions")
      .eq("site_id", siteId)
      .order("snapshot_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const site = siteResult.data;
  if (!site) throw new Error("Site not found");

  const citations = citationsResult.data || [];
  const listings = listingsResult.data || [];
  const geoAnalysis = geoResult.data;
  const marketSnapshot = lostResult.data;

  // Find citations related to this query (match any word in the query)
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const queryCitations = citations.filter(
    (c: { query: string }) => {
      const cLower = c.query.toLowerCase();
      return queryWords.some(w => cLower.includes(w));
    }
  );

  // Separate wins and losses from citations
  const citedQueries = citations
    .filter((c: { confidence: string }) => c.confidence === "high" || c.confidence === "medium")
    .map((c: { query: string; platform: string }) => `${c.query} (${c.platform})`);
  const missedQueries = citations
    .filter((c: { confidence: string }) => c.confidence === "low" || c.confidence === "none")
    .map((c: { query: string; platform: string }) => `${c.query} (${c.platform})`);

  // Get verified source listings
  const verifiedSources = listings
    .filter((l: { status: string }) => l.status === "verified")
    .map((l: { source_name: string }) => l.source_name);

  const missingSources = listings
    .filter((l: { status: string }) => l.status !== "verified")
    .map((l: { source_name: string }) => l.source_name);

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
// MAIN GENERATOR
// ============================================

export async function generatePage(
  siteId: string,
  query: string,
  organizationId: string,
  options?: { autoGenerated?: boolean }
): Promise<GeneratedPageResult> {
  // Auto-generated pages use "medium" reasoning to control costs at scale
  // User-initiated pages use "high" reasoning for maximum quality
  const reasoningEffort = options?.autoGenerated ? "medium" as const : "high" as const;
  const ctx = await gatherContext(siteId, query);

  const systemPrompt = `You are a world-class Generative Engine Optimization (GEO) content strategist. You create pages that ChatGPT, Perplexity, Google AI Overview, and other AI platforms will cite, quote, and recommend when users ask relevant questions.

You have deep expertise in how large language models select sources to cite:

HOW AI PLATFORMS DECIDE WHAT TO CITE:
1. **Direct answer in first 2 sentences** — AI models extract the opening paragraph as their primary answer. If your first sentence directly and concisely answers the query, you get cited. Bury the answer and you don't.
2. **Quotable, self-contained statements** — AI cites sentences that can stand alone as facts. Write declarative sentences with specific numbers, dates, or comparisons. "X costs $49/mo and supports 3 integrations" gets cited. "X is a great tool" does not.
3. **Structured authority signals** — AI trusts content that cites its own sources. Reference industry reports, link to original research, mention specific case studies with real numbers. Content that cites authoritative third-party data gets cited more than opinion pieces.
4. **Entity-rich text** — AI models parse named entities (company names, people, products, standards, certifications). Every paragraph should mention specific, real entities relevant to the topic.
5. **Comparison tables and structured data** — When queries ask "best X" or "X vs Y", AI models look for structured comparisons. Tables with clear columns (features, pricing, ratings) get extracted directly.
6. **FAQ with concise answers** — AI models pull FAQ answers almost verbatim. Each answer should be 1-3 sentences that completely answer the question without needing context.
7. **Recency signals** — Mention current year, recent updates, or "as of 2026" to signal freshness. AI deprioritizes content that feels outdated.
8. **E-E-A-T markers** — Show experience (case studies, specific numbers from real usage), expertise (technical depth, correct terminology), authoritativeness (third-party validation, awards, certifications), and trustworthiness (transparent methodology, citing sources).

PLATFORM-SPECIFIC OPTIMIZATION:
- **ChatGPT**: Prefers comprehensive, well-structured content. Cites pages with clear H2/H3 hierarchy. Loves numbered lists and step-by-step processes. Values pages that cover a topic exhaustively.
- **Perplexity**: Prefers content with inline citations and source links. Extracts specific facts and statistics. Values recency — always include dates. Pulls from pages that read like reference material.
- **Google AI Overview**: Heavily weights traditional SEO signals (E-E-A-T, domain authority) alongside content quality. Values Schema.org markup. Prefers content from sites with verified profiles on review platforms (G2, Capterra, etc).

CONTENT QUALITY STANDARDS:
- Write like an industry expert, not a content mill. Use precise terminology. Show genuine domain knowledge.
- Every claim should be specific and verifiable. Replace "many companies" with "73% of SaaS companies (Gartner, 2025)".
- Include real, current pricing where relevant. Include specific feature names, not generic descriptions.
- Write comparison sections that are genuinely fair and useful, not just promotional.
- The FAQ section is the single most cited element — invest maximum quality here.

You respond ONLY with valid JSON. No markdown code fences, no extra text.`;

  const isComparisonQuery = /\b(best|top|vs|versus|alternative|compare|comparison|review)\b/i.test(query);
  const isHowToQuery = /\b(how to|guide|tutorial|step|setup|implement|configure)\b/i.test(query);
  const isWhatIsQuery = /\b(what is|what are|explain|definition|meaning)\b/i.test(query);

  const userPrompt = `Create a publish-ready, authority-building page that AI platforms will cite for this query.

TARGET QUERY: "${query}"
QUERY TYPE: ${isComparisonQuery ? "COMPARISON/REVIEW — AI platforms look for structured comparisons with tables, pros/cons, and clear rankings" : isHowToQuery ? "HOW-TO/GUIDE — AI platforms look for numbered step-by-step instructions with clear outcomes" : isWhatIsQuery ? "DEFINITIONAL — AI platforms look for concise definitions in the first sentence, then depth" : "INFORMATIONAL — AI platforms look for direct answers backed by expertise and data"}

SITE CONTEXT:
- Domain: ${ctx.site.domain}
- Name: ${ctx.site.name || ctx.site.domain}
- Category: ${ctx.site.category || "General"}
- Core Topics: ${((ctx.site as Record<string, unknown>).main_topics as string[] || []).join(", ") || "General"}
${ctx.geoScore !== null ? `- Current GEO Score: ${ctx.geoScore}/100` : ""}
${ctx.queriesWon > 0 ? `- Queries where AI cites this site: ${ctx.queriesWon}` : ""}
${ctx.queriesLost > 0 ? `- Queries where AI doesn't cite this site: ${ctx.queriesLost}` : ""}

WHAT AI ALREADY CITES THIS SITE FOR (leverage this authority):
${ctx.citedQueries.length > 0
    ? ctx.citedQueries.slice(0, 8).map(q => `  ✓ ${q}`).join("\n")
    : "  No citations yet — this page needs to establish initial authority"
  }

QUERIES WHERE THIS SITE IS INVISIBLE (gaps to address):
${ctx.missedQueries.length > 0
    ? ctx.missedQueries.slice(0, 8).map(q => `  ✗ ${q}`).join("\n")
    : "  No gap data yet"
  }

CITATIONS RELATED TO THIS SPECIFIC QUERY:
${ctx.queryCitations.length > 0
    ? ctx.queryCitations.map((c: { platform: string; snippet: string; confidence: string }) =>
        `- ${c.platform} (${c.confidence}): "${(c.snippet || "").slice(0, 300)}"`
      ).join("\n")
    : "No AI platform currently cites this site for this query — this page must earn that citation from scratch."
  }

TRUST & AUTHORITY SIGNALS:
- Verified on: ${ctx.verifiedSources.length > 0 ? ctx.verifiedSources.join(", ") : "None yet (mention any relevant third-party validation the site likely has)"}
- Not yet listed on: ${ctx.missingSources.length > 0 ? ctx.missingSources.join(", ") : "N/A"}
${ctx.geoTips.length > 0 ? `\nGEO IMPROVEMENT TIPS FROM ANALYSIS:\n${ctx.geoTips.map(t => `- ${t}`).join("\n")}` : ""}

CONTENT REQUIREMENTS:
1. FIRST PARAGRAPH: Open with a direct, complete answer to "${query}" in 1-2 sentences. This paragraph gets extracted by AI as the primary answer — make it definitive, specific, and quotable.
2. AUTHORITY DEPTH: After the direct answer, go deep. Show genuine expertise with specific details, real numbers, technical accuracy, and current information (reference 2025-2026 data/trends).
3. QUESTION-ANSWER STRUCTURE: Use real user questions as H2/H3 subheadings (e.g., "## How does X work?" not "## Overview"). Place a direct, complete answer in the first 1-2 sentences after each heading. This is the #1 pattern AI platforms extract — it mirrors featured snippet optimization. ${isComparisonQuery ? "Also include a detailed markdown table comparing the top options with real features, actual pricing, and honest pros/cons. AI models extract these tables directly." : isHowToQuery ? "Also use numbered steps with clear, actionable instructions. Each step should have a specific outcome." : "Each section should contain at least one quotable, self-contained fact that AI can cite independently."}
3b. MAKE IT HARD TO SUMMARIZE: Include specific data points, detailed step-by-step processes, comparison tables, or unique research that AI cannot fully capture in a summary — this forces AI to cite your page as a source rather than paraphrasing it away.
4. ENTITY DENSITY: Name specific companies, products, standards, certifications, people, and tools throughout. AI models use entity recognition to assess authority.
5. CITE SOURCES: Reference real industry reports, studies, or standards where relevant (e.g., "according to Gartner's 2025 Magic Quadrant" or "per NIST guidelines"). Content that cites authoritative sources gets cited more by AI.
6. THE SITE'S ROLE: Weave ${ctx.site.name || ctx.site.domain} naturally into the content as a knowledgeable participant in this space. Don't make the page purely promotional — make it genuinely the best resource on the internet for this query, with the site positioned as an authority.
7. FAQ SECTION (CRITICAL — most-cited element): Write 5-7 FAQ questions that real users would ask about this topic. Each answer must be self-contained (1-3 sentences), specific, and directly useful — these get extracted verbatim by AI.
8. FRESHNESS: Include "as of 2026", current pricing, or recent updates to signal recency.
9. WORD COUNT: 2000-3000 words. Quality over quantity — every paragraph must add value.
10. Schema.org JSON-LD: Generate FAQPage markup for the FAQ section.

Respond in this exact JSON format (no markdown code fences):
{
  "title": "Page title optimized for both search and AI citation (55-65 chars)",
  "metaDescription": "Compelling meta description that AI platforms may use as snippet (150-160 chars)",
  "body": "Full page content in markdown. Use ## for H2, ### for H3. Use | pipe tables for comparisons. Use **bold** for key terms. Include real data and citations.",
  "schemaMarkup": {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Question text?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Complete, self-contained answer"
        }
      }
    ]
  },
  "targetEntities": ["entity1", "entity2", "entity3", "entity4", "entity5"]
}`;

  const response = await askLLMForPage(systemPrompt, userPrompt, reasoningEffort);

  // Parse JSON response — handle potential markdown code fences
  let cleanResponse = response.trim();
  if (cleanResponse.startsWith("```")) {
    cleanResponse = cleanResponse.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  try {
    const parsed = JSON.parse(cleanResponse);

    const body = parsed.body || "";
    const wordCount = body.split(/\s+/).filter(Boolean).length;

    return {
      title: parsed.title || `Guide: ${query}`,
      metaDescription: parsed.metaDescription || `Everything you need to know about ${query}.`,
      body,
      schemaMarkup: parsed.schemaMarkup || {},
      targetEntities: parsed.targetEntities || [],
      wordCount,
    };
  } catch {
    // Fallback: if JSON parsing fails, try to extract content
    throw new Error("Failed to generate page content. Please try again.");
  }
}
