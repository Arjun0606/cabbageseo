"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  AlertTriangle,
  Search,
  Loader2,
  Rocket,
  RefreshCw,
  Target,
  FileText,
  Lightbulb,
  ShieldCheck,
  Share2,
  Bot,
  Terminal,
  Trophy,
  BarChart3,
  Zap,
  Eye,
  Check,
} from "lucide-react";
import { GridAnimation } from "@/components/backgrounds/grid-animation";
import { GradientOrbs } from "@/components/backgrounds/gradient-orbs";
import { AnimateIn } from "@/components/motion/animate-in";
import { GlassCard } from "@/components/ui/glass-card";
import { ScanProgress } from "@/components/homepage/scan-progress";
import { ScanResults, type TeaserData } from "@/components/homepage/scan-results";
import { SocialProofBar } from "@/components/homepage/social-proof-bar";
import { VisitorCounter } from "@/components/homepage/visitor-counter";
import { trackEvent } from "@/lib/analytics/posthog";

const SCAN_STEPS = [
  "Reading your site to understand your business...",
  "Generating queries your customers would ask AI...",
  "Checking Perplexity for your brand...",
  "Checking Google AI for your brand...",
  "Checking ChatGPT for your brand...",
  "Scoring your visibility across all platforms...",
];

type ScanState = "idle" | "scanning" | "results" | "error";

