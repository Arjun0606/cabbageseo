/**
 * POST /api/geo/pages/generate
 *
 * Generate a support page for a specific query.
 * Uses citation data and gap analysis
 * to produce comparison pages, explainers, and FAQs that reinforce authority.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/api/get-user";
import { getCitationPlan, canGeneratePage, canAccessProduct } from "@/lib/billing/citation-plans";
import { generatePage } from "@/lib/geo/page-generator";
import { pageGenerationLimiter } from "@/lib/api/rate-limit";
import type { SupabaseClient } from "@supabase/supabase-js";

function getDbClient(): SupabaseClient | null {
  try {
    return createServiceClient();
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const currentUser = await getUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit: 5 page generations per minute per user
    const rateLimit = await pageGenerationLimiter.check(currentUser.id);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment." },
        { status: 429 },
      );
    }

    const organizationId = currentUser.organizationId;
    if (!organizationId) {
      return NextResponse.json({ error: "No organization" }, { status: 400 });
    }

    const db = getDbClient();
    if (!db) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    // Get org plan
    const { data: org } = await db
      .from("organizations")
      .select("plan")
      .eq("id", organizationId)
      .single();
    const planId = org?.plan || "free";
    const citationPlan = getCitationPlan(planId);

    // Subscription check for free users
    if (planId === "free") {
      const access = canAccessProduct("free", currentUser.email);
      if (!access.allowed) {
        return NextResponse.json({ error: access.reason, code: "SUBSCRIPTION_REQUIRED", upgradeRequired: true }, { status: 403 });
      }
    }

    // Parse request
    const body = await request.json();
    const { siteId, query } = body as { siteId: string; query: string };

    if (!siteId || !query) {
      return NextResponse.json({ error: "siteId and query are required" }, { status: 400 });
    }

    // Verify site ownership
    const { data: site } = await db
      .from("sites")
      .select("id, domain")
      .eq("id", siteId)
      .eq("organization_id", organizationId)
      .single();

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    // Check plan limits
    const currentMonth = new Date().toISOString().slice(0, 7);
    const { data: usage } = await db
      .from("usage")
      .select("pages_generated")
      .eq("organization_id", organizationId)
      .eq("period", currentMonth)
      .maybeSingle();

    const pagesUsed = (usage as Record<string, number> | null)?.pages_generated || 0;
    const canUse = canGeneratePage(citationPlan.id, pagesUsed);

    if (!canUse.allowed) {
      return NextResponse.json({
        error: canUse.reason,
        upgradeRequired: true,
        feature: "pageGeneration",
      }, { status: 403 });
    }

    // Increment usage FIRST to prevent race condition (two concurrent requests
    // both passing the limit check before either increments)
    await incrementUsage(db, organizationId, currentMonth);

    let result;
    let savedPage;
    try {
      // Generate the page
      const startTime = Date.now();
      result = await generatePage(siteId, query, organizationId);
      const durationMs = Date.now() - startTime;

      // Save to database
      const { data: pageData, error: saveError } = await db
        .from("generated_pages")
        .insert({
          site_id: siteId,
          query,
          title: result.title,
          meta_description: result.metaDescription,
          body: result.body,
          schema_markup: result.schemaMarkup,
          target_entities: result.targetEntities,
          word_count: result.wordCount,
          ai_model: "gpt-5.2",
          status: "draft",
        })
        .select("*")
        .single();

      if (saveError) {
        console.error("[Pages Generate] Save error:", saveError);
        // Roll back usage increment on failure
        await decrementUsage(db, organizationId, currentMonth);
        return NextResponse.json({ error: "Failed to save generated page" }, { status: 500 });
      }

      savedPage = pageData;

      return NextResponse.json({
        success: true,
        data: {
          page: formatPage(savedPage),
          generationTimeMs: durationMs,
          remaining: canUse.remaining === -1 ? "unlimited" : (canUse.remaining || 0) - 1,
        },
      });
    } catch (genError) {
      // Roll back usage increment if generation or save failed
      await decrementUsage(db, organizationId, currentMonth).catch(() => {});
      throw genError;
    }
  } catch (error) {
    console.error("[/api/geo/pages/generate POST] Error:", error);
    return NextResponse.json({
      error: "Failed to generate page",
      details: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function incrementUsage(client: any, organizationId: string, period: string) {
  const { data: existing } = await client
    .from("usage")
    .select("id, pages_generated")
    .eq("organization_id", organizationId)
    .eq("period", period)
    .maybeSingle();

  if (existing) {
    const current = (existing as Record<string, number>).pages_generated || 0;
    await client
      .from("usage")
      .update({ pages_generated: current + 1, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
  } else {
    await client
      .from("usage")
      .insert({
        organization_id: organizationId,
        period,
        pages_generated: 1,
        checks_used: 0,
        sites_used: 0,
      });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function decrementUsage(client: any, organizationId: string, period: string) {
  const { data: existing } = await client
    .from("usage")
    .select("id, pages_generated")
    .eq("organization_id", organizationId)
    .eq("period", period)
    .maybeSingle();

  if (existing) {
    const current = (existing as Record<string, number>).pages_generated || 0;
    if (current > 0) {
      await client
        .from("usage")
        .update({ pages_generated: current - 1, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatPage(row: any) {
  return {
    id: row.id,
    siteId: row.site_id,
    query: row.query,
    title: row.title,
    metaDescription: row.meta_description,
    body: row.body,
    schemaMarkup: row.schema_markup,
    targetEntities: row.target_entities || [],
    wordCount: row.word_count,
    aiModel: row.ai_model,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
