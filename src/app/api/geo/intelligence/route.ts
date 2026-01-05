/**
 * GEO Intelligence API
 * 
 * GET /api/geo/intelligence?siteId=xxx
 * Returns full GEO analysis: score, tips, queries, opportunities
 * 
 * POST /api/geo/intelligence
 * Run new GEO analysis for a site
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { geoIntelligence } from "@/lib/geo/geo-intelligence";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
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

  const serviceClient = createServiceClient();

  try {
    // Get user's organization
    const { data: userData } = await serviceClient
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    const orgId = (userData as { organization_id?: string } | null)?.organization_id;
    if (!orgId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Verify site belongs to user
    const { data: siteData } = await (serviceClient as any)
      .from("sites")
      .select("id, domain, niche, geo_score_avg")
      .eq("id", siteId)
      .eq("organization_id", orgId)
      .single();

    if (!siteData) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    const site = siteData as { id: string; domain: string; niche?: string; geo_score_avg?: number };

    // Get competitors
    const { data: competitorData } = await (serviceClient as any)
      .from("competitors")
      .select("domain")
      .eq("site_id", siteId);

    const competitors = (competitorData || []).map((c: { domain: string }) => c.domain);

    // Get cached GEO analysis if recent (within 24 hours)
    const { data: cachedAnalysis } = await (serviceClient as any)
      .from("geo_analyses")
      .select("*")
      .eq("site_id", siteId)
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (cachedAnalysis) {
      return NextResponse.json({
        success: true,
        data: {
          score: cachedAnalysis.score,
          tips: cachedAnalysis.tips,
          queries: cachedAnalysis.queries,
          opportunities: cachedAnalysis.opportunities,
          cachedAt: cachedAnalysis.created_at,
        },
      });
    }

    // No cache, return basic data (full analysis requires POST)
    return NextResponse.json({
      success: true,
      data: {
        score: site.geo_score_avg ? {
          overall: site.geo_score_avg,
          breakdown: null,
          grade: site.geo_score_avg >= 90 ? "A" : site.geo_score_avg >= 75 ? "B" : site.geo_score_avg >= 60 ? "C" : site.geo_score_avg >= 40 ? "D" : "F",
          summary: "Run a full analysis for detailed breakdown.",
        } : null,
        tips: [],
        queries: [],
        opportunities: [],
        needsAnalysis: true,
      },
    });
  } catch (error) {
    console.error("[GEO Intelligence GET] Error:", error);
    return NextResponse.json({ error: "Failed to fetch analysis" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
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

  const serviceClient = createServiceClient();

  try {
    // Get user's organization
    const { data: userData } = await serviceClient
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    const orgId = (userData as { organization_id?: string } | null)?.organization_id;
    if (!orgId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Verify site belongs to user
    const { data: siteData } = await (serviceClient as any)
      .from("sites")
      .select("id, domain, niche")
      .eq("id", siteId)
      .eq("organization_id", orgId)
      .single();

    if (!siteData) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    const site = siteData as { id: string; domain: string; niche?: string };

    // Get competitors
    const { data: competitorData } = await (serviceClient as any)
      .from("competitors")
      .select("domain")
      .eq("site_id", siteId);

    const competitors = (competitorData || []).map((c: { domain: string }) => c.domain);

    // Run full GEO analysis
    const analysis = await geoIntelligence.getFullAnalysis(
      siteId,
      site.domain,
      site.niche || site.domain,
      competitors
    );

    // Cache the analysis
    await (serviceClient as any).from("geo_analyses").insert({
      site_id: siteId,
      organization_id: orgId,
      score: analysis.score,
      tips: analysis.tips,
      queries: analysis.queries,
      opportunities: analysis.opportunities,
    });

    // Update site's GEO score
    await (serviceClient as any)
      .from("sites")
      .update({ geo_score_avg: analysis.score.overall })
      .eq("id", siteId);

    return NextResponse.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error("[GEO Intelligence POST] Error:", error);
    return NextResponse.json({ error: "Failed to run analysis" }, { status: 500 });
  }
}

