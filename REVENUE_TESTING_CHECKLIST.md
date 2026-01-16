# Revenue Optimization Testing Checklist
**Goal:** $100k MRR by June 2025  
**Date:** January 2025  
**Status:** Ready for Testing

---

## 🎯 Testing Philosophy

**Test for conversion, not just functionality.**

Every test should answer: "Does this increase payment or reduce churn?"

---

## ✅ PRIORITY 1: Dashboard - Losses First (IMPLEMENTED)

### Test 1.1: ONE Metric Display
- [ ] **ONE metric shows at top:** "High-Intent Queries Missed"
- [ ] **Metric is large and prominent** (6xl font, red)
- [ ] **Warning icon** (AlertTriangle) visible
- [ ] **No other metrics** competing for attention
- [ ] **Copy is clear:** "buyer-intent queries where AI chose competitors"

**Expected:** Single, urgent metric dominates the view

### Test 1.2: Losses Section FIRST
- [ ] **Losses section appears BEFORE wins**
- [ ] **Red gradient background** (from-red-950/80 to-red-900/50)
- [ ] **Red border** (border-red-500/50)
- [ ] **Warning icon** in section header
- [ ] **Copy says:** "⚠️ AI is choosing your competitors"
- [ ] **Shows query, platform, competitors mentioned**
- [ ] **"Why not me?" link** is prominent and clickable
- [ ] **Table is visually dominant** (larger, red accents)

**Expected:** Losses are impossible to miss, create urgency

