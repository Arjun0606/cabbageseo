/**
 * GET USER - Unified user retrieval
 * 
 * Checks test session first, then Supabase auth
 * Returns user info in a consistent format
 */

import { createClient } from "@/lib/supabase/server";
import { getTestSession } from "@/lib/testing/test-session";

export interface UserInfo {
  id: string;
  email: string;
  name: string | null;
  plan: "free" | "starter" | "pro";
  isTestAccount: boolean;
}

/**
 * Get current user (test session or Supabase auth)
 * 
 * Priority order:
 * 1. Supabase auth (if user is logged in via real auth)
 * 2. Test session cookie (fallback for test login API)
 */
export async function getUser(): Promise<UserInfo | null> {
  // Check Supabase auth FIRST (real auth takes priority)
  const supabase = await createClient();
  if (supabase) {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (!error && user) {
      // Real Supabase user - get plan from test account email pattern if applicable
      const email = user.email || "";
      let plan: "free" | "starter" | "pro" = "free";
      
      // Check if this is a test account email pattern
      if (email === "test-pro@cabbageseo.test") {
        plan = "pro";
      } else if (email === "test-starter@cabbageseo.test") {
        plan = "starter";
      } else if (email === "test-free@cabbageseo.test") {
        plan = "free";
      }
      // TODO: For real users, get plan from organization/subscription
      
      return {
        id: user.id,
        email: email,
        name: user.user_metadata?.name || null,
        plan: plan,
        isTestAccount: email.endsWith("@cabbageseo.test"),
      };
    }
  }

  // Fall back to test session cookie (for test login API)
  const testSession = await getTestSession();
  if (testSession) {
    return {
      id: `test-${testSession.email}`,
      email: testSession.email,
      name: testSession.name,
      plan: testSession.plan,
      isTestAccount: true,
    };
  }

  return null;
}

