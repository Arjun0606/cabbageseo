-- ============================================
-- CabbageSEO - CITATION INTELLIGENCE SCHEMA
-- ============================================
-- 
-- Clean, focused schema for citation tracking.
-- Run this in Supabase SQL Editor for a fresh start.
--
-- Tables:
-- 1. organizations - Billing/subscription
-- 2. users - Auth users
-- 3. sites - Websites being tracked
-- 4. citations - AI citations found
-- 5. competitors - Competitor domains
-- 6. usage - API usage tracking
-- 7. notifications - Alert settings
-- ============================================

-- ============================================
-- STEP 0: CLEAN SLATE
-- ============================================

-- Disable triggers during cleanup
SET session_replication_role = 'replica';

-- Drop all old tables (if migrating)
DROP TABLE IF EXISTS "ai_citations" CASCADE;
DROP TABLE IF EXISTS "aio_analyses" CASCADE;
DROP TABLE IF EXISTS "competitors" CASCADE;
DROP TABLE IF EXISTS "content" CASCADE;
DROP TABLE IF EXISTS "content_ideas" CASCADE;
DROP TABLE IF EXISTS "entities" CASCADE;
DROP TABLE IF EXISTS "keywords" CASCADE;
DROP TABLE IF EXISTS "keyword_clusters" CASCADE;
DROP TABLE IF EXISTS "pages" CASCADE;
DROP TABLE IF EXISTS "issues" CASCADE;
DROP TABLE IF EXISTS "audits" CASCADE;
DROP TABLE IF EXISTS "tasks" CASCADE;
DROP TABLE IF EXISTS "rankings" CASCADE;
DROP TABLE IF EXISTS "integrations" CASCADE;
DROP TABLE IF EXISTS "usage" CASCADE;
DROP TABLE IF EXISTS "usage_events" CASCADE;
DROP TABLE IF EXISTS "usage_records" CASCADE;
DROP TABLE IF EXISTS "notifications" CASCADE;
DROP TABLE IF EXISTS "credit_balance" CASCADE;
DROP TABLE IF EXISTS "credit_transactions" CASCADE;
DROP TABLE IF EXISTS "invoices" CASCADE;
DROP TABLE IF EXISTS "overage_charges" CASCADE;
DROP TABLE IF EXISTS "sites" CASCADE;
DROP TABLE IF EXISTS "sessions" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;
DROP TABLE IF EXISTS "organizations" CASCADE;

-- Drop old types
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
DROP TYPE IF EXISTS "public"."citation_platform" CASCADE;
DROP TYPE IF EXISTS "public"."citation_confidence" CASCADE;

SET session_replication_role = 'origin';

-- ============================================
-- STEP 1: ENUMS
-- ============================================

-- Plans
CREATE TYPE "public"."plan" AS ENUM (
  'free',
  'starter',
  'pro',
  'agency'
);

-- Subscription status
CREATE TYPE "public"."subscription_status" AS ENUM (
  'trialing',
  'active',
  'past_due',
  'canceled',
  'unpaid'
);

-- Billing interval
CREATE TYPE "public"."billing_interval" AS ENUM (
  'monthly',
  'yearly'
);

-- User role
CREATE TYPE "public"."role" AS ENUM (
  'owner',
  'admin',
  'member'
);

-- Citation platforms
CREATE TYPE "public"."citation_platform" AS ENUM (
  'perplexity',
  'google_aio',
  'chatgpt',
  'bing_ai'
);

-- Citation confidence
CREATE TYPE "public"."citation_confidence" AS ENUM (
  'high',
  'medium',
  'low'
);

-- ============================================
-- STEP 2: CORE TABLES
-- ============================================

-- Organizations (billing entity)
CREATE TABLE "public"."organizations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "plan" plan NOT NULL DEFAULT 'free',
  "subscription_status" subscription_status NOT NULL DEFAULT 'trialing',
  "billing_interval" billing_interval DEFAULT 'monthly',
  "subscription_id" text,
  "customer_id" text,
  "trial_ends_at" timestamptz,
  "current_period_start" timestamptz,
  "current_period_end" timestamptz,
  "cancel_at_period_end" boolean DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

-- Users
CREATE TABLE "public"."users" (
  "id" uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  "email" text NOT NULL UNIQUE,
  "name" text,
  "avatar_url" text,
  "organization_id" uuid REFERENCES organizations(id) ON DELETE SET NULL,
  "role" role NOT NULL DEFAULT 'owner',
  "email_verified" boolean DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

-- Sites (websites being tracked)
CREATE TABLE "public"."sites" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organization_id" uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  "domain" text NOT NULL,
  "name" text,
  "status" text DEFAULT 'active',
  "last_checked_at" timestamptz,
  "total_citations" integer DEFAULT 0,
  "citations_this_week" integer DEFAULT 0,
  "citations_last_week" integer DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  UNIQUE("organization_id", "domain")
);

-- Citations (AI mentions)
CREATE TABLE "public"."citations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "site_id" uuid NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  "platform" citation_platform NOT NULL,
  "query" text NOT NULL,
  "snippet" text,
  "page_url" text,
  "confidence" citation_confidence DEFAULT 'medium',
  "cited_at" timestamptz NOT NULL DEFAULT now(),
  "last_checked_at" timestamptz NOT NULL DEFAULT now(),
  "created_at" timestamptz NOT NULL DEFAULT now()
);

