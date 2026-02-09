"use client";

import { Check, Loader2 } from "lucide-react";

interface ScanProgressProps {
  currentStep: number;
  steps: string[];
}

export function ScanProgress({ currentStep, steps }: ScanProgressProps) {
  return (
    <div className="mt-6 bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-xl p-5 text-left">
      <div className="space-y-2 font-mono text-sm">
        {steps.map((step, i) => (
          <div
            key={i}
            className={`flex items-center gap-2.5 transition-colors duration-300 ${
              i < currentStep
                ? "text-emerald-400"
                : i === currentStep
                  ? "text-white"
                  : "text-zinc-600"
            }`}
          >
            {i < currentStep ? (
              <Check className="w-4 h-4 shrink-0" />
            ) : i === currentStep ? (
              <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
            ) : (
              <div className="w-4 h-4 shrink-0" />
            )}
            <span>{step}</span>
          </div>
        ))}
      </div>
      <p className="mt-4 text-zinc-500 text-xs text-center">
        Real AI responses &middot; Not cached &middot; Not simulated
      </p>
    </div>
  );
}
