"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Target,
  FileText,
  AlertTriangle,
  BarChart3,
  Settings,
  Bot,
  Menu,
  X,
  ChevronLeft,
  Globe,
  Sparkles,
  RefreshCw,
  ArrowUpRight,
  Link2,
  Brain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { CommandPalette, useCommandPalette, CommandTrigger } from "@/components/command-palette";

// ============================================
// NAV ITEMS - Prioritize the money path
// ============================================

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/content", label: "Content", icon: FileText, primary: true },
  { href: "/keywords", label: "Keywords", icon: Target },
  { href: "/aio", label: "AI Visibility", icon: Brain },
  { href: "/audit", label: "Audit", icon: AlertTriangle },
  { href: "/links", label: "Internal Links", icon: Link2 },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/autopilot", label: "Autopilot", icon: Bot },
];

const bottomNavItems = [
  { href: "/settings", label: "Settings", icon: Settings },
];

// ============================================
// MINI USAGE BAR
// ============================================

function MiniUsageBar({ 
  used, 
  limit, 
  label,
  collapsed 
}: { 
  used: number; 
  limit: number; 
  label: string;
  collapsed: boolean;
}) {
  const percentage = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const isNearLimit = percentage >= 80;

  if (collapsed) return null;

  return (
    <div className="px-1">
      <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-0.5">
        <span>{label}</span>
        <span className={isNearLimit ? "text-yellow-400" : ""}>{used}/{limit}</span>
      </div>
      <Progress 
        value={percentage} 
        className={`h-1 ${isNearLimit ? "[&>div]:bg-yellow-500" : "[&>div]:bg-emerald-500"}`}
      />
    </div>
  );
}

// ============================================
// SIDEBAR
// ============================================

