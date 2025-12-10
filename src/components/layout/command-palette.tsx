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
import {
  LayoutDashboard,
  Globe,
  Search,
  FileText,
  Link2,
  Gauge,
  BarChart3,
  Settings,
  Zap,
  Sparkles,
  Target,
  BookOpen,
  Bot,
  PlusCircle,
  RefreshCw,
  Wand2,
  FileEdit,
  Lightbulb,
  AlertCircle,
  ArrowUpRight,
  Keyboard,
} from "lucide-react";

// ============================================
// COMMAND ITEMS
// ============================================

const navigationItems = [
  { icon: LayoutDashboard, label: "Go to Dashboard", href: "/dashboard", shortcut: "⌘D" },
  { icon: Globe, label: "Go to Sites", href: "/sites", shortcut: "⌘S" },
  { icon: Bot, label: "Go to Autopilot", href: "/autopilot" },
  { icon: Search, label: "Go to Keywords", href: "/keywords" },
  { icon: FileText, label: "Go to Content", href: "/content" },
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
    description: "AI generates 10 content ideas for your site"
  },
  { 
    icon: FileEdit, 
    label: "Write an article", 
    action: "write-article",
    description: "AI writes a full SEO-optimized article"
  },
  { 
    icon: Sparkles, 
    label: "Optimize a page", 
    action: "optimize-page",
    description: "AI analyzes and suggests improvements"
  },
  { 
    icon: Link2, 
    label: "Find internal linking opportunities", 
    action: "internal-links",
    description: "AI finds pages to link together"
  },
  { 
    icon: AlertCircle, 
    label: "Fix SEO issues", 
    action: "fix-issues",
    description: "Auto-fix common SEO problems"
  },
  { 
    icon: Target, 
    label: "Analyze competitors", 
    action: "analyze-competitors",
    description: "AI analyzes your competitors' SEO"
  },
];

const quickActions = [
  { icon: PlusCircle, label: "Add new site", action: "add-site" },
  { icon: RefreshCw, label: "Run site crawl", action: "run-crawl" },
  { icon: Search, label: "Research keywords", action: "research-keywords" },
  { icon: Lightbulb, label: "Get SEO recommendations", action: "get-recommendations" },
  { icon: ArrowUpRight, label: "Check rankings", action: "check-rankings" },
  { icon: Keyboard, label: "View keyboard shortcuts", action: "shortcuts" },
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

  const handleNavigation = (href: string) => {
    router.push(href);
    onOpenChange(false);
    setInputValue("");
  };

  const handleAction = (action: string) => {
    // Handle different actions
    switch (action) {
      case "add-site":
        router.push("/sites/new");
        break;
      case "generate-ideas":
        router.push("/ideas?action=generate");
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
        router.push("/competitors");
        break;
      case "run-crawl":
        // Trigger crawl action
        console.log("Running crawl...");
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
      case "shortcuts":
        // Show shortcuts modal
        console.log("Showing shortcuts...");
        break;
      default:
        console.log("Unknown action:", action);
    }
    onOpenChange(false);
    setInputValue("");
  };

  // Check if input looks like a command
  const isAiQuery = inputValue.length > 10 || inputValue.includes("?");

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Type a command, search, or ask AI..."
        value={inputValue}
        onValueChange={setInputValue}
      />
      <CommandList>
        <CommandEmpty>
          {isAiQuery ? (
            <div className="py-6 text-center">
              <Sparkles className="mx-auto h-8 w-8 text-primary animate-pulse mb-3" />
              <p className="text-sm font-medium">Ask AI: &quot;{inputValue}&quot;</p>
              <p className="text-xs text-muted-foreground mt-1">
                Press Enter to let AI help you
              </p>
            </div>
          ) : (
            <p className="py-6 text-center text-sm">No results found.</p>
          )}
        </CommandEmpty>

        {/* AI Actions */}
        <CommandGroup heading="AI Actions">
          {aiActions.map((item) => (
            <CommandItem
              key={item.action}
              onSelect={() => handleAction(item.action)}
              className="flex items-center gap-3"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <item.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{item.label}</span>
                <span className="text-xs text-muted-foreground">{item.description}</span>
              </div>
              <Sparkles className="ml-auto h-3 w-3 text-primary" />
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {/* Quick Actions */}
        <CommandGroup heading="Quick Actions">
          {quickActions.map((item) => (
            <CommandItem
              key={item.action}
              onSelect={() => handleAction(item.action)}
            >
              <item.icon className="mr-3 h-4 w-4 text-muted-foreground" />
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {/* Navigation */}
        <CommandGroup heading="Navigation">
          {navigationItems.map((item) => (
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
      </CommandList>
    </CommandDialog>
  );
}

