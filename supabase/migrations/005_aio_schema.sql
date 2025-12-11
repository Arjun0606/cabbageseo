-- ============================================
-- AIO (AI Optimization) Schema Extensions
-- Sprint 1: AI Visibility Scoring Foundation
-- ============================================

-- ============================================
-- AIO ISSUE TYPES (Extend existing enum)
-- ============================================

-- Add new AIO-specific issue types
ALTER TYPE issue_type ADD VALUE IF NOT EXISTS 'aio_low_entity_density';
ALTER TYPE issue_type ADD VALUE IF NOT EXISTS 'aio_poor_answer_structure';
ALTER TYPE issue_type ADD VALUE IF NOT EXISTS 'aio_missing_faq';
ALTER TYPE issue_type ADD VALUE IF NOT EXISTS 'aio_missing_howto';
ALTER TYPE issue_type ADD VALUE IF NOT EXISTS 'aio_weak_quotability';
ALTER TYPE issue_type ADD VALUE IF NOT EXISTS 'aio_missing_definitions';
ALTER TYPE issue_type ADD VALUE IF NOT EXISTS 'aio_no_expert_attribution';
ALTER TYPE issue_type ADD VALUE IF NOT EXISTS 'aio_ambiguous_context';
ALTER TYPE issue_type ADD VALUE IF NOT EXISTS 'aio_stale_content';

-- ============================================
-- PAGES TABLE: Add AIO Scores
-- ============================================

-- Combined AIO score (weighted average of all platforms)
ALTER TABLE pages ADD COLUMN IF NOT EXISTS aio_score integer;

-- Platform-specific scores (0-100)
ALTER TABLE pages ADD COLUMN IF NOT EXISTS aio_google_score integer;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS aio_chatgpt_score integer;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS aio_perplexity_score integer;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS aio_claude_score integer;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS aio_gemini_score integer;

-- When was this page last analyzed for AIO
ALTER TABLE pages ADD COLUMN IF NOT EXISTS aio_last_analyzed timestamp;

-- AIO optimization metadata
ALTER TABLE pages ADD COLUMN IF NOT EXISTS entity_count integer DEFAULT 0;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS quotability_score integer;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS answer_structure_score integer;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS has_expert_attribution boolean DEFAULT false;

-- ============================================
-- CONTENT TABLE: Add AIO Fields
-- ============================================

-- Whether content was optimized for AI search
ALTER TABLE content ADD COLUMN IF NOT EXISTS aio_optimized boolean DEFAULT false;

-- AIO score for this content piece
ALTER TABLE content ADD COLUMN IF NOT EXISTS aio_score integer;

-- Entity tracking
ALTER TABLE content ADD COLUMN IF NOT EXISTS entity_count integer DEFAULT 0;

-- Quotability (how well can AI quote this)
ALTER TABLE content ADD COLUMN IF NOT EXISTS quotability_score integer;

-- Answer structure (direct answers, key takeaways)
ALTER TABLE content ADD COLUMN IF NOT EXISTS answer_structure_score integer;

-- ============================================
-- ENTITIES TABLE
-- Track named entities across the site
-- ============================================

CREATE TABLE IF NOT EXISTS entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid REFERENCES sites(id) ON DELETE CASCADE NOT NULL,
  page_id uuid REFERENCES pages(id) ON DELETE CASCADE,
  content_id uuid REFERENCES content(id) ON DELETE CASCADE,
  
  -- Entity details
  name text NOT NULL,
  type text, -- person, organization, concept, product, location, event
  description text,
  
  -- External references
  wikidata_id text,
  wikipedia_url text,
  
  -- Usage stats
  mentions integer DEFAULT 1,
  context_quality integer, -- 0-100, how well explained when mentioned
  
  -- First/last seen
  first_seen_at timestamp DEFAULT now(),
  last_seen_at timestamp DEFAULT now(),
  
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Indexes for entities
CREATE INDEX IF NOT EXISTS entities_site_idx ON entities(site_id);
CREATE INDEX IF NOT EXISTS entities_page_idx ON entities(page_id);
CREATE INDEX IF NOT EXISTS entities_content_idx ON entities(content_id);
CREATE INDEX IF NOT EXISTS entities_type_idx ON entities(type);
CREATE INDEX IF NOT EXISTS entities_name_idx ON entities(name);

-- ============================================
-- AI CITATIONS TABLE
-- Track when AI platforms cite our content
-- ============================================

