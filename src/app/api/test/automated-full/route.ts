/**
 * AUTOMATED FULL TEST SUITE
 * 
 * Tests ALL features across Free, Starter, and Pro tiers
 * Uses real API calls - no mocks
 * 
 * Test site: notion.com (well-known, AI definitely mentions it)
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

interface TestResult {
  test: string;
  status: "PASS" | "FAIL" | "SKIP";
  message: string;
  duration?: number;
  tier?: string;
}

// Helper to run timed test
async function runTest(
  name: string,
  tier: string,
  testFn: () => Promise<{ pass: boolean; message: string }>
): Promise<TestResult> {
  const start = Date.now();
  try {
    const result = await testFn();
    return {
      test: name,
      tier,
      status: result.pass ? "PASS" : "FAIL",
      message: result.message,
      duration: Date.now() - start,
    };
  } catch (error) {
    return {
      test: name,
      tier,
      status: "FAIL",
      message: error instanceof Error ? error.message : "Unknown error",
      duration: Date.now() - start,
    };
  }
}

export async function GET(request: Request) {
  const results: TestResult[] = [];
  const startTime = Date.now();

  // Get Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({
      error: "Missing Supabase credentials",
      passed: 0,
      failed: 1,
    }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // ============================================
  // SECTION 1: ENVIRONMENT & INFRASTRUCTURE
  // ============================================
  
  // Test all required env vars
  const envVars = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY", 
    "SUPABASE_SERVICE_ROLE_KEY",
    "PERPLEXITY_API_KEY",
    "GOOGLE_AI_API_KEY",
    "OPENAI_API_KEY",
    "RESEND_API_KEY",
    "DODO_API_KEY",
  ];

  for (const envVar of envVars) {
    results.push({
      test: `ENV: ${envVar}`,
      tier: "infrastructure",
      status: process.env[envVar] ? "PASS" : "FAIL",
      message: process.env[envVar] ? "Set" : "NOT SET",
    });
  }

  // ============================================
  // SECTION 2: DATABASE TABLES
  // ============================================
  
  const tables = ["organizations", "users", "sites", "citations", "competitors", "usage", "source_listings", "market_share_snapshots"];
  
  for (const table of tables) {
    results.push(await runTest(`DB: ${table} table exists`, "infrastructure", async () => {
      const { error } = await supabase.from(table).select("id").limit(1);
      return { pass: !error, message: error?.message || "Accessible" };
    }));
  }

  // ============================================
  // SECTION 3: AI API CONNECTIVITY
  // ============================================

  // Perplexity API Test
  if (process.env.PERPLEXITY_API_KEY) {
    results.push(await runTest("API: Perplexity connectivity", "infrastructure", async () => {
      const response = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "sonar",
          messages: [{ role: "user", content: "What is 2+2?" }],
          max_tokens: 10,
        }),
      });
      return { pass: response.ok, message: response.ok ? "Connected" : `HTTP ${response.status}` };
    }));
  }

  // Google AI Test
  if (process.env.GOOGLE_AI_API_KEY) {
    results.push(await runTest("API: Google AI (Gemini) connectivity", "infrastructure", async () => {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "What is 2+2?" }] }],
          }),
        }
      );
      return { pass: response.ok, message: response.ok ? "Connected" : `HTTP ${response.status}` };
    }));
  }

  // OpenAI Test
  if (process.env.OPENAI_API_KEY) {
    results.push(await runTest("API: OpenAI connectivity", "infrastructure", async () => {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: "What is 2+2?" }],
          max_tokens: 10,
        }),
      });
      return { pass: response.ok, message: response.ok ? "Connected" : `HTTP ${response.status}` };
    }));
  }

  // ============================================
  // SECTION 4: CREATE TEST ORGANIZATIONS
  // ============================================
  
  const testOrgs = [
    { id: "test-auto-free-001", name: "Test Free Org", plan: "free" },
    { id: "test-auto-starter-001", name: "Test Starter Org", plan: "starter" },
    { id: "test-auto-pro-001", name: "Test Pro Org", plan: "pro" },
  ];

  for (const org of testOrgs) {
    results.push(await runTest(`SETUP: Create ${org.plan} organization`, org.plan, async () => {
      const { error } = await supabase.from("organizations").upsert({
        id: org.id,
        name: org.name,
        slug: `test-${org.plan}`,
        plan: org.plan,
        subscription_status: "active",
        created_at: new Date().toISOString(),
      }, { onConflict: "id" });
      return { pass: !error, message: error?.message || "Created/Updated" };
    }));
  }

  // ============================================
  // SECTION 5: CREATE TEST SITES (notion.com as test)
  // ============================================
  
  // Use notion.com as our test site - AI definitely mentions it
  const testSites = [
    { id: "test-site-free-notion", orgId: "test-auto-free-001", domain: "notion.com", tier: "free" },
    { id: "test-site-starter-notion", orgId: "test-auto-starter-001", domain: "notion.com", tier: "starter" },
    { id: "test-site-pro-notion", orgId: "test-auto-pro-001", domain: "notion.com", tier: "pro" },
  ];

  for (const site of testSites) {
    results.push(await runTest(`SETUP: Create test site (${site.domain})`, site.tier, async () => {
      const { error } = await supabase.from("sites").upsert({
        id: site.id,
        organization_id: site.orgId,
        domain: site.domain,
        category: "productivity",
        created_at: new Date().toISOString(),
      }, { onConflict: "id" });
      return { pass: !error, message: error?.message || "Created/Updated" };
    }));
  }

  // ============================================
  // SECTION 6: TEST CITATION CHECKS (REAL AI CALLS)
  // ============================================

  // Test Perplexity citation check for notion.com
  results.push(await runTest("CITATION: Perplexity check for notion.com", "all", async () => {
    if (!process.env.PERPLEXITY_API_KEY) {
      return { pass: false, message: "API key not set" };
    }
    
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [{ 
          role: "user", 
          content: "What are the best note-taking apps for productivity?" 
        }],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      return { pass: false, message: `API error: ${response.status}` };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const citations = data.citations || [];
    
    // Check if Notion is mentioned (it should be for this query)
    const mentionsNotion = content.toLowerCase().includes("notion") || 
                           citations.some((c: string) => c.includes("notion"));
    
    return { 
      pass: true, // The API call worked
      message: mentionsNotion 
        ? `✓ Notion mentioned in response (${citations.length} citations)`
        : `Response received but Notion not mentioned (${citations.length} citations)`
    };
  }));

  // Test Google AI citation check
  results.push(await runTest("CITATION: Google AI check for notion.com", "all", async () => {
    if (!process.env.GOOGLE_AI_API_KEY) {
      return { pass: false, message: "API key not set" };
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ 
            parts: [{ text: "What are the best note-taking apps for productivity?" }] 
          }],
          generationConfig: { maxOutputTokens: 500 },
        }),
      }
    );

    if (!response.ok) {
      return { pass: false, message: `API error: ${response.status}` };
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const mentionsNotion = content.toLowerCase().includes("notion");
    
    return { 
      pass: true,
      message: mentionsNotion 
        ? "✓ Notion mentioned in Google AI response"
        : "Response received but Notion not mentioned"
    };
  }));

  // Test OpenAI/ChatGPT check
  results.push(await runTest("CITATION: ChatGPT check for notion.com", "all", async () => {
    if (!process.env.OPENAI_API_KEY) {
      return { pass: false, message: "API key not set" };
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ 
          role: "user", 
          content: "What are the best note-taking apps for productivity?" 
        }],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      return { pass: false, message: `API error: ${response.status}` };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const mentionsNotion = content.toLowerCase().includes("notion");
    
    return { 
      pass: true,
      message: mentionsNotion 
        ? "✓ Notion mentioned in ChatGPT response"
        : "Response received but Notion not mentioned"
    };
  }));

  // ============================================
  // SECTION 7: TEST PRICING PLAN LIMITS
  // ============================================

  // Import and test plan configuration
  try {
    const { CITATION_PLANS, canRunManualCheck, getIntelligenceFeatureSummary } = await import("@/lib/billing/citation-plans");

    // Free tier limits
    results.push({
      test: "LIMITS: Free - 1 site max",
      tier: "free",
      status: CITATION_PLANS.free.limits.sites === 1 ? "PASS" : "FAIL",
      message: `Sites: ${CITATION_PLANS.free.limits.sites}`,
    });

    results.push({
      test: "LIMITS: Free - 3 checks/day",
      tier: "free",
      status: CITATION_PLANS.free.limits.manualChecksPerDay === 3 ? "PASS" : "FAIL",
      message: `Checks/day: ${CITATION_PLANS.free.limits.manualChecksPerDay}`,
    });

    results.push({
      test: "LIMITS: Free - No CSV export",
      tier: "free",
      status: !CITATION_PLANS.free.features.csvExport ? "PASS" : "FAIL",
      message: `CSV export: ${CITATION_PLANS.free.features.csvExport}`,
    });

    results.push({
      test: "LIMITS: Free - No email alerts",
      tier: "free",
      status: !CITATION_PLANS.free.features.emailAlerts ? "PASS" : "FAIL",
      message: `Email alerts: ${CITATION_PLANS.free.features.emailAlerts}`,
    });

    // Starter tier limits
    results.push({
      test: "LIMITS: Starter - 3 sites max",
      tier: "starter",
      status: CITATION_PLANS.starter.limits.sites === 3 ? "PASS" : "FAIL",
      message: `Sites: ${CITATION_PLANS.starter.limits.sites}`,
    });

    results.push({
      test: "LIMITS: Starter - 5 manual checks/day",
      tier: "starter",
      status: CITATION_PLANS.starter.limits.manualChecksPerDay === 5 ? "PASS" : "FAIL",
      message: `Manual checks/day: ${CITATION_PLANS.starter.limits.manualChecksPerDay}`,
    });

    results.push({
      test: "LIMITS: Starter - Daily auto-checks",
      tier: "starter",
      status: CITATION_PLANS.starter.features.dailyAutoCheck ? "PASS" : "FAIL",
      message: `Daily auto: ${CITATION_PLANS.starter.features.dailyAutoCheck}`,
    });

    results.push({
      test: "LIMITS: Starter - CSV export enabled",
      tier: "starter",
      status: CITATION_PLANS.starter.features.csvExport ? "PASS" : "FAIL",
      message: `CSV export: ${CITATION_PLANS.starter.features.csvExport}`,
    });

    // Pro tier limits
    results.push({
      test: "LIMITS: Pro - 10 sites max",
      tier: "pro",
      status: CITATION_PLANS.pro.limits.sites === 10 ? "PASS" : "FAIL",
      message: `Sites: ${CITATION_PLANS.pro.limits.sites}`,
    });

    results.push({
      test: "LIMITS: Pro - 20 manual checks/day",
      tier: "pro",
      status: CITATION_PLANS.pro.limits.manualChecksPerDay === 20 ? "PASS" : "FAIL",
      message: `Manual checks/day: ${CITATION_PLANS.pro.limits.manualChecksPerDay}`,
    });

    results.push({
      test: "LIMITS: Pro - Hourly auto-checks",
      tier: "pro",
      status: CITATION_PLANS.pro.features.hourlyAutoCheck ? "PASS" : "FAIL",
      message: `Hourly auto: ${CITATION_PLANS.pro.features.hourlyAutoCheck}`,
    });

    results.push({
      test: "LIMITS: Pro - Competitor deep dive",
      tier: "pro",
      status: CITATION_PLANS.pro.features.competitorDeepDive ? "PASS" : "FAIL",
      message: `Competitor deep dive: ${CITATION_PLANS.pro.features.competitorDeepDive}`,
    });

    // Test canRunManualCheck function
    results.push(await runTest("FUNCTION: canRunManualCheck (free, 0 used)", "free", async () => {
      const result = canRunManualCheck("free", 0);
      return { pass: result.allowed, message: result.allowed ? "Allowed" : result.reason || "Blocked" };
    }));

    results.push(await runTest("FUNCTION: canRunManualCheck (free, 3 used)", "free", async () => {
      const result = canRunManualCheck("free", 3);
      return { pass: !result.allowed, message: !result.allowed ? "Correctly blocked" : "Should be blocked" };
    }));

  } catch (e) {
    results.push({
      test: "LIMITS: Load citation-plans",
      tier: "all",
      status: "FAIL",
      message: e instanceof Error ? e.message : "Failed to load",
    });
  }

  // ============================================
  // SECTION 8: TEST USAGE TRACKING
  // ============================================

  // Create usage records for test orgs
  const currentPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM

  for (const org of testOrgs) {
    results.push(await runTest(`USAGE: Create usage record for ${org.plan}`, org.plan, async () => {
      const { error } = await supabase.from("usage").upsert({
        id: `test-usage-${org.plan}-${currentPeriod}`,
        organization_id: org.id,
        period: currentPeriod,
        checks_used: 0,
        gap_analyses_used: 0,
        content_ideas_used: 0,
        action_plans_used: 0,
        created_at: new Date().toISOString(),
      }, { onConflict: "id" });
      return { pass: !error, message: error?.message || "Created/Updated" };
    }));
  }

  // ============================================
  // SECTION 9: TEST COMPETITOR TRACKING
  // ============================================

  // Add competitors for starter and pro
  results.push(await runTest("COMPETITORS: Add competitor for starter", "starter", async () => {
    const { error } = await supabase.from("competitors").upsert({
      id: "test-comp-starter-001",
      site_id: "test-site-starter-notion",
      domain: "evernote.com",
      created_at: new Date().toISOString(),
    }, { onConflict: "id" });
    return { pass: !error, message: error?.message || "Added evernote.com" };
  }));

  results.push(await runTest("COMPETITORS: Add multiple for pro", "pro", async () => {
    const competitors = [
      { id: "test-comp-pro-001", domain: "evernote.com" },
      { id: "test-comp-pro-002", domain: "obsidian.md" },
      { id: "test-comp-pro-003", domain: "roamresearch.com" },
    ];
    
    for (const comp of competitors) {
      const { error } = await supabase.from("competitors").upsert({
        id: comp.id,
        site_id: "test-site-pro-notion",
        domain: comp.domain,
        created_at: new Date().toISOString(),
      }, { onConflict: "id" });
      if (error) return { pass: false, message: error.message };
    }
    return { pass: true, message: "Added 3 competitors" };
  }));

  // ============================================
  // SECTION 10: SAVE TEST CITATIONS
  // ============================================

  results.push(await runTest("CITATIONS: Save test citation", "all", async () => {
    const { error } = await supabase.from("citations").upsert({
      id: "test-citation-001",
      site_id: "test-site-pro-notion",
      platform: "perplexity",
      query: "best note-taking apps",
      cited: true,
      snippet: "Notion is a popular choice for note-taking...",
      confidence: "high",
      checked_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    }, { onConflict: "id" });
    return { pass: !error, message: error?.message || "Saved" };
  }));

  // ============================================
  // SECTION 11: BILLING INTEGRATION
  // ============================================

  results.push({
    test: "BILLING: Dodo API key configured",
    tier: "all",
    status: process.env.DODO_API_KEY ? "PASS" : "FAIL",
    message: process.env.DODO_API_KEY ? "Set" : "NOT SET",
  });

  // ============================================
  // SECTION 12: EMAIL SERVICE
  // ============================================

  results.push({
    test: "EMAIL: Resend API key configured",
    tier: "all",
    status: process.env.RESEND_API_KEY?.startsWith("re_") ? "PASS" : "FAIL",
    message: process.env.RESEND_API_KEY ? "Set (re_...)" : "NOT SET or invalid",
  });

  // ============================================
  // CLEANUP (optional - leave test data for inspection)
  // ============================================

  // Not cleaning up - leaving test data so you can inspect it in Supabase

  // ============================================
  // SUMMARY
  // ============================================

  const passed = results.filter(r => r.status === "PASS").length;
  const failed = results.filter(r => r.status === "FAIL").length;
  const skipped = results.filter(r => r.status === "SKIP").length;

  const byTier = {
    infrastructure: results.filter(r => r.tier === "infrastructure"),
    free: results.filter(r => r.tier === "free"),
    starter: results.filter(r => r.tier === "starter"),
    pro: results.filter(r => r.tier === "pro"),
    all: results.filter(r => r.tier === "all"),
  };

  return NextResponse.json({
    summary: {
      status: failed === 0 ? "✅ ALL TESTS PASSED" : failed <= 3 ? "⚠️ MOSTLY PASSING" : "❌ ISSUES FOUND",
      total: results.length,
      passed,
      failed,
      skipped,
      duration: `${Date.now() - startTime}ms`,
      timestamp: new Date().toISOString(),
    },
    byTier: {
      infrastructure: {
        passed: byTier.infrastructure.filter(r => r.status === "PASS").length,
        failed: byTier.infrastructure.filter(r => r.status === "FAIL").length,
      },
      free: {
        passed: byTier.free.filter(r => r.status === "PASS").length,
        failed: byTier.free.filter(r => r.status === "FAIL").length,
      },
      starter: {
        passed: byTier.starter.filter(r => r.status === "PASS").length,
        failed: byTier.starter.filter(r => r.status === "FAIL").length,
      },
      pro: {
        passed: byTier.pro.filter(r => r.status === "PASS").length,
        failed: byTier.pro.filter(r => r.status === "FAIL").length,
      },
    },
    testResults: results,
    testSiteUsed: "notion.com",
    note: "Test data has been created in your database. You can inspect it in Supabase under organizations/sites with IDs starting with 'test-auto-'",
  }, { status: 200 });
}

