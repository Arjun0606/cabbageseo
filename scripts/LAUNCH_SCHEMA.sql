-- ============================================
-- CabbageSEO LAUNCH SCHEMA - Production Ready
-- Run this ONCE to clean and set up for launch
-- ============================================

-- ============================================
-- STEP 1: CLEAN ALL DATA (including auth users)
-- ============================================
SET session_replication_role = 'replica';

DELETE FROM aio_analyses;
DELETE FROM ai_citations;
DELETE FROM entities;
DELETE FROM rankings;
DELETE FROM issues;
DELETE FROM audits;
DELETE FROM tasks;
DELETE FROM pages;
DELETE FROM content_ideas;
DELETE FROM content;
DELETE FROM keywords;
DELETE FROM keyword_clusters;
DELETE FROM sites;
DELETE FROM usage_events;
DELETE FROM usage_records;
DELETE FROM usage;
DELETE FROM overage_charges;
DELETE FROM invoices;
DELETE FROM credit_transactions;
DELETE FROM credit_balance;
DELETE FROM notifications;
DELETE FROM integrations;
DELETE FROM sessions;
DELETE FROM users;
DELETE FROM organizations;
DELETE FROM auth.users;

SET session_replication_role = 'origin';

-- ============================================
-- STEP 2: DROP & RECREATE TYPES (with updates)
-- ============================================

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

CREATE TYPE "public"."billing_interval" AS ENUM('monthly', 'yearly');
CREATE TYPE "public"."cms_type" AS ENUM('wordpress', 'webflow', 'shopify', 'ghost', 'notion', 'hubspot', 'framer', 'webhooks', 'custom');
CREATE TYPE "public"."content_status" AS ENUM('idea', 'researching', 'writing', 'draft', 'review', 'approved', 'scheduled', 'published', 'updating');
CREATE TYPE "public"."issue_severity" AS ENUM('critical', 'warning', 'info', 'passed');
CREATE TYPE "public"."issue_type" AS ENUM(
  'missing_meta_title', 'missing_meta_description', 'duplicate_title', 'thin_content', 
  'broken_link', 'orphan_page', 'redirect_chain', 'slow_page', 'missing_h1', 
  'multiple_h1', 'missing_alt', 'missing_schema',
  'geo_low_entity_density', 'geo_poor_answer_structure', 'geo_missing_faq',
  'geo_missing_howto', 'geo_weak_quotability', 'geo_missing_definitions',
  'geo_no_expert_attribution', 'geo_ambiguous_context', 'geo_stale_content',
  'geo_missing_key_takeaways', 'geo_no_statistics', 'geo_poor_structure'
);
CREATE TYPE "public"."keyword_status" AS ENUM('discovered', 'analyzed', 'clustered', 'queued', 'writing', 'published');
CREATE TYPE "public"."plan" AS ENUM('free', 'starter', 'pro', 'pro_plus');
CREATE TYPE "public"."role" AS ENUM('owner', 'admin', 'editor', 'viewer');
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'canceled', 'past_due', 'trialing', 'paused', 'incomplete');
CREATE TYPE "public"."task_status" AS ENUM('pending', 'queued', 'running', 'completed', 'failed', 'canceled');
CREATE TYPE "public"."task_type" AS ENUM('research', 'cluster', 'write', 'optimize', 'publish', 'crawl', 'audit', 'refresh', 'link', 'geo_analyze');
CREATE TYPE "public"."integration_status" AS ENUM('active', 'error', 'disconnected', 'pending');
CREATE TYPE "public"."notification_type" AS ENUM('info', 'success', 'warning', 'error');
CREATE TYPE "public"."notification_category" AS ENUM('audit', 'content', 'keyword', 'ranking', 'billing', 'system', 'geo');

-- ============================================
-- STEP 3: DROP & RECREATE ALL TABLES
-- ============================================

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

-- Drop functions
DROP FUNCTION IF EXISTS update_integrations_timestamp() CASCADE;
DROP FUNCTION IF EXISTS update_site_aio_score() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at() CASCADE;
DROP FUNCTION IF EXISTS increment_usage(uuid, text, text, integer) CASCADE;
DROP FUNCTION IF EXISTS get_unbilled_overages(uuid) CASCADE;
DROP FUNCTION IF EXISTS mark_overages_billed(uuid) CASCADE;
DROP FUNCTION IF EXISTS get_overage_summary(uuid, timestamp, timestamp) CASCADE;

