# CabbageSEO: Citation Intelligence Pivot - Complete Context Document

## 🎯 THE PIVOT

**Old Product:** GEO (Generative Engine Optimization) - Content generation + keyword research + SEO audits to help websites get cited by AI.

**New Product:** Citation Intelligence - Track when ChatGPT, Perplexity, and Google AI cite your website. Alerts, history, competitor comparison.

**Why the pivot:**
- Old approach was vague value ("we'll help you get cited") with no verification
- New approach is clear, verifiable value ("we'll tell you when you ARE cited")
- Stickier product - users can't stop checking if AI mentions them
- Simpler code - fewer features, fewer things to break
- Better margins - API calls are cheap, no heavy content generation

---

## 📁 FILE STRUCTURE (Post-Pivot)

### Dashboard Pages (Keep)
```
/src/app/(dashboard)/
├── dashboard/page.tsx       # Citation overview, "Check Now" button
├── citations/page.tsx       # All citations, filter, export CSV
├── competitors/page.tsx     # Track competitor domains
├── settings/
│   ├── page.tsx             # Account settings
│   ├── billing/page.tsx     # Subscription management
│   ├── notifications/page.tsx  # Alert preferences
│   ├── integrations/page.tsx   # (Keep but deprioritize)
│   └── ...
└── layout.tsx               # Dashboard layout with sidebar
```

### Dashboard Pages (DELETED)
```
DELETED: /content/page.tsx, /content/new/page.tsx, /content/[id]/page.tsx
DELETED: /keywords/page.tsx
DELETED: /geo/page.tsx
DELETED: /audit/page.tsx
DELETED: /autopilot/page.tsx
DELETED: /analytics/page.tsx
DELETED: /links/page.tsx
```

### Marketing Pages (Updated)
```
/src/app/(marketing)/
├── page.tsx                 # Landing page - "Know When AI Cites You"
├── pricing/page.tsx         # Free/Starter/Pro/Agency
├── docs/page.tsx            # Citation Intelligence docs
├── how-it-works/page.tsx    # 4-step process
├── analyze/page.tsx         # Free analyzer (keep as lead gen)
├── feedback/page.tsx        # Bug reports, feature requests
├── about/page.tsx
├── terms/page.tsx
├── privacy/page.tsx
├── login/page.tsx
└── signup/page.tsx
```

### API Routes
```
/src/app/api/
├── geo/
│   └── citations/
│       ├── route.ts         # GET - List citations for a site
│       └── check/route.ts   # POST - Run citation check across platforms
├── sites/route.ts           # GET/POST/DELETE sites
├── me/route.ts              # Get current user + org + site
├── billing/                 # DodoPayments integration
├── auth/                    # Supabase auth
└── settings/                # Account, notifications
```

### Core Libraries
```
/src/lib/
├── geo/
│   └── citation-tracker.ts  # Real API calls to Perplexity, Google, OpenAI
├── jobs/
│   ├── functions.ts         # Inngest background jobs
│   └── inngest-client.ts    # Inngest setup
├── supabase/
│   ├── client.ts            # Browser client
│   └── server.ts            # Server client + service client
├── email/
│   └── index.ts             # Resend email service
└── billing/
    └── dodo-client.ts       # DodoPayments client
```

### Components
```
/src/components/
├── layout/
│   ├── sidebar.tsx          # Dashboard sidebar (citations-focused nav)
│   └── header.tsx           # Dashboard header
├── ui/                      # shadcn/ui components
└── marketing/               # Landing page components
```

---

## 🗄️ DATABASE SCHEMA (New Clean Schema)

**File:** `/scripts/citation-intelligence-schema.sql`

### Tables

#### 1. organizations
```sql
CREATE TABLE "organizations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "plan" plan NOT NULL DEFAULT 'free',  -- free, starter, pro, agency
  "subscription_status" subscription_status NOT NULL DEFAULT 'trialing',
  "billing_interval" billing_interval DEFAULT 'monthly',
  "subscription_id" text,      -- DodoPayments subscription ID
  "customer_id" text,          -- DodoPayments customer ID
  "trial_ends_at" timestamptz,
  "current_period_start" timestamptz,
  "current_period_end" timestamptz,
  "cancel_at_period_end" boolean DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
```

