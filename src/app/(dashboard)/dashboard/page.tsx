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
  DollarSign,
  Users,
  Target,
  Lock,
  ArrowRight,
  Zap,
  AlertTriangle
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

      {/* Trial warning */}
      {plan === "free" && trial && !trial.expired && (
        <div className="bg-gradient-to-r from-red-500/10 to-amber-500/10 border border-red-500/30 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <div>
                <p className="text-red-400 font-medium">
                  {trial.daysRemaining} days left to see where money is going
                </p>
                <p className="text-sm text-zinc-500">
                  After trial, you&apos;ll lose visibility into competitor wins
                </p>
              </div>
            </div>
            <Link href="/settings/billing">
              <Button size="sm" className="bg-red-500 hover:bg-red-400 text-white">
                Keep Access
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
          {/* The Money Stats - Lead with loss */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Estimated Loss - BIGGEST */}
            <Card className={`col-span-2 border ${revenueIntel.estimatedMonthlyLoss > 0 ? "bg-red-500/5 border-red-500/30" : "bg-emerald-500/5 border-emerald-500/30"}`}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className={`w-5 h-5 ${revenueIntel.estimatedMonthlyLoss > 0 ? "text-red-400" : "text-emerald-400"}`} />
                  <span className="text-sm text-zinc-500">Est. Monthly Revenue Loss</span>
                </div>
                <div className={`text-4xl font-bold ${revenueIntel.estimatedMonthlyLoss > 0 ? "text-red-400" : "text-emerald-400"}`}>
                  {revenueIntel.estimatedMonthlyLoss > 0 ? "-" : ""}{revenueIntel.estimatedMonthlyLossFormatted}
                </div>
                <p className="text-sm text-zinc-500 mt-1">
                  Going to competitors instead of you
                </p>
              </CardContent>
            </Card>
            
            {/* AI Market Share */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-zinc-500" />
                  <span className="text-xs text-zinc-500">AI Market Share</span>
                </div>
                <div className="text-3xl font-bold text-white">
                  {revenueIntel.aiMarketShare}%
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-2 mt-2">
                  <div 
                    className="bg-emerald-500 h-2 rounded-full transition-all"
                    style={{ width: `${revenueIntel.aiMarketShare}%` }}
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Queries Lost */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-4 h-4 text-red-400" />
                  <span className="text-xs text-zinc-500">Queries Lost</span>
                </div>
                <div className="text-3xl font-bold text-white">
                  {revenueIntel.queriesLost}
                  <span className="text-lg text-zinc-500">/{revenueIntel.totalQueriesChecked}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* WHO IS AI RECOMMENDING - The Competition Table */}
          {revenueIntel.queriesLost > 0 && (
            <Card className="bg-gradient-to-br from-red-500/5 to-zinc-900 border-red-500/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-red-400" />
                  Who AI Is Recommending Instead Of You
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-800">
                        <th className="text-left py-3 text-sm font-medium text-zinc-400">Query</th>
                        <th className="text-left py-3 text-sm font-medium text-zinc-400">AI Recommends</th>
                        <th className="text-center py-3 text-sm font-medium text-zinc-400">You?</th>
                        <th className="text-right py-3 text-sm font-medium text-zinc-400">Est. Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {checkResults
                        .filter(r => !r.error)
                        .sort((a, b) => b.estimatedValue - a.estimatedValue)
                        .map((result, idx) => (
                          <tr key={idx} className="border-b border-zinc-800/50">
                            <td className="py-4">
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${
                                    result.buyerIntent >= 0.8 
                                      ? "border-amber-500/50 text-amber-400" 
                                      : "border-zinc-700 text-zinc-500"
                                  }`}
                                >
                                  {result.buyerIntent >= 0.8 ? "High Intent" : "Med Intent"}
                                </Badge>
                              </div>
                              <p className="text-white mt-1 text-sm">&ldquo;{result.query}&rdquo;</p>
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
                                  <span className="text-zinc-500 text-sm">No specific products</span>
                                )}
                              </div>
                            </td>
                            <td className="py-4 text-center">
                              {result.cited ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto" />
                              ) : (
                                <XCircle className="w-5 h-5 text-red-400 mx-auto" />
                              )}
                            </td>
                            <td className="py-4 text-right">
                              <span className={`font-medium ${result.cited ? "text-emerald-400" : "text-red-400"}`}>
                                {result.cited ? "+" : "-"}{result.estimatedValueFormatted}
                              </span>
                              <span className="text-zinc-500 text-xs">/mo</span>
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

          {/* THE PAYWALL - After showing the pain */}
          {showPaywall && (
            <Card className="bg-gradient-to-br from-emerald-500/10 to-zinc-900 border-emerald-500/30">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                  <Lock className="w-8 h-8 text-emerald-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">
                  Get The Fix
                </h2>
                <p className="text-zinc-400 mb-2">
                  You&apos;re losing <span className="text-red-400 font-bold">{revenueIntel.estimatedMonthlyLossFormatted}/mo</span> to competitors.
                </p>
                <p className="text-zinc-400 mb-6">
                  Upgrade to see exactly what to publish to win these recommendations.
                </p>
                <div className="space-y-3">
                  <Link href="/settings/billing">
                    <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-black w-full">
                      Unlock AI Revenue Intelligence — $29/mo
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                  <p className="text-sm text-zinc-500">
                    Includes: Competitor analysis • Content fixes • Weekly revenue reports
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

          {/* Run Again */}
          <div className="text-center">
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
