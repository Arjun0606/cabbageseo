import { NextRequest, NextResponse } from "next/server";
import { handleWebhook } from "@/lib/billing/stripe";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe signature" },
        { status: 400 }
      );
    }

    const event = await handleWebhook(body, signature);

    // Handle different event types
    switch (event.type) {
      case "customer.subscription.created":
        // Handle new subscription
        console.log("Subscription created:", event.data);
        // TODO: Update organization plan in database
        break;

      case "customer.subscription.updated":
        // Handle subscription changes
        console.log("Subscription updated:", event.data);
        // TODO: Update organization plan in database
        break;

      case "customer.subscription.deleted":
        // Handle subscription cancellation
        console.log("Subscription deleted:", event.data);
        // TODO: Downgrade organization to free/starter
        break;

      case "invoice.paid":
        // Handle successful payment
        console.log("Invoice paid:", event.data);
        // TODO: Record payment, reset usage counters
        break;

      case "invoice.payment_failed":
        // Handle failed payment
        console.log("Payment failed:", event.data);
        // TODO: Notify user, potentially pause service
        break;

      case "customer.subscription.trial_will_end":
        // Trial ending soon
        console.log("Trial ending:", event.data);
        // TODO: Send trial ending notification
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 400 }
    );
  }
}

