CREATE TYPE "public"."billing_interval" AS ENUM('monthly', 'yearly');--> statement-breakpoint
CREATE TYPE "public"."cms_type" AS ENUM('wordpress', 'webflow', 'shopify', 'ghost', 'custom');--> statement-breakpoint
CREATE TYPE "public"."content_status" AS ENUM('idea', 'researching', 'writing', 'draft', 'review', 'approved', 'scheduled', 'published', 'updating');--> statement-breakpoint
CREATE TYPE "public"."generated_page_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."integration_status" AS ENUM('active', 'error', 'disconnected');--> statement-breakpoint
CREATE TYPE "public"."issue_severity" AS ENUM('critical', 'warning', 'info');--> statement-breakpoint
CREATE TYPE "public"."issue_type" AS ENUM('missing_meta_title', 'missing_meta_description', 'duplicate_title', 'thin_content', 'broken_link', 'orphan_page', 'redirect_chain', 'slow_page', 'missing_h1', 'multiple_h1', 'missing_alt', 'missing_schema', 'aio_low_entity_density', 'aio_poor_answer_structure', 'aio_missing_faq', 'aio_missing_howto', 'aio_weak_quotability', 'aio_missing_definitions', 'aio_no_expert_attribution', 'aio_ambiguous_context', 'aio_stale_content');--> statement-breakpoint
CREATE TYPE "public"."keyword_status" AS ENUM('discovered', 'analyzed', 'clustered', 'queued', 'writing', 'published');--> statement-breakpoint
CREATE TYPE "public"."plan" AS ENUM('free', 'scout', 'command', 'dominate');--> statement-breakpoint
CREATE TYPE "public"."referral_status" AS ENUM('pending', 'signed_up', 'converted', 'expired');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('owner', 'admin', 'editor', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."sprint_action_status" AS ENUM('pending', 'in_progress', 'completed', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'canceled', 'past_due', 'trialing', 'paused');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('pending', 'queued', 'running', 'completed', 'failed', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."task_type" AS ENUM('research', 'cluster', 'write', 'optimize', 'publish', 'crawl', 'audit', 'refresh', 'link');--> statement-breakpoint
CREATE TABLE "ai_recommendations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"query" text NOT NULL,
	"scanned_domain" text NOT NULL,
	"recommended_domain" text NOT NULL,
	"platform" text NOT NULL,
	"position" integer,
	"snippet" text,
	"confidence" text DEFAULT 'medium',
	"source" text DEFAULT 'teaser' NOT NULL,
	"site_id" uuid,
	"observed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
	"model_used" text DEFAULT 'claude-sonnet-4-20250514',
	"tokens_used" integer,
	"analysis_duration_ms" integer,
	"analyzed_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"scopes" jsonb DEFAULT '["bulk_scan"]'::jsonb,
	"hourly_limit" integer DEFAULT 200,
	"is_active" boolean DEFAULT true,
	"last_used_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "api_keys_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "audits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" uuid NOT NULL,
	"type" text DEFAULT 'full' NOT NULL,
	"overall_score" integer,
	"technical_score" integer,
	"content_score" integer,
	"aio_score" integer,
	"pages_scanned" integer DEFAULT 0,
	"issues_found" integer DEFAULT 0,
	"critical_issues" integer DEFAULT 0,
	"warning_issues" integer DEFAULT 0,
	"info_issues" integer DEFAULT 0,
	"duration_ms" integer,
	"status" text DEFAULT 'completed',
	"error" text,
	"results" jsonb DEFAULT '{}'::jsonb,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "citations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" uuid NOT NULL,
	"page_id" uuid,
	"platform" text NOT NULL,
	"query" text NOT NULL,
	"snippet" text,
	"confidence" text DEFAULT 'medium',
	"source_domain" text,
	"cited_at" timestamp DEFAULT now(),
	"last_verified_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "competitors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" uuid NOT NULL,
	"domain" text NOT NULL,
	"name" text,
	"total_citations" integer DEFAULT 0,
	"citations_this_week" integer DEFAULT 0,
	"citations_change" integer DEFAULT 0,
	"last_checked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" uuid NOT NULL,
	"keyword_id" uuid,
	"cluster_id" uuid,
	"title" text NOT NULL,
	"slug" text,
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
	"images" jsonb DEFAULT '[]'::jsonb,
	"status" "content_status" DEFAULT 'idea',
	"assigned_to" uuid,
	"published_url" text,
	"published_at" timestamp,
	"cms_post_id" text,
	"scheduled_for" timestamp,
	"version" integer DEFAULT 1,
	"last_edited_by" uuid,
	"ai_model" text,
	"ai_prompt_version" text,
	"aio_optimized" boolean DEFAULT false,
	"aio_score" integer,
	"entity_count" integer DEFAULT 0,
	"quotability_score" integer,
	"answer_structure_score" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE "credit_balance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"prepaid_credits" integer DEFAULT 0 NOT NULL,
	"bonus_credits" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "credit_balance_organization_id_unique" UNIQUE("organization_id")
);
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE "generated_pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" uuid NOT NULL,
	"query" text NOT NULL,
	"title" text NOT NULL,
	"meta_description" text,
	"body" text NOT NULL,
	"schema_markup" jsonb,
	"target_entities" jsonb DEFAULT '[]'::jsonb,
	"competitors_analyzed" jsonb DEFAULT '[]'::jsonb,
	"word_count" integer,
	"ai_model" text DEFAULT 'gpt-5.2',
	"status" "generated_page_status" DEFAULT 'draft',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_refreshed_at" timestamp,
	"refresh_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "geo_analyses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"score" jsonb NOT NULL,
	"tips" jsonb DEFAULT '[]'::jsonb,
	"queries" jsonb DEFAULT '[]'::jsonb,
	"opportunities" jsonb DEFAULT '[]'::jsonb,
	"raw_data" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "industry_benchmarks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"period" text NOT NULL,
	"category" text DEFAULT 'all' NOT NULL,
	"total_scans" integer DEFAULT 0 NOT NULL,
	"total_recommendations" integer DEFAULT 0 NOT NULL,
	"unique_domains" integer DEFAULT 0 NOT NULL,
	"top_domains" jsonb DEFAULT '[]'::jsonb,
	"platform_breakdown" jsonb DEFAULT '{}'::jsonb,
	"avg_visibility_score" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "integrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"type" text NOT NULL,
	"credentials" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" "integration_status" DEFAULT 'active' NOT NULL,
	"error" text,
	"last_synced_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "issues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" uuid NOT NULL,
	"page_id" uuid,
	"type" "issue_type" NOT NULL,
	"severity" "issue_severity" NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"recommendation" text,
	"affected_url" text,
	"affected_element" text,
	"current_value" text,
	"suggested_value" text,
	"is_resolved" boolean DEFAULT false,
	"resolved_at" timestamp,
	"resolved_by" uuid,
	"can_auto_fix" boolean DEFAULT false,
	"auto_fix_applied" boolean DEFAULT false,
	"detected_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE "market_share_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" uuid NOT NULL,
	"market_share" integer NOT NULL,
	"total_queries" integer DEFAULT 0,
	"queries_won" integer DEFAULT 0,
	"queries_lost" integer DEFAULT 0,
	"snapshot_date" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "monthly_checkpoints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"period" text NOT NULL,
	"momentum_score" integer DEFAULT 0,
	"momentum_change" integer DEFAULT 0,
	"new_queries" jsonb DEFAULT '[]'::jsonb,
	"lost_queries" jsonb DEFAULT '[]'::jsonb,
	"competitor_changes" jsonb DEFAULT '[]'::jsonb,
	"top_action" text,
	"report_data" jsonb DEFAULT '{}'::jsonb,
	"email_sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"email_new_citation" boolean DEFAULT true,
	"email_lost_citation" boolean DEFAULT true,
	"email_weekly_digest" boolean DEFAULT true,
	"email_competitor_cited" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "notifications_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"dodo_customer_id" text,
	"dodo_subscription_id" text,
	"dodo_product_id" text,
	"plan" "plan" DEFAULT 'free' NOT NULL,
	"billing_interval" "billing_interval" DEFAULT 'monthly',
	"subscription_status" "subscription_status" DEFAULT 'trialing',
	"trial_ends_at" timestamp,
	"current_period_start" timestamp,
	"current_period_end" timestamp,
	"cancel_at_period_end" boolean DEFAULT false,
	"autopilot_enabled" boolean DEFAULT false,
	"referral_code" text,
	"referred_by" text,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"brand_voice" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
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
	"aio_score" integer,
	"aio_google_score" integer,
	"aio_chatgpt_score" integer,
	"aio_perplexity_score" integer,
	"aio_claude_score" integer,
	"aio_gemini_score" integer,
	"aio_last_analyzed" timestamp,
	"entity_count" integer DEFAULT 0,
	"quotability_score" integer,
	"answer_structure_score" integer,
	"has_expert_attribution" boolean DEFAULT false,
	"last_crawled_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE "referrals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"referrer_organization_id" uuid NOT NULL,
	"referral_code" text NOT NULL,
	"referred_email" text,
	"referred_organization_id" uuid,
	"status" "referral_status" DEFAULT 'pending',
	"reward_applied" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"converted_at" timestamp
);
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE "sites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"domain" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'active',
	"total_citations" integer DEFAULT 0,
	"citations_this_week" integer DEFAULT 0,
	"citations_last_week" integer DEFAULT 0,
	"last_checked_at" timestamp,
	"geo_score_avg" integer,
	"category" text,
	"custom_queries" jsonb DEFAULT '[]'::jsonb,
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
	"settings" jsonb DEFAULT '{}'::jsonb,
	"brand_voice" text,
	"target_audience" text,
	"main_topics" jsonb DEFAULT '[]'::jsonb,
	"autopilot_enabled" boolean DEFAULT false,
	"autopilot_settings" jsonb DEFAULT '{}'::jsonb,
	"aio_enabled" boolean DEFAULT true,
	"aio_score_avg" integer,
	"aio_last_analyzed" timestamp,
	"is_active" boolean DEFAULT true,
	"public_profile_enabled" boolean DEFAULT false,
	"public_profile_bio" text,
	"sprint_started_at" timestamp,
	"sprint_completed_at" timestamp,
	"momentum_score" integer DEFAULT 0,
	"momentum_change" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "source_listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" uuid NOT NULL,
	"source_domain" text NOT NULL,
	"source_name" text NOT NULL,
	"profile_url" text,
	"status" text DEFAULT 'pending',
	"listed_at" timestamp DEFAULT now() NOT NULL,
	"verified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sprint_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" uuid NOT NULL,
	"action_type" text NOT NULL,
	"action_title" text NOT NULL,
	"action_description" text,
	"action_url" text,
	"priority" integer DEFAULT 5,
	"estimated_minutes" integer DEFAULT 60,
	"week" integer DEFAULT 1,
	"status" "sprint_action_status" DEFAULT 'pending',
	"completed_at" timestamp,
	"proof_url" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE "teaser_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain" text NOT NULL,
	"visibility_score" integer NOT NULL,
	"is_invisible" boolean NOT NULL,
	"competitors_mentioned" jsonb DEFAULT '[]'::jsonb,
	"results" jsonb NOT NULL,
	"summary" jsonb NOT NULL,
	"content_preview" jsonb DEFAULT 'null'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teaser_subscribers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"domain" text NOT NULL,
	"report_id" uuid,
	"unsubscribed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"period" text NOT NULL,
	"checks_used" integer DEFAULT 0,
	"sites_used" integer DEFAULT 0,
	"competitors_used" integer DEFAULT 0,
	"gap_analyses_used" integer DEFAULT 0,
	"content_ideas_used" integer DEFAULT 0,
	"action_plans_used" integer DEFAULT 0,
	"pages_generated" integer DEFAULT 0,
	"articles_generated" integer DEFAULT 0,
	"keywords_analyzed" integer DEFAULT 0,
	"serp_calls" integer DEFAULT 0,
	"pages_crawled" integer DEFAULT 0,
	"aio_analyses" integer DEFAULT 0,
	"articles_limit" integer DEFAULT 0,
	"keywords_limit" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
