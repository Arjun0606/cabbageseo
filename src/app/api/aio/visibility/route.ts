/**
 * AI Visibility Check API
 * 
 * POST /api/aio/visibility
 * 
 * Checks REAL visibility across AI platforms by querying them directly.
 * This is not estimation - it's actual verification.
 * 
 * Required API keys (in .env):
 * - SERPAPI_KEY: For Google AI Overviews
 * - PERPLEXITY_API_KEY: For Perplexity AI
 * - OPENAI_API_KEY: For ChatGPT/SearchGPT  
 * - BING_SEARCH_API_KEY: For Bing Copilot
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { visibilityChecker } from "@/lib/aio/visibility-checker";

interface RequestBody {
  url: string;
  keywords?: string[];
}

export async function POST(req: NextRequest) {
  try {
    // Auth check - this endpoint costs money, require login
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required for AI visibility checks" },
        { status: 401 }
      );
    }

    const body = await req.json() as RequestBody;
    
    if (!body.url) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    // Check which platforms are configured
    const configured = visibilityChecker.getConfiguredPlatforms();
    const configuredCount = Object.values(configured).filter(Boolean).length;

    if (configuredCount === 0) {
      return NextResponse.json(
        { 
          error: "No AI platform APIs configured",
          help: "Configure at least one of: SERPAPI_KEY, PERPLEXITY_API_KEY, OPENAI_API_KEY, BING_SEARCH_API_KEY",
          configured,
        },
        { status: 503 }
      );
    }

    // Run the visibility check
    const result = await visibilityChecker.checkVisibility({
      url: body.url,
      keywords: body.keywords,
      maxQueriesPerPlatform: 5,
    });

    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        platformsConfigured: configured,
        platformsChecked: result.summary.platformsChecked,
        isRealData: true, // This is real data, not estimation
      },
    });
  } catch (error) {
    console.error("Visibility check error:", error);
    return NextResponse.json(
      { 
        error: "Failed to check visibility",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check which platforms are configured
export async function GET() {
  const configured = visibilityChecker.getConfiguredPlatforms();
  const configuredCount = Object.values(configured).filter(Boolean).length;

  return NextResponse.json({
    configured,
    configuredCount,
    allConfigured: configuredCount === 4,
    message: configuredCount === 0 
      ? "No AI platform APIs configured. Add API keys to enable real visibility checking."
      : `${configuredCount}/4 platforms configured for real visibility checking.`,
  });
}

