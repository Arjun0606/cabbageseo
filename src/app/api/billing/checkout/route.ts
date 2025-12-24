/**
 * Checkout API - Create checkout sessions for subscriptions
 * 
 * Uses Dodo Payments to create checkout sessions for plan upgrades
 * 
 * POST /api/billing/checkout
 * {
 *   "planId": "pro" | "pro_plus",
 *   "interval": "monthly" | "yearly"
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { dodo } from "@/lib/billing/dodo-client";
import { PLANS, type PlanId } from "@/lib/billing/plans";

// Dodo Product IDs (configured in Dodo Dashboard)
const PRODUCT_IDS: Record<string, Record<string, string>> = {
  starter: {
    monthly: process.env.DODO_STARTER_MONTHLY_ID || "prod_starter_monthly",
    yearly: process.env.DODO_STARTER_YEARLY_ID || "prod_starter_yearly",
  },
  pro: {
    monthly: process.env.DODO_PRO_MONTHLY_ID || "prod_pro_monthly",
    yearly: process.env.DODO_PRO_YEARLY_ID || "prod_pro_yearly",
  },
  pro_plus: {
    monthly: process.env.DODO_PRO_PLUS_MONTHLY_ID || "prod_pro_plus_monthly",
    yearly: process.env.DODO_PRO_PLUS_YEARLY_ID || "prod_pro_plus_yearly",
  },
};

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

  // Use service client for database operations (bypasses RLS)
  const serviceClient = createServiceClient();

  try {
    const body = await request.json();
    const { planId, interval = "monthly" } = body as { planId: string; interval?: string };

    // Validate plan
    const validPlanIds: PlanId[] = ["starter", "pro", "pro_plus"];
    if (!validPlanIds.includes(planId as PlanId) || !PLANS[planId as PlanId]) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }
    const typedPlanId = planId as PlanId;

    if (interval !== "monthly" && interval !== "yearly") {
      return NextResponse.json({ error: "Invalid interval" }, { status: 400 });
    }

    // Get user's organization
    const { data: userData } = await serviceClient
      .from("users")
      .select("organization_id, email, name")
      .eq("id", user.id)
      .single();

    const profile = userData as { organization_id?: string; email?: string; name?: string } | null;
    if (!profile?.organization_id) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    // Get organization
    const { data: orgData } = await serviceClient
      .from("organizations")
      .select("id, name, stripe_customer_id, plan")
      .eq("id", profile.organization_id)
      .single();

    const org = orgData as { id: string; name: string; stripe_customer_id?: string; plan?: string } | null;
    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Check if already on this plan
    if (org.plan === planId) {
      return NextResponse.json({ error: "Already on this plan" }, { status: 400 });
    }

    // Get or create Dodo customer
    let customerId = org.stripe_customer_id;
    
    if (!customerId) {
      // Create customer in Dodo
      const customer = await dodo.createCustomer({
        email: profile.email || user.email || "",
        name: profile.name || org.name,
        metadata: {
          organization_id: org.id,
        },
      });
      
      customerId = customer.id;

      // Save customer ID
      await serviceClient
        .from("organizations")
        .update({ stripe_customer_id: customerId } as never)
        .eq("id", org.id);
    }

    // Get product ID for the plan
    const productId = PRODUCT_IDS[planId]?.[interval];
    if (!productId) {
      return NextResponse.json({ error: "Product not configured" }, { status: 500 });
    }

    // Get URLs
    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "";
    const successUrl = `${origin}/settings/billing?success=true&plan=${planId}`;
    const cancelUrl = `${origin}/settings/billing?canceled=true`;

    // Create checkout session
    const session = await dodo.createCheckoutSession({
      customer_id: customerId,
      product_id: productId,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        organization_id: org.id,
        plan_id: planId,
        interval,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        checkoutUrl: session.url,
        sessionId: session.id,
      },
    });

  } catch (error) {
    console.error("[Checkout API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create checkout" },
      { status: 500 }
    );
  }
}
