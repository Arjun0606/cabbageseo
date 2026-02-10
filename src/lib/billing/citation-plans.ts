/**
 * AI Visibility Intelligence Pricing Plans
 *
 * NEW PRICING (Jan 2026) — Optimized for $100k MRR
 *
 * Free: 7-day trial, limited manual checks
 * Scout ($49/mo): Monitor + know your status
 * Command ($149/mo): Full intelligence + action plans
 * Dominate ($349/mo): Scale across brands, white-label
 *
 * Path to $100k MRR:
 * 50% Scout ($49) + 35% Command ($149) + 15% Dominate ($349)
 * = blended ARPU ~$127 → ~785 customers
 */

export const TRIAL_DAYS = 7;

export type CitationPlanId = "free" | "scout" | "command" | "dominate";

export interface CitationPlanLimits {
  sites: number;
  manualChecksPerDay: number;
  competitors: number;
  historyDays: number;
  teamMembers: number;
  queriesPerCheck: number;
  customQueriesPerSite: number; // -1 = unlimited
}

export interface CitationPlanFeatures {
  // Monitoring
  manualChecks: boolean;
  dailyAutoCheck: boolean;
  hourlyAutoCheck: boolean;
  realtimeAlerts: boolean;    // Not yet shipped — hidden from marketing
  emailAlerts: boolean;
  weeklyReport: boolean;
  csvExport: boolean;
  competitorTracking: boolean;
  geoScore: boolean;
  geoTips: boolean;

  // Intelligence
  citationGapAnalysis: boolean;
  citationGapFull: boolean;
  contentRecommendations: boolean;
  contentRecsUnlimited: boolean;
  weeklyActionPlan: boolean;
  competitorDeepDive: boolean;
  customQueries: boolean;
  queryDiscovery: boolean;     // Not yet shipped — hidden from marketing

  // Content Generation
  pageGeneration: boolean;

  // Sprint
  sprintFramework: boolean;
  monthlyCheckpoints: boolean;

  // Scale — not yet shipped, hidden from marketing
  whiteLabel: boolean;
  apiAccess: boolean;
  prioritySupport: boolean;
}

export interface CitationIntelligenceLimits {
  gapAnalysesPerMonth: number;  // -1 = unlimited
  contentIdeasPerMonth: number; // -1 = unlimited
  actionPlansPerMonth: number;  // 0 = not available
  pagesPerMonth: number;        // -1 = unlimited, 0 = not available
}

export interface CitationPlan {
  id: CitationPlanId;
  name: string;
  description: string;
  tagline?: string;
  whoIsThisFor?: string;
  monthlyPrice: number;
  yearlyPrice: number;
  limits: CitationPlanLimits;
  intelligenceLimits: CitationIntelligenceLimits;
  features: CitationPlanFeatures;
  isTrial?: boolean;
  popular?: boolean;
}

