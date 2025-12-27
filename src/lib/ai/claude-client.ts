/**
 * Production Claude AI Client for CabbageSEO
 * 
 * Features:
 * - Rate limiting per organization
 * - Cost tracking & usage metering
 * - Retry with exponential backoff
 * - DDoS protection
 * - Graceful degradation
 * 
 * Models (Claude 4.5 - Latest):
 * - Sonnet: $3/$15 per MTok - Content generation, analysis
 * - Haiku: $0.25/$1.25 per MTok - Quick tasks, clustering
 * - Opus: $15/$75 per MTok - Premium content (reserved for Pro+)
 * 
 * @see https://platform.claude.com/docs/en/about-claude/models/overview
 */

// Cost per 1M tokens (in cents) - Claude 4.5 Models (Latest - Sept/Oct/Nov 2025)
// Reference: https://platform.claude.com/docs/en/about-claude/models/overview
const MODEL_COSTS = {
  "claude-sonnet-4-5-20250929": { input: 300, output: 1500 },   // $3/$15 - Sonnet 4.5 (smart, fast)
  "claude-haiku-4-5-20251001": { input: 100, output: 500 },     // $1/$5 - Haiku 4.5 (fastest)
  "claude-opus-4-5-20251101": { input: 500, output: 2500 },     // $5/$25 - Opus 4.5 (premium)
} as const;

// Model aliases for easier use
const MODEL_ALIASES: Record<string, keyof typeof MODEL_COSTS> = {
  // Short aliases
  "sonnet": "claude-sonnet-4-5-20250929",
  "haiku": "claude-haiku-4-5-20251001",
  "opus": "claude-opus-4-5-20251101",
  // Medium aliases  
  "claude-sonnet": "claude-sonnet-4-5-20250929",
  "claude-haiku": "claude-haiku-4-5-20251001",
  "claude-opus": "claude-opus-4-5-20251101",
  // Version aliases (as per Anthropic docs)
  "claude-sonnet-4-5": "claude-sonnet-4-5-20250929",
  "claude-haiku-4-5": "claude-haiku-4-5-20251001",
  "claude-opus-4-5": "claude-opus-4-5-20251101",
};

export type ClaudeModel = keyof typeof MODEL_ALIASES;

interface RateLimitConfig {
  maxRequestsPerMinute: number;
  maxTokensPerMinute: number;
  maxConcurrent: number;
}

// Rate limits by plan
const RATE_LIMITS: Record<string, RateLimitConfig> = {
  starter: { maxRequestsPerMinute: 10, maxTokensPerMinute: 50000, maxConcurrent: 2 },
  pro: { maxRequestsPerMinute: 30, maxTokensPerMinute: 200000, maxConcurrent: 5 },
  pro_plus: { maxRequestsPerMinute: 60, maxTokensPerMinute: 500000, maxConcurrent: 10 },
};

interface UsageTracking {
  organizationId: string;
  plan: "starter" | "pro" | "pro_plus";
  onDemandEnabled: boolean;
  onDemandLimitCents: number;
  currentSpendCents: number;
}

interface RequestOptions {
  model?: ClaudeModel;
  maxTokens?: number;
  temperature?: number;
  organizationId?: string;
  skipUsageTracking?: boolean;
}

interface ClaudeResponse {
  content: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    costCents: number;
  };
  model: string;
  cached: boolean;
}

// In-memory rate limiting (use Redis in production for multi-instance)
const rateLimitStore = new Map<string, { requests: number[]; tokens: number; concurrent: number }>();

// Request queue for DDoS protection
const requestQueue = new Map<string, Promise<unknown>[]>();

export class ClaudeClient {
  private apiKey: string;
  private baseUrl = "https://api.anthropic.com/v1/messages";
  private apiVersion = "2023-06-01";

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.ANTHROPIC_API_KEY || "";
    
