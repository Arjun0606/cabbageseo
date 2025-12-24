/**
 * Dodo Payments Client for CabbageSEO
 * 
 * Handles:
 * - Subscription management
 * - Usage-based billing
 * - Payment processing
 * - Webhook handling
 * 
 * Dodo is a Merchant of Record (handles taxes, compliance)
 * https://docs.dodopayments.com/
 */

// ============================================
// TYPES
// ============================================

export interface DodoConfig {
  apiKey: string;
  webhookSecret?: string;
  baseUrl?: string;
}

export interface Customer {
  id: string;
  email: string;
  name?: string;
  metadata?: Record<string, string>;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  billing_period: "monthly" | "yearly";
  metadata?: Record<string, string>;
}

export interface Subscription {
  id: string;
  customer_id: string;
  product_id: string;
  status: "active" | "canceled" | "past_due" | "trialing" | "paused";
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
  metadata?: Record<string, string>;
}

export interface UsageRecord {
  subscription_id: string;
  quantity: number;
  timestamp: string;
  action?: string;
  idempotency_key?: string;
}

export interface Invoice {
  id: string;
  customer_id: string;
  subscription_id?: string;
  amount: number;
  currency: string;
  status: "draft" | "open" | "paid" | "void" | "uncollectible";
  created_at: string;
  paid_at?: string;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: "requires_payment" | "processing" | "succeeded" | "failed";
  client_secret?: string;
}

export interface CheckoutSession {
  id: string;
  url: string;
  customer_id?: string;
  subscription_id?: string;
  status: "open" | "complete" | "expired";
}

// ============================================
// DODO PAYMENTS CLIENT
// ============================================

export class DodoPaymentsClient {
  private apiKey: string;
  private webhookSecret: string;
  private baseUrl: string;

  constructor(config?: Partial<DodoConfig>) {
    // Accept both DODO_PAYMENTS_API_KEY (Vercel) and DODO_API_KEY (legacy)
    this.apiKey = config?.apiKey || process.env.DODO_PAYMENTS_API_KEY || process.env.DODO_API_KEY || "";
    this.webhookSecret = config?.webhookSecret || process.env.DODO_WEBHOOK_SECRET || "";
    this.baseUrl = config?.baseUrl || "https://api.dodopayments.com/v1";

    if (!this.apiKey) {
      console.warn("Dodo Payments not configured - missing DODO_PAYMENTS_API_KEY");
    }
  }

  /**
   * Check if Dodo is configured
   */
  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  /**
   * Make authenticated API request
   */
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

    const data = await response.json();

    if (!response.ok) {
      console.error("Dodo API error:", data);
      throw new Error(data.message || `Dodo API error: ${response.status}`);
    }

