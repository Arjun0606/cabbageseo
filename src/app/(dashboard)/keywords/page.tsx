"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Target,
  Layers,
  FileText,
  ArrowRight,
  Loader2,
  Plus,
  Filter,
  Download,
  RefreshCw,
  Lightbulb,
  BarChart3,
  CheckCircle2,
  Circle,
  Zap,
} from "lucide-react";

// Types
interface Keyword {
  id: string;
  keyword: string;
  volume: number;
  difficulty: number;
  cpc: number;
  intent: "informational" | "commercial" | "transactional" | "navigational";
  trend: "up" | "down" | "stable";
  position?: number;
  clusterId?: string;
  selected?: boolean;
}

interface KeywordCluster {
  id: string;
  name: string;
  keywords: Keyword[];
  totalVolume: number;
  avgDifficulty: number;
  suggestedArticles: number;
  status: "not_started" | "in_progress" | "completed";
}

// Mock data - in production this comes from API
const mockClusters: KeywordCluster[] = [
  {
    id: "1",
    name: "AI SEO Tools",
    totalVolume: 12500,
    avgDifficulty: 45,
    suggestedArticles: 5,
    status: "not_started",
    keywords: [
      { id: "1", keyword: "ai seo tools", volume: 5400, difficulty: 42, cpc: 8.50, intent: "commercial", trend: "up" },
      { id: "2", keyword: "best ai seo software", volume: 2900, difficulty: 48, cpc: 12.00, intent: "commercial", trend: "up" },
      { id: "3", keyword: "ai powered seo", volume: 1800, difficulty: 38, cpc: 6.20, intent: "informational", trend: "up" },
      { id: "4", keyword: "automated seo tools", volume: 1400, difficulty: 45, cpc: 9.80, intent: "commercial", trend: "stable" },
      { id: "5", keyword: "seo automation software", volume: 1000, difficulty: 52, cpc: 11.50, intent: "commercial", trend: "up" },
    ],
  },
  {
    id: "2",
    name: "SEO Content Generation",
    totalVolume: 8200,
    avgDifficulty: 52,
    suggestedArticles: 4,
    status: "not_started",
    keywords: [
      { id: "6", keyword: "ai content generator for seo", volume: 3200, difficulty: 55, cpc: 7.80, intent: "commercial", trend: "up" },
      { id: "7", keyword: "seo blog writer", volume: 2400, difficulty: 48, cpc: 5.50, intent: "commercial", trend: "stable" },
      { id: "8", keyword: "automated blog posts", volume: 1600, difficulty: 50, cpc: 4.20, intent: "informational", trend: "up" },
      { id: "9", keyword: "ai article writer seo", volume: 1000, difficulty: 55, cpc: 8.90, intent: "commercial", trend: "up" },
    ],
  },
  {
    id: "3",
    name: "Keyword Research",
    totalVolume: 18500,
    avgDifficulty: 62,
    suggestedArticles: 6,
    status: "in_progress",
    keywords: [
      { id: "10", keyword: "keyword research tool", volume: 8100, difficulty: 68, cpc: 15.00, intent: "commercial", trend: "stable" },
      { id: "11", keyword: "free keyword research", volume: 6200, difficulty: 55, cpc: 8.50, intent: "commercial", trend: "stable" },
      { id: "12", keyword: "keyword finder", volume: 2800, difficulty: 58, cpc: 10.20, intent: "commercial", trend: "down" },
      { id: "13", keyword: "seo keyword generator", volume: 1400, difficulty: 52, cpc: 9.00, intent: "commercial", trend: "up" },
    ],
  },
];

// Helper functions
function getDifficultyColor(difficulty: number): string {
  if (difficulty < 30) return "text-green-600 bg-green-50 dark:bg-green-950";
  if (difficulty < 50) return "text-yellow-600 bg-yellow-50 dark:bg-yellow-950";
  if (difficulty < 70) return "text-orange-600 bg-orange-50 dark:bg-orange-950";
  return "text-red-600 bg-red-50 dark:bg-red-950";
}

function getIntentColor(intent: string): string {
  switch (intent) {
    case "informational": return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
    case "commercial": return "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300";
    case "transactional": return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
    case "navigational": return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    default: return "bg-slate-100 text-slate-700";
  }
}

function formatVolume(volume: number): string {
  if (volume >= 1000) return `${(volume / 1000).toFixed(1)}K`;
  return volume.toString();
}

