"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  TrendingUp,
  Target,
  Sparkles,
  Filter,
  Download,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Loader2,
  Lightbulb,
  Layers,
  Zap,
  MoreHorizontal,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

// ============================================
// TYPES
// ============================================

interface Keyword {
  id: string;
  keyword: string;
  volume: number;
  difficulty: number;
  cpc: number;
  intent: "informational" | "commercial" | "transactional" | "navigational";
  trend: "up" | "down" | "stable";
  position?: number;
  url?: string;
  clusterId?: string;
}

interface KeywordCluster {
  id: string;
  name: string;
  pillarKeyword: string;
  totalVolume: number;
  avgDifficulty: number;
  keywordCount: number;
  contentStatus: "none" | "draft" | "published";
}

interface KeywordsData {
  keywords: Keyword[];
  clusters: KeywordCluster[];
  stats: {
    total: number;
    top10: number;
    quickWins: number;
    clusterCount: number;
  };
}

// ============================================
// DIFFICULTY BADGE
// ============================================

function DifficultyBadge({ difficulty }: { difficulty: number }) {
  const getColor = (d: number) => {
    if (d <= 30) return "bg-green-500/10 text-green-500 border-green-500/20";
    if (d <= 50) return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
    if (d <= 70) return "bg-orange-500/10 text-orange-500 border-orange-500/20";
    return "bg-red-500/10 text-red-500 border-red-500/20";
  };

  const getLabel = (d: number) => {
    if (d <= 30) return "Easy";
    if (d <= 50) return "Medium";
    if (d <= 70) return "Hard";
    return "Very Hard";
  };

  return (
    <Badge variant="outline" className={getColor(difficulty)}>
      {difficulty} - {getLabel(difficulty)}
    </Badge>
  );
}

// ============================================
// INTENT BADGE
// ============================================

function IntentBadge({ intent }: { intent: Keyword["intent"] }) {
  const colors = {
    informational: "bg-blue-500/10 text-blue-500",
    commercial: "bg-purple-500/10 text-purple-500",
    transactional: "bg-green-500/10 text-green-500",
    navigational: "bg-gray-500/10 text-gray-500",
  };

  return (
    <Badge variant="secondary" className={colors[intent]}>
      {intent.charAt(0).toUpperCase() + intent.slice(1)}
    </Badge>
  );
}

// ============================================
// TREND INDICATOR
// ============================================

function TrendIndicator({ trend }: { trend: Keyword["trend"] }) {
  if (trend === "up") {
    return <ArrowUpRight className="w-4 h-4 text-green-500" />;
  }
  if (trend === "down") {
    return <ArrowDownRight className="w-4 h-4 text-red-500" />;
  }
  return <Minus className="w-4 h-4 text-gray-400" />;
}

// ============================================
// LOADING SKELETON
// ============================================

