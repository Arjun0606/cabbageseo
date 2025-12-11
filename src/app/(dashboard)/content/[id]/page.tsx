"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Save,
  Send,
  Eye,
  Sparkles,
  Target,
  CheckCircle2,
  AlertCircle,
  Link2,
  FileText,
  BarChart3,
  Loader2,
  Wand2,
  ExternalLink,
  Trash2,
} from "lucide-react";
import Link from "next/link";

// ============================================
// TYPES
// ============================================

interface ContentData {
  id: string;
  siteId: string;
  title: string;
  slug: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  content: string | null;
  contentFormat: string;
  excerpt: string | null;
  targetKeyword: string;
  secondaryKeywords: string[];
  wordCount: number;
  readingTime: number;
  seoScore: number;
  status: string;
  publishedUrl: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  internalLinks: unknown[];
  suggestedInternalLinks: unknown[];
}

// ============================================
// LOADING SKELETON
// ============================================

function EditorLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-24" />
          <div>
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-32 mt-1" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    </div>
  );
}

// ============================================
// SEO SCORE DISPLAY
// ============================================

function SeoScoreDisplay({ score }: { score: number }) {
  const getColor = (s: number) => {
    if (s >= 80) return "text-green-600";
    if (s >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted">
      <BarChart3 className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm font-medium">SEO Score:</span>
      <span className={`text-lg font-bold ${getColor(score)}`}>
        {score || "-"}
      </span>
    </div>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function ContentEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const [localContent, setLocalContent] = useState<Partial<ContentData>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch content
  const { data, isLoading, error } = useQuery<ContentData>({
    queryKey: ["content", id],
    queryFn: async () => {
      const response = await fetch(`/api/content/${id}`);
      if (!response.ok) throw new Error("Failed to fetch content");
      const json = await response.json();
      return json.data;
    },
  });

  // Update mutation
  const saveMutation = useMutation({
    mutationFn: async (updates: Partial<ContentData>) => {
      const response = await fetch(`/api/content/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("Failed to save");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content", id] });
      setHasChanges(false);
    },
  });

  // Publish mutation
  const publishMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/content/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId: id,
          title: merged.title,
          content: merged.content,
          metaTitle: merged.metaTitle,
          metaDescription: merged.metaDescription,
          slug: merged.slug,
        }),
      });
      if (!response.ok) throw new Error("Failed to publish");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content", id] });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/content/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete");
      return response.json();
    },
    onSuccess: () => {
      router.push("/content");
    },
  });

  // Merge fetched data with local changes
  const merged = { ...data, ...localContent } as ContentData;

  const updateField = (field: keyof ContentData, value: unknown) => {
    setLocalContent((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    saveMutation.mutate(localContent);
  };

  if (isLoading) {
    return <EditorLoading />;
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" asChild>
          <Link href="/content">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Content
          </Link>
        </Button>
        <Card className="p-12 text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Content Not Found</h2>
          <p className="text-muted-foreground mb-4">
            {error instanceof Error ? error.message : "This content may have been deleted."}
          </p>
          <Button asChild>
            <Link href="/content">Go to Content</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/content">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div>
            <h1 className="font-semibold truncate max-w-md">
              {merged.title || "Untitled"}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="secondary">{merged.status}</Badge>
              <span className="text-xs text-muted-foreground">
                Updated {new Date(merged.updatedAt).toLocaleDateString()}
              </span>
              {hasChanges && (
                <Badge variant="outline" className="text-yellow-600">
                  Unsaved changes
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <SeoScoreDisplay score={merged.seoScore} />

          <Button
            variant="outline"
            onClick={handleSave}
            disabled={!hasChanges || saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save
          </Button>

          {merged.publishedUrl ? (
            <Button variant="outline" asChild>
              <a href={merged.publishedUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                View Live
              </a>
            </Button>
          ) : (
            <Button
              onClick={() => publishMutation.mutate()}
              disabled={publishMutation.isPending}
            >
              {publishMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Publish
            </Button>
          )}
        </div>
      </div>

      {/* Editor Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Editor */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={merged.title || ""}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="Article title..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Body</Label>
                <Textarea
                  id="content"
                  value={merged.content || ""}
                  onChange={(e) => updateField("content", e.target.value)}
                  placeholder="Write your content here..."
                  className="min-h-[400px] font-mono text-sm"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{merged.wordCount || 0} words</span>
                  <span>{merged.readingTime || 0} min read</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* SEO Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">SEO Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="metaTitle">Meta Title</Label>
                <Input
                  id="metaTitle"
                  value={merged.metaTitle || ""}
                  onChange={(e) => updateField("metaTitle", e.target.value)}
                  placeholder="SEO title..."
                />
                <p className="text-xs text-muted-foreground">
                  {(merged.metaTitle || "").length}/60 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="metaDescription">Meta Description</Label>
                <Textarea
                  id="metaDescription"
                  value={merged.metaDescription || ""}
                  onChange={(e) => updateField("metaDescription", e.target.value)}
                  placeholder="SEO description..."
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  {(merged.metaDescription || "").length}/160 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug</Label>
                <Input
                  id="slug"
                  value={merged.slug || ""}
                  onChange={(e) => updateField("slug", e.target.value)}
                  placeholder="url-slug"
                />
              </div>
            </CardContent>
          </Card>

          {/* Keywords */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="w-4 h-4" />
                Target Keywords
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {merged.targetKeyword && (
                  <Badge variant="default">{merged.targetKeyword}</Badge>
                )}
                {merged.secondaryKeywords?.map((kw, i) => (
                  <Badge key={i} variant="secondary" className="mr-1">
                    {kw}
                  </Badge>
                ))}
                {!merged.targetKeyword && merged.secondaryKeywords?.length === 0 && (
                  <p className="text-sm text-muted-foreground">No keywords assigned</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Internal Links */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Link2 className="w-4 h-4" />
                Internal Links
              </CardTitle>
            </CardHeader>
            <CardContent>
              {merged.internalLinks?.length > 0 ? (
                <div className="space-y-2">
                  {(merged.internalLinks as Array<{ url: string }>).slice(0, 5).map((link, i) => (
                    <div key={i} className="text-sm text-muted-foreground truncate">
                      {link.url}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No internal links</p>
              )}
              {merged.suggestedInternalLinks?.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-muted-foreground mb-2">
                    {merged.suggestedInternalLinks.length} suggested links
                  </p>
                  <Link href="/links">
                    <Button variant="outline" size="sm" className="w-full">
                      <Wand2 className="w-4 h-4 mr-2" />
                      View Suggestions
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Word Count</span>
                <span className="text-sm font-medium">{merged.wordCount || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Reading Time</span>
                <span className="text-sm font-medium">{merged.readingTime || 0} min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">SEO Score</span>
                <span className="text-sm font-medium">{merged.seoScore || "-"}/100</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Created</span>
                <span className="text-sm">{new Date(merged.createdAt).toLocaleDateString()}</span>
              </div>
              {merged.publishedAt && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Published</span>
                  <span className="text-sm">{new Date(merged.publishedAt).toLocaleDateString()}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200 dark:border-red-900">
            <CardContent className="p-4">
              <Button
                variant="outline"
                className="w-full text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={() => {
                  if (confirm("Are you sure you want to delete this content?")) {
                    deleteMutation.mutate();
                  }
                }}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Delete Content
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
