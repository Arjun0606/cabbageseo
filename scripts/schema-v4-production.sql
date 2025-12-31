-- ============================================
-- CabbageSEO PRODUCTION Database Schema V4
-- Complete, production-ready schema
-- 
-- Features:
-- - GEO (Generative Engine Optimization) tracking
-- - AI content generation with image support
-- - Keyword research & clustering
-- - Technical SEO audits
-- - CMS integrations (WordPress, Webflow, Shopify, etc.)
-- - Dodo Payments billing
-- - Usage limits & overage system
--
-- Copy and paste this entire script into Supabase SQL Editor
-- ============================================

-- ============================================
-- PART 1: DROP EXISTING OBJECTS (Clean Slate)
-- ============================================

-- Drop existing tables (in correct order due to foreign keys)
DROP TABLE IF EXISTS "overage_charges" CASCADE;
DROP TABLE IF EXISTS "invoices" CASCADE;
DROP TABLE IF EXISTS "credit_transactions" CASCADE;
DROP TABLE IF EXISTS "notifications" CASCADE;
DROP TABLE IF EXISTS "aio_analyses" CASCADE;
DROP TABLE IF EXISTS "ai_citations" CASCADE;
DROP TABLE IF EXISTS "entities" CASCADE;
DROP TABLE IF EXISTS "content_ideas" CASCADE;
DROP TABLE IF EXISTS "usage" CASCADE;
DROP TABLE IF EXISTS "credit_balance" CASCADE;
DROP TABLE IF EXISTS "audits" CASCADE;
DROP TABLE IF EXISTS "usage_events" CASCADE;
DROP TABLE IF EXISTS "usage_records" CASCADE;
DROP TABLE IF EXISTS "rankings" CASCADE;
DROP TABLE IF EXISTS "tasks" CASCADE;
DROP TABLE IF EXISTS "issues" CASCADE;
DROP TABLE IF EXISTS "pages" CASCADE;
DROP TABLE IF EXISTS "content" CASCADE;
DROP TABLE IF EXISTS "keywords" CASCADE;
DROP TABLE IF EXISTS "keyword_clusters" CASCADE;
DROP TABLE IF EXISTS "sites" CASCADE;
DROP TABLE IF EXISTS "sessions" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;
DROP TABLE IF EXISTS "organizations" CASCADE;
DROP TABLE IF EXISTS "integrations" CASCADE;

-- Drop existing types
DROP TYPE IF EXISTS "public"."billing_interval" CASCADE;
DROP TYPE IF EXISTS "public"."cms_type" CASCADE;
DROP TYPE IF EXISTS "public"."content_status" CASCADE;
DROP TYPE IF EXISTS "public"."issue_severity" CASCADE;
DROP TYPE IF EXISTS "public"."issue_type" CASCADE;
DROP TYPE IF EXISTS "public"."keyword_status" CASCADE;
DROP TYPE IF EXISTS "public"."plan" CASCADE;
DROP TYPE IF EXISTS "public"."role" CASCADE;
DROP TYPE IF EXISTS "public"."subscription_status" CASCADE;
DROP TYPE IF EXISTS "public"."task_status" CASCADE;
DROP TYPE IF EXISTS "public"."task_type" CASCADE;
DROP TYPE IF EXISTS "public"."integration_status" CASCADE;
DROP TYPE IF EXISTS "public"."notification_type" CASCADE;
DROP TYPE IF EXISTS "public"."notification_category" CASCADE;
DROP TYPE IF EXISTS "public"."geo_platform" CASCADE;

-- Drop existing functions
DROP FUNCTION IF EXISTS update_integrations_timestamp() CASCADE;
DROP FUNCTION IF EXISTS update_site_geo_score() CASCADE;
DROP FUNCTION IF EXISTS update_site_aio_score() CASCADE;
DROP FUNCTION IF EXISTS increment_usage(uuid, text, text, integer) CASCADE;
DROP FUNCTION IF EXISTS get_unbilled_overages(uuid) CASCADE;
DROP FUNCTION IF EXISTS mark_overages_billed(uuid) CASCADE;
DROP FUNCTION IF EXISTS get_overage_summary(uuid, timestamp, timestamp) CASCADE;
DROP FUNCTION IF EXISTS update_updated_at() CASCADE;

-- ============================================
-- PART 2: ENUMS
-- ============================================

CREATE TYPE "public"."billing_interval" AS ENUM('monthly', 'yearly');

CREATE TYPE "public"."cms_type" AS ENUM(
  'wordpress', 'webflow', 'shopify', 'ghost', 
  'notion', 'hubspot', 'framer', 'webhooks', 'custom'
);

CREATE TYPE "public"."content_status" AS ENUM(
  'idea', 'researching', 'writing', 'draft', 
  'review', 'approved', 'scheduled', 'published', 'updating'
);

CREATE TYPE "public"."issue_severity" AS ENUM('critical', 'warning', 'info', 'passed');

CREATE TYPE "public"."issue_type" AS ENUM(
  -- Traditional SEO issues
  'missing_meta_title', 'missing_meta_description', 'duplicate_title', 
  'thin_content', 'broken_link', 'orphan_page', 'redirect_chain', 
  'slow_page', 'missing_h1', 'multiple_h1', 'missing_alt', 'missing_schema',
  -- GEO-specific issues
  'geo_low_entity_density', 'geo_poor_answer_structure', 'geo_missing_faq',
  'geo_missing_howto', 'geo_weak_quotability', 'geo_missing_definitions',
  'geo_no_expert_attribution', 'geo_ambiguous_context', 'geo_stale_content',
  'geo_missing_key_takeaways', 'geo_no_statistics', 'geo_poor_structure'
);

CREATE TYPE "public"."keyword_status" AS ENUM(
  'discovered', 'analyzed', 'clustered', 'queued', 'writing', 'published'
);

CREATE TYPE "public"."plan" AS ENUM('free', 'starter', 'pro', 'pro_plus');

CREATE TYPE "public"."role" AS ENUM('owner', 'admin', 'editor', 'viewer');

CREATE TYPE "public"."subscription_status" AS ENUM(
  'active', 'canceled', 'past_due', 'trialing', 'paused', 'incomplete'
);

CREATE TYPE "public"."task_status" AS ENUM(
  'pending', 'queued', 'running', 'completed', 'failed', 'canceled'
);

CREATE TYPE "public"."task_type" AS ENUM(
  'research', 'cluster', 'write', 'optimize', 'publish', 
  'crawl', 'audit', 'refresh', 'link', 'geo_analyze'
);

