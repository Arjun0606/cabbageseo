"use client";

/**
 * ============================================
 * APP CONTEXT - SIMPLIFIED
 * ============================================
 * 
 * Provides a simple hook for site data.
 * Uses localStorage as primary source.
 */

import { useState, useEffect, useCallback } from "react";

// ============================================
// TYPES
// ============================================

export interface Site {
  id: string;
  domain: string;
  geoScore?: number;
  autopilotEnabled?: boolean;
}

interface SiteContextValue {
  sites: Site[];
  selectedSite: Site | null;
  selectSite: (siteId: string) => void;
  refreshSites: () => Promise<void>;
  isLoading: boolean;
}

// ============================================
// STORAGE
// ============================================

const SITE_KEY = "cabbageseo_site";

function loadSiteFromStorage(): Site | null {
  if (typeof window === "undefined") return null;
  try {
    const data = localStorage.getItem(SITE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

function saveSiteToStorage(site: Site) {
  try {
    localStorage.setItem(SITE_KEY, JSON.stringify(site));
  } catch {}
}

// ============================================
// HOOK
// ============================================

export function useSite(): SiteContextValue {
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load on mount
  useEffect(() => {
    // First try localStorage
    const cachedSite = loadSiteFromStorage();
    if (cachedSite) {
      setSelectedSite(cachedSite);
      setSites([cachedSite]);
    }

    // Then fetch from API
    fetch("/api/me", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        if (data.sites && data.sites.length > 0) {
          const apiSites: Site[] = data.sites.map((s: Record<string, unknown>) => ({
            id: s.id as string,
            domain: s.domain as string,
            geoScore: s.geoScore as number | undefined,
            autopilotEnabled: s.autopilotEnabled as boolean | undefined,
          }));
          setSites(apiSites);
          
          // If no cached site, use first from API
          if (!cachedSite && apiSites.length > 0) {
            setSelectedSite(apiSites[0]);
            saveSiteToStorage(apiSites[0]);
          }
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  // Select site
  const selectSite = useCallback((siteId: string) => {
    const site = sites.find(s => s.id === siteId);
    if (site) {
      setSelectedSite(site);
      saveSiteToStorage(site);
    }
  }, [sites]);

  // Refresh sites
  const refreshSites = useCallback(async () => {
    try {
      const res = await fetch("/api/me", { credentials: "include" });
      const data = await res.json();
      if (data.sites) {
        const apiSites: Site[] = data.sites.map((s: Record<string, unknown>) => ({
          id: s.id as string,
          domain: s.domain as string,
          geoScore: s.geoScore as number | undefined,
          autopilotEnabled: s.autopilotEnabled as boolean | undefined,
        }));
        setSites(apiSites);
      }
    } catch {}
  }, []);

  return {
    sites,
    selectedSite,
    selectSite,
    refreshSites,
    isLoading,
  };
}