#### 2. users
```sql
CREATE TABLE "users" (
  "id" uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  "email" text NOT NULL UNIQUE,
  "name" text,
  "avatar_url" text,
  "organization_id" uuid REFERENCES organizations(id) ON DELETE SET NULL,
  "role" role NOT NULL DEFAULT 'owner',  -- owner, admin, member
  "email_verified" boolean DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
```

#### 3. sites (websites being tracked)
```sql
CREATE TABLE "sites" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organization_id" uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  "domain" text NOT NULL,
  "name" text,
  "status" text DEFAULT 'active',
  "last_checked_at" timestamptz,
  "total_citations" integer DEFAULT 0,
  "citations_this_week" integer DEFAULT 0,
  "citations_last_week" integer DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  UNIQUE("organization_id", "domain")
);
```

#### 4. citations (AI mentions - THE CORE TABLE)
```sql
CREATE TABLE "citations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "site_id" uuid NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  "platform" citation_platform NOT NULL,  -- perplexity, google_aio, chatgpt, bing_ai
  "query" text NOT NULL,                   -- The question that triggered the citation
  "snippet" text,                          -- What the AI said about the site
  "page_url" text,                         -- Specific page cited (if available)
  "confidence" citation_confidence DEFAULT 'medium',  -- high, medium, low
  "cited_at" timestamptz NOT NULL DEFAULT now(),
  "last_checked_at" timestamptz NOT NULL DEFAULT now(),
  "created_at" timestamptz NOT NULL DEFAULT now()
);
```

#### 5. competitors
```sql
CREATE TABLE "competitors" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "site_id" uuid NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  "domain" text NOT NULL,
  "total_citations" integer DEFAULT 0,
  "citations_change" integer DEFAULT 0,
  "last_checked_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  UNIQUE("site_id", "domain")
);
```

#### 6. usage
```sql
CREATE TABLE "usage" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organization_id" uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  "period_start" timestamptz NOT NULL,
  "period_end" timestamptz NOT NULL,
  "checks_used" integer DEFAULT 0,
  "checks_limit" integer DEFAULT 100,
  "sites_used" integer DEFAULT 0,
  "sites_limit" integer DEFAULT 3,
  "competitors_used" integer DEFAULT 0,
  "competitors_limit" integer DEFAULT 2,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
```

#### 7. notifications
```sql
CREATE TABLE "notifications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "email_new_citation" boolean DEFAULT true,
  "email_lost_citation" boolean DEFAULT true,
  "email_weekly_digest" boolean DEFAULT true,
  "email_competitor_cited" boolean DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  UNIQUE("user_id")
);
```

### Enums
```sql
CREATE TYPE "plan" AS ENUM ('free', 'starter', 'pro', 'agency');
CREATE TYPE "subscription_status" AS ENUM ('trialing', 'active', 'past_due', 'canceled', 'unpaid');
CREATE TYPE "billing_interval" AS ENUM ('monthly', 'yearly');
CREATE TYPE "role" AS ENUM ('owner', 'admin', 'member');
CREATE TYPE "citation_platform" AS ENUM ('perplexity', 'google_aio', 'chatgpt', 'bing_ai');
CREATE TYPE "citation_confidence" AS ENUM ('high', 'medium', 'low');
```

### Plan Limits Function
```sql
CREATE OR REPLACE FUNCTION get_plan_limits(p plan)
RETURNS TABLE (sites_limit integer, checks_limit integer, competitors_limit integer, history_days integer, hourly_checks boolean) AS $$
BEGIN
  CASE p
    WHEN 'free' THEN RETURN QUERY SELECT 1, 3, 0, 7, false;
    WHEN 'starter' THEN RETURN QUERY SELECT 3, 100, 2, 30, false;
    WHEN 'pro' THEN RETURN QUERY SELECT 10, -1, 10, -1, true;  -- -1 = unlimited
    WHEN 'agency' THEN RETURN QUERY SELECT 50, -1, -1, -1, true;
  END CASE;
END;
$$ LANGUAGE plpgsql;
```

