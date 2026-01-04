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
  Bell,
  Search,
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
// PRICING DATA - CITATION INTELLIGENCE
// ============================================

const plans = [
  {
    id: "free",
    name: "Free",
    description: "Try citation tracking",
    monthlyPrice: 0,
    yearlyPrice: 0,
    icon: Eye,
    features: [
      { text: "1 website", included: true },
      { text: "3 citation checks/day", included: true },
      { text: "7-day history", included: true },
      { text: "Basic email alerts", included: true },
      { text: "Competitor tracking", included: false },
      { text: "API access", included: false },
    ],
    cta: "Start Free",
    popular: false,
  },
  {
    id: "starter",
    name: "Starter",
    description: "For solopreneurs",
    monthlyPrice: 29,
    yearlyPrice: 24,
    icon: Target,
    features: [
      { text: "3 websites", included: true },
      { text: "100 checks/month", included: true, highlight: true },
      { text: "30-day history", included: true },
      { text: "Real-time alerts", included: true, highlight: true },
      { text: "2 competitors", included: true },
      { text: "CSV export", included: true },
      { text: "Email support", included: true },
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    description: "For growing businesses",
    monthlyPrice: 79,
    yearlyPrice: 66,
    icon: Zap,
    features: [
      { text: "10 websites", included: true },
      { text: "Unlimited checks", included: true, highlight: true },
      { text: "Unlimited history", included: true },
      { text: "Hourly monitoring", included: true, highlight: true },
      { text: "10 competitors", included: true, highlight: true },
      { text: "API access", included: true },
      { text: "Priority support", included: true },
    ],
    cta: "Go Pro",
    popular: true,
  },
  {
    id: "agency",
    name: "Agency",
    description: "For agencies & teams",
    monthlyPrice: 199,
    yearlyPrice: 166,
    icon: Building2,
    features: [
      { text: "50 websites", included: true },
      { text: "Unlimited everything", included: true, highlight: true },
      { text: "Unlimited competitors", included: true },
      { text: "White-label reports", included: true, highlight: true },
      { text: "Custom integrations", included: true },
      { text: "Dedicated support", included: true },
      { text: "SLA guarantee", included: true },
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

const faqs = [
  {
    question: "What is citation tracking?",
    answer: "Citation tracking monitors when AI platforms like ChatGPT, Perplexity, and Google AI mention or reference your website in their responses. We check these platforms regularly and alert you when you're cited.",
  },
  {
    question: "Which AI platforms do you monitor?",
    answer: "We monitor Perplexity (real API with citations), Google AI Overviews (via Gemini with search grounding), and ChatGPT/SearchGPT. Each platform is checked with relevant queries about your domain and industry.",
  },
  {
    question: "How often are citations checked?",
    answer: "Free users get 3 manual checks per day. Starter gets 100 checks/month. Pro users get hourly automated monitoring. Agency users get continuous monitoring with custom frequency options.",
  },
  {
    question: "What's included in competitor tracking?",
    answer: "You can add competitor domains and we'll track their AI citations alongside yours. See how you compare, get alerts when they get cited, and identify opportunities they're missing.",
  },
  {
    question: "Can I export my citation data?",
    answer: "Yes! Starter and above can export to CSV. Agency users get white-label PDF reports for client presentations.",
  },
  {
    question: "Is there a free trial?",
    answer: "The Free plan is always free with limited features. We also offer a 14-day money-back guarantee on all paid plans if you're not satisfied.",
  },
];

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setIsLoggedIn(true);
          const { data: userData } = await supabase
            .from("users")
            .select("organization_id")
            .eq("id", user.id)
            .single();
          const orgId = (userData as { organization_id?: string } | null)?.organization_id;
          if (orgId) {
            const { data: orgData } = await supabase
              .from("organizations")
              .select("plan")
              .eq("id", orgId)
              .single();
            setCurrentPlan((orgData as { plan?: string } | null)?.plan || null);
          }
        }
      }
    };
    checkAuth();
  }, []);

  const handleSelectPlan = (planId: string) => {
    if (planId === "free") {
      window.location.href = "/signup";
    } else if (planId === "agency") {
      window.location.href = "mailto:arjun@cabbageseo.com?subject=Agency Plan Inquiry";
    } else {
      window.location.href = `/api/billing/checkout?plan=${planId}&interval=${isYearly ? "year" : "month"}`;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/cabbageseo_logo.png" alt="CabbageSEO" className="h-10 w-auto" />
            <span className="font-bold text-xl tracking-tight text-white">CabbageSEO</span>
          </Link>
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Link href="/dashboard">
                <Button className="bg-emerald-600 hover:bg-emerald-500">Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="text-zinc-400">Log in</Button>
                </Link>
                <Link href="/signup">
                  <Button className="bg-emerald-600 hover:bg-emerald-500">Start Free</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Simple, Transparent Pricing
        </h1>
        <p className="text-xl text-zinc-400 mb-8">
          Start free. Upgrade when you need more citations tracked.
        </p>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <span className={`text-sm ${!isYearly ? "text-white font-medium" : "text-zinc-500"}`}>
            Monthly
          </span>
          <button
            onClick={() => setIsYearly(!isYearly)}
            className={`w-12 h-6 rounded-full p-1 transition-colors ${isYearly ? "bg-emerald-600" : "bg-zinc-700"}`}
          >
            <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isYearly ? "translate-x-6" : ""}`} />
          </button>
          <span className={`text-sm ${isYearly ? "text-white font-medium" : "text-zinc-500"}`}>
            Yearly
            <Badge className="bg-emerald-500/20 text-emerald-400 ml-2">Save 20%</Badge>
          </span>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map((plan) => {
              const Icon = plan.icon;
              const isCurrentPlan = currentPlan === plan.id;
              
              return (
                <Card
                  key={plan.id}
                  className={`bg-zinc-900 border-zinc-800 relative ${
                    plan.popular ? "border-emerald-500 ring-1 ring-emerald-500" : ""
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-emerald-500 text-white">Most Popular</Badge>
                    </div>
                  )}
                  <CardContent className="pt-8">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-5 h-5 text-emerald-400" />
                      <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                    </div>
                    <p className="text-zinc-500 text-sm mb-4">{plan.description}</p>

                    <div className="mb-6">
                      <span className="text-4xl font-bold text-white">
                        ${isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                      </span>
                      {plan.monthlyPrice > 0 && (
                        <span className="text-zinc-500">/month</span>
                      )}
                      {isYearly && plan.monthlyPrice > 0 && (
                        <p className="text-xs text-zinc-500 mt-1">
                          Billed ${plan.yearlyPrice * 12}/year
                        </p>
                      )}
                    </div>

                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2">
                          {feature.included ? (
                            <Check className={`w-4 h-4 shrink-0 ${feature.highlight ? "text-emerald-400" : "text-zinc-500"}`} />
                          ) : (
                            <X className="w-4 h-4 text-zinc-600 shrink-0" />
                          )}
                          <span className={`text-sm ${feature.included ? (feature.highlight ? "text-white" : "text-zinc-300") : "text-zinc-600"}`}>
                            {feature.text}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      onClick={() => handleSelectPlan(plan.id)}
                      disabled={isCurrentPlan}
                      className={`w-full ${
                        plan.popular
                          ? "bg-emerald-600 hover:bg-emerald-500"
                          : "bg-zinc-800 hover:bg-zinc-700"
                      }`}
                    >
                      {isCurrentPlan ? "Current Plan" : plan.cta}
                      {!isCurrentPlan && <ArrowRight className="w-4 h-4 ml-2" />}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16 px-4 bg-zinc-900/50">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold text-white text-center mb-8">Compare Plans</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left py-4 px-4 text-zinc-400 font-medium">Feature</th>
                  <th className="text-center py-4 px-4 text-zinc-400 font-medium">Free</th>
                  <th className="text-center py-4 px-4 text-zinc-400 font-medium">Starter</th>
                  <th className="text-center py-4 px-4 text-emerald-400 font-medium">Pro</th>
                  <th className="text-center py-4 px-4 text-zinc-400 font-medium">Agency</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-zinc-800/50">
                  <td className="py-3 px-4 text-zinc-300">Websites</td>
                  <td className="text-center py-3 px-4 text-zinc-400">1</td>
                  <td className="text-center py-3 px-4 text-zinc-400">3</td>
                  <td className="text-center py-3 px-4 text-white font-medium">10</td>
                  <td className="text-center py-3 px-4 text-zinc-400">50</td>
                </tr>
                <tr className="border-b border-zinc-800/50">
                  <td className="py-3 px-4 text-zinc-300">Citation Checks</td>
                  <td className="text-center py-3 px-4 text-zinc-400">3/day</td>
                  <td className="text-center py-3 px-4 text-zinc-400">100/mo</td>
                  <td className="text-center py-3 px-4 text-emerald-400 font-medium">Unlimited</td>
                  <td className="text-center py-3 px-4 text-zinc-400">Unlimited</td>
                </tr>
                <tr className="border-b border-zinc-800/50">
                  <td className="py-3 px-4 text-zinc-300">Competitors</td>
                  <td className="text-center py-3 px-4 text-zinc-600">—</td>
                  <td className="text-center py-3 px-4 text-zinc-400">2</td>
                  <td className="text-center py-3 px-4 text-white font-medium">10</td>
                  <td className="text-center py-3 px-4 text-zinc-400">Unlimited</td>
                </tr>
                <tr className="border-b border-zinc-800/50">
                  <td className="py-3 px-4 text-zinc-300">Check Frequency</td>
                  <td className="text-center py-3 px-4 text-zinc-400">Manual</td>
                  <td className="text-center py-3 px-4 text-zinc-400">Daily</td>
                  <td className="text-center py-3 px-4 text-emerald-400 font-medium">Hourly</td>
                  <td className="text-center py-3 px-4 text-zinc-400">Custom</td>
                </tr>
                <tr className="border-b border-zinc-800/50">
                  <td className="py-3 px-4 text-zinc-300">History</td>
                  <td className="text-center py-3 px-4 text-zinc-400">7 days</td>
                  <td className="text-center py-3 px-4 text-zinc-400">30 days</td>
                  <td className="text-center py-3 px-4 text-white font-medium">Unlimited</td>
                  <td className="text-center py-3 px-4 text-zinc-400">Unlimited</td>
                </tr>
                <tr className="border-b border-zinc-800/50">
                  <td className="py-3 px-4 text-zinc-300">API Access</td>
                  <td className="text-center py-3 px-4 text-zinc-600">—</td>
                  <td className="text-center py-3 px-4 text-zinc-600">—</td>
                  <td className="text-center py-3 px-4"><Check className="w-4 h-4 text-emerald-400 mx-auto" /></td>
                  <td className="text-center py-3 px-4"><Check className="w-4 h-4 text-zinc-400 mx-auto" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            Frequently Asked Questions
          </h2>
          
          <Accordion type="single" collapsible className="space-y-2">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border border-zinc-800 rounded-lg px-4 bg-zinc-900">
                <AccordionTrigger className="text-white hover:no-underline py-4">
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
      <section className="py-16 px-4 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">
          Ready to Track Your AI Citations?
        </h2>
        <p className="text-zinc-400 mb-6">
          Start free. See if AI knows about your website.
        </p>
        <Link href="/signup">
          <Button size="lg" className="bg-emerald-600 hover:bg-emerald-500">
            <Eye className="w-5 h-5 mr-2" />
            Start Free
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-8 px-4">
        <div className="container mx-auto max-w-5xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/cabbageseo_logo.png" alt="CabbageSEO" className="h-8 w-auto" />
            <span className="font-bold text-white">CabbageSEO</span>
          </div>
          <nav className="flex items-center gap-6 text-sm text-zinc-500">
            <Link href="/docs" className="hover:text-white">Docs</Link>
            <Link href="/feedback" className="hover:text-white">Feedback</Link>
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <a href="https://x.com/Arjun06061" target="_blank" rel="noopener noreferrer" className="hover:text-white">𝕏 Twitter</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
