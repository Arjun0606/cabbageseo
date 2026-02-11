import { describe, it, expect } from "vitest";
import {
  canAddSite,
  canRunManualCheck,
  canUseGapAnalysis,
  canUseContentRecommendations,
  canUseActionPlan,
  canGeneratePage,
  canRunSiteAudit,
  getCitationPlan,
  getCitationPlanLimits,
  getCitationPlanFeatures,
  canAccessProduct,
  getRefreshFrequencyDays,
  getRefreshFrequencyLabel,
  CITATION_PLANS,
} from "../citation-plans";

// ============================================
// canRunManualCheck (no more trial — free = daily limit only)
// ============================================

describe("canRunManualCheck — free plan daily limit", () => {
  it("Free + 0 checks: allowed", () => {
    expect(canRunManualCheck("free", 0).allowed).toBe(true);
  });

  it("Free + 2 checks: allowed", () => {
    expect(canRunManualCheck("free", 2).allowed).toBe(true);
  });

  it("Free + 3 checks: DENIED (daily limit)", () => {
    const result = canRunManualCheck("free", 3);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("Daily limit");
  });

  it("Scout + 999 checks: allowed (paid = unlimited)", () => {
    expect(canRunManualCheck("scout", 999).allowed).toBe(true);
  });

  it("Command + any checks: allowed", () => {
    expect(canRunManualCheck("command", 999999).allowed).toBe(true);
  });
});

// ============================================
// LEGACY PLAN NAMES IN GATING FUNCTIONS
// ============================================

describe("Legacy plan names in gating functions", () => {
  it("canAddSite('starter', 0) uses scout limits (1 site)", () => {
    expect(canAddSite("starter", 0).allowed).toBe(true);
    expect(canAddSite("starter", 1).allowed).toBe(false);
  });

  it("canAddSite('pro', 4) uses command limits (5 sites)", () => {
    expect(canAddSite("pro", 4).allowed).toBe(true);
    expect(canAddSite("pro", 5).allowed).toBe(false);
  });

  it("canAddSite('pro_plus', 24) uses dominate limits (25 sites)", () => {
    expect(canAddSite("pro_plus", 24).allowed).toBe(true);
    expect(canAddSite("pro_plus", 25).allowed).toBe(false);
  });

  it("canRunManualCheck('starter', 999) is unlimited (scout)", () => {
    expect(canRunManualCheck("starter", 999).allowed).toBe(true);
  });

  it("canUseGapAnalysis('starter', 4) uses scout limit (5)", () => {
    expect(canUseGapAnalysis("starter", 4).allowed).toBe(true);
    expect(canUseGapAnalysis("starter", 5).allowed).toBe(false);
  });

  it("canUseActionPlan('pro') uses command (allowed)", () => {
    expect(canUseActionPlan("pro", 0).allowed).toBe(true);
  });

  it("canUseActionPlan('starter') uses scout (denied)", () => {
    expect(canUseActionPlan("starter", 0).allowed).toBe(false);
  });

  it("canGeneratePage('starter', 4) uses scout limits (5)", () => {
    expect(canGeneratePage("starter", 4).allowed).toBe(true);
    expect(canGeneratePage("starter", 5).allowed).toBe(false);
  });

  it("canGeneratePage('pro', 24) uses command limits (25)", () => {
    expect(canGeneratePage("pro", 24).allowed).toBe(true);
    expect(canGeneratePage("pro", 25).allowed).toBe(false);
  });

  it("canGeneratePage('pro_plus', 999) uses dominate (unlimited)", () => {
    expect(canGeneratePage("pro_plus", 999).allowed).toBe(true);
    expect(canGeneratePage("pro_plus", 999).remaining).toBe(-1);
  });
});

// ============================================
// UNKNOWN PLAN NAMES (FALLBACK TO FREE)
// ============================================

