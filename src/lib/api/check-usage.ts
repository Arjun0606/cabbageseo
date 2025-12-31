/**
 * Usage Limit Checker
 * 
 * Check if user has remaining quota before performing operations
 * Increment usage after successful operations
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { getPlanLimits, PlanId } from "@/lib/billing/plans";

export type UsageType = "articles" | "keywords" | "audits" | "aio_analyses" | "ai_credits";

interface UsageCheckResult {
  allowed: boolean;
  current: number;
  limit: number;
  remaining: number;
  message?: string;
}

/**
 * Get current usage for the organization
 */
export async function getCurrentUsage(
  supabase: SupabaseClient,
  organizationId: string,
  usageType: UsageType
): Promise<number> {
  const now = new Date();
  const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const columnMap: Record<UsageType, string> = {
    articles: "articles_generated",
    keywords: "keywords_analyzed",
    audits: "audits_run",
    aio_analyses: "aio_analyses",
    ai_credits: "ai_credits_used",
  };

  const { data } = await supabase
    .from("usage")
    .select(columnMap[usageType])
    .eq("organization_id", organizationId)
    .eq("period", period)
    .single();

  if (!data || typeof data !== "object") return 0;
  const record = data as unknown as Record<string, number>;
  return record[columnMap[usageType]] || 0;
}

/**
 * Get the limit for a specific usage type based on plan
 */
export function getUsageLimit(plan: PlanId | string, usageType: UsageType): number {
  const limits = getPlanLimits(plan);
  
  const limitMap: Record<UsageType, keyof typeof limits> = {
    articles: "articlesPerMonth",
    keywords: "keywordsTracked",
    audits: "auditsPerMonth",
    aio_analyses: "aioAnalysesPerMonth",
    ai_credits: "aiCreditsPerMonth",
  };

  return limits[limitMap[usageType]];
}

/**
 * Check if user can perform an operation based on usage limits
 */
export async function checkUsageLimit(
  supabase: SupabaseClient,
  organizationId: string,
  plan: PlanId | string,
  usageType: UsageType,
  amount: number = 1
): Promise<UsageCheckResult> {
  const current = await getCurrentUsage(supabase, organizationId, usageType);
  const limit = getUsageLimit(plan, usageType);
  const remaining = Math.max(0, limit - current);
  const allowed = current + amount <= limit;

  const usageNames: Record<UsageType, string> = {
    articles: "articles",
    keywords: "keywords",
    audits: "audits",
    aio_analyses: "GEO analyses",
    ai_credits: "AI credits",
  };

  return {
    allowed,
    current,
    limit,
    remaining,
    message: allowed 
      ? undefined 
      : `You've reached your monthly limit of ${limit} ${usageNames[usageType]}. Upgrade your plan for more.`,
  };
}

/**
 * Increment usage after a successful operation
 */
export async function incrementUsage(
  supabase: SupabaseClient,
  organizationId: string,
  usageType: UsageType,
  amount: number = 1
): Promise<void> {
  const now = new Date();
  const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const columnMap: Record<UsageType, string> = {
    articles: "articles_generated",
    keywords: "keywords_analyzed",
    audits: "audits_run",
    aio_analyses: "aio_analyses",
    ai_credits: "ai_credits_used",
  };

  const column = columnMap[usageType];

  // Try to update existing row
  const { data: existing } = await supabase
    .from("usage")
    .select("id, " + column)
    .eq("organization_id", organizationId)
    .eq("period", period)
    .single();

  if (existing && typeof existing === "object") {
    // Update existing row
    const record = existing as unknown as Record<string, number | string>;
    const currentValue = (typeof record[column] === "number" ? record[column] : 0) as number;
    await supabase
      .from("usage")
      .update({ [column]: currentValue + amount } as never)
      .eq("id", record.id as string);
  } else {
    // Insert new row
    await supabase
      .from("usage")
      .insert({
        organization_id: organizationId,
        period,
        [column]: amount,
        // Initialize other columns to 0
        articles_generated: usageType === "articles" ? amount : 0,
        keywords_analyzed: usageType === "keywords" ? amount : 0,
        audits_run: usageType === "audits" ? amount : 0,
        aio_analyses: usageType === "aio_analyses" ? amount : 0,
        ai_credits_used: usageType === "ai_credits" ? amount : 0,
      } as never);
  }
}

/**
 * Check usage limit and return error response if exceeded
 */
export async function requireUsageLimit(
  supabase: SupabaseClient,
  organizationId: string,
  plan: PlanId | string,
  usageType: UsageType,
  amount: number = 1
): Promise<{ allowed: true; current: number; limit: number } | { allowed: false; error: { message: string; code: string; current: number; limit: number } }> {
  const result = await checkUsageLimit(supabase, organizationId, plan, usageType, amount);
  
  if (result.allowed) {
    return { allowed: true, current: result.current, limit: result.limit };
  }
  
  return {
    allowed: false,
    error: {
      message: result.message || "Usage limit exceeded",
      code: "USAGE_LIMIT_EXCEEDED",
      current: result.current,
      limit: result.limit,
    },
  };
}

