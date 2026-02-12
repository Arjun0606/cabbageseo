/**
 * Email Service using Resend
 *
 * Handles transactional emails for CabbageSEO:
 * - Welcome emails
 * - Password reset
 * - GEO audit complete
 * - Fix page content ready
 * - AI citation alerts
 * - Visibility drop alerts
 * - Usage alerts
 * - Weekly progress reports
 */

import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "CabbageSEO <hello@cabbageseo.com>";

// ============================================
// SHARED STYLES
// ============================================

const BRAND = {
  primary: "#10b981",
  primaryDark: "#059669",
  bg: "#f9fafb",
  card: "#ffffff",
  text: "#18181b",
  muted: "#71717a",
  border: "#e4e4e7",
  warning: "#f59e0b",
  danger: "#ef4444",
};

const sharedStyles = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: ${BRAND.text}; background: ${BRAND.bg}; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
  .card { background: ${BRAND.card}; border-radius: 12px; padding: 24px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
  .header { text-align: center; margin-bottom: 24px; }
  .cta { display: inline-block; background: ${BRAND.primary}; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
  .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid ${BRAND.border}; font-size: 12px; color: ${BRAND.muted}; text-align: center; }
  .step { padding: 12px 16px; background: #f0fdf4; border-left: 3px solid ${BRAND.primary}; margin: 12px 0; border-radius: 0 8px 8px 0; }
  .step-num { font-weight: 700; color: ${BRAND.primary}; }
  .stat { text-align: center; padding: 16px; background: #f3f4f6; border-radius: 8px; }
  .stat-value { font-size: 32px; font-weight: bold; color: ${BRAND.text}; }
  .stat-label { font-size: 12px; color: ${BRAND.muted}; margin-top: 4px; }
`;

const footer = `
  <div class="footer">
    <p>CabbageSEO — AI Visibility Engine</p>
  </div>
`;

// ============================================
// EMAIL TEMPLATES
// ============================================

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

function getWelcomeTemplate(name: string): EmailTemplate {
  return {
    subject: "Welcome to CabbageSEO — let's get you visible",
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${sharedStyles}</style></head><body>
  <div class="container">
    <div class="card">
      <div class="header"><h1>You're in.</h1></div>
      <p>Hi ${name || "there"},</p>
      <p>CabbageSEO monitors whether AI platforms like ChatGPT, Perplexity, and Google AI recommend your product — and helps you fix it when they don't.</p>
      <p>Here's what happens next:</p>
      <div class="step"><span class="step-num">1.</span> <strong>Your first AI scan is running</strong> — we're checking how AI platforms see your site right now.</div>
      <div class="step"><span class="step-num">2.</span> <strong>We'll find the gaps</strong> — queries where you should be visible but aren't yet.</div>
      <div class="step"><span class="step-num">3.</span> <strong>Fix pages close them</strong> — targeted content built from real web research, not generic AI output.</div>
      <p style="text-align:center;"><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="cta">Go to your dashboard</a></p>
      <p>Questions? Just reply to this email.</p>
      <p>— The CabbageSEO Team</p>
    </div>
    ${footer}
  </div>
</body></html>`,
    text: `You're in.

Hi ${name || "there"},

CabbageSEO monitors whether AI platforms like ChatGPT, Perplexity, and Google AI recommend your product — and helps you fix it when they don't.

Here's what happens next:
1. Your first AI scan is running — we're checking how AI platforms see your site right now.
2. We'll find the gaps — queries where you should be visible but aren't yet.
3. Fix pages close them — targeted content built from real web research.

Go to your dashboard: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard

— The CabbageSEO Team`,
  };
}

function getPasswordResetTemplate(resetLink: string): EmailTemplate {
  return {
    subject: "Reset your CabbageSEO password",
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${sharedStyles}
      .warning { background: #fef3c7; border: 1px solid ${BRAND.warning}; padding: 12px; border-radius: 8px; font-size: 14px; }
    </style></head><body>
  <div class="container">
    <div class="card">
      <div class="header"><h1>Reset Your Password</h1></div>
      <p>We received a request to reset your password. Click the button below to create a new one:</p>
      <p style="text-align:center;"><a href="${resetLink}" class="cta">Reset Password</a></p>
      <div class="warning"><strong>This link expires in 1 hour.</strong><br>If you didn't request this, you can safely ignore this email.</div>
    </div>
    ${footer}
  </div>
</body></html>`,
    text: `Reset Your Password

We received a request to reset your password. Click the link below:
${resetLink}

This link expires in 1 hour. If you didn't request this, ignore this email.

CabbageSEO`,
  };
}

function getAuditCompleteTemplate(siteDomain: string, score: number, tipsCount: number): EmailTemplate {
  const scoreColor = score >= 80 ? BRAND.primary : score >= 60 ? BRAND.warning : BRAND.danger;

  return {
    subject: `GEO Audit: ${siteDomain} scored ${score}/100`,
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${sharedStyles}</style></head><body>
  <div class="container">
    <div class="card">
      <div class="header"><h1>GEO Audit Complete</h1><p style="color:${BRAND.muted};">${siteDomain}</p></div>
      <div style="text-align:center;margin:30px 0;">
        <div style="font-size:48px;font-weight:bold;color:${scoreColor};">${score}/100</div>
        <p style="color:${BRAND.muted};">AI Visibility Score</p>
      </div>
      <div style="text-align:center;margin:20px 0;">
        <span class="stat" style="display:inline-block;padding:10px 20px;"><strong>${tipsCount}</strong> improvement tips</span>
      </div>
      <p style="text-align:center;"><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/audit" class="cta">View Full Audit</a></p>
    </div>
    ${footer}
  </div>
</body></html>`,
    text: `GEO Audit Complete — ${siteDomain} scored ${score}/100

${tipsCount} improvement tips found.

View the full audit: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard/audit

CabbageSEO`,
  };
}

function getContentReadyTemplate(title: string, pageId: string): EmailTemplate {
  return {
    subject: `Fix page ready: "${title}"`,
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${sharedStyles}</style></head><body>
  <div class="container">
    <div class="card">
      <div class="header"><h1>Fix Page Ready</h1></div>
      <div style="text-align:center;margin:20px 0;">
        <div style="font-size:20px;font-weight:bold;color:${BRAND.primary};">"${title}"</div>
      </div>
      <p>Your AI-optimized fix page is ready. It was built using live web research and your scan data — every claim is grounded in real information.</p>
      <p>Copy the content to your site and mark it as published. AI models typically discover new pages within 1-2 weeks.</p>
      <p style="text-align:center;"><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/pages/${pageId}" class="cta">Review & Publish</a></p>
    </div>
    ${footer}
  </div>
</body></html>`,
    text: `Fix Page Ready: "${title}"

Your AI-optimized fix page is ready. Copy it to your site and mark as published.

Review it: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard/pages/${pageId}

CabbageSEO`,
  };
}

function getCitationAlertTemplate(
  siteDomain: string, platform: string, query: string, snippet: string, totalCitations: number
): EmailTemplate {
  const platformName: Record<string, string> = {
    perplexity: "Perplexity AI",
    chatgpt: "ChatGPT",
    google_aio: "Google AI Overview",
  };
  const pName = platformName[platform] || platform;

  return {
    subject: `${siteDomain} was cited by ${pName}!`,
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${sharedStyles}
      .platform { display:inline-block; background:${BRAND.primary}; color:white; padding:4px 12px; border-radius:20px; font-size:14px; font-weight:600; }
      .query { background:#f3f4f6; padding:16px; border-radius:8px; margin:16px 0; font-style:italic; }
      .snippet { border-left:4px solid ${BRAND.primary}; padding-left:16px; color:${BRAND.muted}; }
    </style></head><body>
  <div class="container">
    <div class="card">
      <div class="header"><h1>You Got Cited!</h1><p style="color:${BRAND.muted};">AI is recommending your content</p></div>
      <p><span class="platform">${pName}</span></p>
      <h3 style="margin:16px 0 8px;">Query:</h3>
      <div class="query">"${query}"</div>
      <h4 style="margin:16px 0 8px;">How you were mentioned:</h4>
      <div class="snippet">${snippet.slice(0, 300)}...</div>
    </div>
    <div class="card" style="text-align:center;background:linear-gradient(135deg,${BRAND.primary},${BRAND.primaryDark});color:white;">
      <div style="font-size:36px;font-weight:bold;">${totalCitations}</div>
      <p style="margin:0;">Total AI citations found</p>
    </div>
    <p style="text-align:center;"><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="cta">View All Citations</a></p>
    ${footer}
  </div>
</body></html>`,
    text: `${siteDomain} was cited by ${pName}!

Query: "${query}"
Snippet: ${snippet.slice(0, 300)}...

Total AI citations: ${totalCitations}

View all: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard

CabbageSEO`,
  };
}

function getVisibilityDropTemplate(
  siteDomain: string, previousScore: number, newScore: number, lostQueries: string[]
): EmailTemplate {
  const drop = previousScore - newScore;
  return {
    subject: `Visibility drop: ${siteDomain} (-${drop} queries)`,
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${sharedStyles}
      .alert { background: #fef2f2; border: 1px solid ${BRAND.danger}; border-radius: 12px; padding: 20px; text-align: center; }
      .lost-query { padding: 8px 12px; background: #f3f4f6; border-radius: 6px; margin: 4px 0; font-size: 14px; }
    </style></head><body>
  <div class="container">
    <div class="card">
      <div class="header"><h1>Visibility Drop Alert</h1><p style="color:${BRAND.muted};">${siteDomain}</p></div>
      <div class="alert">
        <p style="font-size:14px;color:${BRAND.danger};margin:0;">Queries won dropped</p>
        <p style="font-size:32px;font-weight:bold;margin:8px 0;">${previousScore} → ${newScore}</p>
        <p style="font-size:14px;color:${BRAND.muted};margin:0;">-${drop} quer${drop === 1 ? "y" : "ies"}</p>
      </div>
      ${lostQueries.length > 0 ? `
        <h3 style="margin-top:20px;">Queries you lost:</h3>
        ${lostQueries.slice(0, 5).map(q => `<div class="lost-query">"${q}"</div>`).join("")}
        ${lostQueries.length > 5 ? `<p style="color:${BRAND.muted};font-size:14px;">and ${lostQueries.length - 5} more</p>` : ""}
        <p style="font-size:14px;color:${BRAND.muted};">Generate fix pages for these queries to regain visibility.</p>
      ` : ""}
      <p style="text-align:center;"><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/pages" class="cta">Generate Fix Pages</a></p>
    </div>
    ${footer}
  </div>
</body></html>`,
    text: `Visibility Drop Alert — ${siteDomain}

Queries won dropped from ${previousScore} to ${newScore} (-${drop}).

${lostQueries.length > 0 ? `Queries lost:\n${lostQueries.slice(0, 5).map(q => `- "${q}"`).join("\n")}` : ""}

Generate fix pages: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard/pages

CabbageSEO`,
  };
}

function getUsageAlertTemplate(metric: string, used: number, limit: number): EmailTemplate {
  const percentage = Math.round((used / limit) * 100);

  return {
    subject: `Usage alert: ${metric} at ${percentage}%`,
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${sharedStyles}
      .alert { background: #fef3c7; border: 1px solid ${BRAND.warning}; padding: 20px; border-radius: 8px; text-align: center; }
    </style></head><body>
  <div class="container">
    <div class="card">
      <div class="header"><h1>Usage Alert</h1></div>
      <div class="alert">
        <p><strong>${metric}</strong></p>
        <p style="font-size:24px;font-weight:bold;margin:10px 0;">${used.toLocaleString()} / ${limit.toLocaleString()}</p>
        <p style="color:#92400e;">${percentage}% used this billing period</p>
      </div>
      <p style="text-align:center;margin-top:20px;">Consider upgrading your plan for higher limits.</p>
      <p style="text-align:center;"><a href="${process.env.NEXT_PUBLIC_APP_URL}/settings/billing" class="cta">Manage Billing</a></p>
    </div>
    ${footer}
  </div>
</body></html>`,
    text: `Usage Alert — ${metric}: ${used.toLocaleString()} / ${limit.toLocaleString()} (${percentage}%)

Manage billing: ${process.env.NEXT_PUBLIC_APP_URL}/settings/billing

CabbageSEO`,
  };
}

function getWeeklyReportTemplate(
  siteDomain: string, geoScore: number, geoChange: number,
  citations: number, citationsChange: number,
  pagesGenerated: number, topGaps: string[]
): EmailTemplate {
  const changeIcon = (val: number) => val > 0 ? "+" : val < 0 ? "" : "";
  const changeColor = (val: number) => val > 0 ? BRAND.primary : val < 0 ? BRAND.danger : BRAND.muted;

  return {
    subject: `Weekly AI Visibility Report — ${siteDomain}`,
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${sharedStyles}
      .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
      .stat-change { font-size: 14px; margin-top: 4px; }
      .gap { background: #f0fdf4; color: #166534; padding: 4px 12px; border-radius: 16px; font-size: 14px; display: inline-block; margin: 3px; }
    </style></head><body>
  <div class="container">
    <div class="card">
      <div class="header"><h1>Weekly AI Visibility Report</h1><p style="color:${BRAND.muted};">${siteDomain}</p></div>
      <div class="stat-grid">
        <div class="stat">
          <div class="stat-value">${geoScore}</div>
          <div class="stat-change" style="color:${changeColor(geoChange)}">${changeIcon(geoChange)}${geoChange} pts</div>
          <div class="stat-label">Visibility Score</div>
        </div>
        <div class="stat">
          <div class="stat-value">${citations}</div>
          <div class="stat-change" style="color:${changeColor(citationsChange)}">${changeIcon(citationsChange)}${citationsChange} new</div>
          <div class="stat-label">AI Citations</div>
        </div>
      </div>
    </div>
    <div class="card">
      <h3 style="margin-top:0;">This Week</h3>
      <p>${pagesGenerated} fix page${pagesGenerated === 1 ? "" : "s"} generated</p>
      ${topGaps.length > 0 ? `
        <h4 style="margin-bottom:8px;">Top Visibility Gaps</h4>
        <div>${topGaps.slice(0, 5).map(g => `<span class="gap">${g}</span>`).join(" ")}</div>
      ` : ""}
    </div>
    <p style="text-align:center;"><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="cta">View Full Dashboard</a></p>
    ${footer}
    <p style="text-align:center;font-size:11px;color:${BRAND.muted};">Unsubscribe from weekly reports in Settings</p>
  </div>
</body></html>`,
    text: `Weekly AI Visibility Report — ${siteDomain}

Visibility Score: ${geoScore} (${changeIcon(geoChange)}${geoChange})
AI Citations: ${citations} (${changeIcon(citationsChange)}${citationsChange} new)
Fix Pages Generated: ${pagesGenerated}

${topGaps.length > 0 ? `Top Gaps: ${topGaps.join(", ")}` : ""}

Dashboard: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard

CabbageSEO`,
  };
}

// ============================================
// EMAIL SENDING
// ============================================

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

async function sendEmail(to: string, template: EmailTemplate): Promise<SendEmailResult> {
  if (!resend) {
    console.warn("[Email] Resend not configured - email not sent");
    return { success: false, error: "Email service not configured" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (error) {
      console.error("[Email] Send error:", error);
      return { success: false, error: error.message };
    }

    console.log("[Email] Sent to", to, "ID:", data?.id);
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error("[Email] Exception:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// ============================================
// PUBLIC API
// ============================================

export const emailService = {
  async send(to: string, template: EmailTemplate): Promise<SendEmailResult> {
    return sendEmail(to, template);
  },

  async sendWelcome(to: string, name?: string): Promise<SendEmailResult> {
    return sendEmail(to, getWelcomeTemplate(name || ""));
  },

  async sendPasswordReset(to: string, resetLink: string): Promise<SendEmailResult> {
    return sendEmail(to, getPasswordResetTemplate(resetLink));
  },

  async sendAuditComplete(to: string, siteDomain: string, score: number, tipsCount: number): Promise<SendEmailResult> {
    return sendEmail(to, getAuditCompleteTemplate(siteDomain, score, tipsCount));
  },

  async sendContentReady(to: string, title: string, pageId: string): Promise<SendEmailResult> {
    return sendEmail(to, getContentReadyTemplate(title, pageId));
  },

  async sendUsageAlert(to: string, metric: string, used: number, limit: number): Promise<SendEmailResult> {
    return sendEmail(to, getUsageAlertTemplate(metric, used, limit));
  },

  async sendCitationAlert(
    to: string, siteDomain: string, platform: string, query: string, snippet: string, totalCitations: number
  ): Promise<SendEmailResult> {
    return sendEmail(to, getCitationAlertTemplate(siteDomain, platform, query, snippet, totalCitations));
  },

  async sendVisibilityDrop(
    to: string, siteDomain: string, previousScore: number, newScore: number, lostQueries: string[]
  ): Promise<SendEmailResult> {
    return sendEmail(to, getVisibilityDropTemplate(siteDomain, previousScore, newScore, lostQueries));
  },

  async sendWeeklyReport(
    to: string, siteDomain: string, geoScore: number, geoChange: number,
    citations: number, citationsChange: number, pagesGenerated: number, topGaps: string[]
  ): Promise<SendEmailResult> {
    return sendEmail(to, getWeeklyReportTemplate(
      siteDomain, geoScore, geoChange, citations, citationsChange, pagesGenerated, topGaps
    ));
  },

  isConfigured(): boolean {
    return !!resend;
  },
};

export default emailService;
