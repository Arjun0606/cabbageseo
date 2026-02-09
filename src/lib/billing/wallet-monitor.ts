/**
 * Anthropic Wallet Monitor for CabbageSEO
 * 
 * Tracks our API spending and alerts when wallet needs refilling.
 * 
 * Key principle: Only add money AFTER receiving customer payments!
 * 
 * Alert Levels:
 * - GREEN: >$50 estimated remaining
 * - YELLOW: $20-$50 remaining (time to check customer payments)
 * - RED: <$20 remaining (add funds now!)
 */

// Alert thresholds (in cents)
const ALERT_THRESHOLDS = {
  GREEN: 5000,   // $50+ = healthy
  YELLOW: 2000,  // $20-50 = check soon
  RED: 500,      // <$5 = critical!
};

// Notification settings
interface NotificationConfig {
  email?: string;
  webhookUrl?: string;  // Slack, Discord, etc.
  sendEmail?: boolean;
  sendWebhook?: boolean;
}

interface WalletStatus {
  estimatedBalanceCents: number;
  alertLevel: "GREEN" | "YELLOW" | "RED";
  message: string;
  recommendations: string[];
  
  // Usage stats
  todaySpentCents: number;
  thisWeekSpentCents: number;
  thisMonthSpentCents: number;
  
  // Projections
  projectedMonthlySpendCents: number;
  daysUntilEmpty: number;
  
  // Revenue comparison
  thisMonthRevenueCents: number;
  marginPercentage: number;
}

interface DailyUsage {
  date: string;  // YYYY-MM-DD
  spentCents: number;
  apiCalls: number;
}

// In-memory usage tracking (replace with DB in production)
let usageHistory: DailyUsage[] = [];
let currentWalletBalanceCents = 0;  // Set this when you add funds

/**
 * Set your current Anthropic wallet balance
 * Call this after adding funds
 */
export function setWalletBalance(balanceCents: number): void {
  currentWalletBalanceCents = balanceCents;
  console.log(`💰 Wallet balance set to $${(balanceCents / 100).toFixed(2)}`);
}

/**
 * Record API spending
 * Called after every AI request
 */
export function recordSpending(costCents: number): void {
  currentWalletBalanceCents -= costCents;
  
  const today = new Date().toISOString().split('T')[0];
  const todayUsage = usageHistory.find(u => u.date === today);
  
  if (todayUsage) {
    todayUsage.spentCents += costCents;
    todayUsage.apiCalls += 1;
  } else {
    usageHistory.push({
      date: today,
      spentCents: costCents,
      apiCalls: 1,
    });
  }
  
  // Keep only last 90 days
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  usageHistory = usageHistory.filter(u => new Date(u.date) >= ninetyDaysAgo);
}

/**
 * Get current wallet status with recommendations
 */
