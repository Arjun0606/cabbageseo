/**
 * POST /api/geo/audit
 *
 * Run a Site GEO Audit: analyzes the site's pages for AI-citability.
 * Uses the real site-analyzer engine (fetches HTML, parses structure, scores).
 *
 * Body: { siteId: string }
 * Returns: SiteAnalysis with score breakdown, tips, and opportunities.
 *
 * GET /api/geo/audit?siteId=X
 *
 * Returns the most recent audit for a site (from geo_analyses table).
 */

// Allow up to 120s for site audit (crawl + GPT-5.2 analysis)
export const maxDuration = 120;

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/api/get-user";
import { analyzeSite } from "@/lib/geo/site-analyzer";
import { canRunSiteAudit, getCitationPlan } from "@/lib/billing/citation-plans";
import type { SupabaseClient } from "@supabase/supabase-js";

function getDbClient(): SupabaseClient | null {
  try {
    return createServiceClient();
  } catch {
    return null;
  }
}

// GET: Fetch most recent audit for a site
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

    // Verify site ownership
    const { data: site } = await db
      .from("sites")
      .select("id, domain")
      .eq("id", siteId)
      .eq("organization_id", currentUser.organizationId)
      .maybeSingle();

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    // Fetch most recent site audit (not citation checks).
    // Audits have score.grade; citation checks don't.
    const { data: audits } = await db
      .from("geo_analyses")
      .select("id, score, tips, queries, opportunities, raw_data, created_at")
      .eq("site_id", siteId)
      .order("created_at", { ascending: false })
      .limit(10);

    // Filter to records that have audit-shaped score (with grade + breakdown)
    const audit = (audits || []).find(
      (a: { score: Record<string, unknown> }) =>
        a.score && typeof a.score === "object" && "grade" in a.score && "breakdown" in a.score
    ) || null;

    if (!audit) {
      return NextResponse.json({
        success: true,
        data: { audit: null, hasAudit: false },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        audit: {
          id: audit.id,
          score: audit.score,
          tips: audit.tips,
          queries: audit.queries,
          opportunities: audit.opportunities,
          rawData: audit.raw_data,
          createdAt: audit.created_at,
        },
        hasAudit: true,
      },
    });
  } catch (error) {
    console.error("[/api/geo/audit GET] Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST: Run a new site audit
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const siteId = body.siteId;
    if (!siteId) {
      return NextResponse.json({ error: "siteId required" }, { status: 400 });
    }

    const db = getDbClient();
    if (!db) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    // Verify site ownership and get domain
    const { data: site } = await db
      .from("sites")
      .select("id, domain, organization_id")
      .eq("id", siteId)
      .eq("organization_id", currentUser.organizationId)
      .maybeSingle();

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    // Check plan gating
    const { data: org } = await db
      .from("organizations")
      .select("plan")
      .eq("id", currentUser.organizationId)
      .maybeSingle();

    const plan = org?.plan || "free";

    // Count actual audits this month (not citation checks).
    // Audits have score.grade; citation checks don't.
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: monthRecords } = await db
      .from("geo_analyses")
      .select("score")
      .eq("site_id", siteId)
      .gte("created_at", startOfMonth.toISOString());

    const usedThisMonth = (monthRecords || []).filter(
      (r: { score: Record<string, unknown> }) =>
        r.score && typeof r.score === "object" && "grade" in r.score && "breakdown" in r.score
    ).length;
    const gating = canRunSiteAudit(plan, usedThisMonth);

    if (!gating.allowed) {
      return NextResponse.json(
        { error: gating.reason, upgradeRequired: true },
        { status: 403 }
      );
    }

    // Run the actual site analysis
    const analysis = await analyzeSite(site.domain);

    // Save to database
    const { data: savedAudit, error: saveError } = await db
      .from("geo_analyses")
      .insert({
        site_id: siteId,
        organization_id: currentUser.organizationId,
        score: analysis.score,
        tips: analysis.tips,
        queries: analysis.queries,
        opportunities: analysis.opportunities,
        raw_data: analysis.rawData,
      })
      .select("id, created_at")
      .single();

    if (saveError) {
      console.error("[/api/geo/audit POST] Save error:", saveError);
      // Still return the analysis even if save fails
      return NextResponse.json({
        success: true,
        data: {
          audit: {
            id: null,
            score: analysis.score,
            tips: analysis.tips,
            queries: analysis.queries,
            opportunities: analysis.opportunities,
            rawData: analysis.rawData,
            createdAt: new Date().toISOString(),
          },
          saved: false,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        audit: {
          id: savedAudit.id,
          score: analysis.score,
          tips: analysis.tips,
          queries: analysis.queries,
          opportunities: analysis.opportunities,
          rawData: analysis.rawData,
          createdAt: savedAudit.created_at,
        },
        saved: true,
        remaining: gating.remaining === -1 ? "unlimited" : (gating.remaining! - 1),
      },
    });
  } catch (error) {
    console.error("[/api/geo/audit POST] Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
