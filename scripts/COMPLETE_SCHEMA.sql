-- ============================================
-- CabbageSEO: COMPLETE SCHEMA
-- Citation Intelligence + GEO Intelligence
-- ============================================
-- 
-- PRESERVES:
-- ✅ Your organization (Starter plan, $29)
-- ✅ Your user account
-- ✅ Dodo payment subscription
--
-- CREATES:
-- - sites (domains to track)
-- - citations (AI mentions)
-- - competitors (competitor tracking)
-- - usage (check tracking)
-- - geo_analyses (GEO Score cache)
-- - query_intelligence (niche queries)
-- ============================================

-- ============================================
-- STEP 1: DROP OLD FEATURE TABLES
-- (Keeps organizations, users, integrations)
-- ============================================

SET session_replication_role = 'replica';

DROP TABLE IF EXISTS "geo_analyses" CASCADE;
DROP TABLE IF EXISTS "query_intelligence" CASCADE;
DROP TABLE IF EXISTS "aio_analyses" CASCADE;
DROP TABLE IF EXISTS "ai_citations" CASCADE;
DROP TABLE IF EXISTS "citations" CASCADE;
DROP TABLE IF EXISTS "competitors" CASCADE;
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
DROP TABLE IF EXISTS "notifications" CASCADE;
DROP TABLE IF EXISTS "overage_charges" CASCADE;
DROP TABLE IF EXISTS "invoices" CASCADE;
DROP TABLE IF EXISTS "credit_transactions" CASCADE;
DROP TABLE IF EXISTS "credit_balance" CASCADE;
DROP TABLE IF EXISTS "sessions" CASCADE;
DROP TABLE IF EXISTS "sites" CASCADE;
DROP TABLE IF EXISTS "usage" CASCADE;

SET session_replication_role = 'origin';

-- ============================================
-- STEP 2: ENUMS
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'citation_platform') THEN
    CREATE TYPE "citation_platform" AS ENUM ('perplexity', 'google_aio', 'chatgpt', 'bing_ai');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'citation_confidence') THEN
    CREATE TYPE "citation_confidence" AS ENUM ('high', 'medium', 'low');
  END IF;
END $$;

-- ============================================
-- STEP 3: SITES TABLE
-- ============================================

CREATE TABLE "sites" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organization_id" uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  "domain" text NOT NULL,
  "name" text,
  "niche" text,
  "status" text DEFAULT 'active',
  "topics" jsonb DEFAULT '[]'::jsonb,
  "last_checked_at" timestamptz,
  "total_citations" integer DEFAULT 0,
  "citations_this_week" integer DEFAULT 0,
  "citations_last_week" integer DEFAULT 0,
  "geo_score" integer DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  UNIQUE("organization_id", "domain")
);

-- ============================================
-- STEP 4: CITATIONS TABLE
-- ============================================

CREATE TABLE "citations" (
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

-- ============================================
-- STEP 5: COMPETITORS TABLE
-- ============================================

CREATE TABLE "competitors" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "site_id" uuid NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  "domain" text NOT NULL,
  "total_citations" integer DEFAULT 0,
  "citations_change" integer DEFAULT 0,
  "last_checked_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  UNIQUE("site_id", "domain")
);

-- ============================================
-- STEP 6: USAGE TABLE
-- ============================================

CREATE TABLE "usage" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organization_id" uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  "period" text NOT NULL,
  "checks_used" integer DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  UNIQUE("organization_id", "period")
);

-- ============================================
-- STEP 7: GEO ANALYSES TABLE
-- ============================================

CREATE TABLE "geo_analyses" (
  "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "site_id" uuid NOT NULL REFERENCES "sites"("id") ON DELETE CASCADE,
  "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "score" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "tips" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "queries" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "opportunities" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "created_at" timestamptz DEFAULT now()
);

-- ============================================
-- STEP 8: QUERY INTELLIGENCE TABLE
-- ============================================

CREATE TABLE "query_intelligence" (
  "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "site_id" uuid NOT NULL REFERENCES "sites"("id") ON DELETE CASCADE,
  "query" text NOT NULL,
  "search_volume" text DEFAULT 'medium',
  "your_position" text DEFAULT 'absent',
  "is_opportunity" boolean DEFAULT true,
  "platforms" text[] DEFAULT ARRAY['ChatGPT', 'Perplexity', 'Google AI'],
  "top_sources" text[] DEFAULT '{}',
  "updated_at" timestamptz DEFAULT now(),
  "created_at" timestamptz DEFAULT now(),
  CONSTRAINT "query_intelligence_unique" UNIQUE ("site_id", "query")
);

-- ============================================
-- STEP 9: INDEXES
-- ============================================

CREATE INDEX "idx_sites_org" ON "sites"("organization_id");
CREATE INDEX "idx_sites_domain" ON "sites"("domain");
CREATE INDEX "idx_citations_site" ON "citations"("site_id");
CREATE INDEX "idx_citations_platform" ON "citations"("platform");
CREATE INDEX "idx_citations_cited_at" ON "citations"("cited_at" DESC);
CREATE INDEX "idx_competitors_site" ON "competitors"("site_id");
CREATE INDEX "idx_usage_org_period" ON "usage"("organization_id", "period");
CREATE INDEX "idx_geo_analyses_site" ON "geo_analyses"("site_id");
CREATE INDEX "idx_geo_analyses_created" ON "geo_analyses"("created_at" DESC);
CREATE INDEX "idx_query_intelligence_site" ON "query_intelligence"("site_id");

