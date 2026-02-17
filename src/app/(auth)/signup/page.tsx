"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Shield,
  BarChart3,
  FileText,
  Bell,
  Search,
  Check,
} from "lucide-react";
import { trackEvent } from "@/lib/analytics/posthog";

const AUTH_ERRORS: Record<string, string> = {
  auth_callback_error: "Authentication failed. Please try again.",
  auth_not_configured: "Authentication service is temporarily unavailable.",
};

const VALUE_PROPS = [
  {
    icon: BarChart3,
    title: "Daily AI monitoring",
    detail: "Auto-scans across ChatGPT, Perplexity & Google AI",
  },
  {
    icon: Search,
    title: "Gap analysis",
    detail: "See exactly which queries miss you — and why",
  },
  {
    icon: FileText,
    title: "Fix pages",
    detail: "AI-generated content designed to earn citations",
  },
  {
    icon: Bell,
    title: "Drop alerts",
    detail: "Email notification when your visibility shifts",
  },
];

function SignupPageContent() {
  const searchParams = useSearchParams();
  const callbackError = searchParams.get("error");

  const [domainParam, setDomainParam] = useState<string | null>(null);
  const [scoreParam, setScoreParam] = useState<number | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    callbackError
      ? AUTH_ERRORS[callbackError] || "Something went wrong. Please try again."
      : null
  );
  const [success, setSuccess] = useState(false);
  const [showEmail, setShowEmail] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setDomainParam(params.get("domain"));
    const s = params.get("score");
    if (s) setScoreParam(Number(s));
  }, []);

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    setError(null);

    const supabase = createClient();
    if (!supabase) {
      setError("Authentication is not configured");
      setGoogleLoading(false);
      return;
    }

    let callbackUrl = `${window.location.origin}/auth/callback`;
    if (domainParam) {
      callbackUrl += `?domain=${encodeURIComponent(domainParam)}`;
    }

    trackEvent("signup_initiated", { method: "google" });
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setError("Authentication is not configured");
      setLoading(false);
      return;
    }

    let callbackUrl = `${window.location.origin}/auth/callback`;
    if (domainParam) {
      callbackUrl += `?domain=${encodeURIComponent(domainParam)}`;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: callbackUrl,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    trackEvent("signup_completed", { method: "email" });
    setSuccess(true);
  };

  // Full-screen loading overlay while Google OAuth redirects
  if (googleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-zinc-400">Redirecting to Google...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
        <div className="w-full max-w-md p-8 text-center">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 backdrop-blur-sm">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-emerald-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Check your email
            </h2>
            <p className="text-zinc-400 mb-6">
              We&apos;ve sent a confirmation link to{" "}
              <span className="text-white font-medium">{email}</span>
            </p>
            <p className="text-sm text-zinc-500">
              Click the link in the email to activate your account.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const scoreColor =
    scoreParam !== null
      ? scoreParam < 20
        ? "text-red-500"
        : scoreParam < 40
          ? "text-red-400"
          : scoreParam < 60
            ? "text-amber-400"
            : "text-emerald-400"
      : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      <div className="max-w-6xl mx-auto px-6 py-12 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left — Value prop (desktop only) */}
          <div className="hidden lg:block">
            <Link href="/" className="inline-flex items-center gap-2 mb-8">
              <img
                src="/apple-touch-icon.png"
                alt="CabbageSEO"
                className="h-8 w-8 rounded-lg"
              />
              <span className="text-xl font-bold text-white">CabbageSEO</span>
            </Link>

            {/* Score recap if available */}
            {scoreParam !== null && domainParam && (
              <div className="mb-8 p-5 bg-zinc-900/60 border border-zinc-800 rounded-xl">
                <p className="text-zinc-400 text-sm mb-1">
                  {domainParam}&apos;s AI Visibility Score
                </p>
                <div className="flex items-baseline gap-3">
                  <span
                    className={`text-5xl font-black tabular-nums ${scoreColor}`}
                  >
                    {scoreParam}
                  </span>
                  <span className="text-zinc-500 text-lg">/100</span>
                </div>
                {scoreParam < 40 && (
                  <p className="text-red-400/80 text-sm mt-2">
                    AI is not recommending {domainParam} to buyers. CabbageSEO
                    shows you exactly what to fix.
                  </p>
                )}
                {scoreParam >= 40 && scoreParam < 60 && (
                  <p className="text-amber-400/80 text-sm mt-2">
                    AI mentions {domainParam} sometimes — but gaps remain.
                    CabbageSEO finds and fills them.
                  </p>
                )}
                {scoreParam >= 60 && (
                  <p className="text-emerald-400/80 text-sm mt-2">
                    {domainParam} is visible — but AI answers shift weekly.
                    CabbageSEO monitors so you never lose ground.
                  </p>
                )}
              </div>
            )}

            <h1 className="text-3xl font-bold text-white mb-3">
              Stop being invisible to AI
            </h1>
            <p className="text-zinc-400 text-lg mb-8">
              When buyers ask ChatGPT, Perplexity & Google AI who to use —
              CabbageSEO makes sure they find you.
            </p>

            {/* Value props */}
            <div className="space-y-4 mb-8">
              {VALUE_PROPS.map((vp) => (
                <div key={vp.title} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <vp.icon className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{vp.title}</p>
                    <p className="text-zinc-500 text-sm">{vp.detail}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Trust signals */}
            <div className="flex flex-wrap gap-4 text-xs text-zinc-500">
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                Cancel anytime
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                No contracts
              </span>
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-500" />
                Your data stays private
              </span>
            </div>
          </div>

          {/* Right — Auth form */}
          <div>
            {/* Mobile logo */}
            <div className="text-center mb-6 lg:hidden">
              <Link href="/" className="inline-flex items-center gap-2">
                <img
                  src="/apple-touch-icon.png"
                  alt="CabbageSEO"
                  className="h-10 w-10 rounded-xl"
                />
                <span className="text-2xl font-bold text-white">
                  CabbageSEO
                </span>
              </Link>
            </div>

            {/* Mobile score recap */}
            {scoreParam !== null && domainParam && (
              <div className="mb-4 p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl text-center lg:hidden">
                <p className="text-zinc-400 text-xs mb-1">{domainParam}</p>
                <span
                  className={`text-4xl font-black tabular-nums ${scoreColor}`}
                >
                  {scoreParam}
                </span>
                <span className="text-zinc-500 text-sm">/100</span>
              </div>
            )}

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 backdrop-blur-sm">
              <div className="text-center mb-5">
                <h2 className="text-xl font-bold text-white mb-1">
                  {domainParam
                    ? `Start fixing ${domainParam}'s AI visibility`
                    : "Start fixing your AI visibility"}
                </h2>
                <p className="text-zinc-500 text-sm">
                  Create your account to get started
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Google OAuth — Primary CTA */}
              <Button
                type="button"
                onClick={handleGoogleSignup}
                disabled={loading}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold h-12 text-base"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </Button>

              {/* Risk reversal below CTA */}
              <div className="flex items-center justify-center gap-3 mt-3 mb-4">
                <span className="text-xs text-zinc-500">Plans from $39/mo</span>
                <span className="text-zinc-700">&middot;</span>
                <span className="text-xs text-zinc-500">Cancel anytime</span>
                <span className="text-zinc-700">&middot;</span>
                <span className="text-xs text-zinc-500">No contracts</span>
              </div>

              {/* Email toggle — collapsed by default to reduce friction */}
              {!showEmail ? (
                <button
                  onClick={() => setShowEmail(true)}
                  className="w-full text-center text-sm text-zinc-500 hover:text-zinc-400 transition-colors py-2"
                >
                  Or sign up with email
                </button>
              ) : (
                <>
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-zinc-700" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-zinc-900/50 text-zinc-500">
                        Or sign up with email
                      </span>
                    </div>
                  </div>

                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-zinc-300">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-zinc-300">
                        Password
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder={"\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                        className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500"
                      />
                      <p className="text-xs text-zinc-500">
                        At least 8 characters
                      </p>
                    </div>

                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-zinc-700 hover:bg-zinc-600 text-white"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        "Create account"
                      )}
                    </Button>
                  </form>
                </>
              )}

              <p className="mt-5 text-center text-sm text-zinc-400">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-emerald-400 hover:text-emerald-300"
                >
                  Sign in
                </Link>
              </p>

              <p className="mt-3 text-center text-xs text-zinc-600">
                By signing up, you agree to our{" "}
                <Link
                  href="/terms"
                  className="text-zinc-500 hover:text-zinc-400"
                >
                  Terms
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  className="text-zinc-500 hover:text-zinc-400"
                >
                  Privacy Policy
                </Link>
              </p>
            </div>

            {/* Mobile value props */}
            <div className="mt-6 space-y-3 lg:hidden">
              {VALUE_PROPS.map((vp) => (
                <div key={vp.title} className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-sm text-zinc-400">{vp.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      }
    >
      <SignupPageContent />
    </Suspense>
  );
}
