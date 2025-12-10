/**
 * Usage Manager for CabbageSEO
 * 
 * Implements Cursor-style billing:
 * 1. Plan includes X articles/keywords/etc
 * 2. When exhausted → on-demand mode
 * 3. User sets spending limit
 * 4. Track real-time usage with 90% markup
 * 5. Stop when limit reached
 * 
 * Key principle: WE NEVER PRE-FUND CLAUDE
 * Users pay for their own overages directly (through us with markup)
 */

// Plan limits
export const PLAN_LIMITS = {
  starter: {
    articlesPerMonth: 10,
    keywordsPerMonth: 100,
    pagesPerCrawl: 100,
    serpCallsPerMonth: 500,
    optimizationsPerMonth: 20,
  },
  pro: {
    articlesPerMonth: 50,
    keywordsPerMonth: 500,
    pagesPerCrawl: 500,
    serpCallsPerMonth: 2500,
    optimizationsPerMonth: 100,
  },
  pro_plus: {
    articlesPerMonth: 200,
    keywordsPerMonth: 2000,
    pagesPerCrawl: 2000,
    serpCallsPerMonth: 10000,
    optimizationsPerMonth: 500,
  },
} as const;

// Cost per action (in cents) - our actual cost
export const ACTION_COSTS = {
  article_generation: 8,      // ~$0.08 (Sonnet for outline + article)
  keyword_analysis: 1,        // ~$0.01 (Haiku)
  keyword_clustering: 1,      // ~$0.01 (Haiku)
  content_optimization: 3,    // ~$0.03 (Sonnet)
  meta_generation: 0.5,       // ~$0.005 (Haiku)
  seo_score: 0.5,             // ~$0.005 (Haiku)
  content_plan: 1,            // ~$0.01 (Haiku)
  serp_call: 0.2,             // ~$0.002 (external API)
  page_crawl: 0.1,            // ~$0.001 (compute)
} as const;

// Markup for overages (90% = 1.9x)
export const OVERAGE_MARKUP = 1.9;

// Default on-demand spending limit (in cents)
export const DEFAULT_SPENDING_LIMIT_CENTS = 10000; // $100

export type ActionType = keyof typeof ACTION_COSTS;
export type PlanType = keyof typeof PLAN_LIMITS;

interface UsageState {
  organizationId: string;
  plan: PlanType;
  periodStart: Date;
  periodEnd: Date;
  
  // Plan usage
  articlesUsed: number;
  keywordsUsed: number;
  serpCallsUsed: number;
  optimizationsUsed: number;
  
  // On-demand tracking
  onDemandEnabled: boolean;
  onDemandLimitCents: number;
  onDemandSpentCents: number;
}

interface UsageCheckResult {
  allowed: boolean;
  reason?: string;
  isOverage: boolean;
  estimatedCostCents: number;
  userChargedCents: number;
  remainingBudgetCents?: number;
}

