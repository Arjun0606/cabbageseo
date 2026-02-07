"use client";

/**
 * ============================================
 * SITE SWITCHER - FIXED VERSION
 * ============================================
 * 
 * Loads sites from API, not localStorage.
 * Properly handles loading and empty states.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Globe, ChevronDown, Plus, Check, ExternalLink, Loader2 } from "lucide-react";
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

interface Site {
  id: string;
  domain: string;
  totalCitations?: number;
}

export function SiteSwitcher() {
  const router = useRouter();
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [plan, setPlan] = useState("free");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch from /api/me to get all user data
        const res = await fetch("/api/me", { credentials: "include" });
        const data = await res.json();
        
        if (data.authenticated && data.sites) {
          setSites(data.sites);
          // Select first site or saved site
          const savedSiteId = localStorage.getItem("cabbageseo_site_id");
          const savedSite = data.sites.find((s: Site) => s.id === savedSiteId);
          setSelectedSite(savedSite || data.sites[0] || null);
        }
        
        setPlan(data.organization?.plan || "free");
      } catch (e) {
        console.error("SiteSwitcher load error:", e);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, []);

  // Save selected site to localStorage when it changes
  useEffect(() => {
    if (selectedSite?.id) {
      localStorage.setItem("cabbageseo_site_id", selectedSite.id);
      // Dispatch event so dashboard can react
      window.dispatchEvent(new CustomEvent("site-changed", { detail: selectedSite }));
    }
  }, [selectedSite]);

  const canAddMore = plan === "command" || plan === "dominate";
  const siteLimit = plan === "dominate" ? 25 : plan === "command" ? 5 : 1;

  if (loading) {
    return (
      <Button variant="outline" size="sm" disabled className="w-[180px] justify-between bg-zinc-900/50 border-zinc-700">
        <Loader2 className="w-4 h-4 mr-2 animate-spin text-zinc-400" />
        <span className="text-zinc-400">Loading...</span>
      </Button>
    );
  }

  // No sites - show add button
  if (!selectedSite || sites.length === 0) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => router.push("/dashboard")}
        className="border-emerald-600 text-emerald-400 hover:bg-emerald-600/10"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Your Website
      </Button>
    );
  }

  // Single site and can't add more - just show the site
  if (sites.length === 1 && !canAddMore) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/50 border border-zinc-700">
        <Globe className="w-4 h-4 text-emerald-400" />
        <span className="text-white font-medium text-sm truncate max-w-[150px]">{selectedSite.domain}</span>
        <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px] border-0">Active</Badge>
      </div>
    );
  }

  // Multiple sites or can add more - show dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-[220px] justify-between bg-zinc-900 border-zinc-700 hover:bg-zinc-800"
        >
          <div className="flex items-center gap-2 truncate">
            <Globe className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="truncate">{selectedSite.domain}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px] border-0">Active</Badge>
            <ChevronDown className="w-4 h-4 text-zinc-400" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="start" className="w-[260px] bg-zinc-900 border-zinc-700">
        <DropdownMenuLabel className="text-xs text-zinc-400 font-normal">
          Your Sites ({sites.length}/{siteLimit})
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-zinc-800" />
        
        {sites.map((site) => (
          <DropdownMenuItem 
            key={site.id}
            onClick={() => setSelectedSite(site)}
            className="cursor-pointer hover:bg-zinc-800 focus:bg-zinc-800"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                {site.id === selectedSite?.id ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <div className="w-4 h-4" />
                )}
                <div>
                  <div className="font-medium">{site.domain}</div>
                  <div className="text-xs text-zinc-500">
                    {site.totalCitations || 0} citations
                  </div>
                </div>
              </div>
              <a 
                href={`https://${site.domain}`} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-zinc-500 hover:text-zinc-300"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </DropdownMenuItem>
        ))}
        
        {(canAddMore || sites.length < siteLimit) && (
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
