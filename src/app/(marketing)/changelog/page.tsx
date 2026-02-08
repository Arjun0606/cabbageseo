"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Sparkles,
  Timer,
  TrendingUp,
  Search,
  Compass,
  Calendar,
  Bell,
  DollarSign,
  FileText,
  Eye,
  MessageSquare,
  LineChart,
  AlertTriangle,
  Zap,
  Target,
  Share2,
  PenTool,
  Database,
  Trophy,
  Mail,
  Users,
} from "lucide-react";

interface ChangelogEntry {
  date: string;
  category: "new" | "improved" | "fixed";
  title: string;
  description: string;
  icon: React.ReactNode;
}

const entries: ChangelogEntry[] = [
  {
    date: "February 9, 2026",
    category: "new",
    title: "AI Content Preview in Teaser",
    description:
      "Free scans now generate a real \"Brand vs Competitor\" comparison page preview. First paragraph and one FAQ visible immediately — rest blurred behind signup. Shows the value of our content generation before you sign up.",
    icon: <PenTool className="w-5 h-5" />,
  },
  {
    date: "February 9, 2026",
    category: "new",
    title: "Competitor Quick-Scan",
    description:
      "After viewing a teaser report, scan any competitor with one click. Quick-scan buttons for the top 4 competitors found in your report, plus a custom domain input. Creates a viral loop — scan your brand, then scan competitors.",
    icon: <Users className="w-5 h-5" />,
  },
  {
    date: "February 9, 2026",
    category: "new",
    title: "Bulk Scanning API",
    description:
      "Programmatic access to scan up to 50 domains per request. POST to /api/v1/scan/bulk with an API key. Rate-limited to 200 scans/hour. Perfect for agencies onboarding new clients or building integrations.",
    icon: <Database className="w-5 h-5" />,
  },
  {
    date: "February 9, 2026",
    category: "new",
    title: "Teaser Drip Email Sequence",
    description:
      "Automated 3-email nurture after free scans. Day 0: score recap. Day 2: competitor fear. Day 5: action preview with content preview teaser. Runs daily at 9 AM UTC via Inngest cron.",
    icon: <Mail className="w-5 h-5" />,
  },
  {
    date: "February 9, 2026",
    category: "new",
    title: "AI Visibility Leaderboard",
    description:
      "Public leaderboard of the top 30 most visible SaaS brands in AI search. Filterable by category. Check where your brand ranks — or scan to find out. Available at /leaderboard.",
    icon: <Trophy className="w-5 h-5" />,
  },
  {
    date: "February 9, 2026",
    category: "new",
    title: "Blog & Content Hub",
    description:
      "New blog at /blog with guides on AI SEO, generative engine optimization, and AI visibility strategy. Targeting high-intent keywords like \"how to get recommended by ChatGPT\" and \"GEO guide 2026\".",
    icon: <FileText className="w-5 h-5" />,
  },
  {
    date: "February 9, 2026",
    category: "improved",
    title: "Upgraded OG Score Cards",
    description:
      "Shared teaser reports now show competitor names, verdict pills, and a split layout in social previews. Richer sharing experience on Twitter, LinkedIn, and Slack.",
    icon: <Share2 className="w-5 h-5" />,
  },
  {
    date: "February 8, 2026",
    category: "new",
    title: "Slack Integration",
    description:
      "Get AI visibility alerts directly in Slack. Check results, score drop notifications, and weekly summaries delivered to your channel. Configure in Settings > Notifications with a single webhook URL.",
    icon: <MessageSquare className="w-5 h-5" />,
  },
  {
    date: "February 8, 2026",
    category: "new",
    title: "Score Drop Alerts",
    description:
      "Instant email + Slack notification when your AI visibility drops 5 or more points. Includes the specific queries you're now losing so you can take action immediately.",
    icon: <AlertTriangle className="w-5 h-5" />,
  },
  {
    date: "February 8, 2026",
    category: "new",
    title: "Plan-Tiered Auto-Checks",
    description:
      "Automated checks now run on a schedule based on your plan: weekly for Scout, every 3 days for Command, daily + hourly for Dominate. Free users are excluded from automated runs. No manual action needed.",
    icon: <Zap className="w-5 h-5" />,
  },
  {
    date: "February 8, 2026",
    category: "new",
    title: "Historical Trend Chart",
    description:
      "Line chart of your AI visibility score over time, right on the dashboard. Track queries won, queries lost, and overall score across weeks and months. Like Ahrefs rank tracker, but for AI citations.",
    icon: <LineChart className="w-5 h-5" />,
  },
  {
    date: "February 8, 2026",
    category: "new",
    title: "Custom Query Tracking",
    description:
      "Monitor your exact buying queries. Add the queries your customers actually ask and track visibility for each one. Scout gets 5 slots, Command and Dominate get unlimited.",
    icon: <Target className="w-5 h-5" />,
  },
  {
    date: "February 8, 2026",
    category: "new",
    title: "Dynamic OG Score Cards",
    description:
      "Shared teaser reports now generate dynamic social preview images. When you share a report link on Twitter, LinkedIn, or Slack, it shows a rich 1200x630 card with the domain, score, and verdict.",
    icon: <Share2 className="w-5 h-5" />,
  },
  {
    date: "February 6, 2026",
    category: "new",
    title: "Authority Pages (formerly Support Pages)",
    description:
      "Generate comparison pages, category explainers, and FAQs that reinforce your credibility with AI systems. Uses your citation data, competitor intelligence, and gap analysis to create pages that reinforce the trust signals AI already looks for — not generic SEO content.",
    icon: <FileText className="w-5 h-5" />,
  },
  {
    date: "February 3, 2026",
    category: "new",
    title: "Momentum Scoring",
    description:
      "Track your AI visibility progress with a single number. Your momentum score updates weekly, showing whether you're gaining or losing ground against competitors. Includes week-over-week change tracking and trend indicators.",
    icon: <TrendingUp className="w-5 h-5" />,
  },
  {
    date: "January 28, 2026",
    category: "new",
    title: "30-Day Sprint Framework",
    description:
      "A structured 4-week program to improve your AI visibility. Week 1: critical sources. Week 2: comparison content. Week 3: authority building. Week 4: review and optimize. Each action has clear instructions, estimated time, and priority.",
    icon: <Timer className="w-5 h-5" />,
  },
  {
    date: "January 22, 2026",
    category: "new",
    title: "Competitor Alerts",
    description:
      "Get notified when competitors gain or lose AI citations. Email alerts for Scout and Command plans, real-time notifications for Dominate. Never be surprised by a competitor's move again.",
    icon: <Bell className="w-5 h-5" />,
  },
  {
    date: "January 18, 2026",
    category: "new",
    title: "Monthly Checkpoints",
    description:
      "Automated monthly progress reports showing how your AI visibility has changed. Includes citation trends, competitor movements, and recommended next steps for the coming month.",
    icon: <Calendar className="w-5 h-5" />,
  },
  {
    date: "January 12, 2026",
    category: "new",
    title: "Competitor Deep Dive",
    description:
      "Full competitor analysis showing exactly why AI recommends them. See their trust sources, content strategy, and authority signals. Available on Command and Dominate plans.",
    icon: <Search className="w-5 h-5" />,
  },
  {
    date: "January 6, 2026",
    category: "new",
    title: "Query Discovery",
    description:
      "Find new queries where buyers are asking about your category. AI-suggested queries based on your industry, competitors, and existing citation data. Stop guessing which queries matter.",
    icon: <Compass className="w-5 h-5" />,
  },
  {
    date: "December 20, 2025",
    category: "new",
    title: "Trust Map",
    description:
      "Visual map showing which trust sources (G2, Capterra, Product Hunt, Reddit) AI platforms use to form recommendations. See where competitors are listed and you're not. Get step-by-step guides to get listed.",
    icon: <Eye className="w-5 h-5" />,
  },
  {
    date: "December 10, 2025",
    category: "improved",
    title: "Updated Pricing Tiers",
    description:
      "Simplified pricing with clearer feature differentiation. Scout ($49), Command ($149), and Dominate ($349). Annual billing now available with 20% savings. Every paid plan includes a 7-day free trial.",
    icon: <DollarSign className="w-5 h-5" />,
  },
  {
    date: "November 28, 2025",
    category: "new",
    title: "Citation Gap Analysis",
    description:
      "Per-query breakdown of why AI cited your competitor instead of you. See exactly what content, trust sources, and authority signals you're missing. The foundation for winning AI recommendations.",
    icon: <Sparkles className="w-5 h-5" />,
  },
];

