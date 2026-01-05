-- ============================================
-- CabbageSEO: CITATION INTELLIGENCE MIGRATION
-- ✅ SAFE MIGRATION - PRESERVES CITATION DATA
-- ============================================
-- 
-- Use this script to migrate from old GEO/SEO schema
-- to the new Citation Intelligence schema.
--
-- Preserves:
-- ✅ Organizations (with billing data)
-- ✅ User accounts
-- ✅ Existing citations table (if any)
-- ✅ Dodo payment data
-- 
-- Drops (old unused tables):
-- - aio_analyses, ai_citations, entities, rankings
-- - issues, audits, tasks, pages, content, keywords
--
-- For FRESH INSTALL (drops everything), use
-- CITATION_INTELLIGENCE_SCHEMA.sql instead.
-- ============================================

-- ============================================
-- STEP 0: DISABLE TRIGGERS FOR CLEANUP
-- ============================================
SET session_replication_role = 'replica';

-- ============================================
-- STEP 1: DROP OLD GEO/SEO TABLES
-- Keep: organizations, users, sessions, integrations
-- Drop: Everything else from old product
-- ============================================

-- Drop old GEO/SEO tables (in dependency order)
DROP TABLE IF EXISTS "aio_analyses" CASCADE;
DROP TABLE IF EXISTS "ai_citations" CASCADE;
DROP TABLE IF EXISTS "entities" CASCADE;
DROP TABLE IF EXISTS "rankings" CASCADE;
DROP TABLE IF EXISTS "issues" CASCADE;
DROP TABLE IF EXISTS "audits" CASCADE;
DROP TABLE IF EXISTS "tasks" CASCADE;
DROP TABLE IF EXISTS "pages" CASCADE;
DROP TABLE IF EXISTS "content_ideas" CASCADE;
DROP TABLE IF EXISTS "content" CASCADE;
DROP TABLE IF EXISTS "keywords" CASCADE;
DROP TABLE IF EXISTS "keyword_clusters" CASCADE;
DROP TABLE IF EXISTS "usage_events" CASCADE;
DROP TABLE IF EXISTS "usage_records" CASCADE;

-- Drop old competitors if exists (will recreate)
DROP TABLE IF EXISTS "competitors" CASCADE;

-- ============================================
-- STEP 2: UPDATE ENUMS FOR NEW PRODUCT
-- ============================================

-- Update plan enum (add agency, keep others for backward compat)
DO $$ 
BEGIN
  -- Check if 'agency' value exists
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'agency' AND enumtypid = 'plan'::regtype) THEN
    ALTER TYPE "plan" ADD VALUE 'agency';
  END IF;
END $$;

-- Create new citation enums if they don't exist
DO $$ 
BEGIN
  -- Citation platform enum
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'citation_platform') THEN
    CREATE TYPE "citation_platform" AS ENUM ('perplexity', 'google_aio', 'chatgpt', 'bing_ai');
  END IF;
  
  -- Citation confidence enum  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'citation_confidence') THEN
    CREATE TYPE "citation_confidence" AS ENUM ('high', 'medium', 'low');
  END IF;
END $$;

SET session_replication_role = 'origin';

-- ============================================
-- STEP 3: UPDATE SITES TABLE FOR CITATIONS
-- ============================================

-- Add citation tracking columns to sites if they don't exist
ALTER TABLE "sites" ADD COLUMN IF NOT EXISTS "last_checked_at" timestamptz;
ALTER TABLE "sites" ADD COLUMN IF NOT EXISTS "total_citations" integer DEFAULT 0;
ALTER TABLE "sites" ADD COLUMN IF NOT EXISTS "citations_this_week" integer DEFAULT 0;
ALTER TABLE "sites" ADD COLUMN IF NOT EXISTS "citations_last_week" integer DEFAULT 0;
ALTER TABLE "sites" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'active';
ALTER TABLE "sites" ADD COLUMN IF NOT EXISTS "topics" jsonb DEFAULT '[]'::jsonb;

-- Drop unused columns if they exist (optional - comment out if you want to keep them)
-- ALTER TABLE "sites" DROP COLUMN IF EXISTS "cms_type";
-- ALTER TABLE "sites" DROP COLUMN IF EXISTS "cms_url";
-- etc.

-- ============================================
-- STEP 4: CREATE CITATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS "citations" (
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

-- Indexes for citations
CREATE INDEX IF NOT EXISTS "idx_citations_site" ON "citations"("site_id");
CREATE INDEX IF NOT EXISTS "idx_citations_platform" ON "citations"("platform");
CREATE INDEX IF NOT EXISTS "idx_citations_cited_at" ON "citations"("cited_at" DESC);

-- ============================================
-- STEP 5: CREATE COMPETITORS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS "competitors" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "site_id" uuid NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  "domain" text NOT NULL,
  "total_citations" integer DEFAULT 0,
  "citations_change" integer DEFAULT 0,
  "last_checked_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  UNIQUE("site_id", "domain")
);

