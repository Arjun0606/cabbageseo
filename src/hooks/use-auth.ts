"use client";

import { useEffect, useState, useCallback } from "react";
import { User, Session, AuthChangeEvent } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  configured: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    configured: false,
  });
  const router = useRouter();
  const supabase = getSupabaseClient();

  useEffect(() => {
    // Check if Supabase is configured
    if (!supabase) {
      setState({
        user: null,
        session: null,
        loading: false,
        configured: false,
      });
      return;
    }

    setState(prev => ({ ...prev, configured: true }));

    // Get initial session
    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setState({
        user: session?.user ?? null,
        session: session,
        loading: false,
        configured: true,
      });
    };
    
    initSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, newSession: Session | null) => {
        setState({
          user: newSession?.user ?? null,
          session: newSession,
          loading: false,
          configured: true,
        });
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!supabase) throw new Error("Supabase not configured");
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      router.push("/dashboard");
    },
    [supabase, router]
  );

  const signUp = useCallback(
    async (email: string, password: string, fullName?: string) => {
      if (!supabase) throw new Error("Supabase not configured");
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });
      if (error) throw error;
    },
    [supabase]
  );

  const signOut = useCallback(async () => {
    if (!supabase) throw new Error("Supabase not configured");
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    router.push("/");
  }, [supabase, router]);

  const signInWithGoogle = useCallback(async () => {
    if (!supabase) throw new Error("Supabase not configured");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
  }, [supabase]);

  return {
    user: state.user,
    session: state.session,
    loading: state.loading,
    configured: state.configured,
    isAuthenticated: !!state.user,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
  };
}
