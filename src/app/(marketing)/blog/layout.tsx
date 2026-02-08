import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog – AI Visibility & SEO Insights",
  description:
    "Learn how to get recommended by ChatGPT, Perplexity & Google AI. Guides on AI SEO, generative engine optimization, and AI visibility strategy.",
  keywords: [
    "AI SEO blog",
    "ChatGPT SEO guide",
    "AI visibility tips",
    "generative engine optimization",
    "how to get on ChatGPT",
    "Perplexity SEO",
    "AI recommendation strategy",
  ],
  openGraph: {
    title: "CabbageSEO Blog – AI Visibility Insights",
    description:
      "Guides and strategies for getting recommended by AI search engines. Written by the CabbageSEO team.",
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
