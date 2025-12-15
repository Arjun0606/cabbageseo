# 🥬 CabbageSEO

**The Search Optimization OS** — SEO + AIO (AI Optimization) in one unified platform.

Like Cursor did for coding, CabbageSEO does for search optimization. We orchestrate existing point solutions (keyword tools, AI writers, CMS APIs, analytics) into one seamless system that lets anyone run professional SEO and optimize for AI search engines.

## 🚀 Features

### SEO Engine
- **Strategy Engine** — AI-powered keyword research, clustering, and content planning
- **Content Engine** — SERP-aware article generation with optimization scoring
- **Publishing Engine** — One-click publish to WordPress, Webflow, Shopify
- **Monitoring Engine** — Real-time rank tracking and content decay alerts
- **Optimization Engine** — Continuous content refresh and internal linking
- **Autopilot Mode** — Set it and forget it. SEO runs automatically.

### AIO Engine (AI Optimization)
- **AI Visibility Scores** — Measure readiness for Google AI Overviews, ChatGPT, Perplexity, Claude, Gemini
- **Entity Extraction** — Identify and enhance named entities for AI understanding
- **Quotability Analysis** — Find and create AI-citable snippets
- **Answer Structure** — Optimize content structure for AI extraction
- **Citation Tracking** — Monitor when AI platforms cite your content

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: Supabase (PostgreSQL) + Drizzle ORM
- **Auth**: Supabase Auth (Email + Google OAuth)
- **Payments**: Dodo Payments (subscription + usage-based)
- **AI**: Anthropic Claude Sonnet 4 / OpenAI GPT-4o
- **SEO Data**: DataForSEO API
- **Email**: Resend (transactional emails)
- **Background Jobs**: Inngest

## 📦 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Dodo Payments account ([docs.dodopayments.com](https://docs.dodopayments.com/introduction))
- DataForSEO account
- Anthropic API key (Claude)
- Resend account (for emails)

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
   Fill in your API keys and credentials in `.env.local`

4. **Set up the database**
   ```bash
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## 🗄️ Database

We use Drizzle ORM with Supabase (PostgreSQL).

```bash
# Generate migrations
npm run db:generate

# Push schema to database
npm run db:push

# Open Drizzle Studio
npm run db:studio
```

## 💰 Pricing

| Plan | Price | Articles | Keywords | Sites |
|------|-------|----------|----------|-------|
| Starter | $29/mo | 10 | 1,000 | 1 |
| Pro | $59/mo | 40 | 5,000 | 3 |
| Pro+ | $129/mo | 120 | 15,000 | 10 |

Overages are billed at 90% markup on cost.

## 📁 Project Structure

```
cabbageseo/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Auth pages (login, signup)
│   │   ├── (dashboard)/        # Main app pages
│   │   └── api/                # API routes
│   ├── components/
│   │   ├── ui/                 # Base UI components
│   │   ├── dashboard/          # Dashboard components
│   │   └── marketing/          # Landing page components
│   ├── lib/
│   │   ├── db/                 # Database schema & queries
│   │   ├── integrations/       # External API clients
│   │   ├── engines/            # Business logic
│   │   └── billing/            # Stripe integration
│   ├── hooks/                  # React hooks
│   ├── types/                  # TypeScript types
│   └── config/                 # Configuration
├── drizzle/                    # Database migrations
└── public/                     # Static assets
```

## 🔌 Integrations

### SEO Data (DataForSEO)
- Keyword research & suggestions
- SERP analysis
- Competitor keyword analysis
- Keyword gap analysis

### AI Content (OpenAI/Anthropic)
- Keyword clustering
- Content outline generation
- Full article writing
- Meta tag generation
- Internal linking suggestions
- FAQ schema generation

### Publishing (WordPress)
- Post creation & updates
- Category/tag management
- Media upload
- SEO meta fields (Yoast/RankMath)

### Billing (Dodo Payments)
- Subscription management (Starter/Pro/Pro+)
- Usage-based billing with spending caps
- Pay-as-you-go overages (90% markup)
- Customer portal
- Global merchant of record (handles taxes)

### Required Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI
ANTHROPIC_API_KEY=

# SEO Data
DATAFORSEO_LOGIN=
DATAFORSEO_PASSWORD=

# Dodo Payments
DODO_API_KEY=
DODO_WEBHOOK_SECRET=
DODO_STARTER_MONTHLY_ID=
DODO_STARTER_YEARLY_ID=
DODO_PRO_MONTHLY_ID=
DODO_PRO_YEARLY_ID=
DODO_PRO_PLUS_MONTHLY_ID=
DODO_PRO_PLUS_YEARLY_ID=
DODO_CREDITS_SMALL_ID=
DODO_CREDITS_MEDIUM_ID=
DODO_CREDITS_LARGE_ID=

# Email
RESEND_API_KEY=
RESEND_FROM_EMAIL=

# Security
ENCRYPTION_KEY= # 32-character secret for encrypting credentials
```

## 🚢 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Set environment variables
4. Deploy

### Self-hosted

```bash
npm run build
npm start
```

## 📄 License

MIT License - feel free to use this for your own projects.

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines first.

---

Built with 💚 by the CabbageSEO team.

**[cabbageseo.com](https://cabbageseo.com)**