export const CITATION_PLANS: Record<CitationPlanId, CitationPlan> = {
  free: {
    id: "free",
    name: "Free Trial",
    description: `${TRIAL_DAYS}-day trial to explore`,
    tagline: "The wake-up call",
    monthlyPrice: 0,
    yearlyPrice: 0,
    isTrial: true,
    limits: {
      sites: 1,
      manualChecksPerDay: 3,
      competitors: 0,
      historyDays: 7,
      teamMembers: 1,
      queriesPerCheck: 3,
      customQueriesPerSite: 0,
    },
    intelligenceLimits: {
      gapAnalysesPerMonth: 0,
      contentIdeasPerMonth: 0,
      actionPlansPerMonth: 0,
      pagesPerMonth: 0,
    },
    features: {
      manualChecks: true,
      dailyAutoCheck: false,
      hourlyAutoCheck: false,
      realtimeAlerts: false,
      emailAlerts: false,
      weeklyReport: false,
      csvExport: false,
      competitorTracking: false,
      geoScore: true,
      geoTips: false,
      citationGapAnalysis: false,
      citationGapFull: false,
      contentRecommendations: false,
      contentRecsUnlimited: false,
      weeklyActionPlan: false,
      competitorDeepDive: false,
      customQueries: false,
      queryDiscovery: false,
      pageGeneration: false,
      sprintFramework: false,
      monthlyCheckpoints: false,
      whiteLabel: false,
      apiAccess: false,
      prioritySupport: false,
    },
  },
  scout: {
    id: "scout",
    name: "Scout",
    description: "Know your blind spots",
    tagline: "See exactly where AI ignores you",
    whoIsThisFor: "Solo founder with one product. You want to know where you stand.",
    monthlyPrice: 49,
    yearlyPrice: 39,
    limits: {
      sites: 1,
      manualChecksPerDay: -1,
      competitors: 3,
      historyDays: 30,
      teamMembers: 1,
      queriesPerCheck: 10,
      customQueriesPerSite: 5,
    },
    intelligenceLimits: {
      gapAnalysesPerMonth: 5,
      contentIdeasPerMonth: 5,
      actionPlansPerMonth: 0,
      pagesPerMonth: 3,
    },
    features: {
      manualChecks: true,
      dailyAutoCheck: true,
      hourlyAutoCheck: false,
      realtimeAlerts: false,
      emailAlerts: true,
      weeklyReport: true,
      csvExport: true,
      competitorTracking: true,
      geoScore: true,
      geoTips: true,
      citationGapAnalysis: true,
      citationGapFull: false,
      contentRecommendations: true,
      contentRecsUnlimited: false,
      weeklyActionPlan: false,
      competitorDeepDive: false,
      customQueries: true,
      queryDiscovery: false,
      pageGeneration: true,
      sprintFramework: true,
      monthlyCheckpoints: true,
      whiteLabel: false,
      apiAccess: false,
      prioritySupport: false,
    },
  },
  command: {
    id: "command",
    name: "Command",
    description: "Win the AI conversation",
    tagline: "Get the playbook to become AI's #1 recommendation",
    whoIsThisFor: "Growing SaaS doing $5k-$50k MRR. Ready to actively compete for AI recommendations.",
    monthlyPrice: 149,
    yearlyPrice: 119,
    popular: true,
    limits: {
      sites: 5,
      manualChecksPerDay: -1,
      competitors: 10,
      historyDays: 365,
      teamMembers: 5,
      queriesPerCheck: 20,
      customQueriesPerSite: -1,
    },
    intelligenceLimits: {
      gapAnalysesPerMonth: -1,
      contentIdeasPerMonth: -1,
      actionPlansPerMonth: 4, // Weekly
      pagesPerMonth: 15,
    },
    features: {
      manualChecks: true,
      dailyAutoCheck: true,
      hourlyAutoCheck: true,
      realtimeAlerts: false,
      emailAlerts: true,
      weeklyReport: true,
      csvExport: true,
      competitorTracking: true,
      geoScore: true,
      geoTips: true,
      citationGapAnalysis: true,
      citationGapFull: true,
      contentRecommendations: true,
      contentRecsUnlimited: true,
      weeklyActionPlan: true,
      competitorDeepDive: true,
      customQueries: true,
      queryDiscovery: false,
      pageGeneration: true,
      sprintFramework: true,
      monthlyCheckpoints: true,
      whiteLabel: false,
      apiAccess: false,
      prioritySupport: true,
    },
  },
  dominate: {
    id: "dominate",
    name: "Dominate",
    description: "Own your category",
    tagline: "Track and win across every query in your space",
    whoIsThisFor: "Agency or multi-product company. Track and win across multiple brands.",
    monthlyPrice: 349,
    yearlyPrice: 279,
    limits: {
      sites: 25,
      manualChecksPerDay: -1,
      competitors: 25,
      historyDays: 365,
      teamMembers: -1,
      queriesPerCheck: 30,
      customQueriesPerSite: -1,
    },
    intelligenceLimits: {
      gapAnalysesPerMonth: -1,
      contentIdeasPerMonth: -1,
      actionPlansPerMonth: -1, // Unlimited
      pagesPerMonth: -1, // Unlimited
    },
    features: {
      manualChecks: true,
      dailyAutoCheck: true,
      hourlyAutoCheck: true,
      realtimeAlerts: false,
      emailAlerts: true,
      weeklyReport: true,
      csvExport: true,
      competitorTracking: true,
      geoScore: true,
      geoTips: true,
      citationGapAnalysis: true,
      citationGapFull: true,
      contentRecommendations: true,
      contentRecsUnlimited: true,
      weeklyActionPlan: true,
      competitorDeepDive: true,
      customQueries: true,
      queryDiscovery: false,   // Not yet shipped
      pageGeneration: true,
      sprintFramework: true,
      monthlyCheckpoints: true,
      whiteLabel: false,       // Not yet shipped
      apiAccess: false,        // Not yet shipped
      prioritySupport: true,
    },
  },
};

