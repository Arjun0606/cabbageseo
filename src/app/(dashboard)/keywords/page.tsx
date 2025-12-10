"use client";

import { useState } from "react";
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
  ChevronDown,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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

interface QuickWin {
  id: string;
  keyword: string;
  currentPosition: number;
  potentialPosition: number;
  volume: number;
  url: string;
  action: string;
}

// ============================================
// MOCK DATA
// ============================================

const mockKeywords: Keyword[] = [
  { id: "1", keyword: "seo tools", volume: 49500, difficulty: 67, cpc: 12.50, intent: "commercial", trend: "up", position: 15 },
  { id: "2", keyword: "keyword research", volume: 33100, difficulty: 58, cpc: 8.20, intent: "informational", trend: "up", position: 23 },
  { id: "3", keyword: "content optimization", volume: 12100, difficulty: 45, cpc: 5.80, intent: "informational", trend: "stable" },
  { id: "4", keyword: "technical seo", volume: 8100, difficulty: 52, cpc: 7.30, intent: "informational", trend: "up" },
  { id: "5", keyword: "link building strategies", volume: 6600, difficulty: 61, cpc: 9.10, intent: "informational", trend: "down" },
  { id: "6", keyword: "seo audit tool", volume: 4400, difficulty: 48, cpc: 11.20, intent: "commercial", trend: "up", position: 8 },
  { id: "7", keyword: "on page seo", volume: 18100, difficulty: 55, cpc: 6.40, intent: "informational", trend: "stable" },
  { id: "8", keyword: "seo for beginners", volume: 14800, difficulty: 38, cpc: 4.20, intent: "informational", trend: "up" },
];

const mockClusters: KeywordCluster[] = [
  { id: "1", name: "SEO Tools & Software", pillarKeyword: "seo tools", totalVolume: 89000, avgDifficulty: 58, keywordCount: 24, contentStatus: "published" },
  { id: "2", name: "Keyword Research", pillarKeyword: "keyword research", totalVolume: 67000, avgDifficulty: 52, keywordCount: 18, contentStatus: "draft" },
  { id: "3", name: "Technical SEO", pillarKeyword: "technical seo", totalVolume: 45000, avgDifficulty: 61, keywordCount: 15, contentStatus: "none" },
  { id: "4", name: "Content Optimization", pillarKeyword: "content optimization", totalVolume: 32000, avgDifficulty: 45, keywordCount: 12, contentStatus: "none" },
];

const mockQuickWins: QuickWin[] = [
  { id: "1", keyword: "seo audit tool", currentPosition: 8, potentialPosition: 3, volume: 4400, url: "/blog/seo-audit-guide", action: "Add more internal links" },
  { id: "2", keyword: "seo tools", currentPosition: 15, potentialPosition: 8, volume: 49500, url: "/tools", action: "Optimize meta title" },
  { id: "3", keyword: "keyword research", currentPosition: 23, potentialPosition: 12, volume: 33100, url: "/blog/keyword-research", action: "Expand content by 500 words" },
];

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
// MAIN PAGE
// ============================================

export default function KeywordsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [isResearching, setIsResearching] = useState(false);

  const filteredKeywords = mockKeywords.filter((kw) =>
    kw.keyword.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleKeyword = (id: string) => {
    setSelectedKeywords((prev) =>
      prev.includes(id) ? prev.filter((k) => k !== id) : [...prev, id]
    );
  };

  const handleResearch = async () => {
    setIsResearching(true);
    await new Promise((r) => setTimeout(r, 2000));
    setIsResearching(false);
  };

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
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button size="sm" onClick={handleResearch} disabled={isResearching}>
            {isResearching ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Research Keywords
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">1,247</p>
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
                <p className="text-2xl font-bold">156</p>
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
                <p className="text-2xl font-bold">23</p>
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
                <p className="text-2xl font-bold">12</p>
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
            </CardContent>
          </Card>

          {selectedKeywords.length > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-background border rounded-lg shadow-lg p-4 flex items-center gap-4">
              <span className="text-sm font-medium">{selectedKeywords.length} selected</span>
              <Button size="sm" variant="outline">
                <Layers className="w-4 h-4 mr-2" />
                Create Cluster
              </Button>
              <Button size="sm">
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Content
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Clusters Tab */}
        <TabsContent value="clusters">
          <div className="grid gap-4 sm:grid-cols-2">
            {mockClusters.map((cluster) => (
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
                      <Button size="sm" className="flex-1">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Create Content
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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
              {mockQuickWins.map((win) => (
                <div
                  key={win.id}
                  className="flex items-center gap-4 p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium">{win.keyword}</p>
                    <p className="text-sm text-muted-foreground">{win.url}</p>
                  </div>
                  <div className="text-center px-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-orange-500">#{win.currentPosition}</span>
                      <ArrowUpRight className="w-4 h-4 text-green-500" />
                      <span className="text-lg font-bold text-green-500">#{win.potentialPosition}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Potential rank</p>
                  </div>
                  <div className="text-center px-4">
                    <p className="text-lg font-bold">{win.volume.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Monthly volume</p>
                  </div>
                  <div className="flex-shrink-0">
                    <Button size="sm">
                      <Sparkles className="w-4 h-4 mr-2" />
                      {win.action}
                    </Button>
                  </div>
                </div>
              ))}
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
            <Button>
              <Sparkles className="w-4 h-4 mr-2" />
              Run Opportunity Analysis
            </Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
