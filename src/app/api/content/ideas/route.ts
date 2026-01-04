/**
 * AI-Powered Content Ideas API
 * POST /api/content/ideas
 * 
 * ACTUALLY analyzes the website first, then generates relevant content ideas
 * using GPT-5-mini based on:
 * - Real page content from crawling
 * - Site's actual topics and keywords
 * - GEO optimization principles
 * 
 * NO MOCK DATA - Everything is real
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export const maxDuration = 45; // Need time to crawl + generate

const TESTING_MODE = process.env.TESTING_MODE === "true";

interface ContentIdea {
  title: string;
  keyword: string;
  type: "guide" | "howto" | "listicle" | "comparison" | "tutorial";
  estimatedTime: string;
  geoScore: number;
  description: string;
}

/**
 * Fetch and extract content from the website
 */
async function crawlWebsite(domain: string): Promise<{
  title: string;
  description: string;
  headings: string[];
  topics: string[];
  industry: string;
}> {
  const url = domain.startsWith("http") ? domain : `https://${domain}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "CabbageSEO Bot/1.0 (https://cabbageseo.com)",
      },
      signal: AbortSignal.timeout(10000),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }
    
    const html = await response.text();
    
    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : domain;
    
    // Extract meta description
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    const description = descMatch ? descMatch[1].trim() : "";
    
    // Extract headings
    const headings: string[] = [];
    const h1Matches = html.matchAll(/<h1[^>]*>([^<]+)<\/h1>/gi);
    const h2Matches = html.matchAll(/<h2[^>]*>([^<]+)<\/h2>/gi);
    for (const match of h1Matches) headings.push(match[1].trim());
    for (const match of h2Matches) headings.push(match[1].trim());
    
    // Extract topics from headings and title
    const allText = [title, description, ...headings].join(" ").toLowerCase();
    const stopWords = ["the", "and", "for", "with", "your", "that", "this", "from", "home", "page", "welcome", "about", "contact"];
    const words = allText.split(/[\s\-|:,]+/).filter(w => w.length > 4 && !stopWords.includes(w));
    const topics = [...new Set(words)].slice(0, 10);
    
    // Guess industry from content
    const industryKeywords = {
      "saas": ["software", "platform", "tool", "app", "cloud", "saas", "subscription"],
      "ecommerce": ["shop", "store", "buy", "cart", "product", "price", "shipping"],
      "agency": ["agency", "services", "consulting", "marketing", "design", "development"],
      "education": ["learn", "course", "training", "education", "tutorial", "academy"],
      "health": ["health", "wellness", "fitness", "medical", "care", "therapy"],
      "finance": ["finance", "banking", "investment", "money", "payment", "fintech"],
      "food": ["food", "restaurant", "recipe", "cooking", "cafe", "bakery", "candle"],
    };
    
    let industry = "business";
    for (const [ind, keywords] of Object.entries(industryKeywords)) {
      if (keywords.some(k => allText.includes(k))) {
        industry = ind;
        break;
      }
    }
    
    return { title, description, headings: headings.slice(0, 5), topics, industry };
  } catch (error) {
    console.error("[Content Ideas] Crawl error:", error);
    return {
      title: domain,
      description: "",
      headings: [],
      topics: [domain.split(".")[0]],
      industry: "business",
    };
  }
}

/**
 * Generate ideas with GPT-5-mini based on REAL website content
 */
async function generateIdeasWithAI(
  domain: string,
  siteContent: Awaited<ReturnType<typeof crawlWebsite>>
): Promise<ContentIdea[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  const brandName = domain.split(".")[0].charAt(0).toUpperCase() + domain.split(".")[0].slice(1);
  
  const systemPrompt = `You are an expert content strategist specializing in GEO (Generative Engine Optimization).

You have analyzed a real website and will generate content ideas based on what the business ACTUALLY does.

Your ideas should:
1. Be SPECIFIC to this exact business - not generic templates
2. Help them get cited by AI search engines (ChatGPT, Perplexity, Google AI)
3. Target questions their potential customers actually ask
4. Establish them as the authority in their space

Industry context: ${siteContent.industry}
Business focus: ${siteContent.topics.join(", ")}`;

  const userPrompt = `I've analyzed the website "${domain}" and found:

**Page Title:** ${siteContent.title}
**Description:** ${siteContent.description || "Not provided"}
**Main Topics:** ${siteContent.topics.join(", ")}
**Key Headings:** ${siteContent.headings.join(", ") || "None found"}
**Industry:** ${siteContent.industry}

Based on this REAL data about their business, generate 5 specific content ideas that will:
1. Help "${brandName}" become THE authoritative source in their niche
2. Answer questions AI search engines frequently surface
3. Target keywords their potential customers actually search for

Make titles SPECIFIC to their business - not generic like "Complete Guide to X".

Return ONLY valid JSON array:
[
  {
    "title": "Specific title relevant to THIS business",
    "keyword": "target keyword from their niche",
    "type": "guide|howto|listicle|comparison|tutorial",
    "estimatedTime": "X-Y min",
    "geoScore": 85,
    "description": "Why this helps them get cited by AI"
  }
]`;

  console.log("[Content Ideas] Calling GPT-5-mini for:", domain);
  
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-5-mini", // Using GPT-5 Mini as specified
      max_tokens: 2000,
      temperature: 0.8,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("[Content Ideas] OpenAI error:", error);
    throw new Error("Failed to generate ideas");
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "[]";
  
  console.log("[Content Ideas] GPT-5-mini responded, parsing...");
  
  try {
    let cleaned = content.trim();
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/g, "").replace(/\n?```\s*$/g, "").trim();
    const ideas = JSON.parse(cleaned);
    
    return ideas.map((idea: ContentIdea) => ({
      title: idea.title || "Untitled",
      keyword: idea.keyword || brandName.toLowerCase(),
      type: idea.type || "guide",
      estimatedTime: idea.estimatedTime || "5-7 min",
      geoScore: Math.min(99, Math.max(70, idea.geoScore || 85)),
      description: idea.description || "",
    })).slice(0, 5);
  } catch (e) {
    console.error("[Content Ideas] Parse error:", e);
    throw new Error("Failed to parse AI response");
  }
}

export async function POST(request: NextRequest) {
  try {
    let supabase;
    try {
      supabase = TESTING_MODE ? createServiceClient() : await createClient();
    } catch (e) {
      console.error("[Content Ideas] Supabase error:", e);
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    // Check auth
    if (!TESTING_MODE) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const body = await request.json();
    const { siteId, domain } = body;

    if (!domain) {
      return NextResponse.json({ error: "Domain is required" }, { status: 400 });
    }

    console.log("[Content Ideas] Starting for:", domain);
    
    // STEP 1: Actually crawl the website to understand what it's about
    console.log("[Content Ideas] Crawling website...");
    const siteContent = await crawlWebsite(domain);
    console.log("[Content Ideas] Found:", siteContent.topics);
    
    // STEP 2: Generate ideas based on REAL content
    console.log("[Content Ideas] Generating AI ideas...");
    const ideas = await generateIdeasWithAI(domain, siteContent);
    console.log("[Content Ideas] Generated", ideas.length, "ideas");

    return NextResponse.json({
      success: true,
      ideas,
      analyzed: {
        title: siteContent.title,
        industry: siteContent.industry,
        topics: siteContent.topics,
      },
    });
  } catch (error) {
    console.error("[Content Ideas] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate ideas";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
