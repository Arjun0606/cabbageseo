/**
 * Subscription Checking Utilities
 * 
 * Use these to check if a user has access to paid features
 */

import { PLANS, type PlanId } from "./plans";

export type SubscriptionStatus = "active" | "trialing" | "past_due" | "canceled" | "paused" | "free";

export interface SubscriptionInfo {
  plan: PlanId;
  status: SubscriptionStatus;
  isActive: boolean;
  isPaid: boolean;
  isTrial: boolean;
  canAccessPaidFeatures: boolean;
  currentPeriodEnd?: string;
}

/**
 * Check if a plan is a paid plan (not free)
 */
export function isPaidPlan(plan: string | null | undefined): boolean {
  if (!plan) return false;
  return plan !== "free" && plan in PLANS;
}

/**
 * Check if subscription status allows access to features
 */
export function isActiveSubscription(status: string | null | undefined): boolean {
  if (!status) return false;
  return status === "active" || status === "trialing";
}

/**
 * Get subscription info from organization data
 */
export function getSubscriptionInfo(org: {
  plan?: string | null;
  subscription_status?: string | null;
  current_period_end?: string | null;
} | null): SubscriptionInfo {
  const plan = (org?.plan as PlanId) || "free";
  const status = (org?.subscription_status as SubscriptionStatus) || "free";
  
  const isActive = isActiveSubscription(status);
  const isPaid = isPaidPlan(plan);
  const isTrial = status === "trialing";
  
  // User can access paid features if:
  // 1. They have a paid plan with active/trialing status
  // 2. OR they are in a trial period
  const canAccessPaidFeatures = (isPaid && isActive) || isTrial;
  
  return {
    plan,
    status,
    isActive,
    isPaid,
    isTrial,
    canAccessPaidFeatures,
    currentPeriodEnd: org?.current_period_end || undefined,
  };
}

/**
 * Features that require a paid subscription
 */
export const PAID_FEATURES = {
  keywordResearch: true,
  contentGeneration: true,
  siteAudit: true,
  autopilot: true,
  analytics: true,
  multiSite: true,
  teamMembers: true,
  apiAccess: true,
  prioritySupport: true,
} as const;

/**
 * Features available on free plan (with limits)
 */
export const FREE_FEATURES = {
  freeAnalyzer: true,      // Public analyzer (no login)
  onboarding: true,        // Initial site analysis
  dashboard: true,         // View-only dashboard
  limitedAudit: true,      // View audit results (can't run new ones)
} as const;

/**
 * Check if a specific feature requires payment
 */
export function requiresPayment(feature: keyof typeof PAID_FEATURES): boolean {
  return PAID_FEATURES[feature] === true;
}

