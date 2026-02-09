"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Search,
  TrendingDown,
  EyeOff,
  Target,
  TrendingUp,
  Zap,
  Eye,
  FileText,
  Timer,
  Bell,
  MessageSquare,
  LineChart,
  Moon,
  PenTool,
  Trophy,
  Users,
  BarChart3,
} from "lucide-react";
import { GridAnimation } from "@/components/backgrounds/grid-animation";
import { GradientOrbs } from "@/components/backgrounds/gradient-orbs";
import { AnimateIn } from "@/components/motion/animate-in";
import { TextReveal } from "@/components/motion/text-reveal";
import { Counter } from "@/components/motion/counter";
import { StaggerGroup, StaggerItem } from "@/components/motion/stagger-group";
import { GlassCard } from "@/components/ui/glass-card";
import { TerminalBlock } from "@/components/ui/terminal-block";
import { BentoGrid, BentoItem } from "@/components/ui/bento-grid";

export default function HomePage() {
  const router = useRouter();
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanCount, setScanCount] = useState<number>(500);

  useEffect(() => {
    fetch("/api/stats/scans")
      .then((r) => r.json())
      .then((data) => {
        if (data.count > 0) setScanCount(data.count);
      })
      .catch(() => {});
  }, []);

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
      {/* ========== HERO ========== */}
      <section className="relative pt-20 pb-28 overflow-hidden">
        {/* Interactive dot grid background */}
        <GridAnimation className="opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-zinc-950 pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          {/* Floating platform badges */}
          <div className="flex justify-center gap-3 mb-8">
            {["ChatGPT", "Perplexity", "Google AI"].map((name, i) => (
              <AnimateIn key={name} delay={0.8 + i * 0.15} direction="up">
                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border bg-white/[0.03] backdrop-blur-sm ${
                  i === 0 ? "border-emerald-500/20 text-emerald-400 animate-float" :
                  i === 1 ? "border-blue-500/20 text-blue-400 animate-float-slow" :
                  "border-purple-500/20 text-purple-400 animate-float-fast"
                }`}>
                  {name}
                </span>
              </AnimateIn>
            ))}
          </div>

          <TextReveal
            text="See who AI recommends instead of you"
            className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight"
            stagger={0.05}
          />

          <AnimateIn delay={0.6} direction="up">
            <p className="text-xl text-zinc-400 mb-12 max-w-2xl mx-auto leading-relaxed">
              Buyers ask ChatGPT, Perplexity, and Google AI for recommendations
              — and right now, they&apos;re sending your customers to competitors
              you&apos;ll never see in analytics. CabbageSEO shows you who AI picks
              and helps you become their answer.
            </p>
          </AnimateIn>

          <AnimateIn delay={0.8} direction="up">
            <form onSubmit={handleSubmit} className="max-w-xl mx-auto mb-4">
              <GlassCard padding="sm" hover={false} className="!p-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="yourdomain.com"
                    className="flex-1 px-5 py-3.5 bg-white/[0.04] border border-white/[0.06] rounded-lg text-white text-lg placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 transition-all"
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    disabled={loading || !domain.trim()}
                    className="px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-700 disabled:cursor-not-allowed text-black font-bold rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
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
              </GlassCard>
            </form>
          </AnimateIn>

          <AnimateIn delay={1.0} direction="up">
            <p className="text-sm text-zinc-600">
              Takes 10 seconds &bull; No signup required &bull; Real AI responses
            </p>
          </AnimateIn>
        </div>
      </section>

      {/* ========== PROBLEM ========== */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-red-950/10 to-zinc-950" />

        <div className="relative max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-5 gap-12 items-center">
            {/* Left — Big stat */}
            <div className="lg:col-span-2 text-center lg:text-left">
              <AnimateIn direction="left">
                <div className="mb-6">
                  <Counter
                    value={57}
                    suffix="%"
                    className="text-7xl md:text-8xl font-bold text-red-400"
                  />
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">
                  of B2B buyers now ask AI first
                </h2>
                <p className="text-zinc-500">
                  AI is replacing Google for buying decisions. When someone asks &quot;best CRM for startups&quot;, AI gives one answer. If it&apos;s not you, your competitor just got a free customer.
                </p>
              </AnimateIn>
            </div>

            {/* Right — Problem cards + terminal */}
            <div className="lg:col-span-3 space-y-4">
              <StaggerGroup stagger={0.12}>
                {[
                  {
                    icon: <Search className="w-5 h-5 text-red-400" />,
                    title: "AI answers buying questions",
                    desc: "ChatGPT, Perplexity, and Google AI directly recommend products. They decide who gets mentioned — and who gets ignored.",
                  },
                  {
                    icon: <TrendingDown className="w-5 h-5 text-red-400" />,
                    title: "Competitors already optimize",
                    desc: "Smart founders are already working on AI visibility. The longer you wait, the harder it gets to catch up.",
                  },
                  {
                    icon: <EyeOff className="w-5 h-5 text-red-400" />,
                    title: "You have zero visibility",
                    desc: "Ahrefs, SEMrush, Google Analytics — none of them track AI recommendations. You're flying blind.",
                  },
                ].map((item) => (
                  <StaggerItem key={item.title}>
                    <GlassCard padding="sm" glow="red" className="!p-5">
                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                          {item.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold text-white mb-1">{item.title}</h3>
                          <p className="text-sm text-zinc-500">{item.desc}</p>
                        </div>
                      </div>
                    </GlassCard>
                  </StaggerItem>
                ))}
              </StaggerGroup>

              <AnimateIn delay={0.5}>
                <TerminalBlock
                  title="ai-search"
                  lines={[
                    { text: '"best CRM for startups"', type: "command" },
                    { text: "Analyzing sources...", type: "comment", delay: 600 },
                    { text: "Based on my analysis, I recommend:", type: "output", delay: 200 },
                    { text: "1. HubSpot — free tier, easy onboarding", type: "highlight", delay: 150 },
                    { text: "2. Pipedrive — simple sales pipeline", type: "highlight", delay: 150 },
                    { text: "3. Close — built for outbound teams", type: "highlight", delay: 150 },
                    { text: "Your brand? Not mentioned.", type: "error", delay: 400 },
                  ]}
                  className="mt-4"
                />
              </AnimateIn>
            </div>
          </div>
        </div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 to-zinc-950" />

        <div className="relative max-w-6xl mx-auto px-6">
          <AnimateIn>
            <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
              From invisible to recommended in 30 days
            </h2>
            <p className="text-zinc-500 text-center max-w-2xl mx-auto mb-16">
              A structured sprint — not an endless dashboard.
            </p>
          </AnimateIn>

          {/* Timeline */}
          <div className="relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-[3.5rem] left-0 right-0 h-px">
              <div className="mx-auto max-w-3xl h-full bg-gradient-to-r from-emerald-500/0 via-emerald-500/30 to-emerald-500/0" />
            </div>

            <StaggerGroup stagger={0.15} className="grid md:grid-cols-4 gap-8">
              {[
                {
                  step: "1",
                  icon: <Search className="w-6 h-6 text-emerald-400" />,
                  title: "Scan",
                  description: "See who AI recommends for your queries across 3 platforms.",
                },
                {
                  step: "2",
                  icon: <Target className="w-6 h-6 text-emerald-400" />,
                  title: "Focus",
                  description: "Get one clear, high-impact action. Do it, move on.",
                },
                {
                  step: "3",
                  icon: <TrendingUp className="w-6 h-6 text-emerald-400" />,
                  title: "Track",
                  description: "Watch your momentum score grow week over week.",
                },
                {
                  step: "4",
                  icon: <Zap className="w-6 h-6 text-emerald-400" />,
                  title: "Win",
                  description: "Become AI's recommended choice in your category.",
                },
              ].map((item) => (
                <StaggerItem key={item.step} className="text-center">
                  <div className="relative mb-6">
                    <div className="w-14 h-14 mx-auto bg-white/[0.04] border border-white/[0.08] rounded-2xl flex items-center justify-center">
                      {item.icon}
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-emerald-500 text-black text-xs font-bold flex items-center justify-center">
                      {item.step}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-zinc-500">{item.description}</p>
                </StaggerItem>
              ))}
            </StaggerGroup>
          </div>
        </div>
      </section>

      {/* ========== AUTOMATION (Bento Grid) ========== */}
      <section className="py-24 relative overflow-hidden">
        <GradientOrbs variant="emerald" className="opacity-30" />

        <div className="relative max-w-6xl mx-auto px-6">
          <AnimateIn>
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm mb-6">
                <Moon className="w-4 h-4" />
                <span className="font-medium">Works while you sleep</span>
              </div>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
              Set it up once. It runs forever.
            </h2>
            <p className="text-zinc-500 text-center max-w-2xl mx-auto mb-12">
              Automated daily checks, instant score drop alerts, Slack notifications,
              and historical trend tracking — the system works even when you don&apos;t.
            </p>
          </AnimateIn>

          <BentoGrid cols={3}>
            <BentoItem colSpan={2}>
              <AnimateIn delay={0.1}>
                <GlassCard className="h-full">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <Zap className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Auto-Checks</h3>
                      <p className="text-sm text-zinc-500">
                        Daily automated scans across 3 AI platforms. Weekly for Scout, every 3 days for Command, daily + hourly for Dominate.
                      </p>
                    </div>
                  </div>
                  {/* Mini radar animation */}
                  <div className="mt-6 flex justify-center">
                    <div className="relative w-24 h-24">
                      <div className="absolute inset-0 rounded-full border border-emerald-500/20" />
                      <div className="absolute inset-3 rounded-full border border-emerald-500/15" />
                      <div className="absolute inset-6 rounded-full border border-emerald-500/10" />
                      <div className="absolute inset-0 rounded-full animate-spin" style={{ animationDuration: "3s" }}>
                        <div className="w-1/2 h-px bg-gradient-to-r from-emerald-500/60 to-transparent absolute top-1/2 left-1/2" />
                      </div>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-emerald-500" />
                    </div>
                  </div>
                </GlassCard>
              </AnimateIn>
            </BentoItem>

            <BentoItem>
              <AnimateIn delay={0.2}>
                <GlassCard glow="red" className="h-full">
                  <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-4">
                    <Bell className="w-6 h-6 text-red-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Score Drop Alerts</h3>
                  <p className="text-sm text-zinc-500">
                    Instant email + Slack when your visibility drops 5+ points. Includes the queries you&apos;re now losing.
                  </p>
                  <div className="mt-4 px-3 py-2 rounded-lg bg-red-500/5 border border-red-500/10 animate-pulse-glow">
                    <p className="text-xs text-red-400 font-mono">Alert: Score dropped -8pts</p>
                  </div>
                </GlassCard>
              </AnimateIn>
            </BentoItem>

            <BentoItem>
              <AnimateIn delay={0.3}>
                <GlassCard className="h-full">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
                    <MessageSquare className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Slack Integration</h3>
                  <p className="text-sm text-zinc-500">
                    Check results, score drops, and weekly summaries right in your Slack channel.
                  </p>
                </GlassCard>
              </AnimateIn>
            </BentoItem>

            <BentoItem colSpan={2}>
              <AnimateIn delay={0.4}>
                <GlassCard className="h-full">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <LineChart className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Trend Charts</h3>
                      <p className="text-sm text-zinc-500">
                        Historical line chart of your AI visibility over time. Like Ahrefs rank tracker, but for AI.
                      </p>
                    </div>
                  </div>
                  {/* Mini sparkline */}
                  <div className="h-16 flex items-end gap-1 px-4">
                    {[30, 35, 28, 42, 38, 55, 50, 62, 58, 70, 65, 78, 82, 75, 88].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t bg-gradient-to-t from-emerald-500/40 to-emerald-400/80 transition-all"
                        style={{
                          height: `${h}%`,
                          animationDelay: `${i * 0.05}s`,
                        }}
                      />
                    ))}
                  </div>
                </GlassCard>
              </AnimateIn>
            </BentoItem>
          </BentoGrid>
        </div>
      </section>

      {/* ========== WE DO THE WORK ========== */}
      <section className="py-24 relative overflow-hidden">
        <div className="relative max-w-6xl mx-auto px-6">
          <AnimateIn>
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm mb-6">
                <PenTool className="w-4 h-4" />
                <span className="font-medium">We do the work for you</span>
              </div>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
              Not just reports. Real content, ready to publish.
            </h2>
            <p className="text-zinc-500 text-center max-w-2xl mx-auto mb-12">
              Other tools tell you what to do. CabbageSEO generates the actual comparison pages,
              FAQ content, and authority articles that get you recommended by AI.
            </p>
          </AnimateIn>

          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Terminal preview */}
            <AnimateIn direction="left">
              <TerminalBlock
                title="content-generator"
                lines={[
                  { text: "generate comparison-page --vs hubspot", type: "command" },
                  { text: "Analyzing gap data...", type: "comment", delay: 500 },
                  { text: "Generating 2,400 word comparison page", type: "output", delay: 300 },
                  { text: "Adding FAQ schema (8 questions)...", type: "output", delay: 200 },
                  { text: "Including competitor data tables...", type: "output", delay: 200 },
                  { text: "Page ready: /you-vs-hubspot", type: "success", delay: 400 },
                  { text: "Estimated AI citation lift: +15pts", type: "highlight", delay: 200 },
                ]}
              />
            </AnimateIn>

            {/* Feature cards */}
            <StaggerGroup stagger={0.15}>
              <StaggerItem>
                <GlassCard glow="emerald" className="mb-4">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">AI-Generated Comparison Pages</h3>
                      <p className="text-sm text-zinc-500">
                        &quot;You vs Competitor&quot; pages with FAQ schema, 2000+ words, optimized for AI citation. Just publish.
                      </p>
                      <div className="flex gap-2 mt-3">
                        <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded">Auto-generated</span>
                        <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded">FAQ Schema</span>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </StaggerItem>
              <StaggerItem>
                <GlassCard className="mb-4">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <Timer className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">30-Day Sprint Action Plan</h3>
                      <p className="text-sm text-zinc-500">
                        Structured weekly actions tailored to your gaps. A custom plan based on what AI thinks about you vs competitors.
                      </p>
                      <div className="flex gap-2 mt-3">
                        <span className="px-2 py-1 bg-white/[0.04] text-zinc-400 text-xs rounded">4 weeks</span>
                        <span className="px-2 py-1 bg-white/[0.04] text-zinc-400 text-xs rounded">Personalized</span>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </StaggerItem>
              <StaggerItem>
                <GlassCard>
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <Bell className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">Automated Monitoring + Alerts</h3>
                      <p className="text-sm text-zinc-500">
                        Daily AI checks, instant score drop alerts via email + Slack, weekly progress reports.
                      </p>
                      <div className="flex gap-2 mt-3">
                        <span className="px-2 py-1 bg-white/[0.04] text-zinc-400 text-xs rounded">Email + Slack</span>
                        <span className="px-2 py-1 bg-white/[0.04] text-zinc-400 text-xs rounded">Daily checks</span>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </StaggerItem>
            </StaggerGroup>
          </div>
        </div>
      </section>

      {/* ========== KEY FEATURES (Bento Grid) ========== */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-zinc-900/20 to-zinc-950" />

        <div className="relative max-w-6xl mx-auto px-6">
          <AnimateIn>
            <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
              Everything you need to dominate AI search
            </h2>
            <p className="text-zinc-500 text-center max-w-2xl mx-auto mb-12">
              Monitor, analyze, and act — all from one platform.
            </p>
          </AnimateIn>

          <BentoGrid cols={3}>
            {/* Hero card — AI Citation Tracking */}
            <BentoItem colSpan={2}>
              <AnimateIn delay={0.1}>
                <GlassCard className="h-full">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <Eye className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">AI Citation Tracking</h3>
                      <p className="text-sm text-zinc-500">
                        Track mentions across ChatGPT, Perplexity, and Google AI. See who gets recommended and who doesn&apos;t.
                      </p>
                    </div>
                  </div>
                </GlassCard>
              </AnimateIn>
            </BentoItem>

            <BentoItem>
              <AnimateIn delay={0.15}>
                <GlassCard className="h-full">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-3">
                    <Search className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h3 className="font-semibold text-white mb-1">Gap Analysis</h3>
                  <p className="text-sm text-zinc-500">
                    Per-query breakdown of why AI picks your competitor.
                  </p>
                </GlassCard>
              </AnimateIn>
            </BentoItem>

            <BentoItem>
              <AnimateIn delay={0.2}>
                <GlassCard className="h-full">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-3">
                    <FileText className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h3 className="font-semibold text-white mb-1">Content Generation</h3>
                  <p className="text-sm text-zinc-500">
                    AI-generated comparison pages optimized for citation.
                  </p>
                </GlassCard>
              </AnimateIn>
            </BentoItem>

            {/* Tall card — Momentum Score */}
            <BentoItem rowSpan={2}>
              <AnimateIn delay={0.25}>
                <GlassCard className="h-full flex flex-col items-center justify-center text-center">
                  <div className="relative w-28 h-28 mb-4">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="8" />
                      <circle
                        cx="50" cy="50" r="42"
                        fill="none"
                        stroke="url(#scoreGradient)"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray="264"
                        strokeDashoffset="66"
                        className="score-ring"
                      />
                      <defs>
                        <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#22c55e" />
                          <stop offset="100%" stopColor="#16a34a" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Counter value={75} className="text-3xl font-bold text-white" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-white mb-1">Momentum Score</h3>
                  <p className="text-sm text-zinc-500">
                    One number showing your progress. Week-over-week trends with historical charts.
                  </p>
                </GlassCard>
              </AnimateIn>
            </BentoItem>

            <BentoItem>
              <AnimateIn delay={0.3}>
                <GlassCard className="h-full">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-3">
                    <Target className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h3 className="font-semibold text-white mb-1">Custom Query Tracking</h3>
                  <p className="text-sm text-zinc-500">
                    Monitor your exact buying queries and track them over time.
                  </p>
                </GlassCard>
              </AnimateIn>
            </BentoItem>

            <BentoItem>
              <AnimateIn delay={0.35}>
                <GlassCard className="h-full">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-3">
                    <Users className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h3 className="font-semibold text-white mb-1">Competitor Intelligence</h3>
                  <p className="text-sm text-zinc-500">
                    Track what AI says about every competitor. Get alerts when they change.
                  </p>
                </GlassCard>
              </AnimateIn>
            </BentoItem>

            <BentoItem>
              <AnimateIn delay={0.4}>
                <GlassCard className="h-full">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-3">
                    <BarChart3 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h3 className="font-semibold text-white mb-1">Bulk Scanning API</h3>
                  <p className="text-sm text-zinc-500">
                    Scan up to 50 domains at once. Built for agencies and teams.
                  </p>
                </GlassCard>
              </AnimateIn>
            </BentoItem>
          </BentoGrid>

          <AnimateIn delay={0.5}>
            <div className="text-center mt-8">
              <Link
                href="/features"
                className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors inline-flex items-center gap-1"
              >
                See all features <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* ========== LEADERBOARD CALLOUT ========== */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6">
          <AnimateIn>
            <GlassCard glow="none" className="text-center !p-10 relative overflow-hidden">
              {/* Gold glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-yellow-500/10 rounded-full blur-3xl" />

              <div className="relative">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-yellow-400 text-sm mb-6">
                  <Trophy className="w-4 h-4" />
                  <span className="font-medium">New: AI Visibility Leaderboard</span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">
                  See the top 100 most visible brands in AI search
                </h2>
                <p className="text-zinc-500 mb-6 max-w-lg mx-auto">
                  Which brands does AI recommend the most? Explore the live leaderboard — and find out where you rank.
                </p>

                {/* Mini leaderboard preview */}
                <StaggerGroup stagger={0.1} className="max-w-sm mx-auto mb-6 space-y-2">
                  {[
                    { rank: 1, name: "hubspot.com", score: 94 },
                    { rank: 2, name: "notion.so", score: 89 },
                    { rank: 3, name: "linear.app", score: 85 },
                  ].map((item) => (
                    <StaggerItem key={item.rank}>
                      <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                        <span className={`text-sm font-bold ${
                          item.rank === 1 ? "text-yellow-400" : item.rank === 2 ? "text-zinc-300" : "text-amber-600"
                        }`}>
                          #{item.rank}
                        </span>
                        <span className="text-sm text-white flex-1 text-left">{item.name}</span>
                        <span className="text-sm text-emerald-400 font-mono">{item.score}</span>
                      </div>
                    </StaggerItem>
                  ))}
                </StaggerGroup>

                <Link
                  href="/leaderboard"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.12] text-white font-medium rounded-xl transition-all"
                >
                  View Leaderboard
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </GlassCard>
          </AnimateIn>
        </div>
      </section>

      {/* ========== SOCIAL PROOF ========== */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6">
          <AnimateIn>
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-4">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                </span>
                <span className="text-emerald-400 font-medium">Live</span>
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">
                <Counter value={scanCount} suffix="+" className="text-emerald-400" /> domains scanned
              </h2>
              <p className="text-zinc-500">
                Real AI responses from ChatGPT, Perplexity, and Google AI. No fake data.
              </p>
            </div>
          </AnimateIn>

          <StaggerGroup className="grid grid-cols-3 gap-6 text-center">
            {[
              { value: 3, label: "AI platforms tracked" },
              { value: 30, label: "Average days to improve", suffix: " days" },
              { value: 100, label: "Real AI responses", suffix: "%" },
            ].map((stat) => (
              <StaggerItem key={stat.label}>
                <div>
                  <Counter
                    value={stat.value}
                    suffix={stat.suffix || ""}
                    className="text-2xl font-bold text-white"
                  />
                  <div className="text-sm text-zinc-500 mt-1">{stat.label}</div>
                </div>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      {/* ========== FINAL CTA ========== */}
      <section className="py-20 relative overflow-hidden">
        <GradientOrbs variant="mixed" className="opacity-20" />

        <div className="relative max-w-xl mx-auto px-6 text-center">
          <AnimateIn>
            <h2 className="text-3xl font-bold text-white mb-3">
              Check your AI visibility now
            </h2>
            <p className="text-zinc-500 mb-8">
              See what AI says about you in 10 seconds. No signup required.
            </p>
            <form onSubmit={handleSubmit} className="mb-4">
              <GlassCard padding="sm" hover={false} className="!p-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="yourdomain.com"
                    className="flex-1 px-5 py-3.5 bg-white/[0.04] border border-white/[0.06] rounded-lg text-white text-lg placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 transition-all"
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    disabled={loading || !domain.trim()}
                    className="px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-700 disabled:cursor-not-allowed text-black font-bold rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
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
              </GlassCard>
            </form>
            <Link
              href="/pricing"
              className="text-sm text-zinc-500 hover:text-emerald-400 transition-colors"
            >
              or view pricing →
            </Link>
          </AnimateIn>
        </div>
      </section>
    </div>
  );
}
