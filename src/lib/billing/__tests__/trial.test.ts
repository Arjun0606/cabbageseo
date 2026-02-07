import { describe, it, expect, vi, afterEach } from "vitest";
import { checkTrialStatus, canAccessProduct, TRIAL_DAYS } from "../citation-plans";

// ============================================
// checkTrialStatus
// ============================================

describe("checkTrialStatus", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("TRIAL_DAYS is 7", () => {
    expect(TRIAL_DAYS).toBe(7);
  });

  it("created today: not expired, 7 days remaining", () => {
    const now = new Date();
    const result = checkTrialStatus(now);
    expect(result.expired).toBe(false);
    expect(result.daysRemaining).toBe(7);
    expect(result.daysUsed).toBe(0);
  });

  it("created 1 day ago: not expired, 6 days remaining", () => {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    const result = checkTrialStatus(date);
    expect(result.expired).toBe(false);
    expect(result.daysRemaining).toBe(6);
    expect(result.daysUsed).toBe(1);
  });

  it("created 3 days ago: not expired, 4 days remaining", () => {
    const date = new Date();
    date.setDate(date.getDate() - 3);
    const result = checkTrialStatus(date);
    expect(result.expired).toBe(false);
    expect(result.daysRemaining).toBe(4);
    expect(result.daysUsed).toBe(3);
  });

  it("created 6 days ago: not expired, 1 day remaining", () => {
    const date = new Date();
    date.setDate(date.getDate() - 6);
    const result = checkTrialStatus(date);
    expect(result.expired).toBe(false);
    expect(result.daysRemaining).toBe(1);
    expect(result.daysUsed).toBe(6);
  });

  it("created 7 days ago: expired, 0 days remaining", () => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    const result = checkTrialStatus(date);
    expect(result.expired).toBe(true);
    expect(result.daysRemaining).toBe(0);
    expect(result.daysUsed).toBe(7);
  });

  it("created 30 days ago: expired, 0 days remaining", () => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    const result = checkTrialStatus(date);
    expect(result.expired).toBe(true);
    expect(result.daysRemaining).toBe(0);
    expect(result.daysUsed).toBe(30);
  });

  it("accepts ISO string date", () => {
    const date = new Date();
    const result = checkTrialStatus(date.toISOString());
    expect(result.expired).toBe(false);
    expect(result.daysRemaining).toBe(7);
  });
});

// ============================================
// canAccessProduct
// ============================================

describe("canAccessProduct", () => {
  it("Free + created today: allowed", () => {
    const now = new Date();
    const result = canAccessProduct("free", now);
    expect(result.allowed).toBe(true);
  });

  it("Free + created 3 days ago: allowed", () => {
    const date = new Date();
    date.setDate(date.getDate() - 3);
    const result = canAccessProduct("free", date);
    expect(result.allowed).toBe(true);
  });

  it("Free + created 6 days ago: allowed (still in trial)", () => {
    const date = new Date();
    date.setDate(date.getDate() - 6);
    const result = canAccessProduct("free", date);
    expect(result.allowed).toBe(true);
  });

  it("Free + created 8 days ago: denied + upgradeRequired", () => {
    const date = new Date();
    date.setDate(date.getDate() - 8);
    const result = canAccessProduct("free", date);
    expect(result.allowed).toBe(false);
    expect(result.upgradeRequired).toBe(true);
    expect(result.reason).toContain("trial");
  });

  it("Free + created 30 days ago: denied", () => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    const result = canAccessProduct("free", date);
    expect(result.allowed).toBe(false);
    expect(result.upgradeRequired).toBe(true);
  });

  // Paid plans should ALWAYS be allowed regardless of creation date
  it("Scout + expired trial date: allowed (paid plan bypasses trial)", () => {
    const date = new Date();
    date.setDate(date.getDate() - 100);
    const result = canAccessProduct("scout", date);
    expect(result.allowed).toBe(true);
  });

  it("Command + expired trial date: allowed", () => {
    const date = new Date();
    date.setDate(date.getDate() - 365);
    const result = canAccessProduct("command", date);
    expect(result.allowed).toBe(true);
  });

  it("Dominate + expired trial date: allowed", () => {
    const date = new Date();
    date.setDate(date.getDate() - 999);
    const result = canAccessProduct("dominate", date);
    expect(result.allowed).toBe(true);
  });

  // Legacy plan names should also work
  it("Legacy 'starter' (=scout) + expired date: allowed", () => {
    const date = new Date();
    date.setDate(date.getDate() - 100);
    const result = canAccessProduct("starter", date);
    expect(result.allowed).toBe(true);
  });

  it("Legacy 'pro' (=command) + expired date: allowed", () => {
    const date = new Date();
    date.setDate(date.getDate() - 100);
    const result = canAccessProduct("pro", date);
    expect(result.allowed).toBe(true);
  });
});
