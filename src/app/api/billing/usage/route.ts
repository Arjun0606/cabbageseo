/**
 * Usage API
 * Returns current usage statistics for the organization
 * 
 * GET /api/billing/usage
 */

import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getPlan, getPlanLimits } from "@/lib/billing/plans";

export async function GET() {
  // Use regular client for auth
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Use service client to bypass RLS for reading user/org data
  const serviceClient = createServiceClient();
  
  const { data: profileData } = await serviceClient
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  let orgId = (profileData as { organization_id: string } | null)?.organization_id || null;

  try {
    // If user has no org, create one
    if (!orgId) {
      console.log("[Billing Usage] User has no org, creating one...");
      
      const orgSlug = user.email?.split("@")[0]?.replace(/[^a-z0-9]/gi, "") || `org-${Date.now()}`;
      
      const { data: newOrg, error: orgError } = await serviceClient
        .from("organizations")
        .insert({
          name: user.user_metadata?.name || user.email?.split("@")[0] || "My Organization",
          slug: `${orgSlug}-${Date.now()}`,
          plan: "starter",
          subscription_status: "active",
        } as never)
        .select("id")
        .single();

      if (orgError || !newOrg) {
        console.error("[Billing Usage] Failed to create org:", orgError);
        // Return starter plan defaults
        return NextResponse.json({ 
          success: true,
          data: {
            plan: { id: "starter", name: "Starter", status: "active", billingInterval: "monthly", currentPeriodStart: null, currentPeriodEnd: null },
            usage: { articles: 0, keywords: 0, audits: 0, aioAnalyses: 0, aiCredits: 0 },
            limits: { articles: 50, keywords: 500, audits: 15, aioAnalyses: 100, aiCredits: 5000 },
            percentages: { articles: 0, keywords: 0, audits: 0, aioAnalyses: 0, aiCredits: 0 },
          }
        });
      }

      orgId = (newOrg as { id: string }).id;

      // Link user to org
      if (!profileData) {
        await serviceClient
          .from("users")
          .insert({
            id: user.id,
            organization_id: orgId,
            email: user.email,
            name: user.user_metadata?.name || null,
            role: "owner",
          } as never);
      } else {
        await serviceClient
          .from("users")
          .update({ organization_id: orgId } as never)
          .eq("id", user.id);
      }
      
      console.log("[Billing Usage] Created org:", orgId);
    }

    // Get organization (using service client to bypass RLS)
    const { data: orgData } = await serviceClient
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
      // Return free plan defaults for organizations that don't exist
      return NextResponse.json({ 
        success: true,
        data: {
          plan: { id: "free", name: "Free", status: "inactive", billingInterval: null, currentPeriodStart: null, currentPeriodEnd: null },
          usage: { articles: 0, keywords: 0, audits: 0, aioAnalyses: 0, aiCredits: 0 },
          limits: { articles: 0, keywords: 0, audits: 0, aioAnalyses: 0, aiCredits: 0 },
          percentages: { articles: 0, keywords: 0, audits: 0, aioAnalyses: 0, aiCredits: 0 },
        }
      });
    }

    // Get current period
    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    // Get usage for current period (using service client to bypass RLS)
    const { data: usageData } = await serviceClient
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