### Test 1.3: Wins Section SECONDARY
- [ ] **Wins section appears AFTER losses**
- [ ] **Muted green** (not bright)
- [ ] **Smaller visual weight** than losses
- [ ] **Copy is neutral:** "AI is recommending you"
- [ ] **Less prominent** (doesn't compete with losses)

**Expected:** Wins don't reduce urgency, they're secondary

### Test 1.4: No Empty States
- [ ] **No blank dashboard** - always shows CTA
- [ ] **Empty state copy:** "AI is choosing your competitors right now"
- [ ] **Red, urgent styling** (not neutral)
- [ ] **Clear action:** "Run Check Now" button
- [ ] **No navigation shown** until after first check

**Expected:** User always sees urgency, never feels "maybe I'm fine"

---

## ✅ PRIORITY 2: Homepage - Show Competitors Immediately

### Test 2.1: Free Domain Check Above Fold
- [ ] **Domain input is above the fold** (visible without scrolling)
- [ ] **Input is prominent** (large, clear placeholder)
- [ ] **Button copy:** "See who AI recommends"
- [ ] **No email required** for preview
- [ ] **Results show immediately** (within 10 seconds)

**Expected:** User sees competitors before signup

### Test 2.2: Teaser Page Shows Competitors
- [ ] **After domain check, shows competitors**
- [ ] **Format:** "Query: 'best X tools' → AI recommends: Competitor A, Competitor B → You: ❌"
- [ ] **Red/warning colors** (not neutral)
- [ ] **Shows actual AI snippets** (not generic text)
- [ ] **Clear CTA:** "Create free account to see full analysis"

**Expected:** User feels pain before thinking about signup

### Test 2.3: Demo Brand Button
- [ ] **"See how AI treats Notion" button** (or similar)
- [ ] **Shows results for known brand**
- [ ] **Builds trust** without commitment
- [ ] **Easy to find** (not hidden)

**Expected:** Users can explore without signing up

---

## ✅ PRIORITY 3: Onboarding - Auto-Run Scan

### Test 3.1: Auto-Run After Signup
- [ ] **After signup, scan runs automatically**
- [ ] **No empty dashboard shown**
- [ ] **Terminal-style output** (streaming, progressive)
- [ ] **Shows:** "Querying Perplexity...", "Querying ChatGPT...", etc.
- [ ] **Results appear immediately** after scan

**Expected:** User sees losses within 60 seconds of signup

### Test 3.2: No Choices, No Menus
- [ ] **No navigation shown** during onboarding
- [ ] **No site selector** until after scan
- [ ] **No settings** visible
- [ ] **Just scan results** (losses first)

**Expected:** User can't get distracted, forced to see pain

### Test 3.3: Redirect After Scan
- [ ] **After scan completes, redirects to dashboard**
- [ ] **Dashboard shows losses immediately**
- [ ] **Welcome banner:** "Your scan is complete. AI is recommending your competitors."
- [ ] **No empty state** shown

**Expected:** Seamless transition from scan to dashboard with losses

---

## ✅ PRIORITY 4: Progress Tracking

### Test 4.1: Week-Over-Week Display
- [ ] **Shows:** "Week 1: 0 mentions → Week 2: 1 mention → Week 3: 3 mentions"
- [ ] **Visual progress bar** or timeline
- [ ] **Prominent placement** (not hidden)
- [ ] **"You're improving" messaging** when progress exists

**Expected:** User sees motion, not just snapshots

### Test 4.2: First Win Engineering
- [ ] **Identifies low-competition query** (if possible)
- [ ] **Shows:** "You're 1 step away from being mentioned for this query"
- [ ] **Guides user** to that specific query
- [ ] **Actionable steps** shown

**Expected:** User feels hope, not hopelessness

### Test 4.3: Progress in Dashboard
- [ ] **Week-over-week change** shown in losses metric
- [ ] **Arrow indicators** (up/down) for changes
- [ ] **"This week" comparison** visible
- [ ] **Positive changes highlighted** (green, emerald)

**Expected:** User sees they're making progress

---

## ✅ PRIORITY 5: Email Alerts

### Test 5.1: Competitor Movement Alerts
- [ ] **Email sent when:** Competitor overtakes user in a query
- [ ] **Subject line:** "ClickUp just overtook you in 'best project tools'"
- [ ] **Fear-based, not hope-based** messaging
- [ ] **Clear CTA:** "See what changed →"

**Expected:** Email pulls user back emotionally

### Test 5.2: New Citation Alerts
- [ ] **Email sent when:** User gets new citation
- [ ] **Subject line:** "You're now mentioned for 'best CRM tools'"
- [ ] **Shows progress** (positive reinforcement)
- [ ] **Links to dashboard**

**Expected:** User feels progress, stays engaged

### Test 5.3: Weekly Reports
- [ ] **Weekly email** sent to Starter/Pro users
- [ ] **Shows:** Week-over-week changes
- [ ] **Highlights losses** (not just wins)
- [ ] **Action items** included

**Expected:** User stays engaged weekly

---

## 🔍 ADDITIONAL REVENUE POINTS TO TEST

### A. Positioning & Messaging

#### Test A.1: Fear-Based Copy
- [ ] **Homepage:** "AI is sending your customers away" (not "track AI mentions")
- [ ] **Dashboard:** "AI is choosing your competitors" (not "AI visibility report")
- [ ] **All CTAs:** Threat-based, not productivity-based
- [ ] **No "tools" language** - use "insurance against being left out"

**Expected:** Copy creates urgency, not curiosity

#### Test A.2: Consistent Positioning
- [ ] **Every page reinforces:** "AI is recommending competitors"
- [ ] **No mixed messaging** (SEO, analytics, monitoring)
- [ ] **Single value prop:** "See where, why, and how to flip it"

**Expected:** User always knows what product does

### B. UI/UX - Urgent, Not Polite

#### Test B.1: Red Accents for Losses
- [ ] **Losses use red** (not neutral gray)
- [ ] **Warning icons** everywhere losses appear
- [ ] **Bold, urgent fonts** for loss numbers
- [ ] **Red gradients** for loss sections

**Expected:** Losses feel urgent, not informational

#### Test B.2: Muted Wins
- [ ] **Wins use muted green** (not bright)
- [ ] **Smaller visual weight** than losses
- [ ] **Below losses** in layout
- [ ] **Don't reduce urgency**

**Expected:** Wins don't make user think "maybe I'm fine"

### C. Conversion Optimization

#### Test C.1: Upgrade CTAs
- [ ] **Upgrade prompts** appear when limits hit
- [ ] **Copy:** "Upgrade to see why competitors win" (not "upgrade for more features")
- [ ] **Red, urgent styling** (not neutral)
- [ ] **Clear value:** "See full Trust Map", "Unlimited gap analyses"

**Expected:** CTAs create urgency, not just inform

#### Test C.2: Paywall Messaging
- [ ] **Paywalls say:** "See why competitors win" (not "upgrade for premium")
- [ ] **Show what they're missing** (competitors, sources)
- [ ] **Fear-based:** "Your competitors are on G2. You're not."
- [ ] **Clear path:** "Upgrade to Starter to unlock"

**Expected:** Paywalls create FOMO, not just restrictions

### D. Retention Mechanisms

#### Test D.1: Daily Engagement
- [ ] **Dashboard shows:** "Last checked: Today" (not just date)
- [ ] **"Run Check" button** prominent
- [ ] **Recent activity** visible (if applicable)
- [ ] **No dead dashboard** feeling

**Expected:** User wants to check daily

#### Test D.2: Progress Visibility
- [ ] **Week-over-week changes** always visible
- [ ] **Progress indicators** (bars, arrows, numbers)
- [ ] **"You're improving"** messaging when applicable
- [ ] **Historical data** accessible

**Expected:** User sees motion, stays subscribed

### E. Onboarding Flow

#### Test E.1: Immediate Value
- [ ] **Scan runs automatically** after signup
- [ ] **No empty dashboard** shown
- [ ] **Results appear within 60 seconds**
- [ ] **Losses shown first** (not wins)

**Expected:** User feels pain immediately

#### Test E.2: No Distractions
- [ ] **No navigation** during onboarding
- [ ] **No settings** visible
- [ ] **No site selector** until after scan
- [ ] **Just scan → results → dashboard**

**Expected:** User can't get distracted

### F. Homepage Optimization

#### Test F.1: Above-Fold Value
- [ ] **Domain input** visible without scrolling
- [ ] **Results show** before signup
- [ ] **Competitors visible** immediately
- [ ] **No email required** for preview

**Expected:** User sees value before commitment

#### Test F.2: Demo Exploration
- [ ] **"See how AI treats Notion"** button works
- [ ] **Shows real results** for demo brand
- [ ] **Builds trust** without signup
- [ ] **Easy to find** (not hidden)

**Expected:** Users can explore without friction

---

## 🚨 CRITICAL EDGE CASES

### Edge Case 1: User Has 0 Losses
- [ ] **Shows:** "Great! AI is recommending you in all checked queries"
- [ ] **Still shows wins** (but secondary)
- [ ] **Encourages more checks:** "Run more checks to discover opportunities"
- [ ] **Doesn't reduce urgency** (maybe they haven't checked enough)

