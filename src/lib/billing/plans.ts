/**
 * CabbageSEO Pricing Plans
 * 
 * Pricing Philosophy:
 * - Simple, predictable pricing
 * - Usage-based overages via spending caps (NOT prepaid credits)
 * - 85-95%+ margin on all operations
 * - 100% AI-powered (OpenAI only)
 * 
 * Third-Party Costs (per operation) - GPT-5-mini pricing (Jan 2026):
 * - AI Article (1500 words): ~$0.05 (GPT-5-mini + DALL-E image)
 * - 30 Keywords: ~$0.01 (AI keyword intelligence)
 * - GEO Analysis: ~$0.003 (AI content analysis)
 * - Audit (100 pages): ~$0.05 (crawl + AI analysis)
 * 
 * Margin Analysis (see bottom of file):
 * - Starter $24/mo: 94% margin
 * - Pro $66/mo: 95% margin
 * - Agency $166/mo: 96% margin
 */

// ============================================
// PLAN DEFINITIONS
// ============================================

export type PlanId = "starter" | "pro" | "pro_plus";
export type BillingInterval = "monthly" | "yearly";

export interface PlanLimits {
  sites: number;
  pagesPerSite: number;
  articlesPerMonth: number;
  keywordsTracked: number;
  auditsPerMonth: number;
  aioAnalysesPerMonth: number;
  teamMembers: number;
  aiCreditsPerMonth: number;  // ~1 credit = 1 Claude Haiku call
}

export interface PlanFeatures {
  internalLinking: boolean;
  contentScoring: boolean;
  autoSchema: boolean;
  scheduledPublishing: boolean;
  autopilotEligible: boolean;
  gscIntegration: boolean;
  webflowIntegration: boolean;
  wordpressIntegration: boolean;
  shopifyIntegration: boolean;
  apiAccess: boolean;
  priorityQueue: boolean;
  bulkOperations: boolean;
  whiteLabel: boolean;
  premiumAI: boolean;  // Claude Opus access
  customIntegrations: boolean;
  sla: boolean;
}

export interface Plan {
  id: PlanId;
  name: string;
  description: string;
  monthlyPrice: number;      // In dollars
  yearlyPrice: number;       // Per month when billed yearly
  limits: PlanLimits;
  features: PlanFeatures;
  featureList: string[];     // Marketing feature list
  popular?: boolean;
}

