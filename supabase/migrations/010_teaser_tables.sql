-- ============================================
-- TEASER REPORTS + SUBSCRIBERS + CONTENT PREVIEW
-- Migration: 010_teaser_tables.sql
-- ============================================

-- Teaser Reports (shareable free scan results)
CREATE TABLE IF NOT EXISTS teaser_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain TEXT NOT NULL,
  visibility_score INTEGER NOT NULL,
  is_invisible BOOLEAN NOT NULL,
  competitors_mentioned JSONB DEFAULT '[]',
  results JSONB NOT NULL,
  summary JSONB NOT NULL,
  content_preview JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS teaser_reports_domain_idx ON teaser_reports(domain);
CREATE INDEX IF NOT EXISTS teaser_reports_created_idx ON teaser_reports(created_at);

-- Teaser Subscribers (score change email notifications)
CREATE TABLE IF NOT EXISTS teaser_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  domain TEXT NOT NULL,
  report_id UUID,
  unsubscribed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS teaser_subscribers_domain_idx ON teaser_subscribers(domain);
CREATE INDEX IF NOT EXISTS teaser_subscribers_email_idx ON teaser_subscribers(email);

-- If teaser_reports already exists but is missing content_preview column:
-- ALTER TABLE teaser_reports ADD COLUMN IF NOT EXISTS content_preview JSONB DEFAULT NULL;
