"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bell,
  Brain,
  Search,
  FileText,
  Timer,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AnimateIn } from "@/components/motion/animate-in";
import { StaggerGroup, StaggerItem } from "@/components/motion/stagger-group";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientOrbs } from "@/components/backgrounds/gradient-orbs";

interface Feature {
  name: string;
  description: string;
  icon: React.ReactNode;
  plan: "all" | "scout" | "command" | "dominate";
}

const capabilities: Feature[] = [
  {
    name: "AI Citation Scanning",
    description:
      "Find out exactly which buyer questions lead to your competitors, not you. Real queries to ChatGPT, Perplexity & Google AI \u2014 actual AI responses, not estimations.",
    icon: <Search className="w-5 h-5" />,
    plan: "all",
  },
  {
    name: "Gap Analysis",
    description:
      "See every query where AI sends buyers elsewhere and understand why. Know exactly what\u2019s missing so you can close each gap systematically.",
    icon: <Brain className="w-5 h-5" />,
    plan: "scout",
  },
  {
    name: "Fix Pages",
    description:
      "Turn every visibility gap into a targeted page that gets AI to recommend you. Comparison pages, explainers, and FAQs built from your actual data.",
    icon: <FileText className="w-5 h-5" />,
    plan: "scout",
  },
  {
    name: "30-Day Sprint",
    description:
      "Go from invisible to recommended in 30 days. A structured week-by-week program of prioritized actions with clear instructions \u2014 not a dashboard to stare at.",
    icon: <Timer className="w-5 h-5" />,
    plan: "scout",
  },
  {
    name: "Automated Monitoring",
    description:
      "Never be caught off guard. Daily or hourly scans detect the moment AI shifts. Instant email + Slack alerts if your visibility drops so you can act fast.",
    icon: <Bell className="w-5 h-5" />,
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
    <GlassCard padding="md" className="h-full">
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
    </GlassCard>
  );
}

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Hero */}
      <section className="pt-20 pb-16">
        <AnimateIn className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            One loop. Five steps. Real results.
          </h1>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-8">
            CabbageSEO runs the GEO (Generative Engine Optimization) cycle:
            scan, find gaps, fix, verify, repeat. Here&apos;s what powers each step.
          </p>
          <Link
            href="/signup"
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
        <div className="max-w-6xl mx-auto px-6 relative">
          <AnimateIn className="mb-12">
            <Badge
              variant="outline"
              className="mb-4 text-emerald-400 border-emerald-500/30"
            >
              Core capabilities
            </Badge>
            <h2 className="text-3xl font-bold text-white mb-3">
              Everything that powers the loop
            </h2>
            <p className="text-zinc-400 max-w-2xl">
              Six GEO capabilities that work together: scan AI engines, find your
              gaps, fix them, and track the results.
            </p>
          </AnimateIn>
          <StaggerGroup className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
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
        <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
          <AnimateIn>
            <h2 className="text-2xl font-bold text-white mb-3">
              See which plan fits
            </h2>
            <p className="text-zinc-400 mb-6">
              Run a free scan to see where you stand. Subscribe when you&apos;re ready.
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
