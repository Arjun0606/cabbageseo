/**
 * Compare API — Side-by-side AI visibility comparison
 *
 * POST /api/geo/teaser/compare
 * Body: { domain1: "acme.com", domain2: "competitor.com" }
 *
 * Scans both domains in parallel and returns a dramatic comparison:
 * - Per-platform winners
 * - Score delta
 * - AI preference verdict
 * - Upgrade CTA (recommendations gated behind paid plan)
 *
 * Rate limit: counts as 2 scans against the 5/hour/IP limit.
 */

export const maxDuration = 120;

import { NextRequest, NextResponse } from "next/server";
import { lookup } from "dns/promises";
import { db, teaserReports } from "@/lib/db";
import {
  cleanDomainInput,
  isValidDomain,
  runFullScan,
  generateSummaryMessage,
} from "@/lib/geo/teaser-core";
import { consumeRateLimitSlots } from "../route";

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") ||
               request.headers.get("x-real-ip") ||
               "unknown";

    // Compare costs 2 rate limit slots
    if (!consumeRateLimitSlots(ip, 2)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Compare uses 2 of your 5 hourly scans. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { domain1, domain2 } = body;

    if (!domain1 || !domain2 || typeof domain1 !== "string" || typeof domain2 !== "string") {
      return NextResponse.json(
        { error: "Both domain1 and domain2 are required" },
        { status: 400 }
      );
    }

    const clean1 = cleanDomainInput(domain1);
    const clean2 = cleanDomainInput(domain2);

    if (!isValidDomain(clean1) || !isValidDomain(clean2)) {
      return NextResponse.json(
        { error: "Please enter valid domains (e.g., yourdomain.com)" },
        { status: 400 }
      );
    }

    if (clean1 === clean2) {
      return NextResponse.json(
        { error: "Please enter two different domains to compare" },
        { status: 400 }
      );
    }

    // Verify both domains exist
    try {
      await Promise.all([lookup(clean1), lookup(clean2)]);
    } catch {
      return NextResponse.json(
        { error: "One or both domains couldn't be found. Please check the URLs." },
        { status: 400 }
      );
    }

    // Scan both domains in parallel
    const [scan1, scan2] = await Promise.all([
      runFullScan(clean1),
      runFullScan(clean2),
    ]);

    const score1 = scan1.scoring.score;
    const score2 = scan2.scoring.score;

    // Determine per-platform winners
    const platforms: Array<"perplexity" | "gemini" | "chatgpt"> = ["perplexity", "gemini", "chatgpt"];
    const platformWinners: Record<string, string> = {};
    let d1PlatformWins = 0;
    let d2PlatformWins = 0;

    for (const platform of platforms) {
      const s1 = scan1.platformScores[platform] ?? 0;
      const s2 = scan2.platformScores[platform] ?? 0;
      if (s1 > s2) {
        platformWinners[platform] = clean1;
        d1PlatformWins++;
      } else if (s2 > s1) {
        platformWinners[platform] = clean2;
        d2PlatformWins++;
      } else {
        platformWinners[platform] = "tie";
      }
    }

    // Overall winner
    const winner = score1 > score2 ? clean1 : score2 > score1 ? clean2 : "tie";
    const scoreDelta = Math.abs(score1 - score2);

    // Generate dramatic verdict
    let verdict: string;
    if (winner === "tie") {
      verdict = "Dead heat — both domains have equal AI visibility. First to optimize wins.";
    } else {
      const loser = winner === clean1 ? clean2 : clean1;
      const winnerPlatformCount = winner === clean1 ? d1PlatformWins : d2PlatformWins;
      if (scoreDelta >= 40) {
        verdict = `AI overwhelmingly prefers ${winner} — ${scoreDelta} points ahead, winning on ${winnerPlatformCount}/3 platforms. ${loser} is nearly invisible in comparison.`;
      } else if (scoreDelta >= 20) {
        verdict = `${winner} has a strong lead — ${scoreDelta} points ahead. ${loser} needs significant work to catch up.`;
      } else {
        verdict = `Close match, but ${winner} edges ahead by ${scoreDelta} points. A few strategic fixes could flip this.`;
      }
    }

    // Save both reports to DB (non-fatal)
    let reportId1: string | null = null;
    let reportId2: string | null = null;
    try {
      const [ins1] = await db.insert(teaserReports).values({
        domain: clean1,
        visibilityScore: score1,
        isInvisible: scan1.results.filter(r => r.mentionedYou).length === 0,
        competitorsMentioned: [],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        results: scan1.results as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        summary: { visibilityScore: score1, platformScores: scan1.platformScores, businessSummary: scan1.businessSummary } as any,
      }).returning({ id: teaserReports.id });
      reportId1 = ins1.id;
    } catch { /* non-fatal */ }

    try {
      const [ins2] = await db.insert(teaserReports).values({
        domain: clean2,
        visibilityScore: score2,
        isInvisible: scan2.results.filter(r => r.mentionedYou).length === 0,
        competitorsMentioned: [],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        results: scan2.results as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        summary: { visibilityScore: score2, platformScores: scan2.platformScores, businessSummary: scan2.businessSummary } as any,
      }).returning({ id: teaserReports.id });
      reportId2 = ins2.id;
    } catch { /* non-fatal */ }

    // Determine which domain to upsell (the lower-scoring one)
    const upsellDomain = score1 <= score2 ? clean1 : clean2;
    const upsellScore = Math.min(score1, score2);

    return NextResponse.json({
      domain1: {
        domain: clean1,
        score: score1,
        platformScores: scan1.platformScores,
        businessSummary: scan1.businessSummary,
        message: generateSummaryMessage(score1),
        mentionedCount: scan1.results.filter(r => r.mentionedYou).length,
        citedCount: scan1.results.filter(r => r.inCitations).length,
        reportUrl: `https://cabbageseo.com/r/${clean1}`,
        reportId: reportId1,
      },
      domain2: {
        domain: clean2,
        score: score2,
        platformScores: scan2.platformScores,
        businessSummary: scan2.businessSummary,
        message: generateSummaryMessage(score2),
        mentionedCount: scan2.results.filter(r => r.mentionedYou).length,
        citedCount: scan2.results.filter(r => r.inCitations).length,
        reportUrl: `https://cabbageseo.com/r/${clean2}`,
        reportId: reportId2,
      },
      comparison: {
        winner,
        scoreDelta,
        platformWinners,
        verdict,
        // Gated: recommendations only for authenticated API users
        recommendations: null,
      },
      upgrade: {
        message: scoreDelta >= 20
          ? `${upsellDomain} is falling behind. CabbageSEO shows exactly what to fix to close the ${scoreDelta}-point gap.`
          : `It's close — CabbageSEO can give ${upsellDomain} the edge with targeted fix pages and gap analysis.`,
        gatedFeatures: [
          "Detailed recommendations to close the gap",
          "AI-generated fix pages for missing citations",
          "Weekly comparison tracking",
          "Alert when competitor scores change",
        ],
        url: `https://cabbageseo.com/signup?domain=${encodeURIComponent(upsellDomain)}&score=${upsellScore}`,
      },
    });
  } catch (error) {
    console.error("[Compare] Error:", error);
    return NextResponse.json(
      { error: "Failed to compare domains" },
      { status: 500 }
    );
  }
}
