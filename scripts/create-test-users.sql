-- ============================================
-- CREATE TEST USERS FOR EACH PRICING TIER
-- ============================================
-- Run this in Supabase SQL Editor
-- This creates 3 test orgs with different plans
-- so you can test all features without paying
-- ============================================

-- Step 1: Create test organizations
INSERT INTO organizations (id, name, slug, plan, subscription_status, created_at)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Test Free Org', 'test-free', 'free', 'active', NOW()),
  ('22222222-2222-2222-2222-222222222222', 'Test Starter Org', 'test-starter', 'starter', 'active', NOW()),
  ('33333333-3333-3333-3333-333333333333', 'Test Pro Org', 'test-pro', 'pro', 'active', NOW())
ON CONFLICT (id) DO UPDATE SET
  plan = EXCLUDED.plan,
  subscription_status = EXCLUDED.subscription_status;

-- Step 2: Create test sites for each org
INSERT INTO sites (id, organization_id, domain, category, created_at)
VALUES 
  -- Free org site
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'notion.com', 'productivity', NOW()),
  
  -- Starter org sites (3 allowed)
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01', '22222222-2222-2222-2222-222222222222', 'notion.com', 'productivity', NOW()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb02', '22222222-2222-2222-2222-222222222222', 'slack.com', 'productivity', NOW()),
  
  -- Pro org sites (10 allowed)
  ('cccccccc-cccc-cccc-cccc-cccccccccc01', '33333333-3333-3333-3333-333333333333', 'notion.com', 'productivity', NOW()),
  ('cccccccc-cccc-cccc-cccc-cccccccccc02', '33333333-3333-3333-3333-333333333333', 'slack.com', 'productivity', NOW()),
  ('cccccccc-cccc-cccc-cccc-cccccccccc03', '33333333-3333-3333-3333-333333333333', 'figma.com', 'design', NOW())
ON CONFLICT (id) DO NOTHING;

-- Step 3: Create competitors for starter and pro
INSERT INTO competitors (id, site_id, domain, created_at)
VALUES 
  -- Starter competitors (2 per site allowed)
  ('dddddddd-dddd-dddd-dddd-dddddddddd01', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01', 'evernote.com', NOW()),
  ('dddddddd-dddd-dddd-dddd-dddddddddd02', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01', 'obsidian.md', NOW()),
  
  -- Pro competitors (10 per site allowed)
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee01', 'cccccccc-cccc-cccc-cccc-cccccccccc01', 'evernote.com', NOW()),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee02', 'cccccccc-cccc-cccc-cccc-cccccccccc01', 'obsidian.md', NOW()),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee03', 'cccccccc-cccc-cccc-cccc-cccccccccc01', 'coda.io', NOW()),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee04', 'cccccccc-cccc-cccc-cccc-cccccccccc01', 'craft.do', NOW())
ON CONFLICT (id) DO NOTHING;

-- Step 4: Create usage records (current month)
INSERT INTO usage (id, organization_id, period, checks_used, gap_analyses_used, content_ideas_used, action_plans_used, created_at)
VALUES 
  ('f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1', '11111111-1111-1111-1111-111111111111', TO_CHAR(NOW(), 'YYYY-MM'), 0, 0, 0, 0, NOW()),
  ('f2f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f2f2', '22222222-2222-2222-2222-222222222222', TO_CHAR(NOW(), 'YYYY-MM'), 0, 0, 0, 0, NOW()),
  ('f3f3f3f3-f3f3-f3f3-f3f3-f3f3f3f3f3f3', '33333333-3333-3333-3333-333333333333', TO_CHAR(NOW(), 'YYYY-MM'), 0, 0, 0, 0, NOW())
ON CONFLICT (id) DO UPDATE SET checks_used = 0;

-- Step 5: Create sample citations for testing
INSERT INTO citations (id, site_id, platform, query, snippet, confidence, created_at)
VALUES 
  -- Citations for Pro site
  ('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a101', 'cccccccc-cccc-cccc-cccc-cccccccccc01', 'perplexity', 'best note taking apps', 'Notion is a popular choice for note-taking and productivity...', 'high', NOW()),
  ('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a102', 'cccccccc-cccc-cccc-cccc-cccccccccc01', 'chatgpt', 'productivity tools 2026', 'For productivity, many users recommend Notion, Slack, and similar tools...', 'medium', NOW()),
  ('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a103', 'cccccccc-cccc-cccc-cccc-cccccccccc01', 'google_aio', 'notion alternatives', 'Some alternatives to Notion include Obsidian, Roam Research, and Coda...', 'high', NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- VERIFICATION: Check what was created
-- ============================================
SELECT 'Organizations' as entity, COUNT(*) as count FROM organizations WHERE id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333')
UNION ALL
SELECT 'Sites' as entity, COUNT(*) as count FROM sites WHERE organization_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333')
UNION ALL
SELECT 'Competitors' as entity, COUNT(*) as count FROM competitors WHERE id::text LIKE 'dddddddd%' OR id::text LIKE 'eeeeeeee%'
UNION ALL
SELECT 'Citations' as entity, COUNT(*) as count FROM citations WHERE id::text LIKE 'a1a1a1a1%';

-- ============================================
-- HOW TO TEST
-- ============================================
-- After running this script:
-- 
-- 1. Sign up with arjun+test@cabbageseo.com
-- 2. In Supabase, find that user in the 'users' table
-- 3. Update their organization_id to:
--    - 11111111-1111-1111-1111-111111111111 (Free)
--    - 22222222-2222-2222-2222-222222222222 (Starter)
--    - 33333333-3333-3333-3333-333333333333 (Pro)
-- 4. Refresh the dashboard - you'll now have that plan's features!
-- ============================================
