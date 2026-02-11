"use client";

/**
 * ============================================
 * BILLING SETTINGS - Subscription Management
 * ============================================
 */

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CreditCard,
  Check,
  Crown,
  Zap,
  Building2,
  Loader2,
  ExternalLink,
  ChevronLeft,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useSite } from "@/context/site-context";
import { CITATION_PLANS } from "@/lib/billing/citation-plans";

function BillingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { organization, usage, subscription, loading, refreshData } = useSite();

  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("yearly");
  const [error, setError] = useState<string | null>(null);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [pollingPayment, setPollingPayment] = useState(false);
  const [pollingTimedOut, setPollingTimedOut] = useState(false);

  const currentPlan = organization?.plan || "free";
  const selectedPlan = searchParams.get("plan");
  const sessionId = searchParams.get("session_id");

  // Post-checkout polling: when returning from Dodo, poll until plan updates
  useEffect(() => {
    if (!sessionId || loading || pollingPayment || checkoutSuccess) return;

    // Only poll if still on free plan (payment not yet processed by webhook)
    if (currentPlan !== "free") {
      setCheckoutSuccess(true);
      // Clean session_id from URL
      router.replace("/settings/billing", { scroll: false });
      return;
    }

    setPollingPayment(true);
    let attempts = 0;
    const maxAttempts = 30; // 30 x 2s = 60 seconds max

    const pollInterval = setInterval(async () => {
      attempts++;
      try {
        await refreshData();
      } catch {
        // ignore refresh errors during polling
      }

      if (attempts >= maxAttempts) {
        clearInterval(pollInterval);
        setPollingPayment(false);
        setPollingTimedOut(true);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [sessionId, loading]);

  // Detect when plan updates during polling
  useEffect(() => {
    if (pollingPayment && currentPlan !== "free") {
      setPollingPayment(false);
      setPollingTimedOut(false);
      setCheckoutSuccess(true);
      router.replace("/settings/billing", { scroll: false });
    }
  }, [currentPlan, pollingPayment]);

  // Show which plan was pre-selected from URL (don't auto-redirect to checkout)
  const [highlightedPlan, setHighlightedPlan] = useState<string | null>(null);
  useEffect(() => {
    if (selectedPlan && selectedPlan !== currentPlan) {
      setHighlightedPlan(selectedPlan);
    }
  }, [selectedPlan, currentPlan]);

  const handleUpgrade = async (planId: string) => {
    setUpgrading(planId);
    setError(null);
    
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          planId, 
          interval: billingInterval,
        }),
      });
      
      const data = await res.json();
      
      // Handle both response formats
      const checkoutUrl = data.data?.checkoutUrl || data.url || data.checkoutUrl;
      
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else if (data.error) {
        setError(data.error);
        setUpgrading(null);
      } else {
        setError("Failed to create checkout session. Please try again.");
        setUpgrading(null);
      }
    } catch (err) {
      setError("Network error. Please check your connection and try again.");
      setUpgrading(null);
    }
  };

  const handleManageBilling = async () => {
    setPortalLoading(true);
    setError(null);
    
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      
      const portalUrl = data.data?.portalUrl || data.url;
      if (portalUrl) {
        window.location.href = portalUrl;
      } else if (data.error) {
        setError(data.error);
      }
    } catch (err) {
      setError("Failed to access billing portal.");
    } finally {
      setPortalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Loading billing information...</p>
        </div>
      </div>
    );
  }

  const plan = CITATION_PLANS[currentPlan as keyof typeof CITATION_PLANS] || CITATION_PLANS.free;

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Back link */}
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to settings
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Billing</h1>
          <p className="text-xl text-zinc-400">Manage your subscription</p>
        </div>

      {/* Post-checkout: Processing payment */}
      {pollingPayment && (
        <Card className="bg-emerald-500/10 border-emerald-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
              <p className="text-emerald-400 font-medium">Processing your payment... This may take a few seconds.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Post-checkout: Polling timed out */}
      {pollingTimedOut && !checkoutSuccess && (
        <Card className="bg-amber-500/10 border-amber-500/30">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5" />
              <div>
                <p className="text-amber-400 font-medium">
                  Your payment was received. Your plan is being activated.
                </p>
                <p className="text-amber-300/70 text-sm mt-1">
                  This usually takes under a minute. If it doesn&apos;t update, contact us at arjun@cabbageseo.com with your email.
                </p>
                <div className="flex gap-3 mt-3">
                  <button
                    onClick={async () => {
                      setPollingTimedOut(false);
                      setPollingPayment(true);
                      // Try checking status directly
                      if (sessionId) {
                        try {
                          const res = await fetch(`/api/billing/checkout-status?session_id=${sessionId}`);
                          if (res.ok) {
                            const data = await res.json();
                            if (data.activated) {
                              await refreshData();
                              setPollingPayment(false);
                              setCheckoutSuccess(true);
                              router.replace("/settings/billing", { scroll: false });
                              return;
                            }
                          }
                        } catch {}
                      }
                      // Fallback: poll again
                      await refreshData();
                      if (currentPlan !== "free") {
                        setPollingPayment(false);
                        setCheckoutSuccess(true);
                        router.replace("/settings/billing", { scroll: false });
                      } else {
                        setPollingPayment(false);
                        setPollingTimedOut(true);
                      }
                    }}
                    className="text-sm text-amber-300 hover:text-amber-200 font-medium underline underline-offset-2"
                  >
                    Check status
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="text-sm text-amber-300/70 hover:text-amber-200 underline underline-offset-2"
                  >
                    Refresh page
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Post-checkout: Success */}
      {checkoutSuccess && (
        <Card className="bg-emerald-500/10 border-emerald-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-emerald-400" />
              <p className="text-emerald-400 font-medium">Payment successful! You&apos;re now on the {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} plan.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <p className="text-red-400">{error}</p>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setError(null)}
                className="ml-auto text-red-400 hover:text-red-300"
              >
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No subscription */}
      {subscription.isFreeUser && (
        <Card className="border-2 bg-emerald-500/5 border-emerald-500/30">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-500/20">
                <Zap className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white">No active subscription</h3>
                <p className="text-sm text-zinc-400 mt-1">
                  Choose a plan below to start tracking your AI visibility.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Plan */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-zinc-400" />
            Current Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                currentPlan === "dominate" ? "bg-amber-500/10" :
                currentPlan === "command" ? "bg-violet-500/10" :
                currentPlan === "scout" ? "bg-emerald-500/10" :
                "bg-zinc-800"
              }`}>
                {currentPlan === "dominate" ? <Building2 className="w-7 h-7 text-amber-400" /> :
                 currentPlan === "command" ? <Zap className="w-7 h-7 text-violet-400" /> :
                 currentPlan === "scout" ? <Crown className="w-7 h-7 text-emerald-400" /> :
                 <CreditCard className="w-7 h-7 text-zinc-500" />}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  {plan.name} {currentPlan !== "free" ? "Plan" : ""}
                </h3>
                <p className="text-sm text-zinc-500">{plan.description}</p>
              </div>
            </div>
            {currentPlan !== "free" && (
              <Button
                onClick={handleManageBilling}
                disabled={portalLoading}
                variant="outline"
                className="border-zinc-700"
              >
                {portalLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>Manage <ExternalLink className="w-3 h-3 ml-2" /></>
                )}
              </Button>
            )}
          </div>

          {/* Usage Stats */}
          <div className="grid sm:grid-cols-2 gap-4 mt-6">
            <div className="p-4 rounded-xl bg-zinc-800/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-zinc-400">Sites</span>
                <span className="text-sm font-medium text-white">
                  {usage.sitesUsed}/{usage.sitesLimit}
                </span>
              </div>
              <Progress value={(usage.sitesUsed / usage.sitesLimit) * 100} className="h-2 bg-zinc-700" />
            </div>

            <div className="p-4 rounded-xl bg-zinc-800/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-zinc-400">Checks</span>
                <span className="text-sm font-medium text-white">
                  {usage.checksUsed}/{usage.checksLimit === 999999 ? "∞" : usage.checksLimit}
                </span>
              </div>
              <Progress value={usage.checksLimit === 999999 ? 0 : (usage.checksUsed / usage.checksLimit) * 100} className="h-2 bg-zinc-700" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Options */}
      {currentPlan !== "dominate" && (
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">Upgrade</CardTitle>
                <CardDescription>Get more features and limits</CardDescription>
              </div>
              {/* Monthly/Yearly Toggle */}
              <div className="flex items-center gap-2 bg-zinc-800 rounded-lg p-1">
                <button
                  onClick={() => setBillingInterval("monthly")}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    billingInterval === "monthly"
                      ? "bg-emerald-500 text-black"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingInterval("yearly")}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    billingInterval === "yearly"
                      ? "bg-emerald-500 text-black"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Yearly
                  <span className="ml-1 text-xs opacity-75">(-20%)</span>
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-4">
              {(["scout", "command", "dominate"] as const)
                .filter(p => {
                  const planOrder = ["free", "scout", "command", "dominate"];
                  return planOrder.indexOf(p) > planOrder.indexOf(currentPlan);
                })
                .map((planId) => {
                  const planData = CITATION_PLANS[planId];
                  const price = billingInterval === "yearly" ? planData.yearlyPrice : planData.monthlyPrice;

                  return (
                    <div
                      key={planId}
                      className={`p-4 rounded-xl border ${
                        planId === highlightedPlan
                          ? "bg-emerald-500/5 border-emerald-500/30 ring-2 ring-emerald-500/40"
                          : planId === "command"
                          ? "bg-emerald-500/5 border-emerald-500/30"
                          : "bg-zinc-800/50 border-zinc-700"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-white">{planData.name}</h4>
                        {planId === "command" && (
                          <Badge className="bg-emerald-500 text-white text-xs">Popular</Badge>
                        )}
                      </div>
                      <div className="mb-3">
                        <span className="text-2xl font-bold text-white">${price}</span>
                        <span className="text-zinc-500">/mo</span>
                        {billingInterval === "yearly" && (
                          <span className="ml-2 text-xs text-emerald-400">billed yearly</span>
                        )}
                      </div>
                      <ul className="space-y-2 text-sm text-zinc-400 mb-4">
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-400" />
                          {planData.limits.sites} site{planData.limits.sites > 1 ? "s" : ""}
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-400" />
                          {planData.id === "dominate"
                            ? "Daily + hourly auto-checks"
                            : planData.id === "command"
                            ? "Daily + hourly monitoring"
                            : planData.id === "scout"
                            ? "Daily auto-checks"
                            : "Manual checks only"}
                        </li>
                        {planData.features.sprintFramework && (
                          <li className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-emerald-400" />
                            30-day sprint program
                          </li>
                        )}
                      </ul>
                      <Button
                        onClick={() => handleUpgrade(planId)}
                        disabled={upgrading === planId}
                        className={`w-full font-medium ${
                          planId === "command"
                            ? "bg-emerald-600 hover:bg-emerald-500"
                            : "bg-zinc-700 hover:bg-zinc-600"
                        }`}
                      >
                        {upgrading === planId ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          `Get ${planData.name}`
                        )}
                      </Button>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      </div>
    </div>
  );
}

// Main export with Suspense
export default function BillingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Loading billing information...</p>
        </div>
      </div>
    }>
      <BillingContent />
    </Suspense>
  );
}
