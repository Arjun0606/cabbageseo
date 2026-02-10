/**
 * /api/geo/momentum - Momentum Score
 *
 * GET: Calculate and return the momentum score for a site.
 * Query params:
 *   - siteId: Required site ID
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/api/get-user";
import { calculateMomentum } from "@/lib/geo/momentum";
import { canAccessProduct } from "@/lib/billing/citation-plans";
import type { SupabaseClient } from "@supabase/supabase-js";

function getDbClient(): SupabaseClient | null {
  try {
    return createServiceClient();
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Auth check
    const currentUser = await getUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = currentUser.organizationId;

    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 },
      );
    }

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId");

    if (!siteId) {
      return NextResponse.json(
        { error: "siteId required" },
        { status: 400 },
      );
    }

    const db = getDbClient();
    if (!db) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 },
      );
    }

    // Subscription check for free users
    if (currentUser.plan === "free") {
      const access = canAccessProduct("free", null, currentUser.email);
      if (!access.allowed) {
        return NextResponse.json({ error: access.reason, code: "SUBSCRIPTION_REQUIRED" }, { status: 403 });
      }
    }

    // Verify site belongs to user's organization
    const { data: site } = await db
      .from("sites")
      .select("id, organization_id")
      .eq("id", siteId)
      .maybeSingle();

    if (!site || site.organization_id !== organizationId) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    // Calculate momentum
    const momentum = await calculateMomentum(siteId, db);

    return NextResponse.json({
      success: true,
      data: momentum,
    });
  } catch (error) {
    console.error("[/api/geo/momentum GET] Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
