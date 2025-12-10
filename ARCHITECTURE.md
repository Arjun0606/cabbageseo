# 🥬 CabbageSEO Architecture

## Core Philosophy

**We are NOT building new SEO tools. We are ORCHESTRATING existing point solutions into one seamless system.**

Like Cursor integrated ChatGPT + VS Code + developer tools into one "coding autopilot," CabbageSEO integrates:
- Keyword tools
- AI writers  
- Content optimizers
- Crawlers
- CMS APIs
- Analytics

Into one "SEO autopilot."

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CABBAGESEO ORCHESTRATION LAYER                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                        CLAUDE AI BRAIN                                │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │  │
│  │  │  Strategy   │  │   Content   │  │  Technical  │  │   Analyst   │  │  │
│  │  │    Agent    │  │    Agent    │  │    Agent    │  │    Agent    │  │  │
│  │  │ (Sonnet 4.5)│  │ (Sonnet 4.5)│  │ (Haiku 4.5) │  │ (Haiku 4.5) │  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                      │                                      │
│                                      ▼                                      │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                      INTEGRATION ADAPTERS                             │  │
│  │                                                                        │  │
│  │  RESEARCH        CONTENT         PUBLISH        ANALYTICS             │  │
│  │  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐           │  │
│  │  │DataFor  │    │ Claude  │    │WordPress│    │  GSC    │           │  │
│  │  │  SEO    │    │   API   │    │  REST   │    │  API    │           │  │
│  │  ├─────────┤    ├─────────┤    ├─────────┤    ├─────────┤           │  │
│  │  │ Ahrefs  │    │ Surfer  │    │ Webflow │    │  GA4    │           │  │
│  │  │  API    │    │   API   │    │   API   │    │  API    │           │  │
│  │  ├─────────┤    ├─────────┤    ├─────────┤    ├─────────┤           │  │
│  │  │SerpAPI  │    │Clearscope│   │ Shopify │    │Plausible│           │  │
│  │  └─────────┘    └─────────┘    └─────────┘    └─────────┘           │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## What Claude REPLACES vs. AUGMENTS

### ✅ Claude FULLY REPLACES (we don't need these tools):

| Category | Replaced Tools | How Claude Does It |
|----------|---------------|-------------------|
| **AI Writing** | Jasper, Copy.ai, Writesonic, ContentAtScale, Koala | Direct LLM generation with SEO prompts |
| **Content Briefs** | Frase, MarketMuse briefs | Generate from SERP data + clustering |
| **Topic Planning** | AnswerThePublic, KeywordInsights | LLM clustering + intent analysis |
| **Schema Generation** | Schema Pro, generators | Generate JSON-LD from content |
| **Meta Tags** | Yoast suggestions | Generate from content analysis |
| **Internal Link Suggestions** | Link Whisper logic | Analyze content + suggest links |
| **SEO Reports** | Report writers | Generate narrative from metrics |

### 🔌 Claude AUGMENTS (needs external data sources):

| Category | External Tool Needed | What Claude Does With It |
|----------|---------------------|-------------------------|
| **Keyword Volume** | DataForSEO, Ahrefs, Semrush | Clusters, prioritizes, suggests strategy |
| **SERP Data** | SerpAPI, DataForSEO | Analyzes competitors, identifies gaps |
| **Backlink Index** | Ahrefs, Moz, Majestic | Analyzes profile, suggests opportunities |
| **Rank Tracking** | DataForSEO, SerpAPI | Interprets changes, suggests actions |
| **Crawl Data** | Screaming Frog, custom | Prioritizes issues, generates fix plans |
| **Performance** | Lighthouse, PageSpeed | Explains issues, generates dev tasks |
| **Analytics** | GSC, GA4 | Generates insights, identifies trends |

---

## Integration Categories

### 1. Research & Keywords (Data Providers)

**Primary:** DataForSEO API
- Keyword volumes, difficulty, CPC
- SERP scraping
- Competitor keywords

**Optional Bring-Your-Own:**
- Ahrefs API (if user has account)
- Semrush API (if user has account)
- Moz API (backlinks)

**Claude's Role:**
- Cluster keywords into topical groups
- Classify intent (informational, commercial, transactional)
- Prioritize by opportunity score
- Generate content calendar

### 2. Content Generation (AI Brain)

