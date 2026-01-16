# Master Testing Reference - All Revenue Optimization Points
**Date:** January 2025  
**Purpose:** Complete reference for all revenue optimization points to test  
**Goal:** $100k MRR by June 2025

---

## 🎯 CORE STRATEGY (Remember This)

**Positioning:** "AI is recommending your competitors instead of you."

**Key Principles:**
1. **Fear-based, not productivity-based** - Users are anxious, not excited
2. **Losses are LOUD, wins are secondary** - Red, urgent, dominant
3. **One metric only** - High-Intent Queries Missed
4. **Immediate gut punch** - No empty states, auto-run scan
5. **Progress tracking** - Movement, not snapshots

---

## ✅ IMPLEMENTED & READY TO TEST

### 1. Dashboard - Losses First ✅
- [ ] ONE metric: "High-Intent Queries Missed" (large, red, top)
- [ ] Losses section FIRST (red gradient, warning icons)
- [ ] Shows query, platform, competitors mentioned
- [ ] "Why not me?" links prominent
- [ ] Wins section SECONDARY (muted green, below losses)
- [ ] No empty states - always shows urgent CTA

**Files:** `src/app/(dashboard)/dashboard/page.tsx`

---

## ⚠️ NEEDS TESTING (Already Implemented)

### 2. Onboarding - Auto-Run Scan ⚠️
- [ ] Scan runs automatically after signup
- [ ] Terminal-style output (streaming)
- [ ] No empty dashboard shown
- [ ] Results appear within 60 seconds
- [ ] Losses shown first in results
- [ ] No navigation during onboarding

**Files:** `src/app/(dashboard)/onboarding/page.tsx`

**Test:** Sign up → Verify scan runs automatically → Verify losses show first

---

## 🔨 NEEDS IMPLEMENTATION (Then Test)

### 3. Homepage - Show Competitors Immediately
**Status:** Partially implemented (teaser exists, needs enhancement)

**What to Test:**
- [ ] Domain input above fold (no scrolling needed)
- [ ] Results show before signup (no email required)
- [ ] Competitors visible immediately
- [ ] Teaser page shows: "Query → AI recommends → You: ❌"
- [ ] Red/warning colors (not neutral)
- [ ] Actual AI snippets shown (not generic)
- [ ] Clear signup CTA after seeing competitors

**Files to Check:**
- `src/app/(marketing)/page.tsx` - Homepage
- `src/app/(marketing)/teaser/page.tsx` - Teaser page
- `src/app/api/geo/teaser/route.ts` - Teaser API

**Enhancement Needed:**
- Make teaser results more prominent
- Show competitors more clearly
- Add demo brand button ("See how AI treats Notion")

---

### 4. Progress Tracking - Week-Over-Week
**Status:** Partially implemented (data exists, needs UI)

**What to Test:**
- [ ] Week-over-week changes visible
- [ ] Format: "Week 1: 0 → Week 2: 1 → Week 3: 3"
- [ ] Visual progress bar or timeline
- [ ] "You're improving" messaging when progress exists
- [ ] Prominent placement (not hidden)
- [ ] Arrow indicators for changes (up/down)

**Files to Check:**
- `src/app/(dashboard)/dashboard/page.tsx` - Dashboard
- `src/app/api/billing/usage/route.ts` - Usage API

**Enhancement Needed:**
- Add week-over-week comparison UI
- Show progress timeline
- Highlight improvements prominently

---

### 5. Email Alerts - Competitor Movement
**Status:** Needs implementation

**What to Test:**
- [ ] Email sent when competitor overtakes user
- [ ] Subject: "ClickUp just overtook you in 'best project tools'"
- [ ] Fear-based messaging (not hope-based)
- [ ] Clear CTA: "See what changed →"
- [ ] Links to dashboard
- [ ] New citation alerts (when user wins)
- [ ] Weekly reports (Starter/Pro users)

**Files to Check:**
- `src/lib/jobs/citation-jobs.ts` - Background jobs
- Email service integration

**Enhancement Needed:**
- Implement competitor movement detection
- Set up email alerts
- Configure weekly reports

---

### 6. First Win Engineering
**Status:** Needs implementation

**What to Test:**
- [ ] Identifies low-competition query (if possible)
- [ ] Shows: "You're 1 step away from being mentioned for this query"
- [ ] Guides user to that specific query
- [ ] Actionable steps shown
- [ ] Creates hope, not hopelessness

