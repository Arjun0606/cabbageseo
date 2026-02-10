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

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Zap,
  FileText,
  Settings,
  Menu,
  X,
  Home,
  ChevronDown,
  LogOut,
  Plus,
  Loader2,
  ArrowRight,
  Clock,
} from "lucide-react";
import { SiteProvider, useSite } from "@/context/site-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { TrialExpiredPaywall } from "@/components/paywall/trial-expired";
import { useCheckout } from "@/hooks/use-checkout";
import { CITATION_PLANS, getNextPlan, TRIAL_DAYS } from "@/lib/billing/citation-plans";

// Navigation items — simplified 3-item nav
const navItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/dashboard/actions", label: "Actions", icon: Zap },
  { href: "/dashboard/pages", label: "Pages", icon: FileText },
];

// Sidebar component
function Sidebar({ mobile, onClose }: { mobile?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { organization, currentSite, sites, trial, setCurrentSite } = useSite();
  const [sitesOpen, setSitesOpen] = useState(false);
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

      {/* Site selector */}
      {currentSite && (
        <div className="p-4 border-b border-zinc-800">
          <button 
            onClick={() => setSitesOpen(!sitesOpen)}
            className="w-full flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-white text-sm font-medium truncate">
                {currentSite.domain}
              </span>
            </div>
            <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${sitesOpen ? "rotate-180" : ""}`} />
          </button>
          
          {sitesOpen && (
            <div className="mt-2 space-y-1">
              {sites.filter(s => s.id !== currentSite.id).map(site => (
                <button
                  key={site.id}
                  onClick={() => {
                    setCurrentSite(site);
                    setSitesOpen(false);
                    if (onClose) onClose();
                  }}
                  className="block w-full text-left p-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg"
                >
                  {site.domain}
                </button>
              ))}
              <Link
                href="/onboarding"
                onClick={() => {
                  setSitesOpen(false);
                  if (onClose) onClose();
                }}
                className="flex items-center gap-2 p-2 text-sm text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg"
              >
                <Plus className="w-4 h-4" />
                Add site
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
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
        
        <div className="pt-4 mt-4 border-t border-zinc-800">
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
        {/* Upgrade card */}
        {nextPlan && plan === "free" && (
          <div className={`rounded-xl p-3 space-y-2.5 ${
            trial.daysRemaining <= 2
              ? "bg-red-500/10 border border-red-500/20"
              : "bg-amber-500/10 border border-amber-500/20"
          }`}>
            <div className="flex items-center gap-2">
              <Clock className={`w-3.5 h-3.5 ${trial.daysRemaining <= 2 ? "text-red-400" : "text-amber-400"}`} />
              <span className={`text-xs font-semibold ${trial.daysRemaining <= 2 ? "text-red-400" : "text-amber-400"}`}>
                {trial.daysRemaining <= 0 ? "Trial ended" : `${trial.daysRemaining} day${trial.daysRemaining !== 1 ? "s" : ""} left`}
              </span>
            </div>
            <Progress
              value={(trial.daysUsed / TRIAL_DAYS) * 100}
              className={`h-1.5 ${trial.daysRemaining <= 2 ? "bg-red-900/50" : "bg-amber-900/50"}`}
            />
            <button
              onClick={() => checkout("scout", "yearly")}
              disabled={checkoutLoading}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {checkoutLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Upgrade to Scout
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        )}

        {nextPlan && plan !== "free" && (
          <div className="rounded-xl p-3 bg-zinc-800/50 border border-zinc-700/50 space-y-2">
            <p className="text-xs font-medium text-white">
              {plan === "scout" ? "Unlock AI Tools" : "Go Unlimited"}
            </p>
            <p className="text-[11px] text-zinc-400">
              {plan === "scout"
                ? "Weekly playbooks & competitor deep dives"
                : "25 sites, unlimited everything"}
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
  const { currentSite, runCheck, trial, organization } = useSite();
  const [checking, setChecking] = useState(false);

  const handleCheck = async () => {
    if (!currentSite) return;
    setChecking(true);
    await runCheck(currentSite.id);
    setChecking(false);
  };

  const isPaid = organization?.plan && organization.plan !== "free";
  const showTrialBanner = trial.isTrialUser && !trial.expired && !isPaid;
  const urgent = trial.daysRemaining <= 2;

  return (
    <>
      {/* Trial countdown banner */}
      {showTrialBanner && (
        <div className={`px-4 py-2 text-center text-sm font-medium border-b ${
          urgent
            ? "bg-red-500/10 border-red-500/20 text-red-400"
            : "bg-amber-500/10 border-amber-500/20 text-amber-400"
        }`}>
          {urgent ? (
            <>
              {trial.daysRemaining === 0 ? "Last day" : `${trial.daysRemaining} day${trial.daysRemaining !== 1 ? "s" : ""} left`} on your free trial —{" "}
              <Link href="/settings/billing" className="underline font-semibold hover:text-white">
                Upgrade now to keep your data
              </Link>
            </>
          ) : (
            <>
              {trial.daysRemaining} day{trial.daysRemaining !== 1 ? "s" : ""} left in your free trial —{" "}
              <Link href="/settings/billing" className="underline hover:text-white">
                Upgrade to Scout
              </Link>
            </>
          )}
        </div>
      )}
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
                AI Revenue Tracking
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {currentSite && (
            <Button
              onClick={handleCheck}
              disabled={checking}
              size="sm"
              className="bg-emerald-500 hover:bg-emerald-400 text-black"
            >
              {checking ? "Checking..." : "Check Now"}
            </Button>
          )}
        </div>
      </header>
    </>
  );
}

// Main layout
function DashboardLayoutInner({ children }: { children: ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { trial, loading } = useSite();

  // Show paywall when trial expired (allow billing/settings for upgrade)
  const exemptRoutes = ["/settings/billing", "/settings", "/onboarding"];
  const isExemptRoute = exemptRoutes.some((r) => pathname?.startsWith(r));
  const showPaywall = !loading && trial.isTrialUser && trial.expired && !isExemptRoute;

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
          <div className="max-w-6xl mx-auto">
            {showPaywall ? <TrialExpiredPaywall /> : children}
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