-- Competitors
CREATE TABLE "public"."competitors" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "site_id" uuid NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  "domain" text NOT NULL,
  "total_citations" integer DEFAULT 0,
  "citations_change" integer DEFAULT 0,
  "last_checked_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  UNIQUE("site_id", "domain")
);

-- Usage tracking
CREATE TABLE "public"."usage" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organization_id" uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  "period_start" timestamptz NOT NULL,
  "period_end" timestamptz NOT NULL,
  "checks_used" integer DEFAULT 0,
  "checks_limit" integer DEFAULT 100,
  "sites_used" integer DEFAULT 0,
  "sites_limit" integer DEFAULT 3,
  "competitors_used" integer DEFAULT 0,
  "competitors_limit" integer DEFAULT 2,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

-- Notification settings
CREATE TABLE "public"."notifications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "email_new_citation" boolean DEFAULT true,
  "email_lost_citation" boolean DEFAULT true,
  "email_weekly_digest" boolean DEFAULT true,
  "email_competitor_cited" boolean DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  UNIQUE("user_id")
);

-- ============================================
-- STEP 3: INDEXES
-- ============================================

CREATE INDEX "idx_sites_org" ON "sites"("organization_id");
CREATE INDEX "idx_sites_domain" ON "sites"("domain");
CREATE INDEX "idx_citations_site" ON "citations"("site_id");
CREATE INDEX "idx_citations_platform" ON "citations"("platform");
CREATE INDEX "idx_citations_cited_at" ON "citations"("cited_at" DESC);
CREATE INDEX "idx_competitors_site" ON "competitors"("site_id");
CREATE INDEX "idx_usage_org_period" ON "usage"("organization_id", "period_start");
CREATE INDEX "idx_users_org" ON "users"("organization_id");

-- ============================================
-- STEP 4: ROW LEVEL SECURITY
-- ============================================

ALTER TABLE "organizations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sites" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "citations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "competitors" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "usage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;

-- Users can see their own org
CREATE POLICY "users_own_org" ON "organizations"
  FOR ALL USING (
    id IN (SELECT organization_id FROM users WHERE id = auth.uid())
  );

-- Users can see themselves
CREATE POLICY "users_self" ON "users"
  FOR ALL USING (id = auth.uid());

-- Users can see sites in their org
CREATE POLICY "sites_org" ON "sites"
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
  );

-- Users can see citations for their sites
CREATE POLICY "citations_site" ON "citations"
  FOR ALL USING (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN users u ON s.organization_id = u.organization_id
      WHERE u.id = auth.uid()
    )
  );

-- Users can see competitors for their sites
CREATE POLICY "competitors_site" ON "competitors"
  FOR ALL USING (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN users u ON s.organization_id = u.organization_id
      WHERE u.id = auth.uid()
    )
  );

-- Users can see their org's usage
CREATE POLICY "usage_org" ON "usage"
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
  );

-- Users can see their own notifications
CREATE POLICY "notifications_self" ON "notifications"
  FOR ALL USING (user_id = auth.uid());

-- ============================================
-- STEP 5: HELPER FUNCTIONS
-- ============================================

-- Update timestamps
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables
CREATE TRIGGER update_organizations_timestamp
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_users_timestamp
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_sites_timestamp
  BEFORE UPDATE ON sites
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_usage_timestamp
  BEFORE UPDATE ON usage
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Increment citation count on site when citation added
CREATE OR REPLACE FUNCTION update_site_citation_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE sites
  SET total_citations = total_citations + 1,
      citations_this_week = citations_this_week + 1
  WHERE id = NEW.site_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER citation_count_trigger
  AFTER INSERT ON citations
  FOR EACH ROW EXECUTE FUNCTION update_site_citation_count();

-- ============================================
-- STEP 6: PLAN LIMITS FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION get_plan_limits(p plan)
RETURNS TABLE (
  sites_limit integer,
  checks_limit integer,
  competitors_limit integer,
  history_days integer,
  hourly_checks boolean
) AS $$
BEGIN
  CASE p
    WHEN 'free' THEN
      RETURN QUERY SELECT 1, 3, 0, 7, false;
    WHEN 'starter' THEN
      RETURN QUERY SELECT 3, 100, 2, 30, false;
    WHEN 'pro' THEN
      RETURN QUERY SELECT 10, -1, 10, -1, true; -- -1 = unlimited
    WHEN 'agency' THEN
      RETURN QUERY SELECT 50, -1, -1, -1, true;
    ELSE
      RETURN QUERY SELECT 1, 3, 0, 7, false;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- DONE! 
-- ============================================
-- 
-- Tables created:
-- - organizations (billing)
-- - users (auth)
-- - sites (tracked websites)
-- - citations (AI mentions)
-- - competitors (competitor tracking)
-- - usage (API limits)
-- - notifications (alert settings)
--
-- Next: Create your first user via Supabase Auth
-- ============================================

