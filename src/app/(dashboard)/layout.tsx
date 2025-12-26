import { AppLayout } from "@/components/layout";
import { SubscriptionGate } from "@/components/paywall/subscription-gate";
import { SiteProvider } from "@/contexts/site-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SiteProvider>
      <SubscriptionGate>
        <AppLayout>{children}</AppLayout>
      </SubscriptionGate>
    </SiteProvider>
  );
}
