/**
 * Email Service using Resend
 * 
 * Handles transactional emails:
 * - Welcome emails
 * - Password reset
 * - Notifications (audit complete, content ready, etc.)
 * - Usage alerts
 */

import { Resend } from "resend";

// Initialize Resend client
const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// Default sender — single source of truth for all email sends
export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "CabbageSEO <hello@cabbageseo.com>";

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
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { font-size: 32px; margin-bottom: 10px; }
    .step { padding: 12px 16px; background: #f0fdf4; border-left: 3px solid #10b981; margin: 12px 0; border-radius: 0 8px 8px 0; }
    .step-num { font-weight: 700; color: #10b981; }
    .cta { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>You're in.</h1>
    </div>

    <p>Hi ${name || "there"},</p>

    <p>CabbageSEO monitors whether AI platforms like ChatGPT, Perplexity, and Google AI recommend your product — and helps you fix it when they don't.</p>

    <p>Here's what happens next:</p>

    <div class="step">
      <span class="step-num">1.</span> <strong>Your first AI check is running</strong> — we're scanning how AI platforms see your site right now.
    </div>
    <div class="step">
      <span class="step-num">2.</span> <strong>We'll find the gaps</strong> — queries where competitors get recommended instead of you.
    </div>
    <div class="step">
      <span class="step-num">3.</span> <strong>Fix pages close them</strong> — targeted pages built from your actual citation data, not generic AI content.
    </div>

    <p style="text-align: center;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="cta">Go to your dashboard</a>
    </p>

    <p>Questions? Just reply to this email.</p>

    <p>— The CabbageSEO Team</p>

    <div class="footer">
      <p>CabbageSEO — Get recommended by AI search</p>
    </div>
  </div>
</body>
</html>
    `,
    text: `
You're in.

Hi ${name || "there"},

CabbageSEO monitors whether AI platforms like ChatGPT, Perplexity, and Google AI recommend your product — and helps you fix it when they don't.

Here's what happens next:

1. Your first AI check is running — we're scanning how AI platforms see your site right now.
2. We'll find the gaps — queries where competitors get recommended instead of you.
3. Fix pages close them — targeted pages built from your actual citation data, not generic AI content.

Go to your dashboard: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard

Questions? Just reply to this email.

— The CabbageSEO Team
    `.trim(),
  };
}

function getPasswordResetTemplate(resetLink: string): EmailTemplate {
  return {
    subject: "Reset your CabbageSEO password",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { font-size: 32px; margin-bottom: 10px; }
    .cta { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 12px; border-radius: 8px; font-size: 14px; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🥬</div>
      <h1>Reset Your Password</h1>
    </div>
    
    <p>We received a request to reset your password. Click the button below to create a new one:</p>
    
    <p style="text-align: center;">
      <a href="${resetLink}" class="cta">Reset Password →</a>
    </p>
    
    <div class="warning">
      <strong>⚠️ This link expires in 1 hour.</strong><br>
      If you didn't request this, you can safely ignore this email.
    </div>
    
    <div class="footer">
      <p>CabbageSEO • The SEO + AIO Operating System</p>
    </div>
  </div>
</body>
</html>
    `,
    text: `
Reset Your Password

We received a request to reset your password. Click the link below to create a new one:

${resetLink}

This link expires in 1 hour. If you didn't request this, you can safely ignore this email.

CabbageSEO
    `.trim(),
  };
}

function getAuditCompleteTemplate(siteDomain: string, score: number, issuesCount: number): EmailTemplate {
  const scoreColor = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";
  
  return {
    subject: `Audit Complete: ${siteDomain} scored ${score}/100`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .score { font-size: 48px; font-weight: bold; color: ${scoreColor}; }
    .cta { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .stat { display: inline-block; padding: 10px 20px; background: #f3f4f6; border-radius: 8px; margin: 5px; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Audit Complete! 🔍</h1>
      <p>${siteDomain}</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <div class="score">${score}/100</div>
      <p style="color: #666;">SEO Health Score</p>
    </div>
    
    <div style="text-align: center; margin: 20px 0;">
      <span class="stat"><strong>${issuesCount}</strong> issues found</span>
    </div>
    
    <p style="text-align: center;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/audit" class="cta">View Full Report →</a>
    </p>
    
    <div class="footer">
      <p>CabbageSEO • The SEO + AIO Operating System</p>
    </div>
  </div>
</body>
</html>
    `,
    text: `
Audit Complete!

${siteDomain} scored ${score}/100

${issuesCount} issues found.

View the full report: ${process.env.NEXT_PUBLIC_APP_URL}/audit

CabbageSEO
    `.trim(),
  };
}

function getContentReadyTemplate(title: string, contentId: string): EmailTemplate {
  return {
    subject: `Content Ready: "${title}"`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .title { font-size: 24px; font-weight: bold; color: #10b981; }
    .cta { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Your Content is Ready! ✍️</h1>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <div class="title">"${title}"</div>
    </div>
    
    <p>Your AI-generated article is ready for review. It's been optimized for both traditional SEO and AI visibility.</p>
    
    <p style="text-align: center;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/content/${contentId}" class="cta">Review & Publish →</a>
    </p>
    
    <div class="footer">
      <p>CabbageSEO • The SEO + AIO Operating System</p>
    </div>
  </div>
</body>
</html>
    `,
    text: `
Your Content is Ready!

"${title}"

Your AI-generated article is ready for review. It's been optimized for both traditional SEO and AI visibility.

Review it here: ${process.env.NEXT_PUBLIC_APP_URL}/content/${contentId}

CabbageSEO
    `.trim(),
  };
}

function getCitationAlertTemplate(
  siteDomain: string,
  platform: string,
  query: string,
  snippet: string,
  totalCitations: number
): EmailTemplate {
  const platformEmoji = {
    perplexity: "🔮",
    chatgpt: "🤖",
    google_aio: "✨",
  }[platform] || "🎉";

  const platformName = {
    perplexity: "Perplexity AI",
    chatgpt: "ChatGPT",
    google_aio: "Google AI Overview",
  }[platform] || platform;

  return {
    subject: `${platformEmoji} ${siteDomain} was cited by ${platformName}!`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: #f9fafb; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { font-size: 48px; margin-bottom: 10px; }
    .card { background: white; border-radius: 12px; padding: 24px; margin: 20px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .platform { display: inline-block; background: #10b981; color: white; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: 600; }
    .query { background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0; font-style: italic; }
    .snippet { border-left: 4px solid #10b981; padding-left: 16px; color: #666; }
    .stats { text-align: center; background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 20px; border-radius: 12px; margin: 20px 0; }
    .stat-number { font-size: 36px; font-weight: bold; }
    .cta { display: inline-block; background: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">${platformEmoji}</div>
      <h1>You Got Cited!</h1>
      <p style="color: #666;">Great news — AI is citing your content</p>
    </div>
    
    <div class="card">
      <p><span class="platform">${platformName}</span></p>
      <h3 style="margin: 16px 0 8px;">Query that triggered the citation:</h3>
      <div class="query">"${query}"</div>
      
      <h4 style="margin: 16px 0 8px;">How you were mentioned:</h4>
      <div class="snippet">${snippet}...</div>
    </div>
    
    <div class="stats">
      <div class="stat-number">${totalCitations}</div>
      <p style="margin: 0;">Total AI citations found</p>
    </div>
    
    <p style="text-align: center;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="cta">View All Citations →</a>
    </p>
    
    <p style="text-align: center; color: #666; font-size: 14px;">
      Keep publishing GEO-optimized content to get more citations!
    </p>
    
    <div class="footer">
      <p>🥬 CabbageSEO • The AI Citation Engine</p>
      <p style="font-size: 11px;">You're receiving this because you have citation alerts enabled.</p>
    </div>
  </div>
</body>
</html>
    `,
    text: `
🎉 ${siteDomain} was cited by ${platformName}!

Query: "${query}"

How you were mentioned:
${snippet}...

Total AI citations found: ${totalCitations}

View all citations: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard

Keep publishing GEO-optimized content to get more citations!

CabbageSEO
    `.trim(),
  };
}

function getUsageAlertTemplate(metric: string, used: number, limit: number): EmailTemplate {
  const percentage = Math.round((used / limit) * 100);
  
  return {
    subject: `⚠️ Usage Alert: ${metric} at ${percentage}%`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .alert { background: #fef3c7; border: 1px solid #f59e0b; padding: 20px; border-radius: 8px; text-align: center; }
    .cta { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Usage Alert ⚠️</h1>
    </div>
    
    <div class="alert">
      <p><strong>${metric}</strong></p>
      <p style="font-size: 24px; font-weight: bold; margin: 10px 0;">${used.toLocaleString()} / ${limit.toLocaleString()}</p>
      <p style="color: #92400e;">${percentage}% used this billing period</p>
    </div>
    
    <p style="text-align: center; margin-top: 20px;">
      Consider upgrading your plan or purchasing additional credits.
    </p>
    
    <p style="text-align: center;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings/billing" class="cta">Manage Billing →</a>
    </p>
    
    <div class="footer">
      <p>CabbageSEO • The SEO + AIO Operating System</p>
    </div>
  </div>
</body>
</html>
    `,
    text: `
Usage Alert

${metric}: ${used.toLocaleString()} / ${limit.toLocaleString()} (${percentage}% used)

Consider upgrading your plan or purchasing additional credits.

Manage billing: ${process.env.NEXT_PUBLIC_APP_URL}/settings/billing

CabbageSEO
    `.trim(),
  };
}

// ============================================
// EMAIL SENDING FUNCTIONS
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
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

// Weekly Progress Report Template
function getWeeklyReportTemplate(
  siteDomain: string,
  geoScore: number,
  geoChange: number,
  citations: number,
  citationsChange: number,
  articlesGenerated: number,
  topKeywords: string[]
): EmailTemplate {
  const changeIcon = (val: number) => val > 0 ? "📈" : val < 0 ? "📉" : "➡️";
  const changeColor = (val: number) => val > 0 ? "#10b981" : val < 0 ? "#ef4444" : "#71717a";
  
  return {
    subject: `📊 Your Weekly GEO Report for ${siteDomain}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .card { background: white; border-radius: 12px; padding: 24px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { text-align: center; margin-bottom: 24px; }
    .logo { font-size: 32px; margin-bottom: 10px; }
    .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .stat { text-align: center; padding: 16px; background: #f9fafb; border-radius: 8px; }
    .stat-value { font-size: 32px; font-weight: bold; color: #18181b; }
    .stat-change { font-size: 14px; margin-top: 4px; }
    .stat-label { font-size: 12px; color: #71717a; margin-top: 4px; }
    .cta { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; }
    .keywords { display: flex; flex-wrap: wrap; gap: 8px; }
    .keyword { background: #f0fdf4; color: #166534; padding: 4px 12px; border-radius: 16px; font-size: 14px; }
    .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="logo">🥬</div>
        <h1 style="margin: 0;">Weekly GEO Report</h1>
        <p style="color: #71717a;">${siteDomain}</p>
      </div>
      
      <div class="stat-grid">
        <div class="stat">
          <div class="stat-value">${geoScore}</div>
          <div class="stat-change" style="color: ${changeColor(geoChange)}">${changeIcon(geoChange)} ${geoChange >= 0 ? '+' : ''}${geoChange} pts</div>
          <div class="stat-label">GEO Score</div>
        </div>
        <div class="stat">
          <div class="stat-value">${citations}</div>
          <div class="stat-change" style="color: ${changeColor(citationsChange)}">${changeIcon(citationsChange)} ${citationsChange >= 0 ? '+' : ''}${citationsChange} new</div>
          <div class="stat-label">AI Citations</div>
        </div>
      </div>
    </div>
    
    <div class="card">
      <h3 style="margin-top: 0;">📝 This Week's Content</h3>
      <p>${articlesGenerated} articles generated by Autopilot</p>
      
      ${topKeywords.length > 0 ? `
      <h4 style="margin-bottom: 8px;">🎯 Top Keywords</h4>
      <div class="keywords">
        ${topKeywords.slice(0, 5).map(k => `<span class="keyword">${k}</span>`).join('')}
      </div>
      ` : ''}
    </div>
    
    <div style="text-align: center; margin-top: 24px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="cta">View Full Dashboard →</a>
    </div>
    
    <div class="footer">
      <p>CabbageSEO • Getting you cited by AI</p>
      <p style="font-size: 11px;">Unsubscribe from weekly reports in Settings</p>
    </div>
  </div>
</body>
</html>
    `,
    text: `
Weekly GEO Report for ${siteDomain}

GEO Score: ${geoScore} (${geoChange >= 0 ? '+' : ''}${geoChange})
AI Citations: ${citations} (${citationsChange >= 0 ? '+' : ''}${citationsChange} new)
Articles Generated: ${articlesGenerated}

View Dashboard: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard

CabbageSEO - Getting you cited by AI
    `.trim(),
  };
}

// ============================================
// PUBLIC API
// ============================================

export const emailService = {
  /**
   * Generic send method for custom emails
   */
  async send(to: string, template: EmailTemplate): Promise<SendEmailResult> {
    return sendEmail(to, template);
  },

  /**
   * Send welcome email to new users
   */
  async sendWelcome(to: string, name?: string): Promise<SendEmailResult> {
    return sendEmail(to, getWelcomeTemplate(name || ""));
  },

  /**
   * Send password reset email
   */
  async sendPasswordReset(to: string, resetLink: string): Promise<SendEmailResult> {
    return sendEmail(to, getPasswordResetTemplate(resetLink));
  },

  /**
   * Send audit complete notification
   */
  async sendAuditComplete(
    to: string, 
    siteDomain: string, 
    score: number, 
    issuesCount: number
  ): Promise<SendEmailResult> {
    return sendEmail(to, getAuditCompleteTemplate(siteDomain, score, issuesCount));
  },

  /**
   * Send content ready notification
   */
  async sendContentReady(to: string, title: string, contentId: string): Promise<SendEmailResult> {
    return sendEmail(to, getContentReadyTemplate(title, contentId));
  },

  /**
   * Send usage alert
   */
  async sendUsageAlert(
    to: string, 
    metric: string, 
    used: number, 
    limit: number
  ): Promise<SendEmailResult> {
    return sendEmail(to, getUsageAlertTemplate(metric, used, limit));
  },

  /**
   * Send citation alert - when AI cites your content! 🎉
   */
  async sendCitationAlert(
    to: string,
    siteDomain: string,
    platform: string,
    query: string,
    snippet: string,
    totalCitations: number
  ): Promise<SendEmailResult> {
    return sendEmail(to, getCitationAlertTemplate(siteDomain, platform, query, snippet, totalCitations));
  },

  /**
   * Send weekly progress report
   */
  async sendWeeklyReport(
    to: string,
    siteDomain: string,
    geoScore: number,
    geoChange: number,
    citations: number,
    citationsChange: number,
    articlesGenerated: number,
    topKeywords: string[]
  ): Promise<SendEmailResult> {
    return sendEmail(to, getWeeklyReportTemplate(
      siteDomain, geoScore, geoChange, citations, citationsChange, articlesGenerated, topKeywords
    ));
  },

  /**
   * Check if email service is configured
   */
  isConfigured(): boolean {
    return !!resend;
  },
};

export default emailService;

