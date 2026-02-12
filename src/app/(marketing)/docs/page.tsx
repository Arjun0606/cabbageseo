"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Eye,
  Search,
  CheckCircle2,
  Globe,
  ShieldCheck,
  HelpCircle,
  Target,
  FileText,
  TrendingUp,
  Lightbulb,
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
        title: "What is CabbageSEO?",
        content: `CabbageSEO is a GEO (Generative Engine Optimization) platform that checks whether AI assistants know about your brand. When someone asks ChatGPT, Perplexity, or Google AI about your space, does your brand come up? We find out, show you where you stand, and help you improve.`,
      },
      {
        title: "How does it work?",
        content: `1. Enter your website domain on the homepage
2. We read your site to understand what your business does
3. We generate the exact queries your potential customers would ask AI
4. We run those queries through ChatGPT, Perplexity, and Google AI
5. You see your visibility score, what each platform said, and what to improve`,
      },
      {
        title: "Supported AI Platforms",
        content: `• **Perplexity** — Real API with source citation detection
• **Google AI (Gemini)** — Domain and brand mention extraction
• **ChatGPT** — Response text analysis for brand mentions

All results come from actual API calls to real AI platforms. No fake data or estimates.`,
      },
    ],
  },
  {
    id: "visibility-scanning",
    title: "AI Visibility Scanning",
    icon: Search,
    items: [
      {
        title: "Free scan (no signup required)",
        content: `Enter any domain on the homepage and get an instant AI visibility report. The scan:
• Reads your site to understand what your business does
• Uses AI to generate queries your real customers would ask
• Checks Perplexity, Google AI, and ChatGPT for your brand
• Shows your visibility score (0-100) with per-platform breakdown

The free scan is available to everyone, no account needed.`,
      },
      {
        title: "How queries are generated",
        content: `Unlike tools that use generic templates like "best [category] tools", CabbageSEO reads your actual site content — title, description, headings — and uses AI to generate the specific queries your customers would ask.

For example, if you run a startup directory, we'd generate queries like "best startup directories for founders" — not "best startup tools 2026."

This means your results are accurate and relevant to your actual business.`,
      },
      {
        title: "Dashboard scanning (paid plans)",
        content: `On paid plans, scanning goes deeper:
• **Scout ($49/mo)**: Daily automated scans, 5 fix pages/month
• **Command ($149/mo)**: Hourly scans, 25 fix pages/month
• **Dominate ($349/mo)**: Hourly scans, unlimited fix pages

Automated scans run in the background and alert you if your visibility changes.`,
      },
    ],
  },
  {
    id: "gap-detection",
    title: "Gap Detection",
    icon: Target,
    items: [
      {
        title: "What are visibility gaps?",
        content: `A visibility gap is a query where AI talks about your space but doesn't mention you. These are the conversations happening without you — potential customers asking AI for recommendations and not hearing your name.`,
      },
      {
        title: "How gap detection works",
        content: `After running a scan, CabbageSEO identifies:
• Queries where AI should mention you but doesn't
• Which platforms recognize you and which don't
• What AI says instead when it doesn't mention you

Each gap is an opportunity to improve your visibility.`,
      },
      {
        title: "Understanding your results",
        content: `For each query, you'll see a status:
• **Cited** — Your domain appears in AI's source citations (strongest signal)
• **Domain found** — Your full domain is mentioned in the response
• **Recognized** — AI knows your brand name
• **Not found** — AI doesn't mention you for this query

The raw AI response is always shown so you can verify exactly what was said.`,
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
        content: `Fix pages are AI-optimized content pages targeting your visibility gaps. Each page is structured specifically to be cited by AI: direct answers in the first paragraph, comparison tables, FAQ sections, entity-rich text, and Schema.org markup.

They reinforce your existing trust signals (reviews, listings, mentions) so AI platforms can confidently cite you.`,
      },
      {
        title: "How it works",
        content: `1. Pick a query where AI doesn't mention you yet
2. CabbageSEO generates a full page with headings, content, FAQs, and structured data
3. Review, edit if needed, and publish to your site
4. AI platforms pick up the content over time

Pages use deep GEO knowledge about how each platform decides what to cite.`,
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

Pages are counted per calendar month and reset on the 1st.`,
      },
    ],
  },
  {
    id: "intelligence",
    title: "Intelligence & Action Plans",
    icon: Lightbulb,
    items: [
      {
        title: "Gap analysis",
        content: `For each visibility gap, CabbageSEO explains why AI isn't citing you and what you can do about it:
• What the AI response included instead of your brand
• Which trusted sources you're missing from
• Specific content improvements to make
• Missing elements in your online presence`,
      },
      {
        title: "Weekly action plans",
        content: `Each week, you get a prioritized list of actions based on your scan data:
• Which gaps to tackle first (biggest impact)
• Content to create or update
• Trust sources to get listed on
• Progress tracking on completed actions

Actions are prioritized by potential impact on your visibility score.`,
      },
    ],
  },
  {
    id: "trust-sources",
    title: "Trust Source Tracking",
    icon: ShieldCheck,
    items: [
      {
        title: "What are trust sources?",
        content: `AI platforms don't just make things up — they pull from trusted third-party sources. Depending on your industry, these might include G2, Capterra, Trustpilot, Yelp, Product Hunt, Reddit, and others.

If you're not listed on the sources AI trusts for your space, you're far less likely to be recommended.`,
      },
      {
        title: "How trust source tracking works",
        content: `CabbageSEO monitors whether you're listed on the review platforms and directories that matter for your industry:
• Which trust sources are relevant to your business
• Your listing status on each one
• Which gaps to fill to improve your credibility with AI`,
      },
    ],
  },
  {
    id: "scoring",
    title: "Visibility Scoring",
    icon: TrendingUp,
    items: [
      {
        title: "How your score is calculated",
        content: `Your AI visibility score (0-100) is based on 5 factors:

• **Citation Presence (0-40)** — Is your domain cited as a source by AI?
• **Domain Visibility (0-25)** — Is your full domain mentioned in responses?
• **Brand Recognition (0-15)** — Does AI recognize your brand name?
• **Mention Prominence (0-12)** — Are you mentioned early or buried?
• **Mention Depth (0-8)** — Are you mentioned consistently across platforms?`,
      },
      {
        title: "Score ranges",
        content: `• **0-15**: Invisible — AI doesn't know your brand yet
• **16-39**: Low visibility — AI barely recognizes you
• **40-59**: Moderate — AI knows you but doesn't consistently cite you
• **60-79**: Good — AI regularly mentions and cites you
• **80-100**: Excellent — AI actively recommends you`,
      },
      {
        title: "Tracking progress",
        content: `Your dashboard shows your visibility score over time. Each automated scan creates a new data point so you can see whether your efforts are working.

If your score drops, you'll receive an alert via email (and Slack if configured).`,
      },
    ],
  },
  {
    id: "notifications",
    title: "Notifications",
    icon: Globe,
    items: [
      {
        title: "Slack Integration",
        content: `Connect Slack to get AI visibility alerts directly in your channel.

**Setup:**
1. Go to Settings > Notifications
2. Create a Slack incoming webhook
3. Paste the webhook URL and click "Test Connection"
4. Save — you'll receive alerts automatically`,
      },
      {
        title: "Email Notifications",
        content: `Manage your email preferences in Settings > Notifications:
• **Citation Alerts** — When new AI citations are found
• **Visibility Drop Alerts** — When your score decreases
• **Weekly Report** — Monday digest with score and top actions

All notifications can be toggled on/off individually.`,
      },
    ],
  },
  {
    id: "methodology",
    title: "Methodology",
    icon: CheckCircle2,
    items: [
      {
        title: "How we detect AI visibility",
        content: `For each query, we call real AI platform APIs:

• **Perplexity**: Returns source URLs directly. We match your domain against these citations.
• **Google AI (Gemini)**: We extract mentioned domains from the response text.
• **ChatGPT**: We analyze response text for domain and brand name mentions.

All raw AI responses are stored so you can verify any result yourself.`,
      },
      {
        title: "Result labels",
        content: `Each result is labeled clearly:

• **Cited**: Your domain URL was in the AI's citation links (strongest signal)
• **Domain found**: Your full domain appeared in the response text
• **Recognized**: Your brand name was mentioned
• **Not found**: AI didn't mention you for this query`,
      },
      {
        title: "Data integrity",
        content: `• We only show data from actual API responses
• We never invent, estimate, or extrapolate metrics
• If we don't have data, we say so
• Raw AI responses are available for verification
• Queries are generated fresh for each scan based on your site's actual content`,
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
  "domains": ["example.com", "example2.com"]
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
      "score": 45
    }
  ],
  "summary": { "total": 2, "succeeded": 2, "failed": 0 }
}

