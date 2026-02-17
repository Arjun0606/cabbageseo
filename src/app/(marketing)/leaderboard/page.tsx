/**
 * /leaderboard — Public AI Visibility Leaderboard
 *
 * Shows the most scanned domains, highest scores, and recent scans.
 * Every domain links to /r/[domain] for the full report.
 * Designed to be shared, bookmarked, and generate organic traffic.
 */

import { Metadata } from "next";
import Link from "next/link";
import {
  Trophy,
  TrendingUp,
  BarChart3,
  Clock,
  ArrowRight,
  Globe,
  Search,
  Eye,
} from "lucide-react";
import { db, teaserReports } from "@/lib/db";
import { sql, desc } from "drizzle-orm";

export const metadata: Metadata = {
  title: "AI Visibility Leaderboard — Who Does AI Recommend?",
  description:
    "See which brands ChatGPT, Perplexity & Google AI recommend the most. Public AI visibility scores updated in real-time.",
  openGraph: {
    title: "AI Visibility Leaderboard — CabbageSEO",
    description:
      "See which brands AI recommends the most. Public scores from ChatGPT, Perplexity & Google AI.",
  },
};

// Dynamic — can't pre-render at build time (needs DB)
export const dynamic = "force-dynamic";

function ScoreBadge({ score }: { score: number }) {
  const color =
    score < 20
      ? "text-red-500 bg-red-500/10 border-red-500/20"
      : score < 40
        ? "text-red-400 bg-red-500/10 border-red-500/20"
        : score < 60
          ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
          : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-bold border tabular-nums ${color}`}
    >
      {score}
    </span>
  );
}

function timeAgo(date: string | Date): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = Math.floor((now - then) / 1000);

  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default async function LeaderboardPage() {
  // Fetch all data server-side
  const [topScoresRaw, mostScannedRaw, recentScansRaw, statsRaw] =
    await Promise.all([
      db
        .select({
          domain: teaserReports.domain,
          visibilityScore:
            sql<number>`MAX(${teaserReports.visibilityScore})`.as("max_score"),
          scanCount: sql<number>`COUNT(*)`.as("scan_count"),
        })
        .from(teaserReports)
        .groupBy(teaserReports.domain)
        .orderBy(sql`max_score DESC`)
        .limit(20),

      db
        .select({
          domain: teaserReports.domain,
          scanCount: sql<number>`COUNT(*)`.as("scan_count"),
          latestScore:
            sql<number>`(array_agg(${teaserReports.visibilityScore} ORDER BY ${teaserReports.createdAt} DESC))[1]`.as(
              "latest_score"
            ),
        })
        .from(teaserReports)
        .groupBy(teaserReports.domain)
        .orderBy(sql`scan_count DESC`)
        .limit(20),

      db
        .select({
          domain: teaserReports.domain,
          visibilityScore: teaserReports.visibilityScore,
          isInvisible: teaserReports.isInvisible,
          createdAt: teaserReports.createdAt,
        })
        .from(teaserReports)
        .orderBy(desc(teaserReports.createdAt))
        .limit(20),

      db
        .select({
          totalScans: sql<number>`COUNT(*)`.as("total_scans"),
          uniqueDomains:
            sql<number>`COUNT(DISTINCT ${teaserReports.domain})`.as(
              "unique_domains"
            ),
          avgScore:
            sql<number>`ROUND(AVG(${teaserReports.visibilityScore}))`.as(
              "avg_score"
            ),
        })
        .from(teaserReports),
    ]);

  const stats = statsRaw[0] || {
    totalScans: 0,
    uniqueDomains: 0,
    avgScore: 0,
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Hero */}
      <section className="pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm font-medium mb-6">
            <Trophy className="w-4 h-4" />
            Live Leaderboard
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            AI Visibility Leaderboard
          </h1>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-8">
            Who does ChatGPT, Perplexity &amp; Google AI recommend? Real-time
            scores from {stats.uniqueDomains.toLocaleString()} domains scanned.
          </p>

          {/* Stats bar */}
          <div className="flex justify-center gap-8 mb-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-white tabular-nums">
                {stats.totalScans.toLocaleString()}
              </div>
              <div className="text-xs text-zinc-500">Total scans</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white tabular-nums">
                {stats.uniqueDomains.toLocaleString()}
              </div>
              <div className="text-xs text-zinc-500">Domains tracked</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-400 tabular-nums">
                {stats.avgScore}
              </div>
              <div className="text-xs text-zinc-500">Avg score</div>
            </div>
          </div>
        </div>
      </section>

      {/* Leaderboard Grid */}
      <section className="pb-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Scores */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-zinc-800 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <h2 className="font-semibold text-white">Highest Scores</h2>
              </div>
              <div className="divide-y divide-zinc-800/50">
                {topScoresRaw.length === 0 ? (
                  <div className="px-5 py-8 text-center text-zinc-600 text-sm">
                    No scans yet. Be the first!
                  </div>
                ) : (
                  topScoresRaw.map((row, i) => (
                    <Link
                      key={row.domain}
                      href={`/r/${row.domain}`}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-zinc-800/50 transition-colors group"
                    >
                      <span
                        className={`w-6 text-sm font-bold tabular-nums ${
                          i < 3
                            ? "text-amber-400"
                            : "text-zinc-600"
                        }`}
                      >
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium truncate group-hover:text-emerald-400 transition-colors">
                          {row.domain}
                        </p>
                        <p className="text-xs text-zinc-600">
                          {row.scanCount} scan
                          {row.scanCount !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <ScoreBadge score={row.visibilityScore} />
                    </Link>
                  ))
                )}
              </div>
            </div>

            {/* Most Scanned */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-zinc-800 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-400" />
                <h2 className="font-semibold text-white">Most Scanned</h2>
              </div>
              <div className="divide-y divide-zinc-800/50">
                {mostScannedRaw.length === 0 ? (
                  <div className="px-5 py-8 text-center text-zinc-600 text-sm">
                    No scans yet. Be the first!
                  </div>
                ) : (
                  mostScannedRaw.map((row, i) => (
                    <Link
                      key={row.domain}
                      href={`/r/${row.domain}`}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-zinc-800/50 transition-colors group"
                    >
                      <span
                        className={`w-6 text-sm font-bold tabular-nums ${
                          i < 3
                            ? "text-blue-400"
                            : "text-zinc-600"
                        }`}
                      >
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium truncate group-hover:text-emerald-400 transition-colors">
                          {row.domain}
                        </p>
                        <p className="text-xs text-zinc-600">
                          Score: {row.latestScore}
                        </p>
                      </div>
                      <span className="text-sm text-zinc-400 font-medium tabular-nums">
                        {row.scanCount}x
                      </span>
                    </Link>
                  ))
                )}
              </div>
            </div>

            {/* Recent Scans */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-zinc-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <h2 className="font-semibold text-white">Recent Scans</h2>
              </div>
              <div className="divide-y divide-zinc-800/50">
                {recentScansRaw.length === 0 ? (
                  <div className="px-5 py-8 text-center text-zinc-600 text-sm">
                    No scans yet. Be the first!
                  </div>
                ) : (
                  recentScansRaw.map((row, i) => (
                    <Link
                      key={`${row.domain}-${i}`}
                      href={`/r/${row.domain}`}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-zinc-800/50 transition-colors group"
                    >
                      <div
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          row.isInvisible
                            ? "bg-red-500"
                            : row.visibilityScore < 40
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium truncate group-hover:text-emerald-400 transition-colors">
                          {row.domain}
                        </p>
                        <p className="text-xs text-zinc-600">
                          {timeAgo(row.createdAt)}
                        </p>
                      </div>
                      <ScoreBadge score={row.visibilityScore} />
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA — check your score */}
      <section className="pb-24">
        <div className="max-w-xl mx-auto px-6">
          <div className="bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-emerald-950/40 border border-emerald-500/20 rounded-2xl p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <Search className="w-6 h-6 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Check your AI visibility score
            </h2>
            <p className="text-zinc-400 mb-6">
              See if ChatGPT, Perplexity &amp; Google AI recommend your brand.
              Takes 10 seconds.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-colors shadow-lg shadow-emerald-500/20"
            >
              Scan my domain free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-xs text-zinc-600 mt-3">
              Free &bull; No signup &bull; Results appear on this leaderboard
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