**Expected:** Even with 0 losses, user wants to check more

### Edge Case 2: User Has 0 Wins
- [ ] **Shows:** "High-Intent Queries Missed: X" (large, red)
- [ ] **Losses table** shows all losses
- [ ] **"Why not me?" links** work
- [ ] **First win guidance** shown

**Expected:** User feels urgency, not hopelessness

### Edge Case 3: First-Time User
- [ ] **No empty dashboard** - shows CTA immediately
- [ ] **"Run your first check"** button prominent
- [ ] **Copy:** "AI is choosing your competitors right now"
- [ ] **No navigation** until after first check

**Expected:** User runs check immediately

### Edge Case 4: User Hasn't Checked in Days
- [ ] **Shows:** "Last checked: X days ago"
- [ ] **Urgent messaging:** "AI recommendations change daily"
- [ ] **"Run Check Now"** button prominent
- [ ] **Reminds of losses** from last check

**Expected:** User feels urgency to check again

---

## 📊 METRICS TO TRACK DURING TESTING

### Conversion Metrics
- [ ] **Homepage → Teaser:** % of visitors who check domain
- [ ] **Teaser → Signup:** % who sign up after seeing competitors
- [ ] **Signup → First Check:** % who run check immediately
- [ ] **Free → Paid:** % who upgrade after seeing losses

