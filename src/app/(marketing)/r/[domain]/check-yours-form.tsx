"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface CheckYoursFormProps {
  currentDomain: string;
}

export default function CheckYoursForm({ currentDomain }: CheckYoursFormProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = (e.target as HTMLFormElement).elements.namedItem(
      "domain"
    ) as HTMLInputElement;
    const val = input.value
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split("/")[0];
    if (val) window.location.href = `/r/${val}`;
  };

  return (
    <div className="bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-emerald-950/40 border border-emerald-500/20 rounded-2xl p-8 text-center">
      <h2 className="text-2xl font-bold text-white mb-2">
        What&apos;s <span className="text-emerald-400">your</span> AI visibility
        score?
      </h2>
      <p className="text-zinc-400 mb-6 max-w-lg mx-auto">
        You just saw {currentDomain}&apos;s score. Now check yours &mdash; takes
        10 seconds, no signup.
      </p>
      <form onSubmit={handleSubmit} className="max-w-md mx-auto mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            name="domain"
            placeholder="yourdomain.com"
            required
            className="flex-1 px-5 py-3.5 bg-zinc-800 border-2 border-zinc-700 rounded-xl text-white text-lg placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
          <button
            type="submit"
            className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
          >
            Check mine
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </form>
      <p className="text-xs text-zinc-500 mb-4">
        Free &bull; No signup &bull; Real AI responses from ChatGPT, Perplexity
        &amp; Google
      </p>
      <div className="pt-4 border-t border-zinc-800">
        <Link
          href={`/signup?domain=${encodeURIComponent(currentDomain)}`}
          className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          or start fixing {currentDomain}&apos;s AI visibility with targeted fix
          pages &rarr;
        </Link>
      </div>
    </div>
  );
}
