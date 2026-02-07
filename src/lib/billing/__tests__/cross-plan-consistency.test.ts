import { describe, it, expect } from "vitest";
import { CITATION_PLANS, getCitationPlan } from "../citation-plans";
import { PLANS, getPlan } from "../plans";

/**
 * Cross-file consistency tests
 *
 * CabbageSEO has TWO plan definition files:
 * - citation-plans.ts (GEO/citation features — the primary source)
 * - plans.ts (general SEO features — secondary)
 *
 * These must agree on pricing, plan names, and site/team limits.
 */

// ============================================
// PRICING MUST MATCH
// ============================================

describe("Cross-file pricing consistency", () => {
  const tiers = ["scout", "command", "dominate"] as const;

  for (const tier of tiers) {
    it(`${tier} monthly price matches across files`, () => {
      expect(CITATION_PLANS[tier].monthlyPrice).toBe(PLANS[tier].monthlyPrice);
    });

    it(`${tier} yearly price matches across files`, () => {
      expect(CITATION_PLANS[tier].yearlyPrice).toBe(PLANS[tier].yearlyPrice);
    });
  }
});

// ============================================
// PLAN NAMES MUST MATCH
// ============================================

describe("Cross-file plan names consistency", () => {
  const tiers = ["scout", "command", "dominate"] as const;

  for (const tier of tiers) {
    it(`${tier} plan name matches across files`, () => {
      expect(CITATION_PLANS[tier].name).toBe(PLANS[tier].name);
    });
  }
});

// ============================================
// SITE LIMITS MUST MATCH
// ============================================

describe("Cross-file site limits consistency", () => {
  const tiers = ["scout", "command", "dominate"] as const;

  for (const tier of tiers) {
    it(`${tier} site limit matches across files`, () => {
      expect(CITATION_PLANS[tier].limits.sites).toBe(PLANS[tier].limits.sites);
    });
  }
});

// ============================================
// TEAM MEMBER LIMITS MUST MATCH
// ============================================

describe("Cross-file team member limits consistency", () => {
  const tiers = ["scout", "command", "dominate"] as const;

  for (const tier of tiers) {
    it(`${tier} team member limit matches across files`, () => {
      expect(CITATION_PLANS[tier].limits.teamMembers).toBe(PLANS[tier].limits.teamMembers);
    });
  }
});

// ============================================
// LEGACY MAPPING CONSISTENCY
// ============================================

describe("Legacy plan mapping consistency", () => {
  it("'starter' maps to scout in both files", () => {
    expect(getCitationPlan("starter").id).toBe("scout");
    expect(getPlan("starter").id).toBe("scout");
  });

  it("'pro' maps to command in both files", () => {
    expect(getCitationPlan("pro").id).toBe("command");
    expect(getPlan("pro").id).toBe("command");
  });

  it("'pro_plus' maps to dominate in both files", () => {
    expect(getCitationPlan("pro_plus").id).toBe("dominate");
    expect(getPlan("pro_plus").id).toBe("dominate");
  });
});

// ============================================
// API ACCESS / WHITE LABEL CONSISTENCY
// ============================================

describe("Cross-file feature flags consistency", () => {
  const tiers = ["scout", "command", "dominate"] as const;

  for (const tier of tiers) {
    it(`${tier} apiAccess matches across files`, () => {
      expect(CITATION_PLANS[tier].features.apiAccess).toBe(PLANS[tier].features.apiAccess);
    });

    it(`${tier} whiteLabel matches across files`, () => {
      expect(CITATION_PLANS[tier].features.whiteLabel).toBe(PLANS[tier].features.whiteLabel);
    });
  }
});

// ============================================
// POPULAR PLAN CONSISTENCY
// ============================================

describe("Popular plan consistency", () => {
  it("Command is popular in citation-plans", () => {
    expect(CITATION_PLANS.command.popular).toBe(true);
  });

  it("Command is popular in plans", () => {
    expect(PLANS.command.popular).toBe(true);
  });

  it("Scout is NOT popular in either", () => {
    expect(CITATION_PLANS.scout.popular).toBeFalsy();
    expect(PLANS.scout.popular).toBeFalsy();
  });

  it("Dominate is NOT popular in either", () => {
    expect(CITATION_PLANS.dominate.popular).toBeFalsy();
    expect(PLANS.dominate.popular).toBeFalsy();
  });
});