CREATE TYPE "public"."integration_status" AS ENUM('active', 'error', 'disconnected', 'pending');

CREATE TYPE "public"."notification_type" AS ENUM('info', 'success', 'warning', 'error');

CREATE TYPE "public"."notification_category" AS ENUM(
  'audit', 'content', 'keyword', 'ranking', 'billing', 'system', 'geo'
);

CREATE TYPE "public"."geo_platform" AS ENUM(
  'google_ai', 'chatgpt', 'perplexity', 'claude', 'gemini'
);

-- ============================================
-- PART 3: CORE TABLES
-- ============================================

-- Organizations (Companies/Teams)
CREATE TABLE "organizations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "slug" text NOT NULL,
  -- Dodo Payments Integration
  "dodo_customer_id" text,
  "dodo_subscription_id" text,
  "dodo_product_id" text,
  -- Plan & Billing
  "plan" "plan" DEFAULT 'free' NOT NULL,
  "billing_interval" "billing_interval" DEFAULT 'monthly',
  "subscription_status" "subscription_status" DEFAULT 'incomplete',
  "trial_ends_at" timestamp,
  "current_period_start" timestamp,
  "current_period_end" timestamp,
  "cancel_at_period_end" boolean DEFAULT false,
  -- Features
  "autopilot_enabled" boolean DEFAULT false,
  "settings" jsonb DEFAULT '{}'::jsonb,
  "brand_voice" text,
  -- Overage settings (pay-as-you-go with spending cap)
  "overage_settings" jsonb DEFAULT '{
    "enabled": false,
    "spendingCapCents": 0,
    "currentSpendCents": 0,
    "autoIncreaseEnabled": false,
    "autoIncreaseAmountCents": 5000,
    "notifyAt": [50, 80, 100],
    "lastNotifiedAt": null
  }'::jsonb,
  -- Timestamps
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);

-- Users
CREATE TABLE "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "email" text NOT NULL,
  "password_hash" text,
  "email_verified" boolean DEFAULT false,
  "name" text,
  "avatar_url" text,
  "role" "role" DEFAULT 'editor' NOT NULL,
  "google_id" text,
  "last_login_at" timestamp,
  "last_active_at" timestamp,
  "notification_preferences" jsonb DEFAULT '{
    "email_weekly_report": true,
    "email_content_ready": true,
    "email_audit_complete": true,
    "email_geo_alerts": true,
    "browser_notifications": true
  }'::jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "users_email_unique" UNIQUE("email")
);

-- Sessions (for auth)
CREATE TABLE "sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "token" text NOT NULL,
  "user_agent" text,
  "ip_address" text,
  "expires_at" timestamp NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "sessions_token_unique" UNIQUE("token")
);

-- Integrations (CMS, Analytics, etc.)
CREATE TABLE "integrations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "site_id" uuid,
  "type" text NOT NULL, -- wordpress, webflow, shopify, gsc, ga4, etc.
  "name" text,
  "credentials" text, -- Encrypted credentials (JSON string)
  "settings" jsonb DEFAULT '{}'::jsonb,
  "status" text DEFAULT 'pending',
  "error_message" text,
  "last_sync_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "integrations_org_type_site_unique" UNIQUE("organization_id", "type", "site_id")
);

-- Credit Balance (for prepaid credits if ever needed)
CREATE TABLE "credit_balance" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL UNIQUE,
  "prepaid_credits" integer DEFAULT 0 NOT NULL,
  "bonus_credits" integer DEFAULT 0 NOT NULL,
  "expires_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Usage Tracking (Monthly)
CREATE TABLE "usage" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "period" text NOT NULL, -- Format: YYYY-MM (e.g., 2025-01)
  -- Usage counts
  "articles_generated" integer DEFAULT 0,
  "keywords_analyzed" integer DEFAULT 0,
  "serp_calls" integer DEFAULT 0,
  "pages_crawled" integer DEFAULT 0,
  "aio_analyses" integer DEFAULT 0, -- GEO analyses (kept as aio for backwards compatibility)
  "audits_run" integer DEFAULT 0,
  "ai_credits_used" integer DEFAULT 0,
  "backlink_checks" integer DEFAULT 0,
  "images_generated" integer DEFAULT 0,
  -- Limits (cached from plan)
  "articles_limit" integer DEFAULT 0,
  "keywords_limit" integer DEFAULT 0,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  UNIQUE("organization_id", "period")
);

-- Notifications
CREATE TABLE "notifications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "organization_id" uuid NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "type" "notification_type" DEFAULT 'info' NOT NULL,
  "category" "notification_category" DEFAULT 'system' NOT NULL,
  "read_at" timestamp,
  "action_url" text,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Overage Charges (pay-as-you-go tracking)
CREATE TABLE "overage_charges" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "resource_type" text NOT NULL, -- articles, keywords, audits, geo_analyses, etc.
  "amount" integer NOT NULL, -- Number of units used
  "cost_cents" integer NOT NULL, -- What we charge them
  "our_cost_cents" integer, -- Our actual cost (for margin tracking)
  "description" text,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "billed" boolean DEFAULT false,
  "billed_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Invoices (payment history)
CREATE TABLE "invoices" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "external_id" text NOT NULL UNIQUE, -- Dodo payment/invoice ID
  "amount" numeric(10, 2) NOT NULL,
  "currency" text DEFAULT 'USD',
  "status" text NOT NULL, -- paid, pending, failed, refunded
  "paid_at" timestamp,
  "invoice_url" text,
  "pdf_url" text,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Credit Transactions (for credit purchases and usage)
CREATE TABLE "credit_transactions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "type" text NOT NULL, -- purchase, bonus, usage, refund
  "credits" integer NOT NULL, -- Positive for add, negative for usage
  "amount" numeric(10, 2), -- Dollar amount (for purchases)
  "payment_id" text, -- Dodo payment ID
  "description" text,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- ============================================
-- PART 4: SITE & CONTENT TABLES
-- ============================================

