/**
 * /api/billing/usage - Get Usage Stats
 */

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getCitationPlanLimits } from "@/lib/billing/citation-plans";
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

    // Auth check
    const currentUser = await getUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = currentUser.organizationId;
    if (!orgId) {
      const limits = getCitationPlanLimits("free");
      return NextResponse.json({
        data: {
          usage: { checksUsed: 0, sitesUsed: 0 },
          limits: { checks: limits.manualChecksPerDay === -1 ? 999999 : limits.manualChecksPerDay, checksPerDay: limits.manualChecksPerDay, sites: limits.sites },
        },
      });
    }

    // Get organization plan from DB
    const { data: org } = await db
      .from("organizations")
      .select("plan")
      .eq("id", orgId)
      .single();

    const plan = org?.plan || "free";
    const limits = getCitationPlanLimits(plan);

    // Get current period usage
    // Free tier uses daily period, paid tiers use monthly
    const isFreePlan = plan === "free";
    const period = isFreePlan
      ? new Date().toISOString().split('T')[0] // Daily for free tier
      : new Date().toISOString().slice(0, 7);  // Monthly for paid tiers

    const { data: usageData } = await db
      .from("usage")
      .select("checks_used, sites_used")
      .eq("organization_id", orgId)
      .eq("period", period)
      .maybeSingle();

    // Get actual sites count
    const { count: sitesCount } = await db
      .from("sites")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId);

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
        },
        limits: {
          checks: checksLimit, // Daily limit for free, unlimited for paid
          checksPerDay: limits.manualChecksPerDay,
          sites: limits.sites,
        },
      },
    });

  } catch (error) {
    console.error("[/api/billing/usage GET] Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
