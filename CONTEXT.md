# CabbageSEO — Session Context Document

> This document captures everything done in the Feb 13, 2026 session so a new AI assistant can pick up exactly where we left off.

---

## What CabbageSEO Is

CabbageSEO is a **Generative Engine Optimization (GEO)** SaaS product. It helps businesses become visible to AI platforms (ChatGPT, Perplexity, Google AI) by:

1. **Scanning** — Querying AI platforms with contextual buyer questions to check if they mention/cite the user's brand
2. **Finding gaps** — Identifying queries where AI talks about the user's space but doesn't mention them
3. **Fixing gaps** — Auto-generating expert-level content pages optimized for AI citation (direct answers, comparison tables, FAQ sections, Schema.org markup)
4. **Monitoring** — Daily/2x-daily automated scans with alerts on score drops
5. **Trust source tracking** — Monitoring listings on review platforms AI trusts (G2, Capterra, etc.)

### Pricing Tiers (all 1 site per plan)

| Feature | Scout ($49/mo) | Command ($149/mo) | Dominate ($349/mo) |
|---|---|---|---|
| Scan frequency | Daily | Daily | 2x/day |
| Queries tracked | 25 | 50 | 50 |
| Custom queries | 5 | 15 | 30 |
| Fix pages/month | 5 | 25 | 50 |
| Gap analyses/month | 3 | 15 | 30 |
| Content ideas/month | 3 | 10 | 20 |
| Action plans/month | — | 4 | 8 |
| Site audit pages | 10 | 100 | 500 |
| Site audits/month | 2 | 3 | 4 |
| History | 30 days | 90 days | 365 days |

Annual pricing: Scout $39/mo, Command $119/mo, Dominate $279/mo.

---

## Tech Stack

- **Framework**: Next.js 16 (App Router, React Server Components)
- **Language**: TypeScript (strict mode), React 19
- **Database**: Supabase (PostgreSQL) via Drizzle ORM
- **Auth**: Supabase Auth (Google OAuth + Email)
- **Payments**: Dodo Payments (subscriptions, webhooks, customer portal)
- **Email**: Resend
- **Background Jobs**: Inngest (12 scheduled/event-driven functions)
- **Rate Limiting**: Upstash Redis (with in-memory fallback)
- **AI**: GPT-5.2 for all intelligence/generation; Perplexity API for Perplexity scanning; Google AI (Gemini) for Google AI scanning
- **Styling**: Tailwind CSS + Framer Motion
- **Hosting**: Vercel
- **Repo**: GitHub, `develop` branch

---

## What Was Done This Session (Feb 13, 2026)

### 1. Scan Results Page — Conversion Improvements
**Commit**: `6b53804`

- Added **red "gaps alert" section** right after the score card — shows specific queries where AI doesn't mention the brand, with loss-aversion copy
- Added **sticky bottom CTA bar** that appears while scrolling through results and hides near the main CTA
- **Personalized main CTA** with actual gap count ("We found 3 gaps where AI talks about your space but doesn't mention you")
- Added **urgency banner** ("AI models retrain weekly. Your visibility can shift any day.") above the main CTA
- Replaced generic feature pills with a **3-column value grid** (Daily scans, Fix pages, Action plans)

**Files changed**: `src/components/homepage/scan-results.tsx`

### 2. Upgrade Gate Improvements
**Commit**: `6b53804`

- Added urgency bar to the upgrade gate on shareable teaser pages
- Now receives and displays `visibilityScore` and `gapCount` for personalized copy
- Fixed price from $39 to $49 (matching actual Scout plan)

**Files changed**: `src/app/(marketing)/teaser/[id]/upgrade-gate.tsx`, `src/app/(marketing)/teaser/[id]/page.tsx`

### 3. Gap Count Consistency Fix
**Commit**: `32fae3c`

- **Bug**: `page.tsx` calculated `gapCount` using only `!r.mentionedYou`, while `scan-results.tsx` used `!r.inCitations && !r.domainFound && !r.mentionedYou` — different counts for same data
- **Fix**: Aligned teaser page to use the same triple-check as scan-results

**Files changed**: `src/app/(marketing)/teaser/[id]/page.tsx`

### 4. Share-to-X Feature
**Commit**: `9a2d876`

- Added prominent **"Share your score on X"** card right after the score card
- Pre-composed tweet text that adapts based on visibility score (invisible/low/good)
- **"Post to X"** button (white, prominent) opens Twitter intent
- **"Copy text"** button for users who want to customize
- Includes report link when available, falls back to homepage
- Removed old buried share buttons from bottom of results
- Works for all scans (not just ones with a reportId)

**Files changed**: `src/components/homepage/scan-results.tsx`

### 5. Database Migrations Regenerated
**Commit**: `96479fe`

- Old migrations were out of sync — still referenced `stripe_customer_id` from before the Dodo Payments migration
- Drizzle journal only tracked 1 of 6 migration files
- **Deleted** all stale migration files (0000-0005 + full-schema.sql)
- **Regenerated** a single clean migration from current `schema.ts` — all 35 tables with correct Dodo billing fields
- Migration file: `drizzle/0000_tiny_giant_girl.sql`

**Files changed**: `drizzle/` directory (all migration files replaced)

---

## What's Left Before Launch

### CRITICAL — One remaining item

**Database schema push**: Need to run `npx drizzle-kit push` with the correct Supabase connection string to sync all 35 tables to the live database. The migrations are regenerated and correct, just need to be applied.

**How to do it**:
1. Go to Supabase dashboard > Click "Connect" button at top
2. Copy the **Transaction pooler URI** (port 6543)
3. Run:
```bash
DATABASE_URL="<paste-uri-here>" npx drizzle-kit push
```

The `.env.local` file exists locally with a connection string but the hostname was incorrect (`db.xxx.supabase.co` format is deprecated). Need the pooler format: `postgres://postgres.bfndwetkrexwtlwthslz:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`

### Already Done (confirmed via screenshots)

- [x] Vercel environment variables (all set — Dodo product IDs, Supabase keys, OpenAI, Perplexity, Google AI, Resend, Inngest, etc.)
- [x] Inngest functions (all 12 active in production dashboard)
- [x] Resend email (domain verified, emails sending, 40% deliverability — could improve)
- [x] Dodo Payments products created (6 product IDs set in Vercel)
- [x] TypeScript builds clean (`tsc --noEmit` passes with 0 errors)
- [x] All image assets present in `public/`
- [x] No TODO/FIXME items in codebase

### Nice to Have (post-launch)

- Upstash Redis for distributed rate limiting (falls back to in-memory)
- DataForSEO / SerpAPI for SEO data enrichment
- Improve Resend deliverability (60% bounce rate currently)
- Update `docs/ENV_SETUP.md` to use correct plan names (still says Starter/Pro/Pro Plus)

---

## Key Architecture Decisions Made

1. **GPT-5.2 for everything** — All intelligence, generation, query generation, and action plans use GPT-5.2. Perplexity and Gemini APIs are ONLY used for scanning their respective platforms.

2. **No sprints** — The 30-Day Sprint feature was removed entirely. Its functionality is now covered by Action Plans, Gap Detection, Fix Pages, and Trust Source Tracking.

3. **No Slack** — Removed Slack integration. All notifications go through email (Resend) and in-app notifications.

4. **No Bulk Scanning API** — Removed. No AI Leaderboard either.

5. **No competitor focus** — The product focuses solely on the user's own AI visibility. No "industry benchmarks" or "competitor comparison" features.

6. **Capped limits everywhere** — No "unlimited" features. All intelligence features have monthly caps per tier to control API costs.

7. **1 site per plan** — All plans support exactly 1 website. Users need multiple subscriptions for multiple sites.

8. **Free scan = no signup required** — The homepage scan works without any email gate or signup. Results show immediately. This is the primary acquisition funnel.

9. **Content generation pipeline** — 3-phase: Research (Perplexity), Generate (GPT-5.2), Refine (GPT-5.2).

10. **Trust source verification** — AI-powered (GPT-5.2) dynamic identification of relevant trust platforms based on the user's industry/product.

---

## Important File Locations

| Purpose | Path |
|---|---|
| Homepage (scan form + results) | `src/app/(marketing)/page.tsx` |
| Scan results component | `src/components/homepage/scan-results.tsx` |
| Teaser report page (shareable) | `src/app/(marketing)/teaser/[id]/page.tsx` |
| Upgrade gate component | `src/app/(marketing)/teaser/[id]/upgrade-gate.tsx` |
| Pricing page | `src/app/(marketing)/pricing/page.tsx` |
| Features page | `src/app/(marketing)/features/page.tsx` |
| Dashboard | `src/app/(dashboard)/dashboard/page.tsx` |
| Database schema | `src/lib/db/schema.ts` |
| Pricing plans/limits | `src/lib/billing/citation-plans.ts` |
| Dodo Payments client | `src/lib/billing/dodo-client.ts` |
| Checkout API | `src/app/api/billing/checkout/route.ts` |
| Webhook handler | `src/app/api/billing/webhooks/route.ts` |
| Teaser scan API | `src/app/api/geo/teaser/route.ts` |
| Citation check API | `src/app/api/geo/citations/check/route.ts` |
| Page generator | `src/lib/geo/page-generator.ts` |
| Site analyzer | `src/lib/geo/site-analyzer.ts` |
| Gap detection | `src/lib/geo/gap-detection.ts` (or within citations check) |
| Trust source verification | `src/app/api/sites/listings/route.ts` |
| Inngest jobs | `src/lib/jobs/citation-jobs.ts` |
| Inngest API route | `src/app/api/inngest/route.ts` |
| Rate limiting | `src/lib/api/rate-limit.ts` |
| Drizzle config | `drizzle.config.ts` |
| Drizzle migrations | `drizzle/` |

---

## Supabase Project Details

- **Project name**: cabbageSEO
- **Project ID**: `bfndwetkrexwtlwthslz`
- **Database password**: (redacted — stored in .env.local)
- **Status**: PRODUCTION, main branch

---

## Revenue Goal

The user (Arjun) wants to hit **$20K-$35K USD MRR in the first month** post-launch. Strategy:
- Leverage the free scan as viral acquisition (scan → share score on X → followers scan theirs)
- Target SaaS founders on X/Twitter
- Push Command ($149) and Dominate ($349) tiers
- Product Hunt launch planned
- The share-to-X feature with pre-composed tweets is the primary viral mechanic

---

## Session Commits (chronological)

1. `6b53804` — Improve scan results page for higher conversion
2. `32fae3c` — Fix inconsistent gap count calculation between teaser and scan results
3. `9a2d876` — Add prominent share-to-X card on scan results page
4. `96479fe` — Regenerate Drizzle migrations from current schema
