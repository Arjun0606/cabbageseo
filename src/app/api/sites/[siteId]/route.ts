/**
 * Single Site API
 * GET /api/sites/[siteId] - Get site details
 * PATCH /api/sites/[siteId] - Update site
 * DELETE /api/sites/[siteId] - Delete site
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Type for site with audits
interface SiteWithAudits {
  id: string;
  domain: string;
  organization_id: string;
  settings: Record<string, unknown> | null;
  is_active: boolean;
  last_crawl_pages_count: number | null;
  last_crawl_at: string | null;
  created_at: string;
  updated_at: string;
  audits: Array<{
    id: string;
    overall_score: number | null;
    aio_score: number | null;
    issues_found: number;
    pages_scanned: number;
    completed_at: string | null;
  }>;
}

/**
 * Get the authenticated user's organization ID.
 */
async function getAuthOrgId(supabase: any): Promise<{ orgId: string | null; error?: NextResponse }> {

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { orgId: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const { data: userData } = await supabase
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .maybeSingle();

  const orgId = (userData as { organization_id?: string } | null)?.organization_id;
  if (!orgId) {
    return { orgId: null, error: NextResponse.json({ error: "No organization found" }, { status: 400 }) };
  }

  return { orgId };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const { siteId } = await params;

  let supabase;
  try {
    supabase = await createClient();
  } catch (e) {
    console.error("[Sites API] Error creating client:", e);
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  // Verify org ownership
  const auth = await getAuthOrgId(supabase);
  if (auth.error) return auth.error;

  try {
    // Get site with latest audit data
    let query = supabase
      .from("sites")
      .select(`
        id,
        domain,
        organization_id,
        settings,
        is_active,
        last_crawl_pages_count,
        last_crawl_at,
        created_at,
        updated_at,
        audits (
          id,
          overall_score,
          aio_score,
          issues_found,
          pages_scanned,
          completed_at
        )
      `)
      .eq("id", siteId);

    // Add org ownership filter when not in testing mode
    if (auth.orgId) {
      query = query.eq("organization_id", auth.orgId);
    }

    const { data, error } = await query.maybeSingle();

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
      pagesCount: site.last_crawl_pages_count || latestAudit?.pages_scanned || 0,
      seoScore: latestAudit?.overall_score || null,
      aioScore: latestAudit?.aio_score || null,
      issuesCount: latestAudit?.issues_found || 0,
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
    supabase = await createClient();
  } catch (e) {
    console.error("[Sites API] Error creating client:", e);
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  // Verify org ownership
  const auth = await getAuthOrgId(supabase);
  if (auth.error) return auth.error;

  try {
    // Verify site belongs to user's org
    if (auth.orgId) {
      const { data: siteCheck } = await supabase
        .from("sites")
        .select("id")
        .eq("id", siteId)
        .eq("organization_id", auth.orgId)
        .maybeSingle();
      if (!siteCheck) {
        return NextResponse.json({ error: "Site not found" }, { status: 404 });
      }
    }

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
        .maybeSingle();

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
        .maybeSingle();

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
      .maybeSingle();

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
    supabase = await createClient();
  } catch (e) {
    console.error("[Sites API] Error creating client:", e);
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  // Verify org ownership
  const auth = await getAuthOrgId(supabase);
  if (auth.error) return auth.error;

  try {
    let query = supabase
      .from("sites")
      .delete()
      .eq("id", siteId);

    // Add org ownership filter when not in testing mode
    if (auth.orgId) {
      query = query.eq("organization_id", auth.orgId);
    }

    const { error } = await query;

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
