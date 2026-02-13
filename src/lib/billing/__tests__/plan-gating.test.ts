import { describe, it, expect } from "vitest";
import {
  canAddSite,
  canRunManualCheck,
  canUseGapAnalysis,
  canUseContentRecommendations,
  canUseActionPlan,
  canGeneratePage,
} from "../citation-plans";

// ============================================
// canAddSite
// ============================================

describe("canAddSite", () => {
  describe("Free (limit: 1)", () => {
    it("allows at 0 sites", () => {
      expect(canAddSite("free", 0).allowed).toBe(true);
    });
    it("denies at 1 site (limit reached)", () => {
      const result = canAddSite("free", 1);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBeDefined();
    });
    it("denies at 5 sites", () => {
      expect(canAddSite("free", 5).allowed).toBe(false);
    });
  });

  describe("Scout (limit: 1)", () => {
    it("allows at 0 sites", () => {
      expect(canAddSite("scout", 0).allowed).toBe(true);
    });
    it("denies at 1 site (limit reached)", () => {
      const result = canAddSite("scout", 1);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBeDefined();
    });
  });

  describe("Command (limit: 5)", () => {
    it("allows at 0 sites", () => {
      expect(canAddSite("command", 0).allowed).toBe(true);
    });
    it("allows at 4 sites", () => {
      expect(canAddSite("command", 4).allowed).toBe(true);
    });
    it("denies at 5 sites (limit reached)", () => {
      const result = canAddSite("command", 5);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBeDefined();
    });
    it("denies at 10 sites", () => {
      expect(canAddSite("command", 10).allowed).toBe(false);
    });
  });

  describe("Dominate (limit: 25)", () => {
    it("allows at 0 sites", () => {
      expect(canAddSite("dominate", 0).allowed).toBe(true);
    });
    it("allows at 24 sites", () => {
      expect(canAddSite("dominate", 24).allowed).toBe(true);
    });
    it("denies at 25 sites (limit reached)", () => {
      const result = canAddSite("dominate", 25);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBeDefined();
    });
  });
});

// ============================================
// canRunManualCheck
// ============================================

describe("canRunManualCheck", () => {
  describe("Free (limit: 3/day)", () => {
    it("allows at 0 checks", () => {
      expect(canRunManualCheck("free", 0).allowed).toBe(true);
    });
    it("allows at 1 check", () => {
      expect(canRunManualCheck("free", 1).allowed).toBe(true);
    });
    it("allows at 2 checks", () => {
      expect(canRunManualCheck("free", 2).allowed).toBe(true);
    });
    it("denies at 3 checks (daily limit)", () => {
      const result = canRunManualCheck("free", 3);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("Daily limit");
    });
    it("denies at 10 checks", () => {
      expect(canRunManualCheck("free", 10).allowed).toBe(false);
    });
  });

  describe("Scout (unlimited)", () => {
    it("allows at 0 checks", () => {
      expect(canRunManualCheck("scout", 0).allowed).toBe(true);
    });
    it("allows at 100 checks", () => {
      expect(canRunManualCheck("scout", 100).allowed).toBe(true);
    });
    it("allows at 999999 checks", () => {
      expect(canRunManualCheck("scout", 999999).allowed).toBe(true);
    });
  });

  describe("Command (unlimited)", () => {
    it("allows at 0 checks", () => {
      expect(canRunManualCheck("command", 0).allowed).toBe(true);
    });
    it("allows at 999999 checks", () => {
      expect(canRunManualCheck("command", 999999).allowed).toBe(true);
    });
  });

  describe("Dominate (unlimited)", () => {
    it("allows at 0 checks", () => {
      expect(canRunManualCheck("dominate", 0).allowed).toBe(true);
    });
    it("allows at 999999 checks", () => {
      expect(canRunManualCheck("dominate", 999999).allowed).toBe(true);
    });
  });
});

// ============================================
// canUseGapAnalysis
// ============================================

