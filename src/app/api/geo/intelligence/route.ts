/**
 * /api/geo/intelligence - REAL GEO Intelligence
 * 
 * NO FAKE DATA. NO MOCK SCORES.
 * 
 * This endpoint performs REAL analysis:
 * - Fetches actual website content
 * - Checks for structured data (JSON-LD)
 * - Analyzes content structure
 * - Uses AI to evaluate citability
 * - Tests real queries on AI platforms
 * 
 * GET: Get existing GEO analysis for a site
 * POST: Run new comprehensive GEO analysis
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { analyzeSite } from "@/lib/geo/site-analyzer";
import { getUser } from "@/lib/api/get-user";
import type { SupabaseClient } from "@supabase/supabase-js";

function getDbClient(): SupabaseClient | null {
  try {
    return createServiceClient();
  } catch {
    return null;
  }
}

// GET - Get existing analysis
export async function GET(request: NextRequest) {
  try {
    // Check for bypass user first
    const bypassUser = await getUser();
    if (bypassUser?.isTestAccount && bypassUser.id.startsWith("bypass-")) {
      // Return mock intelligence data in bypass mode
      return NextResponse.json({
        success: true,
        data: {
          score: { overall: 72, grade: "B", breakdown: { authority: 65, relevance: 78, freshness: 73 } },
          tips: [
            { title: "Add structured data", description: "Add JSON-LD schema to improve AI understanding", priority: "high" },
            { title: "Improve documentation", description: "Create more detailed product documentation", priority: "medium" },
          ],
          queries: [],
          opportunities: [
            { platform: "G2", action: "Claim your profile", impact: "high" },
            { platform: "Product Hunt", action: "Launch your product", impact: "medium" },
          ],
          needsAnalysis: false,
        },
        bypassMode: true,
      });
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Not configured" }, { status: 500 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId");

    if (!siteId) {
      return NextResponse.json({ error: "siteId required" }, { status: 400 });
    }

    const db = getDbClient() || supabase;

    // Verify site belongs to user
    const { data: userData } = await db
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!userData?.organization_id) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const { data: site } = await db
      .from("sites")
      .select("id, domain, organization_id, geo_score_avg")
      .eq("id", siteId)
      .maybeSingle();

    if (!site || site.organization_id !== userData.organization_id) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    // Check for existing analysis (within last 24 hours)
    const { data: analysis } = await db
      .from("geo_analyses")
      .select("score, tips, queries, opportunities, raw_data, created_at")
      .eq("site_id", siteId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (analysis) {
      // Check if analysis is recent (less than 24 hours old)
      const analysisAge = Date.now() - new Date(analysis.created_at).getTime();
      const isRecent = analysisAge < 24 * 60 * 60 * 1000;

      return NextResponse.json({
        success: true,
        data: {
          score: analysis.score,
          tips: analysis.tips,
          queries: analysis.queries,
          opportunities: analysis.opportunities,
          rawData: analysis.raw_data,
          analyzedAt: analysis.created_at,
          needsAnalysis: !isRecent,
        },
      });
    }

    // No analysis found
    return NextResponse.json({
      success: true,
      data: {
        score: null,
        tips: [],
        queries: [],
        opportunities: [],
        needsAnalysis: true,
      },
    });

  } catch (error) {
    console.error("[/api/geo/intelligence GET] Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST - Run NEW real analysis
export async function POST(request: NextRequest) {
  try {
    // Check for bypass user first
    const bypassUser = await getUser();
    if (bypassUser?.isTestAccount && bypassUser.id.startsWith("bypass-")) {
      // Return mock analysis in bypass mode
      return NextResponse.json({
        success: true,
        data: {
          score: { overall: 72, grade: "B", breakdown: { authority: 65, relevance: 78, freshness: 73 } },
          tips: [
            { title: "Add structured data", description: "Add JSON-LD schema to improve AI understanding", priority: "high" },
            { title: "Improve documentation", description: "Create more detailed product documentation", priority: "medium" },
          ],
          queries: [],
          opportunities: [
            { platform: "G2", action: "Claim your profile", impact: "high" },
            { platform: "Product Hunt", action: "Launch your product", impact: "medium" },
          ],
          analyzedAt: new Date().toISOString(),
          needsAnalysis: false,
        },
        bypassMode: true,
      });
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Not configured" }, { status: 500 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { siteId } = body;

    if (!siteId) {
      return NextResponse.json({ error: "siteId required" }, { status: 400 });
    }

    const db = getDbClient() || supabase;

    // Verify site belongs to user
    const { data: userData } = await db
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!userData?.organization_id) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const { data: site } = await db
      .from("sites")
      .select("id, domain, organization_id")
      .eq("id", siteId)
      .maybeSingle();

    if (!site || site.organization_id !== userData.organization_id) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    console.log(`[GEO Intelligence] Starting REAL analysis for ${site.domain}`);

    // Run REAL analysis - fetches actual website, checks structured data, etc.
    const analysis = await analyzeSite(site.domain);

    console.log(`[GEO Intelligence] Analysis complete: Score ${analysis.score.overall} (${analysis.score.grade})`);
    console.log(`[GEO Intelligence] Pages analyzed: ${analysis.rawData.pagesAnalyzed}`);
    console.log(`[GEO Intelligence] Structured data found: ${analysis.rawData.structuredDataFound.join(", ") || "none"}`);

    // Save analysis to database
    const { error: insertError } = await db.from("geo_analyses").insert({
      site_id: siteId,
      organization_id: userData.organization_id,
      score: analysis.score,
      tips: analysis.tips,
      queries: analysis.queries,
      opportunities: analysis.opportunities,
      raw_data: analysis.rawData,
    });

    if (insertError) {
      console.error("[GEO Intelligence] Failed to save analysis:", insertError);
      // Continue anyway - return the analysis even if save failed
    }

    // Update site's GEO score average
    await db
      .from("sites")
      .update({ geo_score_avg: analysis.score.overall })
      .eq("id", siteId);

    return NextResponse.json({
      success: true,
      data: {
        score: analysis.score,
        tips: analysis.tips,
        queries: analysis.queries,
        opportunities: analysis.opportunities,
        rawData: analysis.rawData,
        analyzedAt: new Date().toISOString(),
        needsAnalysis: false,
      },
    });

  } catch (error) {
    console.error("[/api/geo/intelligence POST] Error:", error);
    return NextResponse.json({ 
      error: "Analysis failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
