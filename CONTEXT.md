# CabbageSEO - Complete Project Context

> **Last Updated:** January 1, 2026  
> **Status:** Production Ready - Pending Launch  
> **Repository:** github.com/Arjun0606/cabbageseo

---

## 🎯 What is CabbageSEO?

CabbageSEO is a **GEO (Generative Engine Optimization) SaaS platform** that helps website owners get their content cited by AI platforms like ChatGPT, Perplexity, and Google AI Overviews.

**Target Market:** Thousands of micro-SaaS, SaaS, and Shopify stores who need GEO/AIO optimization but can't afford agencies or freelancers.

**Competitors:** SEObot ($100K MRR), ChatSEO

**Our Differentiator:** GEO-first approach (not traditional SEO), simpler UX, more affordable pricing.

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth (Google OAuth + Email) |
| **Payments** | Dodo Payments (NOT Stripe) |
| **AI** | OpenAI GPT-4o-mini (content), DALL-E 3 (images) |
| **Keywords** | DataForSEO API |
| **Styling** | Tailwind CSS |
| **Deployment** | Vercel |
| **Background Jobs** | Inngest |

---

## 💰 Pricing Plans

| Plan | Monthly | Yearly | Articles | Keywords | Audits | GEO Analyses |
|------|---------|--------|----------|----------|--------|--------------|
| **Free** | $0 | $0 | 0 | 0 | 1 | 1 |
| **Starter** | $29 | $290 | 25 | 500 | 10 | 25 |
| **Pro** | $79 | $790 | 75 | 2,500 | 50 | 100 |
| **Pro Plus** | $199 | $1,990 | 250 | 10,000 | Unlimited | Unlimited |

**Margins:** 70-80% on all plans

---

## 📁 Key Files & Structure

```
/src
├── app/
│   ├── (marketing)/          # Public pages
│   │   ├── page.tsx          # Landing page
│   │   ├── pricing/page.tsx  # Pricing page
│   │   ├── docs/page.tsx     # Documentation
│   │   ├── analyze/page.tsx  # Free URL analyzer (no auth)
│   │   └── privacy/page.tsx  # Privacy policy
│   │
│   ├── (dashboard)/          # Protected pages (behind paywall)
│   │   ├── dashboard/page.tsx
│   │   ├── geo/page.tsx      # GEO analysis dashboard
│   │   ├── content/page.tsx  # Content management
│   │   ├── keywords/page.tsx # Keyword research
│   │   ├── audit/page.tsx    # Technical SEO audit
│   │   ├── sites/page.tsx    # Site management
│   │   ├── onboarding/page.tsx
│   │   └── settings/         # Settings pages
│   │
│   └── api/
│       ├── auth/             # Authentication endpoints
│       ├── billing/          # Dodo Payments webhooks
│       ├── content/          # Content CRUD + generation
│       ├── keywords/         # Keyword research
│       ├── audit/            # SEO audits
│       ├── geo/              # GEO analysis endpoints
│       ├── sites/            # Site management
│       └── integrations/     # CMS integrations
│
├── components/
│   ├── site-switcher.tsx     # Top-right site selector
│   ├── command-palette.tsx   # Cmd+K quick actions
│   ├── paywall/              # Subscription gate
│   └── ui/                   # shadcn/ui components
│
├── lib/
│   ├── ai/
│   │   ├── openai-client.ts  # OpenAI wrapper
│   │   ├── content-pipeline.ts # Content generation
│   │   ├── prompts.ts        # AI prompt templates
│   │   └── image-generator.ts # DALL-E 3 integration
│   │
│   ├── billing/
│   │   ├── dodo-client.ts    # Dodo Payments SDK
│   │   └── plans.ts          # Plan definitions & limits
│   │
│   ├── integrations/         # CMS clients
│   │   ├── wordpress/
│   │   ├── webflow/
│   │   ├── shopify/
│   │   ├── ghost/
│   │   ├── notion/
│   │   ├── hubspot/
│   │   ├── framer/
│   │   └── webhooks/
│   │
│   ├── seo/
│   │   ├── crawler.ts        # Site crawler
│   │   ├── technical-audit.ts # SEO auditing
│   │   └── dataforseo.ts     # Keyword API client
│   │
│   ├── geo/
│   │   └── checklist.ts      # GEO optimization checklist
│   │
│   ├── api/
│   │   └── check-usage.ts    # Usage limit enforcement
│   │
│   └── supabase/
│       ├── client.ts         # Browser client
│       ├── server.ts         # Server client
│       └── service.ts        # Service role client (bypasses RLS)
│
├── contexts/
│   └── site-context.tsx      # Global site selection state
│
└── scripts/
    ├── LAUNCH_SCHEMA_COMPLETE.sql  # Production database schema
    └── reset-data.sql              # Data cleanup scripts
```

---

## 🗄️ Database Schema (24 Tables)