describe("canUseGapAnalysis", () => {
  describe("Free (not available)", () => {
    it("denies even at 0 usage", () => {
      const result = canUseGapAnalysis("free", 0);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("Scout");
    });
  });

  describe("Scout (limit: 5/month)", () => {
    it("allows at 0 usage", () => {
      const result = canUseGapAnalysis("scout", 0);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(5);
    });
    it("allows at 4 usage", () => {
      const result = canUseGapAnalysis("scout", 4);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(1);
    });
    it("denies at 5 usage (limit reached)", () => {
      const result = canUseGapAnalysis("scout", 5);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.reason).toContain("Monthly limit");
    });
    it("denies at 10 usage", () => {
      expect(canUseGapAnalysis("scout", 10).allowed).toBe(false);
    });
  });

  describe("Command (limit: 15/month)", () => {
    it("allows at 0 usage", () => {
      const result = canUseGapAnalysis("command", 0);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(15);
    });
    it("allows at 14 usage", () => {
      const result = canUseGapAnalysis("command", 14);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(1);
    });
    it("denies at 15 usage (limit reached)", () => {
      const result = canUseGapAnalysis("command", 15);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });
  });

  describe("Dominate (limit: 30/month)", () => {
    it("allows at 0 usage", () => {
      const result = canUseGapAnalysis("dominate", 0);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(30);
    });
    it("allows at 29 usage", () => {
      const result = canUseGapAnalysis("dominate", 29);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(1);
    });
    it("denies at 30 usage (limit reached)", () => {
      const result = canUseGapAnalysis("dominate", 30);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });
  });
});

// ============================================
// canUseContentRecommendations
// ============================================

describe("canUseContentRecommendations", () => {
  describe("Free (not available)", () => {
    it("denies even at 0 usage", () => {
      const result = canUseContentRecommendations("free", 0);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("Scout");
    });
  });

  describe("Scout (limit: 3/month)", () => {
    it("allows at 0 usage", () => {
      const result = canUseContentRecommendations("scout", 0);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(3);
    });
    it("allows at 2 usage", () => {
      const result = canUseContentRecommendations("scout", 2);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(1);
    });
    it("denies at 3 usage (limit reached)", () => {
      const result = canUseContentRecommendations("scout", 3);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });
  });

  describe("Command (limit: 10/month)", () => {
    it("allows at 0 usage", () => {
      const result = canUseContentRecommendations("command", 0);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(10);
    });
    it("denies at 10 usage (limit reached)", () => {
      const result = canUseContentRecommendations("command", 10);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });
  });

  describe("Dominate (limit: 20/month)", () => {
    it("allows at 0 usage", () => {
      const result = canUseContentRecommendations("dominate", 0);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(20);
    });
    it("denies at 20 usage (limit reached)", () => {
      const result = canUseContentRecommendations("dominate", 20);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });
  });
});

// ============================================
// canUseActionPlan
// ============================================

describe("canUseActionPlan", () => {
  it("Free: denied", () => {
    const result = canUseActionPlan("free", 0);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("Command");
  });

  it("Scout: denied", () => {
    const result = canUseActionPlan("scout", 0);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("Command");
  });

  it("Command: allowed (under limit)", () => {
    expect(canUseActionPlan("command", 0).allowed).toBe(true);
    expect(canUseActionPlan("command", 3).allowed).toBe(true);
    expect(canUseActionPlan("command", 3).remaining).toBe(1);
  });

  it("Command: denied (at limit)", () => {
    expect(canUseActionPlan("command", 4).allowed).toBe(false);
    expect(canUseActionPlan("command", 4).remaining).toBe(0);
    expect(canUseActionPlan("command", 4).reason).toContain("Monthly limit");
  });

  it("Dominate: allowed (under limit)", () => {
    expect(canUseActionPlan("dominate", 0).allowed).toBe(true);
    expect(canUseActionPlan("dominate", 7).allowed).toBe(true);
    expect(canUseActionPlan("dominate", 7).remaining).toBe(1);
  });

  it("Dominate: denied (at limit)", () => {
    expect(canUseActionPlan("dominate", 8).allowed).toBe(false);
    expect(canUseActionPlan("dominate", 8).remaining).toBe(0);
  });
});

// ============================================
// canGeneratePage
// ============================================