-- ============================================
-- ORGANIZATIONS (Dodo Payments ready)
-- ============================================
CREATE TABLE "organizations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "slug" text NOT NULL,
  "dodo_customer_id" text,
  "dodo_subscription_id" text,
  "dodo_product_id" text,
  "plan" "plan" DEFAULT 'free' NOT NULL,
  "billing_interval" "billing_interval" DEFAULT 'monthly',
  "subscription_status" "subscription_status" DEFAULT 'incomplete',
  "trial_ends_at" timestamp,
  "current_period_start" timestamp,
  "current_period_end" timestamp,
  "cancel_at_period_end" boolean DEFAULT false,
  "autopilot_enabled" boolean DEFAULT false,
  "settings" jsonb DEFAULT '{}'::jsonb,
  "brand_voice" text,
  "overage_settings" jsonb DEFAULT '{"enabled":false,"spendingCapCents":0,"currentSpendCents":0,"autoIncreaseEnabled":false,"autoIncreaseAmountCents":5000,"notifyAt":[50,80,100],"lastNotifiedAt":null}'::jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);

-- ============================================
-- USERS
-- ============================================
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
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "users_email_unique" UNIQUE("email")
);

-- ============================================
-- SESSIONS
-- ============================================
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

-- ============================================
-- INTEGRATIONS
-- ============================================
CREATE TABLE "integrations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "site_id" uuid,
  "type" text NOT NULL,
  "name" text,
  "credentials" text,
  "settings" jsonb DEFAULT '{}'::jsonb,
  "status" text DEFAULT 'pending',
  "error_message" text,
  "last_sync_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "integrations_org_type_site_unique" UNIQUE("organization_id", "type", "site_id")
);

-- ============================================
-- CREDIT BALANCE
-- ============================================
CREATE TABLE "credit_balance" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL UNIQUE,
  "prepaid_credits" integer DEFAULT 0 NOT NULL,
  "bonus_credits" integer DEFAULT 0 NOT NULL,
  "expires_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- ============================================
-- USAGE
-- ============================================
CREATE TABLE "usage" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "period" text NOT NULL,
  "articles_generated" integer DEFAULT 0,
  "keywords_analyzed" integer DEFAULT 0,
  "serp_calls" integer DEFAULT 0,
  "pages_crawled" integer DEFAULT 0,
  "aio_analyses" integer DEFAULT 0,
  "audits_run" integer DEFAULT 0,
  "ai_credits_used" integer DEFAULT 0,
  "backlink_checks" integer DEFAULT 0,
  "images_generated" integer DEFAULT 0,
  "articles_limit" integer DEFAULT 0,
  "keywords_limit" integer DEFAULT 0,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  UNIQUE("organization_id", "period")
);

-- ============================================
-- NOTIFICATIONS
-- ============================================
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

-- ============================================
-- OVERAGE CHARGES
-- ============================================
CREATE TABLE "overage_charges" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "resource_type" text NOT NULL,
  "amount" integer NOT NULL,
  "cost_cents" integer NOT NULL,
  "our_cost_cents" integer,
  "description" text,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "billed" boolean DEFAULT false,
  "billed_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- ============================================
-- INVOICES
-- ============================================
CREATE TABLE "invoices" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "external_id" text NOT NULL UNIQUE,
  "amount" numeric(10, 2) NOT NULL,
  "currency" text DEFAULT 'USD',
  "status" text NOT NULL,
  "paid_at" timestamp,
  "invoice_url" text,
  "pdf_url" text,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- ============================================
-- CREDIT TRANSACTIONS
-- ============================================
CREATE TABLE "credit_transactions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "type" text NOT NULL,
  "credits" integer NOT NULL,
  "amount" numeric(10, 2),
  "payment_id" text,
  "description" text,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- ============================================
