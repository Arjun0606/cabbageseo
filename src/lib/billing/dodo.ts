/**
 * Dodo Payments Integration
 * https://docs.dodopayments.com
 * 
 * Handles subscriptions, usage-based billing, and one-time payments
 * Dodo acts as Merchant of Record - handles global tax compliance
 */

import { PLANS, type PlanId } from "@/config/plans";

interface DodoConfig {
  apiKey?: string;
  baseUrl?: string;
}

interface CreateCustomerParams {
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}

interface CreateSubscriptionParams {
  customerId: string;
  productId: string;
  quantity?: number;
  metadata?: Record<string, string>;
}

interface RecordUsageParams {
  subscriptionId: string;
  meterId: string;
  quantity: number;
  timestamp?: Date;
}

interface DodoCustomer {
  id: string;
  email: string;
  name?: string;
  metadata?: Record<string, string>;
  created_at: string;
}

interface DodoSubscription {
  id: string;
  customer_id: string;
  product_id: string;
  status: "active" | "canceled" | "past_due" | "trialing" | "paused";
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  metadata?: Record<string, string>;
}

interface DodoCheckoutSession {
  id: string;
  url: string;
  status: "pending" | "completed" | "expired";
}

class DodoPaymentsClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(config?: DodoConfig) {
    this.apiKey = config?.apiKey || process.env.DODO_PAYMENTS_API_KEY || "";
    this.baseUrl = config?.baseUrl || "https://api.dodopayments.com/v1";
  }

  private async request<T>(
    endpoint: string,
    method: "GET" | "POST" | "PATCH" | "DELETE" = "GET",
    data?: unknown
  ): Promise<T> {
    if (!this.apiKey) {
      throw new Error("DODO_PAYMENTS_API_KEY is not configured");
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Dodo Payments API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  // ============================================
  // CUSTOMERS
  // ============================================

  async createCustomer(params: CreateCustomerParams): Promise<DodoCustomer> {
    return this.request<DodoCustomer>("/customers", "POST", {
      email: params.email,
      name: params.name,
      metadata: params.metadata,
    });
  }

  async getCustomer(customerId: string): Promise<DodoCustomer> {
    return this.request<DodoCustomer>(`/customers/${customerId}`);
  }

  async updateCustomer(
    customerId: string,
    updates: Partial<CreateCustomerParams>
  ): Promise<DodoCustomer> {
    return this.request<DodoCustomer>(`/customers/${customerId}`, "PATCH", updates);
  }

  // ============================================
  // SUBSCRIPTIONS
  // ============================================

  async createSubscription(
    params: CreateSubscriptionParams
  ): Promise<DodoSubscription> {
    return this.request<DodoSubscription>("/subscriptions", "POST", {
      customer_id: params.customerId,
      product_id: params.productId,
      quantity: params.quantity || 1,
      metadata: params.metadata,
    });
  }

  async getSubscription(subscriptionId: string): Promise<DodoSubscription> {
    return this.request<DodoSubscription>(`/subscriptions/${subscriptionId}`);
  }

  async cancelSubscription(
    subscriptionId: string,
    cancelAtPeriodEnd: boolean = true
  ): Promise<DodoSubscription> {
    return this.request<DodoSubscription>(
      `/subscriptions/${subscriptionId}/cancel`,
      "POST",
      { cancel_at_period_end: cancelAtPeriodEnd }
    );
  }

  async resumeSubscription(subscriptionId: string): Promise<DodoSubscription> {
    return this.request<DodoSubscription>(
      `/subscriptions/${subscriptionId}/resume`,
      "POST"
    );
  }

  async updateSubscription(
    subscriptionId: string,
    productId: string
  ): Promise<DodoSubscription> {
    return this.request<DodoSubscription>(
      `/subscriptions/${subscriptionId}`,
      "PATCH",
      { product_id: productId }
    );
  }

  // ============================================
  // USAGE-BASED BILLING
  // ============================================

  async recordUsage(params: RecordUsageParams): Promise<void> {
    await this.request("/usage", "POST", {
      subscription_id: params.subscriptionId,
      meter_id: params.meterId,
      quantity: params.quantity,
      timestamp: params.timestamp?.toISOString() || new Date().toISOString(),
    });
  }

  async getUsage(
    subscriptionId: string,
    meterId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{ total: number; records: Array<{ quantity: number; timestamp: string }> }> {
    const params = new URLSearchParams({
      subscription_id: subscriptionId,
      meter_id: meterId,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
    });
    return this.request(`/usage?${params.toString()}`);
  }

  // ============================================
  // CHECKOUT
  // ============================================

  async createCheckoutSession(params: {
    customerId?: string;
    customerEmail?: string;
    productId: string;
    successUrl: string;
    cancelUrl: string;
    metadata?: Record<string, string>;
  }): Promise<DodoCheckoutSession> {
    return this.request<DodoCheckoutSession>("/checkout/sessions", "POST", {
      customer_id: params.customerId,
      customer_email: params.customerEmail,
      product_id: params.productId,
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: params.metadata,
    });
  }

  // ============================================
  // BILLING PORTAL
  // ============================================

  async createBillingPortalSession(params: {
    customerId: string;
    returnUrl: string;
  }): Promise<{ url: string }> {
    return this.request("/billing-portal/sessions", "POST", {
      customer_id: params.customerId,
      return_url: params.returnUrl,
    });
  }

  // ============================================
  // WEBHOOKS
  // ============================================

  verifyWebhook(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    // Dodo uses HMAC-SHA256 for webhook verification
    const crypto = require("crypto");
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");
    return signature === expectedSignature;
  }
}

// Singleton instance
let dodoInstance: DodoPaymentsClient | null = null;

export function getDodo(): DodoPaymentsClient {
  if (!dodoInstance) {
    dodoInstance = new DodoPaymentsClient();
  }
  return dodoInstance;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get the Dodo product ID for a plan
 * You'll need to create these products in Dodo dashboard
 */
export function getProductIdForPlan(
  planId: PlanId,
  interval: "monthly" | "yearly"
): string {
  // These IDs should match what you create in Dodo dashboard
  const productIds: Record<string, string> = {
    starter_monthly: process.env.DODO_PRODUCT_STARTER_MONTHLY || "prod_starter_monthly",
    starter_yearly: process.env.DODO_PRODUCT_STARTER_YEARLY || "prod_starter_yearly",
    pro_monthly: process.env.DODO_PRODUCT_PRO_MONTHLY || "prod_pro_monthly",
    pro_yearly: process.env.DODO_PRODUCT_PRO_YEARLY || "prod_pro_yearly",
    pro_plus_monthly: process.env.DODO_PRODUCT_PROPLUS_MONTHLY || "prod_proplus_monthly",
    pro_plus_yearly: process.env.DODO_PRODUCT_PROPLUS_YEARLY || "prod_proplus_yearly",
  };

  return productIds[`${planId}_${interval}`] || productIds.starter_monthly;
}

/**
 * Usage meter IDs for different resource types
 */
export const USAGE_METERS = {
  articles: process.env.DODO_METER_ARTICLES || "meter_articles",
  keywords: process.env.DODO_METER_KEYWORDS || "meter_keywords",
  serpCalls: process.env.DODO_METER_SERP || "meter_serp",
  pageCrawls: process.env.DODO_METER_CRAWL || "meter_crawl",
  optimizations: process.env.DODO_METER_OPTIMIZE || "meter_optimize",
} as const;

/**
 * Record usage for billing
 */
export async function trackUsage(
  subscriptionId: string,
  type: keyof typeof USAGE_METERS,
  quantity: number = 1
): Promise<void> {
  const dodo = getDodo();
  await dodo.recordUsage({
    subscriptionId,
    meterId: USAGE_METERS[type],
    quantity,
  });
}

/**
 * Create a checkout URL for a plan
 */
export async function createCheckoutUrl(params: {
  email: string;
  planId: PlanId;
  interval: "monthly" | "yearly";
  organizationId: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<string> {
  const dodo = getDodo();
  const productId = getProductIdForPlan(params.planId, params.interval);

  const session = await dodo.createCheckoutSession({
    customerEmail: params.email,
    productId,
    successUrl: params.successUrl,
    cancelUrl: params.cancelUrl,
    metadata: {
      organizationId: params.organizationId,
      planId: params.planId,
      interval: params.interval,
    },
  });

  return session.url;
}

/**
 * Get billing portal URL for customer
 */
export async function getBillingPortalUrl(
  customerId: string,
  returnUrl: string
): Promise<string> {
  const dodo = getDodo();
  const session = await dodo.createBillingPortalSession({
    customerId,
    returnUrl,
  });
  return session.url;
}

export { DodoPaymentsClient };
export type { DodoCustomer, DodoSubscription, DodoCheckoutSession };