-- Sites (Websites being managed)
CREATE TABLE "sites" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "domain" text NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "industry" text, -- For context-aware content generation
  -- CMS Connection
  "cms_type" "cms_type",
  "cms_url" text,
  "cms_credentials" jsonb,
  "cms_connected" boolean DEFAULT false,
  "cms_last_sync" timestamp,
  -- Google Search Console
  "gsc_connected" boolean DEFAULT false,
  "gsc_property_url" text,
  "gsc_credentials" jsonb,
  "gsc_last_sync" timestamp,
  -- Crawl Status
  "last_crawl_at" timestamp,
  "last_crawl_pages_count" integer,
  -- Scores
  "seo_score" integer,
  "geo_score" integer, -- Overall GEO score
  -- Settings
  "settings" jsonb DEFAULT '{}'::jsonb,
  "brand_voice" text,
  "target_audience" text,
  "main_topics" jsonb DEFAULT '[]'::jsonb,
  -- Autopilot
  "autopilot_enabled" boolean DEFAULT false,
  "autopilot_settings" jsonb DEFAULT '{
    "articles_per_week": 1,
    "auto_publish": false,
    "content_type": "blog",
    "optimization_mode": "balanced"
  }'::jsonb,
  -- GEO Settings (formerly AIO)
  "geo_enabled" boolean DEFAULT true,
  "geo_score_avg" integer,
  "geo_last_analyzed" timestamp,
  -- Status
  "is_active" boolean DEFAULT true,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Keyword Clusters (Groups of related keywords)
CREATE TABLE "keyword_clusters" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "site_id" uuid NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "pillar_keyword" text,
  "total_volume" integer DEFAULT 0,
  "avg_difficulty" numeric(5, 2),
  "keyword_count" integer DEFAULT 0,
  "suggested_articles" integer,
  "published_articles" integer DEFAULT 0,
  "content_status" text DEFAULT 'none', -- none, draft, published
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Keywords
CREATE TABLE "keywords" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "site_id" uuid NOT NULL,
  "cluster_id" uuid,
  "keyword" text NOT NULL,
  "volume" integer,
  "difficulty" integer,
  "cpc" numeric(10, 2),
  "intent" text, -- informational, commercial, transactional, navigational
  "category" text,
  "serp_features" jsonb DEFAULT '[]'::jsonb,
  "serp_last_fetched" timestamp,
  -- Ranking data
  "current_position" numeric(5, 2),
  "previous_position" numeric(5, 2),
  "impressions" integer,
  "clicks" integer,
  "ctr" numeric(5, 4),
  "ranking_url" text,
  "ranking_last_updated" timestamp,
  -- Status
  "status" "keyword_status" DEFAULT 'discovered',
  "priority" integer DEFAULT 50,
  "content_id" uuid,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  UNIQUE("site_id", "keyword")
);

-- Content (Articles, Pages generated)
CREATE TABLE "content" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "site_id" uuid NOT NULL,
  "keyword_id" uuid,
  "cluster_id" uuid,
  -- Content
  "title" text NOT NULL,
  "slug" text,
  "target_keyword" text,
  "meta_title" text,
  "meta_description" text,
  "body" text,
  "body_format" text DEFAULT 'html', -- html, markdown
  "excerpt" text,
  "outline" jsonb,
  "table_of_contents" jsonb,
  -- Schema Markup
  "schema_markup" jsonb,
  "has_faq_schema" boolean DEFAULT false,
  "has_how_to_schema" boolean DEFAULT false,
  "has_article_schema" boolean DEFAULT false,
  -- Internal Linking
  "internal_links" jsonb DEFAULT '[]'::jsonb,
  "suggested_internal_links" jsonb DEFAULT '[]'::jsonb,
  -- Metrics
  "word_count" integer,
  "reading_time" integer,
  "seo_score" integer,
  "readability_score" integer,
  "keyword_density" numeric(5, 4),
  -- Images
  "featured_image" text, -- URL to AI-generated image
  "featured_image_alt" text,
  "images" jsonb DEFAULT '[]'::jsonb,
  -- Status
  "status" "content_status" DEFAULT 'idea',
  "assigned_to" uuid,
  "published_url" text,
  "published_at" timestamp,
  "publisher" text, -- wordpress, webflow, etc.
  "external_id" text, -- CMS post ID
  "scheduled_for" timestamp,
  "version" integer DEFAULT 1,
  "last_edited_by" uuid,
  -- GEO Optimization
  "geo_optimized" boolean DEFAULT false,
  "geo_score" integer,
  "entity_count" integer DEFAULT 0,
  "quotability_score" integer,
  "answer_structure_score" integer,
  -- AI Metadata (internal only, not shown to users)
  "ai_model" text,
  "ai_prompt_version" text,
  "ai_tokens_used" integer,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Content Ideas (Suggestions for future content)
CREATE TABLE "content_ideas" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "site_id" uuid NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "target_keyword" text,
  "search_volume" integer,
  "difficulty" integer,
  "type" text, -- blog, guide, listicle, comparison
  "priority" text DEFAULT 'medium',
  "status" text DEFAULT 'idea', -- idea, approved, rejected, converted
  "content_id" uuid, -- If converted to content
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Pages (Crawled pages from site)
CREATE TABLE "pages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "site_id" uuid NOT NULL,
  "url" text NOT NULL,
  "path" text NOT NULL,
  "title" text,
  "meta_description" text,
  "h1" text,
  "headings" jsonb, -- {h1: [], h2: [], h3: []}
  "word_count" integer,
  -- Links
  "internal_links_out" jsonb DEFAULT '[]'::jsonb,
  "internal_links_in" integer DEFAULT 0,
  "external_links" jsonb DEFAULT '[]'::jsonb,
  -- Technical
  "status_code" integer,
  "canonical_url" text,
  "robots_directive" text,
  "schema_types" jsonb DEFAULT '[]'::jsonb,
  -- Performance
  "performance_score" integer,
  "lcp_ms" integer,
  "cls" numeric(5, 4),
  -- Indexing
  "is_indexed" boolean,
  "indexed_at" timestamp,
  -- Content link
  "content_type" text, -- page, blog, product, etc.
  "content_id" uuid,
  -- GEO Scores (per platform)
  "geo_score" integer, -- Combined score
  "geo_google_score" integer,
  "geo_chatgpt_score" integer,
  "geo_perplexity_score" integer,
  "geo_claude_score" integer,
  "geo_gemini_score" integer,
  "geo_last_analyzed" timestamp,
  -- GEO Metrics
  "entity_count" integer DEFAULT 0,
  "quotability_score" integer,
  "answer_structure_score" integer,
  "has_expert_attribution" boolean DEFAULT false,
  -- Crawl
  "last_crawled_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  UNIQUE("site_id", "url")
);

