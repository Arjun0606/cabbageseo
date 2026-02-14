/**
 * /api/geo/citations/export - CSV Export
 *
 * GET: Returns citation data as downloadable CSV.
 * Query params:
 *   - siteId: Required site ID
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/api/get-user";
import {
  getCitationPlanFeatures,
  getCitationPlanLimits,
} from "@/lib/billing/citation-plans";
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

    const orgId = currentUser.organizationId;
    if (!orgId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const plan = currentUser.plan || "free";
    const features = getCitationPlanFeatures(plan);

    if (!features.csvExport) {
      return NextResponse.json(
        { error: "CSV export requires Command plan or higher." },
        { status: 403 },
      );
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
      .select("id, organization_id, domain")
      .eq("id", siteId)
      .maybeSingle();

    if (!site || site.organization_id !== orgId) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    // Enforce history retention limit
    const limits = getCitationPlanLimits(plan);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - limits.historyDays);

    // Fetch citations within retention window
    const { data: citations } = await db
      .from("citations")
      .select("platform, query, snippet, confidence, source_domain, cited_at")
      .eq("site_id", siteId)
      .gte("cited_at", cutoffDate.toISOString())
      .order("cited_at", { ascending: false });

    if (!citations || citations.length === 0) {
      // Return empty CSV with headers
      const headers = "Platform,Query,Confidence,Source,Date,Snippet\n";
      return new NextResponse(headers, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${site.domain}-citations.csv"`,
        },
      });
    }

    // Build CSV
    const csvRows = [
      "Platform,Query,Confidence,Source,Date,Snippet",
      ...citations.map((c) => {
        const escapeCsv = (val: string | null | undefined) => {
          if (!val) return "";
          // Escape quotes and wrap in quotes if contains comma, quote, or newline
          const escaped = val.replace(/"/g, '""');
          return `"${escaped}"`;
        };

        return [
          escapeCsv(c.platform),
          escapeCsv(c.query),
          c.confidence || "",
          escapeCsv(c.source_domain),
          c.cited_at ? new Date(c.cited_at).toISOString().split("T")[0] : "",
          escapeCsv(c.snippet?.slice(0, 200)),
        ].join(",");
      }),
    ];

    const csv = csvRows.join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${site.domain}-citations.csv"`,
      },
    });
  } catch (error) {
    console.error("[/api/geo/citations/export GET] Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
