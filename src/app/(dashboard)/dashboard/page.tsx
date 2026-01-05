"use client";

/**
 * Main Dashboard - Clean & Focused
 * 
 * Shows:
 * - Current site overview
 * - Citation stats by platform
 * - Recent citations
 * - Quick actions
 * 
 * Uses SiteContext for all data
 */

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search, 
  TrendingUp,
  Users, 
  Bell,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Zap,
  Clock,
  AlertCircle,
  CheckCircle2,
  Plus
} from "lucide-react";
import { useSite } from "@/context/site-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TRIAL_DAYS, checkTrialStatus } from "@/lib/billing/citation-plans";

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
    results: Array<{ platform: string; cited: boolean; snippet?: string; error?: string }>;
    summary: { citedCount: number; apisCalled: number };
  } | null>(null);

  // Show success message if just signed up
  const justSignedUp = searchParams.get("welcome") === "true";

  // Check trial status
  const isTrialExpired = organization?.plan === "free" && trial?.expired;

  // Handle manual check
  const handleCheck = async () => {
    if (!currentSite) return;
    
    setChecking(true);
    setCheckResults(null);
    
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
      }
      
      // Refresh data to show new citations
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
          <p className="text-zinc-400">Loading dashboard...</p>
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

  // Trial expired - show upgrade prompt
  if (isTrialExpired) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="max-w-md text-center bg-zinc-900 rounded-2xl p-8 border border-zinc-800">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-6">
            <Clock className="w-8 h-8 text-amber-400" />
            </div>
          <h2 className="text-2xl font-bold text-white mb-3">
            Trial Ended
          </h2>
          <p className="text-zinc-400 mb-6">
            Your {TRIAL_DAYS}-day free trial has ended. Upgrade to continue tracking AI citations.
          </p>
          <Link href="/settings/billing">
            <Button className="bg-emerald-500 hover:bg-emerald-400 text-black">
              Upgrade Now
            </Button>
          </Link>
              </div>
            </div>
    );
  }

  // No sites yet - show onboarding
  if (!currentSite) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
            <Plus className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">
            Add Your First Website
          </h2>
          <p className="text-zinc-400 mb-6">
            Start tracking when AI platforms mention your brand.
          </p>
          <AddSiteForm />
        </div>
      </div>
    );
  }

  const plan = organization?.plan || "free";
  const isPaid = plan !== "free";

  return (
    <div className="space-y-6">
      {/* Welcome message */}
      {justSignedUp && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <p className="text-emerald-400">
              Welcome! Run your first check to see if AI is citing your website.
            </p>
          </div>
        </div>
      )}
          
      {/* Trial countdown */}
      {organization?.plan === "free" && trial && !trial.expired && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-400" />
              <p className="text-amber-400">
                {trial.daysRemaining} days left in trial
              </p>
            </div>
            <Link href="/settings/billing">
              <Button size="sm" variant="outline" className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10">
                Upgrade
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Site header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{currentSite.domain}</h1>
          <p className="text-sm text-zinc-500">
            Last checked: {currentSite.lastCheckedAt 
              ? new Date(currentSite.lastCheckedAt).toLocaleString() 
              : "Never"}
          </p>
        </div>
            <Button
          onClick={handleCheck}
              disabled={checking}
          className="bg-emerald-500 hover:bg-emerald-400 text-black"
            >
              {checking ? (
                <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
              <Search className="w-4 h-4 mr-2" />
                  Check Now
                </>
              )}
            </Button>
        </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6">
            <div className="text-3xl font-bold text-white">
              {currentSite.totalCitations}
                </div>
            <p className="text-sm text-zinc-500">Total Citations</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6">
            <div className="text-3xl font-bold text-emerald-400">
              {currentSite.citationsThisWeek}
                  </div>
            <p className="text-sm text-zinc-500">This Week</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6">
            <div className="text-3xl font-bold text-white">
              {currentSite.geoScore || "—"}
                </div>
            <p className="text-sm text-zinc-500">GEO Score</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6">
            <Badge className={`${isPaid ? "bg-emerald-500" : "bg-zinc-600"}`}>
              {plan.charAt(0).toUpperCase() + plan.slice(1)}
            </Badge>
            <p className="text-sm text-zinc-500 mt-2">Current Plan</p>
            </CardContent>
          </Card>
        </div>

      {/* Check results */}
      {checkResults && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-400" />
              Check Results
                </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {checkResults.results.map((result, idx) => (
                <div 
                  key={idx}
                  className={`p-4 rounded-xl border ${
                    result.cited 
                      ? "bg-emerald-500/10 border-emerald-500/30" 
                      : result.error
                      ? "bg-red-500/10 border-red-500/30"
                      : "bg-zinc-800/50 border-zinc-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-white capitalize">
                      {result.platform === "google_aio" ? "Google AI" : result.platform}
                    </span>
                    {result.cited ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : result.error ? (
                      <AlertCircle className="w-5 h-5 text-red-400" />
                    ) : (
                      <span className="text-zinc-500 text-sm">Not cited</span>
                    )}
                  </div>
                  {result.cited && result.snippet && (
                    <p className="text-sm text-zinc-400 line-clamp-2">
                      {result.snippet}
                    </p>
                  )}
                  {result.error && (
                    <p className="text-sm text-red-400">{result.error}</p>
                  )}
                </div>
              ))}
              </div>
            <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between">
              <p className="text-sm text-zinc-500">
                Found {checkResults.summary.citedCount} citation(s)
              </p>
              <Link href="/citations">
                <Button variant="ghost" size="sm" className="text-emerald-400">
                  View All <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Platform breakdown */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
          <CardTitle className="text-white">Platform Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { name: "Perplexity", color: "emerald", icon: Search },
              { name: "Google AI", color: "blue", icon: Zap },
              { name: "ChatGPT", color: "violet", icon: TrendingUp },
            ].map((platform) => (
              <div 
                key={platform.name}
                className={`p-4 rounded-xl bg-${platform.color}-500/5 border border-${platform.color}-500/20`}
              >
                <platform.icon className={`w-5 h-5 text-${platform.color}-400 mb-2`} />
                <div className="text-2xl font-bold text-white">0</div>
                <p className="text-sm text-zinc-500">{platform.name}</p>
                    </div>
                  ))}
                </div>
        </CardContent>
      </Card>

      {/* Quick actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <Link href="/citations">
          <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer h-full">
            <CardContent className="pt-6">
              <Search className="w-8 h-8 text-emerald-400 mb-3" />
              <h3 className="font-semibold text-white">View Citations</h3>
              <p className="text-sm text-zinc-500 mt-1">See all AI mentions</p>
            </CardContent>
          </Card>
              </Link>
              
        <Link href="/competitors">
          <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer h-full">
            <CardContent className="pt-6">
              <Users className="w-8 h-8 text-blue-400 mb-3" />
              <h3 className="font-semibold text-white">Competitors</h3>
              <p className="text-sm text-zinc-500 mt-1">Track who AI recommends</p>
            </CardContent>
          </Card>
              </Link>
              
        <Link href="/intelligence">
          <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer h-full">
            <CardContent className="pt-6">
              <TrendingUp className="w-8 h-8 text-violet-400 mb-3" />
              <h3 className="font-semibold text-white">GEO Intelligence</h3>
              <p className="text-sm text-zinc-500 mt-1">Score & optimization tips</p>
            </CardContent>
          </Card>
        </Link>
        </div>

      {/* Auto-monitoring status */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${isPaid ? "bg-emerald-400" : "bg-zinc-500"}`} />
              <span className="text-sm text-zinc-400">
                Auto-monitoring: {isPaid ? (
                  <span className="text-emerald-400">
                    {plan === "pro" ? "Hourly" : "Daily"} checks enabled
                  </span>
                ) : (
                  <span className="text-zinc-500">
                    Upgrade for automatic monitoring
                  </span>
                )}
              </span>
                </div>
            {!isPaid && (
              <Link href="/settings/billing">
                <Button size="sm" variant="outline" className="text-xs">
                  Upgrade
                </Button>
              </Link>
            )}
          </div>
            </CardContent>
          </Card>
    </div>
  );
}

// Add Site Form Component
function AddSiteForm() {
  const [domain, setDomain] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const { addSite } = useSite();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain.trim()) return;

    setAdding(true);
    setError("");

    try {
      const result = await addSite(domain);
      if (!result) {
        setError("Failed to add site");
      }
      // Success - context will update and show the site
    } catch (err) {
      setError("Failed to add site");
    } finally {
      setAdding(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <input
          type="text"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="yoursite.com"
          className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
        />
        {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
      </div>
      <Button 
        type="submit" 
        disabled={adding || !domain.trim()}
        className="w-full bg-emerald-500 hover:bg-emerald-400 text-black"
      >
        {adding ? "Adding..." : "Add Website"}
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