-- Audits (SEO/GEO audit runs)
CREATE TABLE "audits" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "site_id" uuid NOT NULL,
  "type" text NOT NULL DEFAULT 'full', -- full, quick, geo_only
  -- Scores
  "overall_score" integer,
  "technical_score" integer,
  "content_score" integer,
  "geo_score" integer,
  -- Counts
  "pages_scanned" integer DEFAULT 0,
  "issues_found" integer DEFAULT 0,
  "critical_issues" integer DEFAULT 0,
  "warning_issues" integer DEFAULT 0,
  "info_issues" integer DEFAULT 0,
  "passed_checks" integer DEFAULT 0,
  -- Status
  "duration_ms" integer,
  "status" text DEFAULT 'completed', -- running, completed, failed
  "error" text,
  "results" jsonb DEFAULT '{}'::jsonb,
  -- Timestamps
  "started_at" timestamp,
  "completed_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Issues (SEO/GEO problems found)
CREATE TABLE "issues" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "site_id" uuid NOT NULL,
  "page_id" uuid,
  "audit_id" uuid,
  "type" "issue_type" NOT NULL,
  "severity" "issue_severity" NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "recommendation" text,
  "affected_url" text,
  "affected_element" text,
  "current_value" text,
  "suggested_value" text,
  -- Resolution
  "status" text DEFAULT 'open', -- open, in_progress, resolved, ignored
  "is_resolved" boolean DEFAULT false,
  "resolved_at" timestamp,
  "resolved_by" uuid,
  -- Auto-fix
  "auto_fixable" boolean DEFAULT false,
  "can_auto_fix" boolean DEFAULT false,
  "auto_fix_applied" boolean DEFAULT false,
  "fixed_at" timestamp,
  -- Timestamps
  "detected_at" timestamp DEFAULT now() NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Tasks (Background jobs)
CREATE TABLE "tasks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "site_id" uuid NOT NULL,
  "organization_id" uuid NOT NULL,
  "type" "task_type" NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "target_id" uuid,
  "target_type" text,
  "status" "task_status" DEFAULT 'pending',
  "priority" integer DEFAULT 50,
  "scheduled_for" timestamp,
  "started_at" timestamp,
  "completed_at" timestamp,
  "result" jsonb,
  "error" text,
  "attempts" integer DEFAULT 0,
  "max_attempts" integer DEFAULT 3,
  "last_attempt_at" timestamp,
  "triggered_by" text,
  "triggered_by_user_id" uuid,
  "is_autopilot" boolean DEFAULT false,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Rankings (Historical ranking data)
CREATE TABLE "rankings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "site_id" uuid NOT NULL,
  "keyword_id" uuid,
  "content_id" uuid,
  "keyword" text NOT NULL,
  "url" text NOT NULL,
  "position" numeric(5, 2),
  "impressions" integer,
  "clicks" integer,
  "ctr" numeric(5, 4),
  "date" timestamp NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- ============================================
-- PART 5: GEO (Generative Engine Optimization) TABLES
-- ============================================

-- Entities (Named entities extracted from content)
CREATE TABLE "entities" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "site_id" uuid NOT NULL,
  "page_id" uuid,
  "content_id" uuid,
  "name" text NOT NULL,
  "type" text, -- person, organization, location, concept, etc.
  "description" text,
  "wikidata_id" text,
  "wikipedia_url" text,
  "mentions" integer DEFAULT 1,
  "context_quality" integer, -- 1-100 score
  "first_seen_at" timestamp DEFAULT now(),
  "last_seen_at" timestamp DEFAULT now(),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- AI Citations (When AI platforms cite our content)
CREATE TABLE "ai_citations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "site_id" uuid NOT NULL,
  "page_id" uuid,
  "platform" text NOT NULL, -- google_ai, chatgpt, perplexity, claude, gemini
  "query" text NOT NULL, -- The query that triggered the citation
  "citation_type" text, -- direct, paraphrase, reference
  "snippet" text, -- The cited text
  "position" integer, -- Position in response (if applicable)
  "confidence" decimal(3, 2) DEFAULT 0.80,
  "discovered_at" timestamp DEFAULT now(),
  "last_verified_at" timestamp,
  "is_active" boolean DEFAULT true,
  "created_at" timestamp DEFAULT now() NOT NULL,
  UNIQUE("site_id", "platform", "query", "page_id")
);

-- GEO Analyses (Detailed GEO analysis results)
CREATE TABLE "aio_analyses" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "site_id" uuid NOT NULL,
  "page_id" uuid NOT NULL,
  "version" integer DEFAULT 1,
  -- Platform-specific scores
  "google_aio_score" integer,
  "chatgpt_score" integer,
  "perplexity_score" integer,
  "claude_score" integer,
  "gemini_score" integer,
  "combined_score" integer,
  -- Component scores
  "entity_density_score" integer,
  "quotability_score" integer,
  "answer_structure_score" integer,
  "schema_presence_score" integer,
  "freshness_score" integer,
  "authority_score" integer,
  -- Detailed findings
  "entities_found" jsonb DEFAULT '[]'::jsonb,
  "quotable_snippets" jsonb DEFAULT '[]'::jsonb,
  "missing_elements" jsonb DEFAULT '[]'::jsonb,
  "improvement_suggestions" jsonb DEFAULT '[]'::jsonb,
  -- Platform-specific recommendations
  "google_recommendations" jsonb DEFAULT '[]'::jsonb,
  "chatgpt_recommendations" jsonb DEFAULT '[]'::jsonb,
  "perplexity_recommendations" jsonb DEFAULT '[]'::jsonb,
  -- Meta (internal)
  "model_used" text,
  "tokens_used" integer,
  "analysis_duration_ms" integer,
  "analyzed_at" timestamp DEFAULT now(),
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- ============================================
-- PART 6: LEGACY USAGE TABLES (for backwards compatibility)
-- ============================================

CREATE TABLE "usage_records" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "period_start" timestamp NOT NULL,
  "period_end" timestamp NOT NULL,
  "articles_generated" integer DEFAULT 0 NOT NULL,
  "keywords_analyzed" integer DEFAULT 0 NOT NULL,
  "serp_calls" integer DEFAULT 0 NOT NULL,
  "pages_crawled" integer DEFAULT 0 NOT NULL,
  "optimizations" integer DEFAULT 0 NOT NULL,
  "articles_limit" integer NOT NULL,
  "keywords_limit" integer NOT NULL,
  "serp_calls_limit" integer NOT NULL,
  "crawl_pages_limit" integer NOT NULL,
  "on_demand_enabled" boolean DEFAULT true,
  "on_demand_spend_limit_cents" integer DEFAULT 30000,
  "on_demand_spent_cents" integer DEFAULT 0,
  "overages_calculated" boolean DEFAULT false,
  "overages_amount_cents" integer DEFAULT 0,
  "overages_invoice_id" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "usage_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "usage_record_id" uuid NOT NULL,
  "event_type" text NOT NULL,
  "quantity" integer DEFAULT 1 NOT NULL,
  "internal_cost_cents" integer NOT NULL,
  "is_overage" boolean DEFAULT false,
  "resource_id" uuid,
  "resource_type" text,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- ============================================
