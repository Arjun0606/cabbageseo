/**
 * Content Generation API
 * POST /api/ai/generate
 * 
 * Generates SEO-optimized content using Claude AI
 * Includes usage tracking and rate limiting
 */

import { NextRequest, NextResponse } from "next/server";
import { contentPipeline, RateLimitError } from "@/lib/ai";
import { createClient } from "@/lib/supabase/server";
import { requireSubscription } from "@/lib/api/require-subscription";

export const maxDuration = 60; // Allow up to 60s for content generation

interface GenerateRequest {
  type: "outline" | "article" | "full" | "ideas" | "cluster" | "analyze" | "optimize" | "meta" | "score" | "plan";
  keyword?: string;
  topic?: string;
  content?: string;
  outline?: {
    title: string;
    metaTitle: string;
    metaDescription: string;
    headings: Array<{ level: number; text: string; points: string[] }>;
    faqs?: Array<{ question: string; answer: string }>;
  };
  serpResults?: Array<{ title: string; snippet: string }>;
  keywords?: string[];
  suggestions?: string[];
  existingTitles?: string[];
  siteData?: {
    title?: string;
    metaDescription?: string;
    h1?: string;
    headings?: string[];
    wordCount?: number;
    hasSchema?: boolean;
    loadTime?: number;
  };
  options?: {
    brandVoice?: string;
    targetWordCount?: number;
    generateFaqs?: boolean;
    suggestInternalLinks?: boolean;
    availablePages?: Array<{ url: string; title: string; keywords?: string[] }>;
    count?: number;
    timeframeDays?: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    // Check subscription - AI generation requires paid plan
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }
    
    const subscription = await requireSubscription(supabase);
    if (!subscription.authorized) {
      return subscription.error!;
    }

    // Check if AI is configured
    if (!contentPipeline.isReady()) {
      return NextResponse.json(
        { 
          error: "AI not configured", 
          message: "Please add ANTHROPIC_API_KEY to your environment variables." 
        },
        { status: 503 }
      );
    }

    const body: GenerateRequest = await request.json();
    const { type, options = {} } = body;

    // Route to appropriate handler
    switch (type) {
      case "outline": {
        if (!body.keyword || !body.serpResults) {
          return NextResponse.json(
            { error: "Missing required fields: keyword, serpResults" },
            { status: 400 }
          );
        }
        const result = await contentPipeline.generateOutline(
          body.keyword,
          body.serpResults,
          options.targetWordCount
        );
        return NextResponse.json({
          success: true,
          data: result.outline,
          usage: result.usage,
        });
      }

      case "article": {
        if (!body.keyword || !body.outline) {
          return NextResponse.json(
            { error: "Missing required fields: keyword, outline" },
            { status: 400 }
          );
        }
        const result = await contentPipeline.generateArticle(
          body.keyword,
          body.outline,
          options
        );
        return NextResponse.json({
          success: true,
          data: result,
          usage: result.usage,
        });
      }

      case "full": {
        if (!body.keyword || !body.serpResults) {
          return NextResponse.json(
            { error: "Missing required fields: keyword, serpResults" },
            { status: 400 }
          );
        }
        const result = await contentPipeline.generateFullContent(
          body.keyword,
          body.serpResults,
          options
        );
        return NextResponse.json({
          success: true,
          data: result,
          usage: result.usage,
        });
      }

      case "ideas": {
        if (!body.topic) {
          return NextResponse.json(
            { error: "Missing required field: topic" },
            { status: 400 }
          );
        }
        const result = await contentPipeline.generateContentIdeas(
          body.topic,
          body.existingTitles || [],
          options.count || 10
        );
        return NextResponse.json({
          success: true,
          data: result.ideas,
          usage: result.usage,
        });
      }

      case "cluster": {
        if (!body.keywords || body.keywords.length === 0) {
          return NextResponse.json(
            { error: "Missing required field: keywords" },
            { status: 400 }
          );
        }
        const result = await contentPipeline.clusterKeywords(body.keywords);
        return NextResponse.json({
          success: true,
          data: result.clusters,
          usage: result.usage,
        });
      }

      case "analyze": {
        if (!body.content || !body.keyword) {
          return NextResponse.json(
            { error: "Missing required fields: content, keyword" },
            { status: 400 }
          );
        }
        const result = await contentPipeline.analyzeContent(body.content, body.keyword);
        return NextResponse.json({
          success: true,
          data: result.analysis,
          usage: result.usage,
        });
      }

      case "optimize": {
        if (!body.content || !body.keyword || !body.suggestions) {
          return NextResponse.json(
            { error: "Missing required fields: content, keyword, suggestions" },
            { status: 400 }
          );
        }
        const result = await contentPipeline.optimizeContent(
          body.content,
          body.keyword,
          body.suggestions
        );
        return NextResponse.json({
          success: true,
          data: { optimizedContent: result.optimizedContent },
          usage: result.usage,
        });
      }

      case "meta": {
        if (!body.content || !body.keyword) {
          return NextResponse.json(
            { error: "Missing required fields: content, keyword" },
            { status: 400 }
          );
        }
        const result = await contentPipeline.generateMeta(body.content, body.keyword);
        return NextResponse.json({
          success: true,
          data: {
            metaTitle: result.metaTitle,
            metaDescription: result.metaDescription,
          },
          usage: result.usage,
        });
      }

      case "score": {
        if (!body.siteData) {
          return NextResponse.json(
            { error: "Missing required field: siteData" },
            { status: 400 }
          );
        }
        const result = await contentPipeline.quickScore(body.siteData);
        return NextResponse.json({
          success: true,
          data: {
            score: result.score,
            grade: result.grade,
            quickWins: result.quickWins,
            criticalIssues: result.criticalIssues,
            breakdown: result.breakdown,
          },
          usage: result.usage,
        });
      }

      case "plan": {
        if (!body.topic || !body.keywords) {
          return NextResponse.json(
            { error: "Missing required fields: topic, keywords" },
            { status: 400 }
          );
        }
        const result = await contentPipeline.generateContentPlan(
          body.topic,
          body.keywords,
          options.timeframeDays || 30
        );
        return NextResponse.json({
          success: true,
          data: result.plan,
          usage: result.usage,
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown generation type: ${type}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("AI generation error:", error);

    // Handle rate limit errors
    if (error instanceof RateLimitError) {
      return NextResponse.json(
        { 
          error: "Rate limit exceeded",
          message: error.message,
          retryAfter: error.retryAfter,
        },
        { 
          status: 429,
          headers: {
            "Retry-After": String(error.retryAfter),
          },
        }
      );
    }

    // Handle other errors
    return NextResponse.json(
      { 
        error: "Generation failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

