import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { requireSubscription } from "@/lib/api/require-subscription";
import { requireUsageLimit, incrementUsage } from "@/lib/api/check-usage";
import { dalle } from "@/lib/ai/image-generator";

// Content generation timeout (60s for Vercel Pro)
export const maxDuration = 60;

const TESTING_MODE = process.env.TESTING_MODE === "true";

// Helper function to call OpenAI with timeout
async function callOpenAI(prompt: string, systemPrompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 55000); // 55s timeout (allow 5s buffer)

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 4096, // Increased for longer, more detailed content
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
      targetWordCount = 1500, // Increased from 800 for more detailed content
      generateImage = true, // Generate featured image by default
    } = body;

    if (!keyword) {
      return NextResponse.json({ error: "Keyword is required" }, { status: 400 });
    }

    // Get site context for relevance
    let siteContext = "";
    if (siteId) {
      const { data: siteData } = await supabase
        .from("sites")
        .select("domain, name, industry")
        .eq("id", siteId)
        .single();
      
      if (siteData) {
        const site = siteData as { domain: string; name?: string; industry?: string };
        siteContext = `This content is for ${site.name || site.domain}${site.industry ? ` in the ${site.industry} industry` : ""}. Make the content relevant to their audience and business context.`;
      }
    }

    const articleTitle = title || `The Complete Guide to ${keyword}`;
    console.log("[Content Generate] Generating for:", articleTitle);

    // Enhanced system prompt for GEO-optimized, detailed content
    const systemPrompt = `You are an expert content strategist specializing in GEO (Generative Engine Optimization). Create comprehensive, authoritative content that:

1. Is optimized for AI citation (ChatGPT, Perplexity, Google AI Overviews)
2. Provides DETAILED, actionable information (${targetWordCount}+ words)
3. Uses clear definitions ("X is...", "X refers to...")
4. Contains quotable snippets (50-150 words each) that AI can extract
5. Includes FAQ sections with schema-ready Q&A
6. Has a "Key Takeaways" summary section
7. Cites statistics with sources
8. Uses proper heading hierarchy (H2, H3)
9. Includes comparison tables where relevant
10. Provides step-by-step instructions when applicable

Write content that would be cited as THE authoritative source on this topic.
Always respond with valid JSON only, no markdown code blocks.`;

    const userPrompt = `Write a comprehensive, detailed article titled "${articleTitle}" about "${keyword}".

${siteContext}
${customInstructions ? `Additional instructions: ${customInstructions}` : ""}

IMPORTANT - Content must be:
- At least ${targetWordCount} words (this is CRITICAL - be thorough and detailed)
- Structured with clear H2/H3 headings
- Include a "Key Takeaways" section at the beginning
- Start EVERY section with a direct, quotable answer
- Include at least 8-10 FAQs with detailed 100+ word answers
- Add comparison tables where relevant
- Include step-by-step guides where applicable
- Cite real statistics with year and source

OPTIMIZATION MODE: ${optimizationMode === "geo" ? "Heavily optimize for AI citation - every paragraph should be quotable" : "Balance traditional SEO and AI optimization"}

Structure your article like this:
1. Key Takeaways (bullet points)
2. Introduction with direct answer to "What is ${keyword}?"
3. Why ${keyword} Matters (with statistics)
4. How to [Get Started/Implement/Use] ${keyword} (step-by-step)
5. Best Practices and Tips
6. Common Mistakes to Avoid
7. ${keyword} vs Alternatives (comparison if relevant)
8. Future Trends
9. FAQ Section (8-10 questions)
10. Conclusion

Respond with ONLY this JSON structure:
{
  "title": "${articleTitle}",
  "metaTitle": "compelling 50-60 char title with keyword",
  "metaDescription": "engaging 150-155 char description with clear value proposition",
  "content": "Full article in markdown. Use ## for H2, ### for H3. Use **bold** for key terms. Use bullet points and numbered lists. Include tables with | syntax.",
  "faqs": [
    {"question": "What is ${keyword}?", "answer": "Detailed 100+ word answer..."},
    {"question": "Why is ${keyword} important in 2024?", "answer": "Detailed answer with statistics..."},
    {"question": "How do I get started with ${keyword}?", "answer": "Step-by-step answer..."},
    {"question": "What are the benefits of ${keyword}?", "answer": "List of benefits with explanations..."},
    {"question": "What are common ${keyword} mistakes?", "answer": "Common pitfalls and how to avoid..."},
    {"question": "How much does ${keyword} cost?", "answer": "Pricing information if relevant..."},
    {"question": "What tools are best for ${keyword}?", "answer": "Tool recommendations..."},
    {"question": "How long does it take to see results from ${keyword}?", "answer": "Timeline expectations..."}
  ],
  "keyTakeaways": [
    "Actionable takeaway 1 (one sentence)",
    "Actionable takeaway 2 (one sentence)",
    "Actionable takeaway 3 (one sentence)",
    "Actionable takeaway 4 (one sentence)",
    "Actionable takeaway 5 (one sentence)",
    "Actionable takeaway 6 (one sentence)",
    "Actionable takeaway 7 (one sentence)"
  ],
  "statistics": [
    {"stat": "XX% of businesses...", "source": "Industry Report, 2024"},
    {"stat": "Companies using X see...", "source": "Research Study, 2024"}
  ],
  "sources": ["Source 1 with URL if possible", "Source 2", "Source 3"]
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

    // Generate featured image with DALL-E 3 (non-blocking)
    let featuredImage: { url: string; alt: string } | null = null;
    if (generateImage && dalle.isConfigured()) {
      try {
        console.log("[Content Generate] Generating featured image...");
        const imageResult = await dalle.generateFeaturedImage(
          parsedContent.title,
          keyword,
          "professional"
        );
        featuredImage = {
          url: imageResult.url,
          alt: `Featured image for ${parsedContent.title}`,
        };
        console.log("[Content Generate] Image generated:", featuredImage.url);
      } catch (imageError) {
        console.warn("[Content Generate] Image generation failed:", imageError);
        // Continue without image - not a critical failure
      }
    }

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
        geoScore: aioScore, // Alias for GEO branding
        schema: faqSchema,
        optimizationMode,
        featuredImage, // DALL-E 3 generated image
        isEditable: true, // Flag to indicate content can be edited
      },
    });
  } catch (error) {
    console.error("[Content Generate] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate content";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
