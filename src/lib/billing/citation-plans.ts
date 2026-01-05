/**
 * Citation Intelligence Pricing Plans
 * 
 * 10-DAY FREE TRIAL MODEL
 * - Free users get 10 days of full access
 * - After 10 days, must upgrade to continue
 * - No "free forever" tier
 * 
 * Cost Analysis (per check across 3 platforms):
 * - Perplexity API: ~$0.01-0.02 per query
 * - Google AI (Gemini): ~$0.005 per query with grounding
 * - OpenAI (ChatGPT sim): ~$0.005 per query
 * - Total per check: ~$0.02-0.03
 */

// ============================================
// TRIAL CONFIGURATION
// ============================================

export const TRIAL_DAYS = 10;  // Free trial period

// ============================================
// PLAN DEFINITIONS
// ============================================

export type CitationPlanId = "free" | "starter" | "pro" | "agency";

export interface CitationPlanLimits {
  sites: number;
  checksPerDay: number;
  checksPerMonth: number;
  competitors: number;
  historyDays: number;
  teamMembers: number;
}

export interface CitationPlanFeatures {
  realtimeAlerts: boolean;
  csvExport: boolean;
  apiAccess: boolean;
  whiteLabel: boolean;
  slackIntegration: boolean;
  hourlyMonitoring: boolean;
  prioritySupport: boolean;
  customIntegrations: boolean;
}

export interface CitationPlan {
  id: CitationPlanId;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  limits: CitationPlanLimits;
  features: CitationPlanFeatures;
  checkFrequency: "manual" | "daily" | "hourly" | "realtime";
  isTrial?: boolean;  // True for free plan
}

export const CITATION_PLANS: Record<CitationPlanId, CitationPlan> = {
  free: {
    id: "free",
    name: "Free Trial",
    description: `${TRIAL_DAYS}-day free trial, then upgrade`,
    monthlyPrice: 0,
    yearlyPrice: 0,
    isTrial: true,
    limits: {
      sites: 1,
      checksPerDay: 5,          // Generous during trial
      checksPerMonth: 50,
      competitors: 1,           // Let them try competitor tracking
      historyDays: 10,          // Match trial period
      teamMembers: 1,
    },
    features: {
      realtimeAlerts: true,     // Full features during trial
      csvExport: false,
      apiAccess: false,
      whiteLabel: false,
      slackIntegration: false,
      hourlyMonitoring: false,
      prioritySupport: false,
      customIntegrations: false,
    },
    checkFrequency: "manual",
  },
  starter: {
    id: "starter",
    name: "Starter",
    description: "For creators & solopreneurs",
    monthlyPrice: 29,
    yearlyPrice: 24,
    limits: {
      sites: 3,
      checksPerDay: 10,
      checksPerMonth: 100,
      competitors: 2,
      historyDays: 30,
      teamMembers: 1,
    },
    features: {
      realtimeAlerts: true,
      csvExport: true,
      apiAccess: false,
      whiteLabel: false,
      slackIntegration: false,
      hourlyMonitoring: false,
      prioritySupport: false,
      customIntegrations: false,
    },
    checkFrequency: "daily",
  },
  pro: {
    id: "pro",
    name: "Pro",
    description: "For growing businesses",
    monthlyPrice: 79,
    yearlyPrice: 66,
    limits: {
      sites: 10,
      checksPerDay: 100,
      checksPerMonth: 999999,
      competitors: 10,
      historyDays: 99999,
      teamMembers: 5,
    },
    features: {
      realtimeAlerts: true,
      csvExport: true,
      apiAccess: true,
      whiteLabel: false,
      slackIntegration: true,
      hourlyMonitoring: true,
      prioritySupport: true,
      customIntegrations: false,
    },
    checkFrequency: "hourly",
  },
  agency: {
    id: "agency",
    name: "Agency",
    description: "For agencies & large teams",
    monthlyPrice: 199,
    yearlyPrice: 166,
    limits: {
      sites: 50,
      checksPerDay: 999999,
      checksPerMonth: 999999,
      competitors: 999999,
      historyDays: 99999,
      teamMembers: 20,
    },
    features: {
      realtimeAlerts: true,
      csvExport: true,
      apiAccess: true,
      whiteLabel: true,
      slackIntegration: true,
      hourlyMonitoring: true,
      prioritySupport: true,
      customIntegrations: true,
    },
    checkFrequency: "realtime",
  },
};

