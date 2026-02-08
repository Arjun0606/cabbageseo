"use client";

import { useState } from "react";
import { Bell, Check, Loader2 } from "lucide-react";

interface ScoreAlertSignupProps {
  domain: string;
  reportId: string;
}

export default function ScoreAlertSignup({ domain, reportId }: ScoreAlertSignupProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");

    try {
      const res = await fetch("/api/teaser/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), domain, reportId }),
      });

      if (res.ok) {
        setStatus("success");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-5 mb-8 text-center">
        <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
          <Check className="w-5 h-5 text-emerald-400" />
        </div>
        <p className="text-white font-medium mb-1">You&apos;re subscribed</p>
        <p className="text-sm text-zinc-400">
          We&apos;ll rescan {domain} weekly and email you when your score changes.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-8">
      <div className="flex items-center gap-2 mb-1">
        <Bell className="w-4 h-4 text-emerald-400" />
        <h3 className="text-sm font-semibold text-white">
          Get notified when your score changes
        </h3>
      </div>
      <p className="text-xs text-zinc-400 mb-3">
        We&apos;ll rescan {domain} weekly and email you if your AI visibility goes up or down.
      </p>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          required
          className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
          disabled={status === "loading"}
        />
        <button
          type="submit"
          disabled={status === "loading" || !email.trim()}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-700 disabled:cursor-not-allowed text-black text-sm font-semibold rounded-lg transition-colors flex items-center gap-1.5"
        >
          {status === "loading" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Notify me"
          )}
        </button>
      </form>
      {status === "error" && (
        <p className="text-xs text-red-400 mt-2">Something went wrong. Please try again.</p>
      )}
      <p className="text-xs text-zinc-600 mt-2">
        No spam. Unsubscribe anytime.
      </p>
    </div>
  );
}
