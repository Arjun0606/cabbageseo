"use client";

import { useState } from "react";
import { Twitter, Linkedin, Copy, Check, Code, Bell, Loader2 } from "lucide-react";

// ============================================
// Share Buttons (uses /r/domain URL)
// ============================================

interface ShareButtonsProps {
  domain: string;
  visibilityScore: number;
  isInvisible: boolean;
  mentionedCount: number;
}

export function ReportShareButtons({
  domain,
  visibilityScore,
  isInvisible,
  mentionedCount,
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const reportUrl = `https://cabbageseo.com/r/${domain}`;

  const shareText =
    `I just checked if AI recommends ${domain}...\n\n` +
    `AI Visibility Score: ${visibilityScore}/100\n` +
    (isInvisible
      ? "Result: INVISIBLE to ChatGPT & Perplexity\n"
      : `Result: Mentioned ${mentionedCount} time(s)\n`) +
    (visibilityScore < 40
      ? `AI barely knows this brand.\n`
      : "") +
    `\nCheck yours free: ${reportUrl}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(reportUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTweet = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
      "_blank"
    );
  };

  const handleLinkedIn = () => {
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(reportUrl)}`,
      "_blank"
    );
  };

  return (
    <div className="flex items-center justify-center gap-3 mb-4">
      <button
        onClick={handleTweet}
        className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm rounded-lg transition-colors"
      >
        <Twitter className="w-4 h-4" />
        Share on X
      </button>
      <button
        onClick={handleLinkedIn}
        className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm rounded-lg transition-colors"
      >
        <Linkedin className="w-4 h-4" />
        LinkedIn
      </button>
      <button
        onClick={handleCopy}
        className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm rounded-lg transition-colors"
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        {copied ? "Copied!" : "Copy link"}
      </button>
    </div>
  );
}

// ============================================
// Badge Embed (uses /r/domain URL)
// ============================================

interface BadgeEmbedProps {
  domain: string;
}

export function ReportBadgeEmbed({ domain }: BadgeEmbedProps) {
  const [copiedField, setCopiedField] = useState<"markdown" | "html" | null>(null);

  const badgeUrl = `https://cabbageseo.com/api/badge/score?domain=${encodeURIComponent(domain)}`;
  const reportUrl = `https://cabbageseo.com/r/${domain}`;

  const markdownSnippet = `[![AI Visibility](${badgeUrl})](${reportUrl})`;
  const htmlSnippet = `<a href="${reportUrl}"><img src="${badgeUrl}" alt="AI Visibility Score" /></a>`;

  const handleCopy = async (text: string, field: "markdown" | "html") => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
      <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
        <Code className="w-5 h-5 text-emerald-400" />
        Embed your score
      </h3>
      <p className="text-sm text-zinc-400 mb-4">
        Add this badge to your README, website, or email signature.
      </p>

      <div className="bg-zinc-800/50 rounded-lg p-4 mb-4 flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/badge/score?domain=${encodeURIComponent(domain)}`}
          alt="AI Visibility Score"
          height={20}
        />
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-zinc-500 uppercase tracking-wide font-medium">
            Markdown
          </label>
          <div className="mt-1 flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-zinc-800 text-zinc-300 text-xs rounded-lg overflow-x-auto whitespace-nowrap">
              {markdownSnippet}
            </code>
            <button
              onClick={() => handleCopy(markdownSnippet, "markdown")}
              className="flex-shrink-0 p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
            >
              {copiedField === "markdown" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="text-xs text-zinc-500 uppercase tracking-wide font-medium">
            HTML
          </label>
          <div className="mt-1 flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-zinc-800 text-zinc-300 text-xs rounded-lg overflow-x-auto whitespace-nowrap">
              {htmlSnippet}
            </code>
            <button
              onClick={() => handleCopy(htmlSnippet, "html")}
              className="flex-shrink-0 p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
            >
              {copiedField === "html" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Score Alert Signup
// ============================================

interface ScoreAlertProps {
  domain: string;
  reportId: string;
}

export function ReportScoreAlert({ domain, reportId }: ScoreAlertProps) {
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

      setStatus(res.ok ? "success" : "error");
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
          {status === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Notify me"}
        </button>
      </form>
      {status === "error" && (
        <p className="text-xs text-red-400 mt-2">Something went wrong. Please try again.</p>
      )}
      <p className="text-xs text-zinc-600 mt-2">No spam. Unsubscribe anytime.</p>
    </div>
  );
}
