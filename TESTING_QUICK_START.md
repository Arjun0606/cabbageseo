# Testing Quick Start Guide
**Ready to test? Let's go! 🚀**

---

## 🎯 Test Accounts Ready

You have 3 test accounts set up:

### Free Tier
- **Email:** `test-free@cabbageseo.test`
- **Password:** `TestFree123!`
- **Plan:** Free (3 checks/day, 1 site, 0 competitors)

### Starter Tier
- **Email:** `test-starter@cabbageseo.test`
- **Password:** `TestStarter123!`
- **Plan:** Starter (Unlimited checks, 3 sites, 2 competitors)

### Pro Tier
- **Email:** `test-pro@cabbageseo.test`
- **Password:** `TestPro123!`
- **Plan:** Pro (Unlimited checks, 10 sites, 10 competitors)

---

## 🚀 Start Testing - Phase 1: Dashboard

### Step 1: Login with Free Account
1. Go to `/login`
2. Login with `test-free@cabbageseo.test` / `TestFree123!`
3. **Take screenshot** of dashboard

### Step 2: Verify ONE Metric
- [ ] **Check:** Does ONE metric show at top? ("High-Intent Queries Missed")
- [ ] **Check:** Is it large and red?
- [ ] **Check:** Warning icon visible?
- [ ] **Screenshot:** Top of dashboard showing metric

### Step 3: Verify Losses First
- [ ] **Check:** Do losses appear BEFORE wins?
- [ ] **Check:** Red gradient background?
- [ ] **Check:** Warning icons visible?
- [ ] **Check:** "Why not me?" links work?
- [ ] **Screenshot:** Losses section

### Step 4: Verify Wins Secondary
- [ ] **Check:** Do wins appear AFTER losses?
- [ ] **Check:** Muted green (not bright)?
- [ ] **Check:** Smaller visual weight?
- [ ] **Screenshot:** Wins section

### Step 5: Test Empty State
- [ ] **Check:** If no data, does it show urgent CTA?
- [ ] **Check:** Copy says "AI is choosing your competitors right now"?
- [ ] **Check:** Red, urgent styling?
- [ ] **Screenshot:** Empty state (if applicable)

---

## 📝 Document Your Findings

As you test, update:
- **`TESTING_PROGRESS_TRACKER.md`** - Mark tests as ✅ Pass / ❌ Fail
- **`TESTING_SESSION_NOTES.md`** - Add observations and screenshots

**For each test, note:**
- ✅ What works
- ❌ What doesn't work
- 📸 Screenshots taken
- 💡 Ideas for improvement
- 🐛 Bugs found

---

## 🎯 Testing Priority Order

### Phase 1: Dashboard (START HERE)
1. ✅ ONE metric display
2. ✅ Losses section first
3. ✅ Wins section secondary
4. ✅ No empty states

### Phase 2: Onboarding
5. ⚠️ Auto-run scan after signup
6. ⚠️ No distractions during onboarding
7. ⚠️ Losses show first in results

### Phase 3: Homepage
8. ⚠️ Free domain check above fold
9. ⚠️ Teaser page shows competitors
10. ⚠️ Results before signup

### Phase 4: Plan Limits
11. ⚠️ Free tier limits (3 checks/day, 1 site)
12. ⚠️ Starter tier limits (3 sites, 2 competitors)
13. ⚠️ Pro tier limits (10 sites, 10 competitors)

### Phase 5: Payments
14. ⚠️ Checkout flow with Dodo
15. ⚠️ Webhook updates plan
16. ⚠️ Features unlock after payment

---

## 🔍 What to Look For

### ✅ Good Signs (Keep These)
- Losses create urgency (red, prominent)
- ONE metric dominates view
- No empty states (always shows CTA)
- Clear upgrade paths
- Progress visible

### ❌ Bad Signs (Fix These)
- Wins reduce urgency
- Multiple metrics competing
- Empty dashboard shown
- Unclear upgrade paths
- No progress tracking

---

## 📸 Screenshot Checklist

Take screenshots of:
- [ ] Dashboard (full view)
- [ ] ONE metric at top
- [ ] Losses section
- [ ] Wins section
- [ ] Empty state (if applicable)
- [ ] Upgrade CTAs
- [ ] Paywalls
- [ ] Plan limits being enforced
- [ ] Error messages
- [ ] Loading states

---

## 🐛 Found a Bug?

Document it in `TESTING_PROGRESS_TRACKER.md`:

```markdown
### Bug #X: [Title]
**Severity:** 🔴 Critical / 🟡 Important / 🟢 Minor
**Found By:** [Your name]
**Date:** [Date]

**Description:**
[What's wrong]

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]

**Expected:**
[What should happen]

**Actual:**
[What actually happens]

**Screenshots:**
- [Screenshot 1]
```

---

## 💡 Quick Tips

1. **Test with real domains** - Use actual domains you know (yours, competitors, etc.)
2. **Test edge cases** - What if user has 0 losses? 0 wins? First time?
3. **Test all tiers** - Free, Starter, Pro all behave differently
4. **Take screenshots** - Visual proof is better than descriptions
5. **Note conversion impact** - Does this drive payment or reduce churn?

---

## 🎯 Success Criteria

After testing, you should know:
- ✅ Does dashboard create urgency?
- ✅ Do losses show first?
- ✅ Is ONE metric prominent?
- ✅ Do upgrade CTAs work?
- ✅ Are plan limits enforced?
- ✅ Does onboarding auto-run scan?

---

## 📚 Full Documentation

- **`REVENUE_TESTING_CHECKLIST.md`** - Complete checklist (50+ tests)
- **`TESTING_PROGRESS_TRACKER.md`** - Track your progress
- **`TESTING_SESSION_NOTES.md`** - Template for notes
- **`MASTER_TESTING_REFERENCE.md`** - All revenue points
- **`TEST_ACCOUNTS_SETUP.md`** - Test account details

---

**Ready? Start with Phase 1: Dashboard testing! 🚀**

**Share screenshots and observations as you test, and I'll help track progress and fix any issues.**

