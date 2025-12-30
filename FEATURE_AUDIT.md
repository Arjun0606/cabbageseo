# CabbageSEO Feature Audit

## Executive Summary

This audit documents what features ACTUALLY work vs what's just UI.

---

## 🟢 FULLY WORKING FEATURES

### 1. GEO Score Calculation ✅
**File:** `src/lib/aio/visibility-checker.ts`
**Status:** WORKING
**Dependencies:** 
- `SERPAPI_KEY` - for Google AI Overviews
- `PERPLEXITY_API_KEY` - for Perplexity
- `OPENAI_API_KEY` - for ChatGPT analysis

**How it works:**
1. Takes keywords related to your site
2. Queries each AI platform with those keywords
3. Checks if your URL/domain is cited in responses
4. Calculates score based on citation frequency

### 2. Content Generation ✅
**File:** `src/app/api/content/generate/route.ts`
**Status:** WORKING
**Dependencies:** `OPENAI_API_KEY`

**How it works:**
1. Takes keyword, title, and tone
2. Uses GPT-4o-mini for fast generation
3. Includes FAQ sections, source citations
4. Returns markdown content

### 3. Technical SEO Audit ✅
**File:** `src/lib/crawler/technical-audit.ts`
**Status:** WORKING
**Dependencies:** None (uses web crawling)

**Checks:**
- Meta tags (title, description)
- Heading structure (H1, H2s)
- Image alt text
- Internal/external links
- Page speed signals
- Mobile responsiveness
- SSL/HTTPS
- Robots.txt
- Sitemap

### 4. Keyword Research ✅
**File:** `src/lib/integrations/dataforseo/client.ts`
**Status:** WORKING
**Dependencies:** `DATAFORSEO_LOGIN`, `DATAFORSEO_PASSWORD`

**Features:**
- Keyword volume
- Difficulty scores
- CPC data
- SERP analysis
- Related keywords
- Competitor analysis

### 5. CMS Integrations ✅
**Files:** `src/lib/integrations/*/client.ts`
**Status:** WORKING

| CMS | Status | Dependencies |
|-----|--------|--------------|
| WordPress | ✅ | siteUrl, username, applicationPassword |
| Webflow | ✅ | accessToken |
| Shopify | ✅ | shopDomain, accessToken |
| Ghost | ✅ | apiUrl, adminApiKey |
| HubSpot | ✅ | accessToken |
| Notion | ✅ | accessToken |
| Framer | ✅ | accessToken |
| Webhooks | ✅ | webhookUrl |

### 6. Internal Linking ✅
**File:** `src/lib/seo/internal-linking.ts`
**Status:** WORKING
**Dependencies:** `OPENAI_API_KEY` (for AI suggestions)

**Features:**
- Analyze existing link structure
- Find orphan pages
- Suggest contextual links
- Calculate relevance scores

### 7. Export to Cursor ✅
**File:** `src/app/api/export/report/route.ts`
**Status:** WORKING

**Features:**
- Generates markdown report
- Lists all SEO issues with fixes
- Lists GEO recommendations
- Copy-paste ready for AI assistants

### 8. Site Crawling ✅
**File:** `src/lib/crawler/site-crawler.ts`
**Status:** WORKING

**Features:**
- Crawls up to 100 pages
- Extracts meta, content, links
- Respects robots.txt
- Timeout handling

---

## 🟡 PARTIALLY WORKING / NEEDS ENV

### 1. Google Search Console Integration
**File:** `src/lib/integrations/google/gsc-client.ts`
**Status:** NEEDS OAUTH SETUP
**Dependencies:** Google OAuth credentials

### 2. Google Analytics 4 Integration
**File:** `src/lib/integrations/google/ga4-client.ts`
**Status:** NEEDS OAUTH SETUP
**Dependencies:** Google OAuth credentials

### 3. Perplexity API Direct Queries
**File:** `src/lib/aio/visibility-checker.ts`
**Status:** WORKS IF API KEY EXISTS
**Dependencies:** `PERPLEXITY_API_KEY`

---

## 🔴 PHASE 2 (Not GEO-Critical)

These are nice-to-haves, not essential for GEO:

| Feature | Status | Priority |
|---------|--------|----------|
| AI Backlink Building | Not implemented | P2 |
| YouTube to Article | Not implemented | P2 |
| News Article Generation | Not implemented | P3 |
| Multi-Language UI | Cut (English-only) | - |

### Image Generation
**Status:** Planned
**Solution:** Nano Banana integration

---

## Required Environment Variables

```bash
# CRITICAL - Core Functionality
OPENAI_API_KEY=sk-...           # Content generation, AI analysis
SUPABASE_URL=https://...        # Database
SUPABASE_ANON_KEY=ey...         # Database auth
SUPABASE_SERVICE_ROLE_KEY=ey... # Database admin

# GEO Score (at least one required)
SERPAPI_KEY=...                 # Google AI Overviews
PERPLEXITY_API_KEY=pplx-...     # Perplexity analysis

# Keyword Research
DATAFORSEO_LOGIN=...            # Keyword data
DATAFORSEO_PASSWORD=...         # Keyword data

# Payments (when ready)
DODO_PAYMENTS_API_KEY=...       # Payment processing
DODO_WEBHOOK_SECRET=...         # Webhooks

# Optional - Enhanced Features
BING_SEARCH_API_KEY=...         # Bing Copilot (removed from UI)
ANTHROPIC_API_KEY=...           # Claude (fallback)
```

---

## API Endpoint Audit

| Endpoint | Status | Notes |
|----------|--------|-------|
| POST /api/onboarding/analyze | ✅ | Main analysis flow |
| POST /api/content/generate | ✅ | Content generation |
| GET /api/audit/issues | ✅ | Fetch SEO issues |
| GET /api/export/report | ✅ | Export for Cursor |
| POST /api/geo/analyze | ✅ | GEO score |
| POST /api/keywords/research | ✅ | Keyword research |
| POST /api/content/publish | ✅ | CMS publishing |
| POST /api/checkout | ✅ | Dodo payments |

---

## UI Audit

| Page | Status | Issues |
|------|--------|--------|
| / (Landing) | ✅ | None |
| /dashboard | ✅ | None |
| /onboarding | ✅ | None |
| /geo | ✅ | Needs data from API |
| /audit | ✅ | None |
| /content | ✅ | None |
| /keywords | ✅ | Needs DataForSEO key |
| /settings/integrations | ✅ | All integrations listed |
| /pricing | ✅ | Dodo payments |

---

## Recommended Fixes (Priority Order)

### P0 - Critical (This Week)
1. ✅ Fix build errors (done)
2. Verify GEO score actually works with live APIs
3. Test content generation end-to-end
4. Test at least one CMS integration (WordPress)

### P1 - High (Next Week)
1. Add language selector to content generation
2. Implement autopilot job scheduling
3. Add more error handling/retry logic

### P2 - Medium (Month 1)
1. Free SEO tools page
2. YouTube to article feature
3. Image generation via DALL-E

### P3 - Low (Month 2+)
1. AI backlink suggestions
2. Zapier integration
3. Agency white-label features

