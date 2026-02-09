/**
 * Teaser Subscriber Drip Email Campaign — Inngest Cron Job
 *
 * Sends nurture emails to free teaser subscribers (NOT paid trial users).
 * These are people who entered their email on a teaser report page.
 *
 * Schedule:
 *   Day 0: Score recap + what it means
 *   Day 2: Competitor fear — "they're gaining ground"
 *   Day 5: Action preview — what we'd do for you
 *
 * Weekly rescan emails are handled separately by weeklyTeaserRescan.
 * Runs daily at 9 AM UTC.
 */

import { inngest } from "./inngest-client";
import { createServiceClient } from "@/lib/supabase/server";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://cabbageseo.com";

// ============================================
// HELPERS
// ============================================

function emailLayout(content: string, email: string, domain: string): string {
  return `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background: #09090b; color: #fff;">
      ${content}
      <hr style="border: none; border-top: 1px solid #27272a; margin: 30px 0;" />
      <p style="text-align: center; color: #3f3f46; font-size: 11px;">
        <a href="${APP_URL}/api/teaser/unsubscribe?email=${encodeURIComponent(email)}&domain=${encodeURIComponent(domain)}" style="color: #3f3f46; text-decoration: underline;">
          Unsubscribe
        </a>
        &nbsp;&bull;&nbsp;
        Powered by <a href="https://cabbageseo.com" style="color: #10b981; text-decoration: none;">CabbageSEO</a>
      </p>
    </div>
  `;
}

function ctaButton(text: string, href: string): string {
  return `
    <div style="text-align: center; margin: 24px 0;">
      <a href="${href}"
         style="display: inline-block; background: #10b981; color: #000; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 15px;">
        ${text}
      </a>
    </div>
  `;
}

// ============================================
// EMAIL TEMPLATES
// ============================================

interface SubscriberReport {
  domain: string;
  visibilityScore: number;
  isInvisible: boolean;
  competitorsMentioned: string[];
}

function day0Email(report: SubscriberReport, email: string): { subject: string; html: string } {
  const scoreColor = report.isInvisible ? "#ef4444" : report.visibilityScore < 40 ? "#f59e0b" : "#10b981";
  const competitorList = (report.competitorsMentioned || []).slice(0, 3);

  return {
    subject: report.isInvisible
      ? `${report.domain} is invisible to AI — here's what that means`
      : `${report.domain}: AI visibility score ${report.visibilityScore}/100`,
    html: emailLayout(`
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="font-size: 22px; margin: 0; color: #fff;">Your AI Visibility Report</h1>
        <p style="color: #71717a; margin-top: 4px;">${report.domain}</p>
      </div>

      <div style="text-align: center; padding: 28px; background: #18181b; border-radius: 16px; border: 1px solid #27272a; margin-bottom: 20px;">
        <div style="font-size: 56px; font-weight: 900; color: ${scoreColor}; line-height: 1;">${report.visibilityScore}</div>
        <div style="font-size: 14px; color: #71717a; margin-top: 4px;">AI Visibility Score</div>
      </div>

      ${report.isInvisible ? `
        <div style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 12px; padding: 16px; margin-bottom: 20px;">
          <p style="margin: 0; color: #fca5a5; font-size: 14px; line-height: 1.6;">
            <strong>What this means:</strong> When buyers ask ChatGPT, Perplexity, or Google AI for recommendations in your space, ${report.domain} doesn't come up. Every unanswered query is a customer going to a competitor.
          </p>
        </div>
      ` : `
        <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
          AI mentions ${report.domain} in some queries — but there's room to grow. ${competitorList.length > 0 ? `AI is also recommending ${competitorList.join(", ")} in your space.` : ""}
        </p>
      `}

      ${competitorList.length > 0 ? `
        <div style="margin-bottom: 20px;">
          <p style="color: #71717a; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">AI recommends instead:</p>
          ${competitorList.map(c => `
            <div style="padding: 10px 14px; background: rgba(239, 68, 68, 0.05); border-left: 3px solid #ef4444; margin-bottom: 6px; border-radius: 0 8px 8px 0;">
              <span style="color: #fca5a5; font-size: 14px; font-weight: 500;">${c}</span>
            </div>
          `).join("")}
        </div>
      ` : ""}

      <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6;">
        We'll rescan ${report.domain} every week and email you when your score changes. Want to actively improve it?
      </p>

      ${ctaButton("Start fixing your AI visibility →", `${APP_URL}/signup?domain=${encodeURIComponent(report.domain)}`)}

      <p style="text-align: center; color: #52525b; font-size: 12px;">
        Free 7-day trial &bull; No credit card required
      </p>
    `, email, report.domain),
  };
}

