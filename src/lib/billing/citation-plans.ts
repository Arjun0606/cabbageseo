/**
 * Citation Intelligence Pricing Plans
 * 
 * HONEST PRICING - Only what's actually built
 * 
 * Free: Demo tier (10-day trial, very limited)
 * Starter: Entry paid tier ($29/mo)
 * Pro: Main revenue tier ($79/mo)
 * 
 * Agency: REMOVED until we actually build:
 * - White-label reports
 * - Custom integrations
 * - Team seats
 * - SLA
 */

export const TRIAL_DAYS = 10;

export type CitationPlanId = "free" | "starter" | "pro";

export interface CitationPlanLimits {
  sites: number;
  checksPerDay: number;
  checksPerMonth: number;
  competitors: number;
  historyDays: number;
  teamMembers: number;
}

export interface CitationPlanFeatures {
  // What's ACTUALLY built
  manualChecks: boolean;
  dailyAutoCheck: boolean;
  hourlyAutoCheck: boolean;
  emailAlerts: boolean;
  weeklyReport: boolean;
  csvExport: boolean;
  competitorTracking: boolean;
  geoScore: boolean;
  geoTips: boolean;
  // NOT built yet - don't promise
  // apiAccess: boolean;
  // slackIntegration: boolean;
  // whiteLabel: boolean;
  // customIntegrations: boolean;
}

export interface CitationPlan {
  id: CitationPlanId;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  limits: CitationPlanLimits;
  features: CitationPlanFeatures;
  isTrial?: boolean;
}

export const CITATION_PLANS: Record<CitationPlanId, CitationPlan> = {
  free: {
    id: "free",
    name: "Free Trial",
    description: `${TRIAL_DAYS}-day trial to test the platform`,
    monthlyPrice: 0,
    yearlyPrice: 0,
    isTrial: true,
    limits: {
      sites: 1,
      checksPerDay: 3,
      checksPerMonth: 30,
      competitors: 0,        // No competitors on free
      historyDays: 7,        // Only 7 days
      teamMembers: 1,
    },
    features: {
      manualChecks: true,
      dailyAutoCheck: false,  // No automation on free
      hourlyAutoCheck: false,
      emailAlerts: false,     // No alerts on free
      weeklyReport: false,    // No reports on free
      csvExport: false,       // No export on free
      competitorTracking: false,
      geoScore: true,         // Let them see the score
      geoTips: false,         // Tips are paid
    },
  },
  starter: {
    id: "starter",
    name: "Starter",
    description: "For individuals & small sites",
    monthlyPrice: 29,
    yearlyPrice: 24, // ~17% discount
    limits: {
      sites: 3,
      checksPerDay: 10,
      checksPerMonth: 100,
      competitors: 2,
      historyDays: 30,
      teamMembers: 1,
    },
    features: {
      manualChecks: true,
      dailyAutoCheck: true,   // Daily automation
      hourlyAutoCheck: false,
      emailAlerts: true,      // Unlock alerts
      weeklyReport: true,     // Unlock reports
      csvExport: true,        // Unlock export
      competitorTracking: true,
      geoScore: true,
      geoTips: true,          // Unlock tips
    },
  },
  pro: {
    id: "pro",
    name: "Pro",
    description: "For brands & growing companies",
    monthlyPrice: 79,
    yearlyPrice: 66, // ~17% discount
    limits: {
      sites: 10,
      checksPerDay: 50,
      checksPerMonth: 500,
      competitors: 10,
      historyDays: 365,       // 1 year history
      teamMembers: 1,         // No team seats yet
    },
    features: {
      manualChecks: true,
      dailyAutoCheck: true,
      hourlyAutoCheck: true,  // Hourly for Pro
      emailAlerts: true,
      weeklyReport: true,
      csvExport: true,
      competitorTracking: true,
      geoScore: true,
      geoTips: true,
    },
  },
};

// ============================================
// TRIAL HELPERS
// ============================================

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

export function canAccessProduct(
  planId: CitationPlanId | string,
  createdAt: string | Date
): { allowed: boolean; reason?: string; upgradeRequired?: boolean } {
  if (planId !== "free") {
    return { allowed: true };
  }
  
  const trial = checkTrialStatus(createdAt);
  
  if (trial.expired) {
    return {
      allowed: false,
      reason: `Your ${TRIAL_DAYS}-day free trial has ended. Upgrade to continue.`,
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
      reason: `Daily limit reached (${plan.limits.checksPerDay}/day). ${
        planId === "free" ? "Upgrade for more." : "Try again tomorrow."
      }`,
    };
  }
  
  if (checksThisMonth >= plan.limits.checksPerMonth) {
    return {
      allowed: false,
      reason: "Monthly limit reached. Upgrade for more.",
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
      reason: planId === "free" 
        ? "Competitor tracking requires Starter plan." 
        : `Limit reached (${plan.limits.competitors}). Upgrade for more.`,
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
      reason: `Site limit reached (${plan.limits.sites}). Upgrade for more.`,
    };
  }
  
  return { allowed: true };
}

export function getHistoryRetentionDays(planId: CitationPlanId | string): number {
  return getCitationPlan(planId).limits.historyDays;
}

export function formatLimit(value: number): string {
  return value >= 999 ? "Unlimited" : value.toString();
}
