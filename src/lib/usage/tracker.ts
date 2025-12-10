/**
 * Usage Tracking & Rate Limiting System
 * 
 * Implements Cursor-style on-demand usage:
 * 1. Users have plan limits (e.g., 40 articles/month)
 * 2. When exceeded, they can use "on-demand" (billed in arrears)
 * 3. On-demand has a configurable spending limit
 * 4. DDoS protection via rate limiting
 */

import { PLANS, OVERAGES, type PlanId } from "@/config/plans";

// Types
export type UsageType = 
  | "article_generation"
  | "keyword_analysis"
  | "serp_call"
  | "page_crawl"
  | "content_optimization"
  | "internal_link_analysis"
  | "schema_generation"
  | "meta_generation";

export interface UsageRecord {
  organizationId: string;
  periodStart: Date;
  periodEnd: Date;
  
  // Usage counts
  articlesGenerated: number;
  keywordsAnalyzed: number;
  serpCalls: number;
  pagesCrawled: number;
  optimizations: number;
  
  // Plan limits (snapshot)
  articlesLimit: number;
  keywordsLimit: number;
  serpCallsLimit: number;
  crawlPagesLimit: number;
  
  // On-demand usage
  onDemandEnabled: boolean;
  onDemandSpendLimitCents: number; // e.g., 30000 = $300
  onDemandSpentCents: number;
  
  // Overages
  totalOverageCents: number;
  overageInvoiced: boolean;
}

export interface UsageCheckResult {
  allowed: boolean;
  reason?: string;
  isOnDemand: boolean;
  costCents: number;
  remainingInPlan: number;
  onDemandRemaining: number;
}

// Rate limiting configuration
const RATE_LIMITS = {
  // Per-minute limits by endpoint type
  api_general: { requests: 60, windowMs: 60000 },
  article_generation: { requests: 10, windowMs: 60000 },
  keyword_research: { requests: 30, windowMs: 60000 },
  serp_analysis: { requests: 100, windowMs: 60000 },
  crawl: { requests: 50, windowMs: 60000 },
  
  // Per-day limits (DDoS protection)
  daily_max: { requests: 10000, windowMs: 86400000 },
} as const;

// In-memory rate limit store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Check if request is rate limited
 */
export function checkRateLimit(
  identifier: string, // e.g., "org_123:article_generation"
  limitType: keyof typeof RATE_LIMITS
): { allowed: boolean; retryAfterMs?: number } {
  const limit = RATE_LIMITS[limitType];
  const now = Date.now();
  const key = `${identifier}:${limitType}`;
  
  const record = rateLimitStore.get(key);
  
  if (!record || now > record.resetAt) {
    // New window
    rateLimitStore.set(key, { count: 1, resetAt: now + limit.windowMs });
    return { allowed: true };
  }
  
  if (record.count >= limit.requests) {
    return { 
      allowed: false, 
      retryAfterMs: record.resetAt - now 
    };
  }
  
  record.count++;
  return { allowed: true };
}

/**
 * Check if usage is allowed based on plan + on-demand settings
 */
export function checkUsageAllowed(
  usage: UsageRecord,
  usageType: UsageType,
  quantity: number = 1
): UsageCheckResult {
  // Map usage type to the right counters
  const mapping: Record<UsageType, { used: keyof UsageRecord; limit: keyof UsageRecord; costKey: string }> = {
    article_generation: { used: "articlesGenerated", limit: "articlesLimit", costKey: "article_generation" },
    keyword_analysis: { used: "keywordsAnalyzed", limit: "keywordsLimit", costKey: "keyword_analysis" },
    serp_call: { used: "serpCalls", limit: "serpCallsLimit", costKey: "serp_call" },
    page_crawl: { used: "pagesCrawled", limit: "crawlPagesLimit", costKey: "page_crawl" },
    content_optimization: { used: "optimizations", limit: "articlesLimit", costKey: "content_optimization" },
    internal_link_analysis: { used: "pagesCrawled", limit: "crawlPagesLimit", costKey: "internal_link_analysis" },
    schema_generation: { used: "articlesGenerated", limit: "articlesLimit", costKey: "schema_generation" },
    meta_generation: { used: "articlesGenerated", limit: "articlesLimit", costKey: "meta_generation" },
  };
  
  const { used, limit, costKey } = mapping[usageType];
  const currentUsed = usage[used] as number;
  const planLimit = usage[limit] as number;
  const remaining = planLimit - currentUsed;
  
  // Get cost for this usage type
  const overage = OVERAGES[costKey];
  const costPerUnit = overage?.priceCents || 0;
  
  // Case 1: Within plan limits
  if (currentUsed + quantity <= planLimit) {
    return {
      allowed: true,
      isOnDemand: false,
      costCents: 0,
      remainingInPlan: remaining - quantity,
      onDemandRemaining: usage.onDemandEnabled 
        ? usage.onDemandSpendLimitCents - usage.onDemandSpentCents 
        : 0,
    };
  }
  
  // Case 2: Exceeds plan - check on-demand
  if (!usage.onDemandEnabled) {
    return {
      allowed: false,
      reason: "Plan limit reached. Enable on-demand usage to continue.",
      isOnDemand: false,
      costCents: 0,
      remainingInPlan: Math.max(0, remaining),
      onDemandRemaining: 0,
    };
  }
  
  // Calculate on-demand cost
  const unitsOverPlan = Math.max(0, (currentUsed + quantity) - planLimit);
  const onDemandCost = unitsOverPlan * costPerUnit;
  const projectedSpent = usage.onDemandSpentCents + onDemandCost;
  
  // Case 3: On-demand but would exceed spending limit
  if (projectedSpent > usage.onDemandSpendLimitCents) {
    return {
      allowed: false,
      reason: `On-demand spending limit ($${(usage.onDemandSpendLimitCents / 100).toFixed(2)}) would be exceeded. Increase your limit to continue.`,
      isOnDemand: true,
      costCents: onDemandCost,
      remainingInPlan: 0,
      onDemandRemaining: usage.onDemandSpendLimitCents - usage.onDemandSpentCents,
    };
  }
  
  // Case 4: On-demand allowed
  return {
    allowed: true,
    isOnDemand: true,
    costCents: onDemandCost,
    remainingInPlan: 0,
    onDemandRemaining: usage.onDemandSpendLimitCents - projectedSpent,
  };
}

