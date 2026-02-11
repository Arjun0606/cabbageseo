import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free AI Visibility Score – Check if AI Recommends Your Brand",
  description:
    "Find out if ChatGPT, Perplexity & Google AI recommend your product. Get your AI visibility score in 10 seconds. Free, no signup required.",
  keywords: [
    "AI visibility score",
    "AI visibility checker",
    "ChatGPT recommendation checker",
    "Perplexity recommendation checker",
    "is my brand on ChatGPT",
    "AI search visibility",
    "free AI SEO tool",
    "AI citation checker",
  ],
  openGraph: {
    title: "Check Your AI Visibility Score – Free, No Signup",
    description:
      "Are you invisible to AI? Check if ChatGPT & Perplexity recommend your brand. Takes 10 seconds.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Is AI recommending your brand? Check free →",
    description:
      "Find out if ChatGPT, Perplexity & Google AI recommend your brand. 10 seconds, no signup.",
  },
};

export default function TeaserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
