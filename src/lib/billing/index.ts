/**
 * Billing Module for CabbageSEO
 * 
 * Exports:
 * - Usage manager (plan limits, on-demand, 90% markup)
 * - Wallet monitor (balance tracking, alerts)
 * 
 * Usage:
 * ```ts
 * import { initBilling, getWalletStatus, setWalletBalance } from "@/lib/billing";
 * 
 * // Initialize at app startup
 * initBilling();
 * 
 * // Set initial wallet balance
 * setWalletBalance(5000); // $50
 * 
 * // Check status
 * const status = getWalletStatus(monthlyRevenue);
 * ```
 */

// Usage manager exports
export {
  PLAN_LIMITS,
  ACTION_COSTS,
  OVERAGE_MARKUP,
  DEFAULT_SPENDING_LIMIT_CENTS,
  checkUsageAllowed,
  recordUsage,
  calculateOverageBill,
  getUsageSummary,
  formatCost,
  calculateUserCharge,
  type ActionType,
  type PlanType,
} from "./usage-manager";

// Wallet monitor exports
export {
  setWalletBalance,
  recordSpending,
  getWalletStatus,
  shouldSendAlert,
  formatWalletStatus,
  sendWalletAlert,
  calculateTopUpAmount,
  ALERT_THRESHOLDS,
} from "./wallet-monitor";

// Import for initialization
import { recordSpending } from "./wallet-monitor";
import { setSpendingTracker } from "@/lib/ai/claude-client";

/**
 * Initialize billing system
 * Connects wallet monitoring to AI client
 */
export function initBilling(): void {
  // Connect spending tracker to Claude client
  setSpendingTracker(recordSpending);
  console.log("💰 Billing system initialized - spending tracking enabled");
}

/**
 * Quick status check for admin dashboard
 */
export function getQuickStatus(): {
  healthy: boolean;
  level: "GREEN" | "YELLOW" | "RED";
  action: string;
} {
  const { getWalletStatus } = require("./wallet-monitor");
  const status = getWalletStatus();
  
  return {
    healthy: status.alertLevel === "GREEN",
    level: status.alertLevel,
    action: status.alertLevel === "GREEN" 
      ? "All good!" 
      : status.alertLevel === "YELLOW"
      ? "Check customer payments"
      : "⚠️ Add funds now!",
  };
}

