/**
 * OpenAI Client for CabbageSEO
 * 
 * Models (Updated Jan 2026):
 * - GPT-5-mini: Smart & efficient ($0.25/$2.00 per MTok, 400K context) - DEFAULT
 * - GPT-4.1-nano: Ultra-cheap for bulk tasks ($0.10/$0.40 per MTok)
 * - GPT-4.1-mini: Budget option ($0.15/$0.60 per MTok)
 * - GPT-5: Full power for premium content
 * 
 * GPT-5-mini is the default - excellent for keyword intelligence, GEO analysis,
 * and content generation. 400K context handles large site analyses easily.
 */

// Cost per 1M tokens (in cents) - OpenAI pricing (Jan 2026)
const MODEL_COSTS = {
  // GPT-5 Series (Aug 2025) - RECOMMENDED
  "gpt-5-mini": { input: 25, output: 200 },       // $0.25/$2.00 per MTok - smart & efficient
  "gpt-5": { input: 500, output: 1500 },          // $5/$15 per MTok - full power
  // GPT-4.1 Series - Budget options
  "gpt-4.1-nano": { input: 10, output: 40 },      // $0.10/$0.40 per MTok - ultra cheap
  "gpt-4.1-mini": { input: 15, output: 60 },      // $0.15/$0.60 per MTok - budget
  "gpt-4.1": { input: 200, output: 800 },         // $2/$8 per MTok
  // Legacy (still supported)
  "gpt-4o-mini": { input: 15, output: 60 },
  "gpt-4o": { input: 250, output: 1000 },
} as const;

// Model aliases - map semantic names to actual models
const MODEL_ALIASES: Record<string, keyof typeof MODEL_COSTS> = {
  // Recommended aliases
  "fast": "gpt-5-mini",           // Default for most tasks (smart + efficient)
  "nano": "gpt-4.1-nano",         // Ultra-cheap for bulk/simple tasks
  "budget": "gpt-4.1-mini",       // Budget option
  "quality": "gpt-5",             // Premium content
  // Claude-compatible aliases
  "sonnet": "gpt-5-mini",
  "haiku": "gpt-4.1-nano",
  "opus": "gpt-5",
  // Direct model names
  "gpt-5-mini": "gpt-5-mini",
  "gpt-5": "gpt-5",
  "gpt-4.1-nano": "gpt-4.1-nano",
  "gpt-4.1-mini": "gpt-4.1-mini",
  "gpt-4.1": "gpt-4.1",
  "gpt-4o-mini": "gpt-4o-mini",
  "gpt-4o": "gpt-4o",
};

export type AIModel = keyof typeof MODEL_ALIASES;

interface RequestOptions {
  model?: AIModel;
  maxTokens?: number;
  temperature?: number;
  organizationId?: string;
  skipUsageTracking?: boolean;
}

interface AIResponse {
  content: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    costCents: number;
  };
  model: string;
  cached: boolean;
}

interface RateLimitConfig {
  maxRequestsPerMinute: number;
  maxTokensPerMinute: number;
  maxConcurrent: number;
}

// Rate limits by plan
const RATE_LIMITS: Record<string, RateLimitConfig> = {
  starter: { maxRequestsPerMinute: 20, maxTokensPerMinute: 100000, maxConcurrent: 5 },
  pro: { maxRequestsPerMinute: 60, maxTokensPerMinute: 500000, maxConcurrent: 10 },
  pro_plus: { maxRequestsPerMinute: 120, maxTokensPerMinute: 1000000, maxConcurrent: 20 },
};

// In-memory rate limiting
const rateLimitStore = new Map<string, { requests: number[]; tokens: number; concurrent: number }>();

export class OpenAIClient {
  private apiKey: string;
  private baseUrl = "https://api.openai.com/v1/chat/completions";

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || "";
    
