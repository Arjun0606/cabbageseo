import { describe, it, expect } from "vitest";
import { canAccessProduct, TRIAL_DAYS } from "../citation-plans";

// ============================================
// TRIAL_DAYS (deprecated — kept for backward compat)
// ============================================

describe("TRIAL_DAYS (deprecated)", () => {
  it("TRIAL_DAYS is 7 (kept for backward compatibility)", () => {
    expect(TRIAL_DAYS).toBe(7);
  });
});

// ============================================
// canAccessProduct — No More Free Trial
// Free plan = always denied (must subscribe)
// ============================================

describe("canAccessProduct", () => {
  it("Free plan: always denied (no trial)", () => {
    const result = canAccessProduct("free");
    expect(result.allowed).toBe(false);
    expect(result.upgradeRequired).toBe(true);
    expect(result.reason).toContain("subscription");
  });

  it("Free plan with recent date: still denied (no trial)", () => {
    const now = new Date();
    const result = canAccessProduct("free", now);
    expect(result.allowed).toBe(false);
    expect(result.upgradeRequired).toBe(true);
  });

  it("Free plan with old date: denied", () => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    const result = canAccessProduct("free", date);
    expect(result.allowed).toBe(false);
    expect(result.upgradeRequired).toBe(true);
  });

  // Paid plans should ALWAYS be allowed regardless of creation date
  it("Scout: allowed", () => {
    const result = canAccessProduct("scout");
    expect(result.allowed).toBe(true);
  });

  it("Command: allowed", () => {
    const result = canAccessProduct("command");
    expect(result.allowed).toBe(true);
  });

  it("Dominate: allowed", () => {
    const result = canAccessProduct("dominate");
    expect(result.allowed).toBe(true);
  });

  it("Scout + old date: allowed (paid plan)", () => {
    const date = new Date();
    date.setDate(date.getDate() - 100);
    const result = canAccessProduct("scout", date);
    expect(result.allowed).toBe(true);
  });

  it("Command + old date: allowed", () => {
    const date = new Date();
    date.setDate(date.getDate() - 365);
    const result = canAccessProduct("command", date);
    expect(result.allowed).toBe(true);
  });

  it("Dominate + old date: allowed", () => {
    const date = new Date();
    date.setDate(date.getDate() - 999);
    const result = canAccessProduct("dominate", date);
    expect(result.allowed).toBe(true);
  });

  // Legacy plan names should also work
  it("Legacy 'starter' (=scout): allowed", () => {
    const result = canAccessProduct("starter");
    expect(result.allowed).toBe(true);
  });

  it("Legacy 'pro' (=command): allowed", () => {
    const result = canAccessProduct("pro");
    expect(result.allowed).toBe(true);
  });

  it("Legacy 'pro_plus' (=dominate): allowed", () => {
    const result = canAccessProduct("pro_plus");
    expect(result.allowed).toBe(true);
  });
});
