import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { requireSubscription } from "@/lib/api/require-subscription";
import Anthropic from "@anthropic-ai/sdk";

// Extend timeout for content generation
export const maxDuration = 120;

const TESTING_MODE = process.env.TESTING_MODE === "true";

// Initialize Anthropic client
const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

export async function POST(request: NextRequest) {
  // Check if AI is configured
  if (!anthropic) {
    console.error("[Content Generate] Anthropic API key not configured");
    return NextResponse.json({ error: "AI service not configured" }, { status: 503 });
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

  try {
    const body = await request.json();
    const {
      siteId,
      keyword,
      title,
      contentType = "article",
      customInstructions,
      optimizationMode = "balanced",
      targetWordCount = 1500,
    } = body;

    if (!keyword) {
      return NextResponse.json({ error: "Keyword is required" }, { status: 400 });
    }

    const articleTitle = title || `The Complete Guide to ${keyword}`;

    // Single comprehensive prompt for reliable generation
    const systemPrompt = `You are an expert SEO content writer. Generate high-quality, comprehensive content that ranks well in search engines AND is optimized for AI platforms like ChatGPT, Perplexity, and Google AI Overviews.

Your content MUST include:
1. A compelling introduction that directly answers the main query
2. Well-structured sections with clear H2/H3 headings
3. Key takeaways or summary boxes
4. FAQ section with 3-5 relevant questions
5. Quotable paragraphs (50-150 words) that AI can cite
6. Statistics and data points where relevant
7. Clear definitions of key terms

Write in a professional but accessible tone. Target ${targetWordCount} words.`;

    const userPrompt = `Write a comprehensive article titled "${articleTitle}" about "${keyword}".

${customInstructions ? `Additional instructions: ${customInstructions}` : ""}

Format your response as JSON with this exact structure:
{
  "title": "The article title",
  "metaTitle": "SEO meta title (max 60 chars)",
  "metaDescription": "SEO meta description (max 160 chars)",
  "content": "The full article in markdown format with ## for H2, ### for H3, etc.",
  "faqs": [
    {"question": "...", "answer": "..."}
  ],
  "keyTakeaways": ["takeaway 1", "takeaway 2", "takeaway 3"]
}

Return ONLY valid JSON, no markdown code blocks or other text.`;

    console.log("[Content Generate] Calling Claude API for:", keyword);
    
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      messages: [{ role: "user", content: userPrompt }],
      system: systemPrompt,
    });

    const rawContent = response.content[0].type === "text" ? response.content[0].text : "";
    
    // Parse the response
    let parsedContent;
    try {
      // Clean up the response (remove markdown code blocks if present)
      let cleaned = rawContent.trim();
      cleaned = cleaned.replace(/^```(?:json)?\s*\n?/g, "").replace(/\n?```\s*$/g, "").trim();
      parsedContent = JSON.parse(cleaned);
    } catch (parseError) {
      console.error("[Content Generate] JSON parse error, using fallback:", parseError);
      // Fallback: extract content from raw response
      parsedContent = {
        title: articleTitle,
        metaTitle: `${articleTitle} | ${keyword}`.slice(0, 60),
        metaDescription: `Learn everything about ${keyword}. Comprehensive guide with expert tips, best practices, and actionable insights.`.slice(0, 160),
        content: rawContent,
        faqs: [],
        keyTakeaways: [],
      };
    }

    // Calculate word count
    const wordCount = parsedContent.content.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);

    // Generate simple SEO score based on content quality signals
    const seoScore = Math.min(100, Math.round(
      50 + 
      (parsedContent.faqs?.length > 0 ? 15 : 0) +
      (parsedContent.keyTakeaways?.length > 0 ? 10 : 0) +
      (wordCount > 1000 ? 15 : wordCount > 500 ? 10 : 5) +
      (parsedContent.content.includes("## ") ? 10 : 0)
    ));

    // Save to database if siteId provided
    if (siteId) {
      try {
        await supabase.from("content").insert({
          site_id: siteId,
          title: parsedContent.title,
          slug: parsedContent.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
          body: parsedContent.content,
          meta_title: parsedContent.metaTitle,
          meta_description: parsedContent.metaDescription,
          keyword: keyword,
          word_count: wordCount,
          seo_score: seoScore,
          aio_score: seoScore,
          aio_optimized: optimizationMode === "aio" || optimizationMode === "balanced",
          status: "draft",
          content_type: contentType,
        } as never);
        console.log("[Content Generate] Saved to database");
      } catch (saveError) {
        console.warn("[Content Generate] Failed to save to database:", saveError);
      }
    }

    // Generate FAQ schema
    const faqSchema = parsedContent.faqs?.length > 0 ? {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: parsedContent.faqs.map((faq: { question: string; answer: string }) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: { "@type": "Answer", text: faq.answer },
      })),
    } : null;

    console.log("[Content Generate] Success! Word count:", wordCount);

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
        seoScore,
        aioScore: seoScore,
        schema: faqSchema,
      },
    });
  } catch (error) {
    console.error("[Content Generate API] Error:", error);
    
    if (error instanceof Error) {
      if (error.message.includes("rate limit")) {
        return NextResponse.json({ error: "Rate limit exceeded. Please try again." }, { status: 429 });
      }
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate content" },
      { status: 500 }
    );
  }
}
