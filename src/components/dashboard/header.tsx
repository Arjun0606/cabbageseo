"use client";

import { Bell, Search, Command } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DashboardHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function DashboardHeader({
  title,
  description,
  action,
}: DashboardHeaderProps) {
  // Command palette is a future enhancement - search button currently acts as visual placeholder
  
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-6 backdrop-blur-lg dark:border-slate-800 dark:bg-slate-950/80">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-slate-500">{description}</p>
        )}
      </div>

      <div className="flex items-center space-x-4">
        {/* Command Palette Trigger - Future enhancement */}
        <Button
          variant="outline"
          className="hidden w-64 justify-start text-slate-400 sm:flex"
          onClick={() => console.log("Command palette - coming soon")}
        >
          <Search className="mr-2 h-4 w-4" />
          <span>Search or type command...</span>
          <kbd className="ml-auto inline-flex h-5 items-center rounded border border-slate-200 bg-slate-50 px-1.5 font-mono text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800">
            <Command className="mr-1 h-3 w-3" />K
          </kbd>
        </Button>

        {/* Mobile Search */}
        <Button variant="ghost" size="icon" className="sm:hidden">
          <Search className="h-5 w-5" />
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-cabbage-500 text-[10px] font-bold text-white">
                3
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80" align="end">
            <DropdownMenuLabel className="flex items-center justify-between">
              Notifications
              <Badge variant="secondary">3 new</Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex flex-col items-start py-3">
              <div className="flex w-full items-start justify-between">
                <span className="font-medium">Article published</span>
                <span className="text-xs text-slate-500">2m ago</span>
              </div>
              <span className="mt-1 text-sm text-slate-500">
                &quot;10 Best Sustainable Fashion Brands&quot; is now live
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start py-3">
              <div className="flex w-full items-start justify-between">
                <span className="font-medium">Ranking improved</span>
                <span className="text-xs text-slate-500">1h ago</span>
              </div>
              <span className="mt-1 text-sm text-slate-500">
                &quot;sustainable fashion&quot; moved from #12 to #8
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start py-3">
              <div className="flex w-full items-start justify-between">
                <span className="font-medium">Content decay alert</span>
                <span className="text-xs text-slate-500">3h ago</span>
              </div>
              <span className="mt-1 text-sm text-slate-500">
                3 pages are losing rankings. Review recommended.
              </span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center text-cabbage-600">
              View all notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {action}
      </div>
    </header>
  );
}

