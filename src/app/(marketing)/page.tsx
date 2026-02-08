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

export default function HomePage() {
  const router = useRouter();
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanCount, setScanCount] = useState<string>("500+");

  useEffect(() => {
    fetch("/api/stats/scans")
      .then((r) => r.json())
      .then((data) => {
        if (data.count > 0) setScanCount(data.count.toLocaleString());
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
      {/* Hero */}
      <section className="relative pt-20 pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/20 via-zinc-950 to-zinc-950" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            See who AI recommends
            <br />
            <span className="text-emerald-400">instead of you</span>
          </h1>
          <p className="text-xl text-zinc-300 mb-12 max-w-2xl mx-auto">
            Buyers ask ChatGPT, Perplexity, and Google AI for recommendations
            — and right now, they&apos;re sending your customers to competitors
            you&apos;ll never see in analytics. CabbageSEO shows you who AI picks
            and helps you become their answer.
          </p>

          <form onSubmit={handleSubmit} className="max-w-xl mx-auto mb-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="yourdomain.com"
                className="flex-1 px-6 py-4 bg-zinc-900 border-2 border-zinc-700 rounded-xl text-white text-lg placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !domain.trim()}
                className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-700 disabled:cursor-not-allowed text-black font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
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
          <p className="text-sm text-zinc-500">
            Takes 10 seconds &bull; No signup required &bull; Real AI responses
          </p>
        </div>
      </section>

      {/* Problem */}
      <section className="py-24 bg-gradient-to-b from-red-950/15 to-zinc-950 border-t border-red-900/20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-white text-center mb-4">
            AI is replacing Google for buying decisions
          </h2>
          <p className="text-zinc-400 text-center max-w-2xl mx-auto mb-12">
            When someone asks &quot;best CRM for startups&quot; or &quot;top
            analytics tools&quot;, AI gives one answer. If it&apos;s not you,
            your competitor just got a free customer.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-8">
              <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center mb-6">
                <Search className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                AI answers buying questions
              </h3>
              <p className="text-zinc-400">
                ChatGPT, Perplexity, and Google AI directly recommend products.
                They decide who gets mentioned — and who gets ignored.
              </p>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-8">
              <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center mb-6">
                <TrendingDown className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Competitors already optimize
              </h3>
              <p className="text-zinc-400">
                Smart founders are already working on AI visibility. The longer
                you wait, the harder it gets to catch up.
              </p>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-8">
              <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center mb-6">
                <EyeOff className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                You have zero visibility
              </h3>
              <p className="text-zinc-400">
                Ahrefs, SEMrush, Google Analytics — none of them track AI
                recommendations. You&apos;re flying blind.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 border-t border-zinc-800">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-white text-center mb-4">
            From invisible to recommended in 30 days
          </h2>
          <p className="text-zinc-400 text-center max-w-2xl mx-auto mb-16">
            A structured sprint — not an endless dashboard.
          </p>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                step: "1",
                icon: <Search className="w-6 h-6 text-emerald-400" />,
                title: "Scan",
                description:
                  "See who AI recommends for your queries across 3 platforms.",
              },
              {
                step: "2",
                icon: <Target className="w-6 h-6 text-emerald-400" />,
                title: "Focus",
                description:
                  "Get one clear, high-impact action. Do it, move on.",
              },
              {
                step: "3",
                icon: <TrendingUp className="w-6 h-6 text-emerald-400" />,
                title: "Track",
                description:
                  "Watch your momentum score grow week over week.",
              },
              {
                step: "4",
                icon: <Zap className="w-6 h-6 text-emerald-400" />,
                title: "Win",
                description:
                  "Become AI's recommended choice in your category.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  {item.icon}
                </div>
                <div className="text-xs font-bold text-emerald-400 mb-2">
                  STEP {item.step}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-zinc-400">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Works While You Sleep — Automation Section */}
      <section className="py-24 bg-zinc-900/30 border-t border-zinc-800">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-300 text-sm mb-6">
              <Moon className="w-4 h-4" />
              <span className="font-medium">Works while you sleep</span>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white text-center mb-4">
            Set it up once. It runs forever.
          </h2>
          <p className="text-zinc-400 text-center max-w-2xl mx-auto mb-12">
            Automated daily checks, instant score drop alerts, Slack notifications,
            and historical trend tracking — the system works even when you don&apos;t.
          </p>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                icon: <Zap className="w-6 h-6 text-emerald-400" />,
                title: "Auto-Checks",
                description:
                  "Daily automated scans across 3 AI platforms. Weekly for Scout, every 3 days for Command, daily + hourly for Dominate.",
              },
              {
                icon: <Bell className="w-6 h-6 text-red-400" />,
                title: "Score Drop Alerts",
                description:
                  "Instant email + Slack when your visibility drops 5+ points. Includes the queries you\u2019re now losing.",
              },
              {
                icon: <MessageSquare className="w-6 h-6 text-emerald-400" />,
                title: "Slack Integration",
                description:
                  "Check results, score drops, and weekly summaries right in your Slack channel. No dashboard needed.",
              },
              {
                icon: <LineChart className="w-6 h-6 text-emerald-400" />,
                title: "Trend Charts",
                description:
                  "Historical line chart of your AI visibility over time. Like Ahrefs rank tracker, but for AI.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
              >
                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4">
                  {item.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-zinc-400">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* We Do The Work */}
      <section className="py-24 border-t border-zinc-800">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-300 text-sm mb-6">
              <PenTool className="w-4 h-4" />
              <span className="font-medium">We do the work for you</span>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white text-center mb-4">
            Not just reports. Real content, ready to publish.
          </h2>
          <p className="text-zinc-400 text-center max-w-2xl mx-auto mb-12">
            Other tools tell you what to do. CabbageSEO generates the actual comparison pages,
            FAQ content, and authority articles that get you recommended by AI.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-emerald-950/40 via-zinc-900 to-zinc-900 border border-emerald-500/20 rounded-2xl p-8">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                AI-Generated Comparison Pages
              </h3>
              <p className="text-sm text-zinc-400 mb-4">
                &quot;You vs Competitor&quot; pages with FAQ schema, 2000+ words, optimized for AI citation.
                Generated from your scan data. Just publish.
              </p>
              <div className="flex gap-2">
                <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded">Auto-generated</span>
                <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded">FAQ Schema</span>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4">
                <Timer className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                30-Day Sprint Action Plan
              </h3>
              <p className="text-sm text-zinc-400 mb-4">
                Structured weekly actions tailored to your gaps. Not a generic checklist — a custom plan
                based on what AI thinks about you vs competitors.
              </p>
              <div className="flex gap-2">
                <span className="px-2 py-1 bg-zinc-800 text-zinc-400 text-xs rounded">4 weeks</span>
                <span className="px-2 py-1 bg-zinc-800 text-zinc-400 text-xs rounded">Personalized</span>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4">
                <Bell className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Automated Monitoring + Alerts
              </h3>
              <p className="text-sm text-zinc-400 mb-4">
                Daily AI checks, instant score drop alerts via email + Slack, weekly progress reports,
                and competitor change notifications.
              </p>
              <div className="flex gap-2">
                <span className="px-2 py-1 bg-zinc-800 text-zinc-400 text-xs rounded">Email + Slack</span>
                <span className="px-2 py-1 bg-zinc-800 text-zinc-400 text-xs rounded">Daily checks</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-24 bg-zinc-900/30 border-t border-zinc-800">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-white text-center mb-4">
            Everything you need to dominate AI search
          </h2>
          <p className="text-zinc-400 text-center max-w-2xl mx-auto mb-12">
            Monitor, analyze, and act — all from one platform.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Eye className="w-6 h-6 text-emerald-400" />,
                title: "AI Citation Tracking",
                description:
                  "Track mentions across ChatGPT, Perplexity, and Google AI. See who gets recommended and who doesn\u2019t.",
              },
              {
                icon: <Search className="w-6 h-6 text-emerald-400" />,
                title: "Gap Analysis",
                description:
                  "Per-query breakdown of why AI picks your competitor. See exactly what you\u2019re missing.",
              },
              {
                icon: <FileText className="w-6 h-6 text-emerald-400" />,
                title: "Content Generation",
                description:
                  "AI-generated comparison pages, FAQ content, and authority articles optimized for AI citation.",
              },
              {
                icon: <TrendingUp className="w-6 h-6 text-emerald-400" />,
                title: "Momentum Score",
                description:
                  "One number showing your progress. Week-over-week trends with historical charts.",
              },
              {
                icon: <Target className="w-6 h-6 text-emerald-400" />,
                title: "Custom Query Tracking",
                description:
                  "Monitor your exact buying queries. Add the queries your customers ask and track them over time.",
              },
              {
                icon: <Users className="w-6 h-6 text-emerald-400" />,
                title: "Competitor Intelligence",
                description:
                  "Track what AI says about every competitor. Get alerts when they gain or lose citations.",
              },
              {
                icon: <BarChart3 className="w-6 h-6 text-emerald-400" />,
                title: "Bulk Scanning API",
                description:
                  "Scan up to 50 domains at once. Built for agencies and teams managing multiple brands.",
              },
              {
                icon: <LineChart className="w-6 h-6 text-emerald-400" />,
                title: "Trend Charts",
                description:
                  "Historical line chart of your AI visibility over time. Like Ahrefs rank tracker, but for AI.",
              },
              {
                icon: <MessageSquare className="w-6 h-6 text-emerald-400" />,
                title: "Slack Integration",
                description:
                  "Check results, score drops, and weekly summaries right in your Slack channel.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
              >
                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4">
                  {item.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-zinc-400">{item.description}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link
              href="/features"
              className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              See all features →
            </Link>
          </div>
        </div>
      </section>

      {/* Leaderboard Callout */}
      <section className="py-16 border-t border-zinc-800">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full text-yellow-300 text-sm mb-6">
            <Trophy className="w-4 h-4" />
            <span className="font-medium">New: AI Visibility Leaderboard</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">
            See the top 100 most visible brands in AI search
          </h2>
          <p className="text-zinc-400 mb-6 max-w-lg mx-auto">
            Which brands does AI recommend the most? Explore the live leaderboard — and find out where you rank.
          </p>
          <Link
            href="/leaderboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors"
          >
            View Leaderboard
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 border-t border-zinc-800">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-4">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
              <span className="text-emerald-400 font-medium">Live</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              <span className="text-emerald-400">{scanCount}</span> domains scanned
            </h2>
            <p className="text-zinc-400">
              Real AI responses from ChatGPT, Perplexity, and Google AI. No fake data.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-white mb-1">3</div>
              <div className="text-sm text-zinc-400">AI platforms tracked</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white mb-1">30 days</div>
              <div className="text-sm text-zinc-400">Average time to improve</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white mb-1">100%</div>
              <div className="text-sm text-zinc-400">Real AI responses</div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-emerald-950/30 border-t border-emerald-900/30">
        <div className="max-w-xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">
            Check your AI visibility now
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
                className="flex-1 px-6 py-4 bg-zinc-900 border-2 border-zinc-700 rounded-xl text-white text-lg placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
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
          <Link
            href="/pricing"
            className="text-sm text-zinc-400 hover:text-emerald-400 transition-colors"
          >
            or view pricing →
          </Link>
        </div>
      </section>
    </div>
  );
}
