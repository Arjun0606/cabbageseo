/**
 * MOMENTUM SCORE ENGINE
 *
 * Calculates a dynamic momentum score (0-100) for a site based on:
 * - Citation changes week-over-week
 * - Source listing coverage (how many of 6 key trust sources)
 * - Competitor relative position (gaining or losing ground)
 *
 * The score tells users at a glance: "Are you winning or losing in AI search?"
 */

import type { SupabaseClient } from "@supabase/supabase-js";

// The 6 key trust sources AI platforms rely on most
const KEY_TRUST_SOURCES = [
  "g2.com",
  "capterra.com",
  "producthunt.com",
  "reddit.com",
  "trustpilot.com",
  "trustradius.com",
];

export interface MomentumResult {
  score: number;           // 0-100
  change: number;          // week-over-week delta (can be negative)
  trend: "gaining" | "losing" | "stable";
  citationsWon: number;    // new citations this week
  citationsLost: number;   // citations lost vs last week
  queriesWon: number;      // queries where user is mentioned
  queriesTotal: number;    // total queries checked
  sourceCoverage: number;  // 0-6 (how many key trust sources listed)
  topCompetitor: { domain: string; citations: number } | null;
}

/**
 * Calculate momentum score for a site.
 *
 * Score breakdown:
 * - Base (0-50): market share relative to competitors
 * - Source bonus (0-30): trust source coverage (5 pts per key source)
 * - Momentum bonus/penalty (-20 to +20): week-over-week citation change
 *
 * Final score is clamped to 0-100.
 */
export async function calculateMomentum(
  siteId: string,
  db: SupabaseClient,
): Promise<MomentumResult> {
  // 1. Get site citation counts
  const { data: site } = await db
    .from("sites")
    .select("id, domain, category, total_citations, citations_this_week, citations_last_week")
    .eq("id", siteId)
    .maybeSingle();

  const totalCitations = site?.total_citations ?? 0;
  const citationsThisWeek = site?.citations_this_week ?? 0;
  const citationsLastWeek = site?.citations_last_week ?? 0;

  // 2. Get source listings count (only the 6 key sources)
  const { data: listings } = await db
    .from("source_listings")
    .select("source_domain, status")
    .eq("site_id", siteId)
    .in("source_domain", KEY_TRUST_SOURCES);

  const verifiedListings = (listings || []).filter(
    (l: { source_domain: string; status: string }) => l.status === "verified",
  );
  const sourceCoverage = verifiedListings.length;

  // 3. Get competitor data
  const { data: competitors } = await db
    .from("competitors")
    .select("domain, total_citations, citations_change")
    .eq("site_id", siteId)
    .order("total_citations", { ascending: false });

  const topCompetitor =
    competitors && competitors.length > 0
      ? {
          domain: competitors[0].domain as string,
          citations: (competitors[0].total_citations as number) ?? 0,
        }
      : null;

  // 4. Get queries where user is mentioned (citations = mentions)
  const { count: queriesWonCount } = await db
    .from("citations")
    .select("query", { count: "exact", head: true })
    .eq("site_id", siteId);

  // Get total distinct queries checked via geo_analyses
  const { data: analyses } = await db
    .from("geo_analyses")
    .select("queries")
    .eq("site_id", siteId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const queriesFromAnalysis = Array.isArray(analyses?.queries)
    ? analyses.queries.length
    : 0;
  const queriesWon = queriesWonCount ?? 0;
  const queriesTotal = Math.max(queriesFromAnalysis, queriesWon);

  // 5. Calculate citation deltas
  const citationsWon = Math.max(0, citationsThisWeek - citationsLastWeek);
  const citationsLost = Math.max(0, citationsLastWeek - citationsThisWeek);
  const weekOverWeekChange = citationsThisWeek - citationsLastWeek;

  // 6. Calculate score components

  // Base score (0-50): market share relative to top competitor
  let baseScore: number;
  if (!topCompetitor || topCompetitor.citations === 0) {
    // No competitor data - score purely on own citations
    baseScore = Math.min(50, totalCitations * 5);
  } else {
    // Market share: your citations / (yours + top competitor's)
    const totalPool = totalCitations + topCompetitor.citations;
    const marketShare = totalPool > 0 ? totalCitations / totalPool : 0;
    baseScore = Math.round(marketShare * 50);
  }

  // Source coverage bonus (0-30): 5 points per key source listed
  const sourceBonus = sourceCoverage * 5;

  // Momentum bonus/penalty (-20 to +20): based on week-over-week change
  let momentumBonus: number;
  if (citationsLastWeek === 0) {
    // No baseline - give a small bonus for any citations this week
    momentumBonus = citationsThisWeek > 0 ? 10 : 0;
  } else {
    const changeRate = weekOverWeekChange / citationsLastWeek;
    // Clamp change rate to -1..1, then scale to -20..+20
    const clampedRate = Math.max(-1, Math.min(1, changeRate));
    momentumBonus = Math.round(clampedRate * 20);
  }

  // Final score clamped to 0-100
  const rawScore = baseScore + sourceBonus + momentumBonus;
  const score = Math.max(0, Math.min(100, rawScore));

  // Determine trend
  let trend: "gaining" | "losing" | "stable";
  if (weekOverWeekChange > 0) {
    trend = "gaining";
  } else if (weekOverWeekChange < 0) {
    trend = "losing";
  } else {
    trend = "stable";
  }

  return {
    score,
    change: weekOverWeekChange,
    trend,
    citationsWon,
    citationsLost,
    queriesWon,
    queriesTotal,
    sourceCoverage,
    topCompetitor,
  };
}
