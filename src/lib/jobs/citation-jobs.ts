/**
 * AI Visibility Intelligence - Inngest Jobs
 * 
 * AUTOMATED CITATION TRACKING
 * - Daily checks for all users
 * - Hourly checks for Pro users  
 * - Weekly reports
 * - Alert emails
 * 
 * These jobs run automatically via Inngest.
 * NO MOCK DATA - Real API calls only.
 */

import { inngest } from "./inngest-client";
import { createServiceClient } from "@/lib/supabase/server";

// ============================================
// HELPER: Run citation check for a site
// ============================================
async function runCitationCheck(siteId: string, domain: string): Promise<{
  success: boolean;
  citedCount: number;
  results: Array<{
    platform: string;
    cited: boolean;
    error?: string;
  }>;
}> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : "http://localhost:3000";

  try {
    // Call our own API endpoint
    const response = await fetch(`${baseUrl}/api/geo/citations/check`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Use service role for automated jobs
        "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ siteId, domain }),
    });

    if (!response.ok) {
      console.error(`Citation check failed for ${domain}: ${response.status}`);
      return { success: false, citedCount: 0, results: [] };
    }

    const data = await response.json();
    return {
      success: true,
      citedCount: data.summary?.citedCount || 0,
      results: data.results || [],
    };
  } catch (error) {
    console.error(`Citation check error for ${domain}:`, error);
    return { success: false, citedCount: 0, results: [] };
  }
}

