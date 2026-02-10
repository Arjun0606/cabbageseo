/**
 * GET USER - Unified user retrieval
 *
 * Authenticates via Supabase auth and returns user info.
 * Queries the DB for real user plan (not hardcoded).
 */

import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface UserInfo {
  id: string;
  email: string;
  name: string | null;
  plan: "free" | "scout" | "command" | "dominate";
  organizationId: string | null;
  isTestAccount: boolean;
}

function getDbClient(): SupabaseClient | null {
  try {
    return createServiceClient();
  } catch {
    return null;
  }
}

/**
 * Get current user via Supabase auth.
 * Returns user info with plan from DB, or null if not authenticated.
 */
export async function getUser(): Promise<UserInfo | null> {
  // Check Supabase auth
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

  return null;
}
