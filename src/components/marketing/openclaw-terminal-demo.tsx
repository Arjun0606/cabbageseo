"use client";

import { useState, useEffect } from "react";

/**
 * Animated terminal demo showing OpenClaw skill commands.
 * CSS-only typing animation — no JS timers for character-by-character.
 * Cycles through: scan → compare → badge
 */

type DemoStep = {
  command: string;
  output: React.ReactNode;
  duration: number; // ms before moving to next
};

const DEMO_STEPS: DemoStep[] = [
  {
    command: "scan stripe.com",
    duration: 4000,
    output: (
      <div className="space-y-1.5">
        <div className="text-zinc-500 text-xs">Scanning across 3 AI platforms...</div>
        <div className="mt-2">
          <span className="text-emerald-400 font-bold text-lg">Score: 78/100</span>
          <span className="text-zinc-600 ml-2 text-xs">AI loves stripe.com</span>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-2">
          <div className="text-center px-2 py-1.5 bg-zinc-800/50 rounded-lg">
            <div className="text-[10px] text-zinc-500">ChatGPT</div>
            <div className="text-emerald-400 font-bold text-sm">Cited</div>
          </div>
          <div className="text-center px-2 py-1.5 bg-zinc-800/50 rounded-lg">
            <div className="text-[10px] text-zinc-500">Perplexity</div>
            <div className="text-emerald-400 font-bold text-sm">Cited</div>
          </div>
          <div className="text-center px-2 py-1.5 bg-zinc-800/50 rounded-lg">
            <div className="text-[10px] text-zinc-500">Google AI</div>
            <div className="text-blue-400 font-bold text-sm">Mentioned</div>
          </div>
        </div>
        <div className="text-zinc-600 text-xs mt-2">
          Full report → cabbageseo.com/r/stripe.com
        </div>
      </div>
    ),
  },
  {
    command: "compare stripe.com vs square.com",
    duration: 5000,
    output: (
      <div className="space-y-1.5">
        <div className="text-zinc-500 text-xs">Scanning both domains...</div>
        <div className="mt-2 grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
          <div className="text-center">
            <div className="text-zinc-400 text-xs">stripe.com</div>
            <div className="text-emerald-400 font-bold text-2xl">78</div>
          </div>
          <div className="text-zinc-600 text-xs font-mono">vs</div>
          <div className="text-center">
            <div className="text-zinc-400 text-xs">square.com</div>
            <div className="text-red-400 font-bold text-2xl">31</div>
          </div>
        </div>
        <div className="text-center mt-1">
          <span className="text-emerald-400 font-semibold text-sm">stripe.com wins by 47 points</span>
        </div>
        <div className="space-y-0.5 text-xs mt-2">
          <div className="flex justify-between"><span className="text-zinc-500">ChatGPT</span><span className="text-emerald-400">stripe.com</span></div>
          <div className="flex justify-between"><span className="text-zinc-500">Perplexity</span><span className="text-emerald-400">stripe.com</span></div>
          <div className="flex justify-between"><span className="text-zinc-500">Google AI</span><span className="text-emerald-400">stripe.com</span></div>
        </div>
        <div className="text-amber-400/80 text-xs mt-2">
          Want to close the gap? → cabbageseo.com/signup
        </div>
      </div>
    ),
  },
  {
    command: "badge yourdomain.com",
    duration: 3500,
    output: (
      <div className="space-y-2">
        <div className="text-zinc-500 text-xs">Generating badge...</div>
        <div className="mt-2 inline-flex items-center bg-zinc-800 rounded-md overflow-hidden border border-zinc-700">
          <div className="px-2.5 py-1 bg-zinc-700 text-zinc-300 text-xs font-medium">AI Visibility</div>
          <div className="px-2.5 py-1 bg-emerald-600 text-white text-xs font-bold">42/100</div>
        </div>
        <div className="text-zinc-500 text-xs mt-1">
          Embed in your README:
        </div>
        <div className="bg-zinc-800/50 rounded px-2 py-1 text-[10px] text-zinc-400 font-mono break-all">
          ![AI Visibility](https://cabbageseo.com/api/badge/score?domain=yourdomain.com)
        </div>
      </div>
    ),
  },
];

export function OpenClawTerminalDemo() {
  const [activeStep, setActiveStep] = useState(0);
  const [phase, setPhase] = useState<"typing" | "output">("typing");

  useEffect(() => {
    const step = DEMO_STEPS[activeStep];

    if (phase === "typing") {
      // Show typing for ~1.5s then show output
      const timer = setTimeout(() => setPhase("output"), 1500);
      return () => clearTimeout(timer);
    }

    // Output phase — wait then advance
    const timer = setTimeout(() => {
      setPhase("typing");
      setActiveStep((prev) => (prev + 1) % DEMO_STEPS.length);
    }, step.duration);
    return () => clearTimeout(timer);
  }, [activeStep, phase]);

  const step = DEMO_STEPS[activeStep];

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl shadow-black/40">
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800/70 border-b border-zinc-800">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/60" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
          <div className="w-3 h-3 rounded-full bg-green-500/60" />
        </div>
        <span className="text-xs text-zinc-500 font-mono ml-2">openclaw — cabbageseo-ai-visibility</span>
      </div>

      {/* Terminal content */}
      <div className="p-5 font-mono text-sm min-h-[280px]">
        {/* Command line */}
        <div className="flex items-center gap-2">
          <span className="text-emerald-400">$</span>
          <span className="text-white">
            {step.command}
            {phase === "typing" && (
              <span className="inline-block w-2 h-4 bg-emerald-400 ml-0.5 animate-pulse" />
            )}
          </span>
        </div>

        {/* Output */}
        {phase === "output" && (
          <div className="mt-3 pl-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {step.output}
          </div>
        )}

        {/* Step indicator */}
        <div className="flex items-center gap-2 mt-6">
          {DEMO_STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => { setActiveStep(i); setPhase("typing"); }}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === activeStep ? "w-6 bg-emerald-400" : "w-2 bg-zinc-700 hover:bg-zinc-600"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
