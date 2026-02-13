"use client";

/**
 * ONBOARDING — Domain → Scan → Dashboard
 *
 * Clean, centered card inside the dashboard layout.
 * Warns about the one-site-per-billing-period policy.
 */

import { useEffect, useState, Suspense, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, AlertTriangle, ArrowRight, Check, Globe, Search, Info } from "lucide-react";
import { useSite } from "@/context/site-context";

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const domainFromUrl = searchParams.get("domain");
  const { subscription, loading: siteLoading, organization } = useSite();

  const [step, setStep] = useState<"domain" | "scanning">(
    domainFromUrl ? "scanning" : "domain"
  );
  const [domain, setDomain] = useState(domainFromUrl || "");
  const [error, setError] = useState("");
  const [scanPhase, setScanPhase] = useState<"creating" | "chatgpt" | "perplexity" | "google" | "done">("creating");
  const scanStarted = useRef(false);

  // Free users must subscribe before onboarding
  useEffect(() => {
    if (!siteLoading && subscription.isFreeUser) {
      router.replace("/settings/billing");
    }
  }, [siteLoading, subscription.isFreeUser, router]);

  // Show loading spinner while checking auth/subscription status
  if (siteLoading || subscription.isFreeUser) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
      </div>
    );
  }

  const planName = organization?.plan
    ? organization.plan.charAt(0).toUpperCase() + organization.plan.slice(1)
    : "Scout";

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
      setScanPhase("creating");

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

      // Animate through platform phases while the check runs
      setScanPhase("chatgpt");
      const phaseTimer1 = setTimeout(() => setScanPhase("perplexity"), 8000);
      const phaseTimer2 = setTimeout(() => setScanPhase("google"), 16000);

      // Start the check
      const checkResponse = await fetch("/api/geo/citations/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId, domain }),
      });

      clearTimeout(phaseTimer1);
      clearTimeout(phaseTimer2);

      if (!checkResponse.ok) {
        console.error(
          "Check failed but continuing:",
          await checkResponse.text()
        );
      }

      setScanPhase("done");

      // Brief pause to show "done" state
      await new Promise(r => setTimeout(r, 500));

      // Go straight to dashboard
      router.push(
        `/dashboard?welcome=true&siteId=${siteId}&justScanned=true`
      );
    } catch (err) {
      console.error("Onboarding error:", err);
      const message = err instanceof Error ? err.message : "Something went wrong";
      // Show user-friendly error messages
      if (message.includes("already exists") || message.includes("duplicate")) {
        setError("This site is already in your account. Redirecting to dashboard...");
        setTimeout(() => router.push("/dashboard"), 2000);
        return;
      }
      setError(message);
      setStep("domain");
      scanStarted.current = false;
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
      <div className="flex items-center justify-center py-16 md:py-24">
        <div className="max-w-lg w-full mx-auto px-4">
          {/* Card */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 md:p-10">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-5">
                <Globe className="w-7 h-7 text-emerald-400" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Add your website
              </h1>
              <p className="text-zinc-400 text-sm md:text-base">
                We&rsquo;ll scan ChatGPT, Perplexity, and Google AI to see if they recommend you.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleDomainSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Your domain
                </label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="yoursaas.com"
                    className="w-full pl-10 pr-4 py-3.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-base"
                    autoFocus
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2.5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={!domain.trim()}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-700 disabled:cursor-not-allowed text-black font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors text-base"
              >
                Start scanning
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>

            {/* What happens next */}
            <div className="mt-6 pt-6 border-t border-zinc-800">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center mx-auto mb-2">
                    <span className="text-sm">🤖</span>
                  </div>
                  <p className="text-xs text-zinc-500">ChatGPT</p>
                </div>
                <div>
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center mx-auto mb-2">
                    <span className="text-sm">🔍</span>
                  </div>
                  <p className="text-xs text-zinc-500">Perplexity</p>
                </div>
                <div>
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center mx-auto mb-2">
                    <span className="text-sm">✨</span>
                  </div>
                  <p className="text-xs text-zinc-500">Google AI</p>
                </div>
              </div>
            </div>
          </div>

          {/* Site policy notice */}
          <div className="mt-4 flex items-start gap-2.5 px-2">
            <Info className="w-4 h-4 text-zinc-600 mt-0.5 shrink-0" />
            <p className="text-xs text-zinc-500">
              Your {planName} plan tracks one site per billing period. Choose carefully — you can change your tracked site when your next billing period starts.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ========== SCANNING ==========
  const scanSteps = [
    { id: "creating", label: "Setting up your site" },
    { id: "chatgpt", label: "Checking ChatGPT" },
    { id: "perplexity", label: "Checking Perplexity" },
    { id: "google", label: "Checking Google AI" },
    { id: "done", label: "Building your dashboard" },
  ];
  const currentPhaseIndex = scanSteps.findIndex(s => s.id === scanPhase);

  return (
    <div className="flex items-center justify-center py-16 md:py-24">
      <div className="max-w-lg w-full mx-auto px-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 md:p-10 text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-emerald-500/10 rounded-full border border-emerald-500/20">
              <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Scanning AI platforms...
          </h2>
          <p className="text-zinc-400 mb-8">
            Checking if AI recommends{" "}
            <span className="text-emerald-400 font-medium">{domain}</span>
          </p>

          {/* Step progress */}
          <div className="space-y-3 text-left max-w-xs mx-auto">
            {scanSteps.map((s, i) => {
              const isComplete = i < currentPhaseIndex;
              const isCurrent = i === currentPhaseIndex;
              return (
                <div key={s.id} className="flex items-center gap-3">
                  {isComplete ? (
                    <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                  ) : isCurrent ? (
                    <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border border-zinc-700 shrink-0" />
                  )}
                  <span className={`text-sm ${
                    isComplete ? "text-zinc-500" : isCurrent ? "text-white font-medium" : "text-zinc-600"
                  }`}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>

          <p className="mt-8 text-zinc-600 text-xs">
            Usually takes 20–40 seconds
          </p>
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}