    if (!this.apiKey) {
      console.warn("⚠️ OpenAI API key not configured. AI features will be disabled.");
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
  private resolveModel(model: AIModel): string {
    return MODEL_ALIASES[model] || "gpt-4o-mini";
  }

  /**
   * Calculate cost in cents for a request
   */
  private calculateCost(model: string, inputTokens: number, outputTokens: number): number {
    const costs = MODEL_COSTS[model as keyof typeof MODEL_COSTS] || MODEL_COSTS["gpt-4o-mini"];
    
    // Cost per 1M tokens, so divide by 1,000,000
    const inputCost = (inputTokens / 1_000_000) * costs.input;
    const outputCost = (outputTokens / 1_000_000) * costs.output;
    
    return Math.ceil((inputCost + outputCost) * 100) / 100;
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

    if (store.requests.length >= limits.maxRequestsPerMinute) {
      const oldestRequest = store.requests[0];
      const retryAfter = Math.ceil((oldestRequest + 60000 - now) / 1000);
      return { allowed: false, retryAfter };
    }

    if (store.concurrent >= limits.maxConcurrent) {
      return { allowed: false, retryAfter: 1 };
    }

    return { allowed: true };
  }

  private recordRequest(organizationId: string): void {
    const store = rateLimitStore.get(organizationId);
    if (store) {
      store.requests.push(Date.now());
      store.concurrent++;
    }
  }

  private releaseRequest(organizationId: string): void {
    const store = rateLimitStore.get(organizationId);
    if (store && store.concurrent > 0) {
      store.concurrent--;
    }
  }

  /**
   * Main chat method - compatible with Claude client interface
   */
  async chat(
    messages: Array<{ role: "user" | "assistant"; content: string }>,
    systemPrompt?: string,
    options: RequestOptions = {}
  ): Promise<AIResponse> {
    if (!this.isConfigured()) {
      throw new Error("OpenAI API key not configured. Please add OPENAI_API_KEY to your environment.");
    }

    const model = this.resolveModel(options.model || "fast");
    const maxTokens = options.maxTokens || 4096;
    const temperature = options.temperature ?? 0.7;
    const orgId = options.organizationId || "default";

    // Rate limit check
    const rateCheck = this.checkRateLimit(orgId, "pro");
    if (!rateCheck.allowed) {
      throw new RateLimitError(
        `Rate limit exceeded. Please wait ${rateCheck.retryAfter} seconds.`,
        rateCheck.retryAfter || 60
      );
    }

    this.recordRequest(orgId);

    try {
      const response = await this.makeRequestWithRetry(
        messages,
        systemPrompt,
        model,
        maxTokens,
        temperature
      );
      return response;
    } finally {
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
  ): Promise<AIResponse> {
    try {
      // Build messages array with system prompt
      const apiMessages: Array<{ role: string; content: string }> = [];
      
      if (systemPrompt) {
        apiMessages.push({ role: "system", content: systemPrompt });
      }
      
      apiMessages.push(...messages);

      // Add timeout controller
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 55000); // 55s timeout

      try {
        const response = await fetch(this.baseUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages: apiMessages,
            max_tokens: maxTokens,
            temperature,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          
          if (response.status === 429) {
            const retryAfter = parseInt(response.headers.get("retry-after") || "60");
            throw new RateLimitError(`OpenAI rate limit exceeded`, retryAfter);
          }
          
          if (response.status === 401) {
            throw new AuthenticationError("Invalid OpenAI API key. Please check your OPENAI_API_KEY.");
          }

          throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        
        const inputTokens = data.usage?.prompt_tokens || 0;
        const outputTokens = data.usage?.completion_tokens || 0;
        const costCents = this.calculateCost(model, inputTokens, outputTokens);

        // Track spending
        trackSpending(costCents);

        return {
          content: data.choices?.[0]?.message?.content || "",
          usage: {
            inputTokens,
            outputTokens,
            costCents,
          },
          model,
          cached: false,
        };
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
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

  private isRetryableError(error: unknown): boolean {
    if (error instanceof RateLimitError) return true;
    if (error instanceof Error) {
      return error.message.includes("429") || 
             error.message.includes("503") ||
             error.message.includes("timeout") ||
             error.name === "AbortError";
    }
    return false;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Estimate cost before making request
   */
  estimateCost(model: AIModel, inputChars: number, expectedOutputTokens: number = 1000): number {
    const resolvedModel = this.resolveModel(model);
    const estimatedInputTokens = Math.ceil(inputChars / 4);
    return this.calculateCost(resolvedModel, estimatedInputTokens, expectedOutputTokens);
  }

  // ============================================
  // HIGH-LEVEL METHODS (same interface as Claude)
  // ============================================

  /**
   * Quick JSON response
   */
  async getJSON<T>(prompt: string, systemPrompt?: string): Promise<T> {
    const response = await this.chat(
      [{ role: "user", content: prompt }],
      systemPrompt || "You are a helpful assistant. Return only valid JSON, no markdown or explanation.",
      { model: "fast", maxTokens: 2048 }
    );

    try {
      // Strip markdown code blocks
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
      
      return JSON.parse(response.content);
    } catch {
      throw new Error(`Failed to parse JSON response: ${response.content.slice(0, 200)}`);
    }
  }

  /**
   * Generate long-form content
   */
  async generateContent(prompt: string, systemPrompt?: string): Promise<AIResponse> {
    return this.chat(
      [{ role: "user", content: prompt }],
      systemPrompt || "You are an expert SEO and AIO content writer. Write comprehensive, engaging, and well-structured content optimized for both search engines and AI platforms.",
      { model: "fast", maxTokens: 4096 }
    );
  }

  /**
   * Quick analysis
   */
  async analyze(prompt: string): Promise<AIResponse> {
    return this.chat(
      [{ role: "user", content: prompt }],
      "You are an SEO and AIO expert. Provide clear, actionable analysis.",
      { model: "fast", maxTokens: 2048 }
    );
  }

  /**
   * Premium content (uses GPT-4o)
   */
  async generatePremiumContent(prompt: string, systemPrompt?: string): Promise<AIResponse> {
    return this.chat(
      [{ role: "user", content: prompt }],
      systemPrompt || "You are a world-class content writer. Create exceptional, publication-ready content.",
      { model: "quality", maxTokens: 8192 }
    );
  }
}

// ============================================
// CUSTOM ERRORS (same as Claude client)
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
// SPENDING TRACKER
// ============================================

let recordSpendingFn: ((costCents: number) => void) | null = null;

export function setSpendingTracker(fn: (costCents: number) => void): void {
  recordSpendingFn = fn;
}

function trackSpending(costCents: number): void {
  if (recordSpendingFn && costCents > 0) {
    recordSpendingFn(costCents);
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const openai = new OpenAIClient();

// Also export as 'claude' for backward compatibility
export const claude = openai;

// Type alias for backward compatibility
export type ClaudeModel = AIModel;
export const ClaudeClient = OpenAIClient;

