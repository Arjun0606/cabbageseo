/**
 * /api/billing/usage - Get Usage Stats
 */

import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getCitationPlanLimits } from "@/lib/billing/citation-plans";
import { getTestSession } from "@/lib/testing/test-session";
import { getUser } from "@/lib/api/get-user";

function getDbClient(): SupabaseClient | null {
  try {
    return createServiceClient();
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const db = getDbClient();
    if (!db) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    // ⚠️ BYPASS CHECK FIRST (for testing)
    const bypassUser = await getUser();
    if (bypassUser?.isTestAccount) {
      const limits = getCitationPlanLimits(bypassUser.plan);
      return NextResponse.json({
        data: {
          usage: { checksUsed: 0, sitesUsed: 0, competitorsUsed: 0 },
          limits: { 
            checks: limits.manualChecksPerDay === -1 ? 999999 : limits.manualChecksPerDay, 
            checksPerDay: limits.manualChecksPerDay,
            sites: limits.sites, 
            competitors: limits.competitors 
          },
        },
        bypassMode: true,
      });
    }

    // Test session check
    const testSession = await getTestSession();
    let orgId: string | null = null;
    let plan = "free";

    if (testSession) {
      // For test accounts, find the test organization and return usage based on test plan
      const testOrgSlug = `test-${testSession.email.split("@")[0]}`;
      const { data: testOrg } = await db
        .from("organizations")
        .select("id")
        .eq("slug", testOrgSlug)
        .maybeSingle();
      
      if (testOrg) {
        orgId = testOrg.id;
      }
      plan = testSession.plan;
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

      orgId = userData?.organization_id || null;
    }

    if (!orgId) {
      const limits = getCitationPlanLimits(plan);
      return NextResponse.json({
        data: {
          usage: { checksUsed: 0, competitorsUsed: 0 },
          limits: { checks: limits.manualChecksPerDay === -1 ? 999999 : limits.manualChecksPerDay, sites: limits.sites, competitors: limits.competitors },
        },
      });
    }

    // Get organization plan (if not already set from test session)
    if (!testSession) {
      const { data: org } = await db
        .from("organizations")
        .select("plan")
        .eq("id", orgId)
        .single();

      plan = org?.plan || "free";
    }
    const limits = getCitationPlanLimits(plan);

    // Get current period usage
    // Free tier uses daily period, paid tiers use monthly
    const isFreePlan = plan === "free";
    const period = isFreePlan 
      ? new Date().toISOString().split('T')[0] // Daily for free tier
      : new Date().toISOString().slice(0, 7);  // Monthly for paid tiers
    
    const { data: usageData } = await db
      .from("usage")
      .select("checks_used, sites_used, competitors_used")
      .eq("organization_id", orgId)
      .eq("period", period)
      .maybeSingle();

    // Get actual sites count
    const { count: sitesCount } = await db
      .from("sites")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId);

    // Get total competitors count
    const { data: sites } = await db
      .from("sites")
      .select("id")
      .eq("organization_id", orgId);

    let competitorsCount = 0;
    if (sites && sites.length > 0) {
      const { count } = await db
        .from("competitors")
        .select("id", { count: "exact", head: true })
        .in("site_id", sites.map(s => s.id));
      competitorsCount = count || 0;
    }

    // Calculate checks limit based on plan
    // Free: daily limit (3/day), Paid: unlimited (999999)
    const checksLimit = limits.manualChecksPerDay === -1 
      ? 999999  // Unlimited for paid plans
      : limits.manualChecksPerDay; // Daily limit for free tier
    
    return NextResponse.json({
      data: {
        usage: {
          checksUsed: usageData?.checks_used || 0,
          sitesUsed: sitesCount || 0,
          competitorsUsed: competitorsCount,
        },
        limits: {
          checks: checksLimit, // Daily limit for free, unlimited for paid
          checksPerDay: limits.manualChecksPerDay,
          sites: limits.sites,
          competitors: limits.competitors,
        },
      },
    });

  } catch (error) {
    console.error("[/api/billing/usage GET] Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
