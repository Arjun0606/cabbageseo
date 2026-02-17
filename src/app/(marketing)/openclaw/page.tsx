/**
 * /openclaw — Landing page for the CabbageSEO OpenClaw skill
 *
 * Conversion-optimized page for OpenClaw users discovering us through the skill registry.
 * Sections: Hero, Terminal Demo, Free vs Pro, Compare Showcase, API/Developer,
 * Badge, Social Proof, Pricing, Install CTA
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
  Globe,
  Bot,
  FileText,
  Target,
  ShieldCheck,
  Check,
  Lock,
  Code2,
  Award,
  Key,
  Webhook,
  History,
  AlertTriangle,
  Users,
} from "lucide-react";
import { GradientOrbs } from "@/components/backgrounds/gradient-orbs";
import { OpenClawTerminalDemo } from "@/components/marketing/openclaw-terminal-demo";

export const metadata: Metadata = {
  title: "CabbageSEO for OpenClaw — AI Visibility Scanner Skill",
  description:
    "The #1 AI Visibility skill on OpenClaw. Scan, compare, and monitor your brand across ChatGPT, Perplexity & Google AI — free from your terminal.",
  openGraph: {
    title: "CabbageSEO for OpenClaw — The #1 AI Visibility Skill",
    description:
      "Scan any domain. Compare competitors. Monitor drops. All from OpenClaw. 100K+ scans and counting.",
  },
};

const FREE_COMMANDS = [
  { command: "scan domain.com", desc: "Full AI visibility scan across 3 platforms", icon: Search },
  { command: "compare A vs B", desc: "Head-to-head AI visibility battle", icon: Target },
  { command: "trending", desc: "See the AI visibility leaderboard", icon: BarChart3 },
  { command: "badge domain.com", desc: "Get an embeddable score badge", icon: Award },
  { command: "monitor domain.com", desc: "Weekly email alerts on score changes", icon: AlertTriangle },
];

const PRO_COMMANDS = [
  { command: "scan --deep domain.com", desc: "Deep scan with fix recommendations", icon: Search, scope: "scan" },
  { command: "gaps domain.com", desc: "Find which AI questions exclude you", icon: Target, scope: "gaps" },
  { command: "history domain.com", desc: "Score history over time (up to 365 days)", icon: History, scope: "history" },
];

export default function OpenClawPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      {/* ─────────── Hero ─────────── */}
      <section className="pt-20 pb-16 relative overflow-hidden">
        <GradientOrbs variant="emerald" />
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm font-medium mb-6">
            <Bot className="w-4 h-4" />
            The #1 AI Visibility Skill on OpenClaw
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
            Is AI recommending
            <br />
            <span className="text-emerald-400">your competitors?</span>
          </h1>

          <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-4">
            Scan any domain. Compare competitors. Monitor drops.
            All from OpenClaw — no browser needed.
          </p>

          <p className="text-sm text-amber-400/80 font-medium mb-8 max-w-lg mx-auto">
            Most brands score under 30/100. AI is answering your customers&apos; questions
            and recommending someone else.
          </p>

          {/* Install command */}
          <div className="max-w-xl mx-auto mb-8">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2 bg-zinc-800/50 border-b border-zinc-800">
                <Terminal className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-xs text-zinc-500 font-mono">Install in 10 seconds</span>
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
              Try a free scan now
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

      {/* ─────────── Terminal Demo ─────────── */}
      <section className="pb-20">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wide text-center mb-6">
            See it in action
          </h2>
          <OpenClawTerminalDemo />
        </div>
      </section>

      {/* ─────────── Free vs Pro Commands ─────────── */}
      <section className="pb-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-3">
            Free commands that hook you. Pro commands that fix you.
          </h2>
          <p className="text-zinc-500 text-center mb-10 max-w-2xl mx-auto">
            The free skill shows you the problem. Pro commands + the platform solve it.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Free column */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-1">
                <Bot className="w-5 h-5 text-blue-400" />
                <h3 className="text-white font-bold text-lg">Free Commands</h3>
              </div>
              <p className="text-zinc-500 text-sm mb-5">No API key needed — just install and go</p>
              <div className="space-y-3">
                {FREE_COMMANDS.map(({ command, desc, icon: Icon }) => (
                  <div key={command} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <code className="text-emerald-400 text-sm font-mono">{command}</code>
                      <p className="text-zinc-400 text-xs mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pro column */}
            <div className="bg-emerald-500/[0.06] border-2 border-emerald-500/30 rounded-2xl p-6 relative">
              <span className="absolute -top-3 left-6 px-3 py-1 bg-emerald-500 text-black text-xs font-bold rounded-full">
                Requires API Key
              </span>
              <div className="flex items-center gap-2 mb-1">
                <Key className="w-5 h-5 text-emerald-400" />
                <h3 className="text-white font-bold text-lg">Pro Commands</h3>
              </div>
              <p className="text-zinc-500 text-sm mb-5">Set CBS_API_KEY to unlock — Command plan ($149/mo)</p>
              <div className="space-y-3">
                {PRO_COMMANDS.map(({ command, desc, icon: Icon }) => (
                  <div key={command} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <code className="text-emerald-400 text-sm font-mono">{command}</code>
                      <p className="text-zinc-400 text-xs mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 pt-4 border-t border-emerald-500/20">
                <p className="text-zinc-400 text-xs mb-3">Pro also unlocks in the dashboard:</p>
                <div className="space-y-1.5">
                  {[
                    "200–500 API calls/hour",
                    "Webhooks on score changes",
                    "Bulk scanning endpoints",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-xs text-zinc-300">
                      <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────── Compare Showcase ─────────── */}
      <section className="pb-20">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-3">
            &ldquo;compare stripe.com vs square.com&rdquo;
          </h2>
          <p className="text-zinc-500 text-center mb-10 max-w-xl mx-auto">
            The compare command is the moment you realize you need to take action.
            See exactly who AI prefers — and by how much.
          </p>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
            <div className="grid grid-cols-[1fr_auto_1fr] gap-6 items-center mb-6">
              <div className="text-center">
                <div className="text-zinc-400 text-sm mb-2">stripe.com</div>
                <div className="text-5xl font-bold text-emerald-400">78</div>
                <div className="text-emerald-400/60 text-xs mt-1">AI Visibility Score</div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="text-zinc-600 text-2xl font-mono">vs</div>
                <div className="text-red-400 text-xs font-semibold">-47</div>
              </div>
              <div className="text-center">
                <div className="text-zinc-400 text-sm mb-2">square.com</div>
                <div className="text-5xl font-bold text-red-400">31</div>
                <div className="text-red-400/60 text-xs mt-1">AI Visibility Score</div>
              </div>
            </div>

            {/* Platform breakdown */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { platform: "ChatGPT", winner: "stripe.com", color: "text-emerald-400" },
                { platform: "Perplexity", winner: "stripe.com", color: "text-emerald-400" },
                { platform: "Google AI", winner: "stripe.com", color: "text-emerald-400" },
              ].map(({ platform, winner, color }) => (
                <div key={platform} className="text-center bg-zinc-800/50 rounded-lg py-2.5 px-2">
                  <div className="text-zinc-500 text-xs">{platform}</div>
                  <div className={`${color} text-sm font-semibold mt-0.5`}>{winner}</div>
                </div>
              ))}
            </div>

            <div className="text-center">
              <p className="text-amber-400 font-semibold text-sm mb-4">
                AI strongly prefers stripe.com — they&apos;re cited 3x more across platforms
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-colors text-sm"
              >
                Close the gap — get your action plan
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────── API for Developers ─────────── */}
      <section className="pb-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-medium mb-4">
              <Code2 className="w-3.5 h-3.5" />
              Command Plan — $149/mo
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Full REST API for developers
            </h2>
            <p className="text-zinc-500 max-w-xl mx-auto">
              Integrate AI visibility into your CI/CD pipeline, monitoring dashboards,
              or internal tools. Generate an API key in your dashboard.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* cURL example */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2 bg-zinc-800/50 border-b border-zinc-800">
                <Terminal className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-xs text-zinc-500 font-mono">Quick Score</span>
              </div>
              <pre className="px-4 py-3 text-xs text-zinc-300 overflow-x-auto">
                <code>{`curl -H "Authorization: Bearer $CBS_API_KEY" \\
  "https://cabbageseo.com/api/v1/score?domain=stripe.com"

{
  "domain": "stripe.com",
  "score": 78,
  "isInvisible": false,
  "platformScores": {
    "perplexity": 85,
    "gemini": 72,
    "chatgpt": 78
  }
}`}</code>
              </pre>
            </div>

            {/* API features */}
            <div className="space-y-3">
              {[
                { icon: Search, title: "POST /api/v1/scan", desc: "Full scan with recommendations" },
                { icon: Target, title: "POST /api/v1/compare", desc: "Side-by-side competitor analysis" },
                { icon: BarChart3, title: "GET /api/v1/score", desc: "Latest score (no new scan)" },
                { icon: History, title: "GET /api/v1/history", desc: "Score history, up to 365 days" },
                { icon: Webhook, title: "Webhooks", desc: "POST to your URL on score_change" },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-3 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3">
                  <Icon className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                  <div>
                    <code className="text-zinc-200 text-sm font-mono">{title}</code>
                    <p className="text-zinc-500 text-xs mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rate limits */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              { plan: "Scout", limit: "50/hr", price: "$49/mo" },
              { plan: "Command", limit: "200/hr", price: "$149/mo" },
              { plan: "Dominate", limit: "500/hr", price: "$349/mo" },
            ].map(({ plan, limit, price }) => (
              <div key={plan} className="text-center bg-zinc-900 border border-zinc-800 rounded-lg py-3 px-2">
                <div className="text-zinc-400 text-xs">{plan}</div>
                <div className="text-white font-bold text-lg">{limit}</div>
                <div className="text-zinc-600 text-xs">{price}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── Badge Showcase ─────────── */}
      <section className="pb-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            Show your AI visibility score everywhere
          </h2>
          <p className="text-zinc-500 mb-8 max-w-lg mx-auto">
            Embed a live badge in your README, docs, or website.
            Updates automatically with every scan.
          </p>

          {/* Badge preview */}
          <div className="inline-flex items-center bg-zinc-800 rounded-md overflow-hidden border border-zinc-700 mb-6">
            <div className="px-3 py-1.5 bg-zinc-700 text-zinc-300 text-sm font-medium">AI Visibility</div>
            <div className="px-3 py-1.5 bg-emerald-600 text-white text-sm font-bold">78/100</div>
          </div>

          {/* Embed codes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-left">
              <div className="text-xs text-zinc-500 mb-1">Markdown</div>
              <code className="text-[11px] text-zinc-400 font-mono break-all">
                ![AI Visibility](https://cabbageseo.com/api/badge/score?domain=yourdomain.com)
              </code>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-left">
              <div className="text-xs text-zinc-500 mb-1">HTML</div>
              <code className="text-[11px] text-zinc-400 font-mono break-all">
                {`<img src="https://cabbageseo.com/api/badge/score?domain=yourdomain.com" alt="AI Visibility Score" />`}
              </code>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────── Social Proof ─────────── */}
      <section className="pb-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { stat: "100K+", label: "Domains scanned", icon: Globe },
              { stat: "3", label: "AI platforms checked", icon: Bot },
              { stat: "5 sec", label: "Average scan time", icon: Zap },
              { stat: "Free", label: "No API key needed", icon: Users },
            ].map(({ stat, label, icon: Icon }) => (
              <div key={label} className="text-center bg-zinc-900 border border-zinc-800 rounded-xl py-5 px-3">
                <Icon className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{stat}</div>
                <div className="text-zinc-500 text-xs mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── Pricing Comparison ─────────── */}
      <section className="pb-20">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-3">
            Free gets you hooked. Paid makes you dangerous.
          </h2>
          <p className="text-zinc-500 text-center mb-10 max-w-xl mx-auto">
            The free skill shows your score. CabbageSEO shows you exactly how to fix it.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Free */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-white font-bold text-lg mb-1">Free Skill</h3>
              <div className="text-3xl font-bold text-white mb-4">$0</div>
              <ul className="space-y-2">
                {[
                  "5 scans/hour",
                  "Scan any domain",
                  "Compare 2 domains",
                  "Leaderboard access",
                  "Score badge",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-zinc-300">
                    <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Scout */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-white font-bold text-lg mb-1">Scout</h3>
              <div className="text-3xl font-bold text-white mb-1">$49<span className="text-base text-zinc-500 font-normal">/mo</span></div>
              <div className="text-emerald-400 text-xs mb-4">$39/mo billed annually</div>
              <ul className="space-y-2">
                {[
                  "Everything free, plus:",
                  "Daily automated scans",
                  "Gap analysis & fix pages",
                  "Weekly action plans",
                  "Email alerts on drops",
                  "50 API calls/hour",
                ].map((item, i) => (
                  <li key={item} className={`flex items-center gap-2 text-sm ${i === 0 ? "text-zinc-500" : "text-zinc-300"}`}>
                    {i > 0 && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="mt-5 flex items-center justify-center gap-2 w-full py-3 bg-zinc-700 hover:bg-zinc-600 text-white font-semibold rounded-xl transition-colors text-sm"
              >
                Start free trial
              </Link>
            </div>

            {/* Command */}
            <div className="bg-emerald-500/[0.06] border-2 border-emerald-500/30 rounded-2xl p-6 relative">
              <span className="absolute -top-3 left-6 px-3 py-1 bg-emerald-500 text-black text-xs font-bold rounded-full">
                Best for developers
              </span>
              <h3 className="text-white font-bold text-lg mb-1">Command</h3>
              <div className="text-3xl font-bold text-white mb-1">$149<span className="text-base text-zinc-500 font-normal">/mo</span></div>
              <div className="text-emerald-400 text-xs mb-4">$119/mo billed annually</div>
              <ul className="space-y-2">
                {[
                  "Everything Scout, plus:",
                  "API keys (200/hr limit)",
                  "Pro OpenClaw commands",
                  "Webhooks on score changes",
                  "5 sites, 10 competitors",
                  "Priority support",
                ].map((item, i) => (
                  <li key={item} className={`flex items-center gap-2 text-sm ${i === 0 ? "text-zinc-500" : "text-zinc-300"}`}>
                    {i > 0 && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="mt-5 flex items-center justify-center gap-2 w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-colors text-sm"
              >
                Start free trial
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────── Install CTA ─────────── */}
      <section className="relative overflow-hidden py-20 bg-emerald-950/30 border-t border-emerald-900/30">
        <GradientOrbs variant="emerald" />
        <div className="relative z-10 max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Install in 10 seconds.
            <br />
            <span className="text-emerald-400">See your score in 30.</span>
          </h2>

          <div className="max-w-xl mx-auto mb-8">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
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
              Scan your domain now
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-8 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors"
            >
              Start free trial
            </Link>
          </div>
          <p className="text-xs text-zinc-600 mt-4">
            No credit card for free skill &bull; Plans from $39/mo &bull; Cancel anytime
          </p>
        </div>
      </section>
    </div>
  );
}
