"use client";

/**
 * ============================================
 * SITE SWITCHER - REBUILT FROM SCRATCH
 * ============================================
 * 
 * Uses localStorage for site data.
 * Plan-aware: Starter = 1 site, Pro = 3 sites, Pro+ = unlimited.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Globe, ChevronDown, Plus, Check, ExternalLink, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ============================================
// STORAGE
// ============================================

const SITE_KEY = "cabbageseo_site";

function loadSite(): { id: string; domain: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const data = localStorage.getItem(SITE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

// ============================================
// SITE SWITCHER
// ============================================

export function SiteSwitcher() {
  const router = useRouter();
  const [site, setSite] = useState<{ id: string; domain: string } | null>(null);
  const [plan, setPlan] = useState("starter");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load site from localStorage
    const cachedSite = loadSite();
    setSite(cachedSite);
    
    // Fetch plan from API
    fetch("/api/me", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        setPlan(data.organization?.plan || "starter");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Plan-based site limits
  const siteLimits: Record<string, number> = {
    starter: 1,
    pro: 3,
    "pro-plus": 999,
  };
  
  const maxSites = siteLimits[plan] || 1;
  const canAddMore = maxSites > 1; // For now, only show add for Pro+

  if (loading) {
    return (
      <Button variant="outline" size="sm" disabled className="w-[180px] justify-between bg-zinc-900/50 border-zinc-700">
        <Loader2 className="w-4 h-4 mr-2 animate-spin text-zinc-400" />
        <span className="text-zinc-400">Loading...</span>
      </Button>
    );
  }

  // No site yet - show add button
  if (!site) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => router.push("/dashboard")}
        className="border-emerald-600 text-emerald-400 hover:bg-emerald-600/10"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Site
      </Button>
    );
  }

  // Starter plan with 1 site - just show the site (no dropdown)
  if (plan === "starter") {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-zinc-900/50 border border-zinc-700">
        <Globe className="w-4 h-4 text-emerald-400" />
        <span className="text-white font-medium text-sm truncate max-w-[150px]">{site.domain}</span>
        <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px]">Active</Badge>
      </div>
    );
  }

  // Pro/Pro+ - full dropdown with ability to add more sites
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-[200px] justify-between bg-zinc-900 border-zinc-700 hover:bg-zinc-800"
        >
          <div className="flex items-center gap-2 truncate">
            <Globe className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="truncate">{site.domain}</span>
          </div>
          <ChevronDown className="w-4 h-4 text-zinc-400" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="start" className="w-[250px] bg-zinc-900 border-zinc-700">
        <DropdownMenuLabel className="text-xs text-zinc-400 font-normal">
          Your Sites
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-zinc-800" />
        
        {/* Current site */}
        <DropdownMenuItem className="cursor-pointer hover:bg-zinc-800 focus:bg-zinc-800">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <Check className="w-4 h-4 text-emerald-400" />
              <div>
                <div className="font-medium">{site.domain}</div>
                <div className="text-xs text-zinc-400">Current site</div>
              </div>
            </div>
            <a 
              href={`https://${site.domain}`} 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-zinc-400 hover:text-zinc-300"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </DropdownMenuItem>
        
        {canAddMore && (
          <>
            <DropdownMenuSeparator className="bg-zinc-800" />
            <DropdownMenuItem
              onClick={() => router.push("/dashboard?add=true")}
              className="cursor-pointer hover:bg-zinc-800 focus:bg-zinc-800 text-emerald-400"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Another Site
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
