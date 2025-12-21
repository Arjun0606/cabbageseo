"use client";

import { useState } from "react";
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

// AIO items - THE MAIN DIFFERENTIATOR
const aioNavItems: NavItemType[] = [
  {
    name: "AI Visibility",
    href: "/aio",
    icon: Brain,
    description: "Track AI platform citations",
    badge: "⭐",
  },
  {
    name: "Autopilot",
    href: "/autopilot",
    icon: Bot,
    description: "AI automation",
    badge: "AI",
  },
];

const seoNavItems: NavItemType[] = [
  {
    name: "Keywords",
    href: "/keywords",
    icon: Search,
    description: "Research & clustering",
  },
  {
    name: "Content",
    href: "/content",
    icon: FileText,
    description: "AI-optimized content",
  },
  {
    name: "Technical Audit",
    href: "/audit",
    icon: Gauge,
    description: "Site health checks",
  },
  {
    name: "Internal Links",
    href: "/links",
    icon: Link2,
    description: "Link optimization",
  },
  {
    name: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    description: "Performance tracking",
  },
];

const toolsNavItems = [
  {
    name: "Quick Actions",
    href: "/quick-actions",
    icon: Zap,
    description: "One-click optimizations",
  },
  {
    name: "Content Ideas",
    href: "/ideas",
    icon: Sparkles,
    description: "AI content suggestions",
  },
  {
    name: "Competitors",
    href: "/competitors",
    icon: Target,
    description: "Competitor analysis",
  },
  {
    name: "Learning",
    href: "/learn",
    icon: BookOpen,
    description: "SEO guides",
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
              className="rounded-lg"
            />
            {!collapsed && (
              <span className="text-lg font-bold tracking-tight">
                Cabbage<span className="text-primary">SEO</span>
              </span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-6 overflow-y-auto p-3">
          <NavSection title="Overview" items={mainNavItems} />
          <NavSection title="AI Visibility" items={aioNavItems} />
          <NavSection title="SEO Tools" items={seoNavItems} />
          <NavSection title="More" items={toolsNavItems} />
        </nav>

        {/* Bottom Section */}
        <div className="border-t p-3">
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

