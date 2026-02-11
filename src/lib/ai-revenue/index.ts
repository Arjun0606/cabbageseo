/**
 * AI Intelligence Engine
 *
 * Core analysis functions:
 * - Calculate buyer intent scores
 */

// ============================================
// BUYER INTENT SCORING
// ============================================

const INTENT_KEYWORDS: Record<string, number> = {
  // High buyer intent (1.0 = ready to buy)
  "best": 1.0,
  "top": 1.0,
  "alternatives": 1.0,
  "alternative to": 1.0,
  "vs": 0.9,
  "versus": 0.9,
  "compared to": 0.9,
  "comparison": 0.9,
  "pricing": 0.9,
  "cost": 0.9,
  "price": 0.9,
  "reviews": 0.8,
  "review": 0.8,
  "for startups": 0.85,
  "for small business": 0.85,
  "for teams": 0.8,
  "free": 0.7,
  "cheap": 0.7,
  "affordable": 0.7,

  // Medium intent
  "how to use": 0.4,
  "tutorial": 0.3,
  "guide": 0.3,

  // Low intent (informational)
  "what is": 0.2,
  "who is": 0.2,
  "definition": 0.1,
};

/**
 * Calculate buyer intent score for a query
 * Returns 0.0 - 1.0
 */
export function calculateBuyerIntent(query: string): number {
  const lowerQuery = query.toLowerCase();

  let maxScore = 0.5; // Default medium intent

  for (const [keyword, score] of Object.entries(INTENT_KEYWORDS)) {
    if (lowerQuery.includes(keyword)) {
      maxScore = Math.max(maxScore, score);
    }
  }

  return maxScore;
}

