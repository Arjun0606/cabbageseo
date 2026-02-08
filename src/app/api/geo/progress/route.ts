/**
 * Progress API — Returns historical momentum data for progress card
 */

import { NextRequest, NextResponse } from "next/server";
import { db, sites, sprintActions, monthlyCheckpoints } from "@/lib/db";
import { eq, and, count } from "drizzle-orm";
import { getUser } from "@/lib/api/get-user";

export async function GET(request: NextRequest) {
  try {
    const siteId = request.nextUrl.searchParams.get("siteId");
    if (!siteId) {
      return NextResponse.json({ error: "siteId required" }, { status: 400 });
    }

    // Auth check
    const currentUser = await getUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch site data
    const [site] = await db
      .select({
        sprintStartedAt: sites.sprintStartedAt,
        momentumScore: sites.momentumScore,
        createdAt: sites.createdAt,
      })
      .from(sites)
      .where(eq(sites.id, siteId))
      .limit(1);

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    // Fetch completed sprint actions count
    const [actionCount] = await db
      .select({ count: count() })
      .from(sprintActions)
      .where(
        and(
          eq(sprintActions.siteId, siteId),
          eq(sprintActions.status, "completed")
        )
      );

    // Fetch monthly checkpoints (ordered by period)
    const checkpoints = await db
      .select({
        period: monthlyCheckpoints.period,
        momentumScore: monthlyCheckpoints.momentumScore,
      })
      .from(monthlyCheckpoints)
      .where(eq(monthlyCheckpoints.siteId, siteId))
      .orderBy(monthlyCheckpoints.period);

    const monthlyScores = checkpoints.map((c) => ({
      period: c.period,
      score: c.momentumScore || 0,
    }));

    // Starting score: first checkpoint's score, or 0 if no checkpoints
    const startingScore = monthlyScores.length > 0 ? monthlyScores[0].score : 0;

    return NextResponse.json({
      data: {
        startDate: site.sprintStartedAt?.toISOString() || site.createdAt.toISOString(),
        startingScore,
        currentScore: site.momentumScore || 0,
        actionsCompleted: actionCount?.count || 0,
        monthlyScores,
      },
    });
  } catch (error) {
    console.error("[Progress API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch progress data" },
      { status: 500 }
    );
  }
}
