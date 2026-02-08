-- ============================================
-- DATA MOAT: AI Recommendations + Industry Benchmarks
-- Every AI recommendation ever observed, building
-- the proprietary dataset that becomes the competitive moat.
-- ============================================

CREATE TABLE IF NOT EXISTS ai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT NOT NULL,
  scanned_domain TEXT NOT NULL,
  recommended_domain TEXT NOT NULL,
  platform TEXT NOT NULL,
  position INTEGER,
  snippet TEXT,
  confidence TEXT DEFAULT 'medium',
  source TEXT NOT NULL DEFAULT 'teaser',
  site_id UUID,
  observed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS ai_rec_domain_idx ON ai_recommendations(recommended_domain);
CREATE INDEX IF NOT EXISTS ai_rec_scanned_idx ON ai_recommendations(scanned_domain);
CREATE INDEX IF NOT EXISTS ai_rec_platform_idx ON ai_recommendations(platform);
CREATE INDEX IF NOT EXISTS ai_rec_observed_idx ON ai_recommendations(observed_at);
CREATE INDEX IF NOT EXISTS ai_rec_query_idx ON ai_recommendations(query);

CREATE TABLE IF NOT EXISTS industry_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'all',
  total_scans INTEGER NOT NULL DEFAULT 0,
  total_recommendations INTEGER NOT NULL DEFAULT 0,
  unique_domains INTEGER NOT NULL DEFAULT 0,
  top_domains JSONB DEFAULT '[]',
  platform_breakdown JSONB DEFAULT '{}',
  avg_visibility_score INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS benchmark_period_idx ON industry_benchmarks(period);
CREATE INDEX IF NOT EXISTS benchmark_category_idx ON industry_benchmarks(category);
CREATE UNIQUE INDEX IF NOT EXISTS benchmark_period_category_unique ON industry_benchmarks(period, category);
