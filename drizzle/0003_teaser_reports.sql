CREATE TABLE IF NOT EXISTS teaser_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL,
  visibility_score INTEGER NOT NULL,
  is_invisible BOOLEAN NOT NULL,
  competitors_mentioned JSONB DEFAULT '[]',
  results JSONB NOT NULL,
  summary JSONB NOT NULL,
  content_preview JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS teaser_reports_domain_idx ON teaser_reports(domain);
CREATE INDEX IF NOT EXISTS teaser_reports_created_idx ON teaser_reports(created_at);

-- Migration: Add content_preview column if table already exists without it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'teaser_reports' AND column_name = 'content_preview'
  ) THEN
    ALTER TABLE teaser_reports ADD COLUMN content_preview JSONB DEFAULT NULL;
  END IF;
END $$;
