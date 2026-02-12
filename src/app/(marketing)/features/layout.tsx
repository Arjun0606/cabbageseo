import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Features – AI Visibility Tracking, GEO Intelligence & Fix Pages",
  description:
    "Monitor your AI visibility across ChatGPT, Perplexity and Google AI. Get daily citation tracking, visibility alerts, and targeted fix pages to improve your presence.",
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
      "Daily AI citation monitoring. Gap analysis and fix pages. Personalized action plans. Everything you need to be visible in AI search.",
  },
};

export default function FeaturesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
