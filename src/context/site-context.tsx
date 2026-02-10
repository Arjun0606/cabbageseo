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
  geoScore: number | null;
  category: string | null;
  customQueries: string[];
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
  trialEndsAt: string | null;
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

export interface LostQuery {
  query: string;
  competitors: string[];
  platform: string;
  snippet?: string;
}

export interface CheckResult {
  lostQueries: LostQuery[];
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
  addSite: (domain: string, category?: string) => Promise<Site | null>;
  deleteSite: (siteId: string) => Promise<boolean>;
  runCheck: (siteId?: string, query?: string) => Promise<CheckResult | null>;
}

const defaultUsage: Usage = {
  checksUsed: 0,
  checksLimit: 3,
  sitesUsed: 0,
  sitesLimit: 1,
  competitorsUsed: 0,
  competitorsLimit: 0,
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
      let meData;
      try {
        meData = await meRes.json();
      } catch {
        setError("Failed to connect to server. Please try again.");
        setLoading(false);
        return;
      }

      if (!meData.authenticated) {
        router.push("/login");
        return;
      }
      
      setUser(meData.user);
      setOrganization(meData.organization);
      
      // Calculate trial status (prefer trial_ends_at, fall back to created_at)
      if (meData.organization) {
        const isTrialUser = meData.organization.plan === "free";
        const hasTrialEndsAt = !!meData.organization.trialEndsAt;
        const trialDate = meData.organization.trialEndsAt || meData.organization.createdAt || new Date().toISOString();
        const trialStatus = checkTrialStatus(trialDate, hasTrialEndsAt);
        setTrial({
          isTrialUser,
          expired: isTrialUser && trialStatus.expired,
          daysRemaining: trialStatus.daysRemaining,
          daysUsed: trialStatus.daysUsed,
        });
      }
      
      // Fetch sites
      const sitesRes = await fetch("/api/sites");
      let sitesData;
      try {
        sitesData = await sitesRes.json();
      } catch {
        setError("Failed to load sites. Please try again.");
        setLoading(false);
        return;
      }
      const siteList: Site[] = (sitesData.sites || []).map((s: Record<string, unknown>) => ({
        id: s.id as string,
        domain: s.domain as string,
        name: s.name as string | undefined,
        totalCitations: (s.total_citations as number) || 0,
        citationsThisWeek: (s.citations_this_week as number) || 0,
        citationsLastWeek: (s.citations_last_week as number) || 0,
        lastCheckedAt: (s.last_checked_at as string | null),
        geoScore: (s.geo_score_avg as number | null),
        category: (s.category as string | null) || null,
        customQueries: Array.isArray(s.custom_queries) ? s.custom_queries : [],
      }));
      
      setSites(siteList);
      
      // Set current site (guard localStorage for SSR)
      const savedSiteId = typeof window !== "undefined" ? localStorage.getItem("cabbageseo_site_id") : null;
      const savedSite = siteList.find(s => s.id === savedSiteId);
      if (savedSite) {
        setCurrentSiteState(savedSite);
      } else if (siteList.length > 0) {
        setCurrentSiteState(siteList[0]);
        if (typeof window !== "undefined") {
          localStorage.setItem("cabbageseo_site_id", siteList[0].id);
        }
      }
      
      // Fetch usage
      const usageRes = await fetch("/api/billing/usage");
      if (usageRes.ok) {
        const usageData = await usageRes.json();
        setUsage({
          checksUsed: usageData.data?.usage?.checksUsed || 0,
          checksLimit: usageData.data?.limits?.checks || 3,
          sitesUsed: siteList.length,
          sitesLimit: usageData.data?.limits?.sites || 1,
          competitorsUsed: usageData.data?.usage?.competitorsUsed || 0,
          competitorsLimit: usageData.data?.limits?.competitors || 0,
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
    if (typeof window !== "undefined") {
      localStorage.setItem("cabbageseo_site_id", site.id);
    }
  }, []);

  const addSite = useCallback(async (domain: string, category?: string): Promise<Site | null> => {
    try {
      // Clean domain
      let cleanDomain = domain.trim().toLowerCase();
      cleanDomain = cleanDomain.replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "");
      
      const res = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: cleanDomain, category }),
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
          geoScore: null,
          category: data.site.category || null,
          customQueries: data.site.custom_queries || [],
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
        setSites(prev => {
          const remaining = prev.filter(s => s.id !== siteId);
          // If deleting the current site, switch to the first remaining site
          if (currentSite?.id === siteId) {
            setCurrentSiteState(remaining[0] || null);
          }
          return remaining;
        });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [currentSite]);

  const runCheck = useCallback(async (siteId?: string, query?: string): Promise<CheckResult | null> => {
    const id = siteId || currentSite?.id;
    const domain = siteId ? sites.find(s => s.id === siteId)?.domain : currentSite?.domain;

    if (!id || !domain) return null;

    try {
      const body: Record<string, string> = { siteId: id, domain };
      if (query) body.query = query;

      const res = await fetch("/api/geo/citations/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        setUsage(prev => ({ ...prev, checksUsed: prev.checksUsed + 1 }));
        await refreshData();

        // Extract lost queries from check results
        const lostQueries: LostQuery[] = (data.results || [])
          .filter((r: { isLoss?: boolean; error?: string }) => r.isLoss && !r.error)
          .map((r: { query: string; competitors?: string[]; platform: string; snippet?: string }) => ({
            query: r.query,
            competitors: r.competitors || [],
            platform: r.platform,
            snippet: r.snippet,
          }));

        return { lostQueries };
      }
      return null;
    } catch {
      return null;
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

  if (error && !loading) {
    return (
      <SiteContext.Provider value={value}>
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-6">
          <div className="max-w-sm text-center">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-white text-lg font-semibold mb-1">Connection error</h2>
            <p className="text-zinc-400 text-sm mb-4">{error}</p>
            <button
              onClick={() => { setError(null); setLoading(true); refreshData(); }}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-medium rounded-lg transition-colors text-sm"
            >
              Try again
            </button>
          </div>
        </div>
      </SiteContext.Provider>
    );
  }

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

