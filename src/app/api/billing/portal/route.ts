/**
 * Billing Portal API
 * Creates a session to the customer billing portal
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { payments } from "@/lib/billing/payments";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get user's organization
    const { data: profileData } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    const profile = profileData as { organization_id: string } | null;
    if (!profile?.organization_id) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    // Get organization's customer ID
    const { data: orgData } = await supabase
      .from("organizations")
      .select("stripe_customer_id")
      .eq("id", profile.organization_id)
      .single();

    const org = orgData as { stripe_customer_id: string | null } | null;
    if (!org?.stripe_customer_id) {
      return NextResponse.json({ error: "No billing account found" }, { status: 400 });
    }

    const origin = request.headers.get("origin") || "http://localhost:3000";

    const session = await payments.createBillingPortalSession(
      org.stripe_customer_id,
      `${origin}/settings/billing`
    );

    return NextResponse.json({ portalUrl: session.portalUrl });
  } catch (error) {
    console.error("Portal session error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create portal session" },
      { status: 500 }
    );
  }
}

