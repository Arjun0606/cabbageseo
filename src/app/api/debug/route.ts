/**
 * Debug endpoint to test Supabase connection
 * DELETE THIS AFTER DEBUGGING
 */

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    env: {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
  };

  try {
    const supabase = createServiceClient();
    results.serviceClientCreated = !!supabase;

    if (supabase) {
      // Try to query organizations
      const { data: orgs, error: orgError } = await supabase
        .from("organizations")
        .select("id, name, slug")
        .limit(5);

      results.orgsQuery = {
        data: orgs,
        error: orgError ? { message: orgError.message, code: orgError.code } : null,
        count: orgs?.length ?? 0,
      };

      // Try to create an org
      if (!orgs || orgs.length === 0) {
        const { data: newOrg, error: createError } = await supabase
          .from("organizations")
          .insert({
            name: "Debug Test Org",
            slug: "debug-test-" + Date.now(),
            plan: "starter",
          })
          .select("id, name, slug")
          .single();

        results.createOrg = {
          data: newOrg,
          error: createError ? { message: createError.message, code: createError.code, details: createError.details } : null,
        };
      }
    }
  } catch (e) {
    results.error = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json(results);
}