// ============================================
// TRIAL HELPERS
// ============================================

/**
 * Check trial status using trial_ends_at (the source of truth).
 * Falls back to created_at + TRIAL_DAYS if trial_ends_at is not available.
 */
export function checkTrialStatus(
  trialEndsAtOrCreatedAt: string | Date | null,
  isTrialEndsAt: boolean = false
): {
  expired: boolean;
  daysRemaining: number;
  daysUsed: number;
} {
  if (!trialEndsAtOrCreatedAt) {
    return { expired: false, daysRemaining: TRIAL_DAYS, daysUsed: 0 };
  }

  const now = new Date();

  if (isTrialEndsAt) {
    // Direct trial_ends_at: check against the actual end date
    const endsAt = new Date(trialEndsAtOrCreatedAt);
    const remainingMs = endsAt.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));
    const expired = now >= endsAt;
    const daysUsed = Math.max(0, TRIAL_DAYS - daysRemaining);
    return { expired, daysRemaining, daysUsed };
  }

  // Legacy fallback: calculate from created_at + TRIAL_DAYS
  const created = new Date(trialEndsAtOrCreatedAt);
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
  trialEndsAtOrCreatedAt: string | Date,
  userEmail?: string | null,
  isTrialEndsAt: boolean = false
): { allowed: boolean; reason?: string; upgradeRequired?: boolean } {
  if (userEmail) {
    const { shouldBypassPaywall } = require("@/lib/testing/test-accounts");
    if (shouldBypassPaywall(userEmail)) {
      return { allowed: true };
    }
  }

  if (planId !== "free") {
    return { allowed: true };
  }

  const trial = checkTrialStatus(trialEndsAtOrCreatedAt, isTrialEndsAt);

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
  // Handle legacy plan names
  const legacyMap: Record<string, CitationPlanId> = {
    starter: "scout",
    pro: "command",
    pro_plus: "dominate",
  };
  const resolvedId = legacyMap[planId] || planId;
  return CITATION_PLANS[resolvedId as CitationPlanId] || CITATION_PLANS.free;
}

export function getCitationPlanLimits(planId: CitationPlanId | string): CitationPlanLimits {
  return getCitationPlan(planId).limits;
}

export function getCitationPlanFeatures(planId: CitationPlanId | string): CitationPlanFeatures {
  return getCitationPlan(planId).features;
}

export function isPaidPlan(planId: string): boolean {
  return planId !== "free";
}

export function formatLimit(limit: number): string {
  return limit === -1 ? "Unlimited" : String(limit);
}

export function getIntelligenceFeatureSummary(planId: CitationPlanId | string): {
  gapAnalysis: string;
  contentIdeas: string;
  actionPlan: string;
  competitorDeepDive: string;
} {
  const plan = getCitationPlan(planId);
  const intel = plan.intelligenceLimits;

  return {
    gapAnalysis:
      intel.gapAnalysesPerMonth === 0
        ? "Not available"
        : intel.gapAnalysesPerMonth === -1
          ? "Unlimited per-query analysis"
          : `${intel.gapAnalysesPerMonth} analyses/month`,
    contentIdeas:
      intel.contentIdeasPerMonth === 0
        ? "Not available"
        : intel.contentIdeasPerMonth === -1
          ? "Unlimited ideas"
          : `${intel.contentIdeasPerMonth} ideas/month`,
    actionPlan: !plan.features.weeklyActionPlan
      ? "Command only"
      : "Weekly Action Playbook",
    competitorDeepDive: !plan.features.competitorDeepDive
      ? "Command only"
      : "Full competitor breakdown",
  };
}

