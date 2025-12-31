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
  Rocket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
    description: "5x more value than competitors",
    monthlyPrice: 29,
    yearlyPrice: 24,
    icon: Rocket,
    features: [
      { text: "3 websites", included: true },
      { text: "50 AI articles/month + images", included: true, highlight: true },
      { text: "500 keywords tracked", included: true },
      { text: "100 GEO visibility checks", included: true, highlight: true },
      { text: "15 SEO audits/month", included: true },
      { text: "All CMS integrations", included: true },
      { text: "AI-generated featured images", included: true, highlight: true },
      { text: "Email support", included: true },
    ],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    description: "Best value for growing sites",
    monthlyPrice: 79,
    yearlyPrice: 66,
    icon: Zap,
    features: [
      { text: "10 websites", included: true },
      { text: "150 AI articles/month + images", included: true, highlight: true },
      { text: "2,000 keywords tracked", included: true },
      { text: "300 GEO visibility checks", included: true, highlight: true },
      { text: "50 SEO audits/month", included: true },
      { text: "Autopilot mode", included: true, highlight: true },
      { text: "Priority queue", included: true },
      { text: "Priority support", included: true },
    ],
    cta: "Go Pro",
    popular: true,
  },
  {
    id: "pro_plus",
    name: "Agency",
    description: "Unlimited power for agencies",
    monthlyPrice: 199,
    yearlyPrice: 166,
    icon: Building2,
    features: [
      { text: "50 websites", included: true },
      { text: "500 AI articles/month + images", included: true, highlight: true },
      { text: "10,000 keywords tracked", included: true },
      { text: "1,000 GEO visibility checks", included: true, highlight: true },
      { text: "200 SEO audits/month", included: true },
      { text: "API access", included: true },
      { text: "White-label reports", included: true },
      { text: "Dedicated support + SLA", included: true },
    ],
    cta: "Go Agency",
    popular: false,
  },
];

const faqs = [
  {
    question: "1. What is GEO (Generative Engine Optimization)?",
    answer: "GEO is the practice of optimizing your content to be cited by AI platforms like ChatGPT, Perplexity, and Google AI Overviews. Unlike traditional SEO which focuses on Google rankings, GEO focuses on making your content the go-to source for AI responses. This includes structured data, FAQ sections, direct answers, and citation-worthy content.",
  },
  {
    question: "2. Is CabbageSEO fully automated?",
    answer: "Yes! Everything is automated. Enter your URL, and CabbageSEO will research your site, analyze your audience, find keywords, create a content plan, and start generating articles weekly. You can moderate articles if you want, but it runs 100% on autopilot by default.",
  },
  {
    question: "3. Does it work in languages other than English?",
    answer: "Yes! We support multiple languages for content generation. The AI can create quality GEO-optimized articles in most major languages including Spanish, French, German, Portuguese, and more.",
  },
  {
    question: "4. How do I get started?",
    answer: "Simply enter your website URL in our free analyzer to get your GEO score. Then sign up for a plan and we'll automatically research your site, audience, and keywords to start generating optimized content.",
  },
  {
    question: "5. Can I moderate articles before publishing?",
    answer: "Absolutely! You can review, edit, or reject any article before it goes live. You're in complete control. We can also notify you via email whenever new articles are ready for review.",
  },
  {
    question: "6. How good are the AI-generated articles?",
    answer: "Our articles are specifically optimized for AI citation - they include FAQ sections, source citations, structured headings, and quotable paragraphs. Quality varies by topic, but our fact-checking system and citation requirements ensure accuracy. We continuously improve to meet or exceed human-level writing.",
  },
  {
    question: "7. What CMS platforms do you support?",
    answer: "We support WordPress, Webflow, Shopify, Ghost, HubSpot, Notion, Framer, and custom integrations via REST API or Webhooks. One-click publishing to any connected platform.",
  },
  {
    question: "8. Can I edit articles?",
    answer: "Yes! You can edit any article inside CabbageSEO before publishing. Make changes, add your own insights, or adjust the tone to match your brand voice.",
  },
  {
    question: "9. How does internal linking work?",
    answer: "CabbageSEO automatically scans your content to identify relevant anchor text opportunities and intelligently links to your most important pages. As your content library grows, it continuously updates and optimizes these connections.",
  },
  {
    question: "10. What's the 'Export to Cursor' feature?",
    answer: "This generates a structured markdown report of all your SEO/GEO issues that you can paste directly into any AI coding assistant. The AI can then help implement the fixes in your codebase. Perfect for developers!",
  },
  {
    question: "11. What makes GEO different from SEO?",
    answer: "SEO optimizes for Google search rankings. GEO optimizes for AI citations. AI platforms like ChatGPT value different things: clear definitions, FAQ sections, authoritative sources, and quotable paragraphs. We optimize for what AI actually uses when answering questions.",
  },
  {
    question: "12. Can I try before I buy?",
    answer: "Yes! Our URL analyzer is completely free - no signup required. Analyze any website to see its GEO score. We also offer a 14-day free trial on all paid plans.",
  },
  {
    question: "13. Can I get a refund?",
    answer: "We offer a 14-day money-back guarantee on all plans. If you're not satisfied after trying CabbageSEO, contact us for a full refund. No questions asked.",
  },
  {
    question: "14. Do you offer an API?",
    answer: "Yes! Agency plans include full API access for custom integrations. You can programmatically generate content, check GEO scores, and publish to any platform.",
  },
  {
    question: "15. How is GEO score calculated?",
    answer: "We analyze your content across multiple factors: FAQ presence, schema markup, quotability, entity density, content freshness, source citations, and direct answer structure. We then test visibility on ChatGPT, Perplexity, and Google AI Overviews.",
  },
];