**Primary:** Claude 4.5 (Anthropic)
- Sonnet 4.5: Long-form articles, outlines
- Haiku 4.5: Quick tasks (meta, clustering)

**Optional Integrations:**
- Surfer SEO (for NLP scoring)
- Clearscope (for content grading)

**Claude's Role:**
- Generate full SEO articles
- Create optimized outlines
- Write meta titles/descriptions
- Suggest internal links
- Generate schema markup

### 3. Publishing (CMS Integrations)

**Supported:**
- WordPress REST API (primary)
- Webflow CMS API
- Shopify Storefront API
- Ghost API
- Custom webhooks

**Claude's Role:**
- Format content for each CMS
- Map fields correctly
- Schedule publishing
- Handle revisions

### 4. Technical SEO (Crawl & Audit)

**Built-in:**
- Lightweight Node.js crawler
- Lighthouse API integration
- PageSpeed Insights API

**Optional:**
- Screaming Frog exports
- Sitebulb exports
- ContentKing webhooks

**Claude's Role:**
- Prioritize issues by impact
- Generate developer-ready tickets
- Explain issues in plain language
- Suggest fix order

### 5. Analytics & Monitoring

**Primary:**
- Google Search Console API
- Google Analytics 4 API

**Optional:**
- Plausible Analytics
- Mixpanel

**Claude's Role:**
- Identify ranking changes
- Detect content decay
- Generate performance reports
- Suggest optimization priorities

---

## On-Demand Usage System (Cursor-Style)

```
┌─────────────────────────────────────────────────────────────┐
│                    USAGE FLOW                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  User Request                                                │
│       │                                                      │
│       ▼                                                      │
│  ┌─────────────────┐                                        │
│  │ Check Plan Limit │                                        │
│  └────────┬────────┘                                        │
│           │                                                  │
│     ┌─────┴─────┐                                           │
│     │           │                                           │
│     ▼           ▼                                           │
│  Within      Exceeded                                       │
│   Plan         │                                            │
│     │          ▼                                            │
│     │    ┌──────────────┐                                   │
│     │    │ On-Demand    │                                   │
│     │    │  Enabled?    │                                   │
│     │    └──────┬───────┘                                   │
│     │      ┌────┴────┐                                      │
│     │      │         │                                      │
│     │      ▼         ▼                                      │
│     │     Yes        No                                     │
│     │      │         │                                      │
│     │      ▼         ▼                                      │
│     │  ┌────────┐  ┌────────────┐                          │
│     │  │ Check  │  │  Block +   │                          │
│     │  │ Spend  │  │  Show      │                          │
│     │  │ Limit  │  │  Upgrade   │                          │
│     │  └───┬────┘  └────────────┘                          │
│     │      │                                                │
│     │   ┌──┴──┐                                            │
│     │   │     │                                            │
│     │   ▼     ▼                                            │
│     │ Under  Over                                          │
│     │ Limit  Limit                                         │
│     │   │     │                                            │
│     │   ▼     ▼                                            │
│     │ Allow  Block                                         │
│     │   │    (Show increase limit prompt)                  │
│     │   │                                                  │
│     └───┴──► Execute Request                               │
│                  │                                          │
│                  ▼                                          │
│          Track Usage + Bill On-Demand                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Usage Types & Costs:

| Usage Type | Internal Cost | User Price | 90% Markup |
|------------|---------------|------------|------------|
| Article Generation | $0.10 | $0.19 | ✓ |
| Keyword Analysis (1K) | $0.08 | $0.15 | ✓ |
| SERP API Call | $0.003 | $0.006 | ✓ |
| Page Crawl | $0.005 | $0.01 | ✓ |
| Content Optimization | $0.06 | $0.11 | ✓ |

---

## Rate Limiting & DDoS Protection

### Rate Limit Tiers:

| Tier | Requests/Min | Requests/Hour | Requests/Day |
|------|-------------|---------------|--------------|
| Unauthenticated | 20 | 100 | 500 |
| Starter | 60 | 500 | 5,000 |
| Pro | 120 | 2,000 | 20,000 |
| Pro+ | 300 | 5,000 | 50,000 |

### Expensive Operation Limits:

| Endpoint | Limit |
|----------|-------|
| /api/content/generate | 10/min |
| /api/keywords/research | 20/min |
| /api/content/publish | 30/min |

### Progressive Blocking:

- 3 violations → 1 minute block
- 5 violations → 10 minute block
- 10 violations → 1 hour block

---

## Database Schema Overview

```
organizations
├── users
├── sites
│   ├── keywords
│   │   └── keywordClusters
│   ├── content
│   │   └── contentRevisions
│   ├── pages (crawled)
│   ├── issues (technical)
│   └── rankings (historical)
├── usageRecords
│   └── usageEvents
└── tasks (automation queue)
```

---

## The Magic Flow: URL → Results

```
User enters: example.com
        │
        ▼
