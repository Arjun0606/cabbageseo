/**
 * Checkout API - Create checkout sessions for subscriptions
 * 
 * Uses Dodo Payments official SDK to create checkout sessions for plan upgrades
 * https://docs.dodopayments.com/
 * 
 * POST /api/billing/checkout
 * {
 *   "planId": "scout" | "command" | "dominate",
 *   "interval": "monthly" | "yearly"
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { DodoPayments } from "dodopayments";
import { PLANS, type PlanId } from "@/lib/billing/plans";

// Dodo Product IDs (configured in Dodo Dashboard)
const PRODUCT_IDS: Record<string, Record<string, string | undefined>> = {
  scout: {
    monthly: process.env.DODO_SCOUT_MONTHLY_ID,
    yearly: process.env.DODO_SCOUT_YEARLY_ID,
  },
  command: {
    monthly: process.env.DODO_COMMAND_MONTHLY_ID,
    yearly: process.env.DODO_COMMAND_YEARLY_ID,
  },
  dominate: {
    monthly: process.env.DODO_DOMINATE_MONTHLY_ID,
    yearly: process.env.DODO_DOMINATE_YEARLY_ID,
  },
};

// Helper to get product ID with clear error messaging
function getProductId(planId: string, interval: string): string | null {
  const productId = PRODUCT_IDS[planId]?.[interval];
  if (!productId) {
    const envVarName = `DODO_${planId.toUpperCase()}_${interval.toUpperCase()}_ID`;
    console.error(`[Checkout] Missing product ID. Set ${envVarName} in your environment variables.`);
    return null;
  }
  return productId;
}

// Initialize Dodo client - it reads DODO_PAYMENTS_API_KEY from env
function getDodoClient() {
  const apiKey = process.env.DODO_PAYMENTS_API_KEY;
  if (!apiKey) {
    throw new Error("DODO_PAYMENTS_API_KEY is not configured");
  }
  
  // Use test_mode for development, live_mode for production
  const isProduction = process.env.NODE_ENV === "production";
  
  return new DodoPayments({
    bearerToken: apiKey,
    environment: isProduction ? "live_mode" : "test_mode",
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  // Check if Dodo is configured
  if (!process.env.DODO_PAYMENTS_API_KEY) {
    console.error("[Checkout] DODO_PAYMENTS_API_KEY is not configured");
    return NextResponse.json({ error: "Payments not configured" }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Use service client for database operations (bypasses RLS)
  let serviceClient;
  try {
    serviceClient = createServiceClient();
  } catch (e) {
    console.error("[Checkout] Failed to create service client:", e);
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { planId, interval = "monthly" } = body as { planId: string; interval?: string };

    // Validate plan
    const validPlanIds: PlanId[] = ["scout", "command", "dominate"];
    if (!validPlanIds.includes(planId as PlanId) || !PLANS[planId as PlanId]) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }
    const typedPlanId = planId as PlanId;

    if (interval !== "monthly" && interval !== "yearly") {
      return NextResponse.json({ error: "Invalid interval" }, { status: 400 });
    }

    // Get user's organization
    let { data: userData } = await serviceClient
      .from("users")
      .select("organization_id, email, name")
      .eq("id", user.id)
      .single();

    let profile = userData as { organization_id?: string; email?: string; name?: string } | null;
    let organizationId = profile?.organization_id;

    // If user or organization doesn't exist, create them
    if (!profile || !organizationId) {
      console.log("[Checkout] Creating user and org for:", user.email);
      
      // Create organization first (plan defaults to 'free' in DB)
      const { data: newOrg, error: orgError } = await serviceClient
        .from("organizations")
        .insert({
          name: `${user.email?.split("@")[0] || "My"}'s Organization`,
          slug: `org-${user.id.slice(0, 8)}-${Date.now()}`,
          subscription_status: "inactive",
        } as never)
        .select("id")
        .single();

      if (orgError || !newOrg) {
        console.error("[Checkout] Failed to create org:", orgError);
        return NextResponse.json({ error: "Failed to create organization" }, { status: 500 });
      }

      organizationId = (newOrg as { id: string }).id;

      // Create or update user profile
      await serviceClient
        .from("users")
        .upsert({
          id: user.id,
          organization_id: organizationId,
          email: user.email,
          name: user.user_metadata?.full_name || user.email?.split("@")[0],
        } as never);

      // Refresh profile
      profile = { organization_id: organizationId, email: user.email || undefined, name: user.user_metadata?.full_name };
    }

    // Get organization
    const { data: orgData } = await serviceClient
      .from("organizations")
      .select("id, name, dodo_customer_id, plan, subscription_status, dodo_subscription_id")
      .eq("id", organizationId)
      .single();

    const org = orgData as { 
      id: string; 
      name: string; 
      dodo_customer_id?: string; 
      plan?: string;
      subscription_status?: string;
      dodo_subscription_id?: string;
    } | null;
    
    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Only block if they have an ACTIVE paid subscription on the same plan
    const hasActiveSubscription = org.dodo_subscription_id && 
      org.subscription_status === "active";
    
    if (hasActiveSubscription && org.plan === planId) {
      return NextResponse.json({ error: "Already on this plan" }, { status: 400 });
    }

    // Get product ID for the plan with clear error if missing
    const productId = getProductId(planId, interval);
    if (!productId) {
      const envVarName = `DODO_${planId.toUpperCase()}_${interval.toUpperCase()}_ID`;
      return NextResponse.json({ 
        error: `Product not configured. Please set ${envVarName} environment variable in your deployment settings.` 
      }, { status: 500 });
    }

    // Get URLs
    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "";
    const returnUrl = `${origin}/settings/billing?session_id={CHECKOUT_SESSION_ID}`;

    // Initialize Dodo client
    const dodo = getDodoClient();

    // Create checkout session using official SDK
    // Dodo uses product_cart for the checkout
    const session = await dodo.checkoutSessions.create({
      product_cart: [
        {
      product_id: productId,
          quantity: 1,
        },
      ],
      // Customer info - Dodo will create or find customer by email
      customer: {
        email: profile?.email || user.email || "",
        name: profile?.name || org.name,
      },
      // Return URL after payment (success or failure)
      return_url: returnUrl,
      // Metadata to identify the organization after payment
      metadata: {
        organization_id: org.id,
        plan_id: planId,
        interval,
        user_id: user.id,
      },
      // Dark theme to match the app
      customization: {
        theme: "dark",
      },
    });

    console.log("[Checkout] Created session:", session.session_id);

    // Return both formats for backward compatibility
    return NextResponse.json({
      success: true,
      url: session.checkout_url, // Primary format for frontend
      data: {
        checkoutUrl: session.checkout_url,
        sessionId: session.session_id,
      },
    });

  } catch (error) {
    console.error("[Checkout API] Error:", error);
    
    // Provide more specific error messages
    let errorMessage = "Failed to create checkout";
    if (error instanceof Error) {
      errorMessage = error.message;
      // Check for common issues
      if (errorMessage.includes("DODO_PAYMENTS_API_KEY")) {
        errorMessage = "Payments API key not configured";
      } else if (errorMessage.includes("product")) {
        errorMessage = "Product not found in Dodo dashboard. Please create the product first.";
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
