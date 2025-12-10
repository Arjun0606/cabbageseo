"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  TrendingDown,
  Eye,
  MousePointer,
  Clock,
  Users,
  Globe,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  RefreshCw,
  Download,
  Filter,
  BarChart3,
  LineChart,
  Target,
  FileText,
  ExternalLink,
} from "lucide-react";

// Mock data
const overviewMetrics = [
  { 
    label: "Total Clicks", 
    value: "12,847", 
    change: 23.5, 
    trend: "up" as const,
    icon: MousePointer,
    color: "blue",
  },
  { 
    label: "Impressions", 
    value: "284,320", 
    change: 15.2, 
    trend: "up" as const,
    icon: Eye,
    color: "purple",
  },
  { 
    label: "Avg. CTR", 
    value: "4.52%", 
    change: 0.8, 
    trend: "up" as const,
    icon: Target,
    color: "green",
  },
  { 
    label: "Avg. Position", 
    value: "14.2", 
    change: -2.3, 
    trend: "up" as const,
    icon: BarChart3,
    color: "orange",
  },
];

const trafficData = [
  { date: "Dec 1", clicks: 380, impressions: 8200 },
  { date: "Dec 2", clicks: 420, impressions: 9100 },
  { date: "Dec 3", clicks: 390, impressions: 8800 },
  { date: "Dec 4", clicks: 480, impressions: 10200 },
  { date: "Dec 5", clicks: 520, impressions: 11500 },
  { date: "Dec 6", clicks: 450, impressions: 9800 },
  { date: "Dec 7", clicks: 510, impressions: 11200 },
  { date: "Dec 8", clicks: 540, impressions: 12100 },
  { date: "Dec 9", clicks: 580, impressions: 13000 },
];

const topQueries = [
  { query: "ai seo tools", clicks: 1247, impressions: 28400, ctr: 4.39, position: 8.2 },
  { query: "seo automation", clicks: 892, impressions: 19200, ctr: 4.65, position: 12.1 },
  { query: "best seo software 2024", clicks: 654, impressions: 15800, ctr: 4.14, position: 15.4 },
  { query: "automated content writing", clicks: 521, impressions: 12400, ctr: 4.20, position: 18.7 },
  { query: "ai blog writer", clicks: 489, impressions: 11200, ctr: 4.37, position: 14.2 },
  { query: "seo optimization tools", clicks: 423, impressions: 9800, ctr: 4.32, position: 21.3 },
  { query: "keyword research tool", clicks: 387, impressions: 8900, ctr: 4.35, position: 23.8 },
  { query: "content optimization", clicks: 342, impressions: 7600, ctr: 4.50, position: 19.5 },
];

const topPages = [
  { page: "/blog/ai-seo-tools-guide", clicks: 2840, impressions: 62000, ctr: 4.58, position: 6.2 },
  { page: "/features", clicks: 1920, impressions: 48000, ctr: 4.00, position: 11.4 },
  { page: "/blog/seo-automation", clicks: 1650, impressions: 38000, ctr: 4.34, position: 9.8 },
  { page: "/pricing", clicks: 1420, impressions: 32000, ctr: 4.44, position: 14.2 },
  { page: "/blog/keyword-research-tips", clicks: 1180, impressions: 28000, ctr: 4.21, position: 12.5 },
];

const gaMetrics = [
  { label: "Active Users", value: "3,847", change: 18.2, trend: "up" as const },
  { label: "Sessions", value: "8,234", change: 22.1, trend: "up" as const },
  { label: "Bounce Rate", value: "42.3%", change: -5.2, trend: "up" as const },
  { label: "Avg. Session", value: "2m 34s", change: 12.8, trend: "up" as const },
];

const topReferrers = [
  { source: "google", sessions: 4820, percentage: 58.5 },
  { source: "direct", sessions: 1640, percentage: 19.9 },
  { source: "twitter.com", sessions: 680, percentage: 8.3 },
  { source: "linkedin.com", sessions: 520, percentage: 6.3 },
  { source: "reddit.com", sessions: 340, percentage: 4.1 },
  { source: "Other", sessions: 234, percentage: 2.9 },
];

