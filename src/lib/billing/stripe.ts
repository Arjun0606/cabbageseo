/**
 * Stripe Billing Integration
 * Handles subscriptions, usage-based billing, and overages
 */

import Stripe from "stripe";
import { PLANS, OVERAGES, type PlanId } from "@/config/plans";

// Lazy initialization to avoid build-time errors when env vars aren't set
let stripeInstance: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeInstance) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    stripeInstance = new Stripe(key, {
      apiVersion: "2025-11-17.clover",
    });
  }
  return stripeInstance;
}

export { getStripe as stripe };

/**
 * Create a new Stripe customer
 */
export async function createCustomer(params: {
  email: string;
  name?: string;
  organizationId: string;
}): Promise<string> {
  const customer = await getStripe().customers.create({
    email: params.email,
    name: params.name,
    metadata: {
      organizationId: params.organizationId,
    },
  });

  return customer.id;
}

/**
 * Create a checkout session for subscription
 */
export async function createCheckoutSession(params: {
  customerId: string;
  planId: PlanId;
  billingInterval: "monthly" | "yearly";
  successUrl: string;
  cancelUrl: string;
}): Promise<string> {
  // const plan = PLANS[params.planId]; // Available if needed for custom logic

  // You would need to create these price IDs in your Stripe dashboard
  const priceId =
    params.billingInterval === "monthly"
      ? `price_${params.planId}_monthly`
      : `price_${params.planId}_yearly`;

  const session = await getStripe().checkout.sessions.create({
    customer: params.customerId,
    mode: "subscription",
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    subscription_data: {
      metadata: {
        planId: params.planId,
      },
    },
  });

  return session.url || "";
}

/**
 * Create a billing portal session
 */
export async function createBillingPortalSession(params: {
  customerId: string;
  returnUrl: string;
}): Promise<string> {
  const session = await getStripe().billingPortal.sessions.create({
    customer: params.customerId,
    return_url: params.returnUrl,
  });

  return session.url;
}

/**
 * Report usage for metered billing
 */
export async function reportUsage(params: {
  subscriptionItemId: string;
  quantity: number;
  timestamp?: number;
  action?: "increment" | "set";
}): Promise<void> {
  await getStripe().billing.meterEvents.create({
    event_name: "usage",
    payload: {
      stripe_customer_id: params.subscriptionItemId,
      value: params.quantity.toString(),
    },
    timestamp: params.timestamp || Math.floor(Date.now() / 1000),
  });
}

/**
 * Calculate overage charges for a billing period
 */
export function calculateOverages(usage: {
  articlesGenerated: number;
  keywordsAnalyzed: number;
  serpCalls: number;
  pagesCrawled: number;
  optimizations: number;
}, planLimits: {
  articlesPerMonth: number;
  keywordsTracked: number;
  aiCreditsPerMonth: number;
  pagesPerSite: number;
}): {
  totalCents: number;
  breakdown: Array<{
    type: string;
    quantity: number;
    unitPriceCents: number;
    totalCents: number;
  }>;
} {
  const breakdown: Array<{
    type: string;
    quantity: number;
    unitPriceCents: number;
    totalCents: number;
  }> = [];

  // Articles overage
  if (usage.articlesGenerated > planLimits.articlesPerMonth) {
    const overageQty = usage.articlesGenerated - planLimits.articlesPerMonth;
    const unitPrice = OVERAGES.article_generation.priceCents;
    breakdown.push({
      type: "article_generation",
      quantity: overageQty,
      unitPriceCents: unitPrice,
      totalCents: Math.round(overageQty * unitPrice),
    });
  }

  // Keywords overage (per 1000)
  if (usage.keywordsAnalyzed > planLimits.keywordsTracked) {
    const overageQty = Math.ceil(
      (usage.keywordsAnalyzed - planLimits.keywordsTracked) / 1000
    );
    const unitPrice = OVERAGES.keyword_analysis.priceCents;
    breakdown.push({
      type: "keyword_analysis",
      quantity: overageQty,
      unitPriceCents: unitPrice,
      totalCents: Math.round(overageQty * unitPrice),
    });
  }

  // SERP calls overage (using AI credits as proxy)
  if (usage.serpCalls > planLimits.aiCreditsPerMonth) {
    const overageQty = usage.serpCalls - planLimits.aiCreditsPerMonth;
    const unitPrice = OVERAGES.serp_call.priceCents;
    breakdown.push({
      type: "serp_call",
      quantity: overageQty,
      unitPriceCents: unitPrice,
      totalCents: Math.round(overageQty * unitPrice),
    });
  }

  // Page crawl overage (using pagesPerSite as proxy)
  if (usage.pagesCrawled > planLimits.pagesPerSite) {
    const overageQty = usage.pagesCrawled - planLimits.pagesPerSite;
    const unitPrice = OVERAGES.page_crawl.priceCents;
    breakdown.push({
      type: "page_crawl",
      quantity: overageQty,
      unitPriceCents: unitPrice,
      totalCents: Math.round(overageQty * unitPrice),
    });
  }

  const totalCents = breakdown.reduce((sum, item) => sum + item.totalCents, 0);

  return { totalCents, breakdown };
}

