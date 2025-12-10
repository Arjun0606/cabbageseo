export type PlanId = "starter" | "pro" | "pro_plus";
export type BillingInterval = "monthly" | "yearly";

export interface PlanLimits {
  articles: number;
  keywords: number;
  serpCalls: number;
  sites: number;
  teamMembers: number;
  crawlPages: number;
}

export interface PlanFeatures {
  internalLinking: boolean;
  contentScoring: boolean;
  autoSchema: boolean;
  scheduledPublishing: boolean;
  autopilotEligible: boolean;
  gscIntegration: boolean;
  webflowIntegration: boolean;
  apiAccess: boolean;
  priorityQueue: boolean;
  bulkOperations: boolean;
}

export interface Plan {
  id: PlanId;
  name: string;
  description: string;
  priceMonthly: number; // in cents
  priceYearly: number; // in cents
  limits: PlanLimits;
  features: PlanFeatures;
  popular?: boolean;
}

export const PLANS: Record<PlanId, Plan> = {
  starter: {
    id: "starter",
    name: "Starter",
    description: "Perfect for small sites and bloggers getting started with SEO",
    priceMonthly: 2900,
    priceYearly: 29000,
    limits: {
      articles: 10,
      keywords: 1000,
      serpCalls: 200,
      sites: 1,
      teamMembers: 1,
      crawlPages: 500,
    },
    features: {
      internalLinking: false,
      contentScoring: false,
      autoSchema: false,
      scheduledPublishing: false,
      autopilotEligible: false,
      gscIntegration: false,
      webflowIntegration: false,
      apiAccess: false,
      priorityQueue: false,
      bulkOperations: false,
    },
  },
  pro: {
    id: "pro",
    name: "Pro",
    description: "For growing businesses serious about organic traffic",
    priceMonthly: 5900,
    priceYearly: 59000,
    limits: {
      articles: 40,
      keywords: 5000,
      serpCalls: 2000,
      sites: 3,
      teamMembers: 3,
      crawlPages: 2500,
    },
    features: {
      internalLinking: true,
      contentScoring: true,
      autoSchema: true,
      scheduledPublishing: true,
      autopilotEligible: true,
      gscIntegration: true,
      webflowIntegration: true,
      apiAccess: false,
      priorityQueue: false,
      bulkOperations: false,
    },
    popular: true,
  },
  pro_plus: {
    id: "pro_plus",
    name: "Pro+",
    description: "For agencies and power users who need maximum output",
    priceMonthly: 12900,
    priceYearly: 129000,
    limits: {
      articles: 120,
      keywords: 15000,
      serpCalls: 10000,
      sites: 10,
      teamMembers: 10,
      crawlPages: 10000,
    },
    features: {
      internalLinking: true,
      contentScoring: true,
      autoSchema: true,
      scheduledPublishing: true,
      autopilotEligible: true,
      gscIntegration: true,
      webflowIntegration: true,
      apiAccess: true,
      priorityQueue: true,
      bulkOperations: true,
    },
  },
};

export interface OverageItem {
  id: string;
  name: string;
  internalCostCents: number;
  priceCents: number;
  unit: string;
  description: string;
}

export const OVERAGE_MARKUP = 1.9; // 90% markup

export const OVERAGES: Record<string, OverageItem> = {
  article_generation: {
    id: "article_generation",
    name: "Article Generation",
    internalCostCents: 10,
    priceCents: 19,
    unit: "article",
    description: "AI-generated SEO article",
  },
  keyword_analysis: {
    id: "keyword_analysis",
    name: "Keyword Analysis",
    internalCostCents: 8,
    priceCents: 15,
    unit: "1,000 keywords",
    description: "Keyword research and data",
  },
  serp_call: {
    id: "serp_call",
    name: "SERP API Call",
    internalCostCents: 0.3,
    priceCents: 0.6,
    unit: "call",
    description: "Search results analysis",
  },
  page_crawl: {
    id: "page_crawl",
    name: "Page Crawl",
    internalCostCents: 0.5,
    priceCents: 1,
    unit: "page",
    description: "Technical page analysis",
  },
  content_optimization: {
    id: "content_optimization",
    name: "Content Optimization",
    internalCostCents: 6,
    priceCents: 11,
    unit: "article",
    description: "SEO optimization pass",
  },
  internal_link_analysis: {
    id: "internal_link_analysis",
    name: "Internal Link Analysis",
    internalCostCents: 2,
    priceCents: 4,
    unit: "page",
    description: "Internal linking suggestions",
  },
  schema_generation: {
    id: "schema_generation",
    name: "Schema Generation",
    internalCostCents: 1,
    priceCents: 2,
    unit: "page",
    description: "Structured data markup",
  },
  meta_generation: {
    id: "meta_generation",
    name: "Meta Generation",
    internalCostCents: 0.5,
    priceCents: 1,
    unit: "page",
    description: "Meta title & description",
  },
};

export interface Addon {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
}

export const ADDONS: Record<string, Addon> = {
  autopilot: {
    id: "autopilot",
    name: "Auto-Pilot Mode",
    description: "Automated weekly content generation, updates, and monitoring",
    priceMonthly: 2000,
  },
};

export function getPlanLimits(planId: PlanId): PlanLimits {
  return PLANS[planId].limits;
}

export function getPlanFeatures(planId: PlanId): PlanFeatures {
  return PLANS[planId].features;
}

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

export function calculateYearlySavings(planId: PlanId): number {
  const plan = PLANS[planId];
  const monthlyTotal = plan.priceMonthly * 12;
  const yearlyTotal = plan.priceYearly;
  return Math.round(((monthlyTotal - yearlyTotal) / monthlyTotal) * 100);
}

