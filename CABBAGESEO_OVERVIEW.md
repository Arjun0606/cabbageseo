# CabbageSEO - Product Overview

> **AI Visibility Intelligence for SaaS Founders**

---

## Executive Summary

CabbageSEO shows SaaS founders whether AI (ChatGPT, Perplexity, Google AI) recommends their product — and provides a roadmap to get included if it doesn't.

**Target:** $100k MRR by June 2026

---

## The Problem

### The Shift in Buyer Behavior

People don't Google like they used to. Instead of searching "best project management software" and clicking through 10 results, they now ask:

- *"ChatGPT, what's the best CRM for startups?"*
- *"Perplexity, what are the best Notion alternatives?"*
- *"What tool should I use for email marketing?"*

**AI gives ONE answer. If you're not in it, you don't exist.**

### The Visibility Gap

| Old World (Google) | New World (AI) |
|-------------------|----------------|
| 10 blue links | 1 recommendation |
| SEO gets you ranked | ??? gets you cited |
| Google Analytics tracks it | No tracking exists |
| Months to rank | Instant or never |

**The problem:** Founders have zero visibility into whether AI recommends them or their competitors. Google Analytics doesn't track ChatGPT. Traditional SEO tools don't cover AI recommendations.

### Who Feels This Pain Most

1. **Solo SaaS founders** — Every customer matters, can't afford to be invisible
2. **Indie hackers** — Competing against well-funded competitors
3. **Micro-SaaS builders** — Niche tools that live or die on "best X" queries
4. **B2B tools** — Where buyers research via AI before purchasing

---

## The Solution

### What CabbageSEO Does

CabbageSEO is an **AI Visibility Intelligence** platform that:

1. **Monitors AI recommendations** — Tracks what ChatGPT, Perplexity, and Google AI say when asked about your product category

2. **Identifies losses** — Shows exactly which queries your competitors are cited for and you're not

3. **Maps trust sources** — Reveals where AI learns about products (G2, Product Hunt, Reddit, etc.) and whether you're listed

4. **Provides a fix roadmap** — Step-by-step instructions to become the AI's recommendation

### The Core Value Proposition

> "AI is recommending your competitors. We show you where, why, and how to flip it."

---

## How It Works (Technical)

### 1. Domain Check (Entry Point)

User enters their domain → We query real AI APIs:

```
User: "cabbageseo.com"
↓
System generates queries:
- "What are the best AI SEO tools?"
- "Best alternatives to [competitor]?"
- "What is CabbageSEO?"
↓
Queries sent to:
- Perplexity API
- Google AI (Gemini)
- OpenAI API (ChatGPT)
↓
Parse responses for:
- Was the domain mentioned? (Win)
- Who was mentioned instead? (Loss)
- What sources did AI cite?
```

### 2. The Dashboard (War Room)

After signup, users see:

**Primary Metric: "Queries Where You're Invisible"**
- Number of queries where AI recommended competitors, not them
- This is the fear driver — shows the pain immediately

**Losses Table:**
| Query | Platform | Competitors Cited | Action |
|-------|----------|-------------------|--------|
| "best CRM for startups" | ChatGPT | HubSpot, Pipedrive | Why not me? →|

**Wins Section (muted):**
- Queries where they were mentioned
- Positive reinforcement, but secondary

### 3. AI Trust Map

Shows the sources AI uses to learn about products:

| Source | Priority | Competitors Listed | You Listed |
|--------|----------|-------------------|------------|
| G2 | Critical | ✅ Yes | ❌ No |
| Capterra | Critical | ✅ Yes | ❌ No |
| Product Hunt | High | ✅ Yes | ❌ No |
| Reddit | High | ✅ Yes | ❌ No |

**Insight:** AI trusts these sources. If competitors are listed and you're not, that's why AI recommends them.

### 4. Visibility Roadmap (Paid Feature)

Step-by-step instructions:

```
Step 1: Get listed on G2 (Critical)
├── Create seller account at sell.g2.com
├── Claim your product listing
├── Request 5 reviews from existing customers
├── Expected outcome: AI starts finding you in G2 data
└── Time: 2-3 hours

Step 2: Create a comparison page
├── Title: "[Your Product] vs [Top Competitor]"
├── Include: Feature comparison, pricing, use cases
├── Publish on your blog
└── Time: 1-2 hours

Step 3: Answer Quora/Reddit questions
├── Find questions about your category
├── Provide genuine, helpful answers mentioning your tool
└── Time: 30 min/day
```

### 5. "Why Not Me?" Analysis (Paid Feature)

Deep dive into a specific query:

