/**
 * CabbageSEO Pricing Plans
 * 
 * Tiered subscriptions with usage-based overages
 * On-demand credits at 90% markup over internal costs
 */

// ============================================
// PLAN DEFINITIONS
// ============================================

export interface PlanLimit {
  name: string;
  included: number;
  unit: string;
  overagePrice: number;  // Price per unit over limit (in cents)
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;  // Monthly price in cents
  yearlyPrice?: number;  // Yearly price in cents (if different)
  features: string[];
  limits: {
    sites: number;
    pagesPerCrawl: number;
    aiCredits: number;  // Tokens/requests
    keywordResearches: number;
    contentGenerations: number;
    auditReports: number;
    users: number;
  };
  overagePricing: {
    aiCredits: number;     // Per 1000 tokens
    keywordResearches: number;  // Per research
    contentGenerations: number; // Per article
    extraPages: number;    // Per 100 pages crawled
  };
  isPopular?: boolean;
  isEnterprise?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    description: "Perfect for small blogs and personal sites",
    price: 2900,  // $29/month
    yearlyPrice: 29000,  // $290/year (2 months free)
    features: [
      "1 website",
      "Weekly automated crawls",
      "Basic SEO audit",
      "5 AI content generations/month",
      "Keyword research (500 keywords)",
      "Email support",
    ],
    limits: {
      sites: 1,
      pagesPerCrawl: 100,
      aiCredits: 50000,  // ~50k tokens
      keywordResearches: 10,
      contentGenerations: 5,
      auditReports: 4,
      users: 1,
    },
    overagePricing: {
      aiCredits: 5,        // $0.05 per 1k tokens
      keywordResearches: 100,  // $1 per research
      contentGenerations: 500, // $5 per article
      extraPages: 50,      // $0.50 per 100 pages
    },
  },
  {
    id: "pro",
    name: "Pro",
    description: "For growing businesses and agencies",
    price: 7900,  // $79/month
    yearlyPrice: 79000,  // $790/year
    features: [
      "5 websites",
      "Daily automated crawls",
      "Advanced SEO audit",
      "25 AI content generations/month",
      "Keyword research (2,500 keywords)",
      "Internal linking suggestions",
      "GSC & GA4 integration",
      "Priority support",
    ],
    limits: {
      sites: 5,
      pagesPerCrawl: 500,
      aiCredits: 250000,  // ~250k tokens
      keywordResearches: 50,
      contentGenerations: 25,
      auditReports: 30,
      users: 3,
    },
    overagePricing: {
      aiCredits: 4,        // $0.04 per 1k tokens
      keywordResearches: 80,   // $0.80 per research
      contentGenerations: 400, // $4 per article
      extraPages: 40,      // $0.40 per 100 pages
    },
    isPopular: true,
  },
  {
    id: "business",
    name: "Business",
    description: "For established companies with multiple sites",
    price: 19900,  // $199/month
    yearlyPrice: 199000,  // $1,990/year
    features: [
      "15 websites",
      "Real-time monitoring",
      "Full autopilot mode",
      "100 AI content generations/month",
      "Unlimited keyword research",
      "Auto internal linking",
      "White-label reports",
      "API access",
      "Dedicated support",
    ],
    limits: {
      sites: 15,
      pagesPerCrawl: 2000,
      aiCredits: 1000000,  // ~1M tokens
      keywordResearches: 200,
      contentGenerations: 100,
      auditReports: 999,
      users: 10,
    },
    overagePricing: {
      aiCredits: 3,        // $0.03 per 1k tokens
      keywordResearches: 50,   // $0.50 per research
      contentGenerations: 300, // $3 per article
      extraPages: 25,      // $0.25 per 100 pages
    },
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Custom solutions for large organizations",
    price: 0,  // Custom pricing
    features: [
      "Unlimited websites",
      "Custom crawl frequency",
      "Dedicated infrastructure",
      "Custom AI models",
      "SSO & advanced security",
      "Custom integrations",
      "SLA guarantee",
      "Account manager",
    ],
    limits: {
      sites: 999,
      pagesPerCrawl: 10000,
      aiCredits: 10000000,
      keywordResearches: 999,
      contentGenerations: 999,
      auditReports: 999,
      users: 999,
    },
    overagePricing: {
      aiCredits: 2,
      keywordResearches: 30,
      contentGenerations: 200,
      extraPages: 15,
    },
    isEnterprise: true,
  },
];

