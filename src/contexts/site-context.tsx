"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useSearchParams } from "next/navigation";

// ============================================
// TYPES
// ============================================

export interface Site {
  id: string;
  domain: string;
  seoScore: number | null;
  aioScore: number | null;
  pagesCount: number;
  lastAuditAt: string | null;
}

interface SiteContextType {
  sites: Site[];
  selectedSite: Site | null;
  isLoading: boolean;
  error: string | null;
  selectSite: (siteId: string) => void;
  refreshSites: () => Promise<void>;
}

// ============================================
// CONTEXT
// ============================================

const SiteContext = createContext<SiteContextType | undefined>(undefined);

// ============================================
// PROVIDER
// ============================================

export function SiteProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch sites on mount
  useEffect(() => {
    refreshSites();
  }, []);

  // Read site from URL query params (priority over localStorage)
  useEffect(() => {
    const urlSiteId = searchParams.get("site");
    if (urlSiteId) {
      setSelectedSiteId(urlSiteId);
      localStorage.setItem("selectedSiteId", urlSiteId);
      return;
    }
    
    // Fallback to localStorage if no URL param
    const stored = localStorage.getItem("selectedSiteId");
    if (stored && !selectedSiteId) {
      setSelectedSiteId(stored);
    }
  }, [searchParams, selectedSiteId]);

  // Auto-select first site if none selected, or clear selection if selected site no longer exists
  useEffect(() => {
    if (!isLoading) {
      if (selectedSiteId) {
        // Check if selected site still exists
        const siteExists = sites.some(s => s.id === selectedSiteId);
        if (!siteExists && sites.length > 0) {
          // Selected site was deleted, switch to first available
          selectSite(sites[0].id);
        } else if (!siteExists && sites.length === 0) {
          // No sites left, clear selection
          setSelectedSiteId(null);
          localStorage.removeItem("selectedSiteId");
        }
      } else if (sites.length > 0) {
        // No selection, pick first site
        selectSite(sites[0].id);
      }
    }
  }, [sites, selectedSiteId, isLoading]);

  async function refreshSites() {
    setIsLoading(true);
    setError(null);
    
    try {
      const res = await fetch("/api/sites");
      if (!res.ok) {
        throw new Error("Failed to fetch sites");
      }
      
      const data = await res.json();
      if (data.success && data.data?.sites) {
        // API returns camelCase field names
        const mappedSites: Site[] = data.data.sites.map((s: {
          id: string;
          domain: string;
          seoScore?: number;
          aioScore?: number;
          pagesCount?: number;
          lastCrawlAt?: string;
        }) => ({
          id: s.id,
          domain: s.domain,
          seoScore: s.seoScore ?? null,
          aioScore: s.aioScore ?? null,
          pagesCount: s.pagesCount ?? 0,
          lastAuditAt: s.lastCrawlAt ?? null,
        }));
        setSites(mappedSites);
      }
    } catch (e) {
      console.error("Failed to fetch sites:", e);
      setError(e instanceof Error ? e.message : "Failed to load sites");
    } finally {
      setIsLoading(false);
    }
  }

  function selectSite(siteId: string) {
    setSelectedSiteId(siteId);
    localStorage.setItem("selectedSiteId", siteId);
  }

  const selectedSite = sites.find(s => s.id === selectedSiteId) || null;

  return (
    <SiteContext.Provider
      value={{
        sites,
        selectedSite,
        isLoading,
        error,
        selectSite,
        refreshSites,
      }}
    >
      {children}
    </SiteContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

export function useSite() {
  const context = useContext(SiteContext);
  if (context === undefined) {
    throw new Error("useSite must be used within a SiteProvider");
  }
  return context;
}

