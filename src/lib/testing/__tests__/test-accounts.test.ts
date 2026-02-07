import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  TEST_ACCOUNTS,
  isTestAccount,
  getTestPlan,
  getTestAccount,
  isTestingModeEnabled,
  shouldBypassPaywall,
} from "../test-accounts";

// ============================================
// TESTING_MODE DISABLED (PRODUCTION)
// ============================================

describe("TESTING_MODE disabled (production default)", () => {
  beforeEach(() => {
    // Ensure TESTING_MODE is not set (production behavior)
    delete process.env.TESTING_MODE;
    delete process.env.NEXT_PUBLIC_TESTING_MODE;
  });

  it("isTestingModeEnabled returns false", () => {
    expect(isTestingModeEnabled()).toBe(false);
  });

  it("isTestAccount returns false for test emails", () => {
    expect(isTestAccount("test-free@cabbageseo.test")).toBe(false);
    expect(isTestAccount("test-starter@cabbageseo.test")).toBe(false);
    expect(isTestAccount("test-pro@cabbageseo.test")).toBe(false);
  });

  it("isTestAccount returns false for regular emails", () => {
    expect(isTestAccount("user@example.com")).toBe(false);
  });

  it("isTestAccount returns false for null/undefined", () => {
    expect(isTestAccount(null)).toBe(false);
    expect(isTestAccount(undefined)).toBe(false);
    expect(isTestAccount("")).toBe(false);
  });

  it("getTestPlan returns null for test emails", () => {
    expect(getTestPlan("test-free@cabbageseo.test")).toBeNull();
    expect(getTestPlan("test-starter@cabbageseo.test")).toBeNull();
    expect(getTestPlan("test-pro@cabbageseo.test")).toBeNull();
  });

  it("getTestPlan returns null for regular emails", () => {
    expect(getTestPlan("user@example.com")).toBeNull();
  });

  it("getTestAccount returns null for test emails", () => {
    expect(getTestAccount("test-free@cabbageseo.test")).toBeNull();
    expect(getTestAccount("test-starter@cabbageseo.test")).toBeNull();
  });

  it("shouldBypassPaywall returns false for test emails", () => {
    expect(shouldBypassPaywall("test-free@cabbageseo.test")).toBe(false);
    expect(shouldBypassPaywall("test-starter@cabbageseo.test")).toBe(false);
    expect(shouldBypassPaywall("test-pro@cabbageseo.test")).toBe(false);
  });

  it("shouldBypassPaywall returns false for regular emails", () => {
    expect(shouldBypassPaywall("user@example.com")).toBe(false);
  });

  it("shouldBypassPaywall returns false for null/undefined", () => {
    expect(shouldBypassPaywall(null)).toBe(false);
    expect(shouldBypassPaywall(undefined)).toBe(false);
  });
});

// ============================================
// TESTING_MODE ENABLED
// ============================================

describe("TESTING_MODE enabled", () => {
  beforeEach(() => {
    process.env.TESTING_MODE = "true";
  });

  afterEach(() => {
    delete process.env.TESTING_MODE;
    delete process.env.NEXT_PUBLIC_TESTING_MODE;
  });

  it("isTestingModeEnabled returns true", () => {
    expect(isTestingModeEnabled()).toBe(true);
  });

  it("isTestAccount returns true for valid test emails", () => {
    expect(isTestAccount("test-free@cabbageseo.test")).toBe(true);
    expect(isTestAccount("test-starter@cabbageseo.test")).toBe(true);
    expect(isTestAccount("test-pro@cabbageseo.test")).toBe(true);
  });

  it("isTestAccount is case-insensitive", () => {
    expect(isTestAccount("TEST-FREE@CABBAGESEO.TEST")).toBe(true);
    expect(isTestAccount("Test-Starter@CabbageSEO.Test")).toBe(true);
  });

  it("isTestAccount returns false for non-test emails", () => {
    expect(isTestAccount("user@example.com")).toBe(false);
    expect(isTestAccount("admin@cabbageseo.com")).toBe(false);
    expect(isTestAccount("test@other.com")).toBe(false);
  });

  it("isTestAccount returns false for null/undefined/empty", () => {
    expect(isTestAccount(null)).toBe(false);
    expect(isTestAccount(undefined)).toBe(false);
    expect(isTestAccount("")).toBe(false);
  });

  it("getTestPlan returns correct plan for each test account", () => {
    expect(getTestPlan("test-free@cabbageseo.test")).toBe("free");
    expect(getTestPlan("test-starter@cabbageseo.test")).toBe("scout");
    expect(getTestPlan("test-pro@cabbageseo.test")).toBe("command");
  });

  it("getTestPlan is case-insensitive", () => {
    expect(getTestPlan("TEST-FREE@CABBAGESEO.TEST")).toBe("free");
  });

  it("getTestPlan returns null for unknown emails", () => {
    expect(getTestPlan("unknown@test.com")).toBeNull();
  });

  it("getTestPlan returns null for null/undefined", () => {
    expect(getTestPlan(null)).toBeNull();
    expect(getTestPlan(undefined)).toBeNull();
  });

  it("getTestAccount returns full account info", () => {
    const account = getTestAccount("test-free@cabbageseo.test");
    expect(account).not.toBeNull();
    expect(account!.email).toBe("test-free@cabbageseo.test");
    expect(account!.plan).toBe("free");
    expect(account!.password).toBeDefined();
    expect(account!.description).toBeDefined();
  });

  it("getTestAccount returns null for unknown emails", () => {
    expect(getTestAccount("unknown@test.com")).toBeNull();
  });

  it("shouldBypassPaywall returns true for test emails", () => {
    expect(shouldBypassPaywall("test-free@cabbageseo.test")).toBe(true);
    expect(shouldBypassPaywall("test-starter@cabbageseo.test")).toBe(true);
    expect(shouldBypassPaywall("test-pro@cabbageseo.test")).toBe(true);
  });

  it("shouldBypassPaywall returns false for non-test emails", () => {
    expect(shouldBypassPaywall("user@example.com")).toBe(false);
  });
});

// ============================================
// NEXT_PUBLIC_TESTING_MODE also works
// ============================================

describe("NEXT_PUBLIC_TESTING_MODE env var", () => {
  afterEach(() => {
    delete process.env.TESTING_MODE;
    delete process.env.NEXT_PUBLIC_TESTING_MODE;
  });

  it("enables testing mode via NEXT_PUBLIC_TESTING_MODE", () => {
    process.env.NEXT_PUBLIC_TESTING_MODE = "true";
    expect(isTestingModeEnabled()).toBe(true);
    expect(isTestAccount("test-free@cabbageseo.test")).toBe(true);
  });

  it("does NOT enable when set to something other than 'true'", () => {
    process.env.TESTING_MODE = "false";
    expect(isTestingModeEnabled()).toBe(false);
    expect(isTestAccount("test-free@cabbageseo.test")).toBe(false);
  });

  it("does NOT enable when set to '1'", () => {
    process.env.TESTING_MODE = "1";
    expect(isTestingModeEnabled()).toBe(false);
  });

  it("does NOT enable when set to empty string", () => {
    process.env.TESTING_MODE = "";
    expect(isTestingModeEnabled()).toBe(false);
  });
});

// ============================================
// TEST ACCOUNT DATA INTEGRITY
// ============================================

describe("TEST_ACCOUNTS data integrity", () => {
  it("has 3 test accounts", () => {
    expect(TEST_ACCOUNTS).toHaveLength(3);
  });

  it("each account has all required fields", () => {
    for (const account of TEST_ACCOUNTS) {
      expect(account.email).toBeDefined();
      expect(account.email.length).toBeGreaterThan(0);
      expect(account.password).toBeDefined();
      expect(account.password.length).toBeGreaterThan(0);
      expect(account.plan).toBeDefined();
      expect(["free", "scout", "command", "dominate"]).toContain(account.plan);
      expect(account.description).toBeDefined();
    }
  });

  it("all emails use @cabbageseo.test domain (not real domains)", () => {
    for (const account of TEST_ACCOUNTS) {
      expect(account.email).toMatch(/@cabbageseo\.test$/);
    }
  });

  it("covers free, scout, and command tiers", () => {
    const plans = TEST_ACCOUNTS.map((a) => a.plan);
    expect(plans).toContain("free");
    expect(plans).toContain("scout");
    expect(plans).toContain("command");
  });

  it("all emails are unique", () => {
    const emails = TEST_ACCOUNTS.map((a) => a.email);
    expect(new Set(emails).size).toBe(emails.length);
  });
});
