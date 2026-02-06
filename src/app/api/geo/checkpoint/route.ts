/**
 * /api/geo/checkpoint - Monthly Checkpoint
 *
 * GET: Returns the latest monthly checkpoint for a site.
 * Query params:
 *   - siteId: Required site UUID
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireSubscription } from "@/lib/api/require-subscription";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Not configured" }, { status: 500 });
    }

    // Require authenticated & subscribed user
    const sub = await requireSubscription(supabase);
    if (!sub.authorized || sub.error) {
      return sub.error ?? NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId");

    if (!siteId) {
      return NextResponse.json({ error: "siteId required" }, { status: 400 });
    }

    // Verify the site belongs to this organization
    const { data: siteRaw } = await supabase
      .from("sites")
      .select("id, organization_id")
      .eq("id", siteId)
      .maybeSingle();

    const site = siteRaw as { id: string; organization_id: string } | null;

    if (!site || site.organization_id !== sub.organizationId) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    // Get latest checkpoint for this site
    const { data: checkpoint, error } = await supabase
      .from("monthly_checkpoints")
      .select("*")
      .eq("site_id", siteId)
      .order("period", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[/api/geo/checkpoint GET] DB error:", error);
      return NextResponse.json({ error: "Failed to fetch checkpoint" }, { status: 500 });
    }

    return NextResponse.json({ data: checkpoint || null });
  } catch (error) {
    console.error("[/api/geo/checkpoint GET] Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