export function canRunManualCheck(
  planId: CitationPlanId | string,
  checksToday: number,
  trialEndsAt?: string | Date,
  isTrialEndsAt: boolean = false
): { allowed: boolean; reason?: string } {
  if (planId === "free" && trialEndsAt) {
    const access = canAccessProduct(planId, trialEndsAt, null, isTrialEndsAt);
    if (!access.allowed) {
      return { allowed: false, reason: access.reason };
    }
  }

  const plan = getCitationPlan(planId);

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
        ? "Competitor tracking requires Scout plan."
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

export function canUseCompetitorDeepDive(
  planId: CitationPlanId | string
): { allowed: boolean; reason?: string } {
  const plan = getCitationPlan(planId);

  if (!plan.features.competitorDeepDive) {
    return {
      allowed: false,
      reason: "Competitor Deep Dive is a Command feature. Upgrade to unlock.",
    };
  }

  return { allowed: true };
}

export function canUseGapAnalysis(
  planId: CitationPlanId | string,
  usedThisMonth: number
): { allowed: boolean; reason?: string; remaining?: number } {
  const plan = getCitationPlan(planId);
  const limit = plan.intelligenceLimits.gapAnalysesPerMonth;

  if (limit === 0) {
    return {
      allowed: false,
      reason: "Gap analysis requires Scout plan or higher.",
    };
  }

  if (limit === -1) {
    return { allowed: true, remaining: -1 };
  }

  if (usedThisMonth >= limit) {
    const next = getNextPlan(plan.id);
    const upgradeTip = next ? ` Upgrade to ${getCitationPlan(next).name} for unlimited.` : "";
    return {
      allowed: false,
      reason: `Monthly limit reached (${limit} analyses).${upgradeTip}`,
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
  const limit = plan.intelligenceLimits.contentIdeasPerMonth;

  if (limit === 0) {
    return {
      allowed: false,
      reason: "Content recommendations require Scout plan or higher.",
    };
  }

  if (limit === -1) {
    return { allowed: true, remaining: -1 };
  }

  if (usedThisMonth >= limit) {
    return {
      allowed: false,
      reason: `Monthly limit reached (${limit} recommendations). Upgrade for more.`,
      remaining: 0,
    };
  }

  return { allowed: true, remaining: limit - usedThisMonth };
}

export function canUseActionPlan(
  planId: CitationPlanId | string,
  usedThisMonth: number
): { allowed: boolean; reason?: string; remaining?: number } {
  const plan = getCitationPlan(planId);
  const limit = plan.intelligenceLimits.actionPlansPerMonth;

  if (limit === 0) {
    return {
      allowed: false,
      reason: "Action plans require Command plan or higher.",
    };
  }

  if (limit === -1) {
    return { allowed: true, remaining: -1 };
  }

  if (usedThisMonth >= limit) {
    return {
      allowed: false,
      reason: `Monthly limit reached (${limit} plans). Upgrade for more.`,
      remaining: 0,
    };
  }

  return { allowed: true, remaining: limit - usedThisMonth };
}

export function canGeneratePage(
  planId: CitationPlanId | string,
  usedThisMonth: number
): { allowed: boolean; reason?: string; remaining?: number } {
  const plan = getCitationPlan(planId);

  if (!plan.features.pageGeneration) {
    return {
      allowed: false,
      reason: "Fix pages require Scout plan or higher.",
    };
  }

  const limit = plan.intelligenceLimits.pagesPerMonth;

  if (limit === -1) {
    return { allowed: true, remaining: -1 };
  }

  if (usedThisMonth >= limit) {
    return {
      allowed: false,
      reason: `Monthly limit reached (${limit} pages). Upgrade for more.`,
      remaining: 0,
    };
  }

  return { allowed: true, remaining: limit - usedThisMonth };
}

// ============================================
// UPGRADE HELPERS (used by checkout hooks, sidebar, modals)
// ============================================

const PLAN_ORDER: CitationPlanId[] = ["free", "scout", "command", "dominate"];

/** Get the next upgrade tier, or null if already on Dominate */
export function getNextPlan(currentPlan: string): CitationPlanId | null {
  const idx = PLAN_ORDER.indexOf(currentPlan as CitationPlanId);
  return idx >= 0 && idx < PLAN_ORDER.length - 1 ? PLAN_ORDER[idx + 1] : null;
}

