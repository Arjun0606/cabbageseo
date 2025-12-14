/**
 * CabbageSEO Pricing Plans
 * 
 * Philosophy:
 * - Simple, predictable pricing
 * - Usage-based overages via prepaid credits
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

export interface Plan {
  id: "starter" | "pro" | "pro_plus";
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;  // Per month when billed yearly
  limits: PlanLimits;
  features: string[];
  popular?: boolean;
}

export const PLANS: Record<string, Plan> = {
  starter: {
    id: "starter",
    name: "Starter",
    description: "Perfect for small sites and bloggers",
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
    features: [
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
    description: "For growing businesses and consultants",
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
    features: [
      "5 websites",
      "50 AI articles/month",
      "500 keywords tracked",
      "20 technical audits/month",
      "100 AIO analyses/month",
      "Advanced content optimization",
      "All CMS integrations",
      "Team collaboration (5 seats)",
      "Priority support",
      "API access",
    ],
  },
  pro_plus: {
    id: "pro_plus",
    name: "Pro+",
    description: "For agencies and large sites",
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
    features: [
      "20 websites",
      "200 AI articles/month",
      "2,000 keywords tracked",
      "Unlimited audits*",
      "500 AIO analyses/month",
      "Premium content (Claude Opus)",
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
// OVERAGE PRICING (Prepaid Credits) - 85-90% margin
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
// CREDIT PACKAGES (Prepaid wallet)
// ============================================

export const CREDIT_PACKAGES = [
  { 
    id: "credits_10",
    credits: 1000, 
    price: 1000,        // $10.00
    bonus: 0, 
    perCreditCents: 1.0,
    savings: "0%",
  },
  { 
    id: "credits_45",
    credits: 5000, 
    price: 4500,        // $45.00
    bonus: 500,         // 10% bonus
    perCreditCents: 0.82,
    savings: "18%",
  },
  { 
    id: "credits_80",
    credits: 10000, 
    price: 8000,        // $80.00
    bonus: 2000,        // 20% bonus
    perCreditCents: 0.67,
    savings: "33%",
  },
  { 
    id: "credits_350",
    credits: 50000, 
    price: 35000,       // $350.00
    bonus: 15000,       // 30% bonus
    perCreditCents: 0.54,
    savings: "46%",
  },
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
// HELPERS
// ============================================

export function getPlan(planId: string): Plan {
  return PLANS[planId] || PLANS.starter;
}

export function getPlans(): Plan[] {
  return Object.values(PLANS);
}

export function getPlanLimits(planId: string): PlanLimits {
  return getPlan(planId).limits;
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
  planId: string,
  resource: keyof PlanLimits,
  currentUsage: number
): boolean {
  const limits = getPlanLimits(planId);
  return currentUsage < limits[resource];
}

export function getOverageAmount(
  planId: string,
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
}

export function checkUsage(
  planId: string,
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
  
  return {
    allowed: false,
    reason: `${resource} limit reached. You can purchase additional ${overageResource} to continue.`,
    overageRequired: overage,
    overageResource,
  };
}
