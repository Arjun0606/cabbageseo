/**
 * Shared scanning logic for teaser and compare endpoints.
 *
 * Extracted from /api/geo/teaser/route.ts so both the single-scan
 * and compare endpoints can reuse the same AI querying, brand
 * detection, and visibility scoring functions.
 */

import { fetchSiteContext as fetchSiteContextShared } from "@/lib/geo/site-context";

// ============================================
// TYPES
// ============================================

export interface SiteContext {
  title: string;
  description: string;
  headings: string[];
  ogData: { type?: string; siteName?: string };
}

export interface PlatformResult {
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

export interface VisibilityScoring {
  score: number;
  factors: {
    citationPresence: number;
    domainVisibility: number;
    brandRecognition: number;
    mentionProminence: number;
    mentionDepth: number;
  };
  explanation: string;
}

export interface ScanResult {
  domain: string;
  results: PlatformResult[];
  summary: {
    totalQueries: number;
    mentionedCount: number;
    isInvisible: boolean;
    visibilityScore: number;
    platformScores: Record<string, number>;
    scoreBreakdown: VisibilityScoring["factors"];
    scoreExplanation: string;
    businessSummary: string;
    message: string;
    platformsChecked?: number;
    platformErrors?: string[];
  };
  reportId: string | null;
}

// ============================================
// BRAND DETECTION
// ============================================

const TLD_PATTERN = /\.(com|io|co|ai|app|dev|org|net|so|sh|me|cc|biz|info|xyz|tech|tools|software|cloud|studio|design|agency|pro|team|run|build|gg|fm|tv|to|ly|it|is|in|us|uk|de|fr|eu|co\.uk|com\.au|co\.in)$/;

export function extractBrandName(domain: string): string {
  const cleaned = domain.replace(TLD_PATTERN, "");
  const parts = cleaned.split(".");
  const name = parts[parts.length - 1];
  if (name.includes("-") && name.length > 20) return domain;
  return name;
}

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

export function isBrandMentioned(text: string, domain: string): boolean {
  const brandName = domain.split(".")[0];
  if (!brandName || brandName.length < 2) return false;
  const escaped = brandName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (new RegExp(`\\b${escaped}\\b`, "i").test(text)) return true;
  const parts = splitBrandIntoParts(brandName.toLowerCase());
  if (parts.length >= 2) {
    const pattern = parts.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("[\\s\\-]");
    return new RegExp(`\\b${pattern}\\b`, "i").test(text);
  }
  return false;
}

function buildBrandRegex(domain: string, flags: string): RegExp | null {
  const brandName = domain.split(".")[0];
  if (!brandName || brandName.length < 2) return null;
  const escaped = brandName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = splitBrandIntoParts(brandName.toLowerCase());
  if (parts.length >= 2) {
    const pattern = parts.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("[\\s\\-]?");
    return new RegExp(`\\b${pattern}\\b`, flags);
  }
  return new RegExp(`\\b${escaped}\\b`, flags);
}

export function findMentionPosition(text: string, domain: string): number {
  const regex = buildBrandRegex(domain, "i");
  if (!regex) return -1;
  const match = regex.exec(text);
  if (!match) return -1;
  return match.index / Math.max(text.length, 1);
}

export function countMentions(text: string, domain: string): number {
  const regex = buildBrandRegex(domain, "gi");
  if (!regex) return 0;
  return (text.match(regex) || []).length;
}

// ============================================
// DOMAIN EXTRACTION
// ============================================

export function extractMentionedDomains(text: string, citations: string[] = []): string[] {
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

// ============================================
// SITE CONTEXT
// ============================================

export async function fetchSiteContext(domain: string): Promise<SiteContext> {
  return fetchSiteContextShared(domain);
}

// ============================================
// AI QUERY GENERATION
// ============================================

export async function generateSmartQueries(
  domain: string,
  siteContext: SiteContext,
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

  return {
    queries: [
      `what is ${domain}`,
      `tell me about ${brand}`,
      `${brand} reviews`,
    ],
    businessSummary: siteContext.description?.slice(0, 100) || siteContext.title || domain,
  };
}

// ============================================
// AI PLATFORM QUERIES
// ============================================

export async function queryPerplexity(query: string): Promise<{
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

export async function queryGemini(query: string): Promise<{
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

export async function queryChatGPT(query: string): Promise<{
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

// ============================================
// NEGATIVE MENTION DETECTION
// ============================================

export function isNegativeMention(text: string): boolean {
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

// ============================================
// VISIBILITY SCORING
// ============================================

export function calculateVisibilityScore(
  results: PlatformResult[],
  platformsAttempted: number = 3,
): VisibilityScoring {
  const denominator = Math.max(platformsAttempted, results.length);
  if (results.length === 0) {
    return {
      score: 0,
      factors: { citationPresence: 0, domainVisibility: 0, brandRecognition: 0, mentionProminence: 0, mentionDepth: 0 },
      explanation: "No AI platforms responded.",
    };
  }

  const citedCount = results.filter(r => r.inCitations).length;
  const citationPresence = Math.round(40 * (citedCount / denominator));

  const domainFoundCount = results.filter(r => r.domainFound).length;
  const domainVisibility = Math.round(25 * (domainFoundCount / denominator));

  const knownCount = results.filter(r => r.mentionedYou).length;
  const brandRecognition = Math.round(15 * (knownCount / denominator));

  let mentionProminence = 0;
  const mentionsWithPosition = results.filter(r => r.mentionedYou && r.mentionPosition >= 0);
  if (mentionsWithPosition.length > 0) {
    const avgPos = mentionsWithPosition.map(r => r.mentionPosition).reduce((a, b) => a + b, 0) / mentionsWithPosition.length;
    mentionProminence = Math.round(12 * (1 - avgPos));
  }

  const totalMentionCount = results
    .filter(r => r.mentionedYou)
    .reduce((sum, r) => sum + r.mentionCount, 0);
  const mentionDepth = Math.round(8 * (1 - Math.exp(-totalMentionCount / 3)));

  const score = Math.min(100, citationPresence + domainVisibility + brandRecognition + mentionProminence + mentionDepth);

  const parts: string[] = [];
  if (citedCount > 0) parts.push(`Cited as a source by ${citedCount} of ${denominator} platforms`);
  if (domainFoundCount > 0) parts.push(`Domain referenced in ${domainFoundCount} of ${denominator} responses`);
  if (knownCount > 0 && citedCount === 0 && domainFoundCount === 0) parts.push(`Brand recognized by ${knownCount} of ${denominator} platforms`);
  if (knownCount === 0) parts.push(`Not recognized by any AI platform tested`);
  if (score < 15) parts.push(`AI has no knowledge of your brand yet`);
  else if (score < 40) parts.push(`AI has limited awareness of your brand`);
  else if (score < 60) parts.push(`AI recognizes your brand but could cite you more`);

  return {
    score,
    factors: { citationPresence, domainVisibility, brandRecognition, mentionProminence, mentionDepth },
    explanation: parts.join(". ") + ".",
  };
}

// ============================================
// PER-PLATFORM SCORE CALCULATION
// ============================================

export function calculatePlatformScores(results: PlatformResult[]): Record<string, number> {
  const platformScores: Record<string, number> = {};
  for (const r of results) {
    let ps = 0;
    if (r.inCitations) ps += 40;
    if (r.domainFound) ps += 25;
    else if (r.mentionedYou) ps += 15;
    if (r.mentionPosition >= 0 && r.mentionedYou) {
      ps += Math.round(12 * (1 - r.mentionPosition));
    }
    if (r.mentionedYou) {
      ps += Math.min(8, Math.round(8 * (1 - Math.exp(-r.mentionCount / 3))));
    }
    platformScores[r.platform] = Math.min(100, ps);
  }
  return platformScores;
}

// ============================================
// FULL SCAN PIPELINE
// ============================================

/**
 * Run a full AI visibility scan for a single domain.
 * Returns platform results, scoring, and summary — but does NOT
 * save to the database or generate content previews (caller handles those).
 */
export async function runFullScan(cleanDomain: string): Promise<{
  results: PlatformResult[];
  scoring: VisibilityScoring;
  platformScores: Record<string, number>;
  businessSummary: string;
  platformErrors: string[];
}> {
  const siteContext = await fetchSiteContext(cleanDomain);
  const { queries, businessSummary } = await generateSmartQueries(cleanDomain, siteContext);

  const results: PlatformResult[] = [];
  const platformErrors: string[] = [];

  const brandQuery = queries[1];
  const discoveryQuery = queries[0];
  const decisionQuery = queries[2] || queries[0];

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

  // Process Perplexity
  {
    const pxBrand = pxBrandSettled.status === "fulfilled" ? pxBrandSettled.value : null;
    const pxDiscovery = pxDiscoverySettled.status === "fulfilled" ? pxDiscoverySettled.value : null;

    const pxResults = [pxBrand, pxDiscovery].filter((r): r is NonNullable<typeof r> => r !== null);

    if (pxResults.length > 0) {
      const processedResults = pxResults.map(r => {
        const mentioned = extractMentionedDomains(r.response, r.citations);
        const domainInResponse = mentioned.includes(cleanDomain);
        const inCitations = r.citations.some(c => {
          try { const h = new URL(c).hostname.replace(/^www\./, ""); return h === cleanDomain || h.endsWith("." + cleanDomain); } catch { return false; }
        });
        const negative = isNegativeMention(r.response);
        const brandMentioned = !negative && isBrandMentioned(r.response, cleanDomain);
        return { mentioned, domainInResponse: domainInResponse && !negative, inCitations, brandMentioned, response: r.response };
      });

      const anyFound = processedResults.some(r => r.domainInResponse || r.inCitations || r.brandMentioned);
      const anyCited = processedResults.some(r => r.inCitations);
      const allMentioned = new Set(processedResults.flatMap(r => r.mentioned));
      const positions = processedResults.map(r => findMentionPosition(r.response, cleanDomain)).filter(p => p >= 0);

      const pxDiscoveryProcessed = pxDiscovery ? processedResults[pxResults.indexOf(pxDiscovery)] : null;
      const discoveryFound = pxDiscoveryProcessed && (pxDiscoveryProcessed.domainInResponse || pxDiscoveryProcessed.inCitations || pxDiscoveryProcessed.brandMentioned);
      const showResult = discoveryFound ? pxDiscoveryProcessed! : processedResults[0];
      const showQuery = discoveryFound ? discoveryQuery : brandQuery;

      results.push({
        query: showQuery,
        platform: "perplexity",
        aiRecommends: [...allMentioned].filter(d => d !== cleanDomain).slice(0, 5),
        mentionedYou: anyFound,
        snippet: showResult.response.slice(0, 300),
        inCitations: anyCited,
        domainFound: processedResults.some(r => r.domainInResponse || r.inCitations) || anyFound,
        mentionPosition: positions.length > 0 ? Math.min(...positions) : -1,
        mentionCount: Math.max(...processedResults.map(r => countMentions(r.response, cleanDomain))),
      });
    } else {
      platformErrors.push("perplexity");
    }
  }

  // Process Gemini
  {
    const gemBrand = gemBrandSettled.status === "fulfilled" ? gemBrandSettled.value : null;
    const gemDecision = gemDecisionSettled.status === "fulfilled" ? gemDecisionSettled.value : null;
    const gemResults = [gemBrand, gemDecision].filter((r): r is NonNullable<typeof r> => r !== null);

    if (gemResults.length > 0) {
      const processedResults = gemResults.map(r => {
        const mentioned = extractMentionedDomains(r.response, r.mentions);
        const domainInResponse = mentioned.includes(cleanDomain);
        const domainInMentions = r.mentions.some(m => m === cleanDomain || m.endsWith("." + cleanDomain));
        const negative = isNegativeMention(r.response);
        const brandMentioned = !negative && isBrandMentioned(r.response, cleanDomain);
        return { mentioned, domainInResponse: domainInResponse && !negative, domainInMentions, brandMentioned, response: r.response };
      });

      const anyFound = processedResults.some(r => r.domainInResponse || r.domainInMentions || r.brandMentioned);
      const anyCited = processedResults.some(r => r.domainInMentions);
      const allMentioned = new Set(processedResults.flatMap(r => r.mentioned));
      const positions = processedResults.map(r => findMentionPosition(r.response, cleanDomain)).filter(p => p >= 0);

      const gemDecisionProcessed = gemDecision ? processedResults[gemResults.indexOf(gemDecision)] : null;
      const decisionFound = gemDecisionProcessed && (gemDecisionProcessed.domainInResponse || gemDecisionProcessed.domainInMentions || gemDecisionProcessed.brandMentioned);
      const showResult = decisionFound ? gemDecisionProcessed! : processedResults[0];
      const showQuery = decisionFound ? decisionQuery : brandQuery;

      results.push({
        query: showQuery,
        platform: "gemini",
        aiRecommends: [...allMentioned].filter(d => d !== cleanDomain).slice(0, 5),
        mentionedYou: anyFound,
        snippet: showResult.response.slice(0, 300),
        inCitations: anyCited,
        domainFound: processedResults.some(r => r.domainInResponse || r.domainInMentions) || anyFound,
        mentionPosition: positions.length > 0 ? Math.min(...positions) : -1,
        mentionCount: Math.max(...processedResults.map(r => countMentions(r.response, cleanDomain))),
      });
    } else {
      platformErrors.push("gemini");
    }
  }

  // Process ChatGPT
  {
    const gptBrand = gptBrandSettled.status === "fulfilled" ? gptBrandSettled.value : null;
    const gptDecision = gptDecisionSettled.status === "fulfilled" ? gptDecisionSettled.value : null;
    const gptResults = [gptBrand, gptDecision].filter((r): r is NonNullable<typeof r> => r !== null);

    if (gptResults.length > 0) {
      const processedResults = gptResults.map(r => {
        const mentioned = extractMentionedDomains(r.response);
        const domainInResponse = mentioned.includes(cleanDomain);
        const negative = isNegativeMention(r.response);
        const brandMentioned = !negative && isBrandMentioned(r.response, cleanDomain);
        return { mentioned, domainInResponse: domainInResponse && !negative, brandMentioned, response: r.response };
      });

      const anyFound = processedResults.some(r => r.domainInResponse || r.brandMentioned);
      const allMentioned = new Set(processedResults.flatMap(r => r.mentioned));
      const positions = processedResults.map(r => findMentionPosition(r.response, cleanDomain)).filter(p => p >= 0);

      const gptDecisionProcessed = gptDecision ? processedResults[gptResults.indexOf(gptDecision)] : null;
      const decisionFound = gptDecisionProcessed && (gptDecisionProcessed.domainInResponse || gptDecisionProcessed.brandMentioned);
      const showResult = decisionFound ? gptDecisionProcessed! : processedResults[0];
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
        mentionCount: Math.max(...processedResults.map(r => countMentions(r.response, cleanDomain))),
      });
    } else {
      platformErrors.push("chatgpt");
    }
  }

  const scoring = calculateVisibilityScore(results, 3);
  const platformScores = calculatePlatformScores(results);

  return { results, scoring, platformScores, businessSummary, platformErrors };
}

// ============================================
// DOMAIN VALIDATION
// ============================================

export function cleanDomainInput(domain: string): string {
  let cleaned = domain.trim().toLowerCase();
  cleaned = cleaned.replace(/^https?:\/\//, "");
  cleaned = cleaned.replace(/^www\./, "");
  cleaned = cleaned.split("/")[0];
  return cleaned;
}

export function isValidDomain(domain: string): boolean {
  const domainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;
  return domainRegex.test(domain) && domain.length <= 253;
}

// ============================================
// SUMMARY MESSAGE GENERATION
// ============================================

export function generateSummaryMessage(score: number): string {
  if (score < 15) return "AI doesn't know your brand yet. You need to build your presence.";
  if (score < 40) return "AI has limited awareness of your brand. There's room to grow.";
  if (score < 60) return "AI recognizes you but doesn't consistently cite you yet.";
  return "AI actively recommends you. Keep building on this momentum.";
}
