import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Features – AI Visibility Tracking, Competitor Intelligence & GEO Tools",
  description:
    "Track who AI recommends in your market. Monitor ChatGPT, Perplexity & Google AI citations daily. Get competitor alerts, 30-day sprints, and targeted recommendations to improve your AI visibility.",
  keywords: [
    "AI citation scanning",
    "GEO tool",
    "generative engine optimization tool",
    "AI visibility features",
    "competitor intelligence AI",
    "AI search monitoring",
  ],
  openGraph: {
    title: "CabbageSEO Features – AI Visibility Intelligence",
    description:
      "Daily AI citation monitoring. Competitor tracking. Gap analysis and fix pages. 30-day action sprints. Everything you need to win in AI search.",
  },
};

export default function FeaturesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
