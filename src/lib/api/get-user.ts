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
 */
export async function getUser(): Promise<UserInfo | null> {
  // Check test session first
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

  // Fall back to Supabase auth
  const supabase = await createClient();
  if (!supabase) {
    return null;
  }

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return null;
  }

  // Get plan from organization (or default to free)
  // For now, return free - API routes will override with test plan if applicable
  return {
    id: user.id,
    email: user.email || "",
    name: user.user_metadata?.name || null,
    plan: "free", // Will be overridden by API routes
    isTestAccount: false,
  };
}

