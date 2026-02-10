import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Visibility for SaaS Companies – Get Recommended by ChatGPT & Perplexity",
  description:
    "SaaS buyers ask AI for product recommendations before they Google. CabbageSEO tracks whether ChatGPT, Perplexity & Google AI recommend you — or your competitors.",
  keywords: [
    "AI SEO for SaaS",
    "GEO for SaaS",
    "generative engine optimization SaaS",
    "ChatGPT product recommendations",
    "SaaS AI visibility",
    "AI recommendation tracking SaaS",
  ],
  openGraph: {
    title: "CabbageSEO for SaaS – Win AI Product Recommendations",
    description:
      "Track if AI recommends your SaaS product. Monitor competitors. Generate comparison pages that AI can cite. Start free.",
  },
};

export default function ForSaaSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
