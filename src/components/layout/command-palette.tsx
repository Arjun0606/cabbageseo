"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  Globe,
  Search,
  FileText,
  Link2,
  Gauge,
  BarChart3,
  Settings,
  Sparkles,
  Target,
  Bot,
  PlusCircle,
  RefreshCw,
  Wand2,
  FileEdit,
  Lightbulb,
  AlertCircle,
  ArrowUpRight,
  Loader2,
  Send,
  CheckCircle,
} from "lucide-react";

// ============================================
// TYPES
// ============================================

interface CommandResult {
  type: "navigation" | "action" | "ai";
  title: string;
  description?: string;
  status: "pending" | "running" | "success" | "error";
  result?: string;
}

// ============================================
// COMMAND ITEMS
// ============================================

const navigationItems = [
  { icon: LayoutDashboard, label: "Go to Dashboard", href: "/dashboard", shortcut: "⌘D" },
  { icon: Globe, label: "Go to Sites", href: "/sites", shortcut: "⌘S" },
  { icon: Bot, label: "Go to Autopilot", href: "/autopilot" },
  { icon: Search, label: "Go to Keywords", href: "/keywords", shortcut: "⌘K" },
  { icon: FileText, label: "Go to Content", href: "/content", shortcut: "⌘C" },
  { icon: Link2, label: "Go to Internal Links", href: "/links" },
  { icon: Gauge, label: "Go to Technical Audit", href: "/audit" },
  { icon: BarChart3, label: "Go to Analytics", href: "/analytics" },
  { icon: Settings, label: "Go to Settings", href: "/settings", shortcut: "⌘," },
];

const aiActions = [
  { 
    icon: Wand2, 
    label: "Generate content ideas", 
    action: "generate-ideas",
    description: "AI generates 10 content ideas for your site",
    keywords: ["ideas", "topics", "content", "suggest", "generate"],
  },
  { 
    icon: FileEdit, 
    label: "Write an article", 
    action: "write-article",
    description: "AI writes a full SEO-optimized article",
    keywords: ["write", "article", "blog", "post", "create content"],
  },
  { 
    icon: Sparkles, 
    label: "Optimize a page", 
    action: "optimize-page",
    description: "AI analyzes and suggests improvements",
    keywords: ["optimize", "improve", "seo", "fix", "enhance"],
  },
  { 
    icon: Link2, 
    label: "Find internal linking opportunities", 
    action: "internal-links",
    description: "AI finds pages to link together",
    keywords: ["link", "internal", "connect", "linking"],
  },
  { 
    icon: AlertCircle, 
    label: "Fix SEO issues", 
    action: "fix-issues",
    description: "Auto-fix common SEO problems",
    keywords: ["fix", "issues", "problems", "errors", "audit"],
  },
  { 
    icon: Target, 
    label: "Analyze competitors", 
    action: "analyze-competitors",
    description: "AI analyzes your competitors' SEO",
    keywords: ["competitor", "analyze", "compare", "competition"],
  },
  {
    icon: Search,
    label: "Research keywords",
    action: "research-keywords",
    description: "Find keyword opportunities",
    keywords: ["keyword", "research", "find", "discover", "seo"],
  },
];

const quickActions = [
  { icon: PlusCircle, label: "Add new site", action: "add-site", keywords: ["add", "new", "site", "website"] },
  { icon: RefreshCw, label: "Run site crawl", action: "run-crawl", keywords: ["crawl", "scan", "refresh"] },
  { icon: Lightbulb, label: "Get SEO recommendations", action: "get-recommendations", keywords: ["recommend", "suggest", "tips"] },
  { icon: ArrowUpRight, label: "Check rankings", action: "check-rankings", keywords: ["rank", "position", "serp"] },
];

// ============================================
// AI QUERY PATTERNS
// ============================================

