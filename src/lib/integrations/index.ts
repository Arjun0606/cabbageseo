/**
 * CabbageSEO Integration Hub
 * 
 * 100% AI-POWERED - No third-party SEO tools
 * 
 * Focus: GEO (Generative Engine Optimization)
 * - Getting cited by ChatGPT, Perplexity, Google AI
 * - Location/context-aware content optimization
 * - No traditional SEO tools needed
 * 
 * Only external services:
 * - OpenAI (GPT-5-mini for everything)
 * - CMS integrations (for publishing)
 * - Optional: GSC/GA4 (for tracking, not optimization)
 */

// AI Provider (the only external API we need)
export { AIClient, ai } from "./openai/client";

// Analytics (optional - for tracking only)
export { GSCClient, gsc } from "./gsc/client";

// CMS / Publishing - Full suite
export { WordPressClient, createWordPressClient } from "./wordpress/client";
export { WebflowClient, createWebflowClient } from "./webflow/client";
export { ShopifyClient, createShopifyClient } from "./shopify/client";
export { GhostClient, createGhostClient } from "./ghost/client";
export { NotionClient, createNotionClient } from "./notion/client";
export { HubSpotClient, createHubSpotClient } from "./hubspot/client";
export { FramerClient, createFramerClient } from "./framer/client";
export { WebhookClient, createWebhookClient, WEBHOOK_TEMPLATES } from "./webhooks/client";

// Integration type definitions
export type CMSIntegrationType = 
  | "wordpress"
  | "webflow"
  | "shopify"
  | "ghost"
  | "notion"
  | "hubspot"
  | "framer"
  | "webhook";

export type AnalyticsIntegrationType =
  | "gsc"
  | "ga4";

export type IntegrationType = 
  | CMSIntegrationType
  | AnalyticsIntegrationType
  | "openai";

export interface IntegrationStatus {
  id: IntegrationType | string;
  name: string;
  configured: boolean;
  category: "cms" | "analytics" | "ai";
  lastVerified?: Date;
  error?: string;
}

/**
 * All available CMS integrations
 */
export const CMS_INTEGRATIONS = [
  { id: "wordpress", name: "WordPress", icon: "🔵", description: "Most popular CMS for SaaS blogs" },
  { id: "webflow", name: "Webflow", icon: "🟣", description: "Popular for SaaS landing pages" },
  { id: "shopify", name: "Shopify", icon: "🛒", description: "E-commerce & marketplace blogs" },
  { id: "ghost", name: "Ghost", icon: "👻", description: "Modern publishing platform" },
  { id: "notion", name: "Notion", icon: "📝", description: "Publish to Notion databases" },
  { id: "hubspot", name: "HubSpot", icon: "🧡", description: "Marketing & CRM blog" },
  { id: "framer", name: "Framer", icon: "🎨", description: "Design-first websites" },
  { id: "webhook", name: "Webhooks", icon: "🔗", description: "Custom integrations (Zapier, Make, n8n)" },
] as const;

/**
 * Check status of all integrations
 */
export async function checkAllIntegrations(): Promise<IntegrationStatus[]> {
  const statuses: IntegrationStatus[] = [];

  // AI - OpenAI (the only required external service)
  statuses.push({
    id: "openai",
    name: "OpenAI (GPT-5)",
    configured: Boolean(process.env.OPENAI_API_KEY),
    category: "ai",
  });

  // Analytics - GSC (optional)
  statuses.push({
    id: "gsc",
    name: "Google Search Console",
    configured: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    category: "analytics",
  });

  // Analytics - GA4 (optional)
  statuses.push({
    id: "ga4",
    name: "Google Analytics 4",
    configured: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    category: "analytics",
  });

  // CMS integrations are user-configured per organization
  // They're stored in the integrations table

  return statuses;
}

/**
 * Check if AI is configured (the only required dependency)
 */
export function isAIConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

/**
 * Get AI provider - OpenAI only
 */
export function getAIProvider(): "openai" | null {
  if (process.env.OPENAI_API_KEY) {
    return "openai";
  }
  return null;
}
