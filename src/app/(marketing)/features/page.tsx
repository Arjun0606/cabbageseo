import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Search,
  Target,
  FileText,
  Lightbulb,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AnimateIn } from "@/components/motion/animate-in";
import { StaggerGroup, StaggerItem } from "@/components/motion/stagger-group";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientOrbs } from "@/components/backgrounds/gradient-orbs";

export const metadata: Metadata = {
  title: "Features | CabbageSEO",
  description: "AI Visibility Scanning, Gap Detection, Fix Pages, Intelligence & Action Plans, and Trust Source Tracking. See what CabbageSEO can do for your AI visibility.",
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
      "Runs your key queries through ChatGPT, Perplexity, and Google AI to check if they mention you. Tracks citations over time so you can see whether you're gaining or losing visibility.",
    icon: <Search className="w-5 h-5" />,
    plan: "all",
  },
  {
    name: "Gap Detection",
    description:
      "Identifies specific queries where AI talks about your space but doesn't mention you. These are your visibility gaps, the conversations happening without you.",
    icon: <Target className="w-5 h-5" />,
    plan: "scout",
  },
  {
    name: "Fix Pages",
    description:
      "Automatically generates expert-level content pages targeting each gap. Structured to be cited by AI with direct answers, comparison tables, FAQ sections, entity-rich text, and Schema.org markup.",
    icon: <FileText className="w-5 h-5" />,
    plan: "scout",
  },
  {
    name: "Intelligence & Action Plans",
    description:
      "Gap analysis explains why you're not being cited for specific queries. Content recommendations and weekly action plans prioritize what to do next based on your data.",
    icon: <Lightbulb className="w-5 h-5" />,
    plan: "scout",
  },
  {
    name: "Trust Source Tracking",
    description:
      "Monitors whether you're listed on the review platforms AI trusts like G2, Capterra, Trustpilot, and Yelp. These third-party profiles are signals AI uses to decide if you're credible enough to recommend.",
    icon: <ShieldCheck className="w-5 h-5" />,
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
            One loop. Five steps. Real results.
          </h1>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-8">
            CabbageSEO runs the GEO (Generative Engine Optimization) cycle:
            scan, find gaps, fix, verify, repeat. Here&apos;s what powers each step.
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
              Everything that powers the loop
            </h2>
            <p className="text-zinc-400 max-w-2xl">
              Five GEO capabilities that work together: scan AI engines, find your
              gaps, fix them, and track the results.
            </p>
          </AnimateIn>
          <StaggerGroup className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
            {capabilities.map((f, i) => (
              <StaggerItem key={f.name} className={i < 3 ? "lg:col-span-2" : "lg:col-span-3"}>
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
