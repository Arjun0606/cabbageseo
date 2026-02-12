/**
 * MOMENTUM SCORE ENGINE
 *
 * Calculates a dynamic momentum score (0-100) for a site based on:
 * - Total AI citations (logarithmic curve, 0-50 pts)
 * - Source listing coverage weighted by platform trust score (0-30 pts)
 * - Week-over-week citation change, sigmoid-smoothed (-20 to +20 pts)
 *
 * Uses the master TRUST_SOURCES catalog for weights instead of a hardcoded
 * SaaS-only list. The score adapts to whatever sources are relevant.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { TRUST_SOURCES } from "@/lib/ai-revenue/sources";

// Build a weight map from the master catalog: domain → trustScore
// Normalize so the max possible source bonus = 30 pts
const SOURCE_WEIGHT_MAP = new Map(
  TRUST_SOURCES.map(s => [s.domain, s.trustScore])
);

export interface MomentumBreakdown {
  baseScore: number;
  sourceBonus: number;
  momentumBonus: number;
  explanation: string;
  tip: string | null;
}

export interface MomentumResult {
  score: number;           // 0-100
  change: number;          // week-over-week delta (can be negative)
  trend: "gaining" | "losing" | "stable";
  citationsWon: number;    // new citations this week
  citationsLost: number;   // citations lost vs last week
  queriesWon: number;      // queries where user is mentioned
  queriesTotal: number;    // total queries checked
  sourceCoverage: number;  // how many trust sources verified
  breakdown: MomentumBreakdown;
}

function logCurve(value: number, halfPoint: number, maxOutput: number): number {
  if (value <= 0) return 0;
  return maxOutput * (1 - Math.exp(-value / halfPoint));
}

function sigmoid(x: number): number {
  return (2 / (1 + Math.exp(-3 * x))) - 1;
}

/**
 * Calculate momentum score for a site.
 *
 * Score breakdown:
 * - Base (0-50): total AI citations, logarithmic curve
 * - Source bonus (0-30): verified trust source coverage, weighted by trustScore
 * - Momentum bonus/penalty (-20 to +20): sigmoid-smoothed week-over-week change
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

  // 2. Get ALL verified source listings for this site
  const { data: listings } = await db
    .from("source_listings")
    .select("source_domain, status")
    .eq("site_id", siteId)
    .eq("status", "verified");

  const verifiedListings = (listings || []) as { source_domain: string; status: string }[];
  const sourceCoverage = verifiedListings.length;
  const verifiedDomains = verifiedListings.map(l => l.source_domain);

  // 3. Get queries won
  const { count: queriesWonCount } = await db
    .from("citations")
    .select("query", { count: "exact", head: true })
    .eq("site_id", siteId);

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

  // 4. Calculate citation deltas
  const citationsWon = Math.max(0, citationsThisWeek - citationsLastWeek);
  const citationsLost = Math.max(0, citationsLastWeek - citationsThisWeek);
  const weekOverWeekChange = citationsThisWeek - citationsLastWeek;

  // 5. Calculate score components

  // Base score (0-50): logarithmic curve
  const baseScore = Math.round(logCurve(totalCitations, 8, 50));

  // Source coverage bonus (0-30): weighted by trust score, capped at 30
  // Each verified source contributes its trustScore weight, then normalize to 0-30
  const rawSourceWeight = verifiedDomains.reduce(
    (sum, domain) => sum + (SOURCE_WEIGHT_MAP.get(domain) ?? 3),
    0,
  );
  // Normalize: 30 pts is the max. A perfect score would need ~30 trust-score points worth.
  const sourceBonus = Math.min(30, Math.round(rawSourceWeight));

  // Momentum bonus/penalty (-20 to +20): sigmoid-smoothed week-over-week change
  let momentumBonus: number;
  if (citationsLastWeek === 0) {
    momentumBonus = citationsThisWeek > 0
      ? Math.round(logCurve(citationsThisWeek, 3, 12))
      : 0;
  } else {
    const changeRate = weekOverWeekChange / citationsLastWeek;
    momentumBonus = Math.round(sigmoid(changeRate) * 20);
  }

  const rawScore = baseScore + sourceBonus + momentumBonus;
  const score = Math.max(0, Math.min(100, rawScore));

  let trend: "gaining" | "losing" | "stable";
  if (weekOverWeekChange > 0) trend = "gaining";
  else if (weekOverWeekChange < 0) trend = "losing";
  else trend = "stable";

  const breakdown = buildBreakdown(
    baseScore, sourceBonus, momentumBonus,
    totalCitations, verifiedDomains,
    weekOverWeekChange, citationsLastWeek, score,
    site?.category,
  );

  return {
    score, change: weekOverWeekChange, trend,
    citationsWon, citationsLost,
    queriesWon, queriesTotal, sourceCoverage,
    breakdown,
  };
}

function buildBreakdown(
  baseScore: number,
  sourceBonus: number,
  momentumBonus: number,
  totalCitations: number,
  verifiedDomains: string[],
  weekOverWeekChange: number,
  citationsLastWeek: number,
  finalScore: number,
  siteCategory?: string | null,
): MomentumBreakdown {
  const parts: string[] = [];

  if (totalCitations === 0) {
    parts.push(`${baseScore} pts from AI citations (none found yet)`);
  } else {
    parts.push(`${baseScore} pts from ${totalCitations} AI citation${totalCitations !== 1 ? "s" : ""}`);
  }

  if (verifiedDomains.length > 0) {
    const sourceNames = verifiedDomains
      .map(d => d.replace(".com", "").replace(".co", "").replace(".", ""))
      .map(n => n.charAt(0).toUpperCase() + n.slice(1));
    parts.push(
      `+${sourceBonus} pts from ${sourceNames.join(", ")} (${verifiedDomains.length} trust source${verifiedDomains.length !== 1 ? "s" : ""})`,
    );
  } else {
    parts.push(`+0 pts from trust sources (none verified yet)`);
  }

  if (momentumBonus > 0) {
    if (citationsLastWeek === 0) {
      parts.push(`+${momentumBonus} pts from new citations this week`);
    } else {
      const pctChange = Math.round((weekOverWeekChange / citationsLastWeek) * 100);
      parts.push(`+${momentumBonus} pts from ${pctChange}% week-over-week growth`);
    }
  } else if (momentumBonus < 0) {
    const pctChange = Math.abs(
      Math.round((weekOverWeekChange / (citationsLastWeek || 1)) * 100),
    );
    parts.push(`${momentumBonus} pts from ${pctChange}% week-over-week decline`);
  } else {
    parts.push(`+0 pts momentum (stable week-over-week)`);
  }

  const explanation = `Score ${finalScore}: ${parts.join(", ")}`;
  const tip = generateTip(verifiedDomains, totalCitations, sourceBonus, siteCategory);

  return { baseScore, sourceBonus, momentumBonus, explanation, tip };
}

function generateTip(
  verifiedDomains: string[],
  totalCitations: number,
  currentSourceBonus: number,
  siteCategory?: string | null,
): string | null {
  if (totalCitations === 0) {
    return "Run an AI visibility check to discover your current citation count";
  }

  // Suggest missing sources that are relevant to this business type
  // (not just the globally highest-trust ones)
  const cat = (siteCategory || "").toLowerCase();
  const relevantTags: string[] = [];

  if (cat.includes("saas") || cat.includes("software") || cat.includes("tech") || cat.includes("tool")) {
    relevantTags.push("saas", "software", "devtools");
  } else if (cat.includes("ecommerce") || cat.includes("retail") || cat.includes("shop")) {
    relevantTags.push("ecommerce", "b2c", "marketplace");
  } else if (cat.includes("local") || cat.includes("restaurant")) {
    relevantTags.push("local", "restaurant", "service");
  } else if (cat.includes("health") || cat.includes("medical")) {
    relevantTags.push("health", "medical", "healthcare");
  } else if (cat.includes("agency") || cat.includes("consulting")) {
    relevantTags.push("agency", "consulting", "b2b");
  }

  let missingSources = TRUST_SOURCES
    .filter(s => !verifiedDomains.includes(s.domain))
    .sort((a, b) => b.trustScore - a.trustScore);

  // If we know the business type, prioritize relevant sources
  if (relevantTags.length > 0) {
    const relevant = missingSources.filter(s =>
      s.relevantFor.some(r => relevantTags.includes(r))
    );
    if (relevant.length > 0) missingSources = relevant;
  }

  if (missingSources.length > 0 && currentSourceBonus < 30) {
    const top = missingSources[0];
    return `Get listed on ${top.name} (trust score ${top.trustScore}/10) to boost your visibility`;
  }

  if (currentSourceBonus >= 30) {
    return "Great trust source coverage — focus on creating content that gets cited";
  }

  return null;
}