-- PART 7: FOREIGN KEYS
-- ============================================

-- Users & Auth
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_fk" 
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fk" 
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

-- Integrations & Billing
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_organization_id_fk" 
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;
ALTER TABLE "credit_balance" ADD CONSTRAINT "credit_balance_organization_id_fk" 
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;
ALTER TABLE "usage" ADD CONSTRAINT "usage_organization_id_fk" 
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fk" 
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_organization_id_fk" 
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;
ALTER TABLE "overage_charges" ADD CONSTRAINT "overage_charges_organization_id_fk" 
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_organization_id_fk" 
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_organization_id_fk" 
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;

-- Sites & Content
ALTER TABLE "sites" ADD CONSTRAINT "sites_organization_id_fk" 
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;
ALTER TABLE "keyword_clusters" ADD CONSTRAINT "keyword_clusters_site_id_fk" 
  FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE;
ALTER TABLE "keywords" ADD CONSTRAINT "keywords_site_id_fk" 
  FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE;
ALTER TABLE "keywords" ADD CONSTRAINT "keywords_cluster_id_fk" 
  FOREIGN KEY ("cluster_id") REFERENCES "keyword_clusters"("id") ON DELETE SET NULL;
ALTER TABLE "content" ADD CONSTRAINT "content_site_id_fk" 
  FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE;
ALTER TABLE "content" ADD CONSTRAINT "content_keyword_id_fk" 
  FOREIGN KEY ("keyword_id") REFERENCES "keywords"("id") ON DELETE SET NULL;
ALTER TABLE "content" ADD CONSTRAINT "content_cluster_id_fk" 
  FOREIGN KEY ("cluster_id") REFERENCES "keyword_clusters"("id") ON DELETE SET NULL;
ALTER TABLE "content" ADD CONSTRAINT "content_assigned_to_fk" 
  FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL;
ALTER TABLE "content" ADD CONSTRAINT "content_last_edited_by_fk" 
  FOREIGN KEY ("last_edited_by") REFERENCES "users"("id") ON DELETE SET NULL;
ALTER TABLE "content_ideas" ADD CONSTRAINT "content_ideas_site_id_fk" 
  FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE;
ALTER TABLE "pages" ADD CONSTRAINT "pages_site_id_fk" 
  FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE;
ALTER TABLE "pages" ADD CONSTRAINT "pages_content_id_fk" 
  FOREIGN KEY ("content_id") REFERENCES "content"("id") ON DELETE SET NULL;

-- Audits & Issues
ALTER TABLE "audits" ADD CONSTRAINT "audits_site_id_fk" 
  FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE;
ALTER TABLE "issues" ADD CONSTRAINT "issues_site_id_fk" 
  FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE;
ALTER TABLE "issues" ADD CONSTRAINT "issues_page_id_fk" 
  FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE CASCADE;
ALTER TABLE "issues" ADD CONSTRAINT "issues_resolved_by_fk" 
  FOREIGN KEY ("resolved_by") REFERENCES "users"("id") ON DELETE SET NULL;

