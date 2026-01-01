/**
 * Competitor Analysis API
 * 
 * POST /api/seo/competitors
 * 
 * 100% AI-POWERED - No external SERP APIs
 * 
 * Actions:
 * - keywords: Get competitor's likely keywords (AI estimated)
 * - analyze: Full competitor GEO analysis
 */

import { NextRequest, NextResponse } from "next/server";
import { seoData } from "@/lib/seo/data-service";

export const maxDuration = 30;

interface CompetitorRequest {
  action: "keywords" | "analyze";
  domain?: string;
  keyword?: string;
  options?: {
    location?: string;
    limit?: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: CompetitorRequest = await request.json();
    const { action, options = {} } = body;

    switch (action) {
      case "keywords": {
        if (!body.domain) {
          return NextResponse.json(
            { error: "Missing required field: domain" },
            { status: 400 }
          );
        }

        // Use AI-powered competitor analysis
        const result = await seoData.analyzeCompetitor(body.domain, options);
        
        return NextResponse.json({
          success: true,
          data: result.keywords,
          count: result.keywords.length,
          domain: body.domain,
          contentGaps: result.contentGaps,
          strengthAreas: result.strengthAreas,
        });
      }

      case "analyze": {
        if (!body.keyword) {
          return NextResponse.json(
            { error: "Missing required field: keyword" },
            { status: 400 }
          );
        }

        // Use AI for GEO-focused competitor analysis
        const geoAnalysis = await seoData.analyzeForGEO(
          body.keyword,
          options.location
        );
        
        return NextResponse.json({
          success: true,
          data: {
            keyword: body.keyword,
            location: options.location,
            geoScores: {
              chatgpt: geoAnalysis.chatgptScore,
              perplexity: geoAnalysis.perplexityScore,
              googleAi: geoAnalysis.googleAiScore,
              overall: geoAnalysis.overallScore,
            },
            questionsToAnswer: geoAnalysis.questionsToAnswer,
            entitiesToInclude: geoAnalysis.entitiesToInclude,
            structureRecommendations: geoAnalysis.structureRecommendations,
            locationContext: geoAnalysis.locationContext,
          },
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Valid actions: keywords, analyze` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Competitor analysis error:", error);
    
    return NextResponse.json(
      {
        error: "Competitor analysis failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
