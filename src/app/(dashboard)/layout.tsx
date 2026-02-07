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
  Search,
  TrendingUp,
  FileText,
  Settings,
  Menu,
  X,
  Home,
  ChevronDown,
  LogOut
} from "lucide-react";
import { SiteProvider, useSite } from "@/context/site-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

// Navigation items - Simplified, sprint-focused
const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/sources", label: "Trust Map", icon: Search },
  { href: "/dashboard/intelligence", label: "Intelligence", icon: TrendingUp },
  { href: "/dashboard/pages", label: "Pages", icon: FileText },
];

// Sidebar component
function Sidebar({ mobile, onClose }: { mobile?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { organization, currentSite, sites } = useSite();
  const [sitesOpen, setSitesOpen] = useState(false);

  const plan = organization?.plan || "free";

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
          
          {sitesOpen && sites.length > 1 && (
            <div className="mt-2 space-y-1">
              {sites.filter(s => s.id !== currentSite.id).map(site => (
                <Link
                  key={site.id}
                  href={`/dashboard?site=${site.id}`}
                  onClick={() => {
                    setSitesOpen(false);
                    if (onClose) onClose();
                  }}
                  className="block p-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg"
                >
                  {site.domain}
                </Link>
              ))}
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
        {/* Plan badge */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-500">Plan</span>
          <Badge className={`text-xs ${
            plan === "dominate" ? "bg-amber-500" :
            plan === "command" ? "bg-violet-500" :
            plan === "scout" ? "bg-emerald-500" :
            "bg-zinc-600"
          }`}>
            {plan.charAt(0).toUpperCase() + plan.slice(1)}
          </Badge>
        </div>
        
        {/* Links */}
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors"
        >
          <Home className="w-4 h-4" />
          Back to Home
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
  const { currentSite, runCheck } = useSite();
  const [checking, setChecking] = useState(false);

  const handleCheck = async () => {
    if (!currentSite) return;
    setChecking(true);
    await runCheck(currentSite.id);
    setChecking(false);
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
  );
}

// Main layout
function DashboardLayoutInner({ children }: { children: ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
            {children}
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
