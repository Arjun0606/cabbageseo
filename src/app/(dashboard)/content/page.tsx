"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  FileText,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit3,
  Trash2,
  Eye,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Loader2,
  ArrowRight,
  Target,
  BarChart3,
  Zap,
  Copy,
  Download,
  Globe,
  RefreshCw,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Types
interface ContentPiece {
  id: string;
  title: string;
  targetKeyword: string;
  status: "idea" | "draft" | "review" | "published";
  seoScore: number;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
  publishedUrl?: string;
}

// Mock data
const mockContent: ContentPiece[] = [
  {
    id: "1",
    title: "The Complete Guide to AI SEO Tools in 2024",
    targetKeyword: "ai seo tools",
    status: "published",
    seoScore: 92,
    wordCount: 2450,
    createdAt: "2024-12-01",
    updatedAt: "2024-12-05",
    publishedUrl: "https://example.com/ai-seo-tools",
  },
  {
    id: "2",
    title: "How to Automate Your SEO Workflow",
    targetKeyword: "automated seo tools",
    status: "review",
    seoScore: 85,
    wordCount: 1890,
    createdAt: "2024-12-03",
    updatedAt: "2024-12-08",
  },
  {
    id: "3",
    title: "Best AI Content Generators for SEO",
    targetKeyword: "ai content generator for seo",
    status: "draft",
    seoScore: 72,
    wordCount: 1200,
    createdAt: "2024-12-06",
    updatedAt: "2024-12-08",
  },
  {
    id: "4",
    title: "Keyword Research: The Ultimate Guide",
    targetKeyword: "keyword research tool",
    status: "idea",
    seoScore: 0,
    wordCount: 0,
    createdAt: "2024-12-08",
    updatedAt: "2024-12-08",
  },
];

function getStatusColor(status: string) {
  switch (status) {
    case "published": return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
    case "review": return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
    case "draft": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300";
    case "idea": return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    default: return "bg-slate-100 text-slate-700";
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "published": return <CheckCircle2 className="h-4 w-4" />;
    case "review": return <Eye className="h-4 w-4" />;
    case "draft": return <Edit3 className="h-4 w-4" />;
    case "idea": return <Sparkles className="h-4 w-4" />;
    default: return <FileText className="h-4 w-4" />;
  }
}

function getSeoScoreColor(score: number) {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-600";
  if (score >= 40) return "text-orange-600";
  return "text-red-600";
}

