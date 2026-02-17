/**
 * Score History API
 *
 * GET /api/v1/history?domain=X&days=90 — Returns historical scores over time
 *
 * Plan-gated retention:
 * - Scout: 30 days
 * - Command: 365 days
 * - Dominate: 365 days
 */

import { NextRequest, NextResponse } from "next/server";
import { db, teaserReports } from "@/lib/db";
import { eq, desc, gte, and } from "drizzle-orm";
import { validateApiKey, hasScope } from "@/lib/api/validate-api-key";

const RETENTION_DAYS: Record<string, number> = {
  free: 7,
  scout: 30,
  command: 365,
  dominate: 365,
};

export async function GET(request: NextRequest) {
  try {
    const apiUser = await validateApiKey(request);
    if (!apiUser) {
      return NextResponse.json(
        { error: "Invalid or missing API key" },
        { status: 401 }
      );
    }

    if (!hasScope(apiUser, "history")) {
      return NextResponse.json({ error: "API key does not have 'history' scope" }, { status: 403 });
    }

    const domain = request.nextUrl.searchParams.get("domain");
    if (!domain) {
      return NextResponse.json({ error: "domain parameter is required" }, { status: 400 });
    }

    const cleanDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];

    const maxDays = RETENTION_DAYS[apiUser.plan] || 7;
    const requestedDays = Math.min(
      parseInt(request.nextUrl.searchParams.get("days") || String(maxDays)),
      maxDays,
    );

    const since = new Date();
    since.setDate(since.getDate() - requestedDays);

    const history = await db
      .select({
        id: teaserReports.id,
        visibilityScore: teaserReports.visibilityScore,
        isInvisible: teaserReports.isInvisible,
        summary: teaserReports.summary,
        createdAt: teaserReports.createdAt,
      })
      .from(teaserReports)
      .where(
        and(
          eq(teaserReports.domain, cleanDomain),
          gte(teaserReports.createdAt, since),
        )
      )
      .orderBy(desc(teaserReports.createdAt))
      .limit(100);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const entries = history.map(h => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const summary = h.summary as any;
      return {
        score: h.visibilityScore,
        isInvisible: h.isInvisible,
        platformScores: summary?.platformScores || {},
        scannedAt: h.createdAt,
      };
    });

    // Calculate trend
    let trend: "improving" | "declining" | "stable" | "new" = "new";
    if (entries.length >= 2) {
      const latest = entries[0].score ?? 0;
      const oldest = entries[entries.length - 1].score ?? 0;
      const delta = latest - oldest;
      if (delta > 5) trend = "improving";
      else if (delta < -5) trend = "declining";
      else trend = "stable";
    }

    return NextResponse.json({
      domain: cleanDomain,
      days: requestedDays,
      maxDays,
      totalScans: entries.length,
      trend,
      latestScore: entries[0]?.score ?? null,
      history: entries,
    });
  } catch (error) {
    console.error("[v1/history] Error:", error);
    return NextResponse.json({ error: "Failed to get history" }, { status: 500 });
  }
}
