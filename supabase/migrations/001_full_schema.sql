-- ============================================
-- CabbageSEO Full Schema Migration
-- Updated: February 2026
-- ============================================
-- This is the complete schema that matches the Drizzle ORM
-- definitions in src/lib/db/schema.ts
-- ============================================
-- WARNING: This drops ALL existing tables and recreates them.
-- Only run on a fresh database or when you want a full reset.
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- DROP EXISTING TABLES (reverse dependency order)
-- ============================================

DROP TABLE IF EXISTS teaser_subscribers CASCADE;
DROP TABLE IF EXISTS teaser_reports CASCADE;
DROP TABLE IF EXISTS generated_pages CASCADE;
DROP TABLE IF EXISTS referrals CASCADE;
DROP TABLE IF EXISTS monthly_checkpoints CASCADE;
DROP TABLE IF EXISTS sprint_actions CASCADE;
DROP TABLE IF EXISTS aio_analyses CASCADE;
DROP TABLE IF EXISTS market_share_snapshots CASCADE;
DROP TABLE IF EXISTS source_listings CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS competitors CASCADE;
DROP TABLE IF EXISTS geo_analyses CASCADE;
DROP TABLE IF EXISTS citations CASCADE;
DROP TABLE IF EXISTS entities CASCADE;
DROP TABLE IF EXISTS rankings CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS issues CASCADE;
DROP TABLE IF EXISTS audits CASCADE;
DROP TABLE IF EXISTS pages CASCADE;
DROP TABLE IF EXISTS content_ideas CASCADE;
DROP TABLE IF EXISTS content CASCADE;
DROP TABLE IF EXISTS keywords CASCADE;
DROP TABLE IF EXISTS keyword_clusters CASCADE;
DROP TABLE IF EXISTS integrations CASCADE;
DROP TABLE IF EXISTS usage CASCADE;
DROP TABLE IF EXISTS credit_balance CASCADE;
DROP TABLE IF EXISTS usage_events CASCADE;
DROP TABLE IF EXISTS usage_records CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS sites CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- ============================================
-- DROP EXISTING ENUMS
-- ============================================

DROP TYPE IF EXISTS generated_page_status CASCADE;
DROP TYPE IF EXISTS referral_status CASCADE;
DROP TYPE IF EXISTS sprint_action_status CASCADE;
DROP TYPE IF EXISTS integration_status CASCADE;
DROP TYPE IF EXISTS cms_type CASCADE;
DROP TYPE IF EXISTS issue_severity CASCADE;
DROP TYPE IF EXISTS issue_type CASCADE;
DROP TYPE IF EXISTS task_type CASCADE;
DROP TYPE IF EXISTS task_status CASCADE;
DROP TYPE IF EXISTS keyword_status CASCADE;
DROP TYPE IF EXISTS content_status CASCADE;
DROP TYPE IF EXISTS role CASCADE;
DROP TYPE IF EXISTS subscription_status CASCADE;
DROP TYPE IF EXISTS billing_interval CASCADE;
DROP TYPE IF EXISTS plan CASCADE;

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE plan AS ENUM ('free', 'scout', 'command', 'dominate');
CREATE TYPE billing_interval AS ENUM ('monthly', 'yearly');
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'trialing', 'paused');
CREATE TYPE role AS ENUM ('owner', 'admin', 'editor', 'viewer');
CREATE TYPE content_status AS ENUM ('idea', 'researching', 'writing', 'draft', 'review', 'approved', 'scheduled', 'published', 'updating');
CREATE TYPE keyword_status AS ENUM ('discovered', 'analyzed', 'clustered', 'queued', 'writing', 'published');
CREATE TYPE task_status AS ENUM ('pending', 'queued', 'running', 'completed', 'failed', 'canceled');
CREATE TYPE task_type AS ENUM ('research', 'cluster', 'write', 'optimize', 'publish', 'crawl', 'audit', 'refresh', 'link');
CREATE TYPE issue_type AS ENUM (
  'missing_meta_title', 'missing_meta_description', 'duplicate_title', 'thin_content',
  'broken_link', 'orphan_page', 'redirect_chain', 'slow_page', 'missing_h1',
  'multiple_h1', 'missing_alt', 'missing_schema',
  'aio_low_entity_density', 'aio_poor_answer_structure', 'aio_missing_faq',
  'aio_missing_howto', 'aio_weak_quotability', 'aio_missing_definitions',
  'aio_no_expert_attribution', 'aio_ambiguous_context', 'aio_stale_content'
);
CREATE TYPE issue_severity AS ENUM ('critical', 'warning', 'info');
CREATE TYPE cms_type AS ENUM ('wordpress', 'webflow', 'shopify', 'ghost', 'custom');
CREATE TYPE integration_status AS ENUM ('active', 'error', 'disconnected');
CREATE TYPE sprint_action_status AS ENUM ('pending', 'in_progress', 'completed', 'skipped');
CREATE TYPE referral_status AS ENUM ('pending', 'signed_up', 'converted', 'expired');
CREATE TYPE generated_page_status AS ENUM ('draft', 'published', 'archived');

