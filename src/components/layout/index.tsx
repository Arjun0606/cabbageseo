"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
  Command,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CommandPalette, useCommandPalette, CommandTrigger } from "@/components/command-palette";

// ============================================
// NAV ITEMS
// ============================================

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/keywords", label: "Keywords", icon: Target },
  { href: "/content", label: "Content", icon: FileText },
  { href: "/audit", label: "Audit", icon: AlertTriangle, badge: 3 },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/autopilot", label: "Autopilot", icon: Bot },
];

const bottomNavItems = [
  { href: "/settings", label: "Settings", icon: Settings },
];

// ============================================
// SIDEBAR
// ============================================

function Sidebar({ collapsed, onCollapse }: { collapsed: boolean; onCollapse: () => void }) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-background border-r transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <img src="/cabbageseo_logo.png" alt="CabbageSEO" className="h-9 w-auto" />
            <span className="font-bold text-lg">CabbageSEO</span>
          </Link>
        )}
        {collapsed && (
          <img src="/cabbageseo_logo.png" alt="CabbageSEO" className="h-9 w-auto mx-auto" />
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex flex-col h-[calc(100vh-4rem)] p-3">
        <div className="flex-1 space-y-1">
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
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="font-medium">{item.label}</span>}
                {!collapsed && item.badge && (
                  <Badge
                    variant={isActive ? "secondary" : "destructive"}
                    className="ml-auto h-5 px-1.5"
                  >
                    {item.badge}
                  </Badge>
                )}
                {collapsed && item.badge && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
                {collapsed && (
                  <span className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground rounded-md text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-md">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Bottom Nav */}
        <div className="border-t pt-3 space-y-1">
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
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="font-medium">{item.label}</span>}
                {collapsed && (
                  <span className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground rounded-md text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-md">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Collapse Button */}
          <button
            onClick={onCollapse}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors w-full"
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
      </nav>
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
        "fixed top-0 right-0 z-30 h-16 bg-background/95 backdrop-blur border-b flex items-center justify-between px-4 transition-all duration-300",
        sidebarCollapsed ? "left-16" : "left-64"
      )}
    >
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="w-5 h-5" />
        </Button>

        <CommandTrigger onClick={onCommandOpen} />
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="gap-2" asChild>
          <Link href="/sites">
            <Globe className="w-4 h-4" />
            <span className="hidden sm:inline">Sites</span>
          </Link>
        </Button>
        <Button size="sm" className="gap-2">
          <Sparkles className="w-4 h-4" />
          <span className="hidden sm:inline">Upgrade</span>
        </Button>
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
      <aside className="fixed left-0 top-0 z-50 w-64 h-screen bg-background lg:hidden">
        <div className="h-16 flex items-center justify-between px-4 border-b">
          <Link href="/dashboard" className="flex items-center gap-2" onClick={onClose}>
            <img src="/cabbageseo_logo.png" alt="CabbageSEO" className="h-9 w-auto" />
            <span className="font-bold text-lg">CabbageSEO</span>
          </Link>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
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
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
    <div className="min-h-screen bg-background">
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
