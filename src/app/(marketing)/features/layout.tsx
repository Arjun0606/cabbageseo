import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Features – AI Visibility Tracking, GEO Intelligence & Fix Pages",
  description:
    "Track who AI recommends in your market. Monitor ChatGPT, Perplexity & Google AI citations daily. Get visibility alerts, 30-day sprints, and targeted fix pages to improve your AI visibility.",
  keywords: [
    "AI citation scanning",
    "GEO tool",
    "generative engine optimization tool",
    "AI visibility features",
    "AI search monitoring",
    "AI visibility monitoring",
  ],
  openGraph: {
    title: "CabbageSEO Features – AI Visibility Intelligence",
    description:
      "Daily AI citation monitoring. Gap analysis and fix pages. 30-day action sprints. Everything you need to win in AI search.",
  },
};

export default function FeaturesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
