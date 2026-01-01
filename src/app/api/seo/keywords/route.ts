/**
 * Keyword Research API
 * 
 * POST /api/seo/keywords
 * 
 * 100% AI-powered keyword intelligence for GEO
 * 
 * Actions:
 * - suggestions: Get related keyword suggestions
 * - research: Full keyword research with clusters
 * - questions: Get questions AI engines answer
 * - competitors: Analyze competitor keywords
 * - geo: Get GEO analysis for a topic
 */

import { NextRequest, NextResponse } from "next/server";
import { seoData } from "@/lib/seo/data-service";

export const maxDuration = 30;

interface KeywordRequest {
  action: "suggestions" | "research" | "questions" | "competitors" | "geo";
  keyword?: string;
  seedKeyword?: string;
  topic?: string;
  domain?: string;
  location?: string;
  options?: {
    location?: string;
    limit?: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: KeywordRequest = await request.json();
    const { action, options = {} } = body;
    
    switch (action) {
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
          provider: "ai",
        });
      }

      case "research": {
        const seedKeyword = body.seedKeyword || body.keyword;
        if (!seedKeyword) {
          return NextResponse.json(
            { error: "Missing required field: seedKeyword or keyword" },
            { status: 400 }
          );
        }

        const research = await seoData.researchKeywords(seedKeyword, options);
        
        return NextResponse.json({
          success: true,
          data: research,
          provider: "ai",
        });
      }

      case "questions": {
        const topic = body.topic || body.keyword || body.seedKeyword;
        if (!topic) {
          return NextResponse.json(
            { error: "Missing required field: topic or keyword" },
            { status: 400 }
          );
        }

        const questions = await seoData.getAIQuestions(topic, options);
        
        return NextResponse.json({
          success: true,
          data: questions,
          count: questions.length,
          topic,
        });
      }

      case "competitors": {
        if (!body.domain) {
          return NextResponse.json(
            { error: "Missing required field: domain" },
            { status: 400 }
          );
        }

        const analysis = await seoData.analyzeCompetitor(body.domain, options);
        
        return NextResponse.json({
          success: true,
          data: analysis,
          domain: body.domain,
        });
      }

      case "geo": {
        const topic = body.topic || body.keyword || body.seedKeyword;
        if (!topic) {
          return NextResponse.json(
            { error: "Missing required field: topic or keyword" },
            { status: 400 }
          );
        }

        const geoAnalysis = await seoData.analyzeForGEO(topic, body.location || options.location);
        
        return NextResponse.json({
          success: true,
          data: geoAnalysis,
          topic,
          location: body.location || options.location,
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Valid actions: suggestions, research, questions, competitors, geo` },
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

// GET: Check API status
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "100% AI-powered keyword intelligence. Only OpenAI API key required.",
    aiConfigured: Boolean(process.env.OPENAI_API_KEY),
    actions: ["suggestions", "research", "questions", "competitors", "geo"],
  });
}
