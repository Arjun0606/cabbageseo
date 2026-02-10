"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSite } from "@/context/site-context";
import {
  FileText,
  Loader2,
  Lock,
  Zap,
  ArrowRight,
  Sparkles,
  Clock,
  Hash,
  Trash2,
} from "lucide-react";

interface PageSummary {
  id: string;
  siteId: string;
  query: string;
  title: string;
  metaDescription: string | null;
  wordCount: number | null;
  aiModel: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

function PagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentSite, organization } = useSite();

  const [pages, setPages] = useState<PageSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generateQuery, setGenerateQuery] = useState("");
  const [error, setError] = useState("");

  const plan = organization?.plan || "free";
  const canGenerate = plan !== "free";

  // Check for query param to auto-generate
  const autoQuery = searchParams.get("generate");

  useEffect(() => {
    if (currentSite?.id) {
      fetchPages();
    }
  }, [currentSite?.id]);

  useEffect(() => {
    if (autoQuery && currentSite?.id && canGenerate && !generating) {
      setGenerateQuery(autoQuery);
      handleGenerate(autoQuery);
    }
  }, [autoQuery, currentSite?.id]);

  const fetchPages = async () => {
    if (!currentSite?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/geo/pages?siteId=${currentSite.id}`);
      if (res.ok) {
        const data = await res.json();
        setPages(data.data?.pages || []);
      }
    } catch (err) {
      console.error("Failed to fetch pages:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (queryOverride?: string) => {
    const q = queryOverride || generateQuery;
    if (!q.trim() || !currentSite?.id || generating) return;

    setGenerating(true);
    setError("");

    try {
      const res = await fetch("/api/geo/pages/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId: currentSite.id, query: q.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.upgradeRequired) {
          setError("Upgrade your plan to generate more pages this month.");
        } else {
          setError(data.error || "Failed to generate page.");
        }
        return;
      }

      // Navigate to the new page
      if (data.data?.page?.id) {
        router.push(`/dashboard/pages/${data.data.page.id}`);
      } else {
        await fetchPages();
        setGenerateQuery("");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (pageId: string) => {
    if (!confirm("Delete this generated page?")) return;

    try {
      const res = await fetch(`/api/geo/pages/${pageId}`, { method: "DELETE" });
      if (res.ok) {
        setPages((prev) => prev.filter((p) => p.id !== pageId));
      }
    } catch {
      console.error("Failed to delete page");
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-zinc-800 rounded-lg animate-pulse" />
        <div className="h-24 bg-zinc-800 rounded-xl animate-pulse" />
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-zinc-800 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Free user — locked state
  if (!canGenerate) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Fix Pages</h1>
          <p className="text-zinc-500 text-sm mt-1">
            Generate comparison pages, explainers, and FAQs to improve your AI visibility
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-zinc-500" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">
            Fix Pages
          </h2>
          <p className="text-zinc-400 max-w-md mx-auto mb-6">
            Generate comparison pages, category explainers, and FAQs that reinforce
            the trust signals AI already looks for when recommending products.
          </p>
          <Link
            href="/settings/billing"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-colors"
          >
            <Zap className="w-5 h-5" />
            Upgrade to Scout ($39/mo)
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-zinc-600 text-xs mt-3">
            Scout includes 3 pages/month. Command includes 15.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Fix Pages</h1>
        <p className="text-zinc-500 text-sm mt-1">
          Generate comparison pages, explainers, and FAQs that reinforce your authority
        </p>
      </div>

      {/* Generate bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-emerald-400" />
          <h2 className="text-white font-semibold">Generate a new page</h2>
        </div>
        <p className="text-zinc-400 text-sm mb-4">
          Enter the query you want AI to cite you for. We'll generate a full page using your citation data, competitor intelligence, and gap analysis.
        </p>
        <div className="flex gap-3">
          <input
            type="text"
            value={generateQuery}
            onChange={(e) => setGenerateQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            placeholder='e.g., "best CRM tools for startups"'
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
          />
          <button
            onClick={() => handleGenerate()}
            disabled={!generateQuery.trim() || generating}
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-medium rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate
              </>
            )}
          </button>
        </div>
        {error && (
          <p className="mt-3 text-red-400 text-sm">{error}</p>
        )}
      </div>

      {/* Pages list */}
      {pages.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
          <FileText className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            No pages generated yet
          </h3>
          <p className="text-zinc-400 text-sm max-w-md mx-auto">
            Enter a query above to generate your first support page.
            The page will be tailored to your site, competitors, and citation data.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {pages.map((page) => (
            <div
              key={page.id}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors group"
            >
              <div className="flex items-start justify-between mb-3">
                <Link
                  href={`/dashboard/pages/${page.id}`}
                  className="flex-1 min-w-0"
                >
                  <p className="text-sm text-emerald-400 mb-1 truncate">
                    &ldquo;{page.query}&rdquo;
                  </p>
                  <h3 className="text-white font-medium leading-tight group-hover:text-emerald-300 transition-colors">
                    {page.title}
                  </h3>
                </Link>
                <button
                  onClick={() => handleDelete(page.id)}
                  className="p-1.5 text-zinc-600 hover:text-red-400 transition-colors ml-2 flex-shrink-0"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-3 text-xs text-zinc-500">
                {page.wordCount && (
                  <span className="flex items-center gap-1">
                    <Hash className="w-3 h-3" />
                    {page.wordCount.toLocaleString()} words
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(page.createdAt).toLocaleDateString()}
                </span>
                <span className="px-2 py-0.5 bg-zinc-800 rounded text-zinc-400">
                  {page.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PagesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
        </div>
      }
    >
      <PagesContent />
    </Suspense>
  );
}
