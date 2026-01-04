"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Zap,
  FileText,
  Search,
  Globe,
  AlertTriangle,
  Settings,
  Plus,
  Trash2,
  Bot,
  Brain,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";

// ============================================
// TYPES
// ============================================

type TaskStatus = "pending" | "running" | "completed" | "failed" | "cancelled";
type TaskType = "content" | "crawl" | "audit" | "keywords" | "publish" | "analyze";

interface AutopilotTask {
  id: string;
  type: TaskType;
  title: string;
  description: string;
  status: TaskStatus;
  progress: number;
  startedAt?: string;
  completedAt?: string;
  result?: string;
  error?: string;
}

interface TasksData {
  tasks: AutopilotTask[];
  stats: {
    running: number;
    pending: number;
    completed: number;
    failed: number;
  };
}

// ============================================
// TASK TYPE CONFIG
// ============================================

const taskTypeConfig: Record<TaskType, { icon: React.ElementType; color: string }> = {
  content: { icon: FileText, color: "text-blue-500 bg-blue-500/10" },
  keywords: { icon: Search, color: "text-purple-500 bg-purple-500/10" },
  audit: { icon: AlertTriangle, color: "text-yellow-500 bg-yellow-500/10" },
  crawl: { icon: Globe, color: "text-green-500 bg-green-500/10" },
  publish: { icon: Globe, color: "text-green-500 bg-green-500/10" },
  analyze: { icon: Target, color: "text-pink-500 bg-pink-500/10" },
};

// ============================================
// STATUS BADGE
// ============================================

function StatusBadge({ status }: { status: TaskStatus }) {
  const config = {
    pending: { label: "Pending", color: "bg-gray-500/10 text-gray-500", icon: Clock },
    running: { label: "Running", color: "bg-blue-500/10 text-blue-500", icon: Loader2 },
    completed: { label: "Completed", color: "bg-green-500/10 text-green-500", icon: CheckCircle2 },
    failed: { label: "Failed", color: "bg-red-500/10 text-red-500", icon: AlertCircle },
    cancelled: { label: "Cancelled", color: "bg-gray-500/10 text-gray-500", icon: Clock },
  };

  const { label, color, icon: Icon } = config[status] || config.pending;

  return (
    <Badge variant="secondary" className={color}>
      <Icon className={`w-3 h-3 mr-1 ${status === "running" ? "animate-spin" : ""}`} />
      {label}
    </Badge>
  );
}

// ============================================
// TASK CARD
// ============================================

