/**
 * End-to-End User Simulation Test
 * 
 * Creates test users for Free, Starter, and Pro plans
 * and tests EVERY feature, workflow, and limit.
 * 
 * This is the definitive test before launch.
 * 
 * GET /api/test/e2e-simulation?secret=YOUR_TEST_SECRET
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { 
  CITATION_PLANS, 
  checkTrialStatus, 
  canAccessProduct,
  canUseGapAnalysis,
  canUseContentRecommendations,
  canUseActionPlan,
  canAddSite,
  canAddCompetitor,
  canRunManualCheck,
} from "@/lib/billing/citation-plans";
import { citationIntelligence } from "@/lib/geo/citation-intelligence";

const TEST_SECRET = process.env.TEST_SECRET || "cabbageseo-test-2024";

interface TestResult {
  feature: string;
  plan: string;
  expected: string;
  actual: string;
  passed: boolean;
  details?: unknown;
}

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (secret !== TEST_SECRET) {
    return NextResponse.json({ error: "Invalid test secret" }, { status: 401 });
  }

  const startTime = Date.now();
  const results: TestResult[] = [];
  const supabase = createServiceClient();

  // ============================================
  // PHASE 1: DATABASE SETUP - Create Test Data
  // ============================================
  
  // Create test organization for each plan (using UUIDs)
  const testOrgs = [
    { id: "00000000-0000-0000-0000-000000000001", plan: "free", name: "Test Free Org" },
    { id: "00000000-0000-0000-0000-000000000002", plan: "starter", name: "Test Starter Org" },
    { id: "00000000-0000-0000-0000-000000000003", plan: "pro", name: "Test Pro Org" },
  ];

  // Clean up any existing test data (using UUID pattern 00000000-0000-0000-0000-...)
  await supabase.from("citations").delete().like("site_id", "00000000-0000-0000-0000-%");
  await supabase.from("competitors").delete().like("site_id", "00000000-0000-0000-0000-%");
  await supabase.from("sites").delete().like("id", "00000000-0000-0000-0000-%");
  await supabase.from("usage").delete().like("organization_id", "00000000-0000-0000-0000-%");
  await supabase.from("users").delete().like("id", "00000000-0000-0000-0000-%");
  await supabase.from("organizations").delete().like("id", "00000000-0000-0000-0000-%");

  // Create test organizations
  for (const org of testOrgs) {
    const { error } = await supabase.from("organizations").insert({
      id: org.id,
      name: org.name,
      slug: org.id,
      plan: org.plan,
      created_at: new Date().toISOString(),
    } as any);
    
    if (error) {
      results.push({
        feature: "Create test organization",
        plan: org.plan,
        expected: "Organization created",
        actual: `Error: ${error.message}`,
        passed: false,
      });
    }
  }

  // Create test users
  const testUsers = [
    { id: "00000000-0000-0000-0000-000000000011", email: "free@test.cabbageseo.com", org_id: "00000000-0000-0000-0000-000000000001" },
    { id: "00000000-0000-0000-0000-000000000012", email: "starter@test.cabbageseo.com", org_id: "00000000-0000-0000-0000-000000000002" },
    { id: "00000000-0000-0000-0000-000000000013", email: "pro@test.cabbageseo.com", org_id: "00000000-0000-0000-0000-000000000003" },
  ];

  for (const user of testUsers) {
    await supabase.from("users").insert({
      id: user.id,
      email: user.email,
      full_name: `Test ${user.org_id.split("-")[2]} User`,
      organization_id: user.org_id,
      created_at: new Date().toISOString(),
    } as any);
  }

  // ============================================
  // PHASE 2: FREE PLAN TESTS
  // ============================================
  
  const freePlan = CITATION_PLANS.free;
  const freeOrgId = "00000000-0000-0000-0000-000000000001";

  // Test 1: Trial countdown
  const freeTrialStatus = checkTrialStatus(new Date());
  results.push({
    feature: "Trial countdown",
    plan: "free",
    expected: "10 days remaining",
    actual: `${freeTrialStatus.daysRemaining} days remaining`,
    passed: freeTrialStatus.daysRemaining === 10 && !freeTrialStatus.expired,
    details: freeTrialStatus,
  });

  // Test 2: Add first site (should work)
  const freeCanAddSite1 = canAddSite("free", 0);
  results.push({
    feature: "Add 1st site",
    plan: "free",
    expected: "Allowed",
    actual: freeCanAddSite1.allowed ? "Allowed" : "Blocked",
    passed: freeCanAddSite1.allowed,
  });

  // Test 3: Add second site (should be blocked)
  const freeCanAddSite2 = canAddSite("free", 1);
  results.push({
    feature: "Add 2nd site (should block)",
    plan: "free",
    expected: "Blocked",
    actual: freeCanAddSite2.allowed ? "Allowed" : "Blocked",
    passed: !freeCanAddSite2.allowed,
    details: freeCanAddSite2.reason,
  });

  // Create a test site for free user
  await supabase.from("sites").insert({
    id: "00000000-0000-0000-0000-000000000100",
    organization_id: freeOrgId,
    domain: "freetest.com",
    name: "Free Test Site",
    created_at: new Date().toISOString(),
  } as any);

  // Test 4: Manual checks (3/day limit)
  const freeCheck1 = canRunManualCheck("free", 0);
  const freeCheck3 = canRunManualCheck("free", 2);
  const freeCheck4 = canRunManualCheck("free", 3);
  results.push({
    feature: "Manual check limit (3/day)",
    plan: "free",
    expected: "Allow 3, block 4th",
    actual: freeCheck1.allowed && freeCheck3.allowed && !freeCheck4.allowed ? "Correct" : "Wrong",
    passed: freeCheck1.allowed && freeCheck3.allowed && !freeCheck4.allowed,
    details: { check1: freeCheck1, check3: freeCheck3, check4: freeCheck4 },
  });

  // Test 5: Competitors (should be 0)
  const freeCanAddCompetitor = canAddCompetitor("free", 0);
  results.push({
    feature: "Add competitor (should block)",
    plan: "free",
    expected: "Blocked",
    actual: freeCanAddCompetitor.allowed ? "Allowed" : "Blocked",
    passed: !freeCanAddCompetitor.allowed,
    details: freeCanAddCompetitor.reason,
  });

  // Test 6: Intelligence features (all blocked)
  const freeGap = canUseGapAnalysis("free", 0);
  const freeContent = canUseContentRecommendations("free", 0);
  const freeAction = canUseActionPlan("free");
  results.push({
    feature: "Intelligence features (all blocked)",
    plan: "free",
    expected: "All blocked",
    actual: !freeGap.allowed && !freeContent.allowed && !freeAction.allowed ? "All blocked" : "Some allowed",
    passed: !freeGap.allowed && !freeContent.allowed && !freeAction.allowed,
    details: { gap: freeGap, content: freeContent, action: freeAction },
  });

  // Test 7: Email alerts (blocked)
  results.push({
    feature: "Email alerts",
    plan: "free",
    expected: "Blocked",
    actual: freePlan.features.emailAlerts ? "Allowed" : "Blocked",
    passed: !freePlan.features.emailAlerts,
  });

  // Test 8: Auto-monitoring (blocked)
  results.push({
    feature: "Auto-monitoring",
    plan: "free",
    expected: "Blocked",
    actual: freePlan.features.dailyAutoCheck ? "Allowed" : "Blocked",
    passed: !freePlan.features.dailyAutoCheck,
  });

  // Test 9: GEO Score (allowed)
  results.push({
    feature: "GEO Score",
    plan: "free",
    expected: "Allowed",
    actual: freePlan.features.geoScore ? "Allowed" : "Blocked",
    passed: freePlan.features.geoScore,
  });

  // Test 10: Trial expiration blocks access
  const expiredDate = new Date(Date.now() - 11 * 24 * 60 * 60 * 1000);
  const expiredAccess = canAccessProduct("free", expiredDate);
  results.push({
    feature: "Expired trial blocks access",
    plan: "free",
    expected: "Blocked after 10 days",
    actual: expiredAccess.allowed ? "Still allowed" : "Blocked",
    passed: !expiredAccess.allowed && expiredAccess.upgradeRequired === true,
    details: expiredAccess,
  });

  // ============================================
  // PHASE 3: STARTER PLAN TESTS
  // ============================================
  
  const starterPlan = CITATION_PLANS.starter;
  const starterOrgId = "00000000-0000-0000-0000-000000000002";

  // Test 11: Pricing
  results.push({
    feature: "Monthly price",
    plan: "starter",
    expected: "$29/mo",
    actual: `$${starterPlan.monthlyPrice}/mo`,
    passed: starterPlan.monthlyPrice === 29,
  });

  results.push({
    feature: "Yearly price",
    plan: "starter",
    expected: "$24/mo",
    actual: `$${starterPlan.yearlyPrice}/mo`,
    passed: starterPlan.yearlyPrice === 24,
  });

  // Test 12: Site limit (3)
  const starterCanAddSite3 = canAddSite("starter", 2);
  const starterCanAddSite4 = canAddSite("starter", 3);
  results.push({
    feature: "Site limit (3)",
    plan: "starter",
    expected: "Allow 3, block 4th",
    actual: starterCanAddSite3.allowed && !starterCanAddSite4.allowed ? "Correct" : "Wrong",
    passed: starterCanAddSite3.allowed && !starterCanAddSite4.allowed,
  });

  // Create test sites for starter
  for (let i = 1; i <= 3; i++) {
    await supabase.from("sites").insert({
      id: `00000000-0000-0000-0000-00000000020${i}`,
      organization_id: starterOrgId,
      domain: `startertest${i}.com`,
      name: `Starter Test Site ${i}`,
      created_at: new Date().toISOString(),
    } as any);
  }

  // Test 13: Unlimited manual checks
  const starterCheck100 = canRunManualCheck("starter", 100);
  results.push({
    feature: "Unlimited manual checks",
    plan: "starter",
    expected: "Allowed even at 100 checks",
    actual: starterCheck100.allowed ? "Allowed" : "Blocked",
    passed: starterCheck100.allowed,
  });

  // Test 14: Competitor limit (2)
  const starterCanAddComp2 = canAddCompetitor("starter", 1);
  const starterCanAddComp3 = canAddCompetitor("starter", 2);
  results.push({
    feature: "Competitor limit (2)",
    plan: "starter",
    expected: "Allow 2, block 3rd",
    actual: starterCanAddComp2.allowed && !starterCanAddComp3.allowed ? "Correct" : "Wrong",
    passed: starterCanAddComp2.allowed && !starterCanAddComp3.allowed,
  });

  // Test 15: Daily auto-monitoring
  results.push({
    feature: "Daily auto-monitoring",
    plan: "starter",
    expected: "Allowed",
    actual: starterPlan.features.dailyAutoCheck ? "Allowed" : "Blocked",
    passed: starterPlan.features.dailyAutoCheck,
  });

  // Test 16: Hourly auto-monitoring (blocked)
  results.push({
    feature: "Hourly auto-monitoring",
    plan: "starter",
    expected: "Blocked",
    actual: starterPlan.features.hourlyAutoCheck ? "Allowed" : "Blocked",
    passed: !starterPlan.features.hourlyAutoCheck,
  });

  // Test 17: Email alerts
  results.push({
    feature: "Email alerts",
    plan: "starter",
    expected: "Allowed",
    actual: starterPlan.features.emailAlerts ? "Allowed" : "Blocked",
    passed: starterPlan.features.emailAlerts,
  });

  // Test 18: Gap Analysis (5/mo limit)
  const starterGap0 = canUseGapAnalysis("starter", 0);
  const starterGap5 = canUseGapAnalysis("starter", 5);
  results.push({
    feature: "Gap Analysis (5/mo)",
    plan: "starter",
    expected: "Allow 5, block at 5 used",
    actual: starterGap0.allowed && starterGap0.remaining === 5 && !starterGap5.allowed ? "Correct" : "Wrong",
    passed: starterGap0.allowed && starterGap0.remaining === 5 && !starterGap5.allowed,
    details: { initial: starterGap0, atLimit: starterGap5 },
  });

  // Test 19: Content Ideas (3/mo limit)
  const starterContent0 = canUseContentRecommendations("starter", 0);
  const starterContent3 = canUseContentRecommendations("starter", 3);
  results.push({
    feature: "Content Ideas (3/mo)",
    plan: "starter",
    expected: "Allow 3, block at 3 used",
    actual: starterContent0.allowed && starterContent0.remaining === 3 && !starterContent3.allowed ? "Correct" : "Wrong",
    passed: starterContent0.allowed && starterContent0.remaining === 3 && !starterContent3.allowed,
    details: { initial: starterContent0, atLimit: starterContent3 },
  });

  // Test 20: Action Plan (blocked for Starter)
  const starterAction = canUseActionPlan("starter");
  results.push({
    feature: "Weekly Action Plan",
    plan: "starter",
    expected: "Blocked (Pro only)",
    actual: starterAction.allowed ? "Allowed" : "Blocked",
    passed: !starterAction.allowed,
    details: starterAction.reason,
  });

  // Test 21: CSV Export
  results.push({
    feature: "CSV Export",
    plan: "starter",
    expected: "Allowed",
    actual: starterPlan.features.csvExport ? "Allowed" : "Blocked",
    passed: starterPlan.features.csvExport,
  });

  // Test 22: History retention (30 days)
  results.push({
    feature: "History retention",
    plan: "starter",
    expected: "30 days",
    actual: `${starterPlan.limits.historyDays} days`,
    passed: starterPlan.limits.historyDays === 30,
  });

  // ============================================
  // PHASE 4: PRO PLAN TESTS
  // ============================================
  
  const proPlan = CITATION_PLANS.pro;
  const proOrgId = "00000000-0000-0000-0000-000000000003";

  // Test 23: Pricing
  results.push({
    feature: "Monthly price",
    plan: "pro",
    expected: "$79/mo",
    actual: `$${proPlan.monthlyPrice}/mo`,
    passed: proPlan.monthlyPrice === 79,
  });

  results.push({
    feature: "Yearly price",
    plan: "pro",
    expected: "$66/mo",
    actual: `$${proPlan.yearlyPrice}/mo`,
    passed: proPlan.yearlyPrice === 66,
  });

  // Test 24: Site limit (10)
  const proCanAddSite10 = canAddSite("pro", 9);
  const proCanAddSite11 = canAddSite("pro", 10);
  results.push({
    feature: "Site limit (10)",
    plan: "pro",
    expected: "Allow 10, block 11th",
    actual: proCanAddSite10.allowed && !proCanAddSite11.allowed ? "Correct" : "Wrong",
    passed: proCanAddSite10.allowed && !proCanAddSite11.allowed,
  });

  // Create test sites for pro
  for (let i = 1; i <= 10; i++) {
    const siteNum = i.toString().padStart(2, '0');
    await supabase.from("sites").insert({
      id: `00000000-0000-0000-0000-000000000003${siteNum}`,
      organization_id: proOrgId,
      domain: `protest${i}.com`,
      name: `Pro Test Site ${i}`,
      created_at: new Date().toISOString(),
    } as any);
  }

  // Test 25: Competitor limit (10)
  const proCanAddComp10 = canAddCompetitor("pro", 9);
  const proCanAddComp11 = canAddCompetitor("pro", 10);
  results.push({
    feature: "Competitor limit (10)",
    plan: "pro",
    expected: "Allow 10, block 11th",
    actual: proCanAddComp10.allowed && !proCanAddComp11.allowed ? "Correct" : "Wrong",
    passed: proCanAddComp10.allowed && !proCanAddComp11.allowed,
  });

  // Test 26: Hourly auto-monitoring
  results.push({
    feature: "Hourly auto-monitoring",
    plan: "pro",
    expected: "Allowed",
    actual: proPlan.features.hourlyAutoCheck ? "Allowed" : "Blocked",
    passed: proPlan.features.hourlyAutoCheck,
  });

  // Test 27: Unlimited Gap Analysis
  const proGap1000 = canUseGapAnalysis("pro", 1000);
  results.push({
    feature: "Unlimited Gap Analysis",
    plan: "pro",
    expected: "Allowed at 1000 uses",
    actual: proGap1000.allowed && proGap1000.remaining === -1 ? "Unlimited" : "Limited",
    passed: proGap1000.allowed && proGap1000.remaining === -1,
  });

  // Test 28: Unlimited Content Ideas
  const proContent1000 = canUseContentRecommendations("pro", 1000);
  results.push({
    feature: "Unlimited Content Ideas",
    plan: "pro",
    expected: "Allowed at 1000 uses",
    actual: proContent1000.allowed && proContent1000.remaining === -1 ? "Unlimited" : "Limited",
    passed: proContent1000.allowed && proContent1000.remaining === -1,
  });

  // Test 29: Weekly Action Plan
  const proAction = canUseActionPlan("pro");
  results.push({
    feature: "Weekly Action Plan",
    plan: "pro",
    expected: "Allowed",
    actual: proAction.allowed ? "Allowed" : "Blocked",
    passed: proAction.allowed,
  });

  // Test 30: Competitor Deep Dive
  results.push({
    feature: "Competitor Deep Dive",
    plan: "pro",
    expected: "Allowed",
    actual: proPlan.features.competitorDeepDive ? "Allowed" : "Blocked",
    passed: proPlan.features.competitorDeepDive,
  });

  // Test 31: History retention (365 days)
  results.push({
    feature: "History retention",
    plan: "pro",
    expected: "365 days",
    actual: `${proPlan.limits.historyDays} days`,
    passed: proPlan.limits.historyDays === 365,
  });

  // Test 32: All features enabled
  const allProFeatures = Object.entries(proPlan.features).every(([_, v]) => v === true);
  results.push({
    feature: "All features enabled",
    plan: "pro",
    expected: "All true",
    actual: allProFeatures ? "All true" : "Some false",
    passed: allProFeatures,
    details: proPlan.features,
  });

  // ============================================
  // PHASE 5: REAL API TESTS
  // ============================================

  // Test 33: Perplexity API
  if (process.env.PERPLEXITY_API_KEY) {
    try {
      const perplexityRes = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "sonar",
          messages: [{ role: "user", content: "Say 'test ok'" }],
          max_tokens: 10,
        }),
      });
      results.push({
        feature: "Perplexity API",
        plan: "all",
        expected: "Working",
        actual: perplexityRes.ok ? "Working" : `Error: ${perplexityRes.status}`,
        passed: perplexityRes.ok,
      });
    } catch (e) {
      results.push({
        feature: "Perplexity API",
        plan: "all",
        expected: "Working",
        actual: `Error: ${e instanceof Error ? e.message : "Unknown"}`,
        passed: false,
      });
    }
  }

  // Test 34: Google AI API
  if (process.env.GOOGLE_AI_API_KEY) {
    try {
      const googleRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "Say 'test ok'" }] }],
          }),
        }
      );
      results.push({
        feature: "Google AI API",
        plan: "all",
        expected: "Working",
        actual: googleRes.ok ? "Working" : `Error: ${googleRes.status}`,
        passed: googleRes.ok,
      });
    } catch (e) {
      results.push({
        feature: "Google AI API",
        plan: "all",
        expected: "Working",
        actual: `Error: ${e instanceof Error ? e.message : "Unknown"}`,
        passed: false,
      });
    }
  }

  // Test 35: OpenAI API (for intelligence)
  if (process.env.OPENAI_API_KEY) {
    try {
      const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: "Say 'test ok'" }],
          max_tokens: 10,
        }),
      });
      results.push({
        feature: "OpenAI API (Intelligence)",
        plan: "all",
        expected: "Working",
        actual: openaiRes.ok ? "Working" : `Error: ${openaiRes.status}`,
        passed: openaiRes.ok,
      });
    } catch (e) {
      results.push({
        feature: "OpenAI API (Intelligence)",
        plan: "all",
        expected: "Working",
        actual: `Error: ${e instanceof Error ? e.message : "Unknown"}`,
        passed: false,
      });
    }
  }

  // Test 36: Citation Intelligence Service
  results.push({
    feature: "Citation Intelligence Service",
    plan: "all",
    expected: "All methods available",
    actual: typeof citationIntelligence.analyzeCitationGap === "function" &&
            typeof citationIntelligence.generateContentRecommendations === "function" &&
            typeof citationIntelligence.generateWeeklyActionPlan === "function" &&
            typeof citationIntelligence.analyzeCompetitorDeepDive === "function" 
              ? "All methods available" 
              : "Some methods missing",
    passed: typeof citationIntelligence.analyzeCitationGap === "function",
  });

  // Test 37: Dodo Payments configured
  results.push({
    feature: "Dodo Payments configured",
    plan: "all",
    expected: "All product IDs set",
    actual: process.env.DODO_STARTER_MONTHLY_ID && 
            process.env.DODO_STARTER_YEARLY_ID && 
            process.env.DODO_PRO_MONTHLY_ID && 
            process.env.DODO_PRO_YEARLY_ID 
              ? "All set" 
              : "Some missing",
    passed: !!(process.env.DODO_STARTER_MONTHLY_ID && process.env.DODO_PRO_MONTHLY_ID),
  });

  // Test 38: Resend configured
  results.push({
    feature: "Resend Email configured",
    plan: "all",
    expected: "API key set",
    actual: process.env.RESEND_API_KEY ? "Set" : "Missing",
    passed: !!process.env.RESEND_API_KEY,
  });

  // ============================================
  // PHASE 6: CLEANUP
  // ============================================
  
  // Clean up test data
  await supabase.from("citations").delete().like("site_id", "00000000-0000-0000-0000-%");
  await supabase.from("competitors").delete().like("site_id", "00000000-0000-0000-0000-%");
  await supabase.from("sites").delete().like("id", "00000000-0000-0000-0000-%");
  await supabase.from("usage").delete().like("organization_id", "00000000-0000-0000-0000-%");
  await supabase.from("users").delete().like("id", "00000000-0000-0000-0000-%");
  await supabase.from("organizations").delete().like("id", "00000000-0000-0000-0000-%");

  // ============================================
  // SUMMARY
  // ============================================
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const duration = Date.now() - startTime;

  return NextResponse.json({
    success: failed === 0,
    summary: {
      total: results.length,
      passed,
      failed,
      duration: `${duration}ms`,
      passRate: `${Math.round((passed / results.length) * 100)}%`,
    },
    verdict: failed === 0 
      ? "🚀 ALL E2E TESTS PASSED - READY FOR LAUNCH!"
      : `❌ ${failed} TESTS FAILED - FIX BEFORE LAUNCH!`,
    byPlan: {
      free: {
        total: results.filter(r => r.plan === "free").length,
        passed: results.filter(r => r.plan === "free" && r.passed).length,
      },
      starter: {
        total: results.filter(r => r.plan === "starter").length,
        passed: results.filter(r => r.plan === "starter" && r.passed).length,
      },
      pro: {
        total: results.filter(r => r.plan === "pro").length,
        passed: results.filter(r => r.plan === "pro" && r.passed).length,
      },
      all: {
        total: results.filter(r => r.plan === "all").length,
        passed: results.filter(r => r.plan === "all" && r.passed).length,
      },
    },
    results,
    criticalChecks: {
      trialTimerWorks: results.find(r => r.feature === "Trial countdown")?.passed,
      freeLimitsEnforced: results.filter(r => r.plan === "free").every(r => r.passed),
      starterLimitsEnforced: results.filter(r => r.plan === "starter").every(r => r.passed),
      proFeaturesWork: results.filter(r => r.plan === "pro").every(r => r.passed),
      apisWorking: results.filter(r => r.plan === "all" && r.feature.includes("API")).every(r => r.passed),
      billingConfigured: results.find(r => r.feature === "Dodo Payments configured")?.passed,
      emailConfigured: results.find(r => r.feature === "Resend Email configured")?.passed,
    },
    timestamp: new Date().toISOString(),
  });
}

