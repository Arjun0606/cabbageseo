/**
 * GET /api/geo/pages/[id] — Get a single generated page
 * DELETE /api/geo/pages/[id] — Delete a generated page
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Fetch the page
    const { data: page, error } = await db
      .from("generated_pages")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    // Verify ownership through site → organization
    const { data: site } = await db
      .from("sites")
      .select("id")
      .eq("id", page.site_id)
      .eq("organization_id", organizationId)
      .single();

    if (!site) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        page: {
          id: page.id,
          siteId: page.site_id,
          query: page.query,
          title: page.title,
          metaDescription: page.meta_description,
          body: page.body,
          schemaMarkup: page.schema_markup,
          targetEntities: page.target_entities || [],
          competitorsAnalyzed: page.competitors_analyzed || [],
          wordCount: page.word_count,
          aiModel: page.ai_model,
          status: page.status,
          createdAt: page.created_at,
          updatedAt: page.updated_at,
        },
      },
    });
  } catch (error) {
    console.error("[/api/geo/pages/[id] GET] Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Fetch the page to verify ownership
    const { data: page } = await db
      .from("generated_pages")
      .select("id, site_id")
      .eq("id", id)
      .single();

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    // Verify ownership
    const { data: site } = await db
      .from("sites")
      .select("id")
      .eq("id", page.site_id)
      .eq("organization_id", organizationId)
      .single();

    if (!site) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    // Delete the page
    const { error: deleteError } = await db
      .from("generated_pages")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("[/api/geo/pages/[id] DELETE] Error:", deleteError);
      return NextResponse.json({ error: "Failed to delete page" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[/api/geo/pages/[id] DELETE] Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
