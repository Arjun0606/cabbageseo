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
    "See who AI recommends in your market. Track your visibility across ChatGPT, Perplexity & Google AI. Find your gaps — and fix them.",
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MarketingShell>{children}</MarketingShell>;
}
