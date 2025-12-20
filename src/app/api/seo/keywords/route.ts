/**
 * Keyword Research API
 * 
 * POST /api/seo/keywords
 * 
 * Actions:
 * - metrics: Get keyword metrics (volume, difficulty, CPC)
 * - suggestions: Get related keyword suggestions
 * - questions: Get "People Also Ask" questions
 * - gap: Keyword gap analysis vs competitors
 */

import { NextRequest, NextResponse } from "next/server";
import { seoData } from "@/lib/seo/data-service";

export const maxDuration = 30; // Allow up to 30s for API calls

interface KeywordRequest {
  action: "metrics" | "suggestions" | "questions" | "gap" | "serp" | "ranking";
  keywords?: string[];
  keyword?: string;
  seedKeyword?: string;
  domain?: string;
  competitors?: string[];
  options?: {
    location?: string;
    language?: string;
    country?: string;
    limit?: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: KeywordRequest = await request.json();
    const { action, options = {} } = body;

    // Check provider status
    const status = seoData.getProviderStatus();
    
    switch (action) {
      case "metrics": {
        if (!body.keywords || body.keywords.length === 0) {
          return NextResponse.json(
            { error: "Missing required field: keywords (array)" },
            { status: 400 }
          );
        }

        const metrics = await seoData.getKeywordMetrics(body.keywords, options);
        
        return NextResponse.json({
          success: true,
          data: metrics,
          count: metrics.length,
          provider: "dataforseo",
        });
      }

      case "suggestions": {
        const seedKeyword = body.seedKeyword || body.keyword;
        if (!seedKeyword) {
          return NextResponse.json(
            { error: "Missing required field: seedKeyword or keyword" },
            { status: 400 }
          );
        }

        const suggestions = await seoData.getKeywordSuggestions(seedKeyword, options);
        
        return NextResponse.json({
          success: true,
          data: suggestions,
          count: suggestions.length,
          seedKeyword,
          provider: status.dataForSEO ? "dataforseo" : "serpapi",
        });
      }

      case "questions": {
        const keyword = body.keyword || body.seedKeyword;
        if (!keyword) {
          return NextResponse.json(
            { error: "Missing required field: keyword" },
            { status: 400 }
          );
        }

        const questions = await seoData.getQuestions(keyword, options);
        
        return NextResponse.json({
          success: true,
          data: questions,
          count: questions.length,
          keyword,
        });
      }

      case "gap": {
        if (!body.domain || !body.competitors || body.competitors.length === 0) {
          return NextResponse.json(
            { error: "Missing required fields: domain, competitors (array)" },
            { status: 400 }
          );
        }

        const gap = await seoData.getKeywordGap(body.domain, body.competitors, options);
        
        return NextResponse.json({
          success: true,
          data: gap,
          count: gap.length,
          yourDomain: body.domain,
          competitors: body.competitors,
        });
      }

      case "serp": {
        const keyword = body.keyword || body.seedKeyword;
        if (!keyword) {
          return NextResponse.json(
            { error: "Missing required field: keyword" },
            { status: 400 }
          );
        }

        const serp = await seoData.analyzeSERP(keyword, options);
        
        return NextResponse.json({
          success: true,
          data: serp,
          keyword,
        });
      }

      case "ranking": {
        if (!body.keyword || !body.domain) {
          return NextResponse.json(
            { error: "Missing required fields: keyword, domain" },
            { status: 400 }
          );
        }

        const ranking = await seoData.checkRanking(body.keyword, body.domain, options);
        
        return NextResponse.json({
          success: true,
          data: ranking,
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Valid actions: metrics, suggestions, questions, gap, serp, ranking` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Keyword research error:", error);
    
    return NextResponse.json(
      {
        error: "Keyword research failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET: Check provider status
export async function GET() {
  const status = seoData.getProviderStatus();
  
  return NextResponse.json({
    providers: status,
    message: status.anyAvailable
      ? "SEO data providers are configured"
      : "No SEO data providers configured. Please configure DataForSEO or SerpAPI.",
    instructions: !status.anyAvailable ? {
      dataForSEO: "Set DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD",
      serpAPI: "Set SERPAPI_KEY",
    } : undefined,
  });
}

