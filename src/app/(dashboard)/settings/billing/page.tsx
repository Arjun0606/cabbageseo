"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  CreditCard,
  Check,
  Zap,
  Crown,
  Building2,
  ArrowRight,
  Download,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  FileText,
  Link2,
  Search,
  Bot,
  Shield,
  ExternalLink,
  Receipt,
  Settings,
  TrendingUp,
} from "lucide-react";

// Pricing tiers
const pricingPlans = [
  {
    id: "starter",
    name: "Starter",
    price: 29,
    description: "For individuals getting started with SEO",
    features: [
      "1 website",
      "5,000 AI credits/month",
      "50 keyword research queries",
      "10 content generations",
      "Basic technical audit",
      "Email support",
    ],
    limits: {
      sites: 1,
      aiCredits: 5000,
      keywords: 50,
      content: 10,
    },
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: 79,
    description: "For growing businesses serious about SEO",
    features: [
      "3 websites",
      "25,000 AI credits/month",
      "Unlimited keyword research",
      "50 content generations",
      "Full technical audit",
      "Internal link suggestions",
      "GSC & GA4 integration",
      "Priority support",
    ],
    limits: {
      sites: 3,
      aiCredits: 25000,
      keywords: -1,
      content: 50,
    },
    popular: true,
  },
  {
    id: "business",
    name: "Business",
    price: 199,
    description: "For agencies and larger teams",
    features: [
      "10 websites",
      "100,000 AI credits/month",
      "Unlimited keyword research",
      "Unlimited content generations",
      "Full technical audit",
      "Autopilot mode",
      "White-label reports",
      "API access",
      "Dedicated support",
    ],
    limits: {
      sites: 10,
      aiCredits: 100000,
      keywords: -1,
      content: -1,
    },
    popular: false,
  },
];

// Mock current subscription
const currentSubscription = {
  plan: "pro",
  status: "active",
  currentPeriodEnd: "2025-01-09",
  nextBillingAmount: 79,
};

// Mock usage data
const usageData = {
  aiCredits: { used: 18420, limit: 25000 },
  keywords: { used: 847, limit: -1 },
  content: { used: 32, limit: 50 },
  sites: { used: 2, limit: 3 },
};

// Mock invoices
const invoices = [
  { id: "INV-001", date: "Dec 9, 2024", amount: 79, status: "paid" },
  { id: "INV-002", date: "Nov 9, 2024", amount: 79, status: "paid" },
  { id: "INV-003", date: "Oct 9, 2024", amount: 79, status: "paid" },
  { id: "INV-004", date: "Sep 9, 2024", amount: 29, status: "paid" },
];

// On-demand pricing
const onDemandPricing = {
  aiCredits: 0.002, // $0.002 per credit
  content: 2.50, // $2.50 per article
};

