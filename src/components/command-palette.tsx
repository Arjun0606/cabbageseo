"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  FileText,
  Target,
  BarChart3,
  AlertTriangle,
  Settings,
  Sparkles,
  Zap,
  Globe,
  PlusCircle,
  ArrowRight,
  RefreshCw,
  Download,
  Upload,
  Loader2,
  Command,
  Keyboard,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ============================================
// TYPES
// ============================================

type CommandCategory = "navigation" | "actions" | "ai" | "settings";

interface CommandItem {
  id: string;
  title: string;
  description?: string;
  icon: React.ElementType;
  category: CommandCategory;
  shortcut?: string;
  action: () => void | Promise<void>;
  keywords?: string[];
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ============================================
// COMMAND PALETTE COMPONENT
// ============================================

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [isExecuting, setIsExecuting] = React.useState(false);
  const [aiMode, setAiMode] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Command definitions
  const commands: CommandItem[] = React.useMemo(
    () => [
      // Navigation
      {
        id: "nav-dashboard",
        title: "Go to Dashboard",
        description: "Mission control overview",
        icon: BarChart3,
        category: "navigation",
        shortcut: "G D",
        action: () => router.push("/dashboard"),
        keywords: ["home", "main", "overview"],
      },
      {
        id: "nav-keywords",
        title: "Go to Keywords",
        description: "Research and track keywords",
        icon: Target,
        category: "navigation",
        shortcut: "G K",
        action: () => router.push("/keywords"),
        keywords: ["research", "seo", "rank"],
      },
      {
        id: "nav-content",
        title: "Go to Content",
        description: "Manage your articles",
        icon: FileText,
        category: "navigation",
        shortcut: "G C",
        action: () => router.push("/content"),
        keywords: ["articles", "blog", "posts"],
      },
      {
        id: "nav-audit",
        title: "Go to Audit",
        description: "Technical SEO issues",
        icon: AlertTriangle,
        category: "navigation",
        shortcut: "G A",
        action: () => router.push("/audit"),
        keywords: ["issues", "problems", "fix"],
      },
      {
        id: "nav-analytics",
        title: "Go to Analytics",
        description: "Performance metrics",
        icon: BarChart3,
        category: "navigation",
        shortcut: "G N",
        action: () => router.push("/analytics"),
        keywords: ["stats", "traffic", "gsc"],
      },
      {
        id: "nav-settings",
        title: "Go to Settings",
        description: "App configuration",
        icon: Settings,
        category: "navigation",
        shortcut: "G S",
        action: () => router.push("/settings"),
        keywords: ["config", "preferences"],
      },

      // Actions
      {
        id: "action-new-content",
        title: "Create New Content",
        description: "Start writing a new article",
        icon: PlusCircle,
        category: "actions",
        shortcut: "N",
        action: () => router.push("/content/new"),
        keywords: ["write", "article", "post"],
      },
      {
        id: "action-research",
        title: "Research Keywords",
        description: "Find new keyword opportunities",
        icon: Search,
        category: "actions",
        action: () => router.push("/keywords?tab=research"),
        keywords: ["find", "discover"],
      },
      {
        id: "action-audit",
        title: "Run Site Audit",
        description: "Scan for SEO issues",
        icon: RefreshCw,
        category: "actions",
        action: () => router.push("/audit?scan=true"),
        keywords: ["scan", "check"],
      },
      {
        id: "action-export",
        title: "Export Data",
        description: "Download reports and data",
        icon: Download,
        category: "actions",
        action: () => console.log("Export data"),
        keywords: ["download", "csv"],
      },

      // AI Actions
      {
        id: "ai-generate",
        title: "AI: Generate Content",
        description: "Create SEO-optimized article",
        icon: Sparkles,
        category: "ai",
        action: () => {
          setAiMode(true);
          setSearch("Generate an article about ");
        },
        keywords: ["write", "create", "article"],
      },
      {
        id: "ai-optimize",
        title: "AI: Optimize Page",
        description: "Improve existing content",
        icon: Zap,
        category: "ai",
        action: () => {
          setAiMode(true);
          setSearch("Optimize the page ");
        },
        keywords: ["improve", "enhance"],
      },
      {
        id: "ai-analyze",
        title: "AI: Analyze Competitor",
        description: "Get insights from competitors",
        icon: Globe,
        category: "ai",
        action: () => {
          setAiMode(true);
          setSearch("Analyze competitor ");
        },
        keywords: ["competition", "compare"],
      },
      {
        id: "ai-ideas",
        title: "AI: Content Ideas",
        description: "Get topic suggestions",
        icon: Sparkles,
        category: "ai",
        action: () => {
          setAiMode(true);
          setSearch("Suggest content ideas for ");
        },
        keywords: ["topics", "suggestions"],
      },

      // Settings
      {
        id: "settings-integrations",
        title: "Manage Integrations",
        description: "Connect CMS and analytics",
        icon: Globe,
        category: "settings",
        action: () => router.push("/settings/integrations"),
        keywords: ["connect", "api"],
      },
      {
        id: "settings-billing",
        title: "Billing & Usage",
        description: "View plan and usage",
        icon: BarChart3,
        category: "settings",
        action: () => router.push("/settings/billing"),
        keywords: ["plan", "subscription"],
      },
    ],
    [router]
  );

  // Filter commands based on search
  const filteredCommands = React.useMemo(() => {
    if (!search.trim()) return commands;

    const query = search.toLowerCase();
    return commands.filter((cmd) => {
      const titleMatch = cmd.title.toLowerCase().includes(query);
      const descMatch = cmd.description?.toLowerCase().includes(query);
      const keywordMatch = cmd.keywords?.some((k) => k.includes(query));
      return titleMatch || descMatch || keywordMatch;
    });
  }, [commands, search]);

