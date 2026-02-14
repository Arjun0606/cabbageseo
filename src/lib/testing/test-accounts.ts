/**
 * TEST ACCOUNT BYPASS SYSTEM
 * 
 * ⚠️ TEMPORARY: For testing only. Remove before production launch.
 * 
 * This file provides credential-based access bypass for test accounts.
 * Test accounts can access features without payment, but limits are still
 * enforced based on their assigned test plan.
 * 
 * To re-enable paywalls: Remove all calls to isTestAccount() and getTestPlan()
 */

// ============================================
// TEST ACCOUNT CREDENTIALS
// ============================================

export interface TestAccount {
  email: string;
  password: string;
  plan: "free" | "scout" | "command" | "dominate";
  description: string;
}

export const TEST_ACCOUNTS: TestAccount[] = [
  {
    email: "test-free@cabbageseo.test",
    password: "TestFree123!",
    plan: "free",
    description: "Free tier test account - 3 checks/day, 1 site",
  },
  {
    email: "test-starter@cabbageseo.test",
    password: "TestStarter123!",
    plan: "scout",
    description: "Scout tier test account - Unlimited checks, 1 site",
  },
  {
    email: "test-pro@cabbageseo.test",
    password: "TestPro123!",
    plan: "command",
    description: "Command tier test account - Unlimited checks, 1 site",
  },
];

// ============================================
// TEST ACCOUNT HELPERS
// ============================================

/**
 * Check if an email is a test account
 */
export function isTestAccount(email: string | null | undefined): boolean {
  if (!isTestingModeEnabled()) return false;
  if (!email) return false;
  return TEST_ACCOUNTS.some(account => account.email === email.toLowerCase());
}

/**
 * Get the test plan for a test account email
 * Returns null if not a test account or if TESTING_MODE is disabled
 */
export function getTestPlan(email: string | null | undefined): "free" | "scout" | "command" | "dominate" | null {
  if (!isTestingModeEnabled()) return null;
  if (!email) return null;
  const account = TEST_ACCOUNTS.find(acc => acc.email === email.toLowerCase());
  return account?.plan || null;
}

/**
 * Get test account info by email
 */
export function getTestAccount(email: string | null | undefined): TestAccount | null {
  if (!isTestingModeEnabled()) return null;
  if (!email) return null;
  return TEST_ACCOUNTS.find(acc => acc.email === email.toLowerCase()) || null;
}

/**
 * Check if testing mode is enabled
 * Set TESTING_MODE=true in .env to enable
 */
export function isTestingModeEnabled(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  return process.env.TESTING_MODE === "true" || process.env.NEXT_PUBLIC_TESTING_MODE === "true";
}

/**
 * Bypass paywall check for test accounts
 * Returns true if account should bypass paywalls
 */
export function shouldBypassPaywall(email: string | null | undefined): boolean {
  return isTestingModeEnabled() && isTestAccount(email);
}

