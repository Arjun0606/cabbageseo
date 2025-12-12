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

// ============================================
// TYPES
// ============================================

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
}: {
  plan: Plan;
  isCurrent: boolean;
  onSelect: () => void;
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
          disabled={isCurrent}
          onClick={onSelect}
        >
          {isCurrent ? (
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

  useEffect(() => {
    async function fetchUsage() {
      try {
        const res = await fetch("/api/billing/usage");
        if (!res.ok) throw new Error("Failed to fetch usage data");
        const json = await res.json();
        setData(json);
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
      if (json.url) {
        window.location.href = json.url;
      }
    } catch {
      console.error("Failed to open billing portal");
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
                      onSelect={() => {
                        setShowUpgrade(false);
                        // In production, this would call the checkout API
                        window.location.href = `/api/billing/checkout?plan=${plan.id}`;
                      }}
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

      {/* Credits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            On-Demand Credits
          </CardTitle>
          <CardDescription>
            Pay-as-you-go credits for extra usage
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
            <Button>
              <CreditCard className="w-4 h-4 mr-2" />
              Add Credits
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            <p className="mb-2">On-demand pricing:</p>
            <ul className="space-y-1 ml-4">
              <li>• Articles: $0.50 per article</li>
              <li>• Keywords: $0.01 per keyword</li>
              <li>• Pages crawled: $0.001 per page</li>
              <li>• SERP calls: $0.01 per call</li>
            </ul>
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
