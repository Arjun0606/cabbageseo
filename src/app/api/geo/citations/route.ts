/**
 * Citations API
 * GET /api/geo/citations - Get all citations for a site
 * 
 * Query params:
 * - siteId: required
 * - all: if true, returns all citations (not just summary)
 * - platform: filter by platform
 * - limit: max results (default 50)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
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
    const all = searchParams.get("all") === "true";
    const platform = searchParams.get("platform");
    const limit = parseInt(searchParams.get("limit") || "50");

    if (!siteId) {
      return NextResponse.json({ error: "siteId required" }, { status: 400 });
    }

    // Use service client to bypass RLS for complex queries
    // Cast to any because Supabase types don't include the new Citation Intelligence schema yet
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = createServiceClient() as any;

    // Verify site belongs to user's org
    const { data: userData } = await db
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!userData?.organization_id) {
      return NextResponse.json({ error: "No organization" }, { status: 403 });
    }

    const { data: site } = await db
      .from("sites")
      .select("id, domain, organization_id, total_citations, citations_this_week, citations_last_week")
      .eq("id", siteId)
      .eq("organization_id", userData.organization_id)
      .single();

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    // Build citations query
    let query = db
      .from("citations")
      .select("id, site_id, platform, query, snippet, page_url, confidence, cited_at, last_checked_at, created_at")
      .eq("site_id", siteId)
      .order("cited_at", { ascending: false });

    if (platform) {
      query = query.eq("platform", platform);
    }

    query = query.limit(limit);

    const { data: citations, error: citationsError } = await query;

    if (citationsError) {
      console.error("Citations query error:", citationsError);
      return NextResponse.json({ error: "Failed to fetch citations" }, { status: 500 });
    }

    // Type assertion for citations
    type CitationRow = { id: string; platform: string; query: string; snippet: string; page_url: string; confidence: string; cited_at: string; last_checked_at: string };
    const citationsList = (citations || []) as CitationRow[];

    // Platform breakdown
    const byPlatform = {
      perplexity: citationsList.filter(c => c.platform === "perplexity").length,
      google_aio: citationsList.filter(c => c.platform === "google_aio").length,
      chatgpt: citationsList.filter(c => c.platform === "chatgpt").length,
    };

    // Calculate change percentage
    const lastWeek = site.citations_last_week || 0;
    const thisWeek = site.citations_this_week || 0;
    const change = lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : (thisWeek > 0 ? 100 : 0);

    if (all) {
      // Return full citations list
      return NextResponse.json({
        success: true,
        data: {
          total: site.total_citations || citationsList.length,
          thisWeek,
          lastWeek,
          change,
          byPlatform,
          citations: citationsList,
        },
      });
    } else {
      // Return summary with recent citations
      return NextResponse.json({
        success: true,
        data: {
          total: site.total_citations || citationsList.length,
          thisWeek,
          lastWeek,
          change,
          byPlatform,
          recent: citationsList.slice(0, 5),
        },
      });
    }
  } catch (error) {
    console.error("[Citations API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}