-- ============================================
-- ORGANIZATIONS
-- ============================================

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,

  -- Billing (Dodo Payments)
  dodo_customer_id TEXT,
  dodo_subscription_id TEXT,
  dodo_product_id TEXT,
  plan plan NOT NULL DEFAULT 'free',
  billing_interval billing_interval DEFAULT 'monthly',
  subscription_status subscription_status DEFAULT 'trialing',
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,

  -- Add-ons
  autopilot_enabled BOOLEAN DEFAULT FALSE,

  -- Referral
  referral_code TEXT,
  referred_by TEXT,

  -- Settings
  settings JSONB DEFAULT '{}',
  brand_voice TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX org_slug_idx ON organizations(slug);

-- ============================================
-- USERS
-- ============================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Auth
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  email_verified BOOLEAN DEFAULT FALSE,

  -- Profile
  name TEXT,
  avatar_url TEXT,
  role role NOT NULL DEFAULT 'editor',

  -- OAuth
  google_id TEXT,

  -- Activity
  last_login_at TIMESTAMPTZ,
  last_active_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX user_email_idx ON users(email);
CREATE INDEX user_org_idx ON users(organization_id);

-- ============================================
-- SESSIONS
-- ============================================

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  user_agent TEXT,
  ip_address TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX session_token_idx ON sessions(token);

-- ============================================
-- USAGE RECORDS (Legacy billing periods)
-- ============================================

CREATE TABLE usage_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Period
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,

  -- Usage counts
  articles_generated INTEGER NOT NULL DEFAULT 0,
  keywords_analyzed INTEGER NOT NULL DEFAULT 0,
  serp_calls INTEGER NOT NULL DEFAULT 0,
  pages_crawled INTEGER NOT NULL DEFAULT 0,
  optimizations INTEGER NOT NULL DEFAULT 0,

  -- Limits
  articles_limit INTEGER NOT NULL,
  keywords_limit INTEGER NOT NULL,
  serp_calls_limit INTEGER NOT NULL,
  crawl_pages_limit INTEGER NOT NULL,

  -- On-Demand
  on_demand_enabled BOOLEAN DEFAULT TRUE,
  on_demand_spend_limit_cents INTEGER DEFAULT 30000,
  on_demand_spent_cents INTEGER DEFAULT 0,

  -- Overages
  overages_calculated BOOLEAN DEFAULT FALSE,
  overages_amount_cents INTEGER DEFAULT 0,
  overages_invoice_id TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX usage_org_period_idx ON usage_records(organization_id, period_start);

-- ============================================
-- USAGE EVENTS
-- ============================================

CREATE TABLE usage_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  usage_record_id UUID NOT NULL REFERENCES usage_records(id) ON DELETE CASCADE,

  -- Event details
  event_type TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,

  -- Cost tracking
  internal_cost_cents INTEGER NOT NULL,
  is_overage BOOLEAN DEFAULT FALSE,

  -- Context
  resource_id UUID,
  resource_type TEXT,
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX usage_event_org_idx ON usage_events(organization_id, created_at);

-- ============================================
-- CREDIT BALANCE
-- ============================================

CREATE TABLE credit_balance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,

  -- Credits
  prepaid_credits INTEGER NOT NULL DEFAULT 0,
  bonus_credits INTEGER NOT NULL DEFAULT 0,

  -- Expiration
  expires_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX credit_balance_org_idx ON credit_balance(organization_id);

-- ============================================
-- USAGE (Monthly AI visibility tracking)
-- ============================================

CREATE TABLE usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Period (YYYY-MM)
  period TEXT NOT NULL,

  -- AI Visibility Intelligence usage
  checks_used INTEGER DEFAULT 0,
  sites_used INTEGER DEFAULT 0,
  competitors_used INTEGER DEFAULT 0,

  -- Intelligence feature usage
  gap_analyses_used INTEGER DEFAULT 0,
  content_ideas_used INTEGER DEFAULT 0,
  action_plans_used INTEGER DEFAULT 0,

  -- Legacy usage counts
  articles_generated INTEGER DEFAULT 0,
  keywords_analyzed INTEGER DEFAULT 0,
  serp_calls INTEGER DEFAULT 0,
  pages_crawled INTEGER DEFAULT 0,
  aio_analyses INTEGER DEFAULT 0,

  -- Limits snapshot
  articles_limit INTEGER DEFAULT 0,
  keywords_limit INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX usage_org_idx ON usage(organization_id);