export default function ContentPage() {
  const [content] = useState<ContentPiece[]>(mockContent);
  const [isCreating, setIsCreating] = useState(false);
  const [newContentKeyword, setNewContentKeyword] = useState("");
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const handleCreateContent = async () => {
    if (!newContentKeyword.trim()) return;
    
    setGenerating(true);
    // Simulate AI content generation
    await new Promise(r => setTimeout(r, 5000));
    setGenerating(false);
    setIsCreating(false);
    setNewContentKeyword("");
  };

  const stats = {
    total: content.length,
    published: content.filter(c => c.status === "published").length,
    drafts: content.filter(c => c.status === "draft" || c.status === "review").length,
    avgSeoScore: Math.round(
      content.filter(c => c.seoScore > 0).reduce((sum, c) => sum + c.seoScore, 0) / 
      content.filter(c => c.seoScore > 0).length
    ) || 0,
  };

  const filteredContent = activeTab === "all" 
    ? content 
    : content.filter(c => c.status === activeTab);

  return (
    <div className="min-h-screen">
      <DashboardHeader
        title="Content"
        description="Create, optimize, and publish SEO-optimized content"
      />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Total Articles</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-800">
                  <FileText className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Published</p>
                  <p className="text-2xl font-bold text-green-600">{stats.published}</p>
                </div>
                <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">In Progress</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.drafts}</p>
                </div>
                <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900">
                  <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Avg. SEO Score</p>
                  <p className={`text-2xl font-bold ${getSeoScoreColor(stats.avgSeoScore)}`}>
                    {stats.avgSeoScore}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-cabbage-100 dark:bg-cabbage-900">
                  <BarChart3 className="h-5 w-5 text-cabbage-600 dark:text-cabbage-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Create New Content Card */}
        {isCreating ? (
          <Card className="border-2 border-cabbage-200 bg-gradient-to-br from-cabbage-50 to-white dark:border-cabbage-800 dark:from-cabbage-950 dark:to-slate-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-cabbage-600" />
                Create New Content
              </CardTitle>
              <CardDescription>
                Enter a keyword and we'll generate a fully optimized article
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Target Keyword</label>
                  <Input
                    placeholder="e.g., ai seo tools"
                    value={newContentKeyword}
                    onChange={(e) => setNewContentKeyword(e.target.value)}
                    disabled={generating}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Content Type</label>
                  <select className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                    <option>Comprehensive Guide</option>
                    <option>How-To Article</option>
                    <option>Listicle</option>
                    <option>Comparison</option>
                    <option>Review</option>
                  </select>
                </div>
              </div>
              
              {generating && (
                <div className="space-y-3 p-4 rounded-lg bg-slate-50 dark:bg-slate-800">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-cabbage-600" />
                    <span className="font-medium">Generating your article...</span>
                  </div>
                  <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Analyzing SERP competitors
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Creating optimized outline
                    </div>
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-cabbage-500" />
                      Writing content sections...
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Clock className="h-4 w-4" />
                      Generating meta tags
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Clock className="h-4 w-4" />
                      Adding internal links
                    </div>
                  </div>
                  <Progress value={65} className="h-2" />
                </div>
              )}
              
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleCreateContent}
                  disabled={generating || !newContentKeyword.trim()}
                  className="gap-2"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      Generate Article
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={() => setIsCreating(false)} disabled={generating}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Button onClick={() => setIsCreating(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create New Content
          </Button>
        )}

        {/* Content List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Your Content</CardTitle>
                <CardDescription>Manage and track all your SEO content</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input placeholder="Search content..." className="pl-9 w-64" />
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">All ({content.length})</TabsTrigger>
                <TabsTrigger value="idea">Ideas ({content.filter(c => c.status === "idea").length})</TabsTrigger>
                <TabsTrigger value="draft">Drafts ({content.filter(c => c.status === "draft").length})</TabsTrigger>
                <TabsTrigger value="review">Review ({content.filter(c => c.status === "review").length})</TabsTrigger>
                <TabsTrigger value="published">Published ({content.filter(c => c.status === "published").length})</TabsTrigger>
              </TabsList>

              <div className="space-y-3">
                {filteredContent.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-cabbage-300 dark:hover:border-cabbage-700 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`p-2 rounded-lg ${getStatusColor(item.status)}`}>
                        {getStatusIcon(item.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                          {item.title}
                        </h3>
                        <div className="flex items-center gap-3 mt-1">
                          <Badge variant="outline" className="gap-1">
                            <Target className="h-3 w-3" />
                            {item.targetKeyword}
                          </Badge>
                          {item.wordCount > 0 && (
                            <span className="text-sm text-slate-500">
                              {item.wordCount.toLocaleString()} words
                            </span>
                          )}
                          <span className="text-sm text-slate-400">
                            Updated {new Date(item.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {item.seoScore > 0 && (
                        <div className="text-center">
                          <div className={`text-xl font-bold ${getSeoScoreColor(item.seoScore)}`}>
                            {item.seoScore}
                          </div>
                          <div className="text-xs text-slate-500">SEO Score</div>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        {item.status === "idea" && (
                          <Button size="sm" className="gap-2">
                            <Zap className="h-4 w-4" />
                            Generate
                          </Button>
                        )}
                        {item.status === "draft" && (
                          <Button size="sm" variant="outline" className="gap-2">
                            <Edit3 className="h-4 w-4" />
                            Edit
                          </Button>
                        )}
                        {item.status === "review" && (
                          <Button size="sm" className="gap-2">
                            <Send className="h-4 w-4" />
                            Publish
                          </Button>
                        )}
                        {item.status === "published" && item.publishedUrl && (
                          <Button size="sm" variant="outline" className="gap-2" asChild>
                            <a href={item.publishedUrl} target="_blank" rel="noopener noreferrer">
                              <Globe className="h-4 w-4" />
                              View
                            </a>
                          </Button>
                        )}
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit3 className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Regenerate
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="mr-2 h-4 w-4" />
                              Export
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

