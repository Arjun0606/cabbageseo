import { Suspense } from "react";
import { AppLayout } from "@/components/layout";
import { SubscriptionGate } from "@/components/paywall/subscription-gate";
import { SiteProvider } from "@/contexts/site-context";

function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-950">
      <div className="animate-pulse text-zinc-400">Loading...</div>
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
      <SiteProvider>
        <SubscriptionGate>
          <AppLayout>{children}</AppLayout>
        </SubscriptionGate>
      </SiteProvider>
    </Suspense>
  );
}
