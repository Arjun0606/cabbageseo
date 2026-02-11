/**
 * AI Visibility Intelligence Pricing Plans
 *
 * PRICING (Feb 2026) — GEO-First Product
 *
 * No Plan: Unpaid (blocked from dashboard — free teaser scan only)
 * Scout ($49/mo): Monitor + start fixing your AI visibility
 * Command ($149/mo): Full GEO intelligence + maximum visibility
 * Dominate ($349/mo): Own your category across every AI platform
 *
 * Path to $100k MRR:
 * 50% Scout ($49) + 35% Command ($149) + 15% Dominate ($349)
 * = blended ARPU ~$127 → ~785 customers
 */

export type CitationPlanId = "free" | "scout" | "command" | "dominate";

export interface CitationPlanLimits {
  sites: number;
  manualChecksPerDay: number;
  historyDays: number;
  queriesPerCheck: number;
  customQueriesPerSite: number; // -1 = unlimited
  auditPagesPerSite: number;   // How many pages per site audit
}

export interface CitationPlanFeatures {
  // Monitoring
  manualChecks: boolean;
  dailyAutoCheck: boolean;
  hourlyAutoCheck: boolean;
  emailAlerts: boolean;
  weeklyReport: boolean;
  csvExport: boolean;
  geoScore: boolean;
  geoTips: boolean;

  // Intelligence
  citationGapAnalysis: boolean;
  citationGapFull: boolean;
  contentRecommendations: boolean;
  contentRecsUnlimited: boolean;
  weeklyActionPlan: boolean;
  customQueries: boolean;

  // Fix Pages (GEO-focused generation)
  pageGeneration: boolean;
  schemaGeneration: boolean;     // JSON-LD schema markup in generated pages
  entityOptimization: boolean;   // Entity analysis + optimization in content

  // Site GEO Audit
  siteAudit: boolean;            // Page-level GEO readiness audit
  siteAuditFull: boolean;        // Full site crawl (vs top-10 pages only)

  // Sprint
  sprintFramework: boolean;
  monthlyCheckpoints: boolean;

}

export interface CitationIntelligenceLimits {
  gapAnalysesPerMonth: number;   // -1 = unlimited
  contentIdeasPerMonth: number;  // -1 = unlimited
  actionPlansPerMonth: number;   // 0 = not available
  pagesPerMonth: number;         // -1 = unlimited, 0 = not available
  siteAuditsPerMonth: number;    // -1 = unlimited, 0 = not available
  pageRefreshDays: number;       // 0 = no auto-refresh, N = refresh every N days
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
  popular?: boolean;
}

