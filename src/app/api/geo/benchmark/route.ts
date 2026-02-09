/**
 * /api/geo/benchmark - Industry Benchmark for a Site
 *
 * GET: Returns how the site's domain ranks among all AI-recommended brands.
 * Query params:
 *   - siteId: Required site ID
 *
 * Returns percentile rank, recommendation count, platforms, and week-over-week trends.
 */

import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/api/get-user";
import { db, aiRecommendations, sites } from "@/lib/db";
import { sql, count, eq, gte } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = currentUser.organizationId;
    if (!organizationId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId");
    if (!siteId) {
      return NextResponse.json({ error: "siteId required" }, { status: 400 });
    }

    // Verify site belongs to user's org
    const [site] = await db
      .select({
        id: sites.id,
        domain: sites.domain,
        category: sites.category,
        organizationId: sites.organizationId,
      })
      .from(sites)
      .where(eq(sites.id, siteId));

    if (!site || site.organizationId !== organizationId) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    const domain = site.domain;
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    // Run all queries in parallel
    const [currentWeekResult, previousWeekResult, platformsResult, allDomainsResult] =
      await Promise.all([
        // This domain's recommendation count this week
        db
          .select({ count: count() })
          .from(aiRecommendations)
          .where(
            sql`${aiRecommendations.recommendedDomain} = ${domain} AND ${aiRecommendations.observedAt} >= ${weekAgo}`
          ),
        // This domain's recommendation count last week
        db
          .select({ count: count() })
          .from(aiRecommendations)
          .where(
            sql`${aiRecommendations.recommendedDomain} = ${domain} AND ${aiRecommendations.observedAt} >= ${twoWeeksAgo} AND ${aiRecommendations.observedAt} < ${weekAgo}`
          ),
        // Platforms that recommend this domain
        db
          .select({ platform: aiRecommendations.platform })
          .from(aiRecommendations)
          .where(
            sql`${aiRecommendations.recommendedDomain} = ${domain} AND ${aiRecommendations.observedAt} >= ${weekAgo}`
          )
          .groupBy(aiRecommendations.platform),
        // All domains with their counts (for percentile calculation)
        db
          .select({
            domain: aiRecommendations.recommendedDomain,
            count: count(),
          })
          .from(aiRecommendations)
          .where(gte(aiRecommendations.observedAt, weekAgo))
          .groupBy(aiRecommendations.recommendedDomain),
      ]);

    const currentCount = Number(currentWeekResult[0]?.count ?? 0);
    const previousCount = Number(previousWeekResult[0]?.count ?? 0);
    const platforms = platformsResult.map((p) => p.platform);

    // Calculate percentile rank: what % of domains are below us
    const totalDomains = allDomainsResult.length;
    const domainsAbove = allDomainsResult.filter(
      (d) => Number(d.count) > currentCount
    ).length;

    let percentileRank = 0;
    if (currentCount > 0 && totalDomains > 0) {
      percentileRank = Math.round(
        ((totalDomains - domainsAbove) / totalDomains) * 100
      );
      percentileRank = Math.max(1, Math.min(100, percentileRank));
    }

    // Week-over-week change
    const change = currentCount - previousCount;
    const changePercent =
      previousCount > 0
        ? Math.round((change / previousCount) * 100)
        : currentCount > 0
          ? 100
          : 0;

    return NextResponse.json({
      success: true,
      data: {
        domain,
        totalRecommendations: currentCount,
        percentileRank,
        totalDomainsTracked: totalDomains,
        platforms,
        weekOverWeek: {
          current: currentCount,
          previous: previousCount,
          change,
          changePercent,
        },
      },
    });
  } catch (error) {
    console.error("[/api/geo/benchmark GET] Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
