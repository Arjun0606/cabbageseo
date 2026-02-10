"use client";

import Link from "next/link";
import {
  ArrowRight,
  Search,
  FileText,
  Target,
  TrendingUp,
  Globe,
  Users,
  Check,
  MessageSquare,
} from "lucide-react";
import { AnimateIn } from "@/components/motion/animate-in";
import { StaggerGroup, StaggerItem } from "@/components/motion/stagger-group";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientOrbs } from "@/components/backgrounds/gradient-orbs";

export default function ForAgenciesPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Hero */}
      <section className="relative pt-20 pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-950/20 via-zinc-950 to-zinc-950" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-blue-500/5 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <AnimateIn direction="up">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/15 border border-blue-500/30 rounded-full text-blue-300 text-sm mb-8">
              <Globe className="w-4 h-4" />
              <span className="font-medium">Built for marketing agencies</span>
            </div>
          </AnimateIn>

          <AnimateIn direction="up" delay={0.1}>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              AI visibility intelligence
              <br />
              <span className="text-blue-400">for your clients</span>
            </h1>
          </AnimateIn>

          <AnimateIn direction="up" delay={0.2}>
            <p className="text-xl text-zinc-300 mb-12 max-w-2xl mx-auto">
              Manage GEO (Generative Engine Optimization) across all your client brands. Multi-site
              AI citation tracking, weekly digests, and competitive intelligence at scale.
            </p>
          </AnimateIn>

          <AnimateIn direction="up" delay={0.3}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-colors"
              >
                Start Agency Trial
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 px-8 py-4 border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 rounded-xl transition-colors"
              >
                View Pricing
              </Link>
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* Agency Pain Points */}
      <section className="py-24 bg-gradient-to-b from-red-950/15 to-zinc-950 border-t border-red-900/20">
        <div className="max-w-6xl mx-auto px-6">
          <AnimateIn direction="up">
            <h2 className="text-3xl font-bold text-white text-center mb-4">
              Your clients are asking about AI visibility
            </h2>
            <p className="text-zinc-400 text-center max-w-2xl mx-auto mb-12">
              AI recommendations are the new SEO. Your clients want to know why
              ChatGPT ignores them — and they expect you to fix it.
            </p>
          </AnimateIn>

          <StaggerGroup className="grid md:grid-cols-3 gap-6">
            <StaggerItem>
              <GlassCard glow="red" className="rounded-2xl p-8 h-full">
                <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center mb-6">
                  <MessageSquare className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  &quot;Why doesn&apos;t AI recommend us?&quot;
                </h3>
                <p className="text-zinc-400">
                  Clients see competitors getting AI citations and want answers.
                  Without data, you&apos;re guessing. CabbageSEO gives you the
                  intelligence to answer with confidence.
                </p>
              </GlassCard>
            </StaggerItem>

            <StaggerItem>
              <GlassCard glow="red" className="rounded-2xl p-8 h-full">
                <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center mb-6">
                  <TrendingUp className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  Proving ROI is hard
                </h3>
                <p className="text-zinc-400">
                  AI visibility is a new metric. Without tracking, there&apos;s no
                  baseline and no proof of improvement. CabbageSEO gives you
                  momentum scores and monthly reports.
                </p>
              </GlassCard>
            </StaggerItem>

            <StaggerItem>
              <GlassCard glow="red" className="rounded-2xl p-8 h-full">
                <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center mb-6">
                  <Users className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  Managing multiple brands
                </h3>
                <p className="text-zinc-400">
                  Each client has different queries, competitors, and priorities.
                  You need multi-site management that scales — not manual
                  spreadsheets.
                </p>
              </GlassCard>
            </StaggerItem>
          </StaggerGroup>
        </div>
      </section>

      {/* Agency Workflow */}
      <section className="py-24 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-6">
          <AnimateIn direction="up">
            <h2 className="text-3xl font-bold text-white text-center mb-4">
              Your AI visibility workflow
            </h2>
            <p className="text-zinc-400 text-center max-w-2xl mx-auto mb-16">
              From audit to results in 4 steps.
            </p>
          </AnimateIn>

          <StaggerGroup className="grid md:grid-cols-4 gap-6">
            {[
              {
                step: "1",
                icon: <Search className="w-6 h-6 text-blue-400" />,
                title: "Audit",
                description:
                  "Scan each client across ChatGPT, Perplexity, and Google AI. Baseline their visibility.",
              },
              {
                step: "2",
                icon: <FileText className="w-6 h-6 text-blue-400" />,
                title: "Report",
                description:
                  "Share weekly digest reports showing gaps, competitors, and opportunities.",
              },
              {
                step: "3",
                icon: <Target className="w-6 h-6 text-blue-400" />,
                title: "Strategize",
                description:
                  "Use gap analysis and content recommendations to build an action plan.",
              },
              {
                step: "4",
                icon: <TrendingUp className="w-6 h-6 text-blue-400" />,
                title: "Track",
                description:
                  "Monitor momentum scores and demonstrate measurable improvement.",
              },
            ].map((item) => (
              <StaggerItem key={item.step}>
                <div className="text-center">
                  <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    {item.icon}
                  </div>
                  <div className="text-xs font-bold text-blue-400 mb-2">
                    STEP {item.step}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-zinc-400">{item.description}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      {/* Agency-Specific Features */}
      <section className="py-24 bg-zinc-900/30 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-6">
          <AnimateIn direction="up">
            <h2 className="text-3xl font-bold text-white text-center mb-4">
              Built for agency scale
            </h2>
            <p className="text-zinc-400 text-center max-w-2xl mx-auto mb-12">
              Features designed for teams managing multiple client brands.
            </p>
          </AnimateIn>

          <StaggerGroup className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StaggerItem>
              <GlassCard glow="blue" className="rounded-2xl p-8 h-full">
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6">
                  <Globe className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  Multi-Site Management
                </h3>
                <p className="text-zinc-400">
                  Manage up to 25 client sites from one dashboard. Each with its own
                  queries, competitors, and action plans. Switch between clients
                  instantly.
                </p>
              </GlassCard>
            </StaggerItem>

            <StaggerItem>
              <GlassCard glow="blue" className="rounded-2xl p-8 h-full">
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6">
                  <MessageSquare className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  Slack Integration
                </h3>
                <p className="text-zinc-400">
                  Get check results, score drop alerts, and weekly summaries
                  delivered to your team&apos;s Slack channel. No dashboard logins
                  needed.
                </p>
              </GlassCard>
            </StaggerItem>

            <StaggerItem>
              <GlassCard glow="blue" className="rounded-2xl p-8 h-full">
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6">
                  <TrendingUp className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  Trend Charts &amp; Proof
                </h3>
                <p className="text-zinc-400">
                  Historical visibility charts per client. Show ROI with
                  before/after data. Score drop alerts when clients need attention.
                </p>
              </GlassCard>
            </StaggerItem>

            <StaggerItem>
              <GlassCard glow="blue" className="rounded-2xl p-8 h-full">
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6">
                  <Target className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  Get Listed Playbook
                </h3>
                <p className="text-zinc-400">
                  Step-by-step instructions to get each client listed on every source
                  AI trusts. G2, Capterra, Product Hunt, Reddit, and more.
                </p>
              </GlassCard>
            </StaggerItem>

            <StaggerItem>
              <GlassCard glow="blue" className="rounded-2xl p-8 h-full">
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6">
                  <FileText className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  Automated Reports
                </h3>
                <p className="text-zinc-400">
                  Weekly email + Slack reports per client with momentum scores,
                  competitor moves, and top actions. Share progress without
                  building custom reports.
                </p>
              </GlassCard>
            </StaggerItem>

            <StaggerItem>
              <GlassCard glow="blue" className="rounded-2xl p-8 h-full">
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  Competitor Tracking at Scale
                </h3>
                <p className="text-zinc-400">
                  Track up to 25 competitors per client. See cross-client
                  competitive trends and identify opportunities across your
                  portfolio.
                </p>
              </GlassCard>
            </StaggerItem>

            <StaggerItem>
              <GlassCard glow="blue" className="rounded-2xl p-8 h-full">
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6">
                  <Search className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  Bulk Scanning API
                </h3>
                <p className="text-zinc-400">
                  Scan up to 50 domains per API call. Onboard new clients in
                  seconds with programmatic access. Rate-limited to 200
                  scans/hour.
                </p>
              </GlassCard>
            </StaggerItem>

            <StaggerItem>
              <GlassCard glow="blue" className="rounded-2xl p-8 h-full">
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6">
                  <FileText className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  AI Content Generation
                </h3>
                <p className="text-zinc-400">
                  Generate comparison pages and authority content for each client.
                  AI-written, data-driven content ready to publish.
                </p>
              </GlassCard>
            </StaggerItem>
          </StaggerGroup>
        </div>
      </section>

      {/* Pricing for Agencies */}
      <section className="py-24 border-t border-white/[0.06]">
        <div className="max-w-4xl mx-auto px-6">
          <AnimateIn direction="up">
            <h2 className="text-3xl font-bold text-white text-center mb-4">
              Plans for agencies
            </h2>
            <p className="text-zinc-400 text-center max-w-2xl mx-auto mb-12">
              Choose the plan that fits your client load.
            </p>
          </AnimateIn>

          <StaggerGroup className="grid md:grid-cols-2 gap-6">
            {/* Command */}
            <StaggerItem>
              <GlassCard className="rounded-2xl p-8 h-full">
                <h3 className="text-lg font-semibold text-white mb-1">Command</h3>
                <p className="text-3xl font-bold text-white mb-1">
                  $149<span className="text-lg text-zinc-500">/mo</span>
                </p>
                <p className="text-sm text-zinc-500 mb-4">$119/mo billed annually</p>
                <p className="text-emerald-400 text-sm font-medium mb-6">
                  Best for small agencies (up to 5 clients)
                </p>
                <ul className="space-y-3 mb-8">
                  {[
                    "5 sites (1 per client)",
                    "10 competitors per site",
                    "Auto-checks every 3 days",
                    "Score drop alerts (email + Slack)",
                    "Full gap analysis + trend charts",
                    "Fix pages (15/mo)",
                    "Bulk scanning API",
                    "Slack integration",
                    "CSV export",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm text-zinc-300">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className="block w-full py-3 text-center border border-zinc-700 text-zinc-300 rounded-xl hover:bg-zinc-800 transition-colors"
                >
                  Start with Command
                </Link>
              </GlassCard>
            </StaggerItem>

            {/* Dominate */}
            <StaggerItem>
              <GlassCard className="rounded-2xl p-8 h-full relative !border-emerald-500/40">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-500 text-black text-xs font-bold rounded-full">
                  RECOMMENDED
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">Dominate</h3>
                <p className="text-3xl font-bold text-white mb-1">
                  $349<span className="text-lg text-zinc-500">/mo</span>
                </p>
                <p className="text-sm text-zinc-500 mb-4">$279/mo billed annually</p>
                <p className="text-emerald-400 text-sm font-medium mb-6">
                  Best for growing agencies (up to 25 clients)
                </p>
                <ul className="space-y-3 mb-8">
                  {[
                    "25 sites",
                    "25 competitors per site",
                    "Daily + hourly auto-checks",
                    "Score drop alerts (email + Slack)",
                    "Unlimited analysis + fix pages",
                    "Bulk scanning API",
                    "365-day trend chart history",
                    "Slack integration",
                    "Monthly checkpoint reports",
                    "Priority support",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm text-zinc-300">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className="block w-full py-3 text-center bg-emerald-500 text-black font-semibold rounded-xl hover:bg-emerald-400 transition-colors"
                >
                  Start with Dominate
                </Link>
              </GlassCard>
            </StaggerItem>
          </StaggerGroup>

          <p className="text-sm text-zinc-500 text-center mt-8">
            Annual billing saves 20%. 14-day money-back guarantee.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden py-16 bg-emerald-950/30 border-t border-emerald-900/30">
        <GradientOrbs variant="blue" />
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <AnimateIn direction="up">
            <h2 className="text-2xl font-bold text-white mb-3">
              Add AI visibility to your service offering
            </h2>
            <p className="text-zinc-400 mb-6">
              Start tracking AI recommendations for your clients today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-colors"
              >
                Start Agency Trial
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/feedback"
                className="inline-flex items-center gap-2 px-8 py-4 border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 rounded-xl transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </AnimateIn>
        </div>
      </section>
    </div>
  );
}
