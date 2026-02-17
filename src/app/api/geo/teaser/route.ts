/**
 * Teaser API - Quick AI visibility scan without authentication
 *
 * 1. Fetches the site to understand what the business does
 * 2. Uses AI to generate realistic customer queries (no hardcoded templates)
 * 3. Runs those queries through Perplexity, Google AI, and ChatGPT in parallel
 * 4. Scores visibility across 5 factors
 *
 * No signup required - this is the free scan that converts visitors.
 */

// Allow up to 120s for multi-platform AI scanning
export const maxDuration = 120;

import { NextRequest, NextResponse } from "next/server";
import { lookup } from "dns/promises";
import { db, teaserReports } from "@/lib/db";
import { generateTeaserPreview, type ContentPreviewData } from "@/lib/geo/teaser-preview-generator";
import { logRecommendations, extractTeaserRecommendations } from "@/lib/geo/recommendation-logger";
import {
  cleanDomainInput,
  isValidDomain,
  extractBrandName,
  runFullScan,
  generateSummaryMessage,
} from "@/lib/geo/teaser-core";

// Rate limiting: simple in-memory store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5; // requests per IP
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

/**
 * Consume N rate limit slots for a given IP (used by compare endpoint).
 */
export function consumeRateLimitSlots(ip: string, slots: number): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitStore.set(ip, { count: slots, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count + slots > RATE_LIMIT) {
    return false;
  }

  record.count += slots;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") ||
               request.headers.get("x-real-ip") ||
               "unknown";

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { domain } = body;

    if (!domain || typeof domain !== "string") {
      return NextResponse.json(
        { error: "Domain is required" },
        { status: 400 }
      );
    }

    const cleanDomain = cleanDomainInput(domain);

    if (!isValidDomain(cleanDomain)) {
      return NextResponse.json(
        { error: "Please enter a valid domain (e.g., yourdomain.com)" },
        { status: 400 }
      );
    }

    // Verify domain actually exists (DNS resolution)
    try {
      await lookup(cleanDomain);
    } catch {
      return NextResponse.json(
        { error: "We couldn't find this domain. Please check the URL and try again." },
        { status: 400 }
      );
    }

    const brandName = extractBrandName(cleanDomain);

    // Run the full AI scan pipeline
    const { results, scoring, platformScores, businessSummary, platformErrors } = await runFullScan(cleanDomain);

    const visibilityScore = scoring.score;
    const mentionedCount = results.filter(r => r.mentionedYou).length;
    const isInvisible = mentionedCount === 0;

    // Generate content preview if we have results
    let contentPreview: ContentPreviewData | null = null;
    try {
      contentPreview = await generateTeaserPreview(cleanDomain, [], brandName, businessSummary);
    } catch {
      // Non-fatal
    }

    const summary = {
      totalQueries: results.length,
      mentionedCount,
      isInvisible,
      visibilityScore,
      platformScores,
      scoreBreakdown: scoring.factors,
      scoreExplanation: scoring.explanation,
      businessSummary,
      message: generateSummaryMessage(visibilityScore),
      ...(platformErrors.length > 0 && {
        platformsChecked: results.length,
        platformErrors,
      }),
    };

    // Save to DB for shareable URL (non-fatal)
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
        summary: summary as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        contentPreview: contentPreview as any,
      }).returning({ id: teaserReports.id });
      reportId = inserted.id;
    } catch (err) {
      console.error("[Teaser] Failed to save report:", err);
    }

    // Log AI recommendations (non-blocking)
    const recEntries = extractTeaserRecommendations(cleanDomain, results);
    logRecommendations(recEntries).catch(() => {});

    // Upsell: push free scan users toward the full platform
    const upgrade = {
      message: visibilityScore < 40
        ? "Your brand is invisible to AI. CabbageSEO finds every gap and generates the pages to fix it."
        : visibilityScore < 60
          ? "AI knows you but doesn't cite you consistently. CabbageSEO shows exactly what's missing."
          : "You're visible — but AI answers shift weekly. CabbageSEO monitors daily so you never lose ground.",
      cta: "Start fixing your AI visibility",
      url: `https://cabbageseo.com/signup?domain=${encodeURIComponent(cleanDomain)}&score=${visibilityScore}`,
      dashboardUrl: `https://cabbageseo.com/dashboard`,
      pricingUrl: "https://cabbageseo.com/pricing",
      reportUrl: reportId ? `https://cabbageseo.com/report/${reportId}` : null,
      publicReportUrl: `https://cabbageseo.com/r/${cleanDomain}`,
      features: [
        "Daily automated scans across ChatGPT, Perplexity & Google AI",
        "AI-generated fix pages to close citation gaps",
        "Gap analysis showing exactly why AI ignores you",
        "Email alerts when your visibility drops",
      ],
      plans: {
        scout: { price: "$39/mo", label: "Scout — start fixing gaps" },
        command: { price: "$119/mo", label: "Command — full GEO intelligence" },
        dominate: { price: "$279/mo", label: "Dominate — maximum coverage" },
      },
    };

    return NextResponse.json({
      domain: cleanDomain,
      results,
      summary,
      reportId,
      contentPreview,
      upgrade,
    });
  } catch (error) {
    console.error("[Teaser] Error:", error);
    return NextResponse.json(
      { error: "Failed to check AI visibility" },
      { status: 500 }
    );
  }
}
