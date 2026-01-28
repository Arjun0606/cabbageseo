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
import { getTestPlan } from "@/lib/testing/test-accounts";
import { getTestSession } from "@/lib/testing/test-session";
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

    // Check for bypass/test user first
    const bypassUser = await getUser();
    if (bypassUser?.isTestAccount) {
      // Return empty sites for bypass mode (no DB)
      return NextResponse.json({ sites: [] });
    }

    // ⚠️ TEST SESSION CHECK FIRST
    const testSession = await getTestSession();
    let orgId: string | null = null;

    if (testSession) {
      // For test accounts, find the test organization
      const testOrgSlug = `test-${testSession.email.split("@")[0]}`;
      const { data: testOrg } = await db
        .from("organizations")
        .select("id")
        .eq("slug", testOrgSlug)
        .maybeSingle();
      
      if (!testOrg) {
        // No org created yet - return empty
        return NextResponse.json({ sites: [] });
      }
      orgId = testOrg.id;
    } else {
      const supabase = await createClient();
      if (!supabase) {
        return NextResponse.json({ error: "Not configured" }, { status: 500 });
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Get user's organization
      const { data: userData } = await db
        .from("users")
        .select("organization_id")
        .eq("id", user.id)
        .maybeSingle();

      if (!userData?.organization_id) {
        return NextResponse.json({ sites: [] });
      }
      orgId = userData.organization_id;
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
    // Check for bypass user first
    const bypassUser = await getUser();
    if (bypassUser?.isTestAccount && bypassUser.id.startsWith("bypass-")) {
      // For bypass mode, return success without DB
      const body = await request.json();
      let domain = body.domain;
      domain = domain.trim().toLowerCase();
      domain = domain.replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "");
      
      return NextResponse.json({
        site: {
          id: `bypass-site-${Date.now()}`,
          domain,
          name: domain,
          category: body.category || null,
          totalCitations: 0,
          citationsThisWeek: 0,
          citationsLastWeek: 0,
          lastCheckedAt: null,
          geoScore: null,
        },
        bypassMode: true,
      });
    }

    // ⚠️ TEST SESSION CHECK FIRST
    const testSession = await getTestSession();
    let userId: string;
    let userEmail: string;
    let testPlan: "free" | "starter" | "pro" | null = null;

    if (testSession) {
      userId = `test-${testSession.email}`;
      userEmail = testSession.email;
      testPlan = testSession.plan;
    } else {
      const supabase = await createClient();
      if (!supabase) {
        return NextResponse.json({ error: "Not configured" }, { status: 500 });
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = user.id;
      userEmail = user.email || "";
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
    
    // For test accounts, create/use test organization in database
    let orgId: string | null = null;
    let plan = testPlan || "free";
    
    if (testSession) {
      // Find or create test organization
      const testOrgSlug = `test-${testSession.email.split("@")[0]}`;
      const { data: existingOrg } = await db
        .from("organizations")
        .select("id, plan, created_at")
        .eq("slug", testOrgSlug)
        .maybeSingle();
      
      if (existingOrg) {
        orgId = existingOrg.id;
        // Override plan with test plan
        plan = testPlan || existingOrg.plan || "free";
      } else {
        // Create test organization
        const planName = testPlan || "free";
        const planDisplayName = planName.charAt(0).toUpperCase() + planName.slice(1);
        const { data: newOrg } = await db
          .from("organizations")
          .insert({
            name: `Test ${planDisplayName} Organization`,
            slug: testOrgSlug,
            plan: planName,
            subscription_status: "active",
          })
          .select("id, created_at")
          .single();
        
        if (newOrg) {
          orgId = newOrg.id;
          
          // Create test user record
          await db.from("users").upsert({
            id: userId,
            organization_id: orgId,
            email: userEmail,
            name: testSession.name,
            role: "owner",
          });
        }
      }
    }

    // For regular (non-test) accounts, get organization
    if (!testSession) {
      const { data: userData } = await db
        .from("users")
        .select("organization_id")
        .eq("id", userId)
        .maybeSingle();

      orgId = userData?.organization_id;

      // Create org if doesn't exist
      if (!orgId) {
        const slug = (userEmail.split("@")[0]?.replace(/[^a-z0-9]/gi, "") || "user") + "-" + Date.now();
        
        const { data: newOrg } = await db
          .from("organizations")
          .insert({
            name: userEmail.split("@")[0] || "My Organization",
            slug,
            plan: "free",
            subscription_status: "active",
          })
          .select("id, created_at")
          .single();

        if (newOrg) {
          orgId = newOrg.id;
          await db.from("users").upsert({
            id: userId,
            organization_id: orgId,
            email: userEmail,
            role: "owner",
          });
        }
      }
    }

    if (!orgId) {
      return NextResponse.json({ error: "Failed to create organization" }, { status: 500 });
    }

    // Get plan limits (for test accounts, we already have plan from session)
    const { data: org } = await db
      .from("organizations")
      .select("plan, created_at")
      .eq("id", orgId)
      .single();

    if (!testSession) {
      plan = org?.plan || "free";
      const dbTestPlan = getTestPlan(userEmail);
      if (dbTestPlan) {
        plan = dbTestPlan;
      }
    }
    
    const orgCreatedAt = org?.created_at;
    
    // Check if free user's trial has expired (bypass for test accounts)
    if (plan === "free" && orgCreatedAt && !testSession) {
      const access = canAccessProduct(plan, orgCreatedAt, userEmail || null);
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
