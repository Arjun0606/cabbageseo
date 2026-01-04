/**
 * Sites API - Citation Intelligence
 * 
 * GET /api/sites - List all sites
 * POST /api/sites - Create a new site
 * DELETE /api/sites?id=xxx - Delete a site
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

// Helper to get typed service client (bypasses Supabase generated types for new schema)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getDb = () => createServiceClient() as any;

// ============================================
// GET: List all sites for user's org
// ============================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();

    // Get user's org
    const { data: userData } = await db
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!userData?.organization_id) {
      return NextResponse.json({ sites: [] });
    }

    // Get sites
    const { data: sites, error } = await db
      .from("sites")
      .select("*")
      .eq("organization_id", userData.organization_id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[Sites API] Error fetching sites:", error);
      return NextResponse.json({ error: "Failed to fetch sites" }, { status: 500 });
    }

    return NextResponse.json({ sites: sites || [] });
  } catch (error) {
    console.error("[Sites API] GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}

// ============================================
// POST: Create a new site
// ============================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    let { domain } = body;

    if (!domain) {
      return NextResponse.json({ error: "Domain required" }, { status: 400 });
    }

    // Clean domain
    domain = domain.trim().toLowerCase();
    domain = domain.replace(/^https?:\/\//, "").replace(/\/.*$/, "");

    const db = getDb();

    // Get or create user's org
    let { data: userData } = await db
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    let orgId = userData?.organization_id;

    if (!orgId) {
      // Create organization
      const { data: newOrg, error: orgError } = await db
        .from("organizations")
        .insert({
          name: user.email?.split("@")[0] || "My Organization",
          plan: "free",
          subscription_status: "active",
        })
        .select("id")
        .single();

      if (orgError || !newOrg) {
        console.error("[Sites API] Failed to create org:", orgError);
        return NextResponse.json({ error: "Failed to create organization" }, { status: 500 });
      }

      orgId = newOrg.id;

      // Check if user exists
      const { data: existingUser } = await db
        .from("users")
        .select("id")
        .eq("id", user.id)
        .single();

      if (existingUser) {
        await db
          .from("users")
          .update({ organization_id: orgId })
          .eq("id", user.id);
      } else {
        await db
          .from("users")
          .insert({
            id: user.id,
            email: user.email || "",
            name: user.user_metadata?.name || null,
            organization_id: orgId,
            role: "owner",
          });
      }
    }

    // Check site limit based on plan
    const { data: org } = await db
      .from("organizations")
      .select("plan")
      .eq("id", orgId)
      .single();

    const plan = org?.plan || "free";
    const siteLimit = plan === "agency" ? 50 : plan === "pro" ? 10 : plan === "starter" ? 3 : 1;

    const { count: siteCount } = await db
      .from("sites")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", orgId);

    if ((siteCount || 0) >= siteLimit) {
      return NextResponse.json(
        { error: `Site limit reached (${siteLimit}). Upgrade to add more sites.` },
        { status: 403 }
      );
    }

    // Check if site already exists
    const { data: existingSite } = await db
      .from("sites")
      .select("id, domain")
      .eq("organization_id", orgId)
      .eq("domain", domain)
      .single();

    if (existingSite) {
      return NextResponse.json({
        success: true,
        site: existingSite,
        message: "Site already exists",
      });
    }

    // Create site
    const { data: site, error: siteError } = await db
      .from("sites")
      .insert({
        organization_id: orgId,
        domain: domain,
        name: domain,
        status: "active",
        total_citations: 0,
        citations_this_week: 0,
        citations_last_week: 0,
      })
      .select()
      .single();

    if (siteError) {
      console.error("[Sites API] Failed to create site:", siteError);
      return NextResponse.json({ error: "Failed to create site" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      site: site,
    });
  } catch (error) {
    console.error("[Sites API] POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE: Remove a site
// ============================================

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("id");

    if (!siteId) {
      return NextResponse.json({ error: "Site ID required" }, { status: 400 });
    }

    const db = getDb();

    // Verify ownership
    const { data: userData } = await db
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!userData?.organization_id) {
      return NextResponse.json({ error: "No organization" }, { status: 403 });
    }

    const { data: site } = await db
      .from("sites")
      .select("id")
      .eq("id", siteId)
      .eq("organization_id", userData.organization_id)
      .single();

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    // Delete site (cascades to citations and competitors)
    await db.from("sites").delete().eq("id", siteId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Sites API] DELETE error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}
