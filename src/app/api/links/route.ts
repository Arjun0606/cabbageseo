/**
 * Internal Links API
 * 
 * Manages internal linking suggestions and opportunities
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface PageRow {
  id: string;
  url: string;
  title: string | null;
  internal_links_in: number | null;
  internal_links_out: number | null;
}

interface ContentRow {
  id: string;
  title: string;
  url: string | null;
  slug: string | null;
  internal_links: unknown[] | null;
  suggested_internal_links: unknown[] | null;
}

// GET - Get internal linking data
export async function GET(request: NextRequest) {
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
    const siteId = searchParams.get("siteId");

    // Get user's organization
    const { data: userData } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    const orgId = (userData as { organization_id?: string } | null)?.organization_id;
    if (!orgId) {
      return NextResponse.json({
        success: true,
        data: { opportunities: [], orphanPages: [], stats: { total: 0, applied: 0, pending: 0 } },
      });
    }

    // Get sites for this org
    let siteIds: string[] = [];
    if (siteId) {
      siteIds = [siteId];
    } else {
      const { data: sites } = await supabase
        .from("sites")
        .select("id")
        .eq("organization_id", orgId);
      siteIds = ((sites || []) as { id: string }[]).map(s => s.id);
    }

    if (siteIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: { opportunities: [], orphanPages: [], stats: { total: 0, applied: 0, pending: 0 } },
      });
    }

    // Get pages with low internal links (orphans)
    const { data: pages } = await supabase
      .from("pages")
      .select("id, url, title, internal_links_in, internal_links_out")
      .in("site_id", siteIds)
      .or("internal_links_in.eq.0,internal_links_in.is.null")
      .limit(20);

    const pageRows = (pages || []) as PageRow[];

    const orphanPages = pageRows.map(p => ({
      id: p.id,
      url: p.url,
      title: p.title || p.url,
      incomingLinks: p.internal_links_in || 0,
      outgoingLinks: p.internal_links_out || 0,
    }));

    // Get content with suggested internal links
    const { data: content } = await supabase
      .from("content")
      .select("id, title, url, slug, internal_links, suggested_internal_links")
      .in("site_id", siteIds)
      .not("suggested_internal_links", "is", null);

    const contentRows = (content || []) as ContentRow[];

    // Build opportunities from suggested links
    const opportunities: Array<{
      id: string;
      fromPage: string;
      fromTitle: string;
      toPage: string;
      toTitle: string;
      anchorText: string;
      context: string;
      impact: "high" | "medium" | "low";
      status: "pending" | "applied" | "ignored";
    }> = [];

    contentRows.forEach(c => {
      const suggestions = (c.suggested_internal_links || []) as Array<{
        targetUrl?: string;
        targetTitle?: string;
        anchorText?: string;
        context?: string;
        applied?: boolean;
      }>;
      
      suggestions.forEach((suggestion, idx) => {
        opportunities.push({
          id: `${c.id}-${idx}`,
          fromPage: c.url || c.slug || "",
          fromTitle: c.title,
          toPage: suggestion.targetUrl || "",
          toTitle: suggestion.targetTitle || "",
          anchorText: suggestion.anchorText || "",
          context: suggestion.context || "",
          impact: idx < 2 ? "high" : idx < 5 ? "medium" : "low",
          status: suggestion.applied ? "applied" : "pending",
        });
      });
    });

    const stats = {
      total: opportunities.length,
      pending: opportunities.filter(o => o.status === "pending").length,
      applied: opportunities.filter(o => o.status === "applied").length,
      orphanCount: orphanPages.length,
    };

    return NextResponse.json({
      success: true,
      data: {
        opportunities,
        orphanPages,
        stats,
      },
    });

  } catch (error) {
    console.error("[Links API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch links" },
      { status: 500 }
    );
  }
}

// POST - Apply or ignore a link suggestion
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
    const { contentId, linkIndex, action } = body;

    if (!contentId || linkIndex === undefined || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get content
    const { data: content, error: fetchError } = await supabase
      .from("content")
      .select("suggested_internal_links, internal_links")
      .eq("id", contentId)
      .single();

    if (fetchError || !content) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    const contentData = content as { suggested_internal_links: unknown[]; internal_links: unknown[] };
    const suggestions = [...(contentData.suggested_internal_links || [])] as Array<Record<string, unknown>>;
    
    if (linkIndex >= suggestions.length) {
      return NextResponse.json({ error: "Invalid link index" }, { status: 400 });
    }

    if (action === "apply") {
      // Mark as applied and add to internal_links
      suggestions[linkIndex] = { ...suggestions[linkIndex], applied: true };
      const internalLinks = [...(contentData.internal_links || []), suggestions[linkIndex]];

      await supabase
        .from("content")
        .update({
          suggested_internal_links: suggestions,
          internal_links: internalLinks,
        } as never)
        .eq("id", contentId);
    } else if (action === "ignore") {
      // Remove from suggestions
      suggestions.splice(linkIndex, 1);
      
      await supabase
        .from("content")
        .update({ suggested_internal_links: suggestions } as never)
        .eq("id", contentId);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("[Links API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update link" },
      { status: 500 }
    );
  }
}

