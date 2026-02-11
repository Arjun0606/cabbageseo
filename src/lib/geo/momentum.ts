/**
 * MOMENTUM SCORE ENGINE
 *
 * Calculates a dynamic momentum score (0-100) for a site based on:
 * - Total AI citations (logarithmic curve, 0-50 pts)
 * - Source listing coverage weighted by platform importance (0-30 pts)
 * - Week-over-week citation change, sigmoid-smoothed (-20 to +20 pts)
 *
 * Uses continuous curves (logarithmic, sigmoid) instead of linear jumps
 * to produce granular scores like 27, 48, 63 rather than multiples of 5.
 *
 * The score tells users at a glance: "How visible are you in AI search?"
 */

import type { SupabaseClient } from "@supabase/supabase-js";

// The 6 key trust sources AI platforms rely on most, weighted by importance
const SOURCE_WEIGHTS: Record<string, number> = {
  "g2.com": 7,
  "capterra.com": 6,
  "producthunt.com": 5,
  "trustpilot.com": 5,
  "trustradius.com": 4,
  "reddit.com": 3,
};

const KEY_TRUST_SOURCES = Object.keys(SOURCE_WEIGHTS);

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
  sourceCoverage: number;  // 0-6 (how many key trust sources listed)
  breakdown: MomentumBreakdown;
}

/**
 * Logarithmic curve with diminishing returns.
 * Maps 0..infinity to 0..maxOutput, with halfPoint determining the curve shape.
 * Example: logCurve(8, 8, 50) = 25 (half of max at halfPoint)
 */
function logCurve(value: number, halfPoint: number, maxOutput: number): number {
  if (value <= 0) return 0;
  return maxOutput * (1 - Math.exp(-value / halfPoint));
}

/**
 * Sigmoid function for smoothing change rates.
 * Maps -infinity..+infinity to -1..+1 with smooth S-curve.
 */
function sigmoid(x: number): number {
  return (2 / (1 + Math.exp(-3 * x))) - 1;
}

/**
 * Calculate momentum score for a site.
 *
 * Score breakdown:
 * - Base (0-50): total AI citations, logarithmic curve with diminishing returns
 * - Source bonus (0-30): weighted trust source coverage
 * - Momentum bonus/penalty (-20 to +20): sigmoid-smoothed week-over-week change
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

  // 2. Get source listings (only the 6 key sources)
  const { data: listings } = await db
    .from("source_listings")
    .select("source_domain, status")
    .eq("site_id", siteId)
    .in("source_domain", KEY_TRUST_SOURCES);

  const verifiedListings = (listings || []).filter(
    (l: { source_domain: string; status: string }) => l.status === "verified",
  );
  const sourceCoverage = verifiedListings.length;
  const verifiedDomains = verifiedListings.map(
    (l: { source_domain: string }) => l.source_domain,
  );

  // 3. Get queries where user is mentioned (citations = mentions)
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

  // 4. Calculate citation deltas
  const citationsWon = Math.max(0, citationsThisWeek - citationsLastWeek);
  const citationsLost = Math.max(0, citationsLastWeek - citationsThisWeek);
  const weekOverWeekChange = citationsThisWeek - citationsLastWeek;

  // 5. Calculate score components with continuous curves

  // Base score (0-50): logarithmic curve based on total citations
  // 1→6, 2→12, 3→17, 5→23, 8→32, 10→36, 15→42, 20→46
  const baseScore = Math.round(logCurve(totalCitations, 8, 50));

  // Source coverage bonus (0-30): weighted by platform importance
  // G2(7) + Capterra(6) + ProductHunt(5) + Trustpilot(5) + TrustRadius(4) + Reddit(3) = 30
  const sourceBonus = Math.min(
    30,
    verifiedDomains.reduce(
      (sum: number, domain: string) => sum + (SOURCE_WEIGHTS[domain] ?? 0),
      0,
    ),
  );

  // Momentum bonus/penalty (-20 to +20): sigmoid-smoothed week-over-week change
  let momentumBonus: number;
  if (citationsLastWeek === 0) {
    // No baseline — logarithmic bonus for any new citations
    momentumBonus = citationsThisWeek > 0
      ? Math.round(logCurve(citationsThisWeek, 3, 12))
      : 0;
  } else {
    const changeRate = weekOverWeekChange / citationsLastWeek;
    // Sigmoid smoothing: gradual response to changes, not linear
    momentumBonus = Math.round(sigmoid(changeRate) * 20);
  }

  // Final score clamped to 0-100 (round only once at the end)
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

  // Build explanation
  const breakdown = buildBreakdown(
    baseScore,
    sourceBonus,
    momentumBonus,
    totalCitations,
    verifiedDomains,
    weekOverWeekChange,
    citationsLastWeek,
    score,
  );

  return {
    score,
    change: weekOverWeekChange,
    trend,
    citationsWon,
    citationsLost,
    queriesWon,
    queriesTotal,
    sourceCoverage,
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
): MomentumBreakdown {
  // Build human-readable explanation parts
  const parts: string[] = [];

  // Base score explanation
  if (totalCitations === 0) {
    parts.push(`${baseScore} pts from AI citations (none found yet)`);
  } else {
    parts.push(`${baseScore} pts from ${totalCitations} AI citation${totalCitations !== 1 ? "s" : ""}`);
  }

  // Source bonus explanation
  if (verifiedDomains.length > 0) {
    const sourceNames = verifiedDomains
      .map((d) => d.replace(".com", "").replace(".", ""))
      .map((n) => n.charAt(0).toUpperCase() + n.slice(1));
    parts.push(
      `+${sourceBonus} pts from ${sourceNames.join(", ")} (${verifiedDomains.length}/6 trust sources)`,
    );
  } else {
    parts.push(`+0 pts from trust sources (none verified yet)`);
  }

  // Momentum explanation
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

  // Generate actionable tip
  const tip = generateTip(verifiedDomains, totalCitations, sourceBonus);

  return { baseScore, sourceBonus, momentumBonus, explanation, tip };
}

function generateTip(
  verifiedDomains: string[],
  totalCitations: number,
  currentSourceBonus: number,
): string | null {
  // Suggest the highest-weight missing source
  const missingSources = Object.entries(SOURCE_WEIGHTS)
    .filter(([domain]) => !verifiedDomains.includes(domain))
    .sort(([, a], [, b]) => b - a);

  if (totalCitations === 0) {
    return "Run an AI visibility check to discover your current citation count";
  }

  if (missingSources.length > 0) {
    const [domain, weight] = missingSources[0];
    const name = domain.replace(".com", "").replace(".", "");
    const displayName = name.charAt(0).toUpperCase() + name.slice(1);
    return `Get listed on ${displayName} to gain up to ${weight} more points`;
  }

  if (currentSourceBonus >= 30) {
    return "All trust sources verified — focus on creating content that gets cited";
  }

  return null;
}
