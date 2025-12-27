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

// Helper to add timeout to promises
function withTimeout<T>(promise: Promise<T>, ms: number, errorMessage: string): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(errorMessage)), ms)
  );
  return Promise.race([promise, timeout]);
}

export async function POST(request: NextRequest) {
  console.log("[Content Generate] Starting request");
  
  // Check if AI is configured
  if (!anthropic) {
    console.error("[Content Generate] Anthropic API key not configured");
    return NextResponse.json({ error: "AI service not configured. Please add ANTHROPIC_API_KEY to environment." }, { status: 503 });
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
      targetWordCount = 800, // Reduced further for speed
    } = body;

    if (!keyword) {
      return NextResponse.json({ error: "Keyword is required" }, { status: 400 });
    }

    const articleTitle = title || `The Complete Guide to ${keyword}`;
    console.log("[Content Generate] Generating for:", articleTitle);

    // Simplified prompt for faster generation
    const systemPrompt = `You are an SEO content writer. Write concise, well-structured content optimized for search engines and AI platforms. Target ${targetWordCount} words.`;

    const userPrompt = `Write an article titled "${articleTitle}" about "${keyword}".

${customInstructions ? `Instructions: ${customInstructions}` : ""}

Return ONLY valid JSON (no markdown):
{
  "title": "Article title",
  "metaTitle": "SEO title (max 60 chars)",
  "metaDescription": "Meta description (max 160 chars)",
  "content": "Full article in markdown",
  "faqs": [{"question": "Q1", "answer": "A1"}],
  "keyTakeaways": ["takeaway 1", "takeaway 2"]
}`;

    console.log("[Content Generate] Calling Claude API...");
    
    // Call Claude with 60s timeout
    const response = await withTimeout(
      anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 3000,
        messages: [{ role: "user", content: userPrompt }],
        system: systemPrompt,
      }),
      60000,
      "Claude API timeout - please try again"
    );

    console.log("[Content Generate] Claude responded");

    const rawContent = response.content[0].type === "text" ? response.content[0].text : "";
    
    // Parse the response
    let parsedContent;
    try {
      let cleaned = rawContent.trim();
      cleaned = cleaned.replace(/^```(?:json)?\s*\n?/g, "").replace(/\n?```\s*$/g, "").trim();
      parsedContent = JSON.parse(cleaned);
    } catch (parseError) {
      console.error("[Content Generate] JSON parse error:", parseError);
      // Fallback
      parsedContent = {
        title: articleTitle,
        metaTitle: `${articleTitle} | Guide`.slice(0, 60),
        metaDescription: `Learn about ${keyword}. Comprehensive guide with tips and best practices.`.slice(0, 160),
        content: rawContent,
        faqs: [],
        keyTakeaways: [],
      };
    }

    const wordCount = parsedContent.content.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);

    // Simple SEO score
    const seoScore = Math.min(100, Math.round(
      50 + 
      (parsedContent.faqs?.length > 0 ? 15 : 0) +
      (parsedContent.keyTakeaways?.length > 0 ? 10 : 0) +
      (wordCount > 500 ? 15 : 5) +
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
        console.warn("[Content Generate] Failed to save:", saveError);
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

    console.log("[Content Generate] Success! Words:", wordCount);

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
    console.error("[Content Generate] Error:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Failed to generate content";
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
