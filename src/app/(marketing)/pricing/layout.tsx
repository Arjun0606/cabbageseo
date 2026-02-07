import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing – AI Visibility Plans",
  description:
    "Scout ($49/mo), Command ($149/mo), and Dominate ($349/mo) plans. Track AI citations, monitor competitors, and get AI-generated content. Free 7-day trial.",
  openGraph: {
    title: "CabbageSEO Pricing – AI Visibility Plans",
    description:
      "Choose your plan: Free trial, Scout daily monitoring, Command hourly tracking, or Dominate for full control.",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

