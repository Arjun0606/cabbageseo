/**
 * AI Usage Middleware
 * 
 * Wraps AI calls with:
 * 1. Usage limit checking (plan limits + on-demand)
 * 2. Cost tracking
 * 3. Automatic stopping when limits reached
 * 
 * This ensures users can't rack up charges beyond their limits
 */

import { 
  checkUsageAllowed, 
  recordUsage, 
  ActionType,
  PlanType,
  calculateUserCharge,
  formatCost,
} from "@/lib/billing/usage-manager";

interface UsageContext {
  organizationId: string;
  plan: PlanType;
  
  // Current period usage
  articlesUsed: number;
  keywordsUsed: number;
  serpCallsUsed: number;
  optimizationsUsed: number;
  
  // On-demand settings
  onDemandEnabled: boolean;
  onDemandLimitCents: number;
  onDemandSpentCents: number;
  
  // Period dates
  periodStart: Date;
  periodEnd: Date;
}

interface AICallResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  usage: {
    allowed: boolean;
    isOverage: boolean;
    internalCostCents: number;
    userChargedCents: number;
    remainingBudget?: string;
  };
}

/**
 * Wrap an AI call with usage checking and tracking
 */
export async function withUsageTracking<T>(
  context: UsageContext,
  actionType: ActionType,
  aiCall: () => Promise<{ data: T; costCents: number }>,
  quantity: number = 1
): Promise<AICallResult<T>> {
  // Check if usage is allowed
  const check = checkUsageAllowed(
    {
      organizationId: context.organizationId,
      plan: context.plan,
      periodStart: context.periodStart,
      periodEnd: context.periodEnd,
      articlesUsed: context.articlesUsed,
      keywordsUsed: context.keywordsUsed,
      serpCallsUsed: context.serpCallsUsed,
      optimizationsUsed: context.optimizationsUsed,
      onDemandEnabled: context.onDemandEnabled,
      onDemandLimitCents: context.onDemandLimitCents,
      onDemandSpentCents: context.onDemandSpentCents,
    },
    actionType,
    quantity
  );

  // If not allowed, return early
  if (!check.allowed) {
    return {
      success: false,
      error: check.reason,
      usage: {
        allowed: false,
        isOverage: check.isOverage,
        internalCostCents: check.estimatedCostCents,
        userChargedCents: check.userChargedCents,
        remainingBudget: check.remainingBudgetCents !== undefined 
          ? formatCost(check.remainingBudgetCents)
          : undefined,
      },
    };
  }

  // Execute the AI call
  try {
    const result = await aiCall();
    
    // Record the actual usage
    const usageEvent = recordUsage(
      {
        organizationId: context.organizationId,
        plan: context.plan,
        periodStart: context.periodStart,
        periodEnd: context.periodEnd,
        articlesUsed: context.articlesUsed,
        keywordsUsed: context.keywordsUsed,
        serpCallsUsed: context.serpCallsUsed,
        optimizationsUsed: context.optimizationsUsed,
        onDemandEnabled: context.onDemandEnabled,
        onDemandLimitCents: context.onDemandLimitCents,
        onDemandSpentCents: context.onDemandSpentCents,
      },
      actionType,
      quantity,
      result.costCents
    );

    // TODO: Save usageEvent to database here
    // await db.insert(usageEvents).values(usageEvent);

    return {
      success: true,
      data: result.data,
      usage: {
        allowed: true,
        isOverage: usageEvent.isOverage,
        internalCostCents: usageEvent.internalCostCents,
        userChargedCents: usageEvent.userChargedCents,
        remainingBudget: check.remainingBudgetCents !== undefined
          ? formatCost(check.remainingBudgetCents - usageEvent.userChargedCents)
          : undefined,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "AI call failed",
      usage: {
        allowed: true,
        isOverage: check.isOverage,
        internalCostCents: 0,
        userChargedCents: 0,
      },
    };
  }
}

/**
 * Pre-check if an action would be allowed (without executing)
 */
export function preCheckUsage(
  context: UsageContext,
  actionType: ActionType,
  quantity: number = 1
): {
  allowed: boolean;
  reason?: string;
  isOverage: boolean;
  estimatedCharge: string;
} {
  const check = checkUsageAllowed(
    {
      organizationId: context.organizationId,
      plan: context.plan,
      periodStart: context.periodStart,
      periodEnd: context.periodEnd,
      articlesUsed: context.articlesUsed,
      keywordsUsed: context.keywordsUsed,
      serpCallsUsed: context.serpCallsUsed,
      optimizationsUsed: context.optimizationsUsed,
      onDemandEnabled: context.onDemandEnabled,
      onDemandLimitCents: context.onDemandLimitCents,
      onDemandSpentCents: context.onDemandSpentCents,
    },
    actionType,
    quantity
  );

  return {
    allowed: check.allowed,
    reason: check.reason,
    isOverage: check.isOverage,
    estimatedCharge: check.isOverage ? formatCost(check.userChargedCents) : "Included",
  };
}

/**
 * Get estimated cost for an action (for UI display)
 */
export function getEstimatedCost(
  actionType: ActionType,
  quantity: number = 1,
  isOverage: boolean = false
): {
  internalCost: string;
  userCharge: string;
  profit: string;
} {
  const costs: Record<ActionType, number> = {
    article_generation: 8,
    keyword_analysis: 1,
    keyword_clustering: 1,
    content_optimization: 3,
    meta_generation: 0.5,
    seo_score: 0.5,
    content_plan: 1,
    serp_call: 0.2,
    page_crawl: 0.1,
  };

  const internalCost = costs[actionType] * quantity;
  const userCharge = isOverage ? calculateUserCharge(internalCost) : 0;

  return {
    internalCost: formatCost(internalCost),
    userCharge: isOverage ? formatCost(userCharge) : "Included in plan",
    profit: isOverage ? formatCost(userCharge - internalCost) : "$0.00",
  };
}

