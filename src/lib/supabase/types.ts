/**
 * Supabase Database Types
 * 
 * This file defines TypeScript types for the database schema.
 * In production, generate this with: npx supabase gen types typescript
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          organization_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          organization_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          organization_id?: string | null;
          updated_at?: string;
        };
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          owner_id: string;
          plan: "starter" | "pro" | "business" | "enterprise";
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          on_demand_enabled: boolean;
          on_demand_spending_limit: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          owner_id: string;
          plan?: "starter" | "pro" | "business" | "enterprise";
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          on_demand_enabled?: boolean;
          on_demand_spending_limit?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          plan?: "starter" | "pro" | "business" | "enterprise";
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          on_demand_enabled?: boolean;
          on_demand_spending_limit?: number;
          updated_at?: string;
        };
      };
      sites: {
        Row: {
          id: string;
          organization_id: string;
          domain: string;
          name: string;
          verified: boolean;
          verification_method: string | null;
          verification_token: string | null;
          gsc_property: string | null;
          ga4_property: string | null;
          cms_type: "wordpress" | "webflow" | "shopify" | "custom" | null;
          cms_config: Json | null;
          last_crawled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          domain: string;
          name: string;
          verified?: boolean;
          verification_method?: string | null;
          verification_token?: string | null;
          gsc_property?: string | null;
          ga4_property?: string | null;
          cms_type?: "wordpress" | "webflow" | "shopify" | "custom" | null;
          cms_config?: Json | null;
          last_crawled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          domain?: string;
          name?: string;
          verified?: boolean;
          verification_method?: string | null;
          gsc_property?: string | null;
          ga4_property?: string | null;
          cms_type?: "wordpress" | "webflow" | "shopify" | "custom" | null;
          cms_config?: Json | null;
          last_crawled_at?: string | null;
          updated_at?: string;
        };
      };
      site_pages: {
        Row: {
          id: string;
          site_id: string;
          url: string;
          title: string | null;
          meta_description: string | null;
          h1: string | null;
          word_count: number;
          internal_links_count: number;
          external_links_count: number;
          images_count: number;
          images_without_alt: number;
          last_crawled_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          site_id: string;
          url: string;
          title?: string | null;
          meta_description?: string | null;
          h1?: string | null;
          word_count?: number;
          internal_links_count?: number;
          external_links_count?: number;
          images_count?: number;
          images_without_alt?: number;
          last_crawled_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          url?: string;
          title?: string | null;
          meta_description?: string | null;
          h1?: string | null;
          word_count?: number;
          internal_links_count?: number;
          external_links_count?: number;
          images_count?: number;
          images_without_alt?: number;
          last_crawled_at?: string;
          updated_at?: string;
        };
      };
      keywords: {
        Row: {
          id: string;
          site_id: string;
          keyword: string;
          volume: number | null;
          difficulty: number | null;
          cpc: number | null;
          intent: "informational" | "commercial" | "transactional" | "navigational" | null;
          cluster_id: string | null;
          current_position: number | null;
          previous_position: number | null;
          target_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          site_id: string;
          keyword: string;
          volume?: number | null;
          difficulty?: number | null;
          cpc?: number | null;
          intent?: "informational" | "commercial" | "transactional" | "navigational" | null;
          cluster_id?: string | null;
          current_position?: number | null;
          previous_position?: number | null;
          target_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          keyword?: string;
          volume?: number | null;
          difficulty?: number | null;
          cpc?: number | null;
          intent?: "informational" | "commercial" | "transactional" | "navigational" | null;
          cluster_id?: string | null;
          current_position?: number | null;
          previous_position?: number | null;
          target_url?: string | null;
          updated_at?: string;
        };
      };
      keyword_clusters: {
        Row: {
          id: string;
          site_id: string;
          name: string;
          keywords_count: number;
          total_volume: number;
          avg_difficulty: number;
          status: "not_started" | "in_progress" | "completed";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          site_id: string;
          name: string;
          keywords_count?: number;
          total_volume?: number;
          avg_difficulty?: number;
          status?: "not_started" | "in_progress" | "completed";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          keywords_count?: number;
          total_volume?: number;
          avg_difficulty?: number;
          status?: "not_started" | "in_progress" | "completed";
          updated_at?: string;
        };
      };
      content_pieces: {
        Row: {
          id: string;
          site_id: string;
          title: string;
          slug: string | null;
          target_keyword: string;
          secondary_keywords: string[];
          content: string | null;
          meta_title: string | null;
          meta_description: string | null;
          word_count: number;
          seo_score: number;
          status: "idea" | "outline" | "draft" | "review" | "published";
          published_url: string | null;
          published_at: string | null;
          cms_post_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          site_id: string;
          title: string;
          slug?: string | null;
          target_keyword: string;
          secondary_keywords?: string[];
          content?: string | null;
          meta_title?: string | null;
          meta_description?: string | null;
          word_count?: number;
          seo_score?: number;
          status?: "idea" | "outline" | "draft" | "review" | "published";
          published_url?: string | null;
          published_at?: string | null;
          cms_post_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          slug?: string | null;
          target_keyword?: string;
          secondary_keywords?: string[];
          content?: string | null;
          meta_title?: string | null;
          meta_description?: string | null;
          word_count?: number;
          seo_score?: number;
          status?: "idea" | "outline" | "draft" | "review" | "published";
          published_url?: string | null;
          published_at?: string | null;
          cms_post_id?: string | null;
          updated_at?: string;
        };
      };
      audit_issues: {
        Row: {
          id: string;
          site_id: string;
          page_id: string | null;
          type: string;
          severity: "critical" | "warning" | "info";
          title: string;
          description: string;
          how_to_fix: string | null;
          auto_fixable: boolean;
          fixed: boolean;
          fixed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          site_id: string;
          page_id?: string | null;
          type: string;
          severity: "critical" | "warning" | "info";
          title: string;
          description: string;
          how_to_fix?: string | null;
          auto_fixable?: boolean;
          fixed?: boolean;
          fixed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          type?: string;
          severity?: "critical" | "warning" | "info";
          title?: string;
          description?: string;
          how_to_fix?: string | null;
          auto_fixable?: boolean;
          fixed?: boolean;
          fixed_at?: string | null;
          updated_at?: string;
        };
      };
      internal_links: {
        Row: {
          id: string;
          site_id: string;
          from_page_id: string;
          to_page_id: string;
          anchor_text: string;
          context: string | null;
          impact: "high" | "medium" | "low";
          status: "suggested" | "applied" | "ignored";
          applied_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          site_id: string;
          from_page_id: string;
          to_page_id: string;
          anchor_text: string;
          context?: string | null;
          impact?: "high" | "medium" | "low";
          status?: "suggested" | "applied" | "ignored";
          applied_at?: string | null;
          created_at?: string;
        };
        Update: {
          anchor_text?: string;
          context?: string | null;
          impact?: "high" | "medium" | "low";
          status?: "suggested" | "applied" | "ignored";
          applied_at?: string | null;
        };
      };
      integrations: {
        Row: {
          id: string;
          organization_id: string;
          type: string;
          credentials: Json;
          status: "active" | "error" | "disconnected";
          error: string | null;
          last_synced_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          type: string;
          credentials: Json;
          status?: "active" | "error" | "disconnected";
          error?: string | null;
          last_synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          type?: string;
          credentials?: Json;
          status?: "active" | "error" | "disconnected";
          error?: string | null;
          last_synced_at?: string | null;
          updated_at?: string;
        };
      };
      usage_records: {
        Row: {
          id: string;
          organization_id: string;
          type: "ai_credits" | "content" | "keywords" | "api_calls";
          quantity: number;
          unit_cost: number;
          total_cost: number;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          type: "ai_credits" | "content" | "keywords" | "api_calls";
          quantity: number;
          unit_cost?: number;
          total_cost?: number;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: never;
      };
      analytics_data: {
        Row: {
          id: string;
          site_id: string;
          date: string;
          source: "gsc" | "ga4";
          metrics: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          site_id: string;
          date: string;
          source: "gsc" | "ga4";
          metrics: Json;
          created_at?: string;
        };
        Update: {
          metrics?: Json;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}

// Utility types
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type Insertable<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type Updatable<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