export function getWalletStatus(monthlyRevenueCents: number = 0): WalletStatus {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  
  // Calculate periods
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  // Sum up usage
  const todaySpent = usageHistory.find(u => u.date === today)?.spentCents || 0;
  const weekSpent = usageHistory
    .filter(u => new Date(u.date) >= startOfWeek)
    .reduce((sum, u) => sum + u.spentCents, 0);
  const monthSpent = usageHistory
    .filter(u => new Date(u.date) >= startOfMonth)
    .reduce((sum, u) => sum + u.spentCents, 0);
  
  // Project monthly spend (based on daily average)
  const daysThisMonth = now.getDate();
  const dailyAverage = daysThisMonth > 0 ? monthSpent / daysThisMonth : 0;
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const projectedMonthly = Math.round(dailyAverage * daysInMonth);
  
  // Calculate days until empty
  const daysUntilEmpty = dailyAverage > 0 
    ? Math.floor(currentWalletBalanceCents / dailyAverage) 
    : 999;
  
  // Calculate margin
  const marginPercentage = monthlyRevenueCents > 0 
    ? Math.round(((monthlyRevenueCents - monthSpent) / monthlyRevenueCents) * 100)
    : 90;  // Default to target margin
  
  // Determine alert level
  let alertLevel: "GREEN" | "YELLOW" | "RED";
  let message: string;
  const recommendations: string[] = [];
  
  if (currentWalletBalanceCents >= ALERT_THRESHOLDS.GREEN) {
    alertLevel = "GREEN";
    message = "Wallet healthy! No action needed.";
  } else if (currentWalletBalanceCents >= ALERT_THRESHOLDS.YELLOW) {
    alertLevel = "YELLOW";
    message = "Wallet getting low. Check if customer payments have come in.";
    recommendations.push("Check your payment processor for recent deposits");
    recommendations.push("Review which customers have paid this week");
    recommendations.push(`Consider adding $${Math.round((ALERT_THRESHOLDS.GREEN - currentWalletBalanceCents) / 100)} from customer revenue`);
  } else {
    alertLevel = "RED";
    message = "⚠️ CRITICAL: Wallet very low! Add funds immediately.";
    recommendations.push("Add funds NOW to avoid service interruption");
    recommendations.push("Check Dodo Payments for pending payouts");
    recommendations.push(`Minimum recommended: $${Math.round(ALERT_THRESHOLDS.GREEN / 100)}`);
  }
  
  // Margin check
  if (marginPercentage < 85) {
    recommendations.push(`⚠️ Margin at ${marginPercentage}% - below target 90%! Review pricing.`);
  }
  
  return {
    estimatedBalanceCents: currentWalletBalanceCents,
    alertLevel,
    message,
    recommendations,
    todaySpentCents: todaySpent,
    thisWeekSpentCents: weekSpent,
    thisMonthSpentCents: monthSpent,
    projectedMonthlySpendCents: projectedMonthly,
    daysUntilEmpty,
    thisMonthRevenueCents: monthlyRevenueCents,
    marginPercentage,
  };
}

/**
 * Check if we should send an alert
 */
export function shouldSendAlert(): { send: boolean; level: "YELLOW" | "RED" | null } {
  const status = getWalletStatus();
  
  if (status.alertLevel === "RED") {
    return { send: true, level: "RED" };
  }
  if (status.alertLevel === "YELLOW") {
    return { send: true, level: "YELLOW" };
  }
  return { send: false, level: null };
}

/**
 * Format wallet status for display
 */
export function formatWalletStatus(status: WalletStatus): string {
  const emoji = status.alertLevel === "GREEN" ? "🟢" 
    : status.alertLevel === "YELLOW" ? "🟡" 
    : "🔴";
  
  return `
${emoji} ANTHROPIC WALLET STATUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Balance: $${(status.estimatedBalanceCents / 100).toFixed(2)}
Status: ${status.alertLevel}
${status.message}

📊 SPENDING
Today: $${(status.todaySpentCents / 100).toFixed(2)}
This Week: $${(status.thisWeekSpentCents / 100).toFixed(2)}
This Month: $${(status.thisMonthSpentCents / 100).toFixed(2)}
Projected Monthly: $${(status.projectedMonthlySpendCents / 100).toFixed(2)}

⏱️ RUNWAY
Days until empty: ${status.daysUntilEmpty === 999 ? "∞" : status.daysUntilEmpty}

💰 MARGIN
Revenue this month: $${(status.thisMonthRevenueCents / 100).toFixed(2)}
Margin: ${status.marginPercentage}%

${status.recommendations.length > 0 ? `
📋 RECOMMENDATIONS
${status.recommendations.map(r => `• ${r}`).join("\n")}` : ""}
`.trim();
}

/**
 * Send alert notification (email/webhook)
 */
