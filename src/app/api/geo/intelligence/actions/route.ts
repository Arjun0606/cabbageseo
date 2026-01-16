/**
 * AI Visibility Intelligence API
 * 
 * POST /api/geo/intelligence/actions
 * 
 * The $100k features:
 * - gap-analysis: "Why did AI cite competitor, not me?"
 * - content-recommendations: "What to publish next"
 * - action-plan: Weekly GEO playbook
 * - competitor-deep-dive: Full competitor analysis
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import {
  getCitationPlan,
  canUseGapAnalysis,
  canUseContentRecommendations,
  canUseActionPlan,
  canUseCompetitorDeepDive,
} from "@/lib/billing/citation-plans";
import {
  analyzeCitationGap,
  generateContentRecommendations,
  generateWeeklyActionPlan,
  analyzeCompetitorDeepDive,
} from "@/lib/geo/citation-intelligence";
import { getTestPlan } from "@/lib/testing/test-accounts";

type ActionType = "gap-analysis" | "content-recommendations" | "action-plan" | "competitor-deep-dive";

interface RequestBody {
  action: ActionType;
  siteId: string;
  query?: string;          // Required for gap-analysis
  competitorId?: string;   // Required for competitor-deep-dive
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    // Get user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get profile & org
    const { data: profileData } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    const profile = profileData as { organization_id: string } | null;
    if (!profile?.organization_id) {
      return NextResponse.json({ error: "No organization" }, { status: 400 });
    }

    // Get org plan
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: org } = await serviceClient
      .from("organizations")
      .select("plan, created_at")
      .eq("id", profile.organization_id)
      .single();

    // ⚠️ TEST ACCOUNT BYPASS - Use test account plan if applicable
    let planId = org?.plan || "free";
    const testPlan = getTestPlan(user.email);
    if (testPlan) {
      planId = testPlan;
      console.log(`[Test Account] Using test plan: ${testPlan} for ${user.email}`);
    }
    
    const plan = getCitationPlan(planId);
    const body: RequestBody = await request.json();
    const { action, siteId, query, competitorId } = body;

    if (!action || !siteId) {
      return NextResponse.json({ error: "action and siteId are required" }, { status: 400 });
    }

    // Verify site ownership
    const { data: site } = await supabase
      .from("sites")
      .select("id, domain")
      .eq("id", siteId)
      .eq("organization_id", profile.organization_id)
      .single();

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    // Get current month usage (for rate limiting)
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const { data: usage } = await serviceClient
      .from("usage")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .eq("period", currentMonth)
      .single();

    const gapAnalysesUsed = (usage as Record<string, number> | null)?.gap_analyses_used || 0;
    const contentIdeasUsed = (usage as Record<string, number> | null)?.content_ideas_used || 0;

    // Handle each action type
    switch (action) {
      case "gap-analysis": {
        if (!query) {
          return NextResponse.json({ error: "query is required for gap-analysis" }, { status: 400 });
        }

        const canUse = canUseGapAnalysis(plan.id, gapAnalysesUsed);
        if (!canUse.allowed) {
          return NextResponse.json({
            error: canUse.reason,
            upgradeRequired: true,
            feature: "citationGapAnalysis",
          }, { status: 403 });
        }

        const result = await analyzeCitationGap(siteId, query, profile.organization_id);

        // Track usage
        await incrementUsage(serviceClient, profile.organization_id, currentMonth, "gap_analyses_used");

        return NextResponse.json({
          success: true,
          data: result,
          remaining: canUse.remaining === -1 ? "unlimited" : (canUse.remaining || 0) - 1,
        });
      }

      case "content-recommendations": {
        const canUse = canUseContentRecommendations(plan.id, contentIdeasUsed);
        if (!canUse.allowed) {
          return NextResponse.json({
            error: canUse.reason,
            upgradeRequired: true,
            feature: "contentRecommendations",
          }, { status: 403 });
        }

        const result = await generateContentRecommendations(siteId, profile.organization_id);

        // Track usage
        await incrementUsage(serviceClient, profile.organization_id, currentMonth, "content_ideas_used");

        return NextResponse.json({
          success: true,
          data: result,
          remaining: canUse.remaining === -1 ? "unlimited" : (canUse.remaining || 0) - 1,
        });
      }

      case "action-plan": {
        const canUse = canUseActionPlan(plan.id);
        if (!canUse.allowed) {
          return NextResponse.json({
            error: canUse.reason,
            upgradeRequired: true,
            feature: "weeklyActionPlan",
          }, { status: 403 });
        }

        const result = await generateWeeklyActionPlan(siteId, profile.organization_id);

        return NextResponse.json({
          success: true,
          data: result,
        });
      }

      case "competitor-deep-dive": {
        if (!competitorId) {
          return NextResponse.json({ error: "competitorId is required" }, { status: 400 });
        }

        const canUse = canUseCompetitorDeepDive(plan.id);
        if (!canUse.allowed) {
          return NextResponse.json({
            error: canUse.reason,
            upgradeRequired: true,
            feature: "competitorDeepDive",
          }, { status: 403 });
        }

        const result = await analyzeCompetitorDeepDive(siteId, competitorId, profile.organization_id);

        return NextResponse.json({
          success: true,
          data: result,
        });
      }

      default:
        return NextResponse.json({
          error: "Invalid action. Use: gap-analysis, content-recommendations, action-plan, competitor-deep-dive",
        }, { status: 400 });
    }
  } catch (error) {
    console.error("[Intelligence Actions] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate intelligence", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}

// Helper to increment usage counters
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function incrementUsage(
  client: any,
  organizationId: string,
  period: string,
  field: string
) {
  // Try to update existing record
  const { data: existing } = await client
    .from("usage")
    .select("id, " + field)
    .eq("organization_id", organizationId)
    .eq("period", period)
    .single();

  if (existing) {
    const currentValue = (existing as Record<string, number>)[field] || 0;
    await client
      .from("usage")
      .update({ [field]: currentValue + 1, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
  } else {
    // Create new usage record
    await client
      .from("usage")
      .insert({
        organization_id: organizationId,
        period,
        [field]: 1,
        checks_used: 0,
        sites_used: 0,
        competitors_used: 0,
      });
  }
}

// GET - Get available intelligence features for current plan
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profileData2 } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    const profile = profileData2 as { organization_id: string } | null;
    if (!profile?.organization_id) {
      return NextResponse.json({ error: "No organization" }, { status: 400 });
    }

    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: org } = await serviceClient
      .from("organizations")
      .select("plan")
      .eq("id", profile.organization_id)
      .single();

    const plan = getCitationPlan(org?.plan || "free");

    // Get current month usage
    const currentMonth = new Date().toISOString().slice(0, 7);
    const { data: usage } = await serviceClient
      .from("usage")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .eq("period", currentMonth)
      .single();

    const gapAnalysesUsed = (usage as Record<string, number> | null)?.gap_analyses_used || 0;
    const contentIdeasUsed = (usage as Record<string, number> | null)?.content_ideas_used || 0;

    return NextResponse.json({
      plan: plan.id,
      features: {
        gapAnalysis: {
          available: plan.features.citationGapAnalysis,
          fullVersion: plan.features.citationGapFull,
          used: gapAnalysesUsed,
          limit: plan.intelligenceLimits.gapAnalysesPerMonth,
          remaining: plan.intelligenceLimits.gapAnalysesPerMonth === -1 
            ? "unlimited" 
            : Math.max(0, plan.intelligenceLimits.gapAnalysesPerMonth - gapAnalysesUsed),
        },
        contentRecommendations: {
          available: plan.features.contentRecommendations,
          unlimited: plan.features.contentRecsUnlimited,
          used: contentIdeasUsed,
          limit: plan.intelligenceLimits.contentIdeasPerMonth,
          remaining: plan.intelligenceLimits.contentIdeasPerMonth === -1
            ? "unlimited"
            : Math.max(0, plan.intelligenceLimits.contentIdeasPerMonth - contentIdeasUsed),
        },
        actionPlan: {
          available: plan.features.weeklyActionPlan,
        },
        competitorDeepDive: {
          available: plan.features.competitorDeepDive,
        },
      },
    });
  } catch (error) {
    console.error("[Intelligence Features] Error:", error);
    return NextResponse.json({ error: "Failed to get features" }, { status: 500 });
  }
}