export default function BillingPage() {
  const [selectedPlan, setSelectedPlan] = useState(currentSubscription.plan);
  const [onDemandEnabled, setOnDemandEnabled] = useState(true);
  const [spendingLimit, setSpendingLimit] = useState("50");

  const currentPlan = pricingPlans.find(p => p.id === currentSubscription.plan);

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === -1) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return "text-red-600";
    if (percentage >= 75) return "text-orange-600";
    return "text-green-600";
  };

  return (
    <div className="min-h-screen">
      <DashboardHeader
        title="Billing & Usage"
        description="Manage your subscription and monitor usage"
      />

      <div className="p-6 space-y-6">
        {/* Current Plan */}
        <Card className="border-cabbage-200 dark:border-cabbage-800">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-cabbage-500 to-cabbage-600">
                  <Crown className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      {currentPlan?.name} Plan
                    </h2>
                    <Badge className="bg-green-100 text-green-700">Active</Badge>
                  </div>
                  <p className="text-sm text-slate-500">
                    ${currentPlan?.price}/month • Renews on {new Date(currentSubscription.currentPeriodEnd).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline">
                  <Settings className="mr-2 h-4 w-4" />
                  Manage
                </Button>
                <Button>
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Upgrade
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-cabbage-600" />
                  <span className="font-medium">AI Credits</span>
                </div>
                <span className={`text-sm font-semibold ${getUsageColor(getUsagePercentage(usageData.aiCredits.used, usageData.aiCredits.limit))}`}>
                  {((usageData.aiCredits.used / usageData.aiCredits.limit) * 100).toFixed(0)}%
                </span>
              </div>
              <Progress value={getUsagePercentage(usageData.aiCredits.used, usageData.aiCredits.limit)} className="h-2 mb-2" />
              <p className="text-sm text-slate-500">
                {usageData.aiCredits.used.toLocaleString()} / {usageData.aiCredits.limit.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">Content</span>
                </div>
                <span className={`text-sm font-semibold ${getUsageColor(getUsagePercentage(usageData.content.used, usageData.content.limit))}`}>
                  {((usageData.content.used / usageData.content.limit) * 100).toFixed(0)}%
                </span>
              </div>
              <Progress value={getUsagePercentage(usageData.content.used, usageData.content.limit)} className="h-2 mb-2" />
              <p className="text-sm text-slate-500">
                {usageData.content.used} / {usageData.content.limit} articles
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-purple-600" />
                  <span className="font-medium">Keywords</span>
                </div>
                <Badge variant="outline" className="text-green-600">Unlimited</Badge>
              </div>
              <Progress value={0} className="h-2 mb-2" />
              <p className="text-sm text-slate-500">
                {usageData.keywords.used.toLocaleString()} queries this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-orange-600" />
                  <span className="font-medium">Sites</span>
                </div>
                <span className={`text-sm font-semibold ${getUsageColor(getUsagePercentage(usageData.sites.used, usageData.sites.limit))}`}>
                  {usageData.sites.used}/{usageData.sites.limit}
                </span>
              </div>
              <Progress value={getUsagePercentage(usageData.sites.used, usageData.sites.limit)} className="h-2 mb-2" />
              <p className="text-sm text-slate-500">
                {usageData.sites.limit - usageData.sites.used} sites remaining
              </p>
            </CardContent>
          </Card>
        </div>

        {/* On-Demand Spending */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-500" />
                  On-Demand Usage
                </CardTitle>
                <CardDescription>
                  Continue using CabbageSEO when you hit your limits
                </CardDescription>
              </div>
              <Switch checked={onDemandEnabled} onCheckedChange={setOnDemandEnabled} />
            </div>
          </CardHeader>
          {onDemandEnabled && (
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800 dark:text-amber-200">
                      On-demand usage is enabled
                    </p>
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                      When you exceed your plan limits, you'll be charged per usage. Set a spending limit to control costs.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Monthly Spending Limit</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">$</span>
                    <Input
                      type="number"
                      value={spendingLimit}
                      onChange={(e) => setSpendingLimit(e.target.value)}
                      className="w-32"
                    />
                    <span className="text-sm text-slate-500">/month</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    We'll stop usage when this limit is reached
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>On-Demand Pricing</Label>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span>AI Credits</span>
                      <span className="font-medium">${onDemandPricing.aiCredits}/credit</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Content Generation</span>
                      <span className="font-medium">${onDemandPricing.content}/article</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800">
                <div>
                  <p className="font-medium">Current On-Demand Charges</p>
                  <p className="text-sm text-slate-500">This billing period</p>
                </div>
                <p className="text-2xl font-bold">$0.00</p>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Pricing Plans */}
        <Card>
          <CardHeader>
            <CardTitle>Available Plans</CardTitle>
            <CardDescription>Choose the plan that fits your needs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              {pricingPlans.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative p-6 rounded-2xl border-2 transition-all cursor-pointer ${
                    plan.popular
                      ? "border-cabbage-500 bg-cabbage-50/50 dark:bg-cabbage-950/30"
                      : selectedPlan === plan.id
                        ? "border-cabbage-300 bg-slate-50 dark:bg-slate-800"
                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                  }`}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-cabbage-500 text-white">
                      Most Popular
                    </Badge>
                  )}
                  {currentSubscription.plan === plan.id && (
                    <Badge className="absolute top-4 right-4 bg-green-500 text-white">
                      Current
                    </Badge>
                  )}
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                    <div className="mt-2">
                      <span className="text-4xl font-bold">${plan.price}</span>
                      <span className="text-slate-500">/month</span>
                    </div>
                    <p className="text-sm text-slate-500 mt-2">{plan.description}</p>
                  </div>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={currentSubscription.plan === plan.id ? "outline" : "default"}
                    disabled={currentSubscription.plan === plan.id}
                  >
                    {currentSubscription.plan === plan.id ? "Current Plan" : "Select Plan"}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Billing History */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-slate-600" />
                  Billing History
                </CardTitle>
                <CardDescription>View and download past invoices</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-center gap-4">
                    <Receipt className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{invoice.id}</p>
                      <p className="text-sm text-slate-500">{invoice.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold">${invoice.amount}.00</p>
                      <Badge variant="outline" className="text-green-600 border-green-300">
                        {invoice.status}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-slate-600" />
              Payment Method
            </CardTitle>
            <CardDescription>Manage your payment methods</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                  <CreditCard className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <p className="font-medium">•••• •••• •••• 4242</p>
                  <p className="text-sm text-slate-500">Expires 12/2025</p>
                </div>
              </div>
              <Button variant="outline" size="sm">Update</Button>
            </div>
            <div className="mt-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-800">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Secure payments powered by Dodo Payments</p>
                  <p className="text-xs text-slate-500">Your payment information is encrypted and secure</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

