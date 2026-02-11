/**
 * POST /api/geo/pages/auto-generate
 *
 * Internal endpoint: auto-generates fix pages for lost queries after a citation check.
 * Called fire-and-forget from the check API — not exposed to frontend.
 *
 * Auth: Service role key only (internal calls).
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getCitationPlan, canGeneratePage } from "@/lib/billing/citation-plans";
import { generatePage } from "@/lib/geo/page-generator";
import { timingSafeEqual } from "crypto";

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export async function POST(request: NextRequest) {
  try {
    // Verify internal auth (service role key) with timing-safe comparison
    const authHeader = request.headers.get("Authorization");
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey || serviceKey.length < 32) {
      console.error("[auto-generate] CRITICAL: Invalid or missing SUPABASE_SERVICE_ROLE_KEY");
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }
    if (!authHeader || !safeCompare(authHeader, `Bearer ${serviceKey}`)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { siteId, organizationId, lostQueries } = await request.json() as {
      siteId: string;
      organizationId: string;
      lostQueries: Array<{ query: string; competitors: string[]; platform: string }>;
    };

    if (!siteId || !organizationId || !lostQueries?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const db = createServiceClient();

    // Get org plan
    const { data: org } = await db
      .from("organizations")
      .select("plan")
      .eq("id", organizationId)
      .maybeSingle();
    const planId = (org as { plan?: string } | null)?.plan || "free";
    const citationPlan = getCitationPlan(planId);

    // Free users can't generate pages
    if (planId === "free") {
      return NextResponse.json({ skipped: true, reason: "free_plan" });
    }

    // Check current usage
    const currentMonth = new Date().toISOString().slice(0, 7);
    const { data: usage } = await db
      .from("usage")
      .select("pages_generated")
      .eq("organization_id", organizationId)
      .eq("period", currentMonth)
      .maybeSingle();
    let pagesUsed = (usage as Record<string, number> | null)?.pages_generated || 0;

    // Get existing pages for this site (avoid duplicates)
    const { data: existingPages } = await db
      .from("generated_pages")
      .select("query")
      .eq("site_id", siteId);
    const existingQueries = new Set(
      (existingPages || []).map((p: { query: string }) => p.query.toLowerCase())
    );

    // Filter to queries that don't already have pages
    const newQueries = lostQueries.filter(
      (lq) => !existingQueries.has(lq.query.toLowerCase())
    );

    const generated: string[] = [];

    for (const lq of newQueries.slice(0, 3)) {
      // Check plan limit before each generation
      const canUse = canGeneratePage(citationPlan.id, pagesUsed);
      if (!canUse.allowed) break;

      try {
        const result = await generatePage(siteId, lq.query, organizationId);

        const { error: insertError } = await db.from("generated_pages").insert({
          site_id: siteId,
          query: lq.query,
          title: result.title,
          meta_description: result.metaDescription,
          body: result.body,
          schema_markup: result.schemaMarkup,
          target_entities: result.targetEntities,
          word_count: result.wordCount,
          ai_model: "gpt-5.2",
          status: "draft",
        } as never);

        if (insertError) {
          console.error(`[auto-generate] Insert failed for "${lq.query}":`, insertError);
          continue;
        }

        // Increment usage only after successful insert
        await incrementUsage(db, organizationId, currentMonth);
        pagesUsed++;
        generated.push(lq.query);
      } catch (err) {
        console.error(`[auto-generate] Failed for query "${lq.query}":`, err);
        // Continue with next query
      }
    }

    console.log(`[auto-generate] Generated ${generated.length} pages for site ${siteId}`);
    return NextResponse.json({ success: true, generated });
  } catch (error) {
    console.error("[auto-generate] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
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
