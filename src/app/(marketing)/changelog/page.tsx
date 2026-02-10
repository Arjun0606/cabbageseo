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
import { AnimateIn } from "@/components/motion/animate-in";
import { StaggerGroup, StaggerItem } from "@/components/motion/stagger-group";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientOrbs } from "@/components/backgrounds/gradient-orbs";

interface ChangelogEntry {
  category: "new" | "improved" | "fixed";
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface ChangelogGroup {
  label: string;
  entries: ChangelogEntry[];
}

const groups: ChangelogGroup[] = [
  {
    label: "Launch",
    entries: [
      {
        category: "new",
        title: "AI Content Preview in Teaser",
        description:
          'Free scans generate a real "Brand vs Competitor" comparison page preview. First paragraph and one FAQ visible immediately — rest blurred behind signup.',
        icon: <PenTool className="w-5 h-5" />,
      },
      {
        category: "new",
        title: "Competitor Quick-Scan",
        description:
          "After viewing a teaser report, scan any competitor with one click. Quick-scan buttons for the top competitors found in your report.",
        icon: <Users className="w-5 h-5" />,
      },
      {
        category: "new",
        title: "Bulk Scanning API",
        description:
          "Programmatic access to scan up to 50 domains per request. POST to /api/v1/scan/bulk with an API key. Rate-limited to 200 scans/hour.",
        icon: <Database className="w-5 h-5" />,
      },
      {
        category: "new",
        title: "Teaser Drip Email Sequence",
        description:
          "Automated 3-email nurture after free scans. Day 0: score recap. Day 2: competitor fear. Day 5: action preview with content preview teaser.",
        icon: <Mail className="w-5 h-5" />,
      },
      {
        category: "new",
        title: "AI Visibility Leaderboard",
        description:
          "Public leaderboard of the top recommended brands in AI search, powered by real scan data. Available at /leaderboard.",
        icon: <Trophy className="w-5 h-5" />,
      },
      {
        category: "new",
        title: "Slack Integration",
        description:
          "Get AI visibility alerts directly in Slack. Check results, score drop notifications, and weekly summaries delivered to your channel.",
        icon: <MessageSquare className="w-5 h-5" />,
      },
      {
        category: "new",
        title: "Score Drop Alerts",
        description:
          "Email and Slack notification when your AI visibility drops significantly. Includes the specific queries you're now losing.",
        icon: <AlertTriangle className="w-5 h-5" />,
      },
      {
        category: "new",
        title: "Plan-Tiered Auto-Checks",
        description:
          "Automated checks run on a schedule based on your plan: weekly for Scout, every 3 days for Command, daily for Dominate.",
        icon: <Zap className="w-5 h-5" />,
      },
      {
        category: "new",
        title: "Historical Trend Chart",
        description:
          "Line chart of your AI visibility score over time on the dashboard. Track queries won, queries lost, and overall score across weeks.",
        icon: <LineChart className="w-5 h-5" />,
      },
      {
        category: "new",
        title: "Custom Query Tracking",
        description:
          "Monitor your exact buying queries. Add the queries your customers actually ask and track visibility for each one.",
        icon: <Target className="w-5 h-5" />,
      },
      {
        category: "new",
        title: "Dynamic OG Score Cards",
        description:
          "Shared teaser reports generate dynamic social preview images. Rich 1200x630 cards with the domain, score, and verdict.",
        icon: <Share2 className="w-5 h-5" />,
      },
      {
        category: "new",
        title: "Fix Pages",
        description:
          "Generate comparison pages, category explainers, and FAQs that reinforce your credibility with AI systems using your citation data and competitor intelligence.",
        icon: <FileText className="w-5 h-5" />,
      },
      {
        category: "new",
        title: "Momentum Scoring",
        description:
          "Track your AI visibility progress with a single number. Your momentum score updates weekly, showing whether you're gaining or losing ground.",
        icon: <TrendingUp className="w-5 h-5" />,
      },
      {
        category: "new",
        title: "30-Day Sprint Framework",
        description:
          "A structured 4-week program to improve your AI visibility. Each week has targeted actions with clear instructions, estimated time, and priority.",
        icon: <Timer className="w-5 h-5" />,
      },
      {
        category: "new",
        title: "Competitor Alerts",
        description:
          "Get notified when competitors gain or lose AI citations. Email alerts keep you informed of competitor movements.",
        icon: <Bell className="w-5 h-5" />,
      },
      {
        category: "new",
        title: "Monthly Checkpoints",
        description:
          "Automated monthly progress reports showing how your AI visibility has changed. Includes citation trends and recommended next steps.",
        icon: <Calendar className="w-5 h-5" />,
      },
      {
        category: "new",
        title: "Competitor Deep Dive",
        description:
          "Full competitor analysis showing why AI recommends them. See their trust sources, content strategy, and authority signals.",
        icon: <Search className="w-5 h-5" />,
      },
      {
        category: "new",
        title: "Query Discovery",
        description:
          "Find new queries where buyers ask about your category. AI-suggested queries based on your industry and competitors.",
        icon: <Compass className="w-5 h-5" />,
      },
      {
        category: "new",
        title: "Trust Map",
        description:
          "Visual map showing which trust sources AI platforms use to form recommendations. See where competitors are listed and you're not.",
        icon: <Eye className="w-5 h-5" />,
      },
      {
        category: "new",
        title: "Scout, Command & Dominate Plans",
        description:
          "Three tiers with clear feature differentiation. Scout ($49), Command ($149), and Dominate ($349). Annual billing available with 20% savings.",
        icon: <DollarSign className="w-5 h-5" />,
      },
      {
        category: "new",
        title: "Citation Gap Analysis",
        description:
          "Per-query breakdown of why AI cited your competitor instead of you. See exactly what content, trust sources, and authority signals you're missing.",
        icon: <Sparkles className="w-5 h-5" />,
      },
    ],
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
          <AnimateIn direction="up" delay={0} once>
            <Badge variant="outline" className="mb-6 text-emerald-400 border-emerald-500/30">
              Updated regularly
            </Badge>
          </AnimateIn>
          <AnimateIn direction="up" delay={0.1} once>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Changelog
            </h1>
          </AnimateIn>
          <AnimateIn direction="up" delay={0.15} once>
            <p className="text-lg text-zinc-400">
              See what we&apos;ve built. Every feature, improvement, and fix — transparently.
            </p>
          </AnimateIn>
        </div>
      </section>

      {/* Timeline */}
      <section className="pb-24">
        <div className="max-w-3xl mx-auto px-6">
          {groups.map((group) => (
            <div key={group.label} className="mb-12">
              <AnimateIn direction="up" delay={0} once>
                <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  {group.label}
                </h2>
              </AnimateIn>
              <StaggerGroup className="space-y-4" stagger={0.05}>
                {group.entries.map((entry, i) => (
                  <StaggerItem key={i}>
                    <GlassCard hover padding="md">
                      <div className="flex flex-wrap items-center gap-3 mb-3">
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
                    </GlassCard>
                  </StaggerItem>
                ))}
              </StaggerGroup>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden py-16 bg-emerald-950/30 border-t border-emerald-900/30">
        <GradientOrbs variant="emerald" />
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <AnimateIn direction="up" delay={0} once>
            <h2 className="text-2xl font-bold text-white mb-3">
              Try the latest features
            </h2>
            <p className="text-zinc-400 mb-6">
              Run a free scan and see how CabbageSEO helps you win AI recommendations.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-colors"
              >
                Run a Free Scan
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/features"
                className="inline-flex items-center gap-2 px-8 py-4 border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 rounded-xl transition-colors"
              >
                View All Features
              </Link>
            </div>
          </AnimateIn>
        </div>
      </section>
    </div>
  );
}
