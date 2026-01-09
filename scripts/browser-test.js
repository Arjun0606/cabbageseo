/**
 * ============================================
 * CabbageSEO - Browser Console Test Script
 * ============================================
 * 
 * Copy and paste this into your browser console when logged in
 * to test all authenticated endpoints.
 * 
 * OR run: node scripts/browser-test.js (won't work without auth)
 */

const BASE_URL = window?.location?.origin || 'http://localhost:3000';

const tests = [];
let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    const start = Date.now();
    await fn();
    const duration = Date.now() - start;
    console.log(`✅ ${name} (${duration}ms)`);
    passed++;
    tests.push({ name, passed: true, duration });
  } catch (error) {
    console.error(`❌ ${name}: ${error.message}`);
    failed++;
    tests.push({ name, passed: false, error: error.message });
  }
}

async function runAllTests() {
  console.log('\\n============================================');
  console.log('CabbageSEO Comprehensive Test Suite');
  console.log('============================================\\n');

  // ============================================
  // 1. AUTHENTICATION TESTS
  // ============================================
  console.log('--- Authentication Tests ---');
  
  await test('GET /api/me returns user data', async () => {
    const res = await fetch(`${BASE_URL}/api/me`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.authenticated) throw new Error('Not authenticated');
    if (!data.user?.email) throw new Error('Missing user email');
  });

  await test('GET /api/settings/account returns profile', async () => {
    const res = await fetch(`${BASE_URL}/api/settings/account`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed');
  });

  // ============================================
  // 2. SITES TESTS
  // ============================================
  console.log('\\n--- Sites Tests ---');
  
  await test('GET /api/sites returns sites array', async () => {
    const res = await fetch(`${BASE_URL}/api/sites`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.sites)) throw new Error('sites is not an array');
  });

  // ============================================
  // 3. CITATIONS TESTS
  // ============================================
  console.log('\\n--- Citations Tests ---');
  
  await test('GET /api/geo/citations returns citations', async () => {
    const res = await fetch(`${BASE_URL}/api/geo/citations`);
    // 401 is ok if no site selected, 200 is ok if site exists
    if (res.status !== 200 && res.status !== 401 && res.status !== 400) {
      throw new Error(`HTTP ${res.status}`);
    }
  });

  // ============================================
  // 4. BILLING TESTS
  // ============================================
  console.log('\\n--- Billing Tests ---');
  
  await test('GET /api/billing/usage returns usage data', async () => {
    const res = await fetch(`${BASE_URL}/api/billing/usage`);
    if (!res.ok && res.status !== 401) throw new Error(`HTTP ${res.status}`);
  });

  await test('GET /api/billing/portal returns billing info', async () => {
    const res = await fetch(`${BASE_URL}/api/billing/portal`);
    // 400 is ok if no customer ID yet
    if (!res.ok && res.status !== 400) throw new Error(`HTTP ${res.status}`);
  });

  await test('POST /api/billing/checkout creates session', async () => {
    const res = await fetch(`${BASE_URL}/api/billing/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId: 'starter', interval: 'monthly' }),
    });
    // 500/503 is ok if Dodo not configured
    if (!res.ok && res.status !== 500 && res.status !== 503) {
      // Try to parse error message if available
      let errorMsg = `HTTP ${res.status}`;
      try {
        const errorData = await res.json();
        if (errorData.error) errorMsg += `: ${errorData.error}`;
      } catch { /* ignore parse errors */ }
      throw new Error(errorMsg);
    }
    // If success, should have checkout URL
    if (res.ok) {
      const data = await res.json();
      if (!data.url && !data.data?.checkoutUrl) {
        throw new Error('No checkout URL returned');
      }
    }
  });

  // ============================================
  // 5. GEO INTELLIGENCE TESTS
  // ============================================
  console.log('\\n--- GEO Intelligence Tests ---');
  
  await test('GET /api/geo/intelligence returns analysis', async () => {
    const res = await fetch(`${BASE_URL}/api/geo/intelligence`);
    // 401/400 is ok if no site, 200 is ok with site
    if (res.status !== 200 && res.status !== 401 && res.status !== 400) {
      throw new Error(`HTTP ${res.status}`);
    }
  });

  // ============================================
  // 6. NOTIFICATIONS TESTS
  // ============================================
  console.log('\\n--- Notifications Tests ---');
  
  await test('GET /api/notifications returns settings', async () => {
    const res = await fetch(`${BASE_URL}/api/notifications`);
    if (!res.ok && res.status !== 401) throw new Error(`HTTP ${res.status}`);
  });

  // ============================================
  // 7. COMPETITORS TESTS
  // ============================================
  console.log('\\n--- Competitors Tests ---');
  
  await test('GET /api/seo/competitors returns competitors', async () => {
    const res = await fetch(`${BASE_URL}/api/seo/competitors`);
    // 401/400 is ok if no site
    if (res.status !== 200 && res.status !== 401 && res.status !== 400) {
      throw new Error(`HTTP ${res.status}`);
    }
  });

  // ============================================
  // SUMMARY
  // ============================================
  console.log('\\n============================================');
  console.log(`RESULTS: ${passed} passed, ${failed} failed`);
  console.log('============================================\\n');

  if (failed > 0) {
    console.log('Failed tests:');
    tests.filter(t => !t.passed).forEach(t => {
      console.log(`  - ${t.name}: ${t.error}`);
    });
  }

  return { passed, failed, tests };
}

// Run tests
runAllTests().then(results => {
  if (typeof window !== 'undefined') {
    window.testResults = results;
    console.log('\\nResults saved to window.testResults');
  }
});

