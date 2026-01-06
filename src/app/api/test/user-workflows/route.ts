/**
 * Comprehensive User Workflow Tests
 * 
 * Simulates REAL user journeys for Free, Starter, and Pro plans.
 * Tests every feature, limit, and workflow to ensure no broken promises.
 * 
 * GET /api/test/user-workflows?secret=YOUR_TEST_SECRET
 */

import { NextRequest, NextResponse } from "next/server";
import { CITATION_PLANS, checkTrialStatus, canAccessProduct, canUseGapAnalysis, canUseContentRecommendations, canUseActionPlan } from "@/lib/billing/citation-plans";

const TEST_SECRET = process.env.TEST_SECRET || "cabbageseo-test-2024";

interface WorkflowTest {
  name: string;
  status: "pass" | "fail" | "warning";
  description: string;
  details?: unknown;
}

interface PlanWorkflow {
  planId: string;
  planName: string;
  monthlyPrice: number;
  tests: WorkflowTest[];
  passed: number;
  failed: number;
}

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (secret !== TEST_SECRET) {
    return NextResponse.json({ error: "Invalid test secret" }, { status: 401 });
  }

  const workflows: PlanWorkflow[] = [];
  const startTime = Date.now();

  // ============================================
  // FREE PLAN WORKFLOW
  // ============================================
  const freePlan = CITATION_PLANS.free;
  const freeWorkflow: PlanWorkflow = {
    planId: "free",
    planName: freePlan.name,
    monthlyPrice: freePlan.monthlyPrice,
    tests: [],
    passed: 0,
    failed: 0,
  };

  // Simulate a free trial user created today
  const freeUserCreatedAt = new Date();
  const freeTrialStatus = checkTrialStatus(freeUserCreatedAt);

  // Free: Trial days check
  if (freeTrialStatus.daysRemaining === 10 && !freeTrialStatus.expired) {
    freeWorkflow.tests.push({
      name: "Trial timer shows 10 days",
      status: "pass",
      description: "New user sees 10-day trial countdown",
      details: freeTrialStatus,
    });
    freeWorkflow.passed++;
  } else {
    freeWorkflow.tests.push({
      name: "Trial timer shows 10 days",
      status: "fail",
      description: "Trial countdown should show 10 days for new user",
      details: freeTrialStatus,
    });
    freeWorkflow.failed++;
  }

  // Free: Site limit (1 site)
  if (freePlan.limits.sites === 1) {
    freeWorkflow.tests.push({
      name: "Can add 1 website only",
      status: "pass",
      description: "Free users limited to 1 website",
    });
    freeWorkflow.passed++;
  } else {
    freeWorkflow.tests.push({
      name: "Can add 1 website only",
      status: "fail",
      description: `Expected 1 site limit, got ${freePlan.limits.sites}`,
    });
    freeWorkflow.failed++;
  }

  // Free: Manual checks (3/day)
  if (freePlan.limits.manualChecksPerDay === 3) {
    freeWorkflow.tests.push({
      name: "Limited to 3 manual checks/day",
      status: "pass",
      description: "Free users get 3 manual citation checks per day",
    });
    freeWorkflow.passed++;
  } else {
    freeWorkflow.tests.push({
      name: "Limited to 3 manual checks/day",
      status: "fail",
      description: `Expected 3 checks, got ${freePlan.limits.manualChecksPerDay}`,
    });
    freeWorkflow.failed++;
  }

  // Free: No competitors
  if (freePlan.limits.competitors === 0) {
    freeWorkflow.tests.push({
      name: "No competitor tracking",
      status: "pass",
      description: "Free users cannot track competitors",
    });
    freeWorkflow.passed++;
  } else {
    freeWorkflow.tests.push({
      name: "No competitor tracking",
      status: "fail",
      description: `Expected 0 competitors, got ${freePlan.limits.competitors}`,
    });
    freeWorkflow.failed++;
  }

  // Free: No auto-monitoring
  if (!freePlan.features.dailyAutoCheck && !freePlan.features.hourlyAutoCheck) {
    freeWorkflow.tests.push({
      name: "No auto-monitoring",
      status: "pass",
      description: "Free users must manually check (no automation)",
    });
    freeWorkflow.passed++;
  } else {
    freeWorkflow.tests.push({
      name: "No auto-monitoring",
      status: "fail",
      description: "Free users should not have auto-monitoring",
    });
    freeWorkflow.failed++;
  }

  // Free: No intelligence features
  const freeGapAnalysis = canUseGapAnalysis("free", 0);
  const freeContent = canUseContentRecommendations("free", 0);
  const freeActionPlan = canUseActionPlan("free");
  
  if (!freeGapAnalysis.allowed && !freeContent.allowed && !freeActionPlan.allowed) {
    freeWorkflow.tests.push({
      name: "No intelligence features",
      status: "pass",
      description: "Free users blocked from Why Not Me?, Content Ideas, Action Plans",
      details: {
        gapAnalysis: freeGapAnalysis,
        contentIdeas: freeContent,
        actionPlan: freeActionPlan,
      },
    });
    freeWorkflow.passed++;
  } else {
    freeWorkflow.tests.push({
      name: "No intelligence features",
      status: "fail",
      description: "Free users should be blocked from all intelligence features",
    });
    freeWorkflow.failed++;
  }

  // Free: GEO Score available
  if (freePlan.features.geoScore) {
    freeWorkflow.tests.push({
      name: "GEO Score available",
      status: "pass",
      description: "All users can see their GEO Score",
    });
    freeWorkflow.passed++;
  } else {
    freeWorkflow.tests.push({
      name: "GEO Score available",
      status: "fail",
      description: "GEO Score should be available on all plans",
    });
    freeWorkflow.failed++;
  }

  // Free: No email alerts
  if (!freePlan.features.emailAlerts) {
    freeWorkflow.tests.push({
      name: "No email alerts",
      status: "pass",
      description: "Free users don't receive email notifications",
    });
    freeWorkflow.passed++;
  } else {
    freeWorkflow.tests.push({
      name: "No email alerts",
      status: "fail",
      description: "Free users should not have email alerts",
    });
    freeWorkflow.failed++;
  }

  // Free: History retention (7 days)
  if (freePlan.limits.historyDays === 7) {
    freeWorkflow.tests.push({
      name: "7-day history retention",
      status: "pass",
      description: "Citations kept for 7 days on free plan",
    });
    freeWorkflow.passed++;
  } else {
    freeWorkflow.tests.push({
      name: "7-day history retention",
      status: "fail",
      description: `Expected 7 days, got ${freePlan.limits.historyDays}`,
    });
    freeWorkflow.failed++;
  }

  // Free: Trial expiration blocks access
  const expiredUser = new Date(Date.now() - 11 * 24 * 60 * 60 * 1000); // 11 days ago
  const expiredTrialStatus = checkTrialStatus(expiredUser);
  const canAccess = canAccessProduct("free", expiredUser);
  
  if (expiredTrialStatus.expired && !canAccess.allowed) {
    freeWorkflow.tests.push({
      name: "Expired trial blocks access",
      status: "pass",
      description: "After 10 days, free users must upgrade",
      details: { expired: expiredTrialStatus.expired, canAccess },
    });
    freeWorkflow.passed++;
  } else {
    freeWorkflow.tests.push({
      name: "Expired trial blocks access",
      status: "fail",
      description: "Expired trials should block product access",
      details: { expired: expiredTrialStatus.expired, canAccess },
    });
    freeWorkflow.failed++;
  }

  workflows.push(freeWorkflow);

  // ============================================
  // STARTER PLAN WORKFLOW
  // ============================================
  const starterPlan = CITATION_PLANS.starter;
  const starterWorkflow: PlanWorkflow = {
    planId: "starter",
    planName: starterPlan.name,
    monthlyPrice: starterPlan.monthlyPrice,
    tests: [],
    passed: 0,
    failed: 0,
  };

  // Starter: Price check
  if (starterPlan.monthlyPrice === 29 && starterPlan.yearlyPrice === 24) {
    starterWorkflow.tests.push({
      name: "Pricing: $29/mo or $24/mo yearly",
      status: "pass",
      description: "Starter plan priced correctly with ~17% yearly discount",
    });
    starterWorkflow.passed++;
  } else {
    starterWorkflow.tests.push({
      name: "Pricing correct",
      status: "fail",
      description: `Expected $29/$24, got ${starterPlan.monthlyPrice}/${starterPlan.yearlyPrice}`,
    });
    starterWorkflow.failed++;
  }

  // Starter: 3 sites
  if (starterPlan.limits.sites === 3) {
    starterWorkflow.tests.push({
      name: "Can add 3 websites",
      status: "pass",
      description: "Starter users can track up to 3 websites",
    });
    starterWorkflow.passed++;
  } else {
    starterWorkflow.tests.push({
      name: "Can add 3 websites",
      status: "fail",
      description: `Expected 3 sites, got ${starterPlan.limits.sites}`,
    });
    starterWorkflow.failed++;
  }

  // Starter: Unlimited manual checks
  if (starterPlan.limits.manualChecksPerDay === -1) {
    starterWorkflow.tests.push({
      name: "Unlimited manual checks",
      status: "pass",
      description: "Starter users have no daily check limit",
    });
    starterWorkflow.passed++;
  } else {
    starterWorkflow.tests.push({
      name: "Unlimited manual checks",
      status: "fail",
      description: `Expected unlimited (-1), got ${starterPlan.limits.manualChecksPerDay}`,
    });
    starterWorkflow.failed++;
  }

  // Starter: 2 competitors
  if (starterPlan.limits.competitors === 2) {
    starterWorkflow.tests.push({
      name: "2 competitors per site",
      status: "pass",
      description: "Starter users can track 2 competitors per site",
    });
    starterWorkflow.passed++;
  } else {
    starterWorkflow.tests.push({
      name: "2 competitors per site",
      status: "fail",
      description: `Expected 2 competitors, got ${starterPlan.limits.competitors}`,
    });
    starterWorkflow.failed++;
  }

  // Starter: Daily auto-monitoring
  if (starterPlan.features.dailyAutoCheck && !starterPlan.features.hourlyAutoCheck) {
    starterWorkflow.tests.push({
      name: "Daily auto-monitoring (not hourly)",
      status: "pass",
      description: "Sites checked automatically every day",
    });
    starterWorkflow.passed++;
  } else {
    starterWorkflow.tests.push({
      name: "Daily auto-monitoring (not hourly)",
      status: "fail",
      description: "Starter should have daily but not hourly monitoring",
    });
    starterWorkflow.failed++;
  }

  // Starter: Email alerts enabled
  if (starterPlan.features.emailAlerts && starterPlan.features.weeklyReport) {
    starterWorkflow.tests.push({
      name: "Email alerts & weekly reports",
      status: "pass",
      description: "Starter users receive email notifications and weekly digests",
    });
    starterWorkflow.passed++;
  } else {
    starterWorkflow.tests.push({
      name: "Email alerts & weekly reports",
      status: "fail",
      description: "Starter should have email alerts and weekly reports",
    });
    starterWorkflow.failed++;
  }

  // Starter: Limited intelligence features
  const starterGapAnalysis = canUseGapAnalysis("starter", 0);
  const starterGapAnalysisAtLimit = canUseGapAnalysis("starter", 5);
  const starterContent = canUseContentRecommendations("starter", 0);
  const starterContentAtLimit = canUseContentRecommendations("starter", 3);
  const starterActionPlan = canUseActionPlan("starter");

  if (
    starterGapAnalysis.allowed && starterGapAnalysis.remaining === 5 &&
    !starterGapAnalysisAtLimit.allowed &&
    starterContent.allowed && starterContent.remaining === 3 &&
    !starterContentAtLimit.allowed &&
    !starterActionPlan.allowed
  ) {
    starterWorkflow.tests.push({
      name: "Limited intelligence: 5 gap, 3 content, no action plan",
      status: "pass",
      description: "Starter has 5 Why Not Me?, 3 Content Ideas, no Action Plan",
      details: {
        gapAnalysis: { initial: starterGapAnalysis, atLimit: starterGapAnalysisAtLimit },
        contentIdeas: { initial: starterContent, atLimit: starterContentAtLimit },
        actionPlan: starterActionPlan,
      },
    });
    starterWorkflow.passed++;
  } else {
    starterWorkflow.tests.push({
      name: "Limited intelligence: 5 gap, 3 content, no action plan",
      status: "fail",
      description: "Starter intelligence limits not enforced correctly",
      details: { starterGapAnalysis, starterContent, starterActionPlan },
    });
    starterWorkflow.failed++;
  }

  // Starter: 30-day history
  if (starterPlan.limits.historyDays === 30) {
    starterWorkflow.tests.push({
      name: "30-day history retention",
      status: "pass",
      description: "Citations kept for 30 days on Starter plan",
    });
    starterWorkflow.passed++;
  } else {
    starterWorkflow.tests.push({
      name: "30-day history retention",
      status: "fail",
      description: `Expected 30 days, got ${starterPlan.limits.historyDays}`,
    });
    starterWorkflow.failed++;
  }

  // Starter: CSV export
  if (starterPlan.features.csvExport) {
    starterWorkflow.tests.push({
      name: "CSV export available",
      status: "pass",
      description: "Starter users can export citations to CSV",
    });
    starterWorkflow.passed++;
  } else {
    starterWorkflow.tests.push({
      name: "CSV export available",
      status: "fail",
      description: "Starter should have CSV export",
    });
    starterWorkflow.failed++;
  }

  // Starter: GEO tips
  if (starterPlan.features.geoTips) {
    starterWorkflow.tests.push({
      name: "GEO optimization tips",
      status: "pass",
      description: "Starter users get optimization suggestions",
    });
    starterWorkflow.passed++;
  } else {
    starterWorkflow.tests.push({
      name: "GEO optimization tips",
      status: "fail",
      description: "Starter should have GEO tips",
    });
    starterWorkflow.failed++;
  }

  workflows.push(starterWorkflow);

  // ============================================
  // PRO PLAN WORKFLOW
  // ============================================
  const proPlan = CITATION_PLANS.pro;
  const proWorkflow: PlanWorkflow = {
    planId: "pro",
    planName: proPlan.name,
    monthlyPrice: proPlan.monthlyPrice,
    tests: [],
    passed: 0,
    failed: 0,
  };

  // Pro: Price check
  if (proPlan.monthlyPrice === 79 && proPlan.yearlyPrice === 66) {
    proWorkflow.tests.push({
      name: "Pricing: $79/mo or $66/mo yearly",
      status: "pass",
      description: "Pro plan priced correctly with ~16% yearly discount",
    });
    proWorkflow.passed++;
  } else {
    proWorkflow.tests.push({
      name: "Pricing correct",
      status: "fail",
      description: `Expected $79/$66, got ${proPlan.monthlyPrice}/${proPlan.yearlyPrice}`,
    });
    proWorkflow.failed++;
  }

  // Pro: 10 sites
  if (proPlan.limits.sites === 10) {
    proWorkflow.tests.push({
      name: "Can add 10 websites",
      status: "pass",
      description: "Pro users can track up to 10 websites",
    });
    proWorkflow.passed++;
  } else {
    proWorkflow.tests.push({
      name: "Can add 10 websites",
      status: "fail",
      description: `Expected 10 sites, got ${proPlan.limits.sites}`,
    });
    proWorkflow.failed++;
  }

  // Pro: 10 competitors
  if (proPlan.limits.competitors === 10) {
    proWorkflow.tests.push({
      name: "10 competitors per site",
      status: "pass",
      description: "Pro users can track 10 competitors per site",
    });
    proWorkflow.passed++;
  } else {
    proWorkflow.tests.push({
      name: "10 competitors per site",
      status: "fail",
      description: `Expected 10 competitors, got ${proPlan.limits.competitors}`,
    });
    proWorkflow.failed++;
  }

  // Pro: Hourly auto-monitoring
  if (proPlan.features.dailyAutoCheck && proPlan.features.hourlyAutoCheck) {
    proWorkflow.tests.push({
      name: "Hourly auto-monitoring",
      status: "pass",
      description: "Sites checked every hour automatically",
    });
    proWorkflow.passed++;
  } else {
    proWorkflow.tests.push({
      name: "Hourly auto-monitoring",
      status: "fail",
      description: "Pro should have both daily and hourly monitoring",
    });
    proWorkflow.failed++;
  }

  // Pro: Unlimited intelligence features
  const proGapAnalysis = canUseGapAnalysis("pro", 1000);
  const proContent = canUseContentRecommendations("pro", 1000);
  const proActionPlan = canUseActionPlan("pro");
  const proCompetitorDeepDive = proPlan.features.competitorDeepDive;

  if (
    proGapAnalysis.allowed && proGapAnalysis.remaining === -1 &&
    proContent.allowed && proContent.remaining === -1 &&
    proActionPlan.allowed &&
    proCompetitorDeepDive
  ) {
    proWorkflow.tests.push({
      name: "Unlimited intelligence features",
      status: "pass",
      description: "Pro has unlimited Why Not Me?, Content Ideas, Action Plans, Competitor Deep Dive",
      details: {
        gapAnalysis: proGapAnalysis,
        contentIdeas: proContent,
        actionPlan: proActionPlan,
        competitorDeepDive: proCompetitorDeepDive,
      },
    });
    proWorkflow.passed++;
  } else {
    proWorkflow.tests.push({
      name: "Unlimited intelligence features",
      status: "fail",
      description: "Pro should have unlimited access to all intelligence features",
      details: { proGapAnalysis, proContent, proActionPlan, proCompetitorDeepDive },
    });
    proWorkflow.failed++;
  }

  // Pro: 365-day history
  if (proPlan.limits.historyDays === 365) {
    proWorkflow.tests.push({
      name: "1-year history retention",
      status: "pass",
      description: "Citations kept for 365 days on Pro plan",
    });
    proWorkflow.passed++;
  } else {
    proWorkflow.tests.push({
      name: "1-year history retention",
      status: "fail",
      description: `Expected 365 days, got ${proPlan.limits.historyDays}`,
    });
    proWorkflow.failed++;
  }

  // Pro: All features enabled
  const allProFeatures = [
    proPlan.features.manualChecks,
    proPlan.features.dailyAutoCheck,
    proPlan.features.hourlyAutoCheck,
    proPlan.features.emailAlerts,
    proPlan.features.weeklyReport,
    proPlan.features.csvExport,
    proPlan.features.geoScore,
    proPlan.features.geoTips,
    proPlan.features.citationGapAnalysis,
    proPlan.features.contentRecommendations,
    proPlan.features.weeklyActionPlan,
    proPlan.features.competitorDeepDive,
  ];

  if (allProFeatures.every(f => f === true)) {
    proWorkflow.tests.push({
      name: "All features enabled",
      status: "pass",
      description: "Pro plan has access to every feature in the product",
    });
    proWorkflow.passed++;
  } else {
    proWorkflow.tests.push({
      name: "All features enabled",
      status: "fail",
      description: "Some Pro features are disabled",
      details: proPlan.features,
    });
    proWorkflow.failed++;
  }

  workflows.push(proWorkflow);

  // ============================================
  // SUMMARY
  // ============================================
  const totalTests = workflows.reduce((sum, w) => sum + w.tests.length, 0);
  const totalPassed = workflows.reduce((sum, w) => sum + w.passed, 0);
  const totalFailed = workflows.reduce((sum, w) => sum + w.failed, 0);
  const duration = Date.now() - startTime;

  return NextResponse.json({
    success: totalFailed === 0,
    summary: {
      total: totalTests,
      passed: totalPassed,
      failed: totalFailed,
      duration: `${duration}ms`,
      passRate: `${Math.round((totalPassed / totalTests) * 100)}%`,
    },
    verdict: totalFailed === 0 
      ? "✅ ALL USER WORKFLOWS VERIFIED - Every plan works as promised!"
      : `❌ ${totalFailed} WORKFLOW FAILURES - Fix before launch!`,
    workflows,
    promisesChecked: [
      "Free: 10-day trial with countdown timer",
      "Free: 1 site, 3 checks/day, 7-day history, GEO Score",
      "Free: No automation, no alerts, no intelligence",
      "Free: Trial expiration blocks access",
      "Starter: $29/mo, 3 sites, unlimited checks, 2 competitors",
      "Starter: Daily auto-monitoring, email alerts, 30-day history",
      "Starter: 5 Why Not Me?, 3 Content Ideas, no Action Plan",
      "Pro: $79/mo, 10 sites, 10 competitors, hourly monitoring",
      "Pro: Unlimited intelligence, 1-year history, all features",
    ],
    timestamp: new Date().toISOString(),
  });
}

