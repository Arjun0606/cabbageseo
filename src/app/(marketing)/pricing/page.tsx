/**
 * Pricing Page - HONEST VERSION
 * 
 * Only shows features that are actually built.
 * No Agency plan until those features exist.
 */

import Link from "next/link";
import { Check, X, Zap, Building2, Rocket } from "lucide-react";
import { CITATION_PLANS, TRIAL_DAYS } from "@/lib/billing/citation-plans";

export const metadata = {
  title: "Pricing | CabbageSEO",
  description: "Simple, honest pricing for AI brand intelligence",
};

export default function PricingPage() {
  const plans = [
    {
      ...CITATION_PLANS.free,
      icon: Zap,
      color: "gray",
      cta: "Start Free Trial",
      ctaHref: "/signup",
      badge: `${TRIAL_DAYS} Days Free`,
      features: [
        { text: "1 website", included: true },
        { text: "3 manual checks/day", included: true },
        { text: "7-day history", included: true },
        { text: "GEO Score", included: true },
        { text: "Competitor tracking", included: false },
        { text: "Email alerts", included: false },
        { text: "CSV export", included: false },
        { text: "Daily auto-checks", included: false },
      ],
    },
    {
      ...CITATION_PLANS.starter,
      icon: Rocket,
      color: "emerald",
      cta: "Get Started",
      ctaHref: "/signup?plan=starter",
      popular: true,
      features: [
        { text: "3 websites", included: true },
        { text: "100 checks/month", included: true },
        { text: "30-day history", included: true },
        { text: "GEO Score + Tips", included: true },
        { text: "2 competitors per site", included: true },
        { text: "Email alerts", included: true },
        { text: "Weekly reports", included: true },
        { text: "CSV export", included: true },
        { text: "Daily auto-checks", included: true },
      ],
    },
    {
      ...CITATION_PLANS.pro,
      icon: Building2,
      color: "violet",
      cta: "Go Pro",
      ctaHref: "/signup?plan=pro",
      features: [
        { text: "10 websites", included: true },
        { text: "500 checks/month", included: true },
        { text: "1-year history", included: true },
        { text: "GEO Score + Tips", included: true },
        { text: "10 competitors per site", included: true },
        { text: "Email alerts", included: true },
        { text: "Weekly reports", included: true },
        { text: "CSV export", included: true },
        { text: "Hourly auto-checks", included: true, highlight: true },
      ],
    },
  ];

  return (
    <main className="min-h-screen bg-zinc-950">
      {/* Header */}
      <section className="pt-24 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-emerald-400 text-sm font-medium tracking-wide uppercase">
            Simple Pricing
          </span>
          <h1 className="mt-4 text-4xl md:text-5xl font-bold text-white">
            Know when AI talks about you
          </h1>
          <p className="mt-6 text-lg text-zinc-400 max-w-2xl mx-auto">
            Track citations across ChatGPT, Perplexity, and Google AI. 
            See who AI recommends—you or your competitors.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => (
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
                      ${plan.monthlyPrice}
                    </span>
                    {plan.monthlyPrice > 0 && (
                      <span className="text-zinc-500">/mo</span>
                    )}
                  </div>
                  {plan.yearlyPrice > 0 && plan.yearlyPrice < plan.monthlyPrice && (
                    <p className="text-sm text-emerald-400 mt-1">
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
                          (feature as { highlight?: boolean }).highlight 
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
            ))}
          </div>
        </div>
      </section>

      {/* How it works - HONEST */}
      <section className="py-16 px-6 border-t border-zinc-800">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            How Citation Detection Works
          </h2>
          
          <div className="bg-zinc-900 rounded-xl p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                <span className="text-emerald-400 font-bold text-sm">1</span>
              </div>
              <div>
                <h3 className="font-medium text-white">Perplexity</h3>
                <p className="text-sm text-zinc-400">
                  Direct API access. We check the citations array returned by Perplexity 
                  for your domain. High confidence detection.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                <span className="text-blue-400 font-bold text-sm">2</span>
              </div>
              <div>
                <h3 className="font-medium text-white">Google AI</h3>
                <p className="text-sm text-zinc-400">
                  Uses Gemini with search grounding. We check the grounding metadata 
                  for your domain in search results.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0">
                <span className="text-violet-400 font-bold text-sm">3</span>
              </div>
              <div>
                <h3 className="font-medium text-white">ChatGPT</h3>
                <p className="text-sm text-zinc-400">
                  Knowledge detection via GPT-4. We check if ChatGPT knows about your 
                  brand from its training data. No live web access.
                </p>
              </div>
            </div>
          </div>
          
          <p className="text-xs text-zinc-500 text-center mt-4">
            We run automated checks against AI platforms and detect when they mention or 
            recommend your website. This is not official citation telemetry—it&apos;s 
            response analysis.
          </p>
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
                Can I change plans later?
              </h3>
              <p className="text-sm text-zinc-400">
                Yes. Upgrade or downgrade anytime. When downgrading, your data beyond 
                the new plan&apos;s history limit will be archived.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium text-white mb-2">
                What counts as a &quot;check&quot;?
              </h3>
              <p className="text-sm text-zinc-400">
                One check = querying all three AI platforms (Perplexity, Google AI, 
                ChatGPT) for one of your domains. Auto-checks run daily or hourly 
                depending on your plan.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium text-white mb-2">
                Do you have an agency plan?
              </h3>
              <p className="text-sm text-zinc-400">
                We&apos;re building agency features (white-label reports, team seats, API). 
                Sign up for Pro and email us at hello@cabbageseo.com—we&apos;ll notify you 
                when it launches.
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
    </main>
  );
}
