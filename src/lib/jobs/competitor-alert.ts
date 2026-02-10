/**
 * Competitor Fear Alerts — Inngest Event Handler
 *
 * Triggered by the event `competitor/change.detected`.
 * When a tracked competitor gains new AI citations, we:
 *   1. Look up the site owner's email
 *   2. Check their notification preferences (emailCompetitorCited)
 *   3. Send a fear-driven alert email via Resend
 */

import { inngest } from "./inngest-client";
import { createServiceClient } from "@/lib/supabase/server";

// ============================================
// COMPETITOR CHANGE ALERT — Inngest Event
// ============================================
export const competitorChangeAlert = inngest.createFunction(
  {
    id: "competitor-change-alert",
    name: "Competitor Change Alert Email",
    retries: 3,
  },
  { event: "competitor/change.detected" },
  async ({ event, step }) => {
    const { siteId, domain, organizationId, competitorDomain, newCitations, change } = event.data as {
      siteId: string;
      domain: string;
      organizationId: string;
      competitorDomain: string;
      newCitations: number;
      change: number;
    };

    const supabase = createServiceClient();

    // 1. Get the site owner's email
    const userInfo = await step.run("get-owner-email", async () => {
      const { data } = await supabase
        .from("users")
        .select("id, email")
        .eq("organization_id", organizationId)
        .eq("role", "owner")
        .single();

      return data as { id: string; email: string } | null;
    });

    if (!userInfo?.email) {
      return { sent: false, reason: "No owner email found" };
    }

    // 2. Send the fear-driven email
    if (!process.env.RESEND_API_KEY) {
      console.error("[Competitor Alert] RESEND_API_KEY not configured, skipping email");
      return { sent: false, reason: "RESEND_API_KEY not configured" };
    }

    await step.run("send-alert-email", async () => {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://cabbageseo.com";

      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "CabbageSEO <hello@cabbageseo.com>",
        to: userInfo.email,
        subject: `⚠️ ${competitorDomain} gained ${change} new AI citations`,
        html: `
          <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #09090b; color: #fff;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #ef4444, #dc2626); border-radius: 16px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 30px;">⚠️</span>
              </div>
              <h1 style="font-size: 24px; margin: 0; color: #fff;">Competitor Alert</h1>
              <p style="color: #71717a; margin-top: 8px;">for ${domain}</p>
            </div>

            <!-- Competitor highlight -->
            <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; padding: 24px; margin-bottom: 24px; text-align: center;">
              <div style="font-size: 14px; color: #a1a1aa; margin-bottom: 8px;">Competitor gaining ground</div>
              <div style="font-size: 28px; font-weight: bold; color: #fff; margin-bottom: 4px;">${competitorDomain}</div>
              <div style="font-size: 36px; font-weight: bold; color: #ef4444;">+${change} citations</div>
              <div style="font-size: 13px; color: #a1a1aa; margin-top: 4px;">${newCitations} total AI citations</div>
            </div>

            <p style="color: #a1a1aa; line-height: 1.6; margin-bottom: 16px;">
              <strong style="color: #fff;">Your competitor is winning queries you could own.</strong>
            </p>

            <p style="color: #a1a1aa; line-height: 1.6; margin-bottom: 16px;">
              While you're reading this, AI platforms are recommending <strong style="color: #ef4444;">${competitorDomain}</strong> to potential customers asking questions in your space. Every citation they earn is a customer you might never see.
            </p>

            <p style="color: #a1a1aa; line-height: 1.6;">
              Don't let them build an insurmountable lead. See exactly which queries they're winning and what you can do to fight back.
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${appUrl}/dashboard"
                 style="display: inline-block; background: #10b981; color: #000; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                See Where They're Winning →
              </a>
            </div>

            <hr style="border: none; border-top: 1px solid #27272a; margin: 30px 0;" />

            <p style="color: #71717a; font-size: 12px; text-align: center;">
              <a href="${appUrl}/settings/notifications" style="color: #10b981;">Manage email preferences</a>
              <br /><br />
              Powered by <a href="https://cabbageseo.com" style="color: #10b981;">CabbageSEO</a> — AI Visibility Intelligence
            </p>
          </div>
        `,
      });
    });

    return { sent: true, to: userInfo.email, competitorDomain, change };
  }
);

// Export for Inngest registration
export const competitorAlertFunctions = [competitorChangeAlert];