// ============================================
// ON-DEMAND CREDITS (Cursor-style)
// ============================================

export interface OnDemandPackage {
  id: string;
  name: string;
  credits: number;
  price: number;  // In cents
  perCreditPrice: number;  // For display
}

// Prepaid credit packages with 90% markup
export const ON_DEMAND_PACKAGES: OnDemandPackage[] = [
  {
    id: "credits-10",
    name: "$10 Credits",
    credits: 1000,
    price: 1000,  // $10
    perCreditPrice: 1,  // 1 cent per credit
  },
  {
    id: "credits-25",
    name: "$25 Credits",
    credits: 2750,  // 10% bonus
    price: 2500,  // $25
    perCreditPrice: 0.91,
  },
  {
    id: "credits-50",
    name: "$50 Credits",
    credits: 6000,  // 20% bonus
    price: 5000,  // $50
    perCreditPrice: 0.83,
  },
  {
    id: "credits-100",
    name: "$100 Credits",
    credits: 13000,  // 30% bonus
    price: 10000,  // $100
    perCreditPrice: 0.77,
  },
];

// ============================================
// USAGE COSTS (Internal costs + 90% markup)
// ============================================

// Our internal costs (in cents)
const INTERNAL_COSTS = {
  // Claude API costs per 1k tokens
  claudeHaiku: 0.025,      // $0.00025/1k input, ~$0.001/1k output
  claudeSonnet: 0.3,       // $0.003/1k input, ~$0.015/1k output
  claudeOpus: 1.5,         // $0.015/1k input, ~$0.075/1k output
  
  // DataForSEO
  keywordData: 0.5,        // ~$0.005 per keyword
  serpAnalysis: 2,         // ~$0.02 per SERP
  
  // SerpAPI
  search: 1,               // ~$0.01 per search
};

// With 90% markup
export const USAGE_COSTS = {
  claudeHaiku: Math.ceil(INTERNAL_COSTS.claudeHaiku * 1.9 * 100) / 100,
  claudeSonnet: Math.ceil(INTERNAL_COSTS.claudeSonnet * 1.9 * 100) / 100,
  claudeOpus: Math.ceil(INTERNAL_COSTS.claudeOpus * 1.9 * 100) / 100,
  keywordData: Math.ceil(INTERNAL_COSTS.keywordData * 1.9 * 100) / 100,
  serpAnalysis: Math.ceil(INTERNAL_COSTS.serpAnalysis * 1.9 * 100) / 100,
  search: Math.ceil(INTERNAL_COSTS.search * 1.9 * 100) / 100,
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getPlan(planId: string): Plan | undefined {
  return PLANS.find(p => p.id === planId);
}

export function getPlanByPrice(priceInCents: number): Plan | undefined {
  return PLANS.find(p => p.price === priceInCents);
}

export function calculateOverageCharges(
  planId: string,
  usage: {
    aiCredits?: number;
    keywordResearches?: number;
    contentGenerations?: number;
    extraPages?: number;
  }
): number {
  const plan = getPlan(planId);
  if (!plan) return 0;

  let total = 0;

  if (usage.aiCredits && usage.aiCredits > plan.limits.aiCredits) {
    const overage = usage.aiCredits - plan.limits.aiCredits;
    total += Math.ceil(overage / 1000) * plan.overagePricing.aiCredits;
  }

  if (usage.keywordResearches && usage.keywordResearches > plan.limits.keywordResearches) {
    const overage = usage.keywordResearches - plan.limits.keywordResearches;
    total += overage * plan.overagePricing.keywordResearches;
  }

  if (usage.contentGenerations && usage.contentGenerations > plan.limits.contentGenerations) {
    const overage = usage.contentGenerations - plan.limits.contentGenerations;
    total += overage * plan.overagePricing.contentGenerations;
  }

  if (usage.extraPages) {
    total += Math.ceil(usage.extraPages / 100) * plan.overagePricing.extraPages;
  }

  return total;
}

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function getOnDemandPackage(packageId: string): OnDemandPackage | undefined {
  return ON_DEMAND_PACKAGES.find(p => p.id === packageId);
}

