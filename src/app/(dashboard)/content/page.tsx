"use client";

/**
 * ============================================
 * CONTENT LIST - REBUILT FROM SCRATCH
 * ============================================
 * 
 * Shows all generated content for the site.
 * Uses localStorage for site persistence.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  FileText,
  Plus,
  Search,
  Calendar,
  Eye,
  MoreVertical,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Trash2,
  Edit,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ============================================
// TYPES
// ============================================

interface ContentItem {
  id: string;
  title: string;
  status: "draft" | "published" | "scheduled";
  geoScore: number;
  wordCount: number;
  createdAt: string;
  publishedAt?: string;
  keyword?: string;
}

// ============================================
// STORAGE
// ============================================

const SITE_KEY = "cabbageseo_site";

function loadSite(): { id: string; domain: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const data = localStorage.getItem(SITE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

// ============================================
// MAIN PAGE
// ============================================

export default function ContentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [site, setSite] = useState<{ id: string; domain: string } | null>(null);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "draft" | "published" | "scheduled">("all");

  // Load on mount
  useEffect(() => {
    const cachedSite = loadSite();
    
    if (!cachedSite) {
      router.push("/dashboard");
      return;
    }
    
    setSite(cachedSite);
    fetchContent(cachedSite.id);
  }, [router]);

  // Fetch content from API
  async function fetchContent(siteId: string) {
    try {
      const res = await fetch(`/api/content?siteId=${siteId}`);
      if (res.ok) {
        const data = await res.json();
        const items: ContentItem[] = (data.data || []).map((item: Record<string, unknown>) => ({
          id: item.id as string,
          title: (item.title as string) || "Untitled",
          status: (item.status as ContentItem["status"]) || "draft",
          geoScore: (item.aio_score as number) || (item.aioScore as number) || 75,
          wordCount: (item.word_count as number) || (item.wordCount as number) || 0,
          createdAt: (item.created_at as string) || (item.createdAt as string) || new Date().toISOString(),
          publishedAt: item.published_at as string | undefined,
          keyword: item.keyword as string | undefined,
        }));
        setContent(items);
      }
    } catch (e) {
      console.error("Failed to fetch content:", e);
    } finally {
      setLoading(false);
    }
  }

  // Filter content
  const filteredContent = content.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.keyword?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === "all" || item.status === filter;
    return matchesSearch && matchesFilter;
  });

  // Stats
  const publishedCount = content.filter(c => c.status === "published").length;
  const draftCount = content.filter(c => c.status === "draft").length;
  const scheduledCount = content.filter(c => c.status === "scheduled").length;
  const avgScore = content.length 
    ? Math.round(content.reduce((sum, c) => sum + c.geoScore, 0) / content.length) 
    : 0;

  // Loading
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mb-4" />
        <p className="text-zinc-400">Loading content...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-400" />
            Content
          </h1>
          <p className="text-zinc-400 mt-1">AI-generated articles for {site?.domain}</p>
        </div>
        <Link href="/content/new">
          <Button className="bg-emerald-600 hover:bg-emerald-500">
            <Plus className="w-4 h-4 mr-2" />
            Generate Article
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="py-4">
            <p className="text-zinc-500 text-sm">Total Articles</p>
            <p className="text-2xl font-bold text-white">{content.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="py-4">
            <p className="text-zinc-500 text-sm">Published</p>
            <p className="text-2xl font-bold text-emerald-400">{publishedCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="py-4">
            <p className="text-zinc-500 text-sm">Drafts</p>
            <p className="text-2xl font-bold text-yellow-400">{draftCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="py-4">
            <p className="text-zinc-500 text-sm">Avg GEO Score</p>
            <p className="text-2xl font-bold text-blue-400">{avgScore}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search articles..."
            className="pl-10 bg-zinc-800 border-zinc-700"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
            className={filter === "all" ? "bg-emerald-600" : ""}
          >
            All
          </Button>
          <Button
            variant={filter === "published" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("published")}
            className={filter === "published" ? "bg-emerald-600" : ""}
          >
            Published
          </Button>
          <Button
            variant={filter === "draft" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("draft")}
            className={filter === "draft" ? "bg-emerald-600" : ""}
          >
            Drafts
          </Button>
          <Button
            variant={filter === "scheduled" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("scheduled")}
            className={filter === "scheduled" ? "bg-emerald-600" : ""}
          >
            Scheduled
          </Button>
        </div>
      </div>

      {/* Content List */}
      {filteredContent.length === 0 ? (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-zinc-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No content yet</h3>
            <p className="text-zinc-400 mb-6">
              {searchQuery ? "No articles match your search" : "Generate your first AI-optimized article"}
            </p>
            {!searchQuery && (
              <Link href="/content/new">
                <Button className="bg-emerald-600 hover:bg-emerald-500">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate First Article
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredContent.map(item => (
            <Card key={item.id} className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0 mr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-medium truncate">{item.title}</h3>
                      <Badge className={
                        item.status === "published" ? "bg-emerald-500/20 text-emerald-400" :
                        item.status === "scheduled" ? "bg-blue-500/20 text-blue-400" :
                        "bg-yellow-500/20 text-yellow-400"
                      }>
                        {item.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-zinc-500">
                      {item.keyword && (
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          {item.keyword}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {item.wordCount.toLocaleString()} words
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-zinc-500">GEO Score</p>
                      <p className={`text-lg font-bold ${
                        item.geoScore >= 70 ? "text-emerald-400" :
                        item.geoScore >= 50 ? "text-yellow-400" :
                        "text-red-400"
                      }`}>
                        {item.geoScore}
                      </p>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
                        <DropdownMenuItem className="cursor-pointer">
                          <Eye className="w-4 h-4 mr-2" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer">
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer">
                          <Copy className="w-4 h-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer text-red-400">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Autopilot Info */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardContent className="py-4 flex items-center gap-4">
          <Clock className="w-8 h-8 text-purple-400" />
          <div>
            <p className="text-white font-medium">Autopilot Active</p>
            <p className="text-sm text-zinc-400">
              New articles are automatically generated every Monday at 9 AM based on your keywords
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
