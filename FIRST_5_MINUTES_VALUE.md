# 🎯 First 5 Minutes - Value for Each Tier

**CRITICAL:** This is make-or-break. Every tier MUST show value immediately.

---

## ✅ Free Tier - First 5 Minutes

### What Happens:
1. **Signup** → Redirects to onboarding
2. **Onboarding** → Auto-runs scan (30 seconds)
3. **Dashboard loads** → Shows results immediately

### What They See:
```
┌─────────────────────────────────────┐
│ ⚠️ QUERIES WHERE YOU'RE INVISIBLE    │
│                                      │
│           5                          │
│                                      │
│ AI recommended 5 competitors instead │
│ of you                               │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ ⚠️ Where AI ignores you (5)        │
│                                      │
│ Query: "best CRM tools"             │
│ AI recommends: HubSpot, Pipedrive   │
│ You: ❌                             │
│ [Why not me? →]                     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ ⚡ Your first AI mention is 1 step   │
│    away                             │
│                                      │
│ Most founders get their first       │
│ mention within 2 weeks by getting  │
│ listed on G2 or Capterra.          │
│                                      │
│ [Upgrade to Starter ($29/mo)]      │
└─────────────────────────────────────┘
```

### Value Delivered:
- ✅ **Instant clarity:** "AI doesn't know I exist"
- ✅ **Competitors shown:** "These guys are winning"
- ✅ **Clear path:** "Upgrade to see roadmap"

### Why They'll Pay:
- They see the problem (competitors winning)
- They see it's fixable (roadmap exists)
- They see the path (upgrade to Starter)

---

## ✅ Starter Tier - First 5 Minutes

### What Happens:
1. **Signup** → Redirects to onboarding
2. **Onboarding** → Auto-runs scan (30 seconds)
3. **Dashboard loads** → Shows results + Trust Map access

### What They See:
```
┌─────────────────────────────────────┐
│ ⚠️ QUERIES WHERE YOU'RE INVISIBLE    │
│                                      │
│           5                          │
│                                      │
│ AI recommended 5 competitors instead │
│ of you                               │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ ⚠️ Where AI ignores you (5)        │
│                                      │
│ Query: "best CRM tools"             │
│ AI recommends: HubSpot, Pipedrive   │
│ You: ❌                             │
│ [Why not me? →]                     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 🔍 See where AI gets its answers    │
│                                      │
│ Your competitors are on these       │
│ sources. You're not.                │
│                                      │
│ [View AI Trust Map →]               │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 🗺️ AI Trust Map                     │
│                                      │
│ G2: Competitors ✓ | You: ✗          │
│ Capterra: Competitors ✓ | You: ✗    │
│                                      │
│ [Expand G2] → Shows step-by-step    │
│  1. Create G2 seller account        │
│  2. Claim your listing              │
│  3. Add product details             │
│  4. Invite reviews                  │
│                                      │
│ [Get my visibility roadmap →]       │
└─────────────────────────────────────┘
```

### Value Delivered:
- ✅ **Instant clarity:** "I know exactly where competitors are"
- ✅ **Actionable steps:** "Here's how to get listed on G2"
- ✅ **Progress tracking:** Can mark steps complete

### Why They'll Pay:
- They see the sources (G2, Capterra)
- They see how to fix it (step-by-step)
- They feel progress (checking off steps)

---

## ✅ Pro Tier - First 5 Minutes

### What Happens:
1. **Signup** → Redirects to onboarding
2. **Onboarding** → Auto-runs scan (30 seconds)
3. **Dashboard loads** → Full visibility, all features

### What They See:
```
┌─────────────────────────────────────┐
│ ⚠️ QUERIES WHERE YOU'RE INVISIBLE    │
│                                      │
│           5                          │
│                                      │
│ AI recommended 5 competitors instead │
│ of you                               │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ ⚠️ Where AI ignores you (5)        │
│                                      │
│ Query: "best CRM tools"             │
│ AI recommends: HubSpot, Pipedrive   │
│ You: ❌                             │
│ [Why not me? →] (Unlimited access)  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 🔍 See where AI gets its answers    │
│                                      │
│ [View AI Trust Map →]               │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 🗺️ Get your complete visibility     │
│    roadmap                           │
│                                      │
│ Step-by-step instructions to get    │
│ listed on every source AI trusts.   │
│                                      │
│ [View Full Roadmap →]               │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ ⚡ Hourly Monitoring Active          │
│                                      │
│ Next check in 23 minutes            │
│                                      │
│ You'll get alerts when competitors  │
│ overtake you.                        │
└─────────────────────────────────────┘
```

### Value Delivered:
- ✅ **Instant clarity:** "I see everything"
- ✅ **Full control:** "I can analyze any query"
- ✅ **Elite feeling:** "I'm serious about this"

### Why They'll Pay:
- They see everything immediately
- They feel like they're in control
- They see it's worth $79/mo for the full picture

---

## 🔥 Critical Implementation Details

### 1. Auto-Scan MUST Run
- ✅ Onboarding page triggers scan automatically
- ✅ Shows terminal-style progress
- ✅ Redirects to dashboard with `justScanned=true`
- ✅ Dashboard fetches fresh results immediately

### 2. Dashboard Shows Losses First
- ✅ Big red number at top (invisible queries)
- ✅ Competitors table immediately visible
- ✅ "Why not me?" links work (plan-dependent)
- ✅ Clear next steps based on plan

### 3. Plan-Specific Value Shown
- **Free:** Problem + upgrade path to Starter
- **Starter:** Problem + Trust Map + roadmap access
- **Pro:** Everything + hourly monitoring status

### 4. Never Show Empty State
- ✅ Always show CTA if no data
- ✅ Always show "Run Check Now" button
- ✅ Always show value proposition

---

## ✅ What's Implemented

- [x] Auto-scan on signup (onboarding page)
- [x] Dashboard shows losses first
- [x] Free tier shows upgrade path
- [x] Starter tier shows Trust Map CTA
- [x] Pro tier shows full roadmap CTA
- [x] Trust Map accessible to Free (read-only)
- [x] Plan-specific next steps
- [x] No empty states

---

## 🎯 Testing Checklist

### Free Tier:
- [ ] Signup → Auto-scan runs
- [ ] Dashboard shows losses
- [ ] Upgrade CTA shows
- [ ] Trust Map accessible (read-only)
- [ ] "Why not me?" shows paywall

### Starter Tier:
- [ ] Signup → Auto-scan runs
- [ ] Dashboard shows losses
- [ ] Trust Map CTA shows
- [ ] Trust Map shows step-by-step
- [ ] Roadmap accessible

### Pro Tier:
- [ ] Signup → Auto-scan runs
- [ ] Dashboard shows losses
- [ ] All features accessible
- [ ] Hourly monitoring status shows
- [ ] Full roadmap accessible

---

**This is make-or-break. Every tier MUST show value in first 5 minutes or users bounce.**

