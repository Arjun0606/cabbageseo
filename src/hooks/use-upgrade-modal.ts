"use client";

import { useState, useCallback } from "react";

/**
 * State management for the upgrade modal.
 * Tracks which feature triggered it and which plan to show.
 */
export function useUpgradeModal() {
  const [state, setState] = useState<{
    open: boolean;
    feature: string;
    description: string;
    targetPlan: string;
  }>({
    open: false,
    feature: "",
    description: "",
    targetPlan: "scout",
  });

  const show = useCallback((feature: string, targetPlan: string, description?: string) => {
    setState({ open: true, feature, targetPlan, description: description || "" });
  }, []);

  const close = useCallback(() => {
    setState((s) => ({ ...s, open: false }));
  }, []);

  return {
    open: state.open,
    feature: state.feature,
    description: state.description,
    targetPlan: state.targetPlan,
    show,
    close,
  };
}