**Files to Check:**
- `src/app/(dashboard)/dashboard/page.tsx` - Dashboard
- `src/lib/geo/citation-intelligence.ts` - Intelligence features

**Enhancement Needed:**
- Add low-competition query detection
- Create guidance UI
- Show actionable steps

---

## 🔍 ADDITIONAL REVENUE POINTS TO VERIFY

### A. Positioning & Messaging

**Test These:**
- [ ] **Homepage copy:** "AI is sending your customers away" (not "track AI mentions")
- [ ] **Dashboard copy:** "AI is choosing your competitors" (not "AI visibility report")
- [ ] **All CTAs:** Threat-based (not productivity-based)
- [ ] **No "tools" language** - Use "insurance against being left out"
- [ ] **Consistent positioning** - Every page reinforces core message

**Files to Check:**
- All marketing pages
- Dashboard pages
- Email templates

---

### B. UI/UX - Urgent, Not Polite

**Test These:**
- [ ] **Losses use red** (not neutral gray)
- [ ] **Warning icons** everywhere losses appear
- [ ] **Bold, urgent fonts** for loss numbers
- [ ] **Red gradients** for loss sections
- [ ] **Wins use muted green** (not bright)
- [ ] **Wins smaller** visual weight than losses
- [ ] **Wins below losses** in layout

**Files to Check:**
- `src/app/(dashboard)/dashboard/page.tsx`
- All dashboard components

---

### C. Conversion Optimization

**Test These:**
- [ ] **Upgrade CTAs:** "Upgrade to see why competitors win" (not "upgrade for more features")
- [ ] **Red, urgent styling** for upgrade prompts (not neutral)
- [ ] **Clear value:** "See full Trust Map", "Unlimited gap analyses"
- [ ] **Paywall messaging:** "See why competitors win" (not "upgrade for premium")
- [ ] **Show what they're missing** (competitors, sources)
- [ ] **Fear-based:** "Your competitors are on G2. You're not."

**Files to Check:**
- `src/components/billing/upgrade-prompt.tsx`
- `src/app/(dashboard)/dashboard/sources/page.tsx`
- `src/app/(dashboard)/dashboard/query/page.tsx`
- `src/app/(dashboard)/dashboard/roadmap/page.tsx`

---

### D. Retention Mechanisms

**Test These:**
- [ ] **Daily engagement:** "Last checked: Today" (not just date)
- [ ] **"Run Check" button** prominent
- [ ] **Recent activity** visible (if applicable)
- [ ] **No dead dashboard** feeling
- [ ] **Week-over-week changes** always visible
- [ ] **Progress indicators** (bars, arrows, numbers)
- [ ] **"You're improving"** messaging when applicable

**Files to Check:**
- `src/app/(dashboard)/dashboard/page.tsx`
- Usage tracking components

---

## 📋 COMPLETE TESTING FLOW

### Flow 1: New User Journey (CRITICAL)
1. [ ] **Homepage:** Enter domain → See competitors → Feel pain
2. [ ] **Teaser:** See detailed losses → Sign up
3. [ ] **Onboarding:** Auto-scan runs → See losses immediately
4. [ ] **Dashboard:** Losses first → "Why not me?" → Upgrade CTA

**Expected:** User feels pain → sees solution → pays

**Test with:** `test-free@cabbageseo.test`

---

### Flow 2: Returning User Journey
1. [ ] **Dashboard:** See losses from last check → Urgency
2. [ ] **Run check:** See new losses → More urgency
3. [ ] **Progress:** See week-over-week improvement → Hope
4. [ ] **Email alert:** Competitor moved → Pull back

**Expected:** User stays engaged, doesn't churn

**Test with:** `test-starter@cabbageseo.test` or `test-pro@cabbageseo.test`

---

### Flow 3: Free User Upgrade Journey
1. [ ] **Hit limit:** "3 checks/day reached" → Upgrade CTA
2. [ ] **See paywall:** "Why not me?" blocked → Upgrade CTA
3. [ ] **Checkout:** Dodo redirect → Payment → Plan update
4. [ ] **Features unlock:** Immediately see full Trust Map

**Expected:** User upgrades when they hit limits

**Test with:** `test-free@cabbageseo.test` → Upgrade to Starter

---

## 🚨 CRITICAL EDGE CASES

