/**
 * GET /api/geo/improvement?siteId=X
 *
 * Returns first vs latest market_share_snapshots for before/after comparison.
 * Only returns real counted data: queries won, queries lost, total queries.
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
    if (!siteId) {
      return NextResponse.json({ error: "siteId required" }, { status: 400 });
    }

    const db = getDbClient();
    if (!db) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    // Fetch first, latest, and count in parallel
    const [firstResult, latestResult, countResult] = await Promise.all([
      db
        .from("market_share_snapshots")
        .select("queries_won, queries_lost, total_queries, snapshot_date")
        .eq("site_id", siteId)
        .order("snapshot_date", { ascending: true })
        .limit(1)
        .maybeSingle(),
      db
        .from("market_share_snapshots")
        .select("queries_won, queries_lost, total_queries, snapshot_date")
        .eq("site_id", siteId)
        .order("snapshot_date", { ascending: false })
        .limit(1)
        .maybeSingle(),
      db
        .from("market_share_snapshots")
        .select("id", { count: "exact", head: true })
        .eq("site_id", siteId),
    ]);

    const checksCount = countResult.count || 0;

    if (checksCount === 0 || !firstResult.data) {
      return NextResponse.json({
        success: true,
        data: { firstCheck: null, latestCheck: null, checksCount: 0 },
      });
    }

    const formatSnapshot = (row: {
      queries_won: number | null;
      queries_lost: number | null;
      total_queries: number | null;
      snapshot_date: string;
    }) => ({
      date: row.snapshot_date,
      queriesWon: row.queries_won || 0,
      queriesLost: row.queries_lost || 0,
      totalQueries: row.total_queries || 0,
    });

    return NextResponse.json({
      success: true,
      data: {
        firstCheck: formatSnapshot(firstResult.data),
        latestCheck: latestResult.data ? formatSnapshot(latestResult.data) : null,
        checksCount,
      },
    });
  } catch (error) {
    console.error("[/api/geo/improvement] Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
