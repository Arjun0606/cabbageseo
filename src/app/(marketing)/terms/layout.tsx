import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "CabbageSEO terms of service. Usage terms, liability, and service agreement.",
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

