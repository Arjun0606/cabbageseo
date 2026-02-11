"use client";

import Link from "next/link";
import { ArrowRight, Lock, ListChecks, TrendingUp, Search, FileText, Bell } from "lucide-react";

interface UpgradeGateProps {
  domain: string;
  isInvisible: boolean;
  brandCount: number;
}

const actionPreviews = [
  {
    icon: <FileText className="w-4 h-4 text-emerald-400" />,
    title: "Targeted fix pages generated for each gap",
    blurred: "Our AI detects queries where other brands are cited and you're not, then generates optimized comparison pages, FAQs, and explainers to win those citations back...",
  },
  {
    icon: <Search className="w-4 h-4 text-emerald-400" />,
    title: "Get listed on the trust sources AI checks first",
    blurred: "Create your profile on G2, Capterra, and Product Hunt. AI pulls recommendations from these directories. Here's the step-by-step for each platform...",
  },
  {
    icon: <TrendingUp className="w-4 h-4 text-emerald-400" />,
    title: "Close the gaps in your AI visibility",
    blurred: "Other brands have 3 authority signals you're missing. Build backlinks from industry directories, get mentioned in roundup posts, and...",
  },
  {
    icon: <Bell className="w-4 h-4 text-emerald-400" />,
    title: "Track progress and detect new opportunities weekly",
    blurred: "Daily auto-checks detect new queries to target. Score drop alerts notify you in Slack. New content opportunities appear automatically so you never fall behind...",
  },
];

export default function UpgradeGate({ domain, isInvisible, brandCount }: UpgradeGateProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <ListChecks className="w-5 h-5 text-emerald-400" />
        <h3 className="text-lg font-semibold text-white">
          Your Action Plan
        </h3>
      </div>
      <p className="text-sm text-zinc-400 mb-5">
        {isInvisible
          ? `4 steps to get ${domain} recommended by AI`
          : brandCount > 0
            ? `4 steps to outrank ${brandCount} other brand${brandCount !== 1 ? "s" : ""} in AI recommendations`
            : `4 steps to strengthen ${domain}'s AI visibility`
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
                {i === 0 ? action.title : action.title}
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
        From $39/mo &bull; 14-day money-back guarantee &bull; Cancel anytime
      </p>
    </div>
  );
}