function day2Email(report: SubscriberReport, email: string): { subject: string; html: string } {
  const competitorList = (report.competitorsMentioned || []).slice(0, 3);

  return {
    subject: `While you wait, ${report.domain}'s competitors are gaining ground`,
    html: emailLayout(`
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="font-size: 22px; margin: 0; color: #fff;">Your competitors aren't waiting</h1>
        <p style="color: #71717a; margin-top: 4px;">${report.domain}</p>
      </div>

      <div style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
        <p style="margin: 0; color: #fca5a5; font-size: 14px; line-height: 1.6;">
          Since your scan 2 days ago, buyers have been asking AI for product recommendations in your category. Every time AI answers — and mentions a competitor instead of ${report.domain} — that's a customer you'll never know you lost.
        </p>
      </div>

      ${competitorList.length > 0 ? `
        <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6; margin-bottom: 16px;">
          These companies are already getting recommended by AI:
        </p>
        <div style="margin-bottom: 20px;">
          ${competitorList.map(c => `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: #18181b; border: 1px solid #27272a; border-radius: 10px; margin-bottom: 6px;">
              <span style="color: #fff; font-size: 14px; font-weight: 600;">${c}</span>
              <span style="color: #ef4444; font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Winning</span>
            </div>
          `).join("")}
        </div>
      ` : `
        <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
          The gap between brands AI recommends and brands it ignores is growing every day. Getting in early matters.
        </p>
      `}

      <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6;">
        The good news? Most companies haven't started optimizing for AI visibility yet. <strong style="color: #fff;">If you start now, you'll have a massive head start.</strong>
      </p>

      ${ctaButton("Start your 30-day sprint →", `${APP_URL}/signup?domain=${encodeURIComponent(report.domain)}`)}

      <p style="text-align: center; color: #52525b; font-size: 12px;">
        Free 7-day trial &bull; We build the action plan for you
      </p>
    `, email, report.domain),
  };
}

function day5Email(report: SubscriberReport, email: string): { subject: string; html: string } {
  return {
    subject: `Here's exactly what we'd do for ${report.domain}`,
    html: emailLayout(`
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="font-size: 22px; margin: 0; color: #fff;">Your custom action plan is ready</h1>
        <p style="color: #71717a; margin-top: 4px;">${report.domain}</p>
      </div>

      <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
        Based on your scan, here's a preview of what CabbageSEO would do for ${report.domain} in the first 30 days:
      </p>

      <div style="margin-bottom: 24px;">
        <div style="padding: 14px 16px; background: rgba(16, 185, 129, 0.06); border: 1px solid rgba(16, 185, 129, 0.15); border-radius: 12px; margin-bottom: 8px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="color: #10b981; font-size: 18px; font-weight: 700;">1</span>
            <div>
              <p style="margin: 0; color: #fff; font-size: 14px; font-weight: 600;">Generate AI-optimized comparison pages</p>
              <p style="margin: 2px 0 0; color: #71717a; font-size: 12px;">"${report.domain} vs [competitor]" pages that AI can cite</p>
            </div>
          </div>
        </div>

        <div style="padding: 14px 16px; background: rgba(16, 185, 129, 0.06); border: 1px solid rgba(16, 185, 129, 0.15); border-radius: 12px; margin-bottom: 8px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="color: #10b981; font-size: 18px; font-weight: 700;">2</span>
            <div>
              <p style="margin: 0; color: #fff; font-size: 14px; font-weight: 600;">Get listed on trust sources AI checks first</p>
              <p style="margin: 2px 0 0; color: #71717a; font-size: 12px;">G2, Capterra, Product Hunt — the directories AI crawls</p>
            </div>
          </div>
        </div>

        <div style="padding: 14px 16px; background: rgba(16, 185, 129, 0.06); border: 1px solid rgba(16, 185, 129, 0.15); border-radius: 12px; margin-bottom: 8px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="color: #10b981; font-size: 18px; font-weight: 700;">3</span>
            <div>
              <p style="margin: 0; color: #fff; font-size: 14px; font-weight: 600;">Monitor daily + send competitor alerts</p>
              <p style="margin: 2px 0 0; color: #71717a; font-size: 12px;">Track score changes and get notified when competitors gain citations</p>
            </div>
          </div>
        </div>

        <div style="padding: 14px 16px; background: rgba(16, 185, 129, 0.06); border: 1px solid rgba(16, 185, 129, 0.15); border-radius: 12px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="color: #10b981; font-size: 18px; font-weight: 700;">4</span>
            <div>
              <p style="margin: 0; color: #fff; font-size: 14px; font-weight: 600;">Build authority gaps competitors exploit</p>
              <p style="margin: 2px 0 0; color: #71717a; font-size: 12px;">Backlinks, roundup posts, expert mentions — targeted to your niche</p>
            </div>
          </div>
        </div>
      </div>

      <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6;">
        This isn't a checklist you do yourself. <strong style="color: #fff;">We generate the content, build the action plan, and track your progress automatically.</strong>
      </p>

      ${ctaButton("Get your full action plan →", `${APP_URL}/signup?domain=${encodeURIComponent(report.domain)}`)}

      <p style="text-align: center; color: #52525b; font-size: 12px;">
        Free 7-day trial &bull; Cancel anytime
      </p>
    `, email, report.domain),
  };
}

