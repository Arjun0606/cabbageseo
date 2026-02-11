"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, Check, ArrowRight, Loader2, RefreshCw } from "lucide-react";

interface FixPage {
  id: string;
  query: string;
  wordCount: number | null;
  status: string;
}

interface FixPagesReadyProps {
  pages: FixPage[];
  onMarkPublished: (pageId: string) => void;
  onRecheck: () => void;
  checking: boolean;
}

export function FixPagesReady({
  pages,
  onMarkPublished,
  onRecheck,
  checking,
}: FixPagesReadyProps) {
  const [publishing, setPublishing] = useState<string | null>(null);

  const draftPages = pages.filter((p) => p.status === "draft");
  const publishedPages = pages.filter((p) => p.status === "published");
  const allPublished = draftPages.length === 0 && publishedPages.length > 0;

  const handlePublish = async (pageId: string) => {
    setPublishing(pageId);
    try {
      const res = await fetch(`/api/geo/pages/${pageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "published" }),
      });
      if (res.ok) {
        onMarkPublished(pageId);
      }
    } finally {
      setPublishing(null);
    }
  };

  // All pages published — show recheck CTA
  if (allPublished) {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <Check className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold">
              {publishedPages.length} page{publishedPages.length !== 1 ? "s" : ""} published
            </h3>
            <p className="text-zinc-400 text-sm">
              Recheck now to see if AI is picking them up
            </p>
          </div>
        </div>
        <button
          onClick={onRecheck}
          disabled={checking}
          className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl transition-colors disabled:opacity-50"
        >
          {checking ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Recheck AI visibility
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <FileText className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-white font-semibold">
            {draftPages.length > 0
              ? `We generated ${draftPages.length} fix page${draftPages.length !== 1 ? "s" : ""} for you`
              : `${publishedPages.length} page${publishedPages.length !== 1 ? "s" : ""} ready`}
          </h3>
          <p className="text-zinc-400 text-sm">
            Publish these on your site to improve AI visibility
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {pages.map((page) => {
          const isPublished = page.status === "published";
          const isPublishing = publishing === page.id;

          return (
            <div
              key={page.id}
              className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50"
            >
              <div className="flex-1 min-w-0 mr-3">
                <p className="text-sm text-white truncate">
                  &ldquo;{page.query}&rdquo;
                </p>
                <p className="text-xs text-zinc-500">
                  {page.wordCount ? `${page.wordCount.toLocaleString()} words` : "Ready"}{" "}
                  {isPublished && (
                    <span className="text-emerald-400">
                      &middot; Published
                    </span>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <Link
                  href={`/dashboard/pages/${page.id}`}
                  className="px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-700/50 hover:bg-zinc-700 rounded-lg transition-colors"
                >
                  View & Copy
                </Link>
                {!isPublished && (
                  <button
                    onClick={() => handlePublish(page.id)}
                    disabled={isPublishing}
                    className="px-3 py-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isPublishing ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      "I Published This"
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {draftPages.length > 0 && (
        <div className="mt-4 border-t border-zinc-800 pt-3">
          <p className="text-xs text-zinc-500 font-medium mb-1.5">How it works:</p>
          <ol className="text-xs text-zinc-500 space-y-1 list-decimal list-inside">
            <li>Click &ldquo;View &amp; Copy&rdquo; to see the full page and copy the content</li>
            <li>Paste it as a new page on your website</li>
            <li>Click &ldquo;I Published This&rdquo; so we know to track its impact</li>
          </ol>
        </div>
      )}
    </div>
  );
}
