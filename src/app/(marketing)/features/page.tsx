"use client";

import Link from "next/link";
import {
  ArrowRight,
  Check,
  Minus,
  Eye,
  Target,
  Users,
  Map,
  Bell,
  Brain,
  Search,
  Lightbulb,
  ClipboardList,
  Microscope,
  Zap,
  FileText,
  Timer,
  TrendingUp,
  MessageSquare,
  LineChart,
  AlertTriangle,
  PenTool,
  Trophy,
  Database,
  Mail,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Feature {
  name: string;
  description: string;
  icon: React.ReactNode;
  plan: "all" | "scout" | "command" | "dominate";
}

const monitorFeatures: Feature[] = [
  {
    name: "AI Citation Tracking",
    description:
      "Track when ChatGPT, Perplexity, and Google AI mention your brand across buyer queries.",
    icon: <Eye className="w-5 h-5" />,
    plan: "all",
  },
  {
    name: "GEO Score",
    description:
      "A single number showing your overall AI visibility. Updated with every check.",
    icon: <Target className="w-5 h-5" />,
    plan: "all",
  },
  {
    name: "Competitor Tracking",
    description:
      "Monitor up to 25 competitors. See who AI recommends and why.",
    icon: <Users className="w-5 h-5" />,
    plan: "scout",
  },
  {
    name: "Trust Map",
    description:
      "Visual map of trust sources AI uses — G2, Capterra, Reddit, Product Hunt. See where you're missing.",
    icon: <Map className="w-5 h-5" />,
    plan: "scout",
  },
  {
    name: "Alerts & Notifications",
    description:
      "Email alerts when your visibility changes. Never miss a competitor move.",
    icon: <Bell className="w-5 h-5" />,
    plan: "scout",
  },
  {
    name: "Score Drop Alerts",
    description:
      "Instant email + Slack notification when your visibility drops 5+ points. Includes the queries you're now losing.",
    icon: <AlertTriangle className="w-5 h-5" />,
    plan: "scout",
  },
  {
    name: "Historical Trend Chart",
    description:
      "Line chart of your AI visibility over time. Track score, queries won, and queries lost across weeks and months.",
    icon: <LineChart className="w-5 h-5" />,
    plan: "scout",
  },
  {
    name: "Slack Integration",
    description:
      "Get check results, score drops, and weekly summaries delivered directly to your Slack channel.",
    icon: <MessageSquare className="w-5 h-5" />,
    plan: "scout",
  },
];

const analyzeFeatures: Feature[] = [
  {
    name: "Citation Gap Analysis",
    description:
      "Per-query breakdown of why AI cited your competitor instead of you.",
    icon: <Brain className="w-5 h-5" />,
    plan: "scout",
  },
  {
    name: "Content Recommendations",
    description:
      "AI-generated content ideas based on gaps in your citation profile.",
    icon: <Lightbulb className="w-5 h-5" />,
    plan: "scout",
  },
  {
    name: "Weekly Action Plans",
    description:
      "Prioritized weekly playbook. Not a dashboard you stare at — a program that works.",
    icon: <ClipboardList className="w-5 h-5" />,
    plan: "command",
  },
  {
    name: "Competitor Deep Dive",
    description:
      "Full competitor analysis: their trust sources, content strategy, and authority signals.",
    icon: <Microscope className="w-5 h-5" />,
    plan: "command",
  },
];

const actFeatures: Feature[] = [
  {
    name: "Authority Pages",
    description:
      "Generate comparison pages, category explainers, and FAQs that reinforce your credibility with AI systems. They support third-party trust signals so AI can confidently cite you — they don't cause recommendations on their own.",
    icon: <FileText className="w-5 h-5" />,
    plan: "scout",
  },
  {
    name: "AI Content Preview",
    description:
      "Get a real \"Brand vs Competitor\" page generated during your free scan. First paragraph visible immediately — full page unlocked on signup.",
    icon: <PenTool className="w-5 h-5" />,
    plan: "all",
  },
  {
    name: "30-Day Sprint",
    description:
      "Structured 4-week program. Week-by-week actions with clear instructions and priority.",
    icon: <Timer className="w-5 h-5" />,
    plan: "scout",
  },
  {
    name: "Momentum Scoring",
    description:
      "Track progress with a single number. Week-over-week change tracking and trend indicators.",
    icon: <TrendingUp className="w-5 h-5" />,
    plan: "scout",
  },
  {
    name: "Get Listed Playbook",
    description:
      "Step-by-step instructions to get listed on every source AI trusts. G2, Capterra, Product Hunt, and more.",
    icon: <Map className="w-5 h-5" />,
    plan: "scout",
  },
  {
    name: "Weekly Email Digest",
    description:
      "Weekly momentum report with citation changes, competitor moves, and your top action. Delivered every Monday.",
    icon: <Bell className="w-5 h-5" />,
    plan: "scout",
  },
  {
    name: "Teaser Drip Emails",
    description:
      "Automated 3-email nurture sequence after free scans. Score recap, competitor insights, and action preview delivered over 5 days.",
    icon: <Mail className="w-5 h-5" />,
    plan: "all",
  },
  {
    name: "Custom Query Tracking",
    description:
      "Monitor your exact buying queries. Add the queries your customers actually ask and track visibility for each one.",
    icon: <Target className="w-5 h-5" />,
    plan: "scout",
  },
];

const planBadgeColors = {
  all: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  scout: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  command: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  dominate: "bg-amber-500/15 text-amber-400 border-amber-500/30",
};

const planBadgeLabels = {
  all: "All Plans",
  scout: "Scout+",
  command: "Command+",
  dominate: "Dominate",
};

function FeatureCard({ feature }: { feature: Feature }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0 text-emerald-400">
          {feature.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <h3 className="text-base font-semibold text-white">
              {feature.name}
            </h3>
            <Badge
              variant="outline"
              className={`text-xs ${planBadgeColors[feature.plan]}`}
            >
              {planBadgeLabels[feature.plan]}
            </Badge>
          </div>
          <p className="text-sm text-zinc-400">{feature.description}</p>
        </div>
      </div>
    </div>
  );
}

const comparisonFeatures = [
  { name: "AI Citation Tracking", free: true, scout: true, command: true, dominate: true },
  { name: "GEO Score", free: true, scout: true, command: true, dominate: true },
  { name: "Manual Checks", free: "3/day", scout: "Unlimited", command: "Unlimited", dominate: "Unlimited" },
  { name: "Auto-Check Frequency", free: false, scout: "Weekly", command: "Every 3 days", dominate: "Daily + Hourly" },
  { name: "Score Drop Alerts", free: false, scout: true, command: true, dominate: true },
  { name: "Historical Trend Chart", free: "7 days", scout: "30 days", command: "365 days", dominate: "365 days" },
  { name: "Competitor Tracking", free: false, scout: "3", command: "10", dominate: "25" },
  { name: "Custom Query Tracking", free: false, scout: "5 queries", command: "Unlimited", dominate: "Unlimited" },
  { name: "Trust Map", free: false, scout: true, command: true, dominate: true },
  { name: "Get Listed Playbook", free: false, scout: true, command: true, dominate: true },
  { name: "Email Alerts", free: false, scout: true, command: true, dominate: true },
  { name: "Slack Integration", free: false, scout: true, command: true, dominate: true },
  { name: "Weekly Email Digest", free: false, scout: true, command: true, dominate: true },
  { name: "Gap Analysis", free: false, scout: "5/mo", command: "Unlimited", dominate: "Unlimited" },
  { name: "Content Recommendations", free: false, scout: "5/mo", command: "Unlimited", dominate: "Unlimited" },
  { name: "Authority Pages", free: false, scout: "3/mo", command: "15/mo", dominate: "Unlimited" },
  { name: "Weekly Action Plans", free: false, scout: false, command: true, dominate: true },
  { name: "Competitor Deep Dive", free: false, scout: false, command: true, dominate: true },
  { name: "30-Day Sprint", free: false, scout: true, command: true, dominate: true },
  { name: "Momentum Scoring", free: false, scout: true, command: true, dominate: true },
  { name: "Sites", free: "1", scout: "1", command: "5", dominate: "25" },
  { name: "AI Content Preview", free: true, scout: true, command: true, dominate: true },
  { name: "Competitor Quick-Scan", free: true, scout: true, command: true, dominate: true },
  { name: "Bulk Scanning API", free: false, scout: false, command: "50/req", dominate: "50/req" },
  { name: "Team Members", free: "1", scout: "1", command: "5", dominate: "Unlimited" },
  { name: "Priority Support", free: false, scout: false, command: true, dominate: true },
];

function CellValue({ value }: { value: boolean | string }) {
  if (value === true)
    return <Check className="w-4 h-4 text-emerald-400 mx-auto" />;
  if (value === false)
    return <Minus className="w-4 h-4 text-zinc-600 mx-auto" />;
  return <span className="text-sm text-zinc-300">{value}</span>;
}

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Hero */}
      <section className="pt-20 pb-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Badge
            variant="outline"
            className="mb-6 text-emerald-400 border-emerald-500/30"
          >
            25+ features across 4 plans
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Everything you need to win in AI search
          </h1>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-8">
            Monitor your AI visibility, analyze gaps, and take action — all from
            one platform built for founders who want results.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-colors"
          >
            Start Free Trial
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Monitor */}
      <section className="py-24 border-t border-zinc-800">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-12">
            <Badge
              variant="outline"
              className="mb-4 text-emerald-400 border-emerald-500/30"
            >
              Monitor
            </Badge>
            <h2 className="text-3xl font-bold text-white mb-3">
              Know exactly where you stand
            </h2>
            <p className="text-zinc-400 max-w-2xl">
              Daily tracking across ChatGPT, Perplexity, and Google AI.
              See who gets recommended — and who doesn&apos;t.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {monitorFeatures.map((f) => (
              <FeatureCard key={f.name} feature={f} />
            ))}
          </div>
        </div>
      </section>

      {/* Analyze */}
      <section className="py-24 border-t border-zinc-800">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-12">
            <Badge
              variant="outline"
              className="mb-4 text-blue-400 border-blue-500/30"
            >
              Analyze
            </Badge>
            <h2 className="text-3xl font-bold text-white mb-3">
              Understand why AI picks your competitor
            </h2>
            <p className="text-zinc-400 max-w-2xl">
              Deep intelligence on citation gaps, content opportunities, and
              competitor strategies.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analyzeFeatures.map((f) => (
              <FeatureCard key={f.name} feature={f} />
            ))}
          </div>
        </div>
      </section>

      {/* Act */}
      <section className="py-24 border-t border-zinc-800">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-12">
            <Badge
              variant="outline"
              className="mb-4 text-amber-400 border-amber-500/30"
            >
              Act
            </Badge>
            <h2 className="text-3xl font-bold text-white mb-3">
              Take action, see results
            </h2>
            <p className="text-zinc-400 max-w-2xl">
              AI-generated content, structured sprints, and progress tracking.
              Not a dashboard — a program that works.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {actFeatures.map((f) => (
              <FeatureCard key={f.name} feature={f} />
            ))}
          </div>
        </div>
      </section>

      {/* Plan Comparison Table */}
      <section className="py-24 border-t border-zinc-800">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">
              Compare plans
            </h2>
            <p className="text-zinc-400">
              Every feature, every tier. Pick the plan that fits.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left py-4 px-4 text-sm font-medium text-zinc-500">
                    Feature
                  </th>
                  <th className="text-center py-4 px-4 text-sm font-medium text-zinc-400">
                    Free
                  </th>
                  <th className="text-center py-4 px-4 text-sm font-medium text-emerald-400">
                    Scout
                  </th>
                  <th className="text-center py-4 px-4 text-sm font-medium text-blue-400">
                    Command
                  </th>
                  <th className="text-center py-4 px-4 text-sm font-medium text-amber-400">
                    Dominate
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((row) => (
                  <tr
                    key={row.name}
                    className="border-b border-zinc-800/50 hover:bg-zinc-900/50"
                  >
                    <td className="py-3 px-4 text-sm text-white">
                      {row.name}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <CellValue value={row.free} />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <CellValue value={row.scout} />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <CellValue value={row.command} />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <CellValue value={row.dominate} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="text-center mt-8">
            <Link
              href="/pricing"
              className="text-sm text-zinc-400 hover:text-emerald-400 transition-colors"
            >
              View full pricing details →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-emerald-950/30 border-t border-emerald-900/30">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">
            Ready to win AI recommendations?
          </h2>
          <p className="text-zinc-400 mb-6">
            Start your free trial. See results in 30 days.
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
              href="/pricing"
              className="inline-flex items-center gap-2 px-8 py-4 border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 rounded-xl transition-colors"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
