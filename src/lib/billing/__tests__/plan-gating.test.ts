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
// canAddCompetitor
// ============================================

describe("canAddCompetitor", () => {
  describe("Free (limit: 0)", () => {
    it("denies at 0 competitors (no competitors on free)", () => {
      const result = canAddCompetitor("free", 0);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("Scout");
    });
  });

  describe("Scout (limit: 3)", () => {
    it("allows at 0 competitors", () => {
      expect(canAddCompetitor("scout", 0).allowed).toBe(true);
    });
    it("allows at 2 competitors", () => {
      expect(canAddCompetitor("scout", 2).allowed).toBe(true);
    });
    it("denies at 3 competitors (limit reached)", () => {
      const result = canAddCompetitor("scout", 3);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBeDefined();
    });
  });

  describe("Command (limit: 10)", () => {
    it("allows at 0 competitors", () => {
      expect(canAddCompetitor("command", 0).allowed).toBe(true);
    });
    it("allows at 9 competitors", () => {
      expect(canAddCompetitor("command", 9).allowed).toBe(true);
    });
    it("denies at 10 competitors (limit reached)", () => {
      const result = canAddCompetitor("command", 10);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBeDefined();
    });
  });

  describe("Dominate (limit: 25)", () => {
    it("allows at 0 competitors", () => {
      expect(canAddCompetitor("dominate", 0).allowed).toBe(true);
    });
    it("allows at 24 competitors", () => {
      expect(canAddCompetitor("dominate", 24).allowed).toBe(true);
    });
    it("denies at 25 competitors (limit reached)", () => {
      const result = canAddCompetitor("dominate", 25);
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

  describe("Command (unlimited)", () => {
    it("allows at 0 usage", () => {
      const result = canUseGapAnalysis("command", 0);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(-1);
    });
    it("allows at 1000 usage", () => {
      const result = canUseGapAnalysis("command", 1000);
      expect(result.allowed).toBe(true);
    });
  });

  describe("Dominate (unlimited)", () => {
    it("allows at 0 usage", () => {
      const result = canUseGapAnalysis("dominate", 0);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(-1);
    });
    it("allows at 1000 usage", () => {
      expect(canUseGapAnalysis("dominate", 1000).allowed).toBe(true);
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

  describe("Scout (limit: 5/month)", () => {
    it("allows at 0 usage", () => {
      const result = canUseContentRecommendations("scout", 0);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(5);
    });
    it("allows at 4 usage", () => {
      const result = canUseContentRecommendations("scout", 4);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(1);
    });
    it("denies at 5 usage (limit reached)", () => {
      const result = canUseContentRecommendations("scout", 5);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });
  });

  describe("Command (unlimited)", () => {
    it("allows at any usage", () => {
      expect(canUseContentRecommendations("command", 0).allowed).toBe(true);
      expect(canUseContentRecommendations("command", 1000).allowed).toBe(true);
    });
  });

  describe("Dominate (unlimited)", () => {
    it("allows at any usage", () => {
      expect(canUseContentRecommendations("dominate", 0).allowed).toBe(true);
      expect(canUseContentRecommendations("dominate", 1000).allowed).toBe(true);
    });
  });
});

// ============================================
// canUseActionPlan
// ============================================

describe("canUseActionPlan", () => {
  it("Free: denied", () => {
    const result = canUseActionPlan("free");
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("Command");
  });

  it("Scout: denied", () => {
    const result = canUseActionPlan("scout");
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("Command");
  });

  it("Command: allowed", () => {
    expect(canUseActionPlan("command").allowed).toBe(true);
  });

  it("Dominate: allowed", () => {
    expect(canUseActionPlan("dominate").allowed).toBe(true);
  });
});

// ============================================
// canUseCompetitorDeepDive
// ============================================

describe("canUseCompetitorDeepDive", () => {
  it("Free: denied", () => {
    const result = canUseCompetitorDeepDive("free");
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("Command");
  });

  it("Scout: denied", () => {
    const result = canUseCompetitorDeepDive("scout");
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("Command");
  });

  it("Command: allowed", () => {
    expect(canUseCompetitorDeepDive("command").allowed).toBe(true);
  });

  it("Dominate: allowed", () => {
    expect(canUseCompetitorDeepDive("dominate").allowed).toBe(true);
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

  describe("Scout (limit: 3/month)", () => {
    it("allows at 0 usage", () => {
      const result = canGeneratePage("scout", 0);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(3);
    });
    it("allows at 1 usage", () => {
      const result = canGeneratePage("scout", 1);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2);
    });
    it("allows at 2 usage", () => {
      const result = canGeneratePage("scout", 2);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(1);
    });
    it("denies at 3 usage (limit reached)", () => {
      const result = canGeneratePage("scout", 3);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.reason).toContain("Monthly limit");
    });
    it("denies at 10 usage", () => {
      expect(canGeneratePage("scout", 10).allowed).toBe(false);
    });
  });

  describe("Command (limit: 15/month)", () => {
    it("allows at 0 usage", () => {
      const result = canGeneratePage("command", 0);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(15);
    });
    it("allows at 7 usage", () => {
      const result = canGeneratePage("command", 7);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(8);
    });
    it("allows at 14 usage", () => {
      const result = canGeneratePage("command", 14);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(1);
    });
    it("denies at 15 usage (limit reached)", () => {
      const result = canGeneratePage("command", 15);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.reason).toContain("Monthly limit");
    });
    it("denies at 100 usage", () => {
      expect(canGeneratePage("command", 100).allowed).toBe(false);
    });
  });

  describe("Dominate (unlimited)", () => {
    it("allows at 0 usage", () => {
      const result = canGeneratePage("dominate", 0);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(-1);
    });
    it("allows at 100 usage", () => {
      const result = canGeneratePage("dominate", 100);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(-1);
    });
    it("allows at 999999 usage", () => {
      expect(canGeneratePage("dominate", 999999).allowed).toBe(true);
    });
  });
});

// ============================================
// CROSS-TIER COMPARISON: what each tier gets vs doesn't get
// ============================================

describe("Cross-tier: paying customers get what they pay for", () => {
  it("Scout customers CAN: add sites, add competitors, run unlimited checks, use gap analysis, use content recs, generate pages", () => {
    expect(canAddSite("scout", 0).allowed).toBe(true);
    expect(canAddCompetitor("scout", 0).allowed).toBe(true);
    expect(canRunManualCheck("scout", 100).allowed).toBe(true);
    expect(canUseGapAnalysis("scout", 0).allowed).toBe(true);
    expect(canUseContentRecommendations("scout", 0).allowed).toBe(true);
    expect(canGeneratePage("scout", 0).allowed).toBe(true);
  });

  it("Scout customers CANNOT: use action plans, use competitor deep dive", () => {
    expect(canUseActionPlan("scout").allowed).toBe(false);
    expect(canUseCompetitorDeepDive("scout").allowed).toBe(false);
  });

  it("Command customers CAN: everything Scout can + action plans + deep dive + more sites/competitors + more pages", () => {
    expect(canAddSite("command", 0).allowed).toBe(true);
    expect(canAddSite("command", 4).allowed).toBe(true);
    expect(canAddCompetitor("command", 0).allowed).toBe(true);
    expect(canAddCompetitor("command", 9).allowed).toBe(true);
    expect(canRunManualCheck("command", 100).allowed).toBe(true);
    expect(canUseGapAnalysis("command", 100).allowed).toBe(true);
    expect(canUseContentRecommendations("command", 100).allowed).toBe(true);
    expect(canUseActionPlan("command").allowed).toBe(true);
    expect(canUseCompetitorDeepDive("command").allowed).toBe(true);
    expect(canGeneratePage("command", 0).allowed).toBe(true);
    expect(canGeneratePage("command", 14).allowed).toBe(true);
  });

  it("Dominate customers CAN: everything + even more sites/competitors + unlimited pages", () => {
    expect(canAddSite("dominate", 24).allowed).toBe(true);
    expect(canAddCompetitor("dominate", 24).allowed).toBe(true);
    expect(canRunManualCheck("dominate", 100).allowed).toBe(true);
    expect(canUseGapAnalysis("dominate", 100).allowed).toBe(true);
    expect(canUseContentRecommendations("dominate", 100).allowed).toBe(true);
    expect(canUseActionPlan("dominate").allowed).toBe(true);
    expect(canUseCompetitorDeepDive("dominate").allowed).toBe(true);
    expect(canGeneratePage("dominate", 100).allowed).toBe(true);
  });

  it("Free users are properly limited", () => {
    expect(canAddSite("free", 1).allowed).toBe(false);
    expect(canAddCompetitor("free", 0).allowed).toBe(false);
    expect(canRunManualCheck("free", 3).allowed).toBe(false);
    expect(canUseGapAnalysis("free", 0).allowed).toBe(false);
    expect(canUseContentRecommendations("free", 0).allowed).toBe(false);
    expect(canUseActionPlan("free").allowed).toBe(false);
    expect(canUseCompetitorDeepDive("free").allowed).toBe(false);
    expect(canGeneratePage("free", 0).allowed).toBe(false);
  });
});
