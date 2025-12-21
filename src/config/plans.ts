/**
 * CabbageSEO Plan Configuration
 * 
 * Re-exports from billing/plans.ts for backwards compatibility
 * and adds any config-specific types
 */

export {
  // Types
  type PlanId,
  type BillingInterval,
  type PlanLimits,
  type PlanFeatures,
  type Plan,
  
  // Plan data
  PLANS,
  OVERAGE_PRICES,
  SPENDING_CAP_PRESETS,
  RATE_LIMITS,
  DODO_PRODUCTS,
  DODO_METERS,
  
  // Helpers
  getPlan,
  getPlans,
  getPlanLimits,
  getPlanFeatures,
  getProductId,
  getPlanFromProductId,
  formatPrice,
  formatPriceCents,
  calculateYearlySavings,
  calculateYearlySavingsPercent,
  isWithinLimit,
  getOverageAmount,
  calculateOverageCost,
  getInternalCost,
  getMargin,
  checkUsage,
  canUpgrade,
  canDowngrade,
  getPlanUpgrades,
} from "@/lib/billing/plans";

export type { UsageCheckResult } from "@/lib/billing/plans";

// ============================================
// LEGACY EXPORTS (for backwards compatibility)
// ============================================

import { PLANS as PLAN_DATA, OVERAGE_PRICES, type PlanId as PlanIdType, type BillingInterval as BillingIntervalType } from "@/lib/billing/plans";

// Type aliases for old code
export type { PlanIdType as OldPlanId };
export type { BillingIntervalType as OldBillingInterval };

// Legacy OVERAGES format (maps to new OVERAGE_PRICES structure)
export const OVERAGES = {
  article_generation: {
    name: "Article Generation",
    priceCents: OVERAGE_PRICES.articles.pricePerUnit,
  },
  keyword_analysis: {
    name: "Keyword Analysis",
    priceCents: OVERAGE_PRICES.keywords.pricePerUnit,
  },
  serp_call: {
    name: "SERP API Call",
    priceCents: OVERAGE_PRICES.aiCredits.pricePerUnit, // Map to AI credits
  },
  page_crawl: {
    name: "Page Crawl",
    priceCents: OVERAGE_PRICES.audits.pricePerUnit,
  },
  aio_analysis: {
    name: "AIO Analysis",
    priceCents: OVERAGE_PRICES.aioAnalyses.pricePerUnit,
  },
};

// Default export for old imports
export default PLAN_DATA;
