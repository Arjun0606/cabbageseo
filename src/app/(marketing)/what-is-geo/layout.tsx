import type { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "What is GEO? Generative Engine Optimization Explained",
  description:
    "GEO (Generative Engine Optimization) is the practice of optimizing your brand to be recommended by AI search engines like ChatGPT, Perplexity & Google AI. Learn how GEO works and why it matters.",
  keywords: [
    "what is GEO",
    "generative engine optimization",
    "GEO SEO",
    "GEO optimization",
    "AI search optimization",
    "AI SEO",
    "how to get recommended by ChatGPT",
    "Perplexity SEO",
    "Google AI optimization",
    "AI visibility",
    "GEO strategy",
    "GEO vs SEO",
  ],
  openGraph: {
    title: "What is GEO? Generative Engine Optimization Explained",
    description:
      "GEO is how you get AI to recommend your brand. Learn the strategy behind Generative Engine Optimization.",
  },
  twitter: {
    card: "summary_large_image",
    title: "What is GEO (Generative Engine Optimization)?",
    description:
      "AI now decides who gets recommended. GEO is how you make sure it's you.",
  },
};

const faqItems = [
  {
    question: "What does GEO stand for?",
    answer:
      "GEO stands for Generative Engine Optimization. It's the practice of optimizing your online presence so that AI-powered search engines — like ChatGPT, Perplexity, and Google AI Overviews — recommend your brand when users ask relevant questions.",
  },
  {
    question: "Is GEO the same as SEO?",
    answer:
      "No. SEO (Search Engine Optimization) focuses on ranking in traditional search results like Google's 10 blue links. GEO focuses on getting recommended by AI systems that generate answers directly. The signals are different — AI looks for authoritative mentions, structured comparisons, and third-party trust signals rather than just backlinks and keyword density.",
  },
  {
    question: "Do I still need SEO if I do GEO?",
    answer:
      "Yes. SEO and GEO are complementary. SEO helps you rank in traditional search. GEO helps you get recommended when someone asks AI for advice. As AI search grows, GEO becomes increasingly important — but traditional SEO remains valuable for organic traffic.",
  },
  {
    question: "How long does GEO take to show results?",
    answer:
      "AI models update their knowledge regularly. After implementing GEO improvements — like publishing comparison pages, getting mentioned on review sites, and building structured content — most businesses see changes in AI recommendations within 2-4 weeks. CabbageSEO's 30-day sprint is designed around this timeline.",
  },
  {
    question: "Which AI platforms does GEO apply to?",
    answer:
      "GEO applies to any AI system that recommends products or services. The main platforms today are ChatGPT (OpenAI), Perplexity, Google AI Overviews (formerly SGE), and Claude. CabbageSEO currently tracks ChatGPT, Perplexity, and Google AI.",
  },
  {
    question: "Can I do GEO myself without a tool?",
    answer:
      "You can manually ask AI platforms about your brand, but it's slow and inconsistent. You'd need to check multiple platforms, track changes over time, identify competitors, and figure out what to fix — all manually. GEO tools like CabbageSEO automate scanning, tracking, gap analysis, and action planning so you can focus on implementation.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
};

export default function WhatIsGeoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {children}
    </>
  );
}