/**
 * Add overage charges to customer's next invoice
 */
export async function chargeOverages(params: {
  customerId: string;
  subscriptionId: string;
  overages: {
    totalCents: number;
    breakdown: Array<{
      type: string;
      quantity: number;
      totalCents: number;
    }>;
  };
  periodDescription: string;
}): Promise<void> {
  if (params.overages.totalCents <= 0) return;

  // Create an invoice item for the overages
  await getStripe().invoiceItems.create({
    customer: params.customerId,
    subscription: params.subscriptionId,
    amount: params.overages.totalCents,
    currency: "usd",
    description: `Usage overages for ${params.periodDescription}`,
    metadata: {
      type: "overages",
      breakdown: JSON.stringify(params.overages.breakdown),
    },
  });
}

/**
 * Get subscription details
 */
export async function getSubscription(
  subscriptionId: string
): Promise<{
  id: string;
  status: string;
  planId: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
} | null> {
  try {
    const response = await getStripe().subscriptions.retrieve(subscriptionId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subscription = response as any;

    return {
      id: subscription.id,
      status: subscription.status,
      planId: (subscription.metadata?.planId as PlanId) || "starter",
      currentPeriodStart: new Date((subscription.current_period_start || 0) * 1000),
      currentPeriodEnd: new Date((subscription.current_period_end || 0) * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
    };
  } catch {
    return null;
  }
}

/**
 * Cancel subscription at period end
 */
export async function cancelSubscription(subscriptionId: string): Promise<void> {
  await getStripe().subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

/**
 * Resume a cancelled subscription
 */
export async function resumeSubscription(subscriptionId: string): Promise<void> {
  await getStripe().subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
}

/**
 * Change subscription plan
 */
export async function changePlan(params: {
  subscriptionId: string;
  newPlanId: PlanId;
  billingInterval: "monthly" | "yearly";
}): Promise<void> {
  const response = await getStripe().subscriptions.retrieve(params.subscriptionId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subscription = response as any;

  const newPriceId =
    params.billingInterval === "monthly"
      ? `price_${params.newPlanId}_monthly`
      : `price_${params.newPlanId}_yearly`;

  await getStripe().subscriptions.update(params.subscriptionId, {
    items: [
      {
        id: subscription.items?.data?.[0]?.id,
        price: newPriceId,
      },
    ],
    proration_behavior: "create_prorations",
    metadata: {
      planId: params.newPlanId,
    },
  });
}

/**
 * Handle Stripe webhook events
 */
export async function handleWebhook(
  body: string,
  signature: string
): Promise<{
  type: string;
  data: Record<string, unknown>;
}> {
  const event = getStripe().webhooks.constructEvent(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET || ""
  );

  return {
    type: event.type,
    data: event.data.object as unknown as Record<string, unknown>,
  };
}

