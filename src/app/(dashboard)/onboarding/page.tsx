"use client";

/**
 * ONBOARDING — Domain → Scan → Dashboard
 *
 * Radically simplified: one field, one scan, done.
 */

import { useEffect, useState, Suspense, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, AlertTriangle, ArrowRight } from "lucide-react";

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const domainFromUrl = searchParams.get("domain");

  const [step, setStep] = useState<"domain" | "scanning">(
    domainFromUrl ? "scanning" : "domain"
  );
  const [domain, setDomain] = useState(domainFromUrl || "");
  const [error, setError] = useState("");
  const scanStarted = useRef(false);

  const handleDomainSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain.trim()) return;

    let cleanDomain = domain.trim().toLowerCase();
    cleanDomain = cleanDomain.replace(/^https?:\/\//, "");
    cleanDomain = cleanDomain.replace(/^www\./, "");
    cleanDomain = cleanDomain.split("/")[0];

    setDomain(cleanDomain);
    setStep("scanning");
  };

  const startScan = useCallback(async () => {
    try {
      const siteResponse = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      });

      if (!siteResponse.ok) {
        let errorMessage = "Failed to create site";
        try {
          const data = await siteResponse.json();
          errorMessage = data.error || errorMessage;
        } catch {
          // Server returned non-JSON (e.g. HTML error page)
        }
        throw new Error(errorMessage);
      }

      let siteData;
      try {
        siteData = await siteResponse.json();
      } catch {
        throw new Error("Server returned an unexpected response. Please try again.");
      }
      const siteId = siteData.site?.id || siteData.id;

      if (!siteId) {
        throw new Error("Failed to create site — no ID returned");
      }

      // Start the check
      const checkResponse = await fetch("/api/geo/citations/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId, domain }),
      });

      if (!checkResponse.ok) {
        console.error(
          "Check failed but continuing:",
          await checkResponse.text()
        );
      }

      // Go straight to dashboard
      router.push(
        `/dashboard?welcome=true&siteId=${siteId}&justScanned=true`
      );
    } catch (err) {
      console.error("Onboarding error:", err);
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStep("domain");
    }
  }, [domain, router]);

  useEffect(() => {
    if (step === "scanning" && !scanStarted.current) {
      scanStarted.current = true;
      startScan();
    }
  }, [step, startScan]);

  // ========== DOMAIN INPUT ==========
  if (step === "domain") {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto px-6">
          <div className="text-center mb-8">
            <img
              src="/apple-touch-icon.png"
              alt="CabbageSEO"
              className="w-16 h-16 rounded-2xl mx-auto mb-4"
            />
            <h1 className="text-3xl font-bold text-white mb-2">
              Let&rsquo;s check your AI visibility
            </h1>
            <p className="text-zinc-400">
              We&rsquo;ll scan ChatGPT, Perplexity, and Google AI in under a minute.
            </p>
          </div>

          <form onSubmit={handleDomainSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                What&rsquo;s your website?
              </label>
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="yoursaas.com"
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                autoFocus
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                <AlertTriangle className="w-4 h-4" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!domain.trim()}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              Start scanning
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          <p className="mt-6 text-center text-zinc-500 text-sm">
            Real AI responses, not estimates.
          </p>
        </div>
      </div>
    );
  }

  // ========== SCANNING ==========
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="max-w-md w-full mx-auto px-6 text-center">
        <Loader2 className="w-16 h-16 text-emerald-400 animate-spin mx-auto" />
        <h2 className="text-2xl font-bold text-white mt-6 mb-2">
          Scanning AI platforms...
        </h2>
        <p className="text-zinc-400">
          Checking if ChatGPT, Perplexity, and Google AI recommend{" "}
          <span className="text-white font-medium">{domain}</span>
        </p>
        <p className="mt-8 text-zinc-600 text-sm">
          This takes about 30 seconds
        </p>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}
