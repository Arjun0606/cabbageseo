"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Search,
  Zap,
  FileText,
  Sparkles,
  Check,
  ChevronRight,
  Target,
  TrendingUp,
  Bot,
  Globe,
  Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ExitIntentPopup } from "@/components/marketing/exit-intent-popup";
import { createClient } from "@/lib/supabase/client";

// ============================================
// LANDING PAGE - Honest, AIO-first
// ============================================

// All CMS integrations - full suite like SEObot
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

const analyticsIntegrations = [
  { name: "Google Search Console", icon: "🔍" },
  { name: "Google Analytics 4", icon: "📊" },
];

export default function LandingPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasPaidPlan, setHasPaidPlan] = useState(false);

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
              <Link href="/pricing" className="text-sm text-zinc-400 hover:text-white transition-colors">
                Pricing
              </Link>
            </div>
            <div className="flex items-center gap-3">
              {isLoggedIn ? (
                <Link href={hasPaidPlan ? "/dashboard" : "/pricing"}>
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white">
                    {hasPaidPlan ? "Dashboard" : "Upgrade"}
                    <ArrowRight className="w-4 h-4 ml-1" />
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

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          {/* Tagline */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm mb-8">
            <Bot className="w-4 h-4" />
            AI Visibility Optimization
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.05]">
            Get your content{" "}
            <span className="text-emerald-400">cited by AI</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-4 leading-relaxed">
            Track your visibility across ChatGPT, Perplexity, and Google AI Overviews. 
            Generate content optimized for AI citation.
          </p>

          {/* Price */}
          <p className="text-lg text-zinc-500 mb-10">
            Starting at <span className="text-emerald-400 font-semibold">$29/mo</span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link href="/signup">
              <Button size="lg" className="h-14 px-8 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium">
                Start Free Trial
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/analyze">
              <Button size="lg" variant="outline" className="h-14 px-8 border-zinc-700 text-zinc-300 hover:bg-zinc-800 rounded-xl">
                Try Free Analysis
              </Button>
            </Link>
          </div>

          <p className="text-sm text-zinc-500">
            No credit card required
          </p>
        </div>
      </section>

      {/* URL Analyzer */}
      <section className="pb-20 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="p-6 bg-zinc-900/50 rounded-xl border border-zinc-800">
            <h2 className="text-lg font-semibold text-white mb-4 text-center">
              Check your AI Visibility Score — free
            </h2>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <Input
                  type="url"
                  placeholder="Enter your website URL"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                  className="w-full h-12 pl-12 pr-4 bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-lg"
                />
              </div>
              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="h-12 px-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg"
              >
                {isAnalyzing ? "Analyzing..." : "Analyze"}
              </Button>
            </div>
            <p className="text-xs text-zinc-500 mt-3 text-center">
              Results in 30 seconds • No signup required
            </p>
          </div>
        </div>
      </section>

      {/* What is AIO */}
      <section className="py-20 px-6 bg-zinc-900/30 border-y border-zinc-800/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">What is AI Visibility Optimization?</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              As AI search grows, traditional SEO isn&apos;t enough. You need to optimize for how 
              AI platforms like ChatGPT and Perplexity understand and cite your content.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Bot,
                title: "Track AI Visibility",
                description: "See your visibility score across ChatGPT, Perplexity, and Google AI Overviews.",
              },
              {
                icon: Sparkles,
                title: "Generate AIO Content",
                description: "Create articles structured for AI citation with FAQs, definitions, and sources.",
              },
              {
                icon: Target,
                title: "Export to Cursor",
                description: "Get actionable fixes you can paste directly into your AI coding assistant.",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="p-6 rounded-xl border bg-zinc-900/50 border-zinc-800"
              >
                <div className="p-3 rounded-lg inline-block mb-4 bg-emerald-500/10">
                  <feature.icon className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-zinc-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-zinc-400">From URL to AI-optimized content in minutes</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                step: "1",
                icon: Globe,
                title: "Add Your Site",
                description: "Paste your URL and we analyze it for AI visibility.",
              },
              {
                step: "2",
                icon: Target,
                title: "Get Your Score",
                description: "See how visible you are to ChatGPT, Perplexity, and Google AI.",
              },
              {
                step: "3",
                icon: FileText,
                title: "Fix Issues",
                description: "Export recommendations to Cursor or implement manually.",
              },
              {
                step: "4",
                icon: TrendingUp,
                title: "Generate Content",
                description: "Create AIO-optimized articles that AI loves to cite.",
              },
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className="p-6 bg-zinc-900/50 rounded-xl border border-zinc-800 h-full">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center text-lg font-bold mb-4">
                    {item.step}
                  </div>
                  <item.icon className="w-6 h-6 text-emerald-400 mb-3" />
                  <h3 className="font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-zinc-500">{item.description}</p>
                </div>
                {i < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                    <ChevronRight className="w-6 h-6 text-zinc-700" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-zinc-900/30 border-y border-zinc-800/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">What&apos;s Included</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {[
              "AI Visibility Score across 3 platforms",
              "AIO-optimized content generation",
              "Technical SEO audit",
              "Keyword research & tracking",
              "Export to Cursor/Claude",
              "FAQ schema generation",
              "Internal linking suggestions",
              "Content with source citations",
            ].map((feature, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-zinc-900/50 rounded-lg border border-zinc-800">
                <Check className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-zinc-300">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations - Full Suite */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Auto-Sync with Your CMS</h2>
            <p className="text-zinc-400">One-click publishing to 8 platforms</p>
          </div>

          {/* CMS Grid */}
          <div className="grid grid-cols-4 md:grid-cols-8 gap-4 mb-8">
            {cmsIntegrations.map((int, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-2 p-4 bg-zinc-900/50 rounded-lg border border-zinc-800 hover:border-emerald-500/50 transition-colors"
              >
                <span className="text-2xl">{int.icon}</span>
                <span className="text-xs text-zinc-400 text-center">{int.name}</span>
              </div>
            ))}
          </div>

          {/* Analytics Row */}
          <div className="flex justify-center gap-4">
            {analyticsIntegrations.map((int, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-900/50 rounded-lg border border-zinc-800"
              >
                <span className="text-lg">{int.icon}</span>
                <span className="text-sm text-zinc-300">{int.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing CTA */}
      <section className="py-20 px-6 bg-zinc-900/30 border-y border-zinc-800/50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Simple Pricing</h2>
          <p className="text-zinc-400 mb-8">Start free, upgrade when you need more</p>

          <div className="p-8 bg-gradient-to-br from-emerald-900/30 to-zinc-900 rounded-2xl border border-emerald-500/30 inline-block">
            <p className="text-5xl font-bold text-white mb-2">
              $<span className="text-emerald-400">29</span>
              <span className="text-lg text-zinc-500">/mo</span>
            </p>
            <p className="text-zinc-400 mb-6">Starter plan</p>
            <Link href="/pricing">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-500 text-white">
                See All Plans
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <Bot className="w-16 h-16 text-emerald-400 mx-auto mb-6" />
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to get cited by AI?
          </h2>
          <p className="text-xl text-zinc-400 mb-8">
            Start with a free analysis of your website
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="h-14 px-8 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl">
                Start Free Trial
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/analyze">
              <Button size="lg" variant="outline" className="h-14 px-8 border-zinc-700 text-zinc-300 hover:bg-zinc-800 rounded-xl">
                Try Free Analysis
              </Button>
            </Link>
          </div>
          <p className="text-xs text-zinc-500 mt-4">
            No credit card required • 14-day money-back guarantee
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-zinc-800">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <img src="/cabbageseo_logo.png" alt="CabbageSEO" className="h-6 w-auto" />
              <span className="text-sm text-zinc-500">© 2025 CabbageSEO</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-zinc-500">
              <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <a href="mailto:support@cabbageseo.com" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Exit Intent Popup */}
      <ExitIntentPopup />
    </div>
  );
}