const aiPatterns = [
  {
    pattern: /^(generate|create|suggest|give me).*(idea|topic|content)/i,
    action: "generate-ideas",
    response: "Generating content ideas..."
  },
  {
    pattern: /^(write|create).*(article|blog|post|content)/i,
    action: "write-article",
    response: "Starting content generation..."
  },
  {
    pattern: /^(optimize|improve|enhance|fix).*(page|content|seo)/i,
    action: "optimize-page",
    response: "Analyzing for optimization..."
  },
  {
    pattern: /^(find|suggest|add).*(internal|link)/i,
    action: "internal-links",
    response: "Finding linking opportunities..."
  },
  {
    pattern: /^(fix|resolve|address).*(issue|error|problem)/i,
    action: "fix-issues",
    response: "Scanning for issues to fix..."
  },
  {
    pattern: /^(analyze|check|compare).*(competitor|competition)/i,
    action: "analyze-competitors",
    response: "Analyzing competitor SEO..."
  },
  {
    pattern: /^(research|find|discover).*(keyword)/i,
    action: "research-keywords",
    response: "Researching keywords..."
  },
  {
    pattern: /^(crawl|scan|audit).*(site|website)/i,
    action: "run-crawl",
    response: "Starting site crawl..."
  },
];

// ============================================
// COMMAND PALETTE COMPONENT
// ============================================

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [inputValue, setInputValue] = React.useState("");
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [commandResult, setCommandResult] = React.useState<CommandResult | null>(null);

  // Handle keyboard shortcut
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  // Reset state when dialog closes
  React.useEffect(() => {
    if (!open) {
      setInputValue("");
      setCommandResult(null);
      setIsProcessing(false);
    }
  }, [open]);

  const handleNavigation = (href: string) => {
    router.push(href);
    onOpenChange(false);
    setInputValue("");
  };

  const handleAction = async (action: string) => {
    // Handle different actions
    switch (action) {
      case "add-site":
        router.push("/sites/new");
        break;
      case "generate-ideas":
        router.push("/content?action=generate-ideas");
        break;
      case "write-article":
        router.push("/content/new");
        break;
      case "optimize-page":
        router.push("/audit?tab=optimize");
        break;
      case "internal-links":
        router.push("/links?action=analyze");
        break;
      case "fix-issues":
        router.push("/audit?action=fix");
        break;
      case "analyze-competitors":
        router.push("/keywords?tab=competitors");
        break;
      case "run-crawl":
        router.push("/sites?action=crawl");
        break;
      case "research-keywords":
        router.push("/keywords?tab=research");
        break;
      case "get-recommendations":
        router.push("/dashboard?panel=recommendations");
        break;
      case "check-rankings":
        router.push("/analytics?tab=rankings");
        break;
      default:
        console.log("Unknown action:", action);
    }
    onOpenChange(false);
    setInputValue("");
  };

  // Handle AI queries
  const handleAIQuery = async () => {
    if (!inputValue.trim()) return;

    setIsProcessing(true);
    setCommandResult({
      type: "ai",
      title: inputValue,
      status: "running",
      description: "Processing your request...",
    });

    try {
      // Call the AI query API
      const response = await fetch("/api/ai/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: inputValue }),
      });

      if (!response.ok) {
        throw new Error("Failed to process query");
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        const result = data.data;
        
        setCommandResult({
          type: "ai",
          title: inputValue,
          status: "success",
          description: result.response || "Processing complete",
        });

        // If there's an action/route, navigate after a short delay
        if (result.route) {
          setTimeout(() => {
            router.push(result.route);
            onOpenChange(false);
            setInputValue("");
          }, 800);
        } else if (result.action) {
          setTimeout(() => {
            handleAction(result.action);
          }, 800);
        } else {
          setIsProcessing(false);
        }
      } else {
        throw new Error(data.error || "Unknown error");
      }
    } catch (error) {
      setCommandResult({
        type: "ai",
        title: inputValue,
        status: "error",
        description: error instanceof Error ? error.message : "Failed to process query. Please try again.",
      });
      setIsProcessing(false);
    }
  };

  // Handle enter key for AI queries
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && isAiQuery && !isProcessing) {
      e.preventDefault();
      handleAIQuery();
    }
  };

  // Check if input looks like an AI query
  const isAiQuery = inputValue.length > 5 || inputValue.includes("?");
  
  // Filter actions based on input
  const filteredAiActions = inputValue
    ? aiActions.filter(action => 
        action.label.toLowerCase().includes(inputValue.toLowerCase()) ||
        action.keywords.some(k => inputValue.toLowerCase().includes(k))
      )
    : aiActions;

  const filteredQuickActions = inputValue
    ? quickActions.filter(action =>
        action.label.toLowerCase().includes(inputValue.toLowerCase()) ||
        action.keywords.some(k => inputValue.toLowerCase().includes(k))
      )
    : quickActions;

  const filteredNavItems = inputValue
    ? navigationItems.filter(item =>
        item.label.toLowerCase().includes(inputValue.toLowerCase())
      )
    : navigationItems;

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Type a command, search, or ask AI..."
        value={inputValue}
        onValueChange={setInputValue}
        onKeyDown={handleKeyDown}
      />
      <CommandList className="max-h-[400px]">
        {/* Processing State */}
        {commandResult && (
          <div className="p-4 border-b">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${
                commandResult.status === "success" ? "bg-green-500/10" :
                commandResult.status === "error" ? "bg-red-500/10" :
                "bg-primary/10"
              }`}>
                {commandResult.status === "running" ? (
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                ) : commandResult.status === "success" ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{commandResult.title}</p>
                <p className="text-xs text-muted-foreground">{commandResult.description}</p>
              </div>
            </div>
          </div>
        )}

        <CommandEmpty>
          {isAiQuery ? (
            <div className="py-6 text-center">
              <div className="relative inline-block">
                <Sparkles className="mx-auto h-10 w-10 text-primary mb-3" />
                <Badge variant="secondary" className="absolute -top-1 -right-1 text-[10px]">
                  AI
                </Badge>
              </div>
              <p className="text-sm font-medium mb-1">Ask AI: &quot;{inputValue}&quot;</p>
              <p className="text-xs text-muted-foreground">
                Press <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px]">Enter</kbd> to let AI help you
              </p>
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No results found. Try a different search.
            </p>
          )}
        </CommandEmpty>

        {/* AI Actions */}
        {filteredAiActions.length > 0 && (
          <CommandGroup heading="AI Actions">
            {filteredAiActions.map((item) => (
              <CommandItem
                key={item.action}
                onSelect={() => handleAction(item.action)}
                className="flex items-center gap-3 py-3"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/5">
                  <item.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex flex-col flex-1">
                  <span className="text-sm font-medium">{item.label}</span>
                  <span className="text-xs text-muted-foreground">{item.description}</span>
                </div>
                <Badge variant="secondary" className="text-[10px] gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  AI
                </Badge>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {(filteredAiActions.length > 0 && (filteredQuickActions.length > 0 || filteredNavItems.length > 0)) && (
          <CommandSeparator />
        )}

        {/* Quick Actions */}
        {filteredQuickActions.length > 0 && (
          <CommandGroup heading="Quick Actions">
            {filteredQuickActions.map((item) => (
              <CommandItem
                key={item.action}
                onSelect={() => handleAction(item.action)}
              >
                <item.icon className="mr-3 h-4 w-4 text-muted-foreground" />
                <span>{item.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {filteredQuickActions.length > 0 && filteredNavItems.length > 0 && (
          <CommandSeparator />
        )}

        {/* Navigation */}
        {filteredNavItems.length > 0 && (
          <CommandGroup heading="Navigation">
            {filteredNavItems.map((item) => (
              <CommandItem
                key={item.href}
                onSelect={() => handleNavigation(item.href)}
              >
                <item.icon className="mr-3 h-4 w-4 text-muted-foreground" />
                <span>{item.label}</span>
                {item.shortcut && (
                  <CommandShortcut>{item.shortcut}</CommandShortcut>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* AI Query Prompt */}
        {isAiQuery && filteredAiActions.length === 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Or ask AI directly">
              <CommandItem
                onSelect={handleAIQuery}
                className="flex items-center gap-3 py-3"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/5">
                  <Send className="h-4 w-4 text-primary" />
                </div>
                <div className="flex flex-col flex-1">
                  <span className="text-sm font-medium">Send to AI</span>
                  <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                    &quot;{inputValue}&quot;
                  </span>
                </div>
                <Badge variant="secondary" className="text-[10px]">
                  Enter ↵
                </Badge>
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
