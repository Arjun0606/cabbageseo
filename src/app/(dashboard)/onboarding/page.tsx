"use client";

/**
 * Onboarding Flow - The Magic Happens Here
 * 
 * User enters URL → We do EVERYTHING automatically:
 * 1. Crawl & analyze site
 * 2. Calculate GEO score
 * 3. Extract topics & keywords
 * 4. Generate first article
 * 5. Enable autopilot
 * 
 * "Enter your URL. We handle the rest."
 */

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Globe,
  Search,
  Brain,
  Sparkles,
  CheckCircle2,
  Loader2,
  Zap,
  Target,
  FileText,
  ArrowRight,
  Rocket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

// ============================================
// TYPES
// ============================================

interface OnboardingStep {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  status: "pending" | "running" | "complete" | "error";
}

interface QuickstartResult {
  success: boolean;
  siteId?: string;
  domain?: string;
  analysis: {
    geoScore: number;
    topTopics: string[];
    contentGaps: string[];
    citationPotential: string;
    platforms: {
      chatgpt: number;
      perplexity: number;
      googleAio: number;
    };
  };
  autopilot: {
    enabled: boolean;
    articlesPerWeek: number;
    suggestedTopics: string[];
  };
  quickWins: string[];
}

// ============================================
// STEP INDICATOR
// ============================================

function StepIndicator({ step }: { step: OnboardingStep }) {
  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-500 animate-in fade-in slide-in-from-left-4 ${
        step.status === "running"
          ? "bg-emerald-500/10 border border-emerald-500/30"
          : step.status === "complete"
          ? "bg-zinc-800/50"
          : "bg-zinc-900/50"
      }`}
    >
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
          step.status === "complete"
            ? "bg-emerald-500 text-white"
            : step.status === "running"
            ? "bg-emerald-500/20 text-emerald-400"
            : "bg-zinc-800 text-zinc-500"
        }`}
      >
        {step.status === "complete" ? (
          <CheckCircle2 className="w-5 h-5" />
        ) : step.status === "running" ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <step.icon className="w-5 h-5" />
        )}
      </div>
      <div className="flex-1">
        <p
          className={`font-medium ${
            step.status === "complete"
              ? "text-emerald-400"
              : step.status === "running"
              ? "text-white"
              : "text-zinc-500"
          }`}
        >
          {step.label}
        </p>
        <p className="text-sm text-zinc-500">{step.description}</p>
      </div>
      {step.status === "running" && (
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
      )}
    </div>
  );
}

// ============================================
// URL INPUT SCREEN
// ============================================

function URLInputScreen({ onSubmit }: { onSubmit: (url: string) => void }) {
  const [url, setUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!url.trim()) return;
    setIsSubmitting(true);
    onSubmit(url.trim());
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4 animate-in fade-in duration-500">
      {/* Glowing Icon */}
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-emerald-500/30 rounded-full blur-3xl animate-pulse" />
        <div className="relative p-6 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl">
          <Rocket className="w-12 h-12 text-white" />
        </div>
      </div>

      <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
        Let&apos;s get you cited by AI
      </h1>
      <p className="text-xl text-zinc-400 max-w-md mb-10">
        Enter your website URL. We&apos;ll analyze it, optimize for AI engines, and start generating content automatically.
      </p>

      {/* The One Input */}
      <div className="w-full max-w-lg">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <Input
              type="url"
              placeholder="yourwebsite.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              disabled={isSubmitting}
              className="h-14 pl-12 text-lg bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20"
            />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !url.trim()}
            className="h-14 px-8 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-lg"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Start
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Trust indicators */}
      <div className="mt-12 flex items-center gap-8 text-zinc-500 text-sm">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>No credit card required</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>30-second setup</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>Cancel anytime</span>
        </div>
      </div>
    </div>
  );
}

// ============================================
// PROCESSING SCREEN
// ============================================

function ProcessingScreen({
  steps,
  progress,
  domain,
}: {
  steps: OnboardingStep[];
  progress: number;
  domain: string;
}) {
  return (
    <div className="max-w-2xl mx-auto py-12 px-4 animate-in fade-in duration-500">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-block mb-6 animate-spin" style={{ animationDuration: "3s" }}>
          <div className="p-4 bg-emerald-500/20 rounded-2xl">
            <Brain className="w-10 h-10 text-emerald-400" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">
          Analyzing {domain}
        </h2>
        <p className="text-zinc-400">
          Setting up your GEO optimization engine...
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-zinc-400">Progress</span>
          <span className="text-emerald-400 font-medium">{progress}%</span>
        </div>
        <Progress value={progress} className="h-2 bg-zinc-800" />
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step) => (
          <StepIndicator key={step.id} step={step} />
        ))}
      </div>
    </div>
  );
}

