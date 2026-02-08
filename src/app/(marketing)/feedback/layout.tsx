import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Feedback – Help Shape CabbageSEO",
  description:
    "Share your feedback and feature requests for CabbageSEO. We build what you need.",
  robots: { index: false, follow: true },
};

export default function FeedbackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
