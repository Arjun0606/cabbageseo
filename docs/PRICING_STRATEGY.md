# CabbageSEO Pricing Strategy

## Third-Party Services & Costs

### 1. **Anthropic Claude API** (Core AI Engine)
| Model | Input (per 1M tokens) | Output (per 1M tokens) | Use Case |
|-------|----------------------|------------------------|----------|
| Haiku 4.5 | $1.00 | $5.00 | Quick analysis, clustering, JSON extraction |
| Sonnet 4.5 | $3.00 | $15.00 | Content generation, optimization |
| Opus 4.5 | $5.00 | $25.00 | Premium content (Pro+ only) |

**Typical Usage Per Article:**
- Haiku calls (outline, keywords, metadata): ~2,000 input + 500 output = ~$0.004
- Sonnet (full article ~2,000 words): ~3,000 input + 8,000 output = ~$0.13
- **Total per article: ~$0.15-0.25** (depending on length)

### 2. **DataForSEO** (SEO Data)
| Endpoint | Cost | Use Case |
|----------|------|----------|
| Keywords Search Volume | $0.0015/keyword | Keyword research |
| Keyword Suggestions | $0.02/request (up to 100 keywords) | Discovery |
| SERP Analysis | $0.02/request | Competitor analysis |
| Backlinks Summary | $0.02/request | Backlink overview |
| Backlinks List | $0.04/request | Detailed backlinks |
| Ranked Keywords | $0.05/request | Competitor keywords |

**Typical Usage Per Site Setup:**
- 50 keyword lookups: ~$0.075
- 5 SERP analyses: ~$0.10
- 1 backlink summary: ~$0.02
- **Total: ~$0.20**

### 3. **SerpAPI** (Alternative SERP Data)
| Plan | Searches/Month | Price | Per Search |
|------|---------------|-------|------------|
| Developer | 100 | Free | $0.00 |
| Business | 5,000 | $50 | $0.01 |
| Business Plus | 15,000 | $130 | $0.0087 |
| Enterprise | 50,000 | $350 | $0.007 |

**We use DataForSEO primarily; SerpAPI as fallback**

### 4. **Resend** (Transactional Email)
| Plan | Emails/Month | Price |
|------|-------------|-------|
| Free | 3,000 | $0 |
| Pro | 50,000 | $20 |
| Scale | 100,000 | $60 |

**Cost per email: $0.0004-0.0006** (negligible)

### 5. **Supabase** (Database + Auth + Storage)
| Plan | Price | Includes |
|------|-------|----------|
| Free | $0 | 500MB DB, 1GB storage, 50K MAU |
| Pro | $25/month | 8GB DB, 100GB storage, 100K MAU |
| Team | $599/month | Unlimited |

**For our scale: $25-$100/month fixed**

### 6. **Vercel** (Hosting)
| Plan | Price | Includes |
|------|-------|----------|
| Hobby | $0 | Personal use |
| Pro | $20/month | Commercial, team |
| Enterprise | Custom | SLA, support |

**For our scale: $20-$50/month fixed**

---

## Cost Breakdown Per Operation

| Operation | Our Cost | What We Charge | Margin |
|-----------|----------|---------------|--------|
| **AI Article (2,000 words)** | $0.20 | $3.00 | 93% |
| **100 Keywords Analyzed** | $0.15 | $5.00 | 97% |
| **SERP Analysis** | $0.02 | $0.25 | 92% |
| **Technical Audit (100 pages)** | $0.10 | $1.00 | 90% |
| **AIO Analysis** | $0.08 | $0.50 | 84% |
| **Backlink Analysis** | $0.06 | $0.50 | 88% |

**Average Margin: 90%+** ✅

---

## Plan Structure

### Starter - $29/month ($24/mo yearly)
**Target:** Bloggers, small sites, hobbyists

| Resource | Limit | Our Cost | Headroom |
|----------|-------|----------|----------|
| Sites | 1 | - | - |
| AI Articles | 10/mo | $2.00 | $27 |
| Keywords Tracked | 100 | $0.15 | - |
| Audits | 5/mo | $0.50 | - |
| AI Credits | 1,000 | $0.10 | - |
| **Total Max Cost** | | **$2.75** | **90% margin** |

### Pro - $79/month ($66/mo yearly)
**Target:** Growing businesses, consultants

| Resource | Limit | Our Cost | Headroom |
|----------|-------|----------|----------|
| Sites | 5 | - | - |
| AI Articles | 50/mo | $10.00 | $69 |
| Keywords Tracked | 500 | $0.75 | - |
| Audits | 20/mo | $2.00 | - |
| AI Credits | 5,000 | $0.50 | - |
| **Total Max Cost** | | **$13.25** | **83% margin** |

### Pro+ - $199/month ($166/mo yearly)
**Target:** Agencies, large sites

| Resource | Limit | Our Cost | Headroom |
|----------|-------|----------|----------|
| Sites | 20 | - | - |
| AI Articles | 200/mo | $40.00 | $159 |
| Keywords Tracked | 2,000 | $3.00 | - |
| Audits | Unlimited* | $10.00 | - |
| AI Credits | 20,000 | $2.00 | - |
| **Total Max Cost** | | **$55.00** | **72% margin** |

*Unlimited capped at 100/month internal limit

---

## Overage Pricing (90% Margin Target)

### Strategy: Pay-as-You-Go with Spending Cap

