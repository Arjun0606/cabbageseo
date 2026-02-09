/**
 * GET /api/geo/history?siteId=X&days=90
 *
 * Returns historical visibility snapshots (queries won/lost) for trend charting.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/api/get-user";
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
    const currentUser = await getUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const siteId = request.nextUrl.searchParams.get("siteId");
    const days = Math.min(
      365,
      Math.max(1, parseInt(request.nextUrl.searchParams.get("days") || "90", 10)),
    );

    if (!siteId) {
      return NextResponse.json({ error: "siteId required" }, { status: 400 });
    }

    const db = getDbClient();
    if (!db) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 },
      );
    }

    // Verify site belongs to user's organization
    const { data: siteData } = await db
      .from("sites")
      .select("id")
      .eq("id", siteId)
      .eq("organization_id", currentUser.organizationId)
      .maybeSingle();

    if (!siteData) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    // Fetch snapshots ordered by date ascending for charting
    const { data: snapshots } = await db
      .from("market_share_snapshots")
      .select(
        "queries_won, queries_lost, total_queries, snapshot_date",
      )
      .eq("site_id", siteId)
      .order("snapshot_date", { ascending: true })
      .limit(days);

    return NextResponse.json({
      success: true,
      data: {
        snapshots: (
          (snapshots as Array<{
            queries_won: number | null;
            queries_lost: number | null;
            total_queries: number | null;
            snapshot_date: string;
          }>) || []
        ).map((s) => ({
          date: s.snapshot_date,
          queriesWon: s.queries_won || 0,
          queriesLost: s.queries_lost || 0,
          totalQueries: s.total_queries || 0,
        })),
      },
    });
  } catch (error) {
    console.error("[/api/geo/history] Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
