"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Check,
  X,
  Eye,
  Zap,
  Building2,
  ArrowRight,
  Crown,
  Target,
  Sparkles,
  Shield,
  Clock,
  BarChart3,
  Gift,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { createClient } from "@/lib/supabase/client";

// ============================================
// PRICING DATA - 10-DAY FREE TRIAL MODEL
// ============================================

const TRIAL_DAYS = 10;

const plans = [
  {
    id: "free",
    name: "Free Trial",
    description: `${TRIAL_DAYS} days free, then choose a plan`,
    monthlyPrice: 0,
    yearlyPrice: 0,
    icon: Gift,
    color: "zinc",
    isTrial: true,
    features: [
      { text: "1 website", included: true },
      { text: "5 checks per day", included: true },
      { text: "1 competitor", included: true },
      { text: "Email alerts", included: true },
      { text: `${TRIAL_DAYS}-day access`, included: true, highlight: true },
      { text: "Then upgrade to continue", included: false, note: "Required after trial" },
    ],
    cta: "Start Free Trial",
    ctaVariant: "outline" as const,
    popular: false,
  },
  {
    id: "starter",
    name: "Starter",
    description: "For creators & solopreneurs",
    monthlyPrice: 29,
    yearlyPrice: 24,
    icon: Target,
    color: "blue",
    features: [
      { text: "3 websites", included: true },
      { text: "100 checks/month", included: true, highlight: true },
      { text: "30-day history", included: true },
      { text: "Real-time alerts", included: true },
      { text: "2 competitors", included: true, highlight: true },
      { text: "CSV export", included: true },
      { text: "Email support", included: true },
    ],
    cta: "Get Started",
    ctaVariant: "default" as const,
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    description: "For growing businesses",
    monthlyPrice: 79,
    yearlyPrice: 66,
    icon: Zap,
    color: "emerald",
    features: [
      { text: "10 websites", included: true },
      { text: "Unlimited checks", included: true, highlight: true },
      { text: "Unlimited history", included: true, highlight: true },
      { text: "Hourly monitoring", included: true, highlight: true },
      { text: "10 competitors", included: true },
      { text: "API access", included: true },
      { text: "Priority support", included: true },
      { text: "Slack integration", included: true },
    ],
    cta: "Go Pro",
    ctaVariant: "default" as const,
    popular: true,
  },
  {
    id: "agency",
    name: "Agency",
    description: "For agencies & large teams",
    monthlyPrice: 199,
    yearlyPrice: 166,
    icon: Building2,
    color: "violet",
    features: [
      { text: "50 websites", included: true },
      { text: "Unlimited everything", included: true, highlight: true },
      { text: "Unlimited competitors", included: true },
      { text: "White-label reports", included: true, highlight: true },
      { text: "Custom integrations", included: true },
      { text: "Dedicated support", included: true },
      { text: "SLA guarantee", included: true },
      { text: "Team seats (5)", included: true },
    ],
    cta: "Contact Sales",
    ctaVariant: "default" as const,
    popular: false,
  },
];

