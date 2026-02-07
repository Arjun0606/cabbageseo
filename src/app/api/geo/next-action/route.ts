/**
 * /api/geo/next-action - Next Action Engine
 *
 * GET: Determine the single most impactful next action for a site.
 * Query params:
 *   - siteId: Required site ID
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/api/get-user";
import { getNextAction } from "@/lib/geo/next-action";
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

    // Verify site belongs to user's organization
    const { data: site } = await db
      .from("sites")
      .select("id, organization_id")
      .eq("id", siteId)
      .maybeSingle();

    if (!site || site.organization_id !== organizationId) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    // Get next action
    const action = await getNextAction(siteId, db);

    return NextResponse.json({
      success: true,
      data: action,
    });
  } catch (error) {
    console.error("[/api/geo/next-action GET] Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
