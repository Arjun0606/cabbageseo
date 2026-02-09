/**
 * CabbageSEO Pricing Plans
 *
 * Pricing Philosophy:
 * - Simple, predictable pricing
 * - Usage-based overages via spending caps (NOT prepaid credits)
 * - 85-95%+ margin on all operations
 * - AI-powered (Perplexity, Google AI, OpenAI)
 *
 * Plans:
 * - Free: 7-day trial
 * - Scout $49/mo ($39/mo annual)
 * - Command $149/mo ($119/mo annual)
 * - Dominate $349/mo ($279/mo annual)
 */

// ============================================
// PLAN DEFINITIONS
// ============================================

export type PlanId = "scout" | "command" | "dominate";
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
  scout: {
    id: "scout",
    name: "Scout",
    description: "Know your blind spots",
    monthlyPrice: 49,
    yearlyPrice: 39,
    limits: {
      sites: 1,
      pagesPerSite: 100,
      articlesPerMonth: 10,
      keywordsTracked: 100,
      auditsPerMonth: 5,
      aioAnalysesPerMonth: 50,
      teamMembers: 1,
      aiCreditsPerMonth: 2000,
    },
    features: {
      internalLinking: true,
      contentScoring: true,
      autoSchema: true,
      scheduledPublishing: true,
      autopilotEligible: false,
      gscIntegration: true,
      webflowIntegration: true,
      wordpressIntegration: true,
      shopifyIntegration: true,
      apiAccess: false,
      priorityQueue: false,
      bulkOperations: false,
      whiteLabel: false,
      premiumAI: false,
      customIntegrations: false,
      sla: false,
    },
    featureList: [
      "1 website",
      "3 competitor tracking",
      "Daily AI monitoring",
      "5 gap analyses/month",
      "30-day AI sprint",
      "Trust Map access",
      "Email alerts",
      "Email support",
    ],
  },
  command: {
    id: "command",
    name: "Command",
    description: "Win the AI conversation",
    monthlyPrice: 149,
    yearlyPrice: 119,
    popular: true,
    limits: {
      sites: 5,
      pagesPerSite: 500,
      articlesPerMonth: 50,
      keywordsTracked: 1000,
      auditsPerMonth: 25,
      aioAnalysesPerMonth: 200,
      teamMembers: 5,
      aiCreditsPerMonth: 10000,
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
      apiAccess: false,
      priorityQueue: true,
      bulkOperations: true,
      whiteLabel: false,
      premiumAI: false,
      customIntegrations: false,
      sla: false,
    },
    featureList: [
      "5 websites",
      "10 competitor tracking",
      "Daily AI monitoring",
      "Unlimited intelligence",
      "Weekly action playbooks",
      "Competitor deep dives",
      "Weekly email digest",
      "Priority support",
    ],
  },
  dominate: {
    id: "dominate",
    name: "Dominate",
    description: "Own your category",
    monthlyPrice: 349,
    yearlyPrice: 279,
    limits: {
      sites: 25,
      pagesPerSite: 2000,
      articlesPerMonth: 200,
      keywordsTracked: 5000,
      auditsPerMonth: 100,
      aioAnalysesPerMonth: 500,
      teamMembers: -1,
      aiCreditsPerMonth: 30000,
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
      apiAccess: false,        // Not yet shipped
      priorityQueue: true,
      bulkOperations: true,
      whiteLabel: false,       // Not yet shipped
      premiumAI: true,
      customIntegrations: false, // Not yet shipped
      sla: true,
    },
    featureList: [
      "25 websites",
      "25 competitor tracking",
      "Daily AI monitoring",
      "Unlimited intelligence + fix pages",
      "Weekly email digest",
      "Get Listed Playbook",
      "Monthly checkpoint reports",
      "Priority support",
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
  scout: {
    requestsPerMinute: 10,
    tokensPerMinute: 50000,
    concurrentRequests: 2,
  },
  command: {
    requestsPerMinute: 30,
    tokensPerMinute: 200000,
    concurrentRequests: 5,
  },
  dominate: {
    requestsPerMinute: 60,
    tokensPerMinute: 500000,
    concurrentRequests: 10,
  },
};

// ============================================
// DODO PRODUCT IDS (set in env)
// ============================================

export const DODO_PRODUCTS = {
  scout: {
    monthly: process.env.DODO_SCOUT_MONTHLY_ID || "prod_scout_monthly",
    yearly: process.env.DODO_SCOUT_YEARLY_ID || "prod_scout_yearly",
  },
  command: {
    monthly: process.env.DODO_COMMAND_MONTHLY_ID || "prod_command_monthly",
    yearly: process.env.DODO_COMMAND_YEARLY_ID || "prod_command_yearly",
  },
  dominate: {
    monthly: process.env.DODO_DOMINATE_MONTHLY_ID || "prod_dominate_monthly",
    yearly: process.env.DODO_DOMINATE_YEARLY_ID || "prod_dominate_yearly",
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
  // Handle legacy plan names
  const legacyMap: Record<string, PlanId> = {
    starter: "scout",
    pro: "command",
    pro_plus: "dominate",
  };
  const resolvedId = legacyMap[planId] || planId;
  return PLANS[resolvedId as PlanId] || PLANS.scout;
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
  return DODO_PRODUCTS[planId]?.[interval] || DODO_PRODUCTS.scout.monthly;
}

export function getPlanFromProductId(productId: string): PlanId {
  for (const [planId, products] of Object.entries(DODO_PRODUCTS)) {
    if (products.monthly === productId || products.yearly === productId) {
      return planId as PlanId;
    }
  }
  return "scout";
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
  const order: PlanId[] = ["scout", "command", "dominate"];
  return order.indexOf(targetPlan) > order.indexOf(currentPlan);
}

export function canDowngrade(currentPlan: PlanId, targetPlan: PlanId): boolean {
  const order: PlanId[] = ["scout", "command", "dominate"];
  return order.indexOf(targetPlan) < order.indexOf(currentPlan);
}

export function getPlanUpgrades(currentPlan: PlanId): Plan[] {
  const plans = getPlans();
  const order: PlanId[] = ["scout", "command", "dominate"];
  const currentIndex = order.indexOf(currentPlan);
  return plans.filter((_, i) => i > currentIndex);
}

