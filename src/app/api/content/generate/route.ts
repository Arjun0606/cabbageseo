import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { requireSubscription } from "@/lib/api/require-subscription";

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

    const articleTitle = title || `Guide to ${keyword}`;
    console.log("[Content Generate] Generating for:", articleTitle);

    const systemPrompt = `You are an SEO content writer. Write concise, well-structured content. Target ${targetWordCount} words. Always respond with valid JSON only, no markdown.`;

    const userPrompt = `Write an article titled "${articleTitle}" about "${keyword}".

${customInstructions ? `Instructions: ${customInstructions}` : ""}

Respond with ONLY this JSON (no markdown code blocks):
{"title":"${articleTitle}","metaTitle":"${articleTitle.slice(0, 55)}","metaDescription":"Learn about ${keyword}","content":"Write article content here in markdown","faqs":[{"question":"Q1?","answer":"A1"}],"keyTakeaways":["Point 1","Point 2"]}`;

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
    const seoScore = Math.min(100, 50 + (parsedContent.faqs?.length > 0 ? 15 : 0) + (wordCount > 300 ? 15 : 0) + 10);

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
          status: "draft",
          content_type: contentType,
        } as never);
        console.log("[Content Generate] Saved");
      } catch (saveError) {
        console.warn("[Content Generate] Save failed:", saveError);
      }
    }

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
        schema: null,
      },
    });
  } catch (error) {
    console.error("[Content Generate] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate content";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
