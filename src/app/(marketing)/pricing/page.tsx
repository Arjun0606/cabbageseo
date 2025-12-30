"use client";

import { useState, useEffect } from "react";
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
import { createClient } from "@/lib/supabase/client";

// ============================================
// PRICING DATA
// ============================================

const plans = [
  {
    id: "starter",
    name: "Starter",
    description: "Get cited by AI search platforms",
    monthlyPrice: 29,
    yearlyPrice: 24,
    icon: Bot,
    color: "bg-purple-500/10 text-purple-400",
    features: [
      { text: "1 website", included: true },
      { text: "AIO Score tracking", included: true, highlight: true },
      { text: "3 AI platforms monitored", included: true, highlight: true },
      { text: "10 AIO-optimized articles/month", included: true },
      { text: "100 keywords tracked", included: true },
      { text: "Technical SEO audit", included: true },
      { text: "Export to Cursor/Claude", included: true, highlight: true },
      { text: "Email support", included: true },
    ],
    cta: "Start Getting Cited",
    highlight: false,
  },
  {
    id: "pro",
    name: "Pro",
    description: "Dominate AI search visibility",
    monthlyPrice: 79,
    yearlyPrice: 66,
    icon: TrendingUp,
    color: "bg-purple-500/10 text-purple-400",
    features: [
      { text: "5 websites", included: true },
      { text: "Daily AIO Score tracking", included: true, highlight: true },
      { text: "AI citation monitoring", included: true, highlight: true },
      { text: "50 AIO-optimized articles/month", included: true },
      { text: "500 keywords tracked", included: true },
      { text: "Weekly autopilot content", included: true, highlight: true },
      { text: "WordPress, Webflow & Shopify", included: true },
      { text: "Priority support", included: true },
    ],
    cta: "Go Pro",
    highlight: true,
  },
  {
    id: "pro_plus",
    name: "Agency",
    description: "AI visibility at scale for agencies",
    monthlyPrice: 199,
    yearlyPrice: 166,
    icon: Building2,
    color: "bg-purple-500/10 text-purple-400",
    features: [
      { text: "20 websites", included: true },
      { text: "Real-time AIO monitoring", included: true, highlight: true },
      { text: "Competitor AIO tracking", included: true, highlight: true },
      { text: "200 AIO-optimized articles/month", included: true },
      { text: "2,000 keywords tracked", included: true },
      { text: "Daily autopilot content", included: true, highlight: true },
      { text: "White-label reports", included: true },
      { text: "Dedicated support", included: true },
    ],
    cta: "Scale Up",
    highlight: false,
  },
];

const faqs = [
  {
    question: "What is AI Visibility / AIO?",
    answer: "AIO (AI Visibility Optimization) measures how well your content shows up in AI responses—like ChatGPT, Perplexity, and Google AI Overviews. As AI becomes the new search, ranking in traditional Google isn't enough. You need AI to CITE your content.",
  },
  {
    question: "How is this different from SEObot or Ahrefs?",
    answer: "SEObot focuses on content automation for traditional SEO. Ahrefs is for backlink analysis. CabbageSEO is the only tool that optimizes for AI visibility—helping you get cited by ChatGPT, Perplexity, and Google AI Overviews. Plus, our 'Export for Cursor' feature lets developers implement fixes directly.",
  },
  {
    question: "What's the 'Export for Cursor' feature?",
    answer: "It generates a structured markdown report of all your SEO/AIO issues that you can paste directly into Cursor or Claude. The AI assistant then implements the fixes in your codebase. It's like having an SEO developer on demand.",
  },
  {
    question: "How does AI content generation work?",
    answer: "Our AI analyzes top-ranking pages, creates comprehensive outlines, and generates articles optimized for BOTH Google AND AI search engines. Each article includes FAQ sections, definitions, and quotable snippets that AI loves to cite.",
  },
  {
    question: "Can I try before I buy?",
    answer: "Yes! Our URL analyzer is completely free - no signup required. Paste any URL and get your SEO + AI visibility score instantly. This helps you see the value before subscribing.",
  },
  {
    question: "Can I cancel anytime?",
    answer: "Absolutely. You can cancel your subscription at any time. You'll continue to have access until the end of your billing period. 14-day money-back guarantee included.",
  },
];

