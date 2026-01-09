"use client";

import Link from "next/link";
import {
  Eye,
  Search,
  Bot,
  Sparkles,
  Bell,
  Target,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Globe,
  Clock,
  Zap,
  Download,
  Code,
  HelpCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// ============================================
// CITATION INTELLIGENCE DOCUMENTATION
// ============================================

const sections = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: Eye,
    items: [
      {
        title: "What is Citation Intelligence?",
        content: `Citation Intelligence tracks when AI platforms (ChatGPT, Perplexity, Google AI) mention or cite your website in their responses. Unlike traditional SEO which focuses on Google search rankings, we monitor the new AI search landscape.`,
      },
      {
        title: "How does it work?",
        content: `1. Add your website domain\n2. We query AI platforms with relevant questions about your domain\n3. We detect when your site is mentioned or linked\n4. You get alerts and historical tracking`,
      },
      {
        title: "Supported Platforms",
        content: `• **Perplexity** - Real API integration with citation detection\n• **Google AI** - Gemini with search grounding\n• **ChatGPT / SearchGPT** - OpenAI query simulation`,
      },
    ],
  },
  {
    id: "citation-tracking",
    title: "Citation Tracking",
    icon: BarChart3,
    items: [
      {
        title: "Running a Citation Check",
        content: `From your dashboard, click "Check Now" to run an immediate citation check across all platforms. Pro users get automatic hourly checks.`,
      },
      {
        title: "Understanding Results",
        content: `• **High confidence** - Your domain was explicitly mentioned or linked\n• **Medium confidence** - Your brand or content was referenced\n• **Low confidence** - Related content was mentioned`,
      },
      {
        title: "Citation History",
        content: `View all your citations in the Citations page. Filter by platform, date, or query. Export to CSV for reporting.`,
      },
    ],
  },
  {
    id: "competitors",
    title: "Competitor Tracking",
    icon: Target,
    items: [
      {
        title: "Adding Competitors",
        content: `Go to the Competitors page and add competitor domains. We'll track their citations alongside yours.`,
      },
      {
        title: "Comparison View",
        content: `See a side-by-side comparison of your citations vs competitors. Identify who's winning in AI search.`,
      },
      {
        title: "Competitive Alerts",
        content: `Pro users get alerts when a competitor gets cited for queries in your niche.`,
      },
    ],
  },
  {
    id: "alerts",
    title: "Alerts & Notifications",
    icon: Bell,
    items: [
      {
        title: "Email Alerts",
        content: `Get instant email notifications when:\n• You get a new citation\n• You lose a citation\n• A competitor gets cited`,
      },
      {
        title: "Weekly Digest",
        content: `Every Monday, receive a summary of your citation activity including:\n• New citations\n• Total count\n• Competitor comparison\n• Top queries`,
      },
      {
        title: "Configuring Alerts",
        content: `Go to Settings > Notifications to customize your alert preferences.`,
      },
    ],
  },
  {
    id: "api",
    title: "API Access",
    icon: Code,
    items: [
      {
        title: "API Overview",
        content: `Pro and Agency users get API access to programmatically check citations. Use it to integrate with your own dashboards or workflows.`,
      },
      {
        title: "Endpoints",
        content: `\`\`\`
GET /api/geo/citations?siteId=xxx
POST /api/geo/citations/check
GET /api/competitors?siteId=xxx
\`\`\``,
      },
      {
        title: "Authentication",
        content: `Use your API key in the Authorization header:\n\`Authorization: Bearer YOUR_API_KEY\``,
      },
    ],
  },
  {
    id: "faq",
    title: "FAQ",
    icon: HelpCircle,
    items: [
      {
        title: "How often are citations checked?",
        content: `• Free: Manual checks (3/day)\n• Starter: Daily automated checks\n• Pro: Hourly automated checks\n• Agency: Continuous monitoring`,
      },
      {
        title: "Can I check any website?",
        content: `Yes! You can check any public website. The free analyzer at /analyze lets anyone check a site without signing up.`,
      },
      {
        title: "What makes a site more likely to be cited?",
        content: `AI platforms tend to cite:\n• Authoritative sources with expertise\n• Original research and unique data\n• Well-structured content with clear answers\n• Sites with proper schema markup`,
      },
      {
        title: "How accurate is citation detection?",
        content: `Perplexity citations are 100% accurate (real API). Google AI citations use Gemini grounding. ChatGPT uses simulation queries. We're continuously improving accuracy.`,
      },
    ],
  },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/apple-touch-icon.png" alt="CabbageSEO" className="h-10 w-10 rounded-lg" />
            <span className="font-bold text-xl tracking-tight text-white">CabbageSEO</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/pricing" className="text-zinc-400 hover:text-white">Pricing</Link>
            <Link href="/feedback" className="text-zinc-400 hover:text-white">Feedback</Link>
            <Link href="/dashboard">
              <Button className="bg-emerald-600 hover:bg-emerald-500">Dashboard</Button>
            </Link>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Title */}
          <div className="text-center mb-12">
            <Badge className="bg-emerald-500/10 text-emerald-400 mb-4">Documentation</Badge>
            <h1 className="text-4xl font-bold text-white mb-4">Citation Intelligence Docs</h1>
            <p className="text-xl text-zinc-400">
              Everything you need to know about tracking your AI visibility
            </p>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-emerald-500/50 transition-colors"
              >
                <section.icon className="w-6 h-6 text-emerald-400 mb-2" />
                <h3 className="text-white font-medium">{section.title}</h3>
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
            <h2 className="text-2xl font-bold text-white mb-4">Ready to track your citations?</h2>
            <p className="text-zinc-400 mb-6">
              Start free, no credit card required.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/signup">
                <Button className="bg-emerald-600 hover:bg-emerald-500">
                  <Eye className="w-4 h-4 mr-2" />
                  Start Free
                </Button>
              </Link>
              <Link href="/feedback">
                <Button variant="outline" className="border-zinc-700">
                  Need Help?
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-8 px-4 mt-12">
        <div className="container mx-auto max-w-4xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/apple-touch-icon.png" alt="CabbageSEO" className="h-6 w-6 rounded" />
            <span className="text-zinc-500 text-sm">CabbageSEO</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-zinc-500">
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <a href="https://x.com/Arjun06061" target="_blank" rel="noopener noreferrer" className="hover:text-white">
              𝕏 @Arjun06061
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
