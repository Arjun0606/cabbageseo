/**
 * /api/geo/competitors - Competitor Intelligence
 *
 * GET: Returns competitors auto-discovered from citation checks.
 * Query params:
 *   - siteId: Required site ID
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

    const organizationId = currentUser.organizationId;
    if (!organizationId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId");

    if (!siteId) {
      return NextResponse.json({ error: "siteId required" }, { status: 400 });
    }

    const db = getDbClient();
    if (!db) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    // Verify site belongs to user's org
    const { data: site } = await db
      .from("sites")
      .select("id, organization_id, domain, total_citations")
      .eq("id", siteId)
      .maybeSingle();

    if (!site || site.organization_id !== organizationId) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    // Get plan limits to cap visible competitors
    const limits = getCitationPlanLimits(currentUser.plan || "free");

    // Fetch competitors sorted by total citations (descending)
    const { data: competitors } = await db
      .from("competitors")
      .select("id, domain, name, total_citations, citations_this_week, citations_change, last_checked_at")
      .eq("site_id", siteId)
      .order("total_citations", { ascending: false })
      .limit(limits.competitors > 0 ? limits.competitors : 3); // Free sees top 3 (blurred)

    return NextResponse.json({
      success: true,
      data: {
        competitors: competitors || [],
        yourDomain: site.domain,
        yourCitations: site.total_citations || 0,
        competitorLimit: limits.competitors,
      },
    });
  } catch (error) {
    console.error("[/api/geo/competitors GET] Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
