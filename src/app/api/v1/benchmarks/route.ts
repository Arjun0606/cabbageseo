/**
 * Public Benchmarks API
 *
 * Returns aggregated industry benchmark data from real scan observations.
 * Powers the leaderboard page and can be used by external consumers.
 */

import { NextRequest, NextResponse } from "next/server";
import { db, industryBenchmarks, aiRecommendations } from "@/lib/db";
import { desc, count, countDistinct, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    // Try to get the latest weekly benchmark
    const [latest] = await db
      .select()
      .from(industryBenchmarks)
      .orderBy(desc(industryBenchmarks.createdAt))
      .limit(1);

    if (latest) {
      // Return pre-aggregated weekly data
      const topDomains = (latest.topDomains || []).map(
        (d: { domain: string; count: number; platforms: string[] }, i: number) => ({
          rank: i + 1,
          domain: d.domain,
          count: d.count,
          platforms: d.platforms,
        })
      );

      return NextResponse.json({
        period: latest.period,
        totalScans: latest.totalScans,
        totalRecommendations: latest.totalRecommendations,
        uniqueDomains: latest.uniqueDomains,
        topDomains,
        platformBreakdown: latest.platformBreakdown,
      });
    }

    // No weekly benchmark yet — query live from ai_recommendations
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [scansResult, recsResult, domainsResult] = await Promise.all([
      db
        .select({ count: countDistinct(aiRecommendations.scannedDomain) })
        .from(aiRecommendations)
        .where(sql`${aiRecommendations.observedAt} >= ${weekAgo}`),
      db
        .select({ count: count() })
        .from(aiRecommendations)
        .where(sql`${aiRecommendations.observedAt} >= ${weekAgo}`),
      db
        .select({ count: countDistinct(aiRecommendations.recommendedDomain) })
        .from(aiRecommendations)
        .where(sql`${aiRecommendations.observedAt} >= ${weekAgo}`),
    ]);

    const totalScans = Number(scansResult[0]?.count ?? 0);
    const totalRecommendations = Number(recsResult[0]?.count ?? 0);
    const uniqueDomains = Number(domainsResult[0]?.count ?? 0);

    // Get top domains
    const topDomainsResult = await db
      .select({
        domain: aiRecommendations.recommendedDomain,
        count: count(),
      })
      .from(aiRecommendations)
      .where(sql`${aiRecommendations.observedAt} >= ${weekAgo}`)
      .groupBy(aiRecommendations.recommendedDomain)
      .orderBy(sql`count(*) DESC`)
      .limit(30);

    const topDomains = [];
    for (const row of topDomainsResult) {
      const platformsResult = await db
        .select({ platform: aiRecommendations.platform })
        .from(aiRecommendations)
        .where(
          sql`${aiRecommendations.recommendedDomain} = ${row.domain} AND ${aiRecommendations.observedAt} >= ${weekAgo}`
        )
        .groupBy(aiRecommendations.platform);

      topDomains.push({
        rank: topDomains.length + 1,
        domain: row.domain,
        count: Number(row.count),
        platforms: platformsResult.map((p) => p.platform),
      });
    }

    return NextResponse.json({
      period: "live",
      totalScans,
      totalRecommendations,
      uniqueDomains,
      topDomains,
      platformBreakdown: {},
    });
  } catch (error) {
    console.error("[Benchmarks API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch benchmarks" },
      { status: 500 }
    );
  }
}
