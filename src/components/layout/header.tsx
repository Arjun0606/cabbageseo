"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Search,
  Bell,
  Moon,
  Sun,
  Command,
  Sparkles,
  ChevronDown,
  LogOut,
  User,
  CreditCard,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

// ============================================
// PAGE TITLES
// ============================================

const pageTitles: Record<string, { title: string; description: string }> = {
  "/dashboard": {
    title: "Dashboard",
    description: "Your SEO mission control",
  },
  "/sites": {
    title: "Sites",
    description: "Manage your websites",
  },
  "/autopilot": {
    title: "Autopilot",
    description: "AI-powered SEO automation",
  },
  "/keywords": {
    title: "Keywords",
    description: "Research and track keywords",
  },
  "/content": {
    title: "Content",
    description: "AI-generated content library",
  },
  "/links": {
    title: "Internal Links",
    description: "Optimize your site structure",
  },
  "/audit": {
    title: "Technical Audit",
    description: "Site health and performance",
  },
  "/analytics": {
    title: "Analytics",
    description: "Track your SEO performance",
  },
  "/settings": {
    title: "Settings",
    description: "Manage your account",
  },
  "/quick-actions": {
    title: "Quick Actions",
    description: "One-click SEO improvements",
  },
  "/ideas": {
    title: "Content Ideas",
    description: "AI-powered content suggestions",
  },
  "/competitors": {
    title: "Competitor Analysis",
    description: "Track your competition",
  },
  "/learn": {
    title: "Learning Center",
    description: "Master SEO with guides",
  },
};

// ============================================
// HEADER COMPONENT
// ============================================

interface HeaderProps {
  className?: string;
  onCommandPaletteOpen?: () => void;
}

export function Header({ className, onCommandPaletteOpen }: HeaderProps) {
  const pathname = usePathname();
  const [darkMode, setDarkMode] = useState(false);

  // Get page info based on current path
  const getPageInfo = () => {
    // Check exact match first
    if (pageTitles[pathname]) {
      return pageTitles[pathname];
    }
    // Check for partial matches (e.g., /content/123)
    for (const [path, info] of Object.entries(pageTitles)) {
      if (pathname.startsWith(path) && path !== "/") {
        return info;
      }
    }
    return { title: "CabbageSEO", description: "AI-powered SEO platform" };
  };

  const pageInfo = getPageInfo();

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-card/80 px-6 backdrop-blur-lg",
        className
      )}
    >
      {/* Left: Page Title */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">{pageInfo.title}</h1>
          <p className="text-sm text-muted-foreground">{pageInfo.description}</p>
        </div>
      </div>

      {/* Center: Command Palette Trigger */}
      <div className="flex-1 max-w-xl mx-8">
        <Button
          variant="outline"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={onCommandPaletteOpen}
        >
          <Search className="mr-2 h-4 w-4" />
          <span className="flex-1 text-left">Search or run a command...</span>
          <kbd className="pointer-events-none ml-auto hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <Command className="h-3 w-3" />K
          </kbd>
        </Button>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Quick AI Action */}
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
          <Sparkles className="h-5 w-5" />
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative text-muted-foreground">
              <Bell className="h-5 w-5" />
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                3
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              Notifications
              <Badge variant="secondary" className="text-xs">3 new</Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-80 overflow-y-auto">
              <NotificationItem
                title="Content generated"
                description="'10 Best SEO Tools for 2025' is ready for review"
                time="5 min ago"
                type="success"
              />
              <NotificationItem
                title="Audit complete"
                description="example.com scored 85/100"
                time="1 hour ago"
                type="info"
              />
              <NotificationItem
                title="Ranking drop detected"
                description="'best seo tool' dropped 3 positions"
                time="2 hours ago"
                type="warning"
              />
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center text-primary">
              View all notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Dark Mode Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground"
          onClick={toggleDarkMode}
        >
          {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 pl-2 pr-1">
              <Avatar className="h-7 w-7">
                <AvatarImage src="" />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  CS
                </AvatarFallback>
              </Avatar>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">CabbageSEO User</p>
                <p className="text-xs text-muted-foreground">user@example.com</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <CreditCard className="mr-2 h-4 w-4" />
              Billing
            </DropdownMenuItem>
            <DropdownMenuItem>
              <HelpCircle className="mr-2 h-4 w-4" />
              Help & Support
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

// ============================================
// NOTIFICATION ITEM
// ============================================

function NotificationItem({
  title,
  description,
  time,
  type,
}: {
  title: string;
  description: string;
  time: string;
  type: "success" | "warning" | "info" | "error";
}) {
  const typeColors = {
    success: "bg-green-500",
    warning: "bg-yellow-500",
    info: "bg-blue-500",
    error: "bg-red-500",
  };

  return (
    <div className="flex gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors">
      <div className={cn("mt-1.5 h-2 w-2 rounded-full shrink-0", typeColors[type])} />
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium leading-tight">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
        <p className="text-xs text-muted-foreground/60">{time}</p>
      </div>
    </div>
  );
}

