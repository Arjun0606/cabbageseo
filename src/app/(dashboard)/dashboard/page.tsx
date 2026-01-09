"use client";

/**
 * AI Search War Room - Tension-First Dashboard
 * 
 * The key insight: People don't pay for data, they pay for "what should I do?"
 * 
 * This dashboard shows:
 * 1. LOSSES first (creates fear)
 * 2. WHY you lost (creates understanding)  
 * 3. HOW to win (creates action)
 * 4. PAYWALL after first loss reveal (captures peak emotion)
 */

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search, 
  TrendingUp,
  RefreshCw,
  ChevronRight,
  Zap,
  Clock,
  AlertCircle,
  CheckCircle2,
  Plus,
  XCircle,
  Target,
  Trophy,
  Swords,
  Lock,
  ArrowRight,
  Lightbulb,
  TrendingDown
} from "lucide-react";
import { useSite } from "@/context/site-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TRIAL_DAYS } from "@/lib/billing/citation-plans";

// Types
interface CheckResult {
  platform: string;
  cited: boolean;
  query: string;
  snippet?: string;
  error?: string;
}

interface LossAnalysis {
  query: string;
  platform: string;
  whyNotYou: string[];
  actionItems: string[];
  loading?: boolean;
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const { 
    organization,
    trial,
    loading, 
    error, 
    currentSite, 
    runCheck, 
    refreshData 
  } = useSite();
  
  const [checking, setChecking] = useState(false);
  const [checkResults, setCheckResults] = useState<{
    results: CheckResult[];
    summary: { citedCount: number; apisCalled: number; queriesChecked?: number };
  } | null>(null);
  const [lossAnalysis, setLossAnalysis] = useState<LossAnalysis | null>(null);
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
    setLossAnalysis(null);
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
      
      const result = await res.json();
      
      if (result.results) {
        setCheckResults({
          results: result.results,
          summary: result.summary,
        });
        
        // Find first loss to analyze
        const firstLoss = result.results.find((r: CheckResult) => !r.cited && !r.error);
        
        if (firstLoss) {
          // Show loss first, then analyze
          setLossAnalysis({
            query: firstLoss.query,
            platform: firstLoss.platform,
            whyNotYou: [],
            actionItems: [],
            loading: true,
          });
          
          // Get the "Why Not You" analysis
          if (isPaid) {
            await analyzeLoss(firstLoss.query, firstLoss.platform);
          } else {
            // For free users, show teaser then paywall
            setTimeout(() => {
              setLossAnalysis(prev => prev ? {
                ...prev,
                loading: false,
                whyNotYou: [
                  "Your site may be missing key authority signals",
                  "Competitors might have more specific content",
                  "...",
                ],
                actionItems: [],
              } : null);
              setShowPaywall(true);
            }, 1500);
          }
        }
      }
      
