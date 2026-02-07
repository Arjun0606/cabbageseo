/**
 * Teaser API - Quick AI scan without authentication
 * 
 * This endpoint provides a "gut punch" moment by showing
 * users whether AI recommends them or their competitors.
 * 
 * No signup required - this is the hook that converts visitors.
 */

import { NextRequest, NextResponse } from "next/server";

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
  // Extract likely category from domain
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
  if (!apiKey) {
    throw new Error("Perplexity API not configured");
  }

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
          role: "user",
          content: query,
        },
      ],
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("[Teaser] Perplexity error:", error);
    throw new Error("Perplexity API error");
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";
  const citations = data.citations || [];

  return { response: content, citations };
}

// Query Google AI (Gemini)
async function queryGemini(query: string): Promise<{
  response: string;
  mentions: string[];
}> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("Google AI API not configured");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: query,
              },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: 500,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("[Teaser] Gemini error:", error);
    throw new Error("Google AI API error");
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

  // Extract mentioned domains/products from response
  const mentions: string[] = [];
  const domainRegex = /\b([a-z0-9-]+\.(com|io|co|ai|app|dev|org|net))\b/gi;
  let match;
  while ((match = domainRegex.exec(content)) !== null) {
    mentions.push(match[1].toLowerCase());
  }

  return { response: content, mentions };
}

// Extract domains mentioned in a response
function extractMentionedDomains(text: string, citations: string[] = []): string[] {
  const domains = new Set<string>();
  
  // Extract from citations
  for (const citation of citations) {
    try {
      const url = new URL(citation);
      domains.add(url.hostname.replace(/^www\./, ""));
    } catch {
      // Not a valid URL
    }
  }
  
  // Extract from text
  const domainRegex = /\b([a-z0-9-]+\.(com|io|co|ai|app|dev|org|net))\b/gi;
  let match;
  while ((match = domainRegex.exec(text)) !== null) {
    domains.add(match[1].toLowerCase());
  }
  
  // Also look for common product names
  const products = [
    { name: "notion", domain: "notion.so" },
    { name: "clickup", domain: "clickup.com" },
    { name: "asana", domain: "asana.com" },
    { name: "trello", domain: "trello.com" },
    { name: "monday", domain: "monday.com" },
    { name: "airtable", domain: "airtable.com" },
    { name: "hubspot", domain: "hubspot.com" },
    { name: "salesforce", domain: "salesforce.com" },
    { name: "pipedrive", domain: "pipedrive.com" },
    { name: "zoho", domain: "zoho.com" },
    { name: "slack", domain: "slack.com" },
    { name: "discord", domain: "discord.com" },
    { name: "figma", domain: "figma.com" },
    { name: "canva", domain: "canva.com" },
    { name: "stripe", domain: "stripe.com" },
    { name: "shopify", domain: "shopify.com" },
  ];
  
  const textLower = text.toLowerCase();
  for (const product of products) {
    if (textLower.includes(product.name)) {
      domains.add(product.domain);
    }
  }
  
  return Array.from(domains);
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
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

    // Generate queries
    const queries = generateQueries(cleanDomain);
    
    // Run queries in parallel (but limit to save API costs)
    const results: Array<{
      query: string;
      platform: "perplexity" | "gemini";
      aiRecommends: string[];
      mentionedYou: boolean;
      snippet: string;
    }> = [];

    // Track which platforms succeeded
    const platformErrors: string[] = [];

    // Query Perplexity (one query)
    try {
      const perplexityResult = await queryPerplexity(queries[0]);
      const mentioned = extractMentionedDomains(perplexityResult.response, perplexityResult.citations);
      results.push({
        query: queries[0],
        platform: "perplexity",
        aiRecommends: mentioned.filter(d => d !== cleanDomain).slice(0, 5),
        mentionedYou: mentioned.includes(cleanDomain) || perplexityResult.response.toLowerCase().includes(cleanDomain.split(".")[0]),
        snippet: perplexityResult.response.slice(0, 300),
      });
    } catch (error) {
      console.error("[Teaser] Perplexity error:", error);
      platformErrors.push("perplexity");
    }

    // Query Gemini (one query)
    try {
      const geminiResult = await queryGemini(queries[1]);
      const mentioned = extractMentionedDomains(geminiResult.response, geminiResult.mentions);
      results.push({
        query: queries[1],
        platform: "gemini",
        aiRecommends: mentioned.filter(d => d !== cleanDomain).slice(0, 5),
        mentionedYou: mentioned.includes(cleanDomain) || geminiResult.response.toLowerCase().includes(cleanDomain.split(".")[0]),
        snippet: geminiResult.response.slice(0, 300),
      });
    } catch (error) {
      console.error("[Teaser] Gemini error:", error);
      platformErrors.push("gemini");
    }

    // Calculate summary
    const totalQueries = results.length;
    const mentionedCount = results.filter(r => r.mentionedYou).length;
    const isInvisible = mentionedCount === 0;
    
    // Get unique competitors mentioned
    const allCompetitors = new Set<string>();
    results.forEach(r => r.aiRecommends.forEach(c => allCompetitors.add(c)));

    return NextResponse.json({
      domain: cleanDomain,
      results,
      summary: {
        totalQueries,
        mentionedCount,
        isInvisible,
        competitorsMentioned: Array.from(allCompetitors).slice(0, 10),
        message: isInvisible 
          ? "You are invisible to AI search."
          : mentionedCount < totalQueries
            ? "AI sometimes recommends you, but competitors get more visibility."
            : "AI is recommending you!",
        // Include info about any platform failures
        ...(platformErrors.length > 0 && {
          platformsChecked: results.length,
          platformErrors,
        }),
      },
    });
  } catch (error) {
    console.error("[Teaser] Error:", error);
    return NextResponse.json(
      { error: "Failed to check AI visibility" },
      { status: 500 }
    );
  }
}

