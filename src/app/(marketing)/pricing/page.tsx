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
  Rocket,
  Globe,
  FileText,
  Target,
  RefreshCw,
  Users,
  Star,
  MessageCircle,
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
// PRICING DATA - Better than SEObot
// ============================================

const plans = [
  {
    id: "starter",
    name: "Starter",
    description: "Perfect for indie hackers & small SaaS",
    monthlyPrice: 29,
    yearlyPrice: 24,
    icon: Rocket,
    features: [
      { text: "1 website", included: true },
      { text: "AIO Score + 3 AI platforms", included: true, highlight: true },
      { text: "10 AI-optimized articles/month", included: true },
      { text: "100 keywords tracked", included: true },
      { text: "Technical SEO audit", included: true },
      { text: "Export to Cursor/Claude", included: true, highlight: true },
      { text: "Fact-checking & citations", included: true },
      { text: "Email support", included: true },
    ],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    description: "For growing startups & businesses",
    monthlyPrice: 79,
    yearlyPrice: 66,
    icon: Zap,
    features: [
      { text: "5 websites", included: true },
      { text: "Daily AIO tracking + alerts", included: true, highlight: true },
      { text: "50 AI-optimized articles/month", included: true },
      { text: "Unlimited keywords", included: true },
      { text: "Weekly autopilot content", included: true, highlight: true },
      { text: "All CMS integrations", included: true },
      { text: "Internal linking automation", included: true },
      { text: "Priority support", included: true },
    ],
    cta: "Go Pro",
    popular: true,
  },
  {
    id: "pro_plus",
    name: "Agency",
    description: "For agencies & content teams",
    monthlyPrice: 199,
    yearlyPrice: 166,
    icon: Building2,
    features: [
      { text: "20 websites", included: true },
      { text: "Real-time AIO monitoring", included: true, highlight: true },
      { text: "200 AI-optimized articles/month", included: true },
      { text: "Competitor AIO tracking", included: true, highlight: true },
      { text: "Daily autopilot content", included: true },
      { text: "White-label reports", included: true },
      { text: "API access", included: true },
      { text: "Dedicated success manager", included: true },
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

const faqs = [
  {
    question: "How is CabbageSEO different from SEObot?",
    answer: "SEObot focuses on traditional SEO automation. CabbageSEO goes further with AIO (AI Visibility Optimization) - we track and optimize your visibility across ChatGPT, Perplexity, and Google AI Overviews. Plus, our 'Export to Cursor' feature lets developers implement fixes instantly. We also include fact-checking and source citations in every article.",
  },
  {
    question: "What is AIO (AI Visibility Optimization)?",
    answer: "AIO measures how often AI platforms cite your content. As 60%+ of searches now show AI answers, getting cited by ChatGPT, Perplexity, and Google AI Overviews is crucial. CabbageSEO optimizes your content structure, schema markup, and formatting to maximize AI citations.",
  },
  {
    question: "How does the autopilot content work?",
    answer: "Set it and forget it. CabbageSEO researches keywords, generates AIO-optimized articles with fact-checking and citations, adds internal links, and publishes directly to your CMS. You can review before publishing or let it run 100% autonomous.",
  },
  {
    question: "What CMS integrations do you support?",
    answer: "WordPress, Webflow, Shopify, Ghost, Framer, Notion, HubSpot, Next.js, and any platform with REST API or webhooks. One-click publishing with automatic schema markup.",
  },
  {
    question: "How many languages do you support?",
    answer: "We support 50+ languages with native-quality content generation. Our AI understands cultural nuances and local SEO requirements for each market.",
  },
  {
    question: "Can I cancel anytime?",
    answer: "Yes. No contracts, cancel anytime. We also offer a 14-day money-back guarantee if you're not satisfied with the results.",
  },
];

const stats = [
  { value: "50K+", label: "Articles Generated" },
  { value: "3", label: "AI Platforms Tracked" },
  { value: "50+", label: "Languages Supported" },
  { value: "99%", label: "Uptime" },
];

const testimonials = [
  {
    quote: "CabbageSEO got our SaaS mentioned in ChatGPT within 2 weeks. Game changer for organic leads.",
    author: "Sarah Chen",
    role: "Founder, DevTools.io",
    avatar: "SC",
  },
  {
    quote: "The Export to Cursor feature is genius. I paste the report and Claude implements all the fixes.",
    author: "Marcus Johnson",
    role: "Solo Developer",
    avatar: "MJ",
  },
  {
    quote: "Finally, an SEO tool that understands AI search is the future. 10x better than our agency.",
    author: "Elena Rodriguez",
    role: "CMO, StartupXYZ",
    avatar: "ER",
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
    try {
      const billingPeriod = isYearly ? "yearly" : "monthly";
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, billingPeriod }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (!isLoggedIn) {
        window.location.href = `/signup?plan=${planId}&billing=${billingPeriod}`;
      }
    } catch (error) {
      console.error("Checkout error:", error);
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
          <Badge className="mb-6 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
            🚀 Better than SEObot. Focused on AIO.
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Get your content{" "}
            <span className="text-emerald-400">cited by AI</span>
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-8">
            The only SEO tool that tracks and optimizes your visibility across ChatGPT, Perplexity, and Google AI Overviews.
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <span className={`text-sm ${!isYearly ? "text-white" : "text-zinc-500"}`}>Monthly</span>
            <Switch
              checked={isYearly}
              onCheckedChange={setIsYearly}
              className="data-[state=checked]:bg-emerald-600"
            />
            <span className={`text-sm ${isYearly ? "text-white" : "text-zinc-500"}`}>
              Yearly
              <Badge className="ml-2 bg-emerald-500/20 text-emerald-400 border-0 text-xs">
                Save 17%
              </Badge>
            </span>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <div key={i} className="text-center p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
                <p className="text-2xl md:text-3xl font-bold text-emerald-400">{stat.value}</p>
                <p className="text-sm text-zinc-500">{stat.label}</p>
              </div>
            ))}
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
                        <p className="text-sm text-zinc-500">{plan.description}</p>
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-white">${price}</span>
                        <span className="text-zinc-500">/mo</span>
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
                          <Check className={`w-4 h-4 mt-0.5 shrink-0 ${feature.highlight ? "text-emerald-400" : "text-zinc-500"}`} />
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

      {/* Why Better Than SEObot */}
      <section className="py-20 px-6 bg-zinc-900/30 border-y border-zinc-800/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Why founders choose CabbageSEO</h2>
            <p className="text-zinc-400">Everything SEObot does, plus AIO optimization</p>
          </div>

          {/* Feature Comparison */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {/* What We Share */}
            <div className="p-6 bg-zinc-900/50 rounded-xl border border-zinc-800">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-400" />
                What you get (like SEObot)
              </h3>
              <ul className="space-y-3 text-sm text-zinc-400">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-zinc-600" /> Fully autonomous content generation</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-zinc-600" /> 50+ languages supported</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-zinc-600" /> All major CMS integrations</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-zinc-600" /> Internal linking automation</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-zinc-600" /> Keyword research & tracking</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-zinc-600" /> Fact-checking & source citations</li>
              </ul>
            </div>

            {/* What Makes Us Better */}
            <div className="p-6 bg-emerald-500/5 rounded-xl border border-emerald-500/20">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                What makes us better
              </h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2 text-emerald-300">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span><strong>AIO Score</strong> - Track AI visibility across 3 platforms</span>
                </li>
                <li className="flex items-center gap-2 text-emerald-300">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span><strong>ChatGPT/Perplexity tracking</strong> - Know when AI cites you</span>
                </li>
                <li className="flex items-center gap-2 text-emerald-300">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span><strong>Export to Cursor/Claude</strong> - Implement fixes instantly</span>
                </li>
                <li className="flex items-center gap-2 text-emerald-300">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span><strong>AIO-optimized content</strong> - Structured for AI citation</span>
                </li>
                <li className="flex items-center gap-2 text-emerald-300">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span><strong>$29/mo starting</strong> - 40% cheaper than SEObot</span>
                </li>
                <li className="flex items-center gap-2 text-emerald-300">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span><strong>Improvement tracking</strong> - See your AIO gains over time</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left py-3 px-4 font-medium text-zinc-400">Feature</th>
                  <th className="text-center py-3 px-4 font-medium text-zinc-400">SEObot</th>
                  <th className="text-center py-3 px-4 font-medium text-emerald-400">CabbageSEO</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "AI Content Generation", seobot: true, cabbage: true },
                  { feature: "CMS Integrations", seobot: true, cabbage: true },
                  { feature: "Internal Linking", seobot: true, cabbage: true },
                  { feature: "50+ Languages", seobot: true, cabbage: true },
                  { feature: "AIO Score Tracking", seobot: false, cabbage: true, highlight: true },
                  { feature: "ChatGPT/Perplexity Monitoring", seobot: false, cabbage: true, highlight: true },
                  { feature: "Export to Cursor/Claude", seobot: false, cabbage: true, highlight: true },
                  { feature: "AI Citation Alerts", seobot: false, cabbage: true, highlight: true },
                  { feature: "Starting Price", seobot: "$49/mo", cabbage: "$29/mo", highlight: true },
                ].map((row, i) => (
                  <tr key={i} className={`border-b border-zinc-800/50 ${row.highlight ? "bg-emerald-500/5" : ""}`}>
                    <td className={`py-3 px-4 ${row.highlight ? "text-white font-medium" : "text-zinc-400"}`}>
                      {row.feature}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {typeof row.seobot === "boolean" ? (
                        row.seobot ? (
                          <Check className="w-4 h-4 text-zinc-500 mx-auto" />
                        ) : (
                          <X className="w-4 h-4 text-zinc-700 mx-auto" />
                        )
                      ) : (
                        <span className="text-zinc-500">{row.seobot}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {typeof row.cabbage === "boolean" ? (
                        row.cabbage ? (
                          <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                        ) : (
                          <X className="w-4 h-4 text-zinc-700 mx-auto" />
                        )
                      ) : (
                        <span className="text-emerald-400 font-semibold">{row.cabbage}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">100% Autonomous. AIO-First.</h2>
            <p className="text-zinc-400">Set it up once, get cited by AI forever</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                step: "1",
                icon: Globe,
                title: "Add Your Site",
                description: "Paste your URL. We crawl and analyze in 30 seconds.",
              },
              {
                step: "2",
                icon: Target,
                title: "Get AIO Score",
                description: "See your visibility across ChatGPT, Perplexity, Google AI.",
              },
              {
                step: "3",
                icon: FileText,
                title: "Generate Content",
                description: "AI writes AIO-optimized articles with citations.",
              },
              {
                step: "4",
                icon: Rocket,
                title: "Watch It Grow",
                description: "Track improvements and AI citations over time.",
              },
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className="p-6 bg-zinc-900/50 rounded-xl border border-zinc-800 h-full">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm font-bold mb-4">
                    {item.step}
                  </div>
                  <item.icon className="w-6 h-6 text-emerald-400 mb-3" />
                  <h3 className="font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-zinc-500">{item.description}</p>
                </div>
                {i < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-0.5 bg-zinc-800" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6 bg-zinc-900/30 border-y border-zinc-800/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Loved by founders</h2>
            <p className="text-zinc-400">Join thousands getting cited by AI</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <Card key={i} className="bg-zinc-900/50 border-zinc-800">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-4 h-4 fill-emerald-400 text-emerald-400" />
                    ))}
                  </div>
                  <p className="text-zinc-300 mb-4 italic">&ldquo;{t.quote}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-semibold text-sm">
                      {t.avatar}
                    </div>
                    <div>
                      <p className="font-medium text-white text-sm">{t.author}</p>
                      <p className="text-xs text-zinc-500">{t.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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
              Start free. See your AIO Score. Outrank your competitors in AI search.
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
                <Button size="lg" variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                  Try Free Analysis
                </Button>
              </Link>
            </div>
            <p className="text-xs text-zinc-500 mt-4">
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
              <span className="text-sm text-zinc-500">© 2025 CabbageSEO</span>
            </div>
            <div className="flex gap-6 text-sm text-zinc-500">
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
