/**
 * Usage Tracker for CabbageSEO
 * 
 * Tracks usage against plan limits with Cursor-style on-demand credits:
 * - Track usage in real-time
 * - Check against plan limits
 * - Deduct from on-demand balance when over limit
 * - Block requests when no credits available
 */

import { createServiceClient } from "@/lib/supabase/server";
import { getPlan, USAGE_COSTS } from "./plans";
import { dodo } from "./dodo-client";

// ============================================
// TYPES
// ============================================

export type UsageType = 
  | "ai_credits"
  | "keyword_researches"
  | "content_generations"
  | "audit_reports"
  | "pages_crawled";

export interface UsageRecord {
  type: UsageType;
  quantity: number;
  cost: number;  // In cents
  metadata?: Record<string, unknown>;
}

export interface UsageStatus {
  type: UsageType;
  used: number;
  limit: number;
  remaining: number;
  overageUsed: number;
  overageCost: number;
}

export interface OrganizationUsage {
  organizationId: string;
  planId: string;
  periodStart: string;
  periodEnd: string;
  usage: Record<UsageType, number>;
  onDemandBalance: number;  // Prepaid credit balance in cents
  onDemandSpent: number;    // Spent from on-demand in current period
}

// ============================================
// USAGE TRACKER CLASS
// ============================================

export class UsageTracker {
  /**
   * Track usage and deduct from plan or on-demand balance
   */
  async trackUsage(
    organizationId: string,
    type: UsageType,
    quantity: number,
    metadata?: Record<string, unknown>
  ): Promise<{
    allowed: boolean;
    source: "plan" | "on-demand" | "blocked";
    remaining?: number;
    cost?: number;
    message?: string;
  }> {
    const supabase = createServiceClient();

    // Get organization with subscription info
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: org } = await (supabase as any)
      .from("organizations")
      .select(`
        id,
        plan_id,
        subscription_status,
        on_demand_balance,
        on_demand_enabled,
        billing_period_start,
        billing_period_end
      `)
      .eq("id", organizationId)
      .single();

    if (!org) {
      return {
        allowed: false,
        source: "blocked",
        message: "Organization not found",
      };
    }

    // Get current period usage
    const currentUsage = await this.getCurrentUsage(organizationId, type);
    const plan = getPlan(org.plan_id || "starter");
    
    if (!plan) {
      return {
        allowed: false,
        source: "blocked",
        message: "Invalid plan",
      };
    }

    // Get limit for this usage type
    const limit = this.getLimitForType(plan, type);
    const newTotal = currentUsage + quantity;

    // Check if within plan limits
    if (newTotal <= limit) {
      // Record usage under plan
      await this.recordUsage(organizationId, type, quantity, 0, metadata);
      
      return {
        allowed: true,
        source: "plan",
        remaining: limit - newTotal,
      };
    }

    // Over plan limit - check on-demand
    const overageQuantity = newTotal - limit;
    const overageCost = this.calculateCost(type, overageQuantity);

    // Check if on-demand is enabled and has balance
    if (!org.on_demand_enabled || org.on_demand_balance < overageCost) {
      return {
        allowed: false,
        source: "blocked",
        message: org.on_demand_enabled 
          ? "Insufficient on-demand credits. Please add more credits."
          : "Plan limit reached. Enable on-demand credits to continue.",
        cost: overageCost,
      };
    }

    // Deduct from on-demand balance
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("organizations")
      .update({
        on_demand_balance: org.on_demand_balance - overageCost,
      })
      .eq("id", organizationId);

    // Record usage with cost
    await this.recordUsage(organizationId, type, quantity, overageCost, metadata);