CREATE TABLE IF NOT EXISTS ai_citations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid REFERENCES sites(id) ON DELETE CASCADE NOT NULL,
  page_id uuid REFERENCES pages(id) ON DELETE CASCADE,
  
  -- Which platform cited us
  platform text NOT NULL, -- google_aio, chatgpt, perplexity, claude, gemini
  
  -- The query that resulted in citation
  query text NOT NULL,
  
  -- Citation details
  citation_type text, -- direct_quote, paraphrase, source_link, featured
  snippet text, -- The actual cited text
  position integer, -- Position in AI response (1st source, 2nd, etc.)
  
  -- Confidence (how sure are we this is a real citation)
  confidence decimal(3, 2) DEFAULT 0.8, -- 0.0 to 1.0
  
  -- Discovery metadata
  discovered_at timestamp DEFAULT now(),
  last_verified_at timestamp,
  
  -- De-duplication
  UNIQUE(site_id, platform, query, page_id)
);

-- Indexes for citations
CREATE INDEX IF NOT EXISTS ai_citations_site_idx ON ai_citations(site_id);
CREATE INDEX IF NOT EXISTS ai_citations_platform_idx ON ai_citations(platform);
CREATE INDEX IF NOT EXISTS ai_citations_page_idx ON ai_citations(page_id);
CREATE INDEX IF NOT EXISTS ai_citations_discovered_idx ON ai_citations(discovered_at);

-- ============================================
-- AIO ANALYSIS RESULTS TABLE
-- Store detailed AIO analysis for each page
-- ============================================

CREATE TABLE IF NOT EXISTS aio_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid REFERENCES sites(id) ON DELETE CASCADE NOT NULL,
  page_id uuid REFERENCES pages(id) ON DELETE CASCADE NOT NULL,
  
  -- Analysis version (for tracking improvements)
  version integer DEFAULT 1,
  
  -- Raw scores (0-100)
  google_aio_score integer,
  chatgpt_score integer,
  perplexity_score integer,
  claude_score integer,
  gemini_score integer,
  combined_score integer,
  
  -- Detailed breakdown
  entity_density_score integer,
  quotability_score integer,
  answer_structure_score integer,
  schema_presence_score integer,
  freshness_score integer,
  authority_score integer,
  
  -- Extracted data
  entities_found jsonb DEFAULT '[]',
  quotable_snippets jsonb DEFAULT '[]',
  missing_elements jsonb DEFAULT '[]',
  improvement_suggestions jsonb DEFAULT '[]',
  
  -- Platform-specific recommendations
  google_recommendations jsonb DEFAULT '[]',
  chatgpt_recommendations jsonb DEFAULT '[]',
  perplexity_recommendations jsonb DEFAULT '[]',
  
  -- Analysis metadata
  model_used text DEFAULT 'claude-sonnet-4-20250514',
  tokens_used integer,
  analysis_duration_ms integer,
  
  analyzed_at timestamp DEFAULT now(),
  created_at timestamp DEFAULT now()
);

-- Only keep latest analysis per page (can query historical if needed)
CREATE INDEX IF NOT EXISTS aio_analyses_page_idx ON aio_analyses(page_id);
CREATE INDEX IF NOT EXISTS aio_analyses_site_idx ON aio_analyses(site_id);
CREATE INDEX IF NOT EXISTS aio_analyses_analyzed_idx ON aio_analyses(analyzed_at);

-- ============================================
-- SITES TABLE: Add AIO aggregate scores
-- ============================================

ALTER TABLE sites ADD COLUMN IF NOT EXISTS aio_score_avg integer;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS aio_last_analyzed timestamp;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS aio_enabled boolean DEFAULT true;

-- ============================================
-- TRIGGER: Update site AIO averages
-- ============================================

CREATE OR REPLACE FUNCTION update_site_aio_score()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE sites 
  SET aio_score_avg = (
    SELECT ROUND(AVG(aio_score))
    FROM pages 
    WHERE site_id = NEW.site_id AND aio_score IS NOT NULL
  ),
  aio_last_analyzed = now()
  WHERE id = NEW.site_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_site_aio_score ON pages;
CREATE TRIGGER trigger_update_site_aio_score
  AFTER INSERT OR UPDATE OF aio_score ON pages
  FOR EACH ROW
  EXECUTE FUNCTION update_site_aio_score();

