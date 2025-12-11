"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp,
  TrendingDown,
  MousePointer,
  Eye,
  Target,
  BarChart3,
  Globe,
  Search,
  Calendar,
  Download,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  ExternalLink,
  Loader2,
  Link as LinkIcon,
  FileText,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import Link from "next/link";

// ============================================
// TYPES
// ============================================

interface AnalyticsData {
  period: string;
  metrics: {
    totalClicks: number;
    totalImpressions: number;
    avgCtr: number;
    avgPosition: number;
    trackedKeywords: number;
    publishedContent: number;
  };
  changes: {
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  };
  topQueries: Array<{
    query: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
    change: number;
  }>;
  topPages: Array<{
    url: string;
    title: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
  positionDistribution: {
    top3: number;
    top10: number;
    top20: number;
    top50: number;
    beyond: number;
  };
}

// ============================================
// STAT CARD
// ============================================

function StatCard({
  label,
  value,
  change,
  icon: Icon,
  isLoading,
}: {
  label: string;
  value: string | number;
  change: number;
  icon: React.ElementType;
  isLoading?: boolean;
}) {
  const trend = change > 0 ? "up" : change < 0 ? "down" : "neutral";

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-4 w-40" />
            </div>
            <Skeleton className="w-12 h-12 rounded-xl" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold">{value}</p>
            <div className="flex items-center gap-1 text-sm">
              {trend === "up" ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : trend === "down" ? (
                <TrendingDown className="w-4 h-4 text-red-500" />
              ) : (
                <Minus className="w-4 h-4 text-gray-400" />
              )}
              <span
                className={
                  change > 0
                    ? "text-green-500"
                    : change < 0
                    ? "text-red-500"
                    : "text-gray-500"
                }
              >
                {change > 0 ? "+" : ""}
                {change}%
              </span>
              <span className="text-muted-foreground">vs last period</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-primary/10 text-primary">
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// CHANGE INDICATOR
// ============================================

function ChangeIndicator({ change }: { change: number }) {
  if (change > 0) {
    return (
      <span className="flex items-center text-green-500 text-sm">
        <ArrowUpRight className="w-3 h-3" />
        {change}
      </span>
    );
  }
  if (change < 0) {
    return (
      <span className="flex items-center text-red-500 text-sm">
        <ArrowDownRight className="w-3 h-3" />
        {Math.abs(change)}
      </span>
    );
  }
  return <span className="text-gray-400 text-sm">-</span>;
}

// ============================================
// EMPTY STATE
// ============================================

function EmptyState() {
  return (
    <Card className="p-12">
      <div className="text-center max-w-md mx-auto">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
          <BarChart3 className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No Analytics Data Yet</h3>
        <p className="text-muted-foreground mb-6">
          Start tracking your SEO performance by adding a site and tracking keywords.
          Analytics will appear here once you have data.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/onboarding">
            <Button>Add Your First Site</Button>
          </Link>
          <Link href="/settings/integrations">
            <Button variant="outline">
              <LinkIcon className="w-4 h-4 mr-2" />
              Connect GSC
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

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState("30d");
  const [isSyncing, setIsSyncing] = useState(false);

  // Fetch analytics data
  const { data, isLoading, error, refetch } = useQuery<AnalyticsData>({
    queryKey: ["analytics", dateRange],
    queryFn: async () => {
      const response = await fetch(`/api/analytics?period=${dateRange}&type=overview`);
      if (!response.ok) throw new Error("Failed to fetch analytics");
      const json = await response.json();
      return json.data;
    },
  });

  const handleSync = async () => {
    setIsSyncing(true);
    await refetch();
    // In production, this would trigger a GSC sync
    await new Promise((r) => setTimeout(r, 1000));
    setIsSyncing(false);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toLocaleString();
  };

  // Check if we have any data
  const hasData = data && (data.metrics.totalClicks > 0 || data.metrics.trackedKeywords > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Track your SEO performance and organic traffic
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" disabled={!hasData}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button size="sm" onClick={handleSync} disabled={isSyncing}>
            {isSyncing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Sync
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="p-6 border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <div>
              <p className="font-medium text-red-700 dark:text-red-400">Failed to load analytics</p>
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
      {!isLoading && !error && !hasData && <EmptyState />}

      {/* Data View */}
      {(isLoading || hasData) && (
        <>
          {/* Metric Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total Clicks"
              value={isLoading ? "" : formatNumber(data?.metrics.totalClicks || 0)}
              change={data?.changes.clicks || 0}
              icon={MousePointer}
              isLoading={isLoading}
            />
            <StatCard
              label="Impressions"
              value={isLoading ? "" : formatNumber(data?.metrics.totalImpressions || 0)}
              change={data?.changes.impressions || 0}
              icon={Eye}
              isLoading={isLoading}
            />
            <StatCard
              label="Avg. CTR"
              value={isLoading ? "" : `${data?.metrics.avgCtr || 0}%`}
              change={data?.changes.ctr || 0}
              icon={Target}
              isLoading={isLoading}
            />
            <StatCard
              label="Avg. Position"
              value={isLoading ? "" : data?.metrics.avgPosition || "-"}
              change={data?.changes.position || 0}
              icon={BarChart3}
              isLoading={isLoading}
            />
          </div>

          {/* Position Distribution & Quick Stats */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Position Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Position Distribution</CardTitle>
                <CardDescription>Where your keywords rank in search results</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i}>
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-2 w-full" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {[
                      { label: "Top 3", value: data?.positionDistribution.top3 || 0, color: "bg-green-500" },
                      { label: "4-10", value: data?.positionDistribution.top10 || 0, color: "bg-blue-500" },
                      { label: "11-20", value: data?.positionDistribution.top20 || 0, color: "bg-yellow-500" },
                      { label: "21-50", value: data?.positionDistribution.top50 || 0, color: "bg-orange-500" },
                      { label: "50+", value: data?.positionDistribution.beyond || 0, color: "bg-red-500" },
                    ].map((bucket) => {
                      const total = Object.values(data?.positionDistribution || {}).reduce((a, b) => a + b, 0);
                      const percentage = total > 0 ? (bucket.value / total) * 100 : 0;
                      return (
                        <div key={bucket.label}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{bucket.label}</span>
                            <span className="text-sm text-muted-foreground">
                              {bucket.value} keywords ({percentage.toFixed(0)}%)
                            </span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full ${bucket.color} transition-all`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Stats</CardTitle>
                <CardDescription>Overview of your SEO assets</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="grid grid-cols-2 gap-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="p-4 rounded-lg bg-muted/50">
                        <Skeleton className="h-8 w-16 mb-2" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-muted/50 text-center">
                      <p className="text-3xl font-bold text-primary">
                        {data?.metrics.trackedKeywords || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Tracked Keywords</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 text-center">
                      <p className="text-3xl font-bold">
                        {data?.metrics.publishedContent || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Published Content</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 text-center">
                      <p className="text-3xl font-bold text-green-500">
                        {data?.positionDistribution.top10 || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Top 10 Rankings</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 text-center">
                      <p className="text-3xl font-bold">
                        {data?.metrics.avgPosition ? data.metrics.avgPosition.toFixed(1) : "-"}
                      </p>
                      <p className="text-sm text-muted-foreground">Avg Position</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Tabs for detailed data */}
          <Tabs defaultValue="queries" className="space-y-4">
            <TabsList>
              <TabsTrigger value="queries">Top Queries</TabsTrigger>
              <TabsTrigger value="pages">Top Pages</TabsTrigger>
            </TabsList>

            {/* Top Queries Tab */}
            <TabsContent value="queries">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Top Search Queries</CardTitle>
                      <CardDescription>Keywords driving traffic from Google</CardDescription>
                    </div>
                    <Badge variant="secondary">
                      <Search className="w-3 h-3 mr-1" />
                      {data?.topQueries.length || 0} queries
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {isLoading ? (
                    <div className="p-6 space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : data?.topQueries.length === 0 ? (
                    <div className="p-8 text-center">
                      <Search className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">
                        No query data yet. Add keywords to start tracking.
                      </p>
                      <Link href="/keywords">
                        <Button variant="link" className="mt-2">
                          Go to Keywords →
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Query</TableHead>
                          <TableHead className="text-right">Clicks</TableHead>
                          <TableHead className="text-right">Impressions</TableHead>
                          <TableHead className="text-right">CTR</TableHead>
                          <TableHead className="text-right">Position</TableHead>
                          <TableHead className="text-center">Change</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data?.topQueries.map((query) => (
                          <TableRow key={query.query}>
                            <TableCell className="font-medium">{query.query}</TableCell>
                            <TableCell className="text-right">
                              {query.clicks.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right">
                              {query.impressions.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right">{query.ctr.toFixed(2)}%</TableCell>
                            <TableCell className="text-right">
                              <span
                                className={
                                  query.position <= 10 ? "text-green-500 font-medium" : ""
                                }
                              >
                                {query.position.toFixed(1)}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <ChangeIndicator change={query.change} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Top Pages Tab */}
            <TabsContent value="pages">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Top Pages</CardTitle>
                      <CardDescription>Your best performing pages</CardDescription>
                    </div>
                    <Badge variant="secondary">
                      <FileText className="w-3 h-3 mr-1" />
                      {data?.topPages.length || 0} pages
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {isLoading ? (
                    <div className="p-6 space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : data?.topPages.length === 0 ? (
                    <div className="p-8 text-center">
                      <Globe className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">
                        No page data yet. Publish content to see performance.
                      </p>
                      <Link href="/content/new">
                        <Button variant="link" className="mt-2">
                          Create Content →
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Page</TableHead>
                          <TableHead className="text-right">Clicks</TableHead>
                          <TableHead className="text-right">Impressions</TableHead>
                          <TableHead className="text-right">CTR</TableHead>
                          <TableHead className="text-right">Position</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data?.topPages.map((page) => (
                          <TableRow key={page.url}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{page.title}</p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  {page.url}
                                  <ExternalLink className="w-3 h-3" />
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              {page.clicks.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right">
                              {page.impressions.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right">{page.ctr.toFixed(2)}%</TableCell>
                            <TableCell className="text-right">
                              <span
                                className={
                                  page.position <= 10 ? "text-green-500 font-medium" : ""
                                }
                              >
                                {page.position.toFixed(1)}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* GSC Connection Prompt */}
          {hasData && !data?.topQueries.length && (
            <Card className="p-6 border-dashed">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Search className="w-6 h-6 text-blue-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Connect Google Search Console</h3>
                  <p className="text-sm text-muted-foreground">
                    Get detailed query data, impressions, and click data directly from Google
                  </p>
                </div>
                <Link href="/settings/integrations">
                  <Button>
                    Connect GSC
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
