-- ============================================
-- CabbageSEO: COMPLETE SCHEMA
-- Citation Intelligence + GEO Intelligence
-- ============================================
-- 
-- This keeps your:
-- ✅ Organization (subscription, $29 plan)
-- ✅ User account
-- ✅ Dodo payment data
--
-- And creates ALL citation + GEO tables.
-- ============================================

-- ============================================
-- STEP 1: DROP OLD FEATURE TABLES ONLY
-- (Keeps organizations, users, integrations)
-- ============================================

SET session_replication_role = 'replica';

-- Drop old GEO/SEO feature tables
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

-- Drop old sites (will recreate with new columns)
DROP TABLE IF EXISTS "sites" CASCADE;

-- Drop old usage (will recreate with new columns)
DROP TABLE IF EXISTS "usage" CASCADE;

SET session_replication_role = 'origin';

-- ============================================
-- STEP 2: ADD NEW ENUMS (if they don't exist)
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

-- Add 'agency' to plan enum if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'agency' AND enumtypid = 'plan'::regtype) THEN
    ALTER TYPE "plan" ADD VALUE 'agency';
  END IF;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- ============================================
-- STEP 3: CREATE SITES TABLE (Citation Tracking)
-- ============================================

CREATE TABLE "sites" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organization_id" uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  "domain" text NOT NULL,
  "name" text,
  "niche" text,  -- NEW: For query intelligence
  "status" text DEFAULT 'active',
  "topics" jsonb DEFAULT '[]'::jsonb,
  "last_checked_at" timestamptz,
  "total_citations" integer DEFAULT 0,
  "citations_this_week" integer DEFAULT 0,
  "citations_last_week" integer DEFAULT 0,
  "geo_score_avg" integer DEFAULT 0,  -- NEW: GEO Score
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  UNIQUE("organization_id", "domain")
);

-- ============================================
-- STEP 4: CREATE CITATIONS TABLE
-- ============================================

CREATE TABLE "citations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "site_id" uuid NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  "platform" citation_platform NOT NULL,
  "query" text NOT NULL,
  "snippet" text,
  "page_url" text,
  "citation_type" text DEFAULT 'direct',  -- direct, indirect, mention
  "confidence" real DEFAULT 0.7,  -- 0.0 to 1.0
  "discovered_at" timestamptz NOT NULL DEFAULT now(),
  "last_checked_at" timestamptz NOT NULL DEFAULT now(),
  "created_at" timestamptz NOT NULL DEFAULT now()
);

-- ============================================
-- STEP 5: CREATE COMPETITORS TABLE
-- ============================================

CREATE TABLE "competitors" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "site_id" uuid NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  "domain" text NOT NULL,
  "total_citations" integer DEFAULT 0,
  "citation_count" integer DEFAULT 0,  -- Alias for compatibility
  "citations_change" integer DEFAULT 0,
  "last_citations" jsonb DEFAULT '[]'::jsonb,  -- Recent citation data
  "last_checked_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  UNIQUE("site_id", "domain")
);

-- ============================================
-- STEP 6: CREATE USAGE TABLE
-- ============================================

CREATE TABLE "usage" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organization_id" uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  "period" text NOT NULL,
  "checks_used" integer DEFAULT 0,
  "checks_limit" integer DEFAULT 100,
  "sites_used" integer DEFAULT 0,
  "sites_limit" integer DEFAULT 3,
  "competitors_used" integer DEFAULT 0,
  "competitors_limit" integer DEFAULT 2,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  UNIQUE("organization_id", "period")
);

-- ============================================
-- STEP 7: CREATE GEO ANALYSES TABLE (NEW!)
-- Stores cached GEO analysis results
-- ============================================

CREATE TABLE "geo_analyses" (
  "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "site_id" uuid NOT NULL REFERENCES "sites"("id") ON DELETE CASCADE,
  "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  
  -- GEO Score
  "score" jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- Format: { overall: 75, breakdown: {...}, grade: "B", summary: "..." }
  
  -- Tips
  "tips" jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- Format: [{ id, category, priority, title, description, impact, example }]
  
  -- Query Intelligence
  "queries" jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- Format: [{ query, searchVolume, yourPosition, opportunity }]
  
  -- Citation Opportunities
  "opportunities" jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- Format: [{ query, competitor, platform, suggestedAction, difficulty }]
  
  "created_at" timestamptz DEFAULT now()
);