    return {
      allowed: true,
      source: "on-demand",
      cost: overageCost,
      remaining: org.on_demand_balance - overageCost,
    };
  }

  /**
   * Check if usage would be allowed (without recording)
   */
  async checkUsage(
    organizationId: string,
    type: UsageType,
    quantity: number
  ): Promise<{
    allowed: boolean;
    source: "plan" | "on-demand" | "blocked";
    cost?: number;
    message?: string;
  }> {
    const supabase = createServiceClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: org } = await (supabase as any)
      .from("organizations")
      .select("id, plan_id, on_demand_balance, on_demand_enabled")
      .eq("id", organizationId)
      .single();

    if (!org) {
      return { allowed: false, source: "blocked", message: "Organization not found" };
    }

    const currentUsage = await this.getCurrentUsage(organizationId, type);
    const plan = getPlan(org.plan_id || "starter");
    
    if (!plan) {
      return { allowed: false, source: "blocked", message: "Invalid plan" };
    }

    const limit = this.getLimitForType(plan, type);
    const newTotal = currentUsage + quantity;

    if (newTotal <= limit) {
      return { allowed: true, source: "plan" };
    }

    const overageQuantity = newTotal - limit;
    const overageCost = this.calculateCost(type, overageQuantity);

    if (!org.on_demand_enabled) {
      return {
        allowed: false,
        source: "blocked",
        message: "Plan limit reached. Enable on-demand credits to continue.",
        cost: overageCost,
      };
    }

    if (org.on_demand_balance < overageCost) {
      return {
        allowed: false,
        source: "blocked",
        message: "Insufficient on-demand credits.",
        cost: overageCost,
      };
    }

    return {
      allowed: true,
      source: "on-demand",
      cost: overageCost,
    };
  }

  /**
   * Get current usage for a type in the current billing period
   */
  async getCurrentUsage(organizationId: string, type: UsageType): Promise<number> {
    const supabase = createServiceClient();

    // Get billing period start
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: org } = await (supabase as any)
      .from("organizations")
      .select("billing_period_start")
      .eq("id", organizationId)
      .single();

    const periodStart = org?.billing_period_start || 
      new Date(new Date().setDate(1)).toISOString();

    // Sum usage for this period
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from("usage_records")
      .select("quantity")
      .eq("organization_id", organizationId)
      .eq("type", type)
      .gte("created_at", periodStart);

    return (data || []).reduce((sum: number, r: { quantity: number }) => sum + r.quantity, 0);
  }

  /**
   * Get all usage stats for an organization
   */
  async getAllUsageStats(organizationId: string): Promise<UsageStatus[]> {
    const supabase = createServiceClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: org } = await (supabase as any)
      .from("organizations")
      .select("plan_id, billing_period_start")
      .eq("id", organizationId)
      .single();

    const plan = getPlan(org?.plan_id || "starter");
    if (!plan) return [];

    const types: UsageType[] = [
      "ai_credits",
      "keyword_researches",
      "content_generations",
      "audit_reports",
      "pages_crawled",
    ];

    const stats: UsageStatus[] = [];

    for (const type of types) {
      const used = await this.getCurrentUsage(organizationId, type);
      const limit = this.getLimitForType(plan, type);
      const overageUsed = Math.max(0, used - limit);
      const overageCost = this.calculateCost(type, overageUsed);

      stats.push({
        type,
        used,
        limit,
        remaining: Math.max(0, limit - used),
        overageUsed,
        overageCost,
      });
    }

    return stats;
  }

  /**
   * Add on-demand credits to organization
   */
  async addOnDemandCredits(
    organizationId: string,
    amountInCents: number,
    paymentIntentId?: string
  ): Promise<{ newBalance: number }> {
    const supabase = createServiceClient();

    // Get current balance
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: org } = await (supabase as any)
      .from("organizations")
      .select("on_demand_balance")
      .eq("id", organizationId)
      .single();

    const newBalance = (org?.on_demand_balance || 0) + amountInCents;

    // Update balance
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("organizations")
      .update({
        on_demand_balance: newBalance,
        on_demand_enabled: true,
      })
      .eq("id", organizationId);

    // Record transaction
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("credit_transactions")
      .insert({
        organization_id: organizationId,
        type: "purchase",
        amount: amountInCents,
        balance_after: newBalance,
        payment_intent_id: paymentIntentId,
        created_at: new Date().toISOString(),
      });

    return { newBalance };
  }

  /**
   * Enable/disable on-demand for an organization
   */
  async setOnDemandEnabled(
    organizationId: string,
    enabled: boolean
  ): Promise<void> {
    const supabase = createServiceClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("organizations")
      .update({ on_demand_enabled: enabled })
      .eq("id", organizationId);
  }

  /**
   * Get on-demand balance
   */
  async getOnDemandBalance(organizationId: string): Promise<{
    balance: number;
    enabled: boolean;
  }> {
    const supabase = createServiceClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from("organizations")
      .select("on_demand_balance, on_demand_enabled")
      .eq("id", organizationId)
      .single();

    return {
      balance: data?.on_demand_balance || 0,
      enabled: data?.on_demand_enabled || false,
    };
  }

  /**
   * Reset usage for new billing period
   */
  async resetUsageForNewPeriod(organizationId: string): Promise<void> {
    const supabase = createServiceClient();

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("organizations")
      .update({
        billing_period_start: now.toISOString(),
        billing_period_end: periodEnd.toISOString(),
      })
      .eq("id", organizationId);
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  private async recordUsage(
    organizationId: string,
    type: UsageType,
    quantity: number,
    cost: number,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const supabase = createServiceClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("usage_records")
      .insert({
        organization_id: organizationId,
        type,
        quantity,
        cost,
        metadata,
        created_at: new Date().toISOString(),
      });
  }

  private getLimitForType(plan: ReturnType<typeof getPlan>, type: UsageType): number {
    if (!plan) return 0;

    const limitMap: Record<UsageType, keyof typeof plan.limits> = {
      ai_credits: "aiCredits",
      keyword_researches: "keywordResearches",
      content_generations: "contentGenerations",
      audit_reports: "auditReports",
      pages_crawled: "pagesPerCrawl",
    };

    const key = limitMap[type];
    return plan.limits[key] || 0;
  }

  private calculateCost(type: UsageType, quantity: number): number {
    // Cost calculation with 90% markup
    const costMap: Record<UsageType, number> = {
      ai_credits: USAGE_COSTS.claudeSonnet,  // Per 1k tokens
      keyword_researches: USAGE_COSTS.keywordData * 50,  // ~50 keywords per research
      content_generations: USAGE_COSTS.claudeSonnet * 4,  // ~4k tokens per article
      audit_reports: USAGE_COSTS.serpAnalysis * 10,  // ~10 SERP checks per audit
      pages_crawled: 0.5,  // $0.005 per page
    };

    const unitCost = costMap[type] || 0;
    
    // Scale based on type
    if (type === "ai_credits") {
      return Math.ceil((quantity / 1000) * unitCost);
    }
    
    return Math.ceil(quantity * unitCost);
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const usageTracker = new UsageTracker();

