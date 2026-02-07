import { describe, it, expect } from "vitest";
import {
  CITATION_PLANS,
  getCitationPlan,
  getCitationPlanLimits,
  getCitationPlanFeatures,
  isPaidPlan,
  formatLimit,
  getIntelligenceFeatureSummary,
  type CitationPlanId,
} from "../citation-plans";

const TIERS: CitationPlanId[] = ["free", "scout", "command", "dominate"];

// ============================================
// PRICING CORRECTNESS
// ============================================

describe("Pricing correctness", () => {
  it("Free tier is $0/$0", () => {
    expect(CITATION_PLANS.free.monthlyPrice).toBe(0);
    expect(CITATION_PLANS.free.yearlyPrice).toBe(0);
  });

  it("Scout tier is $49/mo, $39/yr", () => {
    expect(CITATION_PLANS.scout.monthlyPrice).toBe(49);
    expect(CITATION_PLANS.scout.yearlyPrice).toBe(39);
  });

  it("Command tier is $149/mo, $119/yr", () => {
    expect(CITATION_PLANS.command.monthlyPrice).toBe(149);
    expect(CITATION_PLANS.command.yearlyPrice).toBe(119);
  });

  it("Dominate tier is $349/mo, $279/yr", () => {
    expect(CITATION_PLANS.dominate.monthlyPrice).toBe(349);
    expect(CITATION_PLANS.dominate.yearlyPrice).toBe(279);
  });

  it("annual price < monthly price for all paid plans", () => {
    for (const tier of ["scout", "command", "dominate"] as CitationPlanId[]) {
      expect(CITATION_PLANS[tier].yearlyPrice).toBeLessThan(
        CITATION_PLANS[tier].monthlyPrice
      );
    }
  });

  it("prices increase with each tier", () => {
    expect(CITATION_PLANS.scout.monthlyPrice).toBeGreaterThan(CITATION_PLANS.free.monthlyPrice);
    expect(CITATION_PLANS.command.monthlyPrice).toBeGreaterThan(CITATION_PLANS.scout.monthlyPrice);
    expect(CITATION_PLANS.dominate.monthlyPrice).toBeGreaterThan(CITATION_PLANS.command.monthlyPrice);
  });
});

// ============================================
// LIMIT ESCALATION
// ============================================

describe("Limit escalation (higher tier >= lower tier)", () => {
  // Helper: treat -1 as infinity for comparison
  function effectiveLimit(val: number): number {
    return val === -1 ? Infinity : val;
  }

  const limitKeys: (keyof typeof CITATION_PLANS.free.limits)[] = [
    "sites",
    "manualChecksPerDay",
    "competitors",
    "historyDays",
    "teamMembers",
    "queriesPerCheck",
    "customQueriesPerSite",
  ];

  for (const key of limitKeys) {
    it(`${key}: free <= scout <= command <= dominate`, () => {
      const values = TIERS.map((t) => effectiveLimit(CITATION_PLANS[t].limits[key]));
      for (let i = 1; i < values.length; i++) {
        expect(values[i]).toBeGreaterThanOrEqual(values[i - 1]);
      }
    });
  }

  const intelligenceKeys: (keyof typeof CITATION_PLANS.free.intelligenceLimits)[] = [
    "gapAnalysesPerMonth",
    "contentIdeasPerMonth",
    "actionPlansPerMonth",
    "pagesPerMonth",
  ];

  for (const key of intelligenceKeys) {
    it(`${key}: free <= scout <= command <= dominate`, () => {
      const values = TIERS.map((t) =>
        effectiveLimit(CITATION_PLANS[t].intelligenceLimits[key])
      );
      for (let i = 1; i < values.length; i++) {
        expect(values[i]).toBeGreaterThanOrEqual(values[i - 1]);
      }
    });
  }
});

// ============================================
// FEATURE ESCALATION
// ============================================

describe("Feature escalation (higher tier never loses a feature)", () => {
  const featureKeys = Object.keys(CITATION_PLANS.free.features) as (keyof typeof CITATION_PLANS.free.features)[];

  for (const key of featureKeys) {
    it(`${key}: if tier N has it, tier N+1 has it too`, () => {
      for (let i = 1; i < TIERS.length; i++) {
        const prev = CITATION_PLANS[TIERS[i - 1]].features[key];
        const curr = CITATION_PLANS[TIERS[i]].features[key];
        if (prev === true) {
          expect(curr).toBe(true);
        }
      }
    });
  }
});

