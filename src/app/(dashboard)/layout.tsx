import { AppLayout } from "@/components/layout";
import { SubscriptionGate } from "@/components/paywall/subscription-gate";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SubscriptionGate>
      <AppLayout>{children}</AppLayout>
    </SubscriptionGate>
  );
}
