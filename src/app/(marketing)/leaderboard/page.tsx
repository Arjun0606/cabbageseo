"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Trophy,
  ArrowRight,
  Crown,
  TrendingUp,
  Search,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { AnimateIn } from "@/components/motion/animate-in";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientOrbs } from "@/components/backgrounds/gradient-orbs";

interface LeaderboardEntry {
  rank: number;
  domain: string;
  count: number;
  platforms: string[];
}

export default function LeaderboardPage() {
  const router = useRouter();
  const [domain, setDomain] = useState("");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalScans, setTotalScans] = useState(0);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const res = await fetch("/api/v1/benchmarks");
        if (res.ok) {
          const data = await res.json();
          setEntries(data.topDomains || []);
          setTotalScans(data.totalScans || 0);
        }
      } catch {
        // Silently fail — empty state will show
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, []);

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (domain.trim()) {
      let clean = domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
      router.push(`/teaser?domain=${encodeURIComponent(clean)}`);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Hero */}
      <section className="relative pt-20 pb-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-yellow-950/20 via-zinc-950 to-zinc-950" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-yellow-500/5 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <AnimateIn direction="up" delay={0} once>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full text-yellow-300 text-sm mb-6">
              <Trophy className="w-4 h-4" />
              <span className="font-medium">AI Visibility Leaderboard</span>
            </div>
          </AnimateIn>
          <AnimateIn direction="up" delay={0.1} once>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
              Top brands in{" "}
              <span className="text-yellow-400">AI search</span>
            </h1>
          </AnimateIn>
          <AnimateIn direction="up" delay={0.2} once>
            <p className="text-lg text-zinc-300 mb-8 max-w-xl mx-auto">
              Which brands does ChatGPT, Perplexity, and Google AI recommend the most?
              Rankings powered by real scan data from our users.
            </p>
          </AnimateIn>

          <AnimateIn direction="up" delay={0.3} once>
            <form onSubmit={handleCheck} className="max-w-md mx-auto mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="Check your ranking..."
                  className="flex-1 px-5 py-3 bg-zinc-900 border-2 border-white/[0.1] rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all"
                />
                <button
                  type="submit"
                  disabled={!domain.trim()}
                  className="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 disabled:bg-zinc-700 disabled:cursor-not-allowed text-black font-bold rounded-xl transition-colors"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </form>
            <p className="text-xs text-zinc-500">Free scan &bull; No signup</p>
          </AnimateIn>
        </div>
      </section>

      {/* Leaderboard table */}
      <section className="pb-24">
        <div className="max-w-4xl mx-auto px-6">
          {loading ? (
            <AnimateIn direction="up" delay={0} once>
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-zinc-500 animate-spin mb-4" />
                <p className="text-zinc-500">Loading leaderboard data...</p>
              </div>
            </AnimateIn>
          ) : entries.length === 0 ? (
            <GlassCard hover={false}>
              <div className="p-12 text-center">
                <Trophy className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">
                  Leaderboard is building...
                </h3>
                <p className="text-zinc-400 mb-6 max-w-md mx-auto">
                  The leaderboard is populated from real scan data. As more domains
                  get scanned, the top recommended brands will appear here.
                </p>
                <p className="text-sm text-zinc-500 mb-8">
                  Be one of the first to scan your domain and contribute to the rankings.
                </p>
                <form onSubmit={handleCheck} className="max-w-sm mx-auto">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      placeholder="yourdomain.com"
                      className="flex-1 px-4 py-3 bg-white/[0.06] border border-white/[0.1] rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 transition-all"
                    />
                    <button
                      type="submit"
                      disabled={!domain.trim()}
                      className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-700 text-black font-bold rounded-xl transition-colors"
                    >
                      Scan
                    </button>
                  </div>
                </form>
              </div>
            </GlassCard>
          ) : (
            <>
              <GlassCard hover={false} padding="sm">
                <div className="overflow-hidden">
                  {/* Header */}
                  <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/[0.06] text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    <div className="col-span-1">#</div>
                    <div className="col-span-5">Brand</div>
                    <div className="col-span-3">Platforms</div>
                    <div className="col-span-3 text-right">Recommendations</div>
                  </div>

                  {/* Rows */}
                  {entries.map((item) => (
                    <Link
                      key={item.domain}
                      href={`/teaser?domain=${encodeURIComponent(item.domain)}`}
                      className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors group"
                    >
                      <div className="col-span-1 flex items-center">
                        {item.rank <= 3 ? (
                          <Crown className={`w-5 h-5 ${item.rank === 1 ? "text-yellow-400" : item.rank === 2 ? "text-zinc-300" : "text-amber-600"}`} />
                        ) : (
                          <span className="text-zinc-500 font-medium">{item.rank}</span>
                        )}
                      </div>
                      <div className="col-span-5 flex items-center gap-3">
                        <span className="text-white font-medium group-hover:text-emerald-400 transition-colors">
                          {item.domain}
                        </span>
                        <ExternalLink className="w-3 h-3 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="col-span-3 flex items-center gap-1">
                        {item.platforms.map((p) => (
                          <span
                            key={p}
                            className="px-2 py-0.5 bg-white/[0.06] text-zinc-400 text-xs rounded"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                      <div className="col-span-3 flex items-center justify-end">
                        <span className="font-bold text-emerald-400 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          {item.count}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </GlassCard>

              <p className="text-center text-zinc-500 text-sm mt-6">
                Based on {totalScans.toLocaleString()} real AI scans.
                Rankings powered by actual recommendation data from ChatGPT, Perplexity &amp; Google AI.
                Updated weekly.
              </p>
            </>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-16 bg-emerald-950/30 border-t border-emerald-900/30 overflow-hidden">
        <GradientOrbs variant="emerald" />
        <div className="relative z-10 max-w-xl mx-auto px-6 text-center">
          <AnimateIn direction="up" delay={0} once>
            <h2 className="text-2xl font-bold text-white mb-3">
              Where does your brand rank?
            </h2>
            <p className="text-zinc-400 mb-6">
              Check your AI visibility score for free. See if you make the list.
            </p>
            <form onSubmit={handleCheck}>
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="yourdomain.com"
                  className="flex-1 px-5 py-3.5 bg-zinc-900 border-2 border-white/[0.1] rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 transition-all"
                />
                <button
                  type="submit"
                  disabled={!domain.trim()}
                  className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-700 text-black font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  Check now <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </AnimateIn>
        </div>
      </section>
    </div>
  );
}
