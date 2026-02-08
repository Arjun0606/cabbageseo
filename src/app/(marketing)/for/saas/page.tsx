"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Rocket,
  Swords,
  TrendingUp,
  Search,
  Target,
  Zap,
  BarChart3,
  FileText,
  Shield,
  Eye,
  Timer,
} from "lucide-react";

export default function ForSaaSPage() {
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
      <section className="relative pt-20 pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/20 via-zinc-950 to-zinc-950" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/15 border border-emerald-500/30 rounded-full text-emerald-300 text-sm mb-8">
            <Rocket className="w-4 h-4" />
            <span className="font-medium">Built for B2B SaaS founders</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            When buyers ask AI for the
            <br />
            <span className="text-emerald-400">best tool in your category</span>
            <br />
            — are you the answer?
          </h1>

          <p className="text-xl text-zinc-300 mb-12 max-w-2xl mx-auto">
            CabbageSEO helps SaaS founders track, analyze, and win AI
            recommendations across ChatGPT, Perplexity, and Google AI.
          </p>

          <form onSubmit={handleSubmit} className="max-w-xl mx-auto mb-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="yoursaas.com"
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
                    Check your SaaS
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </form>
          <p className="text-sm text-zinc-500">
            Takes 10 seconds &bull; No signup required
          </p>
        </div>
      </section>

      {/* The SaaS Problem */}
      <section className="py-24 bg-gradient-to-b from-red-950/15 to-zinc-950 border-t border-red-900/20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-white text-center mb-4">
            AI decides who wins your category
          </h2>
          <p className="text-zinc-400 text-center max-w-2xl mx-auto mb-12">
            When a buyer asks &quot;best CRM for startups&quot; or &quot;top
            project management tool&quot;, AI picks one winner. The rest don&apos;t
            exist.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-8">
              <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center mb-6">
                <Search className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Buyers ask AI first
              </h3>
              <p className="text-zinc-400">
                &quot;What&apos;s the best alternative to Salesforce?&quot;
                &quot;Which analytics tool should I use?&quot; AI gives one answer.
                If it&apos;s not you — that&apos;s a lost customer.
              </p>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-8">
              <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Incumbents have the advantage
              </h3>
              <p className="text-zinc-400">
                Established players already have the trust signals AI looks for:
                G2 reviews, Capterra listings, authority content. You need to
                close that gap fast.
              </p>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-8">
              <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center mb-6">
                <BarChart3 className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                No tool tracks this
              </h3>
              <p className="text-zinc-400">
                Ahrefs tracks Google. SEMrush tracks Google. Nothing tracks
                ChatGPT recommendations. You have zero data on the fastest
                growing channel.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Three Use Cases */}
      <section className="py-24 border-t border-zinc-800">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-white text-center mb-4">
            Whether you&apos;re launching, competing, or scaling
          </h2>
          <p className="text-zinc-400 text-center max-w-2xl mx-auto mb-12">
            CabbageSEO fits every stage of your SaaS journey.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
              <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6">
                <Rocket className="w-7 h-7 text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Launch
              </h3>
              <p className="text-emerald-400 text-sm font-medium mb-3">
                &quot;Does AI even know I exist?&quot;
              </p>
              <p className="text-zinc-400">
                Get your first AI citations. See which trust sources you need.
                Build visibility from zero with the 30-day sprint.
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
              <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6">
                <Swords className="w-7 h-7 text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Compete
              </h3>
              <p className="text-emerald-400 text-sm font-medium mb-3">
                &quot;How do I beat the incumbent?&quot;
              </p>
              <p className="text-zinc-400">
                Analyze exactly why AI recommends your competitor. Get a gap
                analysis and targeted content strategy to overtake them.
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
              <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6">
                <TrendingUp className="w-7 h-7 text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Scale
              </h3>
              <p className="text-emerald-400 text-sm font-medium mb-3">
                &quot;How do I defend my position?&quot;
              </p>
              <p className="text-zinc-400">
                Monitor competitors in real-time. Get alerts when challengers
                gain ground. Protect your AI recommendation status.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features for SaaS */}
      <section className="py-24 bg-zinc-900/30 border-t border-zinc-800">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-white text-center mb-4">
            Features built for SaaS
          </h2>
          <p className="text-zinc-400 text-center max-w-2xl mx-auto mb-12">
            Everything you need to win AI recommendations in your category.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Eye className="w-6 h-6 text-emerald-400" />,
                title: "Citation Tracking",
                description:
                  "See exactly which queries mention your SaaS across ChatGPT, Perplexity, and Google AI.",
              },
              {
                icon: <Target className="w-6 h-6 text-emerald-400" />,
                title: "Competitor Intelligence",
                description:
                  "Track up to 25 competitors. See their trust sources, content strategy, and authority signals.",
              },
              {
                icon: <Search className="w-6 h-6 text-emerald-400" />,
                title: "Gap Analysis",
                description:
                  "Per-query breakdown of why AI recommends your competitor instead of you. Fix the gaps.",
              },
              {
                icon: <FileText className="w-6 h-6 text-emerald-400" />,
                title: "Authority Pages",
                description:
                  "Generate comparison pages, category explainers, and FAQs that reinforce your credibility with AI systems.",
              },
              {
                icon: <Timer className="w-6 h-6 text-emerald-400" />,
                title: "Automated Daily Checks",
                description:
                  "Plan-tiered auto-checks run while you sleep. Score drop alerts hit your inbox + Slack when you lose ground.",
              },
              {
                icon: <Zap className="w-6 h-6 text-emerald-400" />,
                title: "AI Content Generation",
                description:
                  "We generate comparison pages and authority content for you. Get a preview during your free scan — full pages on paid plans.",
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

      {/* CTA */}
      <section className="py-16 bg-emerald-950/30 border-t border-emerald-900/30">
        <div className="max-w-xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">
            Check if AI recommends your SaaS
          </h2>
          <p className="text-zinc-400 mb-8">
            See what ChatGPT, Perplexity, and Google AI say about you in 10
            seconds.
          </p>
          <form onSubmit={handleSubmit} className="mb-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="yoursaas.com"
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