### Engagement Metrics
- [ ] **Daily active users:** Are users checking daily?
- [ ] **Checks per user:** How many checks per user?
- [ ] **Time to first check:** How quickly do users run first check?
- [ ] **Dashboard time:** How long do users spend on dashboard?

### Retention Metrics
- [ ] **Week 1 retention:** % of users who return after 7 days
- [ ] **Week 2 retention:** % of users who return after 14 days
- [ ] **Churn rate:** % who cancel (should be < 5% monthly)
- [ ] **Upgrade rate:** % who upgrade from free to paid

---

## ✅ COMPLETE TESTING FLOW

### Flow 1: New User Journey
1. [ ] **Homepage:** Enter domain → See competitors → Feel pain
2. [ ] **Teaser:** See detailed losses → Sign up
3. [ ] **Onboarding:** Auto-scan runs → See losses immediately
4. [ ] **Dashboard:** Losses first → "Why not me?" → Upgrade CTA

**Expected:** User feels pain → sees solution → pays

### Flow 2: Returning User Journey
1. [ ] **Dashboard:** See losses from last check → Urgency
2. [ ] **Run check:** See new losses → More urgency
3. [ ] **Progress:** See week-over-week improvement → Hope
4. [ ] **Email alert:** Competitor moved → Pull back

**Expected:** User stays engaged, doesn't churn

### Flow 3: Free User Upgrade Journey
1. [ ] **Hit limit:** "3 checks/day reached" → Upgrade CTA
2. [ ] **See paywall:** "Why not me?" blocked → Upgrade CTA
3. [ ] **Checkout:** Dodo redirect → Payment → Plan update
4. [ ] **Features unlock:** Immediately see full Trust Map

**Expected:** User upgrades when they hit limits

---

## 🎯 SUCCESS CRITERIA

### Must-Have (Critical)
- [ ] **Losses show FIRST** on dashboard
- [ ] **ONE metric** at top (High-Intent Queries Missed)
- [ ] **No empty states** - always show CTA
- [ ] **Auto-scan** runs after signup
- [ ] **Homepage shows competitors** before signup

### Should-Have (Important)
- [ ] **Week-over-week progress** visible
- [ ] **Email alerts** working (competitor movement)
- [ ] **Urgent UI** (red for losses, muted for wins)
- [ ] **Fear-based copy** throughout
- [ ] **Progress tracking** prominent

### Nice-to-Have (Enhancement)
- [ ] **Demo brand** button on homepage
- [ ] **First win engineering** (low-competition query guidance)
- [ ] **Weekly reports** sent
- [ ] **Historical progress** charts
- [ ] **Competitor movement** notifications

---

## 📝 TESTING NOTES TEMPLATE

For each test, document:

```markdown
### Test: [Name]
**Date:** [Date]
**Tester:** [Name]
**Result:** ✅ Pass / ❌ Fail / ⚠️ Partial

**What Worked:**
- [Observation]

**What Didn't Work:**
- [Issue]

**Impact on Conversion:**
- [How this affects payment/churn]

**Next Steps:**
- [Action items]
```

---

## 🚀 POST-TESTING ACTIONS

After testing, prioritize fixes:

1. **Critical Issues** (blocks conversion) → Fix immediately
2. **Important Issues** (reduces conversion) → Fix this week
3. **Enhancement Issues** (nice to have) → Fix if time allows

---

## 📚 REFERENCE DOCUMENTS

- `REVENUE_OPTIMIZATION_PLAN.md` - Full strategy
- `COMPLETE_TESTING_GUIDE.md` - Technical testing guide
- `TEST_ACCOUNTS_SETUP.md` - Test account setup
- `HANDOFF_REPORT.md` - Product overview

---

**Status:** Ready for Testing  
**Next:** Run through checklist systematically  
**Goal:** Verify all revenue optimization points work correctly

