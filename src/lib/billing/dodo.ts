/**
 * Dodo Payments Integration
 * https://docs.dodopayments.com
 * 
 * Handles subscriptions, usage-based billing, and one-time payments
 * Dodo acts as Merchant of Record - handles global tax compliance
 * 
 * Uses the official dodopayments SDK
 */

import { DodoPayments } from "dodopayments";
import { PLANS, type PlanId } from "@/lib/billing/plans";

// ============================================
// CLIENT INITIALIZATION
// ============================================

let dodoInstance: DodoPayments | null = null;

export function getDodo(): DodoPayments {
  if (!dodoInstance) {
    const apiKey = process.env.DODO_PAYMENTS_API_KEY;
    
    if (!apiKey) {
      throw new Error("DODO_PAYMENTS_API_KEY is not configured");
    }

    // Use test_mode for development, live_mode for production
    const isProduction = process.env.NODE_ENV === "production";
    
    dodoInstance = new DodoPayments({
      bearerToken: apiKey,
      environment: isProduction ? "live_mode" : "test_mode",
    });
  }
  return dodoInstance;
}

/**
 * Check if Dodo is configured
 */
export function isDodoConfigured(): boolean {
  return Boolean(process.env.DODO_PAYMENTS_API_KEY);
}

// ============================================
// PRODUCT ID MAPPING
// ============================================

/**
 * Get the Dodo product ID for a plan
 * These IDs should match what you create in Dodo dashboard
 */
export function getProductIdForPlan(
  planId: PlanId,
  interval: "monthly" | "yearly"
): string {
  const productIds: Record<string, string> = {
    scout_monthly: process.env.DODO_SCOUT_MONTHLY_ID || "",
    scout_yearly: process.env.DODO_SCOUT_YEARLY_ID || "",
    command_monthly: process.env.DODO_COMMAND_MONTHLY_ID || "",
    command_yearly: process.env.DODO_COMMAND_YEARLY_ID || "",
    dominate_monthly: process.env.DODO_DOMINATE_MONTHLY_ID || "",
    dominate_yearly: process.env.DODO_DOMINATE_YEARLY_ID || "",
  };

  const key = `${planId}_${interval}`;
  const productId = productIds[key];
  
  if (!productId) {
    throw new Error(`No product ID configured for ${key}. Set DODO_${planId.toUpperCase()}_${interval.toUpperCase()}_ID`);
  }
  
  return productId;
}

// ============================================
// CHECKOUT HELPERS
// ============================================

/**
 * Create a checkout URL for a plan
 */
export async function createCheckoutUrl(params: {
  email: string;
  name?: string;
  planId: PlanId;
  interval: "monthly" | "yearly";
  organizationId: string;
  returnUrl: string;
}): Promise<string> {
  const dodo = getDodo();
  const productId = getProductIdForPlan(params.planId, params.interval);

  const session = await dodo.checkoutSessions.create({
    product_cart: [
      {
        product_id: productId,
        quantity: 1,
      },
    ],
    customer: {
      email: params.email,
      name: params.name,
    },
    return_url: params.returnUrl,
    metadata: {
      organization_id: params.organizationId,
      plan_id: params.planId,
      interval: params.interval,
    },
  });

  return session.checkout_url || "";
}

/**
 * Get customer portal URL
 * Note: Dodo's portal doesn't support return_url - it's a standalone portal
 */
export async function getBillingPortalUrl(customerId: string): Promise<string> {
  const dodo = getDodo();
  const session = await dodo.customers.customerPortal.create(customerId, {
    send_email: false,
  });
  return session.link;
}

// ============================================
// SUBSCRIPTION MANAGEMENT
// ============================================

/**
 * Get subscription details
 */
export async function getSubscription(subscriptionId: string) {
  const dodo = getDodo();
  return dodo.subscriptions.retrieve(subscriptionId);
}

/**
 * Cancel subscription at end of billing period
 */
export async function cancelSubscription(subscriptionId: string) {
  const dodo = getDodo();
  return dodo.subscriptions.update(subscriptionId, {
    cancel_at_next_billing_date: true,
  });
}

/**
 * Resume a cancelled subscription
 */
export async function resumeSubscription(subscriptionId: string) {
  const dodo = getDodo();
  return dodo.subscriptions.update(subscriptionId, {
    cancel_at_next_billing_date: false,
  });
}

/**
 * Change subscription plan
 */
export async function changeSubscriptionPlan(
  subscriptionId: string,
  newPlanId: PlanId,
  interval: "monthly" | "yearly"
) {
  const dodo = getDodo();
  const productId = getProductIdForPlan(newPlanId, interval);
  
  return dodo.subscriptions.changePlan(subscriptionId, {
    product_id: productId,
    quantity: 1,
    proration_billing_mode: "prorated_immediately",
  });
}

// ============================================
// CUSTOMER MANAGEMENT
// ============================================

/**
 * Create a customer
 */
export async function createCustomer(params: {
  email: string;
  name?: string;
}) {
  const dodo = getDodo();
  return dodo.customers.create({
    email: params.email,
    name: params.name || params.email.split('@')[0], // Default to email username if no name
  });
}

/**
 * Get customer by ID
 */
export async function getCustomer(customerId: string) {
  const dodo = getDodo();
  return dodo.customers.retrieve(customerId);
}

// ============================================
// RE-EXPORTS
// ============================================

export { DodoPayments };
