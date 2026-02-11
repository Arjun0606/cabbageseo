"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  X as XIcon,
  Clock,
  Globe,
  History,
  Users,
  ClipboardList,
  Gauge,
  BarChart3,
  Zap,
} from "lucide-react";
import { AnimateIn } from "@/components/motion/animate-in";
import { StaggerGroup, StaggerItem } from "@/components/motion/stagger-group";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientOrbs } from "@/components/backgrounds/gradient-orbs";

const comparisonRows = [
  {
    feature: "Time per check",
    manual: "20-30 minutes",
    cabbage: "10 seconds",
    icon: <Clock className="w-4 h-4" />,
  },
  {
    feature: "Platforms covered",
    manual: "1-2 (you forget the others)",
    cabbage: "3 (ChatGPT, Perplexity, Google AI)",
    icon: <Globe className="w-4 h-4" />,
  },
  {
    feature: "Historical tracking",
    manual: "You forget last week's results",
    cabbage: "Automatic, up to 365 days",
    icon: <History className="w-4 h-4" />,
  },
  {
    feature: "Brand visibility tracking",
    manual: "Manual guesswork",
    cabbage: "Automated — see which brands AI recommends",
    icon: <Users className="w-4 h-4" />,
  },
  {
    feature: "Action plan",
    manual: "DIY research, trial and error",
    cabbage: "Weekly prioritized playbook",
    icon: <ClipboardList className="w-4 h-4" />,
  },
  {
    feature: "Progress tracking",
    manual: "Gut feeling",
    cabbage: "Momentum score, week-over-week data",
    icon: <Gauge className="w-4 h-4" />,
  },
  {
    feature: "Fixing visibility gaps",
    manual: "Write pages from scratch, guess what to target",
    cabbage: "Data-driven fix pages based on actual AI citation gaps",
    icon: <BarChart3 className="w-4 h-4" />,
  },
  {
    feature: "Scale",
    manual: "1 site, barely",
    cabbage: "Up to 25 sites, fully automated",
    icon: <Zap className="w-4 h-4" />,
  },
];

export default function VsManualTrackingPage() {
  const router = useRouter();
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain.trim()) return;
    setLoading(true);
    let cleanDomain = domain.trim().toLowerCase();
    cleanDomain = cleanDomain.replace(/^https?:\/\//, "");
    cleanDomain = cleanDomain.replace(/^www\./, "");
    cleanDomain = cleanDomain.split("/")[0];
    router.push(`/teaser?domain=${encodeURIComponent(cleanDomain)}`);
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Hero */}
      <section className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <AnimateIn direction="up" delay={0} once>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              CabbageSEO vs. Manual AI Tracking
            </h1>
          </AnimateIn>
          <AnimateIn direction="up" delay={0.1} once>
            <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
              You could check ChatGPT manually every week. Or you could automate it and spend your time actually improving.
            </p>
          </AnimateIn>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="pb-24">
        <div className="max-w-7xl mx-auto px-6">
          {/* Table Header */}
          <AnimateIn direction="up" delay={0.2} once>
            <div className="grid grid-cols-3 gap-4 mb-2 px-4">
              <div className="text-sm font-medium text-zinc-500">Feature</div>
              <div className="text-sm font-medium text-red-400 text-center">Manual Tracking</div>
              <div className="text-sm font-medium text-emerald-400 text-center">CabbageSEO</div>
            </div>
          </AnimateIn>

          {/* Table Rows */}
          <StaggerGroup className="space-y-2">
            {comparisonRows.map((row, i) => (
              <StaggerItem key={i}>
                <GlassCard hover={false} padding="sm">
                  <div className="grid grid-cols-3 gap-4 p-4 items-center">
                    <div className="flex items-center gap-3">
                      <span className="text-zinc-500">{row.icon}</span>
                      <span className="text-sm font-medium text-white">{row.feature}</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <XIcon className="w-4 h-4 text-red-400 flex-shrink-0" />
                      <span className="text-sm text-zinc-400 text-center">{row.manual}</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span className="text-sm text-zinc-300 text-center">{row.cabbage}</span>
                    </div>
                  </div>
                </GlassCard>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      {/* Why Switch */}
      <section className="py-24 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6">
          <AnimateIn direction="up" delay={0} once>
            <h2 className="text-3xl font-bold text-white text-center mb-12">
              Why founders stop tracking manually
            </h2>
          </AnimateIn>

          <StaggerGroup className="grid md:grid-cols-3 gap-6">
            <StaggerItem>
              <GlassCard hover glow="emerald" padding="lg" className="text-center h-full">
                <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Clock className="w-7 h-7 text-emerald-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  Save 2+ hours per week
                </h3>
                <p className="text-zinc-400">
                  Manually checking 3 AI platforms for multiple queries takes hours. CabbageSEO does it in seconds, automatically.
                </p>
              </GlassCard>
            </StaggerItem>

            <StaggerItem>
              <GlassCard hover glow="emerald" padding="lg" className="text-center h-full">
                <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <BarChart3 className="w-7 h-7 text-emerald-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  Data you can actually use
                </h3>
                <p className="text-zinc-400">
                  Manual checks give you a snapshot. CabbageSEO gives you trends, gaps, brand visibility intel, and a step-by-step action plan.
                </p>
              </GlassCard>
            </StaggerItem>

            <StaggerItem>
              <GlassCard hover glow="emerald" padding="lg" className="text-center h-full">
                <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Zap className="w-7 h-7 text-emerald-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  Results in 30 days
                </h3>
                <p className="text-zinc-400">
                  The 30-day sprint gives you a structured path. Week by week actions. Not a dashboard you stare at — a program that works.
                </p>
              </GlassCard>
            </StaggerItem>
          </StaggerGroup>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-16 bg-emerald-950/30 border-t border-emerald-900/30 overflow-hidden">
        <GradientOrbs variant="emerald" />
        <div className="relative z-10 max-w-xl mx-auto px-6 text-center">
          <AnimateIn direction="up" delay={0} once>
            <h2 className="text-2xl font-bold text-white mb-3">
              Stop tracking manually
            </h2>
            <p className="text-zinc-400 mb-8">
              See what AI says about you in 10 seconds. No signup required.
            </p>
            <form onSubmit={handleSubmit} className="mb-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="yourdomain.com"
                  className="flex-1 px-6 py-4 bg-zinc-900 border-2 border-white/[0.1] rounded-xl text-white text-lg placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !domain.trim()}
                  className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-700 disabled:cursor-not-allowed text-black font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  ) : (
                    <>
                      Check now
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </form>
            <Link href="/pricing" className="text-sm text-zinc-400 hover:text-emerald-400 transition-colors">
              or view pricing →
            </Link>
          </AnimateIn>
        </div>
      </section>
    </div>
  );
}