-- ============================================
-- STEP 8: CREATE QUERY INTELLIGENCE TABLE (NEW!)
-- Tracks discovered queries over time
-- ============================================

CREATE TABLE "query_intelligence" (
  "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "site_id" uuid NOT NULL REFERENCES "sites"("id") ON DELETE CASCADE,
  
  "query" text NOT NULL,
  "search_volume" text DEFAULT 'medium',  -- high, medium, low
  "your_position" text DEFAULT 'absent',  -- cited, mentioned, absent
  "is_opportunity" boolean DEFAULT true,
  
  -- Which platforms answer this query
  "platforms" text[] DEFAULT ARRAY['ChatGPT', 'Perplexity', 'Google AI'],
  
  -- Who gets cited for this query
  "top_sources" text[] DEFAULT '{}',
  
  "updated_at" timestamptz DEFAULT now(),
  "created_at" timestamptz DEFAULT now(),
  
  CONSTRAINT "query_intelligence_unique" UNIQUE ("site_id", "query")
);

-- ============================================
-- STEP 9: INDEXES
-- ============================================

-- Sites
CREATE INDEX "idx_sites_org" ON "sites"("organization_id");
CREATE INDEX "idx_sites_domain" ON "sites"("domain");

-- Citations
CREATE INDEX "idx_citations_site" ON "citations"("site_id");
CREATE INDEX "idx_citations_platform" ON "citations"("platform");
CREATE INDEX "idx_citations_discovered" ON "citations"("discovered_at" DESC);

-- Competitors
CREATE INDEX "idx_competitors_site" ON "competitors"("site_id");

-- Usage
CREATE INDEX "idx_usage_org_period" ON "usage"("organization_id", "period");

-- GEO Analyses (NEW)
CREATE INDEX "idx_geo_analyses_site" ON "geo_analyses"("site_id");
CREATE INDEX "idx_geo_analyses_created" ON "geo_analyses"("created_at" DESC);

-- Query Intelligence (NEW)
CREATE INDEX "idx_query_intelligence_site" ON "query_intelligence"("site_id");
CREATE INDEX "idx_query_intelligence_opportunity" ON "query_intelligence"("is_opportunity") WHERE "is_opportunity" = true;

-- ============================================
-- STEP 10: TRIGGERS
-- ============================================

-- Update timestamp function (if not exists)
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_sites_timestamp ON sites;
CREATE TRIGGER update_sites_timestamp
  BEFORE UPDATE ON sites FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS update_usage_timestamp ON usage;
CREATE TRIGGER update_usage_timestamp
  BEFORE UPDATE ON usage FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Auto-increment citation count on site
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
-- STEP 11: PLAN LIMITS FUNCTION
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
      RETURN QUERY SELECT 10, -1, 10, -1, true;
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
-- STEP 12: ROW LEVEL SECURITY
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

-- GEO Analyses (NEW)
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

-- Query Intelligence (NEW)
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
-- STEP 13: GRANTS
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
-- ✅ DONE! Full GEO Platform Ready
-- ============================================
-- 
-- PRESERVED:
-- ✅ Your organization (Starter plan, $29)
-- ✅ Your user account
-- ✅ Dodo payment subscription
-- ✅ Integrations
--
-- CREATED:
-- - sites (websites to track + GEO score)
-- - citations (AI mentions)
-- - competitors (competitor tracking)  
-- - usage (check limits)
-- - geo_analyses (GEO Score, Tips, cached analysis)
-- - query_intelligence (niche queries AI answers)
--
-- FEATURES ENABLED:
-- ✅ Citation Tracking (Perplexity, ChatGPT, Google AI)
-- ✅ GEO Score (0-100 AI-friendliness rating)
-- ✅ GEO Tips (actionable optimization advice)
-- ✅ Query Intelligence (what AI is answering)
-- ✅ Citation Opportunities (where competitors cited, you're not)
--
-- Now deploy and dominate GEO! 🥬
-- ============================================

