"use client";

import Link from "next/link";
import { Target, ArrowRight, AlertTriangle, Check, FileText, MessageSquareQuote } from "lucide-react";

interface LostQuery {
  query: string;
  platform: string;
  snippet?: string;
}

interface PageInfo {
  id: string;
  status: string;
}

interface RevenueAtRiskProps {
  queriesLost: number;
  queriesTotal: number;
  lostQueries?: LostQuery[];
  existingPages?: Map<string, PageInfo>;
  checking?: boolean;
  loading?: boolean;
  onRunCheck?: () => void;
}

export type { LostQuery };

export function RevenueAtRisk({
  queriesLost,
  queriesTotal,
  lostQueries,
  existingPages,
  checking,
  loading,
  onRunCheck,
}: RevenueAtRiskProps) {
  if (loading) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 animate-pulse">
        <div className="h-5 w-40 bg-zinc-800 rounded mb-4" />
        <div className="h-12 w-32 bg-zinc-800 rounded mb-3" />
        <div className="h-4 w-full bg-zinc-800 rounded" />
      </div>
    );
  }

  if (queriesLost === 0 && (!lostQueries || lostQueries.length === 0)) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-4 h-4 text-zinc-500" />
          <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wide">
            Lost Queries
          </h3>
        </div>
        <p className="text-zinc-500 text-sm mb-1">
          When someone asks AI &ldquo;what&apos;s the best tool for X?&rdquo; and you&apos;re not mentioned &mdash; that&apos;s a lost query.
        </p>
        <p className="text-zinc-600 text-xs">
          Run a check to discover which buyer questions you&apos;re missing from.
        </p>
      </div>
    );
  }

  const lossRate = queriesTotal > 0
    ? Math.round((queriesLost / queriesTotal) * 100)
    : 0;
  const isCritical = lossRate >= 70;
  const isWarning = lossRate >= 40;

  const borderColor = isCritical
    ? "border-red-500/30 bg-red-500/5"
    : isWarning
      ? "border-amber-500/20 bg-amber-500/5"
      : "border-zinc-800 bg-zinc-900";

  return (
    <div className={`rounded-2xl p-6 border ${borderColor}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target
            className={`w-5 h-5 ${
              isCritical
                ? "text-red-400"
                : isWarning
                  ? "text-amber-400"
                  : "text-zinc-400"
            }`}
          />
          <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wide">
            Queries You&apos;re Losing
          </h3>
        </div>
        {isCritical && (
          <span className="px-2 py-0.5 bg-red-500/10 text-red-400 text-xs font-medium rounded flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            {lossRate}% lost
          </span>
        )}
      </div>

      {/* Big number */}
      <div className="mb-4">
        <div className="flex items-end gap-2">
          <span
            className={`text-4xl font-bold ${
              isCritical ? "text-red-400" : isWarning ? "text-amber-400" : "text-white"
            }`}
          >
            {queriesLost}
          </span>
          <span className="text-zinc-500 text-lg mb-1">
            of {queriesTotal} queries
          </span>
        </div>
        <p className={`text-sm mt-1 ${isCritical ? "text-red-400/80" : "text-zinc-500"}`}>
          {isCritical
            ? "You're missing from most buyer queries where AI could recommend you"
            : isWarning
              ? "AI isn't mentioning you for a significant portion of buyer queries"
              : "Queries where AI isn't citing you yet"}
        </p>
      </div>

      {/* Per-query breakdown (if available from latest check) */}
      {lostQueries && lostQueries.length > 0 ? (
        (() => {
          const unfixedCount = lostQueries.filter(
            (lq) => !existingPages?.get(lq.query.toLowerCase())
          ).length;
          return (
        <div className="space-y-2 mt-4 pt-4 border-t border-zinc-800">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-zinc-500 uppercase tracking-wide">
              Queries you&apos;re missing from
            </p>
            {unfixedCount > 0 && (
              <span className="text-xs text-amber-400">
                {unfixedCount} unfixed
              </span>
            )}
          </div>
          {lostQueries.slice(0, 5).map((lq, i) => {
            const pageInfo = existingPages?.get(lq.query.toLowerCase());
            const isPublished = pageInfo?.status === "published";
            const hasDraft = pageInfo && !isPublished;

            // Published → link to page, Draft → link to page, No page → generate
            const href = isPublished
              ? `/dashboard/pages/${pageInfo.id}`
              : hasDraft
                ? `/dashboard/pages/${pageInfo.id}`
                : `/dashboard/pages?generate=${encodeURIComponent(lq.query)}`;

            return (
              <Link
                key={i}
                href={href}
                className="block p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">&ldquo;{lq.query}&rdquo;</p>
                    <p className="text-xs text-zinc-500">
                      Not cited on {lq.platform === "google_aio" ? "Google AI" : lq.platform === "perplexity" ? "Perplexity" : "ChatGPT"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                    {isPublished ? (
                      <span className="flex items-center gap-1 text-xs text-emerald-400">
                        <Check className="w-3 h-3" />
                        Published
                      </span>
                    ) : hasDraft ? (
                      <>
                        <span className="text-xs text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          Page Ready
                        </span>
                        <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-amber-400 transition-colors" />
                      </>
                    ) : (
                      <>
                        <span className="text-xs text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          Generate Fix
                        </span>
                        <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-emerald-400 transition-colors" />
                      </>
                    )}
                  </div>
                </div>
                {lq.snippet && (
                  <div className="mt-2 flex items-start gap-2 pl-1">
                    <MessageSquareQuote className="w-3 h-3 text-red-400/60 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-400/70 italic line-clamp-2">
                      &ldquo;{lq.snippet.slice(0, 150).trim()}{lq.snippet.length > 150 ? "..." : ""}&rdquo;
                    </p>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
          );
        })()
      ) : (
        onRunCheck && (
          <button
            onClick={onRunCheck}
            disabled={checking}
            className="mt-2 text-sm text-emerald-400 hover:text-emerald-300 disabled:text-zinc-600 font-medium transition-colors"
          >
            {checking
              ? "Checking..."
              : "Run check to see per-query breakdown →"}
          </button>
        )
      )}
    </div>
  );
}
