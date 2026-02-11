/**
 * Teaser API - Quick AI scan without authentication
 *
 * Queries 3 AI platforms (Perplexity, Google AI, ChatGPT) in parallel,
 * then calculates a granular visibility score using 6 weighted factors.
 *
 * No signup required - this is the hook that converts visitors.
 */

import { NextRequest, NextResponse } from "next/server";
import { db, teaserReports } from "@/lib/db";
import { generateTeaserPreview, type ContentPreviewData } from "@/lib/geo/teaser-preview-generator";
import { logRecommendations, extractTeaserRecommendations } from "@/lib/geo/recommendation-logger";

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
  // If brand name is hyphenated and long, it's probably not a real brand name
  // e.g. "best-project-management-tool" → use domain instead
  if (name.includes("-") && name.length > 20) return domain;
  return name;
}

// Use AI to classify a website's category from its title + description
async function classifyWithAI(title: string, description: string, domain: string): Promise<string | null> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) return null;
  if (!title && !description) return null;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `What product/service category does this website belong to? Respond with ONLY the category name in 1-4 words (e.g. "project management", "CRM", "restaurant", "law firm", "real estate", "fitness app", "cloud storage"). If unclear, respond "unknown".

Domain: ${domain}
Title: ${title}
Description: ${description}`
            }]
          }],
          generationConfig: { maxOutputTokens: 20 },
        }),
        signal: AbortSignal.timeout(5000),
      }
    );

    if (!res.ok) return null;

    const data = await res.json();
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toLowerCase();
    if (!answer || answer === "unknown" || answer.length > 50) return null;
    return answer;
  } catch {
    return null;
  }
}

// Fetch site homepage to extract category context for smarter queries
async function fetchSiteContext(domain: string): Promise<{
  title: string;
  description: string;
  category: string | null;
}> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(`https://${domain}`, {
      headers: {
        "User-Agent": "CabbageSEO-Bot/1.0 (GEO Analysis)",
        "Accept": "text/html",
      },
      signal: controller.signal,
      redirect: "follow",
    });

    clearTimeout(timeout);
    if (!res.ok) return { title: "", description: "", category: null };

    const html = await res.text();

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : "";

    // Extract meta description
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
                      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
    const description = descMatch ? descMatch[1].trim() : "";

    // Use AI to classify the site category (fast, ~1s with Gemini)
    const category = await classifyWithAI(title, description, domain);

    return { title, description, category };
  } catch {
    return { title: "", description: "", category: null };
  }
}