// ============================================
// SPECIFIC LIMIT VALUES
// ============================================

describe("Specific limit values per tier", () => {
  it("Free: 1 site, 3 checks/day, 0 competitors", () => {
    const limits = CITATION_PLANS.free.limits;
    expect(limits.sites).toBe(1);
    expect(limits.manualChecksPerDay).toBe(3);
    expect(limits.competitors).toBe(0);
  });

  it("Scout: 1 site, unlimited checks, 3 competitors, 5 gap analyses, 3 pages", () => {
    const limits = CITATION_PLANS.scout.limits;
    const intel = CITATION_PLANS.scout.intelligenceLimits;
    expect(limits.sites).toBe(1);
    expect(limits.manualChecksPerDay).toBe(-1);
    expect(limits.competitors).toBe(3);
    expect(intel.gapAnalysesPerMonth).toBe(5);
    expect(intel.contentIdeasPerMonth).toBe(5);
    expect(intel.actionPlansPerMonth).toBe(0);
    expect(intel.pagesPerMonth).toBe(3);
  });

  it("Command: 5 sites, unlimited checks, 10 competitors, unlimited intelligence, 15 pages", () => {
    const limits = CITATION_PLANS.command.limits;
    const intel = CITATION_PLANS.command.intelligenceLimits;
    expect(limits.sites).toBe(5);
    expect(limits.manualChecksPerDay).toBe(-1);
    expect(limits.competitors).toBe(10);
    expect(intel.gapAnalysesPerMonth).toBe(-1);
    expect(intel.contentIdeasPerMonth).toBe(-1);
    expect(intel.actionPlansPerMonth).toBe(4);
    expect(intel.pagesPerMonth).toBe(15);
  });

  it("Dominate: 25 sites, unlimited checks, 25 competitors, unlimited everything", () => {
    const limits = CITATION_PLANS.dominate.limits;
    const intel = CITATION_PLANS.dominate.intelligenceLimits;
    expect(limits.sites).toBe(25);
    expect(limits.manualChecksPerDay).toBe(-1);
    expect(limits.competitors).toBe(25);
    expect(intel.gapAnalysesPerMonth).toBe(-1);
    expect(intel.contentIdeasPerMonth).toBe(-1);
    expect(intel.actionPlansPerMonth).toBe(-1);
    expect(intel.pagesPerMonth).toBe(-1);
  });
});

// ============================================
// SPECIFIC FEATURES PER TIER
// ============================================

describe("Feature availability per tier", () => {
  it("Free: manual checks + geoScore only, no page generation", () => {
    const f = CITATION_PLANS.free.features;
    expect(f.manualChecks).toBe(true);
    expect(f.geoScore).toBe(true);
    expect(f.dailyAutoCheck).toBe(false);
    expect(f.competitorTracking).toBe(false);
    expect(f.citationGapAnalysis).toBe(false);
    expect(f.contentRecommendations).toBe(false);
    expect(f.weeklyActionPlan).toBe(false);
    expect(f.sprintFramework).toBe(false);
    expect(f.pageGeneration).toBe(false);
    expect(f.whiteLabel).toBe(false);
    expect(f.apiAccess).toBe(false);
  });

  it("Free: pagesPerMonth is 0", () => {
    expect(CITATION_PLANS.free.intelligenceLimits.pagesPerMonth).toBe(0);
  });

  it("Scout: monitoring + basic intelligence + page generation, no action plans", () => {
    const f = CITATION_PLANS.scout.features;
    expect(f.dailyAutoCheck).toBe(true);
    expect(f.emailAlerts).toBe(true);
    expect(f.weeklyReport).toBe(true);
    expect(f.competitorTracking).toBe(true);
    expect(f.citationGapAnalysis).toBe(true);
    expect(f.citationGapFull).toBe(false);
    expect(f.contentRecommendations).toBe(true);
    expect(f.pageGeneration).toBe(true);
    expect(f.weeklyActionPlan).toBe(false);
    expect(f.competitorDeepDive).toBe(false);
    expect(f.sprintFramework).toBe(true);
    expect(f.whiteLabel).toBe(false);
    expect(f.apiAccess).toBe(false);
  });

  it("Command: full intelligence + action plans + page generation, no white-label", () => {
    const f = CITATION_PLANS.command.features;
    expect(f.hourlyAutoCheck).toBe(true);
    expect(f.citationGapFull).toBe(true);
    expect(f.contentRecsUnlimited).toBe(true);
    expect(f.weeklyActionPlan).toBe(true);
    expect(f.competitorDeepDive).toBe(true);
    expect(f.pageGeneration).toBe(true);
    expect(f.queryDiscovery).toBe(true);
    expect(f.prioritySupport).toBe(true);
    expect(f.whiteLabel).toBe(false);
    expect(f.apiAccess).toBe(false);
  });

  it("Dominate: everything including white-label + API", () => {
    const f = CITATION_PLANS.dominate.features;
    expect(f.realtimeAlerts).toBe(true);
    expect(f.whiteLabel).toBe(true);
    expect(f.apiAccess).toBe(true);
    expect(f.prioritySupport).toBe(true);
    // Verify ALL features are true
    for (const [key, value] of Object.entries(f)) {
      expect(value).toBe(true);
    }
  });
});

