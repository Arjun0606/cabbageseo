"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SourcesPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/actions");
  }, [router]);
  return null;
}
