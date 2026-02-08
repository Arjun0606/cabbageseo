"use client";

import { useState } from "react";
import { Code, Copy, Check } from "lucide-react";

interface CopyBadgeCodeProps {
  domain: string;
  reportId: string;
}

export default function CopyBadgeCode({ domain, reportId }: CopyBadgeCodeProps) {
  const [copiedField, setCopiedField] = useState<"markdown" | "html" | null>(null);

  const badgeUrl = `https://cabbageseo.com/api/badge/score?domain=${encodeURIComponent(domain)}`;
  const reportUrl = `https://cabbageseo.com/teaser/${reportId}`;

  const markdownSnippet = `[![AI Visibility](${badgeUrl})](${reportUrl})`;
  const htmlSnippet = `<a href="${reportUrl}"><img src="${badgeUrl}" alt="AI Visibility Score" /></a>`;

  const handleCopy = async (text: string, field: "markdown" | "html") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
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

      {/* Badge preview */}
      <div className="bg-zinc-800/50 rounded-lg p-4 mb-4 flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/badge/score?domain=${encodeURIComponent(domain)}`}
          alt="AI Visibility Score"
          height={20}
        />
      </div>

      {/* Code snippets */}
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
              title="Copy Markdown"
            >
              {copiedField === "markdown" ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
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
              title="Copy HTML"
            >
              {copiedField === "html" ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
