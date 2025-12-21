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
  Settings,
  ChevronRight,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
    billingInterval: string;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
  };
  usage: {
    articles: number;
    keywords: number;
    audits: number;
    aioAnalyses: number;
    aiCredits: number;
  };
  limits: {
    articles: number;
    keywords: number;
    audits: number;
    aioAnalyses: number;
    aiCredits: number;
  };
  percentages: {
    articles: number;
    keywords: number;
    audits: number;
    aioAnalyses: number;
    aiCredits: number;
  };
  overages?: OverageSettings;
}

interface Plan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  popular?: boolean;
}

// Plans matching PRICING_STRATEGY.md
const availablePlans: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    description: "Perfect for small sites and bloggers",
    monthlyPrice: 29,
    yearlyPrice: 24,
    features: [
      "1 website",
      "10 AI articles/month",
      "100 keywords tracked",
      "5 technical audits/month",
      "20 AIO analyses/month",
      "1,000 AI credits/month",
      "WordPress/Webflow publishing",
      "Email support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    description: "For growing businesses and consultants",
    monthlyPrice: 79,
    yearlyPrice: 66,
    popular: true,
    features: [
      "5 websites",
      "50 AI articles/month",
      "500 keywords tracked",
      "20 technical audits/month",
      "100 AIO analyses/month",
      "5,000 AI credits/month",
      "All CMS integrations",
      "Team collaboration (5 seats)",
      "Google Search Console",
      "API access",
      "Priority support",
    ],
  },
  {
    id: "pro_plus",
    name: "Pro+",
    description: "For agencies and large sites",
    monthlyPrice: 199,
    yearlyPrice: 166,
    features: [
      "20 websites",
      "200 AI articles/month",
      "2,000 keywords tracked",
      "Unlimited audits*",
      "500 AIO analyses/month",
      "20,000 AI credits/month",
      "Premium AI (Claude Opus)",
      "White-label reports",
      "Unlimited team members",
      "Custom integrations",
      "SLA guarantee",
      "Dedicated support",
    ],
  },
];

// Overage pricing from PRICING_STRATEGY.md
const OVERAGE_PRICING = [
  { resource: "Extra Article", price: "$3.00", unit: "per article", margin: "93%" },
  { resource: "Extra Keywords", price: "$5.00", unit: "per 100 keywords", margin: "97%" },
  { resource: "Extra Audit", price: "$1.00", unit: "per audit", margin: "90%" },
  { resource: "AIO Analysis", price: "$0.50", unit: "per analysis", margin: "84%" },
  { resource: "AI Credits", price: "$2.00", unit: "per 1,000 credits", margin: "95%" },
  { resource: "SERP Analysis", price: "$0.25", unit: "per analysis", margin: "92%" },
  { resource: "Backlink Check", price: "$0.50", unit: "per domain", margin: "88%" },
];

// Spending cap presets
const SPENDING_CAP_PRESETS = [
  { value: 10, label: "$10", description: "Testing" },
  { value: 50, label: "$50", description: "Light overflow" },
  { value: 100, label: "$100", description: "Standard" },
  { value: 250, label: "$250", description: "Heavy usage" },
  { value: 500, label: "$500", description: "Agency" },
];

// ============================================
// PLAN CARD
// ============================================