CREATE INDEX usage_period_idx ON usage(period);
CREATE UNIQUE INDEX usage_org_period_unique ON usage(organization_id, period);

-- ============================================
-- INTEGRATIONS
-- ============================================

CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  type TEXT NOT NULL,
  credentials JSONB NOT NULL DEFAULT '{}',
  status integration_status NOT NULL DEFAULT 'active',
  error TEXT,
  last_synced_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX integrations_org_idx ON integrations(organization_id);
CREATE INDEX integrations_type_idx ON integrations(type);
CREATE UNIQUE INDEX integrations_org_type_unique ON integrations(organization_id, type);

-- ============================================
-- SITES
-- ============================================

CREATE TABLE sites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Basic info
  domain TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',

  -- AI Visibility Intelligence - Core metrics
  total_citations INTEGER DEFAULT 0,
  citations_this_week INTEGER DEFAULT 0,
  citations_last_week INTEGER DEFAULT 0,
  last_checked_at TIMESTAMPTZ,
  geo_score_avg INTEGER,

  -- Custom queries & category
  category TEXT,
  custom_queries JSONB DEFAULT '[]',

  -- CMS Integration
  cms_type cms_type,
  cms_url TEXT,
  cms_credentials JSONB,
  cms_connected BOOLEAN DEFAULT FALSE,
  cms_last_sync TIMESTAMPTZ,

  -- GSC Integration
  gsc_connected BOOLEAN DEFAULT FALSE,
  gsc_property_url TEXT,
  gsc_credentials JSONB,
  gsc_last_sync TIMESTAMPTZ,

  -- Crawl state
  last_crawl_at TIMESTAMPTZ,
  last_crawl_pages_count INTEGER,

  -- Site settings
  settings JSONB DEFAULT '{}',
  brand_voice TEXT,
  target_audience TEXT,
  main_topics JSONB DEFAULT '[]',

  -- Autopilot
  autopilot_enabled BOOLEAN DEFAULT FALSE,
  autopilot_settings JSONB DEFAULT '{}',

  -- AIO
  aio_enabled BOOLEAN DEFAULT TRUE,
  aio_score_avg INTEGER,
  aio_last_analyzed TIMESTAMPTZ,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  -- Public profile
  public_profile_enabled BOOLEAN DEFAULT FALSE,
  public_profile_bio TEXT,

  -- 30-Day Sprint
  sprint_started_at TIMESTAMPTZ,
  sprint_completed_at TIMESTAMPTZ,

  -- Momentum tracking
  momentum_score INTEGER DEFAULT 0,
  momentum_change INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX site_org_idx ON sites(organization_id);
CREATE INDEX site_domain_idx ON sites(domain);

-- ============================================
-- KEYWORD CLUSTERS
-- ============================================

CREATE TABLE keyword_clusters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,
  pillar_keyword TEXT,

  total_volume INTEGER DEFAULT 0,
  avg_difficulty DECIMAL(5,2),
  keyword_count INTEGER DEFAULT 0,

  suggested_articles INTEGER,
  published_articles INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX cluster_site_idx ON keyword_clusters(site_id);

-- ============================================
-- KEYWORDS
-- ============================================

