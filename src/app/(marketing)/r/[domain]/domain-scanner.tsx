"use client";

import { useState } from "react";
import { Loader2, Search, ArrowRight, RefreshCw } from "lucide-react";

interface DomainScannerProps {
  domain: string;
}

export default function DomainScanner({ domain }: DomainScannerProps) {
  const [status, setStatus] = useState<"idle" | "scanning" | "done" | "error">("idle");

  const handleScan = async () => {
    setStatus("scanning");
    try {
      const res = await fetch("/api/geo/teaser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 429) {
          setStatus("error");
          return;
        }
        throw new Error(data.error || "Scan failed");
      }

      setStatus("done");
      // Reload the page — the server will now find the report in the DB
      window.location.reload();
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-6">
      <div className="max-w-lg w-full text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-12">
          <img
            src="/apple-touch-icon.png"
            alt="CabbageSEO"
            className="w-8 h-8 rounded-lg"
          />
          <span className="text-xl font-bold text-white">CabbageSEO</span>
        </div>

        {/* Domain */}
        <div className="mb-8">
          <p className="text-zinc-500 text-sm mb-2">AI Visibility Report for</p>
          <p className="text-3xl font-bold text-white">{domain}</p>
        </div>

        {status === "idle" && (
          <>
            <p className="text-zinc-400 mb-6">
              No report found yet. Scan {domain} across ChatGPT, Perplexity &amp; Google AI to see if they recommend it.
            </p>
            <button
              onClick={handleScan}
              className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-colors shadow-lg shadow-emerald-500/20"
            >
              <Search className="w-5 h-5" />
              Scan {domain}
            </button>
            <p className="text-xs text-zinc-600 mt-3">
              Free &bull; Takes ~30 seconds &bull; No signup required
            </p>
          </>
        )}

        {status === "scanning" && (
          <div className="space-y-4">
            <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mx-auto" />
            <p className="text-zinc-300 font-medium">
              Scanning {domain} across 3 AI platforms...
            </p>
            <p className="text-sm text-zinc-500">
              Asking ChatGPT, Perplexity &amp; Google AI if they know this brand
            </p>
          </div>
        )}

        {status === "done" && (
          <div className="space-y-4">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
            <p className="text-zinc-300 font-medium">Loading report...</p>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <p className="text-zinc-400">
              Rate limit reached or scan failed. Try again in a few minutes.
            </p>
            <button
              onClick={() => setStatus("idle")}
              className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try again
            </button>
          </div>
        )}

        {/* Viral loop — scan your own domain */}
        <div className="mt-16 pt-8 border-t border-zinc-800">
          <p className="text-zinc-500 text-sm mb-4">
            Want to check a different domain?
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const input = (e.target as HTMLFormElement).elements.namedItem("d") as HTMLInputElement;
              const val = input.value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
              if (val) window.location.href = `/r/${val}`;
            }}
            className="flex gap-2 max-w-sm mx-auto"
          >
            <input
              name="d"
              type="text"
              placeholder="yourdomain.com"
              className="flex-1 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            <button
              type="submit"
              className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-colors"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
