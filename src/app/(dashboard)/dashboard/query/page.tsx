"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSite } from "@/context/site-context";
import {
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  Check,
  X,
  ExternalLink,
  Loader2,
  Lock,
  Lightbulb,
  Target,
  FileText,
} from "lucide-react";

interface WhyNotMeAnalysis {
  query: string;
  yourSite: string;
  competitors: string[];
  reasons: string[];
  trustedSources: Array<{
    source: string;
    hasCompetitor: boolean;
    hasYou: boolean;
  }>;
  contentFix: {
    title: string;
    headings: string[];
    entities: string[];
    faqs: string[];
  };
}

function QueryPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { currentSite, organization } = useSite();
  
  const query = searchParams.get("q") || "";
  
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<WhyNotMeAnalysis | null>(null);
  const [error, setError] = useState("");

  const isPaidPlan = organization?.plan === "starter" || organization?.plan === "pro";
  const isProPlan = organization?.plan === "pro";

  useEffect(() => {
    if (!query) {
      router.push("/dashboard");
      return;
    }

    // Only analyze when we have both query and currentSite
    if (currentSite?.id) {
      analyzeQuery();
    }
  }, [query, currentSite?.id]);

  const analyzeQuery = async () => {
    if (!currentSite?.id || !query) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/geo/intelligence/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId: currentSite.id,
          action: "gap-analysis",
          query,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Analysis failed");
      }

      const data = await response.json();
      // API returns data.data (from intelligence actions endpoint)
      const analysisData = data.data || data.analysis;
      if (analysisData) {
        // Map API response to expected format
        setAnalysis({
          query: analysisData.query || query,
          yourSite: analysisData.yourDomain || currentSite?.domain || "",
          competitors: analysisData.citedDomains || [],
          reasons: analysisData.whyNotYou || [],
          trustedSources: (analysisData.contentGaps || []).map((gap: string) => ({
            source: gap,
            hasCompetitor: true,
            hasYou: false,
          })),
          contentFix: {
            title: analysisData.actionItems?.[0] || `Complete Guide to ${query}`,
            headings: analysisData.missingElements || [],
            entities: analysisData.authorityGaps || [],
            faqs: analysisData.actionItems?.slice(1) || [],
          },
        });
      } else {
        throw new Error("No analysis data returned");
      }
    } catch (err) {
      console.error("Analysis error:", err);
      setError(err instanceof Error ? err.message : "Failed to analyze query. Please try running a check first.");
      // NO MOCK DATA - Show error state instead
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
          <Loader2 className="w-8 h-8 text-red-400 animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Analyzing why AI prefers competitors...</p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <div className="bg-gradient-to-br from-red-950/30 to-zinc-900 border-2 border-red-500/30 rounded-xl p-12 text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Analysis failed</h2>
          <p className="text-zinc-400 mb-6">{error || "Could not analyze this query. Please run a check first."}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-800 text-white rounded-xl hover:bg-zinc-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to dashboard
            </Link>
            <button
              onClick={() => analyzeQuery()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to dashboard
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full text-red-400 text-sm mb-4">
            <X className="w-4 h-4" />
            You were not mentioned
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Why AI didn't recommend you
          </h1>
          <p className="text-xl text-zinc-400">
            Query: "{analysis.query}"
          </p>
        </div>

        {/* Who AI recommended */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">
            Who AI trusts instead
          </h2>
          <div className="flex flex-wrap gap-2">
            {analysis.competitors.map((competitor, i) => (
              <span
                key={i}
                className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg"
              >
                {competitor}
              </span>
            ))}
          </div>
        </div>

        {/* Why they won */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-red-400" />
            <h2 className="text-lg font-semibold text-white">
              Why they won
            </h2>
          </div>
          <ul className="space-y-3">
            {analysis.reasons.map((reason, i) => (
              <li key={i} className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <span className="text-zinc-300">{reason}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Trusted sources comparison */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <ExternalLink className="w-5 h-5 text-red-400" />
            <h2 className="text-lg font-semibold text-white">
              Where AI learned about them
            </h2>
          </div>
          <p className="text-zinc-400 mb-4">
            AI trusts these sources. Your competitors are listed. You're not.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {analysis.trustedSources.map((source, i) => (
              <div
                key={i}
                className="bg-zinc-800 rounded-lg p-4 text-center"
              >
                <p className="font-medium text-white mb-2">{source.source}</p>
                <div className="space-y-1 text-sm">
                  <p className="text-emerald-400">
                    <Check className="w-4 h-4 inline mr-1" />
                    Competitors
                  </p>
                  <p className="text-red-400">
                    <X className="w-4 h-4 inline mr-1" />
                    You
                  </p>
                </div>
              </div>
            ))}
          </div>

          <Link
            href="/dashboard/sources"
            className="inline-flex items-center gap-2 mt-4 text-red-400 hover:text-red-300 text-sm font-medium"
          >
            View full Trust Map
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Content fix (paywalled) */}
        <div className="bg-gradient-to-r from-red-950/50 to-zinc-900 border border-red-500/20 rounded-xl p-6 mb-6 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-yellow-400" />
            <h2 className="text-lg font-semibold text-white">
              How to win this query
            </h2>
          </div>

          {isPaidPlan ? (
            <>
              <p className="text-zinc-400 mb-6">
                Create or update a page with this structure:
              </p>

              {/* Page title */}
              <div className="mb-6">
                <p className="text-sm text-zinc-500 mb-2">Recommended page title:</p>
                <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3">
                  <p className="text-white font-medium">{analysis.contentFix.title}</p>
                </div>
              </div>

              {/* Headings */}
              <div className="mb-6">
                <p className="text-sm text-zinc-500 mb-2">Section headings to include:</p>
                <div className="space-y-2">
                  {analysis.contentFix.headings.map((heading, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-zinc-500" />
                      <span className="text-zinc-300">{heading}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Entities */}
              <div className="mb-6">
                <p className="text-sm text-zinc-500 mb-2">Key entities to mention:</p>
                <div className="flex flex-wrap gap-2">
                  {analysis.contentFix.entities.map((entity, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-sm"
                    >
                      {entity}
                    </span>
                  ))}
                </div>
              </div>

              {/* FAQs */}
              <div>
                <p className="text-sm text-zinc-500 mb-2">FAQs to answer:</p>
                <ul className="space-y-2">
                  {analysis.contentFix.faqs.map((faq, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-400">Q:</span>
                      <span className="text-zinc-300">{faq}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <>
              {/* Free tier: Show ONE actionable insight + upgrade CTA */}
              <div className="space-y-4">
                {/* Show ONE actionable tip they can use NOW */}
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
                  <p className="text-emerald-300 text-sm font-medium mb-2">
                    💡 Quick win you can do now:
                  </p>
                  <p className="text-zinc-300 text-sm mb-3">
                    Create a page titled "{analysis.contentFix.title}" on your website. 
                    This matches what AI is looking for when answering "{query}".
                  </p>
                  <p className="text-zinc-400 text-xs">
                    Include: Clear headings, FAQ section, and mention key terms AI associates with this query.
                  </p>
                </div>

                {/* Show what they're missing */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Lock className="w-5 h-5 text-zinc-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white font-medium mb-1">
                        Unlock full content strategy
                      </p>
                      <p className="text-zinc-400 text-sm mb-3">
                        Starter plan includes: Exact page structure, section headings, key entities to mention, 
                        FAQs to answer, and competitor analysis showing what they did that you didn't.
                      </p>
                      <Link
                        href="/settings/billing"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors"
                      >
                        Upgrade to Starter ($29/mo)
                        <ArrowRight className="w-5 h-5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Next steps */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Next steps
          </h2>
          <div className="space-y-3">
            <Link
              href="/dashboard/sources"
              className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
                  <ExternalLink className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-white font-medium">View Trust Map</p>
                  <p className="text-zinc-400 text-sm">See all sources AI trusts</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-zinc-400" />
            </Link>

            <Link
              href="/dashboard/roadmap"
              className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Get your roadmap</p>
                  <p className="text-zinc-400 text-sm">Step-by-step visibility plan</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-zinc-400" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function QueryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
      </div>
    }>
      <QueryPageContent />
    </Suspense>
  );
}