CREATE TABLE keywords (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  cluster_id UUID REFERENCES keyword_clusters(id) ON DELETE SET NULL,

  keyword TEXT NOT NULL,
  volume INTEGER,
  difficulty INTEGER,
  cpc DECIMAL(10,2),

  intent TEXT,
  category TEXT,

  serp_features JSONB DEFAULT '[]',
  serp_last_fetched TIMESTAMPTZ,

  current_position DECIMAL(5,2),
  previous_position DECIMAL(5,2),
  impressions INTEGER,
  clicks INTEGER,
  ctr DECIMAL(5,4),
  ranking_url TEXT,
  ranking_last_updated TIMESTAMPTZ,

  status keyword_status DEFAULT 'discovered',
  priority INTEGER DEFAULT 50,

  content_id UUID,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX keyword_site_idx ON keywords(site_id);
CREATE INDEX keyword_cluster_idx ON keywords(cluster_id);
CREATE INDEX keyword_status_idx ON keywords(status);
CREATE INDEX keywords_content_id_idx ON keywords(content_id);

-- ============================================
-- CONTENT
-- ============================================

CREATE TABLE content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  keyword_id UUID REFERENCES keywords(id) ON DELETE SET NULL,
  cluster_id UUID REFERENCES keyword_clusters(id) ON DELETE SET NULL,

  title TEXT NOT NULL,
  slug TEXT,
  meta_title TEXT,
  meta_description TEXT,
  body TEXT,
  body_format TEXT DEFAULT 'html',
  excerpt TEXT,

  outline JSONB,
  table_of_contents JSONB,

  schema_markup JSONB,
  has_faq_schema BOOLEAN DEFAULT FALSE,
  has_how_to_schema BOOLEAN DEFAULT FALSE,
  has_article_schema BOOLEAN DEFAULT FALSE,

  internal_links JSONB DEFAULT '[]',
  suggested_internal_links JSONB DEFAULT '[]',

  word_count INTEGER,
  reading_time INTEGER,

  seo_score INTEGER,
  readability_score INTEGER,
  keyword_density DECIMAL(5,4),

  featured_image TEXT,
  images JSONB DEFAULT '[]',

  status content_status DEFAULT 'idea',
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,

  published_url TEXT,
  published_at TIMESTAMPTZ,
  cms_post_id TEXT,
  scheduled_for TIMESTAMPTZ,

  version INTEGER DEFAULT 1,
  last_edited_by UUID REFERENCES users(id) ON DELETE SET NULL,

  ai_model TEXT,
  ai_prompt_version TEXT,

  aio_optimized BOOLEAN DEFAULT FALSE,
  aio_score INTEGER,
  entity_count INTEGER DEFAULT 0,
  quotability_score INTEGER,
  answer_structure_score INTEGER,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX content_site_idx ON content(site_id);
CREATE INDEX content_status_idx ON content(status);
CREATE INDEX content_keyword_idx ON content(keyword_id);

-- ============================================
-- CONTENT IDEAS
-- ============================================

CREATE TABLE content_ideas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  description TEXT,
  target_keyword TEXT,
  search_volume INTEGER,
  difficulty INTEGER,

  type TEXT,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'idea',
  content_id UUID,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX content_ideas_site_idx ON content_ideas(site_id);
CREATE INDEX content_ideas_status_idx ON content_ideas(status);

-- ============================================
-- PAGES (Crawled)
-- ============================================

CREATE TABLE pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,

  url TEXT NOT NULL,
  path TEXT NOT NULL,

  title TEXT,
  meta_description TEXT,
  h1 TEXT,
  headings JSONB,
  word_count INTEGER,

  internal_links_out JSONB DEFAULT '[]',
  internal_links_in INTEGER DEFAULT 0,
  external_links JSONB DEFAULT '[]',

  status_code INTEGER,
  canonical_url TEXT,
  robots_directive TEXT,

  schema_types JSONB DEFAULT '[]',

  performance_score INTEGER,
  lcp_ms INTEGER,
  cls DECIMAL(5,4),

  is_indexed BOOLEAN,
  indexed_at TIMESTAMPTZ,

  content_type TEXT,
  content_id UUID REFERENCES content(id) ON DELETE SET NULL,

  aio_score INTEGER,
  aio_google_score INTEGER,
  aio_chatgpt_score INTEGER,
  aio_perplexity_score INTEGER,
  aio_claude_score INTEGER,
  aio_gemini_score INTEGER,
  aio_last_analyzed TIMESTAMPTZ,

  entity_count INTEGER DEFAULT 0,
  quotability_score INTEGER,
  answer_structure_score INTEGER,
  has_expert_attribution BOOLEAN DEFAULT FALSE,

  last_crawled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX page_site_idx ON pages(site_id);
CREATE INDEX page_url_idx ON pages(url);

-- ============================================
-- AUDITS
-- ============================================

CREATE TABLE audits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,

  type TEXT NOT NULL DEFAULT 'full',

  overall_score INTEGER,
  technical_score INTEGER,
  content_score INTEGER,
  aio_score INTEGER,

  pages_scanned INTEGER DEFAULT 0,
  issues_found INTEGER DEFAULT 0,
  critical_issues INTEGER DEFAULT 0,
  warning_issues INTEGER DEFAULT 0,
  info_issues INTEGER DEFAULT 0,

  duration_ms INTEGER,
  status TEXT DEFAULT 'completed',
  error TEXT,

  results JSONB DEFAULT '{}',

  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX audits_site_idx ON audits(site_id);
CREATE INDEX audits_created_idx ON audits(created_at);

-- ============================================
-- ISSUES
-- ============================================

CREATE TABLE issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  page_id UUID REFERENCES pages(id) ON DELETE CASCADE,

  type issue_type NOT NULL,
  severity issue_severity NOT NULL,

  title TEXT NOT NULL,
  description TEXT,
  recommendation TEXT,

  affected_url TEXT,
  affected_element TEXT,
  current_value TEXT,
  suggested_value TEXT,

  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,

  can_auto_fix BOOLEAN DEFAULT FALSE,
  auto_fix_applied BOOLEAN DEFAULT FALSE,

  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX issue_site_idx ON issues(site_id);
CREATE INDEX issue_severity_idx ON issues(severity);

-- ============================================
-- TASKS
-- ============================================

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  type task_type NOT NULL,
  name TEXT NOT NULL,
  description TEXT,

  target_id UUID,
  target_type TEXT,

  status task_status DEFAULT 'pending',
  priority INTEGER DEFAULT 50,

  scheduled_for TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  result JSONB,
  error TEXT,

  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  last_attempt_at TIMESTAMPTZ,

  triggered_by TEXT,
  triggered_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  is_autopilot BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX task_site_idx ON tasks(site_id);
CREATE INDEX task_status_idx ON tasks(status);
CREATE INDEX task_scheduled_idx ON tasks(scheduled_for);

-- ============================================
-- RANKINGS
-- ============================================

CREATE TABLE rankings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  keyword_id UUID REFERENCES keywords(id) ON DELETE CASCADE,
  content_id UUID REFERENCES content(id) ON DELETE SET NULL,

  keyword TEXT NOT NULL,
  url TEXT NOT NULL,

  position DECIMAL(5,2),
  impressions INTEGER,
  clicks INTEGER,
  ctr DECIMAL(5,4),

  date TIMESTAMPTZ NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ranking_site_date_idx ON rankings(site_id, date);
CREATE INDEX ranking_keyword_idx ON rankings(keyword_id);

-- ============================================
-- ENTITIES
-- ============================================

CREATE TABLE entities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
  content_id UUID REFERENCES content(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  type TEXT,
  description TEXT,

  wikidata_id TEXT,
  wikipedia_url TEXT,

  mentions INTEGER DEFAULT 1,
  context_quality INTEGER,

  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX entities_site_idx ON entities(site_id);
CREATE INDEX entities_page_idx ON entities(page_id);
CREATE INDEX entities_content_idx ON entities(content_id);
CREATE INDEX entities_type_idx ON entities(type);

-- ============================================
-- CITATIONS
-- ============================================

CREATE TABLE citations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  page_id UUID REFERENCES pages(id) ON DELETE CASCADE,

  platform TEXT NOT NULL,
  query TEXT NOT NULL,

  snippet TEXT,
  confidence TEXT DEFAULT 'medium',
  source_domain TEXT,

  cited_at TIMESTAMPTZ DEFAULT NOW(),
  last_verified_at TIMESTAMPTZ
);

CREATE INDEX citations_site_idx ON citations(site_id);
CREATE INDEX citations_platform_idx ON citations(platform);
CREATE INDEX citations_page_idx ON citations(page_id);
CREATE UNIQUE INDEX citations_unique_idx ON citations(site_id, platform, query);

-- ============================================
-- GEO ANALYSES
-- ============================================

CREATE TABLE geo_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  score JSONB NOT NULL,
  tips JSONB DEFAULT '[]',
  queries JSONB DEFAULT '[]',
  opportunities JSONB DEFAULT '[]',
  raw_data JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX geo_analyses_site_idx ON geo_analyses(site_id);
CREATE INDEX geo_analyses_created_idx ON geo_analyses(created_at);

-- ============================================
-- COMPETITORS
-- ============================================

CREATE TABLE competitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,

  domain TEXT NOT NULL,
  name TEXT,

  total_citations INTEGER DEFAULT 0,
  citations_this_week INTEGER DEFAULT 0,
  citations_change INTEGER DEFAULT 0,

  last_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX competitors_site_idx ON competitors(site_id);
CREATE UNIQUE INDEX competitors_site_domain_unique ON competitors(site_id, domain);

-- ============================================
-- NOTIFICATIONS
-- ============================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,

  email_new_citation BOOLEAN DEFAULT TRUE,
  email_lost_citation BOOLEAN DEFAULT TRUE,
  email_weekly_digest BOOLEAN DEFAULT TRUE,
  email_competitor_cited BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX notifications_user_unique ON notifications(user_id);

-- ============================================
-- SOURCE LISTINGS
-- ============================================

CREATE TABLE source_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,

  source_domain TEXT NOT NULL,
  source_name TEXT NOT NULL,
  profile_url TEXT,

  status TEXT DEFAULT 'pending',

  listed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX source_listings_site_idx ON source_listings(site_id);
CREATE UNIQUE INDEX source_listings_unique_idx ON source_listings(site_id, source_domain);

-- ============================================
-- MARKET SHARE SNAPSHOTS
-- ============================================

CREATE TABLE market_share_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,

  market_share INTEGER NOT NULL,
  total_queries INTEGER DEFAULT 0,
  queries_won INTEGER DEFAULT 0,
  queries_lost INTEGER DEFAULT 0,

  snapshot_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX market_share_site_idx ON market_share_snapshots(site_id);
CREATE INDEX market_share_date_idx ON market_share_snapshots(snapshot_date);

-- ============================================
-- AIO ANALYSES
-- ============================================

CREATE TABLE aio_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,

  version INTEGER DEFAULT 1,

  google_aio_score INTEGER,
  chatgpt_score INTEGER,
  perplexity_score INTEGER,
  claude_score INTEGER,
  gemini_score INTEGER,
  combined_score INTEGER,

  entity_density_score INTEGER,
  quotability_score INTEGER,
  answer_structure_score INTEGER,
  schema_presence_score INTEGER,
  freshness_score INTEGER,
  authority_score INTEGER,

  entities_found JSONB DEFAULT '[]',
  quotable_snippets JSONB DEFAULT '[]',
  missing_elements JSONB DEFAULT '[]',
  improvement_suggestions JSONB DEFAULT '[]',

  google_recommendations JSONB DEFAULT '[]',
  chatgpt_recommendations JSONB DEFAULT '[]',
  perplexity_recommendations JSONB DEFAULT '[]',

  model_used TEXT DEFAULT 'claude-sonnet-4-20250514',
  tokens_used INTEGER,
  analysis_duration_ms INTEGER,

  analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX aio_analyses_page_idx ON aio_analyses(page_id);
CREATE INDEX aio_analyses_site_idx ON aio_analyses(site_id);
CREATE INDEX aio_analyses_analyzed_idx ON aio_analyses(analyzed_at);

-- ============================================
-- SPRINT ACTIONS (30-day sprint progress)
-- ============================================

CREATE TABLE sprint_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,

  action_type TEXT NOT NULL,
  action_title TEXT NOT NULL,
  action_description TEXT,
  action_url TEXT,

  priority INTEGER DEFAULT 5,
  estimated_minutes INTEGER DEFAULT 60,
  week INTEGER DEFAULT 1,

  status sprint_action_status DEFAULT 'pending',

  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX sprint_actions_site_idx ON sprint_actions(site_id);
CREATE INDEX sprint_actions_status_idx ON sprint_actions(status);

-- ============================================
-- MONTHLY CHECKPOINTS (churn prevention)
-- ============================================

CREATE TABLE monthly_checkpoints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  period TEXT NOT NULL,

  momentum_score INTEGER DEFAULT 0,
  momentum_change INTEGER DEFAULT 0,

  new_queries JSONB DEFAULT '[]',
  lost_queries JSONB DEFAULT '[]',
  competitor_changes JSONB DEFAULT '[]',

  top_action TEXT,
  report_data JSONB DEFAULT '{}',

  email_sent_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX monthly_checkpoints_site_idx ON monthly_checkpoints(site_id);
CREATE INDEX monthly_checkpoints_period_idx ON monthly_checkpoints(period);
CREATE UNIQUE INDEX monthly_checkpoints_unique ON monthly_checkpoints(site_id, period);

-- ============================================
-- REFERRALS
-- ============================================

CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  referred_email TEXT,
  referred_organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  status referral_status DEFAULT 'pending',
  reward_applied BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  converted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX referrals_code_idx ON referrals(referral_code);
CREATE INDEX referrals_referrer_idx ON referrals(referrer_organization_id);
CREATE INDEX referrals_referred_org_idx ON referrals(referred_organization_id);

-- ============================================
-- GENERATED PAGES (AI Page Generator)
-- ============================================

CREATE TABLE generated_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  query TEXT NOT NULL,
  title TEXT NOT NULL,
  meta_description TEXT,
  body TEXT NOT NULL,
  schema_markup JSONB DEFAULT '{}',
  target_entities JSONB DEFAULT '[]',
  competitors_analyzed JSONB DEFAULT '[]',
  word_count INTEGER,

  status generated_page_status DEFAULT 'draft',
  published_url TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX generated_pages_site_idx ON generated_pages(site_id);
CREATE INDEX generated_pages_query_idx ON generated_pages(query);

-- ============================================
-- TEASER REPORTS (Shareable free scan results)
-- ============================================

CREATE TABLE teaser_reports (
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

CREATE INDEX teaser_reports_domain_idx ON teaser_reports(domain);
CREATE INDEX teaser_reports_created_idx ON teaser_reports(created_at);

-- ============================================
-- TEASER SUBSCRIBERS (Score change notifications)
-- ============================================

CREATE TABLE teaser_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  domain TEXT NOT NULL,
  report_id UUID,
  unsubscribed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX teaser_subscribers_domain_idx ON teaser_subscribers(domain);
CREATE INDEX teaser_subscribers_email_idx ON teaser_subscribers(email);

-- ============================================
-- KEYWORDS → CONTENT FK (added after both tables exist)
-- ============================================

-- Add FK from keywords.content_id to content.id
ALTER TABLE keywords ADD CONSTRAINT keywords_content_id_fkey
  FOREIGN KEY (content_id) REFERENCES content(id) ON DELETE SET NULL;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyword_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE geo_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_share_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE aio_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE sprint_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_pages ENABLE ROW LEVEL SECURITY;
-- teaser_reports and teaser_subscribers are public (no auth), accessed via service client only

-- ============================================
-- RLS POLICIES - Organization-scoped access
-- ============================================
-- PostgreSQL doesn't support CREATE POLICY IF NOT EXISTS,
-- so we DROP then CREATE each policy.

-- Helper: Get current user's organization_id
-- Usage: auth.uid() → users.organization_id → filter by org

-- Organizations: users can see their own org
DROP POLICY IF EXISTS "Users can view own organization" ON organizations;
CREATE POLICY "Users can view own organization"
  ON organizations FOR SELECT
  USING (id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update own organization" ON organizations;
CREATE POLICY "Users can update own organization"
  ON organizations FOR UPDATE
  USING (id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

-- Users: users can see members of their org
DROP POLICY IF EXISTS "Users can view org members" ON users;
CREATE POLICY "Users can view org members"
  ON users FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (id = auth.uid());

-- Sessions: users can manage own sessions
DROP POLICY IF EXISTS "Users can manage own sessions" ON sessions;
CREATE POLICY "Users can manage own sessions"
  ON sessions FOR ALL
  USING (user_id = auth.uid());

-- Sites: org-scoped
DROP POLICY IF EXISTS "Users can view org sites" ON sites;
CREATE POLICY "Users can view org sites"
  ON sites FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert org sites" ON sites;
CREATE POLICY "Users can insert org sites"
  ON sites FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update org sites" ON sites;
CREATE POLICY "Users can update org sites"
  ON sites FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete org sites" ON sites;
CREATE POLICY "Users can delete org sites"
  ON sites FOR DELETE
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

-- Citations: site-scoped (through org)
DROP POLICY IF EXISTS "Users can view org citations" ON citations;
CREATE POLICY "Users can view org citations"
  ON citations FOR ALL
  USING (site_id IN (SELECT id FROM sites WHERE organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())));

-- Competitors: site-scoped
DROP POLICY IF EXISTS "Users can manage org competitors" ON competitors;
CREATE POLICY "Users can manage org competitors"
  ON competitors FOR ALL
  USING (site_id IN (SELECT id FROM sites WHERE organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())));

-- GEO Analyses: org-scoped
DROP POLICY IF EXISTS "Users can manage org geo analyses" ON geo_analyses;
CREATE POLICY "Users can manage org geo analyses"
  ON geo_analyses FOR ALL
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

-- Source Listings: site-scoped
DROP POLICY IF EXISTS "Users can manage org source listings" ON source_listings;
CREATE POLICY "Users can manage org source listings"
  ON source_listings FOR ALL
  USING (site_id IN (SELECT id FROM sites WHERE organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())));

-- Market Share Snapshots: site-scoped
DROP POLICY IF EXISTS "Users can view org market share" ON market_share_snapshots;
CREATE POLICY "Users can view org market share"
  ON market_share_snapshots FOR ALL
  USING (site_id IN (SELECT id FROM sites WHERE organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())));

