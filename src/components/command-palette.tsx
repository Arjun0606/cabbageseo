"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  FileText,
  Target,
  AlertTriangle,
  Settings,
  Sparkles,
  Zap,
  Globe,
  PlusCircle,
  ArrowRight,
  RefreshCw,
  Download,
  Loader2,
  Command,
  Brain,
  CheckCircle2,
  XCircle,
  Copy,
  ExternalLink,
  TrendingUp,
  Lightbulb,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSite } from "@/contexts/app-context";

// ============================================
// TYPES
// ============================================

type CommandCategory = "navigation" | "actions" | "ai" | "sites";
type InputMode = "search" | "url" | "ai";
type ResultType = "progress" | "score" | "issue" | "content" | "success" | "error";

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

interface StreamingResult {
  type: ResultType;
  message: string;
  data?: Record<string, unknown>;
  timestamp: number;
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ============================================
// STREAMING RESULT COMPONENT
// ============================================

function StreamingResultItem({ result, onClick }: { result: StreamingResult; onClick?: () => void }) {
  const icons: Record<ResultType, React.ElementType> = {
    progress: Loader2,
    score: TrendingUp,
    issue: AlertTriangle,
    content: Lightbulb,
    success: CheckCircle2,
    error: XCircle,
  };

  const Icon = icons[result.type];
  const isClickable = result.type === "success" || result.type === "content";

  return (
    <div
      onClick={isClickable ? onClick : undefined}
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg transition-all",
        result.type === "progress" && "bg-muted/30",
        result.type === "score" && "bg-blue-500/10",
        result.type === "issue" && "bg-yellow-500/10",
        result.type === "content" && "bg-primary/10 cursor-pointer hover:bg-primary/20",
        result.type === "success" && "bg-emerald-500/10 cursor-pointer hover:bg-emerald-500/20",
        result.type === "error" && "bg-red-500/10",
      )}
    >
      <Icon className={cn(
        "w-4 h-4 mt-0.5 flex-shrink-0",
        result.type === "progress" && "animate-spin text-muted-foreground",
        result.type === "score" && "text-blue-500",
        result.type === "issue" && "text-yellow-500",
        result.type === "content" && "text-primary",
        result.type === "success" && "text-emerald-500",
        result.type === "error" && "text-red-500",
      )} />
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm",
          result.type === "success" && "font-medium text-emerald-400",
          result.type === "content" && "font-medium",
        )}>
          {result.message}
        </p>
        {result.data?.subtitle ? (
          <p className="text-xs text-muted-foreground mt-0.5">{String(result.data.subtitle)}</p>
        ) : null}
      </div>
      {isClickable && <ArrowRight className="w-4 h-4 text-muted-foreground mt-0.5" />}
    </div>
  );
}

