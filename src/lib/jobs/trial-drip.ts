/**
 * Trial Drip Email Campaign — Inngest Cron Job
 *
 * Sends nurture emails to trial users over 7 days.
 * Schedule:
 *   Day 0: Welcome + scan summary
 *   Day 2: Competitor fear
 *   Day 4: Top action
 *   Day 6: Urgency — trial ends tomorrow
 *   Day 7: Trial ended — FOMO
 *
 * Runs daily at 8 AM UTC.
 * NO MOCK DATA — Real queries only.
 */

import { inngest } from "./inngest-client";
import { createServiceClient } from "@/lib/supabase/server";

// ============================================
// HELPERS
// ============================================

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://cabbageseo.com";

/** Wrap email content in the dark-theme layout */
function emailLayout(content: string): string {
  return `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #09090b; color: #fff;">
      ${content}
      <hr style="border: none; border-top: 1px solid #27272a; margin: 30px 0;" />
      <p style="color: #71717a; font-size: 12px; text-align: center;">
        <a href="${APP_URL}/settings/notifications" style="color: #10b981;">Unsubscribe or manage email preferences</a>
        <br /><br />
        Powered by <a href="https://cabbageseo.com" style="color: #10b981;">CabbageSEO</a> — AI Visibility Intelligence
      </p>
    </div>
  `;
}

function ctaButton(text: string, href: string): string {
  return `
    <div style="text-align: center; margin: 30px 0;">
      <a href="${href}"
         style="display: inline-block; background: #10b981; color: #000; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
        ${text}
      </a>
    </div>
  `;
}

/** Calculate trial day from trial_ends_at (trial is 7 days, so start = ends_at - 7 days) */
function getTrialDay(trialEndsAt: string): number {
  const endsAt = new Date(trialEndsAt);
  const startedAt = new Date(endsAt.getTime() - 7 * 24 * 60 * 60 * 1000);
  const now = new Date();
  const daysSinceStart = Math.floor(
    (now.getTime() - startedAt.getTime()) / (24 * 60 * 60 * 1000)
  );
  return daysSinceStart;
}

// ============================================
// EMAIL TEMPLATES
// ============================================

interface EmailTemplate {
  subject: string;
  html: string;
}

function day0Email(orgName: string, domain: string | null, totalCitations: number): EmailTemplate {
  const citationSummary = totalCitations > 0
    ? `<strong style="color: #10b981;">${totalCitations}</strong> AI citations found so far`
    : `<strong style="color: #ef4444;">0</strong> AI citations found — you're currently invisible`;

  return {
    subject: "🎯 Your AI visibility report is ready",
    html: emailLayout(`
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 16px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 30px;">🎯</span>
        </div>
        <h1 style="font-size: 24px; margin: 0; color: #fff;">Welcome to CabbageSEO</h1>
        <p style="color: #a1a1aa; margin-top: 8px;">${orgName}</p>
      </div>

      <p style="color: #a1a1aa; line-height: 1.6;">
        Your AI visibility scan is complete. Here's what AI thinks about ${domain ? `<strong style="color: #fff;">${domain}</strong>` : "your brand"}:
      </p>

      <div style="background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
        <p style="margin: 0; color: #a1a1aa; font-size: 16px;">
          ${citationSummary}
        </p>
      </div>

      <p style="color: #a1a1aa; line-height: 1.6;">
        Your full report shows which AI platforms cite you, which queries trigger recommendations, and where you stand against competitors.
      </p>

      ${ctaButton("See Your Full Report →", `${APP_URL}/dashboard`)}
    `),
  };
}

function day2Email(domain: string | null): EmailTemplate {
  return {
    subject: "⚠️ Your competitors are being cited — are you?",
    html: emailLayout(`
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #ef4444, #dc2626); border-radius: 16px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 30px;">⚠️</span>
        </div>
        <h1 style="font-size: 24px; margin: 0; color: #fff;">Your competitors gained ground</h1>
      </div>

      <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; padding: 20px; margin: 20px 0;">
        <p style="margin: 0; color: #fca5a5; font-size: 15px; line-height: 1.6;">
          While you're reading this email, buyers are asking ChatGPT and Perplexity for product recommendations in your category. Every time AI answers — and doesn't mention ${domain || "you"} — a competitor wins a free customer.
        </p>
      </div>

      <p style="color: #a1a1aa; line-height: 1.6;">
        The problem isn't just that you're invisible. It's that <strong style="color: #fff;">your competitors are actively winning the queries you should own</strong>.
      </p>

      <p style="color: #a1a1aa; line-height: 1.6;">
        Check your dashboard to see exactly who AI is recommending instead of you — and which queries they're winning.
      </p>

      ${ctaButton("See Who's Winning →", `${APP_URL}/dashboard`)}
    `),
  };
}

