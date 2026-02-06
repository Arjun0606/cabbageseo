/**
 * /api/geo/next-action - Next Action Engine
 *
 * GET: Determine the single most impactful next action for a site.
 * Query params:
 *   - siteId: Required site ID
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/api/get-user";
import { getTestSession } from "@/lib/testing/test-session";
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
    // Check for bypass user first
    const bypassUser = await getUser();
    const testSession = await getTestSession();

    if (bypassUser?.isTestAccount && bypassUser.id.startsWith("bypass-")) {
      // Return mock next action in bypass mode
      return NextResponse.json({
        success: true,
        data: {
          id: "get_listed_g2",
          title: "Get listed on G2",
          description:
            "G2 is the #1 software review site that AI platforms trust.",
          priority: "critical",
          estimatedMinutes: 120,
          actionUrl: "https://www.g2.com/products/new",
          category: "source",
        },
        bypassMode: true,
      });
    }

    let organizationId: string | null = null;

    if (testSession) {
      // Test session - look up organization from database
      const db = getDbClient();
      if (db) {
        const testOrgSlug = `test-${testSession.email.split("@")[0]}`;
        const { data: testOrgData } = await db
          .from("organizations")
          .select("id")
          .eq("slug", testOrgSlug)
          .maybeSingle();
        organizationId = testOrgData?.id || null;
      }
    } else {
      const supabase = await createClient();
      if (!supabase) {
        return NextResponse.json({ error: "Not configured" }, { status: 500 });
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Get organization from user
      const db = getDbClient() || supabase;
      const { data: userData } = await db
        .from("users")
        .select("organization_id")
        .eq("id", user.id)
        .maybeSingle();
      organizationId = userData?.organization_id || null;
    }

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