const categoryColors = {
  new: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  improved: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  fixed: "bg-amber-500/15 text-amber-400 border-amber-500/30",
};

const categoryLabels = {
  new: "New Feature",
  improved: "Improved",
  fixed: "Bug Fix",
};

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Hero */}
      <section className="pt-20 pb-12">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <Badge variant="outline" className="mb-6 text-emerald-400 border-emerald-500/30">
            Updated regularly
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Changelog
          </h1>
          <p className="text-lg text-zinc-400">
            See what we&apos;re building. Every feature, improvement, and fix — transparently.
          </p>
        </div>
      </section>

      {/* Timeline */}
      <section className="pb-24">
        <div className="max-w-3xl mx-auto px-6">
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-zinc-800 hidden md:block" />

            <div className="space-y-8">
              {entries.map((entry, i) => (
                <div key={i} className="relative md:pl-16">
                  {/* Timeline dot */}
                  <div className="absolute left-4 top-6 w-5 h-5 rounded-full bg-zinc-900 border-2 border-zinc-700 hidden md:flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>

                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <span className="text-sm text-zinc-500">{entry.date}</span>
                      <Badge
                        variant="outline"
                        className={categoryColors[entry.category]}
                      >
                        {categoryLabels[entry.category]}
                      </Badge>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0 text-emerald-400">
                        {entry.icon}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-2">
                          {entry.title}
                        </h3>
                        <p className="text-sm text-zinc-400 leading-relaxed">
                          {entry.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-emerald-950/30 border-t border-emerald-900/30">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">
            Try the latest features
          </h2>
          <p className="text-zinc-400 mb-6">
            Start your free trial and see how CabbageSEO helps you win AI recommendations.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-colors"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/features"
              className="inline-flex items-center gap-2 px-8 py-4 border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 rounded-xl transition-colors"
            >
              View All Features
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
