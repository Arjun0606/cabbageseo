/**
 * Usage API - Returns current usage statistics
 * 
 * GET /api/billing/usage
 */

import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getPlan, getPlanLimits } from "@/lib/billing/plans";
import type { SupabaseClient } from "@supabase/supabase-js";

// Safe service client getter
function getServiceClient(): SupabaseClient | null {
  try {
    return createServiceClient();
  } catch {
    return null;
  }
}

// Default response for when things go wrong
const DEFAULT_RESPONSE = {
  success: true,
  data: {
    plan: { id: "starter", name: "Starter", status: "active", billingInterval: "monthly", currentPeriodStart: null, currentPeriodEnd: null },
    usage: { articles: 0, keywords: 0, audits: 0, aioAnalyses: 0, aiCredits: 0 },
    limits: { articles: 50, keywords: 500, audits: 15, aioAnalyses: 100, aiCredits: 5000 },
    percentages: { articles: 0, keywords: 0, audits: 0, aioAnalyses: 0, aiCredits: 0 },
  }
};

export async function GET() {
  try {
    // Create auth client
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json(DEFAULT_RESPONSE);
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(DEFAULT_RESPONSE);
    }

    // Use service client for DB operations (or fall back to regular client)
    const dbClient = getServiceClient() || supabase;

    // Get user's organization
    const { data: userData } = await dbClient
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .maybeSingle();

    let orgId = userData?.organization_id;

    // If no org, create one
    if (!orgId) {
      const orgSlug = (user.email?.split("@")[0]?.replace(/[^a-z0-9]/gi, "") || "user") + "-" + Date.now();
      
      const { data: newOrg, error: orgError } = await dbClient
        .from("organizations")
        .insert({
          name: user.user_metadata?.name || user.email?.split("@")[0] || "My Organization",
          slug: orgSlug,
          plan: "starter",
          subscription_status: "active",
        })
        .select("id")
        .single();

      if (orgError || !newOrg) {
        console.error("[Usage API] Failed to create org:", orgError);
        return NextResponse.json(DEFAULT_RESPONSE);
      }

      orgId = newOrg.id;

      // Link user to org
      if (!userData) {
        await dbClient.from("users").insert({
          id: user.id,
          organization_id: orgId,
          email: user.email || "",
          name: user.user_metadata?.name || null,
          role: "owner",
        });
      } else {
        await dbClient.from("users").update({ organization_id: orgId }).eq("id", user.id);
      }
    }

    // Get organization details
    const { data: orgData } = await dbClient
      .from("organizations")
      .select("plan, billing_interval, subscription_status, current_period_start, current_period_end")
      .eq("id", orgId)
      .maybeSingle();

    if (!orgData) {
      return NextResponse.json(DEFAULT_RESPONSE);
    }

    // Get current period usage
    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const { data: usageData } = await dbClient
      .from("usage")
      .select("*")
      .eq("organization_id", orgId)
      .eq("period", period)
      .maybeSingle();

    // Get plan info
    const planInfo = getPlan(orgData.plan || "starter");
    const limits = getPlanLimits(orgData.plan || "starter");

    // Calculate usage
    const currentUsage = {
      articles: usageData?.articles_generated || 0,
      keywords: usageData?.keywords_analyzed || 0,
      audits: usageData?.audits_run || 0,
      aioAnalyses: usageData?.aio_analyses || 0,
      aiCredits: usageData?.ai_credits_used || 0,
    };

    const currentLimits = {
      articles: limits.articlesPerMonth,
      keywords: limits.keywordsTracked,
      audits: limits.auditsPerMonth,
      aioAnalyses: limits.aioAnalysesPerMonth,
      aiCredits: limits.aiCreditsPerMonth,
    };

    const percentages = {
      articles: currentLimits.articles > 0 ? Math.min(100, Math.round((currentUsage.articles / currentLimits.articles) * 100)) : 0,
      keywords: currentLimits.keywords > 0 ? Math.min(100, Math.round((currentUsage.keywords / currentLimits.keywords) * 100)) : 0,
      audits: currentLimits.audits > 0 ? Math.min(100, Math.round((currentUsage.audits / currentLimits.audits) * 100)) : 0,
      aioAnalyses: currentLimits.aioAnalyses > 0 ? Math.min(100, Math.round((currentUsage.aioAnalyses / currentLimits.aioAnalyses) * 100)) : 0,
      aiCredits: currentLimits.aiCredits > 0 ? Math.min(100, Math.round((currentUsage.aiCredits / currentLimits.aiCredits) * 100)) : 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        plan: {
          id: planInfo.id,
          name: planInfo.name,
          status: orgData.subscription_status || "active",
          billingInterval: orgData.billing_interval || "monthly",
          currentPeriodStart: orgData.current_period_start,
          currentPeriodEnd: orgData.current_period_end,
        },
        usage: currentUsage,
        limits: currentLimits,
        percentages,
      },
    });
  } catch (error) {
    console.error("[Usage API] Error:", error);
    return NextResponse.json(DEFAULT_RESPONSE);
  }
}
