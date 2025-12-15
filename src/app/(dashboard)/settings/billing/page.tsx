"use client";

import { useState, useEffect } from "react";
import {
  CreditCard,
  Check,
  Zap,
  Sparkles,
  Clock,
  Download,
  AlertCircle,
  ArrowRight,
  FileText,
  TrendingUp,
  Package,
  Loader2,
  Shield,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";

// ============================================
// TYPES
// ============================================

interface OverageSettings {
  enabled: boolean;
  spendingCapDollars: number;
  currentSpendDollars: number;
  remainingDollars: number;
  percentUsed: number;
  autoIncrease: boolean;
}

interface UsageData {
  plan: {
    id: string;
    name: string;
    status: string;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
  };
  usage: {
    articles: number;
    keywords: number;
    serpCalls: number;
    pageCrawls: number;
    aioAnalyses: number;
  };
  limits: {
    articles: number;
    keywords: number;
    serpCalls: number;
    pageCrawls: number;
  };
  percentages: {
    articles: number;
    keywords: number;
    serpCalls: number;
    pageCrawls: number;
  };
  credits: {
    prepaid: number;
    bonus: number;
    total: number;
    expiresAt: string | null;
  };
  overages?: OverageSettings;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  interval: "month" | "year";
  features: string[];
  popular?: boolean;
}

// Available plans (these would typically come from an API too)
const availablePlans: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    price: 29,
    interval: "month",
    features: [
      "10 articles/month",
      "250 keywords tracked",
      "1 website",
      "Basic SEO audit",
      "Email support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 79,
    interval: "month",
    popular: true,
    features: [
      "50 articles/month",
      "1,000 keywords tracked",
      "3 websites",
      "Advanced SEO + AIO audit",
      "Auto-fix issues",
      "CMS publishing",
      "Priority support",
    ],
  },
  {
    id: "pro_plus",
    name: "Pro+",
    price: 199,
    interval: "month",
    features: [
      "Unlimited articles",
      "5,000 keywords tracked",
      "10 websites",
      "Enterprise audit",
      "White-label reports",
      "API access",
      "Dedicated support",
    ],
  },
];

// ============================================
// PLAN CARD
// ============================================

