/**
 * CabbageSEO Integration Hub
 * 
 * Centralizes all external service integrations.
 * Each integration is available both as a singleton and as a class for custom configurations.
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

// CMS / Publishing
export { WordPressClient, createWordPressClient } from "./wordpress/client";
export { WebflowClient, createWebflowClient } from "./webflow/client";
export { ShopifyClient, createShopifyClient } from "./shopify/client";

// Outreach / Link Building (Apollo.io = Hunter + Instantly combined)
export { ApolloClient, apollo } from "./apollo/client";

// Integration status checker
export type IntegrationType = 
  | "anthropic"
  | "openai"
  | "dataforseo"
  | "serpapi"
  | "ahrefs"
  | "surfer"
  | "gsc"
  | "ga4"
  | "wordpress"
  | "webflow"
  | "shopify"
  | "apollo";

export interface IntegrationStatus {
  id: IntegrationType;
  name: string;
  configured: boolean;
  lastVerified?: Date;
  error?: string;
}

/**
 * Check status of all integrations
 */
export async function checkAllIntegrations(): Promise<IntegrationStatus[]> {
  const statuses: IntegrationStatus[] = [];

  // AI - Anthropic (Claude)
  statuses.push({
    id: "anthropic",
    name: "Anthropic (Claude)",
    configured: Boolean(process.env.ANTHROPIC_API_KEY),
  });

  // AI - OpenAI (Fallback)
  statuses.push({
    id: "openai",
    name: "OpenAI",
    configured: Boolean(process.env.OPENAI_API_KEY),
  });

  // SEO Data - DataForSEO
  statuses.push({
    id: "dataforseo",
    name: "DataForSEO",
    configured: Boolean(process.env.DATAFORSEO_LOGIN && process.env.DATAFORSEO_PASSWORD),
  });

  // SEO Data - SerpAPI
  statuses.push({
    id: "serpapi",
    name: "SerpAPI",
    configured: Boolean(process.env.SERPAPI_KEY),
  });

  // SEO Data - Ahrefs
  statuses.push({
    id: "ahrefs",
    name: "Ahrefs",
    configured: Boolean(process.env.AHREFS_API_KEY),
  });

  // Content Optimization - Surfer
  statuses.push({
    id: "surfer",
    name: "Surfer SEO",
    configured: Boolean(process.env.SURFER_API_KEY),
  });

  // Analytics - GSC
  statuses.push({
    id: "gsc",
    name: "Google Search Console",
    configured: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  });

  // Analytics - GA4
  statuses.push({
    id: "ga4",
    name: "Google Analytics 4",
    configured: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  });

  // CMS - Webflow
  statuses.push({
    id: "webflow",
    name: "Webflow",
    configured: Boolean(process.env.WEBFLOW_API_KEY),
  });

  // CMS - Shopify
  statuses.push({
    id: "shopify",
    name: "Shopify",
    configured: Boolean(process.env.SHOPIFY_STORE_URL && process.env.SHOPIFY_ACCESS_TOKEN),
  });

  // Outreach - Apollo.io (email finding + sequences)
  statuses.push({
    id: "apollo",
    name: "Apollo.io",
    configured: Boolean(process.env.APOLLO_API_KEY),
  });

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
 * Prefers Anthropic (Claude), falls back to OpenAI
 */
export function getAIProvider(): "anthropic" | "openai" | null {
  if (process.env.ANTHROPIC_API_KEY) {
    return "anthropic";
  }
  if (process.env.OPENAI_API_KEY) {
    return "openai";
  }
  return null;
}
