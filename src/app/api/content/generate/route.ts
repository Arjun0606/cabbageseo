import { NextRequest, NextResponse } from "next/server";
import { dataForSEO } from "@/lib/integrations/dataforseo/client";
import { ai } from "@/lib/integrations/openai/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      keyword,
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
    const serpAnalysis = await dataForSEO.analyzeSERP(keyword);

    // Step 2: Generate content outline based on SERP
    const outline = await ai.generateOutline(
      keyword,
      serpAnalysis.results.map((r) => ({
        title: r.title,
        description: r.description,
      })),
      targetWordCount
    );

    // Step 3: Generate full article
    const content = await ai.generateArticle(keyword, outline, brandVoice);

    // Step 4: Generate FAQ schema if requested
    let faqSchema = null;
    if (includeSchema && outline.faqs) {
      faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: outline.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      };
    }

    // Step 5: Score the content
    const score = await ai.scoreContent(content.body, keyword);

    return NextResponse.json({
      content: {
        title: content.title,
        metaTitle: content.metaTitle,
        metaDescription: content.metaDescription,
        body: content.body,
        wordCount: content.wordCount,
        readingTime: content.readingTime,
      },
      outline,
      seoScore: score.score,
      suggestions: score.suggestions,
      keywordDensity: score.keywordDensity,
      readabilityScore: score.readabilityScore,
      schema: faqSchema,
      serpAnalysis: {
        keyword: serpAnalysis.keyword,
        serpFeatures: serpAnalysis.serpFeatures,
        competitorCount: serpAnalysis.results.length,
      },
    });
  } catch (error) {
    console.error("Content generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 }
    );
  }
}

