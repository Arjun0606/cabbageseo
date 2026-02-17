/**
 * Teaser API - Quick AI visibility scan without authentication
 *
 * 1. Fetches the site to understand what the business does
 * 2. Uses AI to generate realistic customer queries (no hardcoded templates)
 * 3. Runs those queries through Perplexity, Google AI, and ChatGPT in parallel
 * 4. Scores visibility across 5 factors
 *
 * No signup required - this is the free scan that converts visitors.
 */

// Allow up to 120s for multi-platform AI scanning
export const maxDuration = 120;

import { NextRequest, NextResponse } from "next/server";
import { lookup } from "dns/promises";
import { db, teaserReports } from "@/lib/db";
import { generateTeaserPreview, type ContentPreviewData } from "@/lib/geo/teaser-preview-generator";
import { logRecommendations, extractTeaserRecommendations } from "@/lib/geo/recommendation-logger";
import { fetchSiteContext as fetchSiteContextShared } from "@/lib/geo/site-context";

// Rate limiting: simple in-memory store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5; // requests per IP
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

// Comprehensive TLD pattern for brand extraction
const TLD_PATTERN = /\.(com|io|co|ai|app|dev|org|net|so|sh|me|cc|biz|info|xyz|tech|tools|software|cloud|studio|design|agency|pro|team|run|build|gg|fm|tv|to|ly|it|is|in|us|uk|de|fr|eu|co\.uk|com\.au|co\.in)$/;

// Extract clean brand name from domain
function extractBrandName(domain: string): string {
  const cleaned = domain.replace(TLD_PATTERN, "");
  const parts = cleaned.split(".");
  const name = parts[parts.length - 1];
  if (name.includes("-") && name.length > 20) return domain;
  return name;
}

/**
 * Fetch the site homepage and extract meaningful context.
 * Uses the shared utility in lib/geo/site-context.ts.
 */
async function fetchSiteContext(domain: string): Promise<{
  title: string;
  description: string;
  headings: string[];
  ogData: { type?: string; siteName?: string };
}> {
  return fetchSiteContextShared(domain);
}

/**
 * Use AI to generate the exact queries a potential customer would ask.
 *
 * Instead of hardcoded templates like "best [category] tools 2026",
 * we give Gemini the site's actual content and ask it to generate
 * realistic queries. Works for any business — SaaS, directory,
 * restaurant, law firm, anything.
 */
async function generateSmartQueries(
  domain: string,
  siteContext: { title: string; description: string; headings: string[]; ogData: { type?: string; siteName?: string } },
): Promise<{ queries: string[]; businessSummary: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  const brand = extractBrandName(domain);

  const contextParts: string[] = [`Domain: ${domain}`, `Brand name: ${brand}`];
  if (siteContext.title) contextParts.push(`Page title: ${siteContext.title}`);
  if (siteContext.description) contextParts.push(`Meta description: ${siteContext.description}`);
  if (siteContext.ogData.siteName) contextParts.push(`Site name: ${siteContext.ogData.siteName}`);
  if (siteContext.headings.length > 0) contextParts.push(`Key headings: ${siteContext.headings.join(" | ")}`);
  const siteInfo = contextParts.join("\n");
  const hasContext = siteContext.title || siteContext.description;

  if (apiKey && hasContext) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-5.2",
          messages: [{
            role: "user",
            content: `You are testing whether AI assistants know about a specific business. Given a website's information, do two things:

1. Write a one-sentence summary of what this business does (max 20 words). Be specific — not "a SaaS tool" but what it actually does.
2. Generate exactly 3 search queries that a REAL potential customer would type into ChatGPT, Perplexity, or Google AI.

CRITICAL RULES:
- Query 1 (Discovery): A query from someone who has the SPECIFIC PROBLEM this product solves, but doesn't know this brand exists. Focus on the exact problem or need, not a generic category. Do NOT include the brand name. Example for a startup directory: "where can I list my startup to get discovered by investors" — NOT "best startup tools".
- Query 2 (Brand): A direct query about this brand — someone heard the name and wants to know if it's legit, what it does, pricing, reviews.
- Query 3 (Decision): A query from someone actively comparing options in this exact niche. Be specific to the niche, not generic like "best tools 2026."
- Each query: 5-15 words, natural language, how a real person talks to AI.
- Be SPECIFIC to what this business actually does. Read the title, description, and headings carefully.

RESPOND IN EXACTLY THIS FORMAT (no markdown, no extra text):
SUMMARY: [what the business does]
Q1: [discovery query]
Q2: [brand query]
Q3: [decision query]

Website information:
${siteInfo}`,
          }],
          max_completion_tokens: 200,
        }),
        signal: AbortSignal.timeout(8000),
      });

      if (res.ok) {
        const data = await res.json();
        const text = (data.choices?.[0]?.message?.content || "").trim();

        const summaryMatch = text.match(/SUMMARY:\s*(.+)/i);
        const q1Match = text.match(/Q1:\s*(.+)/i);
        const q2Match = text.match(/Q2:\s*(.+)/i);
        const q3Match = text.match(/Q3:\s*(.+)/i);

        const queries = [q1Match?.[1]?.trim(), q2Match?.[1]?.trim(), q3Match?.[1]?.trim()]
          .filter((q): q is string => !!q && q.length > 5 && q.length < 200);

        if (queries.length >= 2) {
          return {
            queries,
            businessSummary: summaryMatch?.[1]?.trim() || `${brand} — ${siteContext.title || domain}`,
          };
        }
      }
    } catch {
      // Fall through to fallback
    }
  }

  // Fallback: simple direct queries if AI generation fails
  return {
    queries: [
      `what is ${domain}`,
      `tell me about ${brand}`,
      `${brand} reviews`,
    ],
    businessSummary: siteContext.description?.slice(0, 100) || siteContext.title || domain,
  };
}

