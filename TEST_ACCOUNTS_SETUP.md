# Test Accounts Setup Guide

**⚠️ TEMPORARY: For testing only. Remove before production launch.**

This guide explains how to use the test account bypass system to test features without payment flows.

---

## Test Account Credentials

Three test accounts have been created with credential-based access:

### Free Tier Test Account
- **Email:** `test-free@cabbageseo.test`
- **Password:** `TestFree123!`
- **Plan:** Free (3 checks/day, 1 site, 0 competitors)
- **Features:** Limited access, paywalls shown

### Starter Tier Test Account
- **Email:** `test-starter@cabbageseo.test`
- **Password:** `TestStarter123!`
- **Plan:** Starter (Unlimited checks, 3 sites, 2 competitors)
- **Features:** Full Starter features unlocked

### Pro Tier Test Account
- **Email:** `test-pro@cabbageseo.test`
- **Password:** `TestPro123!`
- **Plan:** Pro (Unlimited checks, 10 sites, 10 competitors)
- **Features:** All Pro features unlocked

---

## How It Works

1. **Credential-Based Bypass:** Test accounts are identified by email address
2. **Plan Override:** When a test account logs in, their plan is overridden to the test plan
3. **Limits Still Enforced:** Test accounts still respect plan limits (e.g., Free = 3 checks/day)
4. **No Payment Required:** Test accounts bypass payment flows but maintain plan restrictions

---

## Setup Instructions

### Step 1: Enable Testing Mode

Add to your `.env` file:

```bash
TESTING_MODE=true
NEXT_PUBLIC_TESTING_MODE=true
```

### Step 2: Create Test Accounts

**EASIEST METHOD - Use Signup Flow (No SQL needed!):**

1. Navigate to `/signup` on your app
2. Create account with email: `test-free@cabbageseo.test`
3. Set password: `TestFree123!`
4. Complete signup
5. Repeat for:
   - `test-starter@cabbageseo.test` / `TestStarter123!`
   - `test-pro@cabbageseo.test` / `TestPro123!`

**That's it!** The test account system will automatically recognize these emails and apply the correct test plan.

**ALTERNATIVE - Supabase Dashboard:**
- Go to Supabase Dashboard → Authentication → Users → Add User
- Create users with the test emails
- Set passwords via "Reset Password" in dashboard

### Step 3: Verify Test Accounts

After creating accounts, verify they work:

1. Login with `test-free@cabbageseo.test`
2. Check that plan shows as "free" in dashboard
3. Try to run 4 checks → Should fail (3/day limit)
4. Try to add 2nd site → Should fail (1 site limit)

Repeat for Starter and Pro accounts.

---

## Testing Checklist

### Free Tier (`test-free@cabbageseo.test`)
- [ ] Login works
- [ ] Plan shows as "free"
- [ ] Can run 3 checks/day (4th fails)
- [ ] Can add 1 site (2nd fails)
- [ ] Cannot add competitors
- [ ] Paywalls shown for premium features
- [ ] Roadmap shows paywall
- [ ] Trust Map shows limited sources
- [ ] Gap analysis blocked

### Starter Tier (`test-starter@cabbageseo.test`)
- [ ] Login works
- [ ] Plan shows as "starter"
- [ ] Can run unlimited checks
- [ ] Can add 3 sites (4th fails)
- [ ] Can add 2 competitors per site (3rd fails)
- [ ] Can run 5 gap analyses/month (6th fails)
- [ ] Can generate 3 content ideas/month (4th fails)
- [ ] Roadmap accessible
- [ ] Trust Map shows top 5 sources
- [ ] Action plans blocked (Pro only)

### Pro Tier (`test-pro@cabbageseo.test`)
- [ ] Login works
- [ ] Plan shows as "pro"
- [ ] Can run unlimited checks
- [ ] Can add 10 sites (11th fails)
- [ ] Can add 10 competitors per site (11th fails)
- [ ] Can run unlimited gap analyses
- [ ] Can generate unlimited content ideas
- [ ] Full Roadmap accessible
- [ ] Full Trust Map accessible
- [ ] All Pro features work

---

## How to Re-Enable Paywalls

When testing is complete, remove the test account bypass:

1. **Remove test account checks from:**
   - `src/lib/billing/citation-plans.ts` - Remove `canAccessProduct` bypass
   - `src/app/api/geo/citations/check/route.ts` - Remove test plan override
   - `src/app/api/sites/route.ts` - Remove test plan override
   - `src/app/api/seo/competitors/route.ts` - Remove test plan override
   - `src/app/api/geo/intelligence/actions/route.ts` - Remove test plan override
   - `src/app/api/me/route.ts` - Remove test plan override

2. **Remove test account file:**
   - Delete `src/lib/testing/test-accounts.ts`

3. **Remove environment variables:**
   - Remove `TESTING_MODE=true` from `.env`
   - Remove `NEXT_PUBLIC_TESTING_MODE=true` from `.env`

4. **Search for test account references:**
   ```bash
   grep -r "test-accounts" src/
   grep -r "TESTING_MODE" src/
   ```

5. **Verify paywalls work:**
   - Login with a regular free account
   - Verify paywalls block premium features
   - Verify upgrade flows work

---

## Files Modified

The following files have been modified to support test accounts:

1. `src/lib/testing/test-accounts.ts` - **NEW** - Test account definitions
2. `src/lib/billing/citation-plans.ts` - Added test account bypass to `canAccessProduct`
3. `src/app/api/geo/citations/check/route.ts` - Added test plan override
4. `src/app/api/sites/route.ts` - Added test plan override
5. `src/app/api/seo/competitors/route.ts` - Added test plan override
6. `src/app/api/geo/intelligence/actions/route.ts` - Added test plan override
7. `src/app/api/me/route.ts` - Added test plan override for frontend

---

## Notes

- **Limits are still enforced** - Test accounts respect plan limits (Free = 3 checks/day, etc.)
- **No payment required** - Test accounts bypass payment flows
- **Temporary only** - This system should be removed before production launch
- **Email-based** - Test accounts are identified by email address
- **All features testable** - You can test all features without dealing with payment flows

---

**Last Updated:** January 2025  
**Status:** Ready for Testing

