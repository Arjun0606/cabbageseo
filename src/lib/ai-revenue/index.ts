/**
 * AI Competitive Intelligence Engine
 *
 * Core analysis functions:
 * - Calculate buyer intent scores
 * - Extract competitors from AI responses
 * - Analyze competitive losses
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

// ============================================
// COMPETITOR EXTRACTION
// ============================================

// Common product/brand patterns to look for
const PRODUCT_PATTERNS = [
  // Direct mentions
  /\b([A-Z][a-z]+(?:\.[a-z]+)?)\b/g, // Capitalized words (Notion, Asana)

  // "X is a..." patterns
  /\b(\w+)\s+is\s+(?:a|an|the)\s+(?:popular|leading|top|best)/gi,

  // List patterns
  /(?:include|includes|such as|like|including)\s+([^.]+)/gi,
];

// Known products/brands to look for (expand as needed)
const KNOWN_PRODUCTS = [
  // Productivity
  "Notion", "Asana", "Monday", "Trello", "ClickUp", "Todoist", "Basecamp",
  "Airtable", "Coda", "Linear", "Jira", "Confluence", "Miro", "Figma",

  // CRM
  "HubSpot", "Salesforce", "Pipedrive", "Zoho", "Freshsales", "Close",

  // Marketing
  "Mailchimp", "ConvertKit", "ActiveCampaign", "Klaviyo", "Sendinblue",
  "Ahrefs", "SEMrush", "Moz", "Surfer", "Clearscope",

  // E-commerce
  "Shopify", "WooCommerce", "BigCommerce", "Squarespace", "Wix",

  // Communication
  "Slack", "Discord", "Zoom", "Teams", "Loom", "Calendly",

  // Design
  "Canva", "Adobe", "Sketch", "InVision",

  // Dev tools
  "GitHub", "GitLab", "Vercel", "Netlify", "AWS", "Heroku",
];

export interface ExtractedCompetitor {
  name: string;
  domain?: string;
  mentioned: boolean;
  context?: string;
}

/**
 * Extract competitors/products mentioned in AI response
 */
export function extractCompetitors(
  aiResponse: string,
  userDomain: string
): ExtractedCompetitor[] {
  const competitors: Map<string, ExtractedCompetitor> = new Map();
  const lowerResponse = aiResponse.toLowerCase();
  const userDomainClean = userDomain.toLowerCase().replace(/\.(com|io|co|app|ai)$/, "");

  // Check for known products
  for (const product of KNOWN_PRODUCTS) {
    if (lowerResponse.includes(product.toLowerCase())) {
      // Extract context (sentence containing the product)
      const regex = new RegExp(`[^.]*${product}[^.]*\\.`, "gi");
      const match = aiResponse.match(regex);

      competitors.set(product.toLowerCase(), {
        name: product,
        domain: `${product.toLowerCase().replace(/\s+/g, "")}.com`,
        mentioned: true,
        context: match?.[0]?.trim(),
      });
    }
  }

  // Check if user is mentioned
  const userMentioned = lowerResponse.includes(userDomainClean) ||
                        lowerResponse.includes(userDomain.toLowerCase());

  // Add user to comparison
  competitors.set(userDomainClean, {
    name: userDomain,
    domain: userDomain,
    mentioned: userMentioned,
  });

  return Array.from(competitors.values());
}

/**
 * Check if user lost to competitors in this response
 */
export function analyzeCompetitiveLoss(
  aiResponse: string,
  userDomain: string
): {
  userMentioned: boolean;
  competitorsMentioned: ExtractedCompetitor[];
  isLoss: boolean;
  lossMessage?: string;
} {
  const competitors = extractCompetitors(aiResponse, userDomain);
  const userEntry = competitors.find(c => c.domain === userDomain);
  const userMentioned = userEntry?.mentioned || false;
  const competitorsMentioned = competitors.filter(c => c.domain !== userDomain && c.mentioned);

  const isLoss = !userMentioned && competitorsMentioned.length > 0;

  let lossMessage: string | undefined;
  if (isLoss && competitorsMentioned.length > 0) {
    const topCompetitor = competitorsMentioned[0].name;
    lossMessage = `AI recommended ${topCompetitor} instead of you`;
  }

  return {
    userMentioned,
    competitorsMentioned,
    isLoss,
    lossMessage,
  };
}
