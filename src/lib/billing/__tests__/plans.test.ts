import { describe, it, expect } from "vitest";
import {
  PLANS,
  getPlan,
  getPlans,
  getPlanLimits,
  getPlanFeatures,
  canUpgrade,
  canDowngrade,
  getPlanUpgrades,
  isWithinLimit,
  getOverageAmount,
  calculateOverageCost,
  calculateYearlySavings,
  calculateYearlySavingsPercent,
  checkUsage,
  formatPrice,
  formatPriceCents,
  RATE_LIMITS,
  OVERAGE_PRICES,
  type PlanId,
} from "../plans";

const TIERS: PlanId[] = ["scout", "command", "dominate"];

// ============================================
// PRICING CORRECTNESS
// ============================================

describe("plans.ts pricing correctness", () => {
  it("Scout: $49/mo, $39/yr", () => {
    expect(PLANS.scout.monthlyPrice).toBe(49);
    expect(PLANS.scout.yearlyPrice).toBe(39);
  });

  it("Command: $149/mo, $119/yr", () => {
    expect(PLANS.command.monthlyPrice).toBe(149);
    expect(PLANS.command.yearlyPrice).toBe(119);
  });

  it("Dominate: $349/mo, $279/yr", () => {
    expect(PLANS.dominate.monthlyPrice).toBe(349);
    expect(PLANS.dominate.yearlyPrice).toBe(279);
  });

  it("annual < monthly for all paid plans", () => {
    for (const tier of TIERS) {
      expect(PLANS[tier].yearlyPrice).toBeLessThan(PLANS[tier].monthlyPrice);
    }
  });

  it("prices increase with each tier", () => {
    expect(PLANS.command.monthlyPrice).toBeGreaterThan(PLANS.scout.monthlyPrice);
    expect(PLANS.dominate.monthlyPrice).toBeGreaterThan(PLANS.command.monthlyPrice);
  });
});

// ============================================
// LIMIT ESCALATION
// ============================================

describe("plans.ts limit escalation", () => {
  const limitKeys: (keyof typeof PLANS.scout.limits)[] = [
    "sites",
    "pagesPerSite",
    "articlesPerMonth",
    "keywordsTracked",
    "auditsPerMonth",
    "aioAnalysesPerMonth",
    "teamMembers",
    "aiCreditsPerMonth",
  ];

  function effectiveLimit(val: number): number {
    return val === -1 ? Infinity : val;
  }

  for (const key of limitKeys) {
    it(`${key}: scout <= command <= dominate`, () => {
      const values = TIERS.map((t) => effectiveLimit(PLANS[t].limits[key]));
      for (let i = 1; i < values.length; i++) {
        expect(values[i]).toBeGreaterThanOrEqual(values[i - 1]);
      }
    });
  }
});

// ============================================
// FEATURE ESCALATION
// ============================================

