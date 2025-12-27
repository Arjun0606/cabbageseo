/**
 * Keywords API
 * 
 * CRUD operations for keywords and clusters
 * 
 * REQUIRES: Paid subscription
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { requireSubscription } from "@/lib/api/require-subscription";

const TESTING_MODE = process.env.TESTING_MODE === "true";

interface KeywordRow {
  id: string;
  site_id: string;
  keyword: string;
  volume: number | null;
  difficulty: number | null;
  cpc: number | null;
  intent: string | null;
  current_position: number | null;
  previous_position: number | null;
  ranking_url: string | null;
  cluster_id: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

// GET - List keywords
export async function GET(request: NextRequest) {
  let supabase;
  try {
    supabase = TESTING_MODE ? createServiceClient() : await createClient();
  } catch (e) {
    console.error("[Keywords API] Supabase error:", e);
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }
  
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  let orgId: string | null = null;

  if (TESTING_MODE) {
    // In testing mode, get the first organization
    const { data: orgs } = await supabase.from("organizations").select("id").limit(1);
    orgId = (orgs?.[0] as { id: string } | undefined)?.id || null;
  } else {
    // Keywords require paid subscription
    const authCheck = await requireSubscription(supabase);
    if (!authCheck.authorized || !authCheck.userId) {
      return authCheck.error!;
    }

    // Get user's organization
    const { data: userData } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", authCheck.userId)
      .single();

    orgId = (userData as { organization_id?: string } | null)?.organization_id || null;
  }

  if (!orgId) {
    return NextResponse.json({ success: true, data: { keywords: [], clusters: [], total: 0 } });
  }

  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId");
    const clusterId = searchParams.get("clusterId");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Get user's sites
    const { data: sites } = await supabase
      .from("sites")
      .select("id, domain")
      .eq("organization_id", orgId);

    if (!sites || sites.length === 0) {
      return NextResponse.json({ success: true, data: { keywords: [], clusters: [], total: 0 } });
    }

    const siteIds = (sites as { id: string }[]).map(s => s.id);
    const siteLookup = Object.fromEntries(
      (sites as { id: string; domain: string }[]).map(s => [s.id, s.domain])
    );

    // Build keywords query
    let query = supabase
      .from("keywords")
      .select("*", { count: "exact" })
      .in("site_id", siteId ? [siteId] : siteIds)
      .order("volume", { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1);

    if (clusterId) {
      query = query.eq("cluster_id", clusterId);
    }

    if (search) {
      query = query.ilike("keyword", `%${search}%`);
    }

    const { data: keywords, count, error } = await query;

    if (error) {
      console.error("Keywords fetch error:", error);
      throw error;
    }

    // Transform keywords
    const transformedKeywords = ((keywords || []) as KeywordRow[]).map(kw => ({
      id: kw.id,
      keyword: kw.keyword,
      volume: kw.volume || 0,
      difficulty: kw.difficulty || 0,
      cpc: kw.cpc || 0,
      intent: kw.intent || "informational",
      position: kw.current_position,
      previousPosition: kw.previous_position,
      url: kw.ranking_url,
      clusterId: kw.cluster_id,
      siteId: kw.site_id,
      siteDomain: siteLookup[kw.site_id] || "Unknown",
      trend: getTrend(kw.current_position, kw.previous_position),
    }));

    // Get clusters
    const { data: clusters } = await supabase
      .from("keyword_clusters")
      .select("*")
      .in("site_id", siteId ? [siteId] : siteIds)
      .order("total_volume", { ascending: false, nullsFirst: false });

    const transformedClusters = ((clusters || []) as Array<{
      id: string;
      name: string;
      pillar_keyword: string;
      total_volume: number;
      avg_difficulty: number;
      keyword_count: number;
      content_status: string;
      site_id: string;
    }>).map(c => ({
      id: c.id,
      name: c.name,
      pillarKeyword: c.pillar_keyword,
      totalVolume: c.total_volume || 0,
      avgDifficulty: c.avg_difficulty || 0,
      keywordCount: c.keyword_count || 0,
      contentStatus: c.content_status || "none",
      siteId: c.site_id,
      siteDomain: siteLookup[c.site_id] || "Unknown",
    }));

    // Get stats - format expected by the UI
    const stats = {
      total: count || 0,
      top10: transformedKeywords.filter(k => k.position !== null && k.position <= 10).length,
      quickWins: transformedKeywords.filter(k => k.difficulty <= 30 && k.volume >= 100).length,
      clusterCount: transformedClusters.length,
      // Also include additional stats for other UI elements
      totalVolume: transformedKeywords.reduce((sum, k) => sum + k.volume, 0),
      avgDifficulty: transformedKeywords.length > 0
        ? Math.round(transformedKeywords.reduce((sum, k) => sum + k.difficulty, 0) / transformedKeywords.length)
        : 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        keywords: transformedKeywords,
        clusters: transformedClusters,
        stats,
        total: count || 0,
      },
    });

  } catch (error) {
    console.error("[Keywords API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch keywords" },
      { status: 500 }
    );
  }
}

// POST - Add keywords
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { siteId, keywords, clusterId } = body;

    if (!siteId || !keywords || !Array.isArray(keywords)) {
      return NextResponse.json({ error: "Site ID and keywords array are required" }, { status: 400 });
    }

    // Verify user owns this site
    const { data: userData } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    const orgId = (userData as { organization_id?: string } | null)?.organization_id;
    if (!orgId) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    const { data: site } = await supabase
      .from("sites")
      .select("id")
      .eq("id", siteId)
      .eq("organization_id", orgId)
      .single();

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    // Insert keywords
    const keywordRows = keywords.map((kw: { keyword: string; volume?: number; difficulty?: number; cpc?: number; intent?: string }) => ({
      site_id: siteId,
      keyword: kw.keyword.toLowerCase().trim(),
      volume: kw.volume || null,
      difficulty: kw.difficulty || null,
      cpc: kw.cpc || null,
      intent: kw.intent || null,
      cluster_id: clusterId || null,
      status: "active",
    }));

    const { data: newKeywords, error } = await supabase
      .from("keywords")
      .upsert(keywordRows as never[], { onConflict: "site_id,keyword" })
      .select();

    if (error) {
      console.error("Keywords insert error:", error);
      throw error;
    }

    return NextResponse.json({ 
      success: true, 
      data: newKeywords,
      count: (newKeywords as unknown[])?.length || 0,
    });

  } catch (error) {
    console.error("[Keywords API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to add keywords" },
      { status: 500 }
    );
  }
}

// DELETE - Remove keywords
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get("ids")?.split(",").filter(Boolean);

    if (!ids || ids.length === 0) {
      return NextResponse.json({ error: "Keyword IDs are required" }, { status: 400 });
    }

    // Verify ownership
    const { data: userData } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    const orgId = (userData as { organization_id?: string } | null)?.organization_id;
    if (!orgId) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    // Get sites for org
    const { data: sites } = await supabase
      .from("sites")
      .select("id")
      .eq("organization_id", orgId);

    const siteIds = (sites as { id: string }[] | null)?.map(s => s.id) || [];

    // Delete keywords that belong to user's sites
    const { error } = await supabase
      .from("keywords")
      .delete()
      .in("id", ids)
      .in("site_id", siteIds);

    if (error) {
      console.error("Keywords delete error:", error);
      throw error;
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("[Keywords API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete keywords" },
      { status: 500 }
    );
  }
}

// Helper function
function getTrend(current: number | null, previous: number | null): "up" | "down" | "stable" {
  if (current === null || previous === null) return "stable";
  if (current < previous) return "up"; // Lower position is better
  if (current > previous) return "down";
  return "stable";
}

