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
import { createServiceClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/api/get-user";
import {
  getCitationPlan,
  canUseGapAnalysis,
  canUseContentRecommendations,
  canUseActionPlan,
  canUseCompetitorDeepDive,
  canGeneratePage,
} from "@/lib/billing/citation-plans";
import {
  analyzeCitationGap,
  generateContentRecommendations,
  generateWeeklyActionPlan,
  analyzeCompetitorDeepDive,
} from "@/lib/geo/citation-intelligence";
import type { SupabaseClient } from "@supabase/supabase-js";

type ActionType = "gap-analysis" | "content-recommendations" | "action-plan" | "competitor-deep-dive";

interface RequestBody {
  action: ActionType;
  siteId: string;
  query?: string;          // Required for gap-analysis
  competitorId?: string;   // Required for competitor-deep-dive
}

function getDbClient(): SupabaseClient | null {
  try {
    return createServiceClient();
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const currentUser = await getUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = currentUser.organizationId;
    if (!organizationId) {
      return NextResponse.json({ error: "No organization" }, { status: 400 });
    }

    const db = getDbClient();
    if (!db) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    // Get org plan from DB
    const { data: org } = await db
      .from("organizations")
      .select("plan, created_at")
      .eq("id", organizationId)
      .single();
    const planId = org?.plan || "free";

    const citationPlan = getCitationPlan(planId);
    const body: RequestBody = await request.json();
    const { action, siteId, query, competitorId } = body;

    if (!action || !siteId) {
      return NextResponse.json({ error: "action and siteId are required" }, { status: 400 });
    }

    // Verify site ownership
    const { data: site } = await db
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
    const { data: usage } = await db
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
        await incrementUsage(db, organizationId, currentMonth, "gap_analyses_used");

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
        await incrementUsage(db, organizationId, currentMonth, "content_ideas_used");

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
export async function GET() {
  try {
    // Auth check
    const currentUser = await getUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = currentUser.organizationId;
    if (!organizationId) {
      return NextResponse.json({ error: "No organization" }, { status: 400 });
    }

    const db = getDbClient();
    if (!db) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    // Get org plan from DB
    const { data: org } = await db
      .from("organizations")
      .select("plan")
      .eq("id", organizationId)
      .single();
    const planId = org?.plan || "free";

    const citationPlan = getCitationPlan(planId);

    // Get current month usage
    const currentMonth = new Date().toISOString().slice(0, 7);
    const { data: usage } = await db
      .from("usage")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("period", currentMonth)
      .single();

    const gapAnalysesUsed = (usage as Record<string, number> | null)?.gap_analyses_used || 0;
    const contentIdeasUsed = (usage as Record<string, number> | null)?.content_ideas_used || 0;
    const pagesGenerated = (usage as Record<string, number> | null)?.pages_generated || 0;

    const pageCheck = canGeneratePage(citationPlan.id, pagesGenerated);

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
        pageGeneration: {
          available: citationPlan.features.pageGeneration,
          used: pagesGenerated,
          limit: citationPlan.intelligenceLimits.pagesPerMonth,
          remaining: pageCheck.remaining === -1 ? "unlimited" : pageCheck.remaining ?? 0,
        },
      },
    });
  } catch (error) {
    console.error("[Intelligence Features] Error:", error);
    return NextResponse.json({ error: "Failed to get features" }, { status: 500 });
  }
}
