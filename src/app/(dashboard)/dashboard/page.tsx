"use client";

/**
 * AI REVENUE INTELLIGENCE DASHBOARD
 * 
 * Every screen answers: "Where is AI sending money instead of me?"
 * 
 * NO citations. NO GEO scores.
 * Only: Money lost. Competitors winning. What to fix.
 */

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search, 
  RefreshCw,
  Clock,
  AlertCircle,
  CheckCircle2,
  Plus,
  XCircle,
  Trophy,
  TrendingDown,
  TrendingUp,
  DollarSign,
  Users,
  Target,
  Lock,
  ArrowRight,
  Zap,
  AlertTriangle,
  Globe,
  ExternalLink,
  Share2
} from "lucide-react";
import { useSite } from "@/context/site-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TRIAL_DAYS } from "@/lib/billing/citation-plans";

// Types
interface CompetitiveResult {
  platform: string;
  cited: boolean;
  query: string;
  snippet?: string;
  confidence: number;
  error?: string;
  competitors: string[];
  isLoss: boolean;
  lossMessage?: string;
  buyerIntent: number;
  estimatedValue: number;
  estimatedValueFormatted: string;
}

interface RevenueIntelligence {
  aiMarketShare: number;
  totalQueriesChecked: number;
  queriesWon: number;
  queriesLost: number;
  estimatedMonthlyLoss: number;
  estimatedMonthlyLossFormatted: string;
  topCompetitors: string[];
  category: string | null;
}

interface TrustSource {
  domain: string;
  name: string;
  trustScore: number;
  howToGetListed: string;
}

interface DistributionIntelligence {
  sourcesFound: number;
  sourcesMentioningCompetitors: string[];
  knownTrustSources: TrustSource[];
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const { 
    organization,
    trial,
    loading, 
    error, 
    currentSite, 
    refreshData 
  } = useSite();
  