export async function sendWalletAlert(
  status: WalletStatus, 
  config: NotificationConfig
): Promise<void> {
  const message = formatWalletStatus(status);
  
  // Send to webhook (Slack, Discord, etc.)
  if (config.sendWebhook && config.webhookUrl) {
    try {
      await fetch(config.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: message,
          // Slack-specific formatting
          blocks: [
            {
              type: "header",
              text: {
                type: "plain_text",
                text: `${status.alertLevel === "RED" ? "🚨" : "⚠️"} CabbageSEO Wallet Alert`,
              },
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*Balance:* $${(status.estimatedBalanceCents / 100).toFixed(2)}\n*Status:* ${status.alertLevel}\n*Days remaining:* ${status.daysUntilEmpty}`,
              },
            },
          ],
        }),
      });
      console.log("✅ Wallet alert sent to webhook");
    } catch (error) {
      console.error("Failed to send webhook alert:", error);
    }
  }
  
  // Email notification
  if (config.sendEmail && config.email) {
    // Derive alert type from status
    const alertType: "low_balance" | "empty" | "top_up_failed" = 
      status.alertLevel === "RED" ? "empty" : "low_balance";
    
    const context = {
      balance: status.estimatedBalanceCents,
      daysRemaining: status.daysUntilEmpty,
      alertLevel: status.alertLevel,
    };
    
    await sendWalletAlertEmail(config.email, alertType, context);
  }
}

/**
 * Send wallet alert email
 */
async function sendWalletAlertEmail(
  to: string,
  alertType: "low_balance" | "empty" | "top_up_failed",
  context: Record<string, unknown>
): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY;
  
  const subjects = {
    low_balance: "⚠️ CabbageSEO Wallet Balance Low",
    empty: "🚨 CabbageSEO Wallet Empty - Service May Be Interrupted",
    top_up_failed: "❌ CabbageSEO Auto Top-Up Failed",
  };
  
  if (resendApiKey) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || "CabbageSEO <hello@cabbageseo.com>",
          to: [to],
          subject: subjects[alertType],
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: ${alertType === "empty" ? "#ef4444" : "#f59e0b"};">
                Wallet Alert: ${alertType.replace(/_/g, " ").toUpperCase()}
              </h2>
              <p>Your CabbageSEO API wallet needs attention.</p>
              <pre style="background: #f4f4f5; padding: 16px; border-radius: 8px; overflow-x: auto;">
${JSON.stringify(context, null, 2)}
              </pre>
              <p>Please add funds to continue uninterrupted service.</p>
            </div>
          `,
        }),
      });
      
      if (!response.ok) {
        console.error("[Wallet Alert Email] Failed to send:", await response.text());
      }
    } catch (error) {
      console.error("[Wallet Alert Email] Error:", error);
    }
  } else {
    console.log(`📧 Would send ${alertType} email to ${to}`);
    console.log(`   Context: ${JSON.stringify(context)}`);
  }
}

/**
 * Calculate how much to add based on expected revenue
 */
export function calculateTopUpAmount(
  expectedMonthlyRevenueCents: number,
  targetBufferDays: number = 14  // Keep 2 weeks buffer
): {
  recommendedTopUpCents: number;
  reason: string;
} {
  const status = getWalletStatus(expectedMonthlyRevenueCents);
  
  // Our cost is roughly 52.6% of user payments (1/1.9 due to 90% markup)
  const expectedMonthlyCostCents = Math.round(expectedMonthlyRevenueCents / 1.9);
  const dailyCostEstimate = expectedMonthlyCostCents / 30;
  
  // Calculate ideal buffer
  const targetBuffer = dailyCostEstimate * targetBufferDays;
  const currentBuffer = status.estimatedBalanceCents;
  
  if (currentBuffer >= targetBuffer) {
    return {
      recommendedTopUpCents: 0,
      reason: "Wallet has sufficient buffer. No top-up needed.",
    };
  }
  
  const topUpNeeded = Math.ceil(targetBuffer - currentBuffer);
  
  return {
    recommendedTopUpCents: topUpNeeded,
    reason: `Add $${(topUpNeeded / 100).toFixed(2)} to maintain ${targetBufferDays}-day buffer based on expected revenue.`,
  };
}

// Export for use in cron jobs / scheduled checks
export { ALERT_THRESHOLDS };

