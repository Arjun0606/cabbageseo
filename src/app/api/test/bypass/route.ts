/**
 * TESTING BYPASS - Creates a temporary test session
 * 
 * This endpoint creates a test session cookie when given the correct secret.
 * Use this to test the dashboard without needing real authentication.
 * 
 * IMPORTANT: Remove this file or disable after testing!
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// Secret key to enable bypass (change this for security)
const BYPASS_SECRET = "cabbage-test-2026-bypass";

export async function POST(request: NextRequest) {
  try {
    const { secret, plan = "pro" } = await request.json();

    if (secret !== BYPASS_SECRET) {
      return NextResponse.json(
        { error: "Invalid secret" },
        { status: 401 }
      );
    }

    // Validate plan
    const validPlans = ["free", "scout", "command", "dominate"];
    const selectedPlan = validPlans.includes(plan) ? plan : "pro";

    // Create test session data
    const testSession = {
      email: `test-${selectedPlan}@bypass.test`,
      name: `Test ${selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)} User`,
      plan: selectedPlan,
      organizationId: `test-org-${selectedPlan}`,
      bypassMode: true,
      createdAt: new Date().toISOString(),
    };

    // Set the test session cookie
    const cookieStore = await cookies();
    cookieStore.set("test_bypass_session", JSON.stringify(testSession), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    return NextResponse.json({
      success: true,
      message: `Test bypass enabled for ${selectedPlan} plan`,
      session: testSession,
    });
  } catch (error) {
    console.error("[Test bypass] Error:", error);
    return NextResponse.json(
      { error: "Failed to create test session" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    // Clear the test session cookie
    const cookieStore = await cookies();
    cookieStore.delete("test_bypass_session");

    return NextResponse.json({
      success: true,
      message: "Test bypass disabled",
    });
  } catch (error) {
    console.error("[Test bypass] Error:", error);
    return NextResponse.json(
      { error: "Failed to clear test session" },
      { status: 500 }
    );
  }
}
