/**
 * Overage Manager
 * 
 * Logic:
 * 1. User hits plan limit
 * 2. They choose: Upgrade plan OR set a spending cap
 * 3. If spending cap set, they continue using at 90% markup
 * 4. Once cap is reached, they're blocked until they increase cap
 * 5. We bill in real-time - never front costs
 * 
 * This is PAY-TO-USE, not prepaid credits.
 */

import { createClient } from "@/lib/supabase/server";
import { getPlanLimits, OVERAGE_PRICES, INTERNAL_COSTS } from "./plans";
import { dodo } from "./dodo-client";

// ============================================
// TYPES
// ============================================

export interface OverageSettings {
  enabled: boolean;
  spendingCapCents: number;      // e.g., 10000 = $100.00
  currentSpendCents: number;     // How much they've used this billing period
  autoIncreaseEnabled: boolean;  // Auto-bump cap by $50 when hit?
  autoIncreaseAmountCents: number;
  notifyAt: number[];            // Notify at 50%, 80%, 100%
  lastNotifiedAt: string | null;
}

export interface OverageCheckResult {
  allowed: boolean;
  reason?: string;
  action?: "upgrade" | "set_cap" | "increase_cap" | "ok";
  costCents?: number;
  remainingCents?: number;
  percentUsed?: number;
}

export interface OverageResource {
  type: keyof typeof OVERAGE_PRICES;
  amount: number;
  description?: string;
}

// Default settings for new users
export const DEFAULT_OVERAGE_SETTINGS: OverageSettings = {
  enabled: false,
  spendingCapCents: 0,
  currentSpendCents: 0,
  autoIncreaseEnabled: false,
  autoIncreaseAmountCents: 5000, // $50 default auto-bump
  notifyAt: [50, 80, 100],
  lastNotifiedAt: null,
};

// ============================================
// CORE FUNCTIONS
// ============================================

/**
 * Check if user can perform an action that may incur overage
 */
export async function checkOverage(
  organizationId: string,
  resource: OverageResource
): Promise<OverageCheckResult> {
  const supabase = await createClient();
  if (!supabase) {
    return { allowed: false, reason: "Database not configured", action: "ok" };
  }

  // Get org's plan and overage settings
  const { data: org } = await supabase
    .from("organizations")
    .select("plan, overage_settings")
    .eq("id", organizationId)
    .single();

  if (!org) {
    return { allowed: false, reason: "Organization not found", action: "ok" };
  }

  const plan = (org as { plan?: string }).plan || "starter";
  const settings = ((org as { overage_settings?: OverageSettings }).overage_settings) || DEFAULT_OVERAGE_SETTINGS;

  // Get current usage for this billing period
  const { data: usage } = await supabase
    .from("usage")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("period", getCurrentPeriod())
    .single();

  const currentUsage = usage as Record<string, number> | null;

  // Map resource type to usage field and plan limit field
  const resourceMapping: Record<string, { usageField: string; limitField: string }> = {
    articles: { usageField: "articles_generated", limitField: "articlesPerMonth" },
    keywords: { usageField: "keywords_analyzed", limitField: "keywordsTracked" },
    audits: { usageField: "audits_run", limitField: "auditsPerMonth" },
    aioAnalyses: { usageField: "aio_analyses", limitField: "aioAnalysesPerMonth" },
    aiCredits: { usageField: "ai_credits_used", limitField: "aiCreditsPerMonth" },
    serpAnalysis: { usageField: "serp_calls", limitField: "auditsPerMonth" }, // Share limit
    backlinks: { usageField: "backlink_checks", limitField: "auditsPerMonth" }, // Share limit
  };

  const mapping = resourceMapping[resource.type];
  if (!mapping) {
    return { allowed: true }; // Unknown resource, allow
  }

  const planLimits = getPlanLimits(plan);
  const limit = planLimits[mapping.limitField as keyof typeof planLimits] as number;
  const used = (currentUsage?.[mapping.usageField] as number) || 0;

  // Calculate cost for this operation
  const pricing = OVERAGE_PRICES[resource.type];
  let costCents = 0;
  
  if (resource.type === "keywords") {
    costCents = Math.ceil(resource.amount / 100) * pricing.pricePerUnit;
  } else if (resource.type === "aiCredits") {
    costCents = Math.ceil(resource.amount / 1000) * pricing.pricePerUnit;
  } else {
    costCents = resource.amount * pricing.pricePerUnit;
  }

  // Check if within plan limits
  if (used + resource.amount <= limit) {
    return { 
      allowed: true, 
      action: "ok",
      costCents: 0, // No overage cost
    };
  }

  // User is over plan limit - check overage settings
  if (!settings.enabled) {
    return {
      allowed: false,
      reason: "You've reached your plan limit. Enable overages or upgrade your plan to continue.",
      action: "set_cap",
      costCents,
    };
  }

  // Overage is enabled - check spending cap
  const projectedSpend = settings.currentSpendCents + costCents;
  const remainingCents = settings.spendingCapCents - settings.currentSpendCents;
  const percentUsed = Math.round((settings.currentSpendCents / settings.spendingCapCents) * 100);

  if (projectedSpend > settings.spendingCapCents) {
    // Would exceed cap
    if (settings.autoIncreaseEnabled) {
      // Auto-increase cap
      const newCap = settings.spendingCapCents + settings.autoIncreaseAmountCents;
      await updateOverageSettings(organizationId, {
        ...settings,
        spendingCapCents: newCap,
      });
      
      return {
        allowed: true,
        action: "ok",
        costCents,
        remainingCents: newCap - projectedSpend,
        percentUsed: Math.round((projectedSpend / newCap) * 100),
      };
    }

    return {
      allowed: false,
      reason: `Spending cap of $${(settings.spendingCapCents / 100).toFixed(2)} reached. Increase your cap or upgrade your plan.`,
      action: "increase_cap",
      costCents,
      remainingCents: 0,
      percentUsed: 100,
    };
  }

  // Within cap - allowed
  return {
    allowed: true,
    action: "ok",
    costCents,
    remainingCents: remainingCents - costCents,
    percentUsed: Math.round((projectedSpend / settings.spendingCapCents) * 100),
  };
}

