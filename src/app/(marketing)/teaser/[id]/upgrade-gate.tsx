"use client";

import Link from "next/link";
import { ArrowRight, Lock, ListChecks, TrendingUp, Search, FileText, Bell, AlertTriangle, Zap } from "lucide-react";

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
    step: 1,
    title: "Fix pages generated for each gap",
    detail: "AI-optimized comparison pages targeting queries where you're not being cited",
    blurred: "Our AI detects queries where you're not being cited, then generates optimized pages, FAQs, and explainers to earn those citations...",
  },
  {
    icon: <Search className="w-4 h-4 text-emerald-400" />,
    step: 2,
    title: "Get listed on sources AI checks first",
    detail: "Directory and review site profiles that AI pulls recommendations from",
    blurred: "Create your profile on G2, Capterra, and Product Hunt. AI pulls recommendations from these directories. Here's the step-by-step for each platform...",
  },
  {
    icon: <TrendingUp className="w-4 h-4 text-emerald-400" />,
    step: 3,
    title: "Close authority signal gaps",
    detail: "Build the backlinks and mentions AI uses to evaluate brand trust",
    blurred: "You're missing 3 key authority signals AI looks for. Build backlinks from industry directories, get mentioned in roundup posts, and...",
  },
  {
    icon: <Bell className="w-4 h-4 text-emerald-400" />,
    step: 4,
    title: "Track & detect new opportunities daily",
    detail: "Auto-scans across ChatGPT, Perplexity & Google AI with alerts",
    blurred: "Daily auto-checks detect new queries to target. Score drop alerts notify you via email. New content opportunities appear automatically so you never fall behind...",
  },
];

export default function UpgradeGate({ domain, isInvisible, brandCount, visibilityScore, gapCount }: UpgradeGateProps) {
  return (
    <div className="relative bg-zinc-900 border border-zinc-800/80 rounded-2xl overflow-hidden mb-8 shadow-xl">
      {/* Ambient glow */}
      <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-[300px] h-[150px] bg-emerald-500/[0.04] rounded-full blur-[80px] pointer-events-none" />

      {/* Urgency bar */}
      <div className="relative bg-red-500/10 border-b border-red-500/20 px-5 py-3 flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-md bg-red-500/15 border border-red-500/25 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-3 h-3 text-red-400" />
        </div>
        <p className="text-red-300 text-xs font-medium">
          {isInvisible
            ? `${domain} is invisible to AI right now. Every day this continues, buyers go to competitors.`
            : "AI models retrain weekly. Your visibility can shift any day."
          }
        </p>
      </div>

      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <ListChecks className="w-4 h-4 text-emerald-400" />
          </div>
          <h3 className="text-lg font-bold text-white">
            Your Action Plan
          </h3>
        </div>
        <p className="text-sm text-zinc-400 mb-6 ml-[42px]">
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
              className={`rounded-xl p-4 transition-all ${
                i === 0
                  ? "bg-zinc-800/60 border border-zinc-700/60"
                  : "bg-zinc-800/30 border border-zinc-800/60"
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Step number */}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  i === 0
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-zinc-800 text-zinc-500 border border-zinc-700/50"
                }`}>
                  {action.step}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-sm font-medium ${i === 0 ? "text-white" : "text-zinc-300"}`}>
                      {action.title}
                    </span>
                    {i > 0 && (
                      <Lock className="w-3 h-3 text-zinc-600 ml-auto flex-shrink-0" />
                    )}
                  </div>
                  {i === 0 ? (
                    <>
                      <p className="text-xs text-zinc-400 leading-relaxed mb-2">
                        {action.detail}
                      </p>
                      <p className="text-xs text-zinc-500 leading-relaxed">
                        {action.blurred}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-zinc-600 leading-relaxed select-none blur-[6px]">
                      {action.blurred}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Gradient divider */}
        <div className="w-1/2 h-px mx-auto bg-gradient-to-r from-transparent via-zinc-700/50 to-transparent mb-6" />

        {/* CTA */}
        <Link
          href={`/signup?domain=${encodeURIComponent(domain)}${visibilityScore !== undefined ? `&score=${visibilityScore}` : ""}`}
          className="group flex items-center justify-center gap-2 w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-all duration-200 shadow-lg hover:scale-[1.02] active:scale-[0.98]"
        >
          <Zap className="w-4 h-4" />
          Start fixing my AI visibility
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </Link>

        {/* Trust signals */}
        <p className="text-center text-xs text-zinc-500 mt-3">
          Cancel anytime &middot; No contracts
        </p>
      </div>
    </div>
  );
}
