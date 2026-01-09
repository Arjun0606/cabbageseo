/**
 * Public AI Profile Page
 * 
 * The viral surface that drives distribution.
 * Shows AI mention share for any domain - publicly accessible.
 * 
 * This page ranks for "[domain] AI recommendations" queries
 * and brings competitors, the domain owner, and everyone in the market.
 */

import { Metadata } from "next";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Target, 
  TrendingUp, 
  Search, 
  ExternalLink,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Share2,
  Trophy
} from "lucide-react";

interface PageProps {
  params: Promise<{ domain: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { domain } = await params;
  const cleanDomain = decodeURIComponent(domain).replace(/^www\./, "");
  
  return {
    title: `${cleanDomain} AI Visibility Report | CabbageSEO`,
    description: `See how often AI platforms like ChatGPT, Perplexity, and Google AI recommend ${cleanDomain}. Track AI mention share and visibility.`,
    openGraph: {
      title: `${cleanDomain} - AI Recommendation Report`,
      description: `Is ${cleanDomain} being recommended by AI? See the data.`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${cleanDomain} AI Visibility`,
      description: `See how AI platforms recommend ${cleanDomain}`,
    },
  };
}

interface SiteData {
  id: string;
  domain: string;
  category: string | null;
  total_citations: number | null;
  geo_score_avg: number | null;
  last_checked_at: string | null;
}

interface CitationData {
  query: string;
  platform: string;
  confidence: string;
  cited_at: string;
}

interface SnapshotData {
  market_share: number;
  total_queries: number;
  queries_won: number;
  queries_lost: number;
  snapshot_date: string;
}

interface CompetitorData {
  domain: string;
  total_citations: number | null;
}

async function getPublicProfileData(domain: string) {
  const supabase = createServiceClient();
  const cleanDomain = domain.replace(/^www\./, "").toLowerCase();
  
  // Find site by domain
  const { data: siteData } = await supabase
    .from("sites")
    .select("id, domain, category, total_citations, geo_score_avg, last_checked_at")
    .ilike("domain", `%${cleanDomain}%`)
    .single();
  
  const site = siteData as SiteData | null;
  
  if (!site) {
    return null;
  }
  
  // Get recent citations (public data only)
  const { data: citationsData } = await supabase
    .from("citations")
    .select("query, platform, confidence, cited_at")
    .eq("site_id", site.id)
    .order("cited_at", { ascending: false })
    .limit(20);
  
  const citations = (citationsData || []) as CitationData[];
  
  // Get market share snapshot
  const { data: snapshotData } = await supabase
    .from("market_share_snapshots")
    .select("market_share, total_queries, queries_won, queries_lost, snapshot_date")
    .eq("site_id", site.id)
    .order("snapshot_date", { ascending: false })
    .limit(1)
    .single();
  
  const snapshot = snapshotData as SnapshotData | null;
  
  // Get competitors for context
  const { data: competitorsData } = await supabase
    .from("competitors")
    .select("domain, total_citations")
    .eq("site_id", site.id)
    .order("total_citations", { ascending: false })
    .limit(5);
  
  const competitors = (competitorsData || []) as CompetitorData[];
  
  return {
    site: {
      domain: site.domain,
      category: site.category,
      totalCitations: site.total_citations || 0,
      aiVisibilityScore: site.geo_score_avg || 0,
      lastChecked: site.last_checked_at,
    },
    citations,
    marketShare: snapshot ? {
      share: snapshot.market_share,
      totalQueries: snapshot.total_queries,
      queriesWon: snapshot.queries_won,
      queriesLost: snapshot.queries_lost,
      date: snapshot.snapshot_date,
    } : null,
    competitors: competitors.map(c => ({
      domain: c.domain,
      citations: c.total_citations || 0,
    })),
  };
}

export default async function PublicAIProfilePage({ params }: PageProps) {
  const { domain } = await params;
  const cleanDomain = decodeURIComponent(domain).replace(/^www\./, "");
  const data = await getPublicProfileData(cleanDomain);
  
  // If no data, show a "claim this profile" page
  if (!data) {
    return (
      <div className="min-h-screen bg-black">
        {/* Header */}
        <header className="border-b border-zinc-800">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <img src="/apple-touch-icon.png" alt="CabbageSEO" className="h-8 w-8 rounded-lg" />
              <span className="font-bold text-white">CabbageSEO</span>
            </Link>
            <Link href="/signup">
              <Button className="bg-emerald-500 hover:bg-emerald-400 text-black">
                Track Your Site
              </Button>
            </Link>
          </div>
        </header>
        
        <main className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center mx-auto">
              <Search className="w-10 h-10 text-zinc-600" />
            </div>
            
            <h1 className="text-4xl font-bold text-white">
              {cleanDomain}
            </h1>
            
            <p className="text-xl text-zinc-400">
              We don&apos;t have AI visibility data for this domain yet.
            </p>
            
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 max-w-xl mx-auto">
              <h2 className="text-xl font-semibold text-white mb-4">
                Is this your site?
              </h2>
              <p className="text-zinc-400 mb-6">
                Start tracking how AI platforms like ChatGPT, Perplexity, and Google AI 
                recommend your site versus competitors.
              </p>
              <Link href={`/signup?domain=${encodeURIComponent(cleanDomain)}`}>
                <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-black w-full">
                  Claim This Profile — Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
            
            <div className="pt-8 border-t border-zinc-800 mt-8">
              <p className="text-sm text-zinc-500">
                CabbageSEO tracks AI recommendations across ChatGPT, Perplexity, and Google AI.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }
  
  const { site, citations, marketShare, competitors } = data;
  
  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/apple-touch-icon.png" alt="CabbageSEO" className="h-8 w-8 rounded-lg" />
            <span className="font-bold text-white">CabbageSEO</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-400">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Link href="/signup">
              <Button className="bg-emerald-500 hover:bg-emerald-400 text-black">
                Track Your Site
              </Button>
            </Link>
          </div>
        </div>
      </header>
      
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                {site.domain}
              </h1>
              {site.category && (
                <Badge variant="outline" className="border-zinc-700 text-zinc-400">
                  {site.category}
                </Badge>
              )}
            </div>
            
            {/* AI Mention Share Badge */}
            {marketShare && (
              <div className="text-right">
                <div className="text-5xl font-bold text-emerald-400">
                  {marketShare.share}%
                </div>
                <p className="text-sm text-zinc-500">AI Mention Share</p>
                <p className="text-xs text-zinc-600">of tracked queries</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-zinc-500">Total AI Mentions</span>
              </div>
              <div className="text-3xl font-bold text-white">
                {site.totalCitations}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-zinc-500" />
                <span className="text-xs text-zinc-500">AI Visibility Score</span>
              </div>
              <div className="text-3xl font-bold text-white">
                {site.aiVisibilityScore || "—"}
              </div>
            </CardContent>
          </Card>
          
          {marketShare && (
            <>
              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs text-zinc-500">Queries Won</span>
                  </div>
                  <div className="text-3xl font-bold text-white">
                    {marketShare.queriesWon}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="w-4 h-4 text-red-400" />
                    <span className="text-xs text-zinc-500">Queries Lost</span>
                  </div>
                  <div className="text-3xl font-bold text-white">
                    {marketShare.queriesLost}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Recent AI Mentions */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Search className="w-5 h-5 text-emerald-400" />
                Recent AI Mentions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {citations.length > 0 ? (
                <div className="space-y-3">
                  {citations.slice(0, 8).map((citation, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                      <div>
                        <p className="text-white text-sm">&ldquo;{citation.query}&rdquo;</p>
                        <p className="text-xs text-zinc-500 mt-1">{citation.platform}</p>
                      </div>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-zinc-500 text-center py-8">
                  No AI mentions tracked yet
                </p>
              )}
            </CardContent>
          </Card>
          
          {/* Competitors */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                Top Competitors (by AI mentions)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {competitors.length > 0 ? (
                <div className="space-y-3">
                  {competitors.map((comp, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                      <Link 
                        href={`/ai-profile/${encodeURIComponent(comp.domain)}`}
                        className="text-white text-sm hover:text-emerald-400 transition flex items-center gap-2"
                      >
                        {comp.domain}
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                      <Badge variant="outline" className="border-zinc-700 text-zinc-400">
                        {comp.citations} mentions
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-zinc-500 text-center py-8">
                  No competitor data available
                </p>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* CTA - Claim or Track */}
        <Card className="mt-8 bg-gradient-to-br from-emerald-500/10 to-zinc-900 border-emerald-500/30">
          <CardContent className="py-8">
            <div className="text-center max-w-xl mx-auto">
              <h2 className="text-2xl font-bold text-white mb-3">
                Is this your site?
              </h2>
              <p className="text-zinc-400 mb-6">
                Get deeper insights, track more queries, and see exactly how to increase 
                your AI visibility. Free to start.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href={`/signup?domain=${encodeURIComponent(site.domain)}`}>
                  <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-black">
                    Claim This Profile
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link href={`/leaderboard/${encodeURIComponent(site.category || "all")}`}>
                  <Button size="lg" variant="outline" className="border-zinc-700 text-zinc-300">
                    View Category Leaderboard
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Powered By */}
        <div className="mt-8 text-center">
          <p className="text-xs text-zinc-600">
            AI visibility data powered by{" "}
            <Link href="/" className="text-emerald-500 hover:underline">
              CabbageSEO
            </Link>
            {" "}• Updated {site.lastChecked ? new Date(site.lastChecked).toLocaleDateString() : "recently"}
          </p>
        </div>
      </main>
    </div>
  );
}

