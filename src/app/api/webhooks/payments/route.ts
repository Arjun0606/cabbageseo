/**
 * Payment Webhooks Handler
 * 
 * Handles events from Dodo Payments:
 * - subscription.created
 * - subscription.updated
 * - subscription.canceled
 * - invoice.paid
 * - payment.succeeded (for credit purchases)
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { verifyWebhookSignature } from "@/lib/billing/payments";
import { createUsageTracker } from "@/lib/billing/usage-tracker";

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature = request.headers.get("x-webhook-signature") || "";
  const webhookSecret = process.env.DODO_WEBHOOK_SECRET || "";

  // Verify webhook signature
  if (!verifyWebhookSignature(payload, signature, webhookSecret)) {
    console.error("Invalid webhook signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: {
    type: string;
    data: Record<string, unknown>;
  };

  try {
    event = JSON.parse(payload);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  let supabase;
  try {
    supabase = createServiceClient();
  } catch (e) {
    console.error("[Payments Webhook] Failed to create service client:", e);
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    switch (event.type) {
      // ============================================
      // SUBSCRIPTION EVENTS
      // ============================================
      
      case "subscription.created":
      case "subscription.updated": {
        const subscription = event.data as Record<string, unknown>;
        const metadata = subscription.metadata as Record<string, string> | undefined;
        const organizationId = metadata?.organization_id;
        
        if (organizationId) {
          await supabase
            .from("organizations")
            .update({
              dodo_subscription_id: subscription.id as string,
              plan: subscription.plan_id as string,
              subscription_status: subscription.status as string,
              current_period_start: subscription.current_period_start as string,
              current_period_end: subscription.current_period_end as string,
              cancel_at_period_end: subscription.cancel_at_period_end as boolean,
              updated_at: new Date().toISOString(),
            } as never)
            .eq("id", organizationId);
        }
        break;
      }

      case "subscription.canceled": {
        const subscription = event.data as Record<string, unknown>;
        const metadata = subscription.metadata as Record<string, string> | undefined;
        const organizationId = metadata?.organization_id;
        
        if (organizationId) {
          await supabase
            .from("organizations")
            .update({
              subscription_status: "canceled",
              plan: "scout",
              updated_at: new Date().toISOString(),
            } as never)
            .eq("id", organizationId);
        }
        break;
      }

      // ============================================
      // INVOICE EVENTS
      // ============================================

      case "invoice.paid": {
        const invoice = event.data as Record<string, unknown>;
        const customerId = invoice.customer_id as string;
        
        // Find organization by customer ID
        const { data: orgData } = await supabase
          .from("organizations")
          .select("id")
          .eq("dodo_customer_id", customerId)
          .single();

        const org = orgData as { id: string } | null;
        if (org) {
          // Record invoice in history
          await supabase
            .from("invoices")
            .insert({
              organization_id: org.id,
              external_id: invoice.id as string,
              amount: (invoice.amount as number) / 100,
              status: "paid",
              paid_at: new Date().toISOString(),
              invoice_url: invoice.hosted_url as string,
              pdf_url: invoice.pdf_url as string,
            } as never);
        }
        break;
      }

      // ============================================
      // PAYMENT EVENTS (Credit purchases)
      // ============================================

      case "payment.succeeded": {
        const payment = event.data as Record<string, unknown>;
        const metadata = payment.metadata as Record<string, string> | undefined;
        
        if (metadata?.type === "credit_purchase") {
          const customerId = payment.customer_id as string;
          const credits = parseInt(metadata.credits || "0", 10);
          const bonus = parseInt(metadata.bonus || "0", 10);

          // Find organization
          const { data: orgData } = await supabase
            .from("organizations")
            .select("id")
            .eq("dodo_customer_id", customerId)
            .single();

          const org = orgData as { id: string } | null;
          if (org) {
            // Add credits to balance
            const tracker = createUsageTracker(org.id);
            await tracker.addCredits(credits, bonus);

            // Record transaction
            await supabase
              .from("credit_transactions")
              .insert({
                organization_id: org.id,
                type: "purchase",
                credits: credits + bonus,
                amount: (payment.amount as number) / 100,
                payment_id: payment.id as string,
              } as never);
          }
        }
        break;
      }

      // ============================================
      // TRIAL EVENTS
      // ============================================

      case "customer.subscription.trial_will_end": {
        const subscription = event.data as { metadata?: { organization_id?: string }; trial_end?: number };
        const organizationId = subscription.metadata?.organization_id;
        
        if (organizationId) {
          // Update trial end date
          await supabase
            .from("organizations")
            .update({
              trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
              updated_at: new Date().toISOString(),
            } as never)
            .eq("id", organizationId);

          // Send trial ending email notification
          await sendTrialEndingEmail(supabase, organizationId, subscription.trial_end);
        }
        break;
      }

      default:
        console.log(`Unhandled webhook event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

/**
 * Send trial ending email notification
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sendTrialEndingEmail(
  supabase: any,
  organizationId: string,
  trialEndTimestamp?: number
): Promise<void> {
  try {
    // Get organization owner's email
    const { data: users } = await supabase
      .from("users")
      .select("email, name")
      .eq("organization_id", organizationId)
      .eq("role", "owner")
      .limit(1);
    
    if (!users || users.length === 0) {
      console.log("[Trial Email] No owner found for org:", organizationId);
      return;
    }
    
    const owner = users[0] as { email: string; name?: string };
    const trialEndDate = trialEndTimestamp 
      ? new Date(trialEndTimestamp * 1000).toLocaleDateString() 
      : "soon";
    
    // Check if Resend is configured
    const resendApiKey = process.env.RESEND_API_KEY;
    
    if (resendApiKey) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "CabbageSEO <noreply@cabbageseo.com>",
          to: [owner.email],
          subject: "Your CabbageSEO trial is ending soon",
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Hi${owner.name ? ` ${owner.name}` : ""},</h2>
              <p>Your CabbageSEO trial is ending on <strong>${trialEndDate}</strong>.</p>
              <p>Upgrade now to keep tracking your AI visibility and stay ahead of competitors.</p>
              <div style="margin: 24px 0;">
                <a href="https://cabbageseo.com/settings/billing" 
                   style="display: inline-block; background: #ef4444; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
                  Upgrade Now
                </a>
              </div>
              <p style="color: #71717a;">Questions? Just reply to this email.</p>
            </div>
          `,
        }),
      });
      
      if (!response.ok) {
        console.error("[Trial Email] Failed to send:", await response.text());
      } else {
        console.log(`[Trial Email] Sent to ${owner.email}`);
      }
    } else {
      // Fallback: Log for development
      console.log(`[Trial Email] Would send to: ${owner.email}`);
      console.log(`  Subject: Your trial ends ${trialEndDate}`);
      console.log(`  Note: Set RESEND_API_KEY to enable email notifications`);
    }
  } catch (error) {
    console.error("[Trial Email] Error:", error);
  }
}

