/**
 * GEO Visibility Check API
 * 
 * POST /api/geo/visibility
 * 
 * 100% AI-POWERED visibility analysis for:
 * - ChatGPT
 * - Perplexity
 * - Google AI Overviews
 * 
 * Location-aware: Pass `location` param for region-specific analysis
 * (e.g., "taxi service" in India vs Germany)
 * 
 * Only requires: OPENAI_API_KEY
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

    // Run the AI-powered visibility check
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
        aiPowered: true,
        locationAware: Boolean(body.location),
        platforms: ["chatgpt", "perplexity", "google_aio"],
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

// GET: Check API status
export async function GET() {
  const configured = visibilityChecker.isConfigured();

  return NextResponse.json({
    configured,
    aiPowered: true,
    platforms: ["chatgpt", "perplexity", "google_aio"],
    message: configured 
      ? "GEO visibility checking is ready. 100% AI-powered."
      : "OpenAI API key required. Set OPENAI_API_KEY in environment.",
    features: {
      locationAware: true,
      realTimeAnalysis: true,
      improvementTracking: true,
    },
  });
}
