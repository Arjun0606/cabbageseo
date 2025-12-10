/**
 * Dodo Payments Webhook Handler
 * 
 * Handles payment events:
 * - subscription.created
 * - subscription.updated
 * - subscription.canceled
 * - invoice.paid
 * - invoice.payment_failed
 * - payment_intent.succeeded
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { dodo } from "@/lib/billing/dodo-client";
import { usageTracker } from "@/lib/billing/usage-tracker";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get("dodo-signature") || "";

    // Verify webhook signature
    if (!dodo.verifyWebhookSignature(payload, signature)) {
      console.error("[Dodo Webhook] Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Parse event
    const event = dodo.parseWebhookEvent(payload);
    const { type, data } = event;

    console.log(`[Dodo Webhook] Received: ${type}`);

    const supabase = createServiceClient();

    switch (type) {
      case "subscription.created":
      case "subscription.updated": {
        const subscription = data as {
          id: string;
          customer_id: string;
          product_id: string;
          status: string;
          current_period_start: string;
          current_period_end: string;
          metadata?: { organization_id?: string };
        };

        // Update organization subscription
        const orgId = subscription.metadata?.organization_id;
        if (orgId) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any)
            .from("organizations")
            .update({
              subscription_id: subscription.id,
              subscription_status: subscription.status,
              plan_id: mapProductToPlan(subscription.product_id),
              billing_period_start: subscription.current_period_start,
              billing_period_end: subscription.current_period_end,
              updated_at: new Date().toISOString(),
            })
            .eq("id", orgId);
        }
        break;
      }

      case "subscription.canceled": {
        const subscription = data as {
          id: string;
          metadata?: { organization_id?: string };
        };

        const orgId = subscription.metadata?.organization_id;
        if (orgId) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any)
            .from("organizations")
            .update({
              subscription_status: "canceled",
              updated_at: new Date().toISOString(),
            })
            .eq("id", orgId);
        }
        break;
      }

      case "invoice.paid": {
        const invoice = data as {
          id: string;
          customer_id: string;
          subscription_id?: string;
          amount: number;
          metadata?: { organization_id?: string };
        };

        const orgId = invoice.metadata?.organization_id;
        if (orgId) {
          // Record payment
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any)
            .from("payments")
            .insert({
              organization_id: orgId,
              invoice_id: invoice.id,
              amount: invoice.amount,
              status: "paid",
              created_at: new Date().toISOString(),
            });

          // If subscription payment, reset usage for new period
          if (invoice.subscription_id) {
            await usageTracker.resetUsageForNewPeriod(orgId);
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = data as {
          id: string;
          customer_id: string;
          metadata?: { organization_id?: string };
        };

        const orgId = invoice.metadata?.organization_id;
        if (orgId) {
          // Update subscription status
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any)
            .from("organizations")
            .update({
              subscription_status: "past_due",
              updated_at: new Date().toISOString(),
            })
            .eq("id", orgId);

          // TODO: Send payment failed email
        }
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = data as {
          id: string;
          amount: number;
          metadata?: { 
            organization_id?: string;
            type?: string;
          };
        };

        // Handle on-demand credit purchase
        if (paymentIntent.metadata?.type === "on_demand_credits") {
          const orgId = paymentIntent.metadata.organization_id;
          if (orgId) {
            await usageTracker.addOnDemandCredits(
              orgId,
              paymentIntent.amount,
              paymentIntent.id
            );
          }
        }
        break;
      }

      case "checkout.session.completed": {
        const session = data as {
          id: string;
          customer_id: string;
          subscription_id?: string;
          metadata?: { organization_id?: string };
        };

        // Link customer and subscription to organization
        const orgId = session.metadata?.organization_id;
        if (orgId) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any)
            .from("organizations")
            .update({
              dodo_customer_id: session.customer_id,
              subscription_id: session.subscription_id,
              updated_at: new Date().toISOString(),
            })
            .eq("id", orgId);
        }
        break;
      }

      default:
        console.log(`[Dodo Webhook] Unhandled event type: ${type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error("[Dodo Webhook] Error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

// Map Dodo product IDs to our plan IDs
function mapProductToPlan(productId: string): string {
  const mapping: Record<string, string> = {
    "prod_starter": "starter",
    "prod_pro": "pro",
    "prod_business": "business",
    "prod_enterprise": "enterprise",
  };
  return mapping[productId] || "starter";
}
