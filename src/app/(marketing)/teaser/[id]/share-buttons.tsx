"use client";

import { useState } from "react";
import { Twitter, Linkedin, Copy, Check } from "lucide-react";

interface ShareButtonsProps {
  domain: string;
  reportId: string;
  isInvisible: boolean;
  visibilityScore: number;
  brandCount: number;
  mentionedCount: number;
}

export default function ShareButtons({
  domain,
  reportId,
  isInvisible,
  visibilityScore,
  brandCount,
  mentionedCount,
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const reportUrl = `https://cabbageseo.com/teaser/${reportId}`;

  const shareText =
    `I just checked if AI recommends ${domain}...\n\n` +
    `AI Visibility Score: ${visibilityScore}/100\n` +
    (isInvisible
      ? "Result: INVISIBLE to ChatGPT & Perplexity\n"
      : `Result: Mentioned ${mentionedCount} time(s)\n`) +
    (brandCount > 0
      ? `AI recommends ${brandCount} other brands instead.\n`
      : "") +
    `\nCheck yours free: ${reportUrl}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText);
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
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}
