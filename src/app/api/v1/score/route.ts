/**
 * Quick Score API
 *
 * GET /api/v1/score?domain=X — Returns latest score from DB (no new scan)
 *
 * Lightweight endpoint for monitoring scripts, CI/CD, badges.
 * Requires API key authentication.
 */

import { NextRequest, NextResponse } from "next/server";
import { db, teaserReports } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { validateApiKey } from "@/lib/api/validate-api-key";

export async function GET(request: NextRequest) {
  try {
    const apiUser = await validateApiKey(request);
    if (!apiUser) {
      return NextResponse.json(
        { error: "Invalid or missing API key" },
        { status: 401 }
      );
    }

    const domain = request.nextUrl.searchParams.get("domain");
    if (!domain) {
      return NextResponse.json({ error: "domain parameter is required" }, { status: 400 });
    }

    const cleanDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];

    const [latest] = await db
      .select({
        id: teaserReports.id,
        domain: teaserReports.domain,
        visibilityScore: teaserReports.visibilityScore,
        isInvisible: teaserReports.isInvisible,
        summary: teaserReports.summary,
        createdAt: teaserReports.createdAt,
      })
      .from(teaserReports)
      .where(eq(teaserReports.domain, cleanDomain))
      .orderBy(desc(teaserReports.createdAt))
      .limit(1);

    if (!latest) {
      return NextResponse.json(
        { error: "No scan found for this domain. Run a scan first.", domain: cleanDomain },
        { status: 404 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const summary = latest.summary as any;

    return NextResponse.json({
      domain: latest.domain,
      score: latest.visibilityScore,
      isInvisible: latest.isInvisible,
      platformScores: summary?.platformScores || {},
      message: summary?.message || "",
      scannedAt: latest.createdAt,
      reportUrl: `https://cabbageseo.com/r/${latest.domain}`,
    });
  } catch (error) {
    console.error("[v1/score] Error:", error);
    return NextResponse.json({ error: "Failed to get score" }, { status: 500 });
  }
}
