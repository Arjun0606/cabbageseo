# 🧪 Full Testing Execution Plan

**CRITICAL:** Test EVERYTHING before reinstating paywalls/auth.

---

## 🎯 Phase 1: Fix Screen Flicker (DONE)

**Issue:** Dashboard shows first screen, then switches to second screen
**Root Cause:** `loading` state + `fetchCitations` async conflict
**Fix:** Load localStorage FIRST (synchronous), then fetch API (async)

**Status:** ✅ Fixed - localStorage loads first, prevents flicker

---

## 🎯 Phase 2: Comprehensive Testing

### Test Execution Order

#### 1. Authentication Tests (5 min)
```bash
# Test all 3 test accounts
curl -X POST http://localhost:3000/api/test/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test-free@cabbageseo.test","password":"TestFree123!"}'

curl -X POST http://localhost:3000/api/test/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test-starter@cabbageseo.test","password":"TestStarter123!"}'

curl -X POST http://localhost:3000/api/test/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test-pro@cabbageseo.test","password":"TestPro123!"}'
```

**Expected:** All return 200 OK with session token

---

#### 2. API Endpoint Tests (10 min)

**Free Tier:**
- [ ] GET /api/me → Returns plan: "free"
- [ ] GET /api/sites → Returns sites (max 1)
- [ ] POST /api/sites → Creates site (limit: 1)
- [ ] POST /api/geo/citations/check → Works (limit: 3/day)
- [ ] GET /api/sites/listings → Works (read-only)
- [ ] POST /api/geo/intelligence/actions → Blocked (paywall)

**Starter Tier:**
- [ ] GET /api/me → Returns plan: "starter"
- [ ] GET /api/sites → Returns sites (max 3)
- [ ] POST /api/sites → Creates site (limit: 3)
- [ ] POST /api/geo/citations/check → Works (unlimited)
- [ ] GET /api/sites/listings → Works (full access)
- [ ] POST /api/geo/intelligence/actions → Works (limit: 5/month)

**Pro Tier:**
- [ ] GET /api/me → Returns plan: "pro"
- [ ] GET /api/sites → Returns sites (max 10)
- [ ] POST /api/sites → Creates site (limit: 10)
- [ ] POST /api/geo/citations/check → Works (unlimited)
- [ ] GET /api/sites/listings → Works (full access)
- [ ] POST /api/geo/intelligence/actions → Works (unlimited)

---

#### 3. Plan Limits Tests (15 min)

**Free Tier Limits:**
- [ ] 3 checks/day enforced
- [ ] 1 site limit enforced
- [ ] 0 competitors limit enforced
- [ ] No "Why Not Me?" access
- [ ] No content recommendations access
- [ ] Trust Map read-only

**Starter Tier Limits:**
- [ ] Unlimited checks
- [ ] 3 sites limit enforced
- [ ] 2 competitors limit enforced
- [ ] 5 "Why Not Me?" analyses/month
- [ ] 3 content recommendations/month
- [ ] Trust Map full access

**Pro Tier Limits:**
- [ ] Unlimited checks
- [ ] 10 sites limit enforced
- [ ] 10 competitors limit enforced
- [ ] Unlimited "Why Not Me?" analyses
- [ ] Unlimited content recommendations
- [ ] All features unlimited

---

#### 4. Dashboard UI Tests (10 min)

**Free Tier Dashboard:**
- [ ] Shows "QUERIES WHERE YOU'RE INVISIBLE" metric
- [ ] Shows micro-win indicator
- [ ] Shows G2 Step 1
- [ ] Shows "Show me the full checklist" CTA
- [ ] No screen flicker
- [ ] No empty states

**Starter Tier Dashboard:**
- [ ] Shows progress summary card
- [ ] Shows "Expected Outcome" on roadmap steps
- [ ] Shows Trust Map CTA
- [ ] Shows roadmap access
- [ ] No screen flicker

**Pro Tier Dashboard:**
- [ ] Shows "AI Visibility Mode: Active"
- [ ] Shows "This Week's AI Visibility Moves"
- [ ] Shows all features
- [ ] No screen flicker

---

#### 5. Inngest Job Tests (10 min)

