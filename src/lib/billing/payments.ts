/**
 * Payment Integration for CabbageSEO
 * 
 * Designed for Dodo Payments (or similar subscription billing provider)
 * 
 * Features:
 * - Subscriptions (monthly/yearly)
 * - Usage-based billing (overages with spending cap)
 * - Webhooks
 * 
 * Pricing Model:
 * - FREE: URL analyzer (SEO + AIO scores)
 * - PAID: Subscriptions at $49/$149/$349 with pay-as-you-go overages
 * 
 * Note: Prepaid credits are NOT part of this model
 */

import { PLANS, type Plan, type PlanId } from "./plans";

// ============================================
// TYPES
// ============================================

export interface PaymentCustomer {
  id: string;
  email: string;
  name: string;
  metadata?: Record<string, string>;
}

export interface Subscription {
  id: string;
  customerId: string;
  planId: PlanId;
  status: "active" | "canceled" | "past_due" | "trialing" | "paused";
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  trialEnd?: Date;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: "succeeded" | "processing" | "failed";
  clientSecret?: string;
}

export interface Invoice {
  id: string;
  customerId: string;
  subscriptionId?: string;
  amount: number;
  status: "draft" | "open" | "paid" | "void";
  paidAt?: Date;
  hostedUrl?: string;
  pdfUrl?: string;
}

// ============================================
// DODO PAYMENTS CLIENT
// ============================================

