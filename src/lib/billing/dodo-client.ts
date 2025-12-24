/**
 * Dodo Payments Client for CabbageSEO
 * 
 * Uses the official Dodo Payments SDK
 * https://docs.dodopayments.com/
 * 
 * Handles:
 * - Subscription management
 * - Customer management
 * - Checkout sessions
 * - Webhook handling
 * 
 * Dodo is a Merchant of Record (handles taxes, compliance)
 */

import { DodoPayments } from "dodopayments";

// ============================================
// SINGLETON CLIENT
// ============================================

let dodoInstance: DodoPayments | null = null;

/**
 * Get the Dodo Payments client instance
 * Reads DODO_PAYMENTS_API_KEY from environment
 */
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
// WRAPPER CLASS (for backwards compatibility)
// ============================================

export class DodoPaymentsClient {
  private client: DodoPayments | null = null;

  constructor() {
    // Lazy initialization - only create when methods are called
  }

  getClient(): DodoPayments {
    if (!this.client) {
      const apiKey = process.env.DODO_PAYMENTS_API_KEY || process.env.DODO_API_KEY;
      
      if (!apiKey) {
        throw new Error("DODO_PAYMENTS_API_KEY is not configured");
      }

      const isProduction = process.env.NODE_ENV === "production";
      
      this.client = new DodoPayments({
        bearerToken: apiKey,
        environment: isProduction ? "live_mode" : "test_mode",
      });
    }
    return this.client;
  }

  /**
   * Check if Dodo is configured
   */
  isConfigured(): boolean {
    return Boolean(process.env.DODO_PAYMENTS_API_KEY || process.env.DODO_API_KEY);
  }

  // ============================================
  // CUSTOMERS
  // ============================================

  /**
   * Create a new customer
   */
  async createCustomer(params: {
    email: string;
    name?: string;
    metadata?: Record<string, string>;
  }) {
    return this.getClient().customers.create({
      email: params.email,
      name: params.name || params.email.split('@')[0], // Default to email username if no name
      metadata: params.metadata,
    });
  }

  /**
   * Get customer by ID
   */
  async getCustomer(customerId: string) {
    return this.getClient().customers.retrieve(customerId);
  }

  /**
   * Update customer
   */
  async updateCustomer(
    customerId: string,
    params: { name?: string }
  ) {
    return this.getClient().customers.update(customerId, params);
  }

  // ============================================
  // SUBSCRIPTIONS
  // ============================================

  /**
   * Get subscription
   */
  async getSubscription(subscriptionId: string) {
    return this.getClient().subscriptions.retrieve(subscriptionId);
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string) {
    return this.getClient().subscriptions.update(subscriptionId, {
      cancel_at_next_billing_date: true,
    });
  }

  /**
   * Update subscription (change plan)
   */
  async updateSubscription(
    subscriptionId: string,
    params: { product_id: string; quantity?: number }
  ) {
    return this.getClient().subscriptions.changePlan(subscriptionId, {
      product_id: params.product_id,
      quantity: params.quantity || 1,
      proration_billing_mode: "prorated_immediately",
    });
  }

  // ============================================
  // CHECKOUT
  // ============================================

  /**
   * Create a checkout session
   */
  async createCheckoutSession(params: {
    customer_id?: string;
    customer_email?: string;
    product_id: string;
    success_url: string;
    cancel_url: string;
    metadata?: Record<string, string>;
  }) {
    const result = await this.getClient().checkoutSessions.create({
      product_cart: [
        {
          product_id: params.product_id,
          quantity: 1,
        },
      ],
      customer: params.customer_email ? {
        email: params.customer_email,
      } : undefined,
      return_url: params.success_url,
      metadata: params.metadata,
    });

    return {
      id: result.session_id,
      url: result.checkout_url || "",
      status: "open" as const,
    };
  }

  // ============================================
  // CUSTOMER PORTAL
  // ============================================

  /**
   * Create a customer portal session for managing subscriptions
   * Note: Dodo's portal doesn't support return_url - it's a standalone portal
   */
  async createCustomerPortalSession(params: {
    customerId: string;
  }) {
    const result = await this.getClient().customers.customerPortal.create(
      params.customerId,
      {
        send_email: false,
      }
    );
    return {
      url: result.link,
    };
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const dodo = new DodoPaymentsClient();

// ============================================
// RE-EXPORTS
// ============================================

export { DodoPayments };
