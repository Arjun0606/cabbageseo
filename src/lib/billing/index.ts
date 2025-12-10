/**
 * Billing Module - Centralized Exports
 */

export { dodo, DodoPaymentsClient } from "./dodo-client";
export { usageTracker, UsageTracker } from "./usage-tracker";
export { 
  PLANS, 
  ON_DEMAND_PACKAGES, 
  USAGE_COSTS,
  getPlan, 
  getPlanByPrice, 
  getOnDemandPackage,
  calculateOverageCharges,
  formatPrice,
} from "./plans";

export type {
  DodoConfig,
  Customer,
  Product,
  Subscription,
  UsageRecord as DodoUsageRecord,
  Invoice,
  PaymentIntent,
  CheckoutSession,
} from "./dodo-client";

export type {
  UsageType,
  UsageRecord,
  UsageStatus,
  OrganizationUsage,
} from "./usage-tracker";

export type {
  PlanLimit,
  Plan,
  OnDemandPackage,
} from "./plans";