const faqs = [
  {
    question: "How does the free trial work?",
    answer: `You get ${TRIAL_DAYS} days of free access with 1 website, 5 checks per day, and 1 competitor. After your trial ends, you'll need to upgrade to a paid plan to continue using CabbageSEO. No credit card required to start.`,
  },
  {
    question: "What exactly is citation tracking?",
    answer: "Citation tracking monitors when AI platforms like ChatGPT, Perplexity, and Google AI mention or reference your website in their responses. We query these platforms with relevant questions and detect when your site appears in their answers.",
  },
  {
    question: "Which AI platforms do you monitor?",
    answer: "We monitor Perplexity (real API with citation detection), Google AI Overviews (via Gemini with search grounding), and ChatGPT/SearchGPT. Each platform is checked with queries relevant to your domain and industry.",
  },
  {
    question: "What counts as a 'check'?",
    answer: "A check is when we query all three AI platforms about your website. Trial users get 5 manual checks per day. Starter gets 100 checks per month. Pro and Agency get unlimited checks with automated scheduling.",
  },
  {
    question: "Can I track my competitors?",
    answer: "Yes! Even the free trial includes 1 competitor. Starter gives you 2, Pro gives you 10, and Agency has unlimited competitors.",
  },
  {
    question: "What happens after my trial ends?",
    answer: `After ${TRIAL_DAYS} days, you'll need to choose a paid plan to continue. Your citation data will be preserved for 7 days after trial ends, giving you time to upgrade without losing history.`,
  },
  {
    question: "Is there a money-back guarantee?",
    answer: "Yes! We offer a 14-day money-back guarantee on all paid plans. If you're not satisfied for any reason, contact us for a full refund.",
  },
  {
    question: "Can I change plans later?",
    answer: "Absolutely. You can upgrade, downgrade, or cancel at any time. Changes take effect immediately, and we prorate any differences.",
  },
];