-- SITES
-- ============================================
CREATE TABLE "sites" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "domain" text NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "industry" text,
  "cms_type" "cms_type",
  "cms_url" text,
  "cms_credentials" jsonb,
  "cms_connected" boolean DEFAULT false,
  "cms_last_sync" timestamp,
  "gsc_connected" boolean DEFAULT false,
  "gsc_property_url" text,
  "gsc_credentials" jsonb,
  "gsc_last_sync" timestamp,
  "last_crawl_at" timestamp,
  "last_crawl_pages_count" integer,
  "seo_score" integer,
  "geo_score" integer,
  "settings" jsonb DEFAULT '{}'::jsonb,
  "brand_voice" text,
  "target_audience" text,
  "main_topics" jsonb DEFAULT '[]'::jsonb,
  "autopilot_enabled" boolean DEFAULT false,
  "autopilot_settings" jsonb DEFAULT '{}'::jsonb,
  "geo_enabled" boolean DEFAULT true,
  "geo_score_avg" integer,
  "geo_last_analyzed" timestamp,
  "is_active" boolean DEFAULT true,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- ============================================
-- KEYWORD CLUSTERS
-- ============================================
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
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- ============================================
-- KEYWORDS
-- ============================================
CREATE TABLE "keywords" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "site_id" uuid NOT NULL,
  "cluster_id" uuid,
  "keyword" text NOT NULL,
  "volume" integer,
  "difficulty" integer,
  "cpc" numeric(10, 2),
  "intent" text,
  "category" text,
  "serp_features" jsonb DEFAULT '[]'::jsonb,
  "serp_last_fetched" timestamp,
  "current_position" numeric(5, 2),
  "previous_position" numeric(5, 2),
  "impressions" integer,
  "clicks" integer,
  "ctr" numeric(5, 4),
  "ranking_url" text,
  "ranking_last_updated" timestamp,
  "status" "keyword_status" DEFAULT 'discovered',
  "priority" integer DEFAULT 50,
  "content_id" uuid,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- ============================================
-- CONTENT
-- ============================================
CREATE TABLE "content" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "site_id" uuid NOT NULL,
  "keyword_id" uuid,
  "cluster_id" uuid,
  "title" text NOT NULL,
  "slug" text,
  "target_keyword" text,
  "meta_title" text,
  "meta_description" text,
  "body" text,
  "body_format" text DEFAULT 'html',
  "excerpt" text,
  "outline" jsonb,
  "table_of_contents" jsonb,
  "schema_markup" jsonb,
  "has_faq_schema" boolean DEFAULT false,
  "has_how_to_schema" boolean DEFAULT false,
  "has_article_schema" boolean DEFAULT false,
  "internal_links" jsonb DEFAULT '[]'::jsonb,
  "suggested_internal_links" jsonb DEFAULT '[]'::jsonb,
  "word_count" integer,
  "reading_time" integer,
  "seo_score" integer,
  "readability_score" integer,
  "keyword_density" numeric(5, 4),
  "featured_image" text,
  "featured_image_alt" text,
  "images" jsonb DEFAULT '[]'::jsonb,
  "status" "content_status" DEFAULT 'idea',
  "assigned_to" uuid,
  "published_url" text,
  "published_at" timestamp,
  "publisher" text,
  "external_id" text,
  "scheduled_for" timestamp,
  "version" integer DEFAULT 1,
  "last_edited_by" uuid,
  "geo_optimized" boolean DEFAULT false,
  "geo_score" integer,
  "entity_count" integer DEFAULT 0,
  "quotability_score" integer,
  "answer_structure_score" integer,
  "ai_model" text,
  "ai_prompt_version" text,
  "ai_tokens_used" integer,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- ============================================
-- CONTENT IDEAS
-- ============================================
CREATE TABLE "content_ideas" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "site_id" uuid NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "target_keyword" text,
  "search_volume" integer,
  "difficulty" integer,
  "type" text,
  "priority" text DEFAULT 'medium',
  "status" text DEFAULT 'idea',
  "content_id" uuid,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- ============================================
