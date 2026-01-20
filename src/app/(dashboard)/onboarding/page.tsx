"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Loader2, AlertTriangle, ArrowRight } from "lucide-react";

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const domainFromUrl = searchParams.get("domain");

  const [step, setStep] = useState<"input" | "scanning" | "complete">(
    domainFromUrl ? "scanning" : "input"
  );
  const [domain, setDomain] = useState(domainFromUrl || "");
  const [scanStep, setScanStep] = useState(0);
  const [error, setError] = useState("");
  const [siteId, setSiteId] = useState<string | null>(null);

  const scanSteps = [
    "Creating your workspace...",
    "Querying Perplexity AI...",
    "Querying Google AI (Gemini)...",
    "Querying ChatGPT...",
    "Extracting competitors...",
    "Finding trusted sources...",
    "Calculating AI mention share...",
    "Generating your report...",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain.trim()) return;

    // Clean domain
    let cleanDomain = domain.trim().toLowerCase();
    cleanDomain = cleanDomain.replace(/^https?:\/\//, "");
    cleanDomain = cleanDomain.replace(/^www\./, "");
    cleanDomain = cleanDomain.split("/")[0];

    setDomain(cleanDomain);
    setStep("scanning");
    startScan(cleanDomain);
  };

  const startScan = async (domainToScan: string) => {
    try {
      // Create site FIRST (so we have siteId for check)
      const siteResponse = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: domainToScan }),
      });

      if (!siteResponse.ok) {
        const data = await siteResponse.json();
        throw new Error(data.error || "Failed to create site");
      }

      const site = await siteResponse.json();
      setSiteId(site.id);

      // Progressive animation WHILE check runs
      // Show steps 1-3 quickly (site creation)
      for (let i = 0; i < 3; i++) {
        setScanStep(i);
        await new Promise(resolve => setTimeout(resolve, 400));
      }

      // Start the actual check (this takes time)
      const checkPromise = fetch("/api/geo/citations/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId: site.id, domain: domainToScan }),
      });

      // Continue animation while check runs
      for (let i = 3; i < scanSteps.length - 1; i++) {
        setScanStep(i);
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      // Wait for check to complete
      const checkResponse = await checkPromise;
      
      if (!checkResponse.ok) {
        // Still redirect even if check fails - they can run it again
        console.error("Check failed but continuing:", await checkResponse.text());
      }

      // Final step
      setScanStep(scanSteps.length - 1);
      await new Promise(resolve => setTimeout(resolve, 500));

      setStep("complete");

      // Redirect IMMEDIATELY to dashboard with results
      router.push(`/dashboard?welcome=true&siteId=${site.id}&justScanned=true`);
    } catch (err) {
      console.error("Onboarding error:", err);
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStep("input");
    }
  };

  useEffect(() => {
    if (domainFromUrl && step === "scanning") {
      startScan(domainFromUrl);
    }
  }, []);

  // Input step
  if (step === "input") {
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
              Welcome to CabbageSEO
            </h1>
            <p className="text-zinc-400">
              Let's see if AI is recommending your product.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                What's your website?
              </label>
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="yourdomain.com"
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
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
              className="w-full py-3 bg-red-500 hover:bg-red-600 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              Start AI visibility scan
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          <p className="mt-6 text-center text-zinc-500 text-sm">
            We'll check ChatGPT, Perplexity, and Google AI to see
            if they recommend your product.
          </p>
        </div>
      </div>
    );
  }

  // Scanning step
  if (step === "scanning") {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="max-w-lg w-full mx-auto px-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
            <div className="text-center mb-8">
              <div className="relative inline-block">
                <Loader2 className="w-16 h-16 text-red-400 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl">🔍</span>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mt-4 mb-2">
                Scanning AI platforms...
              </h2>
              <p className="text-zinc-400">
                Checking if AI recommends <span className="text-white font-medium">{domain}</span>
              </p>
            </div>

            {/* Terminal-style progress */}
            <div className="bg-zinc-950 rounded-xl p-4 font-mono text-sm">
              {scanSteps.map((s, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-2 py-1 ${
                    i < scanStep
                      ? "text-emerald-400"
                      : i === scanStep
                      ? "text-white"
                      : "text-zinc-600"
                  }`}
                >
                  {i < scanStep ? (
                    <Check className="w-4 h-4 flex-shrink-0" />
                  ) : i === scanStep ? (
                    <Loader2 className="w-4 h-4 flex-shrink-0 animate-spin" />
                  ) : (
                    <div className="w-4 h-4 flex-shrink-0" />
                  )}
                  <span>{s}</span>
                </div>
              ))}
            </div>

            <p className="mt-6 text-center text-zinc-500 text-sm">
              This uses real AI APIs — no estimates or guesses.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Complete step
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="max-w-md w-full mx-auto px-6 text-center">
        <div className="bg-zinc-900 border border-emerald-500/20 rounded-2xl p-8">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Scan complete!
          </h2>
          <p className="text-zinc-400 mb-6">
            We found your AI visibility data. Redirecting to your dashboard...
          </p>
          <Loader2 className="w-6 h-6 text-zinc-400 animate-spin mx-auto" />
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  );
}

