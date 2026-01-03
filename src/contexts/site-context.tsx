"use client";

/**
 * Site Context - Provides site data to the entire app
 * 
 * Uses /api/me as single source of truth
 */

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";

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
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch sites from /api/me
  const refreshSites = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const res = await fetch("/api/me");
      const data = await res.json();
      
      if (data.authenticated && data.currentSite) {
        const site: Site = {
          id: data.currentSite.id,
          domain: data.currentSite.domain,
          seoScore: data.currentSite.geoScore || null,
          aioScore: data.currentSite.geoScore || null,
          pagesCount: 0,
          lastAuditAt: null,
        };
        setSites([site]);
        
        // Auto-select if no selection
        if (!selectedSiteId) {
          setSelectedSiteId(site.id);
          localStorage.setItem("selectedSiteId", site.id);
        }
      } else if (data.authenticated && data.sites && data.sites.length > 0) {
        const mappedSites: Site[] = data.sites.map((s: {
          id: string;
          domain: string;
          geoScore?: number;
        }) => ({
          id: s.id,
          domain: s.domain,
          seoScore: s.geoScore || null,
          aioScore: s.geoScore || null,
          pagesCount: 0,
          lastAuditAt: null,
        }));
        setSites(mappedSites);
        
        if (!selectedSiteId && mappedSites.length > 0) {
          setSelectedSiteId(mappedSites[0].id);
          localStorage.setItem("selectedSiteId", mappedSites[0].id);
        }
      } else {
        setSites([]);
      }
    } catch (e) {
      console.error("[SiteContext] Error:", e);
      setError("Failed to load sites");
    } finally {
      setIsLoading(false);
    }
  }, [selectedSiteId]);

  // Load on mount
  useEffect(() => {
    // Try to restore selection from localStorage
    const stored = localStorage.getItem("selectedSiteId");
    if (stored) {
      setSelectedSiteId(stored);
    }
    
    refreshSites();
  }, []);

  // Select site
  function selectSite(siteId: string) {
    setSelectedSiteId(siteId);
    localStorage.setItem("selectedSiteId", siteId);
  }

  const selectedSite = sites.find(s => s.id === selectedSiteId) || (sites.length > 0 ? sites[0] : null);

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
