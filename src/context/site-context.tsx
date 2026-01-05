"use client";

/**
 * ============================================
 * SITE CONTEXT - Single Source of Truth
 * ============================================
 * 
 * Provides site data, user data, and trial status
 * to ALL dashboard pages. No more prop drilling
 * or localStorage nonsense.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { TRIAL_DAYS, checkTrialStatus, canAccessProduct } from "@/lib/billing/citation-plans";

// ============================================
// TYPES
// ============================================

interface Site {
  id: string;
  domain: string;
  name?: string;
  totalCitations: number;
  citationsThisWeek: number;
  citationsLastWeek: number;
  lastCheckedAt: string | null;
  geoScore?: number;
}

interface User {
  id: string;
  email: string;
  name: string;
}

interface Organization {
  id: string;
  plan: string;
  status: string;
  createdAt: string;
}

interface Usage {
  checksUsed: number;
  checksLimit: number;
  sitesUsed: number;
  sitesLimit: number;
  competitorsUsed: number;
  competitorsLimit: number;
}

interface TrialStatus {
  isTrialUser: boolean;
  expired: boolean;
  daysRemaining: number;
  daysUsed: number;
}

interface SiteContextType {
  // Data
  user: User | null;
  organization: Organization | null;
  sites: Site[];
  currentSite: Site | null;
  usage: Usage;
  trial: TrialStatus;
  
  // State
  loading: boolean;
  error: string | null;
  
  // Actions
  setCurrentSite: (site: Site) => void;
  refreshData: () => Promise<void>;
  addSite: (domain: string) => Promise<Site | null>;
  deleteSite: (siteId: string) => Promise<boolean>;
  runCheck: (siteId?: string) => Promise<boolean>;
}

const defaultUsage: Usage = {
  checksUsed: 0,
  checksLimit: 100,
  sitesUsed: 0,
  sitesLimit: 3,
  competitorsUsed: 0,
  competitorsLimit: 2,
};

const defaultTrial: TrialStatus = {
  isTrialUser: false,
  expired: false,
  daysRemaining: TRIAL_DAYS,
  daysUsed: 0,
};

// ============================================
// CONTEXT
// ============================================

const SiteContext = createContext<SiteContextType | undefined>(undefined);

export function SiteProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  
  // State
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [currentSite, setCurrentSiteState] = useState<Site | null>(null);
  const [usage, setUsage] = useState<Usage>(defaultUsage);
  const [trial, setTrial] = useState<TrialStatus>(defaultTrial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================
  // DATA LOADING
  // ============================================

  const refreshData = useCallback(async () => {
    try {
      setError(null);
      
      // Fetch user data
      const meRes = await fetch("/api/me");
      const meData = await meRes.json();
      
      if (!meData.authenticated) {
        router.push("/login");
        return;
      }
      
      setUser(meData.user);
      setOrganization(meData.organization);
      
      // Calculate trial status
      if (meData.organization) {
        const isTrialUser = meData.organization.plan === "free";
        const trialStatus = checkTrialStatus(meData.organization.createdAt || new Date().toISOString());
        setTrial({
          isTrialUser,
          expired: isTrialUser && trialStatus.expired,
          daysRemaining: trialStatus.daysRemaining,
          daysUsed: trialStatus.daysUsed,
        });
      }
      
      // Fetch sites
      const sitesRes = await fetch("/api/sites");
      const sitesData = await sitesRes.json();
      const siteList: Site[] = (sitesData.sites || []).map((s: any) => ({
        id: s.id,
        domain: s.domain,
        name: s.name,
        totalCitations: s.total_citations || 0,
        citationsThisWeek: s.citations_this_week || 0,
        citationsLastWeek: s.citations_last_week || 0,
        lastCheckedAt: s.last_checked_at,
        geoScore: s.geo_score_avg,
      }));
      
      setSites(siteList);
      
      // Set current site
      const savedSiteId = localStorage.getItem("cabbageseo_site_id");
      const savedSite = siteList.find(s => s.id === savedSiteId);
      if (savedSite) {
        setCurrentSiteState(savedSite);
      } else if (siteList.length > 0) {
        setCurrentSiteState(siteList[0]);
        localStorage.setItem("cabbageseo_site_id", siteList[0].id);
      }
      
      // Fetch usage
      const usageRes = await fetch("/api/billing/usage");
      if (usageRes.ok) {
        const usageData = await usageRes.json();
        setUsage({
          checksUsed: usageData.data?.usage?.checksUsed || 0,
          checksLimit: usageData.data?.limits?.checks || 100,
          sitesUsed: siteList.length,
          sitesLimit: usageData.data?.limits?.sites || 3,
          competitorsUsed: usageData.data?.usage?.competitorsUsed || 0,
          competitorsLimit: usageData.data?.limits?.competitors || 2,
        });
      }
    } catch (err) {
      console.error("SiteContext refresh error:", err);
      setError("Failed to load data. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  // ============================================
  // ACTIONS
  // ============================================

  const setCurrentSite = useCallback((site: Site) => {
    setCurrentSiteState(site);
    localStorage.setItem("cabbageseo_site_id", site.id);
  }, []);

  const addSite = useCallback(async (domain: string): Promise<Site | null> => {
    try {
      // Clean domain
      let cleanDomain = domain.trim().toLowerCase();
      cleanDomain = cleanDomain.replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "");
      
      const res = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: cleanDomain }),
      });
      
      const data = await res.json();
      
      if (res.ok && data.site) {
        const newSite: Site = {
          id: data.site.id,
          domain: data.site.domain,
          name: data.site.name,
          totalCitations: 0,
          citationsThisWeek: 0,
          citationsLastWeek: 0,
          lastCheckedAt: null,
        };
        
        setSites(prev => [newSite, ...prev]);
        setCurrentSite(newSite);
        return newSite;
      } else {
        setError(data.error || "Failed to add site");
        return null;
      }
    } catch (err) {
      setError("Failed to add site");
      return null;
    }
  }, [setCurrentSite]);

  const deleteSite = useCallback(async (siteId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/sites?id=${siteId}`, { method: "DELETE" });
      
      if (res.ok) {
        setSites(prev => prev.filter(s => s.id !== siteId));
        if (currentSite?.id === siteId) {
          const remaining = sites.filter(s => s.id !== siteId);
          setCurrentSiteState(remaining[0] || null);
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [currentSite, sites]);

  const runCheck = useCallback(async (siteId?: string): Promise<boolean> => {
    const id = siteId || currentSite?.id;
    const domain = siteId ? sites.find(s => s.id === siteId)?.domain : currentSite?.domain;
    
    if (!id || !domain) return false;
    
    try {
      const res = await fetch("/api/geo/citations/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId: id, domain }),
      });
      
      if (res.ok) {
        setUsage(prev => ({ ...prev, checksUsed: prev.checksUsed + 1 }));
        // Refresh to get new citation data
        await refreshData();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [currentSite, sites, refreshData]);

  // ============================================
  // INITIAL LOAD
  // ============================================

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // ============================================
  // CONTEXT VALUE
  // ============================================

  const value: SiteContextType = {
    user,
    organization,
    sites,
    currentSite,
    usage,
    trial,
    loading,
    error,
    setCurrentSite,
    refreshData,
    addSite,
    deleteSite,
    runCheck,
  };

  return (
    <SiteContext.Provider value={value}>
      {children}
    </SiteContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

export function useSite() {
  const context = useContext(SiteContext);
  if (!context) {
    throw new Error("useSite must be used within SiteProvider");
  }
  return context;
}

export default SiteContext;

