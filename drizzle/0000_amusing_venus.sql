CREATE TYPE "public"."billing_interval" AS ENUM('monthly', 'yearly');--> statement-breakpoint
CREATE TYPE "public"."cms_type" AS ENUM('wordpress', 'webflow', 'shopify', 'ghost', 'custom');--> statement-breakpoint
CREATE TYPE "public"."content_status" AS ENUM('idea', 'researching', 'writing', 'draft', 'review', 'approved', 'scheduled', 'published', 'updating');--> statement-breakpoint
CREATE TYPE "public"."issue_severity" AS ENUM('critical', 'warning', 'info');--> statement-breakpoint
CREATE TYPE "public"."issue_type" AS ENUM('missing_meta_title', 'missing_meta_description', 'duplicate_title', 'thin_content', 'broken_link', 'orphan_page', 'redirect_chain', 'slow_page', 'missing_h1', 'multiple_h1', 'missing_alt', 'missing_schema');--> statement-breakpoint
CREATE TYPE "public"."keyword_status" AS ENUM('discovered', 'analyzed', 'clustered', 'queued', 'writing', 'published');--> statement-breakpoint
CREATE TYPE "public"."plan" AS ENUM('starter', 'pro', 'pro_plus');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('owner', 'admin', 'editor', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'canceled', 'past_due', 'trialing', 'paused');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('pending', 'queued', 'running', 'completed', 'failed', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."task_type" AS ENUM('research', 'cluster', 'write', 'optimize', 'publish', 'crawl', 'audit', 'refresh', 'link');--> statement-breakpoint
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
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"plan" "plan" DEFAULT 'starter' NOT NULL,
	"billing_interval" "billing_interval" DEFAULT 'monthly',
	"subscription_status" "subscription_status" DEFAULT 'trialing',
	"trial_ends_at" timestamp,
	"current_period_start" timestamp,
	"current_period_end" timestamp,
	"cancel_at_period_end" boolean DEFAULT false,
	"autopilot_enabled" boolean DEFAULT false,
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
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
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
ALTER TABLE "content" ADD CONSTRAINT "content_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content" ADD CONSTRAINT "content_keyword_id_keywords_id_fk" FOREIGN KEY ("keyword_id") REFERENCES "public"."keywords"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content" ADD CONSTRAINT "content_cluster_id_keyword_clusters_id_fk" FOREIGN KEY ("cluster_id") REFERENCES "public"."keyword_clusters"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content" ADD CONSTRAINT "content_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content" ADD CONSTRAINT "content_last_edited_by_users_id_fk" FOREIGN KEY ("last_edited_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issues" ADD CONSTRAINT "issues_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issues" ADD CONSTRAINT "issues_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issues" ADD CONSTRAINT "issues_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "keyword_clusters" ADD CONSTRAINT "keyword_clusters_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "keywords" ADD CONSTRAINT "keywords_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "keywords" ADD CONSTRAINT "keywords_cluster_id_keyword_clusters_id_fk" FOREIGN KEY ("cluster_id") REFERENCES "public"."keyword_clusters"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pages" ADD CONSTRAINT "pages_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pages" ADD CONSTRAINT "pages_content_id_content_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."content"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rankings" ADD CONSTRAINT "rankings_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rankings" ADD CONSTRAINT "rankings_keyword_id_keywords_id_fk" FOREIGN KEY ("keyword_id") REFERENCES "public"."keywords"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rankings" ADD CONSTRAINT "rankings_content_id_content_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."content"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sites" ADD CONSTRAINT "sites_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_triggered_by_user_id_users_id_fk" FOREIGN KEY ("triggered_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_usage_record_id_usage_records_id_fk" FOREIGN KEY ("usage_record_id") REFERENCES "public"."usage_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_records" ADD CONSTRAINT "usage_records_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "content_site_idx" ON "content" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "content_status_idx" ON "content" USING btree ("status");--> statement-breakpoint
CREATE INDEX "content_keyword_idx" ON "content" USING btree ("keyword_id");--> statement-breakpoint
CREATE INDEX "issue_site_idx" ON "issues" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "issue_severity_idx" ON "issues" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "cluster_site_idx" ON "keyword_clusters" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "keyword_site_idx" ON "keywords" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "keyword_cluster_idx" ON "keywords" USING btree ("cluster_id");--> statement-breakpoint
CREATE INDEX "keyword_status_idx" ON "keywords" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "org_slug_idx" ON "organizations" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "page_site_idx" ON "pages" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "page_url_idx" ON "pages" USING btree ("url");--> statement-breakpoint
CREATE INDEX "ranking_site_date_idx" ON "rankings" USING btree ("site_id","date");--> statement-breakpoint
CREATE INDEX "ranking_keyword_idx" ON "rankings" USING btree ("keyword_id");--> statement-breakpoint
CREATE UNIQUE INDEX "session_token_idx" ON "sessions" USING btree ("token");--> statement-breakpoint
CREATE INDEX "site_org_idx" ON "sites" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "site_domain_idx" ON "sites" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "task_site_idx" ON "tasks" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "task_status_idx" ON "tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "task_scheduled_idx" ON "tasks" USING btree ("scheduled_for");--> statement-breakpoint
CREATE INDEX "usage_event_org_idx" ON "usage_events" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "usage_org_period_idx" ON "usage_records" USING btree ("organization_id","period_start");--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "user_org_idx" ON "users" USING btree ("organization_id");