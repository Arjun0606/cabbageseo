"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Zap,
  Play,
  Pause,
  Settings,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Link2,
  Target,
  Search,
  Bot,
  Activity,
  TrendingUp,
  Calendar,
  ArrowRight,
  Loader2,
  RefreshCw,
  Shield,
  Globe,
  BarChart3,
} from "lucide-react";

// Types
interface AutopilotTask {
  id: string;
  type: "content" | "optimization" | "technical" | "links" | "research";
  title: string;
  description: string;
  status: "completed" | "in_progress" | "queued" | "failed";
  timestamp: string;
  impact?: string;
}

// Mock data
const autopilotStats = {
  isActive: true,
  uptime: "14 days 6 hours",
  tasksCompleted: 47,
  trafficGrowth: "+23.5%",
  contentGenerated: 8,
  linksAdded: 34,
  issuesFixed: 12,
};

const recentTasks: AutopilotTask[] = [
  {
    id: "1",
    type: "content",
    title: "Generated article: 'AI SEO Tools Guide'",
    description: "Created a 2,400 word comprehensive guide optimized for 'ai seo tools' keyword",
    status: "completed",
    timestamp: "2 hours ago",
    impact: "+2,400 estimated monthly traffic",
  },
  {
    id: "2",
    type: "links",
    title: "Added 5 internal links to /blog/seo-tips",
    description: "Connected related content to improve topical authority",
    status: "completed",
    timestamp: "4 hours ago",
    impact: "+15% page authority",
  },
  {
    id: "3",
    type: "technical",
    title: "Fixed missing meta descriptions",
    description: "Added optimized meta descriptions to 3 pages",
    status: "completed",
    timestamp: "6 hours ago",
    impact: "+8% expected CTR",
  },
  {
    id: "4",
    type: "optimization",
    title: "Optimizing /services page",
    description: "Improving content structure and keyword placement",
    status: "in_progress",
    timestamp: "Now",
  },
  {
    id: "5",
    type: "research",
    title: "Keyword research for 'seo automation'",
    description: "Analyzing competitors and finding content gaps",
    status: "queued",
    timestamp: "Scheduled",
  },
  {
    id: "6",
    type: "content",
    title: "Generate comparison: CabbageSEO vs Surfer",
    description: "Creating a comparison article targeting competitor keywords",
    status: "queued",
    timestamp: "Tomorrow",
  },
];

const upcomingTasks = [
  { title: "Write 'SEO Automation Guide'", type: "content", scheduled: "Tomorrow 9:00 AM" },
  { title: "Add internal links to 5 pages", type: "links", scheduled: "Tomorrow 2:00 PM" },
  { title: "Technical audit rescan", type: "technical", scheduled: "Dec 12, 9:00 AM" },
  { title: "Keyword gap analysis", type: "research", scheduled: "Dec 13, 10:00 AM" },
];

const automationSettings = [
  { id: "content", label: "Content Generation", description: "Auto-generate SEO articles", enabled: true },
  { id: "links", label: "Internal Linking", description: "Auto-add internal links", enabled: true },
  { id: "technical", label: "Technical Fixes", description: "Auto-fix SEO issues", enabled: true },
  { id: "research", label: "Keyword Research", description: "Auto-discover opportunities", enabled: true },
  { id: "publish", label: "Auto-Publish", description: "Publish content without review", enabled: false },
];

function getTaskIcon(type: string) {
  switch (type) {
    case "content": return FileText;
    case "optimization": return Target;
    case "technical": return Settings;
    case "links": return Link2;
    case "research": return Search;
    default: return Zap;
  }
}

function getTaskColor(type: string) {
  switch (type) {
    case "content": return "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400";
    case "optimization": return "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400";
    case "technical": return "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400";
    case "links": return "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400";
    case "research": return "bg-pink-100 text-pink-600 dark:bg-pink-900 dark:text-pink-400";
    default: return "bg-slate-100 text-slate-600";
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "completed":
      return <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">Completed</Badge>;
    case "in_progress":
      return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">In Progress</Badge>;
    case "queued":
      return <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">Queued</Badge>;
    case "failed":
      return <Badge className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">Failed</Badge>;
    default:
      return null;
  }
}