-- ============================================
-- STEP 10: TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_sites_timestamp ON sites;
CREATE TRIGGER update_sites_timestamp
  BEFORE UPDATE ON sites FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS update_usage_timestamp ON usage;
CREATE TRIGGER update_usage_timestamp
  BEFORE UPDATE ON usage FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Auto-increment citation count
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

-- ============================================
-- STEP 11: WEEKLY RESET FUNCTION (for Inngest)
-- ============================================

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
-- STEP 12: ADD notification_settings TO USERS
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'notification_settings'
  ) THEN
    ALTER TABLE users ADD COLUMN notification_settings jsonb 
      DEFAULT '{"citationAlerts": true, "weeklyReport": true, "productUpdates": false}'::jsonb;
  END IF;
END $$;

-- ============================================
-- STEP 13: ROW LEVEL SECURITY
-- ============================================

ALTER TABLE "sites" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "citations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "competitors" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "usage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "geo_analyses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "query_intelligence" ENABLE ROW LEVEL SECURITY;

-- Sites
DROP POLICY IF EXISTS "sites_all" ON "sites";
CREATE POLICY "sites_all" ON "sites" FOR ALL 
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));
DROP POLICY IF EXISTS "sites_service" ON "sites";
CREATE POLICY "sites_service" ON "sites" FOR ALL 
  USING (auth.role() = 'service_role');

-- Citations
DROP POLICY IF EXISTS "citations_all" ON "citations";
CREATE POLICY "citations_all" ON "citations" FOR ALL 
  USING (site_id IN (
    SELECT s.id FROM sites s
    JOIN users u ON s.organization_id = u.organization_id
    WHERE u.id = auth.uid()
  ));
DROP POLICY IF EXISTS "citations_service" ON "citations";
CREATE POLICY "citations_service" ON "citations" FOR ALL 
  USING (auth.role() = 'service_role');

-- Competitors
DROP POLICY IF EXISTS "competitors_all" ON "competitors";
CREATE POLICY "competitors_all" ON "competitors" FOR ALL 
  USING (site_id IN (
    SELECT s.id FROM sites s
    JOIN users u ON s.organization_id = u.organization_id
    WHERE u.id = auth.uid()
  ));
DROP POLICY IF EXISTS "competitors_service" ON "competitors";
CREATE POLICY "competitors_service" ON "competitors" FOR ALL 
  USING (auth.role() = 'service_role');

-- Usage
DROP POLICY IF EXISTS "usage_select" ON "usage";
CREATE POLICY "usage_select" ON "usage" FOR SELECT 
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));
DROP POLICY IF EXISTS "usage_service" ON "usage";
CREATE POLICY "usage_service" ON "usage" FOR ALL 
  USING (auth.role() = 'service_role');

-- GEO Analyses
DROP POLICY IF EXISTS "geo_analyses_all" ON "geo_analyses";
CREATE POLICY "geo_analyses_all" ON "geo_analyses" FOR ALL 
  USING (site_id IN (
    SELECT s.id FROM sites s
    JOIN users u ON s.organization_id = u.organization_id
    WHERE u.id = auth.uid()
  ));
DROP POLICY IF EXISTS "geo_analyses_service" ON "geo_analyses";
CREATE POLICY "geo_analyses_service" ON "geo_analyses" FOR ALL 
  USING (auth.role() = 'service_role');

-- Query Intelligence
DROP POLICY IF EXISTS "query_intelligence_all" ON "query_intelligence";
CREATE POLICY "query_intelligence_all" ON "query_intelligence" FOR ALL 
  USING (site_id IN (
    SELECT s.id FROM sites s
    JOIN users u ON s.organization_id = u.organization_id
    WHERE u.id = auth.uid()
  ));
DROP POLICY IF EXISTS "query_intelligence_service" ON "query_intelligence";
CREATE POLICY "query_intelligence_service" ON "query_intelligence" FOR ALL 
  USING (auth.role() = 'service_role');

-- ============================================
-- STEP 14: GRANTS
-- ============================================

GRANT ALL ON "sites" TO authenticated;
GRANT ALL ON "sites" TO service_role;
GRANT ALL ON "citations" TO authenticated;
GRANT ALL ON "citations" TO service_role;
GRANT ALL ON "competitors" TO authenticated;
GRANT ALL ON "competitors" TO service_role;
GRANT ALL ON "usage" TO authenticated;
GRANT ALL ON "usage" TO service_role;
GRANT ALL ON "geo_analyses" TO authenticated;
GRANT ALL ON "geo_analyses" TO service_role;
GRANT ALL ON "query_intelligence" TO authenticated;
GRANT ALL ON "query_intelligence" TO service_role;

-- ============================================
-- ✅ DONE!
-- ============================================
-- 
-- TABLES CREATED:
-- - sites: Domains to track
-- - citations: AI platform mentions
-- - competitors: Competitor domains
-- - usage: Check tracking per period
-- - geo_analyses: Cached GEO analysis
-- - query_intelligence: Discovered queries
--
-- FUNCTIONS:
-- - reset_weekly_citations(): Called by Inngest cron
-- - update_site_citation_count(): Auto-increments on new citation
--
-- AUTOMATION (via Inngest):
-- - Daily checks at 10 AM UTC (all users)
-- - Hourly checks for Pro users
-- - Weekly reports every Monday
-- - Weekly count reset on Sundays
--
-- Now launch! 🥬
-- ============================================
