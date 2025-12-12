-- ============================================
-- AUDITS AND CREDIT BALANCE TABLES
-- Sprint: Database Completion
-- ============================================

-- ============================================
-- AUDITS TABLE
-- Store audit results for sites
-- ============================================

CREATE TABLE IF NOT EXISTS audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid REFERENCES sites(id) ON DELETE CASCADE NOT NULL,
  
  -- Audit type
  type text NOT NULL DEFAULT 'full', -- full, quick, aio
  
  -- Scores
  overall_score integer,
  technical_score integer,
  content_score integer,
  aio_score integer,
  
  -- Counts
  pages_scanned integer DEFAULT 0,
  issues_found integer DEFAULT 0,
  critical_issues integer DEFAULT 0,
  warning_issues integer DEFAULT 0,
  info_issues integer DEFAULT 0,
  
  -- Duration
  duration_ms integer,
  
  -- Status
  status text DEFAULT 'completed', -- running, completed, failed
  error text,
  
  -- Results snapshot
  results jsonb DEFAULT '{}'::jsonb,
  
  started_at timestamp,
  completed_at timestamp,
  created_at timestamp DEFAULT now() NOT NULL
);

-- Indexes for audits
CREATE INDEX IF NOT EXISTS audits_site_idx ON audits(site_id);
CREATE INDEX IF NOT EXISTS audits_created_idx ON audits(created_at);
CREATE INDEX IF NOT EXISTS audits_type_idx ON audits(type);

-- ============================================
-- CREDIT BALANCE TABLE
-- Track prepaid and bonus credits per organization
-- ============================================

CREATE TABLE IF NOT EXISTS credit_balance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Credits
  prepaid_credits integer DEFAULT 0 NOT NULL,
  bonus_credits integer DEFAULT 0 NOT NULL,
  
  -- Expiration
  expires_at timestamp,
  
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL
);

-- Indexes for credit_balance
CREATE INDEX IF NOT EXISTS credit_balance_org_idx ON credit_balance(organization_id);

-- ============================================
-- USAGE TABLE (monthly usage tracking)
-- ============================================

CREATE TABLE IF NOT EXISTS usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  
  -- Period
  period text NOT NULL, -- YYYY-MM format
  
  -- Usage counts
  articles_generated integer DEFAULT 0,
  keywords_analyzed integer DEFAULT 0,
  serp_calls integer DEFAULT 0,
  pages_crawled integer DEFAULT 0,
  aio_analyses integer DEFAULT 0,
  
  -- Limits (snapshot from plan)
  articles_limit integer DEFAULT 0,
  keywords_limit integer DEFAULT 0,
  
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL,
  
  UNIQUE(organization_id, period)
);

-- Indexes for usage
CREATE INDEX IF NOT EXISTS usage_org_idx ON usage(organization_id);
CREATE INDEX IF NOT EXISTS usage_period_idx ON usage(period);

-- ============================================
-- CONTENT IDEAS TABLE
-- Store content ideas generated during onboarding
-- ============================================

CREATE TABLE IF NOT EXISTS content_ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid REFERENCES sites(id) ON DELETE CASCADE NOT NULL,
  
  -- Idea details
  title text NOT NULL,
  description text,
  target_keyword text,
  search_volume integer,
  difficulty integer,
  
  -- Classification
  type text, -- blog, product, landing, comparison
  priority text DEFAULT 'medium', -- high, medium, low
  
  -- Status
  status text DEFAULT 'idea', -- idea, queued, writing, published
  content_id uuid, -- links to content table once created
  
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL
);

-- Indexes for content_ideas
CREATE INDEX IF NOT EXISTS content_ideas_site_idx ON content_ideas(site_id);
CREATE INDEX IF NOT EXISTS content_ideas_status_idx ON content_ideas(status);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_ideas ENABLE ROW LEVEL SECURITY;

-- Audits policies
CREATE POLICY "Users can view audits for their sites" ON audits
    FOR SELECT
    USING (site_id IN (
        SELECT s.id FROM sites s
        JOIN users u ON s.organization_id = u.organization_id
        WHERE u.id = auth.uid()
    ));

CREATE POLICY "Users can create audits for their sites" ON audits
    FOR INSERT
    WITH CHECK (site_id IN (
        SELECT s.id FROM sites s
        JOIN users u ON s.organization_id = u.organization_id
        WHERE u.id = auth.uid()
    ));

-- Credit balance policies
CREATE POLICY "Users can view own org credits" ON credit_balance
    FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can update own org credits" ON credit_balance
    FOR UPDATE
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

-- Usage policies
CREATE POLICY "Users can view own org usage" ON usage
    FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can update own org usage" ON usage
    FOR UPDATE
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

-- Content ideas policies
CREATE POLICY "Users can manage content ideas for their sites" ON content_ideas
    FOR ALL
    USING (site_id IN (
        SELECT s.id FROM sites s
        JOIN users u ON s.organization_id = u.organization_id
        WHERE u.id = auth.uid()
    ));

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT ALL ON audits TO authenticated;
GRANT ALL ON audits TO service_role;
GRANT ALL ON credit_balance TO authenticated;
GRANT ALL ON credit_balance TO service_role;
GRANT ALL ON usage TO authenticated;
GRANT ALL ON usage TO service_role;
GRANT ALL ON content_ideas TO authenticated;
GRANT ALL ON content_ideas TO service_role;

-- ============================================
-- HELPER FUNCTION: Increment usage
-- ============================================

CREATE OR REPLACE FUNCTION increment_usage(
  org_id uuid,
  period_str text,
  column_name text,
  increment_amount integer DEFAULT 1
)
RETURNS void AS $$
BEGIN
  -- Insert or update usage for this period
  INSERT INTO usage (organization_id, period, articles_generated)
  VALUES (org_id, period_str, 0)
  ON CONFLICT (organization_id, period) DO NOTHING;
  
  -- Update the specific column
  EXECUTE format(
    'UPDATE usage SET %I = COALESCE(%I, 0) + $1, updated_at = now() WHERE organization_id = $2 AND period = $3',
    column_name, column_name
  ) USING increment_amount, org_id, period_str;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