export default function AutopilotPage() {
  const [isActive, setIsActive] = useState(autopilotStats.isActive);
  const [settings, setSettings] = useState(automationSettings);

  const toggleSetting = (id: string) => {
    setSettings(settings.map(s => 
      s.id === id ? { ...s, enabled: !s.enabled } : s
    ));
  };

  return (
    <div className="min-h-screen">
      <DashboardHeader
        title="Autopilot"
        description="Your autonomous SEO assistant"
      />

      <div className="p-6 space-y-6">
        {/* Status Banner */}
        <Card className={`border-2 ${isActive ? "border-cabbage-200 bg-gradient-to-r from-cabbage-50 to-white dark:border-cabbage-800 dark:from-cabbage-950 dark:to-slate-900" : "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50"}`}>
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className={`relative p-4 rounded-2xl ${isActive ? "bg-cabbage-500" : "bg-slate-400"}`}>
                  <Bot className="h-8 w-8 text-white" />
                  {isActive && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse border-2 border-white" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                      SEO Autopilot
                    </h2>
                    <Badge className={isActive ? "bg-green-500 text-white" : "bg-slate-400 text-white"}>
                      {isActive ? "Active" : "Paused"}
                    </Badge>
                  </div>
                  <p className="text-slate-500">
                    {isActive 
                      ? `Running for ${autopilotStats.uptime} • ${autopilotStats.tasksCompleted} tasks completed`
                      : "Click to resume automatic optimization"
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Button variant="outline" asChild>
                  <a href="#settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </a>
                </Button>
                <Button 
                  size="lg"
                  variant={isActive ? "outline" : "default"}
                  onClick={() => setIsActive(!isActive)}
                  className="gap-2"
                >
                  {isActive ? (
                    <>
                      <Pause className="h-5 w-5" />
                      Pause Autopilot
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5" />
                      Resume Autopilot
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Traffic Growth</p>
                  <p className="text-2xl font-bold text-green-600">{autopilotStats.trafficGrowth}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Content Generated</p>
                  <p className="text-2xl font-bold">{autopilotStats.contentGenerated} articles</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900">
                  <Link2 className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Links Added</p>
                  <p className="text-2xl font-bold">{autopilotStats.linksAdded} links</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-orange-100 dark:bg-orange-900">
                  <CheckCircle2 className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Issues Fixed</p>
                  <p className="text-2xl font-bold">{autopilotStats.issuesFixed} issues</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Feed & Upcoming */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Activity */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-cabbage-600" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>What Autopilot has been doing</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTasks.map((task) => {
                  const Icon = getTaskIcon(task.type);
                  return (
                    <div
                      key={task.id}
                      className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <div className={`p-2 rounded-lg ${getTaskColor(task.type)}`}>
                        {task.status === "in_progress" ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Icon className="h-5 w-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-slate-900 dark:text-white">
                            {task.title}
                          </p>
                          {getStatusBadge(task.status)}
                        </div>
                        <p className="text-sm text-slate-500 mb-2">{task.description}</p>
                        <div className="flex items-center gap-4 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {task.timestamp}
                          </span>
                          {task.impact && (
                            <span className="flex items-center gap-1 text-green-600">
                              <TrendingUp className="h-3 w-3" />
                              {task.impact}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Upcoming Tasks
              </CardTitle>
              <CardDescription>What's scheduled next</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingTasks.map((task, i) => {
                  const Icon = getTaskIcon(task.type);
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${getTaskColor(task.type)}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{task.title}</p>
                        <p className="text-xs text-slate-500">{task.scheduled}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Settings */}
        <Card id="settings">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-slate-600" />
              Automation Settings
            </CardTitle>
            <CardDescription>Control what Autopilot can do automatically</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {settings.map((setting) => (
                <div key={setting.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${getTaskColor(setting.id)}`}>
                      {setting.id === "content" && <FileText className="h-5 w-5" />}
                      {setting.id === "links" && <Link2 className="h-5 w-5" />}
                      {setting.id === "technical" && <Settings className="h-5 w-5" />}
                      {setting.id === "research" && <Search className="h-5 w-5" />}
                      {setting.id === "publish" && <Globe className="h-5 w-5" />}
                    </div>
                    <div>
                      <Label htmlFor={setting.id} className="font-medium">
                        {setting.label}
                      </Label>
                      <p className="text-sm text-slate-500">{setting.description}</p>
                    </div>
                  </div>
                  <Switch
                    id={setting.id}
                    checked={setting.enabled}
                    onCheckedChange={() => toggleSetting(setting.id)}
                  />
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800 dark:text-amber-200">
                    Auto-Publish is disabled
                  </p>
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    Content will be created as drafts for your review. Enable to publish automatically.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

