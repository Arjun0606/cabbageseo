-- ============================================
-- GEO INTELLIGENCE TABLES
-- ============================================
-- Run this AFTER the main Citation Intelligence schema
-- Adds tables for GEO Score, Tips, Query Intelligence, etc.
-- ============================================

-- ============================================
-- GEO ANALYSES TABLE
-- Stores cached GEO analysis results
-- ============================================

CREATE TABLE IF NOT EXISTS "geo_analyses" (
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

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS "idx_geo_analyses_site" ON "geo_analyses"("site_id");
CREATE INDEX IF NOT EXISTS "idx_geo_analyses_created" ON "geo_analyses"("created_at" DESC);

-- ============================================
-- QUERY INTELLIGENCE TABLE  
-- Tracks discovered queries over time
-- ============================================

CREATE TABLE IF NOT EXISTS "query_intelligence" (
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

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS "idx_query_intelligence_site" ON "query_intelligence"("site_id");
CREATE INDEX IF NOT EXISTS "idx_query_intelligence_opportunity" ON "query_intelligence"("is_opportunity") WHERE "is_opportunity" = true;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE "geo_analyses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "query_intelligence" ENABLE ROW LEVEL SECURITY;

-- GEO Analyses policies
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

-- Query Intelligence policies
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
-- GRANTS
-- ============================================

GRANT ALL ON "geo_analyses" TO authenticated;
GRANT ALL ON "geo_analyses" TO service_role;
GRANT ALL ON "query_intelligence" TO authenticated;
GRANT ALL ON "query_intelligence" TO service_role;

-- ============================================
-- ✅ GEO Intelligence Tables Ready!
-- ============================================

