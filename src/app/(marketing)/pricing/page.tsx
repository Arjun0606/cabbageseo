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
    description: "Get started with citation tracking",
    monthlyPrice: 0,
    yearlyPrice: 0,
    icon: Eye,
    color: "zinc",
    features: [
      { text: "1 website", included: true },
      { text: "3 checks per day", included: true },
      { text: "7-day history only", included: true, note: "Data deleted after 7 days" },
      { text: "Email alerts", included: true },
      { text: "Competitor tracking", included: false },
      { text: "CSV export", included: false },
      { text: "API access", included: false },
    ],
    cta: "Start Free",
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
    question: "What exactly is citation tracking?",
    answer: "Citation tracking monitors when AI platforms like ChatGPT, Perplexity, and Google AI mention or reference your website in their responses. We query these platforms with relevant questions and detect when your site appears in their answers.",
  },
  {
    question: "Which AI platforms do you monitor?",
    answer: "We monitor Perplexity (real API with citation detection), Google AI Overviews (via Gemini with search grounding), and ChatGPT/SearchGPT. Each platform is checked with queries relevant to your domain and industry.",
  },
  {
    question: "How does the 7-day limit work on Free?",
    answer: "On the Free plan, your citation history is only kept for 7 days. After that, older citations are automatically deleted. Upgrade to Starter for 30-day history or Pro for unlimited history.",
  },
  {
    question: "What counts as a 'check'?",
    answer: "A check is when we query all three AI platforms about your website. Free users get 3 manual checks per day. Starter gets 100 checks per month. Pro and Agency get unlimited checks with automated scheduling.",
  },
  {
    question: "Can I track my competitors?",
    answer: "Yes! Starting from the Starter plan, you can add competitor domains and track their AI citations alongside yours. See how you compare and identify opportunities.",
  },
  {
    question: "Is there a free trial for paid plans?",
    answer: "We offer a 14-day money-back guarantee on all paid plans. If you're not satisfied for any reason, contact us for a full refund.",
  },
  {
    question: "Can I change plans later?",
    answer: "Absolutely. You can upgrade, downgrade, or cancel at any time. Changes take effect immediately, and we prorate any differences.",
  },
];