┌───────────────────┐
│  1. DISCOVERY     │
│  - Fetch sitemap  │
│  - Crawl pages    │
│  - Connect GSC    │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  2. ANALYSIS      │
│  - Find keywords  │
│  - Cluster topics │
│  - Gap analysis   │
│  - Technical audit│
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  3. STRATEGY      │
│  - Prioritize     │
│  - Content plan   │
│  - Fix priorities │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  4. EXECUTION     │
│  - Generate briefs│
│  - Write content  │
│  - Apply fixes    │
│  - Publish        │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  5. MONITOR       │
│  - Track rankings │
│  - Detect decay   │
│  - Alert changes  │
│  - Iterate        │
└───────────────────┘
```

---

## Environment Variables Map

```bash
# AI (Primary)
ANTHROPIC_API_KEY=         # Claude 4.5 - Main brain

# AI (Fallback)  
OPENAI_API_KEY=            # GPT-4o fallback

# SEO Data
DATAFORSEO_LOGIN=          # Keywords, SERP
DATAFORSEO_PASSWORD=
AHREFS_API_KEY=            # Optional: Backlinks
SURFER_API_KEY=            # Optional: NLP scoring

# CMS
# WordPress: per-site credentials in DB
WEBFLOW_API_KEY=           # Webflow CMS

# Analytics
GOOGLE_CLIENT_ID=          # GSC + GA4
GOOGLE_CLIENT_SECRET=

# Payments
DODO_PAYMENTS_API_KEY=     # Subscriptions + usage
DODO_WEBHOOK_SECRET=

# Database
DATABASE_URL=              # Supabase PostgreSQL
```

---

## Tech Stack Summary

| Layer | Technology | Why |
|-------|------------|-----|
| Frontend | Next.js 14, React, TypeScript | Fast, SEO-friendly, great DX |
| Styling | Tailwind CSS, shadcn/ui | Beautiful, consistent UI |
| Database | Supabase (PostgreSQL), Drizzle ORM | Scalable, real-time, type-safe |
| Auth | Supabase Auth | Easy, secure, social login |
| AI | Claude 4.5 (Anthropic) | Best writing quality |
| Payments | Dodo Payments | MoR, usage billing, global |
| Hosting | Vercel | Edge, fast, auto-scaling |

---

## File Structure

```
cabbageseo/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Login, signup
│   │   ├── (dashboard)/        # Main app
│   │   └── api/                # API routes
│   ├── components/
│   │   ├── ui/                 # Base components
│   │   └── dashboard/          # App components
│   ├── lib/
│   │   ├── integrations/       # External APIs
│   │   │   ├── openai/         # Claude AI
│   │   │   ├── dataforseo/     # Keywords, SERP
│   │   │   ├── ahrefs/         # Backlinks
│   │   │   ├── surfer/         # Content scoring
│   │   │   ├── gsc/            # Search Console
│   │   │   ├── wordpress/      # WP publishing
│   │   │   └── webflow/        # Webflow CMS
│   │   ├── billing/            # Dodo Payments
│   │   ├── usage/              # Rate limiting
│   │   └── db/                 # Database
│   ├── config/                 # Plans, settings
│   └── types/                  # TypeScript types
├── drizzle/                    # DB migrations
└── public/                     # Static assets
```

---

## Next Steps to Complete

1. **Keywords Page UI** - Research interface
2. **Content Editor** - Write/edit/publish flow  
3. **Settings Pages** - Billing, integrations
4. **Technical Audit Page** - Issues dashboard
5. **Autopilot Engine** - Background automation
6. **Auth Implementation** - Real Supabase auth

---

*Built with 💚 for the SEO revolution*

