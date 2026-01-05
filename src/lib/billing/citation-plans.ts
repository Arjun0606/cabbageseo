/**
 * Citation Intelligence Pricing Plans
 * 
 * Simple, transparent pricing for AI citation tracking
 * 
 * Cost Analysis (per check across 3 platforms):
 * - Perplexity API: ~$0.01-0.02 per query
 * - Google AI (Gemini): ~$0.005 per query with grounding
 * - OpenAI (ChatGPT sim): ~$0.005 per query
 * - Total per check: ~$0.02-0.03
 * 
 * Free Plan:
 * - 3 checks/day = ~90 checks/month = ~$2.70/month cost
 * - 7-day history limit keeps storage minimal
 * - No competitor tracking (saves significant costs)
 * 
 * Starter Plan ($29/mo):
 * - 100 checks/month = ~$3/month cost
 * - 2 competitors = 3x queries = ~$9/month total
 * - 30-day history
 * - Margin: ~$17-20/month (60-70%)
 * 
 * Pro Plan ($79/mo):
 * - Unlimited checks (cap at ~500/month) = ~$15/month
 * - 10 competitors = significant query load
 * - Hourly monitoring = more queries
 * - Margin: ~$40-50/month (50-65%)
 * 
 * Agency Plan ($199/mo):
 * - 50 sites, unlimited competitors
 * - High query volume but excellent margins at scale
 */

// ============================================
// CITATION PLAN DEFINITIONS
// ============================================

export type CitationPlanId = "free" | "starter" | "pro" | "agency";

export interface CitationPlanLimits {
  sites: number;
  checksPerDay: number;       // Manual checks allowed per day
  checksPerMonth: number;     // Total automated + manual checks
  competitors: number;
  historyDays: number;        // How long we keep citation data
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
}

export const CITATION_PLANS: Record<CitationPlanId, CitationPlan> = {
  free: {
    id: "free",
    name: "Free",
    description: "Get started with citation tracking",
    monthlyPrice: 0,
    yearlyPrice: 0,
    limits: {
      sites: 1,
      checksPerDay: 3,
      checksPerMonth: 90,  // 3/day * 30
      competitors: 0,
      historyDays: 7,      // Data deleted after 7 days!
      teamMembers: 1,
    },
    features: {
      realtimeAlerts: false,
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
      checksPerMonth: 999999, // "Unlimited"
      competitors: 10,
      historyDays: 99999,    // "Forever"
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
      competitors: 999999,   // "Unlimited"
      historyDays: 99999,    // "Forever"
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
// HELPERS
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
  checksThisMonth: number
): { allowed: boolean; reason?: string } {
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
      reason: `Monthly limit reached. ${
        planId === "free" ? "Upgrade for more checks!" : "Contact support for additional checks."
      }`,
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
        ? "Competitor tracking requires a paid plan." 
        : `Competitor limit reached (${plan.limits.competitors}). Upgrade for more.`,
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

