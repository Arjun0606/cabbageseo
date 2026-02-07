/**
 * GET USER - Unified user retrieval
 *
 * Checks test session first (if TESTING_MODE), then Supabase auth.
 * Returns user info in a consistent format.
 * Queries the DB for real user plan (not hardcoded).
 */

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getTestSession } from "@/lib/testing/test-session";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface UserInfo {
  id: string;
  email: string;
  name: string | null;
  plan: "free" | "scout" | "command" | "dominate";
  organizationId: string | null;
  isTestAccount: boolean;
}

const TESTING_MODE = process.env.TESTING_MODE === "true";

function getDbClient(): SupabaseClient | null {
  try {
    return createServiceClient();
  } catch {
    return null;
  }
}

/**
 * Check for test bypass session (for testing without auth)
 * Only active when TESTING_MODE=true
 */
async function getBypassSession(): Promise<UserInfo | null> {
  if (!TESTING_MODE) return null;

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
          organizationId: session.organizationId || null,
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
 * 1. Test bypass session (only if TESTING_MODE=true)
 * 2. Supabase auth (real users - plan queried from DB)
 * 3. Test session cookie (only if TESTING_MODE=true)
 */
export async function getUser(): Promise<UserInfo | null> {
  // Check for test bypass FIRST (only in testing mode)
  const bypassSession = await getBypassSession();
  if (bypassSession) {
    return bypassSession;
  }

  // Check Supabase auth (real auth)
  const supabase = await createClient();
  if (supabase) {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (!error && user) {
      const email = user.email || "";
      let plan: "free" | "scout" | "command" | "dominate" = "free";
      let organizationId: string | null = null;

      // Query the DB for the user's actual plan
      const db = getDbClient();
      if (db) {
        const { data: existingUser } = await db
          .from("users")
          .select("organization_id")
          .eq("id", user.id)
          .maybeSingle();

        if (existingUser?.organization_id) {
          organizationId = existingUser.organization_id;

          const { data: org } = await db
            .from("organizations")
            .select("plan")
            .eq("id", existingUser.organization_id)
            .maybeSingle();

          if (org?.plan) {
            plan = org.plan as "free" | "scout" | "command" | "dominate";
          }
        }
      }

      return {
        id: user.id,
        email: email,
        name: user.user_metadata?.name || null,
        plan: plan,
        organizationId: organizationId,
        isTestAccount: false,
      };
    }
  }

  // Fall back to test session cookie (only in testing mode)
  if (TESTING_MODE) {
    const testSession = await getTestSession();
    if (testSession) {
      return {
        id: `test-${testSession.email}`,
        email: testSession.email,
        name: testSession.name,
        plan: testSession.plan,
        organizationId: null,
        isTestAccount: true,
      };
    }
  }

  return null;
}
