/**
 * AI Citations Tracking API
 * 
 * Track and manage citations of your content by AI platforms.
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
    const platform = searchParams.get("platform");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build query
    let query = supabase
      .from("ai_citations")
      .select(`
        *,
        pages!inner(
          url,
          title,
          sites!inner(organization_id)
        )
      `)
      .eq("pages.sites.organization_id", userData.organization_id)
      .order("discovered_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (siteId) {
      query = query.eq("site_id", siteId);
    }

    if (platform) {
      query = query.eq("platform", platform);
    }

    const { data: citations, error, count } = await query;

    if (error) {
      console.error("Citations fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch citations" }, { status: 500 });
    }

    // Get citation stats by platform
    const { data: stats } = await supabase
      .from("ai_citations")
      .select("platform")
      .eq("site_id", siteId || "");

    const platformCounts: Record<string, number> = {
      google_aio: 0,
      chatgpt: 0,
      perplexity: 0,
      claude: 0,
      gemini: 0,
    };

    if (stats) {
      for (const row of stats) {
        if (row.platform in platformCounts) {
          platformCounts[row.platform]++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        citations: citations || [],
        total: count || 0,
        platformCounts,
      },
    });
  } catch (error) {
    console.error("Citations API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch citations" },
      { status: 500 }
    );
  }
}

/**
 * POST - Record a new citation discovery
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
    const {
      siteId,
      pageId,
      platform,
      query,
      citationType = "source_link",
      snippet,
      position,
      confidence = 0.8,
    } = body;

    if (!siteId || !platform || !query) {
      return NextResponse.json(
        { error: "siteId, platform, and query are required" },
        { status: 400 }
      );
    }

    // Verify site ownership
    const { data: userData } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!userData?.organization_id) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    const { data: site } = await supabase
      .from("sites")
      .select("id")
      .eq("id", siteId)
      .eq("organization_id", userData.organization_id)
      .single();

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    // Insert citation
    const { data: citation, error } = await supabase
      .from("ai_citations")
      .upsert({
        site_id: siteId,
        page_id: pageId || null,
        platform,
        query,
        citation_type: citationType,
        snippet,
        position,
        confidence,
        discovered_at: new Date().toISOString(),
        last_verified_at: new Date().toISOString(),
      } as never, {
        onConflict: "site_id,platform,query,page_id",
      })
      .select()
      .single();

    if (error) {
      console.error("Citation insert error:", error);
      return NextResponse.json({ error: "Failed to record citation" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: citation,
    });
  } catch (error) {
    console.error("Citations POST error:", error);
    return NextResponse.json(
      { error: "Failed to record citation" },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Remove a citation
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    if (!supabase) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const citationId = searchParams.get("id");

    if (!citationId) {
      return NextResponse.json(
        { error: "Citation ID is required" },
        { status: 400 }
      );
    }

    // Verify ownership through organization
    const { data: userData } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!userData?.organization_id) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    const { error } = await supabase
      .from("ai_citations")
      .delete()
      .eq("id", citationId);

    if (error) {
      console.error("Citation delete error:", error);
      return NextResponse.json({ error: "Failed to delete citation" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Citation deleted",
    });
  } catch (error) {
    console.error("Citations DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete citation" },
      { status: 500 }
    );
  }
}

