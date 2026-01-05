/**
 * Citation Intelligence - Inngest Jobs
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

    return {
      checked: sites.length,
      successful: results.filter(r => r.success).length,
      totalNewCitations,
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
        .in("organizations.plan", ["pro", "pro_plus", "agency"]);
      
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

    // Send the email
    await step.run("send-email", async () => {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);

      const platformList = platforms.join(", ");

      await resend.emails.send({
        from: "CabbageSEO <alerts@cabbageseo.com>",
        to: userEmail.email,
        subject: `🎉 New AI Citation for ${domain}!`,
        html: `
          <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 16px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 30px;">🎯</span>
              </div>
              <h1 style="font-size: 24px; margin: 0; color: #111;">AI is Citing Your Website!</h1>
            </div>
            
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <p style="margin: 0; color: #166534; font-size: 16px;">
                <strong>${domain}</strong> was just cited by <strong>${platformList}</strong>
              </p>
            </div>
            
            <p style="color: #6b7280; line-height: 1.6;">
              ${newCitations} new citation${newCitations > 1 ? "s" : ""} detected! This means AI platforms are recommending your website to users.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/citations" 
                 style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">
                View Citations →
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
            
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">
              You're receiving this because you have citation alerts enabled.
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings/notifications" style="color: #10b981;">Manage preferences</a>
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

        // Send email
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);

        await resend.emails.send({
          from: "CabbageSEO <reports@cabbageseo.com>",
          to: userData.email,
          subject: `📊 Weekly Report: ${primarySite.domain}`,
          html: `
            <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="font-size: 24px; margin-bottom: 24px; color: #111;">Your Weekly Citation Report</h1>
              
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px;">
                <div style="background: #f9fafb; padding: 16px; border-radius: 12px; text-align: center;">
                  <div style="font-size: 28px; font-weight: bold; color: #111;">${totalCitations}</div>
                  <div style="font-size: 12px; color: #6b7280;">Total Citations</div>
                </div>
                <div style="background: #f0fdf4; padding: 16px; border-radius: 12px; text-align: center;">
                  <div style="font-size: 28px; font-weight: bold; color: #10b981;">${thisWeek}</div>
                  <div style="font-size: 12px; color: #6b7280;">This Week</div>
                </div>
                <div style="background: ${change >= 0 ? '#f0fdf4' : '#fef2f2'}; padding: 16px; border-radius: 12px; text-align: center;">
                  <div style="font-size: 28px; font-weight: bold; color: ${change >= 0 ? '#10b981' : '#ef4444'};">${change >= 0 ? '+' : ''}${change}%</div>
                  <div style="font-size: 12px; color: #6b7280;">Change</div>
                </div>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
                   style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">
                  View Full Dashboard →
                </a>
              </div>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
              
              <p style="color: #9ca3af; font-size: 12px; text-align: center;">
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

