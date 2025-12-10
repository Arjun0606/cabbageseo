"use client";

import { useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

// ============================================
// TYPES
// ============================================

interface UsageMetric {
  name: string;
  used: number;
  limit: number;
  unit: string;
}

interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: "paid" | "pending" | "failed";
}

interface Plan {
  id: string;
  name: string;
  price: number;
  interval: "month" | "year";
  features: string[];
  popular?: boolean;
}

// ============================================
// MOCK DATA
// ============================================

const currentPlan = {
  name: "Growth",
  price: 79,
  interval: "month" as const,
  renewsAt: "January 15, 2025",
};

const usage: UsageMetric[] = [
  { name: "Articles Generated", used: 12, limit: 50, unit: "articles" },
  { name: "Keywords Tracked", used: 450, limit: 1000, unit: "keywords" },
  { name: "Pages Crawled", used: 2340, limit: 10000, unit: "pages" },
  { name: "API Calls", used: 8500, limit: 50000, unit: "calls" },
];

const invoices: Invoice[] = [
  { id: "INV-001", date: "Dec 15, 2024", amount: 79, status: "paid" },
  { id: "INV-002", date: "Nov 15, 2024", amount: 79, status: "paid" },
  { id: "INV-003", date: "Oct 15, 2024", amount: 79, status: "paid" },
  { id: "INV-004", date: "Sep 15, 2024", amount: 79, status: "paid" },
];

const plans: Plan[] = [
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
    id: "growth",
    name: "Growth",
    price: 79,
    interval: "month",
    popular: true,
    features: [
      "50 articles/month",
      "1,000 keywords tracked",
      "3 websites",
      "Advanced SEO audit",
      "Auto-fix issues",
      "CMS publishing",
      "Priority support",
    ],
  },
  {
    id: "scale",
    name: "Scale",
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
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {currentPlan.name}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Monthly Price</p>
              <p className="text-2xl font-bold">${currentPlan.price}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Billing Cycle</p>
              <p className="text-2xl font-bold capitalize">{currentPlan.interval}ly</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Next Renewal</p>
              <p className="text-2xl font-bold">{currentPlan.renewsAt}</p>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Dialog open={showUpgrade} onOpenChange={setShowUpgrade}>
              <DialogTrigger asChild>
                <Button>
                  <Zap className="w-4 h-4 mr-2" />
                  Upgrade Plan
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
                  {plans.map((plan) => (
                    <PlanCard
                      key={plan.id}
                      plan={plan}
                      isCurrent={plan.name === currentPlan.name}
                      onSelect={() => setShowUpgrade(false)}
                    />
                  ))}
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline">
              <CreditCard className="w-4 h-4 mr-2" />
              Update Payment
            </Button>
            <Button variant="ghost" className="text-red-500">
              Cancel Plan
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
            <Badge variant="outline">
              <Clock className="w-3 h-3 mr-1" />
              Resets in 12 days
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2">
            {usage.map((metric) => {
              const percentage = Math.round((metric.used / metric.limit) * 100);
              const isNearLimit = percentage >= 80;
              const isOverLimit = percentage >= 100;

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
                    value={Math.min(percentage, 100)}
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

          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Need more resources?</p>
                <p className="text-sm text-muted-foreground">
                  Add on-demand credits or upgrade your plan
                </p>
              </div>
              <Button variant="outline" size="sm">
                <Sparkles className="w-4 h-4 mr-2" />
                Buy Credits
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* On-Demand Credits */}
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
              <p className="text-3xl font-bold">$0.00</p>
            </div>
            <Button>
              <CreditCard className="w-4 h-4 mr-2" />
              Add Credits
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            <p className="mb-2">On-demand pricing (90% markup):</p>
            <ul className="space-y-1 ml-4">
              <li>• Articles: $0.50 per article</li>
              <li>• Keywords: $0.01 per keyword</li>
              <li>• Pages crawled: $0.001 per page</li>
              <li>• API calls: $0.0001 per call</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Invoices */}
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
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.id}</TableCell>
                  <TableCell>{invoice.date}</TableCell>
                  <TableCell>${invoice.amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        invoice.status === "paid"
                          ? "default"
                          : invoice.status === "pending"
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
