"use client";

import Link from "next/link";
import {
  Eye,
  Search,
  Target,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Globe,
  Clock,
  Zap,
  Map,
  HelpCircle,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// ============================================
// AI VISIBILITY INTELLIGENCE DOCUMENTATION
// Aligned with actual product features
// ============================================

const sections = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: Eye,
    items: [
      {
        title: "What is AI Visibility Intelligence?",
        content: `CabbageSEO shows you who AI recommends when people search for products like yours. When someone asks ChatGPT "what's the best CRM?" or asks Perplexity for "project management tool alternatives" — AI picks winners. We show you if you're one of them, or if your competitors are getting all the recommendations.`,
      },
      {
        title: "How does it work?",
        content: `1. Enter your website domain on the homepage
2. We query real AI platforms (ChatGPT, Perplexity, Google AI) with relevant questions
3. We show you who AI recommends and whether you're mentioned
4. You see exactly which competitors are winning and why`,
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
        content: `From your dashboard, click "Check Now" to query AI platforms instantly. We'll show you:
• Which queries you're winning (AI recommends you)
• Which queries you're losing (AI recommends competitors)
• Who AI recommends instead of you`,
      },
      {
        title: "Understanding Your Results",
        content: `Each check shows:
• **High-Intent Queries Missed** — Queries where AI recommends competitors, not you
• **AI Mention Share** — What % of tracked queries mention you vs competitors
• **Wins vs Losses** — Visual breakdown of where you're winning and losing

All numbers come from real AI responses. If we don't have data, we say "Run more checks."`,
      },
      {
        title: "Check Limits by Plan",
        content: `• **Free**: 3 manual checks per day for 7 days
• **Starter ($29/mo)**: 100 checks/month + daily automated checks
• **Pro ($79/mo)**: 1000 checks/month + hourly automated checks`,
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
        content: `AI platforms don't just make up recommendations — they pull from trusted sources like G2, Capterra, Product Hunt, and Reddit. The Trust Map shows you which sources AI uses, and highlights where your competitors are listed but you're not.`,
      },
      {
        title: "How to use it",
        content: `Navigate to the Trust Map from your dashboard sidebar. You'll see:
• Critical sources where you must be listed
• Which competitors are on each source
• Whether you're currently listed or missing`,
      },
      {
        title: "Why it matters",
        content: `If your competitors are on G2 with 500 reviews and you're not listed at all, AI will recommend them over you. The Trust Map shows you exactly which gaps to fill to start getting AI recommendations.`,
      },
    ],
  },
  {
    id: "roadmap",
    title: "Your Visibility Roadmap",
    icon: Target,
    items: [
      {
        title: "What is the Roadmap?",
        content: `The Visibility Roadmap is your step-by-step action plan to become visible to AI. Based on where your competitors are listed, we show you exactly what to do — with priority order, time estimates, and direct links.`,
      },
      {
        title: "Example actions",
        content: `• **Get listed on G2** — 2-3 hours, Critical priority
• **Launch on Product Hunt** — 1-2 hours, High priority
• **Create comparison pages** — 30-60 min per page
• **Add Schema.org markup** — 1-2 hours
• **Build Reddit presence** — Ongoing`,
      },
      {
        title: "Tracking progress",
        content: `Check off actions as you complete them. As you get listed on more sources, run new AI checks to see your visibility improve. Pro users can track progress over time to see which actions had the most impact.`,
      },
    ],
  },
  {
    id: "why-not-me",
    title: '"Why Not Me?" Analysis',
    icon: AlertTriangle,
    items: [
      {
        title: "Understanding why you lose",
        content: `For any query where AI recommends competitors instead of you, click to see the full analysis. We show you:
• Which competitors AI recommended
• Which trusted sources they appear on (that you don't)
• Specific content advantages they have`,
      },
      {
        title: "Content fix suggestions",
        content: `Paid users get content fix recommendations:
• Recommended page title to create
• Section headings to include
• Key entities and topics to mention
• FAQs to answer

This is your blueprint to win that specific query.`,
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
    id: "faq",
    title: "FAQ",
    icon: HelpCircle,
    items: [
      {
        title: "How often are checks run?",
        content: `• **Free**: 3 manual checks/day for 7 days
• **Starter**: Daily automated checks + unlimited manual
• **Pro**: Hourly automated checks + unlimited manual`,
      },
      {
        title: "Can I check any website?",
        content: `Yes! You can check any public website. Enter your domain to get started. You can also add competitor domains to track who's winning in your market.`,
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
        content: `That's exactly what we help with. Use the Trust Map to see which sources you're missing, then follow the Visibility Roadmap to get listed. Most founders can significantly improve their AI visibility within 2-4 weeks of consistent action.`,
      },
    ],
  },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Title */}
          <div className="text-center mb-12">
            <Badge className="bg-emerald-500/10 text-emerald-400 mb-4">How It Works</Badge>
            <h1 className="text-4xl font-bold text-white mb-4">AI Visibility Intelligence</h1>
            <p className="text-xl text-zinc-400">
              See who AI recommends in your market — and how to become one of them
            </p>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-emerald-500/50 transition-colors"
              >
                <section.icon className="w-6 h-6 text-emerald-400 mb-2" />
                <h3 className="text-white font-medium text-sm">{section.title}</h3>
              </a>
            ))}
          </div>

          {/* Sections */}
          <div className="space-y-12">
            {sections.map((section) => (
              <div key={section.id} id={section.id}>
                <div className="flex items-center gap-3 mb-6">
                  <section.icon className="w-6 h-6 text-emerald-400" />
                  <h2 className="text-2xl font-bold text-white">{section.title}</h2>
                </div>
                
                <div className="space-y-4">
                  {section.items.map((item, i) => (
                    <Card key={i} className="bg-zinc-900 border-zinc-800">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg text-white">{item.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-zinc-400 whitespace-pre-wrap">
                          {item.content.split('\n').map((line, j) => (
                            <p key={j} className="mb-2">{line}</p>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-16 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Ready to see who AI recommends?</h2>
            <p className="text-zinc-400 mb-6">
              Enter your domain and find out in 10 seconds. No signup required.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/">
                <Button className="bg-red-500 hover:bg-red-600 text-white">
                  <Eye className="w-4 h-4 mr-2" />
                  Check My Domain
                </Button>
              </Link>
              <Link href="/feedback">
                <Button variant="outline" className="border-zinc-700 text-zinc-300">
                  Questions? Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
