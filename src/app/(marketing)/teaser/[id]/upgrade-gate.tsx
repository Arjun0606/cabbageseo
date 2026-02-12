"use client";

import Link from "next/link";
import { ArrowRight, Lock, ListChecks, TrendingUp, Search, FileText, Bell, AlertTriangle } from "lucide-react";

interface UpgradeGateProps {
  domain: string;
  isInvisible: boolean;
  brandCount: number;
  visibilityScore?: number;
  gapCount?: number;
}

const actionPreviews = [
  {
    icon: <FileText className="w-4 h-4 text-emerald-400" />,
    title: "Targeted fix pages generated for each gap",
    blurred: "Our AI detects queries where you're not being cited, then generates optimized pages, FAQs, and explainers to earn those citations...",
  },
  {
    icon: <Search className="w-4 h-4 text-emerald-400" />,
    title: "Get listed on the trust sources AI checks first",
    blurred: "Create your profile on G2, Capterra, and Product Hunt. AI pulls recommendations from these directories. Here's the step-by-step for each platform...",
  },
  {
    icon: <TrendingUp className="w-4 h-4 text-emerald-400" />,
    title: "Close the gaps in your AI visibility",
    blurred: "You're missing 3 key authority signals AI looks for. Build backlinks from industry directories, get mentioned in roundup posts, and...",
  },
  {
    icon: <Bell className="w-4 h-4 text-emerald-400" />,
    title: "Track progress and detect new opportunities daily",
    blurred: "Daily auto-checks detect new queries to target. Score drop alerts notify you via email. New content opportunities appear automatically so you never fall behind...",
  },
];

export default function UpgradeGate({ domain, isInvisible, brandCount, visibilityScore, gapCount }: UpgradeGateProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden mb-8">
      {/* Urgency bar */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-5 py-2.5 flex items-center gap-2">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <p className="text-amber-300 text-xs font-medium">
          AI models retrain weekly. Your visibility can shift any day.
        </p>
      </div>

      <div className="p-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <ListChecks className="w-5 h-5 text-emerald-400" />
          <h3 className="text-lg font-semibold text-white">
            Your Action Plan
          </h3>
        </div>
        <p className="text-sm text-zinc-400 mb-5">
          {isInvisible
            ? `Get ${domain} recommended by AI — here's the roadmap`
            : gapCount && gapCount > 0
              ? `${gapCount} visibility gap${gapCount > 1 ? "s" : ""} to close for ${domain}`
              : `Steps to strengthen ${domain}'s AI visibility`
          }
        </p>

        {/* Action items — first one visible, rest blurred */}
        <div className="space-y-3 mb-6">
          {actionPreviews.map((action, i) => (
            <div
              key={i}
              className={`rounded-xl p-4 ${
                i === 0
                  ? "bg-zinc-800/50 border border-zinc-700"
                  : "bg-zinc-800/30 border border-zinc-800"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {action.icon}
                <span className={`text-sm font-medium ${i === 0 ? "text-white" : "text-zinc-300"}`}>
                  {action.title}
                </span>
                {i > 0 && (
                  <Lock className="w-3 h-3 text-zinc-600 ml-auto flex-shrink-0" />
                )}
              </div>
              <p
                className={`text-xs leading-relaxed ${
                  i === 0
                    ? "text-zinc-400"
                    : "text-zinc-600 select-none blur-[6px]"
                }`}
              >
                {action.blurred}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Link
          href={`/signup?domain=${encodeURIComponent(domain)}`}
          className="flex items-center justify-center gap-2 w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-colors"
        >
          Start fixing my AI visibility
          <ArrowRight className="w-4 h-4" />
        </Link>
        <p className="text-xs text-zinc-500 text-center mt-2">
          From $49/mo · Cancel anytime
        </p>
      </div>
    </div>
  );
}
