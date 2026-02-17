/**
 * Visibility Alert Blast Email
 *
 * POST /api/admin/founding-blast
 *
 * Sends a one-time personalized email to all active teaser subscribers
 * showing their score and urging them to take action.
 * Protected by ADMIN_SECRET header.
 *
 * Usage: curl -X POST https://cabbageseo.com/api/admin/founding-blast \
 *   -H "Authorization: Bearer $ADMIN_SECRET"
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://cabbageseo.com";

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

function alertEmail(domain: string, score: number, email: string): { subject: string; html: string } {
  const scoreColor = score === 0 ? "#ef4444" : score < 40 ? "#f59e0b" : "#10b981";
  const isInvisible = score < 15;

  return {
    subject: isInvisible
      ? `${domain}: AI doesn't know you exist (score: ${score}/100)`
      : `${domain}: your AI visibility score is ${score}/100 — here's what to do`,
    html: emailLayout(`
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="display: inline-block; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 999px; padding: 6px 16px; margin-bottom: 12px;">
          <span style="color: #fca5a5; font-size: 13px; font-weight: 700;">AI VISIBILITY ALERT</span>
        </div>
        <h1 style="font-size: 24px; margin: 0; color: #fff; line-height: 1.3;">
          ${isInvisible
            ? `When buyers ask AI about your space, ${domain} doesn't come up.`
            : `AI mentions ${domain} sometimes — but you're leaving revenue on the table.`
          }
        </h1>
      </div>

      <div style="text-align: center; padding: 20px; background: #18181b; border-radius: 16px; border: 1px solid #27272a; margin-bottom: 20px;">
        <p style="color: #71717a; font-size: 12px; margin: 0 0 8px;">Your AI Visibility Score</p>
        <div style="font-size: 48px; font-weight: 900; color: ${scoreColor}; line-height: 1;">${score}</div>
        <div style="font-size: 13px; color: #71717a; margin-top: 4px;">out of 100</div>
      </div>

      ${isInvisible ? `
        <div style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 12px; padding: 16px; margin-bottom: 20px;">
          <p style="margin: 0; color: #fca5a5; font-size: 14px; line-height: 1.6;">
            <strong>This means zero AI-driven traffic.</strong> When buyers ask ChatGPT, Perplexity, or Google AI about your space, they get recommended your competitors instead. Every day this continues, you lose potential customers you'll never know about.
          </p>
        </div>
      ` : `
        <div style="background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 12px; padding: 16px; margin-bottom: 20px;">
          <p style="margin: 0; color: #fcd34d; font-size: 14px; line-height: 1.6;">
            AI mentions ${domain} in some queries — but there are gaps. CabbageSEO finds the exact queries where you should appear but don't, then generates the pages to fix it.
          </p>
        </div>
      `}

      <div style="background: #18181b; border: 1px solid #27272a; border-radius: 16px; padding: 20px; margin-bottom: 24px;">
        <p style="color: #10b981; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px; text-align: center;">
          What CabbageSEO does for you
        </p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #27272a;">
              <span style="color: #10b981; font-weight: 700;">Daily scans</span>
              <p style="color: #71717a; font-size: 12px; margin: 2px 0 0;">Track what ChatGPT, Perplexity & Google AI say about you</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #27272a;">
              <span style="color: #10b981; font-weight: 700;">Auto fix pages</span>
              <p style="color: #71717a; font-size: 12px; margin: 2px 0 0;">AI writes pages structured to earn citations where you're missing</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #27272a;">
              <span style="color: #10b981; font-weight: 700;">Gap analysis</span>
              <p style="color: #71717a; font-size: 12px; margin: 2px 0 0;">Know exactly why AI isn't citing you and what to publish next</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0;">
              <span style="color: #10b981; font-weight: 700;">Drop alerts</span>
              <p style="color: #71717a; font-size: 12px; margin: 2px 0 0;">Know immediately if you disappear from an AI answer</p>
            </td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; margin: 24px 0;">
        <a href="${APP_URL}/signup?domain=${encodeURIComponent(domain)}&score=${score}"
           style="display: inline-block; background: #10b981; color: #000; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 800; font-size: 16px;">
          Start fixing my AI visibility →
        </a>
      </div>

      <p style="text-align: center; color: #71717a; font-size: 12px;">
        From $39/mo &bull; 14-day money-back guarantee &bull; Cancel anytime
      </p>
    `, email, domain),
  };
}

export async function POST(request: NextRequest) {
  // Auth check
  const authHeader = request.headers.get("authorization");
  const adminSecret = process.env.ADMIN_SECRET;

  if (!adminSecret || authHeader !== `Bearer ${adminSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 500 });
  }

  try {
    const supabase = createServiceClient();

    // Get all active teaser subscribers
    const { data: rawSubscribers, error: subErr } = await supabase
      .from("teaser_subscribers")
      .select("id, email, domain, report_id")
      .eq("unsubscribed", false);

    if (subErr) throw subErr;
    const subscribers = (rawSubscribers || []) as Array<{
      id: string;
      email: string;
      domain: string;
      report_id: string | null;
    }>;
    if (subscribers.length === 0) {
      return NextResponse.json({ sent: 0, message: "No active subscribers" });
    }

    // Get scores for each subscriber's domain
    const domains = [...new Set(subscribers.map(s => s.domain))];
    const { data: rawReports } = await supabase
      .from("teaser_reports")
      .select("domain, visibility_score")
      .in("domain", domains)
      .order("created_at", { ascending: false });

    const reports = (rawReports || []) as Array<{
      domain: string;
      visibility_score: number | null;
    }>;

    // Build domain → score map (latest score per domain)
    const scoreMap: Record<string, number> = {};
    for (const r of reports) {
      if (!(r.domain in scoreMap)) {
        scoreMap[r.domain] = r.visibility_score ?? 0;
      }
    }

    // Send emails via Resend (batch)
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    const fromEmail = process.env.RESEND_FROM_EMAIL || "CabbageSEO <hello@cabbageseo.com>";

    let sent = 0;
    let failed = 0;

    // Send in batches of 10 to avoid rate limits
    for (let i = 0; i < subscribers.length; i += 10) {
      const batch = subscribers.slice(i, i + 10);

      const results = await Promise.allSettled(
        batch.map(async (sub) => {
          const score = scoreMap[sub.domain] ?? 0;
          const email = alertEmail(sub.domain, score, sub.email);

          await resend.emails.send({
            from: fromEmail,
            to: sub.email,
            subject: email.subject,
            html: email.html,
          });
        })
      );

      for (const r of results) {
        if (r.status === "fulfilled") sent++;
        else failed++;
      }

      // Brief pause between batches
      if (i + 10 < subscribers.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return NextResponse.json({
      sent,
      failed,
      total: subscribers.length,
      message: `Visibility alert blast sent to ${sent} subscribers (${failed} failed)`,
    });
  } catch (error) {
    console.error("[Visibility Blast] Error:", error);
    return NextResponse.json({ error: "Failed to send blast" }, { status: 500 });
  }
}
