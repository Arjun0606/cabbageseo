/**
 * Checkout Status API — Fallback for when webhook is delayed
 *
 * Checks the current organization's plan status.
 * If the plan has updated (webhook fired), returns activated: true.
 * This is a safety net for webhook delays, not a replacement.
 *
 * GET /api/billing/checkout-status?session_id=xxx
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Not configured" }, { status: 503 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use service client to bypass RLS for org lookup
    const serviceClient = createServiceClient();

    const { data: userData } = await serviceClient
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .maybeSingle();

    const orgId = (userData as { organization_id?: string } | null)?.organization_id;
    if (!orgId) {
      return NextResponse.json({ activated: false, plan: "free" });
    }

    const { data: org } = await serviceClient
      .from("organizations")
      .select("plan, subscription_status")
      .eq("id", orgId)
      .maybeSingle();

    const orgData = org as { plan?: string; subscription_status?: string } | null;
    if (!orgData) {
      return NextResponse.json({ activated: false, plan: "free" });
    }

    const activated = orgData.plan !== "free" && orgData.subscription_status === "active";

    return NextResponse.json({
      activated,
      plan: orgData.plan,
      status: orgData.subscription_status,
    });
  } catch (error) {
    console.error("[Checkout Status] Error:", error);
    return NextResponse.json({ error: "Failed to check status" }, { status: 500 });
  }
}
