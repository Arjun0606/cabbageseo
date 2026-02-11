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

// Generate diverse queries optimized for each platform's strengths
function generateQueries(domain: string, category: string | null): string[] {
  const brand = extractBrandName(domain);
  const year = new Date().getFullYear();

  if (category) {
    return [
      // Perplexity — broad buyer intent in category
      `best ${category} ${year}`,
      // Gemini — brand in category context with comparison intent
      `is ${brand} a good ${category} option or are there better alternatives`,
      // ChatGPT — direct recommendation ask
      `what ${category} should I use in ${year}`,
    ];
  }

  return [
    // Perplexity (web search + citations) — buyer comparison intent
    `best alternatives to ${brand} ${year}`,
    // Gemini (search grounding) — direct brand knowledge
    `what is ${domain} and what are the best alternatives`,
    // ChatGPT (knowledge base) — recommendation/evaluation intent
    `should I use ${brand} or is there a better option`,
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
 * Honest visibility scoring across 6 factors.
 *
 * Key insight: queries contain the brand name (e.g. "best snapcommit alternatives"),
 * so AI will echo the name in its response. This is NOT a recommendation — it's just
 * acknowledging the query. We must distinguish:
 *
 *   - Citation: domain in actual source links → strongest signal (40 pts)
 *   - Domain found: full domain (e.g. "snapcommit.dev") in text → strong signal (25 pts)
 *   - Brand echo: brand name in text but no domain/citation → near-worthless (8 pts)
 *
 * Unknown brands with no marketing should score 5-15.
 * Known brands should score 40-70.
 * Dominant brands should score 70-95.
 */
function calculateVisibilityScore(
  results: PlatformResult[],
  otherBrandCount: number,
): {
  score: number;
  factors: {
    citationPresence: number;    // 0-40: Domain in citation links
    domainVisibility: number;    // 0-25: Full domain in response text
    brandEcho: number;           // 0-8: Brand name only (likely query echo)
    positionBonus: number;       // 0-12: Mentioned early (genuine only)
    mentionDepth: number;        // 0-10: Multiple genuine mentions
    competitorDensity: number;   // 0-5: Market crowding (kept for API compat)
  };
  explanation: string;
} {
  const platformCount = results.length;
  if (platformCount === 0) {
    return {
      score: 0,
      factors: { citationPresence: 0, domainVisibility: 0, brandEcho: 0, positionBonus: 0, mentionDepth: 0, competitorDensity: 0 },
      explanation: "No AI platforms responded.",
    };
  }

  // Tier 1: Citation presence (0-40) — domain in actual source citations/links
  const citedCount = results.filter(r => r.inCitations).length;
  const citationPresence = Math.round(40 * (citedCount / platformCount));

  // Tier 2: Domain visibility (0-25) — full domain found in response text
  const domainFoundCount = results.filter(r => r.domainFound).length;
  const domainVisibility = Math.round(25 * (domainFoundCount / platformCount));

  // Tier 3: Brand echo (0-8) — brand name in text but no domain/citation
  // This is nearly worthless because AI echoes the brand from the query
  const brandOnlyCount = results.filter(r => r.mentionedYou && !r.domainFound && !r.inCitations).length;
  const brandEcho = Math.round(8 * (brandOnlyCount / platformCount));

  // Tier 4: Position bonus (0-12) — only for genuine mentions (domain or citation)
  let positionBonus = 0;
  const genuineMentions = results.filter(r => r.domainFound || r.inCitations);
  if (genuineMentions.length > 0) {
    const positions = genuineMentions.map(r => r.mentionPosition).filter(p => p >= 0);
    if (positions.length > 0) {
      const avgPos = positions.reduce((a, b) => a + b, 0) / positions.length;
      positionBonus = Math.round(12 * (1 - avgPos));
    }
  }

  // Tier 5: Mention depth (0-10) — multiple genuine mentions only
  const genuineMentionCount = results
    .filter(r => r.domainFound || r.inCitations)
    .reduce((sum, r) => sum + r.mentionCount, 0);
  const mentionDepth = Math.round(10 * (1 - Math.exp(-genuineMentionCount / 3)));

  // Tier 6: Market density (0-5) — fewer other brands = less crowded
  const competitorDensity = Math.round(5 * Math.exp(-otherBrandCount / 4));

  const score = Math.min(100, citationPresence + domainVisibility + brandEcho + positionBonus + mentionDepth + competitorDensity);

  // Build honest explanation
  const parts: string[] = [];
  if (citedCount > 0) {
    parts.push(`Cited as a source by ${citedCount}/${platformCount} platforms`);
  }
  if (domainFoundCount > 0) {
    parts.push(`Domain found in ${domainFoundCount}/${platformCount} responses`);
  }
  if (brandOnlyCount > 0 && citedCount === 0 && domainFoundCount === 0) {
    parts.push(`Brand name echoed by ${brandOnlyCount} platform${brandOnlyCount !== 1 ? "s" : ""} (from your query, not a genuine recommendation)`);
  }
  if (citedCount === 0 && domainFoundCount === 0 && brandOnlyCount === 0) {
    parts.push(`Not found by any AI platform`);
  }
  if (otherBrandCount > 0) {
    parts.push(`${otherBrandCount} other brand${otherBrandCount !== 1 ? "s" : ""} recommended`);
  }

  return {
    score,
    factors: { citationPresence, domainVisibility, brandEcho, positionBonus, mentionDepth, competitorDensity },
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

    // Generate content preview in parallel if we have brand data
    const detectedBrands = results.flatMap(r => r.aiRecommends);
    let contentPreview: ContentPreviewData | null = null;
    if (detectedBrands.length > 0) {
      try {
        contentPreview = await generateTeaserPreview(cleanDomain, detectedBrands, brandName);
      } catch {
        // Non-fatal
      }
    }

    // Get unique brands AI recommends
    const allBrands = new Set<string>();
    results.forEach(r => r.aiRecommends.forEach(c => allBrands.add(c)));
    const competitorsMentioned = Array.from(allBrands).slice(0, 10);

    // Calculate granular visibility score
    const scoring = calculateVisibilityScore(results, competitorsMentioned.length);
    const visibilityScore = scoring.score;

    const mentionedCount = results.filter(r => r.mentionedYou).length;
    // "Invisible" = no genuine mentions (domain/citations). Brand echoes don't count.
    const genuinelyMentioned = results.filter(r => r.domainFound || r.inCitations).length;
    const isInvisible = genuinelyMentioned === 0;

    // Per-platform scores (0-100 each) — weighted by signal strength
    const platformScores: Record<string, number> = {};
    for (const r of results) {
      let ps = 0;
      if (r.inCitations) {
        ps += 45;  // Cited as a source — strongest signal
      } else if (r.domainFound) {
        ps += 30;  // Full domain mentioned — strong signal
      } else if (r.mentionedYou) {
        ps += 10;  // Brand name only — likely echoing the query
      }
      // Position & depth bonuses only for genuine mentions
      if (r.mentionPosition >= 0 && (r.domainFound || r.inCitations)) {
        ps += Math.round(20 * (1 - r.mentionPosition));
      }
      if (r.domainFound || r.inCitations) {
        ps += Math.min(15, r.mentionCount * 5);
      }
      platformScores[r.platform] = Math.min(100, ps);
    }

    const summary = {
      totalQueries: results.length,
      mentionedCount,
      isInvisible,
      competitorsMentioned,
      brandsDetected: competitorsMentioned,
      visibilityScore,
      platformScores,
      scoreBreakdown: scoring.factors,
      scoreExplanation: scoring.explanation,
      message: visibilityScore < 15
        ? "You are invisible to AI. Brand echoes from your query don't count as recommendations."
        : visibilityScore < 40
          ? "AI barely knows you. You need more citations and domain references."
          : visibilityScore < 60
            ? "AI sometimes mentions you, but competitors may still be winning."
            : "AI recommends you — focus on maintaining and growing your visibility.",
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