// ============================================
// PRICING PAGE
// ============================================

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  // Check if user is logged in
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setIsLoggedIn(true);
        }
      }
    };
    checkAuth();
  }, []);

  // Handle checkout - redirect to Dodo Payments
  const handleCheckout = async (planId: string) => {
    if (!isLoggedIn) {
      // Not logged in - redirect to signup with plan info
      window.location.href = `/signup?plan=${planId}&interval=${isYearly ? "yearly" : "monthly"}`;
      return;
    }

    setLoadingPlan(planId);
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          interval: isYearly ? "yearly" : "monthly",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.error || "Failed to start checkout");
        setLoadingPlan(null);
        return;
      }

      if (result.data?.checkoutUrl) {
        // Redirect to Dodo Payments checkout
        window.location.href = result.data.checkoutUrl;
      } else {
        alert("Failed to get checkout URL");
        setLoadingPlan(null);
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Failed to start checkout. Please try again.");
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img 
              src="/cabbageseo_logo.png" 
              alt="CabbageSEO" 
              className="h-10 w-auto"
            />
            <span className="font-bold text-xl tracking-tight">CabbageSEO</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/analyze">
              <Button variant="ghost" className="text-zinc-400 hover:text-white">Free Tool</Button>
            </Link>
            {isLoggedIn ? (
              <Link href="/dashboard">
                <Button className="bg-emerald-600 hover:bg-emerald-500 text-white">Go to Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="text-zinc-400 hover:text-white">Login</Button>
                </Link>
                <Link href="/signup">
                  <Button className="bg-emerald-600 hover:bg-emerald-500 text-white">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero - AIO First */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          {/* AIO Message */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm mb-6">
            <Bot className="w-4 h-4" />
            The only AI Visibility tool
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Get cited by <span className="text-purple-400">ChatGPT & Perplexity.</span>
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-4">
            Track your AI Visibility Score. Generate content AI loves to cite. Get featured in AI answers.
          </p>
          <p className="text-lg text-zinc-500 mb-8">
            Starting at <span className="text-purple-400 font-semibold">$29/month</span> · No SEO expertise needed
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-3 mb-12">
            <span className={`text-sm ${!isYearly ? "text-white font-medium" : "text-zinc-500"}`}>
              Monthly
            </span>
            <Switch
              checked={isYearly}
              onCheckedChange={setIsYearly}
              className="data-[state=checked]:bg-purple-500"
            />
            <span className={`text-sm ${isYearly ? "text-white font-medium" : "text-zinc-500"}`}>
              Yearly
            </span>
            {isYearly && (
              <span className="px-2 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-medium">
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
                      ? "bg-zinc-900 border-2 border-purple-500/50"
                      : "bg-zinc-900/50 border border-zinc-800"
                  }`}
                >
                  {plan.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-purple-500 text-white text-xs font-medium rounded-full">
                      Most Popular
                    </div>
                  )}
                  
                  <div className="inline-flex p-2 rounded-lg mb-4 bg-purple-500/10">
                    <Icon className="w-5 h-5 text-purple-400" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                  <p className="text-sm text-zinc-500 mb-4">{plan.description}</p>
                  
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-white">${price}</span>
                    <span className="text-zinc-500">/month</span>
                    {isYearly && (
                      <p className="text-sm text-purple-400 mt-1">
                        Save ${yearlySavings}/year
                      </p>
                    )}
                  </div>
                  
                  <Button
                    onClick={() => handleCheckout(plan.id)}
                    disabled={loadingPlan === plan.id}
                    className={`w-full mb-6 ${
                      plan.highlight
                        ? "bg-purple-600 hover:bg-purple-500 text-white"
                        : "bg-zinc-800 hover:bg-zinc-700 text-white border-0"
                    }`}
                  >
                    {loadingPlan === plan.id ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Loading...
                      </>
                    ) : (
                      <>
                        {plan.cta}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                  
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        {feature.included ? (
                          <Check className={`w-4 h-4 mt-0.5 shrink-0 ${feature.highlight ? "text-purple-400" : "text-purple-400/70"}`} />
                        ) : (
                          <X className="w-4 h-4 text-zinc-700 mt-0.5 shrink-0" />
                        )}
                        <span className={`${feature.included ? "text-zinc-300" : "text-zinc-600"} ${feature.highlight ? "font-medium text-white" : ""}`}>
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
              <Bot className="w-4 h-4 text-purple-400" />
              <span>Free AIO Score check</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-purple-400" />
              <span>3 AI platforms tracked</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition - AIO Focus */}
      <section className="py-16 md:py-24 border-t border-zinc-800/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Why AI Visibility Matters</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              60% of searches now show AI answers first. If AI isn&apos;t citing you, you&apos;re invisible.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-16">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                <Bot className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">Track AIO Score</h3>
              <p className="text-sm text-zinc-400">
                See your visibility across ChatGPT, Perplexity, and Google AI Overviews.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">Generate AIO Content</h3>
              <p className="text-sm text-zinc-400">
                Articles with FAQs, definitions, and quotable sections AI loves to cite.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">Export to Cursor</h3>
              <p className="text-sm text-zinc-400">
                Get actionable fixes you can paste directly into your AI coding assistant.
              </p>
            </div>
          </div>

          <div className="max-w-3xl mx-auto">
            <h3 className="text-center font-semibold text-white mb-6">vs. Traditional SEO Tools</h3>
            <div className="grid grid-cols-4 gap-4 mb-4 text-sm font-medium text-center">
              <div></div>
              <div className="text-zinc-500">SEObot</div>
              <div className="text-zinc-500">Ahrefs</div>
              <div className="text-purple-400">CabbageSEO</div>
            </div>
            {[
              { feature: "AIO Score (AI Visibility)", seobot: false, ahrefs: false, cabbage: true, highlight: true },
              { feature: "ChatGPT/Perplexity Tracking", seobot: false, ahrefs: false, cabbage: true, highlight: true },
              { feature: "Export to Cursor/Claude", seobot: false, ahrefs: false, cabbage: true, highlight: true },
              { feature: "AI Content Generation", seobot: true, ahrefs: false, cabbage: true },
              { feature: "Keyword Tracking", seobot: false, ahrefs: true, cabbage: true },
              { feature: "SEO Audits", seobot: false, ahrefs: true, cabbage: true },
              { feature: "Starting Price", seobot: "$49/mo", ahrefs: "$99/mo", cabbage: "$29/mo" },
            ].map((row, i) => (
              <div
                key={i}
                className={`grid grid-cols-4 gap-4 py-3 px-4 rounded-lg text-sm ${
                  row.highlight ? "bg-purple-500/10 border border-purple-500/20" : i % 2 === 0 ? "bg-zinc-900/50" : ""
                }`}
              >
                <div className={`font-medium ${row.highlight ? "text-purple-300" : "text-zinc-300"}`}>{row.feature}</div>
                <div className="text-center">
                  {typeof row.seobot === "boolean" ? (
                    row.seobot ? (
                      <Check className="w-4 h-4 text-zinc-500 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-zinc-700 mx-auto" />
                    )
                  ) : (
                    <span className="text-zinc-500">{row.seobot}</span>
                  )}
                </div>
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
                  {typeof row.cabbage === "boolean" ? (
                    row.cabbage ? (
                      <Check className="w-4 h-4 text-purple-400 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-zinc-700 mx-auto" />
                    )
                  ) : (
                    <span className="text-purple-400 font-medium">{row.cabbage}</span>
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
            Ready to get cited by AI?
          </h2>
          <p className="text-xl text-zinc-400 mb-8 max-w-2xl mx-auto">
            Start free. See your AI Visibility Score. Upgrade when you&apos;re ready to dominate.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-purple-600 hover:bg-purple-500 text-white"
              onClick={() => handleCheckout("starter")}
              disabled={loadingPlan !== null}
            >
              {loadingPlan ? "Loading..." : "Get Started — $29/mo"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Link href="/analyze">
              <Button size="lg" variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                Try Free AIO Score
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

