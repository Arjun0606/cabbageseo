/**
 * AI Visibility Intelligence Pricing Plans
 *
 * PRICING (Feb 2026) — GEO-First Product
 *
 * No Plan: Free teaser scan only (blocked from dashboard)
 * Scout ($49/mo): Monitor + start fixing your AI visibility
 * Command ($149/mo): Full GEO intelligence + maximum coverage
 * Dominate ($349/mo): Maximum coverage, highest limits
 *
 * Key gating dimensions:
 * 1. Queries tracked (10 → 25 → 50)
 * 2. Fix pages per month (5 → 25 → 50)
 * 3. Intelligence depth (gap analyses, content ideas, action plans)
 * 4. Scan frequency (daily → daily → 2x/day)
 * 5. History retention (30 days → 365 → 365)
 */

export type CitationPlanId = "free" | "scout" | "command" | "dominate";

export interface CitationPlanLimits {
  sites: number;
  manualChecksPerDay: number;        // -1 = unlimited
  historyDays: number;
  queriesPerCheck: number;           // Total queries tracked per scan
  customQueriesPerSite: number;      // Subset of queriesPerCheck that can be user-defined
  auditPagesPerSite: number;         // How many pages per site audit crawl
}

export interface CitationPlanFeatures {
  // Monitoring
  manualChecks: boolean;
  dailyAutoCheck: boolean;
  twiceDailyAutoCheck: boolean;      // 2x/day scans (Dominate only)
  emailAlerts: boolean;
  weeklyReport: boolean;
  csvExport: boolean;

  // Scoring
  geoScore: boolean;
  geoTips: boolean;

  // Intelligence
  citationGapAnalysis: boolean;
  contentRecommendations: boolean;
  weeklyActionPlan: boolean;
  customQueries: boolean;

  // Fix Pages
  pageGeneration: boolean;
  schemaGeneration: boolean;

  // Site GEO Audit
  siteAudit: boolean;
  siteAuditFull: boolean;            // Full crawl (vs top-10 only)
}

export interface CitationIntelligenceLimits {
  gapAnalysesPerMonth: number;       // 0 = not available
  contentIdeasPerMonth: number;      // 0 = not available
  actionPlansPerMonth: number;       // 0 = not available
  pagesPerMonth: number;             // 0 = not available
  siteAuditsPerMonth: number;        // 0 = not available
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
    },
    features: {
      manualChecks: true,
      dailyAutoCheck: false,
      twiceDailyAutoCheck: false,
      emailAlerts: false,
      weeklyReport: false,
      csvExport: false,
      geoScore: true,
      geoTips: false,
      citationGapAnalysis: false,
      contentRecommendations: false,
      weeklyActionPlan: false,
      customQueries: false,
      pageGeneration: false,
      schemaGeneration: false,
      siteAudit: false,
      siteAuditFull: false,
    },
  },
  scout: {
    id: "scout",
    name: "Scout",
    description: "See where you stand and start fixing gaps",
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
      contentIdeasPerMonth: 3,
      actionPlansPerMonth: 0,
      pagesPerMonth: 5,
      siteAuditsPerMonth: 2,
    },
    features: {
      manualChecks: true,
      dailyAutoCheck: true,
      twiceDailyAutoCheck: false,
      emailAlerts: true,
      weeklyReport: true,
      csvExport: false,
      geoScore: true,
      geoTips: true,
      citationGapAnalysis: true,
      contentRecommendations: true,
      weeklyActionPlan: false,
      customQueries: true,
      pageGeneration: true,
      schemaGeneration: true,
      siteAudit: true,
      siteAuditFull: false,
    },
  },
  command: {
    id: "command",
    name: "Command",
    description: "Full GEO intelligence with maximum coverage",
    tagline: "The complete toolkit for AI visibility",
    whoIsThisFor: "Growing business ready to maximize AI citations with deep intelligence.",
    monthlyPrice: 149,
    yearlyPrice: 119,
    popular: true,
    limits: {
      sites: 1,
      manualChecksPerDay: -1,
      historyDays: 365,
      queriesPerCheck: 25,
      customQueriesPerSite: 15,
      auditPagesPerSite: 100,
    },
    intelligenceLimits: {
      gapAnalysesPerMonth: 15,
      contentIdeasPerMonth: 10,
      actionPlansPerMonth: 4,
      pagesPerMonth: 25,
      siteAuditsPerMonth: 4,
    },
    features: {
      manualChecks: true,
      dailyAutoCheck: true,
      twiceDailyAutoCheck: false,
      emailAlerts: true,
      weeklyReport: true,
      csvExport: true,
      geoScore: true,
      geoTips: true,
      citationGapAnalysis: true,
      contentRecommendations: true,
      weeklyActionPlan: true,
      customQueries: true,
      pageGeneration: true,
      schemaGeneration: true,
      siteAudit: true,
      siteAuditFull: true,
    },
  },
  dominate: {
    id: "dominate",
    name: "Dominate",
    description: "Maximum coverage, highest limits, nothing held back",
    tagline: "Maximum AI visibility for your brand",
    whoIsThisFor: "Serious about owning your space in AI. Highest query coverage and content volume.",
    monthlyPrice: 349,
    yearlyPrice: 279,
    limits: {
      sites: 1,
      manualChecksPerDay: -1,
      historyDays: 365,
      queriesPerCheck: 50,
      customQueriesPerSite: 30,
      auditPagesPerSite: 500,
    },
    intelligenceLimits: {
      gapAnalysesPerMonth: 30,
      contentIdeasPerMonth: 20,
      actionPlansPerMonth: 8,
      pagesPerMonth: 50,
      siteAuditsPerMonth: 4,
    },
    features: {
      manualChecks: true,
      dailyAutoCheck: true,
      twiceDailyAutoCheck: true,
      emailAlerts: true,
      weeklyReport: true,
      csvExport: true,
      geoScore: true,
      geoTips: true,
      citationGapAnalysis: true,
      contentRecommendations: true,
      weeklyActionPlan: true,
      customQueries: true,
      pageGeneration: true,
      schemaGeneration: true,
      siteAudit: true,
      siteAuditFull: true,
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
        : `${intel.gapAnalysesPerMonth} analyses/month`,
    contentIdeas:
      intel.contentIdeasPerMonth === 0
        ? "Not available"
        : `${intel.contentIdeasPerMonth} ideas/month`,
    actionPlan: !plan.features.weeklyActionPlan
      ? "Not available"
      : `${intel.actionPlansPerMonth} plans/month`,
  };
}

