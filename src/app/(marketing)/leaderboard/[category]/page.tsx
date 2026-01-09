/**
 * Category Leaderboard Page
 * 
 * Public page showing top AI-recommended products in each category.
 * Creates competition, retention, and virality.
 * 
 * Founders will:
 * - Check it regularly
 * - Share it to flex
 * - Compete to improve their rank
 */

import { Metadata } from "next";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Trophy, 
  Medal,
  TrendingUp,
  ExternalLink,
  ArrowRight,
  Crown,
  Target
} from "lucide-react";

interface PageProps {
  params: Promise<{ category: string }>;
}

// Common categories for SEO
const CATEGORIES = [
  "project-management",
  "crm",
  "email-marketing",
  "analytics",
  "ecommerce",
  "design",
  "development",
  "productivity",
  "marketing",
  "sales",
  "customer-support",
  "hr",
  "finance",
  "ai-tools",
];

function formatCategory(slug: string): string {
  return slug
    .split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params;
  const categoryName = formatCategory(decodeURIComponent(category));
  
  return {
    title: `Top AI-Recommended ${categoryName} Tools | CabbageSEO Leaderboard`,
    description: `See which ${categoryName.toLowerCase()} tools are most recommended by AI platforms like ChatGPT, Perplexity, and Google AI. Updated weekly.`,
    openGraph: {
      title: `${categoryName} AI Leaderboard`,
      description: `The most AI-recommended ${categoryName.toLowerCase()} tools`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `Top AI-Recommended ${categoryName} Tools`,
      description: `See who's winning in AI search`,
    },
  };
}

interface LeaderboardSite {
  id: string;
  domain: string;
  category: string | null;
  total_citations: number | null;
  geo_score_avg: number | null;
  citations_this_week: number | null;
  public_profile_enabled: boolean | null;
}

interface MarketShareSnapshot {
  site_id: string;
  market_share: number;
}

async function getLeaderboardData(category: string) {
  const supabase = createServiceClient();
  const isAllCategories = category === "all";
  
  // PRIVACY-FIRST: Only show sites with public profiles enabled
  let query = supabase
    .from("sites")
    .select(`
      id,
      domain,
      category,
      total_citations,
      geo_score_avg,
      citations_this_week,
      public_profile_enabled
    `)
    .eq("public_profile_enabled", true) // Only public profiles!
    .order("total_citations", { ascending: false })
    .limit(50);
  
  if (!isAllCategories) {
    query = query.ilike("category", `%${category}%`);
  }
  
  const { data: sitesData } = await query;
  const sites = (sitesData || []) as LeaderboardSite[];
  
  // Get market share for each site
  const siteIds = sites.map(s => s.id);
  const { data: snapshotsData } = await supabase
    .from("market_share_snapshots")
    .select("site_id, market_share")
    .in("site_id", siteIds)
    .order("snapshot_date", { ascending: false });
  
  const snapshots = (snapshotsData || []) as MarketShareSnapshot[];
  
  // Create market share map (latest per site)
  const marketShareMap: Record<string, number> = {};
  for (const snap of snapshots) {
    if (!marketShareMap[snap.site_id]) {
      marketShareMap[snap.site_id] = snap.market_share;
    }
  }
  
  // Combine and rank
  const leaderboard = sites
    .map(site => ({
      domain: site.domain,
      category: site.category,
      totalMentions: site.total_citations || 0,
      weeklyMentions: site.citations_this_week || 0,
      aiVisibility: site.geo_score_avg || 0,
      mentionShare: marketShareMap[site.id] || 0,
    }))
    .filter(s => s.totalMentions > 0)
    .slice(0, 25);
  
  return leaderboard;
}

