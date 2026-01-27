"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, X, Check, ArrowRight, Loader2 } from "lucide-react";

interface TeaserResult {
  query: string;
  platform: "perplexity" | "gemini";
  aiRecommends: string[];
  mentionedYou: boolean;
  snippet: string;
}

interface TeaserData {
  domain: string;
  results: TeaserResult[];
  summary: {
    totalQueries: number;
    mentionedCount: number;
    isInvisible: boolean;
    competitorsMentioned: string[];
    message: string;
  };
}

function TeaserContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const domain = searchParams.get("domain");

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TeaserData | null>(null);
  const [error, setError] = useState("");
  const [scanStep, setScanStep] = useState(0);

  useEffect(() => {
    if (!domain) {
      router.push("/");
      return;
    }

    const runTeaser = async () => {
      // Simulate progressive loading for UX
      const steps = [
        "Connecting to AI platforms...",
        "Querying Perplexity...",
        "Querying Google AI...",
        "Analyzing responses...",
        "Extracting competitors...",
      ];

      for (let i = 0; i < steps.length; i++) {
        setScanStep(i);
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      try {
        const response = await fetch("/api/geo/teaser", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ domain }),
        });

        const result = await response.json();
        
        if (!response.ok) {
          // Show specific error message from API (e.g., "Rate limit exceeded")
          throw new Error(result.error || "Failed to check visibility");
        }

        if (result.error) {
          throw new Error(result.error);
        }
        
        setData(result);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to check visibility";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    runTeaser();
  }, [domain, router]);

  if (!domain) {
    return null;
  }

  if (loading) {
    const steps = [
      "Connecting to AI platforms...",
      "Querying Perplexity...",
      "Querying Google AI...",
      "Analyzing responses...",
      "Extracting competitors...",
    ];

    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto px-6 text-center">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
            <Loader2 className="w-12 h-12 text-red-400 animate-spin mx-auto mb-6" />
            <h2 className="text-xl font-semibold text-white mb-2">
              Scanning AI platforms...
            </h2>
            <p className="text-zinc-400 mb-6">
              Checking if AI recommends <span className="text-white">{domain}</span>
            </p>
            
            {/* Progress steps */}
            <div className="text-left space-y-2">
              {steps.map((step, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-2 text-sm ${
                    i < scanStep
                      ? "text-emerald-400"
                      : i === scanStep
                      ? "text-white"
                      : "text-zinc-600"
                  }`}
                >
                  {i < scanStep ? (
                    <Check className="w-4 h-4" />
                  ) : i === scanStep ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <div className="w-4 h-4" />
                  )}
                  {step}
                </div>
              ))}
            </div>
          </div>

          <p className="mt-6 text-zinc-500 text-sm">
            This uses real AI APIs — no estimates, no guesses.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto px-6 text-center">
          <div className="bg-zinc-900 border border-red-500/20 rounded-2xl p-8">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">
              Something went wrong
            </h2>
            <p className="text-zinc-400 mb-6">{error}</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Try again
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { results, summary } = data;

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <img
              src="/apple-touch-icon.png"
              alt="CabbageSEO"
              className="w-8 h-8 rounded-lg"
            />
            <span className="text-xl font-bold text-white">CabbageSEO</span>
          </Link>

          {/* Verdict */}
          {summary.isInvisible ? (
            <>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full text-red-400 mb-6">
                <AlertTriangle className="w-4 h-4" />
                <span>AI did not recommend you</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                You are <span className="text-red-400">invisible</span> to AI search
              </h1>
              <p className="text-xl text-zinc-400">
                AI is already sending buyers to your competitors.
              </p>
            </>
          ) : (
            <>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 mb-6">
                <Check className="w-4 h-4" />
                <span>AI mentioned you {summary.mentionedCount} time(s)</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                AI knows about you
              </h1>
              <p className="text-xl text-zinc-400">
                But your competitors may still be getting more visibility.
              </p>
            </>
          )}
        </div>

        {/* Results */}
        <div className="space-y-6 mb-12">
          {results.map((result, i) => (
            <div
              key={i}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-zinc-500 text-sm mb-1">
                    {result.platform === "perplexity" ? "Perplexity" : "Google AI"}
                  </p>
                  <p className="text-white font-medium">
                    "{result.query}"
                  </p>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-sm ${
                    result.mentionedYou
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-red-500/10 text-red-400"
                  }`}
                >
                  {result.mentionedYou ? "Mentioned ✓" : "Not mentioned ✗"}
                </div>
              </div>

              {/* AI recommends */}
              <div className="mb-4">
                <p className="text-zinc-500 text-sm mb-2">AI recommends:</p>
                <div className="flex flex-wrap gap-2">
                  {result.aiRecommends.length > 0 ? (
                    result.aiRecommends.map((competitor, j) => (
                      <span
                        key={j}
                        className="px-3 py-1 bg-zinc-800 text-zinc-300 rounded-lg text-sm"
                      >
                        {competitor}
                      </span>
                    ))
                  ) : (
                    <span className="text-zinc-500 text-sm">
                      No specific products mentioned
                    </span>
                  )}
                </div>
              </div>

              {/* Your status */}
              <div className="flex items-center gap-2 pt-4 border-t border-zinc-800">
                {result.mentionedYou ? (
                  <>
                    <Check className="w-5 h-5 text-emerald-400" />
                    <span className="text-emerald-400">
                      <span className="font-medium">{domain}</span> was mentioned
                    </span>
                  </>
                ) : (
                  <>
                    <X className="w-5 h-5 text-red-400" />
                    <span className="text-red-400">
                      <span className="font-medium">{domain}</span> was not mentioned
                    </span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Competitors summary */}
        {summary.competitorsMentioned.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-12">
            <h3 className="text-lg font-semibold text-white mb-4">
              Who AI recommends instead of you
            </h3>
            <div className="flex flex-wrap gap-2">
              {summary.competitorsMentioned.map((competitor, i) => (
                <span
                  key={i}
                  className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg"
                >
                  {competitor}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="bg-gradient-to-r from-red-950/50 to-zinc-900 border border-red-500/20 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">
            Want to know <span className="text-red-400">why</span> this is happening?
          </h2>
          <p className="text-zinc-400 mb-6 max-w-lg mx-auto">
            We'll show you exactly where your competitors are listed that you're not,
            and give you a step-by-step roadmap to get AI to recommend you.
          </p>
          <Link
            href={`/signup?domain=${encodeURIComponent(domain)}`}
            className="inline-flex items-center gap-2 px-8 py-4 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors"
          >
            See why this is happening
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="mt-4 text-zinc-500 text-sm">
            Free to start • No credit card required
          </p>
        </div>

        {/* Trust indicator */}
        <div className="mt-12 text-center">
          <p className="text-zinc-500 text-sm">
            These results come from real AI API responses — 
            not estimates or simulations.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function TeaserPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
      </div>
    }>
      <TeaserContent />
    </Suspense>
  );
}

