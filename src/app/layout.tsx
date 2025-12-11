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
    default: "CabbageSEO - SEO on Autopilot",
    template: "%s | CabbageSEO",
  },
  description:
    "The AI-powered SEO platform that handles everything automatically. Keyword research, content creation, optimization, and publishing — all in one place.",
  keywords: [
    "SEO",
    "AI SEO",
    "content generation",
    "keyword research",
    "SEO automation",
    "organic traffic",
  ],
  authors: [{ name: "CabbageSEO" }],
  creator: "CabbageSEO",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://cabbageseo.com",
    siteName: "CabbageSEO",
    title: "CabbageSEO - SEO on Autopilot",
    description:
      "The AI-powered SEO platform that handles everything automatically.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "CabbageSEO",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CabbageSEO - SEO on Autopilot",
    description:
      "The AI-powered SEO platform that handles everything automatically.",
    images: ["/og-image.png"],
    creator: "@cabbageseo",
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
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-white font-sans antialiased dark:bg-slate-950">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