function PlanCard({
  plan,
  isCurrent,
  onSelect,
  loading,
  billingInterval,
}: {
  plan: Plan;
  isCurrent: boolean;
  onSelect: () => void;
  loading?: boolean;
  billingInterval: "monthly" | "yearly";
}) {
  const price = billingInterval === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
  const savings = billingInterval === "yearly" ? Math.round((1 - plan.yearlyPrice / plan.monthlyPrice) * 100) : 0;

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
        <p className="text-sm text-muted-foreground">{plan.description}</p>
        <div className="mt-3">
          <span className="text-4xl font-bold">${price}</span>
          <span className="text-muted-foreground">/month</span>
          {billingInterval === "yearly" && savings > 0 && (
            <Badge variant="secondary" className="ml-2">
              Save {savings}%
            </Badge>
          )}
        </div>
        {billingInterval === "yearly" && (
          <p className="text-xs text-muted-foreground mt-1">
            Billed annually at ${price * 12}/year
          </p>
        )}
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 mb-6 text-sm">
          {plan.features.map((feature, i) => (
            <li key={i} className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
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
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly");

  useEffect(() => {
    async function fetchUsage() {
      try {
        const res = await fetch("/api/billing/usage");
        if (!res.ok) throw new Error("Failed to fetch usage data");
        const json = await res.json();
        setData(json.data || json);
        if (json.data?.overages?.spendingCapDollars || json.overages?.spendingCapDollars) {
          setSpendingCap(String(json.data?.overages?.spendingCapDollars || json.overages?.spendingCapDollars));
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
        body: JSON.stringify({ planId, interval: billingInterval }),
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
    const newCap = Number(spendingCap);
    if (isNaN(newCap) || newCap < 10) {
      setError("Minimum spending cap is $10");
      return;
    }
    
    setSavingOverages(true);
    try {
      const res = await fetch("/api/billing/overages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set_cap", amount: newCap }),
      });
      const json = await res.json();
      if (json.success && data) {
        setData({
          ...data,
          overages: {
            ...data.overages!,
            spendingCapDollars: newCap,
            remainingDollars: newCap - (data.overages?.currentSpendDollars || 0),
          },
        });
      }
    } catch {
      setError("Failed to update spending cap");
    } finally {
      setSavingOverages(false);
    }
  };

  const handleToggleAutoIncrease = async () => {
    if (!data?.overages) return;
    
    setSavingOverages(true);
    try {
      const res = await fetch("/api/billing/overages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "toggle_auto_increase",
          autoIncrease: !data.overages.autoIncrease 
        }),
      });
      const json = await res.json();
      if (json.success) {
        setData({
          ...data,
          overages: {
            ...data.overages,
            autoIncrease: !data.overages.autoIncrease,
          },
        });
      }
    } catch {
      setError("Failed to update auto-increase setting");
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
    { name: "AI Articles", used: data.usage.articles, limit: data.limits.articles, pct: data.percentages.articles, overage: "$3.00/article" },
    { name: "Keywords Tracked", used: data.usage.keywords, limit: data.limits.keywords, pct: data.percentages.keywords, overage: "$5.00/100" },
    { name: "Technical Audits", used: data.usage.audits, limit: data.limits.audits, pct: data.percentages.audits, overage: "$1.00/audit" },
    { name: "AIO Analyses", used: data.usage.aioAnalyses, limit: data.limits.aioAnalyses, pct: data.percentages.aioAnalyses, overage: "$0.50/analysis" },
    { name: "AI Credits", used: data.usage.aiCredits, limit: data.limits.aiCredits, pct: data.percentages.aiCredits, overage: "$2.00/1000" },
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
            <Badge 
              variant={data.plan.status === "active" ? "default" : "secondary"} 
              className="text-lg px-3 py-1 capitalize"
            >
              {data.plan.name}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="text-xl font-semibold capitalize flex items-center gap-2">
                {data.plan.status === "active" && <span className="w-2 h-2 bg-green-500 rounded-full"></span>}
                {data.plan.status}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Billing</p>
              <p className="text-xl font-semibold capitalize">{data.plan.billingInterval || "Monthly"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Next Renewal</p>
              <p className="text-xl font-semibold">
                {data.plan.currentPeriodEnd 
                  ? new Date(data.plan.currentPeriodEnd).toLocaleDateString()
                  : "—"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Time Left</p>
              <p className="text-xl font-semibold">
                {daysUntilRenewal !== null ? `${daysUntilRenewal} days` : "—"}
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
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Choose Your Plan</DialogTitle>
                  <DialogDescription>
                    Select the plan that best fits your needs. All plans include a 14-day free trial.
                  </DialogDescription>
                </DialogHeader>
                
                {/* Billing Toggle */}
                <div className="flex justify-center py-4">
                  <Tabs value={billingInterval} onValueChange={(v) => setBillingInterval(v as "monthly" | "yearly")}>
                    <TabsList>
                      <TabsTrigger value="monthly">Monthly</TabsTrigger>
                      <TabsTrigger value="yearly" className="relative">
                        Yearly
                        <Badge variant="secondary" className="ml-2 text-xs">Save 17%</Badge>
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <div className="grid gap-4 sm:grid-cols-3 py-4">
                  {availablePlans.map((plan) => (
                    <PlanCard
                      key={plan.id}
                      plan={plan}
                      isCurrent={plan.id === data.plan.id}
                      onSelect={() => handleUpgrade(plan.id)}
                      loading={upgrading === plan.id}
                      billingInterval={billingInterval}
                    />
                  ))}
                </div>
                
                <p className="text-xs text-muted-foreground text-center">
                  *Pro+ "Unlimited" audits are soft-capped at 100/month for fair use
                </p>
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
                Track your resource consumption. Overages billed at rates shown.
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
          <div className="space-y-4">
            {usageMetrics.map((metric) => {
              const isNearLimit = metric.pct >= 80;
              const isOverLimit = metric.pct >= 100;

              return (
                <div key={metric.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{metric.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        Overage: {metric.overage}
                      </span>
                      <span
                        className={`text-sm tabular-nums ${
                          isOverLimit
                            ? "text-red-500 font-medium"
                            : isNearLimit
                            ? "text-yellow-500"
                            : "text-muted-foreground"
                        }`}
                      >
                        {metric.used.toLocaleString()} / {metric.limit.toLocaleString()}
                      </span>
                    </div>
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
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Overage / Pay-as-you-go */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Pay-as-You-Go Overages
          </CardTitle>
          <CardDescription>
            Continue using CabbageSEO when you hit plan limits. Set a spending cap to stay in control.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Toggle */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium">Enable pay-as-you-go</p>
                <p className="text-sm text-muted-foreground">
                  {data.overages?.enabled 
                    ? "You'll be charged for usage above plan limits" 
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
                {/* Current spend */}
                <div className="space-y-3 p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Spending This Period</span>
                    <span className="text-lg font-bold">
                      ${data.overages.currentSpendDollars.toFixed(2)} / ${data.overages.spendingCapDollars.toFixed(2)}
                    </span>
                  </div>
                  <Progress 
                    value={data.overages.percentUsed} 
                    className={`h-3 ${
                      data.overages.percentUsed >= 100 
                        ? "[&>div]:bg-red-500" 
                        : data.overages.percentUsed >= 80 
                        ? "[&>div]:bg-yellow-500" 
                        : "[&>div]:bg-green-500"
                    }`}
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>${data.overages.remainingDollars.toFixed(2)} remaining</span>
                    <span>{data.overages.percentUsed}% used</span>
                  </div>
                </div>

                {/* Set cap */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Spending Cap</label>
                  <div className="flex flex-wrap gap-2">
                    {SPENDING_CAP_PRESETS.map((preset) => (
                      <Button
                        key={preset.value}
                        variant={Number(spendingCap) === preset.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSpendingCap(String(preset.value))}
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="number"
                          min="10"
                          step="10"
                          value={spendingCap}
                          onChange={(e) => setSpendingCap(e.target.value)}
                          className="pl-8"
                          placeholder="Custom amount"
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
                </div>

                {/* Auto-increase toggle */}
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div>
                    <p className="font-medium">Auto-increase cap</p>
                    <p className="text-sm text-muted-foreground">
                      Automatically add $50 when cap is reached
                    </p>
                  </div>
                  <Switch
                    checked={data.overages.autoIncrease}
                    onCheckedChange={handleToggleAutoIncrease}
                    disabled={savingOverages}
                  />
                </div>
              </>
            )}

            {/* Pricing table */}
            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Overage Pricing (90% markup from our costs)
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {OVERAGE_PRICING.map((item) => (
                  <div 
                    key={item.resource}
                    className="flex items-center justify-between p-2 text-sm bg-muted/30 rounded"
                  >
                    <span>{item.resource}</span>
                    <span className="font-medium">{item.price} <span className="text-muted-foreground font-normal">{item.unit}</span></span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Invoices & History
              </CardTitle>
              <CardDescription>
                View and download past invoices
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Download className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground mb-2">
              Invoice history is available in the billing portal
            </p>
            <Button variant="outline" onClick={handleManageBilling}>
              Open Billing Portal
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