  // Group commands by category
  const groupedCommands = React.useMemo(() => {
    const groups: Record<CommandCategory, CommandItem[]> = {
      ai: [],
      actions: [],
      navigation: [],
      settings: [],
    };

    filteredCommands.forEach((cmd) => {
      groups[cmd.category].push(cmd);
    });

    return groups;
  }, [filteredCommands]);

  // Calculate flat list for keyboard navigation
  const flatList = React.useMemo(() => {
    return [
      ...groupedCommands.ai,
      ...groupedCommands.actions,
      ...groupedCommands.navigation,
      ...groupedCommands.settings,
    ];
  }, [groupedCommands]);

  // Reset state when opening
  React.useEffect(() => {
    if (open) {
      setSearch("");
      setSelectedIndex(0);
      setAiMode(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  // Update selected index when results change
  React.useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, flatList.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (aiMode && search.trim()) {
          executeAiCommand(search);
        } else if (flatList[selectedIndex]) {
          executeCommand(flatList[selectedIndex]);
        }
        break;
      case "Escape":
        if (aiMode) {
          setAiMode(false);
          setSearch("");
        } else {
          onOpenChange(false);
        }
        break;
    }
  };

  const executeCommand = async (command: CommandItem) => {
    setIsExecuting(true);
    try {
      await command.action();
      onOpenChange(false);
    } finally {
      setIsExecuting(false);
    }
  };

  const executeAiCommand = async (prompt: string) => {
    setIsExecuting(true);
    // In production, this would call the AI API
    console.log("Executing AI command:", prompt);
    await new Promise((r) => setTimeout(r, 500));
    setIsExecuting(false);
    onOpenChange(false);
    // Navigate to autopilot with the task
    router.push(`/autopilot?task=${encodeURIComponent(prompt)}`);
  };

  const categoryLabels: Record<CommandCategory, string> = {
    ai: "AI Commands",
    actions: "Quick Actions",
    navigation: "Navigation",
    settings: "Settings",
  };

  let currentIndex = 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        <DialogTitle className="sr-only">Command Palette</DialogTitle>
        
        {/* Search Input */}
        <div className="flex items-center border-b px-4">
          {aiMode ? (
            <Sparkles className="w-5 h-5 text-primary mr-3" />
          ) : (
            <Search className="w-5 h-5 text-muted-foreground mr-3" />
          )}
          <Input
            ref={inputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={aiMode ? "Ask AI anything about SEO..." : "Type a command or search..."}
            className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-14 text-base"
          />
          {isExecuting && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
        </div>

        {/* AI Mode Banner */}
        {aiMode && (
          <div className="px-4 py-2 bg-primary/10 border-b flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">AI Mode Active</span>
            <span className="text-xs text-muted-foreground">- Press Enter to execute, Esc to exit</span>
          </div>
        )}

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto py-2">
          {!aiMode && flatList.length === 0 && (
            <div className="py-8 text-center text-muted-foreground">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No commands found</p>
            </div>
          )}

          {!aiMode &&
            (Object.entries(groupedCommands) as [CommandCategory, CommandItem[]][]).map(
              ([category, items]) => {
                if (items.length === 0) return null;

                return (
                  <div key={category} className="mb-2">
                    <div className="px-4 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {categoryLabels[category]}
                    </div>
                    {items.map((command) => {
                      const index = currentIndex++;
                      const isSelected = index === selectedIndex;
                      const Icon = command.icon;

                      return (
                        <button
                          key={command.id}
                          onClick={() => executeCommand(command)}
                          onMouseEnter={() => setSelectedIndex(index)}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                            isSelected ? "bg-primary/10" : "hover:bg-muted/50"
                          )}
                        >
                          <div
                            className={cn(
                              "p-1.5 rounded-md",
                              isSelected
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{command.title}</p>
                            {command.description && (
                              <p className="text-xs text-muted-foreground truncate">
                                {command.description}
                              </p>
                            )}
                          </div>
                          {command.shortcut && (
                            <div className="flex gap-1">
                              {command.shortcut.split(" ").map((key, i) => (
                                <kbd
                                  key={i}
                                  className="px-1.5 py-0.5 text-xs bg-muted rounded border text-muted-foreground"
                                >
                                  {key}
                                </kbd>
                              ))}
                            </div>
                          )}
                          {isSelected && (
                            <ArrowRight className="w-4 h-4 text-primary" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              }
            )}

          {aiMode && search.length > 10 && (
            <div className="px-4 py-6 text-center">
              <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-full mb-3">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <p className="font-medium mb-1">Ready to execute</p>
              <p className="text-sm text-muted-foreground mb-4">
                Press Enter to run this AI command
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
                <kbd className="px-2 py-1 bg-background rounded border text-sm">↵</kbd>
                <span className="text-sm text-muted-foreground">to execute</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-muted rounded border">↑↓</kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-muted rounded border">↵</kbd>
              select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-muted rounded border">esc</kbd>
              close
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            <span>Type to ask AI</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// KEYBOARD SHORTCUT HOOK
// ============================================

export function useCommandPalette() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return { open, setOpen };
}

// ============================================
// COMMAND TRIGGER BUTTON
// ============================================

export function CommandTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground bg-muted/50 hover:bg-muted rounded-lg border transition-colors"
    >
      <Search className="w-4 h-4" />
      <span className="hidden sm:inline">Search or command...</span>
      <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-background rounded border text-xs">
        <Command className="w-3 h-3" />K
      </kbd>
    </button>
  );
}

