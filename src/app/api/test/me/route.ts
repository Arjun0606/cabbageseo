/**
 * TEST ME - Always returns a test Pro user
 * TEMPORARY: Remove after testing!
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Get plan from query param (default to pro)
  const plan = request.nextUrl.searchParams.get("plan") || "pro";
  
  return NextResponse.json({
    authenticated: true,
    testMode: true,
    user: {
      id: `test-bypass-${plan}`,
      email: `test-${plan}@bypass.test`,
      name: `Test ${plan.charAt(0).toUpperCase() + plan.slice(1)} User`,
    },
    organization: {
      id: `test-org-bypass-${plan}`,
      plan: plan,
      status: "active",
      createdAt: new Date().toISOString(),
    },
    sites: [],
    currentSite: null,
  });
}
