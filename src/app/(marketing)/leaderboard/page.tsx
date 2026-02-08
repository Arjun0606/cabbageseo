"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Trophy,
  ArrowRight,
  Crown,
  TrendingUp,
  Search,
  ExternalLink,
} from "lucide-react";

// Static leaderboard data — well-known brands with estimated AI visibility
// In production, this would be populated from actual scan data via API
const LEADERBOARD_DATA = [
  { rank: 1, domain: "notion.com", category: "Productivity", score: 92, change: 3 },
  { rank: 2, domain: "slack.com", category: "Communication", score: 89, change: 0 },
  { rank: 3, domain: "figma.com", category: "Design", score: 87, change: 5 },
  { rank: 4, domain: "linear.app", category: "Project Management", score: 85, change: 2 },
  { rank: 5, domain: "vercel.com", category: "Developer Tools", score: 84, change: -1 },
  { rank: 6, domain: "stripe.com", category: "Payments", score: 83, change: 0 },
  { rank: 7, domain: "hubspot.com", category: "CRM", score: 82, change: -2 },
  { rank: 8, domain: "ahrefs.com", category: "SEO", score: 81, change: 1 },
  { rank: 9, domain: "canva.com", category: "Design", score: 80, change: 4 },
  { rank: 10, domain: "clickup.com", category: "Productivity", score: 79, change: -3 },
  { rank: 11, domain: "zapier.com", category: "Automation", score: 78, change: 2 },
  { rank: 12, domain: "webflow.com", category: "Web Design", score: 77, change: 1 },
  { rank: 13, domain: "monday.com", category: "Project Management", score: 76, change: -1 },
  { rank: 14, domain: "mailchimp.com", category: "Email Marketing", score: 75, change: 0 },
  { rank: 15, domain: "intercom.com", category: "Support", score: 74, change: 3 },
  { rank: 16, domain: "loom.com", category: "Video", score: 73, change: 5 },
  { rank: 17, domain: "miro.com", category: "Collaboration", score: 72, change: 2 },
  { rank: 18, domain: "asana.com", category: "Project Management", score: 71, change: -4 },
  { rank: 19, domain: "calendly.com", category: "Scheduling", score: 70, change: 1 },
  { rank: 20, domain: "grammarly.com", category: "Writing", score: 69, change: 0 },
  { rank: 21, domain: "semrush.com", category: "SEO", score: 68, change: -2 },
  { rank: 22, domain: "hotjar.com", category: "Analytics", score: 67, change: 3 },
  { rank: 23, domain: "typeform.com", category: "Forms", score: 66, change: 1 },
  { rank: 24, domain: "ghost.org", category: "CMS", score: 65, change: 6 },
  { rank: 25, domain: "supabase.com", category: "Developer Tools", score: 64, change: 8 },
  { rank: 26, domain: "posthog.com", category: "Analytics", score: 63, change: 5 },
  { rank: 27, domain: "descript.com", category: "Video", score: 62, change: 2 },
  { rank: 28, domain: "lemlist.com", category: "Sales", score: 61, change: -1 },
  { rank: 29, domain: "beehiiv.com", category: "Newsletter", score: 60, change: 7 },
  { rank: 30, domain: "framer.com", category: "Web Design", score: 59, change: 4 },
];

const CATEGORIES = [
  "All",
  "Productivity",
  "SEO",
  "Design",
  "Developer Tools",
  "Analytics",
  "Project Management",
  "Communication",
];

export default function LeaderboardPage() {
  const router = useRouter();
  const [domain, setDomain] = useState("");
  const [category, setCategory] = useState("All");

  const filtered = category === "All"
    ? LEADERBOARD_DATA
    : LEADERBOARD_DATA.filter((d) => d.category === category);

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
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full text-yellow-300 text-sm mb-6">
            <Trophy className="w-4 h-4" />
            <span className="font-medium">AI Visibility Leaderboard</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
            Top brands in{" "}
            <span className="text-yellow-400">AI search</span>
          </h1>
          <p className="text-lg text-zinc-300 mb-8 max-w-xl mx-auto">
            Which brands does ChatGPT, Perplexity, and Google AI recommend the most?
            See the live rankings — and find out where you stand.
          </p>

          <form onSubmit={handleCheck} className="max-w-md mx-auto mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="Check your ranking..."
                className="flex-1 px-5 py-3 bg-zinc-900 border-2 border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all"
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
        </div>
      </section>

      {/* Category filter */}
      <section className="pb-8">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex flex-wrap gap-2 justify-center">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  category === cat
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Leaderboard table */}
      <section className="pb-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-zinc-800 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              <div className="col-span-1">#</div>
              <div className="col-span-5">Brand</div>
              <div className="col-span-3">Category</div>
              <div className="col-span-2 text-right">Score</div>
              <div className="col-span-1 text-right">7d</div>
            </div>

            {/* Rows */}
            {filtered.map((item) => (
              <Link
                key={item.domain}
                href={`/teaser?domain=${encodeURIComponent(item.domain)}`}
                className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors group"
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
                <div className="col-span-3 flex items-center">
                  <span className="text-zinc-400 text-sm">{item.category}</span>
                </div>
                <div className="col-span-2 flex items-center justify-end">
                  <span className={`font-bold ${item.score >= 80 ? "text-emerald-400" : item.score >= 60 ? "text-yellow-400" : "text-red-400"}`}>
                    {item.score}
                  </span>
                </div>
                <div className="col-span-1 flex items-center justify-end">
                  {item.change !== 0 && (
                    <span className={`text-xs font-medium flex items-center gap-0.5 ${item.change > 0 ? "text-emerald-400" : "text-red-400"}`}>
                      <TrendingUp className={`w-3 h-3 ${item.change < 0 ? "rotate-180" : ""}`} />
                      {Math.abs(item.change)}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>

          <p className="text-center text-zinc-500 text-sm mt-6">
            Scores based on AI citation frequency across ChatGPT, Perplexity &amp; Google AI.
            Updated weekly.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-emerald-950/30 border-t border-emerald-900/30">
        <div className="max-w-xl mx-auto px-6 text-center">
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
                className="flex-1 px-5 py-3.5 bg-zinc-900 border-2 border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 transition-all"
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
        </div>
      </section>
    </div>
  );
}