**Test Daily Citation Check:**
```bash
# Trigger manually via Inngest Dev Server
# Or wait for 10 AM UTC cron
```

**Test Hourly Citation Check:**
```bash
# Trigger manually for Pro users
# Verify only Pro sites are checked
```

**Test Citation Alert Email:**
```bash
# Trigger citation/new.detected event
# Verify email sends
```

**Expected:**
- [ ] Daily check runs at 10 AM UTC
- [ ] Hourly check runs for Pro only
- [ ] Alert emails send correctly
- [ ] Jobs handle errors gracefully

---

#### 6. Webhook Tests (5 min)

**Dodo Webhooks:**
- [ ] subscription.active → Updates database
- [ ] subscription.updated → Updates database
- [ ] subscription.cancelled → Updates database
- [ ] payment.succeeded → Processes payment

**Test with:**
```bash
curl -X POST http://localhost:3000/api/webhooks/dodo \
  -H "Content-Type: application/json" \
  -d '{"type":"subscription.active","data":{"subscription_id":"test"}}'
```

---

#### 7. Payment Flow Tests (10 min)

**Checkout:**
- [ ] POST /api/billing/checkout → Creates session
- [ ] Test card works (4242 4242 4242 4242)
- [ ] Payment processes
- [ ] Webhook processes payment
- [ ] User upgrades immediately
- [ ] Features unlock correctly

---

#### 8. End-to-End Flow Tests (15 min)

**Free Tier Flow:**
1. Login → Dashboard
2. Run check → See results
3. See micro-win indicator
4. See G2 Step 1
5. Click "Show me the full checklist" → Billing page
6. Upgrade → Get Starter features

**Starter Tier Flow:**
1. Login → Dashboard
2. See progress summary
3. Go to Trust Map → See all steps
4. Go to Roadmap → Check off steps
5. Run "Why Not Me?" → See analysis (5/month limit)

**Pro Tier Flow:**
1. Login → Dashboard
2. See "AI Visibility Mode: Active"
3. See all features unlimited
4. Go to Roadmap → See "This Week's AI Visibility Moves"

---

## 🚀 How to Run Tests

### Option 1: Automated Script
```bash
# Run bash script
./scripts/test-all-tiers.sh

# Or run TypeScript suite
npx tsx scripts/comprehensive-test-suite.ts
```

### Option 2: Manual Testing
1. Use test accounts (see `TESTING_QUICK_START.md`)
2. Test each tier systematically
3. Document results

### Option 3: Inngest Dev Server
```bash
# Start Inngest dev server
npx inngest-cli dev

# Trigger jobs manually
# Test webhooks
```

---

## ✅ Success Criteria

**Before reinstating paywalls/auth:**
- ✅ All API endpoints work
- ✅ All plan limits enforced correctly
- ✅ All paywalls work correctly
- ✅ Inngest jobs run correctly
- ✅ Webhooks process correctly
- ✅ Payment flow works end-to-end
- ✅ No screen flicker
- ✅ No empty states
- ✅ All CTAs work
- ✅ All features work per tier

---

## 📊 Test Results Tracker

Create `TEST_RESULTS.md` and track:

```
## Test Session: [Date]

### Authentication
- [ ] Free tier login
- [ ] Starter tier login
- [ ] Pro tier login

### API Endpoints
- [ ] All endpoints work
- [ ] Plan limits enforced
- [ ] Paywalls work

### Dashboard
- [ ] No screen flicker
- [ ] All features show correctly
- [ ] CTAs work

### Inngest
- [ ] Daily check runs
- [ ] Hourly check runs
- [ ] Emails send

### Payment
- [ ] Checkout works
- [ ] Webhooks process
- [ ] Upgrades work

### Issues Found
- [List any issues]

### Status
✅ READY or ❌ NEEDS FIXES
```

---

## ⚠️ Critical Issues to Watch

1. **Screen Flicker** → Should be fixed now
2. **Empty States** → Should never show
3. **Plan Limits** → Must be enforced server-side
4. **Paywalls** → Must work correctly
5. **Inngest Jobs** → Must run correctly
6. **Webhooks** → Must process correctly

---

**Test thoroughly. Document everything. Then reinstate paywalls/auth.**