  const [checking, setChecking] = useState(false);
  const [checkResults, setCheckResults] = useState<CompetitiveResult[] | null>(null);
  const [revenueIntel, setRevenueIntel] = useState<RevenueIntelligence | null>(null);
  const [distributionIntel, setDistributionIntel] = useState<DistributionIntelligence | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);

  const justSignedUp = searchParams.get("welcome") === "true";
  const plan = organization?.plan || "free";
  const isPaid = plan !== "free";
  const isTrialExpired = plan === "free" && trial?.expired;

  // Handle the main check
  const handleCheck = async () => {
    if (!currentSite) return;
    
    setChecking(true);
    setCheckResults(null);
    setRevenueIntel(null);
    setDistributionIntel(null);
    setShowPaywall(false);
    
    try {
      const res = await fetch("/api/geo/citations/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          siteId: currentSite.id, 
          domain: currentSite.domain 
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setCheckResults(data.results);
        setRevenueIntel(data.revenueIntelligence);
        setDistributionIntel(data.distributionIntelligence);
        
        // If free user has losses, show paywall after revealing the pain
        if (!isPaid && data.revenueIntelligence?.queriesLost > 0) {
          setTimeout(() => setShowPaywall(true), 2000);
        }
      }
      
      await refreshData();
    } catch (err) {
      console.error("Check failed:", err);
    } finally {
      setChecking(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Loading revenue intelligence...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-4" />
          <p className="text-zinc-400">{error}</p>
          <Button onClick={refreshData} className="mt-4">Try Again</Button>
        </div>
            </div>
    );
  }

  // Trial expired
  if (isTrialExpired) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="max-w-md text-center bg-zinc-900 rounded-2xl p-8 border border-red-500/30">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
            <DollarSign className="w-8 h-8 text-red-400" />
            </div>
          <h2 className="text-2xl font-bold text-white mb-3">
            You&apos;re Flying Blind
          </h2>
          <p className="text-zinc-400 mb-6">
            AI is sending customers to your competitors right now. Without visibility, you&apos;re losing money every day.
          </p>
          <Link href="/settings/billing">
            <Button className="bg-emerald-500 hover:bg-emerald-400 text-black w-full">
              See Where Your Money Is Going — $29/mo
            </Button>
          </Link>
              </div>
            </div>
    );
  }

  // No sites yet
  if (!currentSite) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
            <TrendingDown className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">
            Is AI Sending Buyers To Your Competitors?
          </h2>
          <p className="text-zinc-400 mb-6">
            Enter your website to see where AI is sending money in your market — and how much you&apos;re losing.
          </p>
          <AddSiteForm />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center py-4">
        <h1 className="text-2xl font-bold text-white mb-1">
          {currentSite.domain}
        </h1>
        <p className="text-sm text-zinc-500">AI Revenue Intelligence</p>
        </div>

      {/* Usage-based urgency - "X checks remaining" */}
      {plan === "free" && (
        <div className="bg-gradient-to-r from-red-500/10 to-amber-500/10 border border-red-500/30 rounded-xl p-4">
          <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-4 border-red-500/30 flex items-center justify-center">
                  <span className="text-xl font-bold text-red-400">3</span>
                </div>
              </div>
              <div>
                <p className="text-red-400 font-medium">
                  3 checks remaining
                </p>
                <p className="text-sm text-zinc-500">
                  See who&apos;s stealing your AI recommendations before you run out
                </p>
              </div>
            </div>
            <Link href="/settings/billing">
              <Button size="sm" className="bg-emerald-500 hover:bg-emerald-400 text-black font-medium">
                Get Unlimited
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* The Big Check Button - Before results */}
      {!checkResults && (
        <Card className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-zinc-800">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
              <DollarSign className="w-10 h-10 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">
              Where Is AI Sending Your Customers?
            </h2>
            <p className="text-zinc-400 mb-6 max-w-md mx-auto">
              See which competitors AI recommends instead of you — and how much revenue you&apos;re losing.
            </p>
            <Button
          onClick={handleCheck}
              disabled={checking}
              size="lg"
              className="bg-emerald-500 hover:bg-emerald-400 text-black px-8"
            >
              {checking ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Analyzing AI Recommendations...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5 mr-2" />
                  Find Where Money Is Going
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* RESULTS - Revenue Intelligence */}
      {checkResults && revenueIntel && (
        <div className="space-y-6">
          {/* AI Visibility Stats - Truth-based metrics only */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* High-Intent Queries Missed */}
            <Card className={`col-span-2 border ${revenueIntel.queriesLost > 0 ? "bg-red-500/5 border-red-500/30" : "bg-emerald-500/5 border-emerald-500/30"}`}>
            <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className={`w-5 h-5 ${revenueIntel.queriesLost > 0 ? "text-red-400" : "text-emerald-400"}`} />
                  <span className="text-sm text-zinc-500">High-Intent Queries Missed</span>
                </div>
                <div className={`text-4xl font-bold ${revenueIntel.queriesLost > 0 ? "text-red-400" : "text-emerald-400"}`}>
                  {revenueIntel.queriesLost}
                </div>
                <p className="text-sm text-zinc-500 mt-1">
                  Buyer-intent queries where AI recommends competitors
                </p>
            </CardContent>
          </Card>

            {/* AI Mention Share (tracked queries only) */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-zinc-500" />
                  <span className="text-xs text-zinc-500">AI Mention Share</span>
                </div>
                <div className="text-3xl font-bold text-white">
                  {revenueIntel.aiMarketShare}%
                </div>
                <p className="text-xs text-zinc-600 mt-1">of tracked queries</p>
                <div className="w-full bg-zinc-800 rounded-full h-2 mt-2">
                  <div 
                    className="bg-emerald-500 h-2 rounded-full transition-all"
                    style={{ width: `${revenueIntel.aiMarketShare}%` }}
                  />
                  </div>
            </CardContent>
          </Card>

            {/* Queries Where You Appeared */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-zinc-500">AI Mentioned You</span>
                </div>
            <div className="text-3xl font-bold text-white">
                  {revenueIntel.queriesWon}
                  <span className="text-lg text-zinc-500">/{revenueIntel.totalQueriesChecked}</span>
                </div>
            </CardContent>
          </Card>
        </div>

          {/* MOMENTUM - Show progress (retention engine) */}
          {revenueIntel.queriesWon > 0 && (
            <div className="bg-gradient-to-r from-emerald-500/10 to-violet-500/10 border border-emerald-500/30 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium flex items-center gap-2">
                      <span className="text-emerald-400">+{revenueIntel.queriesWon}</span> AI recommendations found!
                    </p>
                    <p className="text-sm text-zinc-500">
                      AI platforms are mentioning you. Keep tracking to see growth.
                    </p>
                  </div>
                </div>
                {isPaid && revenueIntel.queriesWon >= 3 && (
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50">
                    🔥 Gaining momentum
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* WHO IS AI RECOMMENDING - Real data from AI responses */}
          {revenueIntel.queriesLost > 0 && (
            <Card className="bg-gradient-to-br from-red-500/5 to-zinc-900 border-red-500/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-red-400" />
                  What AI Actually Said
                </CardTitle>
                <p className="text-xs text-zinc-500 mt-1">
                  Real responses from AI platforms. No estimates or guesses.
                </p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-800">
                        <th className="text-left py-3 text-sm font-medium text-zinc-400">Query Asked</th>
                        <th className="text-left py-3 text-sm font-medium text-zinc-400">Products AI Mentioned</th>
                        <th className="text-center py-3 text-sm font-medium text-zinc-400">Mentioned You?</th>
                        <th className="text-right py-3 text-sm font-medium text-zinc-400">Intent Level</th>
                      </tr>
                    </thead>
                    <tbody>
                      {checkResults
                        .filter(r => !r.error)
                        .sort((a, b) => b.buyerIntent - a.buyerIntent)
                        .map((result, idx) => (
                          <tr key={idx} className="border-b border-zinc-800/50">
                            <td className="py-4">
                              <p className="text-white text-sm">&ldquo;{result.query}&rdquo;</p>
                              <span className="text-xs text-zinc-600">{result.platform}</span>
                            </td>
                            <td className="py-4">
                              <div className="flex flex-wrap gap-1">
                                {result.competitors.length > 0 ? (
                                  result.competitors.slice(0, 3).map((comp, i) => (
                                    <Badge key={i} className="bg-zinc-800 text-zinc-300 border-0 text-xs">
                                      {comp}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-zinc-500 text-sm">No specific products detected</span>
                                )}
                              </div>
                            </td>
                            <td className="py-4 text-center">
                              {result.cited ? (
                                <div className="flex flex-col items-center">
                                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                  <span className="text-xs text-emerald-400 mt-1">Yes</span>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center">
                                  <XCircle className="w-5 h-5 text-red-400" />
                                  <span className="text-xs text-red-400 mt-1">No</span>
                                </div>
                              )}
                            </td>
                            <td className="py-4 text-right">
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${
                                  result.buyerIntent >= 0.8 
                                    ? "border-amber-500/50 text-amber-400 bg-amber-500/10" 
                                    : result.buyerIntent >= 0.5
                                      ? "border-zinc-600 text-zinc-400"
                                      : "border-zinc-700 text-zinc-500"
                                }`}
                              >
                                {result.buyerIntent >= 0.8 ? "High" : result.buyerIntent >= 0.5 ? "Medium" : "Low"}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TOP COMPETITORS */}
          {revenueIntel.topCompetitors.length > 0 && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  Who&apos;s Winning Your Market
                </CardTitle>
          </CardHeader>
          <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {revenueIntel.topCompetitors.map((comp, idx) => (
                    <div 
                      key={idx}
                      className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700 text-center"
                    >
                      <div className="text-sm font-medium text-white">{comp}</div>
                      <div className="text-xs text-amber-400 mt-1">Recommended by AI</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI TRUST MAP - Where you need to be listed */}
          {distributionIntel && distributionIntel.knownTrustSources.length > 0 && (
            <Card className="bg-gradient-to-br from-violet-500/5 to-zinc-900 border-violet-500/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Globe className="w-5 h-5 text-violet-400" />
                  Where AI Gets Its Information
                </CardTitle>
                <p className="text-sm text-zinc-500 mt-1">
                  Get listed → AI finds you → You get recommended. Track your progress.
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {distributionIntel.knownTrustSources.slice(0, 5).map((source, idx) => {
                    const isCompetitorSource = distributionIntel.sourcesMentioningCompetitors.includes(source.name);
                    return (
                <div 
                  key={idx}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          isCompetitorSource 
                            ? "bg-red-500/10 border border-red-500/30" 
                            : "bg-zinc-800/50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            isCompetitorSource ? "bg-red-500/20" : "bg-violet-500/20"
                          }`}>
                            <span className="text-lg">{source.trustScore >= 9 ? "⭐" : "📍"}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-white font-medium">{source.name}</span>
                              {isCompetitorSource && (
                                <Badge className="bg-red-500/20 text-red-400 text-xs">
                                  Competitors here
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-zinc-500">{source.domain}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded ${
                            source.trustScore >= 9 
                              ? "bg-amber-500/20 text-amber-400" 
                              : "bg-zinc-700 text-zinc-400"
                          }`}>
                            Trust: {source.trustScore}/10
                    </span>
                          {isPaid ? (
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-xs border-zinc-600 text-zinc-400 hover:border-violet-500 hover:text-violet-400"
                                onClick={() => alert(source.howToGetListed)}
                              >
                                How to
                              </Button>
                              <Button 
                                size="sm" 
                                className="text-xs bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border-0"
                                onClick={async () => {
                                  if (!currentSite) return;
                                  try {
                                    const res = await fetch("/api/sites/listings", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ 
                                        siteId: currentSite.id, 
                                        sourceDomain: source.domain 
                                      }),
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      alert(`✅ Marked as listed on ${source.name}! We'll track your AI gains from this source.`);
                                    }
                                  } catch (e) {
                                    console.error(e);
                                  }
                                }}
                              >
                                ✓ I&apos;m listed
                              </Button>
                            </div>
                          ) : (
                            <Lock className="w-4 h-4 text-zinc-600" />
                    )}
                  </div>
                      </div>
                    );
                  })}
                </div>
                
                {!isPaid && (
                  <div className="mt-4 p-4 rounded-lg bg-violet-500/10 border border-violet-500/30 text-center">
                    <p className="text-violet-400 text-sm mb-2">
                      🔒 Upgrade to track your listings and see AI gains
                    </p>
                    <Link href="/settings/billing">
                      <Button size="sm" className="bg-violet-500 hover:bg-violet-400 text-white">
                        Unlock Impact Tracking
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* THE PAYWALL - After showing the loss (emotional impact) */}
          {showPaywall && (
            <Card className="bg-gradient-to-br from-red-500/10 via-zinc-900 to-emerald-500/10 border-red-500/30">
              <CardContent className="pt-8 pb-8 text-center">
                {/* Loss visual */}
                <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6 animate-pulse">
                  <AlertTriangle className="w-10 h-10 text-red-400" />
                </div>
                
                {/* Loss headline - emotional impact */}
                <h2 className="text-3xl font-bold text-white mb-4">
                  AI Is Sending Buyers to Your Competitors
                </h2>
                
                {/* Specific loss data */}
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6 max-w-md mx-auto">
                  <p className="text-red-400 font-medium">
                    You&apos;re invisible in <span className="text-2xl font-bold">{revenueIntel.queriesLost}</span> high-intent queries
                  </p>
                  <p className="text-zinc-500 text-sm mt-1">
                    Every day, buyers ask AI for recommendations — and AI sends them to your competitors.
                  </p>
                </div>
                
                {/* What they get */}
                <div className="text-left max-w-md mx-auto mb-6">
                  <p className="text-white font-medium mb-3">See exactly how to fix this:</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Which sources AI trusts (G2, Capterra, Product Hunt...)</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-400">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Step-by-step guides to get listed</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-400">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Track when AI starts recommending you</span>
                    </div>
                  </div>
              </div>
                
                {/* CTA - Loss-based copy */}
                <div className="space-y-3">
                  <Link href="/settings/billing">
                    <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-black w-full font-bold">
                      Stop Losing AI Recommendations — $29/mo
                      <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
                  <p className="text-xs text-zinc-600">
                    Cancel anytime • See results in days, not months
                  </p>
            </div>
          </CardContent>
        </Card>
      )}

          {/* ONE-CLICK FIX - For paid users */}
          {isPaid && revenueIntel.queriesLost > 0 && (
            <Card className="bg-gradient-to-br from-emerald-500/5 to-zinc-900 border-emerald-500/20">
            <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-emerald-400" />
                  One-Click Fix
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-zinc-400 mb-4">
                  Generate content outlines to win back these recommendations:
                </p>
                <div className="space-y-2">
                  {checkResults
                    .filter(r => !r.cited && !r.error)
                    .slice(0, 3)
                    .map((result, idx) => (
                      <div 
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50"
                      >
                        <div>
                          <p className="text-white text-sm">&ldquo;{result.query}&rdquo;</p>
                          <p className="text-red-400 text-xs">Losing {result.estimatedValueFormatted}/mo</p>
              </div>
                        <Link href={`/intelligence?fix=${encodeURIComponent(result.query)}`}>
                          <Button size="sm" variant="outline" className="border-emerald-500/50 text-emerald-400">
                            Generate Fix
                          </Button>
                        </Link>
            </div>
                    ))}
                </div>
        </CardContent>
      </Card>
          )}

          {/* Actions - Share & Run Again */}
          <div className="flex items-center justify-center gap-4">
            {/* Share Button */}
            {currentSite && revenueIntel && revenueIntel.queriesWon > 0 && (
              <Button
                variant="outline"
                className="border-emerald-500/50 text-emerald-400"
                onClick={() => {
                  const shareUrl = `${window.location.origin}/ai-profile/${encodeURIComponent(currentSite.domain)}`;
                  navigator.clipboard.writeText(shareUrl);
                  alert("Share link copied! 🎉\n\n" + shareUrl);
                }}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share Your Wins
              </Button>
            )}
            
            <Button
              onClick={handleCheck}
              disabled={checking}
              variant="outline"
              className="border-zinc-700"
            >
              {checking ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Run Another Check
                </>
              )}
            </Button>
        </div>

          {/* View Public Profile Link */}
          {currentSite && (
            <div className="text-center mt-4">
              <Link 
                href={`/ai-profile/${encodeURIComponent(currentSite.domain)}`}
                target="_blank"
                className="text-sm text-zinc-500 hover:text-emerald-400 transition inline-flex items-center gap-1"
              >
                View your public AI profile
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
            )}
          </div>
      )}
    </div>
  );
}

// Business categories for query optimization
const BUSINESS_CATEGORIES = [
  { value: "", label: "Select your market" },
  { value: "productivity", label: "Productivity & SaaS" },
  { value: "crm", label: "CRM & Sales" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "marketing", label: "Marketing & SEO" },
  { value: "design", label: "Design & Creative" },
  { value: "development", label: "Development & DevOps" },
  { value: "analytics", label: "Analytics & BI" },
  { value: "communication", label: "Communication" },
  { value: "finance", label: "Finance & Accounting" },
  { value: "education", label: "Education" },
];

function AddSiteForm() {
  const [domain, setDomain] = useState("");
  const [category, setCategory] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const { addSite } = useSite();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain.trim()) return;

    setAdding(true);
    setError("");

    try {
      const result = await addSite(domain, category || undefined);
      if (!result) {
        setError("Failed to add site");
      }
    } catch (err) {
      setError("Failed to add site");
    } finally {
      setAdding(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm mx-auto">
      <div>
        <input
          type="text"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="yoursite.com"
          className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 text-center"
        />
      </div>
      <div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
        >
          {BUSINESS_CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value} className="bg-zinc-900">
              {cat.label}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="text-sm text-red-400 text-center">{error}</p>}
      <Button 
        type="submit" 
        disabled={adding || !domain.trim()}
        className="w-full bg-emerald-500 hover:bg-emerald-400 text-black"
      >
        {adding ? "Analyzing..." : "See Where Money Is Going →"}
      </Button>
    </form>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
