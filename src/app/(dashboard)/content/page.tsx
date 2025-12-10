"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Clock,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Trash2,
  Copy,
  ExternalLink,
  Sparkles,
  TrendingUp,
  Eye,
  Calendar,
  Globe,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  wordCount: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  publishedUrl?: string;
  author: string;
}

// ============================================
// MOCK DATA
// ============================================

const mockContent: ContentItem[] = [
  {
    id: "1",
    title: "Complete Guide to SEO in 2025",
    slug: "seo-guide-2025",
    status: "published",
    keyword: "seo guide",
    seoScore: 92,
    wordCount: 3500,
    createdAt: "2025-01-05",
    updatedAt: "2025-01-08",
    publishedAt: "2025-01-08",
    publishedUrl: "https://example.com/blog/seo-guide-2025",
    author: "AI + Human",
  },
  {
    id: "2",
    title: "How to Do Keyword Research: Step-by-Step",
    slug: "keyword-research-guide",
    status: "draft",
    keyword: "keyword research",
    seoScore: 78,
    wordCount: 2800,
    createdAt: "2025-01-06",
    updatedAt: "2025-01-10",
    author: "AI",
  },
  {
    id: "3",
    title: "10 Best Free SEO Tools for Beginners",
    slug: "free-seo-tools",
    status: "review",
    keyword: "free seo tools",
    seoScore: 85,
    wordCount: 2100,
    createdAt: "2025-01-07",
    updatedAt: "2025-01-10",
    author: "AI",
  },
  {
    id: "4",
    title: "Technical SEO Checklist for 2025",
    slug: "technical-seo-checklist",
    status: "writing",
    keyword: "technical seo",
    seoScore: 45,
    wordCount: 1200,
    createdAt: "2025-01-09",
    updatedAt: "2025-01-10",
    author: "AI",
  },
  {
    id: "5",
    title: "Link Building Strategies That Work",
    slug: "link-building-strategies",
    status: "scheduled",
    keyword: "link building",
    seoScore: 88,
    wordCount: 2400,
    createdAt: "2025-01-04",
    updatedAt: "2025-01-09",
    publishedAt: "2025-01-15",
    author: "AI + Human",
  },
  {
    id: "6",
    title: "Local SEO: Complete Guide for Small Businesses",
    slug: "local-seo-guide",
    status: "idea",
    keyword: "local seo",
    seoScore: 0,
    wordCount: 0,
    createdAt: "2025-01-10",
    updatedAt: "2025-01-10",
    author: "",
  },
];

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
  const config = statusConfig[status];
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
// CONTENT CARD (for grid view)
// ============================================

function ContentCard({ item }: { item: ContentItem }) {
  return (
    <Card className="hover:shadow-md transition-all group">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <StatusBadge status={item.status} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 h-8 w-8">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Edit3 className="w-4 h-4 mr-2" />
                Edit
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
        </div>

        <Link href={`/content/${item.id}`} className="block">
          <h3 className="font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {item.title}
          </h3>
        </Link>

        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Badge variant="outline" className="text-xs">
            {item.keyword}
          </Badge>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-3 text-muted-foreground">
            <span>{item.wordCount.toLocaleString()} words</span>
            <span>•</span>
            <span>{item.updatedAt}</span>
          </div>
          <SEOScore score={item.seoScore} />
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function ContentPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");

  const filteredContent = mockContent.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.keyword.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: mockContent.length,
    published: mockContent.filter((c) => c.status === "published").length,
    drafts: mockContent.filter((c) => c.status === "draft" || c.status === "writing").length,
    ideas: mockContent.filter((c) => c.status === "idea").length,
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    await new Promise((r) => setTimeout(r, 2000));
    setIsGenerating(false);
  };

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
        <Button onClick={handleGenerate} disabled={isGenerating}>
          {isGenerating ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 mr-2" />
          )}
          Generate Content
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
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
                <p className="text-2xl font-bold">{stats.published}</p>
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
                <p className="text-2xl font-bold">{stats.drafts}</p>
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
                <p className="text-2xl font-bold">{stats.ideas}</p>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Keyword</TableHead>
                <TableHead>SEO Score</TableHead>
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
                  <TableCell className="text-right">
                    {item.wordCount > 0 ? item.wordCount.toLocaleString() : "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.updatedAt}
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
                          Optimize
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
        </CardContent>
      </Card>

      {filteredContent.length === 0 && (
        <Card className="p-8 text-center">
          <div className="inline-flex items-center justify-center p-4 bg-muted rounded-full mb-4">
            <FileText className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No content found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery
              ? "Try adjusting your search"
              : "Start creating SEO-optimized content with AI"}
          </p>
          <Button>
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Your First Article
          </Button>
        </Card>
      )}
    </div>
  );
}
