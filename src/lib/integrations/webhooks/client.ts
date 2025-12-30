/**
 * Webhook Integration for CabbageSEO
 * 
 * Generic webhook client that can:
 * - Send content to any endpoint
 * - Support custom headers and authentication
 * - Handle different payload formats
 * - Work with Zapier, Make, n8n, etc.
 */

import crypto from "crypto";

// ============================================
// TYPES
// ============================================

export interface WebhookConfig {
  webhookUrl: string;
  secretKey?: string;        // For signature verification
  headers?: Record<string, string>;
  method?: "POST" | "PUT" | "PATCH";
  payloadFormat?: "json" | "form";
}

export interface WebhookPayload {
  event: string;
  timestamp: string;
  data: Record<string, unknown>;
}

export interface PublishResult {
  success: boolean;
  responseCode?: number;
  responseBody?: string;
  error?: string;
}

// ============================================
// WEBHOOK CLIENT
// ============================================

export class WebhookClient {
  private webhookUrl: string;
  private secretKey?: string;
  private headers: Record<string, string>;
  private method: "POST" | "PUT" | "PATCH";
  private payloadFormat: "json" | "form";

  constructor(config: WebhookConfig) {
    this.webhookUrl = config.webhookUrl;
    this.secretKey = config.secretKey;
    this.headers = config.headers || {};
    this.method = config.method || "POST";
    this.payloadFormat = config.payloadFormat || "json";
  }

  /**
   * Generate HMAC signature for payload
   */
  private generateSignature(payload: string): string {
    if (!this.secretKey) return "";
    
    return crypto
      .createHmac("sha256", this.secretKey)
      .update(payload)
      .digest("hex");
  }

  /**
   * Test webhook connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const result = await this.send({
        event: "test",
        timestamp: new Date().toISOString(),
        data: { message: "CabbageSEO connection test" },
      });
      return result.success;
    } catch (error) {
      console.error("Webhook connection test failed:", error);
      return false;
    }
  }

  /**
   * Send payload to webhook
   */
  async send(payload: WebhookPayload): Promise<PublishResult> {
    try {
      const payloadString = JSON.stringify(payload);
      
      const headers: Record<string, string> = {
        ...this.headers,
      };

      if (this.payloadFormat === "json") {
        headers["Content-Type"] = "application/json";
      } else {
        headers["Content-Type"] = "application/x-www-form-urlencoded";
      }

      // Add signature if secret key is configured
      if (this.secretKey) {
        headers["X-CabbageSEO-Signature"] = this.generateSignature(payloadString);
      }

      const response = await fetch(this.webhookUrl, {
        method: this.method,
        headers,
        body: this.payloadFormat === "json" 
          ? payloadString 
          : new URLSearchParams(payload.data as Record<string, string>).toString(),
      });

      const responseBody = await response.text();

      return {
        success: response.ok,
        responseCode: response.status,
        responseBody,
        error: response.ok ? undefined : `HTTP ${response.status}: ${responseBody}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Webhook request failed",
      };
    }
  }

  /**
   * Publish content via webhook
   */
  async publishContent(options: {
    title: string;
    content: string;
    slug?: string;
    excerpt?: string;
    status?: "draft" | "published";
    tags?: string[];
    featuredImage?: string;
    seoMeta?: {
      title?: string;
      description?: string;
    };
    customFields?: Record<string, unknown>;
  }): Promise<PublishResult> {
    const payload: WebhookPayload = {
      event: "content.published",
      timestamp: new Date().toISOString(),
      data: {
        title: options.title,
        content: options.content,
        slug: options.slug || options.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        excerpt: options.excerpt,
        status: options.status || "draft",
        tags: options.tags || [],
        featuredImage: options.featuredImage,
        seo: {
          title: options.seoMeta?.title || options.title,
          description: options.seoMeta?.description || options.excerpt,
        },
        ...options.customFields,
      },
    };

    return this.send(payload);
  }

  /**
   * Send content update notification
   */
  async notifyContentUpdate(options: {
    contentId: string;
    action: "created" | "updated" | "deleted" | "published";
    title: string;
    url?: string;
  }): Promise<PublishResult> {
    const payload: WebhookPayload = {
      event: `content.${options.action}`,
      timestamp: new Date().toISOString(),
      data: {
        contentId: options.contentId,
        action: options.action,
        title: options.title,
        url: options.url,
      },
    };

    return this.send(payload);
  }

  /**
   * Send keyword research results
   */
  async sendKeywordData(options: {
    siteId: string;
    keywords: Array<{
      keyword: string;
      volume: number;
      difficulty: number;
      cpc?: number;
    }>;
  }): Promise<PublishResult> {
    const payload: WebhookPayload = {
      event: "keywords.researched",
      timestamp: new Date().toISOString(),
      data: {
        siteId: options.siteId,
        keywords: options.keywords,
        count: options.keywords.length,
      },
    };

    return this.send(payload);
  }

  /**
   * Send AIO analysis results
   */
  async sendAIOAnalysis(options: {
    siteId: string;
    url: string;
    scores: {
      overall: number;
      chatgpt: number;
      perplexity: number;
      googleAI: number;
    };
    recommendations: string[];
  }): Promise<PublishResult> {
    const payload: WebhookPayload = {
      event: "aio.analyzed",
      timestamp: new Date().toISOString(),
      data: {
        siteId: options.siteId,
        url: options.url,
        scores: options.scores,
        recommendations: options.recommendations,
      },
    };

    return this.send(payload);
  }
}

// ============================================
// FACTORY FUNCTION
// ============================================

export function createWebhookClient(config: WebhookConfig): WebhookClient {
  return new WebhookClient(config);
}

// ============================================
// PREDEFINED WEBHOOK TEMPLATES
// ============================================

export const WEBHOOK_TEMPLATES = {
  zapier: {
    description: "Zapier Webhook",
    payloadFormat: "json" as const,
    headers: {},
  },
  make: {
    description: "Make (Integromat) Webhook",
    payloadFormat: "json" as const,
    headers: {},
  },
  n8n: {
    description: "n8n Webhook",
    payloadFormat: "json" as const,
    headers: {},
  },
  slack: {
    description: "Slack Incoming Webhook",
    payloadFormat: "json" as const,
    headers: {},
    transformPayload: (data: WebhookPayload) => ({
      text: `*${data.event}*\n${JSON.stringify(data.data, null, 2)}`,
    }),
  },
  discord: {
    description: "Discord Webhook",
    payloadFormat: "json" as const,
    headers: {},
    transformPayload: (data: WebhookPayload) => ({
      content: `**${data.event}**`,
      embeds: [{
        title: data.data.title as string,
        description: data.data.excerpt as string,
        color: 5814783, // Green
      }],
    }),
  },
};

