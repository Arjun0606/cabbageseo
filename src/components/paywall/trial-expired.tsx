"use client";

/**
 * Trial Expired Paywall
 *
 * Full-screen overlay shown when the 7-day free trial ends.
 * Blocks access to dashboard but allows billing page.
 * Designed to convert — shows what they'll lose, not what they'll gain.
 */

import Link from "next/link";
import { ArrowRight, Clock, Eye, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSite } from "@/context/site-context";

const WHAT_YOU_LOSE = [
  {
    icon: Eye,
    title: "AI is recommending your competitors right now",
    description: "Without monitoring, you won't know when AI stops recommending you.",
  },
  {
    icon: TrendingDown,
    title: "Your visibility tracking goes dark",
    description: "No more momentum tracking, alerts, or weekly reports.",
  },
];

export function TrialExpiredPaywall() {
  const { currentSite } = useSite();

  const domain = currentSite?.domain || "your site";

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Clock icon */}
        <div className="flex justify-center mb-6">
          <div className="p-5 bg-red-500/10 rounded-full border border-red-500/20">
            <Clock className="w-10 h-10 text-red-400" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-center text-white mb-2">
          Your free trial has ended
        </h1>
        <p className="text-zinc-400 text-center mb-6">
          Upgrade now to keep monitoring <span className="text-white font-medium">{domain}</span>
        </p>

        {/* What you lose */}
        <div className="space-y-3 mb-8">
          {WHAT_YOU_LOSE.map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800"
              >
                <div className="p-2 rounded-lg bg-red-500/10 shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-red-400" />
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
              Keep tracking — $39/mo (billed annually)
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>

          <p className="text-xs text-zinc-500 text-center">
            Cancel anytime. Your data is saved and waiting.
          </p>
        </div>
      </div>
    </div>
  );
}
