/**
 * Fix Page Generator
 *
 * Generates authority-building pages, category explainers, and FAQs.
 * Uses existing citation data and gap analysis to create deeply contextual
 * pages that make your site more citable by AI platforms.
 *
 * Cost: ~$0.02-0.04 per generation (gpt-5.2)
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

async function askLLMForPage(systemPrompt: string, userPrompt: string): Promise<string> {
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
      reasoning: { effort: "medium" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_completion_tokens: 16000,
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
  const [siteResult, citationsResult, listingsResult] = await Promise.all([
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
      .limit(20),
    supabase
      .from("source_listings")
      .select("source_domain, source_name, status")
      .eq("site_id", siteId),
  ]);

  const site = siteResult.data;
  if (!site) throw new Error("Site not found");

  const citations = citationsResult.data || [];
  const listings = listingsResult.data || [];

  // Find citations related to this query
  const queryCitations = citations.filter(
    (c: { query: string }) => c.query.toLowerCase().includes(query.toLowerCase().split(" ")[0])
  );

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
    verifiedSources,
    missingSources,
  };
}

// ============================================
// MAIN GENERATOR
// ============================================

export async function generatePage(
  siteId: string,
  query: string,
  organizationId: string
): Promise<GeneratedPageResult> {
  const ctx = await gatherContext(siteId, query);

  const systemPrompt = `You are an AI Search Optimization content strategist. Your job is to create pages that AI platforms (ChatGPT, Perplexity, Google AI) will cite when users ask relevant questions.

You create content that is:
- Directly answering the query in the first paragraph (AI loves direct answers)
- Structured with clear H2/H3 headings (AI parses structure)
- Rich with named entities, statistics, and quotable facts (AI cites specific claims)
- Including FAQ sections (AI loves pulling FAQ answers)
- Comprehensive but scannable (1500-2500 words)
- Written in a professional, authoritative tone

You respond ONLY with valid JSON. No markdown code fences, no extra text.`;

  const userPrompt = `Create a publish-ready page for this query:

TARGET QUERY: "${query}"

SITE CONTEXT:
- Domain: ${ctx.site.domain}
- Category: ${ctx.site.category || "General"}
- Name: ${ctx.site.name || ctx.site.domain}
- Topics: ${((ctx.site as Record<string, unknown>).main_topics as string[] || []).join(", ") || "General"}

EXISTING CITATION DATA:
${ctx.queryCitations.length > 0
    ? ctx.queryCitations.map((c: { platform: string; snippet: string }) =>
        `- ${c.platform}: "${(c.snippet || "").slice(0, 200)}"`
      ).join("\n")
    : "No citations found for this specific query yet."
  }

ALL RECENT CITATIONS (for context on what AI already cites this site for):
${ctx.citations.slice(0, 10).map((c: { platform: string; query: string; confidence: string }) =>
    `- "${c.query}" on ${c.platform} (${c.confidence})`
  ).join("\n") || "No citations yet"}

TRUST SOURCE PRESENCE:
- Listed on: ${ctx.verifiedSources.length > 0 ? ctx.verifiedSources.join(", ") : "None yet"}
- Not listed on: ${ctx.missingSources.length > 0 ? ctx.missingSources.join(", ") : "N/A"}

INSTRUCTIONS:
1. Write the page in markdown format
2. Start with a direct answer to the query in the first paragraph
3. Include comparison sections if the query involves "best", "top", or "alternatives"
4. Include the user's product/site naturally (not forced)
5. Add 4-6 FAQ questions with clear answers
6. Mention specific entities, statistics, and quotable facts
7. Make the content genuinely useful, not just SEO-optimized
8. Focus on establishing the site's authority and expertise in this topic
9. Generate a Schema.org JSON-LD markup (FAQPage type) for the FAQ section

Respond in this exact JSON format (no markdown code fences):
{
  "title": "SEO-optimized page title (60-70 chars)",
  "metaDescription": "Compelling meta description (150-160 chars)",
  "body": "Full page content in markdown format (1500-2500 words). Use ## for H2, ### for H3. Include tables with | syntax if comparing options.",
  "schemaMarkup": {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Question text?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Answer text"
        }
      }
    ]
  },
  "targetEntities": ["entity1", "entity2", "entity3"]
}`;

  const response = await askLLMForPage(systemPrompt, userPrompt);

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
