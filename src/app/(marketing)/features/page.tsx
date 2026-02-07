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
  Compass,
  Zap,
  FileText,
  Timer,
  TrendingUp,
  Calendar,
  Palette,
  Code,
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
      "Email alerts on Scout, real-time notifications on Dominate. Never miss a competitor move.",
    icon: <Bell className="w-5 h-5" />,
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
  {
    name: "Query Discovery",
    description:
      "Find new queries where buyers are asking about your category. Stop guessing which queries matter.",
    icon: <Compass className="w-5 h-5" />,
    plan: "command",
  },
];

const actFeatures: Feature[] = [
  {
    name: "AI Page Generation",
    description:
      "Generate publish-ready pages optimized for AI citation. Not bullet points — actual content.",
    icon: <FileText className="w-5 h-5" />,
    plan: "scout",
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
    name: "Monthly Checkpoints",
    description:
      "Automated monthly reports with citation trends, competitor movements, and next steps.",
    icon: <Calendar className="w-5 h-5" />,
    plan: "scout",
  },
  {
    name: "White-Label Reports",
    description:
      "Branded reports for your clients. Perfect for agencies managing multiple brands.",
    icon: <Palette className="w-5 h-5" />,
    plan: "dominate",
  },
  {
    name: "API Access",
    description:
      "Full API access for custom integrations and automated workflows.",
    icon: <Code className="w-5 h-5" />,
    plan: "dominate",
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
  { name: "Daily Auto-Check", free: false, scout: true, command: true, dominate: true },
  { name: "Hourly Auto-Check", free: false, scout: false, command: true, dominate: true },
  { name: "Competitor Tracking", free: false, scout: "3", command: "10", dominate: "25" },
  { name: "Trust Map", free: false, scout: true, command: true, dominate: true },
  { name: "Email Alerts", free: false, scout: true, command: true, dominate: true },
  { name: "Real-Time Alerts", free: false, scout: false, command: false, dominate: true },
  { name: "Gap Analysis", free: false, scout: "5/mo", command: "Unlimited", dominate: "Unlimited" },
  { name: "Content Recommendations", free: false, scout: "5/mo", command: "Unlimited", dominate: "Unlimited" },
  { name: "AI Page Generation", free: false, scout: "3/mo", command: "15/mo", dominate: "Unlimited" },
  { name: "Weekly Action Plans", free: false, scout: false, command: true, dominate: true },
  { name: "Competitor Deep Dive", free: false, scout: false, command: true, dominate: true },
  { name: "Query Discovery", free: false, scout: false, command: true, dominate: true },
  { name: "30-Day Sprint", free: false, scout: true, command: true, dominate: true },
  { name: "Momentum Scoring", free: false, scout: true, command: true, dominate: true },
  { name: "Monthly Checkpoints", free: false, scout: true, command: true, dominate: true },
  { name: "Sites", free: "1", scout: "1", command: "5", dominate: "25" },
  { name: "Team Members", free: "1", scout: "1", command: "5", dominate: "Unlimited" },
  { name: "White-Label Reports", free: false, scout: false, command: false, dominate: true },
  { name: "API Access", free: false, scout: false, command: false, dominate: true },
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
            16 features across 4 plans
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
              Real-time tracking across ChatGPT, Perplexity, and Google AI.
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
