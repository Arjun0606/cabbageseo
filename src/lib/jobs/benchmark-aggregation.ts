/**
 * Weekly Benchmark Aggregation — Inngest Cron Job
 *
 * Runs every Monday at 2 AM UTC.
 * Aggregates ai_recommendations data from the past week into
 * industry_benchmarks for public reports and API.
 *
 * Produces:
 * - "all" category: global benchmarks across every domain
 * - Per-category benchmarks: filtered by site categories (saas, ecommerce, etc.)
 *
 * This is the moat compounding in action.
 */

import { inngest } from "./inngest-client";
import { db, aiRecommendations, industryBenchmarks, sites } from "@/lib/db";
import { sql, gte, count, countDistinct, isNotNull, eq, and, inArray } from "drizzle-orm";

/**
 * Aggregate recommendations for a given set of scanned domains (or all).
 * Returns stats suitable for upserting into industry_benchmarks.
 */
async function aggregateRecommendations(
  weekAgo: Date,
  filterDomains?: string[]
) {
  const baseCondition = filterDomains
    ? and(
        gte(aiRecommendations.observedAt, weekAgo),
        inArray(aiRecommendations.scannedDomain, filterDomains)
      )
    : gte(aiRecommendations.observedAt, weekAgo);

  // Get total counts
  const totalResult = await db
    .select({ count: count() })
    .from(aiRecommendations)
    .where(baseCondition);
  const totalRecommendations = totalResult[0]?.count ?? 0;

  // Get unique scanned domains (proxy for scan count)
  const scansResult = await db
    .select({ count: countDistinct(aiRecommendations.scannedDomain) })
    .from(aiRecommendations)
    .where(baseCondition);
  const totalScans = scansResult[0]?.count ?? 0;

  // Get unique recommended domains
  const domainsResult = await db
    .select({ count: countDistinct(aiRecommendations.recommendedDomain) })
    .from(aiRecommendations)
    .where(baseCondition);
  const uniqueDomains = domainsResult[0]?.count ?? 0;

  // Get top 30 recommended domains
  const topDomainsResult = await db
    .select({
      domain: aiRecommendations.recommendedDomain,
      count: count(),
    })
    .from(aiRecommendations)
    .where(baseCondition)
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
        and(
          eq(aiRecommendations.recommendedDomain, row.domain),
          gte(aiRecommendations.observedAt, weekAgo)
        )
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
    .where(baseCondition)
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
}

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

    // Step 1: Global "all" category aggregation
    const stats = await step.run("aggregate-all", async () => {
      return aggregateRecommendations(weekAgo);
    });

    // Step 2: Save global benchmark
    await step.run("save-all-benchmark", async () => {
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

    // Step 3: Get distinct categories from sites
    const categories = await step.run("get-categories", async () => {
      const result = await db
        .select({ category: sites.category })
        .from(sites)
        .where(isNotNull(sites.category))
        .groupBy(sites.category);

      return result
        .map((r) => r.category)
        .filter((c): c is string => c !== null && c !== "");
    });

    // Step 4: Per-category aggregation
    for (const category of categories) {
      const categoryStats = await step.run(
        `aggregate-${category}`,
        async () => {
          // Get all domains in this category
          const categoryDomains = await db
            .select({ domain: sites.domain })
            .from(sites)
            .where(eq(sites.category, category));

          const domainList = categoryDomains.map((d) => d.domain);
          if (domainList.length === 0) return null;

          return aggregateRecommendations(weekAgo, domainList);
        }
      );

      if (categoryStats) {
        await step.run(`save-${category}-benchmark`, async () => {
          await db
            .insert(industryBenchmarks)
            .values({
              period,
              category,
              totalScans: categoryStats.totalScans,
              totalRecommendations: categoryStats.totalRecommendations,
              uniqueDomains: categoryStats.uniqueDomains,
              topDomains: categoryStats.topDomains as any,
              platformBreakdown: categoryStats.platformBreakdown as any,
            })
            .onConflictDoUpdate({
              target: [industryBenchmarks.period, industryBenchmarks.category],
              set: {
                totalScans: categoryStats.totalScans,
                totalRecommendations: categoryStats.totalRecommendations,
                uniqueDomains: categoryStats.uniqueDomains,
                topDomains: categoryStats.topDomains as any,
                platformBreakdown: categoryStats.platformBreakdown as any,
              },
            });
        });
      }
    }

    return {
      period,
      globalStats: stats,
      categoriesProcessed: categories.length,
    };
  }
);

export const benchmarkFunctions = [weeklyBenchmarkAggregation];
