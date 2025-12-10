"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Zap,
  Target,
  FileText,
  Link2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  BarChart3,
  Globe,
  Eye,
  MousePointer,
  Search,
  ArrowUpRight,
  Calendar,
  Play,
  Pause,
} from "lucide-react";
import Link from "next/link";

// Types
interface Metric {
  label: string;
  value: string | number;
  change: number;
  trend: "up" | "down";
}

// Mock data
const metrics: Metric[] = [
  { label: "Organic Traffic", value: "12,847", change: 23.5, trend: "up" },
  { label: "Keywords Ranking", value: "847", change: 12.2, trend: "up" },
  { label: "Avg. Position", value: "14.2", change: -2.3, trend: "up" },
  { label: "SEO Score", value: "87", change: 8, trend: "up" },
];

const recentActivity = [
  { type: "content", title: "Published: AI SEO Tools Guide", time: "2 hours ago", status: "success" },
  { type: "keyword", title: "New ranking: 'seo automation' #8", time: "5 hours ago", status: "success" },
  { type: "link", title: "Added 12 internal links", time: "Yesterday", status: "success" },
  { type: "issue", title: "Fixed: 3 broken links", time: "Yesterday", status: "success" },
  { type: "content", title: "Draft: Content Marketing Tips", time: "2 days ago", status: "pending" },
];

const nextActions = [
  { 
    title: "Write article for 'ai seo tools'",
    type: "content",
    priority: "high",
    impact: "+2,400 traffic/mo",
    icon: FileText,
  },
  { 
    title: "Add 8 internal links to /blog/guide",
    type: "links",
    priority: "high",
    impact: "+15% page authority",
    icon: Link2,
  },
  { 
    title: "Fix missing meta descriptions (5)",
    type: "technical",
    priority: "medium",
    impact: "+12% CTR",
    icon: AlertTriangle,
  },
  { 
    title: "Optimize '/services' for keywords",
    type: "optimization",
    priority: "medium",
    impact: "+8 ranking positions",
    icon: Target,
  },
];

const topKeywords = [
  { keyword: "ai seo tools", position: 8, change: 5, volume: 5400 },
  { keyword: "seo automation", position: 12, change: 3, volume: 2900 },
  { keyword: "automated content", position: 15, change: -2, volume: 1800 },
  { keyword: "best seo software", position: 23, change: 8, volume: 4200 },
  { keyword: "ai content writer", position: 31, change: 12, volume: 3100 },
];

export default function DashboardPage() {
  const [autopilotRunning, setAutopilotRunning] = useState(true);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <DashboardHeader
        title="Dashboard"
        description="Your SEO command center"
      />

      <div className="p-6 space-y-6">
        {/* Autopilot Status Banner */}
        <Card className="border-cabbage-200 dark:border-cabbage-800 bg-gradient-to-r from-cabbage-50 to-white dark:from-cabbage-950 dark:to-slate-900">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`relative p-3 rounded-xl ${autopilotRunning ? 'bg-cabbage-500' : 'bg-slate-400'}`}>
                  <Zap className="h-6 w-6 text-white" />
                  {autopilotRunning && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      SEO Autopilot
                    </h3>
                    <Badge className={autopilotRunning ? "bg-green-500" : "bg-slate-400"}>
                      {autopilotRunning ? "Running" : "Paused"}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-500">
                    {autopilotRunning 
                      ? "Continuously optimizing your site • Last action: 2 hours ago"
                      : "Autopilot is paused. Click to resume optimization."
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" asChild>
                  <Link href="/autopilot">View Activity</Link>
                </Button>
                <Button 
                  variant={autopilotRunning ? "outline" : "default"}
                  onClick={() => setAutopilotRunning(!autopilotRunning)}
                  className="gap-2"
                >
                  {autopilotRunning ? (
                    <>
                      <Pause className="h-4 w-4" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Resume
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metrics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => (
            <Card key={metric.label} className="relative overflow-hidden">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{metric.label}</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                      {metric.value}
                    </p>
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${
                    metric.trend === "up" 
                      ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                      : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                  }`}>
                    {metric.trend === "up" ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    {Math.abs(metric.change)}%
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cabbage-500 to-cabbage-400" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Next Actions - Priority Column */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-cabbage-600" />
                  Next Actions
                </CardTitle>
                <Badge variant="outline">{nextActions.length}</Badge>
              </div>
              <CardDescription>AI-recommended tasks for maximum impact</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {nextActions.map((action, i) => (
                <div
                  key={i}
                  className="group p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-cabbage-300 dark:hover:border-cabbage-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      action.priority === "high" 
                        ? "bg-orange-100 dark:bg-orange-900" 
                        : "bg-blue-100 dark:bg-blue-900"
                    }`}>
                      <action.icon className={`h-4 w-4 ${
                        action.priority === "high"
                          ? "text-orange-600 dark:text-orange-400"
                          : "text-blue-600 dark:text-blue-400"
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-slate-900 dark:text-white">
                        {action.title}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        {action.impact}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ))}
              <Button className="w-full gap-2" variant="outline" asChild>
                <Link href="/actions">
                  View All Actions
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Keyword Rankings */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-600" />
                  Top Keywords
                </CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/keywords">View All</Link>
                </Button>
              </div>
              <CardDescription>Your best ranking opportunities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {topKeywords.map((kw, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 text-white text-xs flex items-center justify-center font-bold">
                      #{kw.position}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-slate-900 dark:text-white">
                        {kw.keyword}
                      </p>
                      <p className="text-xs text-slate-500">{kw.volume.toLocaleString()}/mo</p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-medium ${
                    kw.change > 0 
                      ? "text-green-600" 
                      : kw.change < 0 
                        ? "text-red-600" 
                        : "text-slate-500"
                  }`}>
                    {kw.change > 0 ? (
                      <>
                        <TrendingUp className="h-3 w-3" />
                        +{kw.change}
                      </>
                    ) : kw.change < 0 ? (
                      <>
                        <TrendingDown className="h-3 w-3" />
                        {kw.change}
                      </>
                    ) : (
                      <span>—</span>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Recent Activity
                </CardTitle>
              </div>
              <CardDescription>What CabbageSEO has done for you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentActivity.map((activity, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className={`mt-0.5 ${
                    activity.status === "success" 
                      ? "text-green-500" 
                      : "text-yellow-500"
                  }`}>
                    {activity.status === "success" ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Clock className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-900 dark:text-white">
                      {activity.title}
                    </p>
                    <p className="text-xs text-slate-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Row */}
        <div className="grid gap-4 md:grid-cols-3">
          <Link href="/content" className="block">
            <Card className="group cursor-pointer hover:border-cabbage-300 dark:hover:border-cabbage-700 transition-colors h-full">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 dark:text-white">Generate Content</h3>
                    <p className="text-sm text-slate-500">Create SEO-optimized articles</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-cabbage-600 transition-colors" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/keywords" className="block">
            <Card className="group cursor-pointer hover:border-cabbage-300 dark:hover:border-cabbage-700 transition-colors h-full">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600">
                    <Search className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 dark:text-white">Keyword Research</h3>
                    <p className="text-sm text-slate-500">Discover ranking opportunities</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-cabbage-600 transition-colors" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/audit" className="block">
            <Card className="group cursor-pointer hover:border-cabbage-300 dark:hover:border-cabbage-700 transition-colors h-full">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 dark:text-white">Run SEO Audit</h3>
                    <p className="text-sm text-slate-500">Find and fix issues</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-cabbage-600 transition-colors" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