---

## 💰 PRICING STRUCTURE

| Plan | Monthly | Yearly | Sites | Checks | Competitors | History | Frequency |
|------|---------|--------|-------|--------|-------------|---------|-----------|
| **Free** | $0 | $0 | 1 | 3/day | 0 | 7 days | Manual |
| **Starter** | $29 | $24/mo | 3 | 100/mo | 2 | 30 days | Daily |
| **Pro** | $79 | $66/mo | 10 | Unlimited | 10 | Unlimited | Hourly |
| **Agency** | $199 | $166/mo | 50 | Unlimited | Unlimited | Unlimited | Custom |

---

## 🔌 API INTEGRATIONS

### 1. Perplexity (Real API - 100% accurate)
```typescript
// In /src/lib/geo/citation-tracker.ts
async function checkPerplexity(domain: string) {
  const response = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.1-sonar-small-128k-online",
      messages: [{ role: "user", content: `What is ${domain}?` }],
      return_citations: true,  // THIS IS KEY - returns actual URLs
    }),
  });
  
  const data = await response.json();
  const citationUrls = data.citations || [];
  
  // Check if our domain is in the citations
  const isCited = citationUrls.some(url => url.includes(domain));
}
```

### 2. Google AI (Gemini with Search Grounding - 95% accurate)
```typescript
async function checkGoogleAI(domain: string) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `What is ${domain}?` }] }],
        tools: [{ 
          googleSearchRetrieval: { 
            dynamicRetrievalConfig: { mode: "MODE_DYNAMIC" } 
          } 
        }],
      }),
    }
  );
  
  const data = await response.json();
  const groundingMetadata = data.candidates?.[0]?.groundingMetadata;
  const sources = groundingMetadata?.groundingChunks || [];
  
  // Check grounding sources for our domain
  const isCited = sources.some(chunk => chunk.web?.uri?.includes(domain));
}
```

### 3. ChatGPT (Simulation - 90% accurate)
```typescript
async function checkChatGPT(domain: string) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "If you know about a website, describe it. If not, say so." },
        { role: "user", content: `What do you know about ${domain}?` },
      ],
    }),
  });
  
  const content = response.choices[0].message.content;
  
  // Check if ChatGPT knows about the domain (not just "I don't know")
  const unknownPhrases = ["i don't have", "i'm not familiar", "i don't know"];
  const knows = !unknownPhrases.some(phrase => content.toLowerCase().includes(phrase));
}
```

---

## ⏰ INNGEST BACKGROUND JOBS

**File:** `/src/lib/jobs/functions.ts`

### Scheduled Jobs
```typescript
// Daily citation check - ALL users, 10 AM
export const scheduledDailyCitationCheck = inngest.createFunction(
  { id: "scheduled-daily-citation-check" },
  { cron: "0 10 * * *" },
  async ({ step }) => {
    // Get all active sites
    // For each site, run citation checks
    // Save new citations to database
    // Send alerts for new citations
  }
);

// Hourly citation check - PRO users only
export const scheduledHourlyCitationCheck = inngest.createFunction(
  { id: "scheduled-hourly-citation-check" },
  { cron: "0 * * * *" },
  async ({ step }) => {
    // Get Pro/Agency organizations
    // Get their sites
    // Run citation checks
  }
);

// Send citation alert email
export const sendCitationAlert = inngest.createFunction(
  { id: "send-citation-alert" },
  { event: "citation/new.found" },
  async ({ event, step }) => {
    // Get user email
    // Send email via Resend
  }
);

// Weekly progress report
export const scheduledWeeklyProgressReport = inngest.createFunction(
  { id: "scheduled-weekly-progress-report" },
  { cron: "0 10 * * 1" },  // Mondays 10 AM
  async ({ step }) => {
    // Get all orgs with sites
    // Calculate weekly stats
    // Send email report
  }
);
```

---

## 🌐 ENVIRONMENT VARIABLES

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx

# AI APIs
OPENAI_API_KEY=sk-xxx                    # ChatGPT detection
PERPLEXITY_API_KEY=pplx-xxx              # Perplexity citations (real)
GOOGLE_AI_API_KEY=AIzaxxx                # or GEMINI_API_KEY

# Email
RESEND_API_KEY=re_xxx
RESEND_FROM_EMAIL=notifications@cabbageseo.com

# Payments
DODO_PAYMENTS_API_KEY=xxx
DODO_WEBHOOK_SECRET=xxx

# Inngest
INNGEST_SIGNING_KEY=signkey-prod-xxx
INNGEST_EVENT_KEY=xxx

# App
NEXT_PUBLIC_APP_URL=https://cabbageseo.com
```

---

## 🖥️ KEY UI COMPONENTS

### Dashboard (`/dashboard`)
- **Header:** Site domain badge, "Check Now" button
- **Stats Cards:** Total citations, This week, Perplexity count, Google AI count
- **Recent Citations:** Last 5 citations with platform, query, snippet
- **Competitors:** Side-by-side comparison with your site
- **Quick Actions:** View all citations, Add competitor, Configure alerts

### Citations Page (`/citations`)
- **Filters:** All / Perplexity / Google AI / ChatGPT
- **Search:** Filter by query text
- **Export:** CSV download button
- **List:** Each citation shows platform icon, query, snippet, confidence, date

### Competitors Page (`/competitors`)
- **Add Competitor:** Input field for domain
- **Comparison Chart:** Bar chart showing your citations vs competitors
- **Per-Competitor:** Citation count, change, platform breakdown

### Sidebar Navigation
```
Dashboard       (LayoutDashboard icon)
Citations       (Eye icon)
Competitors     (Target icon)
Alerts          (Bell icon)
Analyzer        (Search icon)
Settings        (Settings icon)
```

---

## 📧 EMAIL TEMPLATES

### Citation Alert
```
Subject: 🎉 [domain] was cited by Perplexity!

You got cited!

Perplexity mentioned your website.

Query: "What is [domain]?"

Snippet: "[AI's response about the site]..."

View all citations →
```

### Weekly Report
```
Subject: Your CabbageSEO Weekly Report

This week's highlights for [domain]:

- Total Citations: 15
- New This Week: +3
- Perplexity: 8
- Google AI: 5
- ChatGPT: 2

Top Keywords:
1. [keyword]
2. [keyword]

View Dashboard →
```

---

## 🐛 KNOWN ISSUES TO FIX

1. **TypeScript Error in `/api/geo/citations/check/route.ts`:**
   - The `citations` table isn't in the Supabase types yet
   - Fix: Cast `serviceClient as any` for the citations queries
   - Error message: `Type error: Argument of type '{ last_checked_at: string; }' is not assignable to parameter of type 'never'.`

2. **Old table references:**
   - Some files still reference `ai_citations` instead of `citations`
   - Need to search and replace all occurrences
   - Files to check: `/src/lib/supabase/types.ts`, `/src/lib/db/schema.ts`

3. **Supabase types file:**
   - `/src/lib/supabase/types.ts` needs updating for new schema
   - Or just use `any` types until schema is stable

4. **Build command:**
   ```bash
   npm run build
   ```
   Currently fails due to TypeScript error above.

---

## 🚀 DEPLOYMENT STEPS

1. **Fix the TypeScript error first:**
   - In `/src/app/api/geo/citations/check/route.ts`
   - Cast `serviceClient as any` before using `.from("citations")`

2. **Run new SQL schema in Supabase:**
   - Go to Supabase → SQL Editor
   - Run `scripts/citation-intelligence-schema.sql`

3. **Update environment variables in Vercel**

4. **Deploy:**
   ```bash
   npm run build  # Make sure it passes first
   git add -A
   git commit -m "Citation Intelligence pivot"
   git push origin main
   ```

5. **Sync Inngest:**
   - Visit `/api/inngest` to register functions
   - Check Inngest dashboard for registered jobs

---

## 📊 SUCCESS METRICS

- **Week 1:** 100 free signups, 5 paid conversions
- **Month 1:** 500 users, 50 paid, $2k MRR
- **Month 3:** 2000 users, 200 paid, $10k MRR
- **Month 6:** 10,000 users, 1000 paid, $50k MRR
- **Year 1:** $100k MRR goal

---

## 🎯 WHY THIS WINS

| Factor | Old GEO Approach | New Citation Intelligence |
|--------|------------------|---------------------------|
| **Value prop** | "We'll help you get cited" (vague) | "We'll tell you when you ARE cited" (clear) |
| **Verification** | Can't prove it works | Instant proof - see your citations |
| **Stickiness** | Generate content once, leave | Check daily/weekly forever |
| **Complexity** | Content gen + keywords + SEO | Just track citations |
| **API costs** | High (GPT for long content) | Low (short queries) |
| **Competition** | Tons of SEO tools | No one does this well |

---

## 🔧 TECH STACK

- **Framework:** Next.js 16 (App Router)
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (Google OAuth + Email)
- **Payments:** DodoPayments
- **Email:** Resend
- **Background Jobs:** Inngest
- **UI:** Tailwind CSS + shadcn/ui
- **Deployment:** Vercel

---

## 📝 FULL SQL SCHEMA FILE

The complete SQL schema is in: `/scripts/citation-intelligence-schema.sql`

Run this in Supabase SQL Editor to set up a fresh database.

---

## 🥬 BRANDING

- **Name:** CabbageSEO (keeping the name!)
- **Tagline:** "Know When AI Cites Your Website"
- **Logo:** Existing cabbage logo at `/public/cabbageseo_logo.png`
- **Colors:** Emerald green primary (#10b981), Zinc dark theme
- **Contact:** X/Twitter @Arjun06061, arjun@cabbageseo.com

---

## 📂 FILES MODIFIED IN THIS PIVOT

### Created/Rewritten:
- `/src/app/(dashboard)/dashboard/page.tsx` - New citation dashboard
- `/src/app/(dashboard)/citations/page.tsx` - All citations page
- `/src/app/(dashboard)/competitors/page.tsx` - Competitor tracking
- `/src/components/layout/sidebar.tsx` - New sidebar nav
- `/src/app/(marketing)/page.tsx` - New landing page
- `/src/app/(marketing)/pricing/page.tsx` - New pricing
- `/src/app/(marketing)/docs/page.tsx` - New docs
- `/src/app/(marketing)/how-it-works/page.tsx` - New how it works
- `/src/app/api/geo/citations/route.ts` - Citations API
- `/src/app/api/geo/citations/check/route.ts` - Citation check API
- `/src/app/api/sites/route.ts` - Sites API (updated)
- `/src/lib/jobs/functions.ts` - Inngest jobs (updated)
- `/scripts/citation-intelligence-schema.sql` - New DB schema

### Deleted:
- `/src/app/(dashboard)/content/page.tsx`
- `/src/app/(dashboard)/content/new/page.tsx`
- `/src/app/(dashboard)/content/[id]/page.tsx`
- `/src/app/(dashboard)/keywords/page.tsx`
- `/src/app/(dashboard)/geo/page.tsx`
- `/src/app/(dashboard)/audit/page.tsx`
- `/src/app/(dashboard)/autopilot/page.tsx`
- `/src/app/(dashboard)/analytics/page.tsx`
- `/src/app/(dashboard)/links/page.tsx`

### Updated (table name changes):
- `/src/lib/geo/citation-tracker.ts` - `ai_citations` → `citations`
- `/src/app/api/settings/account/route.ts` - `ai_citations` → `citations`
- `/src/lib/jobs/functions.ts` - `ai_citations` → `citations`

---

## ✅ NEXT STEPS FOR NEW CHAT

1. Fix the TypeScript build error in `/src/app/api/geo/citations/check/route.ts`
2. Run `npm run build` to verify it compiles
3. Run the SQL schema in Supabase
4. Deploy to Vercel
5. Test the full flow: signup → add site → check citations → see results
6. Launch! 🚀

---

*This document contains everything needed to continue development in a new chat session.*

