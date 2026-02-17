"use client";

/**
 * Dashboard Layout
 *
 * Clean sidebar with:
 * - Logo
 * - Main navigation
 * - Plan status
 * - Back to home
 */

import { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Zap,
  Sparkles,
  Settings,
  Menu,
  X,
  Home,
  LogOut,
  Loader2,
  ArrowRight,
  Shield,
  Clock,
  Share2,
  Trophy,
  Plug,
} from "lucide-react";
import { SiteProvider, useSite } from "@/context/site-context";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { useCheckout } from "@/hooks/use-checkout";
import { CITATION_PLANS, getNextPlan } from "@/lib/billing/citation-plans";

// Navigation items
const navItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/dashboard/audit", label: "Site Audit", icon: Shield },
  { href: "/dashboard/pages", label: "Fix Pages", icon: Sparkles },
  { href: "/dashboard/actions", label: "Actions", icon: Zap },
  { href: "/dashboard/history", label: "History", icon: Clock },
  { href: "/dashboard/integrations", label: "API & OpenClaw", icon: Plug },
];

// Sidebar component
function Sidebar({ mobile, onClose }: { mobile?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { organization, currentSite } = useSite();
  const { checkout, loading: checkoutLoading } = useCheckout();

  const plan = organization?.plan || "free";
  const nextPlanId = getNextPlan(plan);
  const nextPlan = nextPlanId ? CITATION_PLANS[nextPlanId] : null;

  const handleLogout = async () => {
    const supabase = createClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    router.push("/");
  };

  return (
    <div className={`flex flex-col h-full bg-zinc-900 border-r border-zinc-800 ${mobile ? "w-full" : "w-64"}`}>
      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3">
            <img
              src="/apple-touch-icon.png"
              alt="CabbageSEO"
              className="w-9 h-9 rounded-xl"
            />
            <div>
              <span className="font-bold text-white">CabbageSEO</span>
              <p className="text-[10px] text-emerald-400 uppercase tracking-wider">AI Visibility</p>
            </div>
          </Link>
          {mobile && onClose && (
            <button onClick={onClose} className="text-zinc-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Current site */}
      {currentSite && (
        <div className="p-4 border-b border-zinc-800">
          <div className="flex items-center gap-2 p-3 bg-zinc-800/50 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-white text-sm font-medium truncate">
              {currentSite.domain}
            </span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}

        <div className="pt-4 mt-4 border-t border-zinc-800 space-y-1">
          {/* Share report link — uses current site domain */}
          {currentSite && (
            <Link
              href={`/r/${currentSite.domain}`}
              onClick={onClose}
              target="_blank"
              className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10"
            >
              <Share2 className="w-5 h-5" />
              <span className="font-medium">Share Report</span>
            </Link>
          )}

          <Link
            href="/leaderboard"
            onClick={onClose}
            target="_blank"
            className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-zinc-400 hover:text-white hover:bg-zinc-800/50"
          >
            <Trophy className="w-5 h-5" />
            <span className="font-medium">Leaderboard</span>
          </Link>

          <Link
            href="/settings"
            onClick={onClose}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              pathname.startsWith("/settings")
                ? "bg-emerald-500/10 text-emerald-400"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium">Settings</span>
          </Link>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-zinc-800 space-y-3">
        {/* Subscribe card for free users */}
        {nextPlan && plan === "free" && (
          <div className="rounded-xl p-3 space-y-2.5 bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-400">
                Subscribe to start
              </span>
            </div>
            <button
              onClick={() => checkout("scout", "yearly")}
              disabled={checkoutLoading}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {checkoutLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Get Scout — $39/mo
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        )}

        {/* Upgrade card for paid users */}
        {nextPlan && plan !== "free" && (
          <div className="rounded-xl p-3 bg-zinc-800/50 border border-zinc-700/50 space-y-2">
            <p className="text-xs font-medium text-white">
              {plan === "scout" ? "Unlock Full Intelligence" : "Get Maximum Coverage"}
            </p>
            <p className="text-[11px] text-zinc-400">
              {plan === "scout"
                ? "Action plans, full GEO audit & more"
                : "50 queries, 2x daily scans, highest limits"}
            </p>
            <button
              onClick={() => checkout(nextPlanId!, "yearly")}
              disabled={checkoutLoading}
              className="w-full flex items-center justify-center gap-2 py-1.5 px-3 bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {checkoutLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  {nextPlan.name} — ${nextPlan.yearlyPrice}/mo
                  <ArrowRight className="w-3 h-3" />
                </>
              )}
            </button>
          </div>
        )}

        {/* Plan badge for top-tier users */}
        {!nextPlan && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500">Plan</span>
            <Badge className="text-xs bg-amber-500">
              {CITATION_PLANS[plan as keyof typeof CITATION_PLANS]?.name || plan}
            </Badge>
          </div>
        )}

        {/* Links */}
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors"
        >
          <Home className="w-4 h-4" />
          Marketing Site
        </Link>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors w-full"
        >
          <LogOut className="w-4 h-4" />
          Log Out
        </button>
      </div>
    </div>
  );
}

// Header component
function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { currentSite } = useSite();

  const lastChecked = currentSite?.lastCheckedAt
    ? new Date(currentSite.lastCheckedAt)
    : null;

  const formatLastChecked = () => {
    if (!lastChecked) return "No checks yet";
    const now = new Date();
    const diffMs = now.getTime() - lastChecked.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    return `${diffDays}d ago`;
  };

  return (
    <header className="h-16 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-zinc-400 hover:text-white"
        >
          <Menu className="w-6 h-6" />
        </button>

        {currentSite && (
          <div className="hidden sm:block">
            <h1 className="text-white font-medium">{currentSite.domain}</h1>
            <p className="text-xs text-zinc-500">
              Last checked {formatLastChecked()}
            </p>
          </div>
        )}
      </div>
    </header>
  );
}

// Main layout
function DashboardLayoutInner({ children }: { children: ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { subscription, loading } = useSite();

  // Only billing & settings pages are accessible to free users (so they can upgrade)
  const exemptRoutes = ["/settings/billing", "/settings"];
  const isExemptRoute = exemptRoutes.some((r) => pathname?.startsWith(r));

  // Redirect free users to pricing page — don't show an inline paywall
  const shouldRedirect = !loading && subscription.isFreeUser && !isExemptRoute;

  useEffect(() => {
    if (shouldRedirect) {
      router.replace("/settings/billing");
    }
  }, [shouldRedirect, router]);

  // Show spinner while loading OR while redirect is pending
  const showSpinner = (loading || shouldRedirect) && !isExemptRoute;

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-64">
            <Sidebar mobile onClose={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setMobileMenuOpen(true)} />
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {showSpinner ? (
              <div className="flex items-center justify-center py-32">
                <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
              </div>
            ) : (
              children
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

// Export with provider
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <SiteProvider>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </SiteProvider>
  );
}