describe("Unknown plan names fall back to free", () => {
  it("canAddSite with unknown plan: free limits (1 site)", () => {
    expect(canAddSite("nonexistent", 0).allowed).toBe(true);
    expect(canAddSite("nonexistent", 1).allowed).toBe(false);
  });

  it("canRunManualCheck with unknown plan: free limits (3/day)", () => {
    expect(canRunManualCheck("nonexistent", 2).allowed).toBe(true);
    expect(canRunManualCheck("nonexistent", 3).allowed).toBe(false);
  });

  it("canUseGapAnalysis with unknown plan: denied", () => {
    expect(canUseGapAnalysis("nonexistent", 0).allowed).toBe(false);
  });

  it("canUseContentRecommendations with unknown plan: denied", () => {
    expect(canUseContentRecommendations("nonexistent", 0).allowed).toBe(false);
  });

  it("canUseActionPlan with unknown plan: denied", () => {
    expect(canUseActionPlan("nonexistent", 0).allowed).toBe(false);
  });

  it("canGeneratePage with unknown plan: denied (free limits)", () => {
    expect(canGeneratePage("nonexistent", 0).allowed).toBe(false);
  });

  it("canRunSiteAudit with unknown plan: denied (free limits)", () => {
    expect(canRunSiteAudit("nonexistent", 0).allowed).toBe(false);
  });
});

// ============================================
// BOUNDARY VALUES
// ============================================