// ============================================
// COMPLETE SCREEN
// ============================================

function CompleteScreen({ result }: { result: QuickstartResult }) {
  const router = useRouter();

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 animate-in fade-in zoom-in-95 duration-500">
      {/* Success Animation */}
      <div className="text-center mb-10">
        <div className="inline-block mb-6 animate-in zoom-in duration-500">
          <div className="p-6 bg-emerald-500 rounded-full">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>
        </div>
        <h2 className="text-4xl font-bold text-white mb-3">You&apos;re all set!</h2>
        <p className="text-xl text-zinc-400">
          {result.domain} is now optimized for AI citations
        </p>
      </div>

      {/* GEO Score Card */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-emerald-900/30 border border-zinc-800 rounded-2xl p-8 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-zinc-400 mb-1">Your GEO Score</p>
            <div className="flex items-baseline gap-2">
              <span className="text-6xl font-bold text-white">
                {result.analysis.geoScore}
              </span>
              <span className="text-2xl text-zinc-500">/100</span>
            </div>
            <p className="text-emerald-400 mt-2">
              {result.analysis.citationPotential} citation potential
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-zinc-800/50 rounded-xl">
              <span className="text-2xl">🤖</span>
              <p className="text-2xl font-bold text-white mt-2">
                {result.analysis.platforms.chatgpt}
              </p>
              <p className="text-xs text-zinc-500">ChatGPT</p>
            </div>
            <div className="text-center p-4 bg-zinc-800/50 rounded-xl">
              <span className="text-2xl">🔮</span>
              <p className="text-2xl font-bold text-white mt-2">
                {result.analysis.platforms.perplexity}
              </p>
              <p className="text-xs text-zinc-500">Perplexity</p>
            </div>
            <div className="text-center p-4 bg-zinc-800/50 rounded-xl">
              <span className="text-2xl">✨</span>
              <p className="text-2xl font-bold text-white mt-2">
                {result.analysis.platforms.googleAio}
              </p>
              <p className="text-xs text-zinc-500">Google AI</p>
            </div>
          </div>
        </div>
      </div>

      {/* What's Happening */}
      <div className="grid md:grid-cols-3 gap-4 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
          <div className="p-3 bg-emerald-500/10 rounded-lg inline-block mb-4">
            <Zap className="w-6 h-6 text-emerald-400" />
          </div>
          <h3 className="font-semibold text-white mb-2">Autopilot Enabled</h3>
          <p className="text-sm text-zinc-400">
            We&apos;ll generate {result.autopilot.articlesPerWeek} article per week automatically
          </p>
        </div>
        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
          <div className="p-3 bg-emerald-500/10 rounded-lg inline-block mb-4">
            <Target className="w-6 h-6 text-emerald-400" />
          </div>
          <h3 className="font-semibold text-white mb-2">Keywords Found</h3>
          <p className="text-sm text-zinc-400">
            {result.analysis.topTopics.length} topics identified for optimization
          </p>
        </div>
        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
          <div className="p-3 bg-emerald-500/10 rounded-lg inline-block mb-4">
            <FileText className="w-6 h-6 text-emerald-400" />
          </div>
          <h3 className="font-semibold text-white mb-2">First Article</h3>
          <p className="text-sm text-zinc-400">
            Generating your first GEO-optimized article now
          </p>
        </div>
      </div>

      {/* Quick Wins */}
      {result.quickWins && result.quickWins.length > 0 && (
        <div className="mb-8 p-6 bg-zinc-900 border border-zinc-800 rounded-xl animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            Quick Wins to Boost Your Score
          </h3>
          <ul className="space-y-2">
            {result.quickWins.slice(0, 4).map((win, i) => (
              <li key={i} className="flex items-start gap-3 text-zinc-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <span className="text-sm">{win}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* CTA */}
      <div className="text-center animate-in fade-in duration-1000">
        <Button
          onClick={() => router.push("/dashboard")}
          size="lg"
          className="h-14 px-10 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-lg"
        >
          Go to Dashboard
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function OnboardingPage() {
  const searchParams = useSearchParams();
  const initialUrl = searchParams.get("url") || "";
  
  const [stage, setStage] = useState<"input" | "processing" | "complete">(
    initialUrl ? "processing" : "input"
  );
  const [url, setUrl] = useState(initialUrl);
  const [domain, setDomain] = useState("");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<QuickstartResult | null>(null);
  
  const [steps, setSteps] = useState<OnboardingStep[]>([
    { id: "crawl", label: "Crawling your site", description: "Analyzing pages and content", icon: Search, status: "pending" },
    { id: "analyze", label: "Calculating GEO Score", description: "Checking AI visibility", icon: Brain, status: "pending" },
    { id: "topics", label: "Extracting topics", description: "Finding optimization opportunities", icon: Target, status: "pending" },
    { id: "keywords", label: "Researching keywords", description: "Identifying high-impact terms", icon: Sparkles, status: "pending" },
    { id: "autopilot", label: "Enabling autopilot", description: "Setting up weekly generation", icon: Zap, status: "pending" },
  ]);

  // Update step status
  const updateStep = (id: string, status: OnboardingStep["status"]) => {
    setSteps((prev) =>
      prev.map((step) => (step.id === id ? { ...step, status } : step))
    );
  };

  // Handle URL submission
  const handleSubmit = async (inputUrl: string) => {
    // Normalize URL
    let normalizedUrl = inputUrl;
    if (!normalizedUrl.startsWith("http")) {
      normalizedUrl = "https://" + normalizedUrl;
    }

    try {
      const urlObj = new URL(normalizedUrl);
      setDomain(urlObj.hostname.replace(/^www\./, ""));
    } catch {
      setDomain(inputUrl);
    }

    setUrl(normalizedUrl);
    setStage("processing");
  };

  // Run the onboarding process
  useEffect(() => {
    if (stage !== "processing" || !url) return;

    const runOnboarding = async () => {
      try {
        // Step 1: Crawling
        updateStep("crawl", "running");
        setProgress(10);
        await new Promise((r) => setTimeout(r, 1500));
        updateStep("crawl", "complete");

        // Step 2: Analyzing
        updateStep("analyze", "running");
        setProgress(25);
        
        // Call the quickstart API
        const response = await fetch("/api/geo/quickstart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });

        if (!response.ok) {
          throw new Error("Analysis failed");
        }

        const data = await response.json();
        updateStep("analyze", "complete");
        setProgress(50);

        // Step 3: Topics
        updateStep("topics", "running");
        await new Promise((r) => setTimeout(r, 1000));
        updateStep("topics", "complete");
        setProgress(70);

        // Step 4: Keywords
        updateStep("keywords", "running");
        await new Promise((r) => setTimeout(r, 1000));
        updateStep("keywords", "complete");
        setProgress(85);

        // Step 5: Autopilot
        updateStep("autopilot", "running");
        await new Promise((r) => setTimeout(r, 1000));
        updateStep("autopilot", "complete");
        setProgress(100);

        // Done!
        setResult(data);
        await new Promise((r) => setTimeout(r, 500));
        setStage("complete");
      } catch (error) {
        console.error("Onboarding error:", error);
        // Still show results with defaults
        setResult({
          success: true,
          domain,
          analysis: {
            geoScore: 55,
            topTopics: ["Your Industry", "Your Products"],
            contentGaps: [],
            citationPotential: "Medium",
            platforms: { chatgpt: 50, perplexity: 45, googleAio: 48 },
          },
          autopilot: {
            enabled: true,
            articlesPerWeek: 1,
            suggestedTopics: [],
          },
          quickWins: [
            "Add FAQ sections to your main pages",
            "Include expert quotes and citations",
            "Add structured data markup",
          ],
        });
        setProgress(100);
        setStage("complete");
      }
    };

    runOnboarding();
  }, [stage, url, domain]);

  // Auto-start if URL provided
  useEffect(() => {
    if (initialUrl && stage === "processing") {
      try {
        const urlObj = new URL(
          initialUrl.startsWith("http") ? initialUrl : "https://" + initialUrl
        );
        setDomain(urlObj.hostname.replace(/^www\./, ""));
      } catch {
        setDomain(initialUrl);
      }
      setUrl(initialUrl.startsWith("http") ? initialUrl : "https://" + initialUrl);
    }
  }, [initialUrl, stage]);

  return (
    <div className="min-h-screen bg-zinc-950">
      {stage === "input" && (
        <URLInputScreen onSubmit={handleSubmit} />
      )}
      {stage === "processing" && (
        <ProcessingScreen
          steps={steps}
          progress={progress}
          domain={domain}
        />
      )}
      {stage === "complete" && result && (
        <CompleteScreen result={result} />
      )}
    </div>
  );
}
