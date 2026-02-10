import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing – AI Visibility Plans Starting at $49/mo",
  description:
    "Scout ($49/mo), Command ($149/mo), and Dominate ($349/mo) plans. Track AI citations from ChatGPT & Perplexity, monitor competitors, identify gaps, and improve your AI visibility. Free scan available.",
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
      "Scout → Command → Dominate. AI monitoring, competitor tracking, gap analysis, and targeted fix pages. Free scan available.",
  },
};

const pricingJsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "CabbageSEO",
  description: "AI Visibility Intelligence — Track who AI recommends in your market",
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
      description: "1 site, 3 competitors, daily AI monitoring",
    },
    {
      "@type": "Offer",
      name: "Command",
      price: "149",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      priceValidUntil: "2027-12-31",
      url: "https://cabbageseo.com/pricing",
      description: "5 sites, 10 competitors, daily checks + hourly monitoring",
    },
    {
      "@type": "Offer",
      name: "Dominate",
      price: "349",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      priceValidUntil: "2027-12-31",
      url: "https://cabbageseo.com/pricing",
      description: "25 sites, 25 competitors, daily + hourly AI monitoring",
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
      name: "What's the 30-day sprint?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The 30-day sprint is a structured program included with Scout and above. Each week you get specific, prioritized actions based on your current visibility data: content to create, pages to optimize, entities to reference, and comparisons to add. By day 30, most customers see measurable improvement in their AI recommendation rate.",
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
        text: "CabbageSEO automatically scans your AI visibility across ChatGPT, Perplexity, and Google AI on a schedule based on your plan. Scout gets daily checks, Command gets daily checks plus hourly monitoring, and Dominate gets daily checks plus hourly monitoring across all 25 sites. If your visibility score drops by 2 or more points, you'll get an instant alert via email and Slack.",
      },
    },
    {
      "@type": "Question",
      name: "What are fix pages?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Fix pages are comparison pages, category explainers, and FAQs designed to reinforce your credibility with AI systems. CabbageSEO uses your citation data, competitor intelligence, and gap analysis to create pages that reinforce the trust signals AI looks for. Scout gets 3 fix pages/month, Command gets 15, and Dominate gets unlimited.",
      },
    },
    {
      "@type": "Question",
      name: "Do you offer refunds?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "If you're unhappy after subscribing, contact us within 14 days of your first payment and we'll issue a full refund. You can also run a free scan before subscribing to see where you stand.",
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