-- Sprint Actions: site-scoped
DROP POLICY IF EXISTS "Users can manage org sprint actions" ON sprint_actions;
CREATE POLICY "Users can manage org sprint actions"
  ON sprint_actions FOR ALL
  USING (site_id IN (SELECT id FROM sites WHERE organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())));

-- Monthly Checkpoints: org-scoped
DROP POLICY IF EXISTS "Users can view org checkpoints" ON monthly_checkpoints;
CREATE POLICY "Users can view org checkpoints"
  ON monthly_checkpoints FOR ALL
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

-- Referrals: org-scoped (referrer can see their referrals)
DROP POLICY IF EXISTS "Users can manage org referrals" ON referrals;
CREATE POLICY "Users can manage org referrals"
  ON referrals FOR ALL
  USING (referrer_organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

-- Usage: org-scoped
DROP POLICY IF EXISTS "Users can view org usage" ON usage;
CREATE POLICY "Users can view org usage"
  ON usage FOR ALL
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

-- Usage Records: org-scoped
DROP POLICY IF EXISTS "Users can view org usage records" ON usage_records;
CREATE POLICY "Users can view org usage records"
  ON usage_records FOR ALL
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

-- Usage Events: org-scoped
DROP POLICY IF EXISTS "Users can view org usage events" ON usage_events;
CREATE POLICY "Users can view org usage events"
  ON usage_events FOR ALL
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

-- Credit Balance: org-scoped
DROP POLICY IF EXISTS "Users can view org credit balance" ON credit_balance;
CREATE POLICY "Users can view org credit balance"
  ON credit_balance FOR ALL
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

-- Integrations: org-scoped
DROP POLICY IF EXISTS "Users can manage org integrations" ON integrations;
CREATE POLICY "Users can manage org integrations"
  ON integrations FOR ALL
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

-- Notifications: user-scoped
DROP POLICY IF EXISTS "Users can manage own notifications" ON notifications;
CREATE POLICY "Users can manage own notifications"
  ON notifications FOR ALL
  USING (user_id = auth.uid());

-- Keyword clusters: site-scoped
DROP POLICY IF EXISTS "Users can manage org keyword clusters" ON keyword_clusters;
CREATE POLICY "Users can manage org keyword clusters"
  ON keyword_clusters FOR ALL
  USING (site_id IN (SELECT id FROM sites WHERE organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())));

