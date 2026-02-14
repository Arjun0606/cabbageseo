/**
 * GET /api/geo/history?siteId=X&days=90
 *
 * Returns historical visibility snapshots (queries won/lost) for trend charting.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/api/get-user";
import { getCitationPlanLimits } from "@/lib/billing/citation-plans";
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

    // Enforce plan-based history retention limits
    const planLimits = getCitationPlanLimits(currentUser.plan || "free");
    const maxDays = planLimits.historyDays;
    const requestedDays = parseInt(request.nextUrl.searchParams.get("days") || "90", 10);
    const days = Math.min(maxDays, Math.max(1, requestedDays));

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

    // Enforce history retention: only show data within plan's window
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const { data: snapshots } = await db
      .from("market_share_snapshots")
      .select(
        "queries_won, queries_lost, total_queries, market_share, snapshot_date",
      )
      .eq("site_id", siteId)
      .gte("snapshot_date", cutoffDate.toISOString().split("T")[0])
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
            market_share: number | null;
            snapshot_date: string;
          }>) || []
        ).map((s) => ({
          date: s.snapshot_date,
          queriesWon: s.queries_won || 0,
          queriesLost: s.queries_lost || 0,
          totalQueries: s.total_queries || 0,
          marketShare: s.market_share || 0,
        })),
      },
    });
  } catch (error) {
    console.error("[/api/geo/history] Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