// ============================================
// PRICING PAGE
// ============================================

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) setIsLoggedIn(true);
      }
    };
    checkAuth();
  }, []);

  const handleCheckout = async (planId: string) => {
    setLoadingPlan(planId);
    const billingPeriod = isYearly ? "yearly" : "monthly";
    
    // If not logged in, redirect to signup with plan info
    if (!isLoggedIn) {
      window.location.href = `/signup?plan=${planId}&billing=${billingPeriod}`;
      return;
    }

    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, interval: billingPeriod }),
      });
      const data = await response.json();
      
      if (data.success && data.data?.checkoutUrl) {
        window.location.href = data.data.checkoutUrl;
      } else if (data.error) {
        console.error("Checkout error:", data.error);
        alert(data.error);
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Failed to start checkout. Please try again.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/90 backdrop-blur-sm border-b border-zinc-800/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
              <img src="/cabbageseo_logo.png" alt="CabbageSEO" className="h-8 w-auto" />
              <span className="font-bold text-lg">CabbageSEO</span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <Link href="/analyze" className="text-sm text-zinc-400 hover:text-white transition-colors">
                Free Analysis
              </Link>
              <Link href="/pricing" className="text-sm text-white font-medium">
                Pricing
              </Link>
            </div>
            <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Link href="/dashboard">
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white">
                    Dashboard
                  </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                    <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
                      Log in
                    </Button>
                </Link>
                <Link href="/signup">
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white">
                      Start Free
                    </Button>
                </Link>
              </>
            )}
          </div>
        </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Simple, transparent pricing
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-8">
            Start free with our URL analyzer. Upgrade when you need more.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <span className={`text-sm ${!isYearly ? "text-white" : "text-zinc-400"}`}>Monthly</span>
            <Switch
              checked={isYearly}
              onCheckedChange={setIsYearly}
              className="data-[state=checked]:bg-emerald-600"
            />
            <span className={`text-sm ${isYearly ? "text-white" : "text-zinc-400"}`}>
              Yearly
              <Badge className="ml-2 bg-emerald-500/20 text-emerald-400 border-0 text-xs">
                Save 17%
              </Badge>
              </span>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const Icon = plan.icon;
              const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
              const yearlySavings = (plan.monthlyPrice - plan.yearlyPrice) * 12;

              return (
                <Card
                  key={plan.id}
                  className={`relative overflow-hidden transition-all duration-300 ${
                    plan.popular
                      ? "bg-gradient-to-b from-emerald-900/30 to-zinc-900 border-emerald-500/50 scale-105 shadow-xl shadow-emerald-500/10"
                      : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 left-0 right-0 bg-emerald-600 text-white text-center text-xs py-1 font-medium">
                      MOST POPULAR
                    </div>
                  )}
                  
                  <CardContent className={`p-6 ${plan.popular ? "pt-10" : ""}`}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-2 rounded-lg ${plan.popular ? "bg-emerald-500/20" : "bg-zinc-800"}`}>
                        <Icon className={`w-5 h-5 ${plan.popular ? "text-emerald-400" : "text-zinc-400"}`} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                        <p className="text-sm text-zinc-400">{plan.description}</p>
                      </div>
                  </div>
                  
                  <div className="mb-6">
                      <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">${price}</span>
                        <span className="text-zinc-400">/mo</span>
                      </div>
                    {isYearly && (
                      <p className="text-sm text-emerald-400 mt-1">
                        Save ${yearlySavings}/year
                      </p>
                    )}
                  </div>
                  
                  <Button
                    onClick={() => handleCheckout(plan.id)}
                    disabled={loadingPlan === plan.id}
                    className={`w-full mb-6 ${
                        plan.popular
                        ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                          : "bg-zinc-800 hover:bg-zinc-700 text-white"
                      }`}
                    >
                      {loadingPlan === plan.id ? "Loading..." : plan.cta}
                        <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                          <Check className={`w-4 h-4 mt-0.5 shrink-0 ${feature.highlight ? "text-emerald-400" : "text-zinc-400"}`} />
                          <span className={feature.highlight ? "text-white font-medium" : "text-zinc-400"}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Free Tier */}
      <section className="py-16 px-6 bg-zinc-900/30 border-y border-zinc-800/50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Try it free first</h2>
          <p className="text-zinc-400 mb-8">
            Our URL analyzer is completely free. Paste any URL to see its AI visibility score, 
            SEO issues, and recommendations — no signup required.
          </p>
          <Link href="/analyze">
            <Button size="lg" variant="outline" className="border-zinc-600 text-white hover:bg-zinc-800">
              Try Free Analysis
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Questions?</h2>
          </div>
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
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="p-8 bg-gradient-to-br from-emerald-900/30 to-zinc-900 rounded-2xl border border-emerald-500/30">
            <Bot className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to get cited by AI?
          </h2>
            <p className="text-zinc-400 mb-8">
              Start with a free analysis, then upgrade when you&apos;re ready.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
              onClick={() => handleCheckout("starter")}
              disabled={loadingPlan !== null}
            >
                Start Free Trial
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Link href="/analyze">
              <Button size="lg" variant="outline" className="border-zinc-600 text-white hover:bg-zinc-800">
                  Try Free Analysis
              </Button>
            </Link>
            </div>
            <p className="text-xs text-zinc-400 mt-4">
              No credit card required • 14-day money-back guarantee
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <img src="/cabbageseo_logo.png" alt="CabbageSEO" className="h-6 w-auto" />
              <span className="text-sm text-zinc-400">© 2025 CabbageSEO</span>
            </div>
            <div className="flex gap-6 text-sm text-zinc-400">
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
              <a href="mailto:support@cabbageseo.com" className="hover:text-white">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
