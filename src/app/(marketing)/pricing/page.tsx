"use client";

/**
 * PRICING PAGE - AI REVENUE INTELLIGENCE
 * 
 * Sell the outcome: "Know where money is going. Take it back."
 * 
 * NO citations. NO GEO scores.
 * Only: Revenue loss. Competitive intelligence. Action plans.
 */

import Link from "next/link";
import { Check, X, ArrowRight, DollarSign, Target, Zap, TrendingUp, Users, Bell, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CITATION_PLANS } from "@/lib/billing/citation-plans";

export default function PricingPage() {
  const plans = [
    {
      name: "Free",
      tagline: "Quick check",
      price: 0,
      period: "forever",
      description: "Manual checks only. No automated monitoring, no exports, no API access.",
      cta: "Run Free Check",
      ctaVariant: "outline" as const,
      features: [
        { name: "1 site", included: true },
        { name: "3 manual checks/day", included: true },
        { name: "7-day history", included: true },
        { name: "View raw AI responses", included: true },
        { name: "Automated monitoring", included: false },
        { name: "CSV export", included: false },
        { name: "API access", included: false },
        { name: "Email alerts", included: false },
      ],
    },
    {
      name: "Starter",
      tagline: "Know where you're losing",
      price: 29,
      period: "/month",
      description: "Daily automated monitoring with 100 checks/month. 30-day history.",
      cta: "Start Winning — 7 Days Free",
      ctaVariant: "outline" as const,
      features: [
        { name: "3 sites", included: true },
        { name: "100 checks/month", included: true },
        { name: "Daily automated checks", included: true },
        { name: "30-day history", included: true },
        { name: "2 competitors per site", included: true },
        { name: "5 content fixes/month", included: true },
        { name: "Email alerts", included: true },
        { name: "CSV export", included: true },
      ],
      popular: false,
    },
    {
      name: "Pro",
      tagline: "Take back your market",
      price: 79,
      period: "/month",
      description: "Hourly monitoring with 1000 checks/month. Full API access. 1-year history.",
      cta: "Stop Losing Customers",
      ctaVariant: "default" as const,
      features: [
        { name: "10 sites", included: true },
        { name: "1000 checks/month", included: true },
        { name: "Hourly automated checks", included: true },
        { name: "1-year history", included: true },
        { name: "10 competitors per site", included: true },
        { name: "Unlimited content fixes", included: true },
        { name: "API access", included: true },
        { name: "Priority support", included: true },
      ],
      popular: true,
    },
  ];

  return (
    <div className="bg-black min-h-screen">
      {/* Header */}
      <section className="pt-24 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-8">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400 text-sm font-medium">
              7-day free trial on all paid plans
          </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Stop losing money to competitors
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            Know exactly where AI is sending customers — and how to redirect them to you.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative p-6 rounded-2xl border ${
                  plan.popular
                    ? "bg-gradient-to-br from-emerald-500/20 to-zinc-800 border-emerald-500/40"
                    : "bg-zinc-800/80 border-zinc-700"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-emerald-500 text-black text-xs font-bold px-3 py-1 rounded-full">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white mb-1">{plan.name}</h2>
                  <p className="text-zinc-400 text-sm mb-4">{plan.tagline}</p>
                  
                  <div className="flex items-baseline gap-1 mb-2">
                    {plan.price === 0 ? (
                      <span className="text-4xl font-bold text-white">Free</span>
                    ) : (
                      <>
                        <span className="text-4xl font-bold text-white">${plan.price}</span>
                        <span className="text-zinc-400">{plan.period}</span>
                      </>
                    )}
                  </div>
                  
                  <p className="text-sm text-zinc-300">{plan.description}</p>
                </div>

                <Link href="/signup">
                  <Button
                    className={`w-full mb-6 ${
                    plan.popular
                      ? "bg-emerald-500 hover:bg-emerald-400 text-black font-semibold"
                      : "border-zinc-500 text-white hover:bg-zinc-700 hover:text-white"
                  }`}
                    variant={plan.ctaVariant}
                >
                  {plan.cta}
                  </Button>
                </Link>

                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      {feature.included ? (
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <X className="w-4 h-4 text-zinc-500 shrink-0" />
                      )}
                      <span className={feature.included ? "text-white" : "text-zinc-500"}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What Each Plan Unlocks */}
      <section className="py-24 px-6 border-t border-zinc-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-white mb-16">
            What you unlock at each level
          </h2>
          
          <div className="space-y-8">
            {/* Free */}
            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center">
                  <Target className="w-5 h-5 text-zinc-400" />
                </div>
            <div>
                  <h3 className="text-xl font-semibold text-white">Free</h3>
                  <p className="text-zinc-500">The wake-up call</p>
                </div>
              </div>
              <p className="text-zinc-400">
                See which high-intent queries you&apos;re missing and which competitors AI recommends. 
                Manual checks only — no ongoing monitoring.
              </p>
            </div>
            
            {/* Starter */}
            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">Starter — $29/mo</h3>
                  <p className="text-zinc-500">Daily intelligence</p>
                </div>
              </div>
              <p className="text-zinc-400 mb-4">
                Track your AI market share daily. Know which competitors are winning and get 5 content fix analyses per month to start clawing back your position.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-sm">Daily checks</span>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-sm">Email alerts</span>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-sm">5 content fixes</span>
              </div>
            </div>

            {/* Pro */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-zinc-900 border border-emerald-500/30">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/30 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-emerald-400" />
                </div>
            <div>
                  <h3 className="text-xl font-semibold text-white">Pro — $79/mo</h3>
                  <p className="text-zinc-500">Full competitive warfare</p>
                </div>
              </div>
              <p className="text-zinc-400 mb-4">
                Hourly monitoring with instant alerts when competitors overtake you. Unlimited content fixes and weekly action playbooks to systematically take over your market.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-sm">Hourly checks</span>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-sm">Takeover alerts</span>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-sm">Unlimited fixes</span>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-sm">Action playbook</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-6 border-t border-zinc-900">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-white mb-16">
            Common questions
          </h2>
          
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                What data do you show?
              </h3>
              <p className="text-zinc-400">
                We show <em>real</em> AI responses from ChatGPT, Perplexity, and Google AI. You see exactly who
                AI recommends, which sources it uses, and whether you&apos;re mentioned. No fake metrics or invented
                numbers — just what AI actually said.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Which AI platforms do you monitor?
              </h3>
              <p className="text-zinc-400">
                We check ChatGPT, Perplexity, and Google AI Overviews. These are where buyers are increasingly 
                going to find product recommendations.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                What&apos;s in a &ldquo;content fix&rdquo;?
              </h3>
              <p className="text-zinc-400">
                For each query you&apos;re losing, we generate a content outline: recommended page title, 
                section headings, entities to include, comparison blocks to add, and FAQs to answer. 
                It&apos;s a roadmap to win that query.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Can I cancel anytime?
              </h3>
              <p className="text-zinc-400">
                Yes. No contracts. Cancel anytime from your billing settings. Your access continues until 
                the end of your billing period.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Is there a free trial?
              </h3>
              <p className="text-zinc-400">
                Yes, all paid plans include a 7-day free trial. You won&apos;t be charged until the trial ends. 
                Cancel anytime during the trial to avoid charges.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 border-t border-zinc-900 bg-gradient-to-t from-zinc-950 to-black">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Your competitors might already be tracking you
          </h2>
          <p className="text-lg text-zinc-400 mb-8">
            Don&apos;t be the last to know where AI is sending customers in your market.
          </p>
          <Link href="/signup">
            <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-8">
              Start Your Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

    </div>
  );
}
