/**
 * Usage-Based Billing Integration with Dodo Payments
 * 
 * Handles real-time overage billing:
 * 1. User exceeds plan limits
 * 2. If spending cap enabled, we record the overage
 * 3. Report usage to Dodo for billing
 * 4. Dodo aggregates and charges at end of billing cycle
 * 
 * This integrates with Dodo's usage-based billing:
 * https://docs.dodopayments.com/features/usage-based-billing
 */

import { createClient } from "@/lib/supabase/server";
import { 
  getPlanLimits, 
  OVERAGE_PRICES, 
  DODO_METERS,
  type PlanLimits 
} from "./plans";

// ============================================
// TYPES
// ============================================

export type OverageResourceType = keyof typeof OVERAGE_PRICES;

export interface UsageEvent {
  organizationId: string;
  resourceType: OverageResourceType;
  amount: number;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface UsageBillingResult {
  success: boolean;
  withinPlan: boolean;
  overageCharged: boolean;
  overageCostCents: number;
  error?: string;
}

export interface OverageSettings {
  enabled: boolean;
  spendingCapCents: number;
  currentSpendCents: number;
  autoIncreaseEnabled: boolean;
  autoIncreaseAmountCents: number;
  notifyAt: number[];
  lastNotifiedAt: string | null;
}

// ============================================
// MAIN USAGE BILLING FUNCTION
// ============================================

/**
 * Record usage and bill for overages if necessary
 * 
 * This is the main entry point for billing. Call this whenever
 * a billable action is performed (article generation, keyword lookup, etc.)
 */
export async function recordUsageAndBill(
  event: UsageEvent
): Promise<UsageBillingResult> {
  const supabase = await createClient();
  if (!supabase) {
    return { 
      success: false, 
      withinPlan: false, 
      overageCharged: false, 
      overageCostCents: 0,
      error: "Database not configured" 
    };
  }

  try {
    // Get organization info
    const { data: org } = await supabase
      .from("organizations")
      .select("id, plan, overage_settings, dodo_subscription_id")
      .eq("id", event.organizationId)
      .single();

    if (!org) {
      return { 
        success: false, 
        withinPlan: false, 
        overageCharged: false, 
        overageCostCents: 0,
        error: "Organization not found" 
      };
    }

    const orgData = org as {
      id: string;
      plan: string;
      overage_settings: OverageSettings | null;
      dodo_subscription_id: string | null;
    };

    const plan = orgData.plan || "starter";
    const overageSettings = orgData.overage_settings || getDefaultOverageSettings();
    const subscriptionId = orgData.dodo_subscription_id;

    // Get current usage for this billing period
    const period = getCurrentPeriod();
    const { data: usage } = await supabase
      .from("usage")
      .select("*")
      .eq("organization_id", event.organizationId)
      .eq("period", period)
      .single();

    const currentUsage = usage as Record<string, number> | null;

    // Check if within plan limits
    const limits = getPlanLimits(plan);
    const usageField = getUsageField(event.resourceType);
    const limitField = getLimitField(event.resourceType);
    
    const currentAmount = currentUsage?.[usageField] || 0;
    const limit = limits[limitField as keyof PlanLimits] || 0;
    const projectedAmount = currentAmount + event.amount;

    const withinPlan = projectedAmount <= limit;

    // Calculate overage if over limit
    let overageCostCents = 0;
    let overageCharged = false;

    if (!withinPlan) {
      const overageAmount = projectedAmount - limit;
      overageCostCents = calculateOverageCost(event.resourceType, overageAmount);

      // Check if overages are enabled and within cap
      if (!overageSettings.enabled) {
        return {
          success: false,
          withinPlan: false,
          overageCharged: false,
          overageCostCents,
          error: "Plan limit reached. Enable overages or upgrade your plan to continue.",
        };
      }

      const projectedSpend = overageSettings.currentSpendCents + overageCostCents;

      if (projectedSpend > overageSettings.spendingCapCents) {
        // Would exceed spending cap
        if (overageSettings.autoIncreaseEnabled) {
          // Auto-increase cap
          const newCap = overageSettings.spendingCapCents + overageSettings.autoIncreaseAmountCents;
          await updateOverageSettings(supabase, event.organizationId, {
            ...overageSettings,
            spendingCapCents: newCap,
          });
        } else {
          return {
            success: false,
            withinPlan: false,
            overageCharged: false,
            overageCostCents,
            error: `Spending cap of $${(overageSettings.spendingCapCents / 100).toFixed(2)} reached. Increase your cap to continue.`,
          };
        }
      }

      // Record the overage charge
      await recordOverageCharge(supabase, {
        organizationId: event.organizationId,
        resourceType: event.resourceType,
        amount: overageAmount,
        costCents: overageCostCents,
        description: event.description,
      });

      // Update current spend
      await updateOverageSettings(supabase, event.organizationId, {
        ...overageSettings,
        currentSpendCents: overageSettings.currentSpendCents + overageCostCents,
      });

      // Report to Dodo for billing
      if (subscriptionId) {
        await reportUsageToDodo(subscriptionId, overageCostCents);
      }

      overageCharged = true;

      // Check for notification thresholds
      await checkAndNotify(
        supabase,
        event.organizationId,
        overageSettings,
        overageSettings.currentSpendCents + overageCostCents
      );
    }

    // Record the usage
    await incrementUsage(supabase, event.organizationId, period, usageField, event.amount);

    return {
      success: true,
      withinPlan,
      overageCharged,
      overageCostCents: overageCharged ? overageCostCents : 0,
    };

  } catch (error) {
    console.error("[Usage Billing] Error:", error);
    return {
      success: false,
      withinPlan: false,
      overageCharged: false,
      overageCostCents: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Check if an action is allowed before performing it
 * (Dry run - doesn't record usage)
 */
export async function checkUsageAllowed(
  organizationId: string,
  resourceType: OverageResourceType,
  amount: number = 1
): Promise<{
  allowed: boolean;
  withinPlan: boolean;
  overageCostCents: number;
  remainingInPlan: number;
  remainingInCap: number;
  reason?: string;
}> {
  const supabase = await createClient();
  if (!supabase) {
    return {
      allowed: false,
      withinPlan: false,
      overageCostCents: 0,
      remainingInPlan: 0,
      remainingInCap: 0,
      reason: "Database not configured",
    };
  }

  const { data: org } = await supabase
    .from("organizations")
    .select("plan, overage_settings")
    .eq("id", organizationId)
    .single();

  if (!org) {
    return {
      allowed: false,
      withinPlan: false,
      overageCostCents: 0,
      remainingInPlan: 0,
      remainingInCap: 0,
      reason: "Organization not found",
    };
  }

  const orgData = org as { plan: string; overage_settings: OverageSettings | null };
  const plan = orgData.plan || "starter";
  const overageSettings = orgData.overage_settings || getDefaultOverageSettings();

  const period = getCurrentPeriod();
  const { data: usage } = await supabase
    .from("usage")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("period", period)
    .single();

  const currentUsage = usage as Record<string, number> | null;
  const limits = getPlanLimits(plan);
  const usageField = getUsageField(resourceType);
  const limitField = getLimitField(resourceType);

  const currentAmount = currentUsage?.[usageField] || 0;
  const limit = limits[limitField as keyof PlanLimits] || 0;
  const remainingInPlan = Math.max(0, limit - currentAmount);
  const projectedAmount = currentAmount + amount;
  const withinPlan = projectedAmount <= limit;

  let overageCostCents = 0;
  if (!withinPlan) {
    const overageAmount = projectedAmount - limit;
    overageCostCents = calculateOverageCost(resourceType, overageAmount);
  }

  const remainingInCap = overageSettings.enabled
    ? Math.max(0, overageSettings.spendingCapCents - overageSettings.currentSpendCents)
    : 0;

  // Determine if allowed
  if (withinPlan) {
    return {
      allowed: true,
      withinPlan: true,
      overageCostCents: 0,
      remainingInPlan: remainingInPlan - amount,
      remainingInCap,
    };
  }

  if (!overageSettings.enabled) {
    return {
      allowed: false,
      withinPlan: false,
      overageCostCents,
      remainingInPlan: 0,
      remainingInCap: 0,
      reason: "Plan limit reached. Enable overages or upgrade to continue.",
    };
  }

  if (overageCostCents > remainingInCap && !overageSettings.autoIncreaseEnabled) {
    return {
      allowed: false,
      withinPlan: false,
      overageCostCents,
      remainingInPlan: 0,
      remainingInCap,
      reason: "Spending cap would be exceeded. Increase your cap to continue.",
    };
  }

  return {
    allowed: true,
    withinPlan: false,
    overageCostCents,
    remainingInPlan: 0,
    remainingInCap: remainingInCap - overageCostCents,
  };
}

// ============================================
// DODO INTEGRATION
// ============================================

/**
 * Report usage to Dodo Payments for billing
 * 
 * Dodo aggregates usage and charges at end of billing cycle
 */
async function reportUsageToDodo(
  subscriptionId: string,
  amountCents: number
): Promise<void> {
  const apiKey = process.env.DODO_PAYMENTS_API_KEY;
  if (!apiKey) {
    console.warn("[Usage Billing] DODO_PAYMENTS_API_KEY not configured");
    return;
  }

  try {
    const response = await fetch("https://api.dodopayments.com/v1/usage", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subscription_id: subscriptionId,
        meter_id: DODO_METERS.overageSpend,
        quantity: amountCents, // Report in cents
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("[Usage Billing] Dodo API error:", error);
    }
  } catch (error) {
    console.error("[Usage Billing] Failed to report to Dodo:", error);
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getCurrentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getDefaultOverageSettings(): OverageSettings {
  return {
    enabled: false,
    spendingCapCents: 0,
    currentSpendCents: 0,
    autoIncreaseEnabled: false,
    autoIncreaseAmountCents: 5000,
    notifyAt: [50, 80, 100],
    lastNotifiedAt: null,
  };
}

function getUsageField(resourceType: OverageResourceType): string {
  const mapping: Record<OverageResourceType, string> = {
    articles: "articles_generated",
    keywords: "keywords_analyzed",
    audits: "audits_run",
    aioAnalyses: "aio_analyses",
    aiCredits: "ai_credits_used",
  };
  return mapping[resourceType];
}

function getLimitField(resourceType: OverageResourceType): string {
  const mapping: Record<OverageResourceType, string> = {
    articles: "articlesPerMonth",
    keywords: "keywordsTracked",
    audits: "auditsPerMonth",
    aioAnalyses: "aioAnalysesPerMonth",
    aiCredits: "aiCreditsPerMonth",
  };
  return mapping[resourceType];
}

function calculateOverageCost(resourceType: OverageResourceType, amount: number): number {
  const pricing = OVERAGE_PRICES[resourceType];
  if (!pricing) return 0;

  let units = amount;
  if (resourceType === "keywords") {
    units = Math.ceil(amount / 100);
  } else if (resourceType === "aiCredits") {
    units = Math.ceil(amount / 1000);
  }

  return units * pricing.pricePerUnit;
}

async function updateOverageSettings(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
  settings: OverageSettings
): Promise<void> {
  if (!supabase) return;
  
  await supabase
    .from("organizations")
    .update({
      overage_settings: settings,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", organizationId);
}

async function recordOverageCharge(
  supabase: Awaited<ReturnType<typeof createClient>>,
  charge: {
    organizationId: string;
    resourceType: string;
    amount: number;
    costCents: number;
    description?: string;
  }
): Promise<void> {
  if (!supabase) return;

  const pricing = OVERAGE_PRICES[charge.resourceType as OverageResourceType];
  const ourCostCents = pricing 
    ? Math.ceil((charge.amount / (charge.resourceType === "keywords" ? 100 : charge.resourceType === "aiCredits" ? 1000 : 1)) * pricing.costPerUnit)
    : 0;

  await supabase.from("overage_charges").insert({
    organization_id: charge.organizationId,
    resource_type: charge.resourceType,
    amount: charge.amount,
    cost_cents: charge.costCents,
    our_cost_cents: ourCostCents,
    description: charge.description || `${charge.amount} ${charge.resourceType}`,
    billed: false,
    created_at: new Date().toISOString(),
  } as never);
}

async function incrementUsage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
  period: string,
  field: string,
  amount: number
): Promise<void> {
  if (!supabase) return;

  // Try RPC first
  const { error } = await supabase.rpc("increment_usage" as never, {
    org_id: organizationId,
    period_str: period,
    column_name: field,
    increment_amount: amount,
  } as never);

  if (error) {
    // Fallback to manual update
    const { data: current } = await supabase
      .from("usage")
      .select(field)
      .eq("organization_id", organizationId)
      .eq("period", period)
      .single();

    const currentValue = (current as Record<string, number> | null)?.[field] || 0;

    await supabase
      .from("usage")
      .upsert({
        organization_id: organizationId,
        period,
        [field]: currentValue + amount,
      } as never, { onConflict: "organization_id,period" });
  }
}

async function checkAndNotify(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
  settings: OverageSettings,
  newSpend: number
): Promise<void> {
  if (!supabase || !settings.spendingCapCents) return;

  const percentUsed = Math.round((newSpend / settings.spendingCapCents) * 100);

  for (const threshold of settings.notifyAt) {
    if (percentUsed >= threshold) {
      const lastNotified = settings.lastNotifiedAt
        ? new Date(settings.lastNotifiedAt).getTime()
        : 0;
      const hourAgo = Date.now() - 3600000;

      if (lastNotified < hourAgo) {
        // Create notification
        await supabase.from("notifications").insert({
          organization_id: organizationId,
          type: threshold >= 100 ? "error" : threshold >= 80 ? "warning" : "info",
          category: "billing",
          title: `Spending Cap ${threshold}% Used`,
          message: `You've used $${(newSpend / 100).toFixed(2)} of your $${(settings.spendingCapCents / 100).toFixed(2)} spending cap.`,
          read: false,
          created_at: new Date().toISOString(),
        } as never);

        // Update last notified
        await updateOverageSettings(supabase, organizationId, {
          ...settings,
          currentSpendCents: newSpend,
          lastNotifiedAt: new Date().toISOString(),
        });

        break;
      }
    }
  }
}

// ============================================
// USAGE SUMMARY
// ============================================

export interface UsageSummary {
  plan: string;
  period: string;
  usage: {
    articles: { used: number; limit: number; percent: number };
    keywords: { used: number; limit: number; percent: number };
    audits: { used: number; limit: number; percent: number };
    aioAnalyses: { used: number; limit: number; percent: number };
    aiCredits: { used: number; limit: number; percent: number };
  };
  overage: {
    enabled: boolean;
    spendingCapDollars: number;
    currentSpendDollars: number;
    remainingDollars: number;
    percentUsed: number;
    autoIncrease: boolean;
  };
}

export async function getUsageSummary(organizationId: string): Promise<UsageSummary | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data: org } = await supabase
    .from("organizations")
    .select("plan, overage_settings")
    .eq("id", organizationId)
    .single();

  if (!org) return null;

  const orgData = org as { plan: string; overage_settings: OverageSettings | null };
  const plan = orgData.plan || "starter";
  const overageSettings = orgData.overage_settings || getDefaultOverageSettings();

  const period = getCurrentPeriod();
  const { data: usage } = await supabase
    .from("usage")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("period", period)
    .single();

  const currentUsage = usage as Record<string, number> | null;
  const limits = getPlanLimits(plan);

  const makeUsageStat = (used: number, limit: number) => ({
    used,
    limit,
    percent: limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0,
  });

  return {
    plan,
    period,
    usage: {
      articles: makeUsageStat(
        currentUsage?.articles_generated || 0,
        limits.articlesPerMonth
      ),
      keywords: makeUsageStat(
        currentUsage?.keywords_analyzed || 0,
        limits.keywordsTracked
      ),
      audits: makeUsageStat(
        currentUsage?.audits_run || 0,
        limits.auditsPerMonth
      ),
      aioAnalyses: makeUsageStat(
        currentUsage?.aio_analyses || 0,
        limits.aioAnalysesPerMonth
      ),
      aiCredits: makeUsageStat(
        currentUsage?.ai_credits_used || 0,
        limits.aiCreditsPerMonth
      ),
    },
    overage: {
      enabled: overageSettings.enabled,
      spendingCapDollars: overageSettings.spendingCapCents / 100,
      currentSpendDollars: overageSettings.currentSpendCents / 100,
      remainingDollars: Math.max(0, (overageSettings.spendingCapCents - overageSettings.currentSpendCents) / 100),
      percentUsed: overageSettings.spendingCapCents > 0
        ? Math.round((overageSettings.currentSpendCents / overageSettings.spendingCapCents) * 100)
        : 0,
      autoIncrease: overageSettings.autoIncreaseEnabled,
    },
  };
}

