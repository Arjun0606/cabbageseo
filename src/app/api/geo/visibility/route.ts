/**
 * GEO Visibility Check API
 * 
 * POST /api/geo/visibility
 * 
 * HYBRID APPROACH:
 * - Perplexity: REAL citation checking via API (if PERPLEXITY_API_KEY set)
 * - ChatGPT: Simulated analysis via OpenAI
 * - Google AI Overviews: AI-powered estimation
 * 
 * Location-aware: Pass `location` param for region-specific analysis
 * (e.g., "taxi service" in India vs Germany)
 * 
 * Required: OPENAI_API_KEY
 * Optional: PERPLEXITY_API_KEY (enables real citation checking)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { visibilityChecker } from "@/lib/aio/visibility-checker";
import { requireSubscription } from "@/lib/api/require-subscription";

interface RequestBody {
  url: string;
  keywords?: string[];
  location?: string;  // e.g., "India", "Germany", "United States"
  content?: string;   // Optional: raw content to analyze
}

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }
    
    // Require paid subscription
    const subscription = await requireSubscription(supabase);
    if (!subscription.authorized) {
      return subscription.error!;
    }

    const body = await req.json() as RequestBody;
    
    if (!body.url) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    // Check if OpenAI is configured
    if (!visibilityChecker.isConfigured()) {
      return NextResponse.json(
        { 
          error: "OpenAI API key not configured",
          help: "Set OPENAI_API_KEY in environment variables",
        },
        { status: 503 }
      );
    }

    // Get capabilities to show what's real vs estimated
    const capabilities = visibilityChecker.getCapabilities();

    // Run the hybrid visibility check
    const result = await visibilityChecker.checkVisibility({
      url: body.url,
      keywords: body.keywords,
      location: body.location,
      content: body.content,
    });

    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        locationAware: Boolean(body.location),
        capabilities,
        checkTypes: {
          perplexity: result.platforms.perplexity.isRealCheck ? "real" : "estimated",
          chatgpt: "estimated", // Always simulated
          googleAio: "estimated", // Always AI-powered
        },
      },
    });
  } catch (error) {
    console.error("GEO visibility check error:", error);
    return NextResponse.json(
      { 
        error: "Failed to check GEO visibility",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET: Check API status and capabilities
export async function GET() {
  const configured = visibilityChecker.isConfigured();
  const capabilities = configured ? visibilityChecker.getCapabilities() : null;

  return NextResponse.json({
    configured,
    capabilities,
    platforms: [
      {
        id: "perplexity",
        name: "Perplexity AI",
        checkType: capabilities?.perplexity.real ? "real" : "estimated",
        method: capabilities?.perplexity.method || "Requires PERPLEXITY_API_KEY",
      },
      {
        id: "chatgpt",
        name: "ChatGPT / SearchGPT",
        checkType: "estimated",
        method: capabilities?.chatgpt.method || "AI-powered simulation",
      },
      {
        id: "google_aio",
        name: "Google AI Overviews",
        checkType: "estimated",
        method: capabilities?.googleAio.method || "AI-powered estimation",
      },
    ],
    message: configured 
      ? capabilities?.perplexity.real 
        ? "GEO visibility ready with REAL Perplexity citation checking!"
        : "GEO visibility ready. Add PERPLEXITY_API_KEY for real citation checks."
      : "OpenAI API key required. Set OPENAI_API_KEY in environment.",
    features: {
      locationAware: true,
      realCitationCheck: capabilities?.perplexity.real || false,
      improvementTracking: true,
    },
  });
}