// ============================================
// PRICING PAGE COMPONENT
// ============================================

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setIsLoggedIn(true);
          // Fetch current plan
          const res = await fetch("/api/me");
          const data = await res.json();
          setCurrentPlan(data.organization?.plan || "free");
        }
      }
    };
    checkAuth();
  }, []);

  const getColorClasses = (color: string, type: "bg" | "border" | "text") => {
    const colors: Record<string, Record<string, string>> = {
      zinc: { bg: "bg-zinc-800", border: "border-zinc-700", text: "text-zinc-400" },
      blue: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400" },
      emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400" },
      violet: { bg: "bg-violet-500/10", border: "border-violet-500/30", text: "text-violet-400" },
    };
    return colors[color]?.[type] || colors.zinc[type];
  };

  const handlePlanClick = (planId: string) => {
    if (planId === "free") {
      window.location.href = "/signup";
    } else if (planId === "agency") {
      window.location.href = "mailto:support@cabbageseo.com?subject=Agency%20Plan%20Inquiry";
    } else {
      window.location.href = isLoggedIn 
        ? `/settings/billing?plan=${planId}&interval=${isYearly ? "yearly" : "monthly"}`
        : `/signup?plan=${planId}`;
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      {/* Header */}
      <header className="border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
              <Eye className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-lg">CabbageSEO</span>
          </Link>
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Link href="/dashboard">
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">Log in</Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm" className="bg-white text-black hover:bg-zinc-200">
                    Start Free Trial
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 px-6 text-center">
        <Badge className="bg-emerald-500/10 text-emerald-400 border-0 mb-4">
          <Gift className="w-3 h-3 mr-1" />
          {TRIAL_DAYS}-Day Free Trial
        </Badge>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Simple, transparent pricing
        </h1>
        <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-8">
          Start with a {TRIAL_DAYS}-day free trial. No credit card required.
          <br />
          Then choose the plan that fits your needs.
        </p>

        {/* Toggle */}
        <div className="inline-flex items-center gap-3 p-1.5 rounded-full bg-zinc-900 border border-zinc-800">
          <button
            onClick={() => setIsYearly(false)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              !isYearly ? "bg-white text-black" : "text-zinc-400 hover:text-white"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setIsYearly(true)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
              isYearly ? "bg-white text-black" : "text-zinc-400 hover:text-white"
            }`}
          >
            Yearly
            <Badge className="bg-emerald-500 text-white text-[10px]">Save 20%</Badge>
          </button>
        </div>
      </section>

      {/* Plans */}
      <section className="pb-20 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
            const isCurrentPlan = currentPlan === plan.id;
            const isTrial = plan.id === "free";
            
            return (
              <Card
                key={plan.id}
                className={`relative bg-zinc-900/50 border-zinc-800 ${
                  plan.popular ? "border-emerald-500/50 ring-1 ring-emerald-500/20" : ""
                } ${isTrial ? "border-dashed" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-emerald-500 text-white">Most Popular</Badge>
                  </div>
                )}
                {isTrial && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-amber-500 text-white">
                      <Clock className="w-3 h-3 mr-1" />
                      {TRIAL_DAYS} Days Free
                    </Badge>
                  </div>
                )}
                
                <CardContent className="p-6">
                  <div className={`w-10 h-10 rounded-xl ${getColorClasses(plan.color, "bg")} flex items-center justify-center mb-4`}>
                    <Icon className={`w-5 h-5 ${getColorClasses(plan.color, "text")}`} />
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                  <p className="text-sm text-zinc-500 mb-4">{plan.description}</p>
                  
                  <div className="mb-6">
                    {isTrial ? (
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-white">$0</span>
                        <span className="text-zinc-500">for {TRIAL_DAYS} days</span>
                      </div>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-white">${price}</span>
                        <span className="text-zinc-500">/mo</span>
                      </div>
                    )}
                    {isYearly && !isTrial && plan.monthlyPrice > 0 && (
                      <p className="text-xs text-emerald-400 mt-1">
                        ${plan.yearlyPrice * 12}/year (save ${(plan.monthlyPrice - plan.yearlyPrice) * 12})
                      </p>
                    )}
                  </div>
                  
                  <Button
                    onClick={() => handlePlanClick(plan.id)}
                    variant={plan.ctaVariant}
                    className={`w-full mb-6 ${
                      plan.popular 
                        ? "bg-emerald-600 hover:bg-emerald-500 text-white" 
                        : isTrial
                        ? "border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
                        : ""
                    }`}
                    disabled={isCurrentPlan}
                  >
                    {isCurrentPlan ? "Current Plan" : plan.cta}
                    {!isCurrentPlan && <ArrowRight className="w-4 h-4 ml-2" />}
                  </Button>
                  
                  <ul className="space-y-3">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm">
                        {feature.included ? (
                          <Check className={`w-4 h-4 mt-0.5 shrink-0 ${
                            (feature as { highlight?: boolean }).highlight ? "text-emerald-400" : "text-zinc-500"
                          }`} />
                        ) : (
                          <X className="w-4 h-4 mt-0.5 shrink-0 text-zinc-700" />
                        )}
                        <span className={feature.included ? "text-zinc-300" : "text-zinc-600"}>
                          {feature.text}
                          {(feature as { note?: string }).note && (
                            <span className="block text-xs text-zinc-600 mt-0.5">
                              {(feature as { note?: string }).note}
                            </span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-8">Why teams choose CabbageSEO</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">14-Day Guarantee</h3>
              <p className="text-sm text-zinc-500">Not happy? Full refund, no questions asked.</p>
            </div>
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">Real API Data</h3>
              <p className="text-sm text-zinc-500">We use actual AI platform APIs, not simulations.</p>
            </div>
            <div>
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 text-violet-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">GEO Intelligence</h3>
              <p className="text-sm text-zinc-500">Get tips to improve your AI visibility.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="space-y-2">
            {faqs.map((faq, idx) => (
              <AccordionItem key={idx} value={`faq-${idx}`} className="border border-zinc-800 rounded-lg px-4">
                <AccordionTrigger className="text-left text-white hover:no-underline py-4">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-zinc-400 pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 border-t border-white/5">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Start your {TRIAL_DAYS}-day free trial</h2>
          <p className="text-zinc-400 mb-8">No credit card required. Full access for {TRIAL_DAYS} days.</p>
          <Link href="/signup">
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-500">
              <Gift className="w-4 h-4 mr-2" />
              Start Free Trial
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
              <Eye className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm text-zinc-500">© 2026 CabbageSEO</span>
          </div>
          <nav className="flex items-center gap-6 text-sm text-zinc-500">
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <Link href="/docs" className="hover:text-white">Docs</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
