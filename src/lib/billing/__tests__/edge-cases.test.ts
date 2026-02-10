import { describe, it, expect } from "vitest";
import {
  canAddSite,
  canAddCompetitor,
  canRunManualCheck,
  canUseGapAnalysis,
  canUseContentRecommendations,
  canUseActionPlan,
  canUseCompetitorDeepDive,
  canGeneratePage,
  getCitationPlan,
  getCitationPlanLimits,
  getCitationPlanFeatures,
  canAccessProduct,
  checkTrialStatus,
  CITATION_PLANS,
} from "../citation-plans";

// ============================================
// canRunManualCheck + TRIAL EXPIRY INTERACTION
// ============================================

describe("canRunManualCheck + trial expiry interaction", () => {
  it("Free + active trial + 0 checks: allowed", () => {
    const activeDate = new Date();
    activeDate.setDate(activeDate.getDate() - 1);
    expect(canRunManualCheck("free", 0, activeDate).allowed).toBe(true);
  });

  it("Free + active trial + 2 checks: allowed", () => {
    const activeDate = new Date();
    activeDate.setDate(activeDate.getDate() - 3);
    expect(canRunManualCheck("free", 2, activeDate).allowed).toBe(true);
  });

  it("Free + active trial + 3 checks: DENIED (daily limit)", () => {
    const activeDate = new Date();
    activeDate.setDate(activeDate.getDate() - 1);
    const result = canRunManualCheck("free", 3, activeDate);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("Daily limit");
  });

  it("Free + EXPIRED trial + 0 checks: DENIED (trial expired, not daily limit)", () => {
    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() - 10);
    const result = canRunManualCheck("free", 0, expiredDate);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("trial");
  });

  it("Free + EXPIRED trial + 3 checks: DENIED (trial takes precedence)", () => {
    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() - 10);
    const result = canRunManualCheck("free", 3, expiredDate);
    expect(result.allowed).toBe(false);
    // Should mention trial, not daily limit (trial check comes first)
    expect(result.reason).toContain("trial");
  });

  it("Free + no createdAt + 0 checks: allowed (no trial check without date)", () => {
    expect(canRunManualCheck("free", 0).allowed).toBe(true);
  });

  it("Free + no createdAt + 3 checks: denied (daily limit only)", () => {
    const result = canRunManualCheck("free", 3);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("Daily limit");
  });

  it("Scout + expired trial date + 999 checks: allowed (paid = unlimited, no trial)", () => {
    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() - 100);
    expect(canRunManualCheck("scout", 999, expiredDate).allowed).toBe(true);
  });

  it("Command + any date + any checks: allowed", () => {
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

  it("canAddCompetitor('starter', 2) uses scout limits (3)", () => {
    expect(canAddCompetitor("starter", 2).allowed).toBe(true);
    expect(canAddCompetitor("starter", 3).allowed).toBe(false);
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

  it("canUseCompetitorDeepDive('pro') uses command (allowed)", () => {
    expect(canUseCompetitorDeepDive("pro").allowed).toBe(true);
  });

  it("canUseActionPlan('starter') uses scout (denied)", () => {
    expect(canUseActionPlan("starter", 0).allowed).toBe(false);
  });

  it("canGeneratePage('starter', 2) uses scout limits (3)", () => {
    expect(canGeneratePage("starter", 2).allowed).toBe(true);
    expect(canGeneratePage("starter", 3).allowed).toBe(false);
  });

  it("canGeneratePage('pro', 14) uses command limits (15)", () => {
    expect(canGeneratePage("pro", 14).allowed).toBe(true);
    expect(canGeneratePage("pro", 15).allowed).toBe(false);
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

  it("canAddCompetitor with unknown plan: free limits (0 competitors)", () => {
    expect(canAddCompetitor("nonexistent", 0).allowed).toBe(false);
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

  it("canUseCompetitorDeepDive with unknown plan: denied", () => {
    expect(canUseCompetitorDeepDive("nonexistent").allowed).toBe(false);
  });

  it("canGeneratePage with unknown plan: denied (free limits)", () => {
    expect(canGeneratePage("nonexistent", 0).allowed).toBe(false);
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
    const result = canGeneratePage("scout", 2);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(1);
  });

  it("canGeneratePage at exactly scout limit: denied", () => {
    const result = canGeneratePage("scout", 3);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("canGeneratePage at exactly command limit - 1: allowed", () => {
    const result = canGeneratePage("command", 14);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(1);
  });

  it("canGeneratePage at exactly command limit: denied", () => {
    const result = canGeneratePage("command", 15);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("canGeneratePage way over limit: still denied", () => {
    expect(canGeneratePage("scout", 100).allowed).toBe(false);
    expect(canGeneratePage("command", 1000).allowed).toBe(false);
  });
});

// ============================================
// TRIAL BOUNDARY: DAY 7 IS THE EXACT CUTOFF
// ============================================

describe("Trial expiry boundary precision", () => {
  it("Day 6 (144 hours): not expired", () => {
    const date = new Date();
    date.setDate(date.getDate() - 6);
    const result = checkTrialStatus(date);
    expect(result.expired).toBe(false);
    expect(result.daysRemaining).toBe(1);
  });

  it("Day 7 (168 hours): expired", () => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    const result = checkTrialStatus(date);
    expect(result.expired).toBe(true);
    expect(result.daysRemaining).toBe(0);
  });

  it("canAccessProduct at day 6: allowed", () => {
    const date = new Date();
    date.setDate(date.getDate() - 6);
    expect(canAccessProduct("free", date).allowed).toBe(true);
  });

  it("canAccessProduct at day 7: denied", () => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    const result = canAccessProduct("free", date);
    expect(result.allowed).toBe(false);
    expect(result.upgradeRequired).toBe(true);
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

  it("canAddCompetitor denial for free mentions Scout", () => {
    const result = canAddCompetitor("free", 0);
    expect(result.reason).toContain("Scout");
  });

  it("canAddCompetitor denial for paid mentions limit", () => {
    const result = canAddCompetitor("scout", 3);
    expect(result.reason).toContain("3");
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

  it("canUseCompetitorDeepDive denial mentions Command", () => {
    const result = canUseCompetitorDeepDive("scout");
    expect(result.reason).toContain("Command");
  });

  it("canGeneratePage denial for free mentions Scout", () => {
    const result = canGeneratePage("free", 0);
    expect(result.reason).toContain("Scout");
  });

  it("canGeneratePage denial at limit mentions monthly limit", () => {
    const result = canGeneratePage("scout", 3);
    expect(result.reason).toContain("Monthly limit");
  });

  it("canGeneratePage denial at limit mentions page count", () => {
    const result = canGeneratePage("command", 15);
    expect(result.reason).toContain("15");
  });

  it("trial expired message mentions trial days", () => {
    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() - 10);
    const result = canAccessProduct("free", expiredDate);
    expect(result.reason).toContain("7-day");
    expect(result.reason).toContain("trial");
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

  it("Scout: page generation with 3/month limit", () => {
    expect(CITATION_PLANS.scout.features.pageGeneration).toBe(true);
    expect(CITATION_PLANS.scout.intelligenceLimits.pagesPerMonth).toBe(3);
  });

  it("Command: page generation with 15/month limit", () => {
    expect(CITATION_PLANS.command.features.pageGeneration).toBe(true);
    expect(CITATION_PLANS.command.intelligenceLimits.pagesPerMonth).toBe(15);
  });

  it("Dominate: unlimited page generation", () => {
    expect(CITATION_PLANS.dominate.features.pageGeneration).toBe(true);
    expect(CITATION_PLANS.dominate.intelligenceLimits.pagesPerMonth).toBe(-1);
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
  it("Free: no email alerts, no realtime alerts", () => {
    expect(CITATION_PLANS.free.features.emailAlerts).toBe(false);
    expect(CITATION_PLANS.free.features.realtimeAlerts).toBe(false);
  });

  it("Scout: email alerts, no realtime", () => {
    expect(CITATION_PLANS.scout.features.emailAlerts).toBe(true);
    expect(CITATION_PLANS.scout.features.realtimeAlerts).toBe(false);
  });

  it("Command: email alerts, no realtime", () => {
    expect(CITATION_PLANS.command.features.emailAlerts).toBe(true);
    expect(CITATION_PLANS.command.features.realtimeAlerts).toBe(false);
  });

  it("Dominate: email alerts, no realtime (not yet shipped)", () => {
    expect(CITATION_PLANS.dominate.features.emailAlerts).toBe(true);
    expect(CITATION_PLANS.dominate.features.realtimeAlerts).toBe(false);
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