**NOT prepaid credits.** Users set a spending limit, use at will, get billed for actual usage.

#### How It Works:
1. **User hits plan limit** → Prompted to:
   - Upgrade plan, OR
   - Set a spending cap (e.g., $100)
2. **With cap enabled** → Continue using at 90% markup
3. **Cap reached** → Blocked until they:
   - Increase the cap (e.g., +$50)
   - Upgrade plan
4. **We bill in real-time** → Never front costs ✅

| Resource | Our Cost | Overage Price | Margin |
|----------|----------|---------------|--------|
| Extra Article | $0.20 | $3.00 | 93% |
| 100 Extra Keywords | $0.15 | $5.00 | 97% |
| Extra Audit | $0.10 | $1.00 | 90% |
| 1,000 AI Credits | $0.10 | $2.00 | 95% |
| AIO Analysis | $0.08 | $0.50 | 84% |
| SERP Analysis | $0.02 | $0.25 | 92% |
| Backlink Analysis | $0.06 | $0.50 | 88% |

### Spending Cap Options

Users set their own limit. Minimum: $10. Common presets:

| Cap | Use Case |
|-----|----------|
| $10 | Just testing overages |
| $50 | Light overflow |
| $100 | Standard buffer |
| $250 | Heavy usage month |
| $500 | Agency client work |

### Auto-Increase Option

Users can enable **auto-bump** when cap is hit:
- Default: OFF (must manually increase)
- If ON: Cap increases by $50 automatically
- User notified at 50%, 80%, 100% of cap

### Why This Is Safer Than Prepaid Credits

| Prepaid Credits | Pay-as-You-Go with Cap |
|-----------------|------------------------|
| Revenue upfront, cost later | Revenue = Cost timing |
| Users may never use credits | Users pay for what they use |
| Refund headaches | No refunds needed |
| Complex balance tracking | Simple: usage → charge |
| Users forget they have credits | Clear cap = clear expectations |

**We never get screwed because:**
1. Cap is set BEFORE usage starts
2. Usage stops at cap (hard block)
3. Billed in real-time via Dodo Payments
4. 90% margin on every overage transaction

### Implementation

```
POST /api/billing/overages
{
  "spendingCapDollars": 100,
  "autoIncrease": false
}

PATCH /api/billing/overages
{
  "action": "increase_cap",
  "amount": 50
}
```

---

## Revenue Projections

### Per-Customer Unit Economics

| Plan | MRR | Avg Cost | Gross Margin |
|------|-----|----------|--------------|
| Starter | $29 | $2.75 | 91% |
| Pro | $79 | $10.00 | 87% |
| Pro+ | $199 | $40.00 | 80% |

### Blended Assumptions (1,000 customers)
- 60% Starter, 30% Pro, 10% Pro+
- Average Overage/Customer: $15/mo

| Metric | Monthly |
|--------|---------|
| Subscription Revenue | $59,100 |
| Overage Revenue | $15,000 |
| **Total Revenue** | **$74,100** |
| API Costs | ~$8,000 |
| Infrastructure | ~$500 |
| **Gross Profit** | **$65,600 (89%)** |

---

## Safety Mechanisms

### 1. **Hard Limits**
- Users cannot exceed plan limits without prepaid credits
- Automatic pause at 100% usage if no credits available

### 2. **Spend Caps**
- Users set monthly overage cap (default: $50)
- Email warning at 80% of cap

### 3. **Soft Limits for Pro+**
- "Unlimited" audits = 100/month internal cap
- Fair use policy for edge cases

### 4. **Cost Monitoring**
- Real-time wallet balance tracking
- Daily cost reports to admin
- Alert if margins drop below 80%

### 5. **Rate Limiting**
- Starter: 10 requests/min, 2 concurrent
- Pro: 30 requests/min, 5 concurrent  
- Pro+: 60 requests/min, 10 concurrent

---

## Competitive Analysis

| Competitor | Similar Plan | Price | Our Advantage |
|------------|-------------|-------|---------------|
| Surfer SEO | Basic | $89/mo | We're cheaper, include AI content |
| Semrush | Pro | $129/mo | We're AI-native, simpler |
| Ahrefs | Lite | $99/mo | We include content gen |
| Jasper | Creator | $39/mo | We include SEO data |
| MarketMuse | Track | $149/mo | We're more accessible |

**Our positioning: "The AI-native SEO OS at a fair price"**

---

## Implementation Checklist

- [x] Usage tracking in database (`usage` table)
- [x] Credit balance tracking (`credit_balance` table)
- [x] Plan limits in code (`src/lib/billing/plans.ts`)
- [ ] Dodo Payments integration for subscriptions
- [ ] Dodo Payments for credit purchases
- [ ] Usage enforcement middleware
- [ ] Overage warning emails
- [ ] Admin cost dashboard
- [ ] Public pricing page

---

## Summary

| Metric | Target | Achieved |
|--------|--------|----------|
| Subscription Margin | >80% | ✅ 80-91% |
| Overage Margin | >85% | ✅ 82-97% |
| Blended Gross Margin | >85% | ✅ 89% |

**We stay in the green by:**
1. Using Haiku for quick tasks (10x cheaper than Sonnet)
2. Aggressive caching of SEO data
3. Prepaid credits (revenue before cost)
4. Hard limits preventing runaway costs
5. 90%+ margins on all overages