/**
 * Calculate usage summary for display
 */
export function getUsageSummary(
  usage: UsageRecord,
  plan: PlanId
): {
  articles: { used: number; limit: number; percentage: number };
  keywords: { used: number; limit: number; percentage: number };
  serpCalls: { used: number; limit: number; percentage: number };
  crawlPages: { used: number; limit: number; percentage: number };
  onDemand: {
    enabled: boolean;
    spent: number;
    limit: number;
    percentage: number;
  };
  totalOverage: number;
} {
  const planLimits = PLANS[plan].limits;
  
  return {
    articles: {
      used: usage.articlesGenerated,
      limit: planLimits.articles,
      percentage: Math.min(100, (usage.articlesGenerated / planLimits.articles) * 100),
    },
    keywords: {
      used: usage.keywordsAnalyzed,
      limit: planLimits.keywords,
      percentage: Math.min(100, (usage.keywordsAnalyzed / planLimits.keywords) * 100),
    },
    serpCalls: {
      used: usage.serpCalls,
      limit: planLimits.serpCalls,
      percentage: Math.min(100, (usage.serpCalls / planLimits.serpCalls) * 100),
    },
    crawlPages: {
      used: usage.pagesCrawled,
      limit: planLimits.crawlPages,
      percentage: Math.min(100, (usage.pagesCrawled / planLimits.crawlPages) * 100),
    },
    onDemand: {
      enabled: usage.onDemandEnabled,
      spent: usage.onDemandSpentCents / 100,
      limit: usage.onDemandSpendLimitCents / 100,
      percentage: usage.onDemandSpendLimitCents > 0 
        ? (usage.onDemandSpentCents / usage.onDemandSpendLimitCents) * 100 
        : 0,
    },
    totalOverage: usage.totalOverageCents / 100,
  };
}

/**
 * Get warning thresholds
 */
export function getUsageWarnings(
  usage: UsageRecord,
  plan: PlanId
): string[] {
  const warnings: string[] = [];
  const summary = getUsageSummary(usage, plan);
  
  // 80% threshold warnings
  if (summary.articles.percentage >= 80 && summary.articles.percentage < 100) {
    warnings.push(`You've used ${summary.articles.percentage.toFixed(0)}% of your article generation limit.`);
  }
  if (summary.keywords.percentage >= 80 && summary.keywords.percentage < 100) {
    warnings.push(`You've used ${summary.keywords.percentage.toFixed(0)}% of your keyword analysis limit.`);
  }
  
  // 100% threshold warnings
  if (summary.articles.percentage >= 100) {
    warnings.push(
      usage.onDemandEnabled 
        ? "Article limit reached. Additional articles will use on-demand credits."
        : "Article limit reached. Enable on-demand usage to continue."
    );
  }
  
  // On-demand spending warnings
  if (usage.onDemandEnabled && summary.onDemand.percentage >= 80) {
    warnings.push(`You've used ${summary.onDemand.percentage.toFixed(0)}% of your on-demand spending limit.`);
  }
  
  return warnings;
}

/**
 * Estimate cost for a batch operation
 */
export function estimateBatchCost(
  usage: UsageRecord,
  operations: Array<{ type: UsageType; quantity: number }>
): {
  totalCostCents: number;
  breakdown: Array<{
    type: UsageType;
    quantity: number;
    inPlan: number;
    onDemand: number;
    costCents: number;
  }>;
  willExceedLimit: boolean;
} {
  let runningUsage = { ...usage };
  const breakdown: Array<{
    type: UsageType;
    quantity: number;
    inPlan: number;
    onDemand: number;
    costCents: number;
  }> = [];
  let totalCostCents = 0;
  let willExceedLimit = false;
  
  for (const op of operations) {
    const check = checkUsageAllowed(runningUsage, op.type, op.quantity);
    
    if (!check.allowed) {
      willExceedLimit = true;
    }
    
    const inPlan = Math.max(0, check.remainingInPlan);
    const onDemand = op.quantity - inPlan;
    
    breakdown.push({
      type: op.type,
      quantity: op.quantity,
      inPlan: Math.min(op.quantity, inPlan),
      onDemand: Math.max(0, onDemand),
      costCents: check.costCents,
    });
    
    totalCostCents += check.costCents;
    
    // Update running usage for next iteration
    // This is a simplified version - real implementation would update the actual counters
  }
  
  return {
    totalCostCents,
    breakdown,
    willExceedLimit,
  };
}