interface UsageEvent {
  organizationId: string;
  actionType: ActionType;
  quantity: number;
  internalCostCents: number;
  userChargedCents: number;
  isOverage: boolean;
  resourceId?: string;
  resourceType?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Check if an action is allowed based on plan limits and spending
 */
export function checkUsageAllowed(
  state: UsageState,
  actionType: ActionType,
  quantity: number = 1
): UsageCheckResult {
  const limits = PLAN_LIMITS[state.plan];
  const costPerAction = ACTION_COSTS[actionType];
  const totalCost = costPerAction * quantity;
  const userCharged = Math.ceil(totalCost * OVERAGE_MARKUP);

  // Check if within plan limits
  let withinPlanLimits = true;
  let limitExhausted = "";

  switch (actionType) {
    case "article_generation":
      if (state.articlesUsed >= limits.articlesPerMonth) {
        withinPlanLimits = false;
        limitExhausted = `articles (${state.articlesUsed}/${limits.articlesPerMonth})`;
      }
      break;
    case "keyword_analysis":
    case "keyword_clustering":
      if (state.keywordsUsed >= limits.keywordsPerMonth) {
        withinPlanLimits = false;
        limitExhausted = `keywords (${state.keywordsUsed}/${limits.keywordsPerMonth})`;
      }
      break;
    case "serp_call":
      if (state.serpCallsUsed >= limits.serpCallsPerMonth) {
        withinPlanLimits = false;
        limitExhausted = `SERP calls (${state.serpCallsUsed}/${limits.serpCallsPerMonth})`;
      }
      break;
    case "content_optimization":
      if (state.optimizationsUsed >= limits.optimizationsPerMonth) {
        withinPlanLimits = false;
        limitExhausted = `optimizations (${state.optimizationsUsed}/${limits.optimizationsPerMonth})`;
      }
      break;
    // meta_generation, seo_score, content_plan are always allowed within reasonable limits
  }

  // If within plan limits, allow without charge
  if (withinPlanLimits) {
    return {
      allowed: true,
      isOverage: false,
      estimatedCostCents: 0, // Included in plan
      userChargedCents: 0,
    };
  }

  // Plan limits exhausted - check on-demand
  if (!state.onDemandEnabled) {
    return {
      allowed: false,
      reason: `Plan limit exhausted for ${limitExhausted}. Enable on-demand usage in settings to continue.`,
      isOverage: true,
      estimatedCostCents: totalCost,
      userChargedCents: userCharged,
    };
  }

  // Check on-demand spending limit
  const remainingBudget = state.onDemandLimitCents - state.onDemandSpentCents;
  
  if (userCharged > remainingBudget) {
    return {
      allowed: false,
      reason: `On-demand spending limit reached ($${(state.onDemandLimitCents / 100).toFixed(2)}). Increase your limit in settings to continue.`,
      isOverage: true,
      estimatedCostCents: totalCost,
      userChargedCents: userCharged,
      remainingBudgetCents: remainingBudget,
    };
  }

  // On-demand allowed
  return {
    allowed: true,
    isOverage: true,
    estimatedCostCents: totalCost,
    userChargedCents: userCharged,
    remainingBudgetCents: remainingBudget - userCharged,
  };
}

/**
 * Record usage after an action completes
 */
export function recordUsage(
  state: UsageState,
  actionType: ActionType,
  quantity: number = 1,
  actualCostCents?: number
): UsageEvent {
  const costPerAction = ACTION_COSTS[actionType];
  const internalCost = actualCostCents ?? costPerAction * quantity;
  const userCharged = Math.ceil(internalCost * OVERAGE_MARKUP);

  // Check if this was an overage
  const checkResult = checkUsageAllowed(state, actionType, quantity);

  return {
    organizationId: state.organizationId,
    actionType,
    quantity,
    internalCostCents: internalCost,
    userChargedCents: checkResult.isOverage ? userCharged : 0,
    isOverage: checkResult.isOverage,
  };
}

/**
 * Calculate monthly bill for overages
 */
export function calculateOverageBill(events: UsageEvent[]): {
  totalInternalCostCents: number;
  totalUserChargedCents: number;
  profitCents: number;
  eventCount: number;
  breakdown: Record<ActionType, { count: number; costCents: number }>;
} {
  const breakdown: Record<string, { count: number; costCents: number }> = {};
  let totalInternalCost = 0;
  let totalUserCharged = 0;

  for (const event of events) {
    if (event.isOverage) {
      totalInternalCost += event.internalCostCents;
      totalUserCharged += event.userChargedCents;
      
      if (!breakdown[event.actionType]) {
        breakdown[event.actionType] = { count: 0, costCents: 0 };
      }
      breakdown[event.actionType].count += event.quantity;
      breakdown[event.actionType].costCents += event.userChargedCents;
    }
  }

  return {
    totalInternalCostCents: totalInternalCost,
    totalUserChargedCents: totalUserCharged,
    profitCents: totalUserCharged - totalInternalCost,
    eventCount: events.filter(e => e.isOverage).length,
    breakdown: breakdown as Record<ActionType, { count: number; costCents: number }>,
  };
}

/**
 * Get usage summary for dashboard display
 */
export function getUsageSummary(state: UsageState): {
  plan: PlanType;
  usage: {
    articles: { used: number; limit: number; percentage: number };
    keywords: { used: number; limit: number; percentage: number };
    serpCalls: { used: number; limit: number; percentage: number };
    optimizations: { used: number; limit: number; percentage: number };
  };
  onDemand: {
    enabled: boolean;
    limitCents: number;
    spentCents: number;
    remainingCents: number;
    percentageUsed: number;
  };
  periodEndsAt: Date;
  daysRemaining: number;
} {
  const limits = PLAN_LIMITS[state.plan];
  const now = new Date();
  const daysRemaining = Math.ceil((state.periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return {
    plan: state.plan,
    usage: {
      articles: {
        used: state.articlesUsed,
        limit: limits.articlesPerMonth,
        percentage: Math.round((state.articlesUsed / limits.articlesPerMonth) * 100),
      },
      keywords: {
        used: state.keywordsUsed,
        limit: limits.keywordsPerMonth,
        percentage: Math.round((state.keywordsUsed / limits.keywordsPerMonth) * 100),
      },
      serpCalls: {
        used: state.serpCallsUsed,
        limit: limits.serpCallsPerMonth,
        percentage: Math.round((state.serpCallsUsed / limits.serpCallsPerMonth) * 100),
      },
      optimizations: {
        used: state.optimizationsUsed,
        limit: limits.optimizationsPerMonth,
        percentage: Math.round((state.optimizationsUsed / limits.optimizationsPerMonth) * 100),
      },
    },
    onDemand: {
      enabled: state.onDemandEnabled,
      limitCents: state.onDemandLimitCents,
      spentCents: state.onDemandSpentCents,
      remainingCents: state.onDemandLimitCents - state.onDemandSpentCents,
      percentageUsed: Math.round((state.onDemandSpentCents / state.onDemandLimitCents) * 100),
    },
    periodEndsAt: state.periodEnd,
    daysRemaining,
  };
}

/**
 * Format cost for display
 */
export function formatCost(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Calculate what user will be charged (with markup)
 */
export function calculateUserCharge(internalCostCents: number): number {
  return Math.ceil(internalCostCents * OVERAGE_MARKUP);
}

