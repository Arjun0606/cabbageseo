# CabbageSEO Product Blueprint
## Complete UI/UX and Workflow Documentation

---

## 🎯 What CabbageSEO Is

**CabbageSEO is AI Visibility Intelligence** — it shows founders where AI (ChatGPT, Perplexity, Google AI) is sending customers in their market, and provides actionable steps to get recommended.

### The Core Value Proposition
> "AI is recommending your competitors instead of you. We show you why and what to do about it."

---

## 📱 Current Page Structure

### Marketing Pages (Public)
| Page | Path | Purpose |
|------|------|---------|
| Homepage | `/` | Domain input → Teaser → Signup funnel |
| Pricing | `/pricing` | Plan comparison and conversion |
| Docs/How It Works | `/docs` | Explains methodology |
| Privacy Policy | `/privacy` | Legal |
| Terms of Service | `/terms` | Legal |
| Feedback | `/feedback` | User feedback form |
| Teaser Results | `/teaser` | "Gut punch" showing AI invisibility |
| AI Profile | `/ai-profile/[domain]` | Public profile (optional) |
| Leaderboard | `/leaderboard/[category]` | Category rankings |

### Auth Pages
| Page | Path | Purpose |
|------|------|---------|
| Login | `/login` | Email/Google sign in |
| Signup | `/signup` | New user registration |
| Forgot Password | `/forgot-password` | Password reset |

### Dashboard Pages (Authenticated)
| Page | Path | Purpose |
|------|------|---------|
| Main Dashboard | `/dashboard` | Wins/Losses overview |
| Query Analysis | `/dashboard/query` | "Why Not Me?" deep dive |
| Trust Map | `/dashboard/sources` | Where AI gets info |
| Roadmap | `/dashboard/roadmap` | Step-by-step visibility plan |
| Onboarding | `/onboarding` | Live scan after signup |
| Citations | `/citations` | Historical citation data |
| Competitors | `/competitors` | Competitor management |
| Intelligence | `/intelligence` | AI recommendations |
| Analyze | `/analyze` | Site analysis |
| Settings | `/settings` | Account settings |
| Billing | `/settings/billing` | Subscription management |
| Notifications | `/settings/notifications` | Alert preferences |

---

## 💰 Pricing Tiers & Features

### FREE ($0 for 7 days)
**Target:** Quick check, exploration
**Access:** 7-day window to try the product

| Feature | Limit |
|---------|-------|
| Sites | 1 |
| Manual checks/day | 3 |
| History | 7 days |
| Raw AI responses | ✅ |
| Automated monitoring | ❌ |
| CSV export | ❌ |
| API access | ❌ |
| Email alerts | ❌ |
| Content fixes | ❌ |
| Trust Map (full) | ❌ |
| Action Roadmap | ❌ |

**Dashboard Experience:**
- See which queries mention competitors vs you
- Basic "who AI recommends" view
- Limited to manual checks only
- After 7 days → must upgrade or lose access

---

### STARTER ($29/mo)
**Target:** Solo founders who need daily monitoring
**Value:** "Know where you're losing"

| Feature | Limit |
|---------|-------|
| Sites | 3 |
| Checks/month | 100 |
| Monitoring | Daily automated |
| History | 30 days |
| Competitors per site | 2 |
| Content fixes/month | 5 |
| Email alerts | ✅ |
| CSV export | ✅ |
| Trust Map | Partial (top 5 sources) |
| Action Roadmap | Basic |

**Dashboard Experience:**
- Daily automated checks
- Email alerts when competitors gain
- 5 "Why Not Me?" analyses per month
- Basic content fix suggestions
- See top 5 trusted sources

---

### PRO ($79/mo)
**Target:** Serious founders and small teams
**Value:** "Take back your market"

| Feature | Limit |
|---------|-------|
| Sites | 10 |
| Checks/month | 1000 |
| Monitoring | Hourly automated |
| History | 1 year |
| Competitors per site | 10 |
| Content fixes/month | Unlimited |
| Email alerts | ✅ (instant) |
| CSV export | ✅ |
| API access | ✅ |
| Priority support | ✅ |
| Trust Map | Full |
| Action Roadmap | Full + Weekly Playbook |

**Dashboard Experience:**
- Hourly monitoring with instant alerts
- Unlimited "Why Not Me?" analyses
- Complete Trust Map showing all sources
- Full action roadmap with step-by-step instructions
- Weekly AI action playbook
- Competitor takeover alerts

