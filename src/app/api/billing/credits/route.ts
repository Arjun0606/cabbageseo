/**
 * Credits Purchase API - Buy prepaid credits
 * 
 * POST /api/billing/credits
 * {
 *   "packageId": "small" | "medium" | "large"
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { dodo } from "@/lib/billing/dodo-client";
import { CREDIT_PACKAGES } from "@/lib/billing/plans";

// Credit package product IDs (configured in Dodo Dashboard)
const CREDIT_PRODUCT_IDS: Record<string, string> = {
  small: process.env.DODO_CREDITS_SMALL_ID || "prod_credits_small",
  medium: process.env.DODO_CREDITS_MEDIUM_ID || "prod_credits_medium",
  large: process.env.DODO_CREDITS_LARGE_ID || "prod_credits_large",
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

  try {
    const body = await request.json();
    const { packageId } = body;

    // Validate package
    const creditPackage = CREDIT_PACKAGES.find(p => p.id === packageId);
    if (!creditPackage) {
      return NextResponse.json({ error: "Invalid package" }, { status: 400 });
    }

    // Get user's organization
    const { data: userData } = await supabase
      .from("users")
      .select("organization_id, email, name")
      .eq("id", user.id)
      .single();

    const profile = userData as { organization_id?: string; email?: string; name?: string } | null;
    if (!profile?.organization_id) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    // Get organization
    const { data: orgData } = await supabase
      .from("organizations")
      .select("id, name, stripe_customer_id")
      .eq("id", profile.organization_id)
      .single();

    const org = orgData as { id: string; name: string; stripe_customer_id?: string } | null;
    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Get or create Dodo customer
    let customerId = org.stripe_customer_id;
    
    if (!customerId) {
      const customer = await dodo.createCustomer({
        email: profile.email || user.email || "",
        name: profile.name || org.name,
        metadata: {
          organization_id: org.id,
        },
      });
      
      customerId = customer.id;

      await supabase
        .from("organizations")
        .update({ stripe_customer_id: customerId } as never)
        .eq("id", org.id);
    }

    // Get product ID
    const productId = CREDIT_PRODUCT_IDS[packageId];
    if (!productId) {
      return NextResponse.json({ error: "Product not configured" }, { status: 500 });
    }

    // Get URLs
    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "";
    const successUrl = `${origin}/settings/billing?credits=purchased&amount=${creditPackage.credits}`;
    const cancelUrl = `${origin}/settings/billing?credits=canceled`;

    // Create checkout session for one-time payment
    const session = await dodo.createCheckoutSession({
      customer_id: customerId,
      product_id: productId,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        organization_id: org.id,
        type: "credit_purchase",
        credits: String(creditPackage.credits),
        bonus: String(creditPackage.bonus),
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
    console.error("[Credits API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create credits checkout" },
      { status: 500 }
    );
  }
}

// GET - Get current credit balance
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

    // Get credit balance
    const { data: balanceData } = await supabase
      .from("credit_balance")
      .select("prepaid_credits, bonus_credits, expires_at")
      .eq("organization_id", profile.organization_id)
      .single();

    const balance = balanceData as { prepaid_credits?: number; bonus_credits?: number; expires_at?: string } | null;

    return NextResponse.json({
      success: true,
      data: {
        prepaidCredits: balance?.prepaid_credits || 0,
        bonusCredits: balance?.bonus_credits || 0,
        totalCredits: (balance?.prepaid_credits || 0) + (balance?.bonus_credits || 0),
        expiresAt: balance?.expires_at,
      },
    });

  } catch (error) {
    console.error("[Credits GET] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get credit balance" },
      { status: 500 }
    );
  }
}