function TaskCard({
  task,
  onRemove,
  onRetry,
}: {
  task: AutopilotTask;
  onRemove: () => void;
  onRetry: () => void;
}) {
  const typeConfig = taskTypeConfig[task.type] || taskTypeConfig.content;
  const Icon = typeConfig.icon;

  return (
    <Card className={`transition-all bg-zinc-900 border-zinc-800 ${task.status === "running" ? "ring-2 ring-emerald-500/50" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${typeConfig.color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <h4 className="font-medium truncate text-white">{task.title}</h4>
              <StatusBadge status={task.status} />
            </div>
            <p className="text-sm text-zinc-400 mb-2">{task.description}</p>

            {task.status === "running" && (
              <div className="space-y-1">
                <Progress value={task.progress} className="h-2" />
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>{task.progress}% complete</span>
                  {task.startedAt && <span>Started {new Date(task.startedAt).toLocaleTimeString()}</span>}
                </div>
              </div>
            )}

            {task.status === "completed" && task.result && (
              <div className="flex items-center gap-2 text-sm text-green-500">
                <CheckCircle2 className="w-4 h-4" />
                <span>{task.result}</span>
              </div>
            )}

            {task.status === "failed" && task.error && (
              <div className="flex items-center gap-2 text-sm text-red-500">
                <AlertCircle className="w-4 h-4" />
                <span>{task.error}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1">
            {task.status === "failed" && (
              <Button variant="ghost" size="icon" onClick={onRetry} className="h-8 w-8">
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
            {(task.status === "pending" || task.status === "failed" || task.status === "cancelled") && (
              <Button variant="ghost" size="icon" onClick={onRemove} className="h-8 w-8 text-red-500">
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// LOADING SKELETON
// ============================================

function AutopilotLoading() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4">
              <Skeleton className="h-12 w-full bg-zinc-800" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full bg-zinc-800" />
        ))}
      </div>
    </div>
  );
}

// ============================================
// EMPTY STATE
// ============================================

function EmptyState() {
  return (
    <Card className="p-8 text-center bg-zinc-900 border-zinc-800">
      <div className="inline-flex items-center justify-center p-4 bg-zinc-800 rounded-full mb-4">
        <Bot className="w-8 h-8 text-zinc-400" />
      </div>
      <h3 className="text-lg font-semibold mb-2 text-white">No tasks in queue</h3>
      <p className="text-zinc-400 mb-4">
        Add a task above or use the command palette (⌘K) to start automating your SEO
      </p>
      <Link href="/dashboard">
        <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white">
          <Sparkles className="w-4 h-4 mr-2" />
          Analyze a Site
        </Button>
      </Link>
    </Card>
  );
}

// ============================================
// MAIN CONTENT
// ============================================

function AutopilotContent() {
  const searchParams = useSearchParams();
  const initialTask = searchParams.get("task");
  const queryClient = useQueryClient();

  const [newTaskPrompt, setNewTaskPrompt] = useState(initialTask || "");
  const [needsUpgrade, setNeedsUpgrade] = useState(false);
  const [settings, setSettings] = useState({
    autoPublish: false,
    notifyOnComplete: true,
    maxConcurrent: 2,
    pauseOnError: true,
  });

  // Fetch tasks
  const { data, isLoading, error, refetch } = useQuery<TasksData>({
    queryKey: ["autopilot-tasks"],
    queryFn: async () => {
      const response = await fetch("/api/autopilot/tasks");
      if (response.status === 402) {
        // Subscription required - not an error, just needs upgrade
        setNeedsUpgrade(true);
        return { tasks: [], stats: { running: 0, pending: 0, completed: 0, failed: 0 } };
      }
      if (!response.ok) throw new Error("Failed to fetch tasks");
      const json = await response.json();
      setNeedsUpgrade(false);
      return json.data;
    },
    refetchInterval: needsUpgrade ? false : 5000, // Only poll if subscribed
    retry: needsUpgrade ? false : 3,
  });

  // Create task mutation
  const createMutation = useMutation({
    mutationFn: async (taskData: { type: string; description: string }) => {
      const response = await fetch("/api/autopilot/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      });
      if (!response.ok) throw new Error("Failed to create task");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["autopilot-tasks"] });
      setNewTaskPrompt("");
    },
  });

  // Cancel task mutation
  const cancelMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const response = await fetch(`/api/autopilot/tasks?id=${taskId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to cancel task");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["autopilot-tasks"] });
    },
  });

  // Clear completed tasks mutation
  const clearCompletedMutation = useMutation({
    mutationFn: async () => {
      const completedTasks = tasks.filter(t => t.status === "completed");
      await Promise.all(
        completedTasks.map(task =>
          fetch(`/api/autopilot/tasks?id=${task.id}`, { method: "DELETE" })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["autopilot-tasks"] });
    },
  });

  const addTask = () => {
    if (!newTaskPrompt.trim()) return;
    createMutation.mutate({
      type: "content",
      description: newTaskPrompt,
    });
  };

  const handleClearCompleted = () => {
    clearCompletedMutation.mutate();
  };

  const stats = data?.stats || { running: 0, pending: 0, completed: 0, failed: 0 };
  const tasks = data?.tasks || [];
  const isRunning = stats.running > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3 text-white">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Bot className="w-8 h-8 text-emerald-500" />
            </div>
            SEO Autopilot
          </h1>
          <p className="text-zinc-400 mt-1">
            AI-powered automation for your SEO tasks
          </p>
        </div>
        <div className="flex gap-3">
          <Badge variant={isRunning ? "default" : "secondary"} className="px-4 py-2">
          {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Running
              </>
          ) : (
              <>
                <Clock className="w-4 h-4 mr-2" />
                Idle
              </>
          )}
          </Badge>
        </div>
      </div>

      {/* Upgrade Required State */}
      {needsUpgrade && (
        <Card className="p-6 border-emerald-500/30 bg-emerald-500/10">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-emerald-500/20">
              <Sparkles className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-emerald-400 mb-1">Upgrade to Access Autopilot</p>
              <p className="text-sm text-zinc-400">
                Automate your SEO tasks with AI-powered autopilot. Available on all paid plans.
              </p>
            </div>
            <Link href="/pricing">
              <Button className="bg-emerald-600 hover:bg-emerald-500 text-white">
                View Plans
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Error State */}
      {error && !needsUpgrade && (
        <Card className="p-6 border-red-500/30 bg-red-500/10">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <div>
              <p className="font-medium text-red-400">Failed to load tasks</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="ml-auto border-zinc-700 text-zinc-300 hover:bg-zinc-800">
              Retry
            </Button>
          </div>
        </Card>
      )}

      {/* Loading */}
      {isLoading && !needsUpgrade && <AutopilotLoading />}

      {/* Main Content */}
      {!isLoading && !needsUpgrade && (
        <>
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Loader2 className={`w-5 h-5 text-blue-500 ${isRunning ? "animate-spin" : ""}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.running}</p>
                <p className="text-xs text-zinc-400">Running</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-zinc-700/50">
                <Clock className="w-5 h-5 text-zinc-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.pending}</p>
                <p className="text-xs text-zinc-400">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.completed}</p>
                <p className="text-xs text-zinc-400">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Brain className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{isRunning ? "Active" : "Idle"}</p>
                <p className="text-xs text-zinc-400">Status</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Task Queue */}
        <div className="lg:col-span-2 space-y-4">
          {/* New Task Input */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Sparkles className="w-5 h-5 text-emerald-500" />
                Add New Task
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Describe what you want the AI to do
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Textarea
                  value={newTaskPrompt}
                  onChange={(e) => setNewTaskPrompt(e.target.value)}
                  placeholder="e.g., Generate an article about 'best SEO practices for e-commerce sites'"
                  className="min-h-[80px] bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-emerald-500/20"
                />
              </div>
              <div className="flex justify-end mt-3">
                <Button
                  onClick={addTask}
                  disabled={!newTaskPrompt.trim() || createMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Add to Queue
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Task List */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Task Queue</h2>
            {stats.completed > 0 && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleClearCompleted}
                disabled={clearCompletedMutation.isPending}
                className="text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                {clearCompletedMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Clear Completed
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {tasks.length === 0 ? (
                  <EmptyState />
            ) : (
              tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                      onRemove={() => cancelMutation.mutate(task.id)}
                      onRetry={() => {
                        // Retry by creating a new task with same description
                        createMutation.mutate({
                          type: task.type,
                          description: task.description,
                        });
                      }}
                />
              ))
            )}
          </div>
        </div>

        {/* Settings Sidebar */}
        <div className="space-y-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Settings className="w-5 h-5 text-zinc-400" />
                Autopilot Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-publish" className="text-zinc-200">Auto-Publish</Label>
                  <p className="text-xs text-zinc-400">
                    Publish content automatically
                  </p>
                </div>
                <Switch
                  id="auto-publish"
                  checked={settings.autoPublish}
                  onCheckedChange={(checked) =>
                    setSettings((s) => ({ ...s, autoPublish: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notify" className="text-zinc-200">Notifications</Label>
                  <p className="text-xs text-zinc-400">
                    Notify when tasks complete
                  </p>
                </div>
                <Switch
                  id="notify"
                  checked={settings.notifyOnComplete}
                  onCheckedChange={(checked) =>
                    setSettings((s) => ({ ...s, notifyOnComplete: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="pause-error" className="text-zinc-200">Pause on Error</Label>
                  <p className="text-xs text-zinc-400">
                    Stop queue if task fails
                  </p>
                </div>
                <Switch
                  id="pause-error"
                  checked={settings.pauseOnError}
                  onCheckedChange={(checked) =>
                    setSettings((s) => ({ ...s, pauseOnError: checked }))
                  }
                />
              </div>

              <div>
                <Label htmlFor="concurrent" className="text-zinc-200">Concurrent Tasks</Label>
                <Select
                  value={settings.maxConcurrent.toString()}
                  onValueChange={(v) =>
                    setSettings((s) => ({ ...s, maxConcurrent: parseInt(v) }))
                  }
                >
                  <SelectTrigger className="mt-2 bg-zinc-800 border-zinc-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="1" className="text-zinc-200 focus:bg-zinc-700 focus:text-white">1 task at a time</SelectItem>
                    <SelectItem value="2" className="text-zinc-200 focus:bg-zinc-700 focus:text-white">2 tasks at a time</SelectItem>
                    <SelectItem value="3" className="text-zinc-200 focus:bg-zinc-700 focus:text-white">3 tasks at a time</SelectItem>
                    <SelectItem value="5" className="text-zinc-200 focus:bg-zinc-700 focus:text-white">5 tasks at a time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Zap className="w-5 h-5 text-yellow-500" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                onClick={() =>
                  createMutation.mutate({
                    type: "audit",
                    description: "Run a full technical SEO audit",
                  })
                }
              >
                <AlertTriangle className="w-4 h-4 mr-2 text-yellow-500" />
                Run Technical Audit
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                onClick={() =>
                  createMutation.mutate({
                    type: "keywords",
                    description: "Research new keyword opportunities",
                  })
                }
              >
                <Search className="w-4 h-4 mr-2 text-purple-500" />
                Research Keywords
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                onClick={() =>
                  createMutation.mutate({
                    type: "content",
                    description: "Generate a new SEO article",
                  })
                }
              >
                <FileText className="w-4 h-4 mr-2 text-blue-500" />
                Generate Content
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                onClick={() =>
                  createMutation.mutate({
                    type: "analyze",
                    description: "Analyze site performance and rankings",
                  })
                }
              >
                <Target className="w-4 h-4 mr-2 text-pink-500" />
                Analyze Performance
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
        </>
      )}
    </div>
  );
}

// ============================================
// PAGE WRAPPER
// ============================================

export default function AutopilotPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64 mt-1" />
            </div>
          </div>
          <AutopilotLoading />
        </div>
      }
    >
      <AutopilotContent />
    </Suspense>
  );
}
