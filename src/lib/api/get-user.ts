/**
 * GET USER - Unified user retrieval
 * 
 * Checks test session first, then Supabase auth
 * Returns user info in a consistent format
 */

import { createClient } from "@/lib/supabase/server";
import { getTestSession } from "@/lib/testing/test-session";
import { cookies } from "next/headers";

export interface UserInfo {
  id: string;
  email: string;
  name: string | null;
  plan: "free" | "scout" | "command" | "dominate";
  isTestAccount: boolean;
}

/**
 * Check for test bypass session (for testing without auth)
 */
async function getBypassSession(): Promise<UserInfo | null> {
  try {
    const cookieStore = await cookies();
    const bypassCookie = cookieStore.get("test_bypass_session");
    if (bypassCookie) {
      const session = JSON.parse(bypassCookie.value);
      if (session.bypassMode) {
        return {
          id: `bypass-${session.plan}`,
          email: session.email,
          name: session.name,
          plan: session.plan as "free" | "scout" | "command" | "dominate",
          isTestAccount: true,
        };
      }
    }
  } catch {
    // Ignore cookie parse errors
  }
  return null;
}

/**
 * Get current user (test session or Supabase auth)
 * 
 * Priority order:
 * 1. Test bypass session (for automated testing)
 * 2. Supabase auth (if user is logged in via real auth)
 * 3. Test session cookie (fallback for test login API)
 */
export async function getUser(): Promise<UserInfo | null> {
  // Check for test bypass FIRST (highest priority for testing)
  const bypassSession = await getBypassSession();
  if (bypassSession) {
    return bypassSession;
  }

  // Check Supabase auth (real auth)
  const supabase = await createClient();
  if (supabase) {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (!error && user) {
      // Real Supabase user - get plan from test account email pattern if applicable
      const email = user.email || "";
      let plan: "free" | "scout" | "command" | "dominate" = "free";

      // Check if this is a test account email pattern
      if (email === "test-pro@cabbageseo.test") {
        plan = "command";
      } else if (email === "test-starter@cabbageseo.test") {
        plan = "scout";
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

