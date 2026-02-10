/**
 * Dodo Payments Webhook Handler
 * 
 * Handles subscription events from Dodo Payments
 * Uses the official dodopayments SDK for webhook verification
 * 
 * POST /api/billing/webhooks
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { DodoPayments } from "dodopayments";

// Initialize Dodo client for webhook unwrapping
function getDodoClient() {
  const apiKey = process.env.DODO_PAYMENTS_API_KEY;
  const webhookKey = process.env.DODO_PAYMENTS_WEBHOOK_KEY || process.env.DODO_WEBHOOK_SECRET;
  
  if (!apiKey) {
    throw new Error("DODO_PAYMENTS_API_KEY is not configured");
  }

  const isProduction = process.env.NODE_ENV === "production";
  
  return new DodoPayments({
    bearerToken: apiKey,
    webhookKey: webhookKey || null,
    environment: isProduction ? "live_mode" : "test_mode",
  });
}

// Build product ID to plan mapping dynamically (only include configured products)
function buildProductMappings(): Record<string, string> {
  const mappings: Record<string, string> = {};
  
  const envMappings = [
    { envVar: process.env.DODO_SCOUT_MONTHLY_ID, plan: "scout" },
    { envVar: process.env.DODO_SCOUT_YEARLY_ID, plan: "scout" },
    { envVar: process.env.DODO_COMMAND_MONTHLY_ID, plan: "command" },
    { envVar: process.env.DODO_COMMAND_YEARLY_ID, plan: "command" },
    { envVar: process.env.DODO_DOMINATE_MONTHLY_ID, plan: "dominate" },
    { envVar: process.env.DODO_DOMINATE_YEARLY_ID, plan: "dominate" },
  ];
  
  for (const { envVar, plan } of envMappings) {
    if (envVar) {
      mappings[envVar] = plan;
    }
  }
  
  return mappings;
}

// Get plan ID from product ID — NEVER default to "free" on unknown IDs
function getPlanFromProductId(productId: string | undefined): string {
  if (!productId) {
    throw new Error("[Webhook] No product ID provided in subscription data");
  }

  const productMappings = buildProductMappings();
  const plan = productMappings[productId];

  if (!plan) {
    // Check metadata fallback before failing
    throw new Error(`[Webhook] Unknown product ID: ${productId}. Check DODO_*_ID env vars match your Dodo dashboard.`);
  }

  return plan;
}

// Get billing interval from product ID
function getIntervalFromProductId(productId: string | undefined): string {
  if (!productId) return "monthly";
  
  const yearlyProducts = [
    process.env.DODO_SCOUT_YEARLY_ID,
    process.env.DODO_COMMAND_YEARLY_ID,
    process.env.DODO_DOMINATE_YEARLY_ID,
  ].filter(Boolean); // Remove undefined values
  
  return yearlyProducts.includes(productId) ? "yearly" : "monthly";
}

export async function POST(request: NextRequest) {
  let supabase;
  try {
    supabase = createServiceClient();
  } catch (e) {
    console.error("[Webhook] Failed to create service client:", e);
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    
    // Get all headers as a record for webhook verification
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    const dodo = getDodoClient();
    
    let event;
    const webhookKey = process.env.DODO_PAYMENTS_WEBHOOK_KEY || process.env.DODO_WEBHOOK_SECRET;
    const isLocalDev = !process.env.VERCEL_ENV && process.env.NODE_ENV !== "production";

    if (webhookKey) {
      try {
        event = dodo.webhooks.unwrap(rawBody, { headers });
      } catch (error) {
        console.error("[Webhook] Signature verification failed:", error);
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    } else if (isLocalDev) {
      console.warn("[Webhook] Local dev: skipping signature verification");
      event = dodo.webhooks.unsafeUnwrap(rawBody);
    } else {
      console.error("[Webhook] CRITICAL: No webhook key configured. Set DODO_PAYMENTS_WEBHOOK_KEY.");
      return NextResponse.json({ error: "Webhook key not configured" }, { status: 500 });
    }

    const { type, data, business_id, timestamp } = event;
    
    console.log(`[Webhook] Received event: ${type}`, { business_id, timestamp });

    // Handle different event types
    switch (type) {
      case "subscription.active":
      case "subscription.renewed":
      case "subscription.plan_changed": {
        // These events have subscription data
        if (data.payload_type !== "Subscription") break;
        
        const subscriptionData = data;
        const metadata = subscriptionData.metadata;
        const organizationId = metadata?.organization_id;
        
        if (!organizationId) {
          console.error("[Webhook] No organization_id in metadata");
          return NextResponse.json({ error: "Missing organization_id" }, { status: 400 });
        }
        
        // Resolve plan from product ID, fall back to metadata if product mapping fails
        let plan: string;
        try {
          plan = getPlanFromProductId(subscriptionData.product_id);
        } catch (e) {
          // Fallback: use plan_id from checkout metadata (we set this in checkout route)
          const metadataPlan = metadata?.plan_id;
          if (metadataPlan && ["scout", "command", "dominate"].includes(metadataPlan)) {
            console.warn(`[Webhook] Using metadata plan_id fallback: ${metadataPlan}`);
            plan = metadataPlan;
          } else {
            console.error("[Webhook] Cannot resolve plan:", e);
            throw e;
          }
        }
        const interval = getIntervalFromProductId(subscriptionData.product_id);
        
        // Safely access customer_id with optional chaining
        const customerId = subscriptionData.customer?.customer_id;
        if (!customerId) {
          console.warn("[Webhook] No customer_id in subscription data");
        }
        
        const { error } = await supabase
          .from("organizations")
          .update({
            plan,
            billing_interval: interval,
            subscription_status: "active",
            cancel_at_period_end: false,
            dodo_subscription_id: subscriptionData.subscription_id,
            dodo_product_id: subscriptionData.product_id,
            current_period_start: subscriptionData.previous_billing_date,
            current_period_end: subscriptionData.next_billing_date,
            ...(customerId && { dodo_customer_id: customerId }),
          } as never)
          .eq("id", organizationId);

        if (error) {
          console.error("[Webhook] Failed to update org:", error);
          throw error;
        }

        console.log(`[Webhook] Updated org ${organizationId} to ${plan} plan`);
        break;
      }

      case "subscription.on_hold":
      case "subscription.failed": {
        if (data.payload_type !== "Subscription") break;
        
        const subscriptionData = data;
        const organizationId = subscriptionData.metadata?.organization_id;
        
        if (!organizationId) break;
        
        const status = type === "subscription.on_hold" ? "paused" : "past_due";
        
        const { error } = await supabase
          .from("organizations")
          .update({
            subscription_status: status,
          } as never)
          .eq("id", organizationId);

        if (error) {
          console.error("[Webhook] Failed to update org status:", error);
          throw error;
        }

        console.log(`[Webhook] Updated org ${organizationId} status to ${status}`);
        break;
      }

      case "subscription.cancelled": {
        if (data.payload_type !== "Subscription") break;

        const cancelledData = data;
        const cancelledOrgId = cancelledData.metadata?.organization_id;

        if (!cancelledOrgId) break;

        // Keep current plan until period ends — just mark as canceling
        const { error: cancelError } = await supabase
          .from("organizations")
          .update({
            cancel_at_period_end: true,
            subscription_status: "canceled",
          } as never)
          .eq("id", cancelledOrgId);

        if (cancelError) {
          console.error("[Webhook] Failed to update org:", cancelError);
          throw cancelError;
        }

        console.log(`[Webhook] Marked subscription as canceled for org ${cancelledOrgId} (access until period end)`);
        break;
      }

      case "subscription.expired": {
        if (data.payload_type !== "Subscription") break;

        const expiredData = data;
        const expiredOrgId = expiredData.metadata?.organization_id;

        if (!expiredOrgId) break;

        // Subscription actually ended — downgrade to free
        const { error: expireError } = await supabase
          .from("organizations")
          .update({
            plan: "free",
            subscription_status: "canceled",
            cancel_at_period_end: false,
            current_period_end: new Date().toISOString(),
          } as never)
          .eq("id", expiredOrgId);

        if (expireError) {
          console.error("[Webhook] Failed to expire org:", expireError);
          throw expireError;
        }

        console.log(`[Webhook] Expired subscription for org ${expiredOrgId} — downgraded to free`);
        break;
      }

      case "payment.succeeded": {
        if (data.payload_type !== "Payment") break;
        console.log(`[Webhook] Payment succeeded:`, data.payment_id);
        break;
      }

      case "payment.failed": {
        if (data.payload_type !== "Payment") break;
        console.log(`[Webhook] Payment failed:`, data.payment_id);

        // Mark org as past_due via subscription_id lookup
        const failedSubId = data.subscription_id;
        if (failedSubId) {
          const { error: failError } = await supabase
            .from("organizations")
            .update({ subscription_status: "past_due" } as never)
            .eq("dodo_subscription_id", failedSubId);

          if (failError) {
            console.error("[Webhook] Failed to mark org past_due:", failError);
          } else {
            console.log(`[Webhook] Marked org as past_due for subscription ${failedSubId}`);
          }
        }
        break;
      }

      case "payment.processing":
      case "payment.cancelled": {
        if (data.payload_type !== "Payment") break;
        console.log(`[Webhook] Payment ${type}:`, data.payment_id);
        break;
      }

      case "refund.succeeded":
      case "refund.failed": {
        if (data.payload_type !== "Refund") break;
        console.log(`[Webhook] Refund ${type}:`, data.refund_id);
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Webhook] Error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
