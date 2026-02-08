import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://cabbageseo.com"),
  title: {
    default: "CabbageSEO – AI Visibility Intelligence",
    template: "%s | CabbageSEO",
  },
  description:
    "See who AI recommends in your market. Track ChatGPT, Perplexity & Google AI citations. Know where competitors win — and how to take it back.",
  keywords: [
    "AI SEO",
    "AI visibility",
    "AI citations",
    "ChatGPT SEO",
    "Perplexity SEO",
    "AI search optimization",
    "competitor intelligence",
    "GEO optimization",
    "AI recommendation tracking",
    "ChatGPT visibility",
    "AI search ranking",
    "is my brand on ChatGPT",
    "AI citation monitoring",
    "generative engine optimization",
  ],
  authors: [{ name: "CabbageSEO" }],
  creator: "CabbageSEO",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://cabbageseo.com",
    siteName: "CabbageSEO",
    title: "CabbageSEO – AI Visibility Intelligence",
    description:
      "See who AI recommends in your market. Track where competitors win.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "CabbageSEO – AI Visibility Intelligence",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CabbageSEO – AI Visibility Intelligence",
    description:
      "See who AI recommends. Track ChatGPT, Perplexity & Google AI citations.",
    images: ["/og-image.png"],
    creator: "@Arjun06061",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/apple-touch-icon.png", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

// JSON-LD Schemas for SEO — multiple types for maximum coverage
const jsonLdOrg = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "CabbageSEO",
  url: "https://cabbageseo.com",
  logo: "https://cabbageseo.com/apple-touch-icon.png",
  description: "AI Visibility Intelligence — Track who AI recommends in your market",
  sameAs: ["https://x.com/Arjun06061"],
  contactPoint: {
    "@type": "ContactPoint",
    email: "arjun@cabbageseo.com",
    contactType: "customer support",
  },
};

const jsonLdWebSite = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "CabbageSEO",
  url: "https://cabbageseo.com",
  description: "AI Visibility Intelligence — See who AI recommends in your market",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://cabbageseo.com/teaser?domain={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
};

const jsonLdApp = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "CabbageSEO",
  url: "https://cabbageseo.com",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "Track whether ChatGPT, Perplexity & Google AI recommend your brand or your competitors. Daily monitoring, competitor alerts, and AI-generated comparison pages.",
  offers: [
    {
      "@type": "Offer",
      name: "Free Trial",
      price: "0",
      priceCurrency: "USD",
      description: "7-day free trial with full access",
    },
    {
      "@type": "Offer",
      name: "Scout",
      price: "49",
      priceCurrency: "USD",
      billingIncrement: "P1M",
      description: "1 site, 3 competitors, daily AI monitoring",
    },
    {
      "@type": "Offer",
      name: "Command",
      price: "149",
      priceCurrency: "USD",
      billingIncrement: "P1M",
      description: "5 sites, 10 competitors, hourly AI monitoring",
    },
    {
      "@type": "Offer",
      name: "Dominate",
      price: "349",
      priceCurrency: "USD",
      billingIncrement: "P1M",
      description: "25 sites, 25 competitors, real-time AI monitoring",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrg) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebSite) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdApp) }}
        />
      </head>
      <body className="min-h-screen bg-white font-sans antialiased dark:bg-slate-950">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
