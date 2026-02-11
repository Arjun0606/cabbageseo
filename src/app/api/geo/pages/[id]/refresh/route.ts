/**
 * POST /api/geo/pages/[id]/refresh
 *
 * Manually refresh a published fix page with fresh AI-generated content.
 * Updates the existing row in-place (same URL/ID).
 * Does NOT count against pagesPerMonth limit.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/api/get-user";
import { getCitationPlanFeatures } from "@/lib/billing/citation-plans";
import { generatePage } from "@/lib/geo/page-generator";
import type { SupabaseClient } from "@supabase/supabase-js";

function getDbClient(): SupabaseClient | null {
  try {
    return createServiceClient();
  } catch {
    return null;
  }
}

export async function POST(
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
    const { data: page, error: pageError } = await db
      .from("generated_pages")
      .select("id, site_id, query, status, refresh_count")
      .eq("id", id)
      .single();

    if (pageError || !page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    // Verify ownership through site → organization
    const { data: site } = await db
      .from("sites")
      .select("id, organization_id")
      .eq("id", page.site_id)
      .eq("organization_id", organizationId)
      .single();

    if (!site) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    // Only published pages can be refreshed
    if (page.status !== "published") {
      return NextResponse.json(
        { error: "Only published pages can be refreshed" },
        { status: 400 }
      );
    }

    // Verify plan has page generation
    const { data: org } = await db
      .from("organizations")
      .select("plan")
      .eq("id", organizationId)
      .single();

    const plan = org?.plan || "free";
    const features = getCitationPlanFeatures(plan);

    if (!features.pageGeneration) {
      return NextResponse.json(
        { error: "Page generation requires a paid plan." },
        { status: 403 }
      );
    }

    // Generate fresh content
    const result = await generatePage(page.site_id, page.query, organizationId);

    // Update existing row in-place
    const now = new Date().toISOString();
    const { error: updateError } = await db
      .from("generated_pages")
      .update({
        title: result.title,
        meta_description: result.metaDescription,
        body: result.body,
        schema_markup: result.schemaMarkup,
        target_entities: result.targetEntities,
        word_count: result.wordCount,
        updated_at: now,
        last_refreshed_at: now,
        refresh_count: (page.refresh_count || 0) + 1,
      })
      .eq("id", id);

    if (updateError) {
      console.error("[/api/geo/pages/[id]/refresh] Update error:", updateError);
      return NextResponse.json({ error: "Failed to update page" }, { status: 500 });
    }

    // Fetch updated page to return
    const { data: updated } = await db
      .from("generated_pages")
      .select("*")
      .eq("id", id)
      .single();

    return NextResponse.json({
      success: true,
      data: {
        page: updated ? {
          id: updated.id,
          siteId: updated.site_id,
          query: updated.query,
          title: updated.title,
          metaDescription: updated.meta_description,
          body: updated.body,
          schemaMarkup: updated.schema_markup,
          targetEntities: updated.target_entities || [],
          wordCount: updated.word_count,
          aiModel: updated.ai_model,
          status: updated.status,
          createdAt: updated.created_at,
          updatedAt: updated.updated_at,
          lastRefreshedAt: updated.last_refreshed_at,
          refreshCount: updated.refresh_count,
        } : null,
      },
    });
  } catch (error) {
    console.error("[/api/geo/pages/[id]/refresh] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to refresh page" },
      { status: 500 }
    );
  }
}