function PlanCard({
  plan,
  isCurrent,
  onSelect,
  loading,
}: {
  plan: Plan;
  isCurrent: boolean;
  onSelect: () => void;
  loading?: boolean;
}) {
  return (
    <Card
      className={`relative ${
        plan.popular ? "border-primary ring-2 ring-primary/20" : ""
      } ${isCurrent ? "bg-primary/5" : ""}`}
    >
      {plan.popular && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
          Most Popular
        </Badge>
      )}
      <CardHeader className="text-center pb-2">
        <CardTitle>{plan.name}</CardTitle>
        <div className="mt-2">
          <span className="text-4xl font-bold">${plan.price}</span>
          <span className="text-muted-foreground">/{plan.interval}</span>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 mb-6">
          {plan.features.map((feature, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        <Button
          className="w-full"
          variant={isCurrent ? "secondary" : plan.popular ? "default" : "outline"}
          disabled={isCurrent || loading}
          onClick={onSelect}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isCurrent ? (
            "Current Plan"
          ) : (
            <>
              Upgrade
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function BillingPage() {
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<UsageData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [spendingCap, setSpendingCap] = useState("100");
  const [savingOverages, setSavingOverages] = useState(false);

  useEffect(() => {
    async function fetchUsage() {
      try {
        const res = await fetch("/api/billing/usage");
        if (!res.ok) throw new Error("Failed to fetch usage data");
        const json = await res.json();
        setData(json);
        if (json.overages?.spendingCapDollars) {
          setSpendingCap(String(json.overages.spendingCapDollars));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load billing data");
      } finally {
        setLoading(false);
      }
    }
    fetchUsage();
  }, []);

  const handleManageBilling = async () => {
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const json = await res.json();
      if (json.data?.portalUrl) {
        window.location.href = json.data.portalUrl;
      }
    } catch {
      console.error("Failed to open billing portal");
    }
  };

  const handleUpgrade = async (planId: string) => {
    setUpgrading(planId);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, interval: "monthly" }),
      });
      const json = await res.json();
      if (json.data?.checkoutUrl) {
        window.location.href = json.data.checkoutUrl;
      } else if (json.error) {
        setError(json.error);
      }
    } catch {
      setError("Failed to start checkout");
    } finally {
      setUpgrading(null);
    }
  };

  const handleToggleOverages = async (enabled: boolean) => {
    setSavingOverages(true);
    try {
      if (enabled) {
        const res = await fetch("/api/billing/overages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            spendingCapDollars: Number(spendingCap) || 100,
            autoIncrease: false 
          }),
        });
        const json = await res.json();
        if (json.success && data) {
          setData({
            ...data,
            overages: {
              enabled: true,
              spendingCapDollars: Number(spendingCap),
              currentSpendDollars: 0,
              remainingDollars: Number(spendingCap),
              percentUsed: 0,
              autoIncrease: false,
            },
          });
        }
      } else {
        await fetch("/api/billing/overages", { method: "DELETE" });
        if (data) {
          setData({
            ...data,
            overages: { ...data.overages!, enabled: false },
          });
        }
      }
    } catch {
      setError("Failed to update overage settings");
    } finally {
      setSavingOverages(false);
    }
  };

  const handleSetCap = async () => {
    setSavingOverages(true);
    try {
      const res = await fetch("/api/billing/overages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set_cap", amount: Number(spendingCap) }),
      });
      const json = await res.json();
      if (json.success && data) {
        setData({
          ...data,
          overages: {
            ...data.overages!,
            spendingCapDollars: Number(spendingCap),
            remainingDollars: Number(spendingCap) - (data.overages?.currentSpendDollars || 0),
          },
        });
      }
    } catch {
      setError("Failed to update spending cap");
    } finally {
      setSavingOverages(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-2">Unable to load billing data</p>
          <p className="text-muted-foreground mb-4">{error || "Please try again later"}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  const usageMetrics = [
    { name: "Articles Generated", used: data.usage.articles, limit: data.limits.articles, unit: "articles", pct: data.percentages.articles },
    { name: "Keywords Tracked", used: data.usage.keywords, limit: data.limits.keywords, unit: "keywords", pct: data.percentages.keywords },
    { name: "Pages Crawled", used: data.usage.pageCrawls, limit: data.limits.pageCrawls, unit: "pages", pct: data.percentages.pageCrawls },
    { name: "SERP Calls", used: data.usage.serpCalls, limit: data.limits.serpCalls, unit: "calls", pct: data.percentages.serpCalls },
  ];

  const daysUntilRenewal = data.plan.currentPeriodEnd 
    ? Math.max(0, Math.ceil((new Date(data.plan.currentPeriodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <div className="space-y-8">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Current Plan
              </CardTitle>
              <CardDescription>
                Your subscription details and billing
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-lg px-3 py-1 capitalize">
              {data.plan.name}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="text-2xl font-bold capitalize">{data.plan.status}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Billing Cycle</p>
              <p className="text-2xl font-bold">Monthly</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Next Renewal</p>
              <p className="text-2xl font-bold">
                {data.plan.currentPeriodEnd 
                  ? new Date(data.plan.currentPeriodEnd).toLocaleDateString()
                  : "—"}
              </p>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Dialog open={showUpgrade} onOpenChange={setShowUpgrade}>
              <DialogTrigger asChild>
                <Button>
                  <Zap className="w-4 h-4 mr-2" />
                  Change Plan
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Choose Your Plan</DialogTitle>
                  <DialogDescription>
                    Select the plan that best fits your needs
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 sm:grid-cols-3 py-4">
                  {availablePlans.map((plan) => (
                    <PlanCard
                      key={plan.id}
                      plan={plan}
                      isCurrent={plan.id === data.plan.id}
                      onSelect={() => handleUpgrade(plan.id)}
                      loading={upgrading === plan.id}
                    />
                  ))}
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={handleManageBilling}>
              <CreditCard className="w-4 h-4 mr-2" />
              Manage Billing
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Usage */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Usage This Month
              </CardTitle>
              <CardDescription>
                Track your resource consumption
              </CardDescription>
            </div>
            {daysUntilRenewal !== null && (
              <Badge variant="outline">
                <Clock className="w-3 h-3 mr-1" />
                Resets in {daysUntilRenewal} days
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2">
            {usageMetrics.map((metric) => {
              const isNearLimit = metric.pct >= 80;
              const isOverLimit = metric.pct >= 100;

              return (
                <div key={metric.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{metric.name}</span>
                    <span
                      className={`text-sm ${
                        isOverLimit
                          ? "text-red-500"
                          : isNearLimit
                          ? "text-yellow-500"
                          : "text-muted-foreground"
                      }`}
                    >
                      {metric.used.toLocaleString()} / {metric.limit.toLocaleString()} {metric.unit}
                    </span>
                  </div>
                  <Progress
                    value={Math.min(metric.pct, 100)}
                    className={`h-2 ${
                      isOverLimit
                        ? "[&>div]:bg-red-500"
                        : isNearLimit
                        ? "[&>div]:bg-yellow-500"
                        : ""
                    }`}
                  />
                  {isNearLimit && !isOverLimit && (
                    <p className="text-xs text-yellow-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Approaching limit
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* AIO Analyses (bonus metric) */}
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">AIO Analyses This Month</p>
                <p className="text-sm text-muted-foreground">
                  {data.usage.aioAnalyses} AI visibility analyses performed
                </p>
              </div>
              <Badge variant="secondary">{data.usage.aioAnalyses}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overage / Pay-as-you-go */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Pay-as-You-Go (Overages)
          </CardTitle>
          <CardDescription>
            Continue using CabbageSEO when you hit plan limits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Toggle */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium">Enable overages</p>
                <p className="text-sm text-muted-foreground">
                  {data.overages?.enabled 
                    ? "You won't be blocked when you hit plan limits" 
                    : "You'll be blocked when you reach plan limits"}
                </p>
              </div>
              <Switch
                checked={data.overages?.enabled ?? false}
                onCheckedChange={handleToggleOverages}
                disabled={savingOverages}
              />
            </div>

            {/* Spending Cap */}
            {data.overages?.enabled && (
              <>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Spending Cap</span>
                    <span className="text-sm text-muted-foreground">
                      ${data.overages.currentSpendDollars.toFixed(2)} / ${data.overages.spendingCapDollars.toFixed(2)}
                    </span>
                  </div>
                  <Progress 
                    value={data.overages.percentUsed} 
                    className={`h-2 ${data.overages.percentUsed >= 80 ? "[&>div]:bg-yellow-500" : ""}`}
                  />
                  <p className="text-xs text-muted-foreground">
                    ${data.overages.remainingDollars.toFixed(2)} remaining this billing period
                  </p>
                </div>

                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block">
                      Set new cap ($)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="number"
                        min="10"
                        step="10"
                        value={spendingCap}
                        onChange={(e) => setSpendingCap(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <Button onClick={handleSetCap} disabled={savingOverages}>
                    {savingOverages ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Update Cap"
                    )}
                  </Button>
                </div>
              </>
            )}

            {/* Pricing info */}
            <div className="text-sm text-muted-foreground border-t pt-4 mt-4">
              <p className="mb-2 font-medium text-foreground">Overage pricing (90% markup):</p>
              <ul className="space-y-1 ml-4">
                <li>• Articles: $5.00 per article</li>
                <li>• Keywords: $1.00 per 100 keywords</li>
                <li>• Audits: $0.50 per audit</li>
                <li>• AIO Analyses: $0.50 per analysis</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prepaid Credits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Prepaid Credits
          </CardTitle>
          <CardDescription>
            Buy credits in advance for discounted rates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg mb-4">
            <div>
              <p className="font-medium">Available Credits</p>
              <p className="text-3xl font-bold">${(data.credits.total / 100).toFixed(2)}</p>
              {data.credits.prepaid > 0 && (
                <p className="text-sm text-muted-foreground">
                  ${(data.credits.prepaid / 100).toFixed(2)} prepaid
                  {data.credits.bonus > 0 && ` + $${(data.credits.bonus / 100).toFixed(2)} bonus`}
                </p>
              )}
            </div>
            <Button 
              onClick={async () => {
                try {
                  const res = await fetch("/api/billing/credits", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ packageId: "medium" }),
                  });
                  const json = await res.json();
                  if (json.data?.checkoutUrl) {
                    window.location.href = json.data.checkoutUrl;
                  }
                } catch {
                  setError("Failed to open credits checkout");
                }
              }}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Buy Credits
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="p-3 border rounded-lg text-center">
              <p className="font-bold">$25</p>
              <p className="text-sm text-muted-foreground">50 credits</p>
            </div>
            <div className="p-3 border rounded-lg text-center border-primary bg-primary/5">
              <p className="font-bold">$50</p>
              <p className="text-sm text-muted-foreground">110 credits</p>
              <Badge variant="secondary" className="mt-1 text-xs">+10% bonus</Badge>
            </div>
            <div className="p-3 border rounded-lg text-center">
              <p className="font-bold">$100</p>
              <p className="text-sm text-muted-foreground">250 credits</p>
              <Badge variant="secondary" className="mt-1 text-xs">+25% bonus</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Billing History Placeholder */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Billing History
              </CardTitle>
              <CardDescription>
                Download past invoices
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Download className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Invoice history available in billing portal</p>
            <Button variant="link" onClick={handleManageBilling} className="mt-2">
              Open Billing Portal →
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