---

## 🔄 User Journey & Workflows

### Flow 1: New User Discovery → Signup

```
Homepage (/) 
    ↓ [Enter domain]
Teaser Results (/teaser)
    ↓ [See competitors winning]
    ↓ [Emotional impact: "You're invisible"]
Signup (/signup)
    ↓ [Create account]
Onboarding (/onboarding)
    ↓ [Live terminal-style scan]
Dashboard (/dashboard)
```

### Flow 2: Free User Daily Usage

```
Login → Dashboard
    ↓ [View wins/losses]
    ↓ [3 manual checks available]
Run Check
    ↓ [Select query or auto-generate]
    ↓ [See AI responses]
View Results
    ↓ [See who AI mentioned]
    ↓ [Competitor highlighted if you're not]
Paywall
    ↓ [Want "Why Not Me?"? → Upgrade]
    ↓ [Want Trust Map? → Upgrade]
```

### Flow 3: Starter User Daily Usage

```
Dashboard shows:
    - Daily automated check results
    - Wins vs Losses count
    - Email alert summary

Click on "Loss" query:
    - See full AI response
    - See which competitors mentioned
    - Use 1 of 5 monthly "Content Fix" analyses
    
Trust Map (partial):
    - See top 5 sources AI uses
    - See if competitors listed there
    
Weekly email:
    - Summary of position changes
    - Recommended actions
```

### Flow 4: Pro User Daily Usage

```
Dashboard shows:
    - Hourly monitoring status
    - Real-time wins/losses
    - Market share trend
    - Takeover alerts

Click on any query:
    - Unlimited "Why Not Me?" analysis
    - Full content fix roadmap
    - Competitor comparison
    
Trust Map (full):
    - All sources AI trusts
    - Step-by-step listing instructions
    - Impact tracking (did listing work?)
    
Action Roadmap:
    - Prioritized to-do list
    - "Get listed on G2" with instructions
    - Track progress over time
    
Weekly Playbook:
    - Top 3 actions for the week
    - Competitor movements
    - Opportunity alerts
```

---

## 🖥️ Dashboard UI Components

### Main Dashboard (`/dashboard`)

**Header Section:**
- Site selector dropdown
- Quick stats: Wins | Losses | Checks remaining
- Upgrade CTA (if on Free/Starter)

**Battle Summary Cards:**
```
┌─────────────────┬─────────────────┬─────────────────┐
│  Queries Won    │  Queries Lost   │  AI Mention     │
│     12          │      8          │    Share: 24%   │
│  (you cited)    │ (competitors)   │  (of tracked)   │
└─────────────────┴─────────────────┴─────────────────┘
```

**Losses Table:**
| Query | Who AI Recommends | Your Status | Action |
|-------|-------------------|-------------|--------|
| "best CRM for startups" | Notion, HubSpot | ❌ Not mentioned | Why Not Me? |
| "project management tools" | Asana, ClickUp | ❌ Not mentioned | Why Not Me? |

**Trust Map Preview:**
- Shows top sources (G2, Capterra, etc.)
- Indicates if competitors are listed
- Paywall for full map (Free tier)

---

### Query Analysis (`/dashboard/query`)

**For a specific query:**
```
Query: "best email marketing tool"

AI Response:
"Based on my research, the top email marketing tools are:
1. Mailchimp - Great for beginners...
2. ConvertKit - Best for creators...
3. Klaviyo - Best for e-commerce..."

Your Status: ❌ NOT MENTIONED

Why Not You?
┌─────────────────────────────────────────────────────┐
│ 1. Missing from G2 comparison pages                 │
│ 2. No presence on "alternatives to Mailchimp" SERPs │
│ 3. Competitor has 3x more review signals            │
│ 4. Your landing page lacks comparison content       │
└─────────────────────────────────────────────────────┘

Content Fix Roadmap:
- Create: "[Your Tool] vs Mailchimp" comparison page
- Add: Integration mentions (Shopify, WordPress)
- Get listed: G2, Capterra, Product Hunt
```

---

### Trust Map (`/dashboard/sources`)

