import { NextRequest, NextResponse } from "next/server";
import { getDodo } from "@/lib/billing/dodo";

/**
 * Dodo Payments Webhook Handler
 * https://docs.dodopayments.com/integrate/webhooks
 * 
 * Handles:
 * - subscription.created
 * - subscription.updated
 * - subscription.canceled
 * - payment.succeeded
 * - payment.failed
 * - invoice.paid
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-dodo-signature");
    const webhookSecret = process.env.DODO_WEBHOOK_SECRET || "";

    if (!signature) {
      return NextResponse.json(
        { error: "Missing webhook signature" },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const dodo = getDodo();
    const isValid = dodo.verifyWebhook(body, signature, webhookSecret);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 }
      );
    }

    const event = JSON.parse(body);
    const eventType = event.type;
    const data = event.data;

    console.log(`[Dodo Webhook] Received: ${eventType}`);

    switch (eventType) {
      // ============================================
      // SUBSCRIPTION EVENTS
      // ============================================
      
      case "subscription.created": {
        // New subscription created
        const { customer_id, product_id, metadata } = data;
        const organizationId = metadata?.organizationId;
        const planId = metadata?.planId;

        console.log(`[Dodo] Subscription created for org: ${organizationId}, plan: ${planId}`);

        // TODO: Update organization in database
        // await db.update(organizations)
        //   .set({
        //     dodoCustomerId: customer_id,
        //     dodoSubscriptionId: data.id,
        //     plan: planId,
        //     subscriptionStatus: 'active',
        //     currentPeriodStart: new Date(data.current_period_start),
        //     currentPeriodEnd: new Date(data.current_period_end),
        //   })
        //   .where(eq(organizations.id, organizationId));

        break;
      }

      case "subscription.updated": {
        // Subscription changed (upgrade/downgrade)
        const { metadata } = data;
        const organizationId = metadata?.organizationId;
        const newPlanId = metadata?.planId;

        console.log(`[Dodo] Subscription updated for org: ${organizationId}, new plan: ${newPlanId}`);

        // TODO: Update organization plan
        break;
      }

      case "subscription.canceled": {
        // Subscription canceled
        const { metadata } = data;
        const organizationId = metadata?.organizationId;

        console.log(`[Dodo] Subscription canceled for org: ${organizationId}`);

        // TODO: Mark subscription as canceled, downgrade at period end
        break;
      }

      case "subscription.trial_ending": {
        // Trial ending soon (usually 3 days before)
        const { metadata, customer_id } = data;
        const organizationId = metadata?.organizationId;

        console.log(`[Dodo] Trial ending for org: ${organizationId}`);

        // TODO: Send trial ending email
        break;
      }

      // ============================================
      // PAYMENT EVENTS
      // ============================================

      case "payment.succeeded": {
        // Payment successful
        const { amount, currency, customer_id, metadata } = data;
        const organizationId = metadata?.organizationId;

        console.log(`[Dodo] Payment succeeded: ${amount} ${currency} for org: ${organizationId}`);

        // TODO: Record payment, reset usage counters for new billing period
        break;
      }

      case "payment.failed": {
        // Payment failed
        const { customer_id, metadata, failure_reason } = data;
        const organizationId = metadata?.organizationId;

        console.log(`[Dodo] Payment failed for org: ${organizationId}: ${failure_reason}`);

        // TODO: Send payment failed email, possibly pause service
        break;
      }

      // ============================================
      // INVOICE EVENTS
      // ============================================

      case "invoice.paid": {
        // Invoice paid (includes overages)
        const { amount, metadata } = data;
        const organizationId = metadata?.organizationId;

        console.log(`[Dodo] Invoice paid: ${amount} for org: ${organizationId}`);

        // TODO: Record invoice, update billing history
        break;
      }

      case "invoice.payment_failed": {
        // Invoice payment failed
        const { metadata } = data;
        const organizationId = metadata?.organizationId;

        console.log(`[Dodo] Invoice payment failed for org: ${organizationId}`);

        // TODO: Handle failed invoice payment
        break;
      }

      // ============================================
      // USAGE EVENTS
      // ============================================

      case "usage.threshold_reached": {
        // Usage threshold reached (e.g., 80% of limit)
        const { meter_id, current_usage, threshold, metadata } = data;
        const organizationId = metadata?.organizationId;

        console.log(`[Dodo] Usage threshold reached for org: ${organizationId}, meter: ${meter_id}`);

        // TODO: Send usage warning email
        break;
      }

      default:
        console.log(`[Dodo] Unhandled event type: ${eventType}`);
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

// Dodo might send GET requests for webhook verification
export async function GET() {
  return NextResponse.json({ status: "Dodo webhook endpoint active" });
}

