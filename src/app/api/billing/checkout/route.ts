/**
 * Checkout API
 * Creates checkout sessions for subscriptions and credit purchases
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { payments } from "@/lib/billing/payments";
import { PLANS, CREDIT_PACKAGES } from "@/lib/billing/plans";

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
    const body = await request.json();
    const { type, planId, billingInterval, packageIndex } = body;

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

    // Get or create payment customer
    const { data: orgData } = await supabase
      .from("organizations")
      .select("id, name, stripe_customer_id")
      .eq("id", profile.organization_id)
      .single();

    const org = orgData as { id: string; name: string; stripe_customer_id: string | null } | null;
    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 });
    }

    let customerId = org.stripe_customer_id;

    if (!customerId) {
      // Create customer
      const customer = await payments.createCustomer({
        email: user.email!,
        name: org.name,
        organizationId: org.id,
      });

      customerId = customer.id;

      // Save customer ID
      await supabase
        .from("organizations")
        .update({ stripe_customer_id: customerId } as never)
        .eq("id", org.id);
    }

    const origin = request.headers.get("origin") || "http://localhost:3000";

    // Handle subscription checkout
    if (type === "subscription") {
      if (!planId || !PLANS[planId]) {
        return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
      }

      const session = await payments.createCheckoutSession({
        customerId,
        planId,
        billingInterval: billingInterval || "monthly",
        successUrl: `${origin}/settings/billing?success=true`,
        cancelUrl: `${origin}/settings/billing?canceled=true`,
      });

      return NextResponse.json({ checkoutUrl: session.checkoutUrl });
    }

    // Handle credit purchase
    if (type === "credits") {
      if (packageIndex === undefined || !CREDIT_PACKAGES[packageIndex]) {
        return NextResponse.json({ error: "Invalid package" }, { status: 400 });
      }

      const session = await payments.createCreditCheckoutSession({
        customerId,
        packageIndex,
        successUrl: `${origin}/settings/billing?credits=success`,
        cancelUrl: `${origin}/settings/billing?credits=canceled`,
      });

      return NextResponse.json({ checkoutUrl: session.checkoutUrl });
    }

    return NextResponse.json({ error: "Invalid checkout type" }, { status: 400 });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Checkout failed" },
      { status: 500 }
    );
  }
}

