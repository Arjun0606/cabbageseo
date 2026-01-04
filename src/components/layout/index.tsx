"use client";

/**
 * ============================================
 * CITATION INTELLIGENCE - APP LAYOUT
 * ============================================
 * 
 * Fresh, modern layout for the Citation Intelligence product.
 * Clean navigation, focused on the core features.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Eye,
  Target,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Sparkles,
  Search,
  TrendingUp,
  Crown,
  HelpCircle,
  LogOut,
  User,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { SiteSwitcher } from "@/components/site-switcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ============================================
// NAV CONFIG - Citation Intelligence focused
// ============================================

const mainNav = [
  { 
    href: "/dashboard", 
    label: "Dashboard", 
    icon: LayoutDashboard,
    description: "Your citation overview"
  },
  { 
    href: "/citations", 
    label: "Citations", 
    icon: Eye,
    description: "All AI mentions"
  },
  { 
    href: "/competitors", 
    label: "Competitors", 
    icon: Target,
    description: "Compare visibility"
  },
  { 
    href: "/analyze", 
    label: "Analyzer", 
    icon: Search,
    description: "Check any domain"
  },
];

const bottomNav = [
  { href: "/settings/notifications", label: "Alerts", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings },
];

// ============================================
// SIDEBAR
// ============================================

function Sidebar({ 
  collapsed, 
  onCollapse 
}: { 
  collapsed: boolean; 
  onCollapse: () => void;
}) {
  const pathname = usePathname();
  const [usage, setUsage] = useState({ checks: 0, limit: 100, plan: "starter" });

  useEffect(() => {
    async function fetchData() {
      try {
        const [usageRes, meRes] = await Promise.all([
          fetch("/api/billing/usage"),
          fetch("/api/me"),
        ]);
        
        if (usageRes.ok) {
          const data = await usageRes.json();
          setUsage(prev => ({
            ...prev,
            checks: data.data?.usage?.checksUsed || 0,
            limit: data.data?.limits?.checks || 100,
          }));
        }
        
        if (meRes.ok) {
          const data = await meRes.json();
          setUsage(prev => ({
            ...prev,
            plan: data.organization?.plan || "free",
          }));
        }
      } catch (e) {
        // Silently fail
      }
    }
    fetchData();
  }, [pathname]);

  const isPro = usage.plan === "pro" || usage.plan === "pro_plus";
  const usagePercent = usage.limit > 0 ? Math.min((usage.checks / usage.limit) * 100, 100) : 0;

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-[#0a0a0f] border-r border-white/5 transition-all duration-300 flex flex-col",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-white/5">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Eye className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <span className="font-bold text-white tracking-tight">CabbageSEO</span>
              <span className="block text-[10px] text-emerald-400/80 font-medium tracking-wide uppercase">
                Citation Intel
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 p-3 overflow-y-auto">
        <div className="space-y-1">
          {mainNav.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
                  isActive
                    ? "bg-gradient-to-r from-emerald-500/20 to-emerald-500/5 text-emerald-400 shadow-inner"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                )}
              >
                <div className={cn(
                  "p-1.5 rounded-lg transition-colors",
                  isActive ? "bg-emerald-500/20" : "bg-white/5 group-hover:bg-white/10"
                )}>
                  <Icon className="w-4 h-4" />
                </div>
                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <span className="font-medium block truncate">{item.label}</span>
                  </div>
                )}
                {isActive && !collapsed && (
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                )}
                {collapsed && (
                  <span className="absolute left-full ml-3 px-2.5 py-1.5 bg-zinc-800 text-white rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl border border-white/10">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Usage Section */}
        {!collapsed && (
          <div className="mt-6 p-4 rounded-2xl bg-gradient-to-b from-white/5 to-transparent border border-white/5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Monthly Checks</span>
              <span className="text-xs font-mono text-zinc-400">
                {usage.checks}/{usage.limit === -1 ? "∞" : usage.limit}
              </span>
            </div>
            <Progress 
              value={usage.limit === -1 ? 0 : usagePercent} 
              className="h-1.5 bg-white/5"
            />
            {usagePercent > 80 && usage.limit !== -1 && (
              <p className="text-xs text-amber-400 mt-2 flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Running low on checks
              </p>
            )}
          </div>
        )}

        {/* Upgrade CTA */}
        {!collapsed && !isPro && (
          <Link href="/pricing" className="block mt-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-cyan-500/10 to-blue-500/10 border border-emerald-500/20 hover:border-emerald-500/40 transition-all group">
              <div className="flex items-center gap-2 mb-1">
                <Crown className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-semibold text-white">Upgrade to Pro</span>
              </div>
              <p className="text-xs text-zinc-400">
                Unlimited checks • 10 competitors
              </p>
            </div>
          </Link>
        )}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-white/5 p-3 space-y-1">
        {bottomNav.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-xl transition-all group relative",
                isActive
                  ? "text-white bg-white/5"
                  : "text-zinc-500 hover:text-white hover:bg-white/5"
              )}
            >
              <Icon className="w-4 h-4" />
              {!collapsed && <span className="text-sm">{item.label}</span>}
              {collapsed && (
                <span className="absolute left-full ml-3 px-2.5 py-1.5 bg-zinc-800 text-white rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl border border-white/10">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}

        {/* Collapse Button */}
        <button
          onClick={onCollapse}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-zinc-500 hover:text-white hover:bg-white/5 transition-all w-full"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span className="text-sm">Collapse</span>
            </>
          )}
        </button>

        {/* Plan Badge */}
        {!collapsed && (
          <div className="px-3 pt-2">
            <Badge 
              variant="outline" 
              className={cn(
                "text-[10px] uppercase tracking-wider font-medium",
                isPro 
                  ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" 
                  : "border-white/10 text-zinc-500"
              )}
            >
              {usage.plan} plan
            </Badge>
          </div>
        )}
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
}: {
  sidebarCollapsed: boolean;
  onMenuClick: () => void;
}) {
  const [user, setUser] = useState<{ email?: string; name?: string } | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then(res => res.json())
      .then(data => {
        if (data.user) setUser(data.user);
      })
      .catch(() => {});
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 right-0 z-30 h-16 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6 transition-all duration-300",
        sidebarCollapsed ? "left-[72px]" : "left-[260px]"
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

        <SiteSwitcher />
      </div>

      <div className="flex items-center gap-3">
        {/* Quick Check Button */}
        <Link href="/dashboard">
          <Button 
            size="sm" 
            className="gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white shadow-lg shadow-emerald-500/20 border-0"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Check Now</span>
          </Button>
        </Link>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center border border-white/10">
                <User className="w-4 h-4 text-zinc-400" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-zinc-900 border-white/10">
            {user?.email && (
              <>
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-white">{user.name || "User"}</p>
                  <p className="text-xs text-zinc-500">{user.email}</p>
                </div>
                <DropdownMenuSeparator className="bg-white/10" />
              </>
            )}
            <DropdownMenuItem asChild>
              <Link href="/settings" className="text-zinc-400 hover:text-white cursor-pointer">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/pricing" className="text-zinc-400 hover:text-white cursor-pointer">
                <Crown className="w-4 h-4 mr-2" />
                Upgrade
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem asChild>
              <Link href="/api/auth/logout" className="text-red-400 hover:text-red-300 cursor-pointer">
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
        onClick={onClose}
      />
      <aside className="fixed left-0 top-0 z-50 w-[280px] h-screen bg-[#0a0a0f] lg:hidden border-r border-white/5">
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/5">
          <Link href="/dashboard" className="flex items-center gap-3" onClick={onClose}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-white">CabbageSEO</span>
          </Link>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <nav className="p-4 space-y-1">
          {[...mainNav, ...bottomNav].map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                  isActive
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
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
// APP LAYOUT EXPORT
// ============================================

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#06060a] text-zinc-100">
      {/* Subtle gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-emerald-500/[0.02] via-transparent to-cyan-500/[0.02] pointer-events-none" />
      
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
      />

      {/* Main Content */}
      <main
        className={cn(
          "pt-16 min-h-screen transition-all duration-300 relative",
          sidebarCollapsed ? "lg:pl-[72px]" : "lg:pl-[260px]"
        )}
      >
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
