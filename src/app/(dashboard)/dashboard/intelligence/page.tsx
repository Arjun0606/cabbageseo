"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function IntelligencePage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/actions");
  }, [router]);
  return null;
}
