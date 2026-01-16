/**
 * CREATE TEST ACCOUNTS API
 * 
 * ⚠️ TESTING ONLY - Creates test accounts with auto-confirmed emails
 * 
 * This endpoint creates the three test accounts directly in Supabase Auth
 * with email_confirmed_at set, so you can login immediately without email verification.
 * 
 * Usage: POST /api/test/create-accounts
 * 
 * ⚠️ Only works if SUPABASE_SERVICE_ROLE_KEY is set (admin access required)
 */

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { TEST_ACCOUNTS } from "@/lib/testing/test-accounts";

export async function POST() {
  // Only allow in development or if TESTING_MODE is enabled
  if (process.env.NODE_ENV === "production" && process.env.TESTING_MODE !== "true") {
    return NextResponse.json(
      { error: "This endpoint is only available in testing mode" },
      { status: 403 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      {
        error: "Supabase not configured",
        message: "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set",
      },
      { status: 500 }
    );
  }

  try {
    // Create admin client with service role key
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const results = [];

    for (const testAccount of TEST_ACCOUNTS) {
      try {
        // Check if user already exists - list users and find by email
        const { data: usersData } = await adminClient.auth.admin.listUsers();
        const existingUser = usersData?.users.find(u => u.email === testAccount.email.toLowerCase());

        if (existingUser) {
          // User exists - confirm email if not already confirmed
          if (!existingUser.email_confirmed_at) {
            await adminClient.auth.admin.updateUserById(existingUser.id, {
              email_confirm: true,
            });
            results.push({
              email: testAccount.email,
              status: "updated",
              message: "Email confirmed",
            });
          } else {
            results.push({
              email: testAccount.email,
              status: "exists",
              message: "Account already exists and confirmed",
            });
          }
        } else {
          // Create new user with auto-confirmed email
          const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
            email: testAccount.email,
            password: testAccount.password,
            email_confirm: true, // Auto-confirm email
            user_metadata: {
              name: `Test ${testAccount.plan.charAt(0).toUpperCase() + testAccount.plan.slice(1)}`,
            },
          });

          if (createError) {
            results.push({
              email: testAccount.email,
              status: "error",
              message: createError.message,
            });
          } else {
            results.push({
              email: testAccount.email,
              status: "created",
              message: "Account created and confirmed",
              userId: newUser.user.id,
            });
          }
        }
      } catch (err: any) {
        results.push({
          email: testAccount.email,
          status: "error",
          message: err.message || "Unknown error",
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Test accounts processed",
      results,
    });
  } catch (error: any) {
    console.error("[Create Test Accounts] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to create test accounts",
        message: error.message,
        hint: "Make sure SUPABASE_SERVICE_ROLE_KEY is set in your environment",
      },
      { status: 500 }
    );
  }
}