function day4Email(domain: string | null): EmailTemplate {
  return {
    subject: "🔧 One action that will change your AI visibility",
    html: emailLayout(`
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 16px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 30px;">🔧</span>
        </div>
        <h1 style="font-size: 24px; margin: 0; color: #fff;">The #1 thing to fix right now</h1>
      </div>

      <p style="color: #a1a1aa; line-height: 1.6;">
        We've analyzed ${domain ? `<strong style="color: #fff;">${domain}</strong>'s` : "your"} AI visibility profile and identified the single highest-impact action you can take today.
      </p>

      <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 20px; margin: 20px 0;">
        <p style="margin: 0; color: #10b981; font-size: 15px; font-weight: 600; margin-bottom: 8px;">
          Your top recommended action:
        </p>
        <p style="margin: 0; color: #d1d5db; font-size: 15px; line-height: 1.6;">
          Open your 30-day sprint to see the one action that will move the needle most. Each task is tailored to your specific gaps and competitor landscape.
        </p>
      </div>

      <p style="color: #a1a1aa; line-height: 1.6;">
        Most founders see measurable results within 2 weeks of starting their sprint. The key is to <strong style="color: #fff;">start with the right action</strong> — not do everything at once.
      </p>

      ${ctaButton("Start Your Sprint →", `${APP_URL}/dashboard`)}
    `),
  };
}

function day6Email(domain: string | null): EmailTemplate {
  return {
    subject: "⏰ 24 hours left — don't lose your data",
    html: emailLayout(`
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #f59e0b, #d97706); border-radius: 16px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 30px;">⏰</span>
        </div>
        <h1 style="font-size: 24px; margin: 0; color: #fff;">Your trial ends tomorrow</h1>
      </div>

      <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 12px; padding: 20px; margin: 20px 0;">
        <p style="margin: 0; color: #fcd34d; font-size: 15px; line-height: 1.6;">
          In 24 hours, your monitoring for ${domain ? `<strong>${domain}</strong>` : "your site"} stops. Your data will be saved, but you'll lose access to:
        </p>
      </div>

      <div style="margin: 20px 0;">
        <div style="display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid #27272a;">
          <span style="color: #ef4444;">✕</span>
          <span style="color: #a1a1aa;">Daily AI citation monitoring</span>
        </div>
        <div style="display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid #27272a;">
          <span style="color: #ef4444;">✕</span>
          <span style="color: #a1a1aa;">30-day sprint access & action plans</span>
        </div>
        <div style="display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid #27272a;">
          <span style="color: #ef4444;">✕</span>
          <span style="color: #a1a1aa;">Competitor tracking & alerts</span>
        </div>
        <div style="display: flex; align-items: center; gap: 12px; padding: 12px 0;">
          <span style="color: #ef4444;">✕</span>
          <span style="color: #a1a1aa;">Weekly momentum reports</span>
        </div>
      </div>

      <p style="color: #a1a1aa; line-height: 1.6;">
        Your competitors don't stop being recommended by AI just because your trial ended. <strong style="color: #fff;">Upgrade now to keep your momentum.</strong>
      </p>

      ${ctaButton("Upgrade Now →", `${APP_URL}/settings/billing`)}
    `),
  };
}

function day7Email(domain: string | null, momentumChange: number): EmailTemplate {
  const momentumMsg = momentumChange > 0
    ? `During your trial, your momentum score increased by <strong style="color: #10b981;">+${momentumChange} points</strong>. Don't let that progress slip away.`
    : momentumChange < 0
    ? `During your trial, your momentum score dropped by <strong style="color: #ef4444;">${momentumChange} points</strong>. You need to act fast.`
    : `During your trial, you started building a baseline. Now is the time to build on that data.`;

  return {
    subject: "Your trial has ended — here's what you're missing",
    html: emailLayout(`
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #71717a, #52525b); border-radius: 16px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 30px;">📊</span>
        </div>
        <h1 style="font-size: 24px; margin: 0; color: #fff;">Your trial has ended</h1>
        <p style="color: #a1a1aa; margin-top: 8px;">${domain || "Your site"}</p>
      </div>

      <div style="background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
        <p style="margin: 0; color: #a1a1aa; font-size: 15px; line-height: 1.6;">
          ${momentumMsg}
        </p>
      </div>

      <p style="color: #a1a1aa; line-height: 1.6;">
        Here's what's happening while your monitoring is paused:
      </p>

      <div style="margin: 20px 0;">
        <div style="padding: 12px 16px; background: rgba(239, 68, 68, 0.05); border-left: 3px solid #ef4444; margin-bottom: 8px; border-radius: 0 8px 8px 0;">
          <span style="color: #fca5a5;">Competitors are gaining citations you can't see</span>
        </div>
        <div style="padding: 12px 16px; background: rgba(239, 68, 68, 0.05); border-left: 3px solid #ef4444; margin-bottom: 8px; border-radius: 0 8px 8px 0;">
          <span style="color: #fca5a5;">AI recommendations are shifting — without your input</span>
        </div>
        <div style="padding: 12px 16px; background: rgba(239, 68, 68, 0.05); border-left: 3px solid #ef4444; border-radius: 0 8px 8px 0;">
          <span style="color: #fca5a5;">Your sprint progress is frozen</span>
        </div>
      </div>

      <p style="color: #a1a1aa; line-height: 1.6;">
        <strong style="color: #fff;">Restart your AI strategy today.</strong> Pick up right where you left off with all your data intact.
      </p>

      ${ctaButton("Restart Your AI Strategy →", `${APP_URL}/settings/billing?plan=scout`)}
    `),
  };
}

// ============================================
// MAIN CRON JOB
// ============================================

export const trialDripEmail = inngest.createFunction(
  { id: "trial-drip-email", name: "Trial Drip Email Sender", retries: 2 },
  { cron: "0 8 * * *" }, // Daily at 8 AM UTC
  async ({ step }) => {
    const supabase = createServiceClient();

    // Get all trialing organizations
    const orgs = await step.run("get-trial-orgs", async () => {
      const { data } = await supabase
        .from("organizations")
        .select("id, name, trial_ends_at, created_at")
        .eq("plan", "free")
        .eq("subscription_status", "trialing");
      return (data || []) as Array<{
        id: string;
        name: string;
        trial_ends_at: string;
        created_at: string;
      }>;
    });

    if (orgs.length === 0) {
      return { processed: 0, message: "No trialing organizations" };
    }

    let emailsSent = 0;
    let skipped = 0;

    for (const org of orgs) {
      // Skip if no trial_ends_at — can't calculate day
      if (!org.trial_ends_at) {
        skipped++;
        continue;
      }

      const trialDay = getTrialDay(org.trial_ends_at);

      // Only send on specific days
      if (![0, 2, 4, 6, 7].includes(trialDay)) {
        continue;
      }

      // Use org ID + day as the step name for idempotency
      const sent = await step.run(`drip-${org.id}-day${trialDay}`, async () => {
        // Get the org owner's email
        const { data: user } = await supabase
          .from("users")
          .select("email")
          .eq("organization_id", org.id)
          .eq("role", "owner")
          .single();

        const userData = user as { email: string } | null;

        if (!userData?.email) {
          return { sent: false, reason: "No owner email" };
        }

        // Get primary site data for personalization
        const { data: sites } = await supabase
          .from("sites")
          .select("domain, total_citations, momentum_score, momentum_change")
          .eq("organization_id", org.id)
          .limit(1);

        const site = (sites?.[0] || null) as {
          domain: string;
          total_citations: number;
          momentum_score: number;
          momentum_change: number;
        } | null;

        const domain = site?.domain || null;
        const totalCitations = site?.total_citations || 0;
        const momentumChange = site?.momentum_change || 0;

        // Build the right email for this trial day
        let email: EmailTemplate;
        switch (trialDay) {
          case 0:
            email = day0Email(org.name, domain, totalCitations);
            break;
          case 2:
            email = day2Email(domain);
            break;
          case 4:
            email = day4Email(domain);
            break;
          case 6:
            email = day6Email(domain);
            break;
          case 7:
            email = day7Email(domain, momentumChange);
            break;
          default:
            return { sent: false, reason: "Not a drip day" };
        }

        // Send via Resend
        if (!process.env.RESEND_API_KEY) {
          console.error("[Trial Drip] RESEND_API_KEY not configured, skipping email");
          return { sent: false, reason: "RESEND_API_KEY not configured" };
        }
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);

        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || "CabbageSEO <hello@cabbageseo.com>",
          to: userData.email,
          subject: email.subject,
          html: email.html,
        });

        return { sent: true, day: trialDay, to: userData.email };
      });

      if (sent.sent) {
        emailsSent++;
      }
    }

    return {
      processed: orgs.length,
      emailsSent,
      skipped,
    };
  }
);

// Export all trial drip functions
export const trialDripFunctions = [trialDripEmail];
