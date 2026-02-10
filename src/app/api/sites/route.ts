/**
 * /api/sites - Site Management
 * 
 * GET: List all sites for the user's organization
 * POST: Create a new site
 * DELETE: Remove a site
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getCitationPlanLimits, canAddSite, canAccessProduct } from "@/lib/billing/citation-plans";
import { getUser } from "@/lib/api/get-user";

function getDbClient(): SupabaseClient | null {
  try {
    return createServiceClient();
  } catch {
    return null;
  }
}

// GET - List sites
export async function GET() {
  try {
    const db = getDbClient();
    if (!db) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    // Auth check
    const currentUser = await getUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = currentUser.organizationId;
    if (!orgId) {
      return NextResponse.json({ sites: [] });
    }

    // Get sites with geo_score_avg, category, and custom_queries
    const { data: sites, error } = await db
      .from("sites")
      .select("id, domain, name, total_citations, citations_this_week, citations_last_week, last_checked_at, geo_score_avg, category, custom_queries, created_at")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Sites fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch sites" }, { status: 500 });
    }

    return NextResponse.json({ sites: sites || [] });

  } catch (error) {
    console.error("[/api/sites GET] Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST - Create site
export async function POST(request: NextRequest) {
  try {
    // Auth check
    const currentUser = await getUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { domain: rawDomain, category } = body;
    let domain = rawDomain;

    if (!domain) {
      return NextResponse.json({ error: "Domain is required" }, { status: 400 });
    }

    // Clean domain
    domain = domain.trim().toLowerCase();
    domain = domain.replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "");

    const db = getDbClient();
    if (!db) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    // Get or create organization for user
    let orgId = currentUser.organizationId;

    if (!orgId) {
      // Create org if user doesn't have one yet
      const userEmail = currentUser.email || "";
      const slug = (userEmail.split("@")[0]?.replace(/[^a-z0-9]/gi, "") || "user") + "-" + Date.now();

      const sitesTrialEndsAt = new Date();
      sitesTrialEndsAt.setDate(sitesTrialEndsAt.getDate() + 7);
      const { data: newOrg } = await db
        .from("organizations")
        .insert({
          name: userEmail.split("@")[0] || "My Organization",
          slug,
          plan: "free",
          subscription_status: "trialing",
          trial_ends_at: sitesTrialEndsAt.toISOString(),
        })
        .select("id, created_at")
        .single();

      if (newOrg) {
        orgId = newOrg.id;
        await db.from("users").upsert({
          id: currentUser.id,
          organization_id: orgId,
          email: userEmail,
          name: currentUser.name,
          role: "owner",
        });
      }
    }

    if (!orgId) {
      return NextResponse.json({ error: "Failed to create organization" }, { status: 500 });
    }

    // Get plan from DB
    const { data: org } = await db
      .from("organizations")
      .select("plan, trial_ends_at")
      .eq("id", orgId)
      .single();

    const plan = org?.plan || "free";

    // Check if free user's trial has expired
    if (plan === "free" && org?.trial_ends_at) {
      const access = canAccessProduct(plan, org.trial_ends_at, currentUser.email || null, true);
      if (!access.allowed) {
        return NextResponse.json({
          error: access.reason || "Trial expired. Upgrade to continue.",
          code: "TRIAL_EXPIRED",
          upgradeRequired: true,
        }, { status: 403 });
      }
    }
    
    // Check site limit using helper function
    const { count } = await db
      .from("sites")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId);

    const currentSites = count || 0;
    const canAdd = canAddSite(plan, currentSites);
    
    if (!canAdd.allowed) {
      return NextResponse.json({ 
        error: canAdd.reason || `Site limit reached. Upgrade for more.`,
        code: "PLAN_LIMIT_EXCEEDED",
        upgradeRequired: true,
      }, { status: 403 });
    }

    // Check if domain already exists
    const { data: existing } = await db
      .from("sites")
      .select("id")
      .eq("organization_id", orgId)
      .eq("domain", domain)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "Domain already added" }, { status: 400 });
    }

    // Create site with optional category
    const { data: site, error } = await db
      .from("sites")
      .insert({
        organization_id: orgId,
        domain,
        name: domain,
        category: category || null,
        custom_queries: [],
        total_citations: 0,
        citations_this_week: 0,
        citations_last_week: 0,
      })
      .select()
      .single();

    if (error) {
      console.error("Site creation error:", error);
      return NextResponse.json({ error: "Failed to create site" }, { status: 500 });
    }

    return NextResponse.json({ site });

  } catch (error) {
    console.error("[/api/sites POST] Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// DELETE - Remove site
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Not configured" }, { status: 500 });
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

    const db = getDbClient() || supabase;

    // Get user's organization
    const { data: userData } = await db
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!userData?.organization_id) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Verify site belongs to user's org
    const { data: site } = await db
      .from("sites")
      .select("id, organization_id")
      .eq("id", siteId)
      .maybeSingle();

    if (!site || site.organization_id !== userData.organization_id) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    // Delete site (cascades to citations, competitors)
    const { error } = await db
      .from("sites")
      .delete()
      .eq("id", siteId);

    if (error) {
      console.error("Site deletion error:", error);
      return NextResponse.json({ error: "Failed to delete site" }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("[/api/sites DELETE] Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
