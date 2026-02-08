/**
 * Weekly Benchmark Aggregation — Inngest Cron Job
 *
 * Runs every Monday at 2 AM UTC.
 * Aggregates ai_recommendations data from the past week into
 * industry_benchmarks for the leaderboard, public reports, and API.
 *
 * This is the moat compounding in action.
 */

import { inngest } from "./inngest-client";
import { db, aiRecommendations, industryBenchmarks } from "@/lib/db";
import { sql, gte, lte, count, countDistinct } from "drizzle-orm";

// ============================================
// WEEKLY BENCHMARK AGGREGATION — Cron
// ============================================
export const weeklyBenchmarkAggregation = inngest.createFunction(
  {
    id: "weekly-benchmark-aggregation",
    name: "Weekly Benchmark Aggregation",
    retries: 2,
  },
  { cron: "0 2 * * 1" }, // Every Monday at 2 AM UTC
  async ({ step }) => {
    // Calculate current week period (YYYY-WNN)
    const now = new Date();
    const year = now.getFullYear();
    const oneJan = new Date(year, 0, 1);
    const weekNum = Math.ceil(
      ((now.getTime() - oneJan.getTime()) / 86400000 + oneJan.getDay() + 1) / 7
    );
    const period = `${year}-W${String(weekNum).padStart(2, "0")}`;

    // Date range: last 7 days
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const stats = await step.run("aggregate-recommendations", async () => {
      // Get total counts
      const totalResult = await db
        .select({ count: count() })
        .from(aiRecommendations)
        .where(gte(aiRecommendations.observedAt, weekAgo));
      const totalRecommendations = totalResult[0]?.count ?? 0;

      // Get unique scanned domains (proxy for scan count)
      const scansResult = await db
        .select({ count: countDistinct(aiRecommendations.scannedDomain) })
        .from(aiRecommendations)
        .where(gte(aiRecommendations.observedAt, weekAgo));
      const totalScans = scansResult[0]?.count ?? 0;

      // Get unique recommended domains
      const domainsResult = await db
        .select({ count: countDistinct(aiRecommendations.recommendedDomain) })
        .from(aiRecommendations)
        .where(gte(aiRecommendations.observedAt, weekAgo));
      const uniqueDomains = domainsResult[0]?.count ?? 0;

      // Get top 30 recommended domains
      const topDomainsResult = await db
        .select({
          domain: aiRecommendations.recommendedDomain,
          count: count(),
        })
        .from(aiRecommendations)
        .where(gte(aiRecommendations.observedAt, weekAgo))
        .groupBy(aiRecommendations.recommendedDomain)
        .orderBy(sql`count(*) DESC`)
        .limit(30);

      // For each top domain, get which platforms recommended them
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
          domain: row.domain,
          count: Number(row.count),
          platforms: platformsResult.map((p) => p.platform),
        });
      }

      // Platform breakdown
      const platformResult = await db
        .select({
          platform: aiRecommendations.platform,
          count: count(),
        })
        .from(aiRecommendations)
        .where(gte(aiRecommendations.observedAt, weekAgo))
        .groupBy(aiRecommendations.platform);

      const platformBreakdown: Record<string, number> = {};
      for (const row of platformResult) {
        platformBreakdown[row.platform] = Number(row.count);
      }

      return {
        totalScans: Number(totalScans),
        totalRecommendations: Number(totalRecommendations),
        uniqueDomains: Number(uniqueDomains),
        topDomains,
        platformBreakdown,
      };
    });

    // Upsert the benchmark record
    await step.run("save-benchmark", async () => {
      await db
        .insert(industryBenchmarks)
        .values({
          period,
          category: "all",
          totalScans: stats.totalScans,
          totalRecommendations: stats.totalRecommendations,
          uniqueDomains: stats.uniqueDomains,
          topDomains: stats.topDomains as any,
          platformBreakdown: stats.platformBreakdown as any,
        })
        .onConflictDoUpdate({
          target: [industryBenchmarks.period, industryBenchmarks.category],
          set: {
            totalScans: stats.totalScans,
            totalRecommendations: stats.totalRecommendations,
            uniqueDomains: stats.uniqueDomains,
            topDomains: stats.topDomains as any,
            platformBreakdown: stats.platformBreakdown as any,
          },
        });
    });

    return {
      period,
      ...stats,
    };
  }
);

export const benchmarkFunctions = [weeklyBenchmarkAggregation];
