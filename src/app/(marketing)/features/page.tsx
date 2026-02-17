import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Search,
  Target,
  FileText,
  Lightbulb,
  ShieldCheck,
  Share2,
  Bot,
  Trophy,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AnimateIn } from "@/components/motion/animate-in";
import { StaggerGroup, StaggerItem } from "@/components/motion/stagger-group";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientOrbs } from "@/components/backgrounds/gradient-orbs";

export const metadata: Metadata = {
  title: "Features | CabbageSEO",
  description: "See if AI recommends you or your competitors. Find gaps, get fix pages, and track your visibility across ChatGPT, Perplexity, and Google AI.",
};

interface Feature {
  name: string;
  description: string;
  icon: React.ReactNode;
  plan: "all" | "scout" | "command" | "dominate";
}

const capabilities: Feature[] = [
  {
    name: "AI Visibility Scanning",
    description:
      "See exactly what ChatGPT, Perplexity, and Google AI say when someone asks about your space. Know whether they mention you or not — and track how that changes over time.",
    icon: <Search className="w-5 h-5" />,
    plan: "all",
  },
  {
    name: "Gap Detection",
    description:
      "Find the specific buyer questions where AI should mention you but doesn't yet. These are real conversations happening right now without you in them.",
    icon: <Target className="w-5 h-5" />,
    plan: "scout",
  },
  {
    name: "Fix Pages",
    description:
      "Get ready-to-publish content pages structured so AI can actually understand and cite you — direct answers, comparison tables, FAQ sections, and Schema.org markup included.",
    icon: <FileText className="w-5 h-5" />,
    plan: "scout",
  },
  {
    name: "Gap Analysis & Content Ideas",
    description:
      "Understand why AI isn't citing you for specific queries and know exactly what to publish next. Prioritized by impact so you fix the highest-value gaps first.",
    icon: <Lightbulb className="w-5 h-5" />,
    plan: "scout",
  },
  {
    name: "Trust Source Tracking",
    description:
      "AI decides whether to recommend you based on third-party signals — G2, Capterra, Trustpilot, Yelp. See which ones you're missing from and where to get listed.",
    icon: <ShieldCheck className="w-5 h-5" />,
    plan: "scout",
  },
  {
    name: "Shareable Report Pages",
    description:
      "Every scan creates a public report at cabbageseo.com/r/yourdomain.com — share it on Twitter, embed it in your README, or send it to your team. Complete with OG images and badge embeds.",
    icon: <Share2 className="w-5 h-5" />,
    plan: "all",
  },
  {
    name: "Moltbot Integration",
    description:
      'Check AI visibility from your Moltbot agent. Just say "scan example.com" and get a full report. Set up weekly cron jobs for automated monitoring. Free on ClawHub.',
    icon: <Bot className="w-5 h-5" />,
    plan: "all",
  },
  {
    name: "Public Leaderboard",
    description:
      "See how your AI visibility score compares against other domains. Top scores, most scanned, and trending brands — all public and updated in real-time.",
    icon: <Trophy className="w-5 h-5" />,
    plan: "all",
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
    <GlassCard padding="md" className="h-full">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0 text-emerald-400">
            {feature.icon}
          </div>
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
        <p className="text-sm text-zinc-400 leading-relaxed">{feature.description}</p>
      </div>
    </GlassCard>
  );
}

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Hero */}
      <section className="pt-20 pb-16">
        <AnimateIn className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Know if AI ignores you. Then fix it.
          </h1>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-8">
            Scan what AI actually says about your space. Find where you&apos;re missing.
            Get the content and signals to start showing up. Here&apos;s what powers it.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-colors"
          >
            Run a Free Scan
            <ArrowRight className="w-5 h-5" />
          </Link>
        </AnimateIn>
      </section>

      {/* Core Capabilities */}
      <section className="py-24 border-t border-white/[0.06] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/[0.02] to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative">
          <AnimateIn className="mb-12">
            <Badge
              variant="outline"
              className="mb-4 text-emerald-400 border-emerald-500/30"
            >
              Core capabilities
            </Badge>
            <h2 className="text-3xl font-bold text-white mb-3">
              What you get
            </h2>
            <p className="text-zinc-400 max-w-2xl">
              Eight capabilities that work together: scan AI, find gaps, fix them, share your progress,
              and stay visible with automated monitoring.
            </p>
          </AnimateIn>
          <StaggerGroup className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {capabilities.map((f) => (
              <StaggerItem key={f.name}>
                <FeatureCard feature={f} />
              </StaggerItem>
            ))}
          </StaggerGroup>

          <div className="text-center mt-12">
            <Link
              href="/pricing"
              className="text-sm text-zinc-400 hover:text-emerald-400 transition-colors"
            >
              Compare plans in detail &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 border-t border-emerald-900/30 relative overflow-hidden">
        <GradientOrbs variant="emerald" />
        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <AnimateIn>
            <h2 className="text-2xl font-bold text-white mb-3">
              See where you stand in 10 seconds
            </h2>
            <p className="text-zinc-400 mb-6">
              Free scan. No signup. See if AI even knows you exist.
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
                href="/pricing"
                className="inline-flex items-center gap-2 px-8 py-4 border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 rounded-xl transition-colors"
              >
                See Pricing
              </Link>
            </div>
          </AnimateIn>
        </div>
      </section>
    </div>
  );
}
