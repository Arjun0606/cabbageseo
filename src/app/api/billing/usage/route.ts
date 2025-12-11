/**
 * Usage API
 * Returns current usage statistics for the organization
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createUsageTracker } from "@/lib/billing/usage-tracker";
import { getPlan } from "@/lib/billing/plans";

export async function GET() {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get user's organization
    const { data: profileData } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    const profile = profileData as { organization_id: string } | null;
    if (!profile?.organization_id) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    // Get organization
    const { data: orgData } = await supabase
      .from("organizations")
      .select("plan, subscription_status, current_period_start, current_period_end")
      .eq("id", profile.organization_id)
      .single();

    const org = orgData as { 
      plan: string; 
      subscription_status: string | null; 
      current_period_start: string | null; 
      current_period_end: string | null;
    } | null;
    
    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 });
    }

    // Get usage
    const tracker = createUsageTracker(profile.organization_id);
    const summary = await tracker.getUsageSummary();
    const credits = await tracker.getCreditBalance();
    const plan = getPlan(org.plan);

    return NextResponse.json({
      plan: {
        id: plan.id,
        name: plan.name,
        status: org.subscription_status || "active",
        currentPeriodStart: org.current_period_start,
        currentPeriodEnd: org.current_period_end,
      },
      usage: summary.usage,
      limits: summary.limits,
      percentages: summary.percentages,
      credits: {
        prepaid: credits.prepaidCredits,
        bonus: credits.bonusCredits,
        total: credits.totalCredits,
        expiresAt: credits.expiresAt,
      },
    });
  } catch (error) {
    console.error("Usage API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get usage" },
      { status: 500 }
    );
  }
}

