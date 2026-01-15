"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Zap, Eye, Target, AlertTriangle } from "lucide-react";

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
        <div className="absolute inset-0 bg-gradient-to-b from-red-950/20 via-zinc-950 to-zinc-950" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-red-500/10 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          {/* Warning badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full text-red-400 text-sm mb-8">
            <AlertTriangle className="w-4 h-4" />
            <span>AI is choosing your competitors right now</span>
          </div>

          {/* Main headline */}
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Is AI sending your
            <br />
            <span className="text-red-400">customers to someone else?</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl text-zinc-400 mb-12 max-w-2xl mx-auto">
            When someone asks ChatGPT or Google AI "what's the best tool for X",
            AI chooses winners. If you're not on that list, you're{" "}
            <span className="text-white font-semibold">invisible</span>.
          </p>

          {/* Domain Input Form */}
          <form onSubmit={handleSubmit} className="max-w-xl mx-auto mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="yourdomain.com"
                  className="w-full px-6 py-4 bg-zinc-900 border border-zinc-700 rounded-xl text-white text-lg placeholder:text-zinc-500 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !domain.trim()}
                className="px-8 py-4 bg-red-500 hover:bg-red-600 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Checking...
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

          <p className="text-zinc-500 text-sm">
            Takes ~10 seconds. No signup required.
          </p>
        </div>
      </section>

      {/* How AI Works Section */}
      <section className="py-24 bg-zinc-900/50 border-t border-zinc-800">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-white text-center mb-4">
            AI doesn't search. AI <span className="text-red-400">recommends</span>.
          </h2>
          <p className="text-zinc-400 text-center mb-16 max-w-2xl mx-auto">
            When someone asks "what's the best CRM?" — AI picks winners.
            If you're not on that list, you don't exist.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
              <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                AI is the new gatekeeper
              </h3>
              <p className="text-zinc-400">
                ChatGPT, Perplexity, and Google AI now answer product questions directly. 
                They choose who gets mentioned.
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
              <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center mb-6">
                <Eye className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Buyers trust AI recommendations
              </h3>
              <p className="text-zinc-400">
                When ChatGPT says "the best tool is X" — people buy X. 
                This is where purchase decisions happen now.
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
              <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center mb-6">
                <Target className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                You're flying blind
              </h3>
              <p className="text-zinc-400">
                Google Analytics can't track AI. You have no idea if you're being recommended or ignored.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What We Do Section */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-white text-center mb-4">
            CabbageSEO shows you the truth
          </h2>
          <p className="text-zinc-400 text-center mb-16 max-w-2xl mx-auto">
            We query real AI platforms and show you exactly who they recommend — and whether that includes you.
          </p>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                <span className="text-emerald-400 font-bold">1</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  See who AI recommends
                </h3>
                <p className="text-zinc-400">
                  Real responses from ChatGPT, Perplexity, and Google AI. 
                  See exactly who they mention.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                <span className="text-emerald-400 font-bold">2</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Find where AI learns about them
                </h3>
                <p className="text-zinc-400">
                  Discover the sources AI trusts: G2, Capterra, Product Hunt, Reddit. 
                  Your competitors are there. You're not.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                <span className="text-emerald-400 font-bold">3</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Get your roadmap to visibility
                </h3>
                <p className="text-zinc-400">
                  Step-by-step instructions to get listed on the sources AI trusts, 
                  so you start getting recommended.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                <span className="text-emerald-400 font-bold">4</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Track your progress
                </h3>
                <p className="text-zinc-400">
                  Weekly reports show when you gain visibility. 
                  Get alerts when competitors overtake you.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-t from-red-950/20 to-transparent border-t border-zinc-800">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Find out in 10 seconds
          </h2>
          <p className="text-xl text-zinc-400 mb-8">
            Enter your domain and see if AI is recommending you — or your competitors.
          </p>

          <form onSubmit={handleSubmit} className="max-w-xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="yourdomain.com"
                className="flex-1 px-6 py-4 bg-zinc-900 border border-zinc-700 rounded-xl text-white text-lg placeholder:text-zinc-500 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !domain.trim()}
                className="px-8 py-4 bg-red-500 hover:bg-red-600 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                {loading ? "Checking..." : "Check now"}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </form>

          <p className="mt-6 text-zinc-500 text-sm">
            Free check • No credit card • No signup required
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
            Start free. Upgrade when you need more.
          </p>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* Free */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-left">
              <h3 className="text-lg font-semibold text-white mb-1">Free</h3>
              <p className="text-3xl font-bold text-white mb-4">$0</p>
              <p className="text-zinc-400 text-sm mb-6">
                See who AI recommends. Manual checks only.
              </p>
              <Link
                href="/signup"
                className="block w-full py-3 text-center border border-zinc-700 text-zinc-300 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                Get started
              </Link>
            </div>

            {/* Starter */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-left">
              <h3 className="text-lg font-semibold text-white mb-1">Starter</h3>
              <p className="text-3xl font-bold text-white mb-4">
                $29<span className="text-lg text-zinc-500">/mo</span>
              </p>
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
            <div className="bg-zinc-900 border border-red-500/50 rounded-2xl p-6 text-left relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-red-500 text-white text-xs font-semibold rounded-full">
                MOST POPULAR
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">Pro</h3>
              <p className="text-3xl font-bold text-white mb-4">
                $79<span className="text-lg text-zinc-500">/mo</span>
              </p>
              <p className="text-zinc-400 text-sm mb-6">
                Hourly monitoring. 10 sites. Full roadmap.
              </p>
              <Link
                href="/signup"
                className="block w-full py-3 text-center bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Get Pro
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