-- Tasks & Rankings
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_site_id_fk" 
  FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_organization_id_fk" 
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_triggered_by_user_id_fk" 
  FOREIGN KEY ("triggered_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL;
ALTER TABLE "rankings" ADD CONSTRAINT "rankings_site_id_fk" 
  FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE;
ALTER TABLE "rankings" ADD CONSTRAINT "rankings_keyword_id_fk" 
  FOREIGN KEY ("keyword_id") REFERENCES "keywords"("id") ON DELETE CASCADE;
ALTER TABLE "rankings" ADD CONSTRAINT "rankings_content_id_fk" 
  FOREIGN KEY ("content_id") REFERENCES "content"("id") ON DELETE SET NULL;

-- GEO Tables
ALTER TABLE "entities" ADD CONSTRAINT "entities_site_id_fk" 
  FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE;
ALTER TABLE "entities" ADD CONSTRAINT "entities_page_id_fk" 
  FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE CASCADE;
ALTER TABLE "entities" ADD CONSTRAINT "entities_content_id_fk" 
  FOREIGN KEY ("content_id") REFERENCES "content"("id") ON DELETE CASCADE;
ALTER TABLE "ai_citations" ADD CONSTRAINT "ai_citations_site_id_fk" 
  FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE;
ALTER TABLE "ai_citations" ADD CONSTRAINT "ai_citations_page_id_fk" 
  FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE CASCADE;
ALTER TABLE "aio_analyses" ADD CONSTRAINT "aio_analyses_site_id_fk" 
  FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE;
ALTER TABLE "aio_analyses" ADD CONSTRAINT "aio_analyses_page_id_fk" 
  FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE CASCADE;

-- Legacy Usage
ALTER TABLE "usage_records" ADD CONSTRAINT "usage_records_organization_id_fk" 
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;
ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_organization_id_fk" 
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;
ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_usage_record_id_fk" 
  FOREIGN KEY ("usage_record_id") REFERENCES "usage_records"("id") ON DELETE CASCADE;

-- ============================================
-- PART 8: INDEXES FOR PERFORMANCE
-- ============================================

-- Organizations & Users
CREATE UNIQUE INDEX "org_slug_idx" ON "organizations"("slug");
CREATE INDEX "org_dodo_customer_idx" ON "organizations"("dodo_customer_id") WHERE dodo_customer_id IS NOT NULL;
CREATE INDEX "org_plan_idx" ON "organizations"("plan");
CREATE INDEX "org_status_idx" ON "organizations"("subscription_status");
CREATE UNIQUE INDEX "user_email_idx" ON "users"("email");
CREATE INDEX "user_org_idx" ON "users"("organization_id");
CREATE INDEX "user_google_id_idx" ON "users"("google_id") WHERE google_id IS NOT NULL;
CREATE UNIQUE INDEX "session_token_idx" ON "sessions"("token");
CREATE INDEX "session_user_idx" ON "sessions"("user_id");
CREATE INDEX "session_expires_idx" ON "sessions"("expires_at");

-- Integrations
CREATE INDEX "integrations_org_idx" ON "integrations"("organization_id");
CREATE INDEX "integrations_site_idx" ON "integrations"("site_id") WHERE site_id IS NOT NULL;
CREATE INDEX "integrations_type_idx" ON "integrations"("type");
CREATE INDEX "integrations_status_idx" ON "integrations"("status");

-- Usage & Billing
CREATE INDEX "usage_org_idx" ON "usage"("organization_id");
CREATE INDEX "usage_period_idx" ON "usage"("period");
CREATE INDEX "usage_org_period_idx" ON "usage"("organization_id", "period");
CREATE INDEX "notifications_user_idx" ON "notifications"("user_id");
CREATE INDEX "notifications_org_idx" ON "notifications"("organization_id");
CREATE INDEX "notifications_read_idx" ON "notifications"("read_at") WHERE read_at IS NULL;
CREATE INDEX "notifications_created_idx" ON "notifications"("created_at" DESC);
CREATE INDEX "overage_charges_org_idx" ON "overage_charges"("organization_id");
CREATE INDEX "overage_charges_unbilled_idx" ON "overage_charges"("organization_id", "billed") WHERE billed = false;
CREATE INDEX "invoices_org_idx" ON "invoices"("organization_id");
CREATE INDEX "invoices_external_idx" ON "invoices"("external_id");

-- Sites
CREATE INDEX "site_org_idx" ON "sites"("organization_id");
CREATE INDEX "site_domain_idx" ON "sites"("domain");
CREATE INDEX "site_active_idx" ON "sites"("is_active") WHERE is_active = true;

-- Keywords & Clusters
CREATE INDEX "cluster_site_idx" ON "keyword_clusters"("site_id");
CREATE INDEX "keyword_site_idx" ON "keywords"("site_id");
CREATE INDEX "keyword_cluster_idx" ON "keywords"("cluster_id") WHERE cluster_id IS NOT NULL;
CREATE INDEX "keyword_status_idx" ON "keywords"("status");
CREATE INDEX "keyword_volume_idx" ON "keywords"("volume" DESC NULLS LAST);
CREATE INDEX "keyword_difficulty_idx" ON "keywords"("difficulty");

-- Content
CREATE INDEX "content_site_idx" ON "content"("site_id");
CREATE INDEX "content_status_idx" ON "content"("status");
CREATE INDEX "content_published_idx" ON "content"("published_at" DESC NULLS LAST) WHERE status = 'published';
CREATE INDEX "content_geo_score_idx" ON "content"("geo_score" DESC NULLS LAST);

-- Pages
CREATE INDEX "page_site_idx" ON "pages"("site_id");
CREATE INDEX "page_url_idx" ON "pages"("url");
CREATE INDEX "page_geo_score_idx" ON "pages"("geo_score" DESC NULLS LAST);
CREATE INDEX "page_last_crawled_idx" ON "pages"("last_crawled_at" DESC NULLS LAST);

-- Audits & Issues
CREATE INDEX "audits_site_idx" ON "audits"("site_id");
CREATE INDEX "audits_created_idx" ON "audits"("created_at" DESC);
CREATE INDEX "issue_site_idx" ON "issues"("site_id");
CREATE INDEX "issue_severity_idx" ON "issues"("severity");
CREATE INDEX "issue_status_idx" ON "issues"("status");
CREATE INDEX "issue_open_idx" ON "issues"("site_id", "is_resolved") WHERE is_resolved = false;

-- Tasks
CREATE INDEX "task_site_idx" ON "tasks"("site_id");
CREATE INDEX "task_org_idx" ON "tasks"("organization_id");
CREATE INDEX "task_status_idx" ON "tasks"("status");
CREATE INDEX "task_scheduled_idx" ON "tasks"("scheduled_for") WHERE status = 'pending';
CREATE INDEX "task_pending_idx" ON "tasks"("status", "priority" DESC) WHERE status = 'pending';

-- Rankings
CREATE INDEX "ranking_site_date_idx" ON "rankings"("site_id", "date" DESC);
CREATE INDEX "ranking_keyword_idx" ON "rankings"("keyword_id");

-- GEO Tables
CREATE INDEX "entities_site_idx" ON "entities"("site_id");
CREATE INDEX "entities_page_idx" ON "entities"("page_id") WHERE page_id IS NOT NULL;
CREATE INDEX "entities_content_idx" ON "entities"("content_id") WHERE content_id IS NOT NULL;
CREATE INDEX "entities_type_idx" ON "entities"("type");
CREATE INDEX "ai_citations_site_idx" ON "ai_citations"("site_id");
CREATE INDEX "ai_citations_platform_idx" ON "ai_citations"("platform");
CREATE INDEX "ai_citations_active_idx" ON "ai_citations"("site_id", "is_active") WHERE is_active = true;
CREATE INDEX "aio_analyses_site_idx" ON "aio_analyses"("site_id");
CREATE INDEX "aio_analyses_page_idx" ON "aio_analyses"("page_id");
CREATE INDEX "aio_analyses_date_idx" ON "aio_analyses"("analyzed_at" DESC);

-- ============================================
-- PART 9: TRIGGERS & FUNCTIONS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_organizations_timestamp BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_users_timestamp BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_integrations_timestamp BEFORE UPDATE ON integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_credit_balance_timestamp BEFORE UPDATE ON credit_balance FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_usage_timestamp BEFORE UPDATE ON usage FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_sites_timestamp BEFORE UPDATE ON sites FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_keyword_clusters_timestamp BEFORE UPDATE ON keyword_clusters FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_keywords_timestamp BEFORE UPDATE ON keywords FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_content_timestamp BEFORE UPDATE ON content FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_content_ideas_timestamp BEFORE UPDATE ON content_ideas FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_pages_timestamp BEFORE UPDATE ON pages FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_tasks_timestamp BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_entities_timestamp BEFORE UPDATE ON entities FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Update site GEO score when pages are analyzed
CREATE OR REPLACE FUNCTION update_site_geo_score()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE sites 
  SET geo_score_avg = (
    SELECT ROUND(AVG(geo_score))
    FROM pages 
    WHERE site_id = NEW.site_id AND geo_score IS NOT NULL
  ),
  geo_last_analyzed = now(),
  updated_at = now()
  WHERE id = NEW.site_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_site_geo_score
  AFTER INSERT OR UPDATE OF geo_score ON pages
  FOR EACH ROW
  WHEN (NEW.geo_score IS NOT NULL)
  EXECUTE FUNCTION update_site_geo_score();

-- Increment usage helper function
CREATE OR REPLACE FUNCTION increment_usage(
  org_id uuid,
  period_str text,
  column_name text,
  increment_amount integer DEFAULT 1
)
RETURNS void AS $$
BEGIN
  INSERT INTO usage (organization_id, period)
  VALUES (org_id, period_str)
  ON CONFLICT (organization_id, period) DO NOTHING;
  
  EXECUTE format(
    'UPDATE usage SET %I = COALESCE(%I, 0) + $1, updated_at = now() WHERE organization_id = $2 AND period = $3',
    column_name, column_name
  ) USING increment_amount, org_id, period_str;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Overage helper functions
CREATE OR REPLACE FUNCTION get_unbilled_overages(org_id uuid)
RETURNS integer AS $$
  SELECT COALESCE(SUM(cost_cents), 0)::integer
  FROM overage_charges
  WHERE organization_id = org_id AND billed = false;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION mark_overages_billed(org_id uuid)
RETURNS void AS $$
  UPDATE overage_charges
  SET billed = true, billed_at = now()
  WHERE organization_id = org_id AND billed = false;
$$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION get_overage_summary(
  org_id uuid, 
  period_start timestamp, 
  period_end timestamp
)
RETURNS TABLE (
  resource_type text,
  total_amount integer,
  total_cost_cents integer,
  total_our_cost_cents integer,
  charge_count integer
) AS $$
  SELECT 
    resource_type,
    SUM(amount)::integer as total_amount,
    SUM(cost_cents)::integer as total_cost_cents,
    SUM(COALESCE(our_cost_cents, 0))::integer as total_our_cost_cents,
    COUNT(*)::integer as charge_count
  FROM overage_charges
  WHERE 
    organization_id = org_id 
    AND created_at >= period_start 
    AND created_at < period_end
  GROUP BY resource_type;
$$ LANGUAGE sql STABLE;

-- ============================================
-- PART 10: ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE overage_charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyword_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE aio_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;

-- Helper: Get user's organization
-- This is used in RLS policies to check organization membership

-- Organization policies
CREATE POLICY "Users can view own organization" ON organizations 
  FOR SELECT USING (id IN (SELECT organization_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Users can update own organization" ON organizations 
  FOR UPDATE USING (id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

-- User policies
CREATE POLICY "Users can view org members" ON users 
  FOR SELECT USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Users can update own profile" ON users 
  FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Users can insert own profile" ON users 
  FOR INSERT WITH CHECK (id = auth.uid());

-- Session policies
CREATE POLICY "Users can manage own sessions" ON sessions 
  FOR ALL USING (user_id = auth.uid());

-- Integration policies
CREATE POLICY "Users can view org integrations" ON integrations 
  FOR SELECT USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Users can manage org integrations" ON integrations 
  FOR ALL USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

-- Credit/Usage policies
CREATE POLICY "Users can view org credits" ON credit_balance 
  FOR SELECT USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Users can view org usage" ON usage 
  FOR SELECT USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

-- Notification policies
CREATE POLICY "Users can view own notifications" ON notifications 
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON notifications 
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own notifications" ON notifications 
  FOR DELETE USING (user_id = auth.uid());

-- Billing policies
CREATE POLICY "Users can view org overages" ON overage_charges 
  FOR SELECT USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Users can view org invoices" ON invoices 
  FOR SELECT USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Users can view org transactions" ON credit_transactions 
  FOR SELECT USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

-- Site policies (all site data follows org membership)
CREATE POLICY "Users can manage org sites" ON sites 
  FOR ALL USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Users can manage site clusters" ON keyword_clusters 
  FOR ALL USING (site_id IN (SELECT id FROM sites WHERE organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())));
CREATE POLICY "Users can manage site keywords" ON keywords 
  FOR ALL USING (site_id IN (SELECT id FROM sites WHERE organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())));
CREATE POLICY "Users can manage site content" ON content 
  FOR ALL USING (site_id IN (SELECT id FROM sites WHERE organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())));
CREATE POLICY "Users can manage site content ideas" ON content_ideas 
  FOR ALL USING (site_id IN (SELECT id FROM sites WHERE organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())));
