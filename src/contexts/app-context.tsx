"use client";

/**
 * ============================================
 * UNIFIED APP CONTEXT - SINGLE SOURCE OF TRUTH
 * ============================================
 * 
 * This is THE ONLY data layer for user/org/site data.
 * All pages MUST use this context. No separate fetching.
 * 
 * Created from scratch for CabbageSEO GEO Machine.
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

// ============================================
// TYPES
// ============================================

interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: string;
  subscriptionStatus: string;
}

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

interface AppState {
  user: User | null;
  organization: Organization | null;
  sites: Site[];
  currentSite: Site | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

interface AppContextType extends AppState {
  selectSite: (siteId: string) => void;
  addSite: (url: string) => Promise<{ success: boolean; site?: Site; error?: string }>;
  updateSiteAutopilot: (siteId: string, enabled: boolean) => Promise<void>;
  refreshData: () => Promise<void>;
}

// ============================================
// CONTEXT
// ============================================

const AppContext = createContext<AppContextType | null>(null);

// ============================================
// STORAGE KEYS
// ============================================

const STORAGE_KEY_SITE_ID = "cabbageseo_current_site_id";
const STORAGE_KEY_SITES = "cabbageseo_sites_cache";

// ============================================
// PROVIDER
// ============================================

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    user: null,
    organization: null,
    sites: [],
    currentSite: null,
    isLoading: true,
    isInitialized: false,
    error: null,
  });

  // ============================================
  // FETCH ALL DATA FROM /api/me
  // ============================================
  
  const fetchData = useCallback(async (selectedSiteId?: string | null) => {
    console.log("[AppContext] Fetching data...", { selectedSiteId });
    
    try {
      // Build URL with optional siteId
      const url = selectedSiteId 
        ? `/api/me?siteId=${selectedSiteId}`
        : "/api/me";
      
      const response = await fetch(url, {
        credentials: "include",
        cache: "no-store",
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          // Not authenticated - clear state
          setState({
            user: null,
            organization: null,
            sites: [],
            currentSite: null,
            isLoading: false,
            isInitialized: true,
            error: null,
          });
          return;
        }
        throw new Error(`API error: ${response.status}`);
      }
      
      const json = await response.json();
      console.log("[AppContext] API response:", json);
      
      if (!json.authenticated) {
        setState({
          user: null,
          organization: null,
          sites: [],
          currentSite: null,
          isLoading: false,
          isInitialized: true,
          error: null,
        });
        return;
      }
      
      const { user, organization, sites: rawSites, currentSite: rawCurrentSite } = json;
      
      // Map sites to expected format
      const sites: Site[] = (rawSites || []).map((s: { 
        id: string; 
        domain: string; 
        name?: string;
        url?: string;
        geoScore?: number; 
        autopilotEnabled?: boolean;
        lastCrawlAt?: string;
        createdAt?: string;
      }) => ({
        id: s.id,
        domain: s.domain,
        name: s.name || s.domain,
        url: s.url || `https://${s.domain}`,
        geoScore: s.geoScore || null,
        autopilotEnabled: s.autopilotEnabled ?? false,
        lastCrawlAt: s.lastCrawlAt || null,
        createdAt: s.createdAt || new Date().toISOString(),
      }));
      
      const currentSite = rawCurrentSite ? {
        id: rawCurrentSite.id,
        domain: rawCurrentSite.domain,
        name: rawCurrentSite.name || rawCurrentSite.domain,
        url: rawCurrentSite.url || `https://${rawCurrentSite.domain}`,
        geoScore: rawCurrentSite.geoScore || null,
        autopilotEnabled: rawCurrentSite.autopilotEnabled ?? false,
        lastCrawlAt: rawCurrentSite.lastCrawlAt || null,
        createdAt: rawCurrentSite.createdAt || new Date().toISOString(),
      } : null;
      
      // Determine which site to show
      let siteToShow: Site | null = null;
      
      if (currentSite) {
        siteToShow = currentSite;
      } else if (sites && sites.length > 0) {
        // Check localStorage for previously selected
        const storedId = localStorage.getItem(STORAGE_KEY_SITE_ID);
        if (storedId) {
          siteToShow = sites.find((s: Site) => s.id === storedId) || sites[0];
        } else {
          siteToShow = sites[0];
        }
      }
      
      // Save sites to localStorage as backup
      if (sites && sites.length > 0) {
        localStorage.setItem(STORAGE_KEY_SITES, JSON.stringify(sites));
      }
      
      // Save current site ID
      if (siteToShow) {
        localStorage.setItem(STORAGE_KEY_SITE_ID, siteToShow.id);
      }
      
      setState({
        user,
        organization,
        sites: sites || [],
        currentSite: siteToShow,
        isLoading: false,
        isInitialized: true,
        error: null,
      });
      
      console.log("[AppContext] State updated:", { 
        sitesCount: sites?.length || 0, 
        currentSite: siteToShow?.domain 
      });
      
    } catch (error) {
      console.error("[AppContext] Fetch error:", error);
      
      // Try to restore from localStorage
      const cachedSites = localStorage.getItem(STORAGE_KEY_SITES);
      const cachedSiteId = localStorage.getItem(STORAGE_KEY_SITE_ID);
      
      if (cachedSites) {
        try {
          const sites = JSON.parse(cachedSites);
          const currentSite = cachedSiteId 
            ? sites.find((s: Site) => s.id === cachedSiteId) 
            : sites[0];
          
          setState(prev => ({
            ...prev,
            sites,
            currentSite,
            isLoading: false,
            isInitialized: true,
            error: "Using cached data",
          }));
          return;
        } catch (e) {
          console.error("[AppContext] Cache parse error:", e);
        }
      }
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        isInitialized: true,
        error: error instanceof Error ? error.message : "Failed to load data",
      }));
    }
  }, []);

  // ============================================
  // SELECT SITE
  // ============================================
  
  const selectSite = useCallback((siteId: string) => {
    console.log("[AppContext] Selecting site:", siteId);
    
    const site = state.sites.find(s => s.id === siteId);
    if (site) {
      localStorage.setItem(STORAGE_KEY_SITE_ID, siteId);
      setState(prev => ({ ...prev, currentSite: site }));
    }
  }, [state.sites]);

  // ============================================
  // ADD SITE
  // ============================================
  
  const addSite = useCallback(async (url: string): Promise<{ success: boolean; site?: Site; error?: string }> => {
    console.log("[AppContext] Adding site:", url);
    
    try {
      const response = await fetch("/api/me/site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
        credentials: "include",
      });
      
      const json = await response.json();
      
      if (!response.ok) {
        if (json.existingSiteId) {
          // Site already exists - select it
          selectSite(json.existingSiteId);
          await fetchData(json.existingSiteId);
          return { success: true };
        }
        return { success: false, error: json.error || "Failed to add site" };
      }
      
      if (json.success && json.site) {
        const rawSite = json.site;
        const newSite: Site = {
          id: rawSite.id,
          domain: rawSite.domain,
          name: rawSite.name || rawSite.domain,
          url: rawSite.url || `https://${rawSite.domain}`,
          geoScore: rawSite.geoScore || null,
          autopilotEnabled: rawSite.autopilotEnabled ?? false,
          lastCrawlAt: rawSite.lastCrawlAt || null,
          createdAt: rawSite.createdAt || new Date().toISOString(),
        };
        
        // Update state immediately
        setState(prev => ({
          ...prev,
          sites: [newSite, ...prev.sites],
          currentSite: newSite,
        }));
        
        // Save to localStorage
        localStorage.setItem(STORAGE_KEY_SITE_ID, newSite.id);
        const updatedSites = [newSite, ...state.sites];
        localStorage.setItem(STORAGE_KEY_SITES, JSON.stringify(updatedSites));
        
        console.log("[AppContext] Site added successfully:", newSite.domain);
        
        return { success: true, site: newSite };
      }
      
      return { success: false, error: "Invalid response" };
      
    } catch (error) {
      console.error("[AppContext] Add site error:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to add site" 
      };
    }
  }, [state.sites, selectSite, fetchData]);

  // ============================================
  // UPDATE AUTOPILOT
  // ============================================
  
  const updateSiteAutopilot = useCallback(async (siteId: string, enabled: boolean) => {
    console.log("[AppContext] Updating autopilot:", { siteId, enabled });
    
    try {
      const response = await fetch("/api/me/site", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId,
          updates: { autopilot_enabled: enabled },
        }),
        credentials: "include",
      });
      
      if (response.ok) {
        // Update state
        setState(prev => ({
          ...prev,
          sites: prev.sites.map(s => 
            s.id === siteId ? { ...s, autopilotEnabled: enabled } : s
          ),
          currentSite: prev.currentSite?.id === siteId 
            ? { ...prev.currentSite, autopilotEnabled: enabled }
            : prev.currentSite,
        }));
      }
    } catch (error) {
      console.error("[AppContext] Update autopilot error:", error);
    }
  }, []);

  // ============================================
  // REFRESH DATA
  // ============================================
  
  const refreshData = useCallback(async () => {
    const currentId = state.currentSite?.id || localStorage.getItem(STORAGE_KEY_SITE_ID);
    await fetchData(currentId);
  }, [state.currentSite?.id, fetchData]);

  // ============================================
  // INITIALIZE ON MOUNT
  // ============================================
  
  useEffect(() => {
    // Get stored site ID first
    const storedSiteId = localStorage.getItem(STORAGE_KEY_SITE_ID);
    fetchData(storedSiteId);
  }, [fetchData]);

  // ============================================
  // CONTEXT VALUE
  // ============================================
  
  const value: AppContextType = {
    ...state,
    selectSite,
    addSite,
    updateSiteAutopilot,
    refreshData,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

// ============================================
// HOOKS
// ============================================

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
}

// Convenience hook for site data (for pages that just need site)
export function useSite() {
  const { currentSite, sites, selectSite, addSite, isLoading, refreshData } = useApp();
  return {
    selectedSite: currentSite,
    sites,
    selectSite,
    addSite,
    isLoading,
    refreshSites: refreshData,
  };
}