// Query Perplexity API
async function queryPerplexity(query: string): Promise<{
  response: string;
  citations: string[];
}> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) throw new Error("Perplexity API not configured");

  const response = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "sonar",
      messages: [{ role: "user", content: query }],
      max_tokens: 500,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("[Teaser] Perplexity error:", error);
    throw new Error("Perplexity API error");
  }

  const data = await response.json();
  return {
    response: data.choices?.[0]?.message?.content || "",
    citations: data.citations || [],
  };
}

// Query Google AI (Gemini)
async function queryGemini(query: string): Promise<{
  response: string;
  mentions: string[];
}> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) throw new Error("Google AI API not configured");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: query }] }],
        generationConfig: { maxOutputTokens: 500 },
      }),
      signal: AbortSignal.timeout(30000),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("[Teaser] Gemini error:", error);
    throw new Error("Google AI API error");
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

  const mentions: string[] = [];
  const domainRegex = /\b([a-z0-9-]+\.(com|io|co|ai|app|dev|org|net|me|sh|cc|so|biz|xyz|tech|tools|software|cloud|pro|gg|fm|tv|to|ly))\b/gi;
  let match;
  while ((match = domainRegex.exec(content)) !== null) {
    mentions.push(match[1].toLowerCase());
  }

  return { response: content, mentions };
}

// Query ChatGPT (OpenAI)
async function queryChatGPT(query: string): Promise<{
  response: string;
}> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OpenAI API not configured");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-5-mini",
      messages: [{ role: "user", content: query }],
      max_completion_tokens: 4000,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("[Teaser] ChatGPT error:", error);
    throw new Error("ChatGPT API error");
  }

  const data = await response.json();
  return {
    response: data.choices?.[0]?.message?.content || "",
  };
}

// Extract domains mentioned in a response
function extractMentionedDomains(text: string, citations: string[] = []): string[] {
  const domains = new Set<string>();

  for (const citation of citations) {
    try {
      const url = new URL(citation);
      domains.add(url.hostname.replace(/^www\./, ""));
    } catch {
      // Not a valid URL
    }
  }

  const domainRegex = /\b([a-z0-9-]+\.(com|io|co|ai|app|dev|org|net|me|sh|cc|so|biz|xyz|tech|tools|software|cloud|pro|gg|fm|tv|to|ly))\b/gi;
  let match;
  while ((match = domainRegex.exec(text)) !== null) {
    domains.add(match[1].toLowerCase());
  }

  return Array.from(domains);
}

