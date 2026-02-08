"use client";

/**
 * ============================================
 * DASHBOARD SIDEBAR - REBUILT
 * ============================================
 * 
 * Simple, clean navigation.
 * Plan-aware upgrade CTA.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  Settings,
  ChevronLeft,
  ChevronRight,
  Crown,
  Search,
  FileText,
} from "lucide-react";
import { useState, useEffect } from "react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Trust Map", href: "/dashboard/sources", icon: Search },
  { title: "Pages", href: "/dashboard/pages", icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [plan, setPlan] = useState("free");

  // Fetch plan
  useEffect(() => {
    fetch("/api/me", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        setPlan(data.organization?.plan || "free");
      })
      .catch(() => {});
  }, []);

  const isPaid = plan === "scout" || plan === "command" || plan === "dominate";

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-zinc-950 border-r border-zinc-800 transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className={cn(
        "flex items-center h-16 px-4 border-b border-zinc-800",
        collapsed ? "justify-center" : "gap-3"
      )}>
        <img src="/apple-touch-icon.png" alt="CabbageSEO" className="h-9 w-9 rounded-lg shrink-0" />
        {!collapsed && (
          <span className="font-bold text-white text-lg tracking-tight">CabbageSEO</span>
        )}
      </div>

      {/* Main Nav */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group",
                isActive
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/50",
                collapsed && "justify-center px-2"
              )}
            >
              <item.icon className={cn(
                "h-5 w-5 shrink-0 transition-colors",
                isActive ? "text-emerald-400" : "text-zinc-500 group-hover:text-zinc-300"
              )} />
              {!collapsed && (
                <span className="flex-1 text-sm font-medium">{item.title}</span>
              )}
            </Link>
          );
        })}

        {/* Settings */}
        <div className="pt-4">
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group",
              pathname.startsWith("/settings")
                ? "bg-emerald-500/10 text-emerald-400"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800/50",
              collapsed && "justify-center px-2"
            )}
          >
            <Settings className={cn(
              "h-5 w-5 shrink-0 transition-colors",
              pathname.startsWith("/settings") ? "text-emerald-400" : "text-zinc-500 group-hover:text-zinc-300"
            )} />
            {!collapsed && (
              <span className="flex-1 text-sm font-medium">Settings</span>
            )}
          </Link>
        </div>
      </nav>

      {/* Upgrade CTA (only for free users) */}
      {!collapsed && !isPaid && (
        <div className="px-3 py-3 border-t border-zinc-800">
          <Link href="/pricing">
            <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 cursor-pointer hover:border-emerald-500/40 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="h-4 w-4 text-emerald-400" />
                <span className="text-sm font-medium text-white">Upgrade to Scout</span>
              </div>
              <p className="text-xs text-zinc-400">
                Daily monitoring & 30-day sprint
              </p>
            </div>
          </Link>
        </div>
      )}

      {/* Collapse */}
      <div className="px-3 py-3 border-t border-zinc-800">
        <div className={cn(
          "flex items-center",
          collapsed ? "justify-center" : "justify-between"
        )}>
          {!collapsed && (
            <Badge variant="outline" className="text-xs text-zinc-400 border-zinc-700">
              {plan.charAt(0).toUpperCase() + plan.slice(1)} Plan
            </Badge>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
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
