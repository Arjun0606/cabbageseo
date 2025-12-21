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

import { PLANS as PLAN_DATA, type PlanId as PlanIdType, type BillingInterval as BillingIntervalType } from "@/lib/billing/plans";

// Type aliases for old code
export type { PlanIdType as OldPlanId };
export type { BillingIntervalType as OldBillingInterval };

// Default export for old imports
export default PLAN_DATA;
