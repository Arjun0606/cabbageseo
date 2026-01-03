import { Suspense } from "react";
import { AppLayout } from "@/components/layout";
import { SubscriptionGate } from "@/components/paywall/subscription-gate";

function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <div className="text-zinc-400">Loading...</div>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<LoadingState />}>
      <SubscriptionGate>
        <AppLayout>{children}</AppLayout>
      </SubscriptionGate>
    </Suspense>
  );
}
