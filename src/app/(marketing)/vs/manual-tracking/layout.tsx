import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CabbageSEO vs Manual AI Tracking – Why Automated Monitoring Wins",
  description:
    "Stop manually checking if AI mentions your brand. CabbageSEO automates daily citation tracking across ChatGPT, Perplexity & Google AI with visibility alerts and action plans.",
  keywords: [
    "GEO tool comparison",
    "AI monitoring automation",
    "manual vs automated AI tracking",
    "AI citation tracking tool",
    "generative engine optimization tool",
  ],
  openGraph: {
    title: "Why CabbageSEO Beats Manual AI Tracking",
    description:
      "Automated daily checks. Visibility alerts. 30-day sprints. Everything manual tracking can't do.",
  },
};

export default function VsManualLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