/**
 * Record overage usage and charge
 */
export async function recordOverage(
  organizationId: string,
  resource: OverageResource
): Promise<{ success: boolean; costCents: number; error?: string }> {
  const supabase = await createClient();
  if (!supabase) {
    return { success: false, costCents: 0, error: "Database not configured" };
  }

  // First check if allowed
  const check = await checkOverage(organizationId, resource);
  if (!check.allowed) {
    return { success: false, costCents: 0, error: check.reason };
  }

  const costCents = check.costCents || 0;

  // If no cost (within plan), just return
  if (costCents === 0) {
    return { success: true, costCents: 0 };
  }

  // Record the overage charge
  const { data: org } = await supabase
    .from("organizations")
    .select("overage_settings")
    .eq("id", organizationId)
    .single();

  const settings = ((org as { overage_settings?: OverageSettings } | null)?.overage_settings) || DEFAULT_OVERAGE_SETTINGS;
  
  // Update current spend
  const newSpend = settings.currentSpendCents + costCents;
  await updateOverageSettings(organizationId, {
    ...settings,
    currentSpendCents: newSpend,
  });

  // Record in overage_charges table for billing
  await supabase.from("overage_charges").insert({
    organization_id: organizationId,
    resource_type: resource.type,
    amount: resource.amount,
    cost_cents: costCents,
    description: resource.description || `${resource.amount} ${resource.type}`,
    created_at: new Date().toISOString(),
  } as never);

  // Report usage to Dodo for real-time billing
  if (dodo.isConfigured()) {
    try {
      // Get org's customer ID
      const { data: orgData } = await supabase
        .from("organizations")
        .select("stripe_customer_id")
        .eq("id", organizationId)
        .single();
      
      const customerId = (orgData as { stripe_customer_id?: string } | null)?.stripe_customer_id;
      
      if (customerId) {
        const client = dodo.getClient();
        await client.usageEvents.ingest({
          events: [{
            customer_id: customerId,
            event_id: `${organizationId}-${resource.type}-${Date.now()}`,
            event_name: `overage_${resource.type}`,
            timestamp: new Date().toISOString(),
            metadata: {
              amount: resource.amount,
              cost_cents: costCents,
              description: resource.description || `${resource.amount} ${resource.type}`,
            },
          }],
        });
      }
    } catch (e) {
      console.error("Failed to report usage to Dodo:", e);
      // Don't fail the operation - usage is still tracked locally
    }
  }

  // Check if we need to send notification
  await checkAndNotify(organizationId, settings, newSpend);

  return { success: true, costCents };
}

/**
 * Update overage settings for an org
 */
