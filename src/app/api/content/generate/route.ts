import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { dataForSEO } from "@/lib/integrations/dataforseo/client";
import { contentPipeline } from "@/lib/ai";
import { requireSubscription } from "@/lib/api/require-subscription";

// Extend timeout for content generation (up to 5 minutes for Vercel Pro)
export const maxDuration = 120;

const TESTING_MODE = process.env.TESTING_MODE === "true";

export async function POST(request: NextRequest) {
  let supabase;
  try {
    supabase = TESTING_MODE ? createServiceClient() : await createClient();
  } catch (e) {
    console.error("[Content Generate] Supabase error:", e);
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  let organizationId: string | null = null;

  if (TESTING_MODE) {
    // In testing mode, get the first organization
    const { data: orgs } = await supabase.from("organizations").select("id").limit(1);
    organizationId = (orgs?.[0] as { id: string } | undefined)?.id || null;
  } else {
    // Check subscription - content generation requires paid plan
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
      optimizationMode = "seo", // "seo" | "aio" | "balanced"
      targetWordCount = 2000,
      brandVoice,
      includeSchema = true,
    } = body;

    if (!keyword) {
      return NextResponse.json(
        { error: "Keyword is required" },
        { status: 400 }
      );
    }

    // Step 1: Analyze SERP for the keyword
    let serpResults: Array<{ title: string; snippet: string }> = [];
    try {
      const serpAnalysis = await dataForSEO.analyzeSERP(keyword);
      serpResults = serpAnalysis.results.map((r) => ({
        title: r.title,
        snippet: r.description,
      }));
    } catch (serpError) {
      console.warn("SERP analysis failed, continuing without:", serpError);
      // Continue without SERP data - AI will generate based on keyword alone
    }

    // Step 2: Use content pipeline and generate content
    const pipeline = contentPipeline;
    
    // Determine pipeline options based on optimization mode
    const pipelineOptions = {
      organizationId,
      targetWordCount,
      brandVoice: brandVoice || customInstructions,
      generateFaqs: true,
      optimizationMode: optimizationMode as "seo" | "aio" | "balanced",
      // Enable AIO-specific features for aio/balanced modes
      addKeyTakeaways: optimizationMode === "aio" || optimizationMode === "balanced",
      optimizeQuotability: optimizationMode === "aio",
    };

    // Generate content using the appropriate method
    let content;
    if (optimizationMode === "aio" || optimizationMode === "balanced") {
      // Use AIO-optimized pipeline
      content = await pipeline.generateAIOContent(keyword, serpResults, pipelineOptions);
    } else {
      // Use standard SEO pipeline
      const outline = await pipeline.generateOutline(keyword, serpResults, targetWordCount);
      content = await pipeline.generateArticle(keyword, outline.outline, pipelineOptions);
    }

    // Override title if provided
    if (title && title.trim()) {
      content.title = title;
      // Regenerate meta title to match
      content.metaTitle = `${title} | ${keyword}`.slice(0, 60);
    }

    // Step 3: Score the content
    let seoScore = 0;
    let aioScore: number | null = null;
    try {
      const analysisResult = await pipeline.analyzeContent(content.body, keyword);
      seoScore = analysisResult.analysis.score;
      
      // Get AIO score if in aio/balanced mode
      if (optimizationMode === "aio" || optimizationMode === "balanced") {
        const aioAnalysis = await pipeline.analyzeAIOReadiness(content.body, keyword);
        aioScore = aioAnalysis.analysis.overallScore;
      }
    } catch (scoreError) {
      console.warn("Scoring failed:", scoreError);
    }

    // Step 4: Generate FAQ schema if requested
    let faqSchema = null;
    if (includeSchema && content.faqs && content.faqs.length > 0) {
      faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: content.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      };
    }

    // Step 5: Optionally save to database
    if (siteId) {
      try {
        await supabase
          .from("content")
          .insert({
            site_id: siteId,
            title: content.title,
            slug: content.title
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-|-$/g, ""),
            body: content.body,
            body_html: content.bodyHtml || null,
            meta_title: content.metaTitle,
            meta_description: content.metaDescription,
            keyword: keyword,
            word_count: content.wordCount,
            seo_score: seoScore,
            aio_score: aioScore,
            aio_optimized: optimizationMode === "aio" || optimizationMode === "balanced",
            status: "draft",
            content_type: contentType,
          } as never);
      } catch (saveError) {
        console.warn("Failed to save content to database:", saveError);
        // Continue - content was still generated
      }
    }

    // Return in the expected format
    return NextResponse.json({
      success: true,
      data: {
        title: content.title,
        metaTitle: content.metaTitle,
        metaDescription: content.metaDescription,
        body: content.body,
        bodyHtml: content.bodyHtml,
        wordCount: content.wordCount,
        readingTime: content.readingTime,
        outline: content.outline,
        faqs: content.faqs,
        seoScore,
        aioScore,
        schema: faqSchema,
        usage: content.usage,
      },
    });
  } catch (error) {
    console.error("[Content Generate API] Error:", error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes("rate limit")) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Please try again in a moment." },
          { status: 429 }
        );
      }
      if (error.message.includes("usage limit")) {
        return NextResponse.json(
          { error: "Usage limit reached. Please upgrade your plan." },
          { status: 403 }
        );
      }
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate content" },
      { status: 500 }
    );
  }
}
