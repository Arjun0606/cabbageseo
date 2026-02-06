/**
 * /api/geo/sprint - 30-Day Sprint Framework
 *
 * GET: Get sprint progress and actions for a site
 * POST: Update sprint action status (complete/skip)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/api/get-user";
import { getTestSession } from "@/lib/testing/test-session";
import {
  generateSprintActions,
  calculateSprintProgress,
} from "@/lib/geo/sprint";
import type { SupabaseClient } from "@supabase/supabase-js";

function getDbClient(): SupabaseClient | null {
  try {
    return createServiceClient();
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const db = getDbClient();
    if (!db) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    const siteId = request.nextUrl.searchParams.get("siteId");
    if (!siteId) {
      return NextResponse.json(
        { error: "siteId is required" },
        { status: 400 }
      );
    }

    // Auth check (bypass → test session → supabase)
    const bypassUser = await getUser();
    if (bypassUser?.isTestAccount) {
      return NextResponse.json({
        data: getMockSprintData(),
        bypassMode: true,
      });
    }

    const testSession = await getTestSession();
    if (!testSession) {
      const supabase = await createClient();
      if (!supabase) {
        return NextResponse.json({ error: "Not configured" }, { status: 500 });
      }
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // Get site data
    const { data: site } = await db
      .from("sites")
      .select(
        "id, domain, category, geo_score_avg, total_citations, sprint_started_at, sprint_completed_at"
      )
      .eq("id", siteId)
      .single();

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    // Get existing sprint actions
    const { data: existingActions } = await db
      .from("sprint_actions")
      .select("*")
      .eq("site_id", siteId)
      .order("priority", { ascending: true });

    // If no sprint actions exist yet, generate them
    if (!existingActions || existingActions.length === 0) {
      // Get source listings
      const { data: listings } = await db
        .from("source_listings")
        .select("source_domain")
        .eq("site_id", siteId);

      const sourcesListed = (listings || []).map(
        (l: { source_domain: string }) => l.source_domain
      );

      // Get top competitor
      const { data: competitors } = await db
        .from("competitors")
        .select("domain, total_citations")
        .eq("site_id", siteId)
        .order("total_citations", { ascending: false })
        .limit(1);

      const topCompetitor = competitors?.[0]?.domain || null;

      // Generate actions
      const actionDefs = generateSprintActions(
        {
          domain: site.domain,
          geoScoreAvg: site.geo_score_avg,
          totalCitations: site.total_citations || 0,
          category: site.category,
        },
        sourcesListed,
        topCompetitor
      );

      // Save sprint actions to DB
      const actionsToInsert = actionDefs.map((a) => ({
        site_id: siteId,
        action_type: a.actionType,
        action_title: a.actionTitle,
        action_description: a.actionDescription,
        action_url: a.actionUrl || null,
        priority: a.priority,
        estimated_minutes: a.estimatedMinutes,
        week: a.week,
        status: "pending",
      }));

      await db.from("sprint_actions").insert(actionsToInsert);

      // Start sprint if not started
      if (!site.sprint_started_at) {
        await db
          .from("sites")
          .update({ sprint_started_at: new Date().toISOString() })
          .eq("id", siteId);
      }

      // Re-fetch
      const { data: newActions } = await db
        .from("sprint_actions")
        .select("*")
        .eq("site_id", siteId)
        .order("priority", { ascending: true });

      const progress = calculateSprintProgress(
        (newActions || []).map((a: { status: string }) => ({
          status: a.status,
        })),
        site.sprint_started_at || new Date().toISOString()
      );

      return NextResponse.json({
        data: {
          progress,
          actions: formatActions(newActions || []),
        },
      });
    }

    // Return existing sprint data
    const progress = calculateSprintProgress(
      existingActions.map((a: { status: string }) => ({ status: a.status })),
      site.sprint_started_at
    );

    return NextResponse.json({
      data: {
        progress,
        actions: formatActions(existingActions),
      },
    });
  } catch (error) {
    console.error("[/api/geo/sprint GET] Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDbClient();
    if (!db) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    // Auth check
    const bypassUser = await getUser();
    if (!bypassUser?.isTestAccount) {
      const testSession = await getTestSession();
      if (!testSession) {
        const supabase = await createClient();
        if (!supabase) {
          return NextResponse.json(
            { error: "Not configured" },
            { status: 500 }
          );
        }
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
          );
        }
      }
    }

    const body = await request.json();
    const { actionId, status } = body as {
      actionId: string;
      status: "completed" | "skipped";
    };

    if (!actionId || !["completed", "skipped"].includes(status)) {
      return NextResponse.json(
        { error: "actionId and valid status required" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = { status };
    if (status === "completed") {
      updateData.completed_at = new Date().toISOString();
    }

    const { error } = await db
      .from("sprint_actions")
      .update(updateData)
      .eq("id", actionId);

    if (error) {
      return NextResponse.json(
        { error: "Failed to update action" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[/api/geo/sprint POST] Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

function formatActions(
  actions: Array<{
    id: string;
    action_type: string;
    action_title: string;
    action_description: string;
    action_url: string | null;
    priority: number;
    estimated_minutes: number;
    week: number;
    status: string;
    completed_at: string | null;
  }>
) {
  return actions.map((a) => ({
    id: a.id,
    actionType: a.action_type,
    title: a.action_title,
    description: a.action_description,
    actionUrl: a.action_url,
    priority: a.priority,
    estimatedMinutes: a.estimated_minutes,
    week: a.week,
    status: a.status,
    completedAt: a.completed_at,
  }));
}

function getMockSprintData() {
  return {
    progress: {
      totalActions: 9,
      completedActions: 3,
      percentComplete: 33,
      currentDay: 12,
      currentWeek: 2,
      daysRemaining: 19,
      isComplete: false,
    },
    actions: [
      {
        id: "mock-1",
        actionType: "get_listed_g2",
        title: "Get listed on G2",
        description: "G2 is the #1 source AI uses for software recommendations.",
        actionUrl: "https://www.g2.com/products/new",
        priority: 1,
        estimatedMinutes: 120,
        week: 1,
        status: "completed",
        completedAt: new Date().toISOString(),
      },
      {
        id: "mock-2",
        actionType: "get_listed_capterra",
        title: "Get listed on Capterra",
        description: "Capterra is the second most-cited source by AI platforms.",
        actionUrl: "https://www.capterra.com/vendors/sign-up",
        priority: 2,
        estimatedMinutes: 90,
        week: 1,
        status: "completed",
        completedAt: new Date().toISOString(),
      },
      {
        id: "mock-3",
        actionType: "publish_comparison",
        title: "Publish a comparison page",
        description: "Create a detailed comparison page on your site.",
        priority: 3,
        estimatedMinutes: 60,
        week: 2,
        status: "in_progress",
        completedAt: null,
      },
    ],
  };
}
