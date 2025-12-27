"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useSite } from "@/contexts/site-context";
import {
  FileText,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  CheckCircle2,
  Edit3,
  Trash2,
  Copy,
  ExternalLink,
  Sparkles,
  Eye,
  Calendar,
  Globe,
  Loader2,
  AlertCircle,
  Brain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

// ============================================
// TYPES
// ============================================

type ContentStatus = "idea" | "writing" | "draft" | "review" | "published" | "scheduled";

interface ContentItem {
  id: string;
  title: string;
  slug: string;
  status: ContentStatus;
  keyword: string;
  seoScore: number;
  aioScore?: number;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  publishedUrl?: string;
  author: string;
}

interface ContentData {
  content: ContentItem[];
  stats: {
    total: number;
    published: number;
    drafts: number;
    ideas: number;
  };
}

// ============================================
// STATUS CONFIG
// ============================================

const statusConfig: Record<ContentStatus, { label: string; color: string; icon: React.ElementType }> = {
  idea: { label: "Idea", color: "bg-gray-500/10 text-gray-500", icon: Sparkles },
  writing: { label: "Writing", color: "bg-blue-500/10 text-blue-500", icon: Edit3 },
  draft: { label: "Draft", color: "bg-yellow-500/10 text-yellow-500", icon: FileText },
  review: { label: "In Review", color: "bg-purple-500/10 text-purple-500", icon: Eye },
  scheduled: { label: "Scheduled", color: "bg-orange-500/10 text-orange-500", icon: Calendar },
  published: { label: "Published", color: "bg-green-500/10 text-green-500", icon: CheckCircle2 },
};

// ============================================
// STATUS BADGE
// ============================================

function StatusBadge({ status }: { status: ContentStatus }) {
  const config = statusConfig[status] || statusConfig.draft;
  const Icon = config.icon;
  
  return (
    <Badge variant="secondary" className={config.color}>
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </Badge>
  );
}

// ============================================
// SEO SCORE
// ============================================

function SEOScore({ score }: { score: number }) {
  const getColor = (s: number) => {
    if (s >= 80) return "text-green-500";
    if (s >= 60) return "text-yellow-500";
    if (s >= 40) return "text-orange-500";
    return "text-red-500";
  };

  if (score === 0) {
    return <span className="text-muted-foreground">-</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <div className="w-12">
        <Progress value={score} className="h-2" />
      </div>
      <span className={`font-medium ${getColor(score)}`}>{score}</span>
    </div>
  );
}

// ============================================
// AIO SCORE
// ============================================

function AIOScore({ score }: { score?: number }) {
  const getColor = (s: number) => {
    if (s >= 80) return "text-violet-500";
    if (s >= 60) return "text-blue-500";
    if (s >= 40) return "text-yellow-500";
    return "text-red-500";
  };

  if (!score || score === 0) {
    return <span className="text-muted-foreground">-</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <div className="w-12">
        <Progress value={score} className="h-2 [&>div]:bg-violet-500" />
      </div>
      <span className={`font-medium ${getColor(score)}`}>{score}</span>
    </div>
  );
}

// ============================================
// LOADING SKELETON
// ============================================

function ContentLoading() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <div>
                  <Skeleton className="h-6 w-12 mb-1" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="p-6 space-y-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// EMPTY STATE
// ============================================

function EmptyState() {
  return (
    <Card className="p-12 bg-gradient-to-br from-emerald-500/5 to-transparent border-emerald-500/20">
      <div className="text-center max-w-lg mx-auto">
        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 bg-emerald-500/20 rounded-full blur-2xl animate-pulse" />
          </div>
          <div className="relative w-16 h-16 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-emerald-400" />
          </div>
        </div>
        <h3 className="text-2xl font-bold mb-3">Generate Your First Article in 5 Minutes</h3>
        <p className="text-muted-foreground mb-8">
          Pick a keyword, and our AI will create a full SEO-optimized article with 
          headings, FAQs, and internal links. Ready to publish.
        </p>
        
        <Link href="/content/new">
          <Button size="lg" className="bg-emerald-600 hover:bg-emerald-500 gap-2 px-8">
            <Sparkles className="w-5 h-5" />
            Generate Article
          </Button>
        </Link>

        <div className="mt-8 pt-8 border-t grid grid-cols-3 gap-6 text-center">
          <div>
            <p className="text-2xl font-bold text-emerald-400">5 min</p>
            <p className="text-xs text-muted-foreground">Generation time</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-400">SEO+AIO</p>
            <p className="text-xs text-muted-foreground">Optimized for both</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-400">1-click</p>
            <p className="text-xs text-muted-foreground">Publish to CMS</p>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function ContentPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const { selectedSite } = useSite();

  // Fetch content data for selected site
  const { data, isLoading, error, refetch } = useQuery<ContentData>({
    queryKey: ["content", selectedSite?.id],
    queryFn: async () => {
      const url = selectedSite?.id 
        ? `/api/content?siteId=${selectedSite.id}`
        : "/api/content";
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch content");
      const json = await response.json();
      return json.data;
    },
  });

  const filteredContent = (data?.content || []).filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.keyword.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const hasData = data && data.content.length > 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Content</h1>
            <p className="text-muted-foreground">
              Create, manage, and optimize your SEO content
            </p>
          </div>
        </div>
        <ContentLoading />
      </div>
    );
  }

  // Show empty state if no site selected
  if (!selectedSite) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content</h1>
          <p className="text-muted-foreground">
            Create, manage, and optimize your SEO content
          </p>
        </div>
        <Card className="p-12">
          <div className="text-center max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Site Selected</h3>
            <p className="text-muted-foreground mb-6">
              Add a site to start generating and managing your SEO content.
            </p>
            <Button asChild>
              <a href="/sites/new">
                <Sparkles className="w-4 h-4 mr-2" />
                Add Your First Site
              </a>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content</h1>
          <p className="text-muted-foreground">
            Create, manage, and optimize your SEO content
          </p>
        </div>
        <Link href="/content/new">
          <Button>
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Content
          </Button>
        </Link>
      </div>

      {/* Error State */}
      {error && (
        <Card className="p-6 border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <div>
              <p className="font-medium text-red-700 dark:text-red-400">Failed to load content</p>
              <p className="text-sm text-red-600 dark:text-red-300">
                {error instanceof Error ? error.message : "Please try again"}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="ml-auto">
              Retry
            </Button>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {!error && !hasData && <EmptyState />}

      {/* Data View */}
      {hasData && (
        <>
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{data.stats.total}</p>
                    <p className="text-xs text-muted-foreground">Total Content</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <Globe className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{data.stats.published}</p>
                    <p className="text-xs text-muted-foreground">Published</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-500/10">
                    <Edit3 className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{data.stats.drafts}</p>
                    <p className="text-xs text-muted-foreground">In Progress</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{data.stats.ideas}</p>
                    <p className="text-xs text-muted-foreground">Ideas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>All Status</DropdownMenuItem>
                  <DropdownMenuItem>Published</DropdownMenuItem>
                  <DropdownMenuItem>Drafts</DropdownMenuItem>
                  <DropdownMenuItem>In Review</DropdownMenuItem>
                  <DropdownMenuItem>Ideas</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Content Table */}
          <Card>
            <CardContent className="p-0">
              {filteredContent.length === 0 ? (
                <div className="p-8 text-center">
                  <Search className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">
                    No content matches &quot;{searchQuery}&quot;
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Keyword</TableHead>
                      <TableHead>SEO</TableHead>
                      <TableHead>AIO</TableHead>
                      <TableHead className="text-right">Words</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContent.map((item) => (
                      <TableRow key={item.id} className="group">
                        <TableCell>
                          <Link
                            href={`/content/${item.id}`}
                            className="font-medium hover:text-primary transition-colors"
                          >
                            {item.title}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={item.status} />
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {item.keyword}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <SEOScore score={item.seoScore} />
                        </TableCell>
                        <TableCell>
                          <AIOScore score={item.aioScore} />
                        </TableCell>
                        <TableCell className="text-right">
                          {item.wordCount > 0 ? item.wordCount.toLocaleString() : "-"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(item.updatedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="opacity-0 group-hover:opacity-100"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/content/${item.id}`}>
                                  <Edit3 className="w-4 h-4 mr-2" />
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Sparkles className="w-4 h-4 mr-2" />
                                Optimize SEO
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/aio?contentId=${item.id}`}>
                                  <Brain className="w-4 h-4 mr-2" />
                                  Optimize for AI
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Copy className="w-4 h-4 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                              {item.publishedUrl && (
                                <DropdownMenuItem>
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  View Live
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-500">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
