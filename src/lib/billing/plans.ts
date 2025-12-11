/**
 * CabbageSEO Pricing Plans
 * 
 * Philosophy:
 * - Simple, predictable pricing
 * - Usage-based overages (prepaid credits)
 * - 90% margin on overages
 * - White-label included in all plans
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
    yearlyPrice: 24,  // 17% off
    limits: {
      sites: 1,
      pagesPerSite: 100,
      articlesPerMonth: 10,
      keywordsTracked: 100,
      auditsPerMonth: 5,
      teamMembers: 1,
      aiCreditsPerMonth: 1000,
    },
    features: [
      "1 website",
      "10 AI articles/month",
      "100 keywords tracked",
      "Technical SEO audits",
      "Content optimization",
      "WordPress/Webflow publishing",
      "Email support",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    description: "For growing businesses and agencies",
    monthlyPrice: 79,
    yearlyPrice: 66,  // 16% off
    popular: true,
    limits: {
      sites: 5,
      pagesPerSite: 500,
      articlesPerMonth: 50,
      keywordsTracked: 500,
      auditsPerMonth: 20,
      teamMembers: 5,
      aiCreditsPerMonth: 5000,
    },
    features: [
      "5 websites",
      "50 AI articles/month",
      "500 keywords tracked",
      "Advanced technical audits",
      "Content optimization",
      "All CMS integrations",
      "Team collaboration",
      "Priority support",
      "API access",
    ],
  },
  pro_plus: {
    id: "pro_plus",
    name: "Pro+",
    description: "For agencies and large sites",
    monthlyPrice: 199,
    yearlyPrice: 166,  // 17% off
    limits: {
      sites: 20,
      pagesPerSite: 2000,
      articlesPerMonth: 200,
      keywordsTracked: 2000,
      auditsPerMonth: 100,
      teamMembers: 20,
      aiCreditsPerMonth: 20000,
    },
    features: [
      "20 websites",
      "200 AI articles/month",
      "2,000 keywords tracked",
      "Unlimited audits",
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
// OVERAGE PRICING (Prepaid Credits)
// ============================================

// Cost to us (in cents)
export const INTERNAL_COSTS = {
  aiCredit: 0.1,           // $0.001 per credit (Claude Haiku avg)
  article: 50,             // $0.50 per article (Sonnet usage)
  keywordLookup: 0.5,      // $0.005 per keyword (DataForSEO)
  serpAnalysis: 1,         // $0.01 per SERP (SerpAPI)
  audit: 10,               // $0.10 per audit (crawl + analysis)
};

// Price to customer (90% markup over cost)
export const OVERAGE_PRICES = {
  aiCredits: {
    name: "AI Credits",
    unit: "1,000 credits",
    pricePerUnit: 2,       // $2 per 1,000 credits (cost: ~$1)
  },
  articles: {
    name: "Extra Articles",
    unit: "article",
    pricePerUnit: 3,       // $3 per article (cost: ~$0.50)
  },
  keywords: {
    name: "Extra Keywords",
    unit: "100 keywords",
    pricePerUnit: 5,       // $5 per 100 keywords (cost: ~$0.50)
  },
  audits: {
    name: "Extra Audits",
    unit: "audit",
    pricePerUnit: 1,       // $1 per audit (cost: ~$0.10)
  },
};

// Credit packages for prepaid purchase
export const CREDIT_PACKAGES = [
  { credits: 1000, price: 10, bonus: 0, perCredit: 0.01 },
  { credits: 5000, price: 45, bonus: 500, perCredit: 0.009 },   // 10% bonus
  { credits: 10000, price: 80, bonus: 2000, perCredit: 0.008 }, // 20% bonus
  { credits: 50000, price: 350, bonus: 15000, perCredit: 0.007 }, // 30% bonus
];

// ============================================
// HELPERS
// ============================================

export function getPlan(planId: string): Plan {
  return PLANS[planId] || PLANS.starter;
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
  resource: "aiCredits" | "articles" | "keywords" | "audits",
  amount: number
): number {
  const pricing = OVERAGE_PRICES[resource];
  const units = resource === "keywords" ? Math.ceil(amount / 100) : 
                resource === "aiCredits" ? Math.ceil(amount / 1000) : 
                amount;
  return units * pricing.pricePerUnit;
}
