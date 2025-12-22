/**
 * Billing Module - Centralized Exports
 */

// ============================================
// PLANS & PRICING
// ============================================

export { 
  PLANS, 
  OVERAGE_PRICES,
  SPENDING_CAP_PRESETS,
  RATE_LIMITS,
  DODO_PRODUCTS,
  DODO_METERS,
  INTERNAL_COSTS,
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
} from "./plans";

export type {
  PlanId,
  BillingInterval,
  Plan,
  PlanLimits,
  PlanFeatures,
  UsageCheckResult,
} from "./plans";

// ============================================
// USAGE TRACKING
// ============================================

export { 
  UsageTracker,
  createUsageTracker,
} from "./usage-tracker";

export type {
  UsageRecord,
  UsageCheck,
  CreditBalance,
} from "./usage-tracker";

// ============================================
// USAGE-BASED BILLING
// ============================================

export {
  recordUsageAndBill,
  checkUsageAllowed,
  getUsageSummary,
} from "./usage-billing";

export type {
  OverageResourceType,
  UsageEvent,
  UsageBillingResult,
  UsageSummary,
} from "./usage-billing";

// ============================================
// OVERAGE MANAGEMENT
// ============================================

export {
  checkOverage,
  recordOverage,
  getOverageSettings,
  updateOverageSettings,
  enableOverages,
  disableOverages,
  increaseSpendingCap,
  resetOverageSpend,
  getOverageSummary,
  calculateOverageCost as calculateOveragePricing,
  DEFAULT_OVERAGE_SETTINGS,
} from "./overage-manager";

export type {
  OverageSettings,
  OverageCheckResult,
  OverageResource,
} from "./overage-manager";

// ============================================
// DODO PAYMENTS
// ============================================

export { 
  getDodo,
  getProductIdForPlan,
  USAGE_METERS,
  trackUsage,
  createCheckoutUrl,
  getBillingPortalUrl,
  DodoPaymentsClient,
} from "./dodo";

export type {
  DodoCustomer,
  DodoSubscription,
  DodoCheckoutSession,
} from "./dodo";

export { dodo } from "./dodo-client";

// ============================================
// PAYMENTS (LEGACY)
// ============================================

export { 
  payments,
  verifyWebhookSignature,
  formatPrice as formatPriceOld,
  getPlanFromSubscription,
} from "./payments";

export type {
  PaymentCustomer,
  Subscription,
  PaymentIntent,
  Invoice,
} from "./payments";

// ============================================
// SUBSCRIPTION CHECKS
// ============================================

export {
  isPaidPlan,
  isActiveSubscription,
  getSubscriptionInfo,
  requiresPayment,
  PAID_FEATURES,
  FREE_FEATURES,
} from "./subscription-check";

export type {
  SubscriptionStatus,
  SubscriptionInfo,
} from "./subscription-check";