// ============================================
// COMMAND PALETTE COMPONENT
// ============================================

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const { selectedSite, sites, selectSite, refreshSites } = useSite();
  
  const [search, setSearch] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [inputMode, setInputMode] = React.useState<InputMode>("search");
  const [streamingResults, setStreamingResults] = React.useState<StreamingResult[]>([]);
  const [showResults, setShowResults] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const resultsRef = React.useRef<HTMLDivElement>(null);

  // Detect input mode based on content
  React.useEffect(() => {
    const value = search.trim().toLowerCase();
    
    if (value.includes(".") && (value.includes("http") || !value.includes(" ") || value.match(/\.[a-z]{2,}/))) {
      setInputMode("url");
    } else if (value.length > 20) {
      setInputMode("ai");
    } else {
      setInputMode("search");
    }
  }, [search]);

  // Auto-scroll results
  React.useEffect(() => {
    if (resultsRef.current) {
      resultsRef.current.scrollTop = resultsRef.current.scrollHeight;
    }
  }, [streamingResults]);

  // Add streaming result
  const addResult = React.useCallback((type: ResultType, message: string, data?: Record<string, unknown>) => {
    setStreamingResults(prev => [...prev, { type, message, data, timestamp: Date.now() }]);
  }, []);

  // Analyze URL with streaming results
  const analyzeUrl = async (url: string) => {
    setIsProcessing(true);
    setShowResults(true);
    setStreamingResults([]);

    try {
      // Clean URL
      let cleanUrl = url.trim();
      if (!cleanUrl.startsWith("http")) {
        cleanUrl = `https://${cleanUrl}`;
      }
      const domain = new URL(cleanUrl).hostname.replace("www.", "");

      addResult("progress", `Connecting to ${domain}...`);
      await new Promise(r => setTimeout(r, 300));

      addResult("progress", "Crawling pages and analyzing structure...");

      const response = await fetch("/api/onboarding/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: domain }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Analysis failed");
      }
      
      const data = await response.json();

      if (data.data) {
        const analysis = data.data;

        // SEO Score
        addResult("score", `SEO Score: ${analysis.seoScore}/100`, {
          subtitle: analysis.seoScore >= 70 ? "Good foundation!" : "Room for improvement",
        });

        // GEO Score
        addResult("score", `GEO Score: ${analysis.aioScore}/100`, {
          subtitle: analysis.aioScore >= 70 ? "AI-friendly content!" : "Optimize for generative engines",
        });

        // Issues
        if (analysis.issues) {
          const total = analysis.issues.critical + analysis.issues.warnings;
          if (total > 0) {
            addResult("issue", `Found ${analysis.issues.critical} critical issues & ${analysis.issues.warnings} warnings`, {
              subtitle: "Click to view and fix",
            });
          }
        }

        // Quick wins
        if (analysis.quickWins?.length > 0) {
          analysis.quickWins.slice(0, 3).forEach((win: { title: string; impact: string }) => {
            addResult("content", win.title, { subtitle: `Impact: ${win.impact}` });
          });
        }

        // Success
        addResult("success", `Analysis complete for ${domain}`, {
          subtitle: "Click to view full report →",
          siteId: analysis.siteId,
        });

        // Refresh sites list and select the newly analyzed site
        await refreshSites();
        if (analysis.siteId) {
          selectSite(analysis.siteId);
        }
      }
    } catch (error) {
      addResult("error", error instanceof Error ? error.message : "Analysis failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Generate content ideas
  const generateIdeas = async (topic: string) => {
    setIsProcessing(true);
    setShowResults(true);
    setStreamingResults([]);

    try {
      addResult("progress", `Researching "${topic}"...`);

      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "ideas",
          topic,
          options: { count: 5 },
        }),
      });

      if (!response.ok) throw new Error("Generation failed");
      const data = await response.json();

      addResult("progress", "Generating content ideas...");
      await new Promise(r => setTimeout(r, 300));

      if (data.data) {
        const ideas = Array.isArray(data.data) ? data.data : data.data.ideas || [];
        
        ideas.slice(0, 5).forEach((idea: { title: string; keyword?: string }) => {
          addResult("content", idea.title, {
            subtitle: "Click to generate full article",
            keyword: idea.keyword || topic,
          });
        });

        addResult("success", `${ideas.length} content ideas generated`, {
          subtitle: "Click any idea to create article",
        });
      }
    } catch (error) {
      addResult("error", error instanceof Error ? error.message : "Failed to generate ideas");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle result click
  const handleResultClick = (result: StreamingResult) => {
    if (result.type === "success" && result.data?.siteId) {
      router.push(`/sites/${result.data.siteId}/strategy`);
      onOpenChange(false);
    } else if (result.type === "content" && result.data?.keyword) {
      router.push(`/content/new?keyword=${encodeURIComponent(String(result.data.keyword))}`);
      onOpenChange(false);
    } else if (result.type === "issue") {
      router.push("/audit");
      onOpenChange(false);
    }
  };

  // Handle submit
  const handleSubmit = async () => {
    const value = search.trim();
    if (!value || isProcessing) return;

    if (inputMode === "url") {
      await analyzeUrl(value);
    } else if (inputMode === "ai" || (inputMode === "search" && value.length > 3)) {
      await generateIdeas(value);
    }
  };

  // Command definitions
  const commands: CommandItem[] = React.useMemo(
    () => [
      // Quick Actions (most important - money path)
      {
        id: "action-analyze",
        title: "Analyze Website",
        description: "Paste any URL for instant SEO + AI visibility analysis",
        icon: Globe,
        category: "actions",
        action: () => {
          setSearch("https://");
          inputRef.current?.focus();
        },
        keywords: ["url", "scan", "check", "audit"],
      },
      {
        id: "action-generate",
        title: "Generate Content",
        description: "Create SEO-optimized articles that rank",
        icon: Sparkles,
        category: "actions",
        shortcut: "G",
        action: () => router.push("/content/new"),
        keywords: ["write", "article", "blog", "post"],
      },
      {
        id: "action-audit",
        title: "Run SEO Audit",
        description: selectedSite ? `Audit ${selectedSite.domain}` : "Find and fix SEO issues",
        icon: AlertTriangle,
        category: "actions",
        action: () => router.push("/audit"),
        keywords: ["issues", "problems", "fix", "scan"],
      },
      {
        id: "action-keywords",
        title: "Research Keywords",
        description: "Find low-competition keywords to target",
        icon: Target,
        category: "actions",
        shortcut: "K",
        action: () => router.push("/keywords"),
        keywords: ["research", "seo", "rank"],
      },
      {
        id: "action-geo",
        title: "Check GEO Score",
        description: "See how AI assistants see your site",
        icon: Brain,
        category: "actions",
        action: () => router.push("/geo"),
        keywords: ["chatgpt", "perplexity", "claude", "ai"],
      },
      {
        id: "action-export",
        title: "Export for Cursor/Claude",
        description: "Get improvements as markdown for AI coding",
        icon: Download,
        category: "actions",
        action: () => {
          if (selectedSite) {
            router.push(`/sites/${selectedSite.id}/strategy`);
          } else {
            router.push("/sites");
          }
        },
        keywords: ["download", "markdown", "cursor", "claude"],
      },

      // Navigation
      {
        id: "nav-dashboard",
        title: "Dashboard",
        description: "Overview of all your sites",
        icon: TrendingUp,
        category: "navigation",
        shortcut: "D",
        action: () => router.push("/dashboard"),
        keywords: ["home", "main"],
      },
      {
        id: "nav-content",
        title: "Content Library",
        description: "Manage your articles",
        icon: FileText,
        category: "navigation",
        shortcut: "C",
        action: () => router.push("/content"),
        keywords: ["articles", "posts"],
      },
      {
        id: "nav-settings",
        title: "Settings",
        description: "Billing, integrations, account",
        icon: Settings,
        category: "navigation",
        shortcut: "S",
        action: () => router.push("/settings"),
        keywords: ["billing", "account", "integrations"],
      },
    ],
    [router, selectedSite]
  );

  // Site switcher commands
  const siteCommands: CommandItem[] = React.useMemo(() => 
    sites.map(site => ({
      id: `site-${site.id}`,
      title: site.domain,
      description: selectedSite?.id === site.id ? "Currently selected" : "Switch to this site",
        icon: Globe,
      category: "sites" as const,
      action: () => {
        selectSite(site.id);
        onOpenChange(false);
      },
      keywords: [site.domain],
    })),
    [sites, selectedSite, selectSite, onOpenChange]
  );

  // Filter commands
  const filteredCommands = React.useMemo(() => {
    if (!search.trim() || showResults) return commands;

    const query = search.toLowerCase();
    return commands.filter((cmd) => {
      const titleMatch = cmd.title.toLowerCase().includes(query);
      const descMatch = cmd.description?.toLowerCase().includes(query);
      const keywordMatch = cmd.keywords?.some((k) => k.includes(query));
      return titleMatch || descMatch || keywordMatch;
    });
  }, [commands, search, showResults]);

  // Group commands
  const groupedCommands = React.useMemo(() => {
    const groups: Record<CommandCategory, CommandItem[]> = {
      actions: [],
      navigation: [],
      ai: [],
      sites: [],
    };

    filteredCommands.forEach((cmd) => {
      groups[cmd.category].push(cmd);
    });

    // Add site commands
    if (!showResults) {
      groups.sites = siteCommands.filter(cmd => 
        !search.trim() || cmd.title.toLowerCase().includes(search.toLowerCase())
      );
    }

    return groups;
  }, [filteredCommands, siteCommands, search, showResults]);

  // Flat list for keyboard navigation
  const flatList = React.useMemo(() => {
    return [
      ...groupedCommands.actions,
      ...groupedCommands.navigation,
      ...groupedCommands.sites,
    ];
  }, [groupedCommands]);

  // Reset state
  React.useEffect(() => {
    if (open) {
      setSearch("");
      setSelectedIndex(0);
      setShowResults(false);
      setStreamingResults([]);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  React.useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showResults && e.key === "Escape") {
      setShowResults(false);
      setStreamingResults([]);
      setSearch("");
      return;
    }

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
        if (inputMode === "url" || inputMode === "ai") {
          handleSubmit();
        } else if (flatList[selectedIndex]) {
          executeCommand(flatList[selectedIndex]);
        }
        break;
      case "Escape":
          onOpenChange(false);
        break;
    }
  };

  const executeCommand = async (command: CommandItem) => {
      await command.action();
    if (!command.id.includes("analyze")) {
      onOpenChange(false);
    }
  };

  const categoryLabels: Record<CommandCategory, string> = {
    actions: "Quick Actions",
    navigation: "Navigation",
    ai: "AI Commands",
    sites: "Your Sites",
  };

  let currentIndex = 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        <DialogTitle className="sr-only">Command Palette</DialogTitle>
        
        {/* Search Input */}
        <div className="flex items-center border-b px-4">
          {inputMode === "url" ? (
            <Globe className="w-5 h-5 text-primary mr-3 flex-shrink-0" />
          ) : inputMode === "ai" ? (
            <Sparkles className="w-5 h-5 text-primary mr-3 flex-shrink-0" />
          ) : (
            <Search className="w-5 h-5 text-muted-foreground mr-3 flex-shrink-0" />
          )}
          <Input
            ref={inputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              showResults 
                ? "Press Esc to go back..." 
                : "Paste URL, enter keyword, or search commands..."
            }
            className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-14 text-base"
            disabled={isProcessing}
          />
          {search && !showResults && (
            <Badge variant="secondary" className="ml-2 flex-shrink-0">
              {inputMode === "url" && "URL → Enter to analyze"}
              {inputMode === "ai" && "Topic → Enter for ideas"}
              {inputMode === "search" && "Search"}
            </Badge>
          )}
          {isProcessing && <Loader2 className="w-5 h-5 animate-spin text-primary ml-2" />}
        </div>

        {/* Streaming Results */}
        {showResults && (
          <div ref={resultsRef} className="max-h-[400px] overflow-y-auto p-3 space-y-2">
            {streamingResults.map((result, i) => (
              <StreamingResultItem 
                key={i} 
                result={result} 
                onClick={() => handleResultClick(result)}
              />
            ))}
            
            {!isProcessing && streamingResults.length > 0 && (
              <div className="flex justify-center gap-2 pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowResults(false);
                    setStreamingResults([]);
                    setSearch("");
                  }}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  New Search
                </Button>
                {streamingResults.some(r => r.type === "success" && r.data?.siteId) && (
                  <Button
                    size="sm"
                    onClick={() => {
                      const successResult = streamingResults.find(r => r.type === "success" && r.data?.siteId);
                      if (successResult?.data?.siteId) {
                        router.push(`/sites/${successResult.data.siteId}/strategy`);
                        onOpenChange(false);
                      }
                    }}
                  >
                    View Full Report
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Command List */}
        {!showResults && (
        <div className="max-h-[400px] overflow-y-auto py-2">
            {flatList.length === 0 && search && (
            <div className="py-8 text-center text-muted-foreground">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No commands found</p>
                <p className="text-xs mt-1">Press Enter to search for &ldquo;{search}&rdquo;</p>
            </div>
          )}

            {(Object.entries(groupedCommands) as [CommandCategory, CommandItem[]][]).map(
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
                              "p-1.5 rounded-md flex-shrink-0",
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
                            <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border text-muted-foreground flex-shrink-0">
                              ⌘{command.shortcut}
                                </kbd>
                          )}
                          {selectedSite?.id && command.id === `site-${selectedSite.id}` && (
                            <Badge variant="secondary" className="text-xs flex-shrink-0">Current</Badge>
                          )}
                          {isSelected && (
                            <ArrowRight className="w-4 h-4 text-primary flex-shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              }
            )}
            </div>
          )}

        {/* Footer */}
        <div className="border-t px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-muted rounded border">↵</kbd>
              {inputMode === "url" ? "analyze" : inputMode === "ai" ? "search" : "select"}
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-muted rounded border">esc</kbd>
              {showResults ? "back" : "close"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {selectedSite && (
              <span className="flex items-center gap-1">
                <Globe className="w-3 h-3" />
                {selectedSite.domain}
              </span>
            )}
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
      <span className="hidden sm:inline">Paste URL or search...</span>
      <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-background rounded border text-xs">
        <Command className="w-3 h-3" />K
      </kbd>
    </button>
  );
}
