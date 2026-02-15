/**
 * PostHog Analytics
 *
 * Centralised helpers for event tracking.
 * PostHog is initialised in <PostHogProvider> (providers.tsx).
 * Import `trackEvent` anywhere client-side to fire custom events.
 */

import posthog from "posthog-js";

/** Fire a custom event (no-ops if PostHog isn't loaded) */
export function trackEvent(event: string, properties?: Record<string, unknown>) {
  if (typeof window !== "undefined" && posthog.__loaded) {
    posthog.capture(event, properties);
  }
}

/** Identify a logged-in user */
export function identifyUser(
  userId: string,
  traits?: Record<string, unknown>,
) {
  if (typeof window !== "undefined" && posthog.__loaded) {
    posthog.identify(userId, traits);
  }
}

/** Reset identity on logout */
export function resetUser() {
  if (typeof window !== "undefined" && posthog.__loaded) {
    posthog.reset();
  }
}
