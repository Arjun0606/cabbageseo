/**
 * Sites API - Completely Rewritten for Reliability
 * 
 * GET /api/sites - List all sites
 * POST /api/sites - Create a new site
 * DELETE /api/sites?id=xxx - Delete a site
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

// ============================================
// HELPER: Get service client safely
// ============================================
function getServiceClient(): SupabaseClient | null {
  try {
    return createServiceClient();
  } catch {
    console.warn("[Sites API] Service client not available - missing SUPABASE_SERVICE_ROLE_KEY");
    return null;
  }
}

// ============================================
// HELPER: Get or create organization for user
// ============================================
async function ensureUserHasOrg(
  userId: string, 
  email: string | undefined,
  name: string | undefined,
  client: SupabaseClient
): Promise<string | null> {
  // First check if user already has an org
  const { data: userData, error: userError } = await client
    .from("users")
    .select("organization_id")
    .eq("id", userId)
    .maybeSingle();

  if (userData?.organization_id) {
    return userData.organization_id;
  }

  // No org found - create one
  console.log("[Sites API] Creating organization for user:", email);

  const orgSlug = (email?.split("@")[0]?.replace(/[^a-z0-9]/gi, "") || "user") + "-" + Date.now();
  
  const { data: newOrg, error: orgError } = await client
    .from("organizations")
    .insert({
      name: name || email?.split("@")[0] || "My Organization",
      slug: orgSlug,
      plan: "starter",
      subscription_status: "active",
    })
    .select("id")
    .single();

  if (orgError || !newOrg) {
    console.error("[Sites API] Failed to create organization:", orgError);
    return null;
  }

  const orgId = newOrg.id;

  // Link user to org
  if (userError || !userData) {
    // User row doesn't exist - create it
    await client.from("users").insert({
      id: userId,
      organization_id: orgId,
      email: email || "",
      name: name || null,
      role: "owner",
    });
  } else {
    // User exists but no org - update
    await client.from("users").update({ organization_id: orgId }).eq("id", userId);
  }

  console.log("[Sites API] Created org:", orgId);
  return orgId;
}

// ============================================
// GET - List sites
// ============================================
export async function GET(request: NextRequest) {
  try {
    // Create auth client
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ 
        success: true, 
        data: { sites: [], stats: { total: 0 } },
        message: "Database not configured" 
      });
    }

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ 
        success: true, 
        data: { sites: [], stats: { total: 0 } },
        message: "Not authenticated" 
      });
    }

    // Use service client for DB operations (bypasses RLS)
    const dbClient = getServiceClient() || supabase;

    // Ensure user has an organization
    const orgId = await ensureUserHasOrg(user.id, user.email, user.user_metadata?.name, dbClient);
    
    if (!orgId) {
      return NextResponse.json({ 
        success: true, 
        data: { sites: [], stats: { total: 0 } },
        message: "No organization" 
      });
    }

    // Check if requesting a single site
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("id");

    if (siteId) {
      // Get single site
      const { data: site, error } = await dbClient
        .from("sites")
        .select("*")
        .eq("id", siteId)
        .eq("organization_id", orgId)
        .single();

      if (error || !site) {
        return NextResponse.json({ error: "Site not found" }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: {
          id: site.id,
          domain: site.domain,
          name: site.name,
          geo_score_avg: site.geo_score_avg || site.aio_score_avg || 55,
          seo_score: site.seo_score || 0,
          autopilot_enabled: site.autopilot_enabled || false,
          last_crawl_at: site.last_crawl_at,
        },
      });
    }

    // List all sites
    const { data: sites, error } = await dbClient
      .from("sites")
      .select("id, domain, name, geo_score_avg, aio_score_avg, seo_score, autopilot_enabled, last_crawl_at, created_at")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[Sites API] Query error:", error);
      return NextResponse.json({ 
        success: true, 
        data: { sites: [], stats: { total: 0 } },
        message: error.message 
      });
    }

    const formattedSites = (sites || []).map(site => ({
      id: site.id,
      domain: site.domain,
      name: site.name,
      // CamelCase for SiteContext compatibility
      seoScore: site.seo_score || 0,
      aioScore: site.geo_score_avg || site.aio_score_avg || 55,
      pagesCount: 0,
      lastCrawlAt: site.last_crawl_at,
      // Snake case for dashboard
      geo_score_avg: site.geo_score_avg || site.aio_score_avg || 55,
      seo_score: site.seo_score || 0,
      autopilot_enabled: site.autopilot_enabled || false,
      last_crawl_at: site.last_crawl_at,
    }));

    return NextResponse.json({
      success: true,
      data: {
        sites: formattedSites,
        stats: { total: formattedSites.length },
      },
    });

  } catch (error) {
    console.error("[Sites API GET] Error:", error);
    return NextResponse.json({ 
      success: true, 
      data: { sites: [], stats: { total: 0 } },
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

// ============================================
// POST - Create site
// ============================================
export async function POST(request: NextRequest) {
  try {
    // Create auth client
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Use service client for DB operations
    const dbClient = getServiceClient() || supabase;

    // Ensure user has an organization
    const orgId = await ensureUserHasOrg(user.id, user.email, user.user_metadata?.name, dbClient);
    
    if (!orgId) {
      return NextResponse.json({ error: "Failed to create organization" }, { status: 500 });
    }

    // Parse request body
    const body = await request.json();
    const { url, domain: rawDomain, name } = body;

    // Get domain from URL or use provided domain
    let domain = rawDomain || "";
    if (url && !domain) {
      try {
        const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);
        domain = urlObj.hostname.replace(/^www\./, "");
      } catch {
        domain = url.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
      }
    }

    if (!domain) {
      return NextResponse.json({ error: "Domain is required" }, { status: 400 });
    }

    // Clean domain
    domain = domain.replace(/^https?:\/\//, "").replace(/\/$/, "").replace(/^www\./, "");

    // Check for duplicate
    const { data: existing } = await dbClient
      .from("sites")
      .select("id")
      .eq("organization_id", orgId)
      .eq("domain", domain)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ 
        success: true,
        data: existing,
        message: "Site already exists",
        existingSiteId: existing.id,
      });
    }

    // Create site
    const { data: newSite, error } = await dbClient
      .from("sites")
      .insert({
        organization_id: orgId,
        domain,
        name: name || domain,
        is_active: true,
        autopilot_enabled: true,
        geo_score_avg: 55, // Default score
      })
      .select()
      .single();

    if (error) {
      console.error("[Sites API] Insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data: newSite,
      id: newSite.id,
    });

  } catch (error) {
    console.error("[Sites API POST] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create site" },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE - Delete site
// ============================================
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const dbClient = getServiceClient() || supabase;
    const orgId = await ensureUserHasOrg(user.id, user.email, user.user_metadata?.name, dbClient);

    if (!orgId) {
      return NextResponse.json({ error: "No organization" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("id");

    if (!siteId) {
      return NextResponse.json({ error: "Site ID is required" }, { status: 400 });
    }

    await dbClient
      .from("sites")
      .delete()
      .eq("id", siteId)
      .eq("organization_id", orgId);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("[Sites API DELETE] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete site" },
      { status: 500 }
    );
  }
}
