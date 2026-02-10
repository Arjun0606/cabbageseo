"use client";

/**
 * Dashboard error boundary — catches unhandled errors in dashboard pages.
 * Shows a retry button instead of a blank screen.
 */

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Dashboard Error]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6 text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">
          Something went wrong
        </h2>
        <p className="text-zinc-400 text-sm mb-6">
          An unexpected error occurred. Try refreshing — if it persists, contact support.
        </p>
        <Button
          onClick={reset}
          className="bg-emerald-500 hover:bg-emerald-600 text-white"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Try again
        </Button>
      </div>
    </div>
  );
}
