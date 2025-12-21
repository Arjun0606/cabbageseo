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
    cta: "Start Free Trial",
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
    cta: "Start Free Trial",
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
    cta: "Start Free Trial",
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
    question: "Do you offer a free trial?",
    answer: "Yes! All plans come with a 14-day free trial. No credit card required to start. You'll have full access to all features during the trial.",
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">🥬</span>
            </div>
            <span className="font-bold text-xl">CabbageSEO</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/analyze">
              <Button variant="ghost">Free Tool</Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <Badge variant="outline" className="mb-4">
            <Bot className="w-3 h-3 mr-1" />
            The first SEO tool with AI visibility tracking
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Track Your{" "}
            <span className="bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
              AI Visibility
            </span>{" "}
            <span className="text-muted-foreground">& SEO</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            See if ChatGPT, Perplexity, and Google AI cite your content. Plus complete SEO tools.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-3 mb-12">
            <span className={`text-sm ${!isYearly ? "text-foreground font-medium" : "text-muted-foreground"}`}>
              Monthly
            </span>
            <Switch
              checked={isYearly}
              onCheckedChange={setIsYearly}
              className="data-[state=checked]:bg-green-500"
            />
            <span className={`text-sm ${isYearly ? "text-foreground font-medium" : "text-muted-foreground"}`}>
              Yearly
            </span>
            {isYearly && (
              <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                Save 17%
              </Badge>
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
                <Card
                  key={plan.id}
                  className={`relative overflow-hidden ${
                    plan.highlight
                      ? "border-green-500 shadow-lg shadow-green-500/10"
                      : "border-border"
                  }`}
                >
                  {plan.highlight && (
                    <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-center text-sm py-1 font-medium">
                      Most Popular
                    </div>
                  )}
                  <CardHeader className={plan.highlight ? "pt-10" : ""}>
                    <div className={`inline-flex p-2 rounded-lg ${plan.color} w-fit mb-3`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">${price}</span>
                      <span className="text-muted-foreground">/month</span>
                      {isYearly && (
                        <p className="text-sm text-green-600 mt-1">
                          Save ${yearlySavings}/year
                        </p>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Link href="/signup">
                      <Button
                        className={`w-full mb-6 ${
                          plan.highlight
                            ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                            : ""
                        }`}
                        variant={plan.highlight ? "default" : "outline"}
                      >
                        {plan.cta}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                    <ul className="space-y-3">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2">
                          {feature.included ? (
                            <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                          ) : (
                            <X className="w-4 h-4 text-muted-foreground/40 mt-0.5 shrink-0" />
                          )}
                          <span
                            className={
                              feature.included ? "" : "text-muted-foreground/60"
                            }
                          >
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

      {/* Trust Signals */}
      <section className="py-12 border-y bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-500" />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-green-500" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why CabbageSEO?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              The only SEO tool that optimizes for both traditional search AND AI search
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="grid grid-cols-4 gap-4 mb-4 text-sm font-medium text-center">
              <div></div>
              <div className="text-muted-foreground">Ahrefs/Semrush</div>
              <div className="text-muted-foreground">Surfer</div>
              <div className="text-green-600">CabbageSEO</div>
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
                  i % 2 === 0 ? "bg-muted/30" : ""
                }`}
              >
                <div className="font-medium">{row.feature}</div>
                <div className="text-center">
                  {typeof row.ahrefs === "boolean" ? (
                    row.ahrefs ? (
                      <Check className="w-4 h-4 text-muted-foreground mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-muted-foreground/40 mx-auto" />
                    )
                  ) : (
                    <span className="text-muted-foreground">{row.ahrefs}</span>
                  )}
                </div>
                <div className="text-center">
                  {typeof row.surfer === "boolean" ? (
                    row.surfer ? (
                      <Check className="w-4 h-4 text-muted-foreground mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-muted-foreground/40 mx-auto" />
                    )
                  ) : (
                    <span className="text-muted-foreground">{row.surfer}</span>
                  )}
                </div>
                <div className="text-center">
                  {typeof row.cabbage === "boolean" ? (
                    row.cabbage ? (
                      <Check className="w-4 h-4 text-green-500 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-muted-foreground/40 mx-auto" />
                    )
                  ) : (
                    <span className="text-green-600 font-medium">{row.cabbage}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
          </div>
          <div className="max-w-2xl mx-auto">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
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
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to rank in AI search?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Start your free trial today. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="bg-gradient-to-r from-green-500 to-emerald-600">
                Start Free Trial
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/analyze">
              <Button size="lg" variant="outline">
                Try Free Tool First
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 CabbageSEO. All rights reserved.</p>
          <div className="flex justify-center gap-4 mt-2">
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

