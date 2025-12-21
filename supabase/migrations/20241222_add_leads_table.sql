-- Add leads table for email capture
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  analyzed_url TEXT,
  source TEXT DEFAULT 'free_analyzer',
  converted BOOLEAN DEFAULT FALSE,
  converted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast email lookups
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);

-- Index for conversion tracking
CREATE INDEX IF NOT EXISTS idx_leads_converted ON leads(converted) WHERE converted = FALSE;

-- RLS policies
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role full access" ON leads
  FOR ALL
  USING (TRUE)
  WITH CHECK (TRUE);

-- Add trigger for updated_at
CREATE OR REPLACE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