### Core Tables
- `organizations` - Companies/teams (Dodo customer/subscription IDs)
- `users` - User accounts linked to organizations
- `sessions` - Auth sessions
- `integrations` - CMS connections (site-specific)

### Billing Tables
- `credit_balance` - Prepaid credits
- `usage` - Monthly usage tracking
- `overage_charges` - Pay-as-you-go charges
- `invoices` - Payment history
- `credit_transactions` - Credit purchases/usage
- `notifications` - User notifications

### Site Tables
- `sites` - Websites being optimized
- `pages` - Crawled pages with GEO scores
- `keyword_clusters` - Grouped keywords
- `keywords` - Individual keywords
- `content` - Generated articles
- `content_ideas` - Content suggestions
- `audits` - SEO audit records
- `issues` - Detected problems
- `tasks` - Background jobs
- `rankings` - Keyword positions

### GEO Tables
- `entities` - Named entities found in content
- `ai_citations` - AI platform citations
- `aio_analyses` - GEO analysis results

### Legacy Tables
- `usage_records` - Old usage system
- `usage_events` - Old usage events

---

## 🔑 Environment Variables Required

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Dodo Payments
DODO_PAYMENTS_API_KEY=
DODO_PAYMENTS_WEBHOOK_KEY=
DODO_WEBHOOK_SECRET=
DODO_STARTER_MONTHLY_ID=
DODO_STARTER_YEARLY_ID=
DODO_PRO_MONTHLY_ID=
DODO_PRO_YEARLY_ID=
DODO_PRO_PLUS_MONTHLY_ID=
DODO_PRO_PLUS_YEARLY_ID=

# AI
OPENAI_API_KEY=         # GPT-4o-mini + DALL-E 3

# Keywords & SEO
DATAFORSEO_LOGIN=
DATAFORSEO_PASSWORD=
SERPAPI_KEY=

# Optional (not currently used)
ANTHROPIC_API_KEY=      # Removed - using OpenAI only
PERPLEXITY_API_KEY=
GEMINI_API_KEY=

# Feature Flags
TESTING_MODE=false      # MUST be false for production
NEXT_PUBLIC_TESTING_MODE=false
```

---

## 🔄 User Flow

### 1. Landing Page → Signup
- User visits cabbageseo.com
- Can use free URL analyzer without signup
- Signs up with Google or Email

### 2. Onboarding
- User enters their website URL
- System crawls the site
- Calculates initial GEO score
- Shows audit results

### 3. Dashboard (Paywall Protected)
- Site switcher in top-right (supports multiple sites)
- Command palette (Cmd+K) for quick actions
- GEO Score prominently displayed
- Quick actions: Run Audit, Research Keywords, Generate Content

### 4. Core Features
- **GEO Dashboard** (`/geo`) - AI visibility scores across platforms
- **Technical Audit** (`/audit`) - SEO issues with recommendations
- **Keywords** (`/keywords`) - Research and track keywords
- **Content** (`/content`) - Generate and manage articles
- **Settings** (`/settings`) - Integrations, billing, account

### 5. Content Generation
- User selects keyword or enters topic
- AI generates GEO-optimized article (1500+ words)
- DALL-E 3 generates featured image
- User can edit before publishing
- One-click publish to connected CMS

---

## 🔌 CMS Integrations

| Integration | Status | Publishing |
|-------------|--------|------------|
| WordPress | ✅ Built | ✅ |
| Webflow | ✅ Built | ✅ |
| Shopify | ✅ Built | ✅ |
| Ghost | ✅ Built | ✅ |
| Notion | ✅ Built | ✅ |
| HubSpot | ✅ Built | ✅ |
| Framer | ✅ Built | ✅ |
| Webhooks | ✅ Built | ✅ |
| Google Search Console | ✅ Built | Read-only |
| Google Analytics 4 | ✅ Built | Read-only |

---

## 💳 Payment Flow (Dodo Payments)

1. User clicks "Subscribe" on pricing page
2. Frontend calls `/api/billing/checkout` with plan + interval
3. Backend creates Dodo checkout session
4. User redirected to Dodo hosted checkout
5. On success, webhook hits `/api/billing/webhooks`
6. Webhook updates `organizations` table with:
   - `dodo_customer_id`
   - `dodo_subscription_id`
   - `plan`
   - `subscription_status: 'active'`
   - `current_period_start/end`

---

## 🛡️ Security

### Row Level Security (RLS)
- All tables have RLS enabled
- Users can only access their organization's data
- Service role bypasses RLS for backend operations

### Paywall
- `SubscriptionGate` component wraps dashboard layout
- Checks `subscription_status === 'active'` OR plan limits
- Free analyzer page is NOT behind paywall

### Usage Limits
- `requireUsageLimit()` checks before expensive operations
- `incrementUsage()` tracks usage after operations
- Enforced for: articles, keywords, audits, GEO analyses

---

## 📊 Key API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/signup` | POST | Create account |
| `/api/auth/login` | POST | Login |
| `/api/billing/checkout` | POST | Start payment |
| `/api/billing/webhooks` | POST | Dodo webhooks |
| `/api/sites` | GET/POST/DELETE | Manage sites |
| `/api/onboarding/analyze` | POST | Initial site analysis |
| `/api/audit` | POST | Run SEO audit |
| `/api/audit/issues` | GET | Get audit issues |
| `/api/keywords/research` | POST | Research keywords |
| `/api/content/generate` | POST | Generate article |
| `/api/content/publish` | POST | Publish to CMS |
| `/api/geo/analyze` | POST | GEO analysis |
| `/api/geo/visibility` | GET | AI visibility scores |
| `/api/export/report` | GET | Export for AI tools |