-- Indexes for competitors
CREATE INDEX IF NOT EXISTS "idx_competitors_site" ON "competitors"("site_id");

-- ============================================
-- STEP 6: UPDATE NOTIFICATIONS TABLE FOR ALERTS
-- ============================================

-- Add citation alert columns to existing notifications or create new table
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "email_new_citation" boolean DEFAULT true;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "email_lost_citation" boolean DEFAULT true;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "email_weekly_digest" boolean DEFAULT true;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "email_competitor_cited" boolean DEFAULT false;

-- ============================================
-- STEP 7: UPDATE USAGE TABLE FOR CITATION CHECKS
-- ============================================

-- Add citation check columns to usage
ALTER TABLE "usage" ADD COLUMN IF NOT EXISTS "checks_used" integer DEFAULT 0;
ALTER TABLE "usage" ADD COLUMN IF NOT EXISTS "checks_limit" integer DEFAULT 100;
ALTER TABLE "usage" ADD COLUMN IF NOT EXISTS "sites_used" integer DEFAULT 0;
ALTER TABLE "usage" ADD COLUMN IF NOT EXISTS "sites_limit" integer DEFAULT 3;
ALTER TABLE "usage" ADD COLUMN IF NOT EXISTS "competitors_used" integer DEFAULT 0;
ALTER TABLE "usage" ADD COLUMN IF NOT EXISTS "competitors_limit" integer DEFAULT 2;

-- ============================================
-- STEP 8: TRIGGERS FOR CITATION COUNTS
-- ============================================

-- Update site citation count when citation is added
CREATE OR REPLACE FUNCTION update_site_citation_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE sites
  SET 
    total_citations = total_citations + 1,
    citations_this_week = citations_this_week + 1,
    updated_at = now()
  WHERE id = NEW.site_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS citation_count_trigger ON citations;
CREATE TRIGGER citation_count_trigger
  AFTER INSERT ON citations
  FOR EACH ROW EXECUTE FUNCTION update_site_citation_count();

-- Weekly reset function for citation counts
CREATE OR REPLACE FUNCTION reset_weekly_citations()
RETURNS void AS $$
BEGIN
  UPDATE sites
  SET 
    citations_last_week = citations_this_week,
    citations_this_week = 0,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 9: ROW LEVEL SECURITY FOR NEW TABLES
-- ============================================

ALTER TABLE "citations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "competitors" ENABLE ROW LEVEL SECURITY;

-- Citations policies
DROP POLICY IF EXISTS "Users can view citations for their sites" ON citations;
CREATE POLICY "Users can view citations for their sites" ON citations
  FOR ALL USING (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN users u ON s.organization_id = u.organization_id
      WHERE u.id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service role full access citations" ON citations;
CREATE POLICY "Service role full access citations" ON citations
  FOR ALL USING (auth.role() = 'service_role');

-- Competitors policies
DROP POLICY IF EXISTS "Users can manage competitors for their sites" ON competitors;
CREATE POLICY "Users can manage competitors for their sites" ON competitors
  FOR ALL USING (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN users u ON s.organization_id = u.organization_id
      WHERE u.id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service role full access competitors" ON competitors;
CREATE POLICY "Service role full access competitors" ON competitors
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- STEP 10: PLAN LIMITS FUNCTION
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
      RETURN QUERY SELECT 10, -1, 10, -1, true;  -- -1 = unlimited
    WHEN 'pro_plus' THEN
      RETURN QUERY SELECT 25, -1, 25, -1, true;
    WHEN 'agency' THEN
      RETURN QUERY SELECT 50, -1, -1, -1, true;
    ELSE
      RETURN QUERY SELECT 1, 3, 0, 7, false;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 11: GRANTS
-- ============================================

GRANT ALL ON "citations" TO authenticated;
GRANT ALL ON "citations" TO service_role;
GRANT ALL ON "competitors" TO authenticated;
GRANT ALL ON "competitors" TO service_role;

-- ============================================
-- ✅ MIGRATION COMPLETE!
-- ============================================
-- 
-- New tables created:
-- - citations (AI mentions tracking)
-- - competitors (competitor tracking)
--
-- Updated tables:
-- - sites (added citation tracking columns)
-- - usage (added citation check limits)
-- - notifications (added citation alert prefs)
--
-- Your app is ready for Citation Intelligence!
-- 
-- Next steps:
-- 1. Deploy your code to Vercel
-- 2. Test signup → add site → check citations
-- 3. Watch those citations come in! 🎉
-- ============================================