CREATE POLICY "Users can manage site pages" ON pages 
  FOR ALL USING (site_id IN (SELECT id FROM sites WHERE organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())));
CREATE POLICY "Users can manage site audits" ON audits 
  FOR ALL USING (site_id IN (SELECT id FROM sites WHERE organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())));
CREATE POLICY "Users can manage site issues" ON issues 
  FOR ALL USING (site_id IN (SELECT id FROM sites WHERE organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())));
CREATE POLICY "Users can manage org tasks" ON tasks 
  FOR ALL USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Users can view site rankings" ON rankings 
  FOR SELECT USING (site_id IN (SELECT id FROM sites WHERE organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())));
CREATE POLICY "Users can manage site entities" ON entities 
  FOR ALL USING (site_id IN (SELECT id FROM sites WHERE organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())));
CREATE POLICY "Users can manage site citations" ON ai_citations 
  FOR ALL USING (site_id IN (SELECT id FROM sites WHERE organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())));
CREATE POLICY "Users can manage site analyses" ON aio_analyses 
  FOR ALL USING (site_id IN (SELECT id FROM sites WHERE organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())));

-- Legacy usage policies
CREATE POLICY "Users can view org usage records" ON usage_records 
  FOR SELECT USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Users can view org usage events" ON usage_events 
  FOR SELECT USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

-- Service role policies (full access for backend operations)
CREATE POLICY "Service role full access orgs" ON organizations FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access users" ON users FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access sessions" ON sessions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access integrations" ON integrations FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access credits" ON credit_balance FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access usage" ON usage FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access notifications" ON notifications FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access overages" ON overage_charges FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access invoices" ON invoices FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access transactions" ON credit_transactions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access sites" ON sites FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access clusters" ON keyword_clusters FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access keywords" ON keywords FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access content" ON content FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access ideas" ON content_ideas FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access pages" ON pages FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access audits" ON audits FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access issues" ON issues FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access tasks" ON tasks FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access rankings" ON rankings FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access entities" ON entities FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access citations" ON ai_citations FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access analyses" ON aio_analyses FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access usage_records" ON usage_records FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access usage_events" ON usage_events FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- PART 11: GRANTS
-- ============================================

GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- ============================================
-- PART 12: STORAGE BUCKETS
-- ============================================

