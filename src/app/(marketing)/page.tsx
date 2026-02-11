"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, AlertTriangle, Search, Loader2, Mail, TrendingDown, Rocket, BarChart3, ShieldCheck } from "lucide-react";
import { GridAnimation } from "@/components/backgrounds/grid-animation";
import { AnimateIn } from "@/components/motion/animate-in";
import { GlassCard } from "@/components/ui/glass-card";
import { ScanProgress } from "@/components/homepage/scan-progress";
import { ScanResults, type TeaserData } from "@/components/homepage/scan-results";
import { SocialProofBar } from "@/components/homepage/social-proof-bar";

const SCAN_STEPS = [
  "Connecting to AI platforms...",
  "Asking Perplexity who they recommend...",
  "Asking Google AI about your market...",
  "Asking ChatGPT for recommendations...",
  "Extracting brand mentions...",
  "Scoring across 6 visibility factors...",
  "Generating your custom content preview...",
];

type ScanState = "idle" | "scanning" | "email_gate" | "results" | "error";

function HomeContent() {
  const searchParams = useSearchParams();
  const domainParam = searchParams.get("domain");

  const [domain, setDomain] = useState(domainParam || "");
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [scanStep, setScanStep] = useState(0);
  const [scanData, setScanData] = useState<TeaserData | null>(null);
  const [scanError, setScanError] = useState("");
  const [emailCaptured, setEmailCaptured] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasAutoScanned = useRef(false);

  // Restore email gate state from sessionStorage
  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("cseo_email_captured")) {
      setEmailCaptured(true);
    }
  }, []);

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

        // If email already captured (e.g. returning visitor), go straight to results
        const alreadyCaptured = typeof window !== "undefined" && sessionStorage.getItem("cseo_email_captured");
        setScanState(alreadyCaptured || emailCaptured ? "results" : "email_gate");

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

  const [gateEmail, setGateEmail] = useState("");
  const [gateLoading, setGateLoading] = useState(false);
  const [gateError, setGateError] = useState("");

  const handleEmailCaptured = () => {
    setEmailCaptured(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("cseo_email_captured", "1");
    }
    // Transition from gate to results
    if (scanState === "email_gate" && scanData) {
      setScanState("results");
    }
  };

  const handleEmailGate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gateEmail.trim()) return;
    setGateLoading(true);
    setGateError("");

    try {
      const res = await fetch("/api/teaser/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: gateEmail.trim(),
          domain: scanData?.domain || domain,
          reportId: scanData?.reportId || null,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to subscribe");
      handleEmailCaptured();
    } catch (err) {
      setGateError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setGateLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* ========== HERO ========== */}
      <section className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center overflow-hidden py-20">
        <GridAnimation className="opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-zinc-950 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 text-center w-full">
          {/* Platform badges */}
          <AnimateIn delay={0.2} direction="up">
            <div className="flex justify-center gap-3 mb-10">
              {[
                { name: "ChatGPT", color: "border-emerald-500/20 text-emerald-400" },
                { name: "Perplexity", color: "border-blue-500/20 text-blue-400" },
                { name: "Google AI", color: "border-purple-500/20 text-purple-400" },
              ].map((p) => (
                <span
                  key={p.name}
                  className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border bg-white/[0.03] backdrop-blur-sm ${p.color}`}
                >
                  {p.name}
                </span>
              ))}
            </div>
          </AnimateIn>

          <AnimateIn delay={0.4} direction="up">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white mb-8 leading-[1.1] tracking-tight">
              When buyers ask AI<br className="hidden sm:block" />
              who to use, <span className="text-emerald-400">are you<br className="hidden sm:block" />
              the answer?</span>
            </h1>
          </AnimateIn>

          <AnimateIn delay={0.6} direction="up">
            <p className="text-xl text-zinc-400 mb-4 max-w-2xl mx-auto leading-relaxed">
              Find out in 10 seconds. Most businesses are invisible to AI and don&apos;t know it.
            </p>
            <p className="text-sm text-red-400/80 font-medium mb-10 max-w-xl mx-auto">
              AI recommendations shift weekly. Check before your competitors do.
            </p>
          </AnimateIn>

          {/* Domain input */}
          <AnimateIn delay={0.8} direction="up">
            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto mb-6">
              <GlassCard padding="sm" hover={false} className="!p-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="yourdomain.com"
                    className="flex-1 px-5 py-4 bg-white/[0.04] border border-white/[0.06] rounded-lg text-white text-lg placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 transition-all"
                    disabled={scanState === "scanning"}
                    autoFocus={!domainParam}
                  />
                  <button
                    type="submit"
                    disabled={scanState === "scanning" || !domain.trim()}
                    className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-700 disabled:cursor-not-allowed text-black font-bold rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
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
              </GlassCard>
            </form>
          </AnimateIn>

          <AnimateIn delay={1.0} direction="up">
            <div className="flex items-center justify-center gap-6 text-sm text-zinc-500">
              <span>Takes 10 seconds</span>
              <span className="text-zinc-700">·</span>
              <span>No signup required</span>
              <span className="text-zinc-700">·</span>
              <span>Real AI responses</span>
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

      {/* ========== EMAIL GATE (shown after scan, before results) ========== */}
      {scanState === "email_gate" && scanData && (
        <section ref={resultsRef} id="scan-results" className="py-12">
          <div className="max-w-lg mx-auto px-6">
            <AnimateIn>
              <div className="relative">
                {/* Blurred teaser behind the gate */}
                <div className="select-none pointer-events-none blur-md opacity-40" aria-hidden="true">
                  <div className="bg-gradient-to-br from-red-950/80 via-zinc-900 to-zinc-900 border-2 border-red-500/30 rounded-2xl p-8 text-center">
                    <div className="text-8xl font-black text-red-400 mb-2">{scanData.summary.visibilityScore ?? 0}</div>
                    <p className="text-zinc-400">AI Visibility Score</p>
                    <div className="mt-4 space-y-2">
                      <div className="h-10 bg-white/[0.04] rounded-lg" />
                      <div className="h-10 bg-white/[0.04] rounded-lg" />
                      <div className="h-10 bg-white/[0.04] rounded-lg" />
                    </div>
                  </div>
                </div>

                {/* Email gate overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full max-w-md mx-auto bg-zinc-900/95 backdrop-blur-sm border border-zinc-700/50 rounded-2xl p-8 shadow-2xl">
                    <div className="text-center mb-6">
                      <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                        <TrendingDown className="w-7 h-7 text-red-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">
                        Your AI Visibility Report is ready
                      </h3>
                      <p className="text-zinc-400 text-sm">
                        We found{" "}
                        <span className="text-red-400 font-semibold">
                          {scanData.summary.brandsDetected?.length || 0} brands
                        </span>{" "}
                        AI recommends instead of{" "}
                        <span className="text-white font-medium">{scanData.domain}</span>.
                        Enter your email to see your full report.
                      </p>
                    </div>

                    <form onSubmit={handleEmailGate} className="space-y-3">
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                          type="email"
                          value={gateEmail}
                          onChange={(e) => setGateEmail(e.target.value)}
                          placeholder="you@company.com"
                          required
                          autoFocus
                          className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 transition-all"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={gateLoading}
                        className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                      >
                        {gateLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            See My Report
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                      {gateError && (
                        <p className="text-red-400 text-sm text-center">{gateError}</p>
                      )}
                    </form>

                    <p className="text-center text-zinc-500 text-xs mt-4">
                      Plus free weekly rescans · Unsubscribe anytime
                    </p>
                  </div>
                </div>
              </div>
            </AnimateIn>
          </div>
        </section>
      )}

      {/* ========== RESULTS ========== */}
      {scanState === "results" && scanData && (
        <section ref={resultsRef} id="scan-results">
          <ScanResults data={scanData} />
        </section>
      )}

      {/* ========== SOCIAL PROOF (always visible) ========== */}
      <section className="pb-16">
        <div className="max-w-7xl mx-auto px-6">
          <SocialProofBar />
        </div>
      </section>

      {/* ========== HOW IT WORKS — CORE LOOP ========== */}
      <section className="py-20 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-6">
          <AnimateIn>
            <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-4">
              How it works
            </h2>
            <p className="text-zinc-500 text-center mb-12 max-w-xl mx-auto leading-relaxed">
              The GEO loop: scan, find gaps, fix, verify, monitor. Repeat until AI recommends you.
            </p>
          </AnimateIn>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-6 sm:gap-3">
            {[
              {
                step: "1",
                title: "Scan",
                desc: "We query ChatGPT, Perplexity & Google AI with real buyer questions.",
              },
              {
                step: "2",
                title: "See Gaps",
                desc: "Find which queries you\u2019re losing and who\u2019s winning instead.",
              },
              {
                step: "3",
                title: "Fix",
                desc: "Get AI-generated pages and actions tailored to each gap.",
              },
              {
                step: "4",
                title: "Verify",
                desc: "Re-scan to confirm AI now recommends you.",
              },
              {
                step: "5",
                title: "Monitor",
                desc: "Automated checks catch changes. Alerts if you drop.",
              },
            ].map((item, i) => (
              <AnimateIn key={item.step} delay={0.1 * i}>
                <GlassCard padding="md" className="text-center h-full">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3">
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

      {/* ========== WHAT HAPPENS WHEN YOU SUBSCRIBE ========== */}
      <section className="py-20 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-6">
          <AnimateIn>
            <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-4">
              What happens when you subscribe
            </h2>
            <p className="text-zinc-500 text-center mb-12 max-w-xl mx-auto">
              From day one, CabbageSEO works to get AI recommending you.
            </p>
          </AnimateIn>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                icon: <Rocket className="w-6 h-6 text-emerald-400" />,
                title: "Your 30-day sprint starts",
                desc: "Week-by-week actions tailored to your gaps. Specific tasks with clear instructions, not a dashboard to stare at.",
              },
              {
                icon: <ShieldCheck className="w-6 h-6 text-blue-400" />,
                title: "Monitoring activates",
                desc: "Daily or hourly scans across ChatGPT, Perplexity & Google AI. Instant alerts if your visibility drops.",
              },
              {
                icon: <BarChart3 className="w-6 h-6 text-amber-400" />,
                title: "Your score improves",
                desc: "As you execute, your AI visibility score climbs. Track momentum, see which actions moved the needle.",
              },
            ].map((card, i) => (
              <AnimateIn key={i} delay={0.1 * i}>
                <GlassCard padding="md" className="h-full text-center">
                  <div className="w-12 h-12 rounded-xl bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
                    {card.icon}
                  </div>
                  <h3 className="text-white font-semibold mb-2">{card.title}</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed">{card.desc}</p>
                </GlassCard>
              </AnimateIn>
            ))}
          </div>

          <AnimateIn delay={0.4}>
            <div className="mt-12 text-center">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-colors shadow-lg shadow-emerald-500/20"
              >
                Start fixing my AI visibility
                <ArrowRight className="w-5 h-5" />
              </Link>
              <p className="mt-3 text-zinc-600 text-sm">
                From $49/mo · Cancel anytime
              </p>
            </div>
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