// Check if brand name is mentioned in text (case insensitive, word boundary)
// Split a concatenated brand name into likely word parts
const COMMON_BRAND_WORDS = [
  "stack", "over", "flow", "product", "hunt", "hub", "spot", "trust",
  "pilot", "base", "camp", "click", "up", "cloud", "fire", "sale",
  "force", "mail", "chimp", "send", "grid", "drop", "box", "bit",
  "bucket", "craft", "snap", "chat", "work", "team", "book", "face",
  "linked", "mind", "map", "air", "table", "notion", "pipe", "drive",
  "shop", "pay", "pal", "strip", "wise", "fresh", "desk", "help",
  "scout", "inter", "com", "fast", "quick", "smart", "data", "dog",
  "new", "relic", "post", "mark", "git", "lab", "source", "code",
  "dev", "ops", "api", "web", "app", "net", "tech", "soft", "ware",
  "cloud", "host", "page", "site", "link", "doc", "sign", "log",
  "auth", "key", "lock", "safe", "guard", "shield", "vault",
  "zen", "meta", "super", "mega", "micro", "mini", "max",
];

function splitBrandIntoParts(brand: string): string[] {
  for (let i = 2; i < brand.length - 1; i++) {
    const left = brand.slice(0, i);
    const right = brand.slice(i);
    if (COMMON_BRAND_WORDS.includes(left) && (COMMON_BRAND_WORDS.includes(right) || right.length >= 3)) {
      return [left, right];
    }
  }
  return [];
}

function isBrandMentioned(text: string, domain: string): boolean {
  const brandName = domain.split(".")[0];
  if (!brandName || brandName.length < 2) return false;
  const escaped = brandName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // Exact match (e.g., "hubspot")
  if (new RegExp(`\\b${escaped}\\b`, "i").test(text)) return true;
  // Word-part match: split brand into known words, match with space/hyphen
  // "producthunt" → "product hunt" or "product-hunt"
  const parts = splitBrandIntoParts(brandName.toLowerCase());
  if (parts.length >= 2) {
    const pattern = parts.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("[\\s\\-]");
    return new RegExp(`\\b${pattern}\\b`, "i").test(text);
  }
  return false;
}

// Build brand regex for position/count searches
function buildBrandRegex(domain: string, flags: string): RegExp | null {
  const brandName = domain.split(".")[0];
  if (!brandName || brandName.length < 2) return null;
  const escaped = brandName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // Try word-part pattern first
  const parts = splitBrandIntoParts(brandName.toLowerCase());
  if (parts.length >= 2) {
    const pattern = parts.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("[\\s\\-]?");
    return new RegExp(`\\b${pattern}\\b`, flags);
  }
  // Fall back to exact brand name
  return new RegExp(`\\b${escaped}\\b`, flags);
}

// Find position of brand mention in text (0 = first, higher = later, -1 = not found)
function findMentionPosition(text: string, domain: string): number {
  const regex = buildBrandRegex(domain, "i");
  if (!regex) return -1;
  const match = regex.exec(text);
  if (!match) return -1;
  return match.index / Math.max(text.length, 1);
}

// Count how many times domain/brand appears in text
function countMentions(text: string, domain: string): number {
  const regex = buildBrandRegex(domain, "gi");
  if (!regex) return 0;
  return (text.match(regex) || []).length;
}

interface PlatformResult {
  query: string;
  platform: "perplexity" | "gemini" | "chatgpt";
  aiRecommends: string[];
  mentionedYou: boolean;
  snippet: string;
  inCitations: boolean;
  domainFound: boolean;
  mentionPosition: number;
  mentionCount: number;
}

/**
 * Visibility scoring across 5 factors focused on YOUR presence in AI responses.
 */
