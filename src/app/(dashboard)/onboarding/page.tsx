"use client";

/**
 * ONBOARDING — Domain + Category + Competitor
 *
 * Steps:
 * 1. Domain input (or pre-filled from URL)
 * 2. SaaS category selection + optional competitor
 * 3. Scanning animation
 * 4. Redirect to dashboard
 */

import { useEffect, useState, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Loader2, AlertTriangle, ArrowRight, ChevronRight } from "lucide-react";

const SAAS_CATEGORIES = [
  "CRM",
  "Project Management",
  "Analytics",
  "Marketing",
  "Dev Tools",
  "Finance",
  "Communication",
  "Design",
  "HR & Recruiting",
  "Security",
  "Education",
  "E-commerce",
  "Other",
] as const;

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const domainFromUrl = searchParams.get("domain");

  const [step, setStep] = useState<"domain" | "details" | "scanning" | "complete">(
    domainFromUrl ? "details" : "domain"
  );
  const [domain, setDomain] = useState(domainFromUrl || "");
  const [category, setCategory] = useState("");
  const [competitor, setCompetitor] = useState("");
  const [scanStep, setScanStep] = useState(0);
  const [error, setError] = useState("");

  const scanSteps = [
    "Creating your workspace...",
    "Querying Perplexity AI...",
    "Querying Google AI (Gemini)...",
    "Querying ChatGPT...",
    "Extracting competitors...",
    "Finding trusted sources...",
    "Calculating AI mention share...",
    "Generating your sprint plan...",
  ];

  const handleDomainSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain.trim()) return;

    let cleanDomain = domain.trim().toLowerCase();
    cleanDomain = cleanDomain.replace(/^https?:\/\//, "");
    cleanDomain = cleanDomain.replace(/^www\./, "");
    cleanDomain = cleanDomain.split("/")[0];

    setDomain(cleanDomain);
    setStep("details");
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("scanning");
  };

  const handleSkipDetails = () => {
    setStep("scanning");
  };

  const startScan = useCallback(async () => {
    try {
      // Create site with category and competitor data
      const siteResponse = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain,
          category: category || undefined,
          competitor: competitor || undefined,
        }),
      });

      if (!siteResponse.ok) {
        const data = await siteResponse.json();
        throw new Error(data.error || "Failed to create site");
      }

      const site = await siteResponse.json();

      // Progressive animation WHILE check runs
      for (let i = 0; i < 3; i++) {
        setScanStep(i);
        await new Promise((resolve) => setTimeout(resolve, 400));
      }

      // Start the actual check
      const checkPromise = fetch("/api/geo/citations/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId: site.id, domain }),
      });

      // Continue animation while check runs
      for (let i = 3; i < scanSteps.length - 1; i++) {
        setScanStep(i);
        await new Promise((resolve) => setTimeout(resolve, 800));
      }

      // Wait for check to complete
      const checkResponse = await checkPromise;

      if (!checkResponse.ok) {
        console.error(
          "Check failed but continuing:",
          await checkResponse.text()
        );
      }

      // Final step
      setScanStep(scanSteps.length - 1);
      await new Promise((resolve) => setTimeout(resolve, 500));

      setStep("complete");
      router.push(
        `/dashboard?welcome=true&siteId=${site.id}&justScanned=true`
      );
    } catch (err) {
      console.error("Onboarding error:", err);
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStep("domain");
    }
  }, [domain, category, competitor, router, scanSteps.length]);

  useEffect(() => {
    if (step === "scanning") {
      startScan();
    }
  }, [step, startScan]);

  // ========== STEP 1: DOMAIN INPUT ==========
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
              Welcome to CabbageSEO
            </h1>
            <p className="text-zinc-400">
              Let&rsquo;s see if AI is recommending your product.
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
              Continue
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          <p className="mt-6 text-center text-zinc-500 text-sm">
            We&rsquo;ll check ChatGPT, Perplexity, and Google AI to see if they
            recommend your product.
          </p>
        </div>
      </div>
    );
  }

  // ========== STEP 2: CATEGORY + COMPETITOR ==========
  if (step === "details") {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto px-6">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-800 rounded-full text-zinc-400 text-sm mb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              {domain}
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Tell us about your SaaS
            </h1>
            <p className="text-zinc-400 text-sm">
              This helps us find the right AI queries and competitors for your
              market.
            </p>
          </div>

          <form onSubmit={handleDetailsSubmit} className="space-y-5">
            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                What category is your SaaS?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {SAAS_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                      category === cat
                        ? "bg-emerald-500/15 border border-emerald-500/40 text-emerald-400"
                        : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Competitor */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Who&rsquo;s your biggest competitor?{" "}
                <span className="text-zinc-500">(optional)</span>
              </label>
              <input
                type="text"
                value={competitor}
                onChange={(e) => setCompetitor(e.target.value)}
                placeholder="competitor.com"
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
              <p className="text-xs text-zinc-500 mt-1.5">
                We&rsquo;ll check if AI recommends them over you.
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              Start AI visibility scan
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={handleSkipDetails}
              className="w-full py-2 text-zinc-500 hover:text-zinc-300 text-sm transition-colors flex items-center justify-center gap-1"
            >
              Skip for now
              <ChevronRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ========== STEP 3: SCANNING ==========
  if (step === "scanning") {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="max-w-lg w-full mx-auto px-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
            <div className="text-center mb-8">
              <Loader2 className="w-16 h-16 text-emerald-400 animate-spin mx-auto" />
              <h2 className="text-2xl font-bold text-white mt-4 mb-2">
                Scanning AI platforms...
              </h2>
              <p className="text-zinc-400">
                Checking if AI recommends{" "}
                <span className="text-white font-medium">{domain}</span>
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
              This uses real AI APIs &mdash; no estimates or guesses.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ========== STEP 4: COMPLETE ==========
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