export const CITATION_PLANS: Record<CitationPlanId, CitationPlan> = {
  free: {
    id: "free",
    name: "No Plan",
    description: "Subscribe to get started",
    monthlyPrice: 0,
    yearlyPrice: 0,
    limits: {
      sites: 1,
      manualChecksPerDay: 3,

      historyDays: 7,
      queriesPerCheck: 3,
      customQueriesPerSite: 0,
      auditPagesPerSite: 0,
    },
    intelligenceLimits: {
      gapAnalysesPerMonth: 0,
      contentIdeasPerMonth: 0,
      actionPlansPerMonth: 0,
      pagesPerMonth: 0,
      siteAuditsPerMonth: 0,
      pageRefreshDays: 0,
    },
    features: {
      manualChecks: true,
      dailyAutoCheck: false,
      hourlyAutoCheck: false,
      emailAlerts: false,
      weeklyReport: false,
      csvExport: false,

      geoScore: true,
      geoTips: false,
      citationGapAnalysis: false,
      citationGapFull: false,
      contentRecommendations: false,
      contentRecsUnlimited: false,
      weeklyActionPlan: false,

      customQueries: false,
      pageGeneration: false,
      schemaGeneration: false,
      entityOptimization: false,
      siteAudit: false,
      siteAuditFull: false,
      sprintFramework: false,
      monthlyCheckpoints: false,
    },
  },
  scout: {
    id: "scout",
    name: "Scout",
    description: "Monitor + start fixing your AI visibility",
    tagline: "See your blind spots and start fixing them",
    whoIsThisFor: "Solo founder with one product. You want to know where you stand and start getting cited.",
    monthlyPrice: 49,
    yearlyPrice: 39,
    limits: {
      sites: 1,
      manualChecksPerDay: -1,

      historyDays: 30,
      queriesPerCheck: 10,
      customQueriesPerSite: 5,
      auditPagesPerSite: 10,
    },
    intelligenceLimits: {
      gapAnalysesPerMonth: 5,
      contentIdeasPerMonth: 5,
      actionPlansPerMonth: 0,
      pagesPerMonth: 5,
      siteAuditsPerMonth: 2,
      pageRefreshDays: 0,
    },
    features: {
      manualChecks: true,
      dailyAutoCheck: true,
      hourlyAutoCheck: false,
      emailAlerts: true,
      weeklyReport: true,
      csvExport: true,

      geoScore: true,
      geoTips: true,
      citationGapAnalysis: true,
      citationGapFull: false,
      contentRecommendations: true,
      contentRecsUnlimited: false,
      weeklyActionPlan: false,

      customQueries: true,
      pageGeneration: true,
      schemaGeneration: true,
      entityOptimization: false,
      siteAudit: true,
      siteAuditFull: false,
      sprintFramework: true,
      monthlyCheckpoints: true,
    },
  },
  command: {
    id: "command",
    name: "Command",
    description: "Full GEO intelligence + maximum visibility",
    tagline: "The complete toolkit to win AI recommendations",
    whoIsThisFor: "Growing SaaS doing $5k-$50k MRR. Ready to maximize your AI citations.",
    monthlyPrice: 149,
    yearlyPrice: 119,
    popular: true,
    limits: {
      sites: 5,
      manualChecksPerDay: -1,

      historyDays: 365,
      queriesPerCheck: 20,
      customQueriesPerSite: -1,
      auditPagesPerSite: 100,
    },
    intelligenceLimits: {
      gapAnalysesPerMonth: -1,
      contentIdeasPerMonth: -1,
      actionPlansPerMonth: 4,
      pagesPerMonth: 25,
      siteAuditsPerMonth: -1,
      pageRefreshDays: 0,
    },
    features: {
      manualChecks: true,
      dailyAutoCheck: true,
      hourlyAutoCheck: true,
      emailAlerts: true,
      weeklyReport: true,
      csvExport: true,

      geoScore: true,
      geoTips: true,
      citationGapAnalysis: true,
      citationGapFull: true,
      contentRecommendations: true,
      contentRecsUnlimited: true,
      weeklyActionPlan: true,

      customQueries: true,
      pageGeneration: true,
      schemaGeneration: true,
      entityOptimization: true,
      siteAudit: true,
      siteAuditFull: true,
      sprintFramework: true,
      monthlyCheckpoints: true,
    },
  },
  dominate: {
    id: "dominate",
    name: "Dominate",
    description: "Own your category across every AI platform",
    tagline: "Scale GEO across all your brands",
    whoIsThisFor: "Agency or multi-product company. Win every AI conversation in your space.",
    monthlyPrice: 349,
    yearlyPrice: 279,
    limits: {
      sites: 25,
      manualChecksPerDay: -1,

      historyDays: 365,
      queriesPerCheck: 30,
      customQueriesPerSite: -1,
      auditPagesPerSite: 500,
    },
    intelligenceLimits: {
      gapAnalysesPerMonth: -1,
      contentIdeasPerMonth: -1,
      actionPlansPerMonth: -1,
      pagesPerMonth: -1,
      siteAuditsPerMonth: -1,
      pageRefreshDays: 0,
    },
    features: {
      manualChecks: true,
      dailyAutoCheck: true,
      hourlyAutoCheck: true,
      emailAlerts: true,
      weeklyReport: true,
      csvExport: true,

      geoScore: true,
      geoTips: true,
      citationGapAnalysis: true,
      citationGapFull: true,
      contentRecommendations: true,
      contentRecsUnlimited: true,
      weeklyActionPlan: true,

      customQueries: true,
      pageGeneration: true,
      schemaGeneration: true,
      entityOptimization: true,
      siteAudit: true,
      siteAuditFull: true,
      sprintFramework: true,
      monthlyCheckpoints: true,
    },
  },
};

// ============================================
// ACCESS HELPERS
// ============================================

export function canAccessProduct(
  planId: CitationPlanId | string,
  userEmail?: string | null,
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

  return {
    allowed: false,
    reason: "A subscription is required to access the dashboard. Choose a plan to get started.",
    upgradeRequired: true,
  };
}

// ============================================
// PLAN HELPERS
// ============================================

export function getCitationPlan(planId: CitationPlanId | string): CitationPlan {
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
  };
}

export function canRunManualCheck(
  planId: CitationPlanId | string,
  checksToday: number,
): { allowed: boolean; reason?: string } {
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

export function canRunSiteAudit(
  planId: CitationPlanId | string,
  usedThisMonth: number
): { allowed: boolean; reason?: string; remaining?: number } {
  const plan = getCitationPlan(planId);

  if (!plan.features.siteAudit) {
    return {
      allowed: false,
      reason: "Site GEO Audit requires Scout plan or higher.",
    };
  }

  const limit = plan.intelligenceLimits.siteAuditsPerMonth;

  if (limit === -1) {
    return { allowed: true, remaining: -1 };
  }

  if (usedThisMonth >= limit) {
    return {
      allowed: false,
      reason: `Monthly limit reached (${limit} audits). Upgrade for more.`,
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

// ============================================
// AUTO-GENERATION HELPERS
// ============================================

/** Get max pages to auto-generate per scan based on plan tier */
export function getAutoGenPerScan(planId: CitationPlanId | string): number {
  const plan = getCitationPlan(planId);
  if (plan.id === "dominate") return 10;
  if (plan.id === "command") return 5;
  if (plan.id === "scout") return 2;
  return 0;
}
