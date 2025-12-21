/**
 * Dodo Payments Webhook Handler
 * 
 * Handles all webhook events from Dodo Payments:
 * - subscription.created / subscription.updated / subscription.canceled
 * - payment.succeeded / payment.failed
 * - invoice.paid / invoice.payment_failed
 * - customer.created / customer.updated
 * 
 * Dodo Docs: https://docs.dodopayments.com/webhooks
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import crypto from "crypto";

// ============================================
// TYPES
// ============================================

interface DodoWebhookEvent {
  type: string;
  data: {
    object: Record<string, unknown>;
  };
  created_at: string;
}

interface SubscriptionData {
  id: string;
  customer_id: string;
  product_id: string;
  status: "active" | "canceled" | "past_due" | "trialing" | "paused";
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  metadata?: Record<string, string>;
}

interface PaymentData {
  id: string;
  customer_id: string;
  subscription_id?: string;
  amount: number;
  currency: string;
  status: "succeeded" | "failed" | "pending";
  metadata?: Record<string, string>;
}

// ============================================
// WEBHOOK HANDLER
// ============================================

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.DODO_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    console.error("[Dodo Webhook] DODO_WEBHOOK_SECRET not configured");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  // Get raw body and signature
  const payload = await request.text();
  const signature = request.headers.get("x-dodo-signature") || 
                    request.headers.get("x-webhook-signature") || "";

  // Verify signature
  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(payload)
    .digest("hex");

  const isValid = crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );

  if (!isValid) {
    console.error("[Dodo Webhook] Invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Parse event
  let event: DodoWebhookEvent;
  try {
    event = JSON.parse(payload);
  } catch {
    console.error("[Dodo Webhook] Failed to parse payload");
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  console.log(`[Dodo Webhook] Received: ${event.type}`);

  // Create admin Supabase client (bypasses RLS)
  // Using 'any' type to avoid strict typing issues with webhook updates
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServiceClient() as any;

  try {
    switch (event.type) {
      // ============================================
      // SUBSCRIPTION EVENTS
      // ============================================
      
      case "subscription.created":
      case "subscription.activated": {
        const subscription = event.data.object as unknown as SubscriptionData;
        await handleSubscriptionCreated(supabase, subscription);
        break;
      }

      case "subscription.updated": {
        const subscription = event.data.object as unknown as SubscriptionData;
        await handleSubscriptionUpdated(supabase, subscription);
        break;
      }

      case "subscription.canceled":
      case "subscription.cancelled": {
        const subscription = event.data.object as unknown as SubscriptionData;
        await handleSubscriptionCanceled(supabase, subscription);
        break;
      }

      case "subscription.paused": {
        const subscription = event.data.object as unknown as SubscriptionData;
        await handleSubscriptionPaused(supabase, subscription);
        break;
      }

      case "subscription.resumed": {
        const subscription = event.data.object as unknown as SubscriptionData;
        await handleSubscriptionResumed(supabase, subscription);
        break;
      }

      // ============================================
      // PAYMENT EVENTS
      // ============================================

      case "payment.succeeded":
      case "payment.completed": {
        const payment = event.data.object as unknown as PaymentData;
        await handlePaymentSucceeded(supabase, payment);
        break;
      }

      case "payment.failed": {
        const payment = event.data.object as unknown as PaymentData;
        await handlePaymentFailed(supabase, payment);
        break;
      }

      // ============================================
      // INVOICE EVENTS
      // ============================================

      case "invoice.paid": {
        const invoice = event.data.object as unknown as PaymentData;
        await handleInvoicePaid(supabase, invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as unknown as PaymentData;
        await handleInvoicePaymentFailed(supabase, invoice);
        break;
      }

      // ============================================
      // CHECKOUT EVENTS
      // ============================================

      case "checkout.completed": {
        const checkout = event.data.object as unknown as {
          id: string;
          customer_id: string;
          subscription_id?: string;
          metadata?: Record<string, string>;
        };
        await handleCheckoutCompleted(supabase, checkout);
        break;
      }

      default:
        console.log(`[Dodo Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error("[Dodo Webhook] Error processing event:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

// ============================================
// EVENT HANDLERS
// ============================================

async function handleSubscriptionCreated(
  supabase: any,
  subscription: SubscriptionData
) {
  const orgId = subscription.metadata?.organization_id;
  const planId = subscription.metadata?.plan_id || getPlanFromProductId(subscription.product_id);
  const interval = subscription.metadata?.interval || "monthly";

  if (!orgId) {
    console.error("[Dodo Webhook] No organization_id in subscription metadata");
    return;
  }

  await supabase
    .from("organizations")
    .update({
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer_id,
      plan: planId,
      billing_interval: interval,
      subscription_status: subscription.status,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orgId);

  console.log(`[Dodo Webhook] Subscription created for org ${orgId}: ${planId}`);

  // Send welcome/upgrade notification
  await createNotification(supabase, orgId, {
    type: "success",
    category: "billing",
    title: "Subscription Activated",
    message: `Your ${planId.replace("_", " ")} plan is now active!`,
  });
}

async function handleSubscriptionUpdated(
  supabase: any,
  subscription: SubscriptionData
) {
  // Find org by subscription ID
  const { data: org } = await supabase
    .from("organizations")
    .select("id, plan")
    .eq("stripe_subscription_id", subscription.id)
    .single();

  if (!org) {
    console.error("[Dodo Webhook] No org found for subscription", subscription.id);
    return;
  }

  const newPlan = subscription.metadata?.plan_id || getPlanFromProductId(subscription.product_id);
  const oldPlan = (org as { plan?: string }).plan;

  await supabase
    .from("organizations")
    .update({
      plan: newPlan,
      subscription_status: subscription.status,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    })
    .eq("id", (org as { id: string }).id);

  // Notify if plan changed
  if (newPlan !== oldPlan) {
    await createNotification(supabase, (org as { id: string }).id, {
      type: "info",
      category: "billing",
      title: "Plan Updated",
      message: `Your plan has been changed to ${newPlan.replace("_", " ")}.`,
    });
  }

  console.log(`[Dodo Webhook] Subscription updated for org ${(org as { id: string }).id}`);
}

async function handleSubscriptionCanceled(
  supabase: any,
  subscription: SubscriptionData
) {
  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("stripe_subscription_id", subscription.id)
    .single();

  if (!org) return;

  const orgId = (org as { id: string }).id;

  await supabase
    .from("organizations")
    .update({
      subscription_status: "canceled",
      cancel_at_period_end: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orgId);

  await createNotification(supabase, orgId, {
    type: "warning",
    category: "billing",
    title: "Subscription Canceled",
    message: "Your subscription has been canceled. You'll retain access until the end of your billing period.",
  });

  console.log(`[Dodo Webhook] Subscription canceled for org ${orgId}`);
}

async function handleSubscriptionPaused(
  supabase: any,
  subscription: SubscriptionData
) {
  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("stripe_subscription_id", subscription.id)
    .single();

  if (!org) return;

  await supabase
    .from("organizations")
    .update({
      subscription_status: "paused",
      updated_at: new Date().toISOString(),
    })
    .eq("id", (org as { id: string }).id);

  console.log(`[Dodo Webhook] Subscription paused for org ${(org as { id: string }).id}`);
}

async function handleSubscriptionResumed(
  supabase: any,
  subscription: SubscriptionData
) {
  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("stripe_subscription_id", subscription.id)
    .single();

  if (!org) return;

  await supabase
    .from("organizations")
    .update({
      subscription_status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", (org as { id: string }).id);

  console.log(`[Dodo Webhook] Subscription resumed for org ${(org as { id: string }).id}`);
}

async function handlePaymentSucceeded(
  supabase: any,
  payment: PaymentData
) {
  // If this is a one-time payment for credits, add them
  if (payment.metadata?.type === "credit_purchase") {
    const orgId = payment.metadata.organization_id;
    const credits = parseInt(payment.metadata.credits || "0", 10);
    const bonus = parseInt(payment.metadata.bonus || "0", 10);

    if (orgId && credits > 0) {
      // Add credits to organization
      const { data: current } = await supabase
        .from("credit_balance")
        .select("prepaid_credits, bonus_credits")
        .eq("organization_id", orgId)
        .single();

      const currentData = current as { prepaid_credits?: number; bonus_credits?: number } | null;
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      await supabase
        .from("credit_balance")
        .upsert({
          organization_id: orgId,
          prepaid_credits: (currentData?.prepaid_credits || 0) + credits,
          bonus_credits: (currentData?.bonus_credits || 0) + bonus,
          expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: "organization_id" });

      // Record transaction
      await supabase.from("credit_transactions").insert({
        organization_id: orgId,
        type: "purchase",
        amount: credits + bonus,
        description: `Purchased ${credits} credits (+${bonus} bonus)`,
        payment_id: payment.id,
        created_at: new Date().toISOString(),
      });

      console.log(`[Dodo Webhook] Added ${credits + bonus} credits to org ${orgId}`);
    }
  }

  console.log(`[Dodo Webhook] Payment succeeded: ${payment.id}`);
}

async function handlePaymentFailed(
  supabase: any,
  payment: PaymentData
) {
  // Find org by customer ID
  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("stripe_customer_id", payment.customer_id)
    .single();

  if (!org) return;

  await createNotification(supabase, (org as { id: string }).id, {
    type: "error",
    category: "billing",
    title: "Payment Failed",
    message: "Your payment could not be processed. Please update your payment method.",
  });

  console.log(`[Dodo Webhook] Payment failed for org ${(org as { id: string }).id}`);
}

async function handleInvoicePaid(
  supabase: any,
  invoice: PaymentData
) {
  // Record invoice
  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("stripe_customer_id", invoice.customer_id)
    .single();

  if (!org) return;

  const orgId = (org as { id: string }).id;

  await supabase.from("invoices").insert({
    organization_id: orgId,
    dodo_invoice_id: invoice.id,
    amount_cents: invoice.amount,
    currency: invoice.currency || "usd",
    status: "paid",
    paid_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  });

  // Mark overage charges as billed
  await supabase.rpc("mark_overages_billed", { org_id: orgId });

  // Reset current overage spend for new period
  const { data: orgData } = await supabase
    .from("organizations")
    .select("overage_settings")
    .eq("id", orgId)
    .single();

  type OverageSettings = {
    enabled: boolean;
    spendingCapCents: number;
    currentSpendCents: number;
    autoIncreaseEnabled: boolean;
    autoIncreaseAmountCents: number;
    notifyAt: number[];
    lastNotifiedAt: string | null;
  };

  const settings = (orgData as { overage_settings?: OverageSettings } | null)?.overage_settings;
  if (settings) {
    await supabase
      .from("organizations")
      .update({
        overage_settings: {
          ...settings,
          currentSpendCents: 0,
          lastNotifiedAt: null,
        },
      })
      .eq("id", orgId);
  }

  console.log(`[Dodo Webhook] Invoice paid for org ${orgId}`);
}

async function handleInvoicePaymentFailed(
  supabase: any,
  invoice: PaymentData
) {
  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("stripe_customer_id", invoice.customer_id)
    .single();

  if (!org) return;

  await supabase
    .from("organizations")
    .update({
      subscription_status: "past_due",
      updated_at: new Date().toISOString(),
    })
    .eq("id", (org as { id: string }).id);

  await createNotification(supabase, (org as { id: string }).id, {
    type: "error",
    category: "billing",
    title: "Invoice Payment Failed",
    message: "We couldn't process your invoice payment. Please update your payment method to avoid service interruption.",
  });

  console.log(`[Dodo Webhook] Invoice payment failed for org ${(org as { id: string }).id}`);
}

async function handleCheckoutCompleted(
  supabase: any,
  checkout: { id: string; customer_id: string; subscription_id?: string; metadata?: Record<string, string> }
) {
  const orgId = checkout.metadata?.organization_id;
  const planId = checkout.metadata?.plan_id;
  const interval = checkout.metadata?.interval;

  if (!orgId || !planId) {
    console.log("[Dodo Webhook] Checkout completed but missing org/plan metadata");
    return;
  }

  // Update organization with new subscription
  await supabase
    .from("organizations")
    .update({
      stripe_customer_id: checkout.customer_id,
      stripe_subscription_id: checkout.subscription_id,
      plan: planId,
      billing_interval: interval || "monthly",
      subscription_status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", orgId);

  console.log(`[Dodo Webhook] Checkout completed for org ${orgId}: ${planId}`);
}

// ============================================
// HELPERS
// ============================================

function getPlanFromProductId(productId: string): string {
  const productToPlan: Record<string, string> = {
    [process.env.DODO_STARTER_MONTHLY_ID || "prod_starter_monthly"]: "starter",
    [process.env.DODO_STARTER_YEARLY_ID || "prod_starter_yearly"]: "starter",
    [process.env.DODO_PRO_MONTHLY_ID || "prod_pro_monthly"]: "pro",
    [process.env.DODO_PRO_YEARLY_ID || "prod_pro_yearly"]: "pro",
    [process.env.DODO_PRO_PLUS_MONTHLY_ID || "prod_pro_plus_monthly"]: "pro_plus",
    [process.env.DODO_PRO_PLUS_YEARLY_ID || "prod_pro_plus_yearly"]: "pro_plus",
  };

  return productToPlan[productId] || "starter";
}

async function createNotification(
  supabase: any,
  organizationId: string,
  notification: {
    type: "info" | "success" | "warning" | "error";
    category: string;
    title: string;
    message: string;
  }
) {
  await supabase.from("notifications").insert({
    organization_id: organizationId,
    type: notification.type,
    category: notification.category,
    title: notification.title,
    message: notification.message,
    read: false,
    created_at: new Date().toISOString(),
  });
}

