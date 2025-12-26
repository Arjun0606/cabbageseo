/**
 * Single Site API
 * GET /api/sites/[siteId] - Get site details
 * PATCH /api/sites/[siteId] - Update site
 * DELETE /api/sites/[siteId] - Delete site
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const TESTING_MODE = process.env.TESTING_MODE === "true";

// Type for site with audits
interface SiteWithAudits {
  id: string;
  domain: string;
  organization_id: string;
  settings: Record<string, unknown> | null;
  is_active: boolean;
  pages_count: number | null;
  last_crawl_at: string | null;
  created_at: string;
  updated_at: string;
  audits: Array<{
    id: string;
    seo_score: number | null;
    aio_score: number | null;
    issues_count: number;
    pages_crawled: number;
    completed_at: string | null;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const { siteId } = await params;

  let supabase;
  try {
    supabase = TESTING_MODE ? createServiceClient() : await createClient();
  } catch (e) {
    console.error("[Sites API] Error creating client:", e);
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    // Get site with latest audit data
    const { data, error } = await supabase
      .from("sites")
      .select(`
        id,
        domain,
        organization_id,
        settings,
        is_active,
        pages_count,
        last_crawl_at,
        created_at,
        updated_at,
        audits (
          id,
          seo_score,
          aio_score,
          issues_count,
          pages_crawled,
          completed_at
        )
      `)
      .eq("id", siteId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Site not found" }, { status: 404 });
      }
      throw error;
    }

    // Cast to our type
    const site = data as unknown as SiteWithAudits;

    // Get the latest audit
    const latestAudit = site.audits?.sort((a, b) => 
      new Date(b.completed_at || 0).getTime() - new Date(a.completed_at || 0).getTime()
    )[0];

    // Transform response
    const response = {
      id: site.id,
      domain: site.domain,
      name: (site.settings as Record<string, unknown>)?.name || site.domain,
      organizationId: site.organization_id,
      settings: site.settings,
      isActive: site.is_active,
      pagesCount: site.pages_count || latestAudit?.pages_crawled || 0,
      seoScore: latestAudit?.seo_score || null,
      aioScore: latestAudit?.aio_score || null,
      issuesCount: latestAudit?.issues_count || 0,
      lastCrawlAt: site.last_crawl_at,
      createdAt: site.created_at,
      updatedAt: site.updated_at,
    };

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error("[Sites API] Error fetching site:", error);
    return NextResponse.json(
      { error: "Failed to fetch site" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const { siteId } = await params;

  let supabase;
  try {
    supabase = TESTING_MODE ? createServiceClient() : await createClient();
  } catch (e) {
    console.error("[Sites API] Error creating client:", e);
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { name, settings } = body;

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (settings) {
      // Merge with existing settings
      const { data: existingSite } = await supabase
        .from("sites")
        .select("settings")
        .eq("id", siteId)
        .single();

      const existingSettings = (existingSite as { settings: Record<string, unknown> } | null)?.settings || {};
      updates.settings = {
        ...existingSettings,
        ...settings,
        ...(name && { name }),
      };
    } else if (name) {
      const { data: existingSite } = await supabase
        .from("sites")
        .select("settings")
        .eq("id", siteId)
        .single();

      const existingSettings = (existingSite as { settings: Record<string, unknown> } | null)?.settings || {};
      updates.settings = {
        ...existingSettings,
        name,
      };
    }

    const { data, error } = await supabase
      .from("sites")
      .update(updates as never)
      .eq("id", siteId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("[Sites API] Error updating site:", error);
    return NextResponse.json(
      { error: "Failed to update site" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const { siteId } = await params;

  let supabase;
  try {
    supabase = TESTING_MODE ? createServiceClient() : await createClient();
  } catch (e) {
    console.error("[Sites API] Error creating client:", e);
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const { error } = await supabase
      .from("sites")
      .delete()
      .eq("id", siteId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Sites API] Error deleting site:", error);
    return NextResponse.json(
      { error: "Failed to delete site" },
      { status: 500 }
    );
  }
}