// ============================================
// DAILY CITATION CHECK (All Users)
// Runs every day at 10 AM UTC
// ============================================
export const dailyCitationCheck = inngest.createFunction(
  {
    id: "daily-citation-check",
    name: "Daily Citation Check (All Users)",
    retries: 2,
  },
  { cron: "0 10 * * *" },
  async ({ step }) => {
    const supabase = createServiceClient();

    // Get all active sites with their org plan for plan-tiered filtering
    const allSites = await step.run("get-active-sites", async () => {
      const { data, error } = await supabase
        .from("sites")
        .select(`
          id,
          domain,
          organization_id,
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
        organizations: { plan: string };
      }>;
    });

    // Plan-tiered filtering:
    // - free: skip entirely
    // - scout: Mondays only (day 1)
    // - command: every 3 days (dayOfYear % 3 === 0)
    // - dominate: daily
    const now = new Date();
    const utcDay = now.getUTCDay(); // 0=Sun, 1=Mon, ...
    const startOfYear = new Date(Date.UTC(now.getUTCFullYear(), 0, 0));
    const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / 86400000);

    const sites = allSites.filter((site) => {
      const plan = site.organizations?.plan || "free";
      if (plan === "free") return false;
      if (plan === "scout") return utcDay === 1; // Monday only
      if (plan === "command") return dayOfYear % 3 === 0; // Every 3 days
      return true; // dominate = daily
    }).map((site) => ({
      id: site.id,
      domain: site.domain,
      organization_id: site.organization_id,
    }));

    if (sites.length === 0) {
      return { checked: 0, message: "No eligible sites to check today" };
    }

    const results = [];
    let totalNewCitations = 0;

    // Check each site (in sequence to avoid rate limits)
    for (const site of sites) {
      const result = await step.run(`check-${site.id}`, async () => {
        const checkResult = await runCitationCheck(site.id, site.domain);

        // If new citations found, trigger alert
        if (checkResult.citedCount > 0) {
          await inngest.send({
            name: "citation/new.detected",
            data: {
              siteId: site.id,
              domain: site.domain,
              organizationId: site.organization_id,
              newCitations: checkResult.citedCount,
              platforms: checkResult.results.filter(r => r.cited).map(r => r.platform),
            },
          });
        }

        return {
          siteId: site.id,
          domain: site.domain,
          success: checkResult.success,
          newCitations: checkResult.citedCount,
        };
      });

      results.push(result);
      if (result.newCitations > 0) {
        totalNewCitations += result.newCitations;
      }

      // Visibility drop detection: compare queries_won in 2 most recent snapshots
      await step.run(`drop-check-${site.id}`, async () => {
        const { data: snapshots } = await supabase
          .from("market_share_snapshots")
          .select("queries_won, snapshot_date")
          .eq("site_id", site.id)
          .order("snapshot_date", { ascending: false })
          .limit(2);

        const snaps = (snapshots || []) as Array<{ queries_won: number | null; snapshot_date: string }>;
        if (snaps.length < 2) return;

        const current = snaps[0].queries_won || 0;
        const previous = snaps[1].queries_won || 0;
        const drop = previous - current;

        if (drop >= 2) {
          await inngest.send({
            name: "visibility/drop.detected",
            data: {
              siteId: site.id,
              domain: site.domain,
              organizationId: site.organization_id,
              previousScore: previous,
              newScore: current,
              drop,
            },
          });
        }
      });

      // Small delay between checks to avoid rate limits
      await step.sleep(`rate-limit-delay-${site.id}`, "2s");
    }

    // ============================================
    // COMPETITOR CHANGE DETECTION
    // After checking all sites, look for competitor changes
    // and emit events for sites whose competitors gained citations
    // ============================================
    const competitorAlerts = await step.run("detect-competitor-changes", async () => {
      const alerts: Array<{ siteId: string; domain: string; orgId: string; competitorDomain: string; newCitations: number; change: number }> = [];

      for (const site of sites) {
        // Get competitors for this site
        const { data: competitors } = await supabase
          .from("competitors")
          .select("id, domain, total_citations, citations_change")
          .eq("site_id", site.id);

        const competitorList = (competitors || []) as Array<{
          id: string;
          domain: string;
          total_citations: number | null;
          citations_change: number | null;
        }>;

        for (const comp of competitorList) {
          const change = comp.citations_change || 0;
          if (change > 0) {
            alerts.push({
              siteId: site.id,
              domain: site.domain,
              orgId: site.organization_id,
              competitorDomain: comp.domain,
              newCitations: comp.total_citations || 0,
              change,
            });
          }
        }
      }

      return alerts;
    });

    // Send competitor change events
    for (const alert of competitorAlerts) {
      await step.run(`competitor-alert-${alert.siteId}-${alert.competitorDomain}`, async () => {
        await inngest.send({
          name: "competitor/change.detected",
          data: {
            siteId: alert.siteId,
            domain: alert.domain,
            organizationId: alert.orgId,
            competitorDomain: alert.competitorDomain,
            newCitations: alert.newCitations,
            change: alert.change,
          },
        });
      });

      await step.sleep(`competitor-alert-delay-${alert.competitorDomain}`, "500ms");
    }

    return {
      checked: sites.length,
      successful: results.filter(r => r.success).length,
      totalNewCitations,
      competitorAlertsSent: competitorAlerts.length,
      results,
    };
  }
);

// ============================================
// HOURLY CITATION CHECK (Paid Plans)
// Runs every hour for Command/Dominate plans
// ============================================
export const hourlyCitationCheck = inngest.createFunction(
  {
    id: "hourly-citation-check",
    name: "Hourly Citation Check (Paid)",
    retries: 1,
  },
  { cron: "0 * * * *" },
  async ({ step }) => {
    const supabase = createServiceClient();

    // Get sites from Command/Dominate organizations
    const sites = await step.run("get-paid-sites", async () => {
      const { data, error } = await supabase
        .from("sites")
        .select(`
          id, 
          domain, 
          organization_id,
          organizations!inner(plan)
        `)
        .eq("status", "active")
        .in("organizations.plan", ["command", "dominate"]);
      
      if (error) {
        console.error("Failed to fetch paid sites:", error);
        return [];
      }
      return (data || []) as Array<{ id: string; domain: string; organization_id: string }>;
    });

    if (sites.length === 0) {
      return { checked: 0, message: "No paid sites to check" };
    }

    const results = [];

    for (const site of sites) {
      const result = await step.run(`check-paid-${site.id}`, async () => {
        const checkResult = await runCitationCheck(site.id, site.domain);
        
        if (checkResult.citedCount > 0) {
          await inngest.send({
            name: "citation/new.detected",
            data: {
              siteId: site.id,
              domain: site.domain,
              organizationId: site.organization_id,
              newCitations: checkResult.citedCount,
              platforms: checkResult.results.filter(r => r.cited).map(r => r.platform),
            },
          });
        }

        return {
          siteId: site.id,
          domain: site.domain,
          newCitations: checkResult.citedCount,
        };
      });

      results.push(result);
      await step.sleep("rate-limit", "1s");
    }

    return {
      checked: sites.length,
      results,
    };
  }
);

// ============================================
// CITATION ALERT EMAIL
// Triggered when new citations are detected
// ============================================
export const sendCitationAlert = inngest.createFunction(
  {
    id: "send-citation-alert",
    name: "Send Citation Alert Email",
    retries: 3,
  },
  { event: "citation/new.detected" },
  async ({ event, step }) => {
    const { siteId, domain, organizationId, newCitations, platforms } = event.data;
    
    const supabase = createServiceClient();

    // Get user email
    const userEmail = await step.run("get-user-email", async () => {
      const { data } = await supabase
        .from("users")
        .select("email, notification_settings")
        .eq("organization_id", organizationId)
        .eq("role", "owner")
        .single();
      
      return data as { email: string; notification_settings?: Record<string, boolean> } | null;
    });

    if (!userEmail?.email) {
      return { sent: false, reason: "No email found" };
    }

    // Check if user wants citation alerts
    const settings = userEmail.notification_settings || {} as Record<string, boolean>;
    if (settings.citationAlerts === false) {
      return { sent: false, reason: "Alerts disabled" };
    }

    // Send the email - FEAR + ACTION copy
    await step.run("send-email", async () => {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);

      const platformList = platforms.join(", ");

      await resend.emails.send({
        from: "CabbageSEO <alerts@cabbageseo.com>",
        to: userEmail.email,
        subject: `⚔️ You just won a battle: ${domain} is being cited!`,
        html: `
          <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #09090b; color: #fff;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 16px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 30px;">🏆</span>
              </div>
              <h1 style="font-size: 24px; margin: 0; color: #fff;">You Won This One!</h1>
            </div>
            
            <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <p style="margin: 0; color: #10b981; font-size: 16px;">
                <strong>${domain}</strong> was just cited by <strong>${platformList}</strong>
              </p>
            </div>
            
            <p style="color: #a1a1aa; line-height: 1.6;">
              ${newCitations} new citation${newCitations > 1 ? "s" : ""} detected. AI is recommending you to users asking questions in your industry.
            </p>
            
            <p style="color: #a1a1aa; line-height: 1.6; margin-top: 16px;">
              <strong style="color: #fff;">But are you winning everywhere?</strong> Check your dashboard to see other battles you might be losing.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
                 style="display: inline-block; background: #10b981; color: #000; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                See All Battles →
              </a>
            </div>
            
            <div style="background: #18181b; border-radius: 8px; padding: 16px; margin: 24px 0; text-align: center;">
              <p style="color: #a1a1aa; font-size: 13px; margin: 0 0 8px;">
                🎉 Share this win!
              </p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/ai-profile/${encodeURIComponent(domain)}" 
                 style="color: #10b981; font-size: 12px; word-break: break-all;">
                ${process.env.NEXT_PUBLIC_APP_URL}/ai-profile/${encodeURIComponent(domain)}
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #27272a; margin: 30px 0;" />
            
            <p style="color: #71717a; font-size: 12px; text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings/notifications" style="color: #10b981;">Manage email preferences</a>
              <br /><br />
              Powered by <a href="https://cabbageseo.com" style="color: #10b981;">CabbageSEO</a> — AI Visibility Intelligence
            </p>
          </div>
        `,
      });
    });

    // Send Slack notification if configured
    await step.run("send-slack-notification", async () => {
      try {
        const { getOrgSlackWebhook, sendSlackNotification } = await import("@/lib/notifications/slack");
        const webhookUrl = await getOrgSlackWebhook(organizationId, supabase);
        if (!webhookUrl) return;
        await sendSlackNotification(webhookUrl, {
          text: `:trophy: New citation for ${domain}! Cited by ${platforms.join(", ")} (${newCitations} new citation${newCitations > 1 ? "s" : ""})`,
        });
      } catch { /* Non-fatal */ }
    });

    return { sent: true, to: userEmail.email };
  }
);

// ============================================
// WEEKLY REPORT EMAIL
// Sends every Monday at 9 AM UTC
// ============================================
export const weeklyReport = inngest.createFunction(
  {
    id: "weekly-citation-report",
    name: "Weekly Citation Report",
    retries: 2,
  },
  { cron: "0 9 * * 1" },
  async ({ step }) => {
    const supabase = createServiceClient();
    
    // Get all organizations with sites
    const orgs = await step.run("get-orgs", async () => {
      const { data } = await supabase
        .from("organizations")
        .select("id, plan");
      return (data || []) as Array<{ id: string; plan: string }>;
    });

    let reportsSent = 0;

    for (const org of orgs) {
      await step.run(`report-${org.id}`, async () => {
        // Get user email
        const { data: user } = await supabase
          .from("users")
          .select("email, notification_settings")
          .eq("organization_id", org.id)
          .eq("role", "owner")
          .single();

        const userData = user as { email: string; notification_settings?: Record<string, boolean> } | null;
        if (!userData?.email) return;

        // Check if weekly reports enabled
        const settings = userData.notification_settings || {};
        if (settings.weeklyReport === false) return;

        // Get site data (including momentum + last_checked_at for recheck nudge)
        const { data: sites } = await supabase
          .from("sites")
          .select("id, domain, total_citations, citations_this_week, citations_last_week, momentum_score, momentum_change, last_checked_at")
          .eq("organization_id", org.id);

        const siteList = (sites || []) as Array<{
          id: string;
          domain: string;
          total_citations: number;
          citations_this_week: number;
          citations_last_week: number;
          momentum_score: number | null;
          momentum_change: number | null;
          last_checked_at: string | null;
        }>;

        if (siteList.length === 0) return;

        const primarySite = siteList[0];
        const totalCitations = siteList.reduce((sum, s) => sum + (s.total_citations || 0), 0);
        const thisWeek = siteList.reduce((sum, s) => sum + (s.citations_this_week || 0), 0);
        const lastWeek = siteList.reduce((sum, s) => sum + (s.citations_last_week || 0), 0);
        const change = lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : 0;
        const momentumScore = primarySite.momentum_score || 0;
        const momentumChange = primarySite.momentum_change || 0;

        // Get top competitor move
        const { data: topCompetitors } = await supabase
          .from("competitors")
          .select("domain, citations_change")
          .eq("site_id", primarySite.id)
          .order("citations_change", { ascending: false })
          .limit(1);

        const topCompetitor = (topCompetitors || [])[0] as { domain: string; citations_change: number | null } | undefined;
        const competitorAlert = topCompetitor && (topCompetitor.citations_change || 0) > 0
          ? `${topCompetitor.domain} gained ${topCompetitor.citations_change} citations`
          : null;

        // Get next action (non-fatal)
        let nextActionTitle: string | null = null;
        try {
          const { data: nextActions } = await supabase
            .from("sprint_actions")
            .select("action_title")
            .eq("site_id", primarySite.id)
            .eq("status", "pending")
            .order("priority", { ascending: true })
            .limit(1);
          if (nextActions && nextActions.length > 0) {
            nextActionTitle = (nextActions[0] as { action_title: string }).action_title;
          }
        } catch {
          // Non-fatal
        }

        // Get AI quotes for lost queries (what AI is actually saying)
        let lostQueryQuotes: Array<{ query: string; snippet: string; platform: string }> = [];
        try {
          const { data: latestAnalysis } = await supabase
            .from("geo_analyses")
            .select("raw_data")
            .eq("site_id", primarySite.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          const analysisResults = (latestAnalysis as { raw_data?: unknown } | null)?.raw_data;
          if (analysisResults && Array.isArray(analysisResults)) {
            lostQueryQuotes = (analysisResults as Array<{
              query?: string;
              snippet?: string;
              platform?: string;
              isLoss?: boolean;
            }>)
              .filter(r => r.isLoss && r.snippet)
              .slice(0, 3)
              .map(r => ({
                query: r.query || "",
                snippet: (r.snippet || "").slice(0, 120),
                platform: r.platform || "AI",
              }));
          }
        } catch {
          // Non-fatal
        }

        // Check for pages published since last check (nudge to re-check)
        let pagesAwaitingRecheck = 0;
        try {
          const lastCheckedAt = primarySite.last_checked_at;
          if (lastCheckedAt) {
            const { count } = await supabase
              .from("generated_pages")
              .select("id", { count: "exact", head: true })
              .eq("site_id", primarySite.id)
              .eq("status", "published")
              .gt("updated_at", lastCheckedAt);
            pagesAwaitingRecheck = count || 0;
          }
        } catch {
          // Non-fatal
        }

        // Send email - enhanced with momentum score, competitor, next action, AI quotes
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);

        const isLosing = change < 0;
        const scoreColor = momentumScore >= 70 ? '#10b981' : momentumScore >= 40 ? '#f59e0b' : '#ef4444';
        const subjectLine = isLosing
          ? `Score ${momentumScore}/100 — you lost ground this week`
          : thisWeek > 0
          ? `Score ${momentumScore}/100 — ${thisWeek} wins this week`
          : `Score ${momentumScore}/100 — weekly intel for ${primarySite.domain}`;

        await resend.emails.send({
          from: "CabbageSEO <reports@cabbageseo.com>",
          to: userData.email,
          subject: subjectLine,
          html: `
            <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #09090b; color: #fff;">
              <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="font-size: 24px; margin: 0; color: #fff;">Weekly Momentum Report</h1>
                <p style="color: #71717a; margin-top: 8px;">${primarySite.domain}</p>
              </div>

              <!-- Momentum Score Badge -->
              <div style="text-align: center; margin-bottom: 24px; padding: 24px; background: #18181b; border-radius: 16px; border: 1px solid #27272a;">
                <div style="font-size: 56px; font-weight: 900; color: ${scoreColor}; line-height: 1;">${momentumScore}</div>
                <div style="font-size: 14px; color: #71717a; margin-top: 4px;">Momentum Score</div>
                ${momentumChange !== 0 ? `
                  <div style="font-size: 16px; font-weight: 600; color: ${momentumChange > 0 ? '#10b981' : '#ef4444'}; margin-top: 8px;">
                    ${momentumChange > 0 ? '↑' : '↓'} ${momentumChange > 0 ? '+' : ''}${momentumChange} this week
                  </div>
                ` : ''}
              </div>

              ${isLosing ? `
                <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: center;">
                  <p style="margin: 0; color: #ef4444; font-size: 14px;">
                    You're losing citations. Competitors are gaining ground.
                  </p>
                </div>
              ` : ''}

              <!-- Stats Row -->
              <div style="display: flex; gap: 12px; margin-bottom: 24px;">
                <div style="flex: 1; background: #18181b; padding: 16px; border-radius: 12px; text-align: center; border: 1px solid #27272a;">
                  <div style="font-size: 28px; font-weight: bold; color: #fff;">${totalCitations}</div>
                  <div style="font-size: 12px; color: #71717a;">Total Wins</div>
                </div>
                <div style="flex: 1; background: ${thisWeek > 0 ? 'rgba(16, 185, 129, 0.1)' : '#18181b'}; padding: 16px; border-radius: 12px; text-align: center; border: 1px solid ${thisWeek > 0 ? 'rgba(16, 185, 129, 0.3)' : '#27272a'};">
                  <div style="font-size: 28px; font-weight: bold; color: ${thisWeek > 0 ? '#10b981' : '#fff'};">${thisWeek}</div>
                  <div style="font-size: 12px; color: #71717a;">This Week</div>
                </div>
                <div style="flex: 1; background: ${change >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'}; padding: 16px; border-radius: 12px; text-align: center; border: 1px solid ${change >= 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'};">
                  <div style="font-size: 28px; font-weight: bold; color: ${change >= 0 ? '#10b981' : '#ef4444'};">${change >= 0 ? '+' : ''}${change}%</div>
                  <div style="font-size: 12px; color: #71717a;">Change</div>
                </div>
              </div>

              ${competitorAlert ? `
              <!-- Competitor Alert -->
              <div style="background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                <div style="font-size: 12px; color: #ef4444; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">Competitor Alert</div>
                <p style="margin: 0; color: #fca5a5; font-size: 14px;">${competitorAlert}</p>
              </div>
              ` : ''}

              ${nextActionTitle ? `
              <!-- #1 Action This Week -->
              <div style="background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                <div style="font-size: 12px; color: #10b981; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">#1 Action This Week</div>
                <p style="margin: 0; color: #a7f3d0; font-size: 14px;">${nextActionTitle}</p>
              </div>
              ` : ''}

              ${lostQueryQuotes.length > 0 ? `
              <!-- What AI Is Saying -->
              <div style="background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.15); border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                <div style="font-size: 12px; color: #ef4444; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px;">What AI Is Telling Your Customers</div>
                ${lostQueryQuotes.map(q => `
                  <div style="margin-bottom: 12px; padding-left: 12px; border-left: 2px solid rgba(239, 68, 68, 0.3);">
                    <div style="font-size: 13px; color: #fff; margin-bottom: 4px;">&ldquo;${q.query}&rdquo;</div>
                    <div style="font-size: 12px; color: #fca5a5; font-style: italic;">&ldquo;${q.snippet}...&rdquo;</div>
                    <div style="font-size: 11px; color: #71717a; margin-top: 2px;">— ${q.platform}</div>
                  </div>
                `).join('')}
              </div>
              ` : ''}

              ${pagesAwaitingRecheck > 0 ? `
              <!-- Pages Awaiting Re-check -->
              <div style="background: rgba(245, 158, 11, 0.05); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                <div style="font-size: 12px; color: #f59e0b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">Pages Ready for Re-check</div>
                <p style="margin: 0; color: #fcd34d; font-size: 14px;">
                  You published ${pagesAwaitingRecheck} page${pagesAwaitingRecheck !== 1 ? 's' : ''} since your last check. Run a follow-up to see if AI is picking them up.
                </p>
              </div>
              ` : ''}

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
                   style="display: inline-block; background: #10b981; color: #000; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                  ${pagesAwaitingRecheck > 0 ? 'Re-Check Now →' : 'Open Dashboard →'}
                </a>
              </div>

              <hr style="border: none; border-top: 1px solid #27272a; margin: 30px 0;" />

              <p style="color: #71717a; font-size: 12px; text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings/notifications" style="color: #10b981;">Manage email preferences</a>
                <br /><br />
                Powered by <a href="https://cabbageseo.com" style="color: #10b981;">CabbageSEO</a> — AI Visibility Intelligence
              </p>
            </div>
          `,
        });

        // Send Slack weekly summary if configured
        try {
          const { getOrgSlackWebhook, sendSlackNotification, buildWeeklySummaryBlocks } = await import("@/lib/notifications/slack");
          const webhookUrl = await getOrgSlackWebhook(org.id, supabase);
          if (webhookUrl) {
            const slackPayload = buildWeeklySummaryBlocks({
              domain: primarySite.domain,
              score: momentumScore,
              change: momentumChange,
              queriesWon: thisWeek,
              queriesLost: 0,
            });
            await sendSlackNotification(webhookUrl, slackPayload);
          }
        } catch {
          // Non-fatal
        }

        reportsSent++;
      });
    }

    return { reportsSent };
  }
);

// ============================================
// RESET WEEKLY COUNTS
// Runs every Sunday at midnight to reset weekly counts
// ============================================
export const resetWeeklyCounts = inngest.createFunction(
  {
    id: "reset-weekly-counts",
    name: "Reset Weekly Citation Counts",
    retries: 2,
  },
  { cron: "0 0 * * 0" },
  async ({ step }) => {
    const supabase = createServiceClient();

    const result = await step.run("reset-counts", async () => {
      // Call the SQL function that properly moves this_week -> last_week
      const { error } = await supabase.rpc("reset_weekly_citations");
      
      if (error) {
        console.error("Failed to reset weekly citations:", error);
        throw new Error(`Weekly reset failed: ${error.message}`);
      }
      
      return { success: true };
    });

    return { reset: result.success, timestamp: new Date().toISOString() };
  }
);

// ============================================
// VISIBILITY DROP ALERT
// Triggered when queries_won drops by 2+
// ============================================
export const sendVisibilityDropAlert = inngest.createFunction(
  {
    id: "send-visibility-drop-alert",
    name: "Send Visibility Drop Alert",
    retries: 3,
  },
  { event: "visibility/drop.detected" },
  async ({ event, step }) => {
    const { siteId, domain, organizationId, previousScore, newScore, drop } = event.data;

    const supabase = createServiceClient();

    // Get user email + notification preferences
    const userData = await step.run("get-user-email", async () => {
      const { data } = await supabase
        .from("users")
        .select("email, notification_settings")
        .eq("organization_id", organizationId)
        .eq("role", "owner")
        .single();

      return data as { email: string; notification_settings?: Record<string, boolean> } | null;
    });

    if (!userData?.email) {
      return { sent: false, reason: "No email found" };
    }

    // Check if citation alerts enabled (drop alerts use same toggle)
    const settings = userData.notification_settings || {};
    if (settings.citationAlerts === false) {
      return { sent: false, reason: "Alerts disabled" };
    }

    // Get top 3 lost queries for context
    const lostQueries = await step.run("get-lost-queries", async () => {
      const { data: analysis } = await supabase
        .from("geo_analyses")
        .select("raw_data")
        .eq("site_id", siteId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const rawData = (analysis as { raw_data?: unknown } | null)?.raw_data;
      if (!rawData || !Array.isArray(rawData)) return [];

      return (rawData as Array<{ query?: string; isLoss?: boolean }>)
        .filter((r) => r.isLoss && r.query)
        .slice(0, 3)
        .map((r) => r.query as string);
    });

    // Send email
    await step.run("send-drop-email", async () => {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);

      const lostQueriesHtml = lostQueries.length > 0
        ? `
          <div style="background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.15); border-radius: 12px; padding: 16px; margin-bottom: 24px;">
            <div style="font-size: 12px; color: #ef4444; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px;">Queries You're Now Losing</div>
            ${lostQueries.map((q) => `
              <div style="margin-bottom: 8px; padding-left: 12px; border-left: 2px solid rgba(239, 68, 68, 0.3);">
                <div style="font-size: 13px; color: #fca5a5;">&ldquo;${q}&rdquo;</div>
              </div>
            `).join("")}
          </div>
        `
        : "";

      await resend.emails.send({
        from: "CabbageSEO <alerts@cabbageseo.com>",
        to: userData.email,
        subject: `🚨 ${domain}: AI visibility dropped ${drop} points`,
        html: `
          <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #09090b; color: #fff;">
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="font-size: 48px; margin-bottom: 8px;">📉</div>
              <h1 style="font-size: 24px; margin: 0; color: #ef4444;">Visibility Drop Detected</h1>
              <p style="color: #71717a; margin-top: 8px;">${domain}</p>
            </div>

            <div style="text-align: center; padding: 24px; background: #18181b; border-radius: 16px; border: 1px solid rgba(239, 68, 68, 0.3); margin-bottom: 24px;">
              <div style="display: inline-flex; align-items: center; gap: 16px;">
                <div>
                  <div style="font-size: 48px; font-weight: 900; color: #71717a; text-decoration: line-through;">${previousScore}</div>
                </div>
                <div style="font-size: 24px; color: #ef4444;">→</div>
                <div>
                  <div style="font-size: 48px; font-weight: 900; color: #ef4444;">${newScore}</div>
                </div>
              </div>
              <div style="font-size: 16px; color: #ef4444; font-weight: 600; margin-top: 8px;">-${drop} points</div>
            </div>

            ${lostQueriesHtml}

            <p style="color: #a1a1aa; line-height: 1.6; text-align: center;">
              AI platforms are recommending your competitors instead. Check your dashboard to see what changed and take action.
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
                 style="display: inline-block; background: #ef4444; color: #fff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                Fix This Now →
              </a>
            </div>

            <hr style="border: none; border-top: 1px solid #27272a; margin: 30px 0;" />

            <p style="color: #71717a; font-size: 12px; text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings/notifications" style="color: #10b981;">Manage email preferences</a>
              <br /><br />
              Powered by <a href="https://cabbageseo.com" style="color: #10b981;">CabbageSEO</a> — AI Visibility Intelligence
            </p>
          </div>
        `,
      });
    });

    // Send Slack notification if configured
    await step.run("send-drop-slack", async () => {
      try {
        const { getOrgSlackWebhook, sendSlackNotification, buildScoreDropBlocks } = await import("@/lib/notifications/slack");
        const webhookUrl = await getOrgSlackWebhook(organizationId, supabase);
        if (!webhookUrl) return;
        const slackPayload = buildScoreDropBlocks({
          domain,
          previousScore,
          newScore,
          drop,
          lostQueries,
        });
        await sendSlackNotification(webhookUrl, slackPayload);
      } catch {
        // Non-fatal
      }
    });

    return { sent: true, to: userData.email, drop };
  }
);

// ============================================
// WEEKLY TEASER RESCAN
// Rescans domains for teaser subscribers and
// emails them if their score changed.
// ============================================

export const weeklyTeaserRescan = inngest.createFunction(
  { id: "weekly-teaser-rescan", name: "Weekly Teaser Rescan" },
  { cron: "0 10 * * 1" }, // Every Monday at 10am UTC
  async ({ step }) => {
    const supabase = createServiceClient();

    // Get unique domains with active subscribers
    const subscriberDomains = await step.run("get-subscriber-domains", async () => {
      const { data } = await supabase
        .from("teaser_subscribers")
        .select("email, domain, report_id")
        .eq("unsubscribed", false);
      return (data || []) as Array<{ email: string; domain: string; report_id: string | null }>;
    });

    if (subscriberDomains.length === 0) return { rescanned: 0 };

    // Group by domain to avoid duplicate scans
    const domainMap = new Map<string, Array<{ email: string; reportId: string | null }>>();
    for (const sub of subscriberDomains) {
      const subs = domainMap.get(sub.domain) || [];
      subs.push({ email: sub.email, reportId: sub.report_id });
      domainMap.set(sub.domain, subs);
    }

    let emailsSent = 0;

    for (const [domain, subscribers] of domainMap) {
      // Get previous score
      const previousScore = await step.run(`prev-score-${domain}`, async () => {
        const { data } = await supabase
          .from("teaser_reports")
          .select("visibility_score, is_invisible")
          .eq("domain", domain)
          .order("created_at", { ascending: false })
          .limit(1);
        const row = data?.[0] as { visibility_score: number; is_invisible: boolean } | undefined;
        return row?.visibility_score ?? null;
      });

      // Rescan via teaser API
      const newReport = await step.run(`rescan-${domain}`, async () => {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : "http://localhost:3000");

        try {
          const res = await fetch(`${baseUrl}/api/geo/teaser`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ domain }),
          });

          if (!res.ok) return null;
          return await res.json();
        } catch {
          return null;
        }
      });

      if (!newReport) continue;

      const newScore = newReport.summary?.isInvisible
        ? 0
        : Math.min(100, (newReport.summary?.mentionedCount || 0) * 25);
      const scoreChanged = previousScore !== null && newScore !== previousScore;
      const improved = previousScore !== null && newScore > previousScore;
      const reportUrl = newReport.reportId
        ? `${process.env.NEXT_PUBLIC_APP_URL || "https://cabbageseo.com"}/teaser/${newReport.reportId}`
        : `${process.env.NEXT_PUBLIC_APP_URL || "https://cabbageseo.com"}/teaser?domain=${encodeURIComponent(domain)}`;

      // Email each subscriber for this domain
      await step.run(`email-${domain}`, async () => {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);

        for (const sub of subscribers) {
          const scoreColor = newScore === 0 ? "#ef4444" : newScore < 40 ? "#f59e0b" : "#10b981";
          const changeText = previousScore !== null
            ? scoreChanged
              ? `${improved ? "↑" : "↓"} ${previousScore} → ${newScore}`
              : `No change (${newScore}/100)`
            : `Score: ${newScore}/100`;

          const subject = scoreChanged
            ? improved
              ? `${domain}: AI visibility improved! ${previousScore} → ${newScore}`
              : `${domain}: AI visibility dropped ${previousScore} → ${newScore}`
            : `${domain}: Weekly AI visibility update — ${newScore}/100`;

          try {
            await resend.emails.send({
              from: "CabbageSEO <alerts@cabbageseo.com>",
              to: sub.email,
              subject,
              html: `
                <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background: #09090b; color: #fff;">
                  <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="font-size: 20px; margin: 0; color: #fff;">Weekly AI Visibility Update</h1>
                    <p style="color: #71717a; margin-top: 4px; font-size: 14px;">${domain}</p>
                  </div>

                  <div style="text-align: center; padding: 24px; background: #18181b; border-radius: 16px; border: 1px solid #27272a; margin-bottom: 20px;">
                    <div style="font-size: 48px; font-weight: 900; color: ${scoreColor}; line-height: 1;">${newScore}</div>
                    <div style="font-size: 13px; color: #71717a; margin-top: 4px;">AI Visibility Score</div>
                    ${previousScore !== null ? `
                      <div style="font-size: 14px; font-weight: 600; color: ${improved ? "#10b981" : newScore < previousScore ? "#ef4444" : "#71717a"}; margin-top: 8px;">
                        ${changeText}
                      </div>
                    ` : ""}
                  </div>

                  ${newScore === 0 ? `
                    <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 12px; padding: 16px; margin-bottom: 20px;">
                      <p style="margin: 0; color: #fca5a5; font-size: 13px;">
                        ${domain} is still invisible to AI. When buyers ask ChatGPT or Perplexity for recommendations in your space, you don't appear.
                      </p>
                    </div>
                  ` : ""}

                  <div style="text-align: center; margin-bottom: 20px;">
                    <a href="${reportUrl}" style="display: inline-block; padding: 12px 28px; background: #10b981; color: #000; font-weight: 700; border-radius: 10px; text-decoration: none; font-size: 14px;">
                      View Full Report
                    </a>
                  </div>

                  <div style="text-align: center; padding-top: 16px; border-top: 1px solid #27272a;">
                    <p style="color: #71717a; font-size: 13px; margin: 0 0 8px;">
                      Want daily monitoring, competitor tracking, and an action plan?
                    </p>
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://cabbageseo.com"}/signup?domain=${encodeURIComponent(domain)}" style="color: #10b981; font-size: 13px; text-decoration: none; font-weight: 600;">
                      Start your free trial →
                    </a>
                  </div>

                  <p style="text-align: center; color: #3f3f46; font-size: 11px; margin-top: 20px;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://cabbageseo.com"}/api/teaser/unsubscribe?email=${encodeURIComponent(sub.email)}&domain=${encodeURIComponent(domain)}" style="color: #3f3f46; text-decoration: underline;">
                      Unsubscribe
                    </a>
                  </p>
                </div>
              `,
            });
            emailsSent++;
          } catch (err) {
            console.error(`[Teaser Rescan] Failed to email ${sub.email}:`, err);
          }
        }
      });

      // Rate limit: pause between domains
      await step.sleep(`delay-${domain}`, "3s");
    }

    return { rescanned: domainMap.size, emailsSent };
  }
);

// Export all functions
export const citationFunctions = [
  dailyCitationCheck,
  hourlyCitationCheck,
  sendCitationAlert,
  sendVisibilityDropAlert,
  weeklyReport,
  resetWeeklyCounts,
  weeklyTeaserRescan,
];

