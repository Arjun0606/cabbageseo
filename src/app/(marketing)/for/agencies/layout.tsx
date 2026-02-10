import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Visibility for Agencies – Track Client Citations Across AI Platforms",
  description:
    "Offer AI visibility tracking as a service. Monitor multiple client domains across ChatGPT, Perplexity & Google AI. Bulk scanning, competitor intelligence, and automated reports.",
  keywords: [
    "AI SEO for agencies",
    "GEO agency tool",
    "generative engine optimization agency",
    "white label AI tracking",
    "AI visibility agency",
    "multi-client AI monitoring",
  ],
  openGraph: {
    title: "CabbageSEO for Agencies – AI Visibility at Scale",
    description:
      "Track AI citations for all your clients. Bulk scanning, competitor alerts, and automated reports. Built for agencies.",
  },
};

export default function ForAgenciesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
