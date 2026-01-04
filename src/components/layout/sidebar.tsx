"use client";

/**
 * ============================================
 * LAYOUT SIDEBAR - REBUILT
 * ============================================
 * 
 * Clean, simple navigation.
 * No references to deleted pages.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Search,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Target,
  Shield,
  Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ============================================
// NAVIGATION CONFIG
// ============================================

interface NavItemType {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const navItems: NavItemType[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Overview & analysis",
  },
  {
    name: "Content",
    href: "/content",
    icon: FileText,
    description: "AI-generated articles",
  },
  {
    name: "Keywords",
    href: "/keywords",
    icon: Search,
    description: "Keyword opportunities",
  },
  {
    name: "GEO",
    href: "/geo",
    icon: Target,
    description: "AI visibility scores",
  },
  {
    name: "SEO Audit",
    href: "/audit",
    icon: Shield,
    description: "Technical health",
  },
];

// ============================================
// SIDEBAR COMPONENT
// ============================================

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [plan, setPlan] = useState("starter");
  const [usage, setUsage] = useState({ articles: 0, limit: 50 });

  // Fetch plan and usage
  useEffect(() => {
    fetch("/api/me", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        setPlan(data.organization?.plan || "starter");
      })
      .catch(() => {});
      
    fetch("/api/billing/usage", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        setUsage({
          articles: data.data?.usage?.articlesUsed || 0,
          limit: data.data?.limits?.articles || 50,
        });
      })
      .catch(() => {});
  }, [pathname]);

  const isPro = plan === "pro" || plan === "pro-plus";

  const NavItem = ({ item }: { item: NavItemType }) => {
    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
    const Icon = item.icon;

    const content = (
      <Link
        href={item.href}
        className={cn(
          "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
          "hover:bg-emerald-500/10 hover:text-emerald-400",
          isActive
            ? "bg-emerald-500/15 text-emerald-400"
            : "text-zinc-400",
          collapsed && "justify-center px-2"
        )}
      >
        <Icon
          className={cn(
            "h-5 w-5 shrink-0 transition-colors",
            isActive ? "text-emerald-400" : "text-zinc-500 group-hover:text-emerald-400"
          )}
        />
        {!collapsed && <span className="truncate">{item.name}</span>}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right">{item.name}</TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  return (
    <TooltipProvider>
      <aside
        className={cn(
          "flex h-screen flex-col border-r border-zinc-800 bg-zinc-950 transition-all duration-300",
          collapsed ? "w-[68px]" : "w-64",
          className
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            "flex h-16 items-center border-b border-zinc-800 px-4",
            collapsed && "justify-center px-2"
          )}
        >
          <Link href="/dashboard" className="flex items-center gap-2">
            <img
              src="/cabbageseo_logo.png"
              alt="CabbageSEO"
              className="h-9 w-auto"
            />
            {!collapsed && (
              <span className="text-lg font-bold tracking-tight text-white">
                Cabbage<span className="text-emerald-400">SEO</span>
              </span>
            )}
          </Link>
        </div>

        {/* Generate Article CTA */}
        <div className={cn("p-3 border-b border-zinc-800", collapsed && "px-2")}>
          <Link href="/content/new">
            {collapsed ? (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button size="icon" className="w-full bg-emerald-600 hover:bg-emerald-500">
                    <Sparkles className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Generate Article</TooltipContent>
              </Tooltip>
            ) : (
              <Button className="w-full gap-2 bg-emerald-600 hover:bg-emerald-500 text-white">
                <Sparkles className="h-4 w-4" />
                Generate Article
              </Button>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navItems.map((item) => (
            <NavItem key={item.href} item={item} />
          ))}
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-zinc-800 p-3 space-y-3">
          {/* Usage Stats */}
          {!collapsed && (
            <div className="space-y-2 px-2 pb-2">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Articles</span>
                <span className="text-zinc-400">{usage.articles}/{usage.limit}</span>
              </div>
              <Progress 
                value={Math.min(100, (usage.articles / usage.limit) * 100)} 
                className="h-1.5"
              />
            </div>
          )}

          {/* Upgrade CTA */}
          {!collapsed && !isPro && (
            <Link href="/pricing">
              <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 cursor-pointer hover:border-emerald-500/40 transition-colors mb-2">
                <div className="flex items-center gap-2 mb-1">
                  <Crown className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm font-medium text-white">Upgrade to Pro</span>
                </div>
                <p className="text-xs text-zinc-400">Unlimited articles</p>
              </div>
            </Link>
          )}

          {/* Settings */}
          <NavItem
            item={{
              name: "Settings",
              href: "/settings",
              icon: Settings,
              description: "App settings",
            }}
          />

          {/* Collapse Toggle */}
          <div className="flex items-center justify-between pt-2">
            {!collapsed && (
              <Badge variant="outline" className="text-xs text-zinc-400 border-zinc-700">
                {plan.charAt(0).toUpperCase() + plan.slice(1)}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "text-zinc-500 hover:text-zinc-300",
                collapsed && "w-full"
              )}
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}