describe("plans.ts feature escalation", () => {
  const featureKeys = Object.keys(PLANS.scout.features) as (keyof typeof PLANS.scout.features)[];

  for (const key of featureKeys) {
    it(`${key}: if tier N has it, tier N+1 has it too`, () => {
      for (let i = 1; i < TIERS.length; i++) {
        const prev = PLANS[TIERS[i - 1]].features[key];
        const curr = PLANS[TIERS[i]].features[key];
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

describe("plans.ts specific limits", () => {
  it("Scout: 1 site, 1 team member", () => {
    expect(PLANS.scout.limits.sites).toBe(1);
    expect(PLANS.scout.limits.teamMembers).toBe(1);
  });

  it("Command: 5 sites, 5 team members", () => {
    expect(PLANS.command.limits.sites).toBe(5);
    expect(PLANS.command.limits.teamMembers).toBe(5);
  });

  it("Dominate: 25 sites, unlimited team members", () => {
    expect(PLANS.dominate.limits.sites).toBe(25);
    expect(PLANS.dominate.limits.teamMembers).toBe(-1);
  });
});

// ============================================
// SPECIFIC FEATURES
// ============================================

describe("plans.ts specific features", () => {
  it("Scout: no API, no white-label, no priority", () => {
    expect(PLANS.scout.features.apiAccess).toBe(false);
    expect(PLANS.scout.features.whiteLabel).toBe(false);
    expect(PLANS.scout.features.priorityQueue).toBe(false);
    expect(PLANS.scout.features.autopilotEligible).toBe(false);
  });

  it("Command: priority + bulk + autopilot, no API/white-label", () => {
    expect(PLANS.command.features.priorityQueue).toBe(true);
    expect(PLANS.command.features.bulkOperations).toBe(true);
    expect(PLANS.command.features.autopilotEligible).toBe(true);
    expect(PLANS.command.features.apiAccess).toBe(false);
    expect(PLANS.command.features.whiteLabel).toBe(false);
  });

  it("Dominate: everything enabled", () => {
    for (const [key, value] of Object.entries(PLANS.dominate.features)) {
      expect(value).toBe(true);
    }
  });

  it("Command is marked as popular", () => {
    expect(PLANS.command.popular).toBe(true);
    expect(PLANS.scout.popular).toBeUndefined();
    expect(PLANS.dominate.popular).toBeUndefined();
  });
});

// ============================================
// LEGACY PLAN NAME MAPPING
// ============================================

describe("plans.ts legacy mapping", () => {
  it("starter maps to scout", () => {
    expect(getPlan("starter").id).toBe("scout");
  });

  it("pro maps to command", () => {
    expect(getPlan("pro").id).toBe("command");
  });

  it("pro_plus maps to dominate", () => {
    expect(getPlan("pro_plus").id).toBe("dominate");
  });

  it("unknown plan falls back to scout (not free)", () => {
    expect(getPlan("garbage").id).toBe("scout");
    expect(getPlan("free").id).toBe("scout");
  });

  it("valid plan IDs return correct plans", () => {
    for (const tier of TIERS) {
      expect(getPlan(tier).id).toBe(tier);
    }
  });
});

// ============================================
// UPGRADE / DOWNGRADE
// ============================================

describe("canUpgrade", () => {
  it("scout can upgrade to command", () => {
    expect(canUpgrade("scout", "command")).toBe(true);
  });

  it("scout can upgrade to dominate", () => {
    expect(canUpgrade("scout", "dominate")).toBe(true);
  });

  it("command can upgrade to dominate", () => {
    expect(canUpgrade("command", "dominate")).toBe(true);
  });

  it("cannot upgrade to same plan", () => {
    expect(canUpgrade("scout", "scout")).toBe(false);
    expect(canUpgrade("command", "command")).toBe(false);
  });

  it("cannot upgrade to lower plan", () => {
    expect(canUpgrade("command", "scout")).toBe(false);
    expect(canUpgrade("dominate", "scout")).toBe(false);
    expect(canUpgrade("dominate", "command")).toBe(false);
  });
});

describe("canDowngrade", () => {
  it("command can downgrade to scout", () => {
    expect(canDowngrade("command", "scout")).toBe(true);
  });

  it("dominate can downgrade to command", () => {
    expect(canDowngrade("dominate", "command")).toBe(true);
  });

  it("dominate can downgrade to scout", () => {
    expect(canDowngrade("dominate", "scout")).toBe(true);
  });

  it("cannot downgrade to same plan", () => {
    expect(canDowngrade("scout", "scout")).toBe(false);
  });

  it("cannot downgrade to higher plan", () => {
    expect(canDowngrade("scout", "command")).toBe(false);
  });
});

describe("getPlanUpgrades", () => {
  it("scout has 2 upgrades", () => {
    const upgrades = getPlanUpgrades("scout");
    expect(upgrades).toHaveLength(2);
    expect(upgrades[0].id).toBe("command");
    expect(upgrades[1].id).toBe("dominate");
  });

  it("command has 1 upgrade", () => {
    const upgrades = getPlanUpgrades("command");
    expect(upgrades).toHaveLength(1);
    expect(upgrades[0].id).toBe("dominate");
  });

  it("dominate has 0 upgrades", () => {
    expect(getPlanUpgrades("dominate")).toHaveLength(0);
  });
});

// ============================================
// USAGE ENFORCEMENT
// ============================================

describe("isWithinLimit", () => {
  it("scout: 0 sites is within limit (1)", () => {
    expect(isWithinLimit("scout", "sites", 0)).toBe(true);
  });

  it("scout: 1 site is NOT within limit (1)", () => {
    expect(isWithinLimit("scout", "sites", 1)).toBe(false);
  });

  it("command: 4 sites is within limit (5)", () => {
    expect(isWithinLimit("command", "sites", 4)).toBe(true);
  });

  it("command: 5 sites is NOT within limit (5)", () => {
    expect(isWithinLimit("command", "sites", 5)).toBe(false);
  });

  it("dominate: 24 sites is within limit (25)", () => {
    expect(isWithinLimit("dominate", "sites", 24)).toBe(true);
  });
});

describe("getOverageAmount", () => {
  it("no overage when under limit", () => {
    expect(getOverageAmount("scout", "sites", 0)).toBe(0);
    expect(getOverageAmount("scout", "articlesPerMonth", 5)).toBe(0);
  });

  it("correct overage when over limit", () => {
    expect(getOverageAmount("scout", "articlesPerMonth", 15)).toBe(5);
    expect(getOverageAmount("command", "articlesPerMonth", 60)).toBe(10);
  });
});

describe("checkUsage", () => {
  it("allows usage within limits", () => {
    const result = checkUsage("scout", "articlesPerMonth", 5, 1);
    expect(result.allowed).toBe(true);
  });

  it("denies usage over limits", () => {
    const result = checkUsage("scout", "articlesPerMonth", 10, 1);
    expect(result.allowed).toBe(false);
  });

  it("denies hard-capped resources (sites)", () => {
    const result = checkUsage("scout", "sites", 1, 1);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("limit reached");
  });

  it("provides overage info for overage-eligible resources", () => {
    const result = checkUsage("scout", "articlesPerMonth", 10, 5);
    expect(result.allowed).toBe(false);
    expect(result.overageRequired).toBe(5);
    expect(result.overageResource).toBe("articles");
    expect(result.overageCostCents).toBeGreaterThan(0);
  });
});

// ============================================
// RATE LIMITS
// ============================================

describe("Rate limits escalation", () => {
  it("rate limits increase with tier", () => {
    expect(RATE_LIMITS.command.requestsPerMinute).toBeGreaterThan(
      RATE_LIMITS.scout.requestsPerMinute
    );
    expect(RATE_LIMITS.dominate.requestsPerMinute).toBeGreaterThan(
      RATE_LIMITS.command.requestsPerMinute
    );
  });

  it("concurrent requests increase with tier", () => {
    expect(RATE_LIMITS.command.concurrentRequests).toBeGreaterThan(
      RATE_LIMITS.scout.concurrentRequests
    );
    expect(RATE_LIMITS.dominate.concurrentRequests).toBeGreaterThan(
      RATE_LIMITS.command.concurrentRequests
    );
  });

  it("token limits increase with tier", () => {
    expect(RATE_LIMITS.command.tokensPerMinute).toBeGreaterThan(
      RATE_LIMITS.scout.tokensPerMinute
    );
    expect(RATE_LIMITS.dominate.tokensPerMinute).toBeGreaterThan(
      RATE_LIMITS.command.tokensPerMinute
    );
  });
});

// ============================================
// PRICING HELPERS
// ============================================

describe("Pricing helpers", () => {
  it("formatPrice formats dollars", () => {
    expect(formatPrice(49)).toBe("$49");
    expect(formatPrice(149)).toBe("$149");
    expect(formatPrice(0)).toBe("$0");
  });

  it("formatPriceCents converts cents to dollars", () => {
    expect(formatPriceCents(4900)).toBe("$49.00");
    expect(formatPriceCents(14900)).toBe("$149.00");
    expect(formatPriceCents(50)).toBe("$0.50");
  });

  it("calculateYearlySavings is positive for all plans", () => {
    for (const tier of TIERS) {
      const savings = calculateYearlySavings(PLANS[tier]);
      expect(savings).toBeGreaterThan(0);
    }
  });

  it("calculateYearlySavingsPercent is roughly 20% for all plans", () => {
    for (const tier of TIERS) {
      const pct = calculateYearlySavingsPercent(PLANS[tier]);
      expect(pct).toBeGreaterThanOrEqual(15);
      expect(pct).toBeLessThanOrEqual(25);
    }
  });

  it("Scout yearly savings: $120/year", () => {
    const savings = calculateYearlySavings(PLANS.scout);
    expect(savings).toBe((49 - 39) * 12);
  });

  it("Command yearly savings: $360/year", () => {
    const savings = calculateYearlySavings(PLANS.command);
    expect(savings).toBe((149 - 119) * 12);
  });

  it("Dominate yearly savings: $840/year", () => {
    const savings = calculateYearlySavings(PLANS.dominate);
    expect(savings).toBe((349 - 279) * 12);
  });
});

// ============================================
// OVERAGE PRICING
// ============================================

describe("Overage pricing sanity", () => {
  it("all overage prices are positive", () => {
    for (const [, pricing] of Object.entries(OVERAGE_PRICES)) {
      expect(pricing.pricePerUnit).toBeGreaterThan(0);
      expect(pricing.costPerUnit).toBeGreaterThan(0);
    }
  });

  it("overage margin is > 90% for all resources", () => {
    for (const [, pricing] of Object.entries(OVERAGE_PRICES)) {
      expect(pricing.margin).toBeGreaterThanOrEqual(0.90);
    }
  });

  it("calculateOverageCost returns correct amount", () => {
    const cost = calculateOverageCost("articles", 5);
    expect(cost).toBe(5 * OVERAGE_PRICES.articles.pricePerUnit);
  });

  it("calculateOverageCost handles keyword batching (per 100)", () => {
    const cost = calculateOverageCost("keywords", 250);
    expect(cost).toBe(3 * OVERAGE_PRICES.keywords.pricePerUnit);
  });

  it("calculateOverageCost handles AI credit batching (per 1000)", () => {
    const cost = calculateOverageCost("aiCredits", 2500);
    expect(cost).toBe(3 * OVERAGE_PRICES.aiCredits.pricePerUnit);
  });
});

// ============================================
// getPlans
// ============================================

describe("getPlans", () => {
  it("returns all 3 plans", () => {
    const plans = getPlans();
    expect(plans).toHaveLength(3);
  });

  it("returns plans in order: scout, command, dominate", () => {
    const plans = getPlans();
    expect(plans[0].id).toBe("scout");
    expect(plans[1].id).toBe("command");
    expect(plans[2].id).toBe("dominate");
  });
});

// ============================================
// getPlanLimits / getPlanFeatures
// ============================================

describe("getPlanLimits and getPlanFeatures", () => {
  it("getPlanLimits returns correct limits", () => {
    expect(getPlanLimits("scout").sites).toBe(1);
    expect(getPlanLimits("command").sites).toBe(5);
    expect(getPlanLimits("dominate").sites).toBe(25);
  });

  it("getPlanFeatures returns correct features", () => {
    expect(getPlanFeatures("scout").apiAccess).toBe(false);
    expect(getPlanFeatures("dominate").apiAccess).toBe(true);
  });
});
