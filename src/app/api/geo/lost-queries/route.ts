/**
 * GET /api/geo/lost-queries?siteId=X
 *
 * Returns the most recent lost queries for a site from geo_analyses.
 * Used by the dashboard to persist "Queries You're Losing" across page refreshes.
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

    // Get the most recent geo_analyses entry for this site
    const { data: analysis } = await db
      .from("geo_analyses")
      .select("queries, score, created_at")
      .eq("site_id", siteId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const row = analysis as {
      queries: unknown;
      score: unknown;
      created_at: string;
    } | null;

    if (!row || !row.queries) {
      return NextResponse.json({
        success: true,
        data: { lostQueries: [], score: null, analyzedAt: null },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        lostQueries: row.queries,
        score: row.score,
        analyzedAt: row.created_at,
      },
    });
  } catch (error) {
    console.error("[/api/geo/lost-queries] Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
