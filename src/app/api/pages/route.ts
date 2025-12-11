/**
 * Pages API
 * 
 * List and manage crawled pages with SEO and AIO data
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    if (!supabase) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization
    const { data: userData } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!userData?.organization_id) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId");
    const hasAioScore = searchParams.get("hasAioScore") === "true";
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Get user's sites
    const { data: sites } = await supabase
      .from("sites")
      .select("id")
      .eq("organization_id", userData.organization_id);

    if (!sites || sites.length === 0) {
      return NextResponse.json({
        success: true,
        pages: [],
        total: 0,
      });
    }

    const siteIds = (sites as { id: string }[]).map(s => s.id);

    // Build query
    let query = supabase
      .from("pages")
      .select(`
        id,
        url,
        path,
        title,
        meta_description,
        word_count,
        status_code,
        aio_score,
        aio_google_score,
        aio_chatgpt_score,
        aio_perplexity_score,
        aio_claude_score,
        aio_gemini_score,
        aio_last_analyzed,
        entity_count,
        quotability_score,
        answer_structure_score,
        has_expert_attribution,
        last_crawled_at,
        created_at
      `, { count: "exact" })
      .in("site_id", siteId ? [siteId] : siteIds)
      .order("aio_score", { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1);

    // Filter for pages with AIO scores if requested
    if (hasAioScore) {
      query = query.not("aio_score", "is", null);
    }

    const { data: pages, count, error } = await query;

    if (error) {
      console.error("Pages fetch error:", error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      pages: pages || [],
      total: count || 0,
    });
  } catch (error) {
    console.error("Pages API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch pages" },
      { status: 500 }
    );
  }
}

/**
 * POST - Trigger AIO analysis for a page
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    if (!supabase) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { pageId, action } = body;

    if (action === "analyze_aio" && pageId) {
      // Redirect to AIO analyze endpoint
      const analyzeResponse = await fetch(`${request.nextUrl.origin}/api/aio/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cookie": request.headers.get("cookie") || "",
        },
        body: JSON.stringify({ pageId, saveToDB: true }),
      });

      const result = await analyzeResponse.json();
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Pages API error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

