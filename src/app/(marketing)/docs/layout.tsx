import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentation – How It Works",
  description:
    "Learn how CabbageSEO tracks AI citations from ChatGPT, Perplexity & Google AI. Methodology, confidence levels, and API documentation.",
  keywords: [
    "GEO documentation",
    "AI visibility methodology",
    "citation tracking guide",
    "generative engine optimization guide",
    "AI SEO documentation",
  ],
  openGraph: {
    title: "CabbageSEO Documentation",
    description:
      "How we detect AI citations and track your visibility across AI platforms.",
  },
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