-- PAGES
-- ============================================
CREATE TABLE "pages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "site_id" uuid NOT NULL,
  "url" text NOT NULL,
  "path" text NOT NULL,
  "title" text,
  "meta_description" text,
  "h1" text,
  "headings" jsonb,
  "word_count" integer,
  "internal_links_out" jsonb DEFAULT '[]'::jsonb,
  "internal_links_in" integer DEFAULT 0,
  "external_links" jsonb DEFAULT '[]'::jsonb,
  "status_code" integer,
  "canonical_url" text,
  "robots_directive" text,
  "schema_types" jsonb DEFAULT '[]'::jsonb,
  "performance_score" integer,
  "lcp_ms" integer,
  "cls" numeric(5, 4),
  "is_indexed" boolean,
  "indexed_at" timestamp,
  "content_type" text,
  "content_id" uuid,
  "geo_score" integer,
  "geo_google_score" integer,
  "geo_chatgpt_score" integer,
  "geo_perplexity_score" integer,
  "geo_claude_score" integer,
  "geo_gemini_score" integer,
  "geo_last_analyzed" timestamp,
  "entity_count" integer DEFAULT 0,
  "quotability_score" integer,
  "answer_structure_score" integer,
  "has_expert_attribution" boolean DEFAULT false,
  "last_crawled_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- ============================================
-- AUDITS
-- ============================================
CREATE TABLE "audits" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "site_id" uuid NOT NULL,
  "type" text NOT NULL DEFAULT 'full',
  "overall_score" integer,
  "technical_score" integer,
  "content_score" integer,
  "geo_score" integer,
  "pages_scanned" integer DEFAULT 0,
  "issues_found" integer DEFAULT 0,
  "critical_issues" integer DEFAULT 0,
  "warning_issues" integer DEFAULT 0,
  "info_issues" integer DEFAULT 0,
  "passed_checks" integer DEFAULT 0,
  "duration_ms" integer,
  "status" text DEFAULT 'completed',
  "error" text,
  "results" jsonb DEFAULT '{}'::jsonb,
  "started_at" timestamp,
  "completed_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- ============================================
-- ISSUES
-- ============================================
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
  "status" text DEFAULT 'open',
  "is_resolved" boolean DEFAULT false,
  "resolved_at" timestamp,
  "resolved_by" uuid,
  "auto_fixable" boolean DEFAULT false,
  "can_auto_fix" boolean DEFAULT false,
  "auto_fix_applied" boolean DEFAULT false,
  "fixed_at" timestamp,
  "detected_at" timestamp DEFAULT now() NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- ============================================
-- TASKS
-- ============================================
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

-- ============================================
-- RANKINGS
-- ============================================
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
-- ENTITIES
-- ============================================
CREATE TABLE "entities" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "site_id" uuid NOT NULL,
  "page_id" uuid,
  "content_id" uuid,
  "name" text NOT NULL,
  "type" text,
  "description" text,
  "wikidata_id" text,
  "wikipedia_url" text,
  "mentions" integer DEFAULT 1,
  "context_quality" integer,
  "first_seen_at" timestamp DEFAULT now(),
  "last_seen_at" timestamp DEFAULT now(),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- ============================================
-- AI CITATIONS
-- ============================================
CREATE TABLE "ai_citations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "site_id" uuid NOT NULL,
  "page_id" uuid,
  "platform" text NOT NULL,
  "query" text NOT NULL,
  "citation_type" text,
  "snippet" text,
  "position" integer,
  "confidence" decimal(3, 2) DEFAULT 0.80,
  "discovered_at" timestamp DEFAULT now(),
  "last_verified_at" timestamp,
  "is_active" boolean DEFAULT true,
  UNIQUE("site_id", "platform", "query", "page_id")
);

