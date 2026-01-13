-- ============================================
-- CABBAGESEO TEST ACCOUNTS SETUP
-- ============================================
-- Run this in Supabase SQL Editor to create test accounts
-- for each pricing tier to verify all features work.
--
-- After running this, you can log in with these test accounts
-- to verify each tier's features work correctly.
-- ============================================

-- ============================================
-- STEP 1: Create Test Organizations
-- ============================================

-- Free tier test org
INSERT INTO organizations (id, name, slug, plan, subscription_status, trial_ends_at, created_at)
VALUES (
  'test-org-free-0001-0001-000000000001',
  'Test Free Org',
  'test-free',
  'free',
  'active',
  NULL,
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  plan = 'free',
  subscription_status = 'active';

-- Starter tier test org  
INSERT INTO organizations (id, name, slug, plan, subscription_status, trial_ends_at, created_at)
VALUES (
  'test-org-star-0002-0002-000000000002',
  'Test Starter Org',
  'test-starter',
  'starter',
  'active',
  NULL,
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  plan = 'starter',
  subscription_status = 'active';

-- Pro tier test org
INSERT INTO organizations (id, name, slug, plan, subscription_status, trial_ends_at, created_at)
VALUES (
  'test-org-pro0-0003-0003-000000000003',
  'Test Pro Org',
  'test-pro',
  'pro',
  'active',
  NULL,
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  plan = 'pro',
  subscription_status = 'active';

-- ============================================
-- STEP 2: Create Test Sites for Each Org
-- ============================================

-- Free org site
INSERT INTO sites (id, organization_id, domain, category, created_at)
VALUES (
  'test-site-free-0001-0001-000000000001',
  'test-org-free-0001-0001-000000000001',
  'free-test-site.com',
  'saas',
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Starter org sites (3 sites allowed)
INSERT INTO sites (id, organization_id, domain, category, created_at)
VALUES 
  ('test-site-star-0001-0001-000000000001', 'test-org-star-0002-0002-000000000002', 'starter-test-1.com', 'saas', NOW()),
  ('test-site-star-0002-0002-000000000002', 'test-org-star-0002-0002-000000000002', 'starter-test-2.com', 'ecommerce', NOW()),
  ('test-site-star-0003-0003-000000000003', 'test-org-star-0002-0002-000000000002', 'starter-test-3.com', 'agency', NOW())
ON CONFLICT (id) DO NOTHING;

-- Pro org sites (10 sites allowed)
INSERT INTO sites (id, organization_id, domain, category, created_at)
VALUES 
  ('test-site-pro0-0001-0001-000000000001', 'test-org-pro0-0003-0003-000000000003', 'pro-test-1.com', 'saas', NOW()),
  ('test-site-pro0-0002-0002-000000000002', 'test-org-pro0-0003-0003-000000000003', 'pro-test-2.com', 'fintech', NOW()),
  ('test-site-pro0-0003-0003-000000000003', 'test-org-pro0-0003-0003-000000000003', 'pro-test-3.com', 'healthtech', NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STEP 3: Create Test Competitors
-- ============================================

-- Starter org competitors (2 per site allowed)
INSERT INTO competitors (id, site_id, domain, created_at)
VALUES 
  ('test-comp-star-0001-0001-000000000001', 'test-site-star-0001-0001-000000000001', 'competitor-a.com', NOW()),
  ('test-comp-star-0002-0002-000000000002', 'test-site-star-0001-0001-000000000001', 'competitor-b.com', NOW())
ON CONFLICT (id) DO NOTHING;

-- Pro org competitors (10 per site allowed)
INSERT INTO competitors (id, site_id, domain, created_at)
VALUES 
  ('test-comp-pro0-0001-0001-000000000001', 'test-site-pro0-0001-0001-000000000001', 'pro-competitor-1.com', NOW()),
  ('test-comp-pro0-0002-0002-000000000002', 'test-site-pro0-0001-0001-000000000001', 'pro-competitor-2.com', NOW()),
  ('test-comp-pro0-0003-0003-000000000003', 'test-site-pro0-0001-0001-000000000001', 'pro-competitor-3.com', NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STEP 4: Create Usage Records
-- ============================================

-- Create usage records for current month
INSERT INTO usage (id, organization_id, period, checks_used, gap_analyses_used, content_ideas_used, action_plans_used, created_at)
VALUES 
  ('test-usage-free-0001-000000000001', 'test-org-free-0001-0001-000000000001', TO_CHAR(NOW(), 'YYYY-MM'), 0, 0, 0, 0, NOW()),
  ('test-usage-star-0002-000000000002', 'test-org-star-0002-0002-000000000002', TO_CHAR(NOW(), 'YYYY-MM'), 10, 2, 1, 0, NOW()),
  ('test-usage-pro0-0003-000000000003', 'test-org-pro0-0003-0003-000000000003', TO_CHAR(NOW(), 'YYYY-MM'), 50, 5, 3, 2, NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STEP 5: Create Sample Citations (for Pro/Starter)
-- ============================================

INSERT INTO citations (id, site_id, platform, query, cited, snippet, confidence, checked_at, created_at)
VALUES 
  -- Starter site citations
  ('test-cite-star-0001-000000000001', 'test-site-star-0001-0001-000000000001', 'perplexity', 'best saas tools 2026', true, 'starter-test-1.com is a great option for...', 'high', NOW(), NOW()),
  ('test-cite-star-0002-000000000002', 'test-site-star-0001-0001-000000000001', 'chatgpt', 'top business software', false, 'Competitors like Notion and Slack...', 'medium', NOW(), NOW()),
  
  -- Pro site citations  
  ('test-cite-pro0-0001-000000000001', 'test-site-pro0-0001-0001-000000000001', 'perplexity', 'best project management', true, 'pro-test-1.com offers excellent features...', 'high', NOW(), NOW()),
  ('test-cite-pro0-0002-000000000002', 'test-site-pro0-0001-0001-000000000001', 'google_ai', 'enterprise solutions', true, 'For enterprise needs, pro-test-1.com...', 'high', NOW(), NOW()),
  ('test-cite-pro0-0003-000000000003', 'test-site-pro0-0001-0001-000000000001', 'chatgpt', 'software alternatives', false, 'Popular alternatives include...', 'low', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- VERIFICATION QUERY
-- ============================================

SELECT 
  'Organizations' as entity,
  COUNT(*) as count,
  STRING_AGG(name || ' (' || plan || ')', ', ') as details
FROM organizations
WHERE id LIKE 'test-%'

UNION ALL

SELECT 
  'Sites' as entity,
  COUNT(*) as count,
  STRING_AGG(domain, ', ') as details
FROM sites
WHERE id LIKE 'test-%'

UNION ALL

SELECT 
  'Competitors' as entity,
  COUNT(*) as count,
  STRING_AGG(domain, ', ') as details
FROM competitors
WHERE id LIKE 'test-%'

UNION ALL

SELECT 
  'Citations' as entity,
  COUNT(*) as count,
  STRING_AGG(query, ', ') as details
FROM citations
WHERE id LIKE 'test-%';

-- ============================================
-- NOTES
-- ============================================
-- 
-- To create actual user accounts for testing, you need to:
-- 1. Sign up at https://cabbageseo.com/signup with these emails:
--    - test-free@example.com
--    - test-starter@example.com  
--    - test-pro@example.com
--
-- 2. Then link them to the test organizations by running:
--    UPDATE users SET organization_id = 'test-org-free-0001-0001-000000000001'
--    WHERE email = 'test-free@example.com';
--
-- 3. Repeat for each tier.
-- ============================================