export const PLANS: Record<PlanId, Plan> = {
  starter: {
    id: "starter",
    name: "Starter",
    description: "Perfect for solopreneurs and small sites",
    monthlyPrice: 29,
    yearlyPrice: 24,  // 17% off (~$60 savings/year)
    limits: {
      sites: 3,                    // Up from 1
      pagesPerSite: 200,           // Up from 100
      articlesPerMonth: 50,        // Up from 10 (5x more!)
      keywordsTracked: 500,        // Up from 100 (5x more!)
      auditsPerMonth: 15,          // Up from 5 (3x more!)
      aioAnalysesPerMonth: 100,    // Up from 20 (5x more!)
      teamMembers: 1,
      aiCreditsPerMonth: 5000,     // Up from 1000
    },
    features: {
      internalLinking: true,       // Now included!
      contentScoring: true,        // Now included!
      autoSchema: true,            // Now included!
      scheduledPublishing: true,   // All paid plans!
      autopilotEligible: true,     // All paid plans!
      gscIntegration: true,        // Now included!
      webflowIntegration: true,
      wordpressIntegration: true,
      shopifyIntegration: true,    // Now included!
      apiAccess: false,
      priorityQueue: false,
      bulkOperations: false,
      whiteLabel: false,
      premiumAI: false,
      customIntegrations: false,
      sla: false,
    },
    featureList: [
      "3 websites",
      "50 AI articles/month + images",
      "500 keywords tracked",
      "15 SEO audits/month",
      "100 GEO visibility checks",
      "All CMS integrations",
      "AI-generated featured images",
      "Email support",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    description: "For growing businesses & agencies",
    monthlyPrice: 79,
    yearlyPrice: 66,  // 16% off (~$156 savings/year)
    popular: true,
    limits: {
      sites: 10,                   // Up from 5
      pagesPerSite: 1000,          // Up from 500
      articlesPerMonth: 150,       // Up from 50 (3x more!)
      keywordsTracked: 2000,       // Up from 500 (4x more!)
      auditsPerMonth: 50,          // Up from 20 (2.5x more!)
      aioAnalysesPerMonth: 300,    // Up from 100 (3x more!)
      teamMembers: 5,
      aiCreditsPerMonth: 15000,    // Up from 5000
    },
    features: {
      internalLinking: true,
      contentScoring: true,
      autoSchema: true,
      scheduledPublishing: true,
      autopilotEligible: true,
      gscIntegration: true,
      webflowIntegration: true,
      wordpressIntegration: true,
      shopifyIntegration: true,
      apiAccess: true,
      priorityQueue: true,         // Now included!
      bulkOperations: true,        // Now included!
      whiteLabel: false,
      premiumAI: false,
      customIntegrations: false,
      sla: false,
    },
    featureList: [
      "10 websites",
      "150 AI articles/month + images",
      "2,000 keywords tracked",
      "50 SEO audits/month",
      "300 GEO visibility checks",
      "Autopilot mode",
      "Priority queue",
      "Priority support",
    ],
  },
  pro_plus: {
    id: "pro_plus",
    name: "Pro+",
    description: "Unlimited power for agencies & enterprises",
    monthlyPrice: 199,
    yearlyPrice: 166,  // 17% off (~$396 savings/year)
    limits: {
      sites: 50,                   // Up from 20
      pagesPerSite: 5000,          // Up from 2000
      articlesPerMonth: 500,       // Up from 200 (2.5x more!)
      keywordsTracked: 10000,      // Up from 2000 (5x more!)
      auditsPerMonth: 200,         // Up from 100 (2x more!)
      aioAnalysesPerMonth: 1000,   // Up from 500 (2x more!)
      teamMembers: 20,
      aiCreditsPerMonth: 50000,    // Up from 20000
    },
    features: {
      internalLinking: true,
      contentScoring: true,
      autoSchema: true,
      scheduledPublishing: true,
      autopilotEligible: true,
      gscIntegration: true,
      webflowIntegration: true,
      wordpressIntegration: true,
      shopifyIntegration: true,
      apiAccess: true,
      priorityQueue: true,
      bulkOperations: true,
      whiteLabel: true,            // Now included!
      premiumAI: true,
      customIntegrations: true,    // Now included!
      sla: true,                   // Now included!
    },
    featureList: [
      "50 websites",
      "500 AI articles/month + images",
      "10,000 keywords tracked",
      "200 SEO audits/month",
      "1,000 GEO visibility checks",
      "White-label reports",
      "API access",
      "Dedicated support + SLA",
    ],
  },
};

// ============================================
// INTERNAL COSTS (in cents) - Our actual costs
// GPT-5-mini pricing (Jan 2026)
// ============================================

export const INTERNAL_COSTS = {
  // AI Costs (GPT-5-mini: $0.25/$2.00 per MTok)
  aiCreditMini: 0.002,      // $0.00002 per 1K tokens (GPT-5-mini)
  aiCreditPremium: 0.015,   // $0.00015 per 1K tokens (GPT-5)
  article: 5,               // $0.05 per article (2K in, 2.5K out)
  articleWithImage: 9,      // $0.09 per article + DALL-E image
  aiImage: 4,               // $0.04 per DALL-E image
  geoAnalysis: 0.3,         // $0.003 per GEO analysis
  
  // Keyword Intelligence (100% AI-powered)
  keywordResearch: 1,       // $0.01 per research (30 keywords)
  keywordBatch100: 3,       // $0.03 per 100 keywords (AI)
  competitorAnalysis: 1,    // $0.01 per competitor
  
  // Crawling
  pageCrawl: 0.01,          // $0.0001 per page (mostly bandwidth)
  auditFull: 5,             // $0.05 per full audit (100 pages + AI analysis)
};

// ============================================
// OVERAGE PRICING (90-98% margin target)
// All AI-powered with GPT-5-mini
// ============================================

export const OVERAGE_PRICES = {
  articles: {
    name: "Extra Articles",
    unit: "article",
    pricePerUnit: 300,      // $3.00 per article
    costPerUnit: 9,         // $0.09 cost (article + image)
    margin: 0.97,           // 97% margin
  },
  keywords: {
    name: "Extra Keywords",
    unit: "100 keywords",
    pricePerUnit: 500,      // $5.00 per 100 keywords
    costPerUnit: 3,         // $0.03 cost (AI-powered)
    margin: 0.99,           // 99% margin
  },
  audits: {
    name: "Extra Audits",
    unit: "audit",
    pricePerUnit: 100,      // $1.00 per audit
    costPerUnit: 5,         // $0.05 cost
    margin: 0.95,           // 95% margin
  },
  aioAnalyses: {
    name: "GEO Analyses",
    unit: "analysis",
    pricePerUnit: 50,       // $0.50 per analysis
    costPerUnit: 0.3,       // $0.003 cost
    margin: 0.99,           // 99% margin
  },
  aiCredits: {
    name: "AI Credits",
    unit: "1,000 credits",
    pricePerUnit: 200,      // $2.00 per 1,000 credits
    costPerUnit: 2,         // $0.02 cost
    margin: 0.99,           // 99% margin
  },
};

// ============================================
// SPENDING CAP PRESETS
// ============================================
// Note: Prepaid credits are NOT part of the pricing model.
// We use pay-as-you-go overages with spending caps instead.

export const SPENDING_CAP_PRESETS = [
  { value: 1000, label: "$10", description: "Just testing overages" },
  { value: 5000, label: "$50", description: "Light overflow" },
  { value: 10000, label: "$100", description: "Standard buffer" },
  { value: 25000, label: "$250", description: "Heavy usage month" },
  { value: 50000, label: "$500", description: "Agency client work" },
];

// ============================================
// RATE LIMITS BY PLAN
// ============================================

export const RATE_LIMITS = {
  starter: {
    requestsPerMinute: 10,
    tokensPerMinute: 50000,
    concurrentRequests: 2,
  },
  pro: {
    requestsPerMinute: 30,
    tokensPerMinute: 200000,
    concurrentRequests: 5,
  },
  pro_plus: {
    requestsPerMinute: 60,
    tokensPerMinute: 500000,
    concurrentRequests: 10,
  },
};

// ============================================
// DODO PRODUCT IDS (set in env)
// ============================================

export const DODO_PRODUCTS = {
  starter: {
    monthly: process.env.DODO_STARTER_MONTHLY_ID || "prod_starter_monthly",
    yearly: process.env.DODO_STARTER_YEARLY_ID || "prod_starter_yearly",
  },
  pro: {
    monthly: process.env.DODO_PRO_MONTHLY_ID || "prod_pro_monthly",
    yearly: process.env.DODO_PRO_YEARLY_ID || "prod_pro_yearly",
  },
  pro_plus: {
    monthly: process.env.DODO_PRO_PLUS_MONTHLY_ID || "prod_pro_plus_monthly",
    yearly: process.env.DODO_PRO_PLUS_YEARLY_ID || "prod_pro_plus_yearly",
  },
};

// Usage meters for Dodo usage-based billing
export const DODO_METERS = {
  overageSpend: process.env.DODO_METER_OVERAGE || "meter_overage_spend",
};

// ============================================
// HELPERS
// ============================================

export function getPlan(planId: PlanId | string): Plan {
  return PLANS[planId as PlanId] || PLANS.starter;
}

export function getPlans(): Plan[] {
  return Object.values(PLANS);
}

export function getPlanLimits(planId: PlanId | string): PlanLimits {
  return getPlan(planId).limits;
}

export function getPlanFeatures(planId: PlanId | string): PlanFeatures {
  return getPlan(planId).features;
}

export function getProductId(planId: PlanId, interval: BillingInterval): string {
  return DODO_PRODUCTS[planId]?.[interval] || DODO_PRODUCTS.starter.monthly;
}

export function getPlanFromProductId(productId: string): PlanId {
  for (const [planId, products] of Object.entries(DODO_PRODUCTS)) {
    if (products.monthly === productId || products.yearly === productId) {
      return planId as PlanId;
    }
  }
  return "starter";
}

export function formatPrice(dollars: number): string {
  return `$${dollars}`;
}

export function formatPriceCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function calculateYearlySavings(plan: Plan): number {
  const monthlyCost = plan.monthlyPrice * 12;
  const yearlyCost = plan.yearlyPrice * 12;
  return monthlyCost - yearlyCost;
}

export function calculateYearlySavingsPercent(plan: Plan): number {
  return Math.round((1 - plan.yearlyPrice / plan.monthlyPrice) * 100);
}

export function isWithinLimit(
  planId: PlanId | string,
  resource: keyof PlanLimits,
  currentUsage: number
): boolean {
  const limits = getPlanLimits(planId);
  return currentUsage < limits[resource];
}

export function getOverageAmount(
  planId: PlanId | string,
  resource: keyof PlanLimits,
  currentUsage: number
): number {
  const limits = getPlanLimits(planId);
  return Math.max(0, currentUsage - limits[resource]);
}

export function calculateOverageCost(
  resource: keyof typeof OVERAGE_PRICES,
  amount: number
): number {
  const pricing = OVERAGE_PRICES[resource];
  if (!pricing) return 0;
  
  // Calculate units based on resource type
  let units = amount;
  if (resource === "keywords") {
    units = Math.ceil(amount / 100);
  } else if (resource === "aiCredits") {
    units = Math.ceil(amount / 1000);
  }
  
  return units * pricing.pricePerUnit;
}

export function getInternalCost(
  resource: keyof typeof OVERAGE_PRICES,
  amount: number
): number {
  const pricing = OVERAGE_PRICES[resource];
  if (!pricing) return 0;
  
  let units = amount;
  if (resource === "keywords") {
    units = Math.ceil(amount / 100);
  } else if (resource === "aiCredits") {
    units = Math.ceil(amount / 1000);
  }
  
  return units * pricing.costPerUnit;
}

export function getMargin(
  resource: keyof typeof OVERAGE_PRICES,
  amount: number
): number {
  const revenue = calculateOverageCost(resource, amount);
  const cost = getInternalCost(resource, amount);
  
  if (revenue === 0) return 0;
  return (revenue - cost) / revenue;
}

// ============================================
// USAGE ENFORCEMENT
// ============================================

export interface UsageCheckResult {
  allowed: boolean;
  reason?: string;
  overageRequired?: number;
  overageResource?: keyof typeof OVERAGE_PRICES;
  overageCostCents?: number;
}

export function checkUsage(
  planId: PlanId | string,
  resource: keyof PlanLimits,
  currentUsage: number,
  requestedAmount: number = 1
): UsageCheckResult {
  const limits = getPlanLimits(planId);
  const limit = limits[resource];
  const projectedUsage = currentUsage + requestedAmount;
  
  if (projectedUsage <= limit) {
    return { allowed: true };
  }
  
  const overage = projectedUsage - limit;
  
  // Map plan resources to overage resources
  const overageMap: Partial<Record<keyof PlanLimits, keyof typeof OVERAGE_PRICES>> = {
    articlesPerMonth: "articles",
    keywordsTracked: "keywords",
    auditsPerMonth: "audits",
    aioAnalysesPerMonth: "aioAnalyses",
    aiCreditsPerMonth: "aiCredits",
  };
  
  const overageResource = overageMap[resource];
  
  if (!overageResource) {
    return {
      allowed: false,
      reason: `${resource} limit reached. Upgrade your plan for more.`,
    };
  }
  
  const overageCostCents = calculateOverageCost(overageResource, overage);
  
  return {
    allowed: false,
    reason: `${resource} limit reached. You can continue with overage billing.`,
    overageRequired: overage,
    overageResource,
    overageCostCents,
  };
}

// ============================================
// PLAN COMPARISON
// ============================================

export function canUpgrade(currentPlan: PlanId, targetPlan: PlanId): boolean {
  const order: PlanId[] = ["starter", "pro", "pro_plus"];
  return order.indexOf(targetPlan) > order.indexOf(currentPlan);
}

export function canDowngrade(currentPlan: PlanId, targetPlan: PlanId): boolean {
  const order: PlanId[] = ["starter", "pro", "pro_plus"];
  return order.indexOf(targetPlan) < order.indexOf(currentPlan);
}

export function getPlanUpgrades(currentPlan: PlanId): Plan[] {
  const plans = getPlans();
  const order: PlanId[] = ["starter", "pro", "pro_plus"];
  const currentIndex = order.indexOf(currentPlan);
  return plans.filter((_, i) => i > currentIndex);
}

// ============================================
// MARGIN ANALYSIS (Jan 2026 - GPT-5-mini)
// ============================================
//
// STARTER ($24/mo yearly, $29/mo monthly)
// Limits: 50 articles, 500 keywords, 100 GEO checks, 15 audits
// 
// Max usage cost breakdown:
// - 50 articles × $0.09 = $4.50
// - 500 keywords × $0.0003 = $0.15
// - 100 GEO analyses × $0.003 = $0.30
// - 15 audits × $0.05 = $0.75
// TOTAL MAX COST: ~$5.70/month
// 
// Revenue: $24/month (yearly) 
// Margin: $24 - $5.70 = $18.30 → 76% margin (if maxed out)
// Typical usage (30%): ~$1.71 cost → 93% margin
//
// ---
// 
// PRO ($66/mo yearly, $79/mo monthly)
// Limits: 150 articles, 2000 keywords, 300 GEO checks, 50 audits
//
// Max usage cost breakdown:
// - 150 articles × $0.09 = $13.50
// - 2000 keywords × $0.0003 = $0.60
// - 300 GEO analyses × $0.003 = $0.90
// - 50 audits × $0.05 = $2.50
// TOTAL MAX COST: ~$17.50/month
//
// Revenue: $66/month (yearly)
// Margin: $66 - $17.50 = $48.50 → 73% margin (if maxed out)
// Typical usage (40%): ~$7.00 cost → 89% margin
//
// ---
//
// AGENCY ($166/mo yearly, $199/mo monthly)
// Limits: 500 articles, 10000 keywords, 1000 GEO checks, 200 audits
//
// Max usage cost breakdown:
// - 500 articles × $0.09 = $45.00
// - 10000 keywords × $0.0003 = $3.00
// - 1000 GEO analyses × $0.003 = $3.00
// - 200 audits × $0.05 = $10.00
// TOTAL MAX COST: ~$61.00/month
//
// Revenue: $166/month (yearly)
// Margin: $166 - $61.00 = $105.00 → 63% margin (if maxed out)
// Typical usage (25%): ~$15.25 cost → 91% margin
//
// ---
//
// SUMMARY (typical usage):
// | Plan    | Revenue | Est. Cost | Margin |
// |---------|---------|-----------|--------|
// | Starter | $24     | ~$1.71    | 93%    |
// | Pro     | $66     | ~$7.00    | 89%    |
// | Agency  | $166    | ~$15.25   | 91%    |
//
// Key insight: 100% AI-powered approach makes unit economics
// significantly better than traditional SEO tools.
// ============================================
