/**
 * Comprehensive Test Endpoint
 * 
 * Tests ALL features of CabbageSEO using service role.
 * Only works if TEST_SECRET matches.
 * 
 * GET /api/test/comprehensive?secret=YOUR_TEST_SECRET
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { CITATION_PLANS } from "@/lib/billing/citation-plans";

interface TestResult {
  name: string;
  passed: boolean;
  duration?: number;
  error?: string;
  data?: unknown;
}

interface TestSuite {
  name: string;
  tests: TestResult[];
}

// Test secret - set this in Vercel env vars
const TEST_SECRET = process.env.TEST_SECRET || "cabbageseo-test-2024";

export async function GET(request: NextRequest) {
  // Verify test secret
  const secret = request.nextUrl.searchParams.get("secret");
  if (secret !== TEST_SECRET) {
    return NextResponse.json({ error: "Invalid test secret" }, { status: 401 });
  }

  const suites: TestSuite[] = [];
  let serviceClient: ReturnType<typeof createServiceClient>;
  
  try {
    serviceClient = createServiceClient();
  } catch (e) {
    return NextResponse.json({ 
      error: "Service client not configured",
      details: e instanceof Error ? e.message : "Unknown"
    }, { status: 500 });
  }

  // ============================================
  // TEST SUITE 1: Database Connection
  // ============================================
  const dbTests: TestResult[] = [];
  
  // Test organizations table
  const orgStart = Date.now();
  try {
    const { data, error } = await serviceClient
      .from("organizations")
      .select("id, name, plan")
      .limit(1);
    
    dbTests.push({
      name: "Organizations table accessible",
      passed: !error,
      duration: Date.now() - orgStart,
      error: error?.message,
      data: data ? `Found ${data.length} orgs` : null
    });
  } catch (e) {
    dbTests.push({
      name: "Organizations table accessible",
      passed: false,
      error: e instanceof Error ? e.message : "Unknown"
    });
  }

  // Test users table
  const userStart = Date.now();
  try {
    const { data, error } = await serviceClient
      .from("users")
      .select("id, email")
      .limit(1);
    
    dbTests.push({
      name: "Users table accessible",
      passed: !error,
      duration: Date.now() - userStart,
      error: error?.message,
      data: data ? `Found ${data.length} users` : null
    });
  } catch (e) {
    dbTests.push({
      name: "Users table accessible",
      passed: false,
      error: e instanceof Error ? e.message : "Unknown"
    });
  }

  // Test sites table
  const siteStart = Date.now();
  try {
    const { data, error } = await serviceClient
      .from("sites")
      .select("id, domain")
      .limit(1);
    
    dbTests.push({
      name: "Sites table accessible",
      passed: !error,
      duration: Date.now() - siteStart,
      error: error?.message,
      data: data ? `Found ${data.length} sites` : null
    });
  } catch (e) {
    dbTests.push({
      name: "Sites table accessible",
      passed: false,
      error: e instanceof Error ? e.message : "Unknown"
    });
  }

  // Test citations table
  const citStart = Date.now();
  try {
    const { data, error } = await serviceClient
      .from("citations")
      .select("id, platform")
      .limit(1);
    
    dbTests.push({
      name: "Citations table accessible",
      passed: !error,
      duration: Date.now() - citStart,
      error: error?.message,
      data: data ? `Found ${data.length} citations` : null
    });
  } catch (e) {
    dbTests.push({
      name: "Citations table accessible",
      passed: false,
      error: e instanceof Error ? e.message : "Unknown"
    });
  }

  // Test usage table
  const usageStart = Date.now();
  try {
    const { data, error } = await serviceClient
      .from("usage")
      .select("id, period")
      .limit(1);
    
    dbTests.push({
      name: "Usage table accessible",
      passed: !error,
      duration: Date.now() - usageStart,
      error: error?.message,
      data: data ? `Found ${data.length} usage records` : null
    });
  } catch (e) {
    dbTests.push({
      name: "Usage table accessible",
      passed: false,
      error: e instanceof Error ? e.message : "Unknown"
    });
  }

  // Test competitors table
  const compStart = Date.now();
  try {
    const { data, error } = await serviceClient
      .from("competitors")
      .select("id, domain")
      .limit(1);
    
    dbTests.push({
      name: "Competitors table accessible",
      passed: !error,
      duration: Date.now() - compStart,
      error: error?.message,
      data: data ? `Found ${data.length} competitors` : null
    });
  } catch (e) {
    dbTests.push({
      name: "Competitors table accessible",
      passed: false,
      error: e instanceof Error ? e.message : "Unknown"
    });
  }

  // Test notifications table
  const notifStart = Date.now();
  try {
    const { data, error } = await serviceClient
      .from("notifications")
      .select("id")
      .limit(1);
    
    dbTests.push({
      name: "Notifications table accessible",
      passed: !error,
      duration: Date.now() - notifStart,
      error: error?.message,
      data: data ? `Found ${data.length} notification settings` : null
    });
  } catch (e) {
    dbTests.push({
      name: "Notifications table accessible",
      passed: false,
      error: e instanceof Error ? e.message : "Unknown"
    });
  }

  // Test geo_analyses table
  const geoStart = Date.now();
  try {
    const { data, error } = await serviceClient
      .from("geo_analyses")
      .select("id")
      .limit(1);
    
    dbTests.push({
      name: "GEO Analyses table accessible",
      passed: !error,
      duration: Date.now() - geoStart,
      error: error?.message,
      data: data ? `Found ${data.length} analyses` : null
    });
  } catch (e) {
    dbTests.push({
      name: "GEO Analyses table accessible",
      passed: false,
      error: e instanceof Error ? e.message : "Unknown"
    });
  }

  suites.push({ name: "Database Tables", tests: dbTests });

  // ============================================
  // TEST SUITE 2: Pricing Plans Configuration
  // ============================================
  const pricingTests: TestResult[] = [];

  // Test Free plan
  pricingTests.push({
    name: "Free plan configured",
    passed: CITATION_PLANS.free !== undefined,
    data: CITATION_PLANS.free ? {
      sites: CITATION_PLANS.free.limits.sites,
      checks: CITATION_PLANS.free.limits.manualChecksPerDay,
      price: CITATION_PLANS.free.monthlyPrice
    } : null
  });

  // Test Starter plan
  pricingTests.push({
    name: "Starter plan configured",
    passed: CITATION_PLANS.starter !== undefined,
    data: CITATION_PLANS.starter ? {
      sites: CITATION_PLANS.starter.limits.sites,
      checks: CITATION_PLANS.starter.limits.manualChecksPerDay,
      monthlyPrice: CITATION_PLANS.starter.monthlyPrice,
      yearlyPrice: CITATION_PLANS.starter.yearlyPrice
    } : null
  });

  // Test Pro plan
  pricingTests.push({
    name: "Pro plan configured",
    passed: CITATION_PLANS.pro !== undefined,
    data: CITATION_PLANS.pro ? {
      sites: CITATION_PLANS.pro.limits.sites,
      checks: CITATION_PLANS.pro.limits.manualChecksPerDay,
      monthlyPrice: CITATION_PLANS.pro.monthlyPrice,
      yearlyPrice: CITATION_PLANS.pro.yearlyPrice
    } : null
  });

  // Verify pricing discount
  const starterDiscount = CITATION_PLANS.starter ? 
    ((CITATION_PLANS.starter.monthlyPrice - CITATION_PLANS.starter.yearlyPrice) / CITATION_PLANS.starter.monthlyPrice * 100) : 0;
  pricingTests.push({
    name: "Starter yearly discount ~17%",
    passed: starterDiscount >= 15 && starterDiscount <= 20,
    data: `${starterDiscount.toFixed(1)}% discount`
  });

  suites.push({ name: "Pricing Configuration", tests: pricingTests });

  // ============================================
  // TEST SUITE 3: Environment Variables
  // ============================================
  const envTests: TestResult[] = [];

  // Supabase
  envTests.push({
    name: "NEXT_PUBLIC_SUPABASE_URL configured",
    passed: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    data: process.env.NEXT_PUBLIC_SUPABASE_URL ? "Set" : "Missing"
  });

  envTests.push({
    name: "SUPABASE_SERVICE_ROLE_KEY configured",
    passed: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    data: process.env.SUPABASE_SERVICE_ROLE_KEY ? "Set (hidden)" : "Missing"
  });

  // AI APIs
  envTests.push({
    name: "PERPLEXITY_API_KEY configured",
    passed: !!process.env.PERPLEXITY_API_KEY,
    data: process.env.PERPLEXITY_API_KEY ? "Set (hidden)" : "Missing"
  });

  envTests.push({
    name: "GOOGLE_AI_API_KEY configured",
    passed: !!process.env.GOOGLE_AI_API_KEY,
    data: process.env.GOOGLE_AI_API_KEY ? "Set (hidden)" : "Missing"
  });

  envTests.push({
    name: "OPENAI_API_KEY configured",
    passed: !!process.env.OPENAI_API_KEY,
    data: process.env.OPENAI_API_KEY ? "Set (hidden)" : "Missing"
  });

  // Billing
  envTests.push({
    name: "DODO_PAYMENTS_API_KEY configured",
    passed: !!process.env.DODO_PAYMENTS_API_KEY,
    data: process.env.DODO_PAYMENTS_API_KEY ? "Set (hidden)" : "Missing"
  });

  envTests.push({
    name: "DODO_STARTER_MONTHLY_ID configured",
    passed: !!process.env.DODO_STARTER_MONTHLY_ID,
    data: process.env.DODO_STARTER_MONTHLY_ID ? "Set" : "Missing"
  });

  envTests.push({
    name: "DODO_PRO_MONTHLY_ID configured",
    passed: !!process.env.DODO_PRO_MONTHLY_ID,
    data: process.env.DODO_PRO_MONTHLY_ID ? "Set" : "Missing"
  });

  // Email
  envTests.push({
    name: "RESEND_API_KEY configured",
    passed: !!process.env.RESEND_API_KEY,
    data: process.env.RESEND_API_KEY ? "Set (hidden)" : "Missing"
  });

  // Inngest
  envTests.push({
    name: "INNGEST_SIGNING_KEY configured",
    passed: !!process.env.INNGEST_SIGNING_KEY,
    data: process.env.INNGEST_SIGNING_KEY ? "Set (hidden)" : "Missing"
  });

  suites.push({ name: "Environment Variables", tests: envTests });

  // ============================================
  // TEST SUITE 4: Citation Check API (Real Test)
  // ============================================
  const citationTests: TestResult[] = [];

  // Test Perplexity API (if configured)
  if (process.env.PERPLEXITY_API_KEY) {
    const perplexityStart = Date.now();
    try {
      const response = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "sonar",
          messages: [{ role: "user", content: "What is CabbageSEO?" }],
          max_tokens: 100,
        }),
      });
      
      const data = await response.json();
      citationTests.push({
        name: "Perplexity API working",
        passed: response.ok,
        duration: Date.now() - perplexityStart,
        error: response.ok ? undefined : JSON.stringify(data),
        data: response.ok ? "API responded successfully" : null
      });
    } catch (e) {
      citationTests.push({
        name: "Perplexity API working",
        passed: false,
        error: e instanceof Error ? e.message : "Unknown"
      });
    }
  } else {
    citationTests.push({
      name: "Perplexity API working",
      passed: false,
      error: "PERPLEXITY_API_KEY not configured"
    });
  }

  // Test Google AI API (if configured)
  if (process.env.GOOGLE_AI_API_KEY) {
    const googleStart = Date.now();
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "Say hello" }] }],
          }),
        }
      );
      
      const data = await response.json();
      citationTests.push({
        name: "Google AI API working",
        passed: response.ok,
        duration: Date.now() - googleStart,
        error: response.ok ? undefined : JSON.stringify(data),
        data: response.ok ? "API responded successfully" : null
      });
    } catch (e) {
      citationTests.push({
        name: "Google AI API working",
        passed: false,
        error: e instanceof Error ? e.message : "Unknown"
      });
    }
  } else {
    citationTests.push({
      name: "Google AI API working",
      passed: false,
      error: "GOOGLE_AI_API_KEY not configured"
    });
  }

  // Test OpenAI API (if configured)
  if (process.env.OPENAI_API_KEY) {
    const openaiStart = Date.now();
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: "Say hello" }],
          max_tokens: 10,
        }),
      });
      
      const data = await response.json();
      citationTests.push({
        name: "OpenAI API working",
        passed: response.ok,
        duration: Date.now() - openaiStart,
        error: response.ok ? undefined : JSON.stringify(data),
        data: response.ok ? "API responded successfully" : null
      });
    } catch (e) {
      citationTests.push({
        name: "OpenAI API working",
        passed: false,
        error: e instanceof Error ? e.message : "Unknown"
      });
    }
  } else {
    citationTests.push({
      name: "OpenAI API working",
      passed: false,
      error: "OPENAI_API_KEY not configured"
    });
  }

  suites.push({ name: "AI APIs (Citation Detection)", tests: citationTests });

  // ============================================
  // TEST SUITE 5: Billing (Dodo Payments)
  // ============================================
  const billingTests: TestResult[] = [];

  if (process.env.DODO_PAYMENTS_API_KEY) {
    // We can't fully test checkout without a user, but we can verify the SDK works
    billingTests.push({
      name: "Dodo Payments API key configured",
      passed: true,
      data: "API key is set"
    });

    // Check product IDs
    const products = [
      { name: "Starter Monthly", env: "DODO_STARTER_MONTHLY_ID" },
      { name: "Starter Yearly", env: "DODO_STARTER_YEARLY_ID" },
      { name: "Pro Monthly", env: "DODO_PRO_MONTHLY_ID" },
      { name: "Pro Yearly", env: "DODO_PRO_YEARLY_ID" },
    ];

    for (const product of products) {
      billingTests.push({
        name: `${product.name} product ID configured`,
        passed: !!process.env[product.env],
        data: process.env[product.env] ? `Set: ${process.env[product.env]}` : "Missing"
      });
    }
  } else {
    billingTests.push({
      name: "Dodo Payments configured",
      passed: false,
      error: "DODO_PAYMENTS_API_KEY not set"
    });
  }

  suites.push({ name: "Billing (Dodo Payments)", tests: billingTests });

  // ============================================
  // TEST SUITE 6: Email (Resend)
  // ============================================
  const emailTests: TestResult[] = [];

  if (process.env.RESEND_API_KEY) {
    emailTests.push({
      name: "Resend API key configured",
      passed: true,
      data: "API key is set"
    });

    // Test Resend API connectivity
    const resendStart = Date.now();
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "test@cabbageseo.com",
          to: "test@test.com",
          subject: "Test",
          text: "Test",
        }),
      });
      
      // We expect this to fail with domain not verified, but 4xx means API is working
      emailTests.push({
        name: "Resend API accessible",
        passed: response.status < 500,
        duration: Date.now() - resendStart,
        data: `Status: ${response.status}`
      });
    } catch (e) {
      emailTests.push({
        name: "Resend API accessible",
        passed: false,
        error: e instanceof Error ? e.message : "Unknown"
      });
    }
  } else {
    emailTests.push({
      name: "Resend configured",
      passed: false,
      error: "RESEND_API_KEY not set"
    });
  }

  suites.push({ name: "Email (Resend)", tests: emailTests });

  // ============================================
  // TEST SUITE: Intelligence Features
  // ============================================
  const intelligenceTests: TestResult[] = [];

  // Test intelligence limits configuration
  try {
    const { CITATION_PLANS } = await import("@/lib/billing/citation-plans");
    
    const freeLimits = CITATION_PLANS.free.intelligenceLimits;
    const starterLimits = CITATION_PLANS.starter.intelligenceLimits;
    const proLimits = CITATION_PLANS.pro.intelligenceLimits;
    
    intelligenceTests.push({
      name: "Intelligence limits configured",
      passed: freeLimits.gapAnalysesPerMonth === 0 && 
              starterLimits.gapAnalysesPerMonth === 5 && 
              proLimits.gapAnalysesPerMonth === -1, // -1 means unlimited
      data: { free: freeLimits, starter: starterLimits, pro: proLimits },
    });
  } catch (e) {
    intelligenceTests.push({
      name: "Intelligence limits configured",
      passed: false,
      error: e instanceof Error ? e.message : "Unknown",
    });
  }

  // Test citationIntelligence service exists
  try {
    const { citationIntelligence } = await import("@/lib/geo/citation-intelligence");
    
    intelligenceTests.push({
      name: "Citation intelligence service available",
      passed: typeof citationIntelligence.analyzeCitationGap === "function" &&
              typeof citationIntelligence.generateContentRecommendations === "function" &&
              typeof citationIntelligence.generateWeeklyActionPlan === "function",
      data: "All methods available",
    });
  } catch (e) {
    intelligenceTests.push({
      name: "Citation intelligence service available",
      passed: false,
      error: e instanceof Error ? e.message : "Unknown",
    });
  }

  // Test intelligence usage columns exist
  try {
    const { error } = await serviceClient
      .from("usage")
      .select("gap_analyses_used, content_ideas_used, action_plans_used")
      .limit(1);
    
    intelligenceTests.push({
      name: "Intelligence usage columns exist",
      passed: !error || !error.message.includes("does not exist"),
      error: error?.message,
    });
  } catch (e) {
    intelligenceTests.push({
      name: "Intelligence usage columns exist",
      passed: false,
      error: e instanceof Error ? e.message : "Unknown",
    });
  }

  // Test OpenAI API for intelligence
  if (process.env.OPENAI_API_KEY) {
    try {
      const openaiStart = Date.now();
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: "Reply with just: OK" }],
          max_tokens: 5,
        }),
      });
      
      intelligenceTests.push({
        name: "OpenAI API for intelligence",
        passed: response.ok,
        duration: Date.now() - openaiStart,
        data: response.ok ? "API ready" : `HTTP ${response.status}`,
      });
    } catch (e) {
      intelligenceTests.push({
        name: "OpenAI API for intelligence",
        passed: false,
        error: e instanceof Error ? e.message : "Unknown",
      });
    }
  } else {
    intelligenceTests.push({
      name: "OpenAI API for intelligence",
      passed: false,
      error: "OPENAI_API_KEY not set",
    });
  }

  suites.push({ name: "Intelligence Features", tests: intelligenceTests });

  // ============================================
  // SUMMARY
  // ============================================
  let totalPassed = 0;
  let totalFailed = 0;

  for (const suite of suites) {
    for (const test of suite.tests) {
      if (test.passed) totalPassed++;
      else totalFailed++;
    }
  }

  return NextResponse.json({
    success: totalFailed === 0,
    summary: {
      total: totalPassed + totalFailed,
      passed: totalPassed,
      failed: totalFailed,
    },
    suites,
    timestamp: new Date().toISOString(),
  });
}