class PaymentClient {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.DODO_PAYMENTS_API_KEY || "";
    this.baseUrl = process.env.DODO_PAYMENTS_API_URL || "https://api.dodopayments.com";
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Unknown error" }));
      throw new Error(error.message || `Payment API error: ${response.status}`);
    }

    return response.json();
  }

  // ============================================
  // CUSTOMERS
  // ============================================

  async createCustomer(data: {
    email: string;
    name: string;
    organizationId: string;
  }): Promise<PaymentCustomer> {
    return this.request<PaymentCustomer>("/customers", {
      method: "POST",
      body: JSON.stringify({
        email: data.email,
        name: data.name,
        metadata: {
          organization_id: data.organizationId,
        },
      }),
    });
  }

  async getCustomer(customerId: string): Promise<PaymentCustomer | null> {
    try {
      return await this.request<PaymentCustomer>(`/customers/${customerId}`);
    } catch {
      return null;
    }
  }

  async updateCustomer(
    customerId: string,
    data: Partial<{ email: string; name: string }>
  ): Promise<PaymentCustomer> {
    return this.request<PaymentCustomer>(`/customers/${customerId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  // ============================================
  // SUBSCRIPTIONS
  // ============================================

  async createSubscription(data: {
    customerId: string;
    planId: PlanId;
    billingInterval: "monthly" | "yearly";
    trialDays?: number;
  }): Promise<Subscription> {
    const plan = PLANS[data.planId];
    const price = data.billingInterval === "yearly" 
      ? plan.yearlyPrice * 12 
      : plan.monthlyPrice;

    return this.request<Subscription>("/subscriptions", {
      method: "POST",
      body: JSON.stringify({
        customer_id: data.customerId,
        plan_id: data.planId,
        billing_interval: data.billingInterval,
        amount: price * 100, // Convert to cents
        trial_days: data.trialDays || 0,
        metadata: {
          plan_name: plan.name,
        },
      }),
    });
  }

  async getSubscription(subscriptionId: string): Promise<Subscription | null> {
    try {
      return await this.request<Subscription>(`/subscriptions/${subscriptionId}`);
    } catch {
      return null;
    }
  }

  async updateSubscription(
    subscriptionId: string,
    data: {
      planId?: string;
      cancelAtPeriodEnd?: boolean;
    }
  ): Promise<Subscription> {
    return this.request<Subscription>(`/subscriptions/${subscriptionId}`, {
      method: "PATCH",
      body: JSON.stringify({
        plan_id: data.planId,
        cancel_at_period_end: data.cancelAtPeriodEnd,
      }),
    });
  }

  async cancelSubscription(subscriptionId: string): Promise<Subscription> {
    return this.request<Subscription>(`/subscriptions/${subscriptionId}/cancel`, {
      method: "POST",
    });
  }

  async resumeSubscription(subscriptionId: string): Promise<Subscription> {
    return this.request<Subscription>(`/subscriptions/${subscriptionId}/resume`, {
      method: "POST",
    });
  }

  // ============================================
  // ONE-TIME PAYMENTS (Credits)
  // ============================================

  async createPaymentIntent(data: {
    customerId: string;
    amount: number;
    description: string;
    metadata?: Record<string, string>;
  }): Promise<PaymentIntent> {
    return this.request<PaymentIntent>("/payment-intents", {
      method: "POST",
      body: JSON.stringify({
        customer_id: data.customerId,
        amount: data.amount * 100, // Convert to cents
        currency: "usd",
        description: data.description,
        metadata: data.metadata,
      }),
    });
  }

  /**
   * @deprecated Prepaid credits are not available. Use subscription plans with overages.
   */
  async purchaseCredits(
    _customerId: string,
    _packageIndex: number
  ): Promise<{ paymentIntent: PaymentIntent; credits: number; bonus: number }> {
    throw new Error("Prepaid credits are not available. Please use a subscription plan with overages.");
  }

  // ============================================
  // INVOICES
  // ============================================

  async getInvoices(customerId: string): Promise<Invoice[]> {
    return this.request<Invoice[]>(`/invoices?customer_id=${customerId}`);
  }

  async getInvoice(invoiceId: string): Promise<Invoice | null> {
    try {
      return await this.request<Invoice>(`/invoices/${invoiceId}`);
    } catch {
      return null;
    }
  }

  // ============================================
  // CHECKOUT SESSION
  // ============================================

  async createCheckoutSession(data: {
    customerId: string;
    planId: PlanId;
    billingInterval: "monthly" | "yearly";
    successUrl: string;
    cancelUrl: string;
  }): Promise<{ checkoutUrl: string; sessionId: string }> {
    const plan = PLANS[data.planId];
    const price = data.billingInterval === "yearly"
      ? plan.yearlyPrice
      : plan.monthlyPrice;

    return this.request<{ checkoutUrl: string; sessionId: string }>("/checkout/sessions", {
      method: "POST",
      body: JSON.stringify({
        customer_id: data.customerId,
        mode: "subscription",
        line_items: [{
          name: `${plan.name} Plan`,
          amount: price * 100,
          quantity: 1,
          recurring: {
            interval: data.billingInterval === "yearly" ? "year" : "month",
          },
        }],
        success_url: data.successUrl,
        cancel_url: data.cancelUrl,
        metadata: {
          plan_id: data.planId,
          billing_interval: data.billingInterval,
        },
      }),
    });
  }

  /**
   * @deprecated Prepaid credits are not available. Use subscription plans with overages.
   */
  async createCreditCheckoutSession(_data: {
    customerId: string;
    packageIndex: number;
    successUrl: string;
    cancelUrl: string;
  }): Promise<{ checkoutUrl: string; sessionId: string }> {
    throw new Error("Prepaid credits are not available. Please use a subscription plan with overages.");
  }

  // ============================================
  // PORTAL
  // ============================================

  async createBillingPortalSession(
    customerId: string,
    returnUrl: string
  ): Promise<{ portalUrl: string }> {
    return this.request<{ portalUrl: string }>("/billing-portal/sessions", {
      method: "POST",
      body: JSON.stringify({
        customer_id: customerId,
        return_url: returnUrl,
      }),
    });
  }
}

// ============================================
// SINGLETON
// ============================================

export const payments = new PaymentClient();

// ============================================
// WEBHOOK VERIFICATION
// ============================================

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  // Implement webhook signature verification
  // This will depend on Dodo Payments' specific signing method
  
  const crypto = require("crypto");
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// ============================================
// HELPERS
// ============================================

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function getPlanFromSubscription(subscription: Subscription): Plan | null {
  return PLANS[subscription.planId] || null;
}