-- ============================================
-- GEO ANALYSES
-- ============================================
CREATE TABLE "aio_analyses" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "site_id" uuid NOT NULL,
  "page_id" uuid NOT NULL,
  "version" integer DEFAULT 1,
  "google_aio_score" integer,
  "chatgpt_score" integer,
  "perplexity_score" integer,
  "claude_score" integer,
  "gemini_score" integer,
  "combined_score" integer,
  "entity_density_score" integer,
  "quotability_score" integer,
  "answer_structure_score" integer,
  "schema_presence_score" integer,
  "freshness_score" integer,
  "authority_score" integer,
  "entities_found" jsonb DEFAULT '[]'::jsonb,
  "quotable_snippets" jsonb DEFAULT '[]'::jsonb,
  "missing_elements" jsonb DEFAULT '[]'::jsonb,
  "improvement_suggestions" jsonb DEFAULT '[]'::jsonb,
  "google_recommendations" jsonb DEFAULT '[]'::jsonb,
  "chatgpt_recommendations" jsonb DEFAULT '[]'::jsonb,
  "perplexity_recommendations" jsonb DEFAULT '[]'::jsonb,
  "model_used" text,
  "tokens_used" integer,
  "analysis_duration_ms" integer,
  "analyzed_at" timestamp DEFAULT now(),
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- ============================================
-- USAGE RECORDS (Legacy)
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

