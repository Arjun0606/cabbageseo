"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: Error | null;
}

interface UseAuthReturn extends AuthState {
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
  });

  const supabase = createClient();

  useEffect(() => {
    if (!supabase) {
      setState((prev) => ({ ...prev, loading: false }));
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        setState({ user: null, session: null, loading: false, error });
      } else {
        setState({
          user: session?.user ?? null,
          session,
          loading: false,
          error: null,
        });
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({
        user: session?.user ?? null,
        session,
        loading: false,
        error: null,
      });
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    
    setState((prev) => ({ ...prev, loading: true }));
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      setState((prev) => ({ ...prev, loading: false, error }));
    } else {
      setState({
        user: null,
        session: null,
        loading: false,
        error: null,
      });
      window.location.href = "/";
    }
  }, [supabase]);

  const refreshSession = useCallback(async () => {
    if (!supabase) return;
    
    const { data: { session }, error } = await supabase.auth.refreshSession();
    
    if (error) {
      setState((prev) => ({ ...prev, error }));
    } else {
      setState({
        user: session?.user ?? null,
        session,
        loading: false,
        error: null,
      });
    }
  }, [supabase]);

  return {
    ...state,
    signOut,
    refreshSession,
  };
}

/**
 * Hook to get the current user's profile from the database
 */
export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<{
    id: string;
    organization_id: string;
    name: string | null;
    email: string;
    role: string;
    avatar_url: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase
      .from("users")
      .select("id, organization_id, name, email, role, avatar_url")
      .eq("id", user.id)
      .single()
      .then(({ data, error }) => {
        if (!error && data) {
          setProfile(data);
        }
        setLoading(false);
      });
  }, [user]);

  return { profile, loading };
}

/**
 * Hook to get the current organization
 */
export function useOrganization() {
  const { profile, loading: profileLoading } = useUserProfile();
  const [organization, setOrganization] = useState<{
    id: string;
    name: string;
    slug: string;
    plan: string;
    subscription_status: string | null;
    autopilot_enabled: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.organization_id) {
      setOrganization(null);
      setLoading(false);
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase
      .from("organizations")
      .select("id, name, slug, plan, subscription_status, autopilot_enabled")
      .eq("id", profile.organization_id)
      .single()
      .then(({ data, error }) => {
        if (!error && data) {
          setOrganization(data);
        }
        setLoading(false);
      });
  }, [profile?.organization_id]);

  return { 
    organization, 
    loading: profileLoading || loading,
    profile,
  };
}
