/**
 * Authenticated Scan API
 *
 * POST /api/v1/scan — Full AI visibility scan with API key authentication
 *
 * Same as /api/geo/teaser but:
 * - Requires API key (Authorization: Bearer cbs_...)
 * - Higher rate limits (50-500/hour depending on plan)
 * - Richer response data for paid plans
 */

export const maxDuration = 120;

import { NextRequest, NextResponse } from "next/server";
import { lookup } from "dns/promises";
import { db, teaserReports } from "@/lib/db";
import { validateApiKey, hasScope } from "@/lib/api/validate-api-key";
import { createRateLimiter } from "@/lib/api/rate-limit";
import {
  cleanDomainInput,
  isValidDomain,
  extractBrandName,
  runFullScan,
  generateSummaryMessage,
} from "@/lib/geo/teaser-core";

const apiKeyLimiter = createRateLimiter({
  windowMs: 3_600_000, // 1 hour
  max: 500, // checked against key's hourlyLimit below
});

export async function POST(request: NextRequest) {
  try {
    const apiUser = await validateApiKey(request);
    if (!apiUser) {
      return NextResponse.json(
        { error: "Invalid or missing API key. Get one at https://cabbageseo.com/dashboard/integrations" },
        { status: 401 }
      );
    }

    if (!hasScope(apiUser, "scan")) {
      return NextResponse.json({ error: "API key does not have 'scan' scope" }, { status: 403 });
    }

    // Rate limit per API key
    const rateResult = await apiKeyLimiter.check(apiUser.apiKeyId);
    if (!rateResult.allowed || rateResult.remaining < (500 - apiUser.hourlyLimit)) {
      return NextResponse.json(
        { error: `Rate limit exceeded. Your plan allows ${apiUser.hourlyLimit} scans/hour.` },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { domain } = body;

    if (!domain || typeof domain !== "string") {
      return NextResponse.json({ error: "Domain is required" }, { status: 400 });
    }

    const cleanDomain = cleanDomainInput(domain);
    if (!isValidDomain(cleanDomain)) {
      return NextResponse.json({ error: "Invalid domain format" }, { status: 400 });
    }

    try {
      await lookup(cleanDomain);
    } catch {
      return NextResponse.json({ error: "Domain not found" }, { status: 400 });
    }

    const { results, scoring, platformScores, businessSummary, platformErrors } = await runFullScan(cleanDomain);

    const visibilityScore = scoring.score;
    const mentionedCount = results.filter(r => r.mentionedYou).length;
    const isInvisible = mentionedCount === 0;

    // Save to DB
    let reportId: string | null = null;
    try {
      const [inserted] = await db.insert(teaserReports).values({
        domain: cleanDomain,
        visibilityScore,
        isInvisible,
        competitorsMentioned: [],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        results: results as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        summary: { visibilityScore, platformScores, businessSummary, message: generateSummaryMessage(visibilityScore) } as any,
      }).returning({ id: teaserReports.id });
      reportId = inserted.id;
    } catch { /* non-fatal */ }

    return NextResponse.json({
      domain: cleanDomain,
      score: visibilityScore,
      isInvisible,
      platformScores,
      scoreBreakdown: scoring.factors,
      businessSummary,
      message: generateSummaryMessage(visibilityScore),
      mentionedCount,
      citedCount: results.filter(r => r.inCitations).length,
      results,
      reportId,
      reportUrl: `https://cabbageseo.com/r/${cleanDomain}`,
      ...(platformErrors.length > 0 && { platformErrors }),
    });
  } catch (error) {
    console.error("[v1/scan] Error:", error);
    return NextResponse.json({ error: "Scan failed" }, { status: 500 });
  }
}
