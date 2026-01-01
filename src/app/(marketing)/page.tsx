"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Zap,
  FileText,
  Sparkles,
  Check,
  ChevronRight,
  Target,
  TrendingUp,
  Bot,
  Globe,
  Play,
  Clock,
  BarChart3,
  Lightbulb,
  RefreshCw,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ExitIntentPopup } from "@/components/marketing/exit-intent-popup";
import { createClient } from "@/lib/supabase/client";

// ============================================
// LANDING PAGE - GEO (Generative Engine Optimization)
// Honest, no-BS design
// ============================================

// AI Platforms we optimize for
const aiPlatforms = [
  { name: "ChatGPT", icon: "🤖" },
  { name: "Perplexity", icon: "🔮" },
  { name: "Google AI", icon: "✨" },
];

// CMS integrations (real - we actually support these)
const cmsIntegrations = [
  { name: "WordPress", icon: "🔵" },
  { name: "Webflow", icon: "🟣" },
  { name: "Shopify", icon: "🛒" },
  { name: "Ghost", icon: "👻" },
  { name: "Notion", icon: "📝" },
  { name: "HubSpot", icon: "🧡" },
  { name: "Framer", icon: "🎨" },
  { name: "Webhooks", icon: "🔗" },
];

// Pricing plans
const pricingPlans = [
  {
    id: "starter",
    name: "Starter",
    price: 29,
    yearlyPrice: 24,
    description: "For solopreneurs & small sites",
    popular: false,
    features: [
      "3 websites",
      "50 AI articles/month",
      "500 keywords tracked",
      "15 GEO audits/month",
      "100 visibility checks",
      "All CMS integrations",
      "AI-generated images",
      "Email support",
    ],
    cta: "Get Started",
  },
  {
    id: "pro",
    name: "Pro",
    price: 79,
    yearlyPrice: 66,
    description: "For growing businesses",
    popular: true,
    features: [
      "10 websites",
      "150 AI articles/month",
      "2,000 keywords tracked",
      "50 GEO audits/month",
      "300 visibility checks",
      "Autopilot mode",
      "Priority queue",
      "Priority support",
    ],
    cta: "Get Started",
  },
  {
    id: "pro_plus",
    name: "Agency",
    price: 199,
    yearlyPrice: 166,
    description: "For agencies & enterprises",
    popular: false,
    features: [
      "50 websites",
      "500 AI articles/month",
      "10,000 keywords tracked",
      "200 GEO audits/month",
      "1,000 visibility checks",
      "White-label reports",
      "API access",
      "Dedicated support",
    ],
    cta: "Get Started",
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasPaidPlan, setHasPaidPlan] = useState(false);
  const [isYearly, setIsYearly] = useState(false);

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
              .select("plan, subscription_status")
              .eq("id", orgId)
              .single();
            const org = orgData as { plan?: string; subscription_status?: string } | null;
            const isPaid = org?.plan && org.plan !== "free" && ["active", "trialing"].includes(org?.subscription_status || "");
            setHasPaidPlan(!!isPaid);
          }
        }
      }
    };
    checkAuth();
  }, []);

  const handleAnalyze = () => {
    if (!url) return;
    setIsAnalyzing(true);
    router.push(`/analyze?url=${encodeURIComponent(url)}`);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-zinc-100 overflow-x-hidden">
      {/* Gradient background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#0a0a0f]/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2.5">
              <img 
                src="/apple-touch-icon.png" 
                alt="CabbageSEO" 
                className="w-10 h-10"
              />
              <span className="font-bold text-lg tracking-tight">CabbageSEO</span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <Link href="#how-it-works" className="text-sm text-zinc-400 hover:text-white transition-colors">
                How it Works
              </Link>
              <Link href="#pricing" className="text-sm text-zinc-400 hover:text-white transition-colors">
                Pricing
              </Link>
              <Link href="/docs" className="text-sm text-zinc-400 hover:text-white transition-colors">
                Docs
              </Link>
            </div>
            <div className="flex items-center gap-3">
              {isLoggedIn ? (
                <Link href={hasPaidPlan ? "/dashboard" : "/pricing"}>
                  <Button className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white shadow-lg shadow-emerald-500/25">
                    {hasPaidPlan ? "Dashboard" : "Upgrade"}
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" className="text-zinc-400 hover:text-white hover:bg-white/5">
                      Log in
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white shadow-lg shadow-emerald-500/25">
                      Get Started
                      <Sparkles className="w-4 h-4 ml-1.5" />
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* What we do badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 text-sm mb-8 backdrop-blur-sm">
            <Bot className="w-4 h-4 text-emerald-400" />
            <span className="text-zinc-300">Generative Engine Optimization (GEO)</span>
          </div>

          {/* Main headline */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 leading-[1.05]">
            <span className="bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-zinc-400">
              Get your content
            </span>
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-emerald-300 to-teal-400">
              cited by AI
            </span>
          </h1>

          {/* Subheadline - honest, direct */}
          <p className="text-xl md:text-2xl text-zinc-400 max-w-3xl mx-auto mb-10 leading-relaxed">
            Track and improve your visibility across{" "}
            <span className="text-white font-medium">ChatGPT</span>,{" "}
            <span className="text-white font-medium">Perplexity</span>, and{" "}
            <span className="text-white font-medium">Google AI Overviews</span>.
            <br />
            <span className="text-lg">Generate content optimized for AI citation.</span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/signup">
              <Button size="lg" className="h-14 px-8 text-lg bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white rounded-2xl shadow-2xl shadow-emerald-500/30 border border-emerald-400/20">
                Get Started — $29/mo
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/analyze">
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-zinc-700 text-white hover:bg-white/5 rounded-2xl">
                <Play className="w-5 h-5 mr-2" />
                Free Analysis
              </Button>
            </Link>
          </div>

          {/* AI Platform icons */}
          <div className="flex items-center justify-center gap-8 flex-wrap">
            <p className="text-sm text-zinc-500">Optimized for:</p>
            <div className="flex items-center gap-4">
              {aiPlatforms.map((platform, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10"
                >
                  <span className="text-xl">{platform.icon}</span>
                  <span className="text-sm font-medium text-zinc-300">{platform.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* URL Analyzer - Real value, try before you buy */}
      <section className="pb-20 px-6 relative z-10">
        <div className="max-w-2xl mx-auto">
          <div className="p-8 bg-gradient-to-b from-white/5 to-transparent rounded-3xl border border-white/10 backdrop-blur-sm">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                Check your GEO Score — free
              </h2>
              <p className="text-zinc-400 text-sm">
                See how visible your content is to AI platforms
              </p>
            </div>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <Input
                  type="url"
                  placeholder="Enter your website URL"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                  className="w-full h-14 pl-12 pr-4 bg-black/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-xl text-lg"
                />
              </div>
              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="h-14 px-8 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white rounded-xl text-lg shadow-lg shadow-emerald-500/25"
              >
                {isAnalyzing ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Analyze
                    <Zap className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-zinc-500 mt-4 text-center">
              Results in ~30 seconds • No signup required
            </p>
          </div>
        </div>
      </section>

      {/* Problem/Solution - Educational, honest */}
      <section className="py-24 px-6 border-y border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <Badge className="mb-6 bg-amber-500/10 text-amber-400 border-amber-500/20">
                The Shift
              </Badge>
              <h2 className="text-4xl font-bold text-white mb-6">
                Search is changing
              </h2>
              <div className="space-y-4 text-lg text-zinc-400">
                <p>
                  More users now get answers directly from AI — ChatGPT, Perplexity, Google AI Overviews.
                </p>
                <p>
                  These AI systems cite sources. If your content isn&apos;t structured for AI, you may be missing opportunities.
                </p>
                <p>
                  <span className="text-white font-medium">GEO (Generative Engine Optimization)</span> helps your content become a cited source.
                </p>
              </div>
            </div>
            <div>
              <Badge className="mb-6 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                What We Do
              </Badge>
              <h2 className="text-4xl font-bold text-white mb-6">
                Optimize for AI citation
              </h2>
              <div className="space-y-4 text-lg text-zinc-400">
                <p>
                  CabbageSEO analyzes your content for factors that matter to AI systems: entity coverage, quotability, answer structure, and more.
                </p>
                <p>
                  We help you understand your current AI visibility and generate content that&apos;s structured for citation.
                </p>
                <p>
                  <span className="text-white font-medium">100% AI-powered</span> — no expensive third-party SEO tools.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-white/5 text-zinc-300 border-white/10">
              How It Works
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Three steps to better AI visibility
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: Search,
                title: "Analyze Your Site",
                description: "Enter your URL. We analyze your content for AI visibility factors across ChatGPT, Perplexity, and Google AI.",
                color: "from-blue-500 to-blue-600",
              },
              {
                step: "02",
                icon: Lightbulb,
                title: "Get Recommendations",
                description: "See specific suggestions: add entities, improve quotability, structure content for AI extraction.",
                color: "from-purple-500 to-purple-600",
              },
              {
                step: "03",
                icon: TrendingUp,
                title: "Improve & Track",
                description: "Generate optimized content or fix existing pages. Track your visibility score over time.",
                color: "from-emerald-500 to-emerald-600",
              },
            ].map((item, i) => (
              <div key={i} className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent rounded-3xl transform group-hover:scale-105 transition-transform duration-300" />
                <div className="relative p-8 rounded-3xl border border-white/10 bg-black/20 backdrop-blur-sm h-full">
                  <div className="text-6xl font-bold text-white/10 mb-4">{item.step}</div>
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-6 shadow-lg`}>
                    <item.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                  <p className="text-zinc-400">{item.description}</p>
                </div>
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <ChevronRight className="w-8 h-8 text-zinc-700" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              What&apos;s included
            </h2>
            <p className="text-xl text-zinc-400">Everything you need for GEO, nothing you don&apos;t.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Bot, title: "AI Visibility Scoring", description: "Scores for ChatGPT, Perplexity, and Google AI visibility" },
              { icon: FileText, title: "Content Generator", description: "Generate articles optimized for AI citation" },
              { icon: Target, title: "Keyword Research", description: "AI-powered research focusing on topics AI answers" },
              { icon: BarChart3, title: "Progress Tracking", description: "Track your visibility improvements over time" },
              { icon: Globe, title: "Location-Aware", description: "Optimize for different regions and markets" },
              { icon: Zap, title: "CMS Publishing", description: "Publish to WordPress, Webflow, Shopify & more" },
            ].map((feature, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-emerald-500/30 transition-colors group"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 flex items-center justify-center mb-4 group-hover:from-emerald-500/30 group-hover:to-emerald-500/10 transition-colors">
                  <feature.icon className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-zinc-400 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Publish to your CMS
          </h2>
          <p className="text-zinc-400 mb-12">One-click publishing to major platforms</p>

          <div className="flex flex-wrap justify-center gap-4">
            {cmsIntegrations.map((int, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-6 py-4 bg-white/5 rounded-2xl border border-white/10 hover:border-emerald-500/30 transition-colors"
              >
                <span className="text-2xl">{int.icon}</span>
                <span className="font-medium text-zinc-300">{int.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6 bg-gradient-to-b from-transparent via-emerald-500/5 to-transparent">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
              Pricing
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Simple pricing
            </h2>
            <p className="text-xl text-zinc-400 mb-8">
              Choose the plan that fits your needs.
            </p>

            {/* Billing toggle */}
            <div className="inline-flex items-center gap-4 p-1.5 bg-white/5 rounded-full border border-white/10">
              <button
                onClick={() => setIsYearly(false)}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                  !isYearly ? "bg-emerald-500 text-white" : "text-zinc-400 hover:text-white"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsYearly(true)}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                  isYearly ? "bg-emerald-500 text-white" : "text-zinc-400 hover:text-white"
                }`}
              >
                Yearly
                <span className="ml-2 text-xs px-2 py-0.5 bg-emerald-400/20 rounded-full">
                  Save 17%
                </span>
              </button>
            </div>
          </div>

          {/* Pricing cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {pricingPlans.map((plan) => (
              <div
                key={plan.id}
                className={`relative p-8 rounded-3xl ${
                  plan.popular
                    ? "bg-gradient-to-b from-emerald-500/10 to-transparent border-emerald-500/30"
                    : "bg-white/[0.02] border-white/10"
                } border backdrop-blur-sm`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-emerald-500 text-white border-0 shadow-lg shadow-emerald-500/30">
                      Most Popular
                    </Badge>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-white mb-1">{plan.name}</h3>
                  <p className="text-zinc-400 text-sm">{plan.description}</p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-bold text-white">
                      ${isYearly ? plan.yearlyPrice : plan.price}
                    </span>
                    <span className="text-zinc-400">/month</span>
                  </div>
                  {isYearly && (
                    <p className="text-sm text-emerald-400 mt-1">
                      Billed annually
                    </p>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-zinc-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link href="/signup">
                  <Button
                    className={`w-full h-12 rounded-xl ${
                      plan.popular
                        ? "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                        : "bg-white/5 hover:bg-white/10 text-white border border-white/10"
                    }`}
                  >
                    {plan.cta}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <img 
            src="/apple-touch-icon.png" 
            alt="CabbageSEO" 
            className="w-20 h-20 mx-auto mb-8"
          />
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to improve your AI visibility?
          </h2>
          <p className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto">
            Start with a free analysis of your website to see where you stand.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="h-14 px-10 text-lg bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white rounded-2xl shadow-2xl shadow-emerald-500/30">
                Get Started
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/analyze">
              <Button size="lg" variant="outline" className="h-14 px-10 text-lg border-zinc-700 text-white hover:bg-white/5 rounded-2xl">
                Free Analysis
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img 
                src="/apple-touch-icon.png" 
                alt="CabbageSEO" 
                className="w-8 h-8"
              />
              <span className="text-sm text-zinc-400">© 2026 CabbageSEO</span>
            </div>
            <div className="flex items-center gap-8 text-sm text-zinc-400">
              <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
              <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <a href="mailto:hello@cabbageseo.com" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Exit Intent Popup */}
      <ExitIntentPopup />
    </div>
  );
}
