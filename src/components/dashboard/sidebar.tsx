"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  Search,
  FileText,
  Link2,
  BarChart3,
  Globe,
  Settings,
  Zap,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Crown,
  Sparkles,
  Command,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: string | number;
  badgeType?: "default" | "alert" | "success";
}

const mainNavItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Keywords", href: "/keywords", icon: Search, badge: "23", badgeType: "success" },
  { title: "Content", href: "/content", icon: FileText, badge: "4" },
  { title: "Internal Links", href: "/links", icon: Link2 },
  { title: "Technical Audit", href: "/audit", icon: AlertCircle, badge: "8", badgeType: "alert" },
  { title: "Analytics", href: "/analytics", icon: TrendingUp },
];

const secondaryNavItems: NavItem[] = [
  { title: "Sites", href: "/sites", icon: Globe },
  { title: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-slate-950 border-r border-slate-800 transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className={cn(
        "flex items-center h-16 px-4 border-b border-slate-800",
        collapsed ? "justify-center" : "gap-3"
      )}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cabbage-400 to-cabbage-600 flex items-center justify-center shrink-0">
          <span className="text-lg">🥬</span>
        </div>
        {!collapsed && (
          <span className="font-bold text-white text-lg">CabbageSEO</span>
        )}
      </div>

      {/* Autopilot Status */}
      {!collapsed && (
        <div className="px-3 py-3">
          <div className="p-3 rounded-xl bg-gradient-to-r from-cabbage-500/10 to-cabbage-600/5 border border-cabbage-500/20">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Zap className="h-4 w-4 text-cabbage-400" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-white">Autopilot Active</p>
                <p className="text-[10px] text-slate-400">Last: 2h ago</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Command Palette Hint */}
      {!collapsed && (
        <div className="px-3 pb-3">
          <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors text-left">
            <Command className="h-4 w-4 text-slate-500" />
            <span className="text-sm text-slate-500 flex-1">Quick actions...</span>
            <kbd className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">⌘K</kbd>
          </button>
        </div>
      )}

      {/* Main Nav */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <p className={cn(
          "text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2",
          collapsed ? "text-center" : "px-3"
        )}>
          {collapsed ? "•••" : "Main"}
        </p>
        {mainNavItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group",
                isActive
                  ? "bg-cabbage-500/10 text-cabbage-400"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50",
                collapsed && "justify-center px-2"
              )}
            >
              <item.icon className={cn(
                "h-5 w-5 shrink-0 transition-colors",
                isActive ? "text-cabbage-400" : "text-slate-500 group-hover:text-slate-300"
              )} />
              {!collapsed && (
                <>
                  <span className="flex-1 text-sm font-medium">{item.title}</span>
                  {item.badge && (
                    <Badge 
                      variant="secondary" 
                      className={cn(
                        "text-[10px] h-5 px-1.5",
                        item.badgeType === "alert" && "bg-red-500/20 text-red-400",
                        item.badgeType === "success" && "bg-green-500/20 text-green-400",
                        !item.badgeType && "bg-slate-800 text-slate-400"
                      )}
                    >
                      {item.badge}
                    </Badge>
                  )}
                </>
              )}
            </Link>
          );
        })}

        <div className="pt-4">
          <p className={cn(
            "text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2",
            collapsed ? "text-center" : "px-3"
          )}>
            {collapsed ? "•••" : "Manage"}
          </p>
          {secondaryNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group",
                  isActive
                    ? "bg-cabbage-500/10 text-cabbage-400"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50",
                  collapsed && "justify-center px-2"
                )}
              >
                <item.icon className={cn(
                  "h-5 w-5 shrink-0 transition-colors",
                  isActive ? "text-cabbage-400" : "text-slate-500 group-hover:text-slate-300"
                )} />
                {!collapsed && (
                  <span className="flex-1 text-sm font-medium">{item.title}</span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Upgrade CTA */}
      {!collapsed && (
        <div className="px-3 py-3 border-t border-slate-800">
          <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="h-4 w-4 text-amber-400" />
              <span className="text-sm font-medium text-white">Upgrade to Pro</span>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Unlock unlimited content generation & advanced features
            </p>
            <Button size="sm" className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0">
              View Plans
            </Button>
          </div>
        </div>
      )}

      {/* Help & Collapse */}
      <div className="px-3 py-3 border-t border-slate-800">
        <div className={cn(
          "flex items-center",
          collapsed ? "justify-center" : "justify-between"
        )}>
          {!collapsed && (
            <button className="flex items-center gap-2 text-slate-500 hover:text-slate-300 transition-colors">
              <HelpCircle className="h-4 w-4" />
              <span className="text-sm">Help</span>
            </button>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