function SimpleLineChart({ data, dataKey, color }: { data: typeof trafficData; dataKey: "clicks" | "impressions"; color: string }) {
  const maxValue = Math.max(...data.map(d => d[dataKey]));
  const minValue = Math.min(...data.map(d => d[dataKey]));
  const range = maxValue - minValue;
  
  return (
    <div className="h-40 flex items-end gap-1">
      {data.map((item, i) => {
        const height = ((item[dataKey] - minValue) / range) * 100;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div 
              className={`w-full rounded-t transition-all hover:opacity-80 ${color}`}
              style={{ height: `${Math.max(height, 5)}%` }}
              title={`${item.date}: ${item[dataKey].toLocaleString()}`}
            />
            <span className="text-[10px] text-slate-400">{item.date.split(" ")[1]}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState("7d");

  return (
    <div className="min-h-screen">
      <DashboardHeader
        title="Analytics"
        description="Track your organic search performance"
      />

      <div className="p-6 space-y-6">
        {/* Date Range & Actions */}
        <div className="flex items-center justify-between">
          <Tabs value={dateRange} onValueChange={setDateRange}>
            <TabsList>
              <TabsTrigger value="7d">7 Days</TabsTrigger>
              <TabsTrigger value="28d">28 Days</TabsTrigger>
              <TabsTrigger value="3m">3 Months</TabsTrigger>
              <TabsTrigger value="12m">12 Months</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Calendar className="mr-2 h-4 w-4" />
              Custom Range
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

        {/* GSC Metrics */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Search className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Google Search Console</h2>
            <Badge variant="outline" className="text-green-600 border-green-300">Connected</Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {overviewMetrics.map((metric) => (
              <Card key={metric.label}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500">{metric.label}</p>
                      <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                        {metric.value}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className={`p-2 rounded-lg bg-${metric.color}-100 dark:bg-${metric.color}-900`}>
                        <metric.icon className={`h-5 w-5 text-${metric.color}-600`} />
                      </div>
                      <div className={`flex items-center gap-1 text-sm font-medium ${
                        metric.trend === "up" ? "text-green-600" : "text-red-600"
                      }`}>
                        {metric.trend === "up" ? (
                          <ArrowUpRight className="h-4 w-4" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4" />
                        )}
                        {Math.abs(metric.change)}%
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Traffic Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MousePointer className="h-5 w-5 text-blue-600" />
                Clicks Over Time
              </CardTitle>
              <CardDescription>Daily organic clicks from Google</CardDescription>
            </CardHeader>
            <CardContent>
              <SimpleLineChart data={trafficData} dataKey="clicks" color="bg-blue-500" />
              <div className="flex items-center justify-center gap-4 mt-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-blue-500" />
                  <span className="text-slate-500">Clicks</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-purple-600" />
                Impressions Over Time
              </CardTitle>
              <CardDescription>Daily search impressions on Google</CardDescription>
            </CardHeader>
            <CardContent>
              <SimpleLineChart data={trafficData} dataKey="impressions" color="bg-purple-500" />
              <div className="flex items-center justify-center gap-4 mt-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-purple-500" />
                  <span className="text-slate-500">Impressions</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Queries & Pages */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Top Queries */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5 text-cabbage-600" />
                    Top Search Queries
                  </CardTitle>
                  <CardDescription>Keywords driving traffic to your site</CardDescription>
                </div>
                <Button variant="outline" size="sm">View All</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topQueries.slice(0, 6).map((query, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cabbage-500 to-cabbage-600 text-white text-xs flex items-center justify-center font-bold">
                        {i + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-slate-900 dark:text-white">{query.query}</p>
                        <p className="text-xs text-slate-500">Position: {query.position.toFixed(1)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-right">
                        <p className="font-semibold">{query.clicks.toLocaleString()}</p>
                        <p className="text-xs text-slate-400">clicks</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{query.ctr.toFixed(2)}%</p>
                        <p className="text-xs text-slate-400">CTR</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Pages */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-purple-600" />
                    Top Pages
                  </CardTitle>
                  <CardDescription>Best performing pages in search</CardDescription>
                </div>
                <Button variant="outline" size="sm">View All</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topPages.map((page, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 text-white text-xs flex items-center justify-center font-bold">
                        {i + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-slate-900 dark:text-white truncate">{page.page}</p>
                        <p className="text-xs text-slate-500">Position: {page.position.toFixed(1)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-right">
                        <p className="font-semibold">{page.clicks.toLocaleString()}</p>
                        <p className="text-xs text-slate-400">clicks</p>
                      </div>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Google Analytics Section */}
        <div className="pt-6 border-t">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-orange-600" />
            <h2 className="text-lg font-semibold">Google Analytics 4</h2>
            <Badge variant="outline" className="text-green-600 border-green-300">Connected</Badge>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            {gaMetrics.map((metric) => (
              <Card key={metric.label}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500">{metric.label}</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                        {metric.value}
                      </p>
                    </div>
                    <div className={`flex items-center gap-1 text-sm font-medium ${
                      metric.trend === "up" ? "text-green-600" : "text-red-600"
                    }`}>
                      {metric.trend === "up" ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      {Math.abs(metric.change)}%
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Traffic Sources */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-600" />
                Traffic Sources
              </CardTitle>
              <CardDescription>Where your visitors come from</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topReferrers.map((source) => (
                  <div key={source.source} className="flex items-center gap-4">
                    <div className="w-24 text-sm font-medium capitalize">{source.source}</div>
                    <div className="flex-1">
                      <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cabbage-500 to-cabbage-600 transition-all"
                          style={{ width: `${source.percentage}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-20 text-right text-sm">
                      <span className="font-semibold">{source.sessions.toLocaleString()}</span>
                      <span className="text-slate-400 ml-1">({source.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

