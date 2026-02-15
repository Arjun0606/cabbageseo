"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense, useState, useEffect, type ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";

// ---------------------------------------------------------------------------
// PostHog init (runs once on client)
// ---------------------------------------------------------------------------
function initPostHog() {
  if (
    typeof window !== "undefined" &&
    !posthog.__loaded &&
    process.env.NEXT_PUBLIC_POSTHOG_KEY
  ) {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
      person_profiles: "identified_only",
      capture_pageview: false, // we handle pageviews manually for Next.js SPA nav
      capture_pageleave: true,
    });
  }
}

// ---------------------------------------------------------------------------
// Pageview tracker — fires on route change
// ---------------------------------------------------------------------------
function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname && posthog.__loaded) {
      let url = window.origin + pathname;
      if (searchParams?.toString()) {
        url += "?" + searchParams.toString();
      }
      posthog.capture("$pageview", { $current_url: url });
    }
  }, [pathname, searchParams]);

  return null;
}

// ---------------------------------------------------------------------------
// Combined Providers
// ---------------------------------------------------------------------------
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  // Initialise PostHog on mount
  useEffect(() => {
    initPostHog();
  }, []);

  return (
    <PHProvider client={posthog}>
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={null}><PostHogPageView /></Suspense>
        {children}
      </QueryClientProvider>
    </PHProvider>
  );
}
