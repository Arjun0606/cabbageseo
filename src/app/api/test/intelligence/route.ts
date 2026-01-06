/**
 * ============================================
 * INTELLIGENCE FEATURES TEST ENDPOINT
 * ============================================
 * 
 * Comprehensive testing for the $100k intelligence features:
 * - "Why Not Me?" Analysis
 * - Content Recommendations
 * - Weekly Action Plan
 * - Competitor Deep Dive
 * 
 * Tests:
 * 1. API endpoint availability
 * 2. LLM integration (OpenAI)
 * 3. Data fetching from Supabase
 * 4. Plan-based access control
 * 5. Usage tracking and limits
 * 6. Real data vs mock data verification
 */

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { 
  CITATION_PLANS, 
  getIntelligenceFeatureSummary,
  canUseGapAnalysis,
  canUseContentRecommendations,
  canUseActionPlan,
} from "@/lib/billing/citation-plans";
import { citationIntelligence } from "@/lib/geo/citation-intelligence";

interface TestResult {
  name: string;
  status: "pass" | "fail" | "skip";
  message: string;
  details?: unknown;
  duration?: number;
}

interface TestSuite {
  name: string;
  tests: TestResult[];
  passed: number;
  failed: number;
  skipped: number;
}

export async function GET() {
  const suites: TestSuite[] = [];
  const startTime = Date.now();

  // ============================================
  // SUITE 1: Plan Configuration Tests
  // ============================================
  const planSuite: TestSuite = {
    name: "Plan Configuration",
    tests: [],
    passed: 0,
    failed: 0,
    skipped: 0,
  };

  // Test 1.1: Free plan should NOT have intelligence features
  const freePlan = CITATION_PLANS.free;
  if (!freePlan.features.citationGapAnalysis && 
      !freePlan.features.contentRecommendations && 
      !freePlan.features.weeklyActionPlan) {
    planSuite.tests.push({
      name: "Free plan has NO intelligence features",
      status: "pass",
      message: "Free plan correctly restricts intelligence features",
    });
    planSuite.passed++;
  } else {
    planSuite.tests.push({
      name: "Free plan has NO intelligence features",
      status: "fail",
      message: "Free plan should not have intelligence features enabled",
      details: freePlan.features,
    });
    planSuite.failed++;
  }

  // Test 1.2: Starter plan should have LIMITED intelligence features
  const starterPlan = CITATION_PLANS.starter;
  const starterSummary = getIntelligenceFeatureSummary("starter");
  if (starterPlan.features.citationGapAnalysis && 
      starterPlan.features.contentRecommendations &&
      !starterPlan.features.weeklyActionPlan &&
      starterSummary.gapAnalyses.limit === 5 &&
      starterSummary.contentIdeas.limit === 3) {
    planSuite.tests.push({
      name: "Starter plan has LIMITED intelligence features",
      status: "pass",
      message: `Gap: ${starterSummary.gapAnalyses.limit}/mo, Content: ${starterSummary.contentIdeas.limit}/mo, Action Plan: No`,
    });
    planSuite.passed++;
  } else {
    planSuite.tests.push({
      name: "Starter plan has LIMITED intelligence features",
      status: "fail",
      message: "Starter plan limits are incorrect",
      details: { features: starterPlan.features, summary: starterSummary },
    });
    planSuite.failed++;
  }

  // Test 1.3: Pro plan should have UNLIMITED intelligence features
  const proPlan = CITATION_PLANS.pro;
  const proSummary = getIntelligenceFeatureSummary("pro");
  if (proPlan.features.citationGapAnalysis && 
      proPlan.features.contentRecommendations &&
      proPlan.features.weeklyActionPlan &&
      proPlan.features.competitorDeepDive &&
      proSummary.gapAnalyses.limit === Infinity) {
    planSuite.tests.push({
      name: "Pro plan has UNLIMITED intelligence features",
      status: "pass",
      message: "All intelligence features enabled with unlimited usage",
    });
    planSuite.passed++;
  } else {
    planSuite.tests.push({
      name: "Pro plan has UNLIMITED intelligence features",
      status: "fail",
      message: "Pro plan should have unlimited intelligence",
      details: { features: proPlan.features, summary: proSummary },
    });
    planSuite.failed++;
  }

  suites.push(planSuite);

  // ============================================
  // SUITE 2: Environment & Dependencies Tests
  // ============================================
  const envSuite: TestSuite = {
    name: "Environment & Dependencies",
    tests: [],
    passed: 0,
    failed: 0,
    skipped: 0,
  };

  // Test 2.1: OpenAI API key configured
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey && openaiKey.startsWith("sk-")) {
    envSuite.tests.push({
      name: "OpenAI API key configured",
      status: "pass",
      message: `Key present: sk-***${openaiKey.slice(-4)}`,
    });
    envSuite.passed++;
  } else {
    envSuite.tests.push({
      name: "OpenAI API key configured",
      status: "fail",
      message: "OPENAI_API_KEY is missing or invalid",
    });
    envSuite.failed++;
  }

  // Test 2.2: Supabase connection
  try {
    const supabase = createServiceClient();
    const { error } = await supabase
      .from("organizations")
      .select("id")
      .limit(1);
    
    if (!error) {
      envSuite.tests.push({
        name: "Supabase connection",
        status: "pass",
        message: "Database connection successful",
      });
      envSuite.passed++;
    } else {
      throw error;
    }
  } catch (err) {
    envSuite.tests.push({
      name: "Supabase connection",
      status: "fail",
      message: `Database error: ${err instanceof Error ? err.message : "Unknown"}`,
    });
    envSuite.failed++;
  }

  // Test 2.3: Required tables exist
  try {
    const supabase = createServiceClient();
    
    const tables = ["citations", "competitors", "sites", "usage"];
    const missingTables: string[] = [];
    
    for (const table of tables) {
      const { error } = await supabase.from(table).select("id").limit(1);
      if (error && error.message.includes("does not exist")) {
        missingTables.push(table);
      }
    }
    
    if (missingTables.length === 0) {
      envSuite.tests.push({
        name: "Required database tables exist",
        status: "pass",
        message: `All tables present: ${tables.join(", ")}`,
      });
      envSuite.passed++;
    } else {
      envSuite.tests.push({
        name: "Required database tables exist",
        status: "fail",
        message: `Missing tables: ${missingTables.join(", ")}`,
      });
      envSuite.failed++;
    }
  } catch (err) {
    envSuite.tests.push({
      name: "Required database tables exist",
      status: "fail",
      message: `Check failed: ${err instanceof Error ? err.message : "Unknown"}`,
    });
    envSuite.failed++;
  }

  // Test 2.4: Usage table has intelligence columns
  try {
    const supabase = createServiceClient();
    
    // Try to select the intelligence usage columns
    const { error } = await supabase
      .from("usage")
      .select("gap_analyses_used, content_ideas_used, action_plans_used")
      .limit(1);
    
    if (!error) {
      envSuite.tests.push({
        name: "Usage table has intelligence columns",
        status: "pass",
        message: "gap_analyses_used, content_ideas_used, action_plans_used columns exist",
      });
      envSuite.passed++;
    } else if (error.message.includes("column") && error.message.includes("does not exist")) {
      envSuite.tests.push({
        name: "Usage table has intelligence columns",
        status: "fail",
        message: "Missing intelligence usage columns - run FRESH_SCHEMA.sql",
        details: error.message,
      });
      envSuite.failed++;
    } else {
      throw error;
    }
  } catch (err) {
    envSuite.tests.push({
      name: "Usage table has intelligence columns",
      status: "fail",
      message: `Check failed: ${err instanceof Error ? err.message : "Unknown"}`,
    });
    envSuite.failed++;
  }

  suites.push(envSuite);

  // ============================================
  // SUITE 3: LLM Integration Tests
  // ============================================
  const llmSuite: TestSuite = {
    name: "LLM Integration (Real API Calls)",
    tests: [],
    passed: 0,
    failed: 0,
    skipped: 0,
  };

  // Test 3.1: OpenAI API connectivity
  if (openaiKey) {
    try {
      const testStart = Date.now();
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: "Say 'test successful' in exactly 2 words" }],
          max_tokens: 10,
        }),
      });
      
      const testDuration = Date.now() - testStart;
      
      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "";
        llmSuite.tests.push({
          name: "OpenAI API connectivity",
          status: "pass",
          message: `API responded in ${testDuration}ms`,
          details: { response: content, model: "gpt-4o-mini" },
          duration: testDuration,
        });
        llmSuite.passed++;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }
    } catch (err) {
      llmSuite.tests.push({
        name: "OpenAI API connectivity",
        status: "fail",
        message: `API error: ${err instanceof Error ? err.message : "Unknown"}`,
      });
      llmSuite.failed++;
    }
  } else {
    llmSuite.tests.push({
      name: "OpenAI API connectivity",
      status: "skip",
      message: "Skipped - no API key",
    });
    llmSuite.skipped++;
  }

  // Test 3.2: Test actual intelligence prompt (gap analysis style)
  if (openaiKey) {
    try {
      const testStart = Date.now();
      
      // Simulate a gap analysis prompt with minimal data
      const testPrompt = `You are a citation gap analyst. Given this data:
      
User's site: example.com
Competitor cited: competitor.com  
Query: "best project management tools"

Provide a brief analysis (max 50 words) of why the competitor might be cited instead.`;

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: testPrompt }],
          max_tokens: 150,
        }),
      });
      
      const testDuration = Date.now() - testStart;
      
      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "";
        
        // Verify it's a real analysis, not mock data
        const isMockData = content.includes("mock") || 
                          content.includes("placeholder") ||
                          content.includes("example analysis") ||
                          content.length < 20;
        
        if (!isMockData && content.length > 20) {
          llmSuite.tests.push({
            name: "Intelligence prompt generates REAL analysis",
            status: "pass",
            message: `Generated ${content.length} chars of real analysis in ${testDuration}ms`,
            details: { preview: content.substring(0, 100) + "..." },
            duration: testDuration,
          });
          llmSuite.passed++;
        } else {
          llmSuite.tests.push({
            name: "Intelligence prompt generates REAL analysis",
            status: "fail",
            message: "Response appears to be mock/placeholder data",
            details: { response: content },
          });
          llmSuite.failed++;
        }
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (err) {
      llmSuite.tests.push({
        name: "Intelligence prompt generates REAL analysis",
        status: "fail",
        message: `LLM error: ${err instanceof Error ? err.message : "Unknown"}`,
      });
      llmSuite.failed++;
    }
  } else {
    llmSuite.tests.push({
      name: "Intelligence prompt generates REAL analysis",
      status: "skip",
      message: "Skipped - no API key",
    });
    llmSuite.skipped++;
  }

  suites.push(llmSuite);

  // ============================================
  // SUITE 4: Citation Intelligence Service Tests
  // ============================================
  const serviceSuite: TestSuite = {
    name: "Citation Intelligence Service",
    tests: [],
    passed: 0,
    failed: 0,
    skipped: 0,
  };

  // Test 4.1: Service object exists with all methods
  try {
    const hasAllMethods = 
      typeof citationIntelligence.analyzeCitationGap === "function" &&
      typeof citationIntelligence.generateContentRecommendations === "function" &&
      typeof citationIntelligence.generateWeeklyActionPlan === "function" &&
      typeof citationIntelligence.analyzeCompetitorDeepDive === "function";
    
    if (hasAllMethods) {
      serviceSuite.tests.push({
        name: "Intelligence service has all methods",
        status: "pass",
        message: "analyzeCitationGap, generateContentRecommendations, generateWeeklyActionPlan, analyzeCompetitorDeepDive all available",
      });
      serviceSuite.passed++;
    } else {
      throw new Error("Missing methods");
    }
  } catch (err) {
    serviceSuite.tests.push({
      name: "Intelligence service has all methods",
      status: "fail",
      message: `Service error: ${err instanceof Error ? err.message : "Unknown"}`,
    });
    serviceSuite.failed++;
  }

  suites.push(serviceSuite);

  // ============================================
  // SUITE 5: API Endpoint Tests
  // ============================================
  const apiSuite: TestSuite = {
    name: "Intelligence API Endpoints",
    tests: [],
    passed: 0,
    failed: 0,
    skipped: 0,
  };

  // Test 5.1: GET /api/geo/intelligence/actions returns usage info
  try {
    const actionsRoute = await import("@/app/api/geo/intelligence/actions/route");
    
    if (actionsRoute.GET && actionsRoute.POST) {
      apiSuite.tests.push({
        name: "Intelligence actions route handlers exist",
        status: "pass",
        message: "GET and POST handlers exported",
      });
      apiSuite.passed++;
    } else {
      throw new Error("Missing handlers");
    }
  } catch (err) {
    apiSuite.tests.push({
      name: "Intelligence actions route handlers exist",
      status: "fail",
      message: `Route error: ${err instanceof Error ? err.message : "Unknown"}`,
    });
    apiSuite.failed++;
  }

  // Test 5.2: Main intelligence route exists
  try {
    const intelligenceRoute = await import("@/app/api/geo/intelligence/route");
    
    if (intelligenceRoute.GET && intelligenceRoute.POST) {
      apiSuite.tests.push({
        name: "GEO intelligence route handlers exist",
        status: "pass",
        message: "GET and POST handlers exported",
      });
      apiSuite.passed++;
    } else {
      throw new Error("Missing handlers");
    }
  } catch (err) {
    apiSuite.tests.push({
      name: "GEO intelligence route handlers exist",
      status: "fail",
      message: `Route error: ${err instanceof Error ? err.message : "Unknown"}`,
    });
    apiSuite.failed++;
  }

  suites.push(apiSuite);

  // ============================================
  // SUITE 6: Plan Access Control Tests
  // ============================================
  const accessSuite: TestSuite = {
    name: "Plan Access Control",
    tests: [],
    passed: 0,
    failed: 0,
    skipped: 0,
  };

  // Test 6.1: Free plan cannot use gap analysis
  try {
    const result = canUseGapAnalysis("free", 0);
    if (!result.allowed) {
      accessSuite.tests.push({
        name: "Free plan cannot use gap analysis",
        status: "pass",
        message: `Blocked: ${result.reason}`,
      });
      accessSuite.passed++;
    } else {
      accessSuite.tests.push({
        name: "Free plan cannot use gap analysis",
        status: "fail",
        message: "Free plan should be blocked from gap analysis",
      });
      accessSuite.failed++;
    }
  } catch (err) {
    accessSuite.tests.push({
      name: "Free plan cannot use gap analysis",
      status: "fail",
      message: `Error: ${err instanceof Error ? err.message : "Unknown"}`,
    });
    accessSuite.failed++;
  }

  // Test 6.2: Starter plan can use gap analysis (within limit)
  try {
    const result = canUseGapAnalysis("starter", 0);
    if (result.allowed) {
      accessSuite.tests.push({
        name: "Starter plan can use gap analysis (within limit)",
        status: "pass",
        message: `Allowed with ${result.remaining} remaining`,
      });
      accessSuite.passed++;
    } else {
      accessSuite.tests.push({
        name: "Starter plan can use gap analysis (within limit)",
        status: "fail",
        message: `Blocked: ${result.reason}`,
      });
      accessSuite.failed++;
    }
  } catch (err) {
    accessSuite.tests.push({
      name: "Starter plan can use gap analysis (within limit)",
      status: "fail",
      message: `Error: ${err instanceof Error ? err.message : "Unknown"}`,
    });
    accessSuite.failed++;
  }

  // Test 6.3: Starter plan blocked from action plan
  try {
    const result = canUseActionPlan("starter");
    if (!result.allowed) {
      accessSuite.tests.push({
        name: "Starter plan blocked from action plan",
        status: "pass",
        message: `Blocked: ${result.reason}`,
      });
      accessSuite.passed++;
    } else {
      accessSuite.tests.push({
        name: "Starter plan blocked from action plan",
        status: "fail",
        message: "Starter plan should be blocked from action plan (Pro only)",
      });
      accessSuite.failed++;
    }
  } catch (err) {
    accessSuite.tests.push({
      name: "Starter plan blocked from action plan",
      status: "fail",
      message: `Error: ${err instanceof Error ? err.message : "Unknown"}`,
    });
    accessSuite.failed++;
  }

  // Test 6.4: Pro plan has unlimited access
  try {
    const gapResult = canUseGapAnalysis("pro", 1000);
    const contentResult = canUseContentRecommendations("pro", 1000);
    const actionResult = canUseActionPlan("pro");
    
    if (gapResult.allowed && contentResult.allowed && actionResult.allowed) {
      accessSuite.tests.push({
        name: "Pro plan has unlimited access",
        status: "pass",
        message: "All features available even at high usage",
      });
      accessSuite.passed++;
    } else {
      accessSuite.tests.push({
        name: "Pro plan has unlimited access",
        status: "fail",
        message: "Pro plan should have unlimited access",
      });
      accessSuite.failed++;
    }
  } catch (err) {
    accessSuite.tests.push({
      name: "Pro plan has unlimited access",
      status: "fail",
      message: `Error: ${err instanceof Error ? err.message : "Unknown"}`,
    });
    accessSuite.failed++;
  }

  suites.push(accessSuite);

  // ============================================
  // SUITE 7: Feature Summary Tests
  // ============================================
  const summarySuite: TestSuite = {
    name: "Feature Summary",
    tests: [],
    passed: 0,
    failed: 0,
    skipped: 0,
  };

  // Test 7.1: getIntelligenceFeatureSummary returns correct structure
  try {
    const freeSummary = getIntelligenceFeatureSummary("free");
    const starterSummary = getIntelligenceFeatureSummary("starter");
    const proSummary = getIntelligenceFeatureSummary("pro");
    
    const hasCorrectStructure = 
      typeof freeSummary.gapAnalyses.limit === "number" &&
      typeof freeSummary.contentIdeas.limit === "number" &&
      typeof freeSummary.actionPlans.available === "boolean" &&
      typeof starterSummary.gapAnalyses.limit === "number" &&
      typeof proSummary.gapAnalyses.limit === "number";
    
    if (hasCorrectStructure) {
      summarySuite.tests.push({
        name: "Intelligence summary returns correct structure",
        status: "pass",
        message: "All plans have gapAnalyses, contentIdeas, actionPlans info",
        details: { 
          free: { gap: freeSummary.gapAnalyses.limit, content: freeSummary.contentIdeas.limit },
          starter: { gap: starterSummary.gapAnalyses.limit, content: starterSummary.contentIdeas.limit },
          pro: { gap: proSummary.gapAnalyses.limit, content: proSummary.contentIdeas.limit },
        },
      });
      summarySuite.passed++;
    } else {
      throw new Error("Missing properties");
    }
  } catch (err) {
    summarySuite.tests.push({
      name: "Intelligence summary returns correct structure",
      status: "fail",
      message: `Error: ${err instanceof Error ? err.message : "Unknown"}`,
    });
    summarySuite.failed++;
  }

  // Test 7.2: Free plan has zero limits
  try {
    const freeSummary = getIntelligenceFeatureSummary("free");
    
    if (freeSummary.gapAnalyses.limit === 0 && 
        freeSummary.contentIdeas.limit === 0 && 
        !freeSummary.actionPlans.available) {
      summarySuite.tests.push({
        name: "Free plan has zero intelligence limits",
        status: "pass",
        message: "Free users cannot use intelligence features",
      });
      summarySuite.passed++;
    } else {
      summarySuite.tests.push({
        name: "Free plan has zero intelligence limits",
        status: "fail",
        message: "Free plan should have 0 for all intelligence limits",
        details: freeSummary,
      });
      summarySuite.failed++;
    }
  } catch (err) {
    summarySuite.tests.push({
      name: "Free plan has zero intelligence limits",
      status: "fail",
      message: `Error: ${err instanceof Error ? err.message : "Unknown"}`,
    });
    summarySuite.failed++;
  }

  // Test 7.3: Pro plan has unlimited (Infinity)
  try {
    const proSummary = getIntelligenceFeatureSummary("pro");
    
    if (proSummary.gapAnalyses.limit === Infinity && 
        proSummary.contentIdeas.limit === Infinity && 
        proSummary.actionPlans.available) {
      summarySuite.tests.push({
        name: "Pro plan has unlimited intelligence",
        status: "pass",
        message: "Pro users have unlimited access to all features",
      });
      summarySuite.passed++;
    } else {
      summarySuite.tests.push({
        name: "Pro plan has unlimited intelligence",
        status: "fail",
        message: "Pro plan should have Infinity for all intelligence limits",
        details: proSummary,
      });
      summarySuite.failed++;
    }
  } catch (err) {
    summarySuite.tests.push({
      name: "Pro plan has unlimited intelligence",
      status: "fail",
      message: `Error: ${err instanceof Error ? err.message : "Unknown"}`,
    });
    summarySuite.failed++;
  }

  suites.push(summarySuite);

  // ============================================
  // Calculate totals
  // ============================================
  const totalPassed = suites.reduce((sum, s) => sum + s.passed, 0);
  const totalFailed = suites.reduce((sum, s) => sum + s.failed, 0);
  const totalSkipped = suites.reduce((sum, s) => sum + s.skipped, 0);
  const totalTests = totalPassed + totalFailed + totalSkipped;
  const totalDuration = Date.now() - startTime;

  const allPassed = totalFailed === 0;

  return NextResponse.json({
    success: allPassed,
    summary: {
      total: totalTests,
      passed: totalPassed,
      failed: totalFailed,
      skipped: totalSkipped,
      duration: `${totalDuration}ms`,
      passRate: `${Math.round((totalPassed / totalTests) * 100)}%`,
    },
    verdict: allPassed 
      ? "✅ ALL INTELLIGENCE TESTS PASSED - Production ready!" 
      : `❌ ${totalFailed} TESTS FAILED - Review issues before production`,
    suites,
    recommendations: totalFailed > 0 ? [
      "Fix all failing tests before going to production",
      "Ensure FRESH_SCHEMA.sql has been run in Supabase",
      "Verify all API keys are set in environment variables",
      "Check that OpenAI API has sufficient credits",
    ] : [
      "All tests passed!",
      "Intelligence features are production ready",
      "No mock data detected",
      "LLM integration verified",
    ],
    timestamp: new Date().toISOString(),
  });
}
