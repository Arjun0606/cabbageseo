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
    { envVar: process.env.DODO_STARTER_MONTHLY_ID, plan: "starter" },
    { envVar: process.env.DODO_STARTER_YEARLY_ID, plan: "starter" },
    { envVar: process.env.DODO_PRO_MONTHLY_ID, plan: "pro" },
    { envVar: process.env.DODO_PRO_YEARLY_ID, plan: "pro" },
    { envVar: process.env.DODO_PRO_PLUS_MONTHLY_ID, plan: "pro_plus" },
    { envVar: process.env.DODO_PRO_PLUS_YEARLY_ID, plan: "pro_plus" },
  ];
  
  for (const { envVar, plan } of envMappings) {
    if (envVar) {
      mappings[envVar] = plan;
    }
  }
  
  return mappings;
}

// Get plan ID from product ID
function getPlanFromProductId(productId: string | undefined): string {
  if (!productId) {
    console.warn("[Webhook] No product ID provided, defaulting to 'starter'");
    return "starter";
  }
  
  const productMappings = buildProductMappings();
  const plan = productMappings[productId];
  
  if (!plan) {
    console.warn(`[Webhook] Unknown product ID: ${productId}, defaulting to 'starter'`);
    return "starter";
  }
  
  return plan;
}

// Get billing interval from product ID
function getIntervalFromProductId(productId: string | undefined): string {
  if (!productId) return "monthly";
  
  const yearlyProducts = [
    process.env.DODO_STARTER_YEARLY_ID,
    process.env.DODO_PRO_YEARLY_ID,
    process.env.DODO_PRO_PLUS_YEARLY_ID,
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
    
    // Use SDK's unwrap method for verification if webhook key is configured
    // Otherwise use unsafeUnwrap for development
    let event;
    const webhookKey = process.env.DODO_PAYMENTS_WEBHOOK_KEY || process.env.DODO_WEBHOOK_SECRET;
    
    if (webhookKey) {
      try {
        event = dodo.webhooks.unwrap(rawBody, { headers });
      } catch (error) {
        console.error("[Webhook] Signature verification failed:", error);
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    } else {
      // Development mode - skip verification
      console.warn("[Webhook] No webhook key configured, skipping verification");
      event = dodo.webhooks.unsafeUnwrap(rawBody);
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
        
        const plan = getPlanFromProductId(subscriptionData.product_id);
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
            dodo_subscription_id: subscriptionData.subscription_id,
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

      case "subscription.cancelled":
      case "subscription.expired": {
        if (data.payload_type !== "Subscription") break;
        
        const subscriptionData = data;
        const organizationId = subscriptionData.metadata?.organization_id;
        
        if (!organizationId) break;
        
        const { error } = await supabase
          .from("organizations")
          .update({
            subscription_status: "canceled",
            current_period_end: new Date().toISOString(),
          } as never)
          .eq("id", organizationId);

        if (error) {
          console.error("[Webhook] Failed to update org:", error);
          throw error;
        }

        console.log(`[Webhook] Cancelled subscription for org ${organizationId}`);
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
        // Could send an email notification here
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
