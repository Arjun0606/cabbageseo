-- ============================================
-- CABBAGESEO FULL DATABASE RESET
-- Based on your V3 schema with 24 tables
-- Run in Supabase SQL Editor
-- ============================================

-- WARNING: This is IRREVERSIBLE. All data will be lost.

-- Disable triggers and foreign key checks
SET session_replication_role = 'replica';

-- ============================================
-- STEP 1: Delete AIO & Analytics Tables
-- ============================================
DELETE FROM aio_analyses;
DELETE FROM ai_citations;
DELETE FROM entities;
DELETE FROM rankings;

-- ============================================
-- STEP 2: Delete SEO Data Tables
-- ============================================
DELETE FROM issues;
DELETE FROM audits;
DELETE FROM tasks;
DELETE FROM pages;
DELETE FROM content_ideas;
DELETE FROM content;
DELETE FROM keywords;
DELETE FROM keyword_clusters;

-- ============================================
-- STEP 3: Delete Sites
-- ============================================
DELETE FROM sites;

-- ============================================
-- STEP 4: Delete Usage & Billing Tables
-- ============================================
DELETE FROM usage_events;
DELETE FROM usage_records;
DELETE FROM usage;
DELETE FROM overage_charges;
DELETE FROM invoices;
DELETE FROM credit_transactions;
DELETE FROM credit_balance;
DELETE FROM notifications;
DELETE FROM integrations;

-- ============================================
-- STEP 5: Delete User Sessions
-- ============================================
DELETE FROM sessions;

-- ============================================
-- STEP 6: Delete Users
-- ============================================
DELETE FROM users;

-- ============================================
-- STEP 7: Delete Organizations
-- ============================================
DELETE FROM organizations;

-- ============================================
-- STEP 8: Delete Auth Users (Supabase Auth)
-- ============================================
DELETE FROM auth.users;

-- Re-enable triggers
SET session_replication_role = 'origin';

-- ============================================
-- VERIFY CLEANUP
-- ============================================
SELECT 'auth.users' as table_name, count(*) as count FROM auth.users
UNION ALL SELECT 'organizations', count(*) FROM organizations
UNION ALL SELECT 'users', count(*) FROM users
UNION ALL SELECT 'sites', count(*) FROM sites
UNION ALL SELECT 'pages', count(*) FROM pages
UNION ALL SELECT 'content', count(*) FROM content
UNION ALL SELECT 'keywords', count(*) FROM keywords
UNION ALL SELECT 'issues', count(*) FROM issues
UNION ALL SELECT 'audits', count(*) FROM audits
UNION ALL SELECT 'usage', count(*) FROM usage;

-- ============================================
-- ✅ DONE! Database is now empty.
-- Go to cabbageseo.com/signup to create a new account.
-- ============================================