ALTER TABLE "aio_analyses" ADD CONSTRAINT "aio_analyses_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aio_analyses" ADD CONSTRAINT "aio_analyses_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audits" ADD CONSTRAINT "audits_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "citations" ADD CONSTRAINT "citations_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "citations" ADD CONSTRAINT "citations_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitors" ADD CONSTRAINT "competitors_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content" ADD CONSTRAINT "content_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content" ADD CONSTRAINT "content_keyword_id_keywords_id_fk" FOREIGN KEY ("keyword_id") REFERENCES "public"."keywords"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content" ADD CONSTRAINT "content_cluster_id_keyword_clusters_id_fk" FOREIGN KEY ("cluster_id") REFERENCES "public"."keyword_clusters"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content" ADD CONSTRAINT "content_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content" ADD CONSTRAINT "content_last_edited_by_users_id_fk" FOREIGN KEY ("last_edited_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_ideas" ADD CONSTRAINT "content_ideas_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_balance" ADD CONSTRAINT "credit_balance_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entities" ADD CONSTRAINT "entities_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entities" ADD CONSTRAINT "entities_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entities" ADD CONSTRAINT "entities_content_id_content_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."content"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_pages" ADD CONSTRAINT "generated_pages_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geo_analyses" ADD CONSTRAINT "geo_analyses_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geo_analyses" ADD CONSTRAINT "geo_analyses_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issues" ADD CONSTRAINT "issues_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issues" ADD CONSTRAINT "issues_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issues" ADD CONSTRAINT "issues_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "keyword_clusters" ADD CONSTRAINT "keyword_clusters_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "keywords" ADD CONSTRAINT "keywords_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "keywords" ADD CONSTRAINT "keywords_cluster_id_keyword_clusters_id_fk" FOREIGN KEY ("cluster_id") REFERENCES "public"."keyword_clusters"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_share_snapshots" ADD CONSTRAINT "market_share_snapshots_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_checkpoints" ADD CONSTRAINT "monthly_checkpoints_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_checkpoints" ADD CONSTRAINT "monthly_checkpoints_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pages" ADD CONSTRAINT "pages_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pages" ADD CONSTRAINT "pages_content_id_content_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."content"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rankings" ADD CONSTRAINT "rankings_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rankings" ADD CONSTRAINT "rankings_keyword_id_keywords_id_fk" FOREIGN KEY ("keyword_id") REFERENCES "public"."keywords"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rankings" ADD CONSTRAINT "rankings_content_id_content_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."content"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrer_organization_id_organizations_id_fk" FOREIGN KEY ("referrer_organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referred_organization_id_organizations_id_fk" FOREIGN KEY ("referred_organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sites" ADD CONSTRAINT "sites_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_listings" ADD CONSTRAINT "source_listings_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sprint_actions" ADD CONSTRAINT "sprint_actions_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_triggered_by_user_id_users_id_fk" FOREIGN KEY ("triggered_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage" ADD CONSTRAINT "usage_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_usage_record_id_usage_records_id_fk" FOREIGN KEY ("usage_record_id") REFERENCES "public"."usage_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_records" ADD CONSTRAINT "usage_records_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_rec_domain_idx" ON "ai_recommendations" USING btree ("recommended_domain");--> statement-breakpoint
CREATE INDEX "ai_rec_scanned_idx" ON "ai_recommendations" USING btree ("scanned_domain");--> statement-breakpoint
CREATE INDEX "ai_rec_platform_idx" ON "ai_recommendations" USING btree ("platform");--> statement-breakpoint
CREATE INDEX "ai_rec_observed_idx" ON "ai_recommendations" USING btree ("observed_at");--> statement-breakpoint
CREATE INDEX "ai_rec_query_idx" ON "ai_recommendations" USING btree ("query");--> statement-breakpoint
CREATE INDEX "aio_analyses_page_idx" ON "aio_analyses" USING btree ("page_id");--> statement-breakpoint
CREATE INDEX "aio_analyses_site_idx" ON "aio_analyses" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "aio_analyses_analyzed_idx" ON "aio_analyses" USING btree ("analyzed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "api_keys_key_idx" ON "api_keys" USING btree ("key");--> statement-breakpoint
CREATE INDEX "api_keys_org_idx" ON "api_keys" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "audits_site_idx" ON "audits" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "audits_created_idx" ON "audits" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "citations_site_idx" ON "citations" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "citations_platform_idx" ON "citations" USING btree ("platform");--> statement-breakpoint
CREATE INDEX "citations_page_idx" ON "citations" USING btree ("page_id");--> statement-breakpoint
CREATE INDEX "citations_site_cited_at_idx" ON "citations" USING btree ("site_id","cited_at");--> statement-breakpoint
CREATE UNIQUE INDEX "citations_unique_idx" ON "citations" USING btree ("site_id","platform","query");--> statement-breakpoint
CREATE INDEX "competitors_site_idx" ON "competitors" USING btree ("site_id");--> statement-breakpoint
CREATE UNIQUE INDEX "competitors_site_domain_unique" ON "competitors" USING btree ("site_id","domain");--> statement-breakpoint
CREATE INDEX "content_site_idx" ON "content" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "content_status_idx" ON "content" USING btree ("status");--> statement-breakpoint
CREATE INDEX "content_keyword_idx" ON "content" USING btree ("keyword_id");--> statement-breakpoint
CREATE INDEX "content_site_status_created_idx" ON "content" USING btree ("site_id","status","created_at");--> statement-breakpoint
CREATE INDEX "content_ideas_site_idx" ON "content_ideas" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "content_ideas_status_idx" ON "content_ideas" USING btree ("status");--> statement-breakpoint
CREATE INDEX "credit_balance_org_idx" ON "credit_balance" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "entities_site_idx" ON "entities" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "entities_page_idx" ON "entities" USING btree ("page_id");--> statement-breakpoint
CREATE INDEX "entities_content_idx" ON "entities" USING btree ("content_id");--> statement-breakpoint
CREATE INDEX "entities_type_idx" ON "entities" USING btree ("type");--> statement-breakpoint
CREATE INDEX "generated_pages_site_idx" ON "generated_pages" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "generated_pages_query_idx" ON "generated_pages" USING btree ("query");--> statement-breakpoint
CREATE INDEX "generated_pages_refresh_idx" ON "generated_pages" USING btree ("status","last_refreshed_at");--> statement-breakpoint
CREATE INDEX "geo_analyses_site_idx" ON "geo_analyses" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "geo_analyses_created_idx" ON "geo_analyses" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "benchmark_period_idx" ON "industry_benchmarks" USING btree ("period");--> statement-breakpoint
CREATE INDEX "benchmark_category_idx" ON "industry_benchmarks" USING btree ("category");--> statement-breakpoint
CREATE UNIQUE INDEX "benchmark_period_category_unique" ON "industry_benchmarks" USING btree ("period","category");--> statement-breakpoint
CREATE INDEX "integrations_org_idx" ON "integrations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "integrations_type_idx" ON "integrations" USING btree ("type");--> statement-breakpoint
CREATE UNIQUE INDEX "integrations_org_type_unique" ON "integrations" USING btree ("organization_id","type");--> statement-breakpoint
CREATE INDEX "issue_site_idx" ON "issues" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "issue_severity_idx" ON "issues" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "issue_filter_idx" ON "issues" USING btree ("site_id","is_resolved","severity");--> statement-breakpoint
CREATE INDEX "cluster_site_idx" ON "keyword_clusters" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "keyword_site_idx" ON "keywords" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "keyword_cluster_idx" ON "keywords" USING btree ("cluster_id");--> statement-breakpoint
CREATE INDEX "keyword_status_idx" ON "keywords" USING btree ("status");--> statement-breakpoint
CREATE INDEX "keywords_content_id_idx" ON "keywords" USING btree ("content_id");--> statement-breakpoint
CREATE UNIQUE INDEX "keyword_site_keyword_unique" ON "keywords" USING btree ("site_id","keyword");--> statement-breakpoint
CREATE INDEX "market_share_site_idx" ON "market_share_snapshots" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "market_share_date_idx" ON "market_share_snapshots" USING btree ("snapshot_date");--> statement-breakpoint
CREATE INDEX "monthly_checkpoints_site_idx" ON "monthly_checkpoints" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "monthly_checkpoints_period_idx" ON "monthly_checkpoints" USING btree ("period");--> statement-breakpoint
CREATE UNIQUE INDEX "monthly_checkpoints_unique" ON "monthly_checkpoints" USING btree ("site_id","period");--> statement-breakpoint
CREATE UNIQUE INDEX "notifications_user_unique" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "org_slug_idx" ON "organizations" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "page_site_idx" ON "pages" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "page_url_idx" ON "pages" USING btree ("url");--> statement-breakpoint
CREATE INDEX "page_crawl_idx" ON "pages" USING btree ("site_id","last_crawled_at");--> statement-breakpoint
CREATE INDEX "ranking_site_date_idx" ON "rankings" USING btree ("site_id","date");--> statement-breakpoint
CREATE INDEX "ranking_keyword_idx" ON "rankings" USING btree ("keyword_id");--> statement-breakpoint
CREATE UNIQUE INDEX "referrals_code_idx" ON "referrals" USING btree ("referral_code");--> statement-breakpoint
CREATE INDEX "referrals_referrer_idx" ON "referrals" USING btree ("referrer_organization_id");--> statement-breakpoint
CREATE INDEX "referrals_referred_org_idx" ON "referrals" USING btree ("referred_organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "session_token_idx" ON "sessions" USING btree ("token");--> statement-breakpoint
CREATE INDEX "site_org_idx" ON "sites" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "site_domain_idx" ON "sites" USING btree ("domain");--> statement-breakpoint
CREATE UNIQUE INDEX "site_org_domain_unique" ON "sites" USING btree ("organization_id","domain");--> statement-breakpoint
CREATE INDEX "source_listings_site_idx" ON "source_listings" USING btree ("site_id");--> statement-breakpoint
CREATE UNIQUE INDEX "source_listings_unique_idx" ON "source_listings" USING btree ("site_id","source_domain");--> statement-breakpoint
CREATE INDEX "sprint_actions_site_idx" ON "sprint_actions" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "sprint_actions_status_idx" ON "sprint_actions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "task_site_idx" ON "tasks" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "task_status_idx" ON "tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "task_scheduled_idx" ON "tasks" USING btree ("scheduled_for");--> statement-breakpoint
CREATE INDEX "task_queue_idx" ON "tasks" USING btree ("status","priority","scheduled_for");--> statement-breakpoint
CREATE INDEX "teaser_reports_domain_idx" ON "teaser_reports" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "teaser_reports_created_idx" ON "teaser_reports" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "teaser_subscribers_domain_idx" ON "teaser_subscribers" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "teaser_subscribers_email_idx" ON "teaser_subscribers" USING btree ("email");--> statement-breakpoint
CREATE INDEX "usage_org_idx" ON "usage" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "usage_period_idx" ON "usage" USING btree ("period");--> statement-breakpoint
CREATE UNIQUE INDEX "usage_org_period_unique" ON "usage" USING btree ("organization_id","period");--> statement-breakpoint
CREATE INDEX "usage_event_org_idx" ON "usage_events" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "usage_event_type_idx" ON "usage_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "usage_org_period_idx" ON "usage_records" USING btree ("organization_id","period_start");--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "user_org_idx" ON "users" USING btree ("organization_id");