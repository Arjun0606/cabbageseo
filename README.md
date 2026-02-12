# CabbageSEO

**AI Visibility Intelligence** — Know where you stand. Fix what's missing.

CabbageSEO is a GEO (Generative Engine Optimization) platform that checks whether AI assistants mention your brand. When someone asks ChatGPT, Perplexity, or Google AI about your space, does your brand come up? We find out, show you where you stand, and help you improve.

## Features

- **AI Visibility Scanning** — Runs your key queries through ChatGPT, Perplexity, and Google AI to check if they mention you. Tracks citations over time.
- **Gap Detection** — Identifies specific queries where AI talks about your space but doesn't mention you.
- **Fix Pages** — Generates AI-optimized content pages targeting each gap, structured to be cited by AI.
- **Intelligence & Action Plans** — Gap analysis explains why you're not being cited. Weekly action plans prioritize what to do next.
- **Trust Source Tracking** — Monitors whether you're listed on the review platforms AI trusts (G2, Capterra, Trustpilot, etc.).

## Tech Stack

- **Framework**: Next.js 16 (App Router, React Server Components)
- **Language**: TypeScript + React 19
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: Supabase (PostgreSQL) + Drizzle ORM
- **Auth**: Supabase Auth (Email + Google OAuth)
- **Payments**: Dodo Payments
- **AI**: Google Gemini (query generation), Perplexity API, OpenAI API
- **Email**: Resend
- **State Management**: TanStack Query (React Query)

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- Supabase account
- Dodo Payments account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/cabbageseo.git
   cd cabbageseo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   See `docs/ENV_SETUP.md` for details.

4. **Set up the database**
   ```bash
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## Database

We use Drizzle ORM with Supabase (PostgreSQL).

```bash
# Push schema to database
npm run db:push

# Open Drizzle Studio
npm run db:studio
```

## Pricing

| Plan | Price | Scans | Fix Pages | Auto-gen/scan |
|------|-------|-------|-----------|---------------|
| Scout | $49/mo | Daily | 5/month | 2 |
| Command | $149/mo | Hourly | 25/month | 5 |
| Dominate | $349/mo | Hourly | Unlimited | 10 |

All plans include 1 site. Free scan available on the homepage — no signup required.

## Project Structure

```
cabbageseo/
├── src/
│   ├── app/
│   │   ├── (auth)/             # Auth pages (login, signup)
│   │   ├── (dashboard)/        # Dashboard pages
│   │   ├── (marketing)/        # Marketing pages (RSC)
│   │   └── api/                # API routes
│   ├── components/
│   │   ├── ui/                 # Base UI components (shadcn)
│   │   ├── dashboard/          # Dashboard components
│   │   ├── homepage/           # Homepage scan components
│   │   └── marketing/          # Marketing shell & layout
│   ├── lib/
│   │   ├── db/                 # Drizzle schema & queries
│   │   ├── billing/            # Plan config & billing logic
│   │   ├── geo/                # Citation intelligence
│   │   └── api/                # Rate limiting & utilities
│   ├── hooks/
│   │   └── api/                # React Query hooks
│   └── content/
│       └── blog/               # Blog posts (MDX)
├── drizzle/                    # Database migrations
└── public/                     # Static assets
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Set environment variables
4. Deploy

---

**[cabbageseo.com](https://cabbageseo.com)**
