/**
 * Marketing Layout — Server component for metadata + client shell.
 */

import type { Metadata } from "next";
import { MarketingShell } from "@/components/marketing/marketing-shell";

export const metadata: Metadata = {
  title: {
    default: "CabbageSEO – AI Visibility Intelligence",
    template: "%s | CabbageSEO",
  },
  description:
    "Track your AI visibility across ChatGPT, Perplexity and Google AI. Find where you should be mentioned but aren't, and fix it.",
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MarketingShell>{children}</MarketingShell>;
}