// ============================================
// MAIN CRON JOB
// ============================================

export const teaserDripEmail = inngest.createFunction(
  { id: "teaser-drip-email", name: "Teaser Subscriber Drip", retries: 2 },
  { cron: "0 9 * * *" }, // Daily at 9 AM UTC
  async ({ step }) => {
    const supabase = createServiceClient();

    // Get all active teaser subscribers
    const subscribers = await step.run("get-subscribers", async () => {
      const { data } = await supabase
        .from("teaser_subscribers")
        .select("id, email, domain, report_id, created_at")
        .eq("unsubscribed", false);
      return (data || []) as Array<{
        id: string;
        email: string;
        domain: string;
        report_id: string | null;
        created_at: string;
      }>;
    });

    if (subscribers.length === 0) {
      return { processed: 0, message: "No active teaser subscribers" };
    }

    let emailsSent = 0;
    let skipped = 0;

    for (const sub of subscribers) {
      // Calculate days since subscription
      const subscribedAt = new Date(sub.created_at);
      const now = new Date();
      const daysSince = Math.floor(
        (now.getTime() - subscribedAt.getTime()) / (24 * 60 * 60 * 1000)
      );

      // Only send on specific days
      if (![0, 2, 5].includes(daysSince)) {
        continue;
      }

      const sent = await step.run(`drip-${sub.id}-day${daysSince}`, async () => {
        // Check if this subscriber has already signed up for a paid account
        // (by checking if their email exists in the users table)
        const { data: existingUser } = await supabase
          .from("users")
          .select("id")
          .eq("email", sub.email)
          .limit(1);

        if (existingUser && existingUser.length > 0) {
          return { sent: false, reason: "Already signed up" };
        }

        // Get the original report for context
        let report: SubscriberReport = {
          domain: sub.domain,
          visibilityScore: 0,
          isInvisible: true,
          competitorsMentioned: [],
        };

        if (sub.report_id) {
          const { data: reportData } = await supabase
            .from("teaser_reports")
            .select("domain, visibility_score, is_invisible, competitors_mentioned")
            .eq("id", sub.report_id)
            .limit(1);

          if (reportData?.[0]) {
            const r = reportData[0] as {
              domain: string;
              visibility_score: number;
              is_invisible: boolean;
              competitors_mentioned: string[];
            };
            report = {
              domain: r.domain,
              visibilityScore: r.visibility_score,
              isInvisible: r.is_invisible,
              competitorsMentioned: r.competitors_mentioned || [],
            };
          }
        }

        // Build the right email for this day
        let email: { subject: string; html: string };
        switch (daysSince) {
          case 0:
            email = day0Email(report, sub.email);
            break;
          case 2:
            email = day2Email(report, sub.email);
            break;
          case 5:
            email = day5Email(report, sub.email);
            break;
          default:
            return { sent: false, reason: "Not a drip day" };
        }

        // Send via Resend
        if (!process.env.RESEND_API_KEY) {
          console.error("[Teaser Drip] RESEND_API_KEY not configured, skipping email");
          return { sent: false, reason: "RESEND_API_KEY not configured" };
        }
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);

        await resend.emails.send({
          from: "CabbageSEO <hello@cabbageseo.com>",
          to: sub.email,
          subject: email.subject,
          html: email.html,
        });

        return { sent: true, day: daysSince, to: sub.email };
      });

      if (sent.sent) {
        emailsSent++;
      } else {
        skipped++;
      }
    }

    return { processed: subscribers.length, emailsSent, skipped };
  }
);

// Export all teaser drip functions
export const teaserDripFunctions = [teaserDripEmail];