```
Query: "What's the best project management tool?"

AI Recommended: Asana, Monday.com, ClickUp
AI Did NOT Recommend: You

Why They Won:
1. Listed on G2 with 1000+ reviews
2. Have comparison pages for every competitor
3. Active presence on Reddit r/productivity
4. Wikipedia page exists

What You're Missing:
1. No G2 listing
2. No comparison content
3. No community presence

Fix It:
- Create page: "Best Project Management Tools for [Your Niche]"
- Include these headings: [AI-generated suggestions]
- Mention these entities: [Key terms AI associates with this query]
```

---

## Business Model

### Pricing Tiers

| Tier | Price | Target User | Key Value |
|------|-------|-------------|-----------|
| **Free** | $0 | Curious founders | See if you're invisible (7-day trial) |
| **Starter** | $29/mo | Solo founders | Daily monitoring + content fixes |
| **Pro** | $79/mo | Serious founders | Hourly monitoring + full roadmap |

### Unit Economics

| Metric | Value |
|--------|-------|
| Free → Paid conversion target | 5-10% |
| Starter ARPU | $29 |
| Pro ARPU | $79 |
| Blended ARPU (est.) | $45 |
| Monthly churn target | <5% |
| LTV (12mo, 5% churn) | $540 |
| CAC target | <$100 |

### Revenue Path to $100k MRR

| Month | Target MRR | Paying Customers | Key Action |
|-------|-----------|------------------|------------|
| March | $5k | ~110 | Product Hunt launch |
| April | $15k | ~330 | Reddit/Twitter viral loops |
| May | $40k | ~890 | Referral program, content marketing |
| June | $100k | ~2,200 | Scale what works |

---

## Competitive Landscape

### Direct Competitors

| Product | Focus | Price | Gap |
|---------|-------|-------|-----|
| **None direct** | - | - | Blue ocean |

### Adjacent Tools

| Product | What They Do | Why We're Different |
|---------|--------------|---------------------|
| Ahrefs/SEMrush | Traditional SEO | Don't track AI citations |
| SparkToro | Audience research | Don't track AI recommendations |
| Brand24 | Social monitoring | Don't track AI specifically |
| Brandwatch | Enterprise monitoring | Too expensive, not AI-focused |

### Our Moat

1. **First mover** — No one else tracks AI recommendations for SMBs
2. **Founder-focused** — Built for indie hackers, not enterprises
3. **Actionable** — Not just dashboards, actual fix instructions
4. **Honest pricing** — $29-79/mo vs $299+/mo for enterprise tools

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, React, TailwindCSS |
| Backend | Next.js API Routes, Edge Functions |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Payments | Dodo Payments |
| AI APIs | Perplexity, Google AI, OpenAI |
| Background Jobs | Inngest |
| Email | Resend |
| Hosting | Vercel |

### API Usage (Cost Considerations)

| API | Cost per Check | Notes |
|-----|----------------|-------|
| Perplexity | ~$0.001-0.005 | Primary AI query source |
| Google AI | ~$0.001 | Backup/secondary |
| OpenAI | ~$0.01-0.03 | Premium queries only |

**Estimated cost per user/month:** $0.50-2.00 (depending on usage)

---

## Why This Has $100k/mo Potential

### 1. Real Pain, Urgent Problem

- Buyers are shifting to AI for recommendations NOW
- Founders are losing customers they never knew existed
- No existing solution addresses this

### 2. Large Addressable Market

- **SaaS companies globally:** 30,000+
- **Indie hackers/solo founders:** 100,000+
- **Marketing agencies:** 50,000+
- Even 1% penetration = massive opportunity

### 3. Word-of-Mouth Potential

- Built-in virality: "I just found out ChatGPT doesn't recommend me"
- Shareable results: "My competitor is in 8/10 AI answers, I'm in 0"
- Community-driven: Indie hackers love sharing tools

### 4. Clear Value = Clear Conversion

- Free check shows the problem immediately
- Upgrade path is obvious: "Want to fix it? Pay us."
- No complex sales cycle

### 5. Sticky Once Adopted

- Users want ongoing monitoring (daily/hourly checks)
- Progress tracking creates engagement
- Alerts when competitors gain ground

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| AI APIs change | Multi-provider strategy, quick adaptation |
| Big player enters | First-mover advantage, founder focus |
| AI recommendations stabilize | Pivot to optimization, not just monitoring |
| Low conversion | Double down on free value, reduce friction |

---

## What We're Asking

**Feedback on:**

1. Does the problem resonate? Have you experienced this?
2. Is $29-79/mo the right price point?
3. Would you pay for this? Why/why not?
4. What's missing that would make this a must-have?

---

## Try It

🔗 **https://cabbageseo.com**

Enter any domain, see who AI recommends — takes 10 seconds.

---

*Built with 🥬 for founders*