function calculateVisibilityScore(
  results: PlatformResult[],
  platformsAttempted: number = 3,
): {
  score: number;
  factors: {
    citationPresence: number;
    domainVisibility: number;
    brandRecognition: number;
    mentionProminence: number;
    mentionDepth: number;
  };
  explanation: string;
} {
  // Use attempted count (always 3) to prevent score inflation when a platform fails
  const denominator = Math.max(platformsAttempted, results.length);
  if (results.length === 0) {
    return {
      score: 0,
      factors: { citationPresence: 0, domainVisibility: 0, brandRecognition: 0, mentionProminence: 0, mentionDepth: 0 },
      explanation: "No AI platforms responded.",
    };
  }

  // Factor 1: Citation presence (0-40) — domain in actual source citations/links
  const citedCount = results.filter(r => r.inCitations).length;
  const citationPresence = Math.round(40 * (citedCount / denominator));

  // Factor 2: Domain visibility (0-25) — full domain found in response text
  const domainFoundCount = results.filter(r => r.domainFound).length;
  const domainVisibility = Math.round(25 * (domainFoundCount / denominator));

  // Factor 3: Brand recognition (0-15) — AI mentions your brand at all
  const knownCount = results.filter(r => r.mentionedYou).length;
  const brandRecognition = Math.round(15 * (knownCount / denominator));

  // Factor 4: Mention prominence (0-12) — mentioned early in the response
  let mentionProminence = 0;
  const mentionsWithPosition = results.filter(r => r.mentionedYou && r.mentionPosition >= 0);
  if (mentionsWithPosition.length > 0) {
    const avgPos = mentionsWithPosition.map(r => r.mentionPosition).reduce((a, b) => a + b, 0) / mentionsWithPosition.length;
    mentionProminence = Math.round(12 * (1 - avgPos));
  }

  // Factor 5: Mention depth (0-8) — consistent mentions across platforms
  const totalMentionCount = results
    .filter(r => r.mentionedYou)
    .reduce((sum, r) => sum + r.mentionCount, 0);
  const mentionDepth = Math.round(8 * (1 - Math.exp(-totalMentionCount / 3)));

  const score = Math.min(100, citationPresence + domainVisibility + brandRecognition + mentionProminence + mentionDepth);

  const parts: string[] = [];
  if (citedCount > 0) {
    parts.push(`Cited as a source by ${citedCount} of ${denominator} platforms`);
  }
  if (domainFoundCount > 0) {
    parts.push(`Domain referenced in ${domainFoundCount} of ${denominator} responses`);
  }
  if (knownCount > 0 && citedCount === 0 && domainFoundCount === 0) {
    parts.push(`Brand recognized by ${knownCount} of ${denominator} platforms`);
  }
  if (knownCount === 0) {
    parts.push(`Not recognized by any AI platform tested`);
  }
  if (score < 15) {
    parts.push(`AI has no knowledge of your brand yet`);
  } else if (score < 40) {
    parts.push(`AI has limited awareness of your brand`);
  } else if (score < 60) {
    parts.push(`AI recognizes your brand but could cite you more`);
  }

  return {
    score,
    factors: { citationPresence, domainVisibility, brandRecognition, mentionProminence, mentionDepth },
    explanation: parts.join(". ") + ".",
  };
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") ||
               request.headers.get("x-real-ip") ||
               "unknown";

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { domain } = body;

    if (!domain || typeof domain !== "string") {
      return NextResponse.json(
        { error: "Domain is required" },
        { status: 400 }
      );
    }

    // Clean domain
    let cleanDomain = domain.trim().toLowerCase();
    cleanDomain = cleanDomain.replace(/^https?:\/\//, "");
    cleanDomain = cleanDomain.replace(/^www\./, "");
    cleanDomain = cleanDomain.split("/")[0];

    // Validate domain format
    const domainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;
    if (!domainRegex.test(cleanDomain) || cleanDomain.length > 253) {
      return NextResponse.json(
        { error: "Please enter a valid domain (e.g., yourdomain.com)" },
        { status: 400 }
      );
    }

    // Verify domain actually exists (DNS resolution)
    try {
      await lookup(cleanDomain);
    } catch {
      return NextResponse.json(
        { error: "We couldn't find this domain. Please check the URL and try again." },
        { status: 400 }
      );
    }

    const brandName = extractBrandName(cleanDomain);

    // Step 1: Fetch site to understand what this business actually does
    const siteContext = await fetchSiteContext(cleanDomain);

    // Step 2: AI generates the exact queries a real customer would ask
    const { queries, businessSummary } = await generateSmartQueries(cleanDomain, siteContext);

    const results: PlatformResult[] = [];
    const platformErrors: string[] = [];

    // Step 3: Run 2 queries per platform in parallel
    // Each platform gets: brand query (Q2) + one unique query
    // This ensures every platform gets a fair shot at recognizing the brand
    const brandQuery = queries[1]; // "What is [brand]?" — always tests brand awareness
    const discoveryQuery = queries[0]; // Problem-based, no brand name
    const decisionQuery = queries[2] || queries[0]; // Comparison query

    const [
      pxBrandSettled, pxDiscoverySettled,
      gemBrandSettled, gemDecisionSettled,
      gptBrandSettled, gptDecisionSettled,
    ] = await Promise.allSettled([
      queryPerplexity(brandQuery),
      queryPerplexity(discoveryQuery),
      queryGemini(brandQuery),
      queryGemini(decisionQuery),
      queryChatGPT(brandQuery),
      queryChatGPT(decisionQuery),
    ]);

    // Detect negative mentions: AI says "I don't know X" — that's NOT a citation
    function isNegativeMention(text: string): boolean {
      const lower = text.toLowerCase();
      const negativePatterns = [
        "i don't recognize",
        "i don't have information",
        "not familiar with",
        "i'm not aware of",
        "i am not aware of",
        "no information available",
        "i cannot find",
        "i can't find",
        "don't have specific",
        "not widely known",
        "not a widely-known",
        "i don't have details",
        "unable to find",
        "couldn't find information",
        "no results for",
      ];
      return negativePatterns.some(p => lower.includes(p));
    }

    // Helper: process a Perplexity response into detection signals
    function processPerplexity(r: { response: string; citations: string[] }) {
      const mentioned = extractMentionedDomains(r.response, r.citations);
      const domainInResponse = mentioned.includes(cleanDomain);
      const inCitations = r.citations.some(c => {
        try {
          const h = new URL(c).hostname.replace(/^www\./, "");
          return h === cleanDomain || h.endsWith("." + cleanDomain);
        } catch { return false; }
      });
      const negative = isNegativeMention(r.response);
      const brandMentioned = !negative && isBrandMentioned(r.response, cleanDomain);
      return { mentioned, domainInResponse: domainInResponse && !negative, inCitations, brandMentioned, response: r.response };
    }

    // Helper: process a Gemini response into detection signals
    function processGemini(r: { response: string; mentions: string[] }) {
      const mentioned = extractMentionedDomains(r.response, r.mentions);
      const domainInResponse = mentioned.includes(cleanDomain);
      const domainInMentions = r.mentions.some(m => m === cleanDomain || m.endsWith("." + cleanDomain));
      const negative = isNegativeMention(r.response);
      const brandMentioned = !negative && isBrandMentioned(r.response, cleanDomain);
      return { mentioned, domainInResponse: domainInResponse && !negative, domainInMentions, brandMentioned, response: r.response };
    }

    // Helper: process a ChatGPT response into detection signals
    function processChatGPT(r: { response: string }) {
      const mentioned = extractMentionedDomains(r.response);
      const domainInResponse = mentioned.includes(cleanDomain);
      const negative = isNegativeMention(r.response);
      const brandMentioned = !negative && isBrandMentioned(r.response, cleanDomain);
      return { mentioned, domainInResponse: domainInResponse && !negative, brandMentioned, response: r.response };
    }

    // Process Perplexity: merge brand + discovery queries
    // Display the DISCOVERY query (realistic customer scenario), use brand query as backup signal
    {
      const pxBrand = pxBrandSettled.status === "fulfilled" ? processPerplexity(pxBrandSettled.value) : null;
      const pxDiscovery = pxDiscoverySettled.status === "fulfilled" ? processPerplexity(pxDiscoverySettled.value) : null;
      const pxResults = [pxBrand, pxDiscovery].filter((r): r is NonNullable<typeof r> => r !== null);

      if (pxResults.length > 0) {
        const anyFound = pxResults.some(r => r.domainInResponse || r.inCitations || r.brandMentioned);
        const anyCited = pxResults.some(r => r.inCitations);
        const allMentioned = new Set(pxResults.flatMap(r => r.mentioned));
        const positions = pxResults.map(r => findMentionPosition(r.response, cleanDomain)).filter(p => p >= 0);
        // Prefer showing the discovery query (more realistic); fall back to brand query
        const discoveryFound = pxDiscovery && (pxDiscovery.domainInResponse || pxDiscovery.inCitations || pxDiscovery.brandMentioned);
        const showResult = discoveryFound ? pxDiscovery : (pxBrand || pxResults[0]);
        const showQuery = discoveryFound ? discoveryQuery : brandQuery;
        results.push({
          query: showQuery,
          platform: "perplexity",
          aiRecommends: [...allMentioned].filter(d => d !== cleanDomain).slice(0, 5),
          mentionedYou: anyFound,
          snippet: showResult.response.slice(0, 300),
          inCitations: anyCited,
          domainFound: pxResults.some(r => r.domainInResponse || r.inCitations) || anyFound,
          mentionPosition: positions.length > 0 ? Math.min(...positions) : -1,
          mentionCount: Math.max(...pxResults.map(r => countMentions(r.response, cleanDomain))),
        });
      } else {
        console.error("[Teaser] Perplexity failed");
        platformErrors.push("perplexity");
      }
    }

    // Process Gemini: merge brand + decision queries
    // Display the DECISION query; fall back to brand query
    {
      const gemBrand = gemBrandSettled.status === "fulfilled" ? processGemini(gemBrandSettled.value) : null;
      const gemDecision = gemDecisionSettled.status === "fulfilled" ? processGemini(gemDecisionSettled.value) : null;
      const gemResults = [gemBrand, gemDecision].filter((r): r is NonNullable<typeof r> => r !== null);

      if (gemResults.length > 0) {
        const anyFound = gemResults.some(r => r.domainInResponse || r.domainInMentions || r.brandMentioned);
        const anyCited = gemResults.some(r => r.domainInMentions);
        const allMentioned = new Set(gemResults.flatMap(r => r.mentioned));
        const positions = gemResults.map(r => findMentionPosition(r.response, cleanDomain)).filter(p => p >= 0);
        const decisionFound = gemDecision && (gemDecision.domainInResponse || gemDecision.domainInMentions || gemDecision.brandMentioned);
        const showResult = decisionFound ? gemDecision : (gemBrand || gemResults[0]);
        const showQuery = decisionFound ? decisionQuery : brandQuery;
        results.push({
          query: showQuery,
          platform: "gemini",
          aiRecommends: [...allMentioned].filter(d => d !== cleanDomain).slice(0, 5),
          mentionedYou: anyFound,
          snippet: showResult.response.slice(0, 300),
          inCitations: anyCited,
          domainFound: gemResults.some(r => r.domainInResponse || r.domainInMentions) || anyFound,
          mentionPosition: positions.length > 0 ? Math.min(...positions) : -1,
          mentionCount: Math.max(...gemResults.map(r => countMentions(r.response, cleanDomain))),
        });
      } else {
        console.error("[Teaser] Gemini failed");
        platformErrors.push("gemini");
      }
    }

    // Process ChatGPT: merge brand + decision queries
    // Display the DECISION query; fall back to brand query
    {
      const gptBrand = gptBrandSettled.status === "fulfilled" ? processChatGPT(gptBrandSettled.value) : null;
      const gptDecision = gptDecisionSettled.status === "fulfilled" ? processChatGPT(gptDecisionSettled.value) : null;
      const gptResults = [gptBrand, gptDecision].filter((r): r is NonNullable<typeof r> => r !== null);

      if (gptResults.length > 0) {
        const anyFound = gptResults.some(r => r.domainInResponse || r.brandMentioned);
        const allMentioned = new Set(gptResults.flatMap(r => r.mentioned));
        const positions = gptResults.map(r => findMentionPosition(r.response, cleanDomain)).filter(p => p >= 0);
        const decisionFound = gptDecision && (gptDecision.domainInResponse || gptDecision.brandMentioned);
        const showResult = decisionFound ? gptDecision : (gptBrand || gptResults[0]);
        const showQuery = decisionFound ? decisionQuery : brandQuery;
        results.push({
          query: showQuery,
          platform: "chatgpt",
          aiRecommends: [...allMentioned].filter(d => d !== cleanDomain).slice(0, 5),
          mentionedYou: anyFound,
          snippet: showResult.response.slice(0, 300),
          inCitations: false,
          domainFound: anyFound,
          mentionPosition: positions.length > 0 ? Math.min(...positions) : -1,
          mentionCount: Math.max(...gptResults.map(r => countMentions(r.response, cleanDomain))),
        });
      } else {
        console.error("[Teaser] ChatGPT failed");
        platformErrors.push("chatgpt");
      }
    }

    // Generate content preview if we have results
    let contentPreview: ContentPreviewData | null = null;
    try {
      contentPreview = await generateTeaserPreview(cleanDomain, [], brandName, businessSummary);
    } catch {
      // Non-fatal
    }

    // Step 4: Calculate visibility score
    const scoring = calculateVisibilityScore(results, 3); // Always normalize by 3 platforms attempted
    const visibilityScore = scoring.score;

    const mentionedCount = results.filter(r => r.mentionedYou).length;
    const isInvisible = mentionedCount === 0;

    // Per-platform scores (0-100 each) — aligned with overall scoring weights
    const platformScores: Record<string, number> = {};
    for (const r of results) {
      let ps = 0;
      // Citation presence (0-40): matches overall Factor 1
      if (r.inCitations) ps += 40;
      // Domain visibility (0-25): matches overall Factor 2
      if (r.domainFound) ps += 25;
      // Brand recognition (0-15): matches overall Factor 3
      else if (r.mentionedYou) ps += 15;
      // Mention prominence (0-12): matches overall Factor 4
      if (r.mentionPosition >= 0 && r.mentionedYou) {
        ps += Math.round(12 * (1 - r.mentionPosition));
      }
      // Mention depth (0-8): matches overall Factor 5
      if (r.mentionedYou) {
        ps += Math.min(8, Math.round(8 * (1 - Math.exp(-r.mentionCount / 3))));
      }
      platformScores[r.platform] = Math.min(100, ps);
    }

    const summary = {
      totalQueries: results.length,
      mentionedCount,
      isInvisible,
      visibilityScore,
      platformScores,
      scoreBreakdown: scoring.factors,
      scoreExplanation: scoring.explanation,
      businessSummary,
      message: visibilityScore < 15
        ? "AI doesn't know your brand yet. You need to build your presence."
        : visibilityScore < 40
          ? "AI has limited awareness of your brand. There's room to grow."
          : visibilityScore < 60
            ? "AI recognizes you but doesn't consistently cite you yet."
            : "AI actively recommends you. Keep building on this momentum.",
      ...(platformErrors.length > 0 && {
        platformsChecked: results.length,
        platformErrors,
      }),
    };

    // Save to DB for shareable URL (non-fatal)
    let reportId: string | null = null;
    try {
      const [inserted] = await db.insert(teaserReports).values({
        domain: cleanDomain,
        visibilityScore,
        isInvisible,
        competitorsMentioned: [],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        results: results as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        summary: summary as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        contentPreview: contentPreview as any,
      }).returning({ id: teaserReports.id });
      reportId = inserted.id;
    } catch (err) {
      console.error("[Teaser] Failed to save report:", err);
    }

    // Log AI recommendations (non-blocking)
    const recEntries = extractTeaserRecommendations(cleanDomain, results);
    logRecommendations(recEntries).catch(() => {});

    // Upsell: push free scan users toward the full platform
    const upgrade = {
      message: visibilityScore < 40
        ? "Your brand is invisible to AI. CabbageSEO finds every gap and generates the pages to fix it."
        : visibilityScore < 60
          ? "AI knows you but doesn't cite you consistently. CabbageSEO shows exactly what's missing."
          : "You're visible — but AI answers shift weekly. CabbageSEO monitors daily so you never lose ground.",
      cta: "Start fixing your AI visibility",
      url: `https://cabbageseo.com/signup?domain=${encodeURIComponent(cleanDomain)}`,
      dashboardUrl: `https://cabbageseo.com/dashboard`,
      pricingUrl: "https://cabbageseo.com/pricing",
      reportUrl: reportId ? `https://cabbageseo.com/report/${reportId}` : null,
      publicReportUrl: `https://cabbageseo.com/r/${cleanDomain}`,
      features: [
        "Daily automated scans across ChatGPT, Perplexity & Google AI",
        "AI-generated fix pages to close citation gaps",
        "Gap analysis showing exactly why AI ignores you",
        "Email alerts when your visibility drops",
      ],
      plans: {
        scout: { price: "$39/mo", label: "Scout — start fixing gaps" },
        command: { price: "$119/mo", label: "Command — full GEO intelligence" },
        dominate: { price: "$279/mo", label: "Dominate — maximum coverage" },
      },
    };

    return NextResponse.json({
      domain: cleanDomain,
      results,
      summary,
      reportId,
      contentPreview,
      upgrade,
    });
  } catch (error) {
    console.error("[Teaser] Error:", error);
    return NextResponse.json(
      { error: "Failed to check AI visibility" },
      { status: 500 }
    );
  }
}
