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
    // ⚠️ BYPASS USER CHECK FIRST
    const { getUser } = await import("@/lib/api/get-user");
    const { getTestSession } = await import("@/lib/testing/test-session");
    
    const bypassUser = await getUser();
    const testSession = await getTestSession();
    
    let userId: string;
    let userEmail: string | null = null;
    let organizationId: string | null = null;
    let plan: "free" | "starter" | "pro" = "free";
    let bypassMode = false;
    
    // Create service client for DB operations
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    if (bypassUser?.isTestAccount && bypassUser.id.startsWith("test-bypass")) {
      // Bypass mode
      userId = bypassUser.id;
      userEmail = bypassUser.email;
      plan = bypassUser.plan;
      organizationId = "bypass-org";
      bypassMode = true;
    } else if (testSession) {
      userId = `test-${testSession.email}`;
      userEmail = testSession.email;
      plan = testSession.plan;
      // Look up test organization from database
      const testOrgSlug = `test-${testSession.email.split("@")[0]}`;
      const { data: testOrgData } = await serviceClient
        .from("organizations")
        .select("id")
        .eq("slug", testOrgSlug)
        .maybeSingle();
      organizationId = testOrgData?.id || null;
    } else {
      const supabase = await createClient();
      if (!supabase) {
        return NextResponse.json({ error: "Server error" }, { status: 500 });
      }

      // Get user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = user.id;
      userEmail = user.email || null;

      // Get profile & org
      const { data: profileData } = await supabase
        .from("users")
        .select("organization_id")
        .eq("id", user.id)
        .single();

      const profile = profileData as { organization_id: string } | null;
      organizationId = profile?.organization_id || null;
    }
    
    if (!organizationId) {
      return NextResponse.json({ error: "No organization" }, { status: 400 });
    }

    // Get org plan for non-test users
    let planId = plan;
    if (!bypassMode && !testSession) {
      const { data: org } = await serviceClient
        .from("organizations")
        .select("plan, created_at")
        .eq("id", organizationId)
        .single();
      planId = org?.plan || "free";
      
      // Legacy test account check (fallback)
      const testPlan = getTestPlan(userEmail);
      if (testPlan) {
        planId = testPlan;
      }
    }
    
    const citationPlan = getCitationPlan(planId);
    const body: RequestBody = await request.json();
    const { action, siteId, query, competitorId } = body;

    if (!action || !siteId) {
      return NextResponse.json({ error: "action and siteId are required" }, { status: 400 });
    }

    // Verify site ownership
    const { data: site } = await serviceClient
      .from("sites")
      .select("id, domain")
      .eq("id", siteId)
      .eq("organization_id", organizationId)
      .single();

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    // Get current month usage (for rate limiting)
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const { data: usage } = await serviceClient
      .from("usage")
      .select("*")
      .eq("organization_id", organizationId)
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

        const canUse = canUseGapAnalysis(citationPlan.id, gapAnalysesUsed);
        if (!canUse.allowed) {
          return NextResponse.json({
            error: canUse.reason,
            upgradeRequired: true,
            feature: "citationGapAnalysis",
          }, { status: 403 });
        }

        const result = await analyzeCitationGap(siteId, query, organizationId);

        // Track usage
        await incrementUsage(serviceClient, organizationId, currentMonth, "gap_analyses_used");

        return NextResponse.json({
          success: true,
          data: result,
          remaining: canUse.remaining === -1 ? "unlimited" : (canUse.remaining || 0) - 1,
        });
      }

      case "content-recommendations": {
        const canUse = canUseContentRecommendations(citationPlan.id, contentIdeasUsed);
        if (!canUse.allowed) {
          return NextResponse.json({
            error: canUse.reason,
            upgradeRequired: true,
            feature: "contentRecommendations",
          }, { status: 403 });
        }

        const result = await generateContentRecommendations(siteId, organizationId);

        // Track usage
        await incrementUsage(serviceClient, organizationId, currentMonth, "content_ideas_used");

        return NextResponse.json({
          success: true,
          data: result,
          remaining: canUse.remaining === -1 ? "unlimited" : (canUse.remaining || 0) - 1,
        });
      }

      case "action-plan": {
        const canUse = canUseActionPlan(citationPlan.id);
        if (!canUse.allowed) {
          return NextResponse.json({
            error: canUse.reason,
            upgradeRequired: true,
            feature: "weeklyActionPlan",
          }, { status: 403 });
        }

        const result = await generateWeeklyActionPlan(siteId, organizationId);

        return NextResponse.json({
          success: true,
          data: result,
        });
      }

      case "competitor-deep-dive": {
        if (!competitorId) {
          return NextResponse.json({ error: "competitorId is required" }, { status: 400 });
        }

        const canUse = canUseCompetitorDeepDive(citationPlan.id);
        if (!canUse.allowed) {
          return NextResponse.json({
            error: canUse.reason,
            upgradeRequired: true,
            feature: "competitorDeepDive",
          }, { status: 403 });
        }

        const result = await analyzeCompetitorDeepDive(siteId, competitorId, organizationId);

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
    // ⚠️ TEST SESSION CHECK FIRST
    const { getTestSession } = await import("@/lib/testing/test-session");
    const testSession = await getTestSession();
    
    let organizationId: string | null = null;
    let planId: string = "free";
    
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    if (testSession) {
      planId = testSession.plan;
      // Look up test organization
      const testOrgSlug = `test-${testSession.email.split("@")[0]}`;
      const { data: testOrgData } = await serviceClient
        .from("organizations")
        .select("id")
        .eq("slug", testOrgSlug)
        .maybeSingle();
      organizationId = testOrgData?.id || null;
    } else {
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
      organizationId = profile?.organization_id || null;
      
      if (organizationId) {
        const { data: org } = await serviceClient
          .from("organizations")
          .select("plan")
          .eq("id", organizationId)
          .single();
        planId = org?.plan || "free";
      }
    }

    if (!organizationId) {
      return NextResponse.json({ error: "No organization" }, { status: 400 });
    }

    const citationPlan = getCitationPlan(planId);

    // Get current month usage
    const currentMonth = new Date().toISOString().slice(0, 7);
    const { data: usage } = await serviceClient
      .from("usage")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("period", currentMonth)
      .single();

    const gapAnalysesUsed = (usage as Record<string, number> | null)?.gap_analyses_used || 0;
    const contentIdeasUsed = (usage as Record<string, number> | null)?.content_ideas_used || 0;

    return NextResponse.json({
      plan: citationPlan.id,
      features: {
        gapAnalysis: {
          available: citationPlan.features.citationGapAnalysis,
          fullVersion: citationPlan.features.citationGapFull,
          used: gapAnalysesUsed,
          limit: citationPlan.intelligenceLimits.gapAnalysesPerMonth,
          remaining: citationPlan.intelligenceLimits.gapAnalysesPerMonth === -1 
            ? "unlimited" 
            : Math.max(0, citationPlan.intelligenceLimits.gapAnalysesPerMonth - gapAnalysesUsed),
        },
        contentRecommendations: {
          available: citationPlan.features.contentRecommendations,
          unlimited: citationPlan.features.contentRecsUnlimited,
          used: contentIdeasUsed,
          limit: citationPlan.intelligenceLimits.contentIdeasPerMonth,
          remaining: citationPlan.intelligenceLimits.contentIdeasPerMonth === -1
            ? "unlimited"
            : Math.max(0, citationPlan.intelligenceLimits.contentIdeasPerMonth - contentIdeasUsed),
        },
        actionPlan: {
          available: citationPlan.features.weeklyActionPlan,
        },
        competitorDeepDive: {
          available: citationPlan.features.competitorDeepDive,
        },
      },
    });
  } catch (error) {
    console.error("[Intelligence Features] Error:", error);
    return NextResponse.json({ error: "Failed to get features" }, { status: 500 });
  }
}