-- Keywords: site-scoped
DROP POLICY IF EXISTS "Users can manage org keywords" ON keywords;
CREATE POLICY "Users can manage org keywords"
  ON keywords FOR ALL
  USING (site_id IN (SELECT id FROM sites WHERE organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())));

-- Content: site-scoped
DROP POLICY IF EXISTS "Users can manage org content" ON content;
CREATE POLICY "Users can manage org content"
  ON content FOR ALL
  USING (site_id IN (SELECT id FROM sites WHERE organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())));

-- Content Ideas: site-scoped
DROP POLICY IF EXISTS "Users can manage org content ideas" ON content_ideas;
CREATE POLICY "Users can manage org content ideas"
  ON content_ideas FOR ALL
  USING (site_id IN (SELECT id FROM sites WHERE organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())));

-- Pages: site-scoped
DROP POLICY IF EXISTS "Users can manage org pages" ON pages;
CREATE POLICY "Users can manage org pages"
  ON pages FOR ALL
  USING (site_id IN (SELECT id FROM sites WHERE organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())));

-- Audits: site-scoped
DROP POLICY IF EXISTS "Users can manage org audits" ON audits;
CREATE POLICY "Users can manage org audits"
  ON audits FOR ALL
  USING (site_id IN (SELECT id FROM sites WHERE organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())));

