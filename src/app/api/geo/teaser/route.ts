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

// Generate queries based on domain/category
function generateQueries(domain: string): string[] {
  const domainParts = domain.replace(/\.(com|io|co|ai|app|dev|org|net)$/, "").split(".");
  const brandName = domainParts[domainParts.length - 1];

  return [
    `best ${brandName} alternatives`,
    `what is the best tool like ${brandName}`,
    `top software similar to ${brandName}`,
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
  const domainRegex = /\b([a-z0-9-]+\.(com|io|co|ai|app|dev|org|net))\b/gi;
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
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: query }],
      max_tokens: 500,
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

  const domainRegex = /\b([a-z0-9-]+\.(com|io|co|ai|app|dev|org|net))\b/gi;
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
  mentionPosition: number; // 0-1 (lower = earlier), -1 = not found
  mentionCount: number;
}

/**
 * Granular visibility scoring across 6 factors.
 * Each factor maps to a real, measurable signal from the AI responses.
 * Total: 0-100 with continuous values (e.g. 17, 34, 47, 63, 82).
 */
function calculateVisibilityScore(
  results: PlatformResult[],
  competitorCount: number,
): {
  score: number;
  factors: {
    domainMentioned: number;    // 0-30: Were you mentioned at all?
    inCitations: number;        // 0-20: Were you in official citations?
    positionBonus: number;      // 0-15: Were you mentioned early/prominently?
    competitorDensity: number;  // 0-15: How crowded is the field?
    mentionDepth: number;       // 0-10: How detailed were mentions?
    brandRecognition: number;   // 0-10: Did multiple platforms recognize you?
  };
  explanation: string;
} {
  const platformCount = results.length;
  if (platformCount === 0) {
    return {
      score: 0,
      factors: { domainMentioned: 0, inCitations: 0, positionBonus: 0, competitorDensity: 0, mentionDepth: 0, brandRecognition: 0 },
      explanation: "No AI platforms responded.",
    };
  }

  const mentionedResults = results.filter(r => r.mentionedYou);
  const mentionedCount = mentionedResults.length;
  const citedResults = results.filter(r => r.inCitations);

  // Factor 1: Domain Mentioned (0-30)
  // Smooth curve: 0 platforms = 0, 1 = 12, 2 = 22, 3 = 30
  const mentionRatio = mentionedCount / platformCount;
  const domainMentioned = Math.round(30 * (1 - Math.exp(-2.5 * mentionRatio)));

  // Factor 2: In Citations (0-20)
  // Being in actual citation lists/sources is a stronger signal
  const citationRatio = citedResults.length / platformCount;
  const inCitations = Math.round(20 * citationRatio);

  // Factor 3: Position Bonus (0-15)
  // Earlier mentions = more prominent. Average position across platforms.
  let positionBonus = 0;
  const validPositions = mentionedResults.map(r => r.mentionPosition).filter(p => p >= 0);
  if (validPositions.length > 0) {
    const avgPosition = validPositions.reduce((a, b) => a + b, 0) / validPositions.length;
    // Position 0 (top) = 15 points, position 0.5 (middle) = 7.5, position 1 (bottom) = 0
    positionBonus = Math.round(15 * (1 - avgPosition));
  }

  // Factor 4: Competitor Density (0-15)
  // Fewer competitors recommended = less crowded = better for you
  // 0 competitors = 15 (you're the only one!), 10+ = 2 (very crowded)
  const competitorDensity = Math.round(15 * Math.exp(-competitorCount / 4));

  // Factor 5: Mention Depth (0-10)
  // More mentions = deeper coverage. Sum across platforms.
  const totalMentions = results.reduce((sum, r) => sum + r.mentionCount, 0);
  // 0 mentions = 0, 1 = 4, 3 = 7, 5 = 9, 8+ = 10
  const mentionDepth = Math.round(10 * (1 - Math.exp(-totalMentions / 3)));

  // Factor 6: Brand Recognition (0-10)
  // How many platforms independently recognized the brand?
  // 0/3 = 0, 1/3 = 3, 2/3 = 7, 3/3 = 10
  const recognitionRatio = mentionedCount / platformCount;
  const brandRecognition = Math.round(10 * Math.pow(recognitionRatio, 0.7));

  const score = Math.min(100, domainMentioned + inCitations + positionBonus + competitorDensity + mentionDepth + brandRecognition);

  // Build explanation
  const parts: string[] = [];
  if (mentionedCount === 0) {
    parts.push(`Not mentioned by any of ${platformCount} AI platforms`);
  } else {
    parts.push(`Mentioned by ${mentionedCount}/${platformCount} platforms`);
  }
  if (citedResults.length > 0) {
    parts.push(`cited as a source by ${citedResults.length}`);
  }
  if (competitorCount > 0) {
    parts.push(`${competitorCount} competitor${competitorCount !== 1 ? "s" : ""} also recommended`);
  }

  return {
    score,
    factors: { domainMentioned, inCitations, positionBonus, competitorDensity, mentionDepth, brandRecognition },
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

    const queries = generateQueries(cleanDomain);
    const brandName = cleanDomain.replace(/\.(com|io|co|ai|app|dev|org|net)$/, "");

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
      const inCitations = r.citations.some(c => {
        try { return new URL(c).hostname.replace(/^www\./, "").includes(cleanDomain); } catch { return false; }
      });
      results.push({
        query: queries[0],
        platform: "perplexity",
        aiRecommends: mentioned.filter(d => d !== cleanDomain).slice(0, 5),
        mentionedYou: mentioned.includes(cleanDomain) || isBrandMentioned(r.response, cleanDomain),
        snippet: r.response.slice(0, 300),
        inCitations,
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
      results.push({
        query: queries[1],
        platform: "gemini",
        aiRecommends: mentioned.filter(d => d !== cleanDomain).slice(0, 5),
        mentionedYou: mentioned.includes(cleanDomain) || isBrandMentioned(r.response, cleanDomain),
        snippet: r.response.slice(0, 300),
        inCitations: r.mentions.some(m => m.includes(cleanDomain)),
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
      results.push({
        query: queries[2],
        platform: "chatgpt",
        aiRecommends: mentioned.filter(d => d !== cleanDomain).slice(0, 5),
        mentionedYou: mentioned.includes(cleanDomain) || isBrandMentioned(r.response, cleanDomain),
        snippet: r.response.slice(0, 300),
        inCitations: false, // ChatGPT doesn't provide citation sources
        mentionPosition: findMentionPosition(r.response, cleanDomain),
        mentionCount: countMentions(r.response, cleanDomain),
      });
    } else {
      console.error("[Teaser] ChatGPT failed");
      platformErrors.push("chatgpt");
    }

    // Generate content preview in parallel if we have competitor data
    const earlyCompetitors = results.flatMap(r => r.aiRecommends);
    let contentPreview: ContentPreviewData | null = null;
    if (earlyCompetitors.length > 0) {
      try {
        contentPreview = await generateTeaserPreview(cleanDomain, earlyCompetitors, brandName);
      } catch {
        // Non-fatal
      }
    }

    // Get unique competitors
    const allCompetitors = new Set<string>();
    results.forEach(r => r.aiRecommends.forEach(c => allCompetitors.add(c)));
    const competitorsMentioned = Array.from(allCompetitors).slice(0, 10);

    // Calculate granular visibility score
    const scoring = calculateVisibilityScore(results, competitorsMentioned.length);
    const visibilityScore = scoring.score;

    const mentionedCount = results.filter(r => r.mentionedYou).length;
    const isInvisible = mentionedCount === 0;

    // Per-platform scores (0-100 each)
    const platformScores: Record<string, number> = {};
    for (const r of results) {
      let ps = 0;
      if (r.mentionedYou) ps += 40;
      if (r.inCitations) ps += 25;
      if (r.mentionPosition >= 0) ps += Math.round(20 * (1 - r.mentionPosition));
      ps += Math.min(15, r.mentionCount * 5);
      platformScores[r.platform] = Math.min(100, ps);
    }

    const summary = {
      totalQueries: results.length,
      mentionedCount,
      isInvisible,
      competitorsMentioned,
      visibilityScore,
      platformScores,
      scoreBreakdown: scoring.factors,
      scoreExplanation: scoring.explanation,
      message: isInvisible
        ? "You are invisible to AI search."
        : mentionedCount < results.length
          ? "AI sometimes recommends you, but competitors get more visibility."
          : "AI is recommending you!",
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
        competitorsMentioned,
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