-- ============================================
-- USAGE EVENTS (Legacy)
-- ============================================
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
-- FOREIGN KEYS
-- ============================================

ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;
ALTER TABLE "credit_balance" ADD CONSTRAINT "credit_balance_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;
ALTER TABLE "usage" ADD CONSTRAINT "usage_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;
ALTER TABLE "overage_charges" ADD CONSTRAINT "overage_charges_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;
ALTER TABLE "sites" ADD CONSTRAINT "sites_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;
ALTER TABLE "keyword_clusters" ADD CONSTRAINT "keyword_clusters_site_id_fk" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE;
ALTER TABLE "keywords" ADD CONSTRAINT "keywords_site_id_fk" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE;
ALTER TABLE "keywords" ADD CONSTRAINT "keywords_cluster_id_fk" FOREIGN KEY ("cluster_id") REFERENCES "keyword_clusters"("id") ON DELETE SET NULL;
ALTER TABLE "content" ADD CONSTRAINT "content_site_id_fk" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE;
ALTER TABLE "content" ADD CONSTRAINT "content_keyword_id_fk" FOREIGN KEY ("keyword_id") REFERENCES "keywords"("id") ON DELETE SET NULL;
ALTER TABLE "content" ADD CONSTRAINT "content_cluster_id_fk" FOREIGN KEY ("cluster_id") REFERENCES "keyword_clusters"("id") ON DELETE SET NULL;
ALTER TABLE "content" ADD CONSTRAINT "content_assigned_to_fk" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL;
ALTER TABLE "content" ADD CONSTRAINT "content_last_edited_by_fk" FOREIGN KEY ("last_edited_by") REFERENCES "users"("id") ON DELETE SET NULL;
ALTER TABLE "content_ideas" ADD CONSTRAINT "content_ideas_site_id_fk" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE;
ALTER TABLE "pages" ADD CONSTRAINT "pages_site_id_fk" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE;
ALTER TABLE "pages" ADD CONSTRAINT "pages_content_id_fk" FOREIGN KEY ("content_id") REFERENCES "content"("id") ON DELETE SET NULL;
ALTER TABLE "audits" ADD CONSTRAINT "audits_site_id_fk" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE;
ALTER TABLE "issues" ADD CONSTRAINT "issues_site_id_fk" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE;
ALTER TABLE "issues" ADD CONSTRAINT "issues_page_id_fk" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE CASCADE;
ALTER TABLE "issues" ADD CONSTRAINT "issues_resolved_by_fk" FOREIGN KEY ("resolved_by") REFERENCES "users"("id") ON DELETE SET NULL;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_site_id_fk" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_triggered_by_user_id_fk" FOREIGN KEY ("triggered_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL;
ALTER TABLE "rankings" ADD CONSTRAINT "rankings_site_id_fk" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE;
ALTER TABLE "rankings" ADD CONSTRAINT "rankings_keyword_id_fk" FOREIGN KEY ("keyword_id") REFERENCES "keywords"("id") ON DELETE CASCADE;
ALTER TABLE "rankings" ADD CONSTRAINT "rankings_content_id_fk" FOREIGN KEY ("content_id") REFERENCES "content"("id") ON DELETE SET NULL;
ALTER TABLE "entities" ADD CONSTRAINT "entities_site_id_fk" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE;
ALTER TABLE "entities" ADD CONSTRAINT "entities_page_id_fk" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE CASCADE;
ALTER TABLE "entities" ADD CONSTRAINT "entities_content_id_fk" FOREIGN KEY ("content_id") REFERENCES "content"("id") ON DELETE CASCADE;
ALTER TABLE "ai_citations" ADD CONSTRAINT "ai_citations_site_id_fk" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE;
ALTER TABLE "ai_citations" ADD CONSTRAINT "ai_citations_page_id_fk" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE CASCADE;
ALTER TABLE "aio_analyses" ADD CONSTRAINT "aio_analyses_site_id_fk" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE;
ALTER TABLE "aio_analyses" ADD CONSTRAINT "aio_analyses_page_id_fk" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE CASCADE;
ALTER TABLE "usage_records" ADD CONSTRAINT "usage_records_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;
ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;
ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_usage_record_id_fk" FOREIGN KEY ("usage_record_id") REFERENCES "usage_records"("id") ON DELETE CASCADE;

-- ============================================
-- INDEXES
-- ============================================

CREATE UNIQUE INDEX "org_slug_idx" ON "organizations"("slug");
CREATE INDEX "org_dodo_customer_idx" ON "organizations"("dodo_customer_id") WHERE dodo_customer_id IS NOT NULL;
CREATE UNIQUE INDEX "user_email_idx" ON "users"("email");
CREATE INDEX "user_org_idx" ON "users"("organization_id");
CREATE UNIQUE INDEX "session_token_idx" ON "sessions"("token");
CREATE INDEX "integrations_org_idx" ON "integrations"("organization_id");
CREATE INDEX "integrations_type_idx" ON "integrations"("type");
CREATE INDEX "usage_org_idx" ON "usage"("organization_id");
CREATE INDEX "usage_period_idx" ON "usage"("period");
CREATE INDEX "notifications_user_idx" ON "notifications"("user_id");
CREATE INDEX "notifications_org_idx" ON "notifications"("organization_id");
CREATE INDEX "overage_charges_org_idx" ON "overage_charges"("organization_id");
CREATE INDEX "invoices_org_idx" ON "invoices"("organization_id");
CREATE INDEX "site_org_idx" ON "sites"("organization_id");
CREATE INDEX "site_domain_idx" ON "sites"("domain");
CREATE INDEX "cluster_site_idx" ON "keyword_clusters"("site_id");
CREATE INDEX "keyword_site_idx" ON "keywords"("site_id");
CREATE INDEX "keyword_cluster_idx" ON "keywords"("cluster_id");
CREATE INDEX "keyword_status_idx" ON "keywords"("status");
CREATE INDEX "content_site_idx" ON "content"("site_id");
CREATE INDEX "content_status_idx" ON "content"("status");
CREATE INDEX "page_site_idx" ON "pages"("site_id");
CREATE INDEX "page_url_idx" ON "pages"("url");
CREATE INDEX "audits_site_idx" ON "audits"("site_id");
CREATE INDEX "issue_site_idx" ON "issues"("site_id");
CREATE INDEX "issue_severity_idx" ON "issues"("severity");
CREATE INDEX "task_site_idx" ON "tasks"("site_id");
CREATE INDEX "task_status_idx" ON "tasks"("status");
CREATE INDEX "ranking_site_date_idx" ON "rankings"("site_id", "date");
CREATE INDEX "entities_site_idx" ON "entities"("site_id");
CREATE INDEX "ai_citations_site_idx" ON "ai_citations"("site_id");
CREATE INDEX "aio_analyses_site_idx" ON "aio_analyses"("site_id");
CREATE INDEX "aio_analyses_page_idx" ON "aio_analyses"("page_id");

-- ============================================
-- FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_timestamp BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_users_timestamp BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_integrations_timestamp BEFORE UPDATE ON integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_sites_timestamp BEFORE UPDATE ON sites FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_keywords_timestamp BEFORE UPDATE ON keywords FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_content_timestamp BEFORE UPDATE ON content FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_pages_timestamp BEFORE UPDATE ON pages FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_tasks_timestamp BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION increment_usage(org_id uuid, period_str text, column_name text, increment_amount integer DEFAULT 1)
RETURNS void AS $$
BEGIN
  INSERT INTO usage (organization_id, period) VALUES (org_id, period_str) ON CONFLICT (organization_id, period) DO NOTHING;
  EXECUTE format('UPDATE usage SET %I = COALESCE(%I, 0) + $1, updated_at = now() WHERE organization_id = $2 AND period = $3', column_name, column_name) USING increment_amount, org_id, period_str;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

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

-- User policies
CREATE POLICY "Users can view own organization" ON organizations FOR SELECT USING (id IN (SELECT organization_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Users can update own organization" ON organizations FOR UPDATE USING (id IN (SELECT organization_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Users can view org members" ON users FOR SELECT USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "Users can manage own sessions" ON sessions FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can view org integrations" ON integrations FOR SELECT USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Users can manage org integrations" ON integrations FOR ALL USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Users can view org credits" ON credit_balance FOR SELECT USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Users can view org usage" ON usage FOR SELECT USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own notifications" ON notifications FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "Users can view org overages" ON overage_charges FOR SELECT USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Users can view org invoices" ON invoices FOR SELECT USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Users can view org transactions" ON credit_transactions FOR SELECT USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Users can manage org sites" ON sites FOR ALL USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Users can manage site clusters" ON keyword_clusters FOR ALL USING (site_id IN (SELECT id FROM sites WHERE organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())));
CREATE POLICY "Users can manage site keywords" ON keywords FOR ALL USING (site_id IN (SELECT id FROM sites WHERE organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())));
CREATE POLICY "Users can manage site content" ON content FOR ALL USING (site_id IN (SELECT id FROM sites WHERE organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())));
CREATE POLICY "Users can manage site content ideas" ON content_ideas FOR ALL USING (site_id IN (SELECT id FROM sites WHERE organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())));
CREATE POLICY "Users can manage site pages" ON pages FOR ALL USING (site_id IN (SELECT id FROM sites WHERE organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())));
CREATE POLICY "Users can manage site audits" ON audits FOR ALL USING (site_id IN (SELECT id FROM sites WHERE organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())));
CREATE POLICY "Users can manage site issues" ON issues FOR ALL USING (site_id IN (SELECT id FROM sites WHERE organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())));
CREATE POLICY "Users can manage org tasks" ON tasks FOR ALL USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Users can view site rankings" ON rankings FOR SELECT USING (site_id IN (SELECT id FROM sites WHERE organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())));
CREATE POLICY "Users can manage site entities" ON entities FOR ALL USING (site_id IN (SELECT id FROM sites WHERE organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())));
CREATE POLICY "Users can manage site citations" ON ai_citations FOR ALL USING (site_id IN (SELECT id FROM sites WHERE organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())));
CREATE POLICY "Users can manage site analyses" ON aio_analyses FOR ALL USING (site_id IN (SELECT id FROM sites WHERE organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())));
CREATE POLICY "Users can view org usage records" ON usage_records FOR SELECT USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Users can view org usage events" ON usage_events FOR SELECT USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

-- Service role policies
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
-- GRANTS
-- ============================================

GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- ============================================
-- STORAGE BUCKETS
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES ('exports', 'exports', false, 52428800, ARRAY['text/html', 'text/markdown', 'text/plain', 'text/csv', 'application/json', 'application/pdf']) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES ('uploads', 'uploads', false, 10485760, ARRAY['text/csv', 'text/plain', 'application/json']) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES ('content-images', 'content-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES ('screenshots', 'screenshots', false, 2097152, ARRAY['image/png', 'image/jpeg', 'image/webp']) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES ('sitemaps', 'sitemaps', false, 10485760, ARRAY['application/xml', 'text/xml', 'text/plain']) ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Public can view content images" ON storage.objects;
DROP POLICY IF EXISTS "Service role full access content-images" ON storage.objects;
CREATE POLICY "Public can view content images" ON storage.objects FOR SELECT USING (bucket_id = 'content-images');
CREATE POLICY "Service role full access content-images" ON storage.objects FOR ALL USING (bucket_id = 'content-images' AND auth.role() = 'service_role');

-- ============================================
-- ✅ LAUNCH READY!
-- Database cleaned & schema updated
-- Go to cabbageseo.com/signup to create your account
-- ============================================

