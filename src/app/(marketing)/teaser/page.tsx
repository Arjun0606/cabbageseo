"use client";

/**
 * TEASER PAGE — Redirects to homepage scanner
 * The teaser route now only serves shareable reports at /teaser/[id]
 */

import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function TeaserContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const domain = searchParams.get("domain");

  useEffect(() => {
    if (!domain) {
      router.push("/");
      return;
    }
    router.replace(`/?domain=${encodeURIComponent(domain)}`);
  }, [domain, router]);

  return null;
}

export default function TeaserPage() {
  return (
    <Suspense>
      <TeaserContent />
    </Suspense>
  );
}
