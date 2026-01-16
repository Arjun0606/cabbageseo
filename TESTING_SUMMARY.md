# 🧪 Testing Summary - Quick Start

**Date:** January 2025  
**Purpose:** Quick reference for testing CabbageSEO before launch

---

## 🎯 Testing Goals

1. ✅ Test authentication (signup, login, password reset)
2. ✅ Test payments with Dodo test cards
3. ✅ Create accounts for all three pricing tiers
4. ✅ Test each tier extensively (limits, features, paywalls)
5. ✅ Verify webhooks update subscriptions correctly

---

## 📋 Quick Testing Checklist

### Phase 1: Authentication (30 minutes)
- [ ] Signup with email/password
- [ ] Signup with Google OAuth
- [ ] Login works
- [ ] Password reset works
- [ ] Logout works

### Phase 2: Payments (45 minutes)
- [ ] Checkout redirects to Dodo
- [ ] Successful payment with test card `4242 4242 4242 4242`
- [ ] Failed payment with declined card `4000 0000 0000 0002`
- [ ] Webhook updates organization plan
- [ ] Billing portal accessible

### Phase 3: Free Tier (30 minutes)
- [ ] 3 checks/day limit enforced
- [ ] 1 site limit enforced
- [ ] Competitors blocked
- [ ] Paywalls shown correctly

### Phase 4: Starter Tier (45 minutes)
- [ ] Unlimited manual checks
- [ ] 3 sites limit enforced
- [ ] 2 competitors per site enforced
- [ ] 5 gap analyses/month enforced
- [ ] 3 content ideas/month enforced

### Phase 5: Pro Tier (45 minutes)
- [ ] Unlimited manual checks
- [ ] 10 sites limit enforced
- [ ] 10 competitors per site enforced
- [ ] Unlimited gap analyses
- [ ] Full Trust Map access
- [ ] Full Roadmap access

**Total Time:** ~3.5 hours

---

## 🚀 Quick Start

### Step 1: Read the Guides

1. **`COMPLETE_TESTING_GUIDE.md`** - Detailed step-by-step instructions
2. **`HANDOFF_REPORT.md`** - Complete product overview
3. **`scripts/create-test-accounts.md`** - How to create test accounts

### Step 2: Set Up Test Accounts

Create three test accounts:

| Account | Email | Plan | How to Create |
|---------|-------|------|---------------|
| Free | `test-free@example.com` | Free | Signup normally |
| Starter | `test-starter@example.com` | Starter | Signup → Upgrade with test card |
| Pro | `test-pro@example.com` | Pro | Signup → Upgrade with test card |

**Test Card:** `4242 4242 4242 4242`  
**Expiry:** `12/34`  
**CVV:** `123`  
**ZIP:** `12345`

### Step 3: Test Authentication

Follow `COMPLETE_TESTING_GUIDE.md` Phase 1

### Step 4: Test Payments

Follow `COMPLETE_TESTING_GUIDE.md` Phase 2

### Step 5: Test Each Tier

Follow `COMPLETE_TESTING_GUIDE.md` Phases 3-5

---

## 🔑 Key Test Cards (Dodo Payments)

| Card Number | Result | Use Case |
|-------------|--------|----------|
| `4242 4242 4242 4242` | ✅ Success | Normal checkout |
| `5555 5555 5555 4444` | ✅ Success | Alternative card |
| `4000 0000 0000 0002` | ❌ Declined | Payment failure |
| `4000 0000 0000 9995` | ❌ Declined | Payment failure |

---

## 📊 Plan Limits Reference

### Free Tier
- Manual Checks: **3/day**
- Sites: **1**
- Competitors: **0** (blocked)
- Gap Analysis: **0/month** (blocked)
- Content Ideas: **0/month** (blocked)
- Trial: **7 days**

### Starter Tier ($29/mo)
- Manual Checks: **Unlimited**
- Sites: **3**
- Competitors: **2 per site**
- Gap Analysis: **5/month**
- Content Ideas: **3/month**
- Auto-Checks: **Daily**

### Pro Tier ($79/mo)
- Manual Checks: **Unlimited**
- Sites: **10**
- Competitors: **10 per site**
- Gap Analysis: **Unlimited**
- Content Ideas: **Unlimited**
- Auto-Checks: **Hourly**

---

## 🐛 Common Issues & Solutions

### Payment Issues

**Checkout doesn't redirect:**
- Check `DODO_PAYMENTS_API_KEY` is set
- Check product IDs are configured
- Check browser console for errors

**Webhook not received:**
- Verify webhook URL in Dodo dashboard
- Check webhook secret matches
- Check Vercel logs for webhook attempts

**Plan doesn't update:**
- Check webhook logs in Vercel
- Verify `dodo_subscription_id` is saved
- Check database for organization updates

### Limit Enforcement Issues

**Limits not enforced:**
- Check plan is correct in database
- Verify API routes check limits
- Check usage tracking table

---

## ✅ Success Criteria

All tests pass when:

1. ✅ Authentication works (signup, login, reset)
2. ✅ Payments work (checkout, webhooks, portal)
3. ✅ Free tier limits enforced correctly
4. ✅ Starter tier limits enforced correctly
5. ✅ Pro tier limits enforced correctly
6. ✅ Features unlock after upgrade
7. ✅ Paywalls shown for free users
8. ✅ Auto-checks scheduled correctly
9. ✅ No mock data anywhere
10. ✅ Error messages are clear and actionable

---

## 📝 Test Results Template

Create `TEST_RESULTS.md`:

```markdown
# Test Results - [Date]

## Authentication
- [ ] Signup: ✅ / ❌
- [ ] Login: ✅ / ❌
- [ ] Password Reset: ✅ / ❌

## Payments
- [ ] Checkout: ✅ / ❌
- [ ] Successful Payment: ✅ / ❌
- [ ] Webhook: ✅ / ❌

## Free Tier
- [ ] Limits: ✅ / ❌
- [ ] Paywalls: ✅ / ❌

## Starter Tier
- [ ] Limits: ✅ / ❌
- [ ] Features: ✅ / ❌

## Pro Tier
- [ ] Limits: ✅ / ❌
- [ ] Features: ✅ / ❌

## Issues Found
1. [Issue description]
2. [Issue description]
```

---

## 📚 Full Documentation

- **`COMPLETE_TESTING_GUIDE.md`** - Comprehensive step-by-step guide
- **`HANDOFF_REPORT.md`** - Complete product handoff document
- **`scripts/create-test-accounts.md`** - Test account creation guide

---

**Ready to test?** Start with `COMPLETE_TESTING_GUIDE.md` Phase 1!

