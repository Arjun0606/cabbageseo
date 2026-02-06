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
    
    // Get all active sites
    const sites = await step.run("get-active-sites", async () => {
      const { data, error } = await supabase
        .from("sites")
        .select("id, domain, organization_id")
        .eq("status", "active");
      
      if (error) {
        console.error("Failed to fetch sites:", error);
        return [];
      }
      return (data || []) as Array<{ id: string; domain: string; organization_id: string }>;
    });

    if (sites.length === 0) {
      return { checked: 0, message: "No active sites to check" };
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

      // Small delay between checks to avoid rate limits
      await step.sleep("rate-limit-delay", "2s");
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
// HOURLY CITATION CHECK (Pro Users Only)
// Runs every hour for Pro/Agency plans
// ============================================
export const hourlyCitationCheck = inngest.createFunction(
  {
    id: "hourly-citation-check",
    name: "Hourly Citation Check (Pro)",
    retries: 1,
  },
  { cron: "0 * * * *" },
  async ({ step }) => {
    const supabase = createServiceClient();
    
    // Get sites from Pro/Agency organizations
    const sites = await step.run("get-pro-sites", async () => {
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
        console.error("Failed to fetch pro sites:", error);
        return [];
      }
      return (data || []) as Array<{ id: string; domain: string; organization_id: string }>;
    });

    if (sites.length === 0) {
      return { checked: 0, message: "No Pro sites to check" };
    }

    const results = [];

    for (const site of sites) {
      const result = await step.run(`check-pro-${site.id}`, async () => {
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

        // Get site data
        const { data: sites } = await supabase
          .from("sites")
          .select("id, domain, total_citations, citations_this_week, citations_last_week")
          .eq("organization_id", org.id);

        const siteList = (sites || []) as Array<{ 
          id: string; 
          domain: string; 
          total_citations: number; 
          citations_this_week: number; 
          citations_last_week: number 
        }>;
        
        if (siteList.length === 0) return;

        const primarySite = siteList[0];
        const totalCitations = siteList.reduce((sum, s) => sum + (s.total_citations || 0), 0);
        const thisWeek = siteList.reduce((sum, s) => sum + (s.citations_this_week || 0), 0);
        const lastWeek = siteList.reduce((sum, s) => sum + (s.citations_last_week || 0), 0);
        const change = lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : 0;

        // Send email - WAR ROOM style with fear/action
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);
        
        const isLosing = change < 0;
        const subjectLine = isLosing 
          ? `⚠️ You lost ground this week: ${primarySite.domain}`
          : thisWeek > 0
          ? `⚔️ Battle Report: ${thisWeek} wins this week`
          : `🎯 Weekly Intel: ${primarySite.domain}`;

        await resend.emails.send({
          from: "CabbageSEO <reports@cabbageseo.com>",
          to: userData.email,
          subject: subjectLine,
          html: `
            <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #09090b; color: #fff;">
              <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="font-size: 24px; margin: 0; color: #fff;">📊 Weekly Momentum Report</h1>
                <p style="color: #71717a; margin-top: 8px;">${primarySite.domain}</p>
              </div>
              
              ${isLosing ? `
                <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: center;">
                  <p style="margin: 0; color: #ef4444; font-size: 14px;">
                    ⚠️ You're losing citations. Competitors are gaining ground.
                  </p>
                </div>
              ` : ''}
              
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
                  <div style="font-size: 12px; color: #71717a;">Momentum</div>
                </div>
              </div>
              
              <p style="color: #a1a1aa; line-height: 1.6; margin-bottom: 24px;">
                ${isLosing 
                  ? "Your competitors gained visibility while you lost ground. Time to fight back."
                  : thisWeek > 0
                  ? "You won some battles this week. But there are more to fight. See where you're still losing."
                  : "No new wins this week. Check your dashboard to see why competitors are winning."}
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
                   style="display: inline-block; background: #10b981; color: #000; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                  Open Dashboard →
                </a>
              </div>
              
              <hr style="border: none; border-top: 1px solid #27272a; margin: 30px 0;" />
              
              <p style="color: #71717a; font-size: 12px; text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings/notifications" style="color: #10b981;">Manage email preferences</a>
              </p>
            </div>
          `,
        });

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

// Export all functions
export const citationFunctions = [
  dailyCitationCheck,
  hourlyCitationCheck,
  sendCitationAlert,
  weeklyReport,
  resetWeeklyCounts,
];