-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('exports', 'exports', false, 52428800, ARRAY['text/html', 'text/markdown', 'text/plain', 'text/csv', 'application/json', 'application/pdf'])
ON CONFLICT (id) DO UPDATE SET 
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('uploads', 'uploads', false, 10485760, ARRAY['text/csv', 'text/plain', 'application/json', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
ON CONFLICT (id) DO UPDATE SET 
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('content-images', 'content-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'])
ON CONFLICT (id) DO UPDATE SET 
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('screenshots', 'screenshots', false, 2097152, ARRAY['image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET 
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('sitemaps', 'sitemaps', false, 10485760, ARRAY['application/xml', 'text/xml', 'text/plain'])
ON CONFLICT (id) DO UPDATE SET 
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================
-- PART 13: STORAGE POLICIES
-- ============================================

-- Drop existing storage policies
DROP POLICY IF EXISTS "Users can view own org exports" ON storage.objects;
DROP POLICY IF EXISTS "Users can create own org exports" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own org exports" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own org uploads" ON storage.objects;
DROP POLICY IF EXISTS "Users can create own org uploads" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own org uploads" ON storage.objects;
DROP POLICY IF EXISTS "Public can view content images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload content images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own content images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own org screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Service can create screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own org sitemaps" ON storage.objects;
DROP POLICY IF EXISTS "Service can create sitemaps" ON storage.objects;
DROP POLICY IF EXISTS "Service role full access exports" ON storage.objects;
DROP POLICY IF EXISTS "Service role full access uploads" ON storage.objects;
DROP POLICY IF EXISTS "Service role full access content-images" ON storage.objects;
DROP POLICY IF EXISTS "Service role full access screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Service role full access sitemaps" ON storage.objects;

-- Exports bucket policies
CREATE POLICY "Users can view own org exports" ON storage.objects 
  FOR SELECT USING (bucket_id = 'exports' AND (storage.foldername(name))[1] IN (SELECT organization_id::text FROM users WHERE id = auth.uid()));
CREATE POLICY "Users can create own org exports" ON storage.objects 
  FOR INSERT WITH CHECK (bucket_id = 'exports' AND (storage.foldername(name))[1] IN (SELECT organization_id::text FROM users WHERE id = auth.uid()));
CREATE POLICY "Users can delete own org exports" ON storage.objects 
  FOR DELETE USING (bucket_id = 'exports' AND (storage.foldername(name))[1] IN (SELECT organization_id::text FROM users WHERE id = auth.uid()));

-- Uploads bucket policies
CREATE POLICY "Users can view own org uploads" ON storage.objects 
  FOR SELECT USING (bucket_id = 'uploads' AND (storage.foldername(name))[1] IN (SELECT organization_id::text FROM users WHERE id = auth.uid()));
CREATE POLICY "Users can create own org uploads" ON storage.objects 
  FOR INSERT WITH CHECK (bucket_id = 'uploads' AND (storage.foldername(name))[1] IN (SELECT organization_id::text FROM users WHERE id = auth.uid()));
CREATE POLICY "Users can delete own org uploads" ON storage.objects 
  FOR DELETE USING (bucket_id = 'uploads' AND (storage.foldername(name))[1] IN (SELECT organization_id::text FROM users WHERE id = auth.uid()));

-- Content images bucket policies (public read, authenticated write)
CREATE POLICY "Public can view content images" ON storage.objects 
  FOR SELECT USING (bucket_id = 'content-images');
CREATE POLICY "Users can upload content images" ON storage.objects 
  FOR INSERT WITH CHECK (bucket_id = 'content-images' AND (storage.foldername(name))[1] IN (SELECT organization_id::text FROM users WHERE id = auth.uid()));
CREATE POLICY "Users can delete own content images" ON storage.objects 
  FOR DELETE USING (bucket_id = 'content-images' AND (storage.foldername(name))[1] IN (SELECT organization_id::text FROM users WHERE id = auth.uid()));

-- Screenshots bucket policies
CREATE POLICY "Users can view own org screenshots" ON storage.objects 
  FOR SELECT USING (bucket_id = 'screenshots' AND (storage.foldername(name))[1] IN (SELECT organization_id::text FROM users WHERE id = auth.uid()));
CREATE POLICY "Service can create screenshots" ON storage.objects 
  FOR INSERT WITH CHECK (bucket_id = 'screenshots');
CREATE POLICY "Users can delete own screenshots" ON storage.objects 
  FOR DELETE USING (bucket_id = 'screenshots' AND (storage.foldername(name))[1] IN (SELECT organization_id::text FROM users WHERE id = auth.uid()));

-- Sitemaps bucket policies
CREATE POLICY "Users can view own org sitemaps" ON storage.objects 
  FOR SELECT USING (bucket_id = 'sitemaps' AND (storage.foldername(name))[1] IN (SELECT organization_id::text FROM users WHERE id = auth.uid()));
CREATE POLICY "Service can create sitemaps" ON storage.objects 
  FOR INSERT WITH CHECK (bucket_id = 'sitemaps');

-- Service role full access to all buckets
CREATE POLICY "Service role full access exports" ON storage.objects 
  FOR ALL USING (bucket_id = 'exports' AND auth.role() = 'service_role');
CREATE POLICY "Service role full access uploads" ON storage.objects 
  FOR ALL USING (bucket_id = 'uploads' AND auth.role() = 'service_role');
CREATE POLICY "Service role full access content-images" ON storage.objects 
  FOR ALL USING (bucket_id = 'content-images' AND auth.role() = 'service_role');
CREATE POLICY "Service role full access screenshots" ON storage.objects 
  FOR ALL USING (bucket_id = 'screenshots' AND auth.role() = 'service_role');
CREATE POLICY "Service role full access sitemaps" ON storage.objects 
  FOR ALL USING (bucket_id = 'sitemaps' AND auth.role() = 'service_role');

-- ============================================
-- DONE! CabbageSEO Production Database V4 Ready
-- ============================================
-- 
-- Summary:
-- - 24 tables for complete functionality
-- - 5 storage buckets for file management
-- - Full RLS security for multi-tenant isolation
-- - Optimized indexes for performance
-- - Auto-updating timestamps
-- - GEO score auto-calculation
-- - Usage tracking and overage system
-- - Dodo Payments integration ready
--
-- Next steps:
-- 1. Run this in Supabase SQL Editor
-- 2. Go to cabbageseo.com/signup to create your account
-- 3. Add your first website and start optimizing!
--
-- ============================================

