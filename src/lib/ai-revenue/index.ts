/**
 * AI Revenue Intelligence Engine
 * 
 * This is the core of CabbageSEO's value proposition:
 * - Calculate buyer intent scores
 * - Extract competitors from AI responses
 * - Estimate revenue loss
 * - Track AI market share
 * 
 * NO FAKE DATA. All values derived from:
 * - Query intent analysis
 * - Competitor frequency
 * - Category weighting
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

// Category base values (monthly traffic value estimate)
const CATEGORY_BASE_VALUES: Record<string, number> = {
  // High value B2B SaaS
  productivity: 15000,
  crm: 20000,
  marketing: 18000,
  analytics: 16000,
  development: 14000,
  
  // Medium value
  design: 12000,
  communication: 13000,
  finance: 15000,
  
  // Lower value but still significant
  ecommerce: 10000,
  education: 8000,
  
  // Default
  default: 10000,
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

/**
 * Get category base value
 */
export function getCategoryBaseValue(category: string | null): number {
  if (!category) return CATEGORY_BASE_VALUES.default;
  return CATEGORY_BASE_VALUES[category.toLowerCase()] || CATEGORY_BASE_VALUES.default;
}

/**
 * Calculate estimated monthly traffic value for a query
 * 
 * Formula: base_value × intent_score × recommendation_multiplier
 */
export function calculateQueryValue(
  query: string,
  category: string | null,
  competitorCount: number = 3
): number {
  const intentScore = calculateBuyerIntent(query);
  const baseValue = getCategoryBaseValue(category);
  
  // More competitors = more valuable query (competitive market)
  const competitorMultiplier = Math.min(1 + (competitorCount * 0.1), 2.0);
  
  // Calculate estimated value
  const value = Math.round(baseValue * intentScore * competitorMultiplier);
  
  // Round to nice numbers
  return Math.round(value / 100) * 100;
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

// ============================================
// AI MARKET SHARE
// ============================================

export interface AIMarketShare {
  yourShare: number; // 0-100 percentage
  totalQueries: number;
  queriesWon: number;
  queriesLost: number;
  topCompetitors: { name: string; share: number }[];
  estimatedMonthlyLoss: number;
}

/**
 * Calculate AI market share from check results
 */
export function calculateAIMarketShare(
  results: Array<{
    query: string;
    userMentioned: boolean;
    competitorsMentioned: string[];
    category: string | null;
  }>
): AIMarketShare {
  const totalQueries = results.length;
  const queriesWon = results.filter(r => r.userMentioned).length;
  const queriesLost = totalQueries - queriesWon;
  
  // Calculate share
  const yourShare = totalQueries > 0 ? Math.round((queriesWon / totalQueries) * 100) : 0;
  
  // Count competitor mentions
  const competitorCounts: Map<string, number> = new Map();
  for (const result of results) {
    for (const comp of result.competitorsMentioned) {
      competitorCounts.set(comp, (competitorCounts.get(comp) || 0) + 1);
    }
  }
  
  // Sort competitors by frequency
  const topCompetitors = Array.from(competitorCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({
      name,
      share: Math.round((count / totalQueries) * 100),
    }));
  
  // Calculate estimated monthly loss
  let estimatedMonthlyLoss = 0;
  for (const result of results) {
    if (!result.userMentioned) {
      estimatedMonthlyLoss += calculateQueryValue(
        result.query,
        result.category,
        result.competitorsMentioned.length
      );
    }
  }
  
  return {
    yourShare,
    totalQueries,
    queriesWon,
    queriesLost,
    topCompetitors,
    estimatedMonthlyLoss,
  };
}

// ============================================
// ONE-CLICK FIX GENERATOR
// ============================================

export interface ContentFix {
  pageTitle: string;
  targetQuery: string;
  sections: {
    heading: string;
    description: string;
    entities: string[];
  }[];
  comparisons: string[];
  faqs: string[];
  estimatedImpact: number;
}

/**
 * Generate a content fix for a lost query
 * This creates the outline, actual content generation uses LLM
 */
export function generateContentFixOutline(
  query: string,
  competitors: string[],
  category: string | null
): ContentFix {
  const cleanQuery = query.replace(/[?'"]/g, "");
  const primaryKeyword = cleanQuery.split(" ").slice(0, 3).join(" ");
  
  // Generate page title
  const pageTitle = query.toLowerCase().includes("best")
    ? `Best ${category || "Tools"} in 2025: Complete Guide`
    : query.toLowerCase().includes("alternative")
    ? `Top ${competitors[0] || "Competitor"} Alternatives: Honest Comparison`
    : `${primaryKeyword}: Everything You Need to Know`;
  
  // Generate sections
  const sections = [
    {
      heading: "Quick Answer",
      description: "Direct answer to the query with your product featured",
      entities: ["product name", "key differentiator", "use case"],
    },
    {
      heading: "Detailed Comparison",
      description: "Feature-by-feature comparison with competitors",
      entities: competitors.slice(0, 3),
    },
    {
      heading: "Pricing Breakdown",
      description: "Transparent pricing comparison",
      entities: ["free tier", "paid plans", "enterprise"],
    },
    {
      heading: "Real User Reviews",
      description: "Testimonials and case studies",
      entities: ["customer quote", "results achieved", "company name"],
    },
  ];
  
  // Generate comparison blocks
  const comparisons = competitors.slice(0, 3).map(comp => 
    `${comp} vs Your Product: Key Differences`
  );
  
  // Generate FAQs
  const faqs = [
    `What is the best ${category || "tool"} for startups?`,
    `How does [Your Product] compare to ${competitors[0] || "competitors"}?`,
    `Is [Your Product] worth it in 2025?`,
    `What are the pros and cons of [Your Product]?`,
  ];
  
  return {
    pageTitle,
    targetQuery: query,
    sections,
    comparisons,
    faqs,
    estimatedImpact: calculateQueryValue(query, category, competitors.length),
  };
}

// ============================================
// TERMINOLOGY HELPERS
// ============================================

/**
 * Format money value for display
 */
export function formatMoneyLoss(value: number): string {
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}k`;
  }
  return `$${value}`;
}

/**
 * Format percentage for display
 */
export function formatShare(share: number): string {
  return `${share}%`;
}

/**
 * Get severity level based on loss
 */
export function getLossSeverity(loss: number): "critical" | "warning" | "info" {
  if (loss >= 10000) return "critical";
  if (loss >= 5000) return "warning";
  return "info";
}

