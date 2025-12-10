# 🥬 CabbageSEO

**SEO on Autopilot** — The AI-powered platform that handles your entire SEO workflow automatically.

Like Cursor did for coding, CabbageSEO does for SEO. We orchestrate existing point solutions (keyword tools, AI writers, CMS APIs, analytics) into one seamless system that lets anyone run professional SEO.

## 🚀 Features

- **Strategy Engine** — AI-powered keyword research, clustering, and content planning
- **Content Engine** — SERP-aware article generation with optimization scoring
- **Publishing Engine** — One-click publish to WordPress, Webflow, Shopify
- **Monitoring Engine** — Real-time rank tracking and content decay alerts
- **Optimization Engine** — Continuous content refresh and internal linking
- **Autopilot Mode** — Set it and forget it. SEO runs automatically.

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: Supabase (PostgreSQL) + Drizzle ORM
- **Auth**: Supabase Auth
- **Payments**: Stripe (subscription + usage-based)
- **AI**: OpenAI GPT-4o / Anthropic Claude
- **SEO Data**: DataForSEO API

## 📦 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Stripe account
- DataForSEO account
- OpenAI/Anthropic API key

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

### Billing (Stripe)
- Subscription management
- Usage-based billing
- Overage charges
- Customer portal

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
