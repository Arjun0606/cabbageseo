"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Check,
  X,
  Sparkles,
  Zap,
  Building2,
  ArrowRight,
  Bot,
  TrendingUp,
  Shield,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// ============================================
// PRICING DATA
// ============================================

const plans = [
  {
    id: "starter",
    name: "Starter",
    description: "Perfect for content creators tracking AI visibility",
    monthlyPrice: 29,
    yearlyPrice: 24,
    icon: Zap,
    color: "bg-blue-500/10 text-blue-500",
    features: [
      { text: "1 website", included: true },
      { text: "20 AIO visibility checks/month", included: true, highlight: true },
      { text: "4 platform tracking (ChatGPT, Perplexity, Google AI, Bing)", included: true, highlight: true },
      { text: "10 AI articles/month", included: true },
      { text: "100 keywords tracked", included: true },
      { text: "5 SEO audits/month", included: true },
      { text: "WordPress & Webflow", included: true },
      { text: "Real-time AI citations", included: false },
      { text: "Team members", included: false },
    ],
    cta: "Get Started",
    highlight: false,
  },
  {
    id: "pro",
    name: "Pro",
    description: "For teams serious about AI search visibility",
    monthlyPrice: 79,
    yearlyPrice: 66,
    icon: TrendingUp,
    color: "bg-green-500/10 text-green-500",
    features: [
      { text: "5 websites", included: true },
      { text: "100 AIO visibility checks/month", included: true, highlight: true },
      { text: "Real-time AI citation tracking", included: true, highlight: true },
      { text: "50 AI articles/month", included: true },
      { text: "500 keywords tracked", included: true },
      { text: "20 SEO audits/month", included: true },
      { text: "All CMS integrations", included: true },
      { text: "5 team members", included: true },
      { text: "Priority support", included: true },
      { text: "API access", included: true },
    ],
    cta: "Get Started",
    highlight: true,
  },
  {
    id: "pro_plus",
    name: "Pro+",
    description: "For agencies dominating AI search for clients",
    monthlyPrice: 199,
    yearlyPrice: 166,
    icon: Building2,
    color: "bg-purple-500/10 text-purple-500",
    features: [
      { text: "20 websites", included: true },
      { text: "500 AIO visibility checks/month", included: true, highlight: true },
      { text: "Citation alerts & monitoring", included: true, highlight: true },
      { text: "White-label AI visibility reports", included: true, highlight: true },
      { text: "200 AI articles/month", included: true },
      { text: "2,000 keywords tracked", included: true },
      { text: "Unlimited audits", included: true },
      { text: "Dedicated support + SLA", included: true },
      { text: "Unlimited team members", included: true },
      { text: "Custom integrations", included: true },
    ],
    cta: "Get Started",
    highlight: false,
  },
];

const faqs = [
  {
    question: "What is AIO (AI Optimization)?",
    answer: "AIO is optimization for AI search platforms like ChatGPT, Perplexity, and Google AI Overviews. As more people use AI to search, traditional SEO alone isn't enough. CabbageSEO helps you rank in both traditional search AND AI search.",
  },
  {
    question: "How is this different from Ahrefs or Semrush?",
    answer: "Ahrefs and Semrush are great for traditional SEO. But they don't track AI visibility. CabbageSEO is the first tool that shows your visibility across ChatGPT, Perplexity, Google AI Overviews, and Bing Copilot - plus all the SEO basics you need.",
  },
  {
    question: "Can I try before I buy?",
    answer: "Yes! Our URL analyzer is completely free - no signup required. Paste any URL and get your SEO + AI visibility score instantly. This helps you see the value before subscribing.",
  },
  {
    question: "What happens if I exceed my plan limits?",
    answer: "You can either upgrade to a higher plan, or enable pay-as-you-go overages with a spending cap you control. Overages are billed at the end of your billing cycle. You'll never be charged without your consent.",
  },
  {
    question: "Can I cancel anytime?",
    answer: "Absolutely. You can cancel your subscription at any time. You'll continue to have access until the end of your billing period, then your account will downgrade to free.",
  },
  {
    question: "Do you offer discounts for annual billing?",
    answer: "Yes! Annual billing saves you 17% compared to monthly billing. That's like getting 2 months free.",
  },
];

