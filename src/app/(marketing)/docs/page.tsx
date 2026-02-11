"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Eye,
  BarChart3,
  CheckCircle2,
  Globe,
  Map,
  HelpCircle,
  AlertTriangle,
  FileText,
  TrendingUp,
  Timer,
  PenTool,
  Database,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AnimateIn } from "@/components/motion/animate-in";
import { GlassCard } from "@/components/ui/glass-card";

const sections = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: Eye,
    items: [
      {
        title: "What is AI Visibility Intelligence?",
        content: `CabbageSEO is a GEO (Generative Engine Optimization) platform that shows you who AI recommends when people search for products like yours. When someone asks ChatGPT "what's the best CRM?" or asks Perplexity for "project management tool alternatives" — AI picks winners. We show you if you're one of them, or if other brands are getting all the recommendations.`,
      },
      {
        title: "How does it work?",
        content: `1. Enter your website domain on the homepage
2. We query real AI platforms (ChatGPT, Perplexity, Google AI) with relevant questions
3. We show you who AI recommends and whether you're mentioned
4. You see exactly which brands are winning and why`,
      },
      {
        title: "Supported AI Platforms",
        content: `• **Perplexity** — Real API integration with source citation detection
• **Google AI (Gemini)** — Search grounding for real-time web data
• **ChatGPT** — OpenAI query analysis

All results come from actual API calls. No fake data or estimates.`,
      },
    ],
  },
  {
    id: "dashboard",
    title: "Your War Room Dashboard",
    icon: BarChart3,
    items: [
      {
        title: "Running an AI Check",
        content: `From your dashboard, click "Run Check" to query AI platforms instantly. We'll show you:
• Which queries you're winning (AI recommends you)
• Which queries you're losing (AI recommends others instead)
• Who AI recommends instead of you

The check queries ChatGPT, Perplexity, and Google AI with relevant questions about your product category. Results appear in real-time.`,
      },
      {
        title: "Understanding Your Results",
        content: `Each check shows:
• **AI Mentions Found** — How many times AI recommended you across all queries
• **AI Mention Share** — What % of tracked queries mention you vs other brands
• **Wins** — Visual breakdown of queries where you were mentioned

All numbers come from real AI responses. Citations in your dashboard represent actual mentions from AI platforms. If you haven't run any checks yet, you'll see a prompt to run your first check.`,
      },
      {
        title: "Check Limits by Plan",
        content: `• **Scout ($49/mo)**: Unlimited manual checks + daily automated checks
• **Command ($149/mo)**: Unlimited manual checks + daily checks + hourly monitoring
• **Dominate ($349/mo)**: Unlimited manual checks + daily checks + hourly monitoring across all 25 sites

**Note**: Automated checks run in the background and don't count against manual check limits. If your AI visibility drops significantly, you'll get an instant alert via email and Slack (if configured).`,
      },
    ],
  },
  {
    id: "trust-map",
    title: "AI Trust Map",
    icon: Map,
    items: [
      {
        title: "What is the Trust Map?",
        content: `AI platforms don't just make up recommendations — they pull from trusted sources like G2, Capterra, Product Hunt, and Reddit. The Trust Map shows you which sources AI uses, and highlights where other brands are listed but you're not.`,
      },
      {
        title: "How to use it",
        content: `Navigate to the Trust Map from your dashboard sidebar. You'll see:
• Critical sources where you must be listed
• Which brands are on each source
• Whether you're currently listed or missing`,
      },
      {
        title: "Why it matters",
        content: `If other brands are on G2 with 500 reviews and you're not listed at all, AI will recommend them over you. The Trust Map shows you exactly which gaps to fill to start getting AI recommendations.`,
      },
    ],
  },
  {
    id: "gap-analysis",
    title: "Citation Gap Analysis",
    icon: AlertTriangle,
    items: [
      {
        title: "Understanding why you lose",
        content: `For any query where AI recommends other brands instead of you, the gap analysis shows:
• Which brands AI recommended
• Which trusted sources they appear on (that you don't)
• Specific content advantages they have
• Missing elements in your content
• Authority gaps you need to close

**Note**: This feature requires running a check first. The analysis uses real AI responses and citation data.`,
      },
      {
        title: "Content fix suggestions",
        content: `Paid users get content fix recommendations:
• Recommended page title to create
• Section headings to include
• Key entities and topics to mention
• FAQs to answer

**Scout**: 5 gap analyses per month
**Command**: Unlimited gap analyses
**Dominate**: Unlimited gap analyses

This is your blueprint to win specific queries.`,
      },
    ],
  },
  {
    id: "fix-pages",
    title: "Fix Pages",
    icon: FileText,
    items: [
      {
        title: "What are fix pages?",
        content: `Fix pages are comparison pages, category explainers, and FAQs designed to reinforce your credibility with AI systems. They work alongside your trust signals — G2 listings, Capterra reviews, Reddit mentions — by giving AI additional context to validate its recommendations.

Pages are generated using your citation data and gap analysis to create deeply relevant content that generic AI tools can't match.

Fix pages reinforce third-party trust signals (reviews, listings, mentions) so AI platforms can confidently cite you — they don't cause recommendations on their own.`,
      },
      {
        title: "How it works",
        content: `1. Choose a query where you want better AI visibility
2. Select the page type (comparison page, category explainer, FAQ, etc.)
3. CabbageSEO generates a full page with headings, content, FAQs, and structured data
4. Review, edit if needed, and publish to your site

Each page is tailored to your specific gaps and designed to reinforce the trust signals AI already looks for when recommending products.`,
      },
      {
        title: "Fix page limits",
        content: `**Manual generation (you choose the query):**
• **Scout**: 5 pages per month
• **Command**: 25 pages per month
• **Dominate**: Unlimited pages

**Auto-generation (created after each scan):**
• **Scout**: 2 pages per scan
• **Command**: 5 pages per scan
• **Dominate**: 10 pages per scan

After every citation scan, CabbageSEO automatically generates fix pages for newly discovered gaps. Manual pages are counted per calendar month and reset on the 1st. Auto-generated pages count toward your monthly limit.`,
      },
    ],
  },
  {
    id: "sprint",
    title: "30-Day Sprint",
    icon: Timer,
    items: [
      {
        title: "What is the 30-Day Sprint?",
        content: `The 30-Day Sprint is a structured 4-week program to improve your AI visibility. Instead of an endless dashboard, you get specific actions each week:

• **Week 1**: Critical sources — get listed where it matters most
• **Week 2**: Comparison content — create pages that AI loves
• **Week 3**: Authority building — build trust signals
• **Week 4**: Review and optimize — measure progress and adjust

Each action includes clear instructions, estimated time, and priority level.`,
      },
      {
        title: "How to start a sprint",
        content: `From your dashboard, click "Start Sprint" to begin your 30-day program. You'll get:
• Weekly action items with clear instructions
• Progress tracking as you complete each action
• Momentum score updates showing your improvement

Sprints are available on Scout, Command, and Dominate plans.`,
      },
    ],
  },
  {
    id: "momentum",
    title: "Momentum Scoring",
    icon: TrendingUp,
    items: [
      {
        title: "What is your Momentum Score?",
        content: `Your momentum score is a single number (0-100) that tracks your AI visibility progress. It updates weekly and shows whether you're gaining or losing ground in AI search.

The score combines:
• AI citation frequency across tracked queries
• Citation quality (direct recommendation vs mention)
• Week-over-week change
• Market position trends`,
      },
      {
        title: "Reading your momentum",
        content: `• **Rising score**: You're gaining AI visibility — keep doing what you're doing
• **Flat score**: No change — time to take action on your sprint items
• **Falling score**: Other brands are gaining ground — check alerts for what changed

The momentum score is available on Scout, Command, and Dominate plans.`,
      },
    ],
  },
  {
    id: "notifications",
    title: "Notifications & Slack",
    icon: Globe,
    items: [
      {
        title: "Slack Integration",
        content: `Connect Slack to get AI visibility alerts directly in your channel. Available on all paid plans.

**Setup:**
1. Go to Settings > Notifications
2. Create a Slack incoming webhook (link provided in settings)
3. Paste the webhook URL and click "Test Connection"
4. Save — you'll now receive automated alerts

**What you'll get in Slack:**
• Check results (queries won/lost)
• Visibility drop alerts (when queries won drops)
• Weekly summary reports (every Monday)`,
      },
      {
        title: "Visibility Drop Alerts",
        content: `When your AI visibility drops — meaning you're winning fewer queries than before — you'll get an instant alert via:
• **Email** — includes the change and queries you're now losing
• **Slack** — if configured, sent to your channel automatically

Drops are detected during automated checks. The alert includes specific queries you were winning but are now losing, so you can take targeted action.`,
      },
      {
        title: "Email Notifications",
        content: `Manage your email preferences in Settings > Notifications:
• **Citation Alerts** — when new AI citations are found
• **Visibility Drop Alerts** — when your AI visibility score decreases
• **Weekly Report** — Monday morning digest with score, wins, and top action

All email notifications can be toggled on/off individually.`,
      },
    ],
  },
  {
    id: "trend-chart",
    title: "Trend Chart & History",
    icon: TrendingUp,
    items: [
      {
        title: "Historical Trend Chart",
        content: `The trend chart on your dashboard shows your AI visibility score over time. Each data point represents a check (manual or automated).

**What's tracked:**
• Overall visibility score (0-100)
• Queries won (AI recommends you)
• Queries lost (AI recommends others instead)

**History limits by plan:**
• Scout: 30 days
• Command: 365 days
• Dominate: 365 days

Hover over any data point to see the full breakdown for that check.`,
      },
      {
        title: "Custom Query Tracking",
        content: `Monitor your exact buying queries. Instead of relying only on auto-generated queries, add the specific questions your customers ask.

**How to use:**
1. On the dashboard, find the "Custom Queries" section below "Queries You're Losing"
2. Type a query and press Enter or click Add
3. Your custom queries will be included in future checks

**Limits by plan:**
• Scout: 5 custom queries
• Command: Unlimited
• Dominate: Unlimited`,
      },
    ],
  },
  {
    id: "methodology",
    title: "Methodology & Data Integrity",
    icon: CheckCircle2,
    items: [
      {
        title: "How we detect AI recommendations",
        content: `For each query, we call real AI platform APIs:

• **Perplexity**: Returns source URLs directly. We match your domain against these.
• **Google AI (Gemini)**: Uses search grounding. We extract mentioned domains.
• **ChatGPT**: We parse response text for domain and brand mentions.

All raw AI responses are stored so you can verify any result.`,
      },
      {
        title: "Confidence levels",
        content: `We label results with confidence tiers:

• **High**: Your exact domain URL was in the AI's response or citation list
• **Medium**: Your brand name or product was mentioned in text
• **Low**: Related content was referenced but not a direct mention

We err on the side of caution — we'd rather under-report than over-report.`,
      },
      {
        title: "AI Mention Share calculation",
        content: `AI Mention Share = (times you were mentioned) ÷ (total mentions of all products)

This is calculated only for queries you've tracked. It's labeled "AI mention share (tracked queries only)" — not market share, not industry share. Just what we observed in your specific queries.`,
      },
      {
        title: "Data integrity rules",
        content: `We follow strict rules:

• We only show data from actual API responses
• We never invent, estimate, or extrapolate metrics
• All percentages come from real observations
• If we don't have data, we say "Run more checks"
• Raw AI responses are available for verification`,
      },
    ],
  },
  {
    id: "content-preview",
    title: "AI Content Preview",
    icon: PenTool,
    items: [
      {
        title: "What is the AI Content Preview?",
        content: `When you scan a domain with the free teaser tool, CabbageSEO generates a real "Brand vs Competitor" comparison page preview using your scan data. The first paragraph and one FAQ are fully visible; the rest is blurred behind a signup gate.

This shows you the kind of content CabbageSEO creates — before you even sign up.`,
      },
      {
        title: "How is it generated?",
        content: `The preview is generated in parallel with your scan results using AI. It uses:
• Your domain and brand name
• The top competitor found during the scan
• Real competitive data from the scan

The preview runs non-blocking — if generation fails, your scan results still work normally.`,
      },
      {
        title: "Full content on paid plans",
        content: `On Scout, Command, and Dominate plans, you get full fix pages:
• **Scout**: 5 pages per month
• **Command**: 25 pages per month
• **Dominate**: Unlimited pages

Each page includes headings, body content, FAQ schema, and structured data — ready to publish.`,
      },
    ],
  },
  {
    id: "bulk-api",
    title: "Bulk Scanning API",
    icon: Database,
    items: [
      {
        title: "API Overview",
        content: `The Bulk Scanning API lets you scan up to 50 domains in a single request. Available on Command and Dominate plans.

**Endpoint:** POST /api/v1/scan/bulk
**Auth:** x-api-key header
**Rate Limit:** 200 scans per hour per API key`,
      },
      {
        title: "Request format",
        content: `Send a POST request with JSON body:

{
  "domains": ["example.com", "competitor.com"]
}

**Limits:**
• Max 50 domains per request
• 200 scans per hour per API key
• Domains are processed in parallel batches of 3`,
      },
      {
        title: "Response format",
        content: `The API returns results for each domain:

{
  "results": [
    {
      "domain": "example.com",
      "status": "success",
      "reportId": "abc123",
      "reportUrl": "https://cabbageseo.com/teaser/abc123",
      "score": 45,
      "verdict": "Invisible"
    }
  ],
  "summary": { "total": 2, "succeeded": 2, "failed": 0 }
}

Each result includes a shareable report URL and the overall visibility score.`,
      },
    ],
  },
  {
    id: "faq",
    title: "FAQ",
    icon: HelpCircle,
    items: [
      {
        title: "How often are checks run?",
        content: `• **Scout**: Unlimited manual checks + daily automated checks
• **Command**: Unlimited manual checks + daily checks + hourly monitoring
• **Dominate**: Unlimited manual checks + daily checks + hourly monitoring across all 25 sites

Automated checks happen in the background. You'll receive email + Slack alerts when new citations are found or when your score drops.`,
      },
      {
        title: "Can I check any website?",
        content: `Yes! You can check any public website. Enter your domain on the homepage to get started (no signup required for the initial check).

After signing up, you can:
• Add multiple sites (up to plan limit)
• Run gap analyses and generate fix pages
• Set up automated monitoring

Run a free scan on the homepage to see where you stand. Subscribe to unlock the full dashboard, automated monitoring, and fix pages.`,
      },
      {
        title: "What makes AI recommend a product?",
        content: `AI platforms tend to recommend products that:
• Are listed on trusted review sites (G2, Capterra, Product Hunt)
• Have structured comparison content
• Appear in genuine community discussions (Reddit, forums)
• Have proper Schema.org markup
• Are frequently mentioned across authoritative sources`,
      },
      {
        title: "How accurate is this?",
        content: `We show you exactly what AI platforms return — nothing more, nothing less. Perplexity's API returns citations which we display verbatim. For ChatGPT and Gemini, we analyze response text for mentions. We label everything with confidence tiers and always show the raw response so you can verify.`,
      },
      {
        title: "What if I'm not getting recommended?",
        content: `That's exactly what we help with.

1. **Run a check** to see current status
2. **View the Trust Map** to see which sources you're missing
3. **Start a 30-Day Sprint** for a structured improvement program
4. **Use Gap Analysis** to understand specific gaps (Scout+)
5. **Generate pages** optimized for AI citation (Scout+)

Most founders improve their AI visibility within 30 days of consistent action.`,
      },
      {
        title: "Can I change plans?",
        content: `Yes. You can upgrade or downgrade at any time from your billing settings. When you upgrade, you get immediate access to the new tier's features. When you downgrade, your current tier remains active until the end of your billing period.`,
      },
    ],
  },
];

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("getting-started");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -60% 0px" }
    );

    for (const section of sections) {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Title */}
          <AnimateIn direction="up" delay={0} once>
            <div className="text-center mb-12">
              <Badge className="bg-emerald-500/10 text-emerald-400 mb-4">
                Documentation
              </Badge>
              <h1 className="text-4xl font-bold text-white mb-4">
                AI Visibility Intelligence
              </h1>
              <p className="text-xl text-zinc-400">
                See who AI recommends in your market — and how to become one of
                them
              </p>
            </div>
          </AnimateIn>

          <div className="flex gap-8">
            {/* Sticky Sidebar */}
            <aside className="hidden lg:block w-56 flex-shrink-0">
              <nav className="sticky top-24 space-y-1 bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                {sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeSection === section.id
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.06]"
                    }`}
                  >
                    <section.icon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{section.title}</span>
                  </a>
                ))}
              </nav>
            </aside>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {/* Quick Links (mobile) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 lg:hidden">
                {sections.slice(0, 8).map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4 hover:border-emerald-500/50 transition-colors"
                  >
                    <section.icon className="w-6 h-6 text-emerald-400 mb-2" />
                    <h3 className="text-white font-medium text-sm">
                      {section.title}
                    </h3>
                  </a>
                ))}
              </div>

              {/* Sections */}
              <div className="space-y-12">
                {sections.map((section) => (
                  <div key={section.id} id={section.id}>
                    <AnimateIn direction="up" delay={0} once>
                      <div className="flex items-center gap-3 mb-6">
                        <section.icon className="w-6 h-6 text-emerald-400" />
                        <h2 className="text-2xl font-bold text-white">
                          {section.title}
                        </h2>
                      </div>
                    </AnimateIn>

                    <div className="space-y-4">
                      {section.items.map((item, i) => (
                        <AnimateIn key={i} direction="up" delay={i * 0.05} once>
                          <GlassCard hover={false} padding="md">
                            <h3 className="text-lg font-semibold text-white mb-2">
                              {item.title}
                            </h3>
                            <div className="text-zinc-400 whitespace-pre-wrap">
                              {item.content.split("\n").map((line, j) => {
                                const parts = line.split(/(\*\*.*?\*\*)/g);
                                return (
                                  <p key={j} className="mb-2">
                                    {parts.map((part, k) => {
                                      if (
                                        part.startsWith("**") &&
                                        part.endsWith("**")
                                      ) {
                                        return (
                                          <strong
                                            key={k}
                                            className="text-white font-semibold"
                                          >
                                            {part.slice(2, -2)}
                                          </strong>
                                        );
                                      }
                                      return <span key={k}>{part}</span>;
                                    })}
                                  </p>
                                );
                              })}
                            </div>
                          </GlassCard>
                        </AnimateIn>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <AnimateIn direction="up" delay={0} once>
                <div className="mt-16 text-center">
                  <h2 className="text-2xl font-bold text-white mb-4">
                    Ready to see who AI recommends?
                  </h2>
                  <p className="text-zinc-400 mb-6">
                    Enter your domain and find out in 10 seconds. No signup
                    required.
                  </p>
                  <div className="flex justify-center gap-4">
                    <Link href="/">
                      <Button className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold">
                        <Eye className="w-4 h-4 mr-2" />
                        Check My Domain
                      </Button>
                    </Link>
                    <Link href="/feedback">
                      <Button
                        variant="outline"
                        className="border-white/[0.06] text-zinc-300"
                      >
                        Questions? Contact Us
                      </Button>
                    </Link>
                  </div>
                </div>
              </AnimateIn>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
