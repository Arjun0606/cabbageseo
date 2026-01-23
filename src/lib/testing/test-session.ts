/**
 * TEST SESSION HELPERS
 * 
 * Simple session management for test accounts
 * Bypasses Supabase auth entirely for testing
 */

import { cookies } from "next/headers";

export interface TestSession {
  email: string;
  plan: "free" | "starter" | "pro";
  name: string;
  organizationId?: string; // Set after first site creation
}

/**
 * Get current test session
 */
export async function getTestSession(): Promise<TestSession | null> {
  try {
    const cookieStore = await cookies();
    const testAccountCookie = cookieStore.get("test_account");
    
    if (!testAccountCookie?.value) {
      return null;
    }

    return JSON.parse(testAccountCookie.value) as TestSession;
  } catch {
    return null;
  }
}

/**
 * Check if user is logged in (test account)
 */
export async function isTestLoggedIn(): Promise<boolean> {
  const session = await getTestSession();
  return session !== null;
}

