/**
 * Dodo Payments Webhook Handler
 * 
 * Handles subscription events from Dodo Payments
 * 
 * POST /api/billing/webhooks
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import crypto from "crypto";

// Disable body parsing - we need the raw body for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

// Webhook event types from Dodo
type DodoEventType =
  | "subscription.active"
  | "subscription.on_hold"
  | "subscription.paused"
  | "subscription.renewed"
  | "subscription.plan_changed"
  | "subscription.cancelled"
  | "subscription.failed"
  | "subscription.expired"
  | "payment.succeeded"
  | "payment.failed"
  | "payment.refunded";

interface DodoWebhookEvent {
  type: DodoEventType;
  data: {
    payload: {
      subscription_id?: string;
      customer_id?: string;
      product_id?: string;
      status?: string;
      next_billing_date?: string;
      current_period_start?: string;
      current_period_end?: string;
      metadata?: Record<string, string>;
      payment_id?: string;
      amount?: number;
      currency?: string;
    };
    business_id: string;
    created_at: string;
  };
}

// Verify webhook signature
function verifySignature(payload: string, signature: string, secret: string): boolean {
  if (!secret) return true; // Skip verification if no secret (dev mode)
  
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  
  return crypto.timingSafeEqual(
    Buffer.from(signature || ""),
    Buffer.from(expectedSignature)
  );
}

// Map Dodo subscription status to our internal status
function mapStatus(dodoStatus: string | undefined): string {
  switch (dodoStatus) {
    case "active":
      return "active";
    case "on_hold":
    case "paused":
      return "paused";
    case "cancelled":
    case "expired":
      return "cancelled";
    case "failed":
      return "past_due";
    default:
      return "active";
  }
}

// Get plan ID from product ID
function getPlanFromProductId(productId: string | undefined): string {
  if (!productId) return "starter";
  
  // Check environment variables for product ID mappings
  const productMappings: Record<string, string> = {
    [process.env.DODO_STARTER_MONTHLY_ID || ""]: "starter",
    [process.env.DODO_STARTER_YEARLY_ID || ""]: "starter",
    [process.env.DODO_PRO_MONTHLY_ID || ""]: "pro",
    [process.env.DODO_PRO_YEARLY_ID || ""]: "pro",
    [process.env.DODO_PRO_PLUS_MONTHLY_ID || ""]: "pro_plus",
    [process.env.DODO_PRO_PLUS_YEARLY_ID || ""]: "pro_plus",
  };
  
  return productMappings[productId] || "starter";
}

// Get billing interval from product ID
function getIntervalFromProductId(productId: string | undefined): string {
  if (!productId) return "monthly";
  
  const yearlyProducts = [
    process.env.DODO_STARTER_YEARLY_ID,
    process.env.DODO_PRO_YEARLY_ID,
    process.env.DODO_PRO_PLUS_YEARLY_ID,
  ];
  
  return yearlyProducts.includes(productId) ? "yearly" : "monthly";
}

export async function POST(request: NextRequest) {
  const supabase = createServiceClient();

  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get("x-dodo-signature") || "";
    const webhookSecret = process.env.DODO_WEBHOOK_SECRET || "";

    // Verify signature (skip in dev if no secret)
    if (webhookSecret && !verifySignature(rawBody, signature, webhookSecret)) {
      console.error("[Webhook] Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event: DodoWebhookEvent = JSON.parse(rawBody);
    const { type, data } = event;
    const payload = data.payload;

    console.log(`[Webhook] Received event: ${type}`, payload.subscription_id);

    // Get organization from metadata
    const organizationId = payload.metadata?.organization_id;
    if (!organizationId && type.startsWith("subscription.")) {
      console.error("[Webhook] No organization_id in metadata");
      return NextResponse.json({ error: "Missing organization_id" }, { status: 400 });
    }

    // Handle subscription events
    switch (type) {
      case "subscription.active":
      case "subscription.renewed":
      case "subscription.plan_changed": {
        // Update organization with new subscription info
        const plan = getPlanFromProductId(payload.product_id);
        const interval = getIntervalFromProductId(payload.product_id);
        
        const { error } = await supabase
          .from("organizations")
          .update({
            plan,
            billing_interval: interval,
            subscription_status: "active",
            stripe_subscription_id: payload.subscription_id, // Using stripe field for dodo ID
            current_period_start: payload.current_period_start,
            current_period_end: payload.current_period_end,
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
      case "subscription.paused":
      case "subscription.failed": {
        // Update subscription status
        const { error } = await supabase
          .from("organizations")
          .update({
            subscription_status: mapStatus(payload.status),
          } as never)
          .eq("id", organizationId);

        if (error) {
          console.error("[Webhook] Failed to update org status:", error);
          throw error;
        }

        console.log(`[Webhook] Updated org ${organizationId} status to ${payload.status}`);
        break;
      }

      case "subscription.cancelled":
      case "subscription.expired": {
        // Downgrade to free plan
        const { error } = await supabase
          .from("organizations")
          .update({
            plan: "free",
            subscription_status: "cancelled",
            current_period_end: new Date().toISOString(),
          } as never)
          .eq("id", organizationId);

        if (error) {
          console.error("[Webhook] Failed to downgrade org:", error);
          throw error;
        }

        console.log(`[Webhook] Downgraded org ${organizationId} to free`);
        break;
      }

      case "payment.succeeded": {
        // Log successful payment (optional - for analytics)
        console.log(`[Webhook] Payment succeeded for ${payload.payment_id}`);
        break;
      }

      case "payment.failed": {
        // Could send an email notification here
        console.log(`[Webhook] Payment failed for ${payload.payment_id}`);
        break;
      }

      case "payment.refunded": {
        console.log(`[Webhook] Payment refunded for ${payload.payment_id}`);
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

