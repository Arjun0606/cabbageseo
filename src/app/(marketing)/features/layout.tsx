import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Features – AI Visibility Tracking, Competitor Intelligence & Content Generation",
  description:
    "Track who AI recommends in your market. Monitor ChatGPT, Perplexity & Google AI citations daily. Get competitor alerts, 30-day sprints, and AI-generated comparison pages.",
  openGraph: {
    title: "CabbageSEO Features – AI Visibility Intelligence",
    description:
      "Daily AI citation monitoring. Competitor tracking. Auto-generated comparison pages. 30-day action sprints. Everything you need to win in AI search.",
  },
};

export default function FeaturesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
