"use client";

/**
 * ============================================
 * SIMPLE SITE HOOK - Uses localStorage
 * ============================================
 * 
 * This provides site data to pages that need it.
 * Fetches directly from /api/me and localStorage.
 * NO context, NO provider, just a hook.
 */

import { useState, useEffect, useCallback } from "react";

// ============================================
// TYPES
// ============================================

export interface Site {
  id: string;
  domain: string;
  name: string;
  url: string;
  geoScore: number | null;
  autopilotEnabled: boolean;
  lastCrawlAt: string | null;
  createdAt: string;
}

interface SiteHookResult {
  selectedSite: Site | null;
  sites: Site[];
  isLoading: boolean;
  selectSite: (siteId: string) => void;
  addSite: (url: string) => Promise<{ success: boolean; site?: Site; error?: string }>;
  refreshSites: () => Promise<void>;
}

// ============================================
// STORAGE
// ============================================

const SITE_KEY = "cabbageseo_site";
const SITES_KEY = "cabbageseo_sites";

function saveSiteToStorage(site: Site) {
  try {
    localStorage.setItem(SITE_KEY, JSON.stringify(site));
  } catch {}
}

function loadSiteFromStorage(): Site | null {
  try {
    const data = localStorage.getItem(SITE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

function saveSitesToStorage(sites: Site[]) {
  try {
    localStorage.setItem(SITES_KEY, JSON.stringify(sites));
  } catch {}
}

function loadSitesFromStorage(): Site[] {
  try {
    const data = localStorage.getItem(SITES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// ============================================
// THE HOOK
// ============================================

export function useSite(): SiteHookResult {
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch from API
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const res = await fetch("/api/me", { credentials: "include" });
      const data = await res.json();
      
      if (data.authenticated && data.sites && data.sites.length > 0) {
        // Map API response to Site type
        const mappedSites: Site[] = data.sites.map((s: {
          id: string;
          domain: string;
          name?: string;
          url?: string;
          geoScore?: number;
          autopilotEnabled?: boolean;
        }) => ({
          id: s.id,
          domain: s.domain,
          name: s.name || s.domain,
          url: s.url || `https://${s.domain}`,
          geoScore: s.geoScore || null,
          autopilotEnabled: s.autopilotEnabled ?? false,
          lastCrawlAt: null,
          createdAt: new Date().toISOString(),
        }));
        
        setSites(mappedSites);
        saveSitesToStorage(mappedSites);
        
        // Set current site
        const cachedSite = loadSiteFromStorage();
        const currentSite = cachedSite 
          ? mappedSites.find(s => s.id === cachedSite.id) || mappedSites[0]
          : mappedSites[0];
        
        setSelectedSite(currentSite);
        saveSiteToStorage(currentSite);
      } else {
        // Try localStorage
        const cachedSites = loadSitesFromStorage();
        const cachedSite = loadSiteFromStorage();
        
        if (cachedSites.length > 0) {
          setSites(cachedSites);
          setSelectedSite(cachedSite || cachedSites[0]);
        }
      }
    } catch (err) {
      console.error("[useSite] Fetch error:", err);
      
      // Fallback to localStorage
      const cachedSites = loadSitesFromStorage();
      const cachedSite = loadSiteFromStorage();
      
      if (cachedSites.length > 0) {
        setSites(cachedSites);
        setSelectedSite(cachedSite || cachedSites[0]);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Select site
  const selectSite = useCallback((siteId: string) => {
    const site = sites.find(s => s.id === siteId);
    if (site) {
      setSelectedSite(site);
      saveSiteToStorage(site);
    }
  }, [sites]);

  // Add site
  const addSite = useCallback(async (url: string): Promise<{ success: boolean; site?: Site; error?: string }> => {
    try {
      const res = await fetch("/api/me/site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
        credentials: "include",
      });
      
      const data = await res.json();
      
      if (data.success && data.site) {
        const newSite: Site = {
          id: data.site.id,
          domain: data.site.domain,
          name: data.site.name || data.site.domain,
          url: data.site.url || `https://${data.site.domain}`,
          geoScore: data.site.geoScore || null,
          autopilotEnabled: data.site.autopilotEnabled ?? false,
          lastCrawlAt: null,
          createdAt: new Date().toISOString(),
        };
        
        const updatedSites = [newSite, ...sites];
        setSites(updatedSites);
        setSelectedSite(newSite);
        saveSitesToStorage(updatedSites);
        saveSiteToStorage(newSite);
        
        return { success: true, site: newSite };
      }
      
      return { success: false, error: data.error || "Failed to add site" };
    } catch (err) {
      return { success: false, error: "Network error" };
    }
  }, [sites]);

  return {
    selectedSite,
    sites,
    isLoading,
    selectSite,
    addSite,
    refreshSites: fetchData,
  };
}

// ============================================
// BACKWARDS COMPATIBILITY - useApp
// ============================================

export function useApp() {
  const siteHook = useSite();
  return {
    currentSite: siteHook.selectedSite,
    sites: siteHook.sites,
    isLoading: siteHook.isLoading,
    isInitialized: !siteHook.isLoading,
    user: null,
    organization: null,
    error: null,
    selectSite: siteHook.selectSite,
    addSite: siteHook.addSite,
    updateSiteAutopilot: async () => {},
    refreshData: siteHook.refreshSites,
  };
}

// ============================================
// DUMMY PROVIDER (for backwards compatibility)
// ============================================

import { ReactNode } from "react";

export function AppProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
