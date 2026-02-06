"use client";

/**
 * HOMEPAGE — Narrowed to B2B SaaS founders
 *
 * Strategy: Sell momentum, not just visibility.
 * ICP: B2B SaaS founders competing against incumbents.
 * Message: "The smart founders are already doing this. You're not. Fix it in 30 days."
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Zap, TrendingUp, TrendingDown, Shield, Search, Target, Clock } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-red-950/30 via-zinc-950 to-zinc-950" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-red-500/10 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          {/* Badge — early advantage positioning */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/15 border border-amber-500/30 rounded-full text-amber-300 text-sm mb-8">
            <TrendingUp className="w-4 h-4" />
            <span className="font-medium">The SaaS founders who move first will lock in the advantage</span>
          </div>

          {/* Main headline — momentum, not fear */}
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Your competitors are winning<br />the AI conversation.
          </h1>

          {/* Subheadline — specific to B2B SaaS */}
          <p className="text-xl text-zinc-300 mb-4 max-w-2xl mx-auto">
            When a buyer asks ChatGPT <span className="text-white font-semibold">"best CRM for startups"</span> or{" "}
            <span className="text-white font-semibold">"top project management tools"</span> — AI picks a winner.
          </p>
          <p className="text-lg text-zinc-400 mb-12 max-w-2xl mx-auto">
            CabbageSEO shows B2B SaaS founders exactly where they stand in AI recommendations — and gives you a
            <span className="text-white font-semibold"> 30-day sprint</span> to get ahead of your competitors.
          </p>

          {/* Domain Input */}
          <form onSubmit={handleSubmit} className="max-w-xl mx-auto mb-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="yoursaas.com"
                  className="w-full px-6 py-4 bg-zinc-900 border-2 border-zinc-700 rounded-xl text-white text-lg placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !domain.trim()}
                className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    See your AI momentum
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="flex flex-col items-center justify-center gap-2 text-sm">
            <span className="text-zinc-500">
              Takes ~10 seconds &bull; No signup required
            </span>
            <p className="text-zinc-400 text-sm">
              Built for B2B SaaS founders competing against the incumbents
            </p>
          </div>
        </div>
      </section>

      {/* The Problem — specific to SaaS */}
      <section className="py-24 bg-gradient-to-b from-red-950/20 to-zinc-950 border-t border-red-900/30">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">
              AI is the new distribution channel
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Buyers don't Google like they used to. They ask AI: "What's the best alternative to Salesforce?"
              "Which analytics tool should I use?" "Best dev tools for startups?"
              <br /><br />
              AI gives one answer. If it's not you — your competitor just got a free customer.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-8">
              <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center mb-6">
                <Search className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                AI answers product questions now
              </h3>
              <p className="text-zinc-400">
                ChatGPT, Perplexity, and Google AI directly recommend tools. They decide who gets mentioned — and who doesn't exist.
              </p>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-8">
              <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center mb-6">
                <TrendingDown className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Your competitors already know this
              </h3>
              <p className="text-zinc-400">
                Smart SaaS founders are already optimizing for AI recommendations. The longer you wait, the harder it gets to catch up.
              </p>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-8">
              <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                No tool tracks this for you
              </h3>
              <p className="text-zinc-400">
                Ahrefs can't track AI. SEMrush can't track AI. Google Analytics can't track AI. You have zero visibility into whether AI recommends you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The Solution — 30-day sprint framing */}
      <section className="py-24 border-t border-zinc-800">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">
              30 days to get AI on your side
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              CabbageSEO gives you a structured sprint — not an endless dashboard.
              Know exactly what to do, in what order, to become AI's recommended choice.
            </p>
          </div>

          <div className="space-y-6 max-w-3xl mx-auto">
            {[
              {
                step: "1",
                icon: <Search className="w-5 h-5 text-emerald-400" />,
                title: "Scan: See where you stand in 10 seconds",
                description: "We query ChatGPT, Perplexity, and Google AI with real buyer questions. See exactly who AI recommends — and whether it's you or your competitor.",
              },
              {
                step: "2",
                icon: <Target className="w-5 h-5 text-emerald-400" />,
                title: "Focus: Get your ONE next action",
                description: "Not a list of 50 things. One clear, high-impact action: \"Get listed on G2\" or \"Publish a comparison page vs [competitor].\" Do it, move on.",
              },
              {
                step: "3",
                icon: <TrendingUp className="w-5 h-5 text-emerald-400" />,
                title: "Track: Watch your momentum grow",
                description: "See week-over-week changes. \"You were mentioned in 3 more queries this week.\" Feel the progress. Know it's working.",
              },
              {
                step: "4",
                icon: <Clock className="w-5 h-5 text-emerald-400" />,
                title: "Sprint: Complete your 30-day program",
                description: "A structured 4-week program. Week 1: critical sources. Week 2: comparison content. Week 3: authority building. Week 4: review and optimize.",
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-zinc-400">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof / specificity */}
      <section className="py-16 border-t border-zinc-800">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-lg text-zinc-300 mb-2">
            Most B2B SaaS founders fix their AI visibility in <span className="text-white font-bold">30 days</span>.
          </p>
          <p className="text-zinc-500">
            Real AI responses from ChatGPT, Perplexity, and Google AI. No fake data. No estimates.
          </p>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-24 border-t border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Simple pricing. Real results.
          </h2>
          <p className="text-zinc-400 mb-12">
            Start with a free scan. Upgrade when you're ready to take action.
          </p>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Scout */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-left">
              <h3 className="text-lg font-semibold text-white mb-1">Scout</h3>
              <p className="text-3xl font-bold text-white mb-2">
                $49<span className="text-lg text-zinc-500">/mo</span>
              </p>
              <p className="text-emerald-400 text-sm font-medium mb-4">Know your blind spots</p>
              <p className="text-zinc-400 text-sm mb-6">
                Daily monitoring. 3 competitors. Trust Map. 30-day sprint.
              </p>
              <Link
                href="/signup"
                className="block w-full py-3 text-center border border-zinc-700 text-zinc-300 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                Start with Scout
              </Link>
            </div>

            {/* Command */}
            <div className="bg-zinc-900 border-2 border-emerald-500/50 rounded-2xl p-6 text-left relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full">
                MOST POPULAR
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">Command</h3>
              <p className="text-3xl font-bold text-white mb-2">
                $149<span className="text-lg text-zinc-500">/mo</span>
              </p>
              <p className="text-emerald-400 text-sm font-medium mb-4">Win the AI conversation</p>
              <p className="text-zinc-400 text-sm mb-6">
                Hourly monitoring. 10 competitors. Full intelligence. Weekly action plans.
              </p>
              <Link
                href="/signup"
                className="block w-full py-3 text-center bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-semibold"
              >
                Get Command
              </Link>
            </div>

            {/* Dominate */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-left">
              <h3 className="text-lg font-semibold text-white mb-1">Dominate</h3>
              <p className="text-3xl font-bold text-white mb-2">
                $349<span className="text-lg text-zinc-500">/mo</span>
              </p>
              <p className="text-emerald-400 text-sm font-medium mb-4">Own your category</p>
              <p className="text-zinc-400 text-sm mb-6">
                25 sites. Real-time alerts. White-label. API access. Everything.
              </p>
              <Link
                href="/signup"
                className="block w-full py-3 text-center border border-zinc-700 text-zinc-300 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                Get Dominate
              </Link>
            </div>
          </div>

          <p className="text-zinc-500 text-sm mt-8">
            All plans include a 7-day free trial. No credit card required.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-emerald-950/30 border-t border-emerald-900/30">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">
            The early movers are already optimizing for AI.
          </h2>
          <p className="text-zinc-400 mb-6">
            Find out in 10 seconds whether AI recommends you — or your competitors.
          </p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all"
          >
            Check your domain now
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>
    </div>
  );
}
