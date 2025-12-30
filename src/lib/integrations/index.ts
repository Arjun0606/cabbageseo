/**
 * CabbageSEO Integration Hub
 * 
 * Centralizes all external service integrations.
 * All CMS integrations SEObot has + more for AIO focus.
 */

// AI Providers
export { AIClient, ai } from "./openai/client";

// SEO Data Providers
export { DataForSEOClient, dataForSEO } from "./dataforseo/client";
export { SerpAPIClient, serpapi } from "./serpapi/client";
export { AhrefsClient, ahrefs } from "./ahrefs/client";

// Content Optimization
export { SurferClient, surfer } from "./surfer/client";

// Analytics
export { GSCClient, gsc } from "./gsc/client";

// CMS / Publishing - Full suite like SEObot
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

export type AIIntegrationType =
  | "openai"
  | "anthropic";

export type IntegrationType = 
  | CMSIntegrationType
  | AnalyticsIntegrationType
  | AIIntegrationType
  | "dataforseo"
  | "serpapi"
  | "ahrefs"
  | "surfer";

export interface IntegrationStatus {
  id: IntegrationType;
  name: string;
  configured: boolean;
  category: "cms" | "analytics" | "ai" | "seo";
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

  // AI - OpenAI (Primary)
  statuses.push({
    id: "openai",
    name: "OpenAI",
    configured: Boolean(process.env.OPENAI_API_KEY),
    category: "ai",
  });

  // AI - Anthropic (Fallback)
  statuses.push({
    id: "anthropic",
    name: "Anthropic (Claude)",
    configured: Boolean(process.env.ANTHROPIC_API_KEY),
    category: "ai",
  });

  // SEO Data - DataForSEO
  statuses.push({
    id: "dataforseo",
    name: "DataForSEO",
    configured: Boolean(process.env.DATAFORSEO_LOGIN && process.env.DATAFORSEO_PASSWORD),
    category: "seo",
  });

  // SEO Data - SerpAPI
  statuses.push({
    id: "serpapi",
    name: "SerpAPI",
    configured: Boolean(process.env.SERPAPI_KEY),
    category: "seo",
  });

  // SEO Data - Ahrefs
  statuses.push({
    id: "ahrefs",
    name: "Ahrefs",
    configured: Boolean(process.env.AHREFS_API_KEY),
    category: "seo",
  });

  // Content Optimization - Surfer
  statuses.push({
    id: "surfer",
    name: "Surfer SEO",
    configured: Boolean(process.env.SURFER_API_KEY),
    category: "seo",
  });

  // Analytics - GSC
  statuses.push({
    id: "gsc",
    name: "Google Search Console",
    configured: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    category: "analytics",
  });

  // Analytics - GA4
  statuses.push({
    id: "ga4",
    name: "Google Analytics 4",
    configured: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    category: "analytics",
  });

  // CMS integrations are user-configured, not env-based
  // They're stored in the integrations table per organization

  return statuses;
}

/**
 * Get available SEO data provider
 * Prefers DataForSEO, falls back to SerpAPI
 */
export function getSEODataProvider(): "dataforseo" | "serpapi" | null {
  if (process.env.DATAFORSEO_LOGIN && process.env.DATAFORSEO_PASSWORD) {
    return "dataforseo";
  }
  if (process.env.SERPAPI_KEY) {
    return "serpapi";
  }
  return null;
}

/**
 * Get available AI provider
 * OpenAI is now primary for reliability
 */
export function getAIProvider(): "openai" | "anthropic" | null {
  if (process.env.OPENAI_API_KEY) {
    return "openai";
  }
  if (process.env.ANTHROPIC_API_KEY) {
    return "anthropic";
  }
  return null;
}
