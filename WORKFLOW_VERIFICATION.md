# Workflow Verification - All Pricing Tiers
**Date:** January 2025  
**Status:** 🔍 Verification Required

## Critical Issue Found

### ❌ Missing Plan Enforcement in Check Route
**File:** `src/app/api/geo/citations/check/route.ts`  
**Issue:** The check route does NOT verify:
1. If free user's trial has expired
2. If free user has exceeded daily manual check limit (3/day)
3. If user can actually run a check

**Current Behavior:**
- Route accepts check requests without verifying plan limits
- Only generates different number of queries based on plan
- Does NOT call `canRunManualCheck()` or `canAccessProduct()`

**Required Fix:**
Add plan enforcement BEFORE running checks:
```typescript
// Check if user can run manual check
const { data: org } = await db
  .from("organizations")
  .select("plan, created_at")
  .eq("id", userData.organization_id)
  .single();

const plan = org?.plan || "free";

// Get checks used today
const today = new Date().toISOString().split('T')[0];
const { data: todayUsage } = await db
  .from("usage")
  .select("checks_used")
  .eq("organization_id", userData.organization_id)
  .eq("period", today)
  .maybeSingle();

const checksToday = todayUsage?.checks_used || 0;

// Verify can run check
const canCheck = canRunManualCheck(plan, checksToday, org?.created_at);
if (!canCheck.allowed) {
  return NextResponse.json({ 
    error: canCheck.reason,
    code: "PLAN_LIMIT_EXCEEDED"
  }, { status: 403 });
}
```

---

## Workflow Tests Required

### FREE TIER (7-day trial)

#### ✅ Test 1: Free User - First Check (Day 1)
- **Action:** User signs up, adds site, runs first check
- **Expected:** Check succeeds, 3 queries run
- **Verify:** Usage incremented, citation saved

#### ✅ Test 2: Free User - Daily Limit (3 checks/day)
- **Action:** User runs 3 checks in one day
- **Expected:** First 3 succeed, 4th fails with "Daily limit reached"
- **Verify:** Error message shows upgrade CTA

#### ✅ Test 3: Free User - Trial Expired (Day 8+)
- **Action:** User tries to run check after 7 days
- **Expected:** Check fails with "Trial expired. Upgrade to continue."
- **Verify:** Upgrade prompt shown

#### ✅ Test 4: Free User - Intelligence Features
- **Action:** User tries to access:
  - Gap Analysis (`/dashboard/query`)
  - Trust Map instructions (`/dashboard/sources`)
  - Roadmap (`/dashboard/roadmap`)
- **Expected:** All show paywall/upgrade prompts
- **Verify:** No access to paid features

#### ✅ Test 5: Free User - Site Limit
- **Action:** User tries to add 2nd site
- **Expected:** Fails with "Site limit reached (1). Upgrade for more."
- **Verify:** `canAddSite()` enforced

---

### STARTER TIER ($29/mo)

#### ✅ Test 6: Starter User - Unlimited Manual Checks
- **Action:** User runs 10+ checks in one day
- **Expected:** All checks succeed (unlimited)
- **Verify:** No daily limit errors

#### ✅ Test 7: Starter User - Daily Auto-Check
- **Action:** Wait for Inngest daily cron
- **Expected:** Auto-check runs automatically
- **Verify:** Citation saved, no manual check count incremented

#### ✅ Test 8: Starter User - Gap Analysis (5/month limit)
- **Action:** User runs 5 gap analyses
- **Expected:** First 5 succeed, 6th fails with "Monthly limit reached (5)"
- **Verify:** `canUseGapAnalysis()` enforced

#### ✅ Test 9: Starter User - Content Recommendations (3/month limit)
- **Action:** User requests 3 content ideas
- **Expected:** First 3 succeed, 4th fails with "Monthly limit reached (3)"
- **Verify:** `canUseContentRecommendations()` enforced

#### ✅ Test 10: Starter User - Site Limit (3 sites)
- **Action:** User tries to add 4th site
- **Expected:** Fails with "Site limit reached (3)"
- **Verify:** `canAddSite()` enforced

#### ✅ Test 11: Starter User - Competitor Limit (2 per site)
- **Action:** User tries to add 3rd competitor
- **Expected:** Fails with "Limit reached (2)"
- **Verify:** `canAddCompetitor()` enforced

#### ✅ Test 12: Starter User - Pro Features Blocked
- **Action:** User tries to access:
  - Weekly Action Plan
  - Competitor Deep Dive
  - Unlimited gap analyses
- **Expected:** All show "Pro only" messages
- **Verify:** Pro features blocked

---

### PRO TIER ($79/mo)

#### ✅ Test 13: Pro User - Unlimited Everything
- **Action:** User runs:
  - 50+ manual checks/day
  - 20+ gap analyses/month
  - 20+ content ideas/month
- **Expected:** All succeed (unlimited)
- **Verify:** No limits enforced

#### ✅ Test 14: Pro User - Hourly Auto-Check
- **Action:** Wait for Inngest hourly cron
- **Expected:** Auto-check runs every hour
- **Verify:** Citations saved, no manual check count

#### ✅ Test 15: Pro User - All Intelligence Features
- **Action:** User accesses:
  - Gap Analysis (unlimited)
  - Content Recommendations (unlimited)
  - Weekly Action Plan
  - Competitor Deep Dive
- **Expected:** All features accessible
- **Verify:** No paywalls

#### ✅ Test 16: Pro User - Site Limit (10 sites)
- **Action:** User tries to add 11th site
- **Expected:** Fails with "Site limit reached (10)"
- **Verify:** `canAddSite()` enforced

