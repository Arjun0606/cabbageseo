import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing – AI Visibility Plans Starting at $49/mo",
  description:
    "Scout ($49/mo), Command ($149/mo), and Dominate ($349/mo) plans. Track AI citations from ChatGPT & Perplexity, monitor competitors, and get AI-generated content. Free 7-day trial, no credit card.",
  keywords: [
    "CabbageSEO pricing",
    "AI SEO tool pricing",
    "AI visibility tracking cost",
    "ChatGPT SEO pricing",
  ],
  openGraph: {
    title: "CabbageSEO Pricing – Plans from $49/mo",
    description:
      "Free trial → Scout → Command → Dominate. Daily AI monitoring, competitor tracking, and auto-generated comparison pages.",
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
      description: "5 sites, 10 competitors, hourly AI monitoring",
    },
    {
      "@type": "Offer",
      name: "Dominate",
      price: "349",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      priceValidUntil: "2027-12-31",
      url: "https://cabbageseo.com/pricing",
      description: "25 sites, 25 competitors, real-time AI monitoring",
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
      {children}
    </>
  );
}
