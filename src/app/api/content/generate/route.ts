import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { requireSubscription } from "@/lib/api/require-subscription";
import OpenAI from "openai";

// Extend timeout for content generation
export const maxDuration = 60;

const TESTING_MODE = process.env.TESTING_MODE === "true";

// Use OpenAI for faster generation (GPT-4o-mini is 10x faster than Claude)
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export async function POST(request: NextRequest) {
  console.log("[Content Generate] Starting request");
  
  // Check if AI is configured
  if (!openai) {
    console.error("[Content Generate] OpenAI API key not configured");
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

  try {
    const body = await request.json();
    const {
      siteId,
      keyword,
      title,
      contentType = "article",
      customInstructions,
      optimizationMode = "balanced",
      targetWordCount = 1000,
    } = body;

    if (!keyword) {
      return NextResponse.json({ error: "Keyword is required" }, { status: 400 });
    }

    const articleTitle = title || `The Complete Guide to ${keyword}`;
    console.log("[Content Generate] Generating for:", articleTitle);

    // Use GPT-4o-mini for speed
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 3000,
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: `You are an SEO content writer. Write well-structured content optimized for search engines and AI platforms like ChatGPT and Perplexity. Target ${targetWordCount} words. Always respond with valid JSON only.`
        },
        {
          role: "user",
          content: `Write an SEO-optimized article titled "${articleTitle}" about "${keyword}".

${customInstructions ? `Additional instructions: ${customInstructions}` : ""}

Respond with ONLY this JSON structure (no markdown, no extra text):
{
  "title": "The article title",
  "metaTitle": "SEO title under 60 chars",
  "metaDescription": "Meta description under 160 chars",
  "content": "Full article content in markdown with ## headings",
  "faqs": [{"question": "FAQ 1?", "answer": "Answer 1"}, {"question": "FAQ 2?", "answer": "Answer 2"}],
  "keyTakeaways": ["Key point 1", "Key point 2", "Key point 3"]
}`
        }
      ],
    });

    console.log("[Content Generate] OpenAI responded");

    const rawContent = response.choices[0]?.message?.content || "";
    
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
        metaTitle: `${articleTitle} | Guide`.slice(0, 60),
        metaDescription: `Learn about ${keyword}. Comprehensive guide with tips and best practices.`.slice(0, 160),
        content: rawContent,
        faqs: [
          { question: `What is ${keyword}?`, answer: `${keyword} is an important concept in modern SEO.` },
          { question: `Why is ${keyword} important?`, answer: `${keyword} helps improve your website's visibility.` }
        ],
        keyTakeaways: [`Understand the basics of ${keyword}`, `Implement best practices`, `Monitor and optimize`],
      };
    }

    const wordCount = (parsedContent.content || "").split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);

    // Calculate SEO score
    const seoScore = Math.min(100, Math.round(
      50 + 
      (parsedContent.faqs?.length > 0 ? 15 : 0) +
      (parsedContent.keyTakeaways?.length > 0 ? 10 : 0) +
      (wordCount > 500 ? 15 : 5) +
      ((parsedContent.content || "").includes("## ") ? 10 : 0)
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
