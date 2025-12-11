/**
 * Sites API
 * 
 * Manage sites for the organization
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface SiteRow {
  id: string;
  domain: string;
  name: string;
  url: string;
  status: string;
  settings: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

// GET - List sites
export async function GET() {
  const supabase = await createClient();
  
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get user's organization
    const { data: userData } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    const orgId = (userData as { organization_id?: string } | null)?.organization_id;
    if (!orgId) {
      return NextResponse.json({ success: true, data: { sites: [], stats: { total: 0 } } });
    }

    // Get sites
    const { data: sites, error } = await supabase
      .from("sites")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const siteRows = (sites || []) as SiteRow[];

    // Get stats for each site
    const sitesWithStats = await Promise.all(
      siteRows.map(async (site) => {
        // Get keyword count
        const { count: keywordCount } = await supabase
          .from("keywords")
          .select("id", { count: "exact" })
          .eq("site_id", site.id);

        // Get content count
        const { count: contentCount } = await supabase
          .from("content")
          .select("id", { count: "exact" })
          .eq("site_id", site.id);

        // Get issue count
        const { count: issueCount } = await supabase
          .from("issues")
          .select("id", { count: "exact" })
          .eq("site_id", site.id)
          .eq("status", "open");

        // Get integrations
        const { data: integrations } = await supabase
          .from("integrations")
          .select("type, status")
          .or(`site_id.eq.${site.id},site_id.is.null`)
          .eq("organization_id", orgId);

        const integrationsData = (integrations || []) as { type: string; status: string }[];
        const hasGSC = integrationsData.some(i => i.type === "gsc" && i.status === "connected");
        const hasCMS = integrationsData.some(i => ["wordpress", "webflow", "shopify"].includes(i.type) && i.status === "connected");
        const cmsType = integrationsData.find(i => ["wordpress", "webflow", "shopify"].includes(i.type) && i.status === "connected")?.type;

        return {
          id: site.id,
          domain: site.domain,
          name: site.name,
          url: site.url,
          status: site.status,
          keywords: keywordCount || 0,
          content: contentCount || 0,
          issues: issueCount || 0,
          gscConnected: hasGSC,
          cmsConnected: hasCMS,
          cmsType: cmsType || null,
          autopilotEnabled: (site.settings as { autopilot?: boolean } | null)?.autopilot || false,
          createdAt: site.created_at,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        sites: sitesWithStats,
        stats: {
          total: sitesWithStats.length,
          withGSC: sitesWithStats.filter(s => s.gscConnected).length,
          withCMS: sitesWithStats.filter(s => s.cmsConnected).length,
        },
      },
    });

  } catch (error) {
    console.error("[Sites API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch sites" },
      { status: 500 }
    );
  }
}

// POST - Create site
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
    const { domain, name, url } = body;

    if (!domain) {
      return NextResponse.json({ error: "Domain is required" }, { status: 400 });
    }

    // Get user's organization
    const { data: userData } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    const orgId = (userData as { organization_id?: string } | null)?.organization_id;
    if (!orgId) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    // Create site
    const { data: newSite, error } = await supabase
      .from("sites")
      .insert({
        organization_id: orgId,
        domain: domain.replace(/^https?:\/\//, "").replace(/\/$/, ""),
        name: name || domain,
        url: url || `https://${domain}`,
        status: "active",
      } as never)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data: newSite });

  } catch (error) {
    console.error("[Sites API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create site" },
      { status: 500 }
    );
  }
}

// DELETE - Delete site
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
    const siteId = searchParams.get("id");

    if (!siteId) {
      return NextResponse.json({ error: "Site ID is required" }, { status: 400 });
    }

    // Get user's organization
    const { data: userData } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    const orgId = (userData as { organization_id?: string } | null)?.organization_id;
    if (!orgId) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    // Delete site (cascade will handle related data)
    const { error } = await supabase
      .from("sites")
      .delete()
      .eq("id", siteId)
      .eq("organization_id", orgId);

    if (error) throw error;

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("[Sites API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete site" },
      { status: 500 }
    );
  }
}