---

## 🎨 Design System

### Colors
- **Primary:** Emerald/Green (`emerald-500`, `emerald-600`)
- **Background:** Black/Dark (`zinc-900`, `zinc-950`)
- **Text:** White (`white`, `zinc-100`, `zinc-400`)
- **Accents:** Emerald gradients

### Typography
- Modern sans-serif fonts
- White text on dark backgrounds
- `zinc-400` for muted/secondary text

### Components
- shadcn/ui component library
- Custom site-switcher dropdown
- Command palette (Cmd+K)
- Cards with emerald accents

---

## ✅ What Was Completed

### Phase 1: Foundation
- [x] Next.js 16 setup with App Router
- [x] Supabase integration (auth + database)
- [x] Tailwind CSS styling
- [x] shadcn/ui components

### Phase 2: Core Features
- [x] Site crawler
- [x] Technical SEO auditor
- [x] Keyword research (DataForSEO)
- [x] AI content generation (OpenAI)
- [x] DALL-E 3 image generation
- [x] GEO analysis engine

### Phase 3: Integrations
- [x] 8 CMS integrations (WordPress, Webflow, etc.)
- [x] Google Search Console
- [x] Google Analytics 4
- [x] Dodo Payments

### Phase 4: Polish
- [x] Paywall implementation
- [x] Usage limit enforcement
- [x] Site-specific integrations
- [x] Command palette
- [x] Site switcher
- [x] Export for AI tools
- [x] Documentation page
- [x] Privacy policy
- [x] Green/black theme (SEObot-inspired)
- [x] Text legibility fixes
- [x] Removed AI model mentions

### Phase 5: Launch Prep
- [x] Production database schema
- [x] Disabled testing modes
- [x] Clean data scripts
- [x] Complete audit

---

## 🚀 To Launch

### 1. Run Database Schema
```sql
-- Copy contents of scripts/LAUNCH_SCHEMA_COMPLETE.sql
-- Paste in Supabase SQL Editor
-- Click Run
```

### 2. Verify Environment Variables
- All Dodo product IDs set
- TESTING_MODE=false
- All API keys valid

### 3. Deploy to Vercel
```bash
git checkout main
git merge develop
git push origin main
```

### 4. Test
1. Create account at cabbageseo.com/signup
2. Try free analyzer
3. Subscribe to Starter plan
4. Add a site
5. Run audit
6. Research keywords
7. Generate content

---

## 🐛 Known Issues / TODOs

### Not Critical for Launch
- [ ] Multi-language content generation
- [ ] Zapier integration
- [ ] White-label option
- [ ] AI backlink building
- [ ] YouTube to article

### Monitoring
- Watch for OpenAI API rate limits
- Monitor DataForSEO usage
- Track Dodo webhook reliability

---

## 📞 Support Files

| File | Purpose |
|------|---------|
| `CONTEXT.md` | This file - complete project context |
| `ARCHITECTURE.md` | System architecture details |
| `GAME_PLAN.md` | Business strategy |
| `FEATURE_ROADMAP.md` | Future features |
| `SEOBOT_TEARDOWN.md` | Competitor analysis |
| `scripts/LAUNCH_SCHEMA_COMPLETE.sql` | Production DB schema |

---

## 🔗 Important URLs

- **Production:** https://cabbageseo.com
- **GitHub:** https://github.com/Arjun0606/cabbageseo
- **Supabase:** (check dashboard)
- **Vercel:** (check dashboard)
- **Dodo Payments:** (check dashboard)

---

## 📝 Notes for New Chat Sessions

When starting a new chat, share this file and mention:

1. **"This is CabbageSEO, a GEO optimization SaaS"**
2. **"Tech: Next.js 16, Supabase, OpenAI, Dodo Payments"**
3. **"Production ready, using scripts/LAUNCH_SCHEMA_COMPLETE.sql"**
4. **"All features behind paywall except free analyzer"**
5. **"Green/black theme, no AI model mentions to users"**

---

*Generated: January 1, 2026*

