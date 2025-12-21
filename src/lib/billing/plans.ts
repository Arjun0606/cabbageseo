/**
 * CabbageSEO Pricing Plans
 * 
 * Pricing Philosophy:
 * - Simple, predictable pricing
 * - Usage-based overages via spending caps (NOT prepaid credits)
 * - 85-90%+ margin on all overages
 * - Hard limits prevent runaway costs
 * 
 * Third-Party Costs (per operation):
 * - AI Article: ~$0.20 (Claude Sonnet)
 * - 100 Keywords: ~$0.15 (DataForSEO)
 * - SERP Analysis: ~$0.02 (DataForSEO)
 * - Audit (100 pages): ~$0.10 (crawl + Claude)
 * - AIO Analysis: ~$0.08 (Claude Haiku)
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
    description: "Perfect for small sites and bloggers getting started with SEO",
    monthlyPrice: 29,
    yearlyPrice: 24,  // 17% off (~$60 savings/year)
    limits: {
      sites: 1,
      pagesPerSite: 100,
      articlesPerMonth: 10,
      keywordsTracked: 100,
      auditsPerMonth: 5,
      aioAnalysesPerMonth: 20,
      teamMembers: 1,
      aiCreditsPerMonth: 1000,
    },
    features: {
      internalLinking: false,
      contentScoring: false,
      autoSchema: false,
      scheduledPublishing: false,
      autopilotEligible: false,
      gscIntegration: false,
      webflowIntegration: true,
      wordpressIntegration: true,
      shopifyIntegration: false,
      apiAccess: false,
      priorityQueue: false,
      bulkOperations: false,
      whiteLabel: true,  // Available on all plans
      premiumAI: false,
      customIntegrations: false,
      sla: false,
    },
    featureList: [
      "1 website",
      "10 AI articles/month",
      "100 keywords tracked",
      "5 technical audits/month",
      "20 AIO analyses/month",
      "Content optimization",
      "WordPress/Webflow publishing",
      "Email support",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    description: "For growing businesses and consultants serious about organic traffic",
    monthlyPrice: 79,
    yearlyPrice: 66,  // 16% off (~$156 savings/year)
    popular: true,
    limits: {
      sites: 5,
      pagesPerSite: 500,
      articlesPerMonth: 50,
      keywordsTracked: 500,
      auditsPerMonth: 20,
      aioAnalysesPerMonth: 100,
      teamMembers: 5,
      aiCreditsPerMonth: 5000,
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
      priorityQueue: false,
      bulkOperations: false,
      whiteLabel: true,  // Available on all plans
      premiumAI: false,
      customIntegrations: false,
      sla: false,
    },
    featureList: [
      "5 websites",
      "50 AI articles/month",
      "500 keywords tracked",
      "20 technical audits/month",
      "100 AIO analyses/month",
      "Advanced content optimization",
      "All CMS integrations",
      "Team collaboration (5 seats)",
      "Google Search Console integration",
      "Priority support",
      "API access",
    ],
  },
  pro_plus: {
    id: "pro_plus",
    name: "Pro+",
    description: "For agencies and large sites needing maximum output",
    monthlyPrice: 199,
    yearlyPrice: 166,  // 17% off (~$396 savings/year)
    limits: {
      sites: 20,
      pagesPerSite: 2000,
      articlesPerMonth: 200,
      keywordsTracked: 2000,
      auditsPerMonth: 100,  // "Unlimited" with soft cap
      aioAnalysesPerMonth: 500,
      teamMembers: 20,
      aiCreditsPerMonth: 20000,
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
      whiteLabel: true,
      premiumAI: true,
      customIntegrations: true,
      sla: true,
    },
    featureList: [
      "20 websites",
      "200 AI articles/month",
      "2,000 keywords tracked",
      "Unlimited audits*",
      "500 AIO analyses/month",
      "Premium AI content (Claude Opus)",
      "White-label reports",
      "All CMS integrations",
      "Unlimited team members",
      "Dedicated support",
      "Custom integrations",
      "SLA guarantee",
    ],
  },
};

// ============================================
// INTERNAL COSTS (in cents) - Our actual costs
// ============================================

export const INTERNAL_COSTS = {
  // AI Costs (Claude)
  aiCreditHaiku: 0.01,      // $0.0001 per Haiku credit
  aiCreditSonnet: 0.1,      // $0.001 per Sonnet-equivalent credit
  article: 20,              // $0.20 per article (Sonnet, ~8K output tokens)
  aioAnalysis: 8,           // $0.08 per AIO analysis (Haiku)
  
  // SEO Data Costs (DataForSEO)
  keywordLookup: 0.15,      // $0.0015 per keyword
  keywordBatch100: 15,      // $0.15 per 100 keywords
  serpAnalysis: 2,          // $0.02 per SERP
  backlinkSummary: 2,       // $0.02 per domain
  backlinkList: 4,          // $0.04 per request
  
  // Crawling
  pageCrawl: 0.01,          // $0.0001 per page (mostly bandwidth)
  auditFull: 10,            // $0.10 per full audit (100 pages + analysis)
};

// ============================================
// OVERAGE PRICING (85-90% margin target)
// ============================================

export const OVERAGE_PRICES = {
  articles: {
    name: "Extra Articles",
    unit: "article",
    pricePerUnit: 300,      // $3.00 per article
    costPerUnit: 20,        // $0.20 cost
    margin: 0.93,           // 93% margin
  },
  keywords: {
    name: "Extra Keywords",
    unit: "100 keywords",
    pricePerUnit: 500,      // $5.00 per 100 keywords
    costPerUnit: 15,        // $0.15 cost
    margin: 0.97,           // 97% margin
  },
  audits: {
    name: "Extra Audits",
    unit: "audit",
    pricePerUnit: 100,      // $1.00 per audit
    costPerUnit: 10,        // $0.10 cost
    margin: 0.90,           // 90% margin
  },
  aioAnalyses: {
    name: "AIO Analyses",
    unit: "analysis",
    pricePerUnit: 50,       // $0.50 per analysis
    costPerUnit: 8,         // $0.08 cost
    margin: 0.84,           // 84% margin
  },
  aiCredits: {
    name: "AI Credits",
    unit: "1,000 credits",
    pricePerUnit: 200,      // $2.00 per 1,000 credits
    costPerUnit: 10,        // $0.10 cost
    margin: 0.95,           // 95% margin
  },
  serpAnalysis: {
    name: "SERP Analysis",
    unit: "analysis",
    pricePerUnit: 25,       // $0.25 per SERP
    costPerUnit: 2,         // $0.02 cost
    margin: 0.92,           // 92% margin
  },
  backlinks: {
    name: "Backlink Analysis",
    unit: "domain",
    pricePerUnit: 50,       // $0.50 per domain
    costPerUnit: 6,         // $0.06 cost
    margin: 0.88,           // 88% margin
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