### Edge Case 1: User Has 0 Losses
- [ ] Shows: "Great! AI is recommending you in all checked queries"
- [ ] Still shows wins (but secondary)
- [ ] Encourages more checks
- [ ] Doesn't reduce urgency

**Test:** Run check on domain that's well-cited

---

### Edge Case 2: User Has 0 Wins
- [ ] Shows: "High-Intent Queries Missed: X" (large, red)
- [ ] Losses table shows all losses
- [ ] "Why not me?" links work
- [ ] First win guidance shown

**Test:** Run check on new/unknown domain

---

### Edge Case 3: First-Time User
- [ ] No empty dashboard - shows CTA immediately
- [ ] "Run your first check" button prominent
- [ ] Copy: "AI is choosing your competitors right now"
- [ ] No navigation until after first check

**Test:** Sign up → Don't run check → Check dashboard

---

### Edge Case 4: User Hasn't Checked in Days
- [ ] Shows: "Last checked: X days ago"
- [ ] Urgent messaging: "AI recommendations change daily"
- [ ] "Run Check Now" button prominent
- [ ] Reminds of losses from last check

**Test:** Login after several days → Check dashboard

---

## 📊 METRICS TO TRACK

### Conversion Metrics
- [ ] Homepage → Teaser: % who check domain
- [ ] Teaser → Signup: % who sign up after seeing competitors
- [ ] Signup → First Check: % who run check immediately
- [ ] Free → Paid: % who upgrade after seeing losses

### Engagement Metrics
- [ ] Daily active users
- [ ] Checks per user
- [ ] Time to first check
- [ ] Dashboard time spent

### Retention Metrics
- [ ] Week 1 retention
- [ ] Week 2 retention
- [ ] Churn rate (should be < 5% monthly)
- [ ] Upgrade rate

---

## 🎯 SUCCESS CRITERIA

### Must-Have (Critical)
- [ ] Losses show FIRST on dashboard ✅
- [ ] ONE metric at top ✅
- [ ] No empty states ✅
- [ ] Auto-scan runs after signup ⚠️ (test)
- [ ] Homepage shows competitors ⚠️ (test)

### Should-Have (Important)
- [ ] Week-over-week progress visible ⚠️ (test)
- [ ] Email alerts working ⚠️ (test)
- [ ] Urgent UI (red for losses) ✅
- [ ] Fear-based copy throughout ⚠️ (test)
- [ ] Progress tracking prominent ⚠️ (test)

### Nice-to-Have (Enhancement)
- [ ] Demo brand button ⚠️ (test)
- [ ] First win engineering ⚠️ (test)
- [ ] Weekly reports ⚠️ (test)
- [ ] Historical progress charts ⚠️ (test)
- [ ] Competitor movement notifications ⚠️ (test)

---

## 📚 REFERENCE DOCUMENTS

1. **`REVENUE_TESTING_CHECKLIST.md`** - Complete testing checklist
2. **`TESTING_SESSION_NOTES.md`** - Template for test notes
3. **`REVENUE_OPTIMIZATION_PLAN.md`** - Full strategy document
4. **`COMPLETE_TESTING_GUIDE.md`** - Technical testing guide
5. **`TEST_ACCOUNTS_SETUP.md`** - Test account setup
6. **`HANDOFF_REPORT.md`** - Product overview

---

## 🚀 TESTING ORDER

### Phase 1: Core Dashboard (NOW)
1. Test losses-first layout ✅
2. Test one metric display ✅
3. Test no empty states ✅
4. Verify urgent UI ✅

### Phase 2: Onboarding (NOW)
5. Test auto-run scan ⚠️
6. Test no distractions ⚠️
7. Verify losses show first ⚠️

### Phase 3: Homepage (After Phase 1-2)
8. Test domain check flow ⚠️
9. Test teaser page ⚠️
10. Test demo brand button ⚠️

### Phase 4: Progress & Alerts (After Phase 3)
11. Test week-over-week display ⚠️
12. Test email alerts ⚠️
13. Test first win engineering ⚠️

---

## 💡 REMEMBER DURING TESTING

**Every test should answer:**
- Does this create urgency?
- Does this drive payment?
- Does this reduce churn?
- Does this show progress?

**If answer is NO → Fix it.**

---

**Status:** Ready for Testing  
**Next:** Follow `REVENUE_TESTING_CHECKLIST.md` systematically  
**Goal:** Verify all points work, then implement remaining

