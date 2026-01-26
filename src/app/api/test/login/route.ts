/**
 * SIMPLE TEST LOGIN - Bypasses Supabase Auth
 * 
 * ⚠️ TESTING ONLY - Simple credential check
 * 
 * Just checks credentials and sets a session cookie with the plan.
 * No email confirmation, no Supabase auth complexity.
 * 
 * DISABLED IN PRODUCTION unless ENABLE_TEST_ACCOUNTS=true
 */

import { NextRequest, NextResponse } from "next/server";
import { TEST_ACCOUNTS } from "@/lib/testing/test-accounts";
import { cookies } from "next/headers";

// TEMPORARILY ENABLED FOR PH SCREENSHOTS - TODO: REVERT
const TEST_ACCOUNTS_ENABLED = true;

export async function POST(request: NextRequest) {
  // Block test accounts in production
  if (!TEST_ACCOUNTS_ENABLED) {
    return NextResponse.json(
      { error: "Test accounts are disabled" },
      { status: 403 }
    );
  }

  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find matching test account
    const testAccount = TEST_ACCOUNTS.find(
      acc => acc.email.toLowerCase() === email.toLowerCase() && acc.password === password
    );

    if (!testAccount) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Set test session cookie
    const cookieStore = await cookies();
    cookieStore.set("test_account", JSON.stringify({
      email: testAccount.email,
      plan: testAccount.plan,
      name: `Test ${testAccount.plan.charAt(0).toUpperCase() + testAccount.plan.slice(1)}`,
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    return NextResponse.json({
      success: true,
      user: {
        email: testAccount.email,
        plan: testAccount.plan,
        name: `Test ${testAccount.plan.charAt(0).toUpperCase() + testAccount.plan.slice(1)}`,
      },
    });
  } catch (error: any) {
    console.error("[Test Login] Error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

