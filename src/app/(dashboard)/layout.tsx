"use client";

/**
 * ============================================
 * DASHBOARD LAYOUT - COMPLETE REBUILD
 * ============================================
 * 
 * Provides:
 * - SiteProvider context for all pages
 * - Sidebar navigation
 * - Header with site switcher
 * - Trial expiration blocking
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Eye,
  Brain,
  Target,
  Search,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Home,
  Crown,
  Zap,
  LogOut,
  User,
  Globe,
  ChevronDown,
  Plus,
  ExternalLink,
  Check,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SiteProvider, useSite } from "@/context/site-context";
import { TRIAL_DAYS } from "@/lib/billing/citation-plans";

// ============================================
// NAV CONFIG
// ============================================

const mainNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/citations", label: "Citations", icon: Eye },
  { href: "/intelligence", label: "Intelligence", icon: Brain },
  { href: "/competitors", label: "Competitors", icon: Target },
  { href: "/analyze", label: "Analyzer", icon: Search },
];

const bottomNav = [
  { href: "/settings/notifications", label: "Alerts", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings },
];

// ============================================
// TRIAL EXPIRED MODAL
// ============================================

function TrialExpiredModal() {
  const router = useRouter();
  
  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-amber-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Free Trial Ended</h2>
        <p className="text-zinc-400 mb-6">
          Your {TRIAL_DAYS}-day free trial has ended. Upgrade now to continue tracking your AI citations.
        </p>
        <div className="space-y-3">
          <Button 
            onClick={() => router.push("/pricing")}
            className="w-full bg-emerald-600 hover:bg-emerald-500"
          >
            <Crown className="w-4 h-4 mr-2" />
            View Plans & Upgrade
          </Button>
          <Button 
            variant="outline" 
            onClick={() => router.push("/")}
            className="w-full border-zinc-700"
          >
            <Home className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// SITE SWITCHER
// ============================================

function SiteSwitcher() {
  const router = useRouter();
  const { sites, currentSite, setCurrentSite, usage } = useSite();

  if (!currentSite || sites.length === 0) {
    return (
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => router.push("/dashboard")}
        className="border-emerald-600 text-emerald-400 hover:bg-emerald-600/10"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Website
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="w-[220px] justify-between bg-zinc-900 border-zinc-700">
          <div className="flex items-center gap-2 truncate">
            <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">{currentSite.domain}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px] border-0">Active</Badge>
            <ChevronDown className="w-4 h-4 text-zinc-400" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="start" className="w-[260px] bg-zinc-900 border-zinc-700">
        <div className="px-2 py-1.5 text-xs text-zinc-500">
          Your Sites ({sites.length}/{usage.sitesLimit})
        </div>
        <DropdownMenuSeparator className="bg-zinc-800" />
        
        {sites.map((site) => (
          <DropdownMenuItem 
            key={site.id}
            onClick={() => setCurrentSite(site)}
            className="cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                {site.id === currentSite.id ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <div className="w-4 h-4" />
                )}
                <div>
                  <div className="font-medium">{site.domain}</div>
                  <div className="text-xs text-zinc-500">{site.totalCitations} citations</div>
                </div>
              </div>
              <a 
                href={`https://${site.domain}`} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-zinc-500 hover:text-white"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </DropdownMenuItem>
        ))}
        
        {sites.length < usage.sitesLimit && (
          <>
            <DropdownMenuSeparator className="bg-zinc-800" />
            <DropdownMenuItem
              onClick={() => router.push("/dashboard?add=true")}
              className="cursor-pointer text-emerald-400"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Site
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ============================================
// SIDEBAR
// ============================================

function Sidebar({ collapsed, onCollapse }: { collapsed: boolean; onCollapse: () => void }) {
  const pathname = usePathname();
  const { organization, usage, trial } = useSite();
  
  const plan = organization?.plan || "free";
  const isPro = plan === "pro" || plan === "pro_plus" || plan === "agency";
  const usagePercent = usage.checksLimit > 0 ? Math.min((usage.checksUsed / usage.checksLimit) * 100, 100) : 0;

  return (
    <aside className={cn(
      "fixed left-0 top-0 z-40 h-screen bg-[#0a0a0f] border-r border-white/5 transition-all duration-300 flex flex-col",
      collapsed ? "w-[72px]" : "w-[260px]"
    )}>
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-white/5">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Eye className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <span className="font-bold text-white tracking-tight">CabbageSEO</span>
              <span className="block text-[10px] text-emerald-400/80 font-medium uppercase tracking-wide">
                Citation Intel
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Trial Banner */}
      {!collapsed && trial.isTrialUser && !trial.expired && (
        <div className="mx-3 mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium text-amber-400">Free Trial</span>
          </div>
          <p className="text-xs text-zinc-400">
            {trial.daysRemaining} day{trial.daysRemaining !== 1 ? "s" : ""} remaining
          </p>
          <Progress value={(trial.daysUsed / TRIAL_DAYS) * 100} className="h-1 mt-2 bg-zinc-800" />
        </div>
      )}

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
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative",
                  isActive
                    ? "bg-gradient-to-r from-emerald-500/20 to-emerald-500/5 text-emerald-400"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                )}
              >
                <div className={cn(
                  "p-1.5 rounded-lg transition-colors",
                  isActive ? "bg-emerald-500/20" : "bg-white/5 group-hover:bg-white/10"
                )}>
                  <Icon className="w-4 h-4" />
                </div>
                {!collapsed && <span className="font-medium">{item.label}</span>}
                {isActive && !collapsed && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-auto" />}
                {collapsed && (
                  <span className="absolute left-full ml-3 px-2.5 py-1.5 bg-zinc-800 text-white rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Usage Section */}
        {!collapsed && (
          <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Monthly Checks</span>
              <span className="text-xs font-mono text-zinc-400">
                {usage.checksUsed}/{usage.checksLimit === 999999 ? "∞" : usage.checksLimit}
              </span>
            </div>
            <Progress value={usage.checksLimit === 999999 ? 0 : usagePercent} className="h-1.5 bg-zinc-800" />
          </div>
        )}

        {/* Upgrade CTA */}
        {!collapsed && !isPro && (
          <Link href="/pricing" className="block mt-4">
            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 via-cyan-500/10 to-blue-500/10 border border-emerald-500/20 hover:border-emerald-500/40 transition-all">
              <div className="flex items-center gap-2 mb-1">
                <Crown className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-semibold text-white">Upgrade to Pro</span>
              </div>
              <p className="text-xs text-zinc-400">Unlimited checks • 10 competitors</p>
            </div>
          </Link>
        )}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-white/5 p-3 space-y-1">
        {/* Home Link */}
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-zinc-500 hover:text-white hover:bg-white/5 transition-all"
        >
          <Home className="w-4 h-4" />
          {!collapsed && <span className="text-sm">Back to Home</span>}
        </Link>
        
        {bottomNav.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-xl transition-all",
                isActive ? "text-white bg-white/5" : "text-zinc-500 hover:text-white hover:bg-white/5"
              )}
            >
              <Icon className="w-4 h-4" />
              {!collapsed && <span className="text-sm">{item.label}</span>}
            </Link>
          );
        })}

        {/* Collapse Button */}
        <button
          onClick={onCollapse}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-zinc-500 hover:text-white hover:bg-white/5 transition-all w-full"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span className="text-sm">Collapse</span>
            </>
          )}
        </button>

        {/* Plan Badge */}
        {!collapsed && (
          <div className="px-3 pt-2">
            <Badge variant="outline" className={cn(
              "text-[10px] uppercase tracking-wider font-medium",
              isPro 
                ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" 
                : "border-zinc-700 text-zinc-500"
            )}>
              {plan} {plan === "free" ? "trial" : "plan"}
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

function Header({ sidebarCollapsed, onMenuClick }: { sidebarCollapsed: boolean; onMenuClick: () => void }) {
  const router = useRouter();
  const { user, runCheck, loading } = useSite();
  const [checking, setChecking] = useState(false);

  const handleCheck = async () => {
    setChecking(true);
    await runCheck();
    setChecking(false);
  };

  return (
    <header className={cn(
      "fixed top-0 right-0 z-30 h-16 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6 transition-all",
      sidebarCollapsed ? "left-[72px]" : "left-[260px]"
    )}>
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
        <Button 
          size="sm" 
          onClick={handleCheck}
          disabled={checking || loading}
          className="bg-emerald-600 hover:bg-emerald-500"
        >
          {checking ? (
            <>
              <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Checking...
            </>
          ) : (
            <>
              <Eye className="w-4 h-4 mr-2" />
              Check Now
            </>
          )}
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center border border-white/10">
                <User className="w-4 h-4 text-zinc-400" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-zinc-900 border-zinc-700">
            {user && (
              <>
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-white">{user.name}</p>
                  <p className="text-xs text-zinc-500">{user.email}</p>
                </div>
                <DropdownMenuSeparator className="bg-zinc-800" />
              </>
            )}
            <DropdownMenuItem asChild>
              <Link href="/settings" className="cursor-pointer">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/pricing" className="cursor-pointer">
                <Crown className="w-4 h-4 mr-2" />
                Upgrade
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-zinc-800" />
            <DropdownMenuItem asChild>
              <Link href="/api/auth/logout" className="cursor-pointer text-red-400">
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

function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={onClose} />
      <aside className="fixed left-0 top-0 z-50 w-[280px] h-screen bg-[#0a0a0f] lg:hidden border-r border-white/5">
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/5">
          <Link href="/" className="flex items-center gap-3" onClick={onClose}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-white">CabbageSEO</span>
          </Link>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <nav className="p-4 space-y-1">
          {[...mainNav, ...bottomNav].map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                  isActive ? "bg-emerald-500/10 text-emerald-400" : "text-zinc-400 hover:bg-white/5 hover:text-white"
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
// LAYOUT CONTENT (uses context)
// ============================================

function LayoutContent({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { trial, loading } = useSite();

  // Show trial expired modal
  if (!loading && trial.isTrialUser && trial.expired) {
    return <TrialExpiredModal />;
  }

  return (
    <div className="min-h-screen bg-[#06060a] text-zinc-100">
      {/* Gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-emerald-500/[0.02] via-transparent to-cyan-500/[0.02] pointer-events-none" />
      
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar collapsed={sidebarCollapsed} onCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} />
      </div>

      {/* Mobile Nav */}
      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      {/* Header */}
      <Header sidebarCollapsed={sidebarCollapsed} onMenuClick={() => setMobileNavOpen(true)} />

      {/* Main Content */}
      <main className={cn(
        "pt-16 min-h-screen transition-all relative",
        sidebarCollapsed ? "lg:pl-[72px]" : "lg:pl-[260px]"
      )}>
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}

// ============================================
// MAIN LAYOUT EXPORT
// ============================================

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SiteProvider>
      <LayoutContent>{children}</LayoutContent>
    </SiteProvider>
  );
}
