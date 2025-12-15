/**
 * Customer Portal API - Redirect to Dodo billing portal
 * 
 * POST /api/billing/portal
 * Returns a URL to the Dodo customer portal for managing subscriptions
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { dodo } from "@/lib/billing/dodo-client";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  if (!dodo.isConfigured()) {
    return NextResponse.json({ error: "Payments not configured" }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get user's organization
    const { data: userData } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    const profile = userData as { organization_id?: string } | null;
    if (!profile?.organization_id) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    // Get organization with customer ID
    const { data: orgData } = await supabase
      .from("organizations")
      .select("stripe_customer_id")
      .eq("id", profile.organization_id)
      .single();

    const org = orgData as { stripe_customer_id?: string } | null;
    if (!org?.stripe_customer_id) {
      return NextResponse.json({ error: "No billing account found" }, { status: 400 });
    }

    // Get return URL
    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "";
    const returnUrl = `${origin}/settings/billing`;

    // Create portal session (Dodo provides a customer portal URL)
    // Note: Dodo's exact API may differ - this is based on common patterns
    const portalUrl = `https://checkout.dodopayments.com/portal?customer=${org.stripe_customer_id}&return_url=${encodeURIComponent(returnUrl)}`;

    return NextResponse.json({
      success: true,
      data: {
        portalUrl,
      },
    });

  } catch (error) {
    console.error("[Portal API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create portal session" },
      { status: 500 }
    );
  }
}

// GET - Returns current billing status and quick info
export async function GET() {
  const supabase = await createClient();
  
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get user's organization
    const { data: userData } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    const profile = userData as { organization_id?: string } | null;
    if (!profile?.organization_id) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    // Get organization billing info
    const { data: orgResult } = await supabase
      .from("organizations")
      .select(`
        plan,
        billing_interval,
        subscription_status,
        trial_ends_at,
        current_period_start,
        current_period_end,
        cancel_at_period_end,
        stripe_customer_id,
        overage_settings
      `)
      .eq("id", profile.organization_id)
      .single();

    const orgData = orgResult as {
      plan?: string;
      billing_interval?: string;
      subscription_status?: string;
      trial_ends_at?: string;
      current_period_start?: string;
      current_period_end?: string;
      cancel_at_period_end?: boolean;
      stripe_customer_id?: string;
      overage_settings?: Record<string, unknown>;
    } | null;

    if (!orgData) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        plan: orgData.plan,
        interval: orgData.billing_interval,
        status: orgData.subscription_status,
        trialEndsAt: orgData.trial_ends_at,
        currentPeriodStart: orgData.current_period_start,
        currentPeriodEnd: orgData.current_period_end,
        cancelAtPeriodEnd: orgData.cancel_at_period_end,
        hasPaymentMethod: !!orgData.stripe_customer_id,
        overageSettings: orgData.overage_settings,
      },
    });

  } catch (error) {
    console.error("[Portal API GET] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get billing info" },
      { status: 500 }
    );
  }
}