// ============================================
// PRICING PAGE
// ============================================

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(true);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img 
              src="/cabbageseo_logo.png" 
              alt="CabbageSEO" 
              className="w-8 h-8 rounded-lg"
            />
            <span className="font-semibold text-lg">CabbageSEO</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/analyze">
              <Button variant="ghost" className="text-zinc-400 hover:text-white">Free Tool</Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost" className="text-zinc-400 hover:text-white">Login</Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-emerald-600 hover:bg-emerald-500 text-white">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm mb-6">
            Simple, transparent pricing
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Track Your <span className="text-emerald-400">AI Visibility</span>
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-8">
            See if ChatGPT, Perplexity, and Google AI cite your content. Plus complete SEO tools.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-3 mb-12">
            <span className={`text-sm ${!isYearly ? "text-white font-medium" : "text-zinc-500"}`}>
              Monthly
            </span>
            <Switch
              checked={isYearly}
              onCheckedChange={setIsYearly}
              className="data-[state=checked]:bg-emerald-500"
            />
            <span className={`text-sm ${isYearly ? "text-white font-medium" : "text-zinc-500"}`}>
              Yearly
            </span>
            {isYearly && (
              <span className="px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                Save 17%
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan) => {
              const Icon = plan.icon;
              const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
              const yearlySavings = (plan.monthlyPrice - plan.yearlyPrice) * 12;

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl p-6 ${
                    plan.highlight
                      ? "bg-zinc-900 border-2 border-emerald-500/50"
                      : "bg-zinc-900/50 border border-zinc-800"
                  }`}
                >
                  {plan.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-500 text-white text-xs font-medium rounded-full">
                      Most Popular
                    </div>
                  )}
                  
                  <div className={`inline-flex p-2 rounded-lg mb-4 ${
                    plan.id === "starter" ? "bg-blue-500/10" :
                    plan.id === "pro" ? "bg-emerald-500/10" : "bg-purple-500/10"
                  }`}>
                    <Icon className={`w-5 h-5 ${
                      plan.id === "starter" ? "text-blue-400" :
                      plan.id === "pro" ? "text-emerald-400" : "text-purple-400"
                    }`} />
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                  <p className="text-sm text-zinc-500 mb-4">{plan.description}</p>
                  
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-white">${price}</span>
                    <span className="text-zinc-500">/month</span>
                    {isYearly && (
                      <p className="text-sm text-emerald-400 mt-1">
                        Save ${yearlySavings}/year
                      </p>
                    )}
                  </div>
                  
                  <Link href="/signup">
                    <Button
                      className={`w-full mb-6 ${
                        plan.highlight
                          ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                          : "bg-zinc-800 hover:bg-zinc-700 text-white border-0"
                      }`}
                    >
                      {plan.cta}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                  
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        {feature.included ? (
                          <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                        ) : (
                          <X className="w-4 h-4 text-zinc-700 mt-0.5 shrink-0" />
                        )}
                        <span className={feature.included ? "text-zinc-300" : "text-zinc-600"}>
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

      {/* Trust Signals */}
      <section className="py-12 border-y border-zinc-800/50 bg-zinc-900/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 text-zinc-400 text-sm">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Free URL analyzer</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Pay-as-you-go overages</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Overages Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-10">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-zinc-800 text-zinc-400 text-sm mb-4">
              Flexible Usage
            </span>
            <h2 className="text-3xl font-bold text-white mb-4">Need more? Set a spending cap.</h2>
            <p className="text-zinc-400">
              When you exceed your plan limits, we&apos;ll keep you running. You set the cap, we handle the rest.
            </p>
          </div>
          
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-white mb-4">How it works</h3>
                <ul className="space-y-3 text-sm text-zinc-400">
                  <li className="flex items-start gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold shrink-0">1</span>
                    <span>Set your monthly spending cap ($25, $50, $100, or custom)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold shrink-0">2</span>
                    <span>Use features beyond your plan limits as needed</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold shrink-0">3</span>
                    <span>Get notified at 50%, 75%, 90% of your cap</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold shrink-0">4</span>
                    <span>Overages billed at end of billing cycle</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-zinc-800/50 rounded-xl p-6">
                <h3 className="font-semibold text-white mb-4">You&apos;re always in control</h3>
                <ul className="space-y-2 text-sm text-zinc-400">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Never charged beyond your cap</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Change or disable anytime</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Clear usage dashboard</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>No surprises, no hidden fees</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-16 md:py-24 border-t border-zinc-800/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Why CabbageSEO?</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              The only SEO tool that optimizes for both traditional search AND AI search
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="grid grid-cols-4 gap-4 mb-4 text-sm font-medium text-center">
              <div></div>
              <div className="text-zinc-500">Ahrefs/Semrush</div>
              <div className="text-zinc-500">Surfer</div>
              <div className="text-emerald-400">CabbageSEO</div>
            </div>
            {[
              { feature: "Keyword Research", ahrefs: true, surfer: false, cabbage: true },
              { feature: "Technical SEO Audit", ahrefs: true, surfer: false, cabbage: true },
              { feature: "Content Optimization", ahrefs: false, surfer: true, cabbage: true },
              { feature: "AI Article Generation", ahrefs: false, surfer: false, cabbage: true },
              { feature: "AIO Score (AI Visibility)", ahrefs: false, surfer: false, cabbage: true },
              { feature: "ChatGPT/Perplexity Tracking", ahrefs: false, surfer: false, cabbage: true },
              { feature: "Google AI Overview Tracking", ahrefs: false, surfer: false, cabbage: true },
              { feature: "Starting Price", ahrefs: "$99/mo", surfer: "$89/mo", cabbage: "$29/mo" },
            ].map((row, i) => (
              <div
                key={i}
                className={`grid grid-cols-4 gap-4 py-3 px-4 rounded-lg text-sm ${
                  i % 2 === 0 ? "bg-zinc-900/50" : ""
                }`}
              >
                <div className="font-medium text-zinc-300">{row.feature}</div>
                <div className="text-center">
                  {typeof row.ahrefs === "boolean" ? (
                    row.ahrefs ? (
                      <Check className="w-4 h-4 text-zinc-500 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-zinc-700 mx-auto" />
                    )
                  ) : (
                    <span className="text-zinc-500">{row.ahrefs}</span>
                  )}
                </div>
                <div className="text-center">
                  {typeof row.surfer === "boolean" ? (
                    row.surfer ? (
                      <Check className="w-4 h-4 text-zinc-500 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-zinc-700 mx-auto" />
                    )
                  ) : (
                    <span className="text-zinc-500">{row.surfer}</span>
                  )}
                </div>
                <div className="text-center">
                  {typeof row.cabbage === "boolean" ? (
                    row.cabbage ? (
                      <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-zinc-700 mx-auto" />
                    )
                  ) : (
                    <span className="text-emerald-400 font-medium">{row.cabbage}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16 bg-zinc-900/30 border-y border-zinc-800/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Frequently Asked Questions</h2>
          </div>
          <div className="max-w-2xl mx-auto">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border-zinc-800">
                  <AccordionTrigger className="text-left text-zinc-100 hover:text-white">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-zinc-400">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to rank in AI search?
          </h2>
          <p className="text-xl text-zinc-400 mb-8 max-w-2xl mx-auto">
            Try our free URL analyzer, then upgrade when you&apos;re ready.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-500 text-white">
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/analyze">
              <Button size="lg" variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                Try Free Tool
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-zinc-500">
          <p>© 2025 CabbageSEO. All rights reserved.</p>
          <div className="flex justify-center gap-4 mt-2">
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

