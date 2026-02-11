/**
 * Monthly Checkpoint System — Inngest Cron Job
 *
 * Runs on the 1st of each month at 10 AM UTC.
 * For every active site:
 *   1. Calculates momentum score & month-over-month change
 *   2. Counts new vs lost citations compared to last month
 *   3. Generates a single recommended action
 *   5. Inserts a monthly_checkpoints record
 *   6. Sends a monthly report email via Resend
 */

import { inngest } from "./inngest-client";
import { createServiceClient } from "@/lib/supabase/server";

// ============================================
// HELPER: Build the monthly report email HTML
// ============================================
function buildReportEmail({
  domain,
  momentumScore,
  momentumChange,
  newCitationsCount,
  lastMonthCitationsCount,
  topAction,
  appUrl,
}: {
  domain: string;
  momentumScore: number;
  momentumChange: number;
  newCitationsCount: number;
  lastMonthCitationsCount: number;
  topAction: string;
  appUrl: string;
}): string {
  const trendArrow = momentumChange > 0 ? "↑" : momentumChange < 0 ? "↓" : "→";
  const trendColor = momentumChange > 0 ? "#10b981" : momentumChange < 0 ? "#ef4444" : "#a1a1aa";
  const citationDiff = newCitationsCount - lastMonthCitationsCount;
  const citationDiffLabel = citationDiff > 0 ? `+${citationDiff}` : `${citationDiff}`;
  const citationDiffColor = citationDiff >= 0 ? "#10b981" : "#ef4444";

  return `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #09090b; color: #fff;">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 16px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 30px;">📊</span>
        </div>
        <h1 style="font-size: 24px; margin: 0; color: #fff;">Monthly AI Visibility Report</h1>
        <p style="color: #71717a; margin-top: 8px;">${domain}</p>
      </div>

      <!-- Momentum Score -->
      <div style="background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 24px; margin-bottom: 20px; text-align: center;">
        <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #71717a; margin-bottom: 8px;">Momentum Score</div>
        <div style="font-size: 48px; font-weight: bold; color: #fff;">${momentumScore}</div>
        <div style="font-size: 18px; color: ${trendColor}; margin-top: 4px;">
          ${trendArrow} ${momentumChange > 0 ? "+" : ""}${momentumChange} from last month
        </div>
      </div>

      <!-- Citations This Month vs Last -->
      <div style="display: flex; gap: 12px; margin-bottom: 20px;">
        <div style="flex: 1; background: #18181b; padding: 16px; border-radius: 12px; text-align: center; border: 1px solid #27272a;">
          <div style="font-size: 28px; font-weight: bold; color: #fff;">${newCitationsCount}</div>
          <div style="font-size: 12px; color: #71717a;">Citations This Month</div>
        </div>
        <div style="flex: 1; background: ${citationDiff >= 0 ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)"}; padding: 16px; border-radius: 12px; text-align: center; border: 1px solid ${citationDiff >= 0 ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"};">
          <div style="font-size: 28px; font-weight: bold; color: ${citationDiffColor};">${citationDiffLabel}</div>
          <div style="font-size: 12px; color: #71717a;">vs Last Month</div>
        </div>
      </div>

      <!-- Recommended Action -->
      <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 16px; margin-bottom: 24px;">
        <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #10b981; margin-bottom: 8px;">Recommended Action</div>
        <p style="margin: 0; color: #fff; font-size: 14px; line-height: 1.5;">${topAction}</p>
      </div>

      <!-- CTA -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${appUrl}/dashboard"
           style="display: inline-block; background: #10b981; color: #000; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Open Dashboard →
        </a>
      </div>

      <hr style="border: none; border-top: 1px solid #27272a; margin: 30px 0;" />

      <p style="color: #71717a; font-size: 12px; text-align: center;">
        <a href="${appUrl}/settings/notifications" style="color: #10b981;">Manage email preferences</a>
        <br /><br />
        Powered by <a href="https://cabbageseo.com" style="color: #10b981;">CabbageSEO</a>
      </p>
    </div>
  `;
}