function Sidebar({ collapsed, onCollapse }: { collapsed: boolean; onCollapse: () => void }) {
  const pathname = usePathname();
  const [usage, setUsage] = useState<{ articles: { used: number; limit: number }; plan: string } | null>(null);

  useEffect(() => {
    async function fetchUsage() {
      try {
        const res = await fetch("/api/billing/usage");
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setUsage({
              articles: {
                used: data.data?.usage?.articles || 0,
                limit: data.data?.limits?.articles || 10,
              },
              plan: data.data?.plan?.name || "Starter",
            });
          }
        }
      } catch (e) {
        // Silently fail
      }
    }
    fetchUsage();
  }, []);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-zinc-900 border-r border-zinc-800 transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-zinc-800 flex-shrink-0">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <img src="/cabbageseo_logo.png" alt="CabbageSEO" className="h-9 w-auto" />
            <span className="font-bold text-lg text-white">CabbageSEO</span>
          </Link>
        )}
        {collapsed && (
          <img src="/cabbageseo_logo.png" alt="CabbageSEO" className="h-9 w-auto mx-auto" />
        )}
      </div>

      {/* Quick Action - Create Content */}
      {!collapsed && (
        <div className="p-3 border-b border-zinc-800">
          <Link href="/content/new">
            <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white gap-2">
              <Sparkles className="w-4 h-4" />
              Generate Article
            </Button>
          </Link>
        </div>
      )}
      {collapsed && (
        <div className="p-2 border-b border-zinc-800">
          <Link href="/content/new">
            <Button size="icon" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white">
              <Sparkles className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      )}

      {/* Nav Items */}
      <nav className="flex-1 p-3 overflow-y-auto">
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors relative group",
                  isActive
                    ? "bg-emerald-600 text-white"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="font-medium">{item.label}</span>}
                {collapsed && (
                  <span className="absolute left-full ml-2 px-2 py-1 bg-zinc-800 text-white rounded-md text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-md border border-zinc-700">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Usage & Upgrade */}
      {usage && !collapsed && (
        <div className="p-3 border-t border-zinc-800 space-y-3">
          <MiniUsageBar 
            used={usage.articles.used} 
            limit={usage.articles.limit} 
            label="Articles" 
            collapsed={collapsed}
          />
          
          {usage.plan === "Starter" && (
            <Link href="/pricing">
              <Button variant="outline" size="sm" className="w-full border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white gap-1 text-xs">
                <ArrowUpRight className="w-3 h-3" />
                Upgrade to Pro
              </Button>
            </Link>
          )}
        </div>
      )}

      {/* Bottom Nav */}
      <div className="border-t border-zinc-800 p-3 space-y-1">
        {bottomNavItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group relative",
                isActive
                  ? "bg-emerald-600 text-white"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="font-medium">{item.label}</span>}
              {collapsed && (
                <span className="absolute left-full ml-2 px-2 py-1 bg-zinc-800 text-white rounded-md text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-md border border-zinc-700">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}

        {/* Collapse Button */}
        <button
          onClick={onCollapse}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors w-full"
        >
          <ChevronLeft
            className={cn(
              "w-5 h-5 transition-transform flex-shrink-0",
              collapsed && "rotate-180"
            )}
          />
          {!collapsed && <span className="font-medium">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}

// ============================================
// HEADER
// ============================================

function Header({
  sidebarCollapsed,
  onMenuClick,
  onCommandOpen,
}: {
  sidebarCollapsed: boolean;
  onMenuClick: () => void;
  onCommandOpen: () => void;
}) {
  return (
    <header
      className={cn(
        "fixed top-0 right-0 z-30 h-16 bg-zinc-950/95 backdrop-blur border-b border-zinc-800 flex items-center justify-between px-4 transition-all duration-300",
        sidebarCollapsed ? "left-16" : "left-64"
      )}
    >
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-zinc-400 hover:text-white"
          onClick={onMenuClick}
        >
          <Menu className="w-5 h-5" />
        </Button>

        <CommandTrigger onClick={onCommandOpen} />
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="gap-2 text-zinc-400 hover:text-white" asChild>
          <Link href="/sites">
            <Globe className="w-4 h-4" />
            <span className="hidden sm:inline">Sites</span>
          </Link>
        </Button>
        <Link href="/pricing">
          <Button size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-500">
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">Upgrade</span>
          </Button>
        </Link>
      </div>
    </header>
  );
}

// ============================================
// MOBILE NAV
// ============================================

function MobileNav({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={onClose}
      />
      <aside className="fixed left-0 top-0 z-50 w-64 h-screen bg-zinc-900 lg:hidden">
        <div className="h-16 flex items-center justify-between px-4 border-b border-zinc-800">
          <Link href="/dashboard" className="flex items-center gap-2" onClick={onClose}>
            <img src="/cabbageseo_logo.png" alt="CabbageSEO" className="h-9 w-auto" />
            <span className="font-bold text-lg text-white">CabbageSEO</span>
          </Link>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Quick Action */}
        <div className="p-3 border-b border-zinc-800">
          <Link href="/content/new" onClick={onClose}>
            <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white gap-2">
              <Sparkles className="w-4 h-4" />
              Generate Article
            </Button>
          </Link>
        </div>

        <nav className="p-3 space-y-1">
          {[...navItems, ...bottomNavItems].map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                  isActive
                    ? "bg-emerald-600 text-white"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

// ============================================
// APP LAYOUT
// ============================================

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { open: commandOpen, setOpen: setCommandOpen } = useCommandPalette();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 dark">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          collapsed={sidebarCollapsed}
          onCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Mobile Nav */}
      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      {/* Header */}
      <Header
        sidebarCollapsed={sidebarCollapsed}
        onMenuClick={() => setMobileNavOpen(true)}
        onCommandOpen={() => setCommandOpen(true)}
      />

      {/* Main Content */}
      <main
        className={cn(
          "pt-16 min-h-screen transition-all duration-300",
          sidebarCollapsed ? "lg:pl-16" : "lg:pl-64"
        )}
      >
        <div className="p-6">{children}</div>
      </main>

      {/* Command Palette */}
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
}