// ============================================
// TRIAL HELPERS
// ============================================

/**
 * Check if a user's trial has expired
 * @param createdAt - When the user/org was created
 * @returns Object with expired status and days remaining
 */
export function checkTrialStatus(createdAt: string | Date): {
  expired: boolean;
  daysRemaining: number;
  daysUsed: number;
} {
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const daysUsed = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(0, TRIAL_DAYS - daysUsed);
  
  return {
    expired: daysUsed >= TRIAL_DAYS,
    daysRemaining,
    daysUsed,
  };
}

/**
 * Check if user can access the product
 * Free users with expired trial cannot access
 */
export function canAccessProduct(
  planId: CitationPlanId | string,
  createdAt: string | Date
): { allowed: boolean; reason?: string; upgradeRequired?: boolean } {
  // Paid plans always have access
  if (planId !== "free") {
    return { allowed: true };
  }
  
  // Check trial status for free users
  const trial = checkTrialStatus(createdAt);
  
  if (trial.expired) {
    return {
      allowed: false,
      reason: `Your ${TRIAL_DAYS}-day free trial has ended. Upgrade to continue tracking AI citations.`,
      upgradeRequired: true,
    };
  }
  
  return { allowed: true };
}

// ============================================
// PLAN HELPERS
// ============================================

export function getCitationPlan(planId: CitationPlanId | string): CitationPlan {
  return CITATION_PLANS[planId as CitationPlanId] || CITATION_PLANS.free;
}

export function getCitationPlanLimits(planId: CitationPlanId | string): CitationPlanLimits {
  return getCitationPlan(planId).limits;
}

export function getCitationPlanFeatures(planId: CitationPlanId | string): CitationPlanFeatures {
  return getCitationPlan(planId).features;
}

export function canCheckCitations(
  planId: CitationPlanId | string,
  checksToday: number,
  checksThisMonth: number,
  createdAt?: string | Date
): { allowed: boolean; reason?: string } {
  // First check trial status for free users
  if (planId === "free" && createdAt) {
    const access = canAccessProduct(planId, createdAt);
    if (!access.allowed) {
      return { allowed: false, reason: access.reason };
    }
  }
  
  const plan = getCitationPlan(planId);
  
  if (checksToday >= plan.limits.checksPerDay) {
    return {
      allowed: false,
      reason: `Daily limit reached (${plan.limits.checksPerDay} checks/day). ${
        planId === "free" ? "Upgrade for more checks!" : "Try again tomorrow."
      }`,
    };
  }
  
  if (checksThisMonth >= plan.limits.checksPerMonth) {
    return {
      allowed: false,
      reason: `Monthly limit reached. Upgrade for more checks.`,
    };
  }
  
  return { allowed: true };
}

export function canAddCompetitor(
  planId: CitationPlanId | string,
  currentCompetitors: number
): { allowed: boolean; reason?: string } {
  const plan = getCitationPlan(planId);
  
  if (currentCompetitors >= plan.limits.competitors) {
    return {
      allowed: false,
      reason: `Competitor limit reached (${plan.limits.competitors}). Upgrade for more.`,
    };
  }
  
  return { allowed: true };
}

export function canAddSite(
  planId: CitationPlanId | string,
  currentSites: number
): { allowed: boolean; reason?: string } {
  const plan = getCitationPlan(planId);
  
  if (currentSites >= plan.limits.sites) {
    return {
      allowed: false,
      reason: `Site limit reached (${plan.limits.sites}). Upgrade for more sites.`,
    };
  }
  
  return { allowed: true };
}

export function getHistoryRetentionDays(planId: CitationPlanId | string): number {
  return getCitationPlan(planId).limits.historyDays;
}

export function isUnlimited(value: number): boolean {
  return value >= 999999;
}

export function formatLimit(value: number): string {
  return isUnlimited(value) ? "Unlimited" : value.toString();
}