function HomeContent() {
  const searchParams = useSearchParams();
  const domainParam = searchParams.get("domain");
  const refParam = searchParams.get("ref");
  const isFromOpenClaw = refParam === "moltbot" || refParam === "clawbot" || refParam === "openclaw";

  const [domain, setDomain] = useState(domainParam || "");
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [scanStep, setScanStep] = useState(0);
  const [scanData, setScanData] = useState<TeaserData | null>(null);
  const [scanError, setScanError] = useState("");
  const resultsRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasAutoScanned = useRef(false);

  const runScan = useCallback(
    async (scanDomain: string) => {
      setScanState("scanning");
      setScanStep(0);
      setScanError("");
      setScanData(null);

      // Animate steps
      let step = 0;
      intervalRef.current = setInterval(() => {
        step++;
        if (step < SCAN_STEPS.length) {
          setScanStep(step);
        }
      }, 900);

      try {
        trackEvent("scan_initiated", { domain: scanDomain });
        const response = await fetch("/api/geo/teaser", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ domain: scanDomain }),
        });

        let result;
        try {
          result = await response.json();
        } catch {
          throw new Error("Server returned an unexpected response. Please try again.");
        }

        if (!response.ok) {
          throw new Error(result.error || "Failed to check visibility");
        }

        if (result.error) {
          throw new Error(result.error);
        }

        // Complete all steps
        if (intervalRef.current) clearInterval(intervalRef.current);
        setScanStep(SCAN_STEPS.length);

        // Brief pause to show completion
        await new Promise((resolve) => setTimeout(resolve, 400));

        setScanData({ ...result, domain: scanDomain });
        trackEvent("scan_completed", { domain: scanDomain, score: result.score });

        // Show results directly — no email gate
        setScanState("results");

        // Scroll to results/gate
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      } catch (err) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setScanError(
          err instanceof Error ? err.message : "Something went wrong"
        );
        setScanState("error");
      }
    },
    []
  );

  // Auto-scan from URL param
  useEffect(() => {
    if (domainParam && !hasAutoScanned.current) {
      hasAutoScanned.current = true;
      runScan(domainParam);
    }
  }, [domainParam, runScan]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain.trim() || scanState === "scanning") return;

    let cleanDomain = domain.trim().toLowerCase();
    cleanDomain = cleanDomain.replace(/^https?:\/\//, "");
    cleanDomain = cleanDomain.replace(/^www\./, "");
    cleanDomain = cleanDomain.split("/")[0];

    setDomain(cleanDomain);
    runScan(cleanDomain);
  };

  const handleRetry = () => {
    setScanState("idle");
    setScanError("");
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* ========== WAVE BANNER — above everything ========== */}
      <div className="relative bg-gradient-to-r from-emerald-500/[0.08] via-emerald-500/[0.15] to-emerald-500/[0.08] border-b border-emerald-500/20">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-center gap-3 text-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-emerald-300 font-medium">
            AI is replacing Google for buying decisions.
          </span>
          <span className="text-zinc-400 hidden sm:inline">
            Are you showing up when buyers ask ChatGPT, Perplexity & Google AI?
          </span>
          <Link href="/signup" className="ml-2 px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-full transition-colors whitespace-nowrap">
            Fix it now
          </Link>
        </div>
      </div>

      {/* ========== HERO ========== */}
      <section className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center overflow-hidden py-20">
        <GridAnimation className="opacity-40" />
        <GradientOrbs variant="emerald" className="opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-zinc-950/40 to-zinc-950 pointer-events-none" />

        {/* Radial spotlight behind hero */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-emerald-500/[0.07] rounded-full blur-[120px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 text-center w-full">
          {/* OpenClaw referral banner */}
          {isFromOpenClaw && (
            <AnimateIn delay={0.1} direction="up">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm font-medium mb-6">
                <Bot className="w-4 h-4" />
                You came from OpenClaw — scan any domain below for a full AI visibility report
              </div>
            </AnimateIn>
          )}

          {/* Platform badges — floating */}
          <AnimateIn delay={0.2} direction="up">
            <div className="flex justify-center gap-3 mb-10">
              {[
                { name: "ChatGPT", color: "border-emerald-500/30 text-emerald-400 shadow-emerald-500/10" },
                { name: "Perplexity", color: "border-blue-500/30 text-blue-400 shadow-blue-500/10" },
                { name: "Google AI", color: "border-purple-500/30 text-purple-400 shadow-purple-500/10" },
              ].map((p, i) => (
                <span
                  key={p.name}
                  className={`inline-flex items-center px-4 py-2 rounded-full text-xs font-medium border bg-white/[0.04] backdrop-blur-md shadow-lg animate-float ${p.color}`}
                  style={{ animationDelay: `${i * 300}ms`, animationDuration: `${5 + i}s` }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current mr-2 animate-pulse" />
                  {p.name}
                </span>
              ))}
            </div>
          </AnimateIn>

          <AnimateIn delay={0.4} direction="up">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white mb-8 leading-[1.1] tracking-tight">
              When buyers ask AI{" "}
              <br className="hidden sm:block" />
              who to use,{" "}
              <span className="bg-gradient-to-r from-emerald-400 via-emerald-300 to-teal-400 bg-clip-text text-transparent animate-shimmer-text">
                do they{" "}
                <br className="hidden sm:block" />
                find you?
              </span>
            </h1>
          </AnimateIn>

          <AnimateIn delay={0.6} direction="up">
            <p className="text-xl text-zinc-400 mb-4 max-w-2xl mx-auto leading-relaxed">
              Scan ChatGPT, Perplexity, and Google AI to see if they mention you. Then get the exact pages, trust signals, and actions to make sure they do.
            </p>
            <p className="text-sm text-red-400/80 font-medium mb-10 max-w-xl mx-auto">
              These answers change every week. You might be visible today and gone tomorrow.
            </p>
          </AnimateIn>

          {/* ===== SCANNER SEARCH BAR ===== */}
          <AnimateIn delay={0.8} direction="up">
            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto mb-6">
              <div className="relative group">
                {/* Ambient glow behind the bar */}
                <div className="absolute -inset-4 rounded-3xl bg-emerald-500/15 blur-2xl animate-breathe-glow pointer-events-none" />

                {/* Rotating scanner sweep border */}
                <div className="absolute -inset-px rounded-2xl overflow-hidden pointer-events-none">
                  <div
                    className="absolute w-[200%] h-[200%] top-[-50%] left-[-50%] animate-scanner-sweep"
                    style={{
                      background: "conic-gradient(from 0deg, transparent 0%, rgba(34, 197, 94, 0.4) 8%, transparent 25%, transparent 100%)",
                    }}
                  />
                </div>

                {/* Static gradient border */}
                <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-emerald-500/20 via-white/[0.06] to-emerald-500/20 pointer-events-none" />

                {/* Inner bar */}
                <div className="relative bg-zinc-950/95 backdrop-blur-xl rounded-2xl p-2.5">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      placeholder="yourdomain.com"
                      className="flex-1 px-6 py-4 bg-transparent text-white text-lg placeholder:text-zinc-600 focus:outline-none transition-all"
                      disabled={scanState === "scanning"}
                      autoFocus={!domainParam}
                    />
                    <button
                      type="submit"
                      disabled={scanState === "scanning" || !domain.trim()}
                      className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/20 disabled:text-emerald-400/60 disabled:cursor-not-allowed disabled:shadow-none text-black font-bold rounded-xl flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {scanState === "scanning" ? (
                        <Loader2 className="w-5 h-5 animate-spin text-black" />
                      ) : (
                        <>
                          <Search className="w-5 h-5" />
                          Check now
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </AnimateIn>

          <AnimateIn delay={1.0} direction="up">
            <p className="text-zinc-600 text-xs mb-4 max-w-md mx-auto">
              Not about gaming AI. We show you where you&apos;re invisible, then help you fix it.
            </p>
            <div className="flex items-center justify-center gap-6 text-sm text-zinc-500 mb-3">
              <span className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-emerald-500/60" />
                Takes 10 seconds
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-emerald-500/60" />
                No signup required
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-emerald-500/60" />
                Shareable report
              </span>
            </div>
            <div className="mb-5">
              <Link
                href="/leaderboard"
                className="text-xs text-zinc-600 hover:text-emerald-400 transition-colors"
              >
                See the AI Visibility Leaderboard &rarr;
              </Link>
            </div>
            <div className="flex items-center justify-center gap-4">
              <a
                href="https://www.producthunt.com/products/cabbageseo?utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-cabbageseo"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1079774&theme=dark&t=1771177147094"
                  alt="CabbageSEO on Product Hunt"
                  width={250}
                  height={54}
                />
              </a>
              <a
                href="https://peerlist.io/potatoramen/project/cabbageseo"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src="https://peerlist.io/api/v1/projects/embed/PRJHNN7N79L9DE6JE3N6DJRKLEG8QD?showUpvote=false&theme=dark"
                  alt="CabbageSEO on Peerlist"
                  width={200}
                  height={54}
                  className="h-[45px] w-auto"
                />
              </a>
            </div>
            <div className="mt-6">
              <VisitorCounter />
            </div>
          </AnimateIn>

          {/* Scan progress (inline) */}
          {scanState === "scanning" && (
            <ScanProgress currentStep={scanStep} steps={SCAN_STEPS} />
          )}

          {/* Error */}
          {scanState === "error" && (
            <div className="mt-6 bg-red-500/10 border border-red-500/20 rounded-xl p-5 text-left">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-medium mb-1">
                    Something went wrong
                  </p>
                  <p className="text-zinc-400 text-sm mb-3">{scanError}</p>
                  <button
                    onClick={handleRetry}
                    className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ========== RESULTS ========== */}
      {scanState === "results" && scanData && (
        <section ref={resultsRef} id="scan-results">
          <ScanResults data={scanData} />
        </section>
      )}

      {/* ========== OPENCLAW — HERO LEVEL ========== */}
      <section className="py-10 relative">
        <div className="max-w-4xl mx-auto px-6">
          <AnimateIn delay={0.1}>
            <div className="relative bg-gradient-to-r from-blue-500/[0.08] via-zinc-900/80 to-blue-500/[0.08] border-2 border-blue-500/25 rounded-2xl p-6 md:p-8 overflow-hidden shadow-xl shadow-blue-500/[0.06]">
              {/* Glow */}
              <div className="absolute -top-20 right-1/4 w-[300px] h-[200px] bg-blue-500/[0.06] rounded-full blur-[80px] pointer-events-none" />

              <div className="relative flex flex-col md:flex-row items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center shrink-0">
                  <Bot className="w-7 h-7 text-blue-400" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-bold mb-3 uppercase tracking-wide">
                    <Terminal className="w-3 h-3" />
                    Free OpenClaw Skill
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                    Also available as a free OpenClaw skill
                  </h3>
                  <p className="text-zinc-400 text-sm mb-4">
                    Install the CabbageSEO skill and check AI visibility from OpenClaw. Just say &ldquo;scan example.com&rdquo; &mdash; no API key needed.
                  </p>
                  <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl overflow-hidden mb-4 max-w-lg mx-auto md:mx-0">
                    <div className="px-4 py-2.5 font-mono text-sm">
                      <span className="text-zinc-500">$</span>{" "}
                      <span className="text-blue-400">openclaw skills install cabbageseo-ai-visibility</span>
                    </div>
                  </div>
                  <Link href="/openclaw" className="text-sm text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-1.5 font-medium">
                    Learn more about the OpenClaw skill <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* ========== SOCIAL PROOF (always visible) ========== */}
      <section className="pb-16">
        <div className="max-w-7xl mx-auto px-6">
          <SocialProofBar />
        </div>
      </section>

      {/* ========== HOW IT WORKS — CORE LOOP ========== */}
      <section className="py-24 relative">
        {/* Gradient divider */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-emerald-500/25 to-transparent" />

        <div className="max-w-7xl mx-auto px-6">
          <AnimateIn>
            <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-4">
              From invisible to recommended
            </h2>
            <p className="text-zinc-500 text-center mb-14 max-w-xl mx-auto leading-relaxed">
              Five steps. Each one moves you closer to showing up when buyers ask AI who to use.
            </p>
          </AnimateIn>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-6 sm:gap-3 relative">
            {/* Connecting line behind cards (desktop) */}
            <div className="hidden sm:block absolute top-6 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent pointer-events-none" />

            {[
              {
                step: "1",
                title: "Scan",
                desc: "See exactly what ChatGPT, Perplexity & Google AI say when buyers ask about your space.",
              },
              {
                step: "2",
                title: "See Gaps",
                desc: "Discover which buyer questions should mention you but don\u2019t yet.",
              },
              {
                step: "3",
                title: "Fix",
                desc: "Get pages, actions, and trust signals designed to make AI start citing you.",
              },
              {
                step: "4",
                title: "Verify",
                desc: "Re-scan and see your name appear where it wasn\u2019t before.",
              },
              {
                step: "5",
                title: "Monitor",
                desc: "Know immediately if you disappear from an AI answer you were in last week.",
              },
            ].map((item, i) => (
              <AnimateIn key={item.step} delay={0.1 * i}>
                <GlassCard padding="md" className="text-center h-full relative">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/10">
                    <span className="text-emerald-400 text-sm font-bold">{item.step}</span>
                  </div>
                  <h3 className="text-white font-semibold mb-1.5">{item.title}</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed">{item.desc}</p>
                </GlassCard>
              </AnimateIn>
            ))}
          </div>

          <AnimateIn delay={0.6}>
            <div className="mt-12 text-center flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/pricing"
                className="text-sm text-zinc-500 hover:text-emerald-400 transition-colors inline-flex items-center gap-1"
              >
                See what&rsquo;s included in each plan <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* ========== WHAT YOU GET — CAPABILITIES ========== */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-emerald-500/25 to-transparent" />
        <div className="absolute top-1/3 left-0 w-[400px] h-[400px] bg-emerald-500/[0.03] rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative">
          <AnimateIn>
            <div className="text-center mb-14">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium border bg-emerald-500/10 border-emerald-500/20 text-emerald-400 mb-6">
                <Eye className="w-3.5 h-3.5" />
                What you get
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Everything you need to get AI to recommend you
              </h2>
              <p className="text-zinc-400 max-w-2xl mx-auto leading-relaxed">
                Scan, find gaps, fix them, share your progress, and stay visible — all from one dashboard.
              </p>
            </div>
          </AnimateIn>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: <Search className="w-5 h-5" />,
                title: "3-Platform AI Scanning",
                desc: "See exactly what ChatGPT, Perplexity, and Google AI say when someone asks about your space. Real responses, not estimates.",
                color: "emerald",
              },
              {
                icon: <Target className="w-5 h-5" />,
                title: "Gap Detection",
                desc: "Find the specific buyer questions where AI should mention you but doesn't. These are real conversations happening without you.",
                color: "blue",
              },
              {
                icon: <FileText className="w-5 h-5" />,
                title: "AI-Optimized Fix Pages",
                desc: "Get ready-to-publish content pages structured so AI can cite you — direct answers, comparison tables, FAQ sections, Schema.org markup.",
                color: "purple",
              },
              {
                icon: <Lightbulb className="w-5 h-5" />,
                title: "Content Ideas & Gap Analysis",
                desc: "Understand why AI isn't citing you for specific queries and know exactly what to publish next. Prioritized by impact.",
                color: "amber",
              },
              {
                icon: <ShieldCheck className="w-5 h-5" />,
                title: "Trust Source Tracking",
                desc: "AI decides to recommend you based on third-party signals — G2, Capterra, Trustpilot. See which ones you're missing.",
                color: "rose",
              },
              {
                icon: <Zap className="w-5 h-5" />,
                title: "Weekly Action Plans",
                desc: "Every week you get a prioritized list: which content to write, where to get listed, what to fix first. No guesswork.",
                color: "orange",
              },
            ].map((feature, i) => {
              const colorMap: Record<string, string> = {
                emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
                purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
                amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
                rose: "bg-rose-500/10 text-rose-400 border-rose-500/20",
                orange: "bg-orange-500/10 text-orange-400 border-orange-500/20",
              };
              return (
                <AnimateIn key={feature.title} delay={0.08 * i}>
                  <div className="group h-full bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-6 hover:border-zinc-700/60 hover:bg-zinc-900/80 transition-all duration-300">
                    <div className={`w-11 h-11 rounded-xl border flex items-center justify-center mb-4 ${colorMap[feature.color]}`}>
                      {feature.icon}
                    </div>
                    <h3 className="text-white font-semibold mb-2">{feature.title}</h3>
                    <p className="text-zinc-500 text-sm leading-relaxed">{feature.desc}</p>
                  </div>
                </AnimateIn>
              );
            })}
          </div>

          <AnimateIn delay={0.5}>
            <div className="mt-10 text-center">
              <Link
                href="/features"
                className="text-sm text-zinc-400 hover:text-emerald-400 transition-colors inline-flex items-center gap-1.5"
              >
                See all features in detail <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* ========== SHARE YOUR SCORE — VIRAL ========== */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-zinc-700/50 to-transparent" />

        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: content */}
            <AnimateIn>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium border bg-blue-500/10 border-blue-500/20 text-blue-400 mb-6">
                <Share2 className="w-3.5 h-3.5" />
                Built to share
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Every scan creates a shareable report
              </h2>
              <p className="text-zinc-400 mb-6 leading-relaxed">
                Your AI visibility score lives at <span className="text-white font-medium">cabbageseo.com/r/yourdomain.com</span> — share it on Twitter, embed it in your README, or send it to your team. Complete with OG images and badge embeds.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "Public report page with your score and AI responses",
                  "Embeddable badge for your README or website",
                  "Compare against any competitor's report",
                  "Updates automatically when you rescan",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-zinc-300">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/leaderboard"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors border border-zinc-700"
                >
                  <Trophy className="w-4 h-4 text-amber-400" />
                  View Leaderboard
                </Link>
              </div>
            </AnimateIn>

            {/* Right: mock report card */}
            <AnimateIn delay={0.2}>
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl shadow-black/40">
                <div className="px-5 py-4 border-b border-zinc-800 flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/60" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
                  </div>
                  <span className="text-xs text-zinc-500 font-mono">cabbageseo.com/r/yourdomain.com</span>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-semibold text-lg">yourdomain.com</p>
                      <p className="text-zinc-500 text-sm">AI Visibility Report</p>
                    </div>
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center">
                      <span className="text-2xl font-bold text-emerald-400">72</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { name: "ChatGPT", score: 8, color: "emerald" },
                      { name: "Perplexity", score: 6, color: "blue" },
                      { name: "Google AI", score: 7, color: "purple" },
                    ].map((p) => (
                      <div key={p.name} className="bg-zinc-800/50 rounded-lg p-3 text-center">
                        <p className="text-xs text-zinc-500 mb-1">{p.name}</p>
                        <p className={`text-lg font-bold text-${p.color}-400`}>{p.score}/10</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 h-2 rounded-full bg-emerald-500/20">
                      <div className="h-full w-[72%] rounded-full bg-emerald-500" />
                    </div>
                  </div>
                  <p className="text-xs text-zinc-600 text-center">Scanned across 5 buyer queries • Updated 2 hours ago</p>
                </div>
              </div>
            </AnimateIn>
          </div>
        </div>
      </section>

      {/* ========== PRICING TEASER ========== */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-emerald-500/25 to-transparent" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-emerald-500/[0.03] rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative">
          <AnimateIn>
            <div className="text-center mb-14">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium border bg-amber-500/10 border-amber-500/20 text-amber-400 mb-6">
                <BarChart3 className="w-3.5 h-3.5" />
                Simple pricing
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Start free, scale when ready
              </h2>
              <p className="text-zinc-400 max-w-xl mx-auto">
                Every plan includes the AI scanner. Upgrade for fix pages, action plans, and automated monitoring.
              </p>
            </div>
          </AnimateIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {[
              {
                name: "Scout",
                price: "$39",
                period: "/mo billed yearly",
                desc: "For founders validating their AI visibility",
                features: ["1 site", "3 competitors", "Fix pages", "Gap detection", "Weekly action plans"],
                cta: "Start with Scout",
                popular: false,
              },
              {
                name: "Command",
                price: "$119",
                period: "/mo billed yearly",
                desc: "For teams actively fixing their visibility",
                features: ["5 sites", "10 competitors", "Premium intelligence", "Content ideas", "Priority scanning"],
                cta: "Go Command",
                popular: true,
              },
              {
                name: "Dominate",
                price: "$279",
                period: "/mo billed yearly",
                desc: "For agencies managing multiple brands",
                features: ["25 sites", "25 competitors", "Full API access", "White-label reports", "Dedicated support"],
                cta: "Go Dominate",
                popular: false,
              },
            ].map((plan, i) => (
              <AnimateIn key={plan.name} delay={0.1 * i}>
                <div
                  className={`relative rounded-2xl p-6 h-full flex flex-col ${
                    plan.popular
                      ? "bg-emerald-500/[0.08] border-2 border-emerald-500/30 shadow-lg shadow-emerald-500/10"
                      : "bg-zinc-900/60 border border-zinc-800/60"
                  }`}
                >
                  {plan.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-500 text-black text-xs font-bold rounded-full">
                      Most Popular
                    </span>
                  )}
                  <h3 className="text-white font-bold text-lg mb-1">{plan.name}</h3>
                  <p className="text-zinc-500 text-sm mb-4">{plan.desc}</p>
                  <div className="mb-5">
                    <span className="text-3xl font-bold text-white">{plan.price}</span>
                    <span className="text-zinc-500 text-sm">{plan.period}</span>
                  </div>
                  <ul className="space-y-2.5 mb-6 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-zinc-300">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/signup"
                    className={`block text-center py-3 rounded-xl font-semibold text-sm transition-colors ${
                      plan.popular
                        ? "bg-emerald-500 hover:bg-emerald-400 text-black"
                        : "bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </AnimateIn>
            ))}
          </div>

          <AnimateIn delay={0.4}>
            <div className="mt-8 text-center">
              <Link
                href="/pricing"
                className="text-sm text-zinc-400 hover:text-emerald-400 transition-colors inline-flex items-center gap-1.5"
              >
                Compare all plans in detail <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* ========== WHY ONGOING ========== */}
      <section className="py-24 relative overflow-hidden">
        {/* Gradient divider */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-zinc-700/50 to-transparent" />

        {/* Subtle background orbs */}
        <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-emerald-500/[0.03] rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/[0.03] rounded-full blur-[80px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative">
          <AnimateIn>
            <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-4">
              You could be visible today and gone next week
            </h2>
            <p className="text-zinc-500 text-center mb-14 max-w-2xl mx-auto leading-relaxed">
              AI answers aren&apos;t static. Models retrain, competitors publish, and the recommendations you earned last month can vanish overnight. CabbageSEO watches so you don&apos;t have to.
            </p>
          </AnimateIn>

          {/* Two-phase explanation */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Phase 1: First 30 days */}
            <AnimateIn delay={0.1}>
              <GlassCard padding="lg" className="h-full">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                    <Rocket className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">First 30 days</h3>
                    <p className="text-emerald-400 text-xs font-medium">Action Plans</p>
                  </div>
                </div>
                <ul className="space-y-3">
                  {[
                    "Find every conversation where AI should mention you but doesn't yet",
                    "Get ready-to-publish pages structured so AI can actually cite you",
                    "Know exactly what to do this week — which content to write, where to get listed",
                    "See which trust platforms (G2, Capterra, etc.) you're missing from",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-zinc-400">
                      <span className="text-emerald-400 mt-0.5">&rarr;</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </GlassCard>
            </AnimateIn>

            {/* Phase 2: Every month after */}
            <AnimateIn delay={0.2}>
              <GlassCard padding="lg" className="h-full">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center shadow-lg shadow-blue-500/10">
                    <RefreshCw className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Every month after</h3>
                    <p className="text-blue-400 text-xs font-medium">Automated, continuous</p>
                  </div>
                </div>
                <ul className="space-y-3">
                  {[
                    "Daily scans catch the moment AI stops mentioning you",
                    "New fix pages appear automatically when new gaps are found",
                    "Instant alerts if your visibility drops on any platform",
                    "Updated action plans reprioritize based on what actually changed",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-zinc-400">
                      <span className="text-blue-400 mt-0.5">&rarr;</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </GlassCard>
            </AnimateIn>
          </div>

          {/* Why it never stops */}
          <AnimateIn delay={0.3}>
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 max-w-2xl mx-auto mb-12 backdrop-blur-sm">
              <h3 className="text-white font-semibold text-center mb-4">Why checking once isn&apos;t enough</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: "AI models retrain", detail: "You could disappear from answers after any update" },
                  { label: "New content appears", detail: "AI picks up fresh sources and can drop older ones" },
                  { label: "Queries evolve", detail: "Buyers ask AI different questions every week" },
                  { label: "Trust signals decay", detail: "Outdated profiles make AI trust you less over time" },
                ].map((reason) => (
                  <div key={reason.label} className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-white/[0.02] transition-colors">
                    <span className="w-5 h-5 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    </span>
                    <div>
                      <p className="text-white text-sm font-medium">{reason.label}</p>
                      <p className="text-zinc-500 text-xs">{reason.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </AnimateIn>

          <AnimateIn delay={0.4}>
            <div className="text-center">
              <Link
                href="/signup"
                className="group inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-all duration-300 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98]"
              >
                Start fixing my AI visibility
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <p className="mt-4 text-zinc-600 text-sm">
                From $39/mo &middot; Scans run automatically &middot; Cancel anytime
              </p>
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* ========== FINAL CTA ========== */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
        <GradientOrbs variant="emerald" className="opacity-20" />

        <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
          <AnimateIn>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Are buyers finding you, or your competitors?
            </h2>
            <p className="text-zinc-400 mb-8 text-lg leading-relaxed">
              The free scan takes 10 seconds. No signup. No credit card. See exactly what AI says about your brand — then decide what to do about it.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                  setTimeout(() => {
                    const input = document.querySelector<HTMLInputElement>('input[placeholder="yourdomain.com"]');
                    input?.focus();
                  }, 500);
                }}
                className="group inline-flex items-center gap-2 px-10 py-5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-lg rounded-xl transition-all duration-300 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Search className="w-5 h-5" />
                Scan my domain free
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
              </button>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 px-8 py-5 border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 font-medium rounded-xl transition-colors"
              >
                See pricing
              </Link>
            </div>
            <p className="mt-6 text-zinc-600 text-sm">
              Trusted by founders, agencies, and marketing teams
            </p>
          </AnimateIn>
        </div>
      </section>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
