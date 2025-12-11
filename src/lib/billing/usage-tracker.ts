/**
 * Usage Tracking System for CabbageSEO
 * 
 * Tracks resource usage per organization:
 * - AI credits
 * - Articles generated
 * - Keywords tracked
 * - Audits run
 * - API calls
 * 
 * Enforces plan limits and manages overage credits
 */

import { createClient } from "@/lib/supabase/server";
import { getPlanLimits, type PlanLimits } from "./plans";

// ============================================
// TYPES
// ============================================

export interface UsageRecord {
  organizationId: string;
  period: string;  // YYYY-MM format
  aiCredits: number;
  articles: number;
  keywords: number;
  audits: number;
  serpCalls: number;
  crawls: number;
}

export interface UsageCheck {
  allowed: boolean;
  currentUsage: number;
  limit: number;
  remaining: number;
  overageCreditsAvailable: number;
  requiresOverage: boolean;
}

export interface CreditBalance {
  prepaidCredits: number;
  bonusCredits: number;
  totalCredits: number;
  expiresAt: string | null;
}

// ============================================
// USAGE TRACKER
// ============================================

export class UsageTracker {
  private organizationId: string;

  constructor(organizationId: string) {
    this.organizationId = organizationId;
  }

  /**
   * Get current period (YYYY-MM)
   */
  private getCurrentPeriod(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }

  /**
   * Get or create usage record for current period
   */
  async getUsage(): Promise<UsageRecord> {
    const supabase = await createClient();
    if (!supabase) {
      return this.emptyUsage();
    }

    const period = this.getCurrentPeriod();

    const { data, error } = await supabase
      .from("usage")
      .select("*")
      .eq("organization_id", this.organizationId)
      .eq("period", period)
      .single();

    if (error || !data) {
      // Create new usage record
      await supabase.from("usage").insert({
        organization_id: this.organizationId,
        period,
        ai_credits: 0,
        articles: 0,
        keywords: 0,
        audits: 0,
        serp_calls: 0,
        crawls: 0,
      } as never);

      return this.emptyUsage();
    }

    const usage = data as Record<string, number>;
    return {
      organizationId: this.organizationId,
      period,
      aiCredits: usage.ai_credits || 0,
      articles: usage.articles || 0,
      keywords: usage.keywords || 0,
      audits: usage.audits || 0,
      serpCalls: usage.serp_calls || 0,
      crawls: usage.crawls || 0,
    };
  }

  /**
   * Get organization's plan
   */
  async getPlan(): Promise<string> {
    const supabase = await createClient();
    if (!supabase) return "starter";

    const { data } = await supabase
      .from("organizations")
      .select("plan")
      .eq("id", this.organizationId)
      .single();

    return data?.plan || "starter";
  }

  /**
   * Check if a resource can be used
   */
  async checkUsage(
    resource: keyof PlanLimits,
    amount: number = 1
  ): Promise<UsageCheck> {
    const [usage, plan, credits] = await Promise.all([
      this.getUsage(),
      this.getPlan(),
      this.getCreditBalance(),
    ]);

    const limits = getPlanLimits(plan);
    const limit = limits[resource];
    const currentUsage = this.getResourceUsage(usage, resource);
    const remaining = Math.max(0, limit - currentUsage);
    const requiresOverage = amount > remaining;
    const overageNeeded = requiresOverage ? amount - remaining : 0;

    return {
      allowed: !requiresOverage || credits.totalCredits >= overageNeeded,
      currentUsage,
      limit,
      remaining,
      overageCreditsAvailable: credits.totalCredits,
      requiresOverage,
    };
  }

  /**
   * Record usage of a resource
   */
  async recordUsage(
    resource: "aiCredits" | "articles" | "keywords" | "audits" | "serpCalls" | "crawls",
    amount: number = 1
  ): Promise<{ success: boolean; overageUsed: number }> {
    const supabase = await createClient();
    if (!supabase) return { success: false, overageUsed: 0 };

    const period = this.getCurrentPeriod();
    const columnMap: Record<string, string> = {
      aiCredits: "ai_credits",
      articles: "articles",
      keywords: "keywords",
      audits: "audits",
      serpCalls: "serp_calls",
      crawls: "crawls",
    };
    const column = columnMap[resource];

    // Check limits first
    const check = await this.checkUsage(resource as keyof PlanLimits, amount);
    
    if (!check.allowed) {
      return { success: false, overageUsed: 0 };
    }

    // Update usage
    const { error } = await supabase.rpc("increment_usage", {
      org_id: this.organizationId,
      period_str: period,
      column_name: column,
      increment_amount: amount,
    });

    if (error) {
      // Fallback: direct update
      const { data: current } = await supabase
        .from("usage")
        .select(column)
        .eq("organization_id", this.organizationId)
        .eq("period", period)
        .single();

      const currentValue = (current as Record<string, number>)?.[column] || 0;

      await supabase
        .from("usage")
        .upsert({
          organization_id: this.organizationId,
          period,
          [column]: currentValue + amount,
        }, {
          onConflict: "organization_id,period",
        });
    }

    // Deduct from overage credits if needed
    let overageUsed = 0;
    if (check.requiresOverage) {
      overageUsed = amount - check.remaining;
      await this.deductCredits(overageUsed);
    }

    return { success: true, overageUsed };
  }