Each result includes a shareable report URL and visibility score.`,
      },
    ],
  },
  {
    id: "faq",
    title: "FAQ",
    icon: HelpCircle,
    items: [
      {
        title: "How often are scans run?",
        content: `• **Scout ($49/mo)**: Daily automated scans
• **Command ($149/mo)**: Hourly scans
• **Dominate ($349/mo)**: Hourly scans + unlimited everything

You can also run manual scans anytime from your dashboard.`,
      },
      {
        title: "Can I scan any website?",
        content: `Yes. Enter any public domain on the homepage to get a free visibility report — no signup required.

After signing up, you can add your site and set up automated monitoring, gap detection, and fix pages.`,
      },
      {
        title: "What makes AI mention a brand?",
        content: `Based on current GEO research, AI platforms tend to cite brands that:
• Are listed on trusted review sites (G2, Capterra, Trustpilot, etc.)
• Have well-structured content with clear answers and Schema.org markup
• Appear in genuine community discussions (Reddit, forums)
• Have authoritative backlinks and third-party coverage
• Publish fresh, accurate content regularly`,
      },
      {
        title: "How accurate is this?",
        content: `We show you exactly what AI platforms return. Perplexity returns citations which we display as-is. For ChatGPT and Gemini, we analyze response text for brand and domain mentions. The raw AI response is always available so you can verify any result.`,
      },
      {
        title: "What if AI doesn't know my brand?",
        content: `That's exactly what CabbageSEO helps with:

1. **Run a scan** to see where you stand
2. **Review your gaps** to understand what's missing
3. **Generate fix pages** to create AI-optimized content
4. **Track trust sources** to get listed where it matters
5. **Monitor progress** with automated scans

Most users see improvement within 30 days of consistent action.`,
      },
      {
        title: "Can I change plans?",
        content: `Yes. Upgrade or downgrade anytime from your billing settings. Upgrades take effect immediately. Downgrades remain active until the end of your billing period. Cancel anytime, no contracts.`,
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
        <div className="max-w-7xl mx-auto">
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
                Track your AI visibility — and know exactly how to improve it
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
                    Ready to check your AI visibility?
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