export async function updateOverageSettings(
  organizationId: string,
  settings: Partial<OverageSettings>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  if (!supabase) {
    return { success: false, error: "Database not configured" };
  }

  const { error } = await supabase
    .from("organizations")
    .update({
      overage_settings: settings,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", organizationId);

  if (error) {
    console.error("Failed to update overage settings:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Get overage settings for an org
 */
export async function getOverageSettings(
  organizationId: string
): Promise<OverageSettings> {
  const supabase = await createClient();
  if (!supabase) {
    return DEFAULT_OVERAGE_SETTINGS;
  }

  const { data: org } = await supabase
    .from("organizations")
    .select("overage_settings")
    .eq("id", organizationId)
    .single();

  return ((org as { overage_settings?: OverageSettings } | null)?.overage_settings) || DEFAULT_OVERAGE_SETTINGS;
}

/**
 * Enable overages with a spending cap
 */
export async function enableOverages(
  organizationId: string,
  spendingCapCents: number,
  autoIncrease: boolean = false
): Promise<{ success: boolean; error?: string }> {
  return updateOverageSettings(organizationId, {
    enabled: true,
    spendingCapCents,
    currentSpendCents: 0,
    autoIncreaseEnabled: autoIncrease,
    autoIncreaseAmountCents: 5000, // $50
    notifyAt: [50, 80, 100],
    lastNotifiedAt: null,
  });
}

/**
 * Disable overages (user will be blocked at plan limit)
 */
export async function disableOverages(
  organizationId: string
): Promise<{ success: boolean; error?: string }> {
  return updateOverageSettings(organizationId, {
    enabled: false,
    spendingCapCents: 0,
    currentSpendCents: 0,
  });
}

/**
 * Increase spending cap
 */
export async function increaseSpendingCap(
  organizationId: string,
  additionalCents: number
): Promise<{ success: boolean; newCapCents: number; error?: string }> {
  const settings = await getOverageSettings(organizationId);
  const newCap = settings.spendingCapCents + additionalCents;
  
  const result = await updateOverageSettings(organizationId, {
    ...settings,
    spendingCapCents: newCap,
  });

  return { ...result, newCapCents: newCap };
}

/**
 * Reset overage spend at start of new billing period
 */
export async function resetOverageSpend(
  organizationId: string
): Promise<{ success: boolean; error?: string }> {
  const settings = await getOverageSettings(organizationId);
  
  return updateOverageSettings(organizationId, {
    ...settings,
    currentSpendCents: 0,
    lastNotifiedAt: null,
  });
}

/**
 * Get current overage summary for display
 */
export async function getOverageSummary(
  organizationId: string
): Promise<{
  enabled: boolean;
  spendingCapDollars: number;
  currentSpendDollars: number;
  remainingDollars: number;
  percentUsed: number;
  autoIncrease: boolean;
}> {
  const settings = await getOverageSettings(organizationId);
  
  const spendingCapDollars = settings.spendingCapCents / 100;
  const currentSpendDollars = settings.currentSpendCents / 100;
  const remainingDollars = Math.max(0, spendingCapDollars - currentSpendDollars);
  const percentUsed = settings.spendingCapCents > 0 
    ? Math.round((settings.currentSpendCents / settings.spendingCapCents) * 100)
    : 0;

  return {
    enabled: settings.enabled,
    spendingCapDollars,
    currentSpendDollars,
    remainingDollars,
    percentUsed,
    autoIncrease: settings.autoIncreaseEnabled,
  };
}

// ============================================
// HELPERS
// ============================================

function getCurrentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

async function checkAndNotify(
  organizationId: string,
  settings: OverageSettings,
  newSpend: number
): Promise<void> {
  if (!settings.spendingCapCents) return;

  const percentUsed = Math.round((newSpend / settings.spendingCapCents) * 100);
  
  // Find thresholds we've crossed
  for (const threshold of settings.notifyAt) {
    if (percentUsed >= threshold) {
      // Check if we already notified for this threshold
      const lastNotified = settings.lastNotifiedAt 
        ? new Date(settings.lastNotifiedAt).getTime()
        : 0;
      const hourAgo = Date.now() - 3600000;
      
      if (lastNotified < hourAgo) {
        // Send notification (import dynamically to avoid circular deps)
        try {
          const { emailService } = await import("@/lib/email");
          const supabase = await createClient();
          
          if (supabase) {
            // Get org owner email
            const { data: owner } = await supabase
              .from("users")
              .select("email, name")
              .eq("organization_id", organizationId)
              .eq("role", "owner")
              .single();

            if (owner) {
              const ownerData = owner as { email: string; name: string };
              await emailService.sendUsageAlert(
                ownerData.email,
                "Overage Spending",
                Math.round(percentUsed),
                100
              );
            }
          }
        } catch (e) {
          console.error("Failed to send overage notification:", e);
        }

        // Update last notified
        await updateOverageSettings(organizationId, {
          ...settings,
          currentSpendCents: newSpend,
          lastNotifiedAt: new Date().toISOString(),
        });
        
        break; // Only send one notification
      }
    }
  }
}

// ============================================
// CALCULATE OVERAGE COST
// ============================================

/**
 * Calculate what an operation would cost as overage
 */
export function calculateOverageCost(
  resource: keyof typeof OVERAGE_PRICES,
  amount: number
): { costCents: number; ourCostCents: number; marginPercent: number } {
  const pricing = OVERAGE_PRICES[resource];
  
  let units = amount;
  if (resource === "keywords") {
    units = Math.ceil(amount / 100);
  } else if (resource === "aiCredits") {
    units = Math.ceil(amount / 1000);
  }

  const costCents = units * pricing.pricePerUnit;
  const ourCostCents = units * pricing.costPerUnit;
  const marginPercent = Math.round(((costCents - ourCostCents) / costCents) * 100);

  return { costCents, ourCostCents, marginPercent };
}