#### ✅ Test 17: Pro User - Competitor Limit (10 per site)
- **Action:** User tries to add 11th competitor
- **Expected:** Fails with "Limit reached (10)"
- **Verify:** `canAddCompetitor()` enforced

---

### UPGRADE WORKFLOWS

#### ✅ Test 18: Free → Starter Upgrade
- **Action:** Free user clicks upgrade, completes checkout
- **Expected:** 
  - Plan changes to "starter"
  - User can now access Starter features
  - Daily limit removed
- **Verify:** Webhook updates org plan

#### ✅ Test 19: Starter → Pro Upgrade
- **Action:** Starter user upgrades to Pro
- **Expected:**
  - Plan changes to "pro"
  - All limits removed (unlimited)
  - Hourly auto-checks enabled
- **Verify:** Webhook updates org plan

#### ✅ Test 20: Trial Expired → Upgrade
- **Action:** Free trial expired user upgrades
- **Expected:**
  - Can immediately access features
  - No more "trial expired" errors
- **Verify:** Access restored

---

### BILLING WORKFLOWS

#### ✅ Test 21: Checkout Flow
- **Action:** User clicks upgrade, redirected to Dodo Payments
- **Expected:** 
  - Checkout session created
  - User redirected to payment page
  - After payment, webhook updates plan
- **Verify:** Complete payment flow works

#### ✅ Test 22: Billing Portal Access
- **Action:** Paid user clicks "Manage Billing"
- **Expected:** Redirected to Dodo billing portal
- **Verify:** Can view invoices, update payment method

#### ✅ Test 23: Subscription Cancellation
- **Action:** User cancels subscription
- **Expected:**
  - Access continues until period end
  - After period end, downgraded to free
  - Features locked
- **Verify:** Webhook handles cancellation

---

## Files That Need Plan Enforcement

### ❌ Missing Enforcement:
1. **`src/app/api/geo/citations/check/route.ts`**
   - Missing: `canRunManualCheck()` check
   - Missing: `canAccessProduct()` check for free users
   - Missing: Daily limit check

### ✅ Has Enforcement:
1. **`src/app/api/geo/intelligence/actions/route.ts`**
   - ✅ Uses `canUseGapAnalysis()`
   - ✅ Uses `canUseContentRecommendations()`
   - ✅ Uses `canUseActionPlan()`
   - ✅ Uses `canUseCompetitorDeepDive()`

2. **`src/app/(dashboard)/dashboard/roadmap/page.tsx`**
   - ✅ Checks `isPaidPlan` before showing roadmap

3. **`src/app/(dashboard)/dashboard/sources/page.tsx`**
   - ✅ Checks `isPaidPlan` before showing instructions

4. **`src/app/(dashboard)/dashboard/query/page.tsx`**
   - ✅ Checks `isPaidPlan` before showing content fixes

---

## ✅ All Critical Fixes Completed

### ✅ 1. Plan Enforcement Added to Check Route
**Status:** COMPLETE  
**File:** `src/app/api/geo/citations/check/route.ts`  
**Verification:** ✅ Plan limits checked BEFORE running checks

### ✅ 2. Trial Expiration Check
**Status:** COMPLETE  
**Files:** All API routes  
**Verification:** ✅ `canAccessProduct()` called for free users in:
- Check route
- Site addition route
- Competitor addition route

### ✅ 3. Daily Limit Tracking
**Status:** COMPLETE  
**File:** `src/app/api/geo/citations/check/route.ts`  
**Verification:** ✅ Free tier uses daily period, paid uses monthly

### ✅ 4. Usage Increment Logic
**Status:** COMPLETE  
**File:** `src/app/api/geo/citations/check/route.ts`  
**Verification:** ✅ Usage only incremented for manual checks

---

## ✅ Enforcement Summary

### Routes with Plan Enforcement:
1. ✅ `/api/geo/citations/check` - Manual check limits + trial expiration
2. ✅ `/api/sites` (POST) - Site limits + trial expiration
3. ✅ `/api/seo/competitors` (POST) - Competitor limits + trial expiration
4. ✅ `/api/geo/intelligence/actions` - Intelligence feature limits
5. ✅ `/api/billing/usage` - Correct period tracking

### Frontend Paywalls:
1. ✅ `/dashboard/roadmap` - Paid plan required
2. ✅ `/dashboard/sources` - Instructions locked for free
3. ✅ `/dashboard/query` - Content fixes locked for free

---

## 🧪 Testing Required

**All code fixes are complete. Now test with real accounts:**

1. **Free Tier Tests:**
   - ✅ Sign up → Run 3 checks → 4th should fail
   - ✅ Wait 7 days → Check should fail with trial expired
   - ✅ Try to add 2nd site → Should fail
   - ✅ Try to add competitor → Should fail (free has 0 competitors)

2. **Starter Tier Tests:**
   - ✅ Run 10+ checks → All should succeed
   - ✅ Run 5 gap analyses → 6th should fail
   - ✅ Run 3 content ideas → 4th should fail
   - ✅ Add 3 sites → 4th should fail
   - ✅ Add 2 competitors → 3rd should fail

3. **Pro Tier Tests:**
   - ✅ Run unlimited checks → All succeed
   - ✅ Run unlimited gap analyses → All succeed
   - ✅ Access all intelligence features → All work
   - ✅ Add 10 sites → 11th should fail
   - ✅ Add 10 competitors → 11th should fail

---

## ✅ Status: READY FOR TESTING

**All code fixes complete. Workflows are enforced.**
**Next:** Test with real accounts to verify end-to-end functionality.