export default async function LeaderboardPage({ params }: PageProps) {
  const { category } = await params;
  const categorySlug = decodeURIComponent(category);
  const categoryName = categorySlug === "all" ? "All Categories" : formatCategory(categorySlug);
  const leaderboard = await getLeaderboardData(categorySlug);
  
  return (
    <div className="min-h-screen bg-black">
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="w-8 h-8 text-amber-400" />
            <h1 className="text-3xl font-bold text-white">
              AI Leaderboard: {categoryName}
            </h1>
          </div>
          <p className="text-zinc-400 text-lg max-w-2xl">
            The most recommended products by AI platforms like ChatGPT, Perplexity, and Google AI.
            Rankings based on real AI responses, not estimates.
          </p>
        </div>
        
        {/* Category Selector */}
        <div className="mb-8 overflow-x-auto pb-2">
          <div className="flex gap-2 min-w-max">
            <Link href="/leaderboard/all">
              <Badge 
                variant={categorySlug === "all" ? "default" : "outline"}
                className={categorySlug === "all" 
                  ? "bg-emerald-500 text-black cursor-pointer" 
                  : "border-zinc-700 text-zinc-400 hover:border-zinc-500 cursor-pointer"
                }
              >
                All
              </Badge>
            </Link>
            {CATEGORIES.map(cat => (
              <Link key={cat} href={`/leaderboard/${cat}`}>
                <Badge 
                  variant={categorySlug === cat ? "default" : "outline"}
                  className={categorySlug === cat 
                    ? "bg-emerald-500 text-black cursor-pointer" 
                    : "border-zinc-700 text-zinc-400 hover:border-zinc-500 cursor-pointer"
                  }
                >
                  {formatCategory(cat)}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
        
        {/* Leaderboard Table */}
        {leaderboard.length > 0 ? (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="text-left py-4 px-6 text-sm font-medium text-zinc-400 w-16">Rank</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-zinc-400">Product</th>
                      <th className="text-center py-4 px-6 text-sm font-medium text-zinc-400">AI Mentions</th>
                      <th className="text-center py-4 px-6 text-sm font-medium text-zinc-400">This Week</th>
                      <th className="text-center py-4 px-6 text-sm font-medium text-zinc-400">Mention Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((site, idx) => (
                      <tr 
                        key={site.domain} 
                        className={`border-b border-zinc-800/50 hover:bg-zinc-800/30 transition ${
                          idx < 3 ? "bg-amber-500/5" : ""
                        }`}
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center justify-center">
                            {idx === 0 ? (
                              <Crown className="w-6 h-6 text-amber-400" />
                            ) : idx === 1 ? (
                              <Medal className="w-6 h-6 text-zinc-300" />
                            ) : idx === 2 ? (
                              <Medal className="w-6 h-6 text-amber-700" />
                            ) : (
                              <span className="text-zinc-500 font-mono">{idx + 1}</span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <Link 
                            href={`/ai-profile/${encodeURIComponent(site.domain)}`}
                            className="flex items-center gap-2 text-white hover:text-emerald-400 transition"
                          >
                            <span className="font-medium">{site.domain}</span>
                            <ExternalLink className="w-3 h-3 opacity-50" />
                          </Link>
                          {site.category && (
                            <span className="text-xs text-zinc-600">{site.category}</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className="text-white font-mono text-lg">{site.totalMentions}</span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <Badge 
                            variant="outline" 
                            className={`${
                              site.weeklyMentions > 0 
                                ? "border-emerald-500/50 text-emerald-400" 
                                : "border-zinc-700 text-zinc-500"
                            }`}
                          >
                            {site.weeklyMentions > 0 ? `+${site.weeklyMentions}` : "—"}
                          </Badge>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 bg-zinc-800 rounded-full h-2">
                              <div 
                                className="bg-emerald-500 h-2 rounded-full transition-all"
                                style={{ width: `${Math.min(site.mentionShare, 100)}%` }}
                              />
                            </div>
                            <span className="text-zinc-400 text-sm font-mono w-10">
                              {site.mentionShare}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="py-16 text-center">
              <Target className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                No data for this category yet
              </h3>
              <p className="text-zinc-400 mb-6">
                Be the first to track your {categoryName.toLowerCase()} tool!
              </p>
              <Link href="/signup">
                <Button className="bg-emerald-500 hover:bg-emerald-400 text-black">
                  Add Your Site
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
        
        {/* CTA */}
        <Card className="mt-8 bg-gradient-to-br from-emerald-500/10 to-zinc-900 border-emerald-500/30">
          <CardContent className="py-8">
            <div className="text-center max-w-xl mx-auto">
              <TrendingUp className="w-10 h-10 text-emerald-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-3">
                Want to climb the leaderboard?
              </h2>
              <p className="text-zinc-400 mb-6">
                CabbageSEO shows you exactly where to get listed to increase your AI visibility.
                Track your position and watch it grow.
              </p>
              <Link href="/signup">
                <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-black">
                  Start Tracking Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        
        {/* Footer Note */}
        <div className="mt-8 text-center">
          <p className="text-xs text-zinc-600">
            Rankings based on real AI responses from ChatGPT, Perplexity, and Google AI.
            Updated continuously. Powered by{" "}
            <Link href="/" className="text-emerald-500 hover:underline">
              CabbageSEO
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

// Generate static paths for common categories
export async function generateStaticParams() {
  return [
    { category: "all" },
    ...CATEGORIES.map(cat => ({ category: cat })),
  ];
}