describe("canGeneratePage", () => {
  describe("Free (not available, 0 pages)", () => {
    it("denies even at 0 usage", () => {
      const result = canGeneratePage("free", 0);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("Scout");
    });
    it("denies at 5 usage", () => {
      expect(canGeneratePage("free", 5).allowed).toBe(false);
    });
  });

  describe("Scout (limit: 5/month)", () => {
    it("allows at 0 usage", () => {
      const result = canGeneratePage("scout", 0);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(5);
    });
    it("allows at 2 usage", () => {
      const result = canGeneratePage("scout", 2);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(3);
    });
    it("allows at 4 usage", () => {
      const result = canGeneratePage("scout", 4);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(1);
    });
    it("denies at 5 usage (limit reached)", () => {
      const result = canGeneratePage("scout", 5);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.reason).toContain("Monthly limit");
    });
    it("denies at 10 usage", () => {
      expect(canGeneratePage("scout", 10).allowed).toBe(false);
    });
  });

  describe("Command (limit: 25/month)", () => {
    it("allows at 0 usage", () => {
      const result = canGeneratePage("command", 0);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(25);
    });
    it("allows at 12 usage", () => {
      const result = canGeneratePage("command", 12);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(13);
    });
    it("allows at 24 usage", () => {
      const result = canGeneratePage("command", 24);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(1);
    });
    it("denies at 25 usage (limit reached)", () => {
      const result = canGeneratePage("command", 25);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.reason).toContain("Monthly limit");
    });
    it("denies at 100 usage", () => {
      expect(canGeneratePage("command", 100).allowed).toBe(false);
    });
  });

  describe("Dominate (limit: 50/month)", () => {
    it("allows at 0 usage", () => {
      const result = canGeneratePage("dominate", 0);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(50);
    });
    it("allows at 49 usage", () => {
      const result = canGeneratePage("dominate", 49);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(1);
    });
    it("denies at 50 usage (limit reached)", () => {
      const result = canGeneratePage("dominate", 50);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });
  });
});

// ============================================
// CROSS-TIER COMPARISON: what each tier gets vs doesn't get
// ============================================

describe("Cross-tier: paying customers get what they pay for", () => {
  it("Scout customers CAN: add sites, run unlimited checks, use gap analysis, use content recs, generate pages", () => {
    expect(canAddSite("scout", 0).allowed).toBe(true);
    expect(canRunManualCheck("scout", 100).allowed).toBe(true);
    expect(canUseGapAnalysis("scout", 0).allowed).toBe(true);
    expect(canUseContentRecommendations("scout", 0).allowed).toBe(true);
    expect(canGeneratePage("scout", 0).allowed).toBe(true);
  });

  it("Scout customers CANNOT: use action plans", () => {
    expect(canUseActionPlan("scout", 0).allowed).toBe(false);
  });

  it("Command customers CAN: everything Scout can + action plans + more sites + more pages", () => {
    expect(canAddSite("command", 0).allowed).toBe(true);
    expect(canAddSite("command", 4).allowed).toBe(true);
    expect(canRunManualCheck("command", 100).allowed).toBe(true);
    expect(canUseGapAnalysis("command", 0).allowed).toBe(true);
    expect(canUseContentRecommendations("command", 0).allowed).toBe(true);
    expect(canUseActionPlan("command", 0).allowed).toBe(true);
    expect(canGeneratePage("command", 0).allowed).toBe(true);
    expect(canGeneratePage("command", 14).allowed).toBe(true);
  });

  it("Dominate customers CAN: everything + even more sites + more pages", () => {
    expect(canAddSite("dominate", 24).allowed).toBe(true);
    expect(canRunManualCheck("dominate", 100).allowed).toBe(true);
    expect(canUseGapAnalysis("dominate", 0).allowed).toBe(true);
    expect(canUseContentRecommendations("dominate", 0).allowed).toBe(true);
    expect(canUseActionPlan("dominate", 0).allowed).toBe(true);
    expect(canGeneratePage("dominate", 0).allowed).toBe(true);
  });

  it("Free users are properly limited", () => {
    expect(canAddSite("free", 1).allowed).toBe(false);
    expect(canRunManualCheck("free", 3).allowed).toBe(false);
    expect(canUseGapAnalysis("free", 0).allowed).toBe(false);
    expect(canUseContentRecommendations("free", 0).allowed).toBe(false);
    expect(canUseActionPlan("free", 0).allowed).toBe(false);
    expect(canGeneratePage("free", 0).allowed).toBe(false);
  });
});
