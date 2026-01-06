/**
 * PRICING TIER ENFORCEMENT TEST
 * 
 * Tests EVERY feature and limit for each pricing plan:
 * - Free Trial: 1 site, 3 checks/day, 7-day history, no competitors
 * - Starter: 3 sites, unlimited checks, 30-day history, 2 competitors
 * - Pro: 10 sites, unlimited checks, 365-day history, 10 competitors
 * 
 * GET /api/test/pricing-tiers?secret=YOUR_SECRET
 */

import { NextRequest, NextResponse } from "next/server";
import { CITATION_PLANS, type CitationPlanId } from "@/lib/billing/citation-plans";

interface TestResult {
  name: string;
  expected: string | number | boolean;
  actual: string | number | boolean;
  passed: boolean;
  notes?: string;
}

interface PlanTest {
  planId: string;
  planName: string;
  price: { monthly: number; yearly: number };
  tests: TestResult[];
}

const TEST_SECRET = process.env.TEST_SECRET || "cabbageseo-test-2024";

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (secret !== TEST_SECRET) {
    return NextResponse.json({ error: "Invalid test secret" }, { status: 401 });
  }

  const planTests: PlanTest[] = [];

  // Test each plan
  const plansToTest: CitationPlanId[] = ["free", "starter", "pro"];

  for (const planId of plansToTest) {
    const plan = CITATION_PLANS[planId];
    const tests: TestResult[] = [];

    // ============================================
    // PRICING TESTS
    // ============================================
    tests.push({
      name: "Monthly Price",
      expected: planId === "free" ? 0 : planId === "starter" ? 29 : 79,
      actual: plan.monthlyPrice,
      passed: plan.monthlyPrice === (planId === "free" ? 0 : planId === "starter" ? 29 : 79),
    });

    tests.push({
      name: "Yearly Price (per month)",
      expected: planId === "free" ? 0 : planId === "starter" ? 24 : 66,
      actual: plan.yearlyPrice,
      passed: plan.yearlyPrice === (planId === "free" ? 0 : planId === "starter" ? 24 : 66),
    });

    // Verify yearly discount is ~17%
    if (plan.monthlyPrice > 0) {
      const discount = ((plan.monthlyPrice - plan.yearlyPrice) / plan.monthlyPrice) * 100;
      tests.push({
        name: "Yearly Discount ~17%",
        expected: "15-20%",
        actual: `${discount.toFixed(1)}%`,
        passed: discount >= 15 && discount <= 20,
      });
    }

    // ============================================
    // SITE LIMIT TESTS
    // ============================================
    const expectedSites = planId === "free" ? 1 : planId === "starter" ? 3 : 10;
    tests.push({
      name: "Site Limit",
      expected: expectedSites,
      actual: plan.limits.sites,
      passed: plan.limits.sites === expectedSites,
      notes: `Can track up to ${expectedSites} websites`,
    });

    // ============================================
    // MANUAL CHECKS LIMIT
    // ============================================
    const expectedChecks = planId === "free" ? 3 : -1; // -1 = unlimited
    tests.push({
      name: "Manual Checks/Day",
      expected: planId === "free" ? "3" : "Unlimited",
      actual: plan.limits.manualChecksPerDay === -1 ? "Unlimited" : plan.limits.manualChecksPerDay,
      passed: plan.limits.manualChecksPerDay === expectedChecks,
      notes: planId === "free" ? "Limited to 3 checks per day" : "Unlimited manual checks",
    });

    // ============================================
    // HISTORY DAYS
    // ============================================
    const expectedHistory = planId === "free" ? 7 : planId === "starter" ? 30 : 365;
    tests.push({
      name: "History Retention (Days)",
      expected: expectedHistory,
      actual: plan.limits.historyDays,
      passed: plan.limits.historyDays === expectedHistory,
      notes: `Citation history kept for ${expectedHistory} days`,
    });

    // ============================================
    // COMPETITOR LIMIT
    // ============================================
    const expectedCompetitors = planId === "free" ? 0 : planId === "starter" ? 2 : 10;
    tests.push({
      name: "Competitors per Site",
      expected: expectedCompetitors,
      actual: plan.limits.competitors,
      passed: plan.limits.competitors === expectedCompetitors,
      notes: expectedCompetitors === 0 ? "No competitor tracking" : `Track up to ${expectedCompetitors} competitors`,
    });

    // ============================================
    // GEO SCORE FEATURE
    // ============================================
    tests.push({
      name: "GEO Score",
      expected: true,
      actual: plan.features.geoScore,
      passed: plan.features.geoScore === true,
      notes: "All plans include GEO Score",
    });

    // ============================================
    // GEO TIPS FEATURE
    // ============================================
    const expectedTips = planId !== "free";
    tests.push({
      name: "GEO Tips (Optimization)",
      expected: expectedTips,
      actual: plan.features.geoTips,
      passed: plan.features.geoTips === expectedTips,
      notes: expectedTips ? "Includes optimization tips" : "Basic score only",
    });

    // ============================================
    // DAILY AUTO-CHECK FEATURE
    // ============================================
    const expectedDailyAuto = planId !== "free";
    tests.push({
      name: "Daily Auto-Monitoring",
      expected: expectedDailyAuto,
      actual: plan.features.dailyAutoCheck,
      passed: plan.features.dailyAutoCheck === expectedDailyAuto,
      notes: expectedDailyAuto ? "Sites checked automatically every day" : "Manual checks only",
    });

    // ============================================
    // HOURLY AUTO-CHECK FEATURE (PRO ONLY)
    // ============================================
    const expectedHourlyAuto = planId === "pro";
    tests.push({
      name: "Hourly Auto-Monitoring",
      expected: expectedHourlyAuto,
      actual: plan.features.hourlyAutoCheck,
      passed: plan.features.hourlyAutoCheck === expectedHourlyAuto,
      notes: expectedHourlyAuto ? "Sites checked every hour" : "Daily or manual only",
    });

    // ============================================
    // EMAIL ALERTS FEATURE
    // ============================================
    const expectedEmailAlerts = planId !== "free";
    tests.push({
      name: "Email Alerts",
      expected: expectedEmailAlerts,
      actual: plan.features.emailAlerts,
      passed: plan.features.emailAlerts === expectedEmailAlerts,
      notes: expectedEmailAlerts ? "Get emailed when cited" : "No email notifications",
    });

    // ============================================
    // WEEKLY REPORT FEATURE
    // ============================================
    const expectedWeeklyReport = planId !== "free";
    tests.push({
      name: "Weekly Reports",
      expected: expectedWeeklyReport,
      actual: plan.features.weeklyReport,
      passed: plan.features.weeklyReport === expectedWeeklyReport,
      notes: expectedWeeklyReport ? "Weekly digest via email" : "No weekly reports",
    });

    // ============================================
    // CSV EXPORT FEATURE
    // ============================================
    const expectedExport = planId !== "free";
    tests.push({
      name: "CSV Export",
      expected: expectedExport,
      actual: plan.features.csvExport,
      passed: plan.features.csvExport === expectedExport,
      notes: expectedExport ? "Export citations to CSV" : "No export",
    });

    // ============================================
    // PLAN METADATA
    // ============================================
    tests.push({
      name: "Plan ID Matches",
      expected: planId,
      actual: plan.id,
      passed: plan.id === planId,
    });

    tests.push({
      name: "Plan Name Set",
      expected: "non-empty",
      actual: plan.name,
      passed: plan.name.length > 0,
    });

    tests.push({
      name: "Plan Description Set",
      expected: "non-empty",
      actual: plan.description.substring(0, 30) + "...",
      passed: plan.description.length > 0,
    });

    planTests.push({
      planId,
      planName: plan.name,
      price: { monthly: plan.monthlyPrice, yearly: plan.yearlyPrice },
      tests,
    });
  }

  // ============================================
  // SUMMARY
  // ============================================
  let totalPassed = 0;
  let totalFailed = 0;

  for (const pt of planTests) {
    for (const test of pt.tests) {
      if (test.passed) totalPassed++;
      else totalFailed++;
    }
  }

  // Feature comparison matrix
  const featureMatrix = {
    "Site Limit": {
      free: CITATION_PLANS.free.limits.sites,
      starter: CITATION_PLANS.starter.limits.sites,
      pro: CITATION_PLANS.pro.limits.sites,
    },
    "Manual Checks/Day": {
      free: CITATION_PLANS.free.limits.manualChecksPerDay === -1 ? "Unlimited" : CITATION_PLANS.free.limits.manualChecksPerDay,
      starter: "Unlimited",
      pro: "Unlimited",
    },
    "History (Days)": {
      free: CITATION_PLANS.free.limits.historyDays,
      starter: CITATION_PLANS.starter.limits.historyDays,
      pro: CITATION_PLANS.pro.limits.historyDays,
    },
    "Competitors": {
      free: CITATION_PLANS.free.limits.competitors,
      starter: CITATION_PLANS.starter.limits.competitors,
      pro: CITATION_PLANS.pro.limits.competitors,
    },
    "GEO Score": {
      free: "✅",
      starter: "✅",
      pro: "✅",
    },
    "GEO Tips": {
      free: "❌",
      starter: "✅",
      pro: "✅",
    },
    "Daily Auto-Check": {
      free: "❌",
      starter: "✅",
      pro: "✅",
    },
    "Hourly Auto-Check": {
      free: "❌",
      starter: "❌",
      pro: "✅",
    },
    "Email Alerts": {
      free: "❌",
      starter: "✅",
      pro: "✅",
    },
    "Weekly Reports": {
      free: "❌",
      starter: "✅",
      pro: "✅",
    },
    "CSV Export": {
      free: "❌",
      starter: "✅",
      pro: "✅",
    },
  };

  return NextResponse.json({
    success: totalFailed === 0,
    summary: {
      total: totalPassed + totalFailed,
      passed: totalPassed,
      failed: totalFailed,
      plans: planTests.length,
    },
    featureMatrix,
    planTests,
    timestamp: new Date().toISOString(),
  });
}

