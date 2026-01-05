/**
 * /api/geo/citations - Get Citations
 * 
 * GET: Fetch citations for a site
 * Query params:
 *   - siteId: Required site ID
 *   - full: If true, return all citations (for Citations page)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

function getDbClient(): SupabaseClient | null {
  try {
    return createServiceClient();
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
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
    const full = searchParams.get("full") === "true";

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
      .select("id, organization_id, total_citations, citations_this_week, citations_last_week")
      .eq("id", siteId)
      .maybeSingle();

    if (!site || site.organization_id !== userData.organization_id) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    // Get citations
    const query = db
      .from("citations")
      .select("id, platform, query, snippet, page_url, confidence, cited_at, created_at")
      .eq("site_id", siteId)
      .order("cited_at", { ascending: false });

    if (!full) {
      query.limit(10);
    }

    const { data: citations, error } = await query;

    if (error) {
      console.error("Citations fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch citations" }, { status: 500 });
    }

    // Helper to convert confidence (string or number) to normalized number
    const confidenceToNumber = (conf: string | number | null | undefined): number => {
      if (conf === null || conf === undefined) return 0.7;
      
      // Handle numeric values
      if (typeof conf === "number") {
        if (conf > 1) return conf / 100; // Convert 0-100 range to 0-1
        return conf;
      }
      
      // Handle string values
      const confStr = String(conf).toLowerCase();
      if (confStr === "high") return 0.9;
      if (confStr === "medium") return 0.7;
      if (confStr === "low") return 0.5;
      
      // Try parsing as number
      const parsed = parseFloat(confStr);
      if (!isNaN(parsed)) {
        return parsed > 1 ? parsed / 100 : parsed;
      }
      
      return 0.7;
    };

    // Format citations - use camelCase for frontend
    const formattedCitations = (citations || []).map((c: {
      id: string;
      platform: string;
      query: string;
      snippet?: string;
      page_url?: string;
      confidence?: string;
      cited_at: string;
      created_at: string;
    }) => ({
      id: c.id,
      platform: c.platform,
      query: c.query,
      snippet: c.snippet || "",
      pageUrl: c.page_url,
      confidence: confidenceToNumber(c.confidence || null),
      discoveredAt: c.cited_at || c.created_at,
    }));

    // Calculate platform breakdown
    const byPlatform = {
      perplexity: 0,
      google_aio: 0,
      chatgpt: 0,
    };

    for (const c of formattedCitations) {
      if (c.platform in byPlatform) {
        byPlatform[c.platform as keyof typeof byPlatform]++;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        total: site.total_citations || 0,
        thisWeek: site.citations_this_week || 0,
        lastWeek: site.citations_last_week || 0,
        byPlatform,
        citations: full ? formattedCitations : undefined,
        recent: formattedCitations.slice(0, 10),
      },
    });

  } catch (error) {
    console.error("[/api/geo/citations GET] Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
