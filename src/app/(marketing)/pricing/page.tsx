/**
 * Pricing Page - WITH MONTHLY/YEARLY TOGGLE
 * 
 * Auto-checks DON'T count against limits (they're included)
 * Manual checks = on-demand checks users trigger
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, X, Zap, Building2, Rocket } from "lucide-react";
import { CITATION_PLANS, TRIAL_DAYS } from "@/lib/billing/citation-plans";

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img 
              src="/apple-touch-icon.png" 
              alt="CabbageSEO" 
              className="w-9 h-9 rounded-xl"
            />
            <span className="font-bold text-white text-lg">CabbageSEO</span>
          </Link>
          
          <nav className="flex items-center gap-6">
            <Link href="/pricing" className="text-emerald-400 font-medium">
              Pricing
            </Link>
            <Link href="/login" className="text-zinc-400 hover:text-white transition-colors">
              Login
            </Link>
            <Link
              href="/signup"
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Start Free Trial
            </Link>
          </nav>
        </div>
      </header>

      <PricingContent />
    </main>
  );
}

function PricingContent() {
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly");
  
  const plans: Array<{
    id: string;
    name: string;
    description: string;
    monthlyPrice: number;
    yearlyPrice: number;
    icon: typeof Zap;
    color: string;
    cta: string;
    ctaHref: string;
    badge?: string;
    popular?: boolean;
    features: Array<{ text: string; included: boolean; highlight?: boolean }>;
  }> = [
    {
      id: CITATION_PLANS.free.id,
      name: CITATION_PLANS.free.name,
      description: CITATION_PLANS.free.description,
      monthlyPrice: CITATION_PLANS.free.monthlyPrice,
      yearlyPrice: CITATION_PLANS.free.yearlyPrice,
      icon: Zap,
      color: "gray",
      cta: "Start Free Trial",
      ctaHref: "/signup",
      badge: `${TRIAL_DAYS} Days Free`,
      features: [
        { text: "1 website", included: true },
        { text: "3 basic queries per check", included: true },
        { text: "3 manual checks/day", included: true },
        { text: "7-day history", included: true },
        { text: "AI Visibility Score", included: true },
        { text: "Custom queries", included: false },
        { text: "Competitor tracking", included: false },
        { text: "Auto monitoring", included: false },
        { text: "\"Why Not Me?\" Analysis", included: false },
      ],
    },
    {
      id: CITATION_PLANS.starter.id,
      name: CITATION_PLANS.starter.name,
      description: "Know why competitors win",
      monthlyPrice: CITATION_PLANS.starter.monthlyPrice,
      yearlyPrice: CITATION_PLANS.starter.yearlyPrice,
      icon: Rocket,
      color: "emerald",
      cta: "Get Started",
      ctaHref: `/signup?plan=starter&interval=${billingInterval}`,
      popular: true,
      features: [
        { text: "3 websites", included: true },
        { text: "10 queries per check", included: true, highlight: true },
        { text: "5 custom queries per site", included: true, highlight: true },
        { text: "Unlimited manual checks", included: true },
        { text: "30-day history", included: true },
        { text: "2 competitors per site", included: true },
        { text: "Daily auto-monitoring", included: true },
        { text: "\"Why Not Me?\" Analysis (5/mo)", included: true, highlight: true },
        { text: "Content Ideas (3/mo)", included: true },
        { text: "Weekly Action Plan", included: false },
      ],
    },
    {
      id: CITATION_PLANS.pro.id,
      name: CITATION_PLANS.pro.name,
      description: "Win every AI conversation",
      monthlyPrice: CITATION_PLANS.pro.monthlyPrice,
      yearlyPrice: CITATION_PLANS.pro.yearlyPrice,
      icon: Building2,
      color: "violet",
      cta: "Go Pro",
      ctaHref: `/signup?plan=pro&interval=${billingInterval}`,
      badge: "Best Value",
      features: [
        { text: "10 websites", included: true },
        { text: "20 queries per check", included: true, highlight: true },
        { text: "Unlimited custom queries", included: true, highlight: true },
        { text: "AI query discovery", included: true, highlight: true },
        { text: "Unlimited manual checks", included: true },
        { text: "1-year history", included: true },
        { text: "10 competitors per site", included: true },
        { text: "Hourly auto-monitoring", included: true },
        { text: "Unlimited \"Why Not Me?\"", included: true, highlight: true },
        { text: "Weekly Action Playbook", included: true, highlight: true },
      ],
    },
  ];

  return (
    <>
      {/* Header */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-emerald-400 text-sm font-medium tracking-wide uppercase">
            Citation Intelligence
          </span>
          <h1 className="mt-4 text-4xl md:text-5xl font-bold text-white">
            Know <span className="text-emerald-400">why</span> AI chooses your competitors
          </h1>
          <p className="mt-6 text-lg text-zinc-400 max-w-2xl mx-auto">
            Track citations across ChatGPT, Perplexity, and Google AI. 
            See exactly what to do to get cited instead of your competitors.
          </p>
          
          {/* Monthly/Yearly Toggle */}
          <div className="mt-8 inline-flex items-center gap-2 bg-zinc-800 rounded-lg p-1">
            <button
              onClick={() => setBillingInterval("monthly")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingInterval === "monthly"
                  ? "bg-emerald-500 text-black"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval("yearly")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingInterval === "yearly"
                  ? "bg-emerald-500 text-black"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Yearly
              <span className="ml-1.5 text-xs bg-emerald-600 text-white px-1.5 py-0.5 rounded">
                Save 17%
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const price = billingInterval === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
              
              return (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl p-6 ${
                    plan.popular
                      ? "bg-emerald-950/50 border-2 border-emerald-500/50 shadow-lg shadow-emerald-500/10"
                      : "bg-zinc-900 border border-zinc-800"
                  }`}
                >
                  {/* Popular badge */}
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-emerald-500 text-black text-xs font-bold px-3 py-1 rounded-full">
                        MOST POPULAR
                      </span>
                    </div>
                  )}

                  {/* Trial badge */}
                  {plan.badge && !plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-zinc-700 text-white text-xs font-medium px-3 py-1 rounded-full">
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  {/* Plan header */}
                  <div className="text-center mb-6 pt-2">
                    <plan.icon className={`w-10 h-10 mx-auto mb-3 ${
                      plan.color === "emerald" ? "text-emerald-400" :
                      plan.color === "violet" ? "text-violet-400" :
                      "text-zinc-400"
                    }`} />
                    <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                    <p className="text-sm text-zinc-500 mt-1">{plan.description}</p>
                  </div>

                  {/* Price */}
                  <div className="text-center mb-6">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold text-white">
                        ${price}
                      </span>
                      {price > 0 && (
                        <span className="text-zinc-500">/mo</span>
                      )}
                    </div>
                    {billingInterval === "yearly" && plan.monthlyPrice > 0 && (
                      <p className="text-sm text-emerald-400 mt-1">
                        ${plan.monthlyPrice * 12 * 0.83 | 0}/year (billed annually)
                      </p>
                    )}
                    {billingInterval === "monthly" && plan.yearlyPrice > 0 && (
                      <p className="text-sm text-zinc-500 mt-1">
                        ${plan.yearlyPrice}/mo billed yearly
                      </p>
                    )}
                  </div>

                  {/* CTA */}
                  <Link
                    href={plan.ctaHref}
                    className={`block w-full py-3 px-4 rounded-lg text-center font-medium transition-colors ${
                      plan.popular
                        ? "bg-emerald-500 hover:bg-emerald-400 text-black"
                        : "bg-zinc-800 hover:bg-zinc-700 text-white"
                    }`}
                  >
                    {plan.cta}
                  </Link>

                  {/* Features */}
                  <ul className="mt-6 space-y-3">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        {feature.included ? (
                          <Check className={`w-5 h-5 shrink-0 ${
                            feature.highlight 
                              ? "text-violet-400" 
                              : "text-emerald-400"
                          }`} />
                        ) : (
                          <X className="w-5 h-5 text-zinc-600 shrink-0" />
                        )}
                        <span className={`text-sm ${
                          feature.included ? "text-zinc-300" : "text-zinc-600"
                        }`}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How monitoring works */}
      <section className="py-16 px-6 border-t border-zinc-800">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            How Monitoring Works
          </h2>
          
          <div className="bg-zinc-900 rounded-xl p-6 space-y-6">
            <div>
              <h3 className="font-semibold text-white mb-2">Manual Checks</h3>
              <p className="text-sm text-zinc-400">
                On-demand checks you trigger from the dashboard. Free gets 3/day, 
                paid plans get unlimited.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-emerald-400 mb-2">Auto-Monitoring (Paid)</h3>
              <p className="text-sm text-zinc-400">
                We automatically check all your sites in the background—<strong>doesn&apos;t count 
                against any limits</strong>. Starter gets daily checks, Pro gets hourly. 
                You&apos;ll get email alerts when new citations are found.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-6 border-t border-zinc-800">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            Questions
          </h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-white mb-2">
                What happens after the free trial?
              </h3>
              <p className="text-sm text-zinc-400">
                After {TRIAL_DAYS} days, you&apos;ll need to upgrade to continue using 
                CabbageSEO. Your data is preserved—just pick a plan to resume.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium text-white mb-2">
                Do auto-checks count against my limits?
              </h3>
              <p className="text-sm text-zinc-400">
                No! Auto-monitoring runs in the background and is included with paid plans. 
                Only manual on-demand checks have limits (and paid plans have unlimited).
              </p>
            </div>
            
            <div>
              <h3 className="font-medium text-white mb-2">
                How does citation detection work?
              </h3>
              <p className="text-sm text-zinc-400">
                We query Perplexity (direct API with citations), Google AI (Gemini with 
                search grounding), and ChatGPT (knowledge detection). We detect when 
                they mention or recommend your website.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 border-t border-zinc-800">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            See what AI says about your brand
          </h2>
          <p className="text-zinc-400 mb-6">
            Start your {TRIAL_DAYS}-day free trial. No credit card required.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-medium px-6 py-3 rounded-lg transition-colors"
          >
            Start Free Trial
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-zinc-800">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <img 
                src="/apple-touch-icon.png" 
                alt="CabbageSEO" 
                className="w-10 h-10 rounded-xl"
              />
              <div>
                <span className="font-bold text-white text-lg">CabbageSEO</span>
                <p className="text-xs text-zinc-500">AI Search Intelligence</p>
              </div>
            </div>
            
            {/* Links */}
            <div className="flex items-center gap-6 text-sm">
              <Link href="/pricing" className="text-zinc-400 hover:text-white transition-colors">
                Pricing
              </Link>
              <Link href="/login" className="text-zinc-400 hover:text-white transition-colors">
                Login
              </Link>
              <a 
                href="mailto:arjun@cabbageseo.com" 
                className="text-zinc-400 hover:text-white transition-colors"
              >
                Contact
              </a>
            </div>
            
            {/* Social */}
            <div className="flex items-center gap-4">
              <a 
                href="https://x.com/Arjun06061" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <span className="text-zinc-600 text-sm">
                Questions? <a href="https://x.com/Arjun06061" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300">DM me on X</a>
              </span>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-zinc-800 text-center">
            <p className="text-sm text-zinc-600">
              © {new Date().getFullYear()} CabbageSEO. Built by{" "}
              <a 
                href="https://x.com/Arjun06061" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-zinc-400 hover:text-white"
              >
                @Arjun06061
              </a>
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
