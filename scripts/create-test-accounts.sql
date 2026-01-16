-- ============================================
-- CREATE TEST ACCOUNTS IN SUPABASE
-- ============================================
-- 
-- Run this in Supabase SQL Editor to create test accounts
-- OR use the signup flow on your app (easier!)
--
-- ⚠️ Note: You still need to set passwords manually via Supabase Dashboard
-- or use the password reset flow after creating accounts
--

-- Option 1: Create via Supabase Auth (Recommended - Use Signup Flow Instead)
-- Actually, it's easier to just use the signup flow on your app!

-- Option 2: Create via SQL (if you prefer)
-- Note: This creates the auth.users entries, but you'll need to set passwords
-- via Supabase Dashboard → Authentication → Users → Reset Password

-- ============================================
-- MANUAL STEPS (EASIER):
-- ============================================
--
-- 1. Go to your app's signup page: /signup
-- 2. Create account with email: test-free@cabbageseo.test
-- 3. Set password: TestFree123!
-- 4. Repeat for:
--    - test-starter@cabbageseo.test (password: TestStarter123!)
--    - test-pro@cabbageseo.test (password: TestPro123!)
--
-- That's it! The test account system will automatically recognize them.
--

-- ============================================
-- SQL OPTION (If you prefer SQL):
-- ============================================
-- 
-- If you want to create accounts via SQL, you can use Supabase's
-- auth.users table, but passwords need to be set via the dashboard.
--
-- However, Supabase Auth doesn't expose password hashing in SQL,
-- so it's MUCH easier to just use the signup flow.
--

-- ============================================
-- VERIFY TEST ACCOUNTS AFTER CREATION:
-- ============================================

-- Check if accounts exist
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at
FROM auth.users
WHERE email IN (
  'test-free@cabbageseo.test',
  'test-starter@cabbageseo.test',
  'test-pro@cabbageseo.test'
);

-- Check organizations created for test accounts
SELECT 
  o.id,
  o.name,
  o.plan,
  o.subscription_status,
  u.email
FROM organizations o
JOIN users u ON u.organization_id = o.id
WHERE u.email IN (
  'test-free@cabbageseo.test',
  'test-starter@cabbageseo.test',
  'test-pro@cabbageseo.test'
);

-- ============================================
-- QUICK SETUP SUMMARY:
-- ============================================
--
-- 1. Add to .env:
--    TESTING_MODE=true
--    NEXT_PUBLIC_TESTING_MODE=true
--
-- 2. Create accounts via signup flow (easiest):
--    - Go to /signup
--    - Create: test-free@cabbageseo.test / TestFree123!
--    - Create: test-starter@cabbageseo.test / TestStarter123!
--    - Create: test-pro@cabbageseo.test / TestPro123!
--
-- 3. Login and test!
--
-- No SQL needed! The signup flow creates everything automatically.
--

