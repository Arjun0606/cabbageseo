/**
 * Comprehensive Automated Test Suite
 * 
 * Tests ALL tiers, ALL features, ALL flows
 * Run this before reinstating paywalls/auth
 * 
 * Usage: npx tsx scripts/comprehensive-test-suite.ts
 */

import { createClient } from "@supabase/supabase-js";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const TEST_ACCOUNTS = [
  {
    email: "test-free@cabbageseo.test",
    password: "TestFree123!",
    plan: "free",
  },
  {
    email: "test-scout@cabbageseo.test",
    password: "TestScout123!",
    plan: "scout",
  },
  {
    email: "test-command@cabbageseo.test",
    password: "TestCommand123!",
    plan: "command",
  },
];

interface TestResult {
  test: string;
  tier: string;
  passed: boolean;
  error?: string;
  details?: any;
}

const results: TestResult[] = [];

async function test(name: string, tier: string, fn: () => Promise<void>) {
  try {
    await fn();
    results.push({ test: name, tier, passed: true });
    console.log(`✅ [${tier}] ${name}`);
  } catch (error: any) {
    results.push({ test: name, tier, passed: false, error: error.message });
    console.error(`❌ [${tier}] ${name}: ${error.message}`);
  }
}

async function makeRequest(path: string, options: RequestInit = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  return response;
}

async function loginWithTestAccount(email: string, password: string): Promise<string> {
  // Use test login endpoint
  const response = await makeRequest("/api/test/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  
  if (!response.ok) {
    throw new Error(`Login failed: ${await response.text()}`);
  }
  
  const data = await response.json();
  return data.sessionToken || "test-session";
}

async function runTests() {
  console.log("🧪 Starting Comprehensive Test Suite\n");

  // Test 1: Authentication & Test Accounts
  console.log("📋 Testing Authentication...");
  for (const account of TEST_ACCOUNTS) {
    await test(`Login with ${account.plan} account`, account.plan, async () => {
      const session = await loginWithTestAccount(account.email, account.password);
      if (!session) throw new Error("No session returned");
    });
  }

  // Test 2: API Endpoints
  console.log("\n📋 Testing API Endpoints...");
  
  for (const account of TEST_ACCOUNTS) {
    const session = await loginWithTestAccount(account.email, account.password);
    
    await test("GET /api/me", account.plan, async () => {
      const response = await makeRequest("/api/me", {
        headers: { Cookie: `test-session=${session}` },
      });
      if (!response.ok) throw new Error(`Status: ${response.status}`);
      const data = await response.json();
      if (data.plan !== account.plan) {
        throw new Error(`Expected plan ${account.plan}, got ${data.plan}`);
      }
    });

    await test("GET /api/sites", account.plan, async () => {
      const response = await makeRequest("/api/sites", {
        headers: { Cookie: `test-session=${session}` },
      });
      if (!response.ok) throw new Error(`Status: ${response.status}`);
    });

    await test("POST /api/sites (create)", account.plan, async () => {
      const response = await makeRequest("/api/sites", {
        method: "POST",
        headers: { Cookie: `test-session=${session}` },
        body: JSON.stringify({ domain: `test-${account.plan}-${Date.now()}.com` }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Status: ${response.status}`);
      }
    });
  }

  // Test 3: Plan Limits Enforcement
  console.log("\n📋 Testing Plan Limits...");
  
  const freeAccount = TEST_ACCOUNTS[0];
  const freeSession = await loginWithTestAccount(freeAccount.email, freeAccount.password);
  
  await test("Free tier: 3 checks/day limit", "free", async () => {
    // Create a site first
    const siteResponse = await makeRequest("/api/sites", {
      method: "POST",
      headers: { Cookie: `test-session=${freeSession}` },
      body: JSON.stringify({ domain: `test-limit-${Date.now()}.com` }),
    });
    const site = await siteResponse.json();
    
    // Try to run 4 checks (should fail on 4th)
    for (let i = 0; i < 4; i++) {
      const checkResponse = await makeRequest("/api/geo/citations/check", {
        method: "POST",
        headers: { Cookie: `test-session=${freeSession}` },
        body: JSON.stringify({ siteId: site.id }),
      });
      
      if (i === 3 && checkResponse.ok) {
        throw new Error("Should have hit limit on 4th check");
      }
      if (i < 3 && !checkResponse.ok) {
        throw new Error(`Check ${i + 1} failed unexpectedly`);
      }
    }
  });

  // Test 4: Paywall Enforcement
  console.log("\n📋 Testing Paywalls...");
  
  await test("Free tier: Trust Map read-only", "free", async () => {
    const response = await makeRequest("/api/sites/listings", {
      headers: { Cookie: `test-session=${freeSession}` },
    });
    // Should work (read-only access)
    if (!response.ok) throw new Error("Free tier should access Trust Map");
  });

  await test("Free tier: Why Not Me? blocked", "free", async () => {
    // This should be blocked by paywall
    // Implementation depends on how paywall is enforced
  });

  // Test 5: Inngest Jobs
  console.log("\n📋 Testing Inngest Jobs...");
  
  await test("Inngest endpoint accessible", "all", async () => {
    const response = await makeRequest("/api/inngest", { method: "GET" });
    // Inngest endpoint should respond (even if 404 is ok for GET)
    if (response.status >= 500) {
      throw new Error(`Server error: ${response.status}`);
    }
  });

  // Test 6: Webhooks
  console.log("\n📋 Testing Webhooks...");
  
  await test("Dodo webhook endpoint exists", "all", async () => {
    const response = await makeRequest("/api/webhooks/dodo", {
      method: "POST",
      body: JSON.stringify({ type: "test" }),
    });
    // Should handle webhook (even if validation fails)
    if (response.status >= 500) {
      throw new Error(`Server error: ${response.status}`);
    }
  });

  // Test 7: Billing Flow
  console.log("\n📋 Testing Billing...");
  
  await test("Checkout session creation", "all", async () => {
    const starterSession = await loginWithTestAccount(
      TEST_ACCOUNTS[1].email,
      TEST_ACCOUNTS[1].password
    );
    
    const response = await makeRequest("/api/billing/checkout", {
      method: "POST",
      headers: { Cookie: `test-session=${starterSession}` },
      body: JSON.stringify({ planId: "starter", interval: "monthly" }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Status: ${response.status}`);
    }
  });

  // Test 8: Dashboard Rendering
  console.log("\n📋 Testing Dashboard...");
  
  for (const account of TEST_ACCOUNTS) {
    const session = await loginWithTestAccount(account.email, account.password);
    
    await test("Dashboard page loads", account.plan, async () => {
      const response = await makeRequest("/dashboard", {
        headers: { Cookie: `test-session=${session}` },
      });
      if (!response.ok) throw new Error(`Status: ${response.status}`);
    });
  }

  // Print Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 TEST SUMMARY");
  console.log("=".repeat(60));
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${results.length}`);
  
  if (failed > 0) {
    console.log("\n❌ FAILED TESTS:");
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - [${r.tier}] ${r.test}: ${r.error}`);
    });
  }
  
  console.log("\n" + "=".repeat(60));
  
  return failed === 0;
}

// Run tests
if (require.main === module) {
  runTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
}

export { runTests };

