/**
 * /openclaw — Landing page for the CabbageSEO OpenClaw skill
 *
 * Targeted at OpenClaw users discovering us through the OpenClaw skill registry.
 * Shows how to install the skill, what it does, and upsells to paid plans.
 */

import { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Terminal,
  Search,
  BarChart3,
  Clock,
  Zap,
  CheckCircle2,
  Globe,
  Bot,
  FileText,
  Target,
  ShieldCheck,
  Check,
  AlertTriangle,
} from "lucide-react";
import { GradientOrbs } from "@/components/backgrounds/gradient-orbs";

export const metadata: Metadata = {
  title: "CabbageSEO for OpenClaw — Free AI Visibility Scanner Skill",
  description:
    "Check if ChatGPT, Perplexity & Google AI recommend any brand, right from OpenClaw. Free OpenClaw skill, no API key needed.",
  openGraph: {
    title: "CabbageSEO for OpenClaw",
    description:
      "AI visibility scanning skill for OpenClaw. Check any domain's AI visibility score without leaving your terminal.",
  },
};

export default function OpenClawPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Hero */}
      <section className="pt-20 pb-16 relative overflow-hidden">
        <GradientOrbs variant="emerald" />
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm font-medium mb-6">
            <Bot className="w-4 h-4" />
            Free OpenClaw Skill
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
            Does AI recommend
            <br />
            <span className="text-emerald-400">your brand?</span>
          </h1>

          <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-4">
            Scan any domain across ChatGPT, Perplexity &amp; Google AI — right
            from OpenClaw. See your score. Find what&apos;s missing. Fix it.
          </p>

          <p className="text-sm text-amber-400/80 font-medium mb-4 max-w-lg mx-auto">
            Most brands score under 30/100. AI is recommending your competitors instead.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full text-red-400 text-xs font-medium mb-8">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
            </span>
            AI is replacing Google for buying decisions. Brands that aren&apos;t optimizing now will be invisible by Q2.
          </div>

          {/* Install command */}
          <div className="max-w-xl mx-auto mb-8">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2 bg-zinc-800/50 border-b border-zinc-800">
                <Terminal className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-xs text-zinc-500 font-mono">
                  Install via OpenClaw
                </span>
              </div>
              <div className="px-4 py-3 font-mono text-sm">
                <span className="text-zinc-500">$</span>{" "}
                <span className="text-emerald-400">
                  openclaw skills install cabbageseo-ai-visibility
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/?ref=openclaw"
              className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-colors shadow-lg shadow-emerald-500/20"
            >
              <Search className="w-5 h-5" />
              Scan your domain now
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/leaderboard"
              className="inline-flex items-center gap-2 px-8 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors"
            >
              <BarChart3 className="w-5 h-5" />
              View leaderboard
            </Link>
          </div>
        </div>
      </section>

      {/* Demo conversation */}
      <section className="pb-16">
        <div className="max-w-3xl mx-auto px-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wide mb-4">
              Example conversation
            </h2>

            {/* User message */}
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-blue-400">You</span>
              </div>
              <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3">
                <p className="text-zinc-300 text-sm">
                  check AI visibility for stripe.com
                </p>
              </div>
            </div>

            {/* Bot response */}
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 flex-1">
                <p className="text-white text-sm font-semibold mb-2">
                  AI Visibility Report: stripe.com
                </p>
                <p className="text-emerald-400 text-2xl font-bold mb-2">
                  Score: 78/100
                </p>
                <div className="space-y-1 text-sm mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400">ChatGPT</span>
                    <span className="text-zinc-400">&mdash;</span>
                    <span className="text-zinc-300">Cited</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-400">Perplexity</span>
                    <span className="text-zinc-400">&mdash;</span>
                    <span className="text-zinc-300">Cited</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-purple-400">Google AI</span>
                    <span className="text-zinc-400">&mdash;</span>
                    <span className="text-zinc-300">Mentioned</span>
                  </div>
                </div>
                <p className="text-zinc-500 text-xs">
                  Full report: cabbageseo.com/r/stripe.com
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Free vs Paid — conversion section */}
      <section className="pb-16">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-white text-center mb-3">
            The free skill scans. The platform fixes.
          </h2>
          <p className="text-zinc-500 text-center mb-10 max-w-2xl mx-auto">
            Scanning shows you the problem. CabbageSEO solves it.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Free column */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Bot className="w-5 h-5 text-blue-400" />
                <h3 className="text-white font-bold text-lg">Free OpenClaw Skill</h3>
              </div>
              <p className="text-zinc-400 text-sm mb-5">What you get for free:</p>
              <ul className="space-y-3">
                {[
                  "Scan any domain's AI visibility",
                  "See score across ChatGPT, Perplexity & Google AI",
                  "Compare two domains side by side",
                  "Get a shareable report link",
                  "5 scans per hour, no API key",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-zinc-300">
                    <Check className="w-4 h-4 text-blue-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Paid column */}
            <div className="bg-emerald-500/[0.06] border-2 border-emerald-500/30 rounded-2xl p-6 relative">
              <span className="absolute -top-3 left-6 px-3 py-1 bg-emerald-500 text-black text-xs font-bold rounded-full">
                What you&apos;re missing
              </span>
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-emerald-400" />
                <h3 className="text-white font-bold text-lg">CabbageSEO Platform</h3>
              </div>
              <p className="text-zinc-400 text-sm mb-5">Everything above, plus:</p>
              <ul className="space-y-3">
                {[
                  { text: "Daily automated scans — never miss a visibility drop", icon: Clock },
                  { text: "AI-generated fix pages — content built to earn citations", icon: FileText },
                  { text: "Gap detection — find which buyer questions exclude you", icon: Target },
                  { text: "Trust source tracking — G2, Capterra, Trustpilot signals", icon: ShieldCheck },
                  { text: "Weekly action plans — exactly what to do each week", icon: Zap },
                  { text: "Email alerts when your visibility drops", icon: AlertTriangle },
                ].map(({ text, icon: Icon }) => (
                  <li key={text} className="flex items-center gap-2.5 text-sm text-zinc-200">
                    <Icon className="w-4 h-4 text-emerald-400 shrink-0" />
                    {text}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="mt-6 flex items-center justify-center gap-2 w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-colors"
              >
                Start fixing — $39/mo
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="pb-16">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-white text-center mb-10">
            What the skill does
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Search,
                title: "Scan any domain",
                desc: '"check AI visibility for example.com" — get a score in seconds.',
              },
              {
                icon: Globe,
                title: "3-platform coverage",
                desc: "Checks ChatGPT, Perplexity AI, and Google AI for each domain scanned.",
              },
              {
                icon: BarChart3,
                title: "Compare competitors",
                desc: '"Compare stripe.com vs square.com" — see who AI recommends more.',
              },
              {
                icon: Clock,
                title: "Schedule weekly scans",
                desc: "Set up a cron job for automatic weekly monitoring with alerts.",
              },
              {
                icon: Zap,
                title: "No API key needed",
                desc: "Just install and go. No configuration, no setup, no accounts needed.",
              },
              {
                icon: CheckCircle2,
                title: "Shareable reports",
                desc: "Every scan creates a public report page at cabbageseo.com/r/domain.com.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-5"
              >
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-white font-semibold mb-1">{title}</h3>
                <p className="text-sm text-zinc-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Installation steps */}
      <section className="pb-16">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-white text-center mb-10">
            Install in 30 seconds
          </h2>
          <div className="space-y-4">
            {[
              {
                step: 1,
                title: "Install the skill",
                code: "openclaw skills install cabbageseo-ai-visibility",
              },
              {
                step: 2,
                title: "Start scanning",
                code: 'You: "check AI visibility for yourdomain.com"',
              },
              {
                step: 3,
                title: "Set up monitoring (optional)",
                code: 'openclaw cron add --name "AI check" --cron "0 9 * * 1" --session isolated --message "scan yourdomain.com with cabbageseo"',
              },
            ].map(({ step, title, code }) => (
              <div
                key={step}
                className="flex gap-4 bg-zinc-900 border border-zinc-800 rounded-xl p-5"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-emerald-400">
                    {step}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium mb-2">{title}</p>
                  <code className="block px-3 py-2 bg-zinc-800 rounded-lg text-sm text-zinc-300 overflow-x-auto whitespace-nowrap">
                    {code}
                  </code>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Upgrade CTA */}
      <section className="relative overflow-hidden py-16 bg-emerald-950/30 border-t border-emerald-900/30">
        <GradientOrbs variant="emerald" />
        <div className="relative z-10 max-w-2xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full text-red-400 text-xs font-medium mb-6">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
            </span>
            AI answers change every week — your competitors are already optimizing
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">
            Scanning tells you the problem. CabbageSEO fixes it.
          </h2>
          <p className="text-zinc-400 mb-3 max-w-lg mx-auto">
            The free skill shows your score. The platform gives you daily monitoring,
            AI-generated fix pages, gap analysis, and action plans to actually get cited.
          </p>

          {/* Value props */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto mb-6 text-left">
            {[
              "Daily scans — catch drops instantly",
              "Fix pages — content built to get cited",
              "Gap analysis — know exactly what to fix",
              "Action plans — step-by-step playbook",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm text-zinc-300">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                {item}
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-colors shadow-lg shadow-emerald-500/20"
            >
              Start fixing my AI visibility
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-8 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors"
            >
              See all plans
            </Link>
          </div>
          <p className="text-xs text-zinc-600 mt-3">
            From $39/mo &bull; Cancel anytime &bull; 7-day money-back guarantee
          </p>
        </div>
      </section>
    </div>
  );
}
