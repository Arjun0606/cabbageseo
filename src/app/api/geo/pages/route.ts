/**
 * GET /api/geo/pages?siteId=X
 *
 * List all generated pages for a site.
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

    const organizationId = currentUser.organizationId;
    if (!organizationId) {
      return NextResponse.json({ error: "No organization" }, { status: 400 });
    }

    const db = getDbClient();
    if (!db) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const siteId = request.nextUrl.searchParams.get("siteId");
    if (!siteId) {
      return NextResponse.json({ error: "siteId is required" }, { status: 400 });
    }

    // Verify site ownership
    const { data: site } = await db
      .from("sites")
      .select("id")
      .eq("id", siteId)
      .eq("organization_id", organizationId)
      .single();

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    // Fetch pages
    const { data: pages, error } = await db
      .from("generated_pages")
      .select("id, site_id, query, title, meta_description, word_count, ai_model, status, created_at, updated_at, last_refreshed_at, refresh_count")
      .eq("site_id", siteId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[/api/geo/pages GET] Error:", error);
      return NextResponse.json({ error: "Failed to fetch pages" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        pages: (pages || []).map((row: {
          id: string;
          site_id: string;
          query: string;
          title: string;
          meta_description: string | null;
          word_count: number | null;
          ai_model: string | null;
          status: string;
          created_at: string;
          updated_at: string;
          last_refreshed_at: string | null;
          refresh_count: number;
        }) => ({
          id: row.id,
          siteId: row.site_id,
          query: row.query,
          title: row.title,
          metaDescription: row.meta_description,
          wordCount: row.word_count,
          aiModel: row.ai_model,
          status: row.status,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          lastRefreshedAt: row.last_refreshed_at,
          refreshCount: row.refresh_count,
        })),
      },
    });
  } catch (error) {
    console.error("[/api/geo/pages GET] Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
