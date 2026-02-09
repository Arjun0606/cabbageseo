"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock, Sparkles, ArrowRight, Zap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCheckout } from "@/hooks/use-checkout";
import {
  CITATION_PLANS,
  getPlanDiffs,
  type CitationPlanId,
} from "@/lib/billing/citation-plans";

interface UpgradePromptProps {
  feature: string;
  description?: string;
  benefits?: string[];
  variant?: "card" | "inline" | "modal";
  // Modal-only props
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  targetPlan?: string;
  currentPlan?: string;
}

export function UpgradePrompt({
  feature,
  description,
  benefits,
  variant = "card",
  open,
  onOpenChange,
  targetPlan = "scout",
  currentPlan = "free",
}: UpgradePromptProps) {
  const defaultBenefits = [
    "Unlimited site audits",
    "AI content generation",
    "Keyword research",
    "Autopilot mode",
  ];

  const displayBenefits = benefits || defaultBenefits;

  // Inline variant
  if (variant === "inline") {
    return (
      <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
        <Lock className="w-5 h-5 text-emerald-400" />
        <span className="text-sm text-zinc-300">
          {feature} requires a paid plan.
        </span>
        <Link href="/pricing" className="ml-auto">
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white">
            Upgrade
          </Button>
        </Link>
      </div>
    );
  }

  // Modal variant
  if (variant === "modal") {
    return (
      <UpgradeModal
        open={open || false}
        onOpenChange={onOpenChange || (() => {})}
        feature={feature}
        description={description}
        targetPlan={targetPlan}
        currentPlan={currentPlan}
      />
    );
  }

  // Card variant (default)
  return (
    <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
      <CardContent className="p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-emerald-400" />
        </div>

        <h3 className="text-2xl font-bold text-white mb-2">
          Unlock {feature}
        </h3>

        <p className="text-zinc-400 mb-6 max-w-md mx-auto">
          {description || `Upgrade to a paid plan to access ${feature.toLowerCase()} and grow your organic traffic.`}
        </p>

        <div className="flex flex-wrap justify-center gap-3 mb-6">
          {displayBenefits.map((benefit, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-sm bg-zinc-800/50 px-3 py-1.5 rounded-full"
            >
              <Zap className="w-3 h-3 text-emerald-400" />
              <span className="text-zinc-300">{benefit}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/pricing">
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-500 text-white">
              <Sparkles className="w-4 h-4 mr-2" />
              View Plans
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

        <p className="text-xs text-zinc-400 mt-4">
          Starting at $49/month
        </p>
      </CardContent>
    </Card>
  );
}

// ============================================
// UPGRADE MODAL — Rich plan comparison + one-click checkout
// ============================================

function UpgradeModal({
  open,
  onOpenChange,
  feature,
  description,
  targetPlan,
  currentPlan,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature: string;
  description?: string;
  targetPlan: string;
  currentPlan: string;
}) {
  const { checkout, loading } = useCheckout();
  const [interval, setInterval] = useState<"monthly" | "yearly">("yearly");

  const target = CITATION_PLANS[targetPlan as CitationPlanId];
  if (!target) return null;

  const price = interval === "yearly" ? target.yearlyPrice : target.monthlyPrice;
  const diffs = getPlanDiffs(currentPlan, targetPlan);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-2">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Lock className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl">
            Unlock {feature}
          </DialogTitle>
          {description && (
            <p className="text-center text-sm text-zinc-400 mt-1">{description}</p>
          )}
        </DialogHeader>

        {/* Plan comparison */}
        {diffs.length > 0 && (
          <div className="mt-4 rounded-xl border border-zinc-800 overflow-hidden">
            <div className="grid grid-cols-3 bg-zinc-800/50 text-xs font-medium px-4 py-2.5">
              <span className="text-zinc-500">Feature</span>
              <span className="text-center text-zinc-500">Now</span>
              <span className="text-center text-emerald-400">{target.name}</span>
            </div>
            {diffs.map((diff, i) => (
              <div
                key={i}
                className="grid grid-cols-3 text-sm px-4 py-2.5 border-t border-zinc-800/50"
              >
                <span className="text-zinc-300">{diff.label}</span>
                <span className="text-center text-zinc-500">{diff.current}</span>
                <span className="text-center text-white font-medium">{diff.target}</span>
              </div>
            ))}
          </div>
        )}

        {/* Billing toggle */}
        <div className="mt-4 flex items-center justify-center gap-2 bg-zinc-800/50 rounded-lg p-1">
          <button
            onClick={() => setInterval("monthly")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              interval === "monthly"
                ? "bg-zinc-700 text-white"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setInterval("yearly")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              interval === "yearly"
                ? "bg-emerald-500 text-black"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Yearly
          </button>
        </div>

        {/* Price */}
        <div className="text-center mt-3">
          <span className="text-3xl font-bold text-white">${price}</span>
          <span className="text-zinc-400">/mo</span>
        </div>

        {/* CTA */}
        <button
          onClick={() => checkout(targetPlan, interval)}
          disabled={loading}
          className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl transition-colors disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              Upgrade to {target.name}
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <p className="text-center text-[11px] text-zinc-500 mt-2">
          Cancel anytime. 7-day money-back guarantee.
        </p>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Wrapper component that shows content or upgrade prompt based on subscription
 */
export function PaywallGate({
  children,
  hasAccess,
  feature,
  description,
}: {
  children: React.ReactNode;
  hasAccess: boolean;
  feature: string;
  description?: string;
}) {
  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <UpgradePrompt
      feature={feature}
      description={description}
    />
  );
}
