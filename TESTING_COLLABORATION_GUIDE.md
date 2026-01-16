# Testing Collaboration Guide
**How we'll work together during testing**

---

## 🎯 How This Works

1. **You test** → Share screenshots + observations
2. **I track** → Update progress tracker
3. **We fix** → Address issues together
4. **We verify** → Re-test after fixes

---

## 📸 Screenshot Guidelines

### What to Screenshot

**Always Screenshot:**
- ✅ Dashboard views (full page)
- ✅ Error messages
- ✅ Empty states
- ✅ Upgrade prompts/paywalls
- ✅ Check results
- ✅ Email alerts (if testing)
- ✅ Any unexpected behavior

### Screenshot Naming

**Format:** `[test-number]-[test-name]-[step].png`

**Examples:**
- `1.1-one-metric-display-full.png`
- `1.2-losses-section-first.png`
- `2.1-homepage-domain-check.png`
- `bug-1-checkout-redirect-fails.png`

### Where to Share

**Option 1:** Attach to this document (TESTING_PROGRESS_TRACKER.md)
- Paste screenshots in relevant test sections
- Add observations below screenshots

**Option 2:** Describe what you see
- "The losses section shows red gradient background ✅"
- "The one metric is large and prominent ✅"
- "I see an error: 'Failed to load citations' ❌"

---

## 📝 Observation Format

When sharing observations, use this format:

```markdown
### Test: [Test Name]
**Status:** ✅ Pass / ❌ Fail / ⚠️ Partial

**What I See:**
- Losses section appears first ✅
- Red gradient background ✅
- Warning icons visible ✅
- BUT: Wins section is still too prominent ⚠️

**What I Feel:**
- Creates urgency ✅
- Makes me want to upgrade ✅
- BUT: Wins reduce urgency slightly ⚠️

**Screenshots:**
- [Attach screenshot 1]
- [Attach screenshot 2]

**Issues:**
- Issue 1: Wins section still too bright
- Issue 2: [Other issue]

**Impact on Conversion:**
- [How this affects payment/churn]
```

---

## 🔄 Update Process

### When You Share Screenshots/Observations:

1. **I'll update:** `TESTING_PROGRESS_TRACKER.md`
   - Mark test as ✅ Pass / ❌ Fail / ⚠️ Partial
   - Add your observations
   - Attach screenshots (or reference them)
   - Document issues found

2. **I'll respond:**
   - Acknowledge what you found
   - Ask clarifying questions if needed
   - Propose fixes for issues
   - Update status in tracker

3. **We'll fix together:**
   - I'll implement fixes
   - You'll re-test
   - We'll verify it works
   - Mark as ✅ Complete

---

## ✅ Accountability Checklist

### Daily Check-In

**At Start of Session:**
- [ ] Review what we tested yesterday
- [ ] Check what's pending
- [ ] Set focus for today

**During Testing:**
- [ ] Share screenshots as you test
- [ ] Document observations
- [ ] Note any issues immediately

**At End of Session:**
- [ ] Summarize what was tested
- [ ] List issues found
- [ ] Note what's next

---

## 🎯 Testing Priorities

### Must Test Today (Critical)
1. [ ] Dashboard losses first
2. [ ] Dashboard one metric
3. [ ] No empty states

### Should Test Today (Important)
4. [ ] Onboarding auto-scan
5. [ ] Homepage domain check
6. [ ] Teaser page competitors

### Can Test Later (Nice to Have)
7. [ ] Progress tracking
8. [ ] Email alerts
9. [ ] First win engineering

---

## 🐛 Bug Reporting Format

When you find a bug, share:

```markdown
### Bug: [Short Title]
**Severity:** 🔴 Critical / 🟡 Important / 🟢 Minor
**Test:** [Which test found this]

**What Happens:**
[Describe the bug]

**Screenshots:**
- [Screenshot 1]
- [Screenshot 2]

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected:**
[What should happen]

**Actual:**
[What actually happens]

**Impact:**
[How this affects conversion/retention]
```

---

## 💡 Quick Status Updates

### When Testing Goes Well ✅
Just say: "Test 1.1 passed - one metric looks great!"

### When You Find Issues ❌
Say: "Test 1.2 has issue - losses section not showing first"

### When You Need Help 🤔
Say: "Not sure if this is working correctly - can you check?"

---

## 📊 Progress Tracking

I'll update these in `TESTING_PROGRESS_TRACKER.md`:

**Overall:**
- Total tests: [X]
- Completed: [X]
- In progress: [X]
- Pending: [X]
- Blocked: [X]

**By Category:**
- Revenue Optimization: [X]/[Total]
- Technical: [X]/[Total]
- Edge Cases: [X]/[Total]

---

## 🚀 Let's Start!

**First Test:** Dashboard - Losses First

1. Login with `test-free@cabbageseo.test`
2. Run a check (if you haven't already)
3. Screenshot the dashboard
4. Share observations

**I'll track everything in the progress tracker!**

---

**Ready?** Start testing and share your screenshots + observations! 🎯

