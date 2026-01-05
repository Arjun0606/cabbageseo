/**
 * Citation Intelligence Pricing Plans
 * 
 * HONEST PRICING - Sensible limits
 * 
 * AUTO-CHECKS: Run automatically via Inngest - DON'T count against limits
 * MANUAL CHECKS: On-demand checks users trigger - these have limits on Free
 * 
 * Free: 10-day trial, limited manual checks
 * Starter: $29/mo - Unlimited manual + daily auto
 * Pro: $79/mo - Unlimited manual + hourly auto
 */

export const TRIAL_DAYS = 10;

export type CitationPlanId = "free" | "starter" | "pro";

export interface CitationPlanLimits {
  sites: number;
  manualChecksPerDay: number;  // On-demand checks user triggers
  competitors: number;
  historyDays: number;
  teamMembers: number;
}

export interface CitationPlanFeatures {
  manualChecks: boolean;
  dailyAutoCheck: boolean;      // Inngest cron - daily
  hourlyAutoCheck: boolean;     // Inngest cron - hourly (Pro only)
  emailAlerts: boolean;
  weeklyReport: boolean;
  csvExport: boolean;
  competitorTracking: boolean;
  geoScore: boolean;
  geoTips: boolean;
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
    description: `${TRIAL_DAYS}-day trial to explore`,
    monthlyPrice: 0,
    yearlyPrice: 0,
    isTrial: true,
    limits: {
      sites: 1,
      manualChecksPerDay: 3,     // 3 on-demand checks per day
      competitors: 0,
      historyDays: 7,
      teamMembers: 1,
    },
    features: {
      manualChecks: true,
      dailyAutoCheck: false,     // No automation on free
      hourlyAutoCheck: false,
      emailAlerts: false,
      weeklyReport: false,
      csvExport: false,
      competitorTracking: false,
      geoScore: true,
      geoTips: false,
    },
  },
  starter: {
    id: "starter",
    name: "Starter",
    description: "For individuals & small brands",
    monthlyPrice: 29,
    yearlyPrice: 24,
    limits: {
      sites: 3,
      manualChecksPerDay: -1,    // Unlimited manual checks
      competitors: 2,
      historyDays: 30,
      teamMembers: 1,
    },
    features: {
      manualChecks: true,
      dailyAutoCheck: true,      // Daily automation included
      hourlyAutoCheck: false,
      emailAlerts: true,
      weeklyReport: true,
      csvExport: true,
      competitorTracking: true,
      geoScore: true,
      geoTips: true,
    },
  },
  pro: {
    id: "pro",
    name: "Pro",
    description: "For brands & growing companies",
    monthlyPrice: 79,
    yearlyPrice: 66,
    limits: {
      sites: 10,
      manualChecksPerDay: -1,    // Unlimited manual checks
      competitors: 10,
      historyDays: 365,
      teamMembers: 1,
    },
    features: {
      manualChecks: true,
      dailyAutoCheck: true,
      hourlyAutoCheck: true,     // Hourly automation for Pro
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

export function canRunManualCheck(
  planId: CitationPlanId | string,
  checksToday: number,
  createdAt?: string | Date
): { allowed: boolean; reason?: string } {
  // Check trial expiration for free users
  if (planId === "free" && createdAt) {
    const access = canAccessProduct(planId, createdAt);
    if (!access.allowed) {
      return { allowed: false, reason: access.reason };
    }
  }
  
  const plan = getCitationPlan(planId);
  
  // Unlimited for paid plans
  if (plan.limits.manualChecksPerDay === -1) {
    return { allowed: true };
  }
  
  if (checksToday >= plan.limits.manualChecksPerDay) {
    return {
      allowed: false,
      reason: `Daily limit reached (${plan.limits.manualChecksPerDay}/day). Upgrade for unlimited.`,
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

export function formatLimit(value: number): string {
  return value === -1 ? "Unlimited" : value.toString();
}