// ============================================
// MONTHLY CHECKPOINT — Inngest Cron
// ============================================
export const monthlyCheckpoint = inngest.createFunction(
  { id: "monthly-checkpoint", name: "Monthly Checkpoint Report", retries: 2 },
  { cron: "0 10 1 * *" }, // 1st of each month at 10 AM UTC
  async ({ step }) => {
    const supabase = createServiceClient();

    // Determine the period string for this checkpoint (previous month)
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const period = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, "0")}`;

    // Also compute the period before that for comparison
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const prevPeriod = `${twoMonthsAgo.getFullYear()}-${String(twoMonthsAgo.getMonth() + 1).padStart(2, "0")}`;

    // 1. Get all active sites with their organizations (paid plans only)
    const allSites = await step.run("get-active-sites", async () => {
      const { data, error } = await supabase
        .from("sites")
        .select(`
          id, domain, organization_id, momentum_score, momentum_change, total_citations,
          organizations!inner(plan)
        `)
        .eq("status", "active");

      if (error) {
        console.error("Failed to fetch sites:", error);
        return [];
      }
      return (data || []) as Array<{
        id: string;
        domain: string;
        organization_id: string;
        momentum_score: number | null;
        momentum_change: number | null;
        total_citations: number | null;
        organizations: { plan: string };
      }>;
    });

    // Resolve legacy plan names and filter out free-tier
    const legacyMap: Record<string, string> = { starter: "scout", pro: "command", pro_plus: "dominate" };
    const sites = allSites.filter((s) => {
      const plan = legacyMap[s.organizations?.plan] || s.organizations?.plan || "free";
      return plan !== "free";
    });

    if (sites.length === 0) {
      return { processed: 0, message: "No active paid sites" };
    }

    let checkpointsCreated = 0;
    let emailsSent = 0;

    for (const site of sites) {
      // 2. Calculate monthly stats for this site
      const stats = await step.run(`stats-${site.id}`, async () => {
        // --- Citations this month ---
        const thisMonthStart = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1).toISOString();
        const thisMonthEnd = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0, 23, 59, 59).toISOString();

        const { count: newCitationsCount } = await supabase
          .from("citations")
          .select("id", { count: "exact", head: true })
          .eq("site_id", site.id)
          .gte("cited_at", thisMonthStart)
          .lte("cited_at", thisMonthEnd);

        // --- Citations previous month ---
        const prevMonthStart = new Date(twoMonthsAgo.getFullYear(), twoMonthsAgo.getMonth(), 1).toISOString();
        const prevMonthEnd = new Date(twoMonthsAgo.getFullYear(), twoMonthsAgo.getMonth() + 1, 0, 23, 59, 59).toISOString();

        const { count: lastMonthCitationsCount } = await supabase
          .from("citations")
          .select("id", { count: "exact", head: true })
          .eq("site_id", site.id)
          .gte("cited_at", prevMonthStart)
          .lte("cited_at", prevMonthEnd);

        // --- New queries this month (unique queries that are new) ---
        const { data: thisMonthCitations } = await supabase
          .from("citations")
          .select("query")
          .eq("site_id", site.id)
          .gte("cited_at", thisMonthStart)
          .lte("cited_at", thisMonthEnd);

        const { data: prevMonthCitations } = await supabase
          .from("citations")
          .select("query")
          .eq("site_id", site.id)
          .gte("cited_at", prevMonthStart)
          .lte("cited_at", prevMonthEnd);

        const thisMonthQueries = new Set((thisMonthCitations || []).map((c: { query: string }) => c.query));
        const prevMonthQueries = new Set((prevMonthCitations || []).map((c: { query: string }) => c.query));

        const newQueries = [...thisMonthQueries].filter((q) => !prevMonthQueries.has(q));
        const lostQueries = [...prevMonthQueries].filter((q) => !thisMonthQueries.has(q));

        // --- Momentum ---
        const momentumScore = site.momentum_score || 0;
        // Compute month-over-month change from previous checkpoint
        const { data: prevCheckpoint } = await supabase
          .from("monthly_checkpoints")
          .select("momentum_score")
          .eq("site_id", site.id)
          .eq("period", prevPeriod)
          .maybeSingle();

        const prevMomentum = (prevCheckpoint as { momentum_score: number | null } | null)?.momentum_score || 0;
        const momentumChange = momentumScore - prevMomentum;

        // --- Top action ---
        let topAction = "Review your AI visibility dashboard and address any gaps in citation coverage.";
        if ((newCitationsCount || 0) === 0) {
          topAction = "You received no new citations this month. Focus on getting listed on authority sources like G2, Capterra, or Product Hunt.";
        } else if (lostQueries.length > newQueries.length) {
          topAction = `You lost ${lostQueries.length} queries this month. Update your content to stay relevant for those topics.`;
        } else if ((newCitationsCount || 0) > (lastMonthCitationsCount || 0)) {
          topAction = "Momentum is building! Double down on what's working — publish more content and earn reviews.";
        }

        return {
          newCitationsCount: newCitationsCount || 0,
          lastMonthCitationsCount: lastMonthCitationsCount || 0,
          newQueries,
          lostQueries,
          momentumScore,
          momentumChange,
          topAction,
        };
      });

      // 3. Insert the checkpoint record
      await step.run(`insert-checkpoint-${site.id}`, async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase.from("monthly_checkpoints") as any).upsert(
          {
            site_id: site.id,
            organization_id: site.organization_id,
            period,
            momentum_score: stats.momentumScore,
            momentum_change: stats.momentumChange,
            new_queries: stats.newQueries,
            lost_queries: stats.lostQueries,
            top_action: stats.topAction,
            report_data: {
              newCitationsCount: stats.newCitationsCount,
              lastMonthCitationsCount: stats.lastMonthCitationsCount,
            },
          },
          { onConflict: "site_id,period" }
        );

        if (error) {
          console.error(`Failed to insert checkpoint for site ${site.id}:`, error);
          throw error;
        }

        checkpointsCreated++;
      });

      // 4. Send email
      const emailResult = await step.run(`email-${site.id}`, async () => {
        // Get owner email
        const { data: owner } = await supabase
          .from("users")
          .select("email")
          .eq("organization_id", site.organization_id)
          .eq("role", "owner")
          .single();

        const ownerData = owner as { email: string } | null;
        if (!ownerData?.email) {
          return { sent: false, reason: "No owner email" };
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://cabbageseo.com";

        if (!process.env.RESEND_API_KEY) {
          console.error("[Monthly Checkpoint] RESEND_API_KEY not configured, skipping email");
          return { sent: false, reason: "RESEND_API_KEY not configured" };
        }
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);

        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || "CabbageSEO <hello@cabbageseo.com>",
          to: ownerData.email,
          subject: `📊 Monthly AI Visibility Report — ${site.domain}`,
          html: buildReportEmail({
            domain: site.domain,
            momentumScore: stats.momentumScore,
            momentumChange: stats.momentumChange,
            newCitationsCount: stats.newCitationsCount,
            lastMonthCitationsCount: stats.lastMonthCitationsCount,
            topAction: stats.topAction,
            appUrl,
          }),
        });

        // Mark email sent
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from("monthly_checkpoints") as any)
          .update({ email_sent_at: new Date().toISOString() })
          .eq("site_id", site.id)
          .eq("period", period);

        return { sent: true, to: ownerData.email };
      });

      if (emailResult.sent) {
        emailsSent++;
      }

      // Rate-limit between sites
      await step.sleep(`site-delay-${site.id}`, "1s");
    }

    return {
      processed: sites.length,
      checkpointsCreated,
      emailsSent,
      period,
    };
  }
);

// Export for Inngest registration
export const monthlyCheckpointFunctions = [monthlyCheckpoint];
