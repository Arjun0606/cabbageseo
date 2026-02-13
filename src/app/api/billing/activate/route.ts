/**
 * Plan Activation Fallback
 *
 * Called during post-checkout polling when the webhook hasn't fired yet.
 * Checks the subscription status directly with Dodo and activates the plan
 * in the database if the subscription is active.
 *
 * POST /api/billing/activate
 * { "subscriptionId": "sub_..." }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { DodoPayments } from "dodopayments";
import { authLimiter } from "@/lib/api/rate-limit";

// Product ID → plan mapping (same as webhook handler)
function getPlanFromProductId(productId: string | undefined): string | null {
  if (!productId) return null;

  const mappings: [string | undefined, string][] = [
    [process.env.DODO_SCOUT_MONTHLY_ID, "scout"],
    [process.env.DODO_SCOUT_YEARLY_ID, "scout"],
    [process.env.DODO_COMMAND_MONTHLY_ID, "command"],
    [process.env.DODO_COMMAND_YEARLY_ID, "command"],
    [process.env.DODO_DOMINATE_MONTHLY_ID, "dominate"],
    [process.env.DODO_DOMINATE_YEARLY_ID, "dominate"],
  ];

  for (const [envVar, plan] of mappings) {
    if (envVar && envVar === productId) return plan;
  }

  return null;
}

function getIntervalFromProductId(productId: string | undefined): string {
  if (!productId) return "monthly";
  const yearlyProducts = [
    process.env.DODO_SCOUT_YEARLY_ID,
    process.env.DODO_COMMAND_YEARLY_ID,
    process.env.DODO_DOMINATE_YEARLY_ID,
  ].filter(Boolean);
  return yearlyProducts.includes(productId) ? "yearly" : "monthly";
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: 10 attempts per minute
  const rateLimit = await authLimiter.check(user.id);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let serviceClient;
  try {
    serviceClient = createServiceClient();
  } catch {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { subscriptionId } = body as { subscriptionId?: string };

    if (!subscriptionId) {
      return NextResponse.json({ error: "Missing subscriptionId" }, { status: 400 });
    }

    // Get user's organization
    const { data: userData } = await serviceClient
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .maybeSingle();

    const organizationId = (userData as { organization_id?: string } | null)
      ?.organization_id;
    if (!organizationId) {
      return NextResponse.json({ error: "No organization" }, { status: 404 });
    }

    // Check if already activated
    const { data: orgData } = await serviceClient
      .from("organizations")
      .select("plan, subscription_status, dodo_subscription_id")
      .eq("id", organizationId)
      .maybeSingle();

    const org = orgData as {
      plan?: string;
      subscription_status?: string;
      dodo_subscription_id?: string;
    } | null;

    if (org?.plan && org.plan !== "free" && org.subscription_status === "active") {
      // Already activated
      return NextResponse.json({ activated: true, plan: org.plan });
    }

    // Check with Dodo
    const apiKey = process.env.DODO_PAYMENTS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Payments not configured" }, { status: 503 });
    }

    const isProduction = process.env.NODE_ENV === "production";
    const dodo = new DodoPayments({
      bearerToken: apiKey,
      environment: isProduction ? "live_mode" : "test_mode",
    });

    const sub = await dodo.subscriptions.retrieve(subscriptionId);

    if (!sub || sub.status !== "active") {
      return NextResponse.json({
        activated: false,
        status: sub?.status || "unknown",
      });
    }

    // Subscription is active — resolve plan
    let plan = getPlanFromProductId(sub.product_id);

    // Fallback: check metadata
    if (!plan) {
      const metadataPlan = (sub.metadata as Record<string, string> | undefined)
        ?.plan_id;
      if (
        metadataPlan &&
        ["scout", "command", "dominate"].includes(metadataPlan)
      ) {
        plan = metadataPlan;
      }
    }

    if (!plan) {
      console.error(
        "[Activate] Cannot resolve plan for product:",
        sub.product_id
      );
      return NextResponse.json(
        { error: "Cannot resolve plan" },
        { status: 500 }
      );
    }

    const interval = getIntervalFromProductId(sub.product_id);

    // Activate the plan
    const { error } = await serviceClient
      .from("organizations")
      .update({
        plan,
        billing_interval: interval,
        subscription_status: "active",
        cancel_at_period_end: false,
        dodo_subscription_id: subscriptionId,
        dodo_product_id: sub.product_id,
        current_period_start: sub.previous_billing_date,
        current_period_end: sub.next_billing_date,
        sites_created_this_period: 0, // Reset swap counter for new billing period
      } as never)
      .eq("id", organizationId);

    if (error) {
      console.error("[Activate] Failed to update org:", error);
      return NextResponse.json(
        { error: "Failed to activate" },
        { status: 500 }
      );
    }

    console.log(
      `[Activate] Activated org ${organizationId} on ${plan} plan (fallback)`
    );

    return NextResponse.json({ activated: true, plan });
  } catch (error) {
    console.error("[Activate] Error:", error);
    return NextResponse.json(
      { error: "Failed to check subscription" },
      { status: 500 }
    );
  }
}
