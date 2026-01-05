/**
 * /api/billing/usage - Get Usage Stats
 */

import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getCitationPlanLimits } from "@/lib/billing/citation-plans";

function getDbClient(): SupabaseClient | null {
  try {
    return createServiceClient();
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Not configured" }, { status: 500 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDbClient() || supabase;

    // Get user's organization
    const { data: userData } = await db
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!userData?.organization_id) {
      return NextResponse.json({
        data: {
          usage: { checksUsed: 0, competitorsUsed: 0 },
          limits: { checks: 100, sites: 1, competitors: 0 },
        },
      });
    }

    // Get organization plan
    const { data: org } = await db
      .from("organizations")
      .select("plan")
      .eq("id", userData.organization_id)
      .single();

    const plan = org?.plan || "free";
    const limits = getCitationPlanLimits(plan);

    // Get current period usage
    const period = new Date().toISOString().slice(0, 7); // YYYY-MM
    
    const { data: usageData } = await db
      .from("usage")
      .select("checks_used, sites_used, competitors_used")
      .eq("organization_id", userData.organization_id)
      .eq("period", period)
      .maybeSingle();

    // Get actual sites count
    const { count: sitesCount } = await db
      .from("sites")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", userData.organization_id);

    // Get total competitors count
    const { data: sites } = await db
      .from("sites")
      .select("id")
      .eq("organization_id", userData.organization_id);

    let competitorsCount = 0;
    if (sites && sites.length > 0) {
      const { count } = await db
        .from("competitors")
        .select("id", { count: "exact", head: true })
        .in("site_id", sites.map(s => s.id));
      competitorsCount = count || 0;
    }

    return NextResponse.json({
      data: {
        usage: {
          checksUsed: usageData?.checks_used || 0,
          sitesUsed: sitesCount || 0,
          competitorsUsed: competitorsCount,
        },
        limits: {
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
