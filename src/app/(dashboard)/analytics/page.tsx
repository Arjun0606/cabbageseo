"use client";

import { useState } from "react";
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

// ============================================
// TYPES
// ============================================

interface MetricCard {
  label: string;
  value: string | number;
  change: number;
  trend: "up" | "down" | "neutral";
  icon: React.ElementType;
}

interface TopQuery {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  change: number;
}

interface TopPage {
  url: string;
  title: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface TrafficSource {
  source: string;
  sessions: number;
  percentage: number;
  change: number;
}

// ============================================
// MOCK DATA
// ============================================

const metrics: MetricCard[] = [
  { label: "Total Clicks", value: "12,847", change: 15.3, trend: "up", icon: MousePointer },
  { label: "Impressions", value: "456,923", change: 8.7, trend: "up", icon: Eye },
  { label: "Avg. CTR", value: "2.81%", change: 0.4, trend: "up", icon: Target },
  { label: "Avg. Position", value: "14.3", change: -2.1, trend: "up", icon: BarChart3 },
];

const topQueries: TopQuery[] = [
  { query: "seo tools", clicks: 1247, impressions: 45000, ctr: 2.77, position: 8.2, change: 3 },
  { query: "keyword research", clicks: 892, impressions: 32000, ctr: 2.79, position: 12.5, change: -2 },
  { query: "content optimization", clicks: 654, impressions: 18000, ctr: 3.63, position: 6.8, change: 5 },
  { query: "technical seo", clicks: 543, impressions: 15000, ctr: 3.62, position: 9.3, change: 1 },
  { query: "seo audit tool", clicks: 421, impressions: 12000, ctr: 3.51, position: 4.2, change: 8 },
  { query: "link building", clicks: 387, impressions: 14000, ctr: 2.76, position: 15.6, change: -4 },
  { query: "on page seo", clicks: 356, impressions: 11000, ctr: 3.24, position: 7.1, change: 2 },
  { query: "seo for beginners", clicks: 298, impressions: 9500, ctr: 3.14, position: 5.4, change: 6 },
];

const topPages: TopPage[] = [
  { url: "/blog/seo-guide-2025", title: "Complete Guide to SEO in 2025", clicks: 2340, impressions: 78000, ctr: 3.0, position: 5.2 },
  { url: "/tools", title: "Free SEO Tools", clicks: 1890, impressions: 65000, ctr: 2.91, position: 6.8 },
  { url: "/blog/keyword-research", title: "How to Do Keyword Research", clicks: 1456, impressions: 52000, ctr: 2.8, position: 8.1 },
  { url: "/", title: "CabbageSEO - SEO Autopilot", clicks: 1234, impressions: 45000, ctr: 2.74, position: 12.3 },
  { url: "/blog/technical-seo", title: "Technical SEO Checklist", clicks: 987, impressions: 34000, ctr: 2.9, position: 9.5 },
];

const trafficSources: TrafficSource[] = [
  { source: "Organic Search", sessions: 45678, percentage: 68, change: 12 },
  { source: "Direct", sessions: 12345, percentage: 18, change: 5 },
  { source: "Referral", sessions: 5678, percentage: 8, change: -3 },
  { source: "Social", sessions: 3456, percentage: 5, change: 8 },
  { source: "Email", sessions: 678, percentage: 1, change: 15 },
];

// ============================================
// MINI CHART (Simplified)
// ============================================

function MiniChart({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  return (
    <div className="flex items-end gap-0.5 h-8">
      {data.map((value, i) => {
        const height = ((value - min) / range) * 100;
        return (
          <div
            key={i}
            className={`w-1.5 rounded-sm ${color}`}
            style={{ height: `${Math.max(height, 10)}%` }}
          />
        );
      })}
    </div>
  );
}

// ============================================
// STAT CARD
// ============================================

function StatCard({ metric }: { metric: MetricCard }) {
  const Icon = metric.icon;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{metric.label}</p>
            <p className="text-3xl font-bold">{metric.value}</p>
            <div className="flex items-center gap-1 text-sm">
              {metric.trend === "up" ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : metric.trend === "down" ? (
                <TrendingDown className="w-4 h-4 text-red-500" />
              ) : (
                <Minus className="w-4 h-4 text-gray-400" />
              )}
              <span
                className={
                  metric.change > 0
                    ? "text-green-500"
                    : metric.change < 0
                    ? "text-red-500"
                    : "text-gray-500"
                }
              >
                {metric.change > 0 ? "+" : ""}
                {metric.change}%
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
// MAIN PAGE
// ============================================

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState("28d");
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = async () => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setIsLoading(false);
  };

  // Mock chart data
  const chartData = [45, 52, 48, 61, 55, 67, 73, 69, 78, 82, 76, 85, 91, 88];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Track your SEO performance and traffic
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
              <SelectItem value="28d">Last 28 days</SelectItem>
              <SelectItem value="3m">Last 3 months</SelectItem>
              <SelectItem value="6m">Last 6 months</SelectItem>
              <SelectItem value="1y">Last 12 months</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button size="sm" onClick={handleRefresh} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Sync
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <StatCard key={metric.label} metric={metric} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Clicks Over Time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Clicks Over Time</CardTitle>
            <CardDescription>Daily organic clicks from Google Search</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-end justify-between gap-1">
              {chartData.map((value, i) => {
                const height = (value / Math.max(...chartData)) * 100;
                return (
                  <div
                    key={i}
                    className="flex-1 bg-primary/80 rounded-t hover:bg-primary transition-colors cursor-pointer"
                    style={{ height: `${height}%` }}
                    title={`Day ${i + 1}: ${value * 10} clicks`}
                  />
                );
              })}
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>14 days ago</span>
              <span>Today</span>
            </div>
          </CardContent>
        </Card>

        {/* Traffic Sources */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Traffic Sources</CardTitle>
            <CardDescription>Where your visitors come from</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {trafficSources.map((source) => (
              <div key={source.source}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{source.source}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {source.sessions.toLocaleString()}
                    </span>
                    <ChangeIndicator change={source.change} />
                  </div>
                </div>
                <Progress value={source.percentage} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Tabs for detailed data */}
      <Tabs defaultValue="queries" className="space-y-4">
        <TabsList>
          <TabsTrigger value="queries">Top Queries</TabsTrigger>
          <TabsTrigger value="pages">Top Pages</TabsTrigger>
          <TabsTrigger value="countries">Countries</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
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
                  GSC Data
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
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
                  {topQueries.map((query) => (
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
                  <Globe className="w-3 h-3 mr-1" />
                  GSC Data
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
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
                  {topPages.map((page) => (
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Countries Tab */}
        <TabsContent value="countries">
          <Card className="p-8 text-center">
            <Globe className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Country Data</h3>
            <p className="text-muted-foreground mb-4">
              Connect Google Analytics to see traffic by country
            </p>
            <Button variant="outline">Connect GA4</Button>
          </Card>
        </TabsContent>

        {/* Devices Tab */}
        <TabsContent value="devices">
          <Card>
            <CardHeader>
              <CardTitle>Device Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="text-center p-6 rounded-lg bg-muted/50">
                  <p className="text-4xl font-bold text-primary">62%</p>
                  <p className="text-sm text-muted-foreground mt-1">Mobile</p>
                  <p className="text-xs text-green-500 mt-1">↑ 5% from last month</p>
                </div>
                <div className="text-center p-6 rounded-lg bg-muted/50">
                  <p className="text-4xl font-bold">34%</p>
                  <p className="text-sm text-muted-foreground mt-1">Desktop</p>
                  <p className="text-xs text-red-500 mt-1">↓ 3% from last month</p>
                </div>
                <div className="text-center p-6 rounded-lg bg-muted/50">
                  <p className="text-4xl font-bold">4%</p>
                  <p className="text-sm text-muted-foreground mt-1">Tablet</p>
                  <p className="text-xs text-muted-foreground mt-1">No change</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