function KeywordsLoading() {
  return (
    <div className="space-y-6">
      {/* Stats skeleton */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <div>
                  <Skeleton className="h-6 w-16 mb-1" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Table skeleton */}
      <Card>
        <CardContent className="p-6 space-y-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
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
    <Card className="p-12">
      <div className="text-center max-w-md mx-auto">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
          <Target className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No Keywords Yet</h3>
        <p className="text-muted-foreground mb-6">
          Start by researching keywords for your site or add them manually.
          Keywords help you track what you&apos;re ranking for.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/onboarding">
            <Button>
              <Sparkles className="w-4 h-4 mr-2" />
              Research Keywords
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function KeywordsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const queryClient = useQueryClient();

  // Fetch keywords data
  const { data, isLoading, error, refetch } = useQuery<KeywordsData>({
    queryKey: ["keywords"],
    queryFn: async () => {
      const response = await fetch("/api/keywords");
      if (!response.ok) throw new Error("Failed to fetch keywords");
      const json = await response.json();
      return json.data;
    },
  });

  // Research mutation
  const researchMutation = useMutation({
    mutationFn: async (topic: string) => {
      const response = await fetch("/api/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "research", topic }),
      });
      if (!response.ok) throw new Error("Research failed");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["keywords"] });
    },
  });

  const filteredKeywords = (data?.keywords || []).filter((kw) =>
    kw.keyword.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleKeyword = (id: string) => {
    setSelectedKeywords((prev) =>
      prev.includes(id) ? prev.filter((k) => k !== id) : [...prev, id]
    );
  };

  // Check for data
  const hasData = data && data.keywords.length > 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Keywords</h1>
            <p className="text-muted-foreground">
              Research, track, and optimize your target keywords
            </p>
          </div>
        </div>
        <KeywordsLoading />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Keywords</h1>
          <p className="text-muted-foreground">
            Research, track, and optimize your target keywords
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" disabled={!hasData}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button
            size="sm"
            onClick={() => researchMutation.mutate("seo")}
            disabled={researchMutation.isPending}
          >
            {researchMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Research Keywords
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="p-6 border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <div>
              <p className="font-medium text-red-700 dark:text-red-400">Failed to load keywords</p>
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
                    <Target className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{data.stats.total.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Total Keywords</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{data.stats.top10}</p>
                    <p className="text-xs text-muted-foreground">Ranking Top 10</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-500/10">
                    <Lightbulb className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{data.stats.quickWins}</p>
                    <p className="text-xs text-muted-foreground">Quick Wins</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Layers className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{data.stats.clusterCount}</p>
                    <p className="text-xs text-muted-foreground">Clusters</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="all" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <TabsList>
                <TabsTrigger value="all">All Keywords</TabsTrigger>
                <TabsTrigger value="clusters">Clusters</TabsTrigger>
                <TabsTrigger value="quickwins">Quick Wins</TabsTrigger>
                <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
              </TabsList>

              <div className="flex gap-2">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search keywords..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Filter className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Volume: High to Low</DropdownMenuItem>
                    <DropdownMenuItem>Difficulty: Low to High</DropdownMenuItem>
                    <DropdownMenuItem>CPC: High to Low</DropdownMenuItem>
                    <DropdownMenuItem>Position: Best First</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* All Keywords Tab */}
            <TabsContent value="all">
              <Card>
                <CardContent className="p-0">
                  {filteredKeywords.length === 0 ? (
                    <div className="p-8 text-center">
                      <Search className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">
                        No keywords match &quot;{searchQuery}&quot;
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10">
                            <Checkbox
                              checked={selectedKeywords.length === filteredKeywords.length}
                              onCheckedChange={(checked) =>
                                setSelectedKeywords(checked ? filteredKeywords.map((k) => k.id) : [])
                              }
                            />
                          </TableHead>
                          <TableHead>Keyword</TableHead>
                          <TableHead className="text-right">Volume</TableHead>
                          <TableHead>Difficulty</TableHead>
                          <TableHead className="text-right">CPC</TableHead>
                          <TableHead>Intent</TableHead>
                          <TableHead className="text-center">Trend</TableHead>
                          <TableHead className="text-right">Position</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredKeywords.map((kw) => (
                          <TableRow key={kw.id} className="group">
                            <TableCell>
                              <Checkbox
                                checked={selectedKeywords.includes(kw.id)}
                                onCheckedChange={() => toggleKeyword(kw.id)}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{kw.keyword}</TableCell>
                            <TableCell className="text-right">{kw.volume.toLocaleString()}</TableCell>
                            <TableCell>
                              <DifficultyBadge difficulty={kw.difficulty} />
                            </TableCell>
                            <TableCell className="text-right">${kw.cpc.toFixed(2)}</TableCell>
                            <TableCell>
                              <IntentBadge intent={kw.intent} />
                            </TableCell>
                            <TableCell className="text-center">
                              <TrendIndicator trend={kw.trend} />
                            </TableCell>
                            <TableCell className="text-right">
                              {kw.position ? (
                                <span className={kw.position <= 10 ? "text-green-500 font-medium" : ""}>
                                  #{kw.position}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Generate Content
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Search className="w-4 h-4 mr-2" />
                                    Analyze SERP
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Layers className="w-4 h-4 mr-2" />
                                    Add to Cluster
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

              {selectedKeywords.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-background border rounded-lg shadow-lg p-4 flex items-center gap-4 z-50">
                  <span className="text-sm font-medium">{selectedKeywords.length} selected</span>
                  <Button size="sm" variant="outline">
                    <Layers className="w-4 h-4 mr-2" />
                    Create Cluster
                  </Button>
                  <Link href="/content/new">
                    <Button size="sm">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Content
                    </Button>
                  </Link>
                </div>
              )}
            </TabsContent>

            {/* Clusters Tab */}
            <TabsContent value="clusters">
              {data.clusters.length === 0 ? (
                <Card className="p-8 text-center">
                  <Layers className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Clusters Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Select keywords and group them into clusters for better content planning
                  </p>
                </Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {data.clusters.map((cluster) => (
                    <Card key={cluster.id} className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{cluster.name}</CardTitle>
                          <Badge
                            variant={
                              cluster.contentStatus === "published"
                                ? "default"
                                : cluster.contentStatus === "draft"
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {cluster.contentStatus === "none" ? "No Content" : cluster.contentStatus}
                          </Badge>
                        </div>
                        <CardDescription>Pillar: {cluster.pillarKeyword}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <p className="text-2xl font-bold">{cluster.keywordCount}</p>
                            <p className="text-xs text-muted-foreground">Keywords</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold">{(cluster.totalVolume / 1000).toFixed(0)}k</p>
                            <p className="text-xs text-muted-foreground">Volume</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold">{cluster.avgDifficulty}</p>
                            <p className="text-xs text-muted-foreground">Avg. KD</p>
                          </div>
                        </div>
                        <div className="mt-4 flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1">
                            View Keywords
                          </Button>
                          {cluster.contentStatus === "none" && (
                            <Link href="/content/new" className="flex-1">
                              <Button size="sm" className="w-full">
                                <Sparkles className="w-4 h-4 mr-2" />
                                Create Content
                              </Button>
                            </Link>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Quick Wins Tab */}
            <TabsContent value="quickwins">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    Quick Win Opportunities
                  </CardTitle>
                  <CardDescription>
                    Keywords where small improvements can lead to big ranking gains
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.stats.quickWins === 0 ? (
                    <div className="text-center py-8">
                      <Lightbulb className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">
                        No quick wins detected yet. Keep tracking your rankings!
                      </p>
                    </div>
                  ) : (
                    data.keywords
                      .filter((kw) => kw.position && kw.position > 5 && kw.position <= 20)
                      .slice(0, 5)
                      .map((kw) => (
                        <div
                          key={kw.id}
                          className="flex items-center gap-4 p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1">
                            <p className="font-medium">{kw.keyword}</p>
                            <p className="text-sm text-muted-foreground">{kw.url || "Not ranking"}</p>
                          </div>
                          <div className="text-center px-4">
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold text-orange-500">#{kw.position}</span>
                              <ArrowUpRight className="w-4 h-4 text-green-500" />
                              <span className="text-lg font-bold text-green-500">
                                #{Math.max(1, (kw.position || 10) - 5)}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">Potential rank</p>
                          </div>
                          <div className="text-center px-4">
                            <p className="text-lg font-bold">{kw.volume.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">Monthly volume</p>
                          </div>
                          <Link href="/content/new">
                            <Button size="sm">
                              <Sparkles className="w-4 h-4 mr-2" />
                              Optimize
                            </Button>
                          </Link>
                        </div>
                      ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Opportunities Tab */}
            <TabsContent value="opportunities">
              <Card className="p-8 text-center">
                <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-full mb-4">
                  <Search className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Discover New Opportunities</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Let AI analyze your competitors and find untapped keyword opportunities in your niche.
                </p>
                <Button onClick={() => researchMutation.mutate("competitors")}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Run Opportunity Analysis
                </Button>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