-- Issues: site-scoped
DROP POLICY IF EXISTS "Users can manage org issues" ON issues;
CREATE POLICY "Users can manage org issues"
  ON issues FOR ALL
  USING (site_id IN (SELECT id FROM sites WHERE organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())));

-- Tasks: org-scoped
DROP POLICY IF EXISTS "Users can manage org tasks" ON tasks;
CREATE POLICY "Users can manage org tasks"
  ON tasks FOR ALL
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

-- Rankings: site-scoped
DROP POLICY IF EXISTS "Users can manage org rankings" ON rankings;
CREATE POLICY "Users can manage org rankings"
  ON rankings FOR ALL
  USING (site_id IN (SELECT id FROM sites WHERE organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())));

-- Entities: site-scoped
DROP POLICY IF EXISTS "Users can manage org entities" ON entities;
CREATE POLICY "Users can manage org entities"
  ON entities FOR ALL
  USING (site_id IN (SELECT id FROM sites WHERE organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())));

-- AIO Analyses: site-scoped
DROP POLICY IF EXISTS "Users can manage org aio analyses" ON aio_analyses;
CREATE POLICY "Users can manage org aio analyses"
  ON aio_analyses FOR ALL
  USING (site_id IN (SELECT id FROM sites WHERE organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())));

