-- ============================================
-- CABBAGESEO DATA RESET SCRIPT
-- Run this in Supabase SQL Editor to clear all test data
-- ============================================

-- WARNING: This will delete ALL data. Only run in development/staging.

-- Disable triggers temporarily for faster deletion
SET session_replication_role = 'replica';

-- Delete in dependency order (children first)

-- Content & Analysis
DELETE FROM content;
DELETE FROM aio_analyses;
DELETE FROM entities;

-- SEO Data
DELETE FROM keywords;
DELETE FROM keyword_clusters;
DELETE FROM issues;
DELETE FROM pages;
DELETE FROM audits;

-- Sites (this is the main data)
DELETE FROM sites;

-- Usage tracking (reset usage counters)
DELETE FROM usage;

-- Integrations (optional - uncomment if you want to reset integrations)
-- DELETE FROM integrations;

-- Re-enable triggers
SET session_replication_role = 'origin';

-- Verify cleanup
SELECT 'sites' as table_name, count(*) as count FROM sites
UNION ALL SELECT 'pages', count(*) FROM pages
UNION ALL SELECT 'content', count(*) FROM content
UNION ALL SELECT 'keywords', count(*) FROM keywords
UNION ALL SELECT 'issues', count(*) FROM issues
UNION ALL SELECT 'usage', count(*) FROM usage;

-- Done! All test data has been cleared.
-- Users and organizations are preserved so you can still log in.

