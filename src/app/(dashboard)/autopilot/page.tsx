"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Sparkles,
  Play,
  Pause,
  Square,
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
  ChevronRight,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ============================================
// TYPES
// ============================================

type TaskStatus = "queued" | "running" | "completed" | "failed" | "paused";
type TaskType = "content" | "keyword" | "audit" | "optimize" | "publish" | "analyze";

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

interface AutopilotSettings {
  autoPublish: boolean;
  notifyOnComplete: boolean;
  maxConcurrent: number;
  pauseOnError: boolean;
}

// ============================================
// MOCK DATA
// ============================================

const initialTasks: AutopilotTask[] = [
  {
    id: "1",
    type: "content",
    title: "Generate: SEO Best Practices 2025",
    description: "Creating 2,500-word article targeting 'seo best practices'",
    status: "running",
    progress: 65,
    startedAt: "2 min ago",
  },
  {
    id: "2",
    type: "keyword",
    title: "Research: Content Marketing Keywords",
    description: "Finding keyword opportunities in content marketing niche",
    status: "queued",
    progress: 0,
  },
  {
    id: "3",
    type: "optimize",
    title: "Optimize: Homepage Meta Tags",
    description: "Improving title and description for better CTR",
    status: "queued",
    progress: 0,
  },
  {
    id: "4",
    type: "content",
    title: "Generate: Link Building Guide",
    description: "Creating comprehensive guide on link building strategies",
    status: "completed",
    progress: 100,
    startedAt: "15 min ago",
    completedAt: "5 min ago",
    result: "3,200 words generated, SEO score: 94",
  },
  {
    id: "5",
    type: "audit",
    title: "Audit: Technical SEO Check",
    description: "Scanning site for technical issues",
    status: "completed",
    progress: 100,
    completedAt: "30 min ago",
    result: "Found 5 issues, 3 auto-fixed",
  },
];

// ============================================
// TASK TYPE CONFIG
// ============================================

const taskTypeConfig: Record<TaskType, { icon: React.ElementType; color: string }> = {
  content: { icon: FileText, color: "text-blue-500 bg-blue-500/10" },
  keyword: { icon: Search, color: "text-purple-500 bg-purple-500/10" },
  audit: { icon: AlertTriangle, color: "text-yellow-500 bg-yellow-500/10" },
  optimize: { icon: Zap, color: "text-orange-500 bg-orange-500/10" },
  publish: { icon: Globe, color: "text-green-500 bg-green-500/10" },
  analyze: { icon: Target, color: "text-pink-500 bg-pink-500/10" },
};

// ============================================
// STATUS BADGE
// ============================================

