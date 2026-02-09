"use client";

import { useState } from "react";

/**
 * One-click checkout hook — skips the billing page entirely.
 * Used by sidebar, upgrade modals, dashboard CTAs, and actions page.
 * Defaults to yearly billing (20% discount).
 */
export function useCheckout() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkout = async (planId: string, interval: string = "yearly") => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, interval }),
      });

      const data = await res.json();
      const url = data.url || data.data?.checkoutUrl;

      if (url) {
        window.location.href = url;
      } else {
        setError(data.error || "Failed to create checkout session");
        setLoading(false);
      }
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return { checkout, loading, error };
}
