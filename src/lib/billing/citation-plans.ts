/**
 * AI Visibility Intelligence Pricing Plans
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
  queriesPerCheck: number;     // Auto-generated queries per check
  customQueriesPerSite: number; // User-defined queries (-1 = unlimited)
}

export interface CitationPlanFeatures {
  // Monitoring
  manualChecks: boolean;
  dailyAutoCheck: boolean;      // Inngest cron - daily
  hourlyAutoCheck: boolean;     // Inngest cron - hourly (Pro only)
  emailAlerts: boolean;
  weeklyReport: boolean;
  csvExport: boolean;
  competitorTracking: boolean;
  geoScore: boolean;
  geoTips: boolean;
  
  // Intelligence (the $100k features)
  citationGapAnalysis: boolean;       // "Why competitor, not me?"
  citationGapFull: boolean;           // Full per-query analysis (Pro only)
  contentRecommendations: boolean;    // "What to publish next"
  contentRecsUnlimited: boolean;      // Unlimited vs 3/month
  weeklyActionPlan: boolean;          // Weekly Action Playbook (Pro only)
  competitorDeepDive: boolean;        // Full competitor comparison (Pro only)
  customQueries: boolean;             // User-defined queries (Starter+)
  queryDiscovery: boolean;            // AI-suggested queries (Pro only)
}

// Intelligence limits
export interface CitationIntelligenceLimits {
  gapAnalysesPerMonth: number;        // -1 = unlimited
  contentIdeasPerMonth: number;       // -1 = unlimited
  actionPlansPerMonth: number;        // 0 = not available
}

export interface CitationPlan {
  id: CitationPlanId;
  name: string;
  description: string;
  tagline?: string;  // Value prop for marketing
  monthlyPrice: number;
  yearlyPrice: number;
  limits: CitationPlanLimits;
  intelligenceLimits: CitationIntelligenceLimits;
  features: CitationPlanFeatures;
  isTrial?: boolean;
}

export const CITATION_PLANS: Record<CitationPlanId, CitationPlan> = {
  free: {
    id: "free",
    name: "Free Trial",
    description: `${TRIAL_DAYS}-day trial to explore`,
    tagline: "See who AI cites",
    monthlyPrice: 0,
    yearlyPrice: 0,
    isTrial: true,
    limits: {
      sites: 1,
      manualChecksPerDay: 3,     // 3 on-demand checks per day
      competitors: 0,
      historyDays: 7,
      teamMembers: 1,
      queriesPerCheck: 3,        // 3 basic queries
      customQueriesPerSite: 0,   // No custom queries
    },
    intelligenceLimits: {
      gapAnalysesPerMonth: 0,    // No intelligence on free
      contentIdeasPerMonth: 0,
      actionPlansPerMonth: 0,
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
      // Intelligence features
      citationGapAnalysis: false,
      citationGapFull: false,
      contentRecommendations: false,
      contentRecsUnlimited: false,
      weeklyActionPlan: false,
      competitorDeepDive: false,
      customQueries: false,
      queryDiscovery: false,
    },
  },
  starter: {
    id: "starter",
    name: "Starter",
    description: "For individuals & small brands",
    tagline: "Know why competitors win",
    monthlyPrice: 29,
    yearlyPrice: 24,
    limits: {
      sites: 3,
      manualChecksPerDay: -1,    // Unlimited manual checks
      competitors: 2,
      historyDays: 30,
      teamMembers: 1,
      queriesPerCheck: 10,       // 10 queries per check
      customQueriesPerSite: 5,   // 5 custom queries per site
    },
    intelligenceLimits: {
      gapAnalysesPerMonth: 5,    // 5 "why not me?" analyses
      contentIdeasPerMonth: 3,   // 3 content ideas
      actionPlansPerMonth: 0,    // No action plans (Pro only)
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
      // Intelligence features
      citationGapAnalysis: true,    // Basic "why not me?" summary
      citationGapFull: false,       // Full per-query analysis is Pro
      contentRecommendations: true, // Limited content ideas
      contentRecsUnlimited: false,  // 3/month limit
      weeklyActionPlan: false,      // Pro only
      competitorDeepDive: false,    // Pro only
      customQueries: true,          // 5 custom queries per site
      queryDiscovery: false,        // Pro only
    },
  },
  pro: {
    id: "pro",
    name: "Pro",
    description: "For brands & growing companies",
    tagline: "Win every AI conversation",
    monthlyPrice: 79,
    yearlyPrice: 66,
    limits: {
      sites: 10,
      manualChecksPerDay: -1,    // Unlimited manual checks
      competitors: 10,
      historyDays: 365,
      teamMembers: 1,
      queriesPerCheck: 20,       // 20 queries per check
      customQueriesPerSite: -1,  // Unlimited custom queries
    },
    intelligenceLimits: {
      gapAnalysesPerMonth: -1,   // Unlimited
      contentIdeasPerMonth: -1,  // Unlimited
      actionPlansPerMonth: 4,    // Weekly action plans
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
      // Intelligence features - ALL UNLOCKED
      citationGapAnalysis: true,    // Full gap analysis
      citationGapFull: true,        // Per-query deep dive
      contentRecommendations: true, // Unlimited content ideas
      contentRecsUnlimited: true,   // No limits
      weeklyActionPlan: true,       // Weekly Action Playbook
      competitorDeepDive: true,     // Full competitor breakdown
      customQueries: true,          // Unlimited custom queries
      queryDiscovery: true,         // AI-suggested queries
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

// ============================================
// INTELLIGENCE FEATURE HELPERS
// ============================================

export function canUseGapAnalysis(
  planId: CitationPlanId | string,
  usedThisMonth: number
): { allowed: boolean; reason?: string; remaining?: number } {
  const plan = getCitationPlan(planId);
  
  if (!plan.features.citationGapAnalysis) {
    return {
      allowed: false,
      reason: "Citation Gap Analysis requires Starter plan or higher.",
    };
  }
  
  const limit = plan.intelligenceLimits.gapAnalysesPerMonth;
  
  // Unlimited
  if (limit === -1) {
    return { allowed: true, remaining: -1 };
  }
  
  if (usedThisMonth >= limit) {
    return {
      allowed: false,
      reason: `Monthly limit reached (${limit}). Upgrade to Pro for unlimited.`,
      remaining: 0,
    };
  }
  
  return { allowed: true, remaining: limit - usedThisMonth };
}

export function canUseContentRecommendations(
  planId: CitationPlanId | string,
  usedThisMonth: number
): { allowed: boolean; reason?: string; remaining?: number } {
  const plan = getCitationPlan(planId);
  
  if (!plan.features.contentRecommendations) {
    return {
      allowed: false,
      reason: "Content Recommendations require Starter plan or higher.",
    };
  }
  
  const limit = plan.intelligenceLimits.contentIdeasPerMonth;
  
  // Unlimited
  if (limit === -1) {
    return { allowed: true, remaining: -1 };
  }
  
  if (usedThisMonth >= limit) {
    return {
      allowed: false,
      reason: `Monthly limit reached (${limit} ideas). Upgrade to Pro for unlimited.`,
      remaining: 0,
    };
  }
  
  return { allowed: true, remaining: limit - usedThisMonth };
}

export function canUseActionPlan(
  planId: CitationPlanId | string
): { allowed: boolean; reason?: string } {
  const plan = getCitationPlan(planId);
  
  if (!plan.features.weeklyActionPlan) {
    return {
      allowed: false,
      reason: "Weekly Action Plans are a Pro feature. Upgrade to unlock.",
    };
  }
  
  return { allowed: true };
}

export function canUseCompetitorDeepDive(
  planId: CitationPlanId | string
): { allowed: boolean; reason?: string } {
  const plan = getCitationPlan(planId);
  
  if (!plan.features.competitorDeepDive) {
    return {
      allowed: false,
      reason: "Competitor Deep Dive is a Pro feature. Upgrade to unlock.",
    };
  }
  
  return { allowed: true };
}

// Get intelligence feature summary for UI
export function getIntelligenceFeatureSummary(planId: CitationPlanId | string): {
  gapAnalysis: string;
  contentIdeas: string;
  actionPlan: string;
  competitorDeepDive: string;
} {
  const plan = getCitationPlan(planId);
  const limits = plan.intelligenceLimits;
  
  return {
    gapAnalysis: !plan.features.citationGapAnalysis 
      ? "Not available"
      : limits.gapAnalysesPerMonth === -1 
        ? "Unlimited per-query analysis"
        : `${limits.gapAnalysesPerMonth} analyses/month`,
    contentIdeas: !plan.features.contentRecommendations
      ? "Not available"  
      : limits.contentIdeasPerMonth === -1
        ? "Unlimited ideas"
        : `${limits.contentIdeasPerMonth} ideas/month`,
    actionPlan: plan.features.weeklyActionPlan
      ? "Weekly Action Playbook"
      : "Pro only",
    competitorDeepDive: plan.features.competitorDeepDive
      ? "Full competitor breakdown"
      : "Pro only",
  };
}