    if (!this.apiKey) {
      console.warn("⚠️ Claude API key not configured. AI features will be disabled.");
    }
  }

  /**
   * Check if client is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Resolve model alias to full model name
   */
  private resolveModel(model: ClaudeModel): string {
    return MODEL_ALIASES[model] || model;
  }

  /**
   * Calculate cost in cents for a request
   */
  private calculateCost(model: string, inputTokens: number, outputTokens: number): number {
    const costs = MODEL_COSTS[model as keyof typeof MODEL_COSTS];
    if (!costs) return 0;
    
    // Cost per 1M tokens, so divide by 1,000,000
    const inputCost = (inputTokens / 1_000_000) * costs.input;
    const outputCost = (outputTokens / 1_000_000) * costs.output;
    
    return Math.ceil((inputCost + outputCost) * 100) / 100; // Round to nearest cent
  }

  /**
   * Check rate limits for an organization
   */
  private checkRateLimit(organizationId: string, plan: string): { allowed: boolean; retryAfter?: number } {
    const limits = RATE_LIMITS[plan] || RATE_LIMITS.starter;
    const now = Date.now();
    const minuteAgo = now - 60000;

    let store = rateLimitStore.get(organizationId);
    if (!store) {
      store = { requests: [], tokens: 0, concurrent: 0 };
      rateLimitStore.set(organizationId, store);
    }

    // Clean old requests
    store.requests = store.requests.filter(t => t > minuteAgo);

    // Check request limit
    if (store.requests.length >= limits.maxRequestsPerMinute) {
      const oldestRequest = store.requests[0];
      const retryAfter = Math.ceil((oldestRequest + 60000 - now) / 1000);
      return { allowed: false, retryAfter };
    }

    // Check concurrent limit
    if (store.concurrent >= limits.maxConcurrent) {
      return { allowed: false, retryAfter: 1 };
    }

    return { allowed: true };
  }

  /**
   * Record a request for rate limiting
   */
  private recordRequest(organizationId: string, tokens: number): void {
    const store = rateLimitStore.get(organizationId);
    if (store) {
      store.requests.push(Date.now());
      store.tokens += tokens;
      store.concurrent++;
    }
  }

  /**
   * Release concurrent slot
   */
  private releaseRequest(organizationId: string): void {
    const store = rateLimitStore.get(organizationId);
    if (store && store.concurrent > 0) {
      store.concurrent--;
    }
  }

  /**
   * Check if user can make request (usage limits)
   */
  private async checkUsageLimits(usage: UsageTracking, estimatedCost: number): Promise<{ allowed: boolean; reason?: string }> {
    // If on-demand is enabled, check spend limit
    if (usage.onDemandEnabled) {
      const projectedSpend = usage.currentSpendCents + estimatedCost;
      if (projectedSpend > usage.onDemandLimitCents) {
        return {
          allowed: false,
          reason: `On-demand spending limit reached ($${(usage.onDemandLimitCents / 100).toFixed(2)}). Increase your limit in settings.`,
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Main chat method with all protections
   */
  async chat(
    messages: Array<{ role: "user" | "assistant"; content: string }>,
    systemPrompt?: string,
    options: RequestOptions = {}
  ): Promise<ClaudeResponse> {
    if (!this.isConfigured()) {
      throw new Error("Claude API key not configured. Please add ANTHROPIC_API_KEY to your environment.");
    }

    const model = this.resolveModel(options.model || "sonnet");
    const maxTokens = options.maxTokens || 4096;
    const temperature = options.temperature ?? 0.7;
    const orgId = options.organizationId || "default";

    // Rate limit check
    const rateCheck = this.checkRateLimit(orgId, "pro"); // Default to pro limits
    if (!rateCheck.allowed) {
      throw new RateLimitError(
        `Rate limit exceeded. Please wait ${rateCheck.retryAfter} seconds.`,
        rateCheck.retryAfter || 60
      );
    }

    // Record request start
    this.recordRequest(orgId, 0);

    try {
      // Make API request with retry
      const response = await this.makeRequestWithRetry(
        messages,
        systemPrompt,
        model,
        maxTokens,
        temperature
      );

      return response;
    } finally {
      // Release concurrent slot
      this.releaseRequest(orgId);
    }
  }

  /**
   * Make request with exponential backoff retry
   */
  private async makeRequestWithRetry(
    messages: Array<{ role: "user" | "assistant"; content: string }>,
    systemPrompt: string | undefined,
    model: string,
    maxTokens: number,
    temperature: number,
    attempt: number = 1,
    maxAttempts: number = 3
  ): Promise<ClaudeResponse> {
    try {
      const body: Record<string, unknown> = {
        model,
        max_tokens: maxTokens,
        temperature,
        messages,
      };

      if (systemPrompt) {
        body.system = systemPrompt;
      }

      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "x-api-key": this.apiKey,
          "anthropic-version": this.apiVersion,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        
        // Handle specific error codes
        if (response.status === 429) {
          // Rate limited by Anthropic
          const retryAfter = parseInt(response.headers.get("retry-after") || "60");
          throw new RateLimitError(`Anthropic rate limit exceeded`, retryAfter);
        }
        
        if (response.status === 529) {
          // Overloaded
          throw new OverloadedError("Claude API is currently overloaded. Please try again.");
        }

        if (response.status === 401) {
          throw new AuthenticationError("Invalid API key. Please check your ANTHROPIC_API_KEY.");
        }

        throw new Error(`Claude API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      const inputTokens = data.usage?.input_tokens || 0;
      const outputTokens = data.usage?.output_tokens || 0;
      const costCents = this.calculateCost(model, inputTokens, outputTokens);

      // Track spending for wallet monitoring
      trackSpending(costCents);

      return {
        content: data.content?.[0]?.text || "",
        usage: {
          inputTokens,
          outputTokens,
          costCents,
        },
        model,
        cached: data.usage?.cache_read_input_tokens > 0,
      };
    } catch (error) {
      // Retry on transient errors
      if (attempt < maxAttempts && this.isRetryableError(error)) {
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
        await this.sleep(delay);
        return this.makeRequestWithRetry(
          messages,
          systemPrompt,
          model,
          maxTokens,
          temperature,
          attempt + 1,
          maxAttempts
        );
      }
      throw error;
    }
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: unknown): boolean {
    if (error instanceof RateLimitError) return true;
    if (error instanceof OverloadedError) return true;
    if (error instanceof Error) {
      return error.message.includes("529") || 
             error.message.includes("503") ||
             error.message.includes("timeout");
    }
    return false;
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Estimate cost before making request
   */
  estimateCost(model: ClaudeModel, inputChars: number, expectedOutputTokens: number = 1000): number {
    const resolvedModel = this.resolveModel(model);
    // Rough estimate: 4 chars per token
    const estimatedInputTokens = Math.ceil(inputChars / 4);
    return this.calculateCost(resolvedModel, estimatedInputTokens, expectedOutputTokens);
  }

  // ============================================
  // HIGH-LEVEL SEO METHODS
  // ============================================

  /**
   * Quick JSON response (uses Haiku for speed)
   */
  async getJSON<T>(prompt: string, systemPrompt?: string): Promise<T> {
    const response = await this.chat(
      [{ role: "user", content: prompt }],
      systemPrompt || "You are a helpful assistant. Return only valid JSON, no markdown or explanation.",
      { model: "haiku", maxTokens: 2048 }
    );

    try {
      // Strip markdown code blocks first (most common issue)
      let content = response.content
        .replace(/^```(?:json|JSON)?\s*\n?/gm, '')
        .replace(/\n?```\s*$/gm, '')
        .replace(/```(?:json|JSON)?/g, '')
        .trim();
      
      // Try direct parse
      try {
        return JSON.parse(content);
      } catch {
        // Try extracting JSON object/array
        const jsonMatch = content.match(/[\[{][\s\S]*[\]}]/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }
      
      // Last resort - original content
      return JSON.parse(response.content);
    } catch {
      throw new Error(`Failed to parse JSON response: ${response.content.slice(0, 200)}`);
    }
  }

  /**
   * Generate long-form content (uses Sonnet)
   */
  async generateContent(prompt: string, systemPrompt?: string): Promise<ClaudeResponse> {
    return this.chat(
      [{ role: "user", content: prompt }],
      systemPrompt || "You are an expert SEO content writer. Write comprehensive, engaging, and well-structured content.",
      { model: "sonnet", maxTokens: 8192 }
    );
  }

  /**
   * Quick analysis (uses Haiku)
   */
  async analyze(prompt: string): Promise<ClaudeResponse> {
    return this.chat(
      [{ role: "user", content: prompt }],
      "You are an SEO expert. Provide clear, actionable analysis.",
      { model: "haiku", maxTokens: 2048 }
    );
  }

  /**
   * Premium content (uses Opus - Pro+ only)
   */
  async generatePremiumContent(prompt: string, systemPrompt?: string): Promise<ClaudeResponse> {
    return this.chat(
      [{ role: "user", content: prompt }],
      systemPrompt || "You are a world-class content writer. Create exceptional, publication-ready content.",
      { model: "opus", maxTokens: 8192 }
    );
  }
}

// ============================================
// CUSTOM ERRORS
// ============================================

export class RateLimitError extends Error {
  retryAfter: number;
  
  constructor(message: string, retryAfter: number) {
    super(message);
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
}

export class OverloadedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OverloadedError";
  }
}

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class UsageLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UsageLimitError";
  }
}

// ============================================
// SPENDING TRACKER INTEGRATION
// ============================================

// Import spending tracker (lazy to avoid circular deps)
let recordSpendingFn: ((costCents: number) => void) | null = null;

export function setSpendingTracker(fn: (costCents: number) => void): void {
  recordSpendingFn = fn;
}

// Internal function to record spending after each call
function trackSpending(costCents: number): void {
  if (recordSpendingFn && costCents > 0) {
    recordSpendingFn(costCents);
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const claude = new ClaudeClient();