      await refreshData();
    } catch (err) {
      console.error("Check failed:", err);
    } finally {
      setChecking(false);
    }
  };

  // Analyze why we lost a query
  const analyzeLoss = async (query: string, platform: string) => {
    try {
      const res = await fetch("/api/geo/intelligence/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "gap-analysis",
          siteId: currentSite?.id,
          query,
        }),
      });
      
      const data = await res.json();
      
      if (data.success && data.data) {
        setLossAnalysis(prev => prev ? {
          ...prev,
          loading: false,
          whyNotYou: data.data.whyNotYou || [],
          actionItems: data.data.actionItems || [],
        } : null);
      } else {
        setLossAnalysis(prev => prev ? { ...prev, loading: false } : null);
      }
    } catch (err) {
      console.error("Analysis failed:", err);
      setLossAnalysis(prev => prev ? { ...prev, loading: false } : null);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Loading your war room...</p>
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
        <div className="max-w-md text-center bg-zinc-900 rounded-2xl p-8 border border-zinc-800">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
            <Swords className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">
            Your Competitors Are Winning
          </h2>
          <p className="text-zinc-400 mb-6">
            While you wait, AI is recommending your competitors. Upgrade to see what they&apos;re doing and how to beat them.
          </p>
          <Link href="/settings/billing">
            <Button className="bg-emerald-500 hover:bg-emerald-400 text-black w-full">
              Start Fighting Back → $29/mo
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
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
            <Target className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">
            Find Out If AI Is Recommending Your Competitors
          </h2>
          <p className="text-zinc-400 mb-6">
            Enter your website to see who&apos;s winning in AI search — and why it&apos;s not you.
          </p>
          <AddSiteForm />
        </div>
      </div>
    );
  }

  // Calculate wins and losses
  const wins = checkResults?.results.filter(r => r.cited).length || 0;
  const losses = checkResults?.results.filter(r => !r.cited && !r.error).length || 0;
  const totalChecked = checkResults?.results.filter(r => !r.error).length || 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* War Room Header */}
      <div className="text-center py-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Swords className="w-6 h-6 text-emerald-400" />
          <span className="text-sm font-medium text-emerald-400 uppercase tracking-wide">
            AI Search War Room
          </span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">
          {currentSite.domain}
        </h1>
        {currentSite.lastCheckedAt && (
          <p className="text-sm text-zinc-500">
            Last battle: {new Date(currentSite.lastCheckedAt).toLocaleString()}
          </p>
        )}
      </div>

      {/* Trial warning */}
      {plan === "free" && trial && !trial.expired && (
        <div className="bg-gradient-to-r from-amber-500/10 to-red-500/10 border border-amber-500/30 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-400" />
              <div>
                <p className="text-amber-400 font-medium">
                  {trial.daysRemaining} days until you lose visibility
                </p>
                <p className="text-sm text-zinc-500">
                  Competitors don&apos;t wait. Neither should you.
                </p>
              </div>
            </div>
            <Link href="/settings/billing">
              <Button size="sm" className="bg-amber-500 hover:bg-amber-400 text-black">
                Upgrade Now
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* The Big Check Button */}
      {!checkResults && (
        <Card className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-zinc-800">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">
              Run AI Search Battle Check
            </h2>
            <p className="text-zinc-400 mb-6 max-w-md mx-auto">
              See if ChatGPT, Perplexity, and Google AI are recommending your competitors instead of you.
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
                  Scanning AI Platforms...
                </>
              ) : (
                <>
                  <Swords className="w-5 h-5 mr-2" />
                  Start Battle Check
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Check Results - THE TENSION */}
      {checkResults && (
        <div className="space-y-6">
          {/* Battle Summary */}
          <div className="grid grid-cols-3 gap-4">
            <Card className={`border ${wins > 0 ? "bg-emerald-500/5 border-emerald-500/30" : "bg-zinc-900 border-zinc-800"}`}>
              <CardContent className="pt-6 text-center">
                <Trophy className={`w-8 h-8 mx-auto mb-2 ${wins > 0 ? "text-emerald-400" : "text-zinc-600"}`} />
                <div className="text-3xl font-bold text-white">{wins}</div>
                <p className="text-sm text-zinc-500">Wins</p>
              </CardContent>
            </Card>
            
            <Card className={`border ${losses > 0 ? "bg-red-500/5 border-red-500/30" : "bg-zinc-900 border-zinc-800"}`}>
              <CardContent className="pt-6 text-center">
                <TrendingDown className={`w-8 h-8 mx-auto mb-2 ${losses > 0 ? "text-red-400" : "text-zinc-600"}`} />
                <div className="text-3xl font-bold text-white">{losses}</div>
                <p className="text-sm text-zinc-500">Losses</p>
              </CardContent>
            </Card>
            
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="pt-6 text-center">
                <Target className="w-8 h-8 mx-auto mb-2 text-zinc-400" />
                <div className="text-3xl font-bold text-white">{totalChecked}</div>
                <p className="text-sm text-zinc-500">Battles</p>
              </CardContent>
            </Card>
          </div>

          {/* THE LOSSES - This is where we create tension */}
          {losses > 0 && (
            <Card className="bg-gradient-to-br from-red-500/5 to-zinc-900 border-red-500/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-400" />
                  You Lost These AI Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {checkResults.results
                  .filter(r => !r.cited && !r.error)
                  .map((result, idx) => (
                    <div 
                      key={idx}
                      className="p-4 rounded-xl bg-zinc-900/50 border border-red-500/20"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="border-red-500/50 text-red-400">
                              {result.platform === "google_aio" ? "Google AI" : 
                               result.platform === "chatgpt" ? "ChatGPT" : 
                               result.platform.charAt(0).toUpperCase() + result.platform.slice(1)}
                            </Badge>
                            <XCircle className="w-4 h-4 text-red-400" />
                            <span className="text-sm text-red-400">Not Cited</span>
                          </div>
                          <p className="text-white font-medium">
                            &ldquo;{result.query}&rdquo;
                          </p>
                          <p className="text-sm text-zinc-500 mt-1">
                            Someone else is getting this recommendation instead of you.
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>
          )}

          {/* THE ANALYSIS - Why you lost */}
          {lossAnalysis && (
            <Card className="bg-gradient-to-br from-amber-500/5 to-zinc-900 border-amber-500/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-amber-400" />
                  Why Not You?
                </CardTitle>
              </CardHeader>
              <CardContent>
                {lossAnalysis.loading ? (
                  <div className="flex items-center gap-3 py-4">
                    <RefreshCw className="w-5 h-5 text-amber-400 animate-spin" />
                    <span className="text-zinc-400">Analyzing why AI chose competitors...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-zinc-900/50">
                      <p className="text-sm text-zinc-500 mb-2">Query analyzed:</p>
                      <p className="text-white font-medium">&ldquo;{lossAnalysis.query}&rdquo;</p>
                    </div>
                    
                    {lossAnalysis.whyNotYou.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-amber-400 mb-2">
                          Reasons you&apos;re not being cited:
                        </h4>
                        <ul className="space-y-2">
                          {lossAnalysis.whyNotYou.slice(0, showPaywall ? 2 : undefined).map((reason, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-zinc-300">
                              <span className="text-amber-400 mt-1">•</span>
                              {reason}
                            </li>
                          ))}
                          {showPaywall && lossAnalysis.whyNotYou.length > 2 && (
                            <li className="flex items-start gap-2 text-zinc-500">
                              <Lock className="w-4 h-4 mt-1" />
                              <span>+ {lossAnalysis.whyNotYou.length - 2} more reasons locked</span>
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                    
                    {!showPaywall && lossAnalysis.actionItems.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-emerald-400 mb-2">
                          How to win this query:
                        </h4>
                        <ul className="space-y-2">
                          {lossAnalysis.actionItems.map((action, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-zinc-300">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-1 flex-shrink-0" />
                              {action}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* THE PAYWALL - Right after showing the loss */}
          {showPaywall && (
            <Card className="bg-gradient-to-br from-emerald-500/10 to-zinc-900 border-emerald-500/30">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                  <Lock className="w-8 h-8 text-emerald-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">
                  See How To Beat Your Competitors
                </h2>
                <p className="text-zinc-400 mb-6 max-w-md mx-auto">
                  Get the full analysis of why you&apos;re losing and exactly what to do to win these AI recommendations.
                </p>
                <div className="space-y-3">
                  <Link href="/settings/billing">
                    <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-black w-full">
                      Unlock Full Analysis — $29/mo
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                  <p className="text-sm text-zinc-500">
                    Includes: Gap analysis • Content ideas • Weekly action plan
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* WINS - Show these after losses */}
          {wins > 0 && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-emerald-400" />
                  Your Wins
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {checkResults.results
                    .filter(r => r.cited)
                    .map((result, idx) => (
                      <div 
                        key={idx}
                        className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-0">
                            {result.platform === "google_aio" ? "Google AI" : 
                             result.platform === "chatgpt" ? "ChatGPT" : 
                             result.platform.charAt(0).toUpperCase() + result.platform.slice(1)}
                          </Badge>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        </div>
                        <p className="text-white font-medium mb-1">
                          &ldquo;{result.query}&rdquo;
                        </p>
                        {result.snippet && (
                          <p className="text-sm text-zinc-400 line-clamp-2">
                            {result.snippet}
                          </p>
                        )}
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

      {/* Quick Links for paid users */}
      {isPaid && checkResults && (
        <div className="grid md:grid-cols-3 gap-4 pt-6">
          <Link href="/intelligence">
            <Card className="bg-zinc-900 border-zinc-800 hover:border-emerald-500/50 transition-colors cursor-pointer h-full">
              <CardContent className="pt-6">
                <Lightbulb className="w-8 h-8 text-emerald-400 mb-3" />
                <h3 className="font-semibold text-white">Get AI Insights</h3>
                <p className="text-sm text-zinc-500 mt-1">Full gap analysis & action plans</p>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/competitors">
            <Card className="bg-zinc-900 border-zinc-800 hover:border-violet-500/50 transition-colors cursor-pointer h-full">
              <CardContent className="pt-6">
                <Swords className="w-8 h-8 text-violet-400 mb-3" />
                <h3 className="font-semibold text-white">Track Competitors</h3>
                <p className="text-sm text-zinc-500 mt-1">See who&apos;s winning instead</p>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/citations">
            <Card className="bg-zinc-900 border-zinc-800 hover:border-blue-500/50 transition-colors cursor-pointer h-full">
              <CardContent className="pt-6">
                <TrendingUp className="w-8 h-8 text-blue-400 mb-3" />
                <h3 className="font-semibold text-white">View All Citations</h3>
                <p className="text-sm text-zinc-500 mt-1">Your complete citation history</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      )}
    </div>
  );
}

// Business categories for smarter query generation
const BUSINESS_CATEGORIES = [
  { value: "", label: "Select category (optional)" },
  { value: "productivity", label: "Productivity & SaaS" },
  { value: "crm", label: "CRM & Sales" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "marketing", label: "Marketing & SEO" },
  { value: "design", label: "Design & Creative" },
  { value: "development", label: "Development & DevOps" },
  { value: "analytics", label: "Analytics & BI" },
  { value: "communication", label: "Communication & Collaboration" },
  { value: "finance", label: "Finance & Accounting" },
  { value: "education", label: "Education & Learning" },
];

// Add Site Form Component
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
        <p className="text-xs text-zinc-500 mt-1 text-center">
          Helps us check the right AI queries
        </p>
      </div>
      {error && <p className="text-sm text-red-400 text-center">{error}</p>}
      <Button 
        type="submit" 
        disabled={adding || !domain.trim()}
        className="w-full bg-emerald-500 hover:bg-emerald-400 text-black"
      >
        {adding ? "Checking..." : "See Who's Winning →"}
      </Button>
    </form>
  );
}

// Main export with Suspense
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
