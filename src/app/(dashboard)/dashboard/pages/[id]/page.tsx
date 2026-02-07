"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowLeft,
  Copy,
  Check,
  Code,
  FileText,
  Trash2,
  RefreshCw,
  Loader2,
  Hash,
  Clock,
  Tag,
  Users,
} from "lucide-react";

interface GeneratedPage {
  id: string;
  siteId: string;
  query: string;
  title: string;
  metaDescription: string | null;
  body: string;
  schemaMarkup: Record<string, unknown> | null;
  targetEntities: string[];
  competitorsAnalyzed: string[];
  wordCount: number | null;
  aiModel: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

type CopyState = "idle" | "copied";

function CopyButton({
  label,
  icon: Icon,
  onCopy,
}: {
  label: string;
  icon: React.ElementType;
  onCopy: () => void;
}) {
  const [state, setState] = useState<CopyState>("idle");

  const handleClick = () => {
    onCopy();
    setState("copied");
    setTimeout(() => setState("idle"), 2000);
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-lg transition-colors"
    >
      {state === "copied" ? (
        <Check className="w-4 h-4 text-emerald-400" />
      ) : (
        <Icon className="w-4 h-4" />
      )}
      {state === "copied" ? "Copied!" : label}
    </button>
  );
}

// Simple markdown-to-HTML converter for the copy button
function markdownToHtml(md: string): string {
  return md
    .replace(/^### (.*$)/gm, "<h3>$1</h3>")
    .replace(/^## (.*$)/gm, "<h2>$1</h2>")
    .replace(/^# (.*$)/gm, "<h1>$1</h1>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/^\- (.*$)/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/^(?!<[hulo])/gm, "<p>")
    .replace(/(?<![>])$/gm, "</p>")
    .replace(/<p><\/p>/g, "")
    .replace(/<p>(<[hulo])/g, "$1")
    .replace(/(<\/[hulo][^>]*>)<\/p>/g, "$1");
}

export default function PageDetailPage() {
  const params = useParams();
  const router = useRouter();
  const pageId = params.id as string;

  const [page, setPage] = useState<GeneratedPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (pageId) {
      fetchPage();
    }
  }, [pageId]);

  const fetchPage = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/geo/pages/${pageId}`);
      if (!res.ok) {
        setError("Page not found");
        return;
      }
      const data = await res.json();
      setPage(data.data?.page || null);
    } catch {
      setError("Failed to load page");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this page?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/geo/pages/${pageId}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/dashboard/pages");
      }
    } catch {
      setError("Failed to delete page");
    } finally {
      setDeleting(false);
    }
  };

  const handleRegenerate = async () => {
    if (!page) return;
    setRegenerating(true);
    try {
      const res = await fetch("/api/geo/pages/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId: page.siteId, query: page.query }),
      });
      const data = await res.json();
      if (res.ok && data.data?.page?.id) {
        router.push(`/dashboard/pages/${data.data.page.id}`);
      } else {
        setError(data.error || "Failed to regenerate");
      }
    } catch {
      setError("Failed to regenerate");
    } finally {
      setRegenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="text-center py-20">
        <p className="text-red-400 mb-4">{error || "Page not found"}</p>
        <Link
          href="/dashboard/pages"
          className="text-emerald-400 hover:text-emerald-300"
        >
          Back to Pages
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back + actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/pages"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Pages
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="flex items-center gap-2 px-3 py-1.5 text-zinc-400 hover:text-white text-sm transition-colors disabled:opacity-50"
          >
            {regenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Regenerate
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 px-3 py-1.5 text-zinc-400 hover:text-red-400 text-sm transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <p className="text-sm text-emerald-400 mb-2">
          Generated for: &ldquo;{page.query}&rdquo;
        </p>
        <h1 className="text-2xl font-bold text-white mb-2">{page.title}</h1>
        {page.metaDescription && (
          <p className="text-zinc-400 text-sm">{page.metaDescription}</p>
        )}

        <div className="flex items-center gap-4 mt-4 text-xs text-zinc-500">
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
          <span className="px-2 py-0.5 bg-zinc-800 rounded">
            {page.status}
          </span>
        </div>
      </div>

      {/* Copy buttons */}
      <div className="flex flex-wrap gap-3">
        <CopyButton
          label="Copy Markdown"
          icon={FileText}
          onCopy={() => navigator.clipboard.writeText(page.body)}
        />
        <CopyButton
          label="Copy HTML"
          icon={Code}
          onCopy={() => navigator.clipboard.writeText(markdownToHtml(page.body))}
        />
        {page.schemaMarkup && Object.keys(page.schemaMarkup).length > 0 && (
          <CopyButton
            label="Copy Schema"
            icon={Copy}
            onCopy={() =>
              navigator.clipboard.writeText(
                JSON.stringify(page.schemaMarkup, null, 2)
              )
            }
          />
        )}
      </div>

      {/* Meta preview */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h3 className="text-xs text-zinc-500 uppercase tracking-wider mb-3">
          Search Preview
        </h3>
        <div className="space-y-1">
          <p className="text-blue-400 text-lg">{page.title}</p>
          <p className="text-emerald-400 text-sm">
            https://{page.siteId.slice(0, 8)}...
          </p>
          <p className="text-zinc-400 text-sm">
            {page.metaDescription || "No meta description"}
          </p>
        </div>
      </div>

      {/* Content preview */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h3 className="text-xs text-zinc-500 uppercase tracking-wider mb-4">
          Content Preview
        </h3>
        <article className="prose prose-invert prose-zinc max-w-none prose-headings:text-white prose-p:text-zinc-300 prose-li:text-zinc-300 prose-strong:text-white prose-a:text-emerald-400 prose-th:text-zinc-300 prose-td:text-zinc-400 prose-table:border-zinc-700 prose-hr:border-zinc-700">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {page.body}
          </ReactMarkdown>
        </article>
      </div>

      {/* Sidebar info */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Target entities */}
        {page.targetEntities.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-medium text-white">
                Target Entities
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {page.targetEntities.map((entity, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-lg"
                >
                  {entity}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Competitors analyzed */}
        {page.competitorsAnalyzed.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-zinc-400" />
              <h3 className="text-sm font-medium text-white">
                Competitors Analyzed
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {page.competitorsAnalyzed.map((comp, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 bg-zinc-800 text-zinc-400 text-xs rounded-lg"
                >
                  {comp}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Schema markup preview */}
      {page.schemaMarkup && Object.keys(page.schemaMarkup).length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h3 className="text-xs text-zinc-500 uppercase tracking-wider mb-3">
            Schema.org JSON-LD
          </h3>
          <pre className="text-xs text-zinc-400 bg-zinc-800 rounded-lg p-4 overflow-x-auto">
            {JSON.stringify(page.schemaMarkup, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
