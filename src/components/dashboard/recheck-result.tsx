"use client";

import { TrendingUp, Clock, X } from "lucide-react";

interface RecheckDelta {
  beforeWon: number;
  afterWon: number;
  beforeTotal: number;
  afterTotal: number;
  delta: number;
}

interface RecheckResultProps {
  delta: RecheckDelta;
  onDismiss: () => void;
}

export function RecheckResult({ delta, onDismiss }: RecheckResultProps) {
  const improved = delta.delta > 0;
  const declined = delta.delta < 0;

  return (
    <div
      className={`rounded-2xl p-5 border relative ${
        improved
          ? "bg-emerald-500/10 border-emerald-500/20"
          : declined
            ? "bg-red-500/10 border-red-500/20"
            : "bg-zinc-800/50 border-zinc-700/50"
      }`}
    >
      <button
        onClick={onDismiss}
        className="absolute top-3 right-3 text-zinc-500 hover:text-white transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      {improved ? (
        <>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold">
                Your AI visibility improved!
              </h3>
              <p className="text-emerald-400 text-sm font-medium">
                +{delta.delta} quer{delta.delta === 1 ? "y" : "ies"} won back
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-zinc-500">
              {delta.beforeWon}/{delta.beforeTotal}
            </span>
            <span className="text-zinc-600">&rarr;</span>
            <span className="text-white font-medium">
              {delta.afterWon}/{delta.afterTotal} queries won
            </span>
          </div>
        </>
      ) : declined ? (
        <>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-red-400 rotate-180" />
            </div>
            <div>
              <h3 className="text-white font-semibold">
                Visibility dropped
              </h3>
              <p className="text-red-400 text-sm font-medium">
                {delta.delta} quer{Math.abs(delta.delta) === 1 ? "y" : "ies"} lost
              </p>
            </div>
          </div>
          <p className="text-zinc-400 text-sm">
            Competitors may have published new content. Check the Actions tab for fix pages.
          </p>
        </>
      ) : (
        <>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-zinc-700/50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-zinc-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold">
                No change yet
              </h3>
              <p className="text-zinc-400 text-sm">
                AI platforms haven&apos;t picked up your changes yet
              </p>
            </div>
          </div>
          <p className="text-zinc-500 text-sm">
            This usually takes 1-2 weeks. We&apos;ll check again automatically and notify you when things change.
          </p>
        </>
      )}
    </div>
  );
}
