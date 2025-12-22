# CabbageSEO Environment Setup

## Required Environment Variables

Copy these to your `.env.local` file:

```bash
# ============================================
# SUPABASE
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# ============================================
# APP
# ============================================
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# ============================================
# DODO PAYMENTS
# https://docs.dodopayments.com
# ============================================
DODO_PAYMENTS_API_KEY=sk_live_...
DODO_WEBHOOK_SECRET=whsec_...

# Product IDs (from Dodo Dashboard)
DODO_STARTER_MONTHLY_ID=pdt_0NUbpXQ1QJLfhZ3G1RNEA
DODO_STARTER_YEARLY_ID=pdt_0NUbq9soPHPc4QjNb4SaQ
DODO_PRO_MONTHLY_ID=pdt_0NUbqNN7Phmb0Hj5Fgzao
DODO_PRO_YEARLY_ID=pdt_0NUbqYQ4gBInUzxpfVOtf
DODO_PRO_PLUS_MONTHLY_ID=pdt_0NUbqieBO42AkNqF5wI4z
DODO_PRO_PLUS_YEARLY_ID=pdt_0NUbqtphjX6X4yNJ1YA39

# Usage meter for overage billing
DODO_METER_OVERAGE=meter_overage_spend

# ============================================
# AI PROVIDERS
# ============================================
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# ============================================
# SEO DATA PROVIDERS
# ============================================
DATAFORSEO_LOGIN=your-login
DATAFORSEO_PASSWORD=your-password
SERPAPI_KEY=your-key

# ============================================
# AI VISIBILITY CHECKING (Real platform queries)
# At least one is required for real visibility data
# ============================================
# SerpAPI - for Google AI Overviews (https://serpapi.com)
# Already using SERPAPI_KEY above

# Perplexity API - for Perplexity AI citations (https://docs.perplexity.ai)
PERPLEXITY_API_KEY=pplx-...

# Bing Web Search API - for Bing Copilot visibility
# (https://www.microsoft.com/en-us/bing/apis/bing-web-search-api)
BING_SEARCH_API_KEY=your-bing-key

# OpenAI (already set above) - for ChatGPT/SearchGPT visibility
# Uses OPENAI_API_KEY with web_search_preview tool

# ============================================
# EMAIL (RESEND)
# ============================================
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@yourdomain.com
```

## Dodo Payments Setup

### 1. Create Products in Dodo Dashboard

Go to [Dodo Dashboard](https://app.dodopayments.com) and create subscription products:

| Product Name | Price | Billing |
|--------------|-------|---------|
| Starter Monthly | $29/month | Monthly |
| Starter Yearly | $24/month | Yearly ($288/year) |
| Pro Monthly | $79/month | Monthly |
| Pro Yearly | $66/month | Yearly ($792/year) |
| Pro+ Monthly | $199/month | Monthly |
| Pro+ Yearly | $166/month | Yearly ($1992/year) |

Copy the product IDs and add them to your env vars.

### 2. Create Usage Meter for Overages

Create a usage-based meter in Dodo:

- **Name**: Overage Spend
- **Unit**: cents
- **Aggregation**: Sum
- **Billing**: Per-unit pricing at $0.01 per cent (1:1 passthrough)

This meter tracks overage spending in real-time. When users exceed plan limits with overages enabled, we report usage to this meter and Dodo bills them at end of cycle.

### 3. Configure Webhook

Set up a webhook in Dodo Dashboard pointing to:
```
https://your-domain.com/api/webhooks/dodo
```

Events to subscribe to:
- `subscription.created`
- `subscription.updated`
- `subscription.canceled`
- `payment.succeeded`
- `payment.failed`
- `invoice.paid`
- `invoice.payment_failed`
- `checkout.completed`

Copy the webhook secret and add to `DODO_WEBHOOK_SECRET`.

## Pricing Structure

### Plan Limits

| Resource | Starter | Pro | Pro+ |
|----------|---------|-----|------|
| Sites | 1 | 5 | 20 |
| Articles/month | 10 | 50 | 200 |
| Keywords tracked | 100 | 500 | 2,000 |
| Audits/month | 5 | 20 | 100* |
| AIO analyses/month | 20 | 100 | 500 |
| Team members | 1 | 5 | 20 |
| AI credits/month | 1,000 | 5,000 | 20,000 |

*Pro+ audits shown as "Unlimited" with internal soft cap of 100.

### Overage Pricing (90% margin)

When users exceed plan limits with spending cap enabled:

| Resource | Our Cost | Price | Margin |
|----------|----------|-------|--------|
| Article | $0.20 | $3.00 | 93% |
| 100 Keywords | $0.15 | $5.00 | 97% |
| Audit | $0.10 | $1.00 | 90% |
| AIO Analysis | $0.08 | $0.50 | 84% |
| 1,000 AI Credits | $0.10 | $2.00 | 95% |
| SERP Analysis | $0.02 | $0.25 | 92% |
| Backlink Analysis | $0.06 | $0.50 | 88% |

### Overage Flow

1. User hits plan limit
2. Prompted to: Upgrade OR enable spending cap (min $10)
3. With cap enabled, usage continues at overage prices
4. Cap reached → blocked until cap increased
5. Dodo bills at end of cycle

No prepaid credits. Pay-as-you-go with real-time tracking.

## AI Visibility Checking

CabbageSEO can perform **REAL** visibility checks across AI platforms instead of estimates.

### How It Works

When configured, the system:
1. Queries each AI platform with relevant keywords from your page
2. Checks if your domain appears in citations/sources
3. Reports actual citation rates vs content-based estimates

### Required API Keys

| Platform | API Key | Documentation | Approx Cost |
|----------|---------|---------------|-------------|
| Google AI Overviews | `SERPAPI_KEY` | [SerpAPI](https://serpapi.com) | $50/mo for 5k searches |
| Perplexity AI | `PERPLEXITY_API_KEY` | [Perplexity API](https://docs.perplexity.ai) | $5/mo + usage |
| ChatGPT/SearchGPT | `OPENAI_API_KEY` | [OpenAI](https://platform.openai.com) | ~$0.01/query |
| Bing Copilot | `BING_SEARCH_API_KEY` | [Bing API](https://www.microsoft.com/en-us/bing/apis) | 1k free/mo |

### Fallback Behavior

If no APIs are configured, the system falls back to **content-based estimates** that analyze:
- Content structure (FAQ sections, lists, headings)
- Schema markup presence
- Authority signals (citations, author info)
- Quotability factors (sentence length, key takeaways)

These estimates are clearly labeled as "Estimated" in the UI.

### API Endpoint

```
POST /api/aio/visibility
{
  "url": "https://example.com/article",
  "keywords": ["seo tips", "content optimization"]
}
```

Returns real citation data when APIs are configured.

