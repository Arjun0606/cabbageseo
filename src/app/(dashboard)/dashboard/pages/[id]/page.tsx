"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useSite } from "@/context/site-context";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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
  wordCount: number | null;
  aiModel: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  lastRefreshedAt: string | null;
  refreshCount: number;
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
  const { currentSite } = useSite();
  const pageId = params.id as string;

  const [page, setPage] = useState<GeneratedPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  const handlePublish = async () => {
    if (!page) return;
    setPublishing(true);
    try {
      const res = await fetch(`/api/geo/pages/${pageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "published" }),
      });
      if (res.ok) {
        setPage({ ...page, status: "published" });
      } else {
        setError("Failed to mark as published");
      }
    } catch {
      setError("Failed to mark as published");
    } finally {
      setPublishing(false);
    }
  };

  const handleRefresh = async () => {
    if (!page || page.status !== "published") return;
    setRefreshing(true);
    setError("");
    try {
      const res = await fetch(`/api/geo/pages/${pageId}/refresh`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.data?.page) {
        setPage(data.data.page);
      } else {
        setError(data.error || "Failed to refresh page");
      }
    } catch {
      setError("Failed to refresh page");
    } finally {
      setRefreshing(false);
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
            onClick={page.status === "published" ? handleRefresh : handleRegenerate}
            disabled={regenerating || refreshing}
            className="flex items-center gap-2 px-3 py-1.5 text-zinc-400 hover:text-white text-sm transition-colors disabled:opacity-50"
            title="Regenerate this page with fresh AI content and latest data"
          >
            {regenerating || refreshing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {regenerating || refreshing ? "Regenerating..." : "Regenerate content"}
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
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

        <div className="flex items-center gap-4 mt-4 text-xs text-zinc-500 flex-wrap">
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
          <span className={`px-2 py-0.5 rounded ${
            page.status === "published"
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-zinc-800 text-zinc-500"
          }`}>
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

      {/* Publish CTA */}
      {page.status === "draft" && (
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-1">Ready to publish?</h3>
          <p className="text-zinc-400 text-sm mb-3">
            Copy the content above and add it to your website. Then mark it as published
            so we can track its impact on your next check.
          </p>
          <button
            onClick={handlePublish}
            disabled={publishing}
            className="px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition-colors"
          >
            {publishing ? "Saving..." : "I Published This"}
          </button>
        </div>
      )}
      {page.status === "published" && (
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-white font-semibold mb-1">Published on your site</h3>
              <p className="text-zinc-400 text-sm mb-3">
                AI models typically pick up new content within 1-2 weeks.
                Run a follow-up check to see if your visibility improved.
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Run Follow-Up Check
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Meta preview */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h3 className="text-xs text-zinc-500 uppercase tracking-wider mb-3">
          Search Preview
        </h3>
        <div className="space-y-1">
          <p className="text-blue-400 text-lg">{page.title}</p>
          <p className="text-emerald-400 text-sm">
            https://{currentSite?.domain || "yoursite.com"}/...
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

      <ConfirmDialog
        open={showDeleteConfirm}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        title="Delete this page?"
        description="This action cannot be undone. The generated content will be permanently removed."
        confirmLabel="Delete"
        variant="destructive"
      />
    </div>
  );
}
