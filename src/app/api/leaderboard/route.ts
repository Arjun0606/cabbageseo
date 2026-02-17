/**
 * Leaderboard API — Public, no auth required
 *
 * Returns aggregated data from teaser_reports:
 * - Top scores (highest visibility scores)
 * - Most scanned (domains with the most reports)
 * - Recent scans (latest reports)
 */

import { NextResponse } from "next/server";
import { db, teaserReports } from "@/lib/db";
import { sql, desc } from "drizzle-orm";

export const revalidate = 300; // Cache for 5 minutes

export async function GET() {
  try {
    // Top scores — highest visibility score per domain (latest report only)
    const topScores = await db
      .select({
        domain: teaserReports.domain,
        visibilityScore: sql<number>`MAX(${teaserReports.visibilityScore})`.as("max_score"),
        scanCount: sql<number>`COUNT(*)`.as("scan_count"),
        lastScanned: sql<string>`MAX(${teaserReports.createdAt})`.as("last_scanned"),
      })
      .from(teaserReports)
      .groupBy(teaserReports.domain)
      .orderBy(sql`max_score DESC`)
      .limit(25);

    // Most scanned — domains with the most reports
    const mostScanned = await db
      .select({
        domain: teaserReports.domain,
        scanCount: sql<number>`COUNT(*)`.as("scan_count"),
        latestScore: sql<number>`(array_agg(${teaserReports.visibilityScore} ORDER BY ${teaserReports.createdAt} DESC))[1]`.as("latest_score"),
        lastScanned: sql<string>`MAX(${teaserReports.createdAt})`.as("last_scanned"),
      })
      .from(teaserReports)
      .groupBy(teaserReports.domain)
      .orderBy(sql`scan_count DESC`)
      .limit(25);

    // Recent scans — latest reports
    const recentScans = await db
      .select({
        domain: teaserReports.domain,
        visibilityScore: teaserReports.visibilityScore,
        isInvisible: teaserReports.isInvisible,
        createdAt: teaserReports.createdAt,
      })
      .from(teaserReports)
      .orderBy(desc(teaserReports.createdAt))
      .limit(25);

    // Total stats
    const [stats] = await db
      .select({
        totalScans: sql<number>`COUNT(*)`.as("total_scans"),
        uniqueDomains: sql<number>`COUNT(DISTINCT ${teaserReports.domain})`.as("unique_domains"),
        avgScore: sql<number>`ROUND(AVG(${teaserReports.visibilityScore}))`.as("avg_score"),
      })
      .from(teaserReports);

    return NextResponse.json({
      topScores,
      mostScanned,
      recentScans,
      stats: stats || { totalScans: 0, uniqueDomains: 0, avgScore: 0 },
    });
  } catch (error) {
    console.error("[Leaderboard] Error:", error);
    return NextResponse.json(
      { error: "Failed to load leaderboard" },
      { status: 500 }
    );
  }
}