-- Generated Pages: site-scoped
DROP POLICY IF EXISTS "Users can manage org generated pages" ON generated_pages;
CREATE POLICY "Users can manage org generated pages"
  ON generated_pages FOR ALL
  USING (site_id IN (SELECT id FROM sites WHERE organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())));

-- ============================================
-- SERVICE ROLE BYPASS
-- ============================================
-- The service role (used by createServiceClient) bypasses RLS automatically.
-- No additional policies needed for server-side operations.

-- ============================================
-- PUBLIC REPORT ACCESS (for shareable reports)
-- ============================================

-- Allow public read access to sites with public_profile_enabled
DROP POLICY IF EXISTS "Public can view public profiles" ON sites;
CREATE POLICY "Public can view public profiles"
  ON sites FOR SELECT
  USING (public_profile_enabled = TRUE);

-- Allow public read of citations for public sites
DROP POLICY IF EXISTS "Public can view public site citations" ON citations;
CREATE POLICY "Public can view public site citations"
  ON citations FOR SELECT
  USING (site_id IN (SELECT id FROM sites WHERE public_profile_enabled = TRUE));

-- Allow public read of market share for public sites
DROP POLICY IF EXISTS "Public can view public site market share" ON market_share_snapshots;
CREATE POLICY "Public can view public site market share"
  ON market_share_snapshots FOR SELECT
  USING (site_id IN (SELECT id FROM sites WHERE public_profile_enabled = TRUE));

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables with updated_at column
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN
    SELECT table_name FROM information_schema.columns
    WHERE column_name = 'updated_at'
    AND table_schema = 'public'
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS update_%I_updated_at ON %I;
      CREATE TRIGGER update_%I_updated_at
        BEFORE UPDATE ON %I
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    ', t, t, t, t);
  END LOOP;
END $$;