  /**
   * Get prepaid credit balance
   */
  async getCreditBalance(): Promise<CreditBalance> {
    const supabase = await createClient();
    if (!supabase) {
      return { prepaidCredits: 0, bonusCredits: 0, totalCredits: 0, expiresAt: null };
    }

    const { data } = await supabase
      .from("credit_balance")
      .select("prepaid_credits, bonus_credits, expires_at")
      .eq("organization_id", this.organizationId)
      .single();

    if (!data) {
      return { prepaidCredits: 0, bonusCredits: 0, totalCredits: 0, expiresAt: null };
    }

    return {
      prepaidCredits: data.prepaid_credits || 0,
      bonusCredits: data.bonus_credits || 0,
      totalCredits: (data.prepaid_credits || 0) + (data.bonus_credits || 0),
      expiresAt: data.expires_at,
    };
  }

  /**
   * Add prepaid credits
   */
  async addCredits(amount: number, bonusAmount: number = 0): Promise<boolean> {
    const supabase = await createClient();
    if (!supabase) return false;

    const current = await this.getCreditBalance();
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);  // Credits expire in 1 year

    const { error } = await supabase
      .from("credit_balance")
      .upsert({
        organization_id: this.organizationId,
        prepaid_credits: current.prepaidCredits + amount,
        bonus_credits: current.bonusCredits + bonusAmount,
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "organization_id",
      });

    return !error;
  }

  /**
   * Deduct credits for overage
   */
  private async deductCredits(amount: number): Promise<boolean> {
    const supabase = await createClient();
    if (!supabase) return false;

    const current = await this.getCreditBalance();
    
    // Use bonus credits first, then prepaid
    let bonusToDeduct = Math.min(amount, current.bonusCredits);
    let prepaidToDeduct = amount - bonusToDeduct;

    const { error } = await supabase
      .from("credit_balance")
      .update({
        prepaid_credits: current.prepaidCredits - prepaidToDeduct,
        bonus_credits: current.bonusCredits - bonusToDeduct,
        updated_at: new Date().toISOString(),
      })
      .eq("organization_id", this.organizationId);

    return !error;
  }

  /**
   * Get usage summary for billing
   */
  async getUsageSummary(): Promise<{
    usage: UsageRecord;
    limits: PlanLimits;
    percentages: Record<string, number>;
    overageCreditsUsed: number;
    overageCreditsRemaining: number;
  }> {
    const [usage, plan, credits] = await Promise.all([
      this.getUsage(),
      this.getPlan(),
      this.getCreditBalance(),
    ]);

    const limits = getPlanLimits(plan);

    const percentages = {
      aiCredits: Math.round((usage.aiCredits / limits.aiCreditsPerMonth) * 100),
      articles: Math.round((usage.articles / limits.articlesPerMonth) * 100),
      keywords: Math.round((usage.keywords / limits.keywordsTracked) * 100),
      audits: Math.round((usage.audits / limits.auditsPerMonth) * 100),
    };

    return {
      usage,
      limits,
      percentages,
      overageCreditsUsed: 0, // Would come from a separate table
      overageCreditsRemaining: credits.totalCredits,
    };
  }

  // ============================================
  // HELPERS
  // ============================================

  private emptyUsage(): UsageRecord {
    return {
      organizationId: this.organizationId,
      period: this.getCurrentPeriod(),
      aiCredits: 0,
      articles: 0,
      keywords: 0,
      audits: 0,
      serpCalls: 0,
      crawls: 0,
    };
  }

  private getResourceUsage(usage: UsageRecord, resource: keyof PlanLimits): number {
    const mapping: Record<string, keyof UsageRecord> = {
      aiCreditsPerMonth: "aiCredits",
      articlesPerMonth: "articles",
      keywordsTracked: "keywords",
      auditsPerMonth: "audits",
      sites: "crawls",
      pagesPerSite: "crawls",
      teamMembers: "crawls",
    };
    return usage[mapping[resource] || "aiCredits"] || 0;
  }
}

// ============================================
// FACTORY
// ============================================

export function createUsageTracker(organizationId: string): UsageTracker {
  return new UsageTracker(organizationId);
}