// ============================================
// LIMIT CHECKS
// ============================================

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
      reason: "You can track 1 site per subscription. To switch sites, update your site in Settings.",
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
    return { allowed: false, reason: "Gap analysis requires Scout plan or higher." };
  }

  if (limit === -1) {
    return { allowed: true, remaining: -1 };
  }

  if (usedThisMonth >= limit) {
    const next = getNextPlan(plan.id);
    const tip = next ? ` Upgrade to ${getCitationPlan(next).name} for more.` : "";
    return { allowed: false, reason: `Monthly limit reached (${limit} analyses).${tip}`, remaining: 0 };
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
    return { allowed: false, reason: "Content ideas require Scout plan or higher." };
  }

  if (limit === -1) {
    return { allowed: true, remaining: -1 };
  }

  if (usedThisMonth >= limit) {
    return { allowed: false, reason: `Monthly limit reached (${limit} ideas). Upgrade for more.`, remaining: 0 };
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
    return { allowed: false, reason: "Action plans require Command plan or higher." };
  }

  if (limit === -1) {
    return { allowed: true, remaining: -1 };
  }

  if (usedThisMonth >= limit) {
    return { allowed: false, reason: `Monthly limit reached (${limit} plans). Upgrade for more.`, remaining: 0 };
  }

  return { allowed: true, remaining: limit - usedThisMonth };
}

export function canGeneratePage(
  planId: CitationPlanId | string,
  usedThisMonth: number
): { allowed: boolean; reason?: string; remaining?: number } {
  const plan = getCitationPlan(planId);

  if (!plan.features.pageGeneration) {
    return { allowed: false, reason: "Fix pages require Scout plan or higher." };
  }

  const limit = plan.intelligenceLimits.pagesPerMonth;

  if (limit === -1) {
    return { allowed: true, remaining: -1 };
  }

  if (usedThisMonth >= limit) {
    return { allowed: false, reason: `Monthly limit reached (${limit} pages). Upgrade for more.`, remaining: 0 };
  }

  return { allowed: true, remaining: limit - usedThisMonth };
}

export function canRunSiteAudit(
  planId: CitationPlanId | string,
  usedThisMonth: number
): { allowed: boolean; reason?: string; remaining?: number } {
  const plan = getCitationPlan(planId);

  if (!plan.features.siteAudit) {
    return { allowed: false, reason: "Site GEO Audit requires Scout plan or higher." };
  }

  const limit = plan.intelligenceLimits.siteAuditsPerMonth;

  if (limit === -1) {
    return { allowed: true, remaining: -1 };
  }

  if (usedThisMonth >= limit) {
    return { allowed: false, reason: `Monthly limit reached (${limit} audits). Upgrade for more.`, remaining: 0 };
  }

  return { allowed: true, remaining: limit - usedThisMonth };
}

// ============================================
// UPGRADE HELPERS
// ============================================

const PLAN_ORDER: CitationPlanId[] = ["free", "scout", "command", "dominate"];

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
