import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Visibility for Agencies – Track Client Citations Across AI Platforms",
  description:
    "Offer AI visibility tracking as a service. Monitor multiple client domains across ChatGPT, Perplexity & Google AI. White-label reports, bulk scanning, and competitor intelligence.",
  openGraph: {
    title: "CabbageSEO for Agencies – AI Visibility at Scale",
    description:
      "Track AI citations for all your clients. Bulk scanning API, competitor alerts, and automated reports. Built for agencies.",
  },
};

export default function ForAgenciesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
