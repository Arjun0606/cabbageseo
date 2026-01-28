"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, X, Check, ArrowRight, Loader2, Share2, Twitter, Copy, TrendingDown, Target, Zap } from "lucide-react";

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
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!domain) {
      router.push("/");
      return;
    }

    const runTeaser = async () => {
      const steps = [
        "Connecting to AI platforms...",
        "Asking ChatGPT about your market...",
        "Asking Perplexity who they recommend...",
        "Extracting competitor mentions...",
        "Calculating your visibility score...",
      ];

      for (let i = 0; i < steps.length; i++) {
        setScanStep(i);
        await new Promise(resolve => setTimeout(resolve, 900));
      }

      try {
        const response = await fetch("/api/geo/teaser", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ domain }),
        });

        const result = await response.json();
        
        if (!response.ok) {
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

  const handleCopyResults = () => {
    if (!data) return;
    
    const text = `I just checked if AI recommends my product...

Result: ${data.summary.isInvisible ? "I'm INVISIBLE 😬" : "AI knows about me ✓"}

AI recommends these competitors instead:
${data.summary.competitorsMentioned.slice(0, 5).map(c => `• ${c}`).join('\n')}

Check yours (free): cabbageseo.com`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTweet = () => {
    if (!data) return;
    
    const text = encodeURIComponent(
      `I just checked if AI recommends my product...

${data.summary.isInvisible ? "Result: I'm INVISIBLE to ChatGPT & Perplexity 😬" : "Result: AI knows about me ✓"}

${data.summary.competitorsMentioned.length > 0 ? `AI recommends ${data.summary.competitorsMentioned.length} competitors instead.` : ""}

Check yours (free): cabbageseo.com`
    );
    
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  if (!domain) {
    return null;
  }

  if (loading) {
    const steps = [
      "Connecting to AI platforms...",
      "Asking ChatGPT about your market...",
      "Asking Perplexity who they recommend...",
      "Extracting competitor mentions...",
      "Calculating your visibility score...",
    ];

    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto px-6 text-center">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
            <Loader2 className="w-12 h-12 text-red-400 animate-spin mx-auto mb-6" />
            <h2 className="text-xl font-semibold text-white mb-2">
              Checking AI platforms...
            </h2>
            <p className="text-zinc-400 mb-6">
              Finding out if AI recommends <span className="text-white font-medium">{domain}</span>
            </p>
            
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
            Real AI responses. No estimates. No guesses.
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
  
  // Calculate visibility score (0-100)
  const visibilityScore = summary.isInvisible ? 0 : Math.min(100, summary.mentionedCount * 25);
  const competitorCount = summary.competitorsMentioned.length;

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <img
              src="/apple-touch-icon.png"
              alt="CabbageSEO"
              className="w-8 h-8 rounded-lg"
            />
            <span className="text-xl font-bold text-white">CabbageSEO</span>
          </Link>
        </div>

        {/* THE DEVASTATING VERDICT CARD - Designed to be screenshotted */}
        <div className={`relative overflow-hidden rounded-2xl p-8 mb-8 ${
          summary.isInvisible 
            ? "bg-gradient-to-br from-red-950/80 via-zinc-900 to-zinc-900 border-2 border-red-500/30" 
            : "bg-gradient-to-br from-emerald-950/80 via-zinc-900 to-zinc-900 border-2 border-emerald-500/30"
        }`}>
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
              backgroundSize: '24px 24px'
            }} />
          </div>

          <div className="relative">
            {/* Domain being checked */}
            <div className="text-center mb-6">
              <p className="text-zinc-400 text-sm mb-1">AI Visibility Report for</p>
              <p className="text-2xl font-bold text-white">{domain}</p>
            </div>

            {/* The big number */}
            <div className="text-center mb-6">
              <div className={`text-8xl font-black ${summary.isInvisible ? "text-red-500" : "text-emerald-500"}`}>
                {visibilityScore}
              </div>
              <p className="text-zinc-400 mt-2">AI Visibility Score</p>
            </div>

            {/* The verdict */}
            <div className="text-center mb-8">
              {summary.isInvisible ? (
                <>
                  <h1 className="text-3xl font-bold text-white mb-2">
                    You are <span className="text-red-400">invisible</span> to AI
                  </h1>
                  <p className="text-zinc-400 text-lg">
                    When buyers ask AI "what's the best tool" — you don't exist.
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-3xl font-bold text-white mb-2">
                    AI <span className="text-emerald-400">knows about you</span>
                  </h1>
                  <p className="text-zinc-400 text-lg">
                    You were mentioned {summary.mentionedCount} time(s). But competitors may still be winning.
                  </p>
                </>
              )}
            </div>

            {/* The comparison that hurts */}
            {competitorCount > 0 && (
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-zinc-800/50 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-red-400 mb-1">
                    {competitorCount}
                  </div>
                  <p className="text-zinc-400 text-sm">Competitors AI recommends</p>
                </div>
                <div className="bg-zinc-800/50 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-zinc-500 mb-1">
                    {summary.mentionedCount}
                  </div>
                  <p className="text-zinc-400 text-sm">Times you were mentioned</p>
                </div>
              </div>
            )}

            {/* Share buttons */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handleTweet}
                className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm rounded-lg transition-colors"
              >
                <Twitter className="w-4 h-4" />
                Share on X
              </button>
              <button
                onClick={handleCopyResults}
                className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm rounded-lg transition-colors"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy results"}
              </button>
            </div>
          </div>
        </div>

        {/* Who AI recommends instead - the knife twist */}
        {summary.competitorsMentioned.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown className="w-5 h-5 text-red-400" />
              <h3 className="text-lg font-semibold text-white">
                AI is sending buyers to these instead
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {summary.competitorsMentioned.map((competitor, i) => (
                <span
                  key={i}
                  className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg font-medium"
                >
                  {competitor}
                </span>
              ))}
            </div>
            <p className="text-zinc-500 text-sm mt-4">
              Every day, potential customers ask AI for recommendations. These are the names they hear.
            </p>
          </div>
        )}

        {/* Raw AI responses - proof this is real */}
        <div className="space-y-4 mb-8">
          <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wide">
            Raw AI Responses
          </h3>
          {results.map((result, i) => (
            <div
              key={i}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-zinc-500 text-xs uppercase tracking-wide mb-1">
                    {result.platform === "perplexity" ? "Perplexity AI" : "Google AI"}
                  </p>
                  <p className="text-white font-medium">
                    "{result.query}"
                  </p>
                </div>
                <div
                  className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium ${
                    result.mentionedYou
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-red-500/10 text-red-400 border border-red-500/20"
                  }`}
                >
                  {result.mentionedYou ? "You're in ✓" : "You're out ✗"}
                </div>
              </div>

              {result.aiRecommends.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {result.aiRecommends.slice(0, 6).map((competitor, j) => (
                    <span
                      key={j}
                      className="px-2 py-1 bg-zinc-800 text-zinc-400 rounded text-xs"
                    >
                      {competitor}
                    </span>
                  ))}
                  {result.aiRecommends.length > 6 && (
                    <span className="px-2 py-1 text-zinc-500 text-xs">
                      +{result.aiRecommends.length - 6} more
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* THE FIX - One clear next step */}
        <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-800 border border-zinc-700 rounded-2xl p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm mb-4">
              <Target className="w-4 h-4" />
              Most founders fix this in 14 days
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">
              This is fixable.
            </h2>
            <p className="text-zinc-400 max-w-lg mx-auto">
              We'll show you exactly where to get listed so AI starts recommending you.
              Step-by-step instructions. No guesswork.
            </p>
          </div>

          {/* What you get */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="flex items-start gap-3 p-4 bg-zinc-800/50 rounded-xl">
              <div className="shrink-0 w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                <Target className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-white font-medium text-sm">Trust Map</p>
                <p className="text-zinc-500 text-xs">See every source AI trusts</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-zinc-800/50 rounded-xl">
              <div className="shrink-0 w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-white font-medium text-sm">Action Roadmap</p>
                <p className="text-zinc-500 text-xs">Step-by-step fix instructions</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-zinc-800/50 rounded-xl">
              <div className="shrink-0 w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-white font-medium text-sm">Progress Tracking</p>
                <p className="text-zinc-500 text-xs">Watch your score improve</p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link
              href={`/signup?domain=${encodeURIComponent(domain)}`}
              className="inline-flex items-center gap-2 px-8 py-4 bg-white hover:bg-zinc-100 text-zinc-900 font-semibold rounded-xl transition-colors"
            >
              Fix my AI visibility
              <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="mt-4 text-zinc-500 text-sm">
              Free 7-day access • No credit card required
            </p>
          </div>
        </div>

        {/* Social proof */}
        <div className="mt-8 text-center">
          <p className="text-zinc-600 text-sm">
            Built for founders and marketers who are tired of being invisible to AI.
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
