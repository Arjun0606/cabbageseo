import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing – AI Visibility Plans Starting at $49/mo",
  description:
    "Scout ($49/mo), Command ($149/mo), and Dominate ($349/mo) plans. Track AI citations from ChatGPT & Perplexity, identify gaps, generate fix pages, and improve your AI visibility. Free scan available.",
  keywords: [
    "CabbageSEO pricing",
    "AI SEO tool pricing",
    "AI visibility tracking cost",
    "ChatGPT SEO pricing",
    "GEO tool pricing",
    "generative engine optimization pricing",
  ],
  openGraph: {
    title: "CabbageSEO Pricing – Plans from $49/mo",
    description:
      "Scout → Command → Dominate. AI monitoring, gap analysis, fix pages, and action plans. Free scan available.",
  },
};

const pricingJsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "CabbageSEO",
  description: "AI Visibility Intelligence — Track your brand's presence in AI search",
  brand: { "@type": "Brand", name: "CabbageSEO" },
  offers: [
    {
      "@type": "Offer",
      name: "Scout",
      price: "49",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      priceValidUntil: "2027-12-31",
      url: "https://cabbageseo.com/pricing",
      description: "Daily AI monitoring, gap analysis, fix pages, action plan",
    },
    {
      "@type": "Offer",
      name: "Command",
      price: "149",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      priceValidUntil: "2027-12-31",
      url: "https://cabbageseo.com/pricing",
      description: "Daily monitoring, 25 fix pages/month, 15 gap analyses/month, 4 action plans/month",
    },
    {
      "@type": "Offer",
      name: "Dominate",
      price: "349",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      priceValidUntil: "2027-12-31",
      url: "https://cabbageseo.com/pricing",
      description: "2x daily monitoring, 50 fix pages/month, 30 gap analyses/month, 8 action plans/month",
    },
  ],
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Is the data real?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Every data point comes from real API calls to ChatGPT, Perplexity, and Google AI Overviews. We query the actual AI platforms with real user prompts and record exactly what they recommend. No synthetic data, no estimations — just what AI actually says when someone asks about your market.",
      },
    },
    {
      "@type": "Question",
      name: "Can I cancel anytime?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. No contracts, no cancellation fees, no hoops. Cancel from your billing settings in two clicks. Your access continues until the end of your current billing period.",
      },
    },
    {
      "@type": "Question",
      name: "How do automated checks work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "CabbageSEO automatically scans your AI visibility across ChatGPT, Perplexity, and Google AI on a schedule based on your plan. Scout and Command get daily checks, while Dominate gets 2x daily monitoring. If your visibility score drops by 2 or more points, you'll get an instant alert via email.",
      },
    },
    {
      "@type": "Question",
      name: "What are fix pages?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Fix pages are comparison pages, category explainers, and FAQs designed to reinforce your credibility with AI systems. CabbageSEO uses your citation data and gap analysis to create pages that reinforce the trust signals AI looks for. Fix pages auto-generate after every scan: Scout creates 2 per scan, Command creates 5, and Dominate creates 10. You can also generate pages manually — Scout gets 5/month, Command 25, Dominate 50.",
      },
    },
  ],
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {children}
    </>
  );
}
