"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
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
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Target,
  BookOpen,
  Bot,
  Brain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
  badge?: string;
}

const mainNavItems: NavItemType[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Mission control",
  },
  {
    name: "Sites",
    href: "/sites",
    icon: Globe,
    description: "Manage your websites",
  },
];

// GEO items - THE MAIN DIFFERENTIATOR (Generative Engine Optimization)
const geoNavItems: NavItemType[] = [
  {
    name: "GEO Dashboard",
    href: "/geo-dashboard",
    icon: Brain,
    description: "AI citations & autopilot",
    badge: "NEW",
  },
  {
    name: "GEO Analysis",
    href: "/geo",
    icon: Target,
    description: "Detailed platform scores",
  },
];

const seoNavItems: NavItemType[] = [
  {
    name: "Keywords",
    href: "/keywords",
    icon: Search,
    description: "Research & track rankings",
  },
  {
    name: "Content",
    href: "/content",
    icon: FileText,
    description: "AI-generated articles",
  },
  {
    name: "SEO Audit",
    href: "/audit",
    icon: Gauge,
    description: "Technical health check",
  },
];

// V2: Additional tools (hidden for now)
const toolsNavItems: NavItemType[] = [];

// ============================================
// SIDEBAR COMPONENT
// ============================================

interface SidebarProps {
  className?: string;
}

// Usage stats type
interface UsageStats {
  articles: { used: number; limit: number };
  keywords: { used: number; limit: number };
  audits: { used: number; limit: number };
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [usage, setUsage] = useState<UsageStats | null>(null);

  // Fetch usage stats
  useEffect(() => {
    async function fetchUsage() {
      try {
        const res = await fetch("/api/billing/usage");
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            setUsage({
              articles: { 
                used: data.data.usage?.articles || 0, 
                limit: data.data.limits?.articles || 10 
              },
              keywords: { 
                used: data.data.usage?.keywords || 0, 
                limit: data.data.limits?.keywords || 100 
              },
              audits: { 
                used: data.data.usage?.audits || 0, 
                limit: data.data.limits?.audits || 5 
              },
            });
          }
        }
      } catch {
        // Silently fail - usage display is non-critical
      }
    }
    fetchUsage();
  }, [pathname]); // Refetch when navigating

  const NavItem = ({ item }: { item: NavItemType }) => {
    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
    const Icon = item.icon;

    const content = (
      <Link
        href={item.href}
        className={cn(
          "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
          "hover:bg-primary/10 hover:text-primary",
          isActive
            ? "bg-primary/15 text-primary shadow-sm"
            : "text-muted-foreground",
          collapsed && "justify-center px-2"
        )}
      >
        <Icon
          className={cn(
            "h-5 w-5 shrink-0 transition-colors",
            isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary"
          )}
        />
        {!collapsed && (
          <>
            <span className="truncate">{item.name}</span>
            {item.badge && (
              <span className="ml-auto rounded-full bg-primary/20 px-2 py-0.5 text-xs font-semibold text-primary">
                {item.badge}
              </span>
            )}
          </>
        )}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="flex items-center gap-2">
            {item.name}
            {item.badge && (
              <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-semibold text-primary">
                {item.badge}
              </span>
            )}
          </TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  const NavSection = ({
    title,
    items,
  }: {
    title: string;
    items: NavItemType[];
  }) => (
    <div className="space-y-1">
      {!collapsed && (
        <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
          {title}
        </h3>
      )}
      {items.map((item) => (
        <NavItem key={item.href} item={item} />
      ))}
    </div>
  );

  return (
    <TooltipProvider>
      <aside
        className={cn(
          "flex h-screen flex-col border-r bg-card transition-all duration-300",
          collapsed ? "w-[68px]" : "w-64",
          className
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            "flex h-16 items-center border-b px-4",
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
              <span className="text-lg font-bold tracking-tight">
                Cabbage<span className="text-primary">SEO</span>
              </span>
            )}
          </Link>
        </div>

        {/* Generate Article CTA */}
        <div className={cn("p-3 border-b", collapsed && "px-2")}>
          <Link href="/content/new">
            {collapsed ? (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button size="icon" className="w-full bg-primary hover:bg-primary/90">
                    <Sparkles className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  Generate Article
                </TooltipContent>
              </Tooltip>
            ) : (
              <Button className="w-full gap-2 bg-primary hover:bg-primary/90">
                <Sparkles className="h-4 w-4" />
                Generate Article
              </Button>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-6 overflow-y-auto p-3">
          <NavSection title="Overview" items={mainNavItems} />
          <NavSection title="GEO" items={geoNavItems} />
          <NavSection title="SEO Tools" items={seoNavItems} />
          <NavSection title="More" items={toolsNavItems} />
        </nav>

        {/* Bottom Section */}
        <div className="border-t p-3 space-y-3">
          {/* Usage Stats */}
          {!collapsed && usage && (
            <div className="space-y-2 px-2 pb-2">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Usage
              </div>
              <div className="space-y-2">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Articles</span>
                    <span className="font-medium">{usage.articles.used}/{usage.articles.limit}</span>
                  </div>
                  <Progress 
                    value={Math.min(100, (usage.articles.used / usage.articles.limit) * 100)} 
                    className="h-1.5"
                  />
                </div>
              </div>
            </div>
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
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "mt-2 w-full justify-center text-muted-foreground hover:text-foreground",
              !collapsed && "justify-start"
            )}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-2" />
                <span>Collapse</span>
              </>
            )}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}

