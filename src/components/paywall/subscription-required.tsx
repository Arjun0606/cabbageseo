"use client";

/**
 * Subscription Required Paywall
 *
 * Full-screen overlay shown for free (unpaid) users.
 * Blocks access to dashboard but allows billing page.
 * Designed to convert — shows what they'll gain.
 */

import Link from "next/link";
import { ArrowRight, Eye, TrendingUp, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSite } from "@/context/site-context";

const WHAT_YOU_GET = [
  {
    icon: Eye,
    title: "See exactly who AI recommends instead of you",
    description: "Real-time citation tracking across ChatGPT, Perplexity, and Google AI.",
  },
  {
    icon: TrendingUp,
    title: "30-day sprint to improve your AI visibility",
    description: "Weekly action plans, gap analysis, and AI-generated fix pages.",
  },
];

export function SubscriptionRequired() {
  const { currentSite } = useSite();

  const domain = currentSite?.domain || "your site";

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Lock icon */}
        <div className="flex justify-center mb-6">
          <div className="p-5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
            <Lock className="w-10 h-10 text-emerald-400" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-center text-white mb-2">
          Subscribe to get started
        </h1>
        <p className="text-zinc-400 text-center mb-6">
          Choose a plan to start tracking <span className="text-white font-medium">{domain}</span>
        </p>

        {/* What you get */}
        <div className="space-y-3 mb-8">
          {WHAT_YOU_GET.map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800"
              >
                <div className="p-2 rounded-lg bg-emerald-500/10 shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{item.title}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{item.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="space-y-3">
          <Link href="/settings/billing" className="block">
            <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white h-12 text-base font-semibold">
              See plans — from $39/mo
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>

          <p className="text-xs text-zinc-500 text-center">
            Cancel anytime. 14-day money-back guarantee.
          </p>
        </div>
      </div>
    </div>
  );
}
