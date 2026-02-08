"use client";

import Link from "next/link";
import { ArrowRight, Lock, ListChecks, TrendingUp, Search, FileText, Bell } from "lucide-react";

interface UpgradeGateProps {
  domain: string;
  isInvisible: boolean;
  competitorCount: number;
}

const actionPreviews = [
  {
    icon: <Search className="w-4 h-4 text-emerald-400" />,
    title: "Get listed on the trust sources AI checks first",
    blurred: "Create your profile on G2, Capterra, and Product Hunt. AI pulls recommendations from these directories. Here's the step-by-step for each platform...",
  },
  {
    icon: <FileText className="w-4 h-4 text-emerald-400" />,
    title: "Publish comparison content that AI can cite",
    blurred: "Create a 'vs competitor' page and a category explainer that matches the queries where you're losing. Target the exact phrasing AI uses when...",
  },
  {
    icon: <TrendingUp className="w-4 h-4 text-emerald-400" />,
    title: "Fix the authority gaps competitors exploit",
    blurred: "Your competitors have 3 authority signals you're missing. Build backlinks from industry directories, get mentioned in roundup posts, and...",
  },
  {
    icon: <Bell className="w-4 h-4 text-emerald-400" />,
    title: "Set up automated monitoring so you never fall behind",
    blurred: "Configure daily auto-checks and score drop alerts. Get notified in Slack the moment a competitor gains a citation you lost...",
  },
];

export default function UpgradeGate({ domain, isInvisible, competitorCount }: UpgradeGateProps) {
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
          : competitorCount > 0
            ? `4 steps to outrank ${competitorCount} competitor${competitorCount !== 1 ? "s" : ""} in AI recommendations`
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
        Unlock your full action plan
        <ArrowRight className="w-4 h-4" />
      </Link>
      <p className="text-xs text-zinc-500 text-center mt-2">
        Free 7-day trial &bull; No credit card required
      </p>
    </div>
  );
}
