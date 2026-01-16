/**
 * /api/seo/competitors - Competitor Management
 * 
 * GET: List competitors for a site
 * POST: Add a competitor
 * DELETE: Remove a competitor
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getCitationPlanLimits, canAddCompetitor, canAccessProduct } from "@/lib/billing/citation-plans";
import { getTestPlan } from "@/lib/testing/test-accounts";

function getDbClient(): SupabaseClient | null {
  try {
    return createServiceClient();
  } catch {
    return null;
  }
}

// GET - List competitors
export async function GET(request: NextRequest) {
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
    const siteId = searchParams.get("siteId");

    if (!siteId) {
      return NextResponse.json({ error: "siteId required" }, { status: 400 });
    }

    const db = getDbClient() || supabase;

    // Verify site belongs to user
    const { data: userData } = await db
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!userData?.organization_id) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const { data: site } = await db
      .from("sites")
      .select("id, organization_id")
      .eq("id", siteId)
      .maybeSingle();

    if (!site || site.organization_id !== userData.organization_id) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    // Get competitors
    const { data: competitors, error } = await db
      .from("competitors")
      .select("id, domain, total_citations, citations_change, last_checked_at, created_at")
      .eq("site_id", siteId)
      .order("total_citations", { ascending: false });

    if (error) {
      console.error("Competitors fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch competitors" }, { status: 500 });
    }

    return NextResponse.json({ competitors: competitors || [] });

  } catch (error) {
    console.error("[/api/seo/competitors GET] Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST - Add competitor
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Not configured" }, { status: 500 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { siteId, domain } = body;

    if (!siteId || !domain) {
      return NextResponse.json({ error: "siteId and domain required" }, { status: 400 });
    }

    // Clean domain
    let cleanDomain = domain.trim().toLowerCase();
    cleanDomain = cleanDomain.replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "");

    const db = getDbClient() || supabase;

    // Verify site belongs to user
    const { data: userData } = await db
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!userData?.organization_id) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const { data: site } = await db
      .from("sites")
      .select("id, organization_id, domain")
      .eq("id", siteId)
      .maybeSingle();

    if (!site || site.organization_id !== userData.organization_id) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    // Can't add yourself as a competitor
    if (cleanDomain === site.domain) {
      return NextResponse.json({ error: "Cannot add your own site as a competitor" }, { status: 400 });
    }

    // Get plan and check limits
    const { data: org } = await db
      .from("organizations")
      .select("plan, created_at")
      .eq("id", userData.organization_id)
      .single();

    let plan = org?.plan || "free";
    const orgCreatedAt = org?.created_at;
    
    // ⚠️ TEST ACCOUNT BYPASS - Use test account plan if applicable
    const testPlan = getTestPlan(user.email);
    if (testPlan) {
      plan = testPlan;
      console.log(`[Test Account] Using test plan: ${testPlan} for ${user.email}`);
    }
    
    // Check if free user's trial has expired (bypass for test accounts)
    if (plan === "free" && orgCreatedAt) {
      const access = canAccessProduct(plan, orgCreatedAt, user.email || null);
      if (!access.allowed) {
        return NextResponse.json({
          error: access.reason || "Trial expired. Upgrade to continue.",
          code: "TRIAL_EXPIRED",
          upgradeRequired: true,
        }, { status: 403 });
      }
    }
    
    // Check competitor limit using helper function
    const { count } = await db
      .from("competitors")
      .select("id", { count: "exact", head: true })
      .eq("site_id", siteId);

    const currentCompetitors = count || 0;
    const canAdd = canAddCompetitor(plan, currentCompetitors);
    
    if (!canAdd.allowed) {
      return NextResponse.json({
        error: canAdd.reason || `Competitor limit reached. Upgrade for more.`,
        code: "PLAN_LIMIT_EXCEEDED",
        upgradeRequired: true,
      }, { status: 403 });
    }

    // Check if already exists
    const { data: existing } = await db
      .from("competitors")
      .select("id")
      .eq("site_id", siteId)
      .eq("domain", cleanDomain)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "Competitor already added" }, { status: 400 });
    }

    // Create competitor
    const { data: competitor, error } = await db
      .from("competitors")
      .insert({
        site_id: siteId,
        domain: cleanDomain,
        total_citations: 0,
        citations_change: 0,
      })
      .select()
      .single();

    if (error) {
      console.error("Competitor creation error:", error);
      return NextResponse.json({ error: "Failed to add competitor" }, { status: 500 });
    }

    return NextResponse.json({ competitor });

  } catch (error) {
    console.error("[/api/seo/competitors POST] Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// DELETE - Remove competitor
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
    const competitorId = searchParams.get("id");

    if (!competitorId) {
      return NextResponse.json({ error: "Competitor ID required" }, { status: 400 });
    }

    const db = getDbClient() || supabase;

    // Verify competitor belongs to user's site
    const { data: userData } = await db
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!userData?.organization_id) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Get competitor with site info
    const { data: competitor } = await db
      .from("competitors")
      .select("id, site_id")
      .eq("id", competitorId)
      .maybeSingle();

    if (!competitor) {
      return NextResponse.json({ error: "Competitor not found" }, { status: 404 });
    }

    // Verify site belongs to user's org
    const { data: site } = await db
      .from("sites")
      .select("organization_id")
      .eq("id", competitor.site_id)
      .maybeSingle();

    if (!site || site.organization_id !== userData.organization_id) {
      return NextResponse.json({ error: "Competitor not found" }, { status: 404 });
    }

    // Delete competitor
    const { error } = await db
      .from("competitors")
      .delete()
      .eq("id", competitorId);

    if (error) {
      console.error("Competitor deletion error:", error);
      return NextResponse.json({ error: "Failed to delete competitor" }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("[/api/seo/competitors DELETE] Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