// ============================================
// LEGACY PLAN NAME MAPPING
// ============================================

describe("Legacy plan name mapping", () => {
  it("starter maps to scout", () => {
    expect(getCitationPlan("starter").id).toBe("scout");
  });

  it("pro maps to command", () => {
    expect(getCitationPlan("pro").id).toBe("command");
  });

  it("pro_plus maps to dominate", () => {
    expect(getCitationPlan("pro_plus").id).toBe("dominate");
  });

  it("unknown plan falls back to free", () => {
    expect(getCitationPlan("garbage").id).toBe("free");
    expect(getCitationPlan("").id).toBe("free");
    expect(getCitationPlan("enterprise").id).toBe("free");
  });

  it("valid plan IDs return correct plans", () => {
    for (const tier of TIERS) {
      expect(getCitationPlan(tier).id).toBe(tier);
    }
  });
});

// ============================================
// HELPER FUNCTIONS
// ============================================

describe("Helper functions", () => {
  it("getCitationPlanLimits returns limits object", () => {
    const limits = getCitationPlanLimits("scout");
    expect(limits.sites).toBe(1);
    expect(limits.competitors).toBe(3);
  });

  it("getCitationPlanFeatures returns features object", () => {
    const features = getCitationPlanFeatures("command");
    expect(features.weeklyActionPlan).toBe(true);
    expect(features.whiteLabel).toBe(false);
  });

  it("isPaidPlan returns false for free, true for others", () => {
    expect(isPaidPlan("free")).toBe(false);
    expect(isPaidPlan("scout")).toBe(true);
    expect(isPaidPlan("command")).toBe(true);
    expect(isPaidPlan("dominate")).toBe(true);
  });

  it("formatLimit formats -1 as Unlimited", () => {
    expect(formatLimit(-1)).toBe("Unlimited");
    expect(formatLimit(5)).toBe("5");
    expect(formatLimit(0)).toBe("0");
  });
});

// ============================================
// INTELLIGENCE FEATURE SUMMARY
// ============================================

describe("getIntelligenceFeatureSummary", () => {
  it("Free: all unavailable", () => {
    const summary = getIntelligenceFeatureSummary("free");
    expect(summary.gapAnalysis).toBe("Not available");
    expect(summary.contentIdeas).toBe("Not available");
    expect(summary.actionPlan).toBe("Command only");
    expect(summary.competitorDeepDive).toBe("Command only");
  });

  it("Scout: limited analyses", () => {
    const summary = getIntelligenceFeatureSummary("scout");
    expect(summary.gapAnalysis).toBe("5 analyses/month");
    expect(summary.contentIdeas).toBe("5 ideas/month");
    expect(summary.actionPlan).toBe("Command only");
    expect(summary.competitorDeepDive).toBe("Command only");
  });

  it("Command: unlimited + full features", () => {
    const summary = getIntelligenceFeatureSummary("command");
    expect(summary.gapAnalysis).toBe("Unlimited per-query analysis");
    expect(summary.contentIdeas).toBe("Unlimited ideas");
    expect(summary.actionPlan).toBe("Weekly Action Playbook");
    expect(summary.competitorDeepDive).toBe("Full competitor breakdown");
  });

  it("Dominate: unlimited + full features", () => {
    const summary = getIntelligenceFeatureSummary("dominate");
    expect(summary.gapAnalysis).toBe("Unlimited per-query analysis");
    expect(summary.contentIdeas).toBe("Unlimited ideas");
    expect(summary.actionPlan).toBe("Weekly Action Playbook");
    expect(summary.competitorDeepDive).toBe("Full competitor breakdown");
  });
});
