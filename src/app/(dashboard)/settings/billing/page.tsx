"use client";

/**
 * ============================================
 * BILLING PAGE - Subscription & Pricing
 * ============================================
 *
 * For free users: clean pricing page with feature walkthrough
 * For paid users: plan management + usage stats + upgrade options
 */

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CreditCard,
  Check,
  Crown,
  Zap,
  Building2,
  Loader2,
  ExternalLink,
  AlertTriangle,
  Search,
  FileText,
  BarChart3,
  Shield,
  Eye,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useSite } from "@/context/site-context";
import { CITATION_PLANS } from "@/lib/billing/citation-plans";

// Feature rows for plan comparison
const PLAN_FEATURES = [
  { label: "Sites tracked", key: "sites" },
  { label: "AI queries tracked", key: "queries" },
  { label: "Scan frequency", key: "scans" },
  { label: "Fix pages / month", key: "pages" },
  { label: "Site GEO audit", key: "audit" },
  { label: "Gap analysis", key: "gaps" },
  { label: "Weekly action plan", key: "actionPlan" },
  { label: "History retention", key: "history" },
  { label: "Email alerts", key: "alerts" },
  { label: "CSV export", key: "csv" },
] as const;

function getPlanFeatureValue(planId: "scout" | "command" | "dominate", key: string): string {
  const p = CITATION_PLANS[planId];
  switch (key) {
    case "sites": return `${p.limits.sites} site${p.limits.sites > 1 ? "s" : ""}`;
    case "queries": return `${p.limits.queriesPerCheck} queries`;
    case "scans": return p.features.twiceDailyAutoCheck ? "2x daily" : "Daily";
    case "pages": return `${p.intelligenceLimits.pagesPerMonth}/mo`;
    case "audit": return p.features.siteAuditFull ? "Full crawl" : p.features.siteAudit ? "Top 10 pages" : "\u2014";
    case "gaps": return `${p.intelligenceLimits.gapAnalysesPerMonth}/mo`;
    case "actionPlan": return p.features.weeklyActionPlan ? `${p.intelligenceLimits.actionPlansPerMonth}/mo` : "\u2014";
    case "history": return `${p.limits.historyDays} days`;
    case "alerts": return p.features.emailAlerts ? "Yes" : "\u2014";
    case "csv": return p.features.csvExport ? "Yes" : "\u2014";
    default: return "\u2014";
  }
}

function BillingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { organization, sites, usage, subscription, loading, refreshData } = useSite();

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

    // Plan already updated (webhook was fast) — redirect appropriately
    if (currentPlan !== "free") {
      setCheckoutSuccess(true);
      if (sites.length === 0) {
        router.replace("/onboarding");
      } else {
        router.replace("/settings/billing", { scroll: false });
      }
      return;
    }

    setPollingPayment(true);
    let attempts = 0;
    const maxAttempts = 30;

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
      if (sites.length === 0) {
        router.replace("/onboarding");
      } else {
        router.replace("/settings/billing", { scroll: false });
      }
    }
  }, [currentPlan, pollingPayment, sites.length]);

  // Pre-select plan from URL param
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
        body: JSON.stringify({ planId, interval: billingInterval }),
      });

      const data = await res.json();
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
    } catch {
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
    } catch {
      setError("Failed to access billing portal.");
    } finally {
      setPortalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Loading...</p>
        </div>
      </div>
    );
  }

  const plan = CITATION_PLANS[currentPlan as keyof typeof CITATION_PLANS] || CITATION_PLANS.free;

  // ============================================
  // POST-CHECKOUT — Full-screen activation view
  // ============================================
  if (pollingPayment || pollingTimedOut || checkoutSuccess) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="max-w-md w-full text-center">
          {pollingPayment && (
            <>
              <div className="flex justify-center mb-6">
                <div className="p-5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                  <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Setting up your account</h1>
              <p className="text-zinc-400 mb-8">This only takes a moment...</p>
              <div className="space-y-3 text-left max-w-xs mx-auto">
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-emerald-400" />
                  <span className="text-zinc-300">Payment received</span>
                </div>
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
                  <span className="text-white font-medium">Activating your plan...</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full border-2 border-zinc-700" />
                  <span className="text-zinc-600">Ready to go</span>
                </div>
              </div>
            </>
          )}
          {pollingTimedOut && !checkoutSuccess && (
            <>
              <div className="flex justify-center mb-6">
                <div className="p-5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                  <Check className="w-10 h-10 text-emerald-400" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Payment received</h1>
              <p className="text-zinc-400 mb-6">
                Your plan is activating. This can take up to a minute.
              </p>
              <div className="flex justify-center gap-4">
                <Button
                  onClick={async () => {
                    setPollingTimedOut(false);
                    setPollingPayment(true);
                    await refreshData();
                    if (currentPlan !== "free") {
                      setPollingPayment(false);
                      setCheckoutSuccess(true);
                      if (sites.length === 0) {
                        router.replace("/onboarding");
                      } else {
                        router.replace("/settings/billing", { scroll: false });
                      }
                    } else {
                      setPollingPayment(false);
                      setPollingTimedOut(true);
                    }
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  Check again
                </Button>
                <Button
                  variant="outline"
                  className="border-zinc-700"
                  onClick={() => window.location.reload()}
                >
                  Refresh page
                </Button>
              </div>
              <p className="text-xs text-zinc-500 mt-6">
                If this doesn&apos;t resolve, email arjun@cabbageseo.com and we&apos;ll fix it immediately.
              </p>
            </>
          )}
          {checkoutSuccess && (
            <>
              <div className="flex justify-center mb-6">
                <div className="p-5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                  <Check className="w-10 h-10 text-emerald-400" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">You&apos;re all set!</h1>
              <p className="text-zinc-400">Redirecting you now...</p>
            </>
          )}
        </div>
      </div>
    );
  }

  // ============================================
  // FREE USER VIEW — Pricing page
  // ============================================
  if (subscription.isFreeUser) {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          {sites.length === 0 && (
            <p className="text-sm text-emerald-400 font-medium mb-3">
              Welcome to CabbageSEO! Choose a plan to get started.
            </p>
          )}
          <h1 className="text-3xl font-bold text-white mb-2">Choose your plan</h1>
          <p className="text-lg text-zinc-400 max-w-xl mx-auto">
            Track how AI platforms cite your brand. Fix gaps before competitors do.
          </p>
        </div>

        {/* Error banner */}
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

        {/* Billing toggle */}
        <div className="flex justify-center">
          <div className="flex items-center gap-2 bg-zinc-800 rounded-lg p-1">
            <button
              onClick={() => setBillingInterval("monthly")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingInterval === "monthly"
                  ? "bg-emerald-500 text-black"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval("yearly")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingInterval === "yearly"
                  ? "bg-emerald-500 text-black"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Yearly
              <span className="ml-1.5 text-xs opacity-75">Save 20%</span>
            </button>
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {(["scout", "command", "dominate"] as const).map((planId) => {
            const planData = CITATION_PLANS[planId];
            const price = billingInterval === "yearly" ? planData.yearlyPrice : planData.monthlyPrice;
            const isHighlighted = planId === highlightedPlan || planId === "command";
            const isPopular = planId === "command";

            return (
              <div
                key={planId}
                className={`relative rounded-2xl border p-6 flex flex-col ${
                  isHighlighted
                    ? "bg-emerald-500/5 border-emerald-500/30 ring-1 ring-emerald-500/20"
                    : "bg-zinc-900/50 border-zinc-800"
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-emerald-500 text-white text-xs px-3">Most popular</Badge>
                  </div>
                )}

                {/* Plan header */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    {planId === "scout" && <Crown className="w-5 h-5 text-emerald-400" />}
                    {planId === "command" && <Zap className="w-5 h-5 text-violet-400" />}
                    {planId === "dominate" && <Building2 className="w-5 h-5 text-amber-400" />}
                    <h3 className="text-xl font-bold text-white">{planData.name}</h3>
                  </div>
                  <p className="text-sm text-zinc-400">{planData.tagline}</p>
                </div>

                {/* Price */}
                <div className="mb-5">
                  <span className="text-4xl font-bold text-white">${price}</span>
                  <span className="text-zinc-500 ml-1">/mo</span>
                  {billingInterval === "yearly" && (
                    <p className="text-xs text-emerald-400 mt-1">Billed yearly (${price * 12}/yr)</p>
                  )}
                </div>

                {/* Who is this for */}
                <p className="text-xs text-zinc-500 mb-5 pb-5 border-b border-zinc-800">
                  {planData.whoIsThisFor}
                </p>

                {/* Features */}
                <ul className="space-y-3 mb-6 flex-1">
                  <li className="flex items-start gap-2.5 text-sm">
                    <Eye className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    <span className="text-zinc-300">
                      <strong className="text-white">{planData.limits.queriesPerCheck} queries</strong> tracked across ChatGPT, Perplexity, Google AI
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5 text-sm">
                    <Search className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    <span className="text-zinc-300">
                      {planData.features.twiceDailyAutoCheck ? "2x daily" : "Daily"} automated scans
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5 text-sm">
                    <FileText className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    <span className="text-zinc-300">
                      <strong className="text-white">{planData.intelligenceLimits.pagesPerMonth} fix pages</strong>/month with schema markup
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5 text-sm">
                    <Shield className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    <span className="text-zinc-300">
                      Site GEO audit {"\u2014"} {planData.features.siteAuditFull ? "full crawl" : "top 10 pages"}
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5 text-sm">
                    <BarChart3 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    <span className="text-zinc-300">
                      {planData.intelligenceLimits.gapAnalysesPerMonth} gap analyses/month
                    </span>
                  </li>
                  {planData.features.weeklyActionPlan && (
                    <li className="flex items-start gap-2.5 text-sm">
                      <Sparkles className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                      <span className="text-zinc-300">Weekly AI action plans</span>
                    </li>
                  )}
                  <li className="flex items-start gap-2.5 text-sm">
                    <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    <span className="text-zinc-300">
                      {planData.limits.sites} site{planData.limits.sites > 1 ? "s" : ""}, {planData.limits.historyDays}-day history
                    </span>
                  </li>
                  {planData.features.csvExport && (
                    <li className="flex items-start gap-2.5 text-sm">
                      <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                      <span className="text-zinc-300">CSV export + email alerts</span>
                    </li>
                  )}
                </ul>

                {/* CTA */}
                <Button
                  onClick={() => handleUpgrade(planId)}
                  disabled={!!upgrading}
                  className={`w-full h-11 font-semibold ${
                    isHighlighted
                      ? "bg-emerald-500 hover:bg-emerald-400 text-black"
                      : "bg-zinc-700 hover:bg-zinc-600 text-white"
                  }`}
                >
                  {upgrading === planId ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    `Get ${planData.name} \u2014 $${price}/mo`
                  )}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Feature comparison table */}
        <div className="rounded-xl border border-zinc-800 overflow-hidden">
          <div className="bg-zinc-900/50 px-6 py-4 border-b border-zinc-800">
            <h3 className="text-white font-semibold">Compare plans</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left text-zinc-400 font-medium px-6 py-3 w-1/4"></th>
                  <th className="text-center text-white font-semibold px-4 py-3">Scout</th>
                  <th className="text-center text-white font-semibold px-4 py-3">Command</th>
                  <th className="text-center text-white font-semibold px-4 py-3">Dominate</th>
                </tr>
              </thead>
              <tbody>
                {PLAN_FEATURES.map((feat, i) => (
                  <tr key={feat.key} className={i < PLAN_FEATURES.length - 1 ? "border-b border-zinc-800/50" : ""}>
                    <td className="px-6 py-3 text-zinc-400">{feat.label}</td>
                    <td className="px-4 py-3 text-center text-zinc-300">{getPlanFeatureValue("scout", feat.key)}</td>
                    <td className="px-4 py-3 text-center text-zinc-300">{getPlanFeatureValue("command", feat.key)}</td>
                    <td className="px-4 py-3 text-center text-zinc-300">{getPlanFeatureValue("dominate", feat.key)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-center text-xs text-zinc-500">
          Cancel anytime. No contracts. All plans include a 7-day money-back guarantee.
        </p>
      </div>
    );
  }

  // ============================================
  // PAID USER VIEW — Plan management
  // ============================================
  return (
    <div className="space-y-6">
      {/* Error banner */}
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
                "bg-emerald-500/10"
              }`}>
                {currentPlan === "dominate" ? <Building2 className="w-7 h-7 text-amber-400" /> :
                 currentPlan === "command" ? <Zap className="w-7 h-7 text-violet-400" /> :
                 <Crown className="w-7 h-7 text-emerald-400" />}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{plan.name} Plan</h3>
                <p className="text-sm text-zinc-500">{plan.description}</p>
              </div>
            </div>
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
                  {usage.checksUsed}/{usage.checksLimit === 999999 ? "\u221E" : usage.checksLimit}
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
                          {planData.limits.sites} site{planData.limits.sites > 1 ? "s" : ""}, {planData.limits.queriesPerCheck} queries
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-400" />
                          {planData.intelligenceLimits.pagesPerMonth} fix pages/mo
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-400" />
                          {planData.features.twiceDailyAutoCheck ? "2x daily scans" : "Daily auto-scans"}
                        </li>
                        {planData.features.weeklyActionPlan && (
                          <li className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-emerald-400" />
                            Weekly action plans
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
  );
}

// Main export with Suspense
export default function BillingPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Loading...</p>
        </div>
      </div>
    }>
      <BillingContent />
    </Suspense>
  );
}
