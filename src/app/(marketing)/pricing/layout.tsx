import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing – AI Visibility Plans",
  description:
    "Free, Starter ($29/mo), and Pro ($79/mo) plans. Track AI citations, monitor competitors, and get content fixes. 7-day free trial.",
  openGraph: {
    title: "CabbageSEO Pricing – AI Visibility Plans",
    description:
      "Choose your plan: Free checks, Starter daily monitoring, or Pro hourly tracking with API access.",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