**Visual representation of where AI gets info:**
```
┌──────────────────────────────────────────────────────┐
│ Sources AI Trusts for Your Category                  │
├──────────────────────────────────────────────────────┤
│ 🟢 G2.com          Competitor ✅  You ❌  → Get Listed │
│ 🟢 Capterra        Competitor ✅  You ❌  → Get Listed │
│ 🟡 Product Hunt    Competitor ✅  You ✅  → Optimize   │
│ 🟡 Reddit          Competitor ✅  You ❌  → Engage     │
│ 🔴 Industry blogs  Competitor ✅  You ❌  → Pitch      │
└──────────────────────────────────────────────────────┘
```

**Paywall (Free tier):** Shows only 2 sources, blur the rest

---

### Roadmap (`/dashboard/roadmap`)

**Action items with instructions:**
```
Your AI Visibility Roadmap

Priority 1: Get Listed on G2 ⚡
├─ Estimated impact: +15% AI mentions
├─ Difficulty: Medium
├─ Steps:
│   1. Create G2 vendor account
│   2. Complete company profile
│   3. Request 5 customer reviews
│   4. Add comparison content
└─ Time estimate: 2-3 weeks

Priority 2: Create Comparison Content 📝
├─ Estimated impact: +10% AI mentions
├─ ...
```

---

## 🔌 API Endpoints

### Core APIs
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/me` | GET | Current user data |
| `/api/sites` | GET/POST | Site CRUD |
| `/api/geo/citations/check` | POST | Run AI check |
| `/api/geo/teaser` | POST | Quick scan (no auth) |
| `/api/geo/intelligence/actions` | GET/POST | Content fixes |

### Billing APIs
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/billing/checkout` | POST | Create checkout |
| `/api/billing/portal` | GET | Customer portal |
| `/api/billing/usage` | GET | Usage stats |

---

## ⚠️ Current Inconsistencies to Fix

### Homepage Issues:
1. ❌ Shows "Start free trial" on Starter/Pro cards
2. ❌ Pricing section doesn't match /pricing page

### Pricing Page Issues:
1. ❌ Badge says "7-day free trial on all paid plans"
2. ❌ Starter CTA says "Start Winning — 7 Days Free"
3. ❌ FAQ still mentions free trial
4. ❌ Bottom CTA says "Start Your Free Trial"

### Free Tier Issues:
1. ❌ Should show "7 days" not "forever"
2. ❌ Need to enforce 7-day expiration in code

### Dashboard Issues:
1. ❌ Multiple overlapping pages (citations, intelligence, analyze)
2. ❌ Trust Map paywalling not fully implemented
3. ❌ Roadmap not connected to real data

---

## 🛠️ Recommended Cleanup

### Pages to KEEP:
- `/` (homepage with domain input)
- `/pricing` (clean pricing)
- `/docs` (methodology)
- `/privacy`, `/terms` (legal)
- `/feedback` (user feedback)
- `/login`, `/signup` (auth)
- `/dashboard` (main wins/losses view)
- `/dashboard/query` (why not me analysis)
- `/dashboard/sources` (trust map)
- `/dashboard/roadmap` (action plan)
- `/settings/billing` (subscription)
- `/onboarding` (post-signup scan)

### Pages to REMOVE or MERGE:
- `/citations` → merge into `/dashboard`
- `/competitors` → merge into `/dashboard`
- `/intelligence` → merge into `/dashboard/query`
- `/analyze` → remove (redundant)
- `/settings/notifications` → simplify into `/settings`
- `/ai-profile/[domain]` → keep but make optional
- `/leaderboard/[category]` → defer for v2

### APIs to REMOVE:
- All `/api/test/*` endpoints (testing only)
- Redundant intelligence endpoints

---

## 📊 Metrics to Track

### Conversion Metrics:
- Homepage → Teaser conversion
- Teaser → Signup conversion
- Free → Starter upgrade rate
- Starter → Pro upgrade rate

### Engagement Metrics:
- Daily active users
- Checks per user per day
- "Why Not Me?" usage
- Roadmap action completion

### Revenue Metrics:
- MRR
- Churn rate
- Average revenue per user

---

## 🚀 Launch Readiness Checklist

- [ ] Fix all pricing inconsistencies
- [ ] Implement 7-day Free tier expiration
- [ ] Clean up unused pages
- [ ] Ensure paywall properly gates features
- [ ] Test signup → onboarding → dashboard flow
- [ ] Test upgrade flow for each tier
- [ ] Remove all test endpoints from production
- [ ] Verify email alerts work
- [ ] Verify billing/checkout works

---

*Last updated: January 2026*

