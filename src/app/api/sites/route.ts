/**
 * Sites API
 * 
 * Manage sites for the organization
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

interface SiteRow {
  id: string;
  domain: string;
  name: string;
  is_active: boolean;
  autopilot_enabled: boolean;
  settings: Record<string, unknown> | null;
  seo_score: number | null;
  gsc_connected: boolean;
  cms_connected: boolean;
  cms_type: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// 🔓 TESTING MODE - AUTH BYPASS
// ============================================
const TESTING_MODE = true;

// GET - List sites
export async function GET() {
  // Use service client in testing mode to bypass RLS
  const supabase = TESTING_MODE ? createServiceClient() : await createClient();
  
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  let orgId: string | null = null;

  if (TESTING_MODE) {
    // Get or create test org using service client (bypasses RLS)
    const { data: testOrg, error: orgError } = await supabase
      .from("organizations")
      .select("id")
      .limit(1)
      .single();
    
    if (orgError && orgError.code === 'PGRST116') {
      // No org exists, create one
      const { data: newOrg, error: createError } = await supabase
        .from("organizations")
        .insert({ name: "Test Organization", plan: "starter" })
        .select("id")
        .single();
      
      if (createError) {
        console.error("[Sites API] Failed to create org:", createError);
        return NextResponse.json({ success: true, data: { sites: [], stats: { total: 0 } } });
      }
      orgId = (newOrg as { id: string } | null)?.id || null;
    } else if (testOrg) {
      orgId = (testOrg as { id: string }).id;
    }
  } else {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    orgId = (userData as { organization_id?: string } | null)?.organization_id || null;
  }

  if (!orgId) {
    return NextResponse.json({ success: true, data: { sites: [], stats: { total: 0 } } });
  }

  try {

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
          .eq("is_resolved", false);

        return {
          id: site.id,
          domain: site.domain,
          name: site.name,
          url: `https://${site.domain}`,
          status: site.is_active ? "active" : "inactive",
          seoScore: site.seo_score || 0,
          keywords: keywordCount || 0,
          content: contentCount || 0,
          issues: issueCount || 0,
          gscConnected: site.gsc_connected || false,
          cmsConnected: site.cms_connected || false,
          cmsType: site.cms_type || null,
          autopilotEnabled: site.autopilot_enabled || false,
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
  // Use service client in testing mode to bypass RLS
  const supabase = TESTING_MODE ? createServiceClient() : await createClient();
  
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  let orgId: string | null = null;

  if (TESTING_MODE) {
    // Get or create test org using service client (bypasses RLS)
    const { data: testOrg, error: orgError } = await supabase
      .from("organizations")
      .select("id")
      .limit(1)
      .single();
    
    if (orgError && orgError.code === 'PGRST116') {
      // No org exists, create one
      const { data: newOrg, error: createError } = await supabase
        .from("organizations")
        .insert({ name: "Test Organization", plan: "starter" })
        .select("id")
        .single();
      
      if (createError) {
        console.error("[Sites API POST] Failed to create org:", createError);
        return NextResponse.json({ error: "Failed to create organization" }, { status: 500 });
      }
      orgId = (newOrg as { id: string } | null)?.id || null;
    } else if (testOrg) {
      orgId = (testOrg as { id: string }).id;
    }
  } else {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    orgId = (userData as { organization_id?: string } | null)?.organization_id || null;
  }

  if (!orgId) {
    return NextResponse.json({ error: "No organization found - please try again" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { domain, name } = body;

    if (!domain) {
      return NextResponse.json({ error: "Domain is required" }, { status: 400 });
    }

    // Create site
    const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/$/, "");
    const { data: newSite, error } = await supabase
      .from("sites")
      .insert({
        organization_id: orgId,
        domain: cleanDomain,
        name: name || cleanDomain,
        is_active: true,
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