describe("Boundary values", () => {
  it("canAddSite at exactly limit - 1: allowed", () => {
    expect(canAddSite("command", 4).allowed).toBe(true);
    expect(canAddSite("dominate", 24).allowed).toBe(true);
  });

  it("canAddSite at exactly limit: denied", () => {
    expect(canAddSite("command", 5).allowed).toBe(false);
    expect(canAddSite("dominate", 25).allowed).toBe(false);
  });

  it("canAddSite way over limit: still denied", () => {
    expect(canAddSite("scout", 100).allowed).toBe(false);
    expect(canAddSite("command", 1000).allowed).toBe(false);
  });

  it("canRunManualCheck at exactly daily limit - 1: allowed", () => {
    expect(canRunManualCheck("free", 2).allowed).toBe(true);
  });

  it("canRunManualCheck at exactly daily limit: denied", () => {
    expect(canRunManualCheck("free", 3).allowed).toBe(false);
  });

  it("canUseGapAnalysis at exactly monthly limit - 1: allowed", () => {
    const result = canUseGapAnalysis("scout", 4);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(1);
  });

  it("canUseGapAnalysis at exactly monthly limit: denied", () => {
    const result = canUseGapAnalysis("scout", 5);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("canUseContentRecommendations at exactly monthly limit - 1: allowed", () => {
    const result = canUseContentRecommendations("scout", 4);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(1);
  });

  it("canUseContentRecommendations at exactly monthly limit: denied", () => {
    const result = canUseContentRecommendations("scout", 5);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("canGeneratePage at exactly scout limit - 1: allowed", () => {
    const result = canGeneratePage("scout", 4);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(1);
  });

  it("canGeneratePage at exactly scout limit: denied", () => {
    const result = canGeneratePage("scout", 5);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("canGeneratePage at exactly command limit - 1: allowed", () => {
    const result = canGeneratePage("command", 24);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(1);
  });

  it("canGeneratePage at exactly command limit: denied", () => {
    const result = canGeneratePage("command", 25);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("canGeneratePage way over limit: still denied", () => {
    expect(canGeneratePage("scout", 100).allowed).toBe(false);
    expect(canGeneratePage("command", 1000).allowed).toBe(false);
  });
});

// ============================================
// FREE PLAN ACCESS (no more trial)
// ============================================

describe("Free plan access — always denied", () => {
  it("Free plan: denied regardless of date", () => {
    const result = canAccessProduct("free");
    expect(result.allowed).toBe(false);
    expect(result.upgradeRequired).toBe(true);
  });

  it("Free plan with recent date: still denied", () => {
    const result = canAccessProduct("free");
    expect(result.allowed).toBe(false);
  });

  it("Paid plans: always allowed", () => {
    expect(canAccessProduct("scout").allowed).toBe(true);
    expect(canAccessProduct("command").allowed).toBe(true);
    expect(canAccessProduct("dominate").allowed).toBe(true);
  });
});

// ============================================
// CUSTOM QUERIES PER SITE LIMITS
// ============================================

describe("Custom queries per site limits", () => {
  it("Free: 0 custom queries", () => {
    expect(CITATION_PLANS.free.limits.customQueriesPerSite).toBe(0);
    expect(CITATION_PLANS.free.features.customQueries).toBe(false);
  });

  it("Scout: 5 custom queries", () => {
    expect(CITATION_PLANS.scout.limits.customQueriesPerSite).toBe(5);
    expect(CITATION_PLANS.scout.features.customQueries).toBe(true);
  });

  it("Command: unlimited custom queries", () => {
    expect(CITATION_PLANS.command.limits.customQueriesPerSite).toBe(-1);
    expect(CITATION_PLANS.command.features.customQueries).toBe(true);
  });

  it("Dominate: unlimited custom queries", () => {
    expect(CITATION_PLANS.dominate.limits.customQueriesPerSite).toBe(-1);
    expect(CITATION_PLANS.dominate.features.customQueries).toBe(true);
  });
});

// ============================================
// QUERIES PER CHECK LIMITS
// ============================================

describe("Queries per check limits", () => {
  it("Free: 3 queries per check", () => {
    expect(CITATION_PLANS.free.limits.queriesPerCheck).toBe(3);
  });

  it("Scout: 10 queries per check", () => {
    expect(CITATION_PLANS.scout.limits.queriesPerCheck).toBe(10);
  });

  it("Command: 20 queries per check", () => {
    expect(CITATION_PLANS.command.limits.queriesPerCheck).toBe(20);
  });

  it("Dominate: 30 queries per check", () => {
    expect(CITATION_PLANS.dominate.limits.queriesPerCheck).toBe(30);
  });
});

// ============================================
// HISTORY DAYS LIMITS
// ============================================

describe("History days limits", () => {
  it("Free: 7 days history", () => {
    expect(CITATION_PLANS.free.limits.historyDays).toBe(7);
  });

  it("Scout: 30 days history", () => {
    expect(CITATION_PLANS.scout.limits.historyDays).toBe(30);
  });

  it("Command: 365 days history", () => {
    expect(CITATION_PLANS.command.limits.historyDays).toBe(365);
  });

  it("Dominate: 365 days history", () => {
    expect(CITATION_PLANS.dominate.limits.historyDays).toBe(365);
  });
});

// ============================================
// DENIAL MESSAGES CONTAIN USEFUL INFO
// ============================================

describe("Denial messages are user-friendly", () => {
  it("canAddSite denial mentions limit number", () => {
    const result = canAddSite("scout", 1);
    expect(result.reason).toContain("1");
    expect(result.reason).toContain("Upgrade");
  });

  it("canRunManualCheck denial mentions daily limit", () => {
    const result = canRunManualCheck("free", 3);
    expect(result.reason).toContain("Daily limit");
    expect(result.reason).toContain("3");
  });

  it("canUseGapAnalysis denial for free mentions Scout", () => {
    const result = canUseGapAnalysis("free", 0);
    expect(result.reason).toContain("Scout");
  });

  it("canUseGapAnalysis denial at limit mentions monthly limit", () => {
    const result = canUseGapAnalysis("scout", 5);
    expect(result.reason).toContain("Monthly limit");
    expect(result.reason).toContain("Command");
  });

  it("canUseActionPlan denial mentions Command", () => {
    const result = canUseActionPlan("free", 0);
    expect(result.reason).toContain("Command");
  });

  it("canGeneratePage denial for free mentions Scout", () => {
    const result = canGeneratePage("free", 0);
    expect(result.reason).toContain("Scout");
  });

  it("canGeneratePage denial at limit mentions monthly limit", () => {
    const result = canGeneratePage("scout", 5);
    expect(result.reason).toContain("Monthly limit");
  });

  it("canGeneratePage denial at limit mentions page count", () => {
    const result = canGeneratePage("command", 25);
    expect(result.reason).toContain("25");
  });

  it("canRunSiteAudit denial for free mentions Scout", () => {
    const result = canRunSiteAudit("free", 0);
    expect(result.reason).toContain("Scout");
  });

  it("canRunSiteAudit denial at limit mentions monthly limit", () => {
    const result = canRunSiteAudit("scout", 2);
    expect(result.reason).toContain("Monthly limit");
  });

  it("free plan denied message mentions subscription", () => {
    const result = canAccessProduct("free");
    expect(result.reason).toContain("subscription");
  });
});

// ============================================
// PAGE GENERATION FEATURES PER TIER
// ============================================

describe("Page generation features per tier", () => {
  it("Free: no page generation", () => {
    expect(CITATION_PLANS.free.features.pageGeneration).toBe(false);
    expect(CITATION_PLANS.free.intelligenceLimits.pagesPerMonth).toBe(0);
  });

  it("Scout: page generation with 5/month limit", () => {
    expect(CITATION_PLANS.scout.features.pageGeneration).toBe(true);
    expect(CITATION_PLANS.scout.intelligenceLimits.pagesPerMonth).toBe(5);
  });

  it("Command: page generation with 25/month limit", () => {
    expect(CITATION_PLANS.command.features.pageGeneration).toBe(true);
    expect(CITATION_PLANS.command.intelligenceLimits.pagesPerMonth).toBe(25);
  });

  it("Dominate: unlimited page generation", () => {
    expect(CITATION_PLANS.dominate.features.pageGeneration).toBe(true);
    expect(CITATION_PLANS.dominate.intelligenceLimits.pagesPerMonth).toBe(-1);
  });
});

// ============================================
// SITE GEO AUDIT FEATURES PER TIER
// ============================================

describe("Site GEO audit features per tier", () => {
  it("Free: no site audit", () => {
    expect(CITATION_PLANS.free.features.siteAudit).toBe(false);
    expect(CITATION_PLANS.free.intelligenceLimits.siteAuditsPerMonth).toBe(0);
  });

  it("Scout: basic site audit (top 10 pages), 2/month", () => {
    expect(CITATION_PLANS.scout.features.siteAudit).toBe(true);
    expect(CITATION_PLANS.scout.features.siteAuditFull).toBe(false);
    expect(CITATION_PLANS.scout.limits.auditPagesPerSite).toBe(10);
    expect(CITATION_PLANS.scout.intelligenceLimits.siteAuditsPerMonth).toBe(2);
  });

  it("Command: full site audit (100 pages), unlimited", () => {
    expect(CITATION_PLANS.command.features.siteAudit).toBe(true);
    expect(CITATION_PLANS.command.features.siteAuditFull).toBe(true);
    expect(CITATION_PLANS.command.limits.auditPagesPerSite).toBe(100);
    expect(CITATION_PLANS.command.intelligenceLimits.siteAuditsPerMonth).toBe(-1);
  });

  it("Dominate: full site audit (500 pages), unlimited", () => {
    expect(CITATION_PLANS.dominate.features.siteAudit).toBe(true);
    expect(CITATION_PLANS.dominate.features.siteAuditFull).toBe(true);
    expect(CITATION_PLANS.dominate.limits.auditPagesPerSite).toBe(500);
    expect(CITATION_PLANS.dominate.intelligenceLimits.siteAuditsPerMonth).toBe(-1);
  });
});

// ============================================
// SPRINT/CHECKPOINT FEATURES PER TIER
// ============================================

describe("Sprint and checkpoint features per tier", () => {
  it("Free: no sprint, no checkpoints", () => {
    expect(CITATION_PLANS.free.features.sprintFramework).toBe(false);
    expect(CITATION_PLANS.free.features.monthlyCheckpoints).toBe(false);
  });

  it("Scout: has sprint + checkpoints", () => {
    expect(CITATION_PLANS.scout.features.sprintFramework).toBe(true);
    expect(CITATION_PLANS.scout.features.monthlyCheckpoints).toBe(true);
  });

  it("Command: has sprint + checkpoints", () => {
    expect(CITATION_PLANS.command.features.sprintFramework).toBe(true);
    expect(CITATION_PLANS.command.features.monthlyCheckpoints).toBe(true);
  });

  it("Dominate: has sprint + checkpoints", () => {
    expect(CITATION_PLANS.dominate.features.sprintFramework).toBe(true);
    expect(CITATION_PLANS.dominate.features.monthlyCheckpoints).toBe(true);
  });
});

// ============================================
// ALERT FEATURES PER TIER
// ============================================

describe("Alert features per tier", () => {
  it("Free: no email alerts", () => {
    expect(CITATION_PLANS.free.features.emailAlerts).toBe(false);
  });

  it("Scout: email alerts", () => {
    expect(CITATION_PLANS.scout.features.emailAlerts).toBe(true);
  });

  it("Command: email alerts", () => {
    expect(CITATION_PLANS.command.features.emailAlerts).toBe(true);
  });

  it("Dominate: email alerts", () => {
    expect(CITATION_PLANS.dominate.features.emailAlerts).toBe(true);
  });
});

// ============================================
// AUTO-CHECK FREQUENCY PER TIER
// ============================================

describe("Auto-check frequency per tier", () => {
  it("Free: no auto-checks", () => {
    expect(CITATION_PLANS.free.features.dailyAutoCheck).toBe(false);
    expect(CITATION_PLANS.free.features.hourlyAutoCheck).toBe(false);
  });

  it("Scout: daily only", () => {
    expect(CITATION_PLANS.scout.features.dailyAutoCheck).toBe(true);
    expect(CITATION_PLANS.scout.features.hourlyAutoCheck).toBe(false);
  });

  it("Command: daily + hourly", () => {
    expect(CITATION_PLANS.command.features.dailyAutoCheck).toBe(true);
    expect(CITATION_PLANS.command.features.hourlyAutoCheck).toBe(true);
  });

  it("Dominate: daily + hourly", () => {
    expect(CITATION_PLANS.dominate.features.dailyAutoCheck).toBe(true);
    expect(CITATION_PLANS.dominate.features.hourlyAutoCheck).toBe(true);
  });
});

// ============================================
// canRunSiteAudit GATING
// ============================================

describe("canRunSiteAudit gating", () => {
  it("Free: denied", () => {
    expect(canRunSiteAudit("free", 0).allowed).toBe(false);
  });

  it("Scout: allowed if under limit (2/month)", () => {
    expect(canRunSiteAudit("scout", 0).allowed).toBe(true);
    expect(canRunSiteAudit("scout", 1).allowed).toBe(true);
    expect(canRunSiteAudit("scout", 1).remaining).toBe(1);
  });

  it("Scout: denied at limit", () => {
    expect(canRunSiteAudit("scout", 2).allowed).toBe(false);
    expect(canRunSiteAudit("scout", 2).remaining).toBe(0);
  });

  it("Command: always allowed (unlimited)", () => {
    expect(canRunSiteAudit("command", 999).allowed).toBe(true);
    expect(canRunSiteAudit("command", 999).remaining).toBe(-1);
  });

  it("Dominate: always allowed (unlimited)", () => {
    expect(canRunSiteAudit("dominate", 999).allowed).toBe(true);
  });
});

// ============================================
// PAGE REFRESH FREQUENCY PER TIER
// ============================================

describe("Page refresh frequency per tier", () => {
  it("Unsubscribed: no auto-refresh (0 days)", () => {
    expect(CITATION_PLANS.free.intelligenceLimits.pageRefreshDays).toBe(0);
    expect(getRefreshFrequencyDays("free")).toBe(0);
  });

  it("Scout: monthly refresh (30 days)", () => {
    expect(CITATION_PLANS.scout.intelligenceLimits.pageRefreshDays).toBe(30);
    expect(getRefreshFrequencyDays("scout")).toBe(30);
  });

  it("Command: bi-weekly refresh (14 days)", () => {
    expect(CITATION_PLANS.command.intelligenceLimits.pageRefreshDays).toBe(14);
    expect(getRefreshFrequencyDays("command")).toBe(14);
  });

  it("Dominate: weekly refresh (7 days)", () => {
    expect(CITATION_PLANS.dominate.intelligenceLimits.pageRefreshDays).toBe(7);
    expect(getRefreshFrequencyDays("dominate")).toBe(7);
  });

  it("Legacy plan names resolve correctly", () => {
    expect(getRefreshFrequencyDays("starter")).toBe(30);
    expect(getRefreshFrequencyDays("pro")).toBe(14);
    expect(getRefreshFrequencyDays("pro_plus")).toBe(7);
  });

  it("Unknown plan falls back to unsubscribed (0 days)", () => {
    expect(getRefreshFrequencyDays("nonexistent")).toBe(0);
  });
});

describe("getRefreshFrequencyLabel", () => {
  it("Unsubscribed: 'No auto-refresh'", () => {
    expect(getRefreshFrequencyLabel("free")).toBe("No auto-refresh");
  });

  it("Scout: 'Monthly'", () => {
    expect(getRefreshFrequencyLabel("scout")).toBe("Monthly");
  });

  it("Command: 'Every 2 weeks'", () => {
    expect(getRefreshFrequencyLabel("command")).toBe("Every 2 weeks");
  });

  it("Dominate: 'Weekly'", () => {
    expect(getRefreshFrequencyLabel("dominate")).toBe("Weekly");
  });
});
