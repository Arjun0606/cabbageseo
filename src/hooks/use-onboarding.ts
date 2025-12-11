/**
 * Onboarding Hook
 * 
 * Checks if the user needs to complete onboarding (has no sites)
 * and provides redirect functionality
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface OnboardingStatus {
  isLoading: boolean;
  needsOnboarding: boolean;
  hasSites: boolean;
  sitesCount: number;
}

export function useOnboarding(options: { redirect?: boolean } = {}): OnboardingStatus {
  const { redirect = false } = options;
  const router = useRouter();
  const [status, setStatus] = useState<OnboardingStatus>({
    isLoading: true,
    needsOnboarding: false,
    hasSites: false,
    sitesCount: 0,
  });

  useEffect(() => {
    async function checkOnboardingStatus() {
      const supabase = createClient();
      
      if (!supabase) {
        setStatus({
          isLoading: false,
          needsOnboarding: false, // Can't check without Supabase
          hasSites: false,
          sitesCount: 0,
        });
        return;
      }

      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setStatus({
            isLoading: false,
            needsOnboarding: false,
            hasSites: false,
            sitesCount: 0,
          });
          return;
        }

        // Get user's organization
        const { data: userData } = await supabase
          .from("users")
          .select("organization_id")
          .eq("id", user.id)
          .single();

        const orgId = (userData as { organization_id?: string } | null)?.organization_id;

        if (!orgId) {
          // No organization = needs onboarding
          setStatus({
            isLoading: false,
            needsOnboarding: true,
            hasSites: false,
            sitesCount: 0,
          });
          
          if (redirect) {
            router.push("/onboarding");
          }
          return;
        }

        // Check for sites
        const { data: sites, count } = await supabase
          .from("sites")
          .select("id", { count: "exact" })
          .eq("organization_id", orgId)
          .limit(1);

        const sitesCount = count || 0;
        const hasSites = sitesCount > 0;

        setStatus({
          isLoading: false,
          needsOnboarding: !hasSites,
          hasSites,
          sitesCount,
        });

        if (redirect && !hasSites) {
          router.push("/onboarding");
        }

      } catch (error) {
        console.error("Error checking onboarding status:", error);
        setStatus({
          isLoading: false,
          needsOnboarding: false,
          hasSites: false,
          sitesCount: 0,
        });
      }
    }

    checkOnboardingStatus();
  }, [redirect, router]);

  return status;
}

/**
 * Hook to get the user's sites
 */
export function useSites() {
  const [sites, setSites] = useState<Array<{
    id: string;
    domain: string;
    name: string;
    seo_score: number | null;
    status: string;
    created_at: string;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSites() {
      const supabase = createClient();
      
      if (!supabase) {
        setIsLoading(false);
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoading(false);
          return;
        }

        // Get user's organization
        const { data: userData } = await supabase
          .from("users")
          .select("organization_id")
          .eq("id", user.id)
          .single();

        const orgId = (userData as { organization_id?: string } | null)?.organization_id;
        if (!orgId) {
          setIsLoading(false);
          return;
        }

        // Fetch sites
        const { data: sitesData } = await supabase
          .from("sites")
          .select("id, domain, name, seo_score, status, created_at")
          .eq("organization_id", orgId)
          .order("created_at", { ascending: false });

        setSites((sitesData as typeof sites) || []);

      } catch (error) {
        console.error("Error fetching sites:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSites();
  }, []);

  return { sites, isLoading };
}

