/**
 * Competitor Analysis API
 * 
 * POST /api/seo/competitors
 * 
 * Actions:
 * - keywords: Get competitor's ranking keywords
 * - analyze: Full competitor SERP analysis for a keyword
 */

import { NextRequest, NextResponse } from "next/server";
import { seoData } from "@/lib/seo/data-service";
import { serpapi } from "@/lib/integrations/serpapi/client";

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

        const keywords = await seoData.getCompetitorKeywords(body.domain, options);
        
        return NextResponse.json({
          success: true,
          data: keywords,
          count: keywords.length,
          domain: body.domain,
        });
      }

      case "analyze": {
        if (!body.keyword) {
          return NextResponse.json(
            { error: "Missing required field: keyword" },
            { status: 400 }
          );
        }

        // Use SerpAPI for rich competitor analysis
        if (serpapi.isConfigured()) {
          const analysis = await serpapi.analyzeCompetitors(body.keyword, {
            location: options.location,
            numResults: options.limit || 20,
          });
          
          return NextResponse.json({
            success: true,
            data: analysis,
          });
        }

        // Fallback to basic SERP analysis
        const serp = await seoData.analyzeSERP(body.keyword, options);
        
        return NextResponse.json({
          success: true,
          data: {
            keyword: body.keyword,
            competitors: serp.organicResults.map(r => ({
              domain: r.domain,
              url: r.url,
              title: r.title,
              position: r.position,
            })),
            dominantDomains: [],
            avgTitleLength: 0,
            avgDescriptionLength: 0,
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

