import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { requireSubscription } from "@/lib/api/require-subscription";
import { requireUsageLimit, incrementUsage } from "@/lib/api/check-usage";

// Shorter timeout for content generation
export const maxDuration = 30;

const TESTING_MODE = process.env.TESTING_MODE === "true";

// Helper function to call OpenAI with timeout
async function callOpenAI(prompt: string, systemPrompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 2000,
        temperature: 0.7,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.text();
      console.error("[OpenAI] Error response:", response.status, errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("AI generation timed out - please try again");
    }
    throw error;
  }
}

export async function POST(request: NextRequest) {
  console.log("[Content Generate] Starting request");
  
  // Check if OpenAI is configured
  if (!process.env.OPENAI_API_KEY) {
    console.error("[Content Generate] OPENAI_API_KEY not configured");
    return NextResponse.json({ 
      error: "AI service not configured. Please add OPENAI_API_KEY to environment." 
    }, { status: 503 });
  }

  let supabase;
  try {
    supabase = TESTING_MODE ? createServiceClient() : await createClient();
  } catch (e) {
    console.error("[Content Generate] Supabase error:", e);
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  let organizationId: string | null = null;

  if (TESTING_MODE) {
    const { data: orgs } = await supabase.from("organizations").select("id").limit(1);
    organizationId = (orgs?.[0] as { id: string } | undefined)?.id || null;
  } else {
    const authCheck = await requireSubscription(supabase);
    if (!authCheck.authorized) {
      return authCheck.error!;
    }
    organizationId = authCheck.organizationId!;
  }

  if (!organizationId) {
    return NextResponse.json({ error: "No organization found" }, { status: 400 });
  }

  // Get user's plan for usage limits
  const { data: orgData } = await supabase
    .from("organizations")
    .select("plan")
    .eq("id", organizationId)
    .single();
  const plan = (orgData as { plan?: string } | null)?.plan || "starter";

  // Check usage limits (skip in testing mode for now)
  if (!TESTING_MODE) {
    const usageCheck = await requireUsageLimit(supabase, organizationId, plan, "articles");
    if (!usageCheck.allowed) {
      return NextResponse.json({
        error: usageCheck.error.message,
        code: usageCheck.error.code,
        usage: { current: usageCheck.error.current, limit: usageCheck.error.limit },
        upgradeUrl: "/pricing",
      }, { status: 402 });
    }
  }

  try {
    const body = await request.json();
    const {
      siteId,
      keyword,
      title,
      contentType = "article",
      customInstructions,
      optimizationMode = "balanced",
      targetWordCount = 800,
    } = body;

    if (!keyword) {
      return NextResponse.json({ error: "Keyword is required" }, { status: 400 });
    }

    const articleTitle = title || `The Complete Guide to ${keyword}`;
    console.log("[Content Generate] Generating for:", articleTitle);

    // Enhanced system prompt for AIO-optimized content with fact-checking and citations
    const systemPrompt = `You are an expert SEO and AIO content writer. Create comprehensive, well-researched content that:

1. Is optimized for AI visibility (ChatGPT, Perplexity, Google AI Overviews)
2. Includes verifiable facts with source citations
3. Uses clear definitions ("X is...")
4. Contains quotable snippets (50-150 words)
5. Has FAQ schema-ready Q&A sections
6. Targets ${targetWordCount} words

Always respond with valid JSON only, no markdown code blocks.`;

    const userPrompt = `Write a comprehensive article titled "${articleTitle}" about "${keyword}".

${customInstructions ? `Custom instructions: ${customInstructions}` : ""}

Requirements:
- Start with a direct answer to "What is ${keyword}?" in the first paragraph
- Include at least 5 FAQs with detailed answers
- Add 5-7 key takeaways
- Include statistics with sources (cite year and organization)
- Write quotable paragraphs AI can cite (50-150 words each)
- Use clear H2/H3 structure for AI parsing
- Add definitions for key terms
- ${optimizationMode === "aio" ? "Heavily optimize for AI citation" : "Balance SEO and AIO optimization"}

Respond with ONLY this JSON structure (no markdown code blocks):
{
  "title": "${articleTitle}",
  "metaTitle": "max 60 chars title with keyword",
  "metaDescription": "max 155 chars compelling description",
  "content": "Full article in markdown with ## headings, lists, and **bold** for important terms",
  "faqs": [
    {"question": "What is ${keyword}?", "answer": "Detailed answer..."},
    {"question": "Why is ${keyword} important?", "answer": "Detailed answer..."},
    {"question": "How do I get started with ${keyword}?", "answer": "Detailed answer..."},
    {"question": "What are common mistakes with ${keyword}?", "answer": "Detailed answer..."},
    {"question": "Additional question?", "answer": "Detailed answer..."}
  ],
  "keyTakeaways": ["Key point 1", "Key point 2", "Key point 3", "Key point 4", "Key point 5"],
  "statistics": [
    {"stat": "X% of users...", "source": "Source Name, 2024"}
  ],
  "sources": ["Source 1", "Source 2"]
}`;

    console.log("[Content Generate] Calling OpenAI...");
    
    const rawContent = await callOpenAI(userPrompt, systemPrompt);

    console.log("[Content Generate] OpenAI responded");

    // Parse the response
    let parsedContent;
    try {
      let cleaned = rawContent.trim();
      cleaned = cleaned.replace(/^```(?:json)?\s*\n?/g, "").replace(/\n?```\s*$/g, "").trim();
      parsedContent = JSON.parse(cleaned);
    } catch (parseError) {
      console.error("[Content Generate] JSON parse error, using fallback");
      parsedContent = {
        title: articleTitle,
        metaTitle: `${articleTitle}`.slice(0, 60),
        metaDescription: `Learn about ${keyword}. Guide with tips.`.slice(0, 160),
        content: rawContent,
        faqs: [{ question: `What is ${keyword}?`, answer: `${keyword} is important for SEO.` }],
        keyTakeaways: [`Understand ${keyword}`, `Apply best practices`],
      };
    }

    const wordCount = (parsedContent.content || "").split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);
    
    // Calculate AIO-aware scores
    const hasFaqs = (parsedContent.faqs?.length || 0) >= 3;
    const hasKeyTakeaways = (parsedContent.keyTakeaways?.length || 0) >= 3;
    const hasSources = (parsedContent.sources?.length || 0) > 0;
    const hasStatistics = (parsedContent.statistics?.length || 0) > 0;
    const isLongEnough = wordCount >= 500;
    
    const seoScore = Math.min(100, 
      40 + // Base
      (hasFaqs ? 15 : 0) +
      (hasKeyTakeaways ? 10 : 0) +
      (isLongEnough ? 15 : 5) +
      (hasSources ? 10 : 0) +
      (hasStatistics ? 10 : 0)
    );
    
    const aioScore = Math.min(100,
      35 + // Base
      (hasFaqs ? 20 : 0) + // FAQs are critical for AIO
      (hasKeyTakeaways ? 15 : 0) + // Key takeaways for quotability
      (hasSources ? 15 : 0) + // Sources add credibility
      (hasStatistics ? 10 : 0) +
      (isLongEnough ? 5 : 0)
    );

    // Save to database
    if (siteId) {
      try {
        await supabase.from("content").insert({
          site_id: siteId,
          title: parsedContent.title,
          slug: parsedContent.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 100),
          body: parsedContent.content,
          meta_title: parsedContent.metaTitle,
          meta_description: parsedContent.metaDescription,
          keyword: keyword,
          word_count: wordCount,
          seo_score: seoScore,
          aio_score: aioScore,
          status: "draft",
          content_type: contentType,
          aio_optimized: optimizationMode === "aio",
        } as never);
        console.log("[Content Generate] Saved with AIO score:", aioScore);
      } catch (saveError) {
        console.warn("[Content Generate] Save failed:", saveError);
      }
    }

    // Increment usage counter
    try {
      await incrementUsage(supabase, organizationId, "articles", 1);
      console.log("[Content Generate] Usage incremented for org:", organizationId);
    } catch (usageError) {
      console.warn("[Content Generate] Failed to increment usage:", usageError);
    }

    console.log("[Content Generate] Success! Words:", wordCount, "SEO:", seoScore, "AIO:", aioScore);

    // Generate FAQ schema for the content
    const faqSchema = parsedContent.faqs?.length > 0 ? {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": parsedContent.faqs.map((faq: { question: string; answer: string }) => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }))
    } : null;

    return NextResponse.json({
      success: true,
      data: {
        title: parsedContent.title,
        metaTitle: parsedContent.metaTitle,
        metaDescription: parsedContent.metaDescription,
        body: parsedContent.content,
        wordCount,
        readingTime,
        outline: [{ level: 1, text: parsedContent.title }],
        faqs: parsedContent.faqs || [],
        keyTakeaways: parsedContent.keyTakeaways || [],
        statistics: parsedContent.statistics || [],
        sources: parsedContent.sources || [],
        seoScore,
        aioScore,
        schema: faqSchema,
        optimizationMode,
      },
    });
  } catch (error) {
    console.error("[Content Generate] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate content";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
