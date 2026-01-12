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
    "Perplexity tracking",
    "AI search optimization",
    "competitor intelligence",
    "GEO optimization",
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

// JSON-LD Schema for SEO
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "CabbageSEO",
  url: "https://cabbageseo.com",
  logo: "https://cabbageseo.com/apple-touch-icon.png",
  description: "AI Visibility Intelligence - See who AI recommends in your market",
  sameAs: [
    "https://x.com/Arjun06061",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    email: "arjun@cabbageseo.com",
    contactType: "customer support",
  },
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
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-white font-sans antialiased dark:bg-slate-950">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