    return data;
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
  }): Promise<Customer> {
    return this.request<Customer>("/customers", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  /**
   * Get customer by ID
   */
  async getCustomer(customerId: string): Promise<Customer> {
    return this.request<Customer>(`/customers/${customerId}`);
  }

  /**
   * Update customer
   */
  async updateCustomer(
    customerId: string,
    params: { name?: string; metadata?: Record<string, string> }
  ): Promise<Customer> {
    return this.request<Customer>(`/customers/${customerId}`, {
      method: "PATCH",
      body: JSON.stringify(params),
    });
  }

  /**
   * Find customer by email
   */
  async findCustomerByEmail(email: string): Promise<Customer | null> {
    try {
      const response = await this.request<{ data: Customer[] }>(
        `/customers?email=${encodeURIComponent(email)}`
      );
      return response.data[0] || null;
    } catch {
      return null;
    }
  }

  // ============================================
  // SUBSCRIPTIONS
  // ============================================

  /**
   * Create a subscription
   */
  async createSubscription(params: {
    customer_id: string;
    product_id: string;
    metadata?: Record<string, string>;
  }): Promise<Subscription> {
    return this.request<Subscription>("/subscriptions", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  /**
   * Get subscription
   */
  async getSubscription(subscriptionId: string): Promise<Subscription> {
    return this.request<Subscription>(`/subscriptions/${subscriptionId}`);
  }

  /**
   * List customer subscriptions
   */
  async listSubscriptions(customerId: string): Promise<Subscription[]> {
    const response = await this.request<{ data: Subscription[] }>(
      `/subscriptions?customer_id=${customerId}`
    );
    return response.data;
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    immediately: boolean = false
  ): Promise<Subscription> {
    return this.request<Subscription>(`/subscriptions/${subscriptionId}/cancel`, {
      method: "POST",
      body: JSON.stringify({ immediately }),
    });
  }

  /**
   * Pause subscription
   */
  async pauseSubscription(subscriptionId: string): Promise<Subscription> {
    return this.request<Subscription>(`/subscriptions/${subscriptionId}/pause`, {
      method: "POST",
    });
  }

  /**
   * Resume subscription
   */
  async resumeSubscription(subscriptionId: string): Promise<Subscription> {
    return this.request<Subscription>(`/subscriptions/${subscriptionId}/resume`, {
      method: "POST",
    });
  }

  /**
   * Update subscription (change plan)
   */
  async updateSubscription(
    subscriptionId: string,
    params: { product_id: string }
  ): Promise<Subscription> {
    return this.request<Subscription>(`/subscriptions/${subscriptionId}`, {
      method: "PATCH",
      body: JSON.stringify(params),
    });
  }

  // ============================================
  // USAGE-BASED BILLING
  // ============================================

  /**
   * Report usage for a subscription
   */
  async reportUsage(params: UsageRecord): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>("/usage", {
      method: "POST",
      body: JSON.stringify({
        subscription_id: params.subscription_id,
        quantity: params.quantity,
        timestamp: params.timestamp || new Date().toISOString(),
        action: params.action,
        idempotency_key: params.idempotency_key,
      }),
    });
  }

  /**
   * Get usage for a subscription in the current period
   */
  async getUsage(subscriptionId: string): Promise<{
    total: number;
    records: UsageRecord[];
  }> {
    return this.request<{ total: number; records: UsageRecord[] }>(
      `/usage?subscription_id=${subscriptionId}`
    );
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
  }): Promise<CheckoutSession> {
    return this.request<CheckoutSession>("/checkout/sessions", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  /**
   * Get checkout session
   */
  async getCheckoutSession(sessionId: string): Promise<CheckoutSession> {
    return this.request<CheckoutSession>(`/checkout/sessions/${sessionId}`);
  }

  // ============================================
  // INVOICES
  // ============================================

  /**
   * List customer invoices
   */
  async listInvoices(customerId: string): Promise<Invoice[]> {
    const response = await this.request<{ data: Invoice[] }>(
      `/invoices?customer_id=${customerId}`
    );
    return response.data;
  }

  /**
   * Get invoice
   */
  async getInvoice(invoiceId: string): Promise<Invoice> {
    return this.request<Invoice>(`/invoices/${invoiceId}`);
  }

  // ============================================
  // ONE-TIME PAYMENTS (for on-demand credits)
  // ============================================

  /**
   * Create a payment intent for one-time charges
   */
  async createPaymentIntent(params: {
    amount: number;
    currency?: string;
    customer_id: string;
    description?: string;
    metadata?: Record<string, string>;
  }): Promise<PaymentIntent> {
    return this.request<PaymentIntent>("/payment_intents", {
      method: "POST",
      body: JSON.stringify({
        ...params,
        currency: params.currency || "usd",
      }),
    });
  }

  /**
   * Confirm a payment intent
   */
  async confirmPaymentIntent(
    paymentIntentId: string,
    params?: { payment_method?: string }
  ): Promise<PaymentIntent> {
    return this.request<PaymentIntent>(
      `/payment_intents/${paymentIntentId}/confirm`,
      {
        method: "POST",
        body: JSON.stringify(params || {}),
      }
    );
  }

  // ============================================
  // WEBHOOKS
  // ============================================

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(
    payload: string,
    signature: string
  ): boolean {
    if (!this.webhookSecret) {
      console.warn("Webhook secret not configured");
      return false;
    }

    const crypto = require("crypto");
    const expectedSignature = crypto
      .createHmac("sha256", this.webhookSecret)
      .update(payload)
      .digest("hex");

    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch {
      return false;
    }
  }

  /**
   * Parse webhook event
   */
  parseWebhookEvent(payload: string): {
    type: string;
    data: Record<string, unknown>;
  } {
    return JSON.parse(payload);
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const dodo = new DodoPaymentsClient();