// Generate queries that test whether AI knows and recommends the brand.
// Each query targets a different intent type across platforms:
//   1. Category discovery — "best X tools" (does AI include you in recommendations?)
//   2. Brand knowledge — "what is [brand]?" (does AI know what you do?)
//   3. Recommendation intent — "should I use [brand]?" (does AI recommend you?)
function generateQueries(domain: string, category: string | null): string[] {
  const brand = extractBrandName(domain);
  const year = new Date().getFullYear();

  if (category) {
    return [
      // Perplexity — category discovery: are you in the recommendations?
      `best ${category} tools ${year}`,
      // Gemini — brand knowledge: does AI know what you are?
      `what is ${brand} and what does it do`,
      // ChatGPT — recommendation intent: would AI recommend you?
      `tell me about ${brand} for ${category}`,
    ];
  }

  return [
    // Perplexity — brand awareness: does AI know you exist?
    `what is ${domain} and what does it do`,
    // Gemini — brand knowledge: can AI describe your product?
    `tell me about ${brand}`,
    // ChatGPT — recommendation: would AI suggest you to someone?
    `is ${brand} good and should I use it`,
  ];
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
function isBrandMentioned(text: string, domain: string): boolean {
  const brandName = domain.split(".")[0];
  if (!brandName || brandName.length < 2) return false;
  const regex = new RegExp(`\\b${brandName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
  return regex.test(text);
}

// Find position of brand mention in text (0 = first, higher = later, -1 = not found)
function findMentionPosition(text: string, domain: string): number {
  const brandName = domain.split(".")[0];
  if (!brandName || brandName.length < 2) return -1;
  const regex = new RegExp(`\\b${brandName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
  const match = regex.exec(text);
  if (!match) return -1;
  // Return position as fraction of text length (0 = very start, 1 = very end)
  return match.index / Math.max(text.length, 1);
}

// Count how many times domain/brand appears in text
function countMentions(text: string, domain: string): number {
  const brandName = domain.split(".")[0];
  if (!brandName || brandName.length < 2) return 0;
  const regex = new RegExp(`\\b${brandName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
  return (text.match(regex) || []).length;
}

interface PlatformResult {
  query: string;
  platform: "perplexity" | "gemini" | "chatgpt";
  aiRecommends: string[];
  mentionedYou: boolean;
  snippet: string;
  inCitations: boolean;
  domainFound: boolean; // Full domain (e.g. "snapcommit.dev") found — strong signal
  mentionPosition: number; // 0-1 (lower = earlier), -1 = not found
  mentionCount: number;
}

/**
 * Visibility scoring across 5 factors focused on YOUR presence in AI responses.
 *
 * Factors:
 *   - Citation presence (0-40): Your domain cited as a source link
 *   - Domain visibility (0-25): Full domain (e.g. "trustmrr.com") found in text
 *   - Brand recognition (0-15): AI knows your brand name and can describe you
 *   - Mention prominence (0-12): Mentioned early in the response (not buried)
 *   - Mention depth (0-8): Multiple mentions across responses (consistent visibility)
 *
 * Score ranges:
 *   0-15: Invisible — AI doesn't know you
 *   16-39: Low visibility — AI barely recognizes you
 *   40-59: Moderate — AI knows you but doesn't consistently recommend you
 *   60-79: Good — AI regularly mentions and cites you
 *   80-100: Excellent — AI actively recommends you
 */
function calculateVisibilityScore(
  results: PlatformResult[],
): {
  score: number;
  factors: {
    citationPresence: number;    // 0-40: Domain in citation links
    domainVisibility: number;    // 0-25: Full domain in response text
    brandRecognition: number;    // 0-15: AI knows your brand
    mentionProminence: number;   // 0-12: Mentioned early
    mentionDepth: number;        // 0-8: Consistent mentions across platforms
  };
  explanation: string;
} {
  const platformCount = results.length;
  if (platformCount === 0) {
    return {
      score: 0,
      factors: { citationPresence: 0, domainVisibility: 0, brandRecognition: 0, mentionProminence: 0, mentionDepth: 0 },
      explanation: "No AI platforms responded.",
    };
  }

  // Factor 1: Citation presence (0-40) — domain in actual source citations/links
  const citedCount = results.filter(r => r.inCitations).length;
  const citationPresence = Math.round(40 * (citedCount / platformCount));

  // Factor 2: Domain visibility (0-25) — full domain found in response text
  const domainFoundCount = results.filter(r => r.domainFound).length;
  const domainVisibility = Math.round(25 * (domainFoundCount / platformCount));

  // Factor 3: Brand recognition (0-15) — AI mentions your brand at all (knows you exist)
  const knownCount = results.filter(r => r.mentionedYou).length;
  const brandRecognition = Math.round(15 * (knownCount / platformCount));

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

  // Build explanation focused on your visibility
  const parts: string[] = [];
  if (citedCount > 0) {
    parts.push(`Cited as a source by ${citedCount} of ${platformCount} platforms`);
  }
  if (domainFoundCount > 0) {
    parts.push(`Domain referenced in ${domainFoundCount} of ${platformCount} responses`);
  }
  if (knownCount > 0 && citedCount === 0 && domainFoundCount === 0) {
    parts.push(`Brand recognized by ${knownCount} of ${platformCount} platforms`);
  }
  if (knownCount === 0) {
    parts.push(`Not recognized by any AI platform tested`);
  }
  // Add actionable context
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

    const brandName = extractBrandName(cleanDomain);

    // Fetch site context for smarter queries (runs in parallel, 5s timeout)
    const siteContext = await fetchSiteContext(cleanDomain);
    const queries = generateQueries(cleanDomain, siteContext.category);

    const results: PlatformResult[] = [];
    const platformErrors: string[] = [];

    // Run ALL 3 platforms in parallel
    const [perplexitySettled, geminiSettled, chatgptSettled] = await Promise.allSettled([
      queryPerplexity(queries[0]),
      queryGemini(queries[1]),
      queryChatGPT(queries[2]),
    ]);

    // Process Perplexity result
    if (perplexitySettled.status === "fulfilled") {
      const r = perplexitySettled.value;
      const mentioned = extractMentionedDomains(r.response, r.citations);
      const domainInResponse = mentioned.includes(cleanDomain);
      const inCitations = r.citations.some(c => {
        try {
          const h = new URL(c).hostname.replace(/^www\./, "");
          return h === cleanDomain || h.endsWith("." + cleanDomain);
        } catch { return false; }
      });
      results.push({
        query: queries[0],
        platform: "perplexity",
        aiRecommends: mentioned.filter(d => d !== cleanDomain).slice(0, 5),
        mentionedYou: domainInResponse || inCitations || isBrandMentioned(r.response, cleanDomain),
        snippet: r.response.slice(0, 300),
        inCitations,
        domainFound: domainInResponse || inCitations,
        mentionPosition: findMentionPosition(r.response, cleanDomain),
        mentionCount: countMentions(r.response, cleanDomain),
      });
    } else {
      console.error("[Teaser] Perplexity failed");
      platformErrors.push("perplexity");
    }

    // Process Gemini result
    if (geminiSettled.status === "fulfilled") {
      const r = geminiSettled.value;
      const mentioned = extractMentionedDomains(r.response, r.mentions);
      const domainInResponse = mentioned.includes(cleanDomain);
      const domainInMentions = r.mentions.some(m => m === cleanDomain || m.endsWith("." + cleanDomain));
      results.push({
        query: queries[1],
        platform: "gemini",
        aiRecommends: mentioned.filter(d => d !== cleanDomain).slice(0, 5),
        mentionedYou: domainInResponse || domainInMentions || isBrandMentioned(r.response, cleanDomain),
        snippet: r.response.slice(0, 300),
        inCitations: domainInMentions,
        domainFound: domainInResponse || domainInMentions,
        mentionPosition: findMentionPosition(r.response, cleanDomain),
        mentionCount: countMentions(r.response, cleanDomain),
      });
    } else {
      console.error("[Teaser] Gemini failed");
      platformErrors.push("gemini");
    }

    // Process ChatGPT result
    if (chatgptSettled.status === "fulfilled") {
      const r = chatgptSettled.value;
      const mentioned = extractMentionedDomains(r.response);
      const domainInResponse = mentioned.includes(cleanDomain);
      results.push({
        query: queries[2],
        platform: "chatgpt",
        aiRecommends: mentioned.filter(d => d !== cleanDomain).slice(0, 5),
        mentionedYou: domainInResponse || isBrandMentioned(r.response, cleanDomain),
        snippet: r.response.slice(0, 300),
        inCitations: false, // ChatGPT doesn't provide citation sources
        domainFound: domainInResponse,
        mentionPosition: findMentionPosition(r.response, cleanDomain),
        mentionCount: countMentions(r.response, cleanDomain),
      });
    } else {
      console.error("[Teaser] ChatGPT failed");
      platformErrors.push("chatgpt");
    }

    // Generate content preview if we have results
    let contentPreview: ContentPreviewData | null = null;
    try {
      contentPreview = await generateTeaserPreview(cleanDomain, [], brandName);
    } catch {
      // Non-fatal
    }

    // Calculate visibility score (focused on YOUR presence, not others)
    const scoring = calculateVisibilityScore(results);
    const visibilityScore = scoring.score;

    const mentionedCount = results.filter(r => r.mentionedYou).length;
    const isInvisible = mentionedCount === 0;

    // Per-platform scores (0-100 each) — how visible are you on each platform
    const platformScores: Record<string, number> = {};
    for (const r of results) {
      let ps = 0;
      if (r.inCitations) {
        ps += 45;  // Cited as a source — strongest signal
      } else if (r.domainFound) {
        ps += 30;  // Full domain mentioned — strong signal
      } else if (r.mentionedYou) {
        ps += 15;  // Brand recognized
      }
      // Position bonus — mentioned early = more prominent
      if (r.mentionPosition >= 0 && r.mentionedYou) {
        ps += Math.round(25 * (1 - r.mentionPosition));
      }
      // Depth bonus — mentioned multiple times = strong knowledge
      if (r.mentionedYou) {
        ps += Math.min(15, r.mentionCount * 5);
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

    return NextResponse.json({
      domain: cleanDomain,
      results,
      summary,
      reportId,
      contentPreview,
    });
  } catch (error) {
    console.error("[Teaser] Error:", error);
    return NextResponse.json(
      { error: "Failed to check AI visibility" },
      { status: 500 }
    );
  }
}
