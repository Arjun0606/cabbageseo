/**
 * GEO Citations API
 * 
 * GET /api/geo/citations?siteId=xxx
 * 
 * Returns citations for a site - when AI platforms cite your content.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireSubscription } from "@/lib/api/require-subscription";
import { citationTracker } from "@/lib/geo/citation-tracker";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Auth check
    const subscription = await requireSubscription(supabase);
    if (!subscription.authorized) {
      return subscription.error!;
    }

    const siteId = req.nextUrl.searchParams.get("siteId");
    if (!siteId) {
      return NextResponse.json(
        { error: "siteId is required" },
        { status: 400 }
      );
    }

    // Get citations from database
    const { data: citationsRaw, error } = await (supabase as any)
      .from("ai_citations")
      .select("*")
      .eq("site_id", siteId)
      .order("discovered_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching citations:", error);
      return NextResponse.json(
        { error: "Failed to fetch citations" },
        { status: 500 }
      );
    }

    const citations = (citationsRaw || []) as Array<{ platform: string; query: string; snippet: string; discovered_at: string }>;

    // Get citation stats
    const totalCitations = citations.length;
    const platformBreakdown = {
      perplexity: citations.filter(c => c.platform === "perplexity").length,
      chatgpt: citations.filter(c => c.platform === "chatgpt").length,
      googleAio: citations.filter(c => c.platform === "google_aio").length,
    };

    // Get configured platforms
    const configuredPlatforms = citationTracker.getConfiguredPlatforms();

    return NextResponse.json({
      success: true,
      citations: citations || [],
      stats: {
        total: totalCitations,
        platforms: platformBreakdown,
      },
      platformStatus: configuredPlatforms,
    });
  } catch (error) {
    console.error("Citations API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch citations" },
      { status: 500 }
    );
  }
}

// POST: Run a citation check now
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Auth check
    const subscription = await requireSubscription(supabase);
    if (!subscription.authorized) {
      return subscription.error!;
    }

    const { siteId } = await req.json();
    if (!siteId) {
      return NextResponse.json(
        { error: "siteId is required" },
        { status: 400 }
      );
    }

    // Get site info
    const { data: siteData } = await (supabase as any)
      .from("sites")
      .select("domain, main_topics")
      .eq("id", siteId)
      .single();

    const site = siteData as { domain: string; main_topics: string[] } | null;
    if (!site) {
      return NextResponse.json(
        { error: "Site not found" },
        { status: 404 }
      );
    }

    // Get configured platforms
    const configuredPlatforms = citationTracker.getConfiguredPlatforms();

    // Run citation check across ALL platforms
    const newCitations = await citationTracker.checkSiteCitations(
      siteId,
      site.domain,
      site.main_topics || []
    );

    // Group citations by platform
    const citationsByPlatform = {
      perplexity: newCitations.filter(c => c.platform === "perplexity").length,
      chatgpt: newCitations.filter(c => c.platform === "chatgpt").length,
      googleAio: newCitations.filter(c => c.platform === "google_aio").length,
    };

    return NextResponse.json({
      success: true,
      newCitations: newCitations.length,
      citationsByPlatform,
      citations: newCitations,
      platformStatus: configuredPlatforms,
      message: `Checked ${Object.values(configuredPlatforms).filter(Boolean).length} platforms: ${
        Object.entries(configuredPlatforms)
          .filter(([_, configured]) => configured)
          .map(([name]) => name)
          .join(", ")
      }`,
    });
  } catch (error) {
    console.error("Citation check error:", error);
    return NextResponse.json(
      { error: "Failed to run citation check" },
      { status: 500 }
    );
  }
}
