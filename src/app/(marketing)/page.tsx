"use client";

/**
 * HOMEPAGE - CONVERSION MACHINE
 * 
 * Design principles:
 * 1. Fear + Agency: "You're losing AND here's how to fix it"
 * 2. Immediate value: Check domain without signup
 * 3. One-click demo: Let them explore a famous brand
 * 4. Clear value ladder: What they get at each price
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Zap, Eye, Target, AlertTriangle, Search, TrendingDown, CheckCircle } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain.trim()) return;

    setLoading(true);
    setError("");

    // Clean domain
    let cleanDomain = domain.trim().toLowerCase();
    cleanDomain = cleanDomain.replace(/^https?:\/\//, "");
    cleanDomain = cleanDomain.replace(/^www\./, "");
    cleanDomain = cleanDomain.split("/")[0];

    // Redirect to teaser page with domain
    router.push(`/teaser?domain=${encodeURIComponent(cleanDomain)}`);
  };


  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-red-950/30 via-zinc-950 to-zinc-950" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-red-500/10 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          {/* Warning badge - More urgent */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/40 rounded-full text-red-300 text-sm mb-8 animate-pulse">
            <AlertTriangle className="w-4 h-4" />
            <span className="font-medium">Right now, AI is recommending your competitors</span>
          </div>

          {/* Main headline - Urgent but empowering */}
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            AI is choosing your competitors.
          </h1>

          {/* Subheadline - The reality */}
          <p className="text-xl text-zinc-300 mb-4 max-w-2xl mx-auto">
            When someone asks ChatGPT <span className="text-white font-semibold">"what's the best [your category]?"</span>
            <br />
            AI names them — not you.
          </p>
          <p className="text-lg text-zinc-400 mb-12 max-w-2xl mx-auto">
            CabbageSEO shows you:
            <br />
            <span className="text-white">• who AI recommends</span>
            <br />
            <span className="text-white">• where it gets that information</span>
            <br />
            <span className="text-white">• what to fix to get included</span>
          </p>

          {/* Domain Input Form */}
          <form onSubmit={handleSubmit} className="max-w-xl mx-auto mb-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="yoursaas.com"
                  className="w-full px-6 py-4 bg-zinc-900 border-2 border-zinc-700 rounded-xl text-white text-lg placeholder:text-zinc-500 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !domain.trim()}
                className="px-8 py-4 bg-red-500 hover:bg-red-600 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-500/20"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    See who AI recommends
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
            {error && (
              <p className="mt-3 text-red-400 text-sm">{error}</p>
            )}
          </form>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
            <span className="text-zinc-500">
              Takes ~10 seconds • No signup required
            </span>
            <p className="text-zinc-500 text-sm mt-2">
              Works best for SaaS, micro-SaaS, and online tools
            </p>
          </div>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="py-24 bg-gradient-to-b from-red-950/20 to-zinc-950 border-t border-red-900/30">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">
              This is the new gatekeeper
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              People don't Google like they used to. They ask AI: "What's the best CRM?" 
              "What's the best alternative to Notion?" "Which tool should I use?"
              <br /><br />
              AI gives one answer. If it's not you, you don't exist.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-8">
              <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                AI is the new gatekeeper
              </h3>
              <p className="text-zinc-400">
                ChatGPT, Perplexity, and Google AI now answer product questions directly. 
                They decide who gets mentioned.
              </p>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-8">
              <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center mb-6">
                <TrendingDown className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Buyers trust AI recommendations
              </h3>
              <p className="text-zinc-400">
                When ChatGPT says "the best tool is X" — people buy X.
                This is where purchase decisions happen now.
              </p>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-8">
              <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center mb-6">
                <Eye className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                You're flying blind
              </h3>
              <p className="text-zinc-400">
                Google Analytics can't track AI. You have no idea if you're being 
                recommended — or ignored.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The Solution Section */}
      <section className="py-24 border-t border-zinc-800">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">
              CabbageSEO shows you the truth
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              See exactly what ChatGPT, Perplexity, and Google AI say. 
              See which competitors AI recommends instead of you. 
              See where AI learned about them. Get clear steps to stop being invisible.
            </p>
          </div>

          <div className="space-y-6 max-w-3xl mx-auto">
            {[
              {
                step: "1",
                title: "See exactly what ChatGPT, Perplexity, and Google AI say",
                description: "Real responses. No estimates. No fake data. Just what AI actually said.",
              },
              {
                step: "2",
                title: "See which competitors AI recommends instead of you",
                description: "Know exactly who's getting your customers. See the names AI mentions.",
              },
              {
                step: "3",
                title: "See where AI learned about them",
                description: "G2, Product Hunt, Reddit, etc. Your competitors are on these sources. You're not.",
              },
              {
                step: "4",
                title: "Get clear steps to stop being invisible",
                description: "Step-by-step instructions. What to add. Where to get listed. How to fix it.",
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                  <span className="text-emerald-400 font-bold text-lg">{item.step}</span>
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

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-t from-red-950/30 to-transparent border-t border-zinc-800">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Find out in 10 seconds
          </h2>
          <p className="text-xl text-zinc-400 mb-8">
            Enter your domain and see who AI recommends — you or your competitors.
          </p>

          <form onSubmit={handleSubmit} className="max-w-xl mx-auto mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="yoursaas.com"
                className="flex-1 px-6 py-4 bg-zinc-900 border-2 border-zinc-700 rounded-xl text-white text-lg placeholder:text-zinc-500 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !domain.trim()}
                className="px-8 py-4 bg-red-500 hover:bg-red-600 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                {loading ? "Scanning..." : "Check now"}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </form>

          <p className="text-zinc-500 text-sm">
            No fake data. No estimates pretending to be revenue. Just what AI actually said.
          </p>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-24 border-t border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Simple pricing
          </h2>
          <p className="text-zinc-400 mb-12">
            Start free. Upgrade when you're ready to fix it.
          </p>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* Free */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-left">
              <h3 className="text-lg font-semibold text-white mb-1">Free</h3>
              <p className="text-3xl font-bold text-white mb-2">$0</p>
              <p className="text-zinc-500 text-sm mb-6">7-day access</p>
              <p className="text-zinc-400 text-sm mb-6">
                See who AI recommends. Manual checks only.
              </p>
              <Link
                href="/signup"
                className="block w-full py-3 text-center border border-zinc-700 text-zinc-300 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                Start free
              </Link>
            </div>

            {/* Starter */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-left">
              <h3 className="text-lg font-semibold text-white mb-1">Starter</h3>
              <p className="text-3xl font-bold text-white mb-2">
                $29<span className="text-lg text-zinc-500">/mo</span>
              </p>
              <p className="text-zinc-500 text-sm mb-6">For solo founders & indie hackers</p>
              <p className="text-zinc-400 text-sm mb-6">
                Daily monitoring. 3 sites. Content fixes.
              </p>
              <Link
                href="/signup"
                className="block w-full py-3 text-center bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Get Starter
              </Link>
            </div>

            {/* Pro */}
            <div className="bg-zinc-900 border-2 border-red-500/50 rounded-2xl p-6 text-left relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                MOST POPULAR
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">Pro</h3>
              <p className="text-3xl font-bold text-white mb-2">
                $79<span className="text-lg text-zinc-500">/mo</span>
              </p>
              <p className="text-zinc-500 text-sm mb-6">For serious founders</p>
              <p className="text-zinc-400 text-sm mb-6">
                Hourly monitoring. 10 sites. Full roadmap.
              </p>
              <Link
                href="/signup"
                className="block w-full py-3 text-center bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold"
              >
                Get Pro
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA - Urgency */}
      <section className="py-16 bg-red-950/30 border-t border-red-900/30">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-red-300 font-medium mb-2">
            ⚠️ While you're reading this, AI is recommending your competitors
          </p>
          <h2 className="text-2xl font-bold text-white mb-6">
            Find out in 10 seconds who AI recommends
          </h2>
          <button
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="inline-flex items-center gap-2 px-8 py-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-all"
          >
            Check your domain now
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>
    </div>
  );
}