export default function KeywordsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isResearching, setIsResearching] = useState(false);
  const [clusters, setClusters] = useState<KeywordCluster[]>(mockClusters);
  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(new Set());
  const [activeCluster, setActiveCluster] = useState<string | null>(null);

  const handleResearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsResearching(true);
    // Simulate API call
    await new Promise(r => setTimeout(r, 3000));
    setIsResearching(false);
    
    // In production, this would call the keyword research API
  };

  const toggleKeyword = (keywordId: string) => {
    const newSelected = new Set(selectedKeywords);
    if (newSelected.has(keywordId)) {
      newSelected.delete(keywordId);
    } else {
      newSelected.add(keywordId);
    }
    setSelectedKeywords(newSelected);
  };

  const selectAllInCluster = (clusterId: string) => {
    const cluster = clusters.find(c => c.id === clusterId);
    if (!cluster) return;
    
    const newSelected = new Set(selectedKeywords);
    cluster.keywords.forEach(k => newSelected.add(k.id));
    setSelectedKeywords(newSelected);
  };

  const totalVolume = clusters.reduce((sum, c) => sum + c.totalVolume, 0);
  const totalKeywords = clusters.reduce((sum, c) => sum + c.keywords.length, 0);

  return (
    <div className="min-h-screen">
      <DashboardHeader
        title="Keyword Research"
        description="Discover and cluster keywords to fuel your content strategy"
      />

      <div className="p-6 space-y-6">
        {/* Research Input */}
        <Card className="border-2 border-dashed border-cabbage-200 bg-gradient-to-br from-cabbage-50 to-white dark:border-cabbage-800 dark:from-cabbage-950 dark:to-slate-900">
          <CardContent className="py-8">
            <div className="max-w-2xl mx-auto text-center space-y-4">
              <div className="flex items-center justify-center gap-2 text-cabbage-600 dark:text-cabbage-400">
                <Sparkles className="h-5 w-5" />
                <span className="text-sm font-medium">AI-Powered Keyword Discovery</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Enter a keyword, topic, or your website URL
              </h2>
              <p className="text-slate-500">
                We'll find high-value keywords, cluster them by topic, and suggest content opportunities
              </p>
              <div className="flex gap-3 max-w-xl mx-auto">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    placeholder="e.g., 'ai seo tools' or 'https://cabbageseo.com'"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleResearch()}
                    className="pl-10 h-12 text-lg"
                  />
                </div>
                <Button 
                  size="lg" 
                  onClick={handleResearch}
                  disabled={isResearching || !searchQuery.trim()}
                  className="h-12 px-6"
                >
                  {isResearching ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Researching...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-5 w-5" />
                      Research
                    </>
                  )}
                </Button>
              </div>
              
              {/* Quick suggestions */}
              <div className="flex items-center justify-center gap-2 pt-2">
                <span className="text-xs text-slate-400">Try:</span>
                {["seo automation", "content marketing", "keyword research"].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setSearchQuery(suggestion)}
                    className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Total Keywords</p>
                  <p className="text-2xl font-bold">{totalKeywords}</p>
                </div>
                <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
                  <Search className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Topic Clusters</p>
                  <p className="text-2xl font-bold">{clusters.length}</p>
                </div>
                <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900">
                  <Layers className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Total Volume</p>
                  <p className="text-2xl font-bold">{formatVolume(totalVolume)}/mo</p>
                </div>
                <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
                  <BarChart3 className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Content Ideas</p>
                  <p className="text-2xl font-bold">{clusters.reduce((sum, c) => sum + c.suggestedArticles, 0)}</p>
                </div>
                <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900">
                  <Lightbulb className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Selected Keywords Action Bar */}
        {selectedKeywords.size > 0 && (
          <Card className="border-cabbage-200 bg-cabbage-50 dark:border-cabbage-800 dark:bg-cabbage-950">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="default" className="text-sm">
                    {selectedKeywords.size} keywords selected
                  </Badge>
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Combined volume: {formatVolume(
                      clusters.flatMap(c => c.keywords)
                        .filter(k => selectedKeywords.has(k.id))
                        .reduce((sum, k) => sum + k.volume, 0)
                    )}/mo
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setSelectedKeywords(new Set())}>
                    Clear Selection
                  </Button>
                  <Button size="sm" className="gap-2">
                    <FileText className="h-4 w-4" />
                    Generate Content
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <Tabs defaultValue="clusters" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="clusters" className="gap-2">
                <Layers className="h-4 w-4" />
                Topic Clusters
              </TabsTrigger>
              <TabsTrigger value="all" className="gap-2">
                <Search className="h-4 w-4" />
                All Keywords
              </TabsTrigger>
              <TabsTrigger value="opportunities" className="gap-2">
                <Target className="h-4 w-4" />
                Quick Wins
              </TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Topic Clusters View */}
          <TabsContent value="clusters" className="space-y-4">
            {clusters.map((cluster) => (
              <Card key={cluster.id} className="overflow-hidden">
                <CardHeader 
                  className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  onClick={() => setActiveCluster(activeCluster === cluster.id ? null : cluster.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${
                        cluster.status === "completed" ? "bg-green-100 dark:bg-green-900" :
                        cluster.status === "in_progress" ? "bg-blue-100 dark:bg-blue-900" :
                        "bg-slate-100 dark:bg-slate-800"
                      }`}>
                        {cluster.status === "completed" ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                        ) : cluster.status === "in_progress" ? (
                          <Loader2 className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-spin" />
                        ) : (
                          <Circle className="h-5 w-5 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{cluster.name}</CardTitle>
                        <CardDescription>
                          {cluster.keywords.length} keywords • {formatVolume(cluster.totalVolume)}/mo volume
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">Avg. Difficulty</p>
                        <Badge className={getDifficultyColor(cluster.avgDifficulty)}>
                          {cluster.avgDifficulty}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">Content Ideas</p>
                        <Badge variant="secondary">{cluster.suggestedArticles} articles</Badge>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          selectAllInCluster(cluster.id);
                        }}
                      >
                        <Plus className="mr-1 h-4 w-4" />
                        Select All
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                {activeCluster === cluster.id && (
                  <CardContent className="border-t border-slate-200 dark:border-slate-700">
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {cluster.keywords.map((keyword) => (
                        <div 
                          key={keyword.id}
                          className={`flex items-center justify-between py-3 px-2 rounded-lg cursor-pointer transition-colors ${
                            selectedKeywords.has(keyword.id) 
                              ? "bg-cabbage-50 dark:bg-cabbage-950" 
                              : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                          }`}
                          onClick={() => toggleKeyword(keyword.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                              selectedKeywords.has(keyword.id)
                                ? "border-cabbage-500 bg-cabbage-500"
                                : "border-slate-300 dark:border-slate-600"
                            }`}>
                              {selectedKeywords.has(keyword.id) && (
                                <CheckCircle2 className="h-3 w-3 text-white" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900 dark:text-white">
                                {keyword.keyword}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className={getIntentColor(keyword.intent)}>
                                  {keyword.intent}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <p className="text-sm text-slate-500">Volume</p>
                              <p className="font-semibold flex items-center gap-1">
                                {formatVolume(keyword.volume)}
                                {keyword.trend === "up" && <TrendingUp className="h-4 w-4 text-green-500" />}
                                {keyword.trend === "down" && <TrendingDown className="h-4 w-4 text-red-500" />}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-slate-500">Difficulty</p>
                              <div className="flex items-center gap-2">
                                <Progress value={keyword.difficulty} className="w-16 h-2" />
                                <span className="text-sm font-medium">{keyword.difficulty}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-slate-500">CPC</p>
                              <p className="font-semibold">${keyword.cpc.toFixed(2)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </TabsContent>

          {/* All Keywords View */}
          <TabsContent value="all">
            <Card>
              <CardContent className="pt-6">
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {clusters.flatMap(c => c.keywords).map((keyword) => (
                    <div 
                      key={keyword.id}
                      className={`flex items-center justify-between py-3 px-2 rounded-lg cursor-pointer transition-colors ${
                        selectedKeywords.has(keyword.id) 
                          ? "bg-cabbage-50 dark:bg-cabbage-950" 
                          : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      }`}
                      onClick={() => toggleKeyword(keyword.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          selectedKeywords.has(keyword.id)
                            ? "border-cabbage-500 bg-cabbage-500"
                            : "border-slate-300 dark:border-slate-600"
                        }`}>
                          {selectedKeywords.has(keyword.id) && (
                            <CheckCircle2 className="h-3 w-3 text-white" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {keyword.keyword}
                          </p>
                          <Badge variant="outline" className={getIntentColor(keyword.intent)}>
                            {keyword.intent}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-sm text-slate-500">Volume</p>
                          <p className="font-semibold">{formatVolume(keyword.volume)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-slate-500">Difficulty</p>
                          <Badge className={getDifficultyColor(keyword.difficulty)}>
                            {keyword.difficulty}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-slate-500">CPC</p>
                          <p className="font-semibold">${keyword.cpc.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quick Wins View */}
          <TabsContent value="opportunities">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-cabbage-600" />
                  Quick Win Opportunities
                </CardTitle>
                <CardDescription>
                  High volume keywords with low competition - perfect targets for fast results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {clusters
                    .flatMap(c => c.keywords)
                    .filter(k => k.volume > 1000 && k.difficulty < 50)
                    .sort((a, b) => (b.volume / b.difficulty) - (a.volume / a.difficulty))
                    .slice(0, 10)
                    .map((keyword, index) => (
                      <div 
                        key={keyword.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-cabbage-300 dark:hover:border-cabbage-700 transition-colors cursor-pointer"
                        onClick={() => toggleKeyword(keyword.id)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-cabbage-500 to-cabbage-600 text-white font-bold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">
                              {keyword.keyword}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm text-green-600 flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" />
                                High potential
                              </span>
                              <Badge variant="outline" className={getIntentColor(keyword.intent)}>
                                {keyword.intent}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">
                              {formatVolume(keyword.volume)}
                            </p>
                            <p className="text-xs text-slate-500">monthly searches</p>
                          </div>
                          <div className="text-center">
                            <Badge className={`text-lg ${getDifficultyColor(keyword.difficulty)}`}>
                              {keyword.difficulty}
                            </Badge>
                            <p className="text-xs text-slate-500 mt-1">difficulty</p>
                          </div>
                          <Button size="sm" className="gap-2">
                            <FileText className="h-4 w-4" />
                            Create Content
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

