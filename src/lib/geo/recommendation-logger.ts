/**
 * AI Recommendation Logger — Data Moat Engine
 *
 * Logs every AI recommendation observed across all scan types
 * (teaser, citation check, bulk scan) into the ai_recommendations table.
 *
 * This is the proprietary dataset that compounds over time.
 * Every scan makes the moat deeper.
 */

import { db, aiRecommendations } from "@/lib/db";

export interface RecommendationEntry {
  query: string;
  scannedDomain: string;
  recommendedDomain: string;
  platform: string;
  position?: number;
  snippet?: string;
  confidence?: string;
  source: "teaser" | "citation_check" | "bulk_scan";
  siteId?: string;
}

/**
 * Log a batch of AI recommendations to the database.
 * Non-fatal — failures are logged but never block the caller.
 */
export async function logRecommendations(entries: RecommendationEntry[]): Promise<void> {
  if (entries.length === 0) return;

  try {
    await db.insert(aiRecommendations).values(
      entries.map((e) => ({
        query: e.query,
        scannedDomain: e.scannedDomain,
        recommendedDomain: e.recommendedDomain,
        platform: e.platform,
        position: e.position ?? null,
        snippet: e.snippet?.slice(0, 500) ?? null,
        confidence: e.confidence ?? "medium",
        source: e.source,
        siteId: e.siteId ?? null,
      }))
    );
  } catch (err) {
    console.error("[DataMoat] Failed to log recommendations:", err);
  }
}

/**
 * Extract recommendation entries from teaser scan results.
 * Call this after Perplexity/Gemini queries complete.
 */
export function extractTeaserRecommendations(
  scannedDomain: string,
  results: Array<{
    query: string;
    platform: string;
    aiRecommends: string[];
    mentionedYou: boolean;
    snippet: string;
  }>
): RecommendationEntry[] {
  const entries: RecommendationEntry[] = [];

  for (const result of results) {
    // Log each recommended domain
    for (let i = 0; i < result.aiRecommends.length; i++) {
      entries.push({
        query: result.query,
        scannedDomain,
        recommendedDomain: result.aiRecommends[i],
        platform: result.platform,
        position: i + 1,
        snippet: result.snippet,
        confidence: "medium",
        source: "teaser",
      });
    }

    // Also log if the scanned domain itself was mentioned
    if (result.mentionedYou) {
      entries.push({
        query: result.query,
        scannedDomain,
        recommendedDomain: scannedDomain,
        platform: result.platform,
        position: 0, // self-mention
        snippet: result.snippet,
        confidence: "medium",
        source: "teaser",
      });
    }
  }

  return entries;
}

/**
 * Extract recommendation entries from citation check results.
 * Call this after Perplexity/Gemini/ChatGPT checks complete.
 */
export function extractCitationRecommendations(
  scannedDomain: string,
  siteId: string | undefined,
  results: Array<{
    platform: string;
    cited: boolean;
    query: string;
    snippet?: string;
    confidence?: number;
    apiCalled?: boolean;
  }>
): RecommendationEntry[] {
  const entries: RecommendationEntry[] = [];

  for (const result of results) {
    if (!result.apiCalled) continue;

    if (result.cited) {
      entries.push({
        query: result.query,
        scannedDomain,
        recommendedDomain: scannedDomain,
        platform: result.platform,
        position: 0,
        snippet: result.snippet,
        confidence: result.confidence !== undefined
          ? (result.confidence >= 0.8 ? "high" : result.confidence >= 0.5 ? "medium" : "low")
          : "medium",
        source: "citation_check",
        siteId,
      });
    }
  }

  return entries;
}
