# 🧪 Comprehensive Automated Testing Plan

**CRITICAL:** Test EVERYTHING before reinstating paywalls/auth.

---

## 🎯 Testing Strategy

### Phase 1: Fix Screen Flicker (IMMEDIATE)
**Issue:** Dashboard shows first screen, then switches to second screen
**Root Cause:** Loading state + empty state logic conflict
**Fix:** Load localStorage first (synchronous), then fetch API (async)

### Phase 2: Automated API Testing
**Tool:** Test scripts + manual verification
**Coverage:** All endpoints, all tiers, all limits

### Phase 3: Inngest Job Testing
**Tool:** Inngest Dev Server + manual triggers
**Coverage:** Daily checks, hourly checks, webhooks

### Phase 4: End-to-End Flow Testing
**Tool:** Manual testing with test accounts
**Coverage:** Complete user journeys

---

## ✅ Test Coverage Checklist

### Authentication & Test Accounts
- [ ] Free tier login works
- [ ] Starter tier login works
- [ ] Pro tier login works
- [ ] Test session cookie sets correctly
- [ ] Test session persists across requests
- [ ] Logout clears session

### API Endpoints
- [ ] GET /api/me (all tiers)
- [ ] GET /api/sites (all tiers)
- [ ] POST /api/sites (all tiers)
- [ ] GET /api/geo/citations (all tiers)
- [ ] POST /api/geo/citations/check (all tiers)
- [ ] GET /api/sites/listings (all tiers)
- [ ] POST /api/geo/intelligence/actions (Starter+)
- [ ] POST /api/billing/checkout (all tiers)
- [ ] GET /api/billing/portal (paid tiers)

### Plan Limits Enforcement
- [ ] Free: 3 checks/day limit enforced
- [ ] Free: 1 site limit enforced
- [ ] Free: 0 competitors limit enforced
- [ ] Starter: Unlimited checks
- [ ] Starter: 3 sites limit enforced
- [ ] Starter: 2 competitors limit enforced
- [ ] Starter: 5 "Why Not Me?" analyses/month
- [ ] Starter: 3 content recommendations/month
- [ ] Pro: Unlimited everything
- [ ] Pro: 10 sites limit enforced
- [ ] Pro: 10 competitors limit enforced

### Paywall Enforcement
- [ ] Free: Trust Map accessible (read-only)
- [ ] Free: Roadmap blocked
- [ ] Free: "Why Not Me?" blocked
- [ ] Free: Content recommendations blocked
- [ ] Starter: Trust Map full access
- [ ] Starter: Roadmap accessible
- [ ] Starter: "Why Not Me?" works (limited)
- [ ] Starter: Content recommendations work (limited)
- [ ] Pro: Everything unlimited

### Dashboard Features
- [ ] Free: Shows micro-win indicator
- [ ] Free: Shows G2 Step 1
- [ ] Free: Shows "Show me the full checklist" CTA
- [ ] Starter: Shows progress summary
- [ ] Starter: Shows "Expected Outcome" on roadmap steps
- [ ] Pro: Shows "AI Visibility Mode: Active"
- [ ] Pro: Shows "This Week's AI Visibility Moves"
- [ ] All tiers: No empty states
- [ ] All tiers: Losses shown first
- [ ] All tiers: Wins shown second

### Inngest Jobs
- [ ] Daily citation check runs (10 AM UTC)
- [ ] Hourly citation check runs (Pro only)
- [ ] Citation alert email sends
- [ ] Weekly report generates
- [ ] Jobs handle errors gracefully
- [ ] Jobs retry on failure

### Webhooks
- [ ] Dodo: subscription.active
- [ ] Dodo: subscription.updated
- [ ] Dodo: subscription.cancelled
- [ ] Dodo: payment.succeeded
- [ ] Webhooks update database correctly
- [ ] Webhooks handle errors gracefully

### Payment Flow
- [ ] Checkout session creates
- [ ] Test card works (4242 4242 4242 4242)
- [ ] Payment processes successfully
- [ ] Webhook processes payment
- [ ] User upgrades immediately
- [ ] Features unlock correctly

### UI/UX
- [ ] No screen flicker on dashboard
- [ ] Loading states show correctly
- [ ] Error states show correctly
- [ ] Empty states never shown
- [ ] CTAs work correctly
- [ ] Links work correctly
- [ ] Mobile responsive
- [ ] No console errors

---

## 🚀 How to Run Tests

### Option 1: Automated Script
```bash
# Make script executable
chmod +x scripts/test-all-tiers.sh

# Run tests
./scripts/test-all-tiers.sh
```

### Option 2: TypeScript Test Suite
```bash
# Install tsx if needed
npm install -g tsx

# Run comprehensive tests
npx tsx scripts/comprehensive-test-suite.ts
```

### Option 3: Manual Testing
1. Use test accounts (see `TESTING_QUICK_START.md`)
2. Test each tier systematically
3. Document results in `TESTING_SESSION_NOTES.md`

---

## 🔧 Fix Screen Flicker Issue

**Problem:** Dashboard shows first screen, then switches to second screen

**Root Cause:**
- `loading` state starts as `true`
- `recentCheckResults` starts as empty array
- When `loading` becomes `false`, empty state shows
- Then localStorage loads, but too late

**Fix Applied:**
- Load localStorage FIRST (synchronous)
- Set `loading` to `false` immediately if localStorage has data
- Fetch API in background (doesn't block UI)

---

## 📋 Testing Order

### 1. Fix Screen Flicker (DONE)
- ✅ Load localStorage first
- ✅ Set loading state correctly
- ✅ Prevent flicker

### 2. Test Authentication (NEXT)
- Test all 3 test accounts
- Verify sessions work
- Verify logout works

### 3. Test API Endpoints
- Test all endpoints
- Verify plan limits
- Verify paywalls

### 4. Test Inngest Jobs
- Verify jobs are registered
- Test manual triggers
- Verify error handling

### 5. Test Payment Flow
- Test checkout
- Test webhooks
- Verify upgrades

### 6. Test UI/UX
- Test all pages
- Verify no flicker
- Verify CTAs work

---

## ⚠️ Critical Issues to Fix

1. **Screen Flicker** → Fixed (load localStorage first)
2. **Empty States** → Verify never shown
3. **Plan Limits** → Verify enforced
4. **Paywalls** → Verify work correctly
5. **Inngest Jobs** → Verify run correctly

---

## ✅ Success Criteria

**Before reinstating paywalls/auth:**
- ✅ All API endpoints work
- ✅ All plan limits enforced
- ✅ All paywalls work
- ✅ Inngest jobs run
- ✅ Webhooks process
- ✅ Payment flow works
- ✅ No screen flicker
- ✅ No empty states
- ✅ All CTAs work

---

**Test thoroughly. Then reinstate paywalls/auth with confidence.**

