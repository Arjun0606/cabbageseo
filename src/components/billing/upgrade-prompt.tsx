"use client";

import Link from "next/link";
import { Lock, Sparkles, ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface UpgradePromptProps {
  feature: string;
  description?: string;
  benefits?: string[];
  variant?: "card" | "inline" | "modal";
}

export function UpgradePrompt({
  feature,
  description,
  benefits,
  variant = "card",
}: UpgradePromptProps) {
  const defaultBenefits = [
    "Unlimited site audits",
    "AI content generation",
    "Keyword research",
    "Autopilot mode",
  ];

  const displayBenefits = benefits || defaultBenefits;

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
          Starting at $29/month • Cancel anytime
        </p>
      </CardContent>
    </Card>
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