const comparisonFeatures = [
  { name: "Websites", free: "1", starter: "3", pro: "10", agency: "50" },
  { name: "Citation Checks", free: "3/day", starter: "100/mo", pro: "Unlimited", agency: "Unlimited" },
  { name: "History Retention", free: "7 days", starter: "30 days", pro: "Forever", agency: "Forever" },
  { name: "Competitors", free: "—", starter: "2", pro: "10", agency: "Unlimited" },
  { name: "Check Frequency", free: "Manual", starter: "Daily", pro: "Hourly", agency: "Real-time" },
  { name: "Email Alerts", free: "✓", starter: "✓", pro: "✓", agency: "✓" },
  { name: "CSV Export", free: "—", starter: "✓", pro: "✓", agency: "✓" },
  { name: "API Access", free: "—", starter: "—", pro: "✓", agency: "✓" },
  { name: "White-label", free: "—", starter: "—", pro: "—", agency: "✓" },
];

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

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

  const handleSelectPlan = async (planId: string) => {
    if (planId === "free") {
      window.location.href = "/signup";
      return;
    }
    
    if (planId === "agency") {
      window.location.href = "mailto:arjun@cabbageseo.com?subject=Agency Plan Inquiry";
      return;
    }

    if (!isLoggedIn) {
      window.location.href = `/signup?plan=${planId}`;
      return;
    }

    setLoadingPlan(planId);
    
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          planId, 
          interval: isYearly ? "yearly" : "monthly" 
        }),
      });
      
      const data = await res.json();
      
      if (data.data?.checkoutUrl) {
        window.location.href = data.data.checkoutUrl;
      } else {
        console.error("Checkout error:", data.error);
        alert(data.error || "Failed to start checkout");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      alert("Failed to start checkout. Please try again.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#06060a] text-zinc-100">
      {/* Header */}
      <header className="border-b border-white/5">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
              <Eye className="w-5 h-5 text-white" />
            </div>
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
                  <Button variant="ghost" className="text-zinc-400 hover:text-white">Log in</Button>
                </Link>
                <Link href="/signup">
                  <Button className="bg-emerald-600 hover:bg-emerald-500">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-4 text-center relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[400px] bg-emerald-500/10 rounded-full blur-[120px]" />
        </div>
        
        <div className="relative">
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 mb-6">
            <Sparkles className="w-3 h-3 mr-1" />
            Simple, transparent pricing
          </Badge>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto">
            Start tracking your AI citations today. Upgrade anytime as you grow.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-4 p-1.5 rounded-full bg-white/5 border border-white/10">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                !isYearly ? "bg-white text-zinc-900" : "text-zinc-400 hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                isYearly ? "bg-white text-zinc-900" : "text-zinc-400 hover:text-white"
              }`}
            >
              Yearly
              <Badge className="bg-emerald-500 text-white text-[10px] px-1.5">-20%</Badge>
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {plans.map((plan) => {
              const Icon = plan.icon;
              const isCurrentPlan = currentPlan === plan.id;
              const isLoading = loadingPlan === plan.id;
              
              return (
                <Card
                  key={plan.id}
                  className={`relative bg-[#0a0a0f] border-white/10 overflow-hidden transition-all hover:border-white/20 ${
                    plan.popular ? "border-emerald-500/50 ring-1 ring-emerald-500/20" : ""
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600" />
                  )}
                  
                  <CardContent className="p-6">
                    {plan.popular && (
                      <Badge className="bg-emerald-500 text-white mb-4 text-xs">
                        Most Popular
                      </Badge>
                    )}
                    
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        plan.color === "emerald" ? "bg-emerald-500/10" :
                        plan.color === "blue" ? "bg-blue-500/10" :
                        plan.color === "violet" ? "bg-violet-500/10" :
                        "bg-white/5"
                      }`}>
                        <Icon className={`w-4 h-4 ${
                          plan.color === "emerald" ? "text-emerald-400" :
                          plan.color === "blue" ? "text-blue-400" :
                          plan.color === "violet" ? "text-violet-400" :
                          "text-zinc-400"
                        }`} />
                      </div>
                      <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                    </div>
                    
                    <p className="text-sm text-zinc-500 mb-4">{plan.description}</p>

                    <div className="mb-6">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-white">
                          ${isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                        </span>
                        {plan.monthlyPrice > 0 && (
                          <span className="text-zinc-500 text-sm">/mo</span>
                        )}
                      </div>
                      {isYearly && plan.monthlyPrice > 0 && (
                        <p className="text-xs text-zinc-600 mt-1">
                          ${plan.yearlyPrice * 12}/year • Save ${(plan.monthlyPrice - plan.yearlyPrice) * 12}
                        </p>
                      )}
                      {plan.monthlyPrice === 0 && (
                        <p className="text-xs text-zinc-600 mt-1">
                          Free forever • No credit card
                        </p>
                      )}
                    </div>

                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, i) => {
                        const isHighlight = "highlight" in feature && feature.highlight;
                        return (
                          <li key={i} className="flex items-start gap-2">
                            {feature.included ? (
                              <Check className={`w-4 h-4 mt-0.5 shrink-0 ${
                                isHighlight ? "text-emerald-400" : "text-zinc-500"
                              }`} />
                            ) : (
                              <X className="w-4 h-4 mt-0.5 text-zinc-700 shrink-0" />
                            )}
                            <span className={`text-sm ${
                              feature.included 
                                ? isHighlight ? "text-white font-medium" : "text-zinc-300" 
                                : "text-zinc-600"
                            }`}>
                              {feature.text}
                            </span>
                          </li>
                        );
                      })}
                    </ul>

                    <Button
                      onClick={() => handleSelectPlan(plan.id)}
                      disabled={isCurrentPlan || isLoading}
                      variant={plan.ctaVariant}
                      className={`w-full ${
                        plan.popular
                          ? "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white border-0"
                          : plan.ctaVariant === "outline"
                          ? "border-white/10 text-zinc-300 hover:bg-white/5 hover:text-white"
                          : "bg-white/10 hover:bg-white/15 text-white"
                      }`}
                    >
                      {isLoading ? (
                        "Loading..."
                      ) : isCurrentPlan ? (
                        "Current Plan"
                      ) : (
                        <>
                          {plan.cta}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 px-4 bg-[#0a0a0f]/50">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-white mb-2">Compare All Features</h2>
            <p className="text-zinc-500">See what's included in each plan</p>
          </div>
          
          <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#0a0a0f]">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-4 px-6 text-zinc-400 font-medium">Feature</th>
                  <th className="text-center py-4 px-4 text-zinc-400 font-medium">Free</th>
                  <th className="text-center py-4 px-4 text-zinc-400 font-medium">Starter</th>
                  <th className="text-center py-4 px-4 text-emerald-400 font-medium">
                    <div className="flex items-center justify-center gap-1">
                      <Crown className="w-3 h-3" /> Pro
                    </div>
                  </th>
                  <th className="text-center py-4 px-4 text-zinc-400 font-medium">Agency</th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((feature, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="py-4 px-6 text-zinc-300 font-medium">{feature.name}</td>
                    <td className="text-center py-4 px-4 text-zinc-500">{feature.free}</td>
                    <td className="text-center py-4 px-4 text-zinc-400">{feature.starter}</td>
                    <td className="text-center py-4 px-4 text-white font-medium">{feature.pro}</td>
                    <td className="text-center py-4 px-4 text-zinc-400">{feature.agency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">14-Day Money Back</h3>
              <p className="text-sm text-zinc-500">Not satisfied? Get a full refund within 14 days, no questions asked.</p>
            </div>
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">Cancel Anytime</h3>
              <p className="text-sm text-zinc-500">No long-term contracts. Cancel your subscription whenever you want.</p>
            </div>
            <div>
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-6 h-6 text-violet-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">Real API Data</h3>
              <p className="text-sm text-zinc-500">We use official APIs, not screenshots. Get accurate, reliable citation data.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16 px-4 bg-[#0a0a0f]/50">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-white mb-2">Frequently Asked Questions</h2>
            <p className="text-zinc-500">Everything you need to know</p>
          </div>
          
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem 
                key={i} 
                value={`faq-${i}`} 
                className="border border-white/10 rounded-xl px-5 bg-[#0a0a0f] data-[state=open]:border-emerald-500/30"
              >
                <AccordionTrigger className="text-white hover:no-underline py-4 text-left">
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

      {/* Final CTA */}
      <section className="py-20 px-4 text-center">
        <div className="container mx-auto max-w-2xl">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Track Your AI Citations?
          </h2>
          <p className="text-zinc-400 mb-8">
            Join today and see if AI knows about your website.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white px-8">
                <Eye className="w-5 h-5 mr-2" />
                Start Free
              </Button>
            </Link>
            <Link href="/docs">
              <Button size="lg" variant="outline" className="border-white/10 text-zinc-300 hover:bg-white/5">
                Read the Docs
              </Button>
            </Link>
          </div>
          <p className="text-xs text-zinc-600 mt-4">
            Free plan includes 3 checks/day • No credit card required
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-4">
        <div className="container mx-auto max-w-5xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
              <Eye className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white">CabbageSEO</span>
          </div>
          <nav className="flex items-center gap-6 text-sm text-zinc-500">
            <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
            <Link href="/feedback" className="hover:text-white transition-colors">Feedback</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <a href="https://x.com/Arjun06061" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
              𝕏 Twitter
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
