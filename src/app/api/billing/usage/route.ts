/**
 * Usage API
 * Returns current usage statistics for the organization
 * 
 * GET /api/billing/usage
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPlan, getPlanLimits } from "@/lib/billing/plans";
import { getOverageSummary } from "@/lib/billing/overage-manager";

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

    const orgId = profile.organization_id;

    // Get organization
    const { data: orgData } = await supabase
      .from("organizations")
      .select("plan, billing_interval, subscription_status, current_period_start, current_period_end")
      .eq("id", orgId)
      .single();

    const org = orgData as { 
      plan: string; 
      billing_interval: string | null;
      subscription_status: string | null; 
      current_period_start: string | null; 
      current_period_end: string | null;
    } | null;
    
    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 });
    }

    // Get current period
    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    // Get usage for current period
    const { data: usageData } = await supabase
      .from("usage")
      .select("*")
      .eq("organization_id", orgId)
      .eq("period", period)
      .single();

    const usage = usageData as Record<string, number> | null;

    // Get plan info
    const plan = getPlan(org.plan);
    const limits = getPlanLimits(org.plan);

    // Calculate current usage
    const currentUsage = {
      articles: usage?.articles_generated || 0,
      keywords: usage?.keywords_analyzed || 0,
      audits: usage?.audits_run || 0,
      aioAnalyses: usage?.aio_analyses || 0,
      aiCredits: usage?.ai_credits_used || 0,
    };

    // Calculate limits
    const currentLimits = {
      articles: limits.articlesPerMonth,
      keywords: limits.keywordsTracked,
      audits: limits.auditsPerMonth,
      aioAnalyses: limits.aioAnalysesPerMonth,
      aiCredits: limits.aiCreditsPerMonth,
    };

    // Calculate percentages
    const percentages = {
      articles: currentLimits.articles > 0 
        ? Math.min(100, Math.round((currentUsage.articles / currentLimits.articles) * 100)) 
        : 0,
      keywords: currentLimits.keywords > 0 
        ? Math.min(100, Math.round((currentUsage.keywords / currentLimits.keywords) * 100)) 
        : 0,
      audits: currentLimits.audits > 0 
        ? Math.min(100, Math.round((currentUsage.audits / currentLimits.audits) * 100)) 
        : 0,
      aioAnalyses: currentLimits.aioAnalyses > 0 
        ? Math.min(100, Math.round((currentUsage.aioAnalyses / currentLimits.aioAnalyses) * 100)) 
        : 0,
      aiCredits: currentLimits.aiCredits > 0 
        ? Math.min(100, Math.round((currentUsage.aiCredits / currentLimits.aiCredits) * 100)) 
        : 0,
    };

    // Get overage summary
    const overages = await getOverageSummary(orgId);

    return NextResponse.json({
      success: true,
      data: {
      plan: {
        id: plan.id,
        name: plan.name,
        status: org.subscription_status || "active",
          billingInterval: org.billing_interval || "monthly",
        currentPeriodStart: org.current_period_start,
        currentPeriodEnd: org.current_period_end,
      },
        usage: currentUsage,
        limits: currentLimits,
        percentages,
      overages: {
        enabled: overages.enabled,
        spendingCapDollars: overages.spendingCapDollars,
        currentSpendDollars: overages.currentSpendDollars,
        remainingDollars: overages.remainingDollars,
        percentUsed: overages.percentUsed,
        autoIncrease: overages.autoIncrease,
        },
      },
    });
  } catch (error) {
    console.error("[Usage API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get usage" },
      { status: 500 }
    );
  }
}