function StatusBadge({ status }: { status: TaskStatus }) {
  const config = {
    queued: { label: "Queued", color: "bg-gray-500/10 text-gray-500", icon: Clock },
    running: { label: "Running", color: "bg-blue-500/10 text-blue-500", icon: Loader2 },
    completed: { label: "Completed", color: "bg-green-500/10 text-green-500", icon: CheckCircle2 },
    failed: { label: "Failed", color: "bg-red-500/10 text-red-500", icon: AlertCircle },
    paused: { label: "Paused", color: "bg-yellow-500/10 text-yellow-500", icon: Pause },
  };

  const { label, color, icon: Icon } = config[status];

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
  const typeConfig = taskTypeConfig[task.type];
  const Icon = typeConfig.icon;

  return (
    <Card className={`transition-all ${task.status === "running" ? "ring-2 ring-primary/50" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${typeConfig.color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <h4 className="font-medium truncate">{task.title}</h4>
              <StatusBadge status={task.status} />
            </div>
            <p className="text-sm text-muted-foreground mb-2">{task.description}</p>

            {task.status === "running" && (
              <div className="space-y-1">
                <Progress value={task.progress} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{task.progress}% complete</span>
                  <span>Started {task.startedAt}</span>
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
            {(task.status === "queued" || task.status === "failed") && (
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
// MAIN PAGE
// ============================================

export default function AutopilotPage() {
  const searchParams = useSearchParams();
  const initialTask = searchParams.get("task");

  const [isRunning, setIsRunning] = useState(true);
  const [tasks, setTasks] = useState<AutopilotTask[]>(initialTasks);
  const [newTaskPrompt, setNewTaskPrompt] = useState(initialTask || "");
  const [settings, setSettings] = useState<AutopilotSettings>({
    autoPublish: false,
    notifyOnComplete: true,
    maxConcurrent: 2,
    pauseOnError: true,
  });

  // Stats
  const runningTasks = tasks.filter((t) => t.status === "running").length;
  const queuedTasks = tasks.filter((t) => t.status === "queued").length;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;

  // Simulate task progress
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTasks((prev) =>
        prev.map((task) => {
          if (task.status === "running" && task.progress < 100) {
            const newProgress = Math.min(task.progress + Math.random() * 5, 100);
            if (newProgress >= 100) {
              return {
                ...task,
                progress: 100,
                status: "completed" as TaskStatus,
                completedAt: "Just now",
                result: "Task completed successfully",
              };
            }
            return { ...task, progress: newProgress };
          }
          return task;
        })
      );

      // Start next queued task if available
      setTasks((prev) => {
        const running = prev.filter((t) => t.status === "running").length;
        if (running < settings.maxConcurrent) {
          const firstQueued = prev.findIndex((t) => t.status === "queued");
          if (firstQueued >= 0) {
            return prev.map((t, i) =>
              i === firstQueued
                ? { ...t, status: "running" as TaskStatus, startedAt: "Just now" }
                : t
            );
          }
        }
        return prev;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isRunning, settings.maxConcurrent]);

  const addTask = () => {
    if (!newTaskPrompt.trim()) return;

    const newTask: AutopilotTask = {
      id: Date.now().toString(),
      type: "content",
      title: `AI Task: ${newTaskPrompt.slice(0, 40)}...`,
      description: newTaskPrompt,
      status: "queued",
      progress: 0,
    };

    setTasks((prev) => [...prev, newTask]);
    setNewTaskPrompt("");
  };

  const removeTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const retryTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, status: "queued" as TaskStatus, progress: 0, error: undefined } : t
      )
    );
  };

  const clearCompleted = () => {
    setTasks((prev) => prev.filter((t) => t.status !== "completed"));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Bot className="w-8 h-8 text-primary" />
            </div>
            SEO Autopilot
          </h1>
          <p className="text-muted-foreground mt-1">
            AI-powered automation for your SEO tasks
          </p>
        </div>
        <div className="flex gap-3">
          {isRunning ? (
            <Button variant="outline" onClick={() => setIsRunning(false)}>
              <Pause className="w-4 h-4 mr-2" />
              Pause All
            </Button>
          ) : (
            <Button onClick={() => setIsRunning(true)}>
              <Play className="w-4 h-4 mr-2" />
              Resume
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Loader2 className={`w-5 h-5 text-blue-500 ${isRunning ? "animate-spin" : ""}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{runningTasks}</p>
                <p className="text-xs text-muted-foreground">Running</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-500/10">
                <Clock className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{queuedTasks}</p>
                <p className="text-xs text-muted-foreground">Queued</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedTasks}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{isRunning ? "Active" : "Paused"}</p>
                <p className="text-xs text-muted-foreground">Status</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Task Queue */}
        <div className="lg:col-span-2 space-y-4">
          {/* New Task Input */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Add New Task
              </CardTitle>
              <CardDescription>
                Describe what you want the AI to do
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Textarea
                  value={newTaskPrompt}
                  onChange={(e) => setNewTaskPrompt(e.target.value)}
                  placeholder="e.g., Generate an article about 'best SEO practices for e-commerce sites'"
                  className="min-h-[80px]"
                />
              </div>
              <div className="flex justify-end mt-3">
                <Button onClick={addTask} disabled={!newTaskPrompt.trim()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add to Queue
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Task List */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Task Queue</h2>
            {completedTasks > 0 && (
              <Button variant="ghost" size="sm" onClick={clearCompleted}>
                Clear Completed
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {tasks.length === 0 ? (
              <Card className="p-8 text-center">
                <div className="inline-flex items-center justify-center p-4 bg-muted rounded-full mb-4">
                  <Bot className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No tasks in queue</h3>
                <p className="text-muted-foreground">
                  Add a task above or use the command palette (⌘K)
                </p>
              </Card>
            ) : (
              tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onRemove={() => removeTask(task.id)}
                  onRetry={() => retryTask(task.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Settings Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Autopilot Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-publish">Auto-Publish</Label>
                  <p className="text-xs text-muted-foreground">
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
                  <Label htmlFor="notify">Notifications</Label>
                  <p className="text-xs text-muted-foreground">
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
                  <Label htmlFor="pause-error">Pause on Error</Label>
                  <p className="text-xs text-muted-foreground">
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
                <Label htmlFor="concurrent">Concurrent Tasks</Label>
                <Select
                  value={settings.maxConcurrent.toString()}
                  onValueChange={(v) =>
                    setSettings((s) => ({ ...s, maxConcurrent: parseInt(v) }))
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 task at a time</SelectItem>
                    <SelectItem value="2">2 tasks at a time</SelectItem>
                    <SelectItem value="3">3 tasks at a time</SelectItem>
                    <SelectItem value="5">5 tasks at a time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Add</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() =>
                  setNewTaskPrompt("Generate a comprehensive article about SEO best practices")
                }
              >
                <FileText className="w-4 h-4 mr-2" />
                Generate Article
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() =>
                  setNewTaskPrompt("Research keywords for content marketing")
                }
              >
                <Search className="w-4 h-4 mr-2" />
                Research Keywords
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() =>
                  setNewTaskPrompt("Run a complete site audit")
                }
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Run Site Audit
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() =>
                  setNewTaskPrompt("Optimize all pages for better rankings")
                }
              >
                <Zap className="w-4 h-4 mr-2" />
                Optimize Pages
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
