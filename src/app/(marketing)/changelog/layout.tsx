import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Changelog – New Features & Updates",
  description:
    "See what's new in CabbageSEO. Latest features, improvements, and updates to our AI visibility tracking platform.",
  openGraph: {
    title: "CabbageSEO Changelog",
    description:
      "Latest features and updates. AI visibility tracking that gets better every week.",
  },
};

export default function ChangelogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
