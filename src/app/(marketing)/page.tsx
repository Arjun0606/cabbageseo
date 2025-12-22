"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Search,
  Zap,
  Clock,
  DollarSign,
  FileText,
  RefreshCw,
  Sparkles,
  Check,
  ChevronRight,
  Play,
  Target,
  TrendingUp,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExitIntentPopup } from "@/components/marketing/exit-intent-popup";
import { createClient } from "@/lib/supabase/client";

// ============================================
// LANDING PAGE - Labor Replacement Focus
// "Be the Cursor of SEO"
// ============================================

export default function LandingPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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
              <img 
                src="/cabbageseo_logo.png" 
                alt="CabbageSEO" 
                className="h-10 w-auto"
              />
              <span className="font-bold text-xl tracking-tight">CabbageSEO</span>
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
                <Link href="/dashboard">
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white">
                    Go to Dashboard
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
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero - SaaS Founders & Tech Startups */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          {/* Target Audience Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm mb-8">
            <Bot className="w-4 h-4" />
            Built for founders who ship fast
        </div>

          {/* Main Headline - AIO + Speed */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.05]">
            Rank in Google <span className="text-emerald-400">and AI.</span>
            <br />
            <span className="text-zinc-500">In minutes, not months.</span>
          </h1>

          {/* SaaS-focused Subheadline */}
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-4 leading-relaxed">
            The SEO tool for SaaS, startups, and indie makers. Generate AI-optimized content 
            that ranks in Google AND gets cited by ChatGPT.
          </p>
          
          {/* ROI Statement */}
          <p className="text-lg text-zinc-500 mb-10">
            <span className="text-emerald-400 font-semibold">$29/mo</span> vs <span className="line-through text-zinc-600">$3,000/mo agency</span> · No SEO expertise needed
          </p>

          {/* URL Input - Gateway to Value */}
          <div className="max-w-xl mx-auto mb-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <Input
                  type="url"
                  placeholder="Enter your website URL"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                  className="w-full h-14 pl-12 pr-4 bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-xl"
                />
              </div>
              <Button 
                size="lg"
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="h-14 px-8 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium"
              >
                {isAnalyzing ? "Analyzing..." : "Analyze Free"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>

          <p className="text-sm text-zinc-500">
            See what&apos;s hurting your rankings in 30 seconds
          </p>
        </div>
      </section>

      {/* Speed/Value Proof */}
      <section className="pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-3 gap-4 md:gap-8">
            <div className="text-center p-6 bg-zinc-900/50 rounded-xl border border-zinc-800">
              <p className="text-3xl md:text-4xl font-bold text-emerald-400 mb-2">30s</p>
              <p className="text-sm text-zinc-500">Full site analysis</p>
            </div>
            <div className="text-center p-6 bg-zinc-900/50 rounded-xl border border-zinc-800">
              <p className="text-3xl md:text-4xl font-bold text-emerald-400 mb-2">5m</p>
              <p className="text-sm text-zinc-500">Article generated</p>
            </div>
            <div className="text-center p-6 bg-zinc-900/50 rounded-xl border border-zinc-800">
              <p className="text-3xl md:text-4xl font-bold text-emerald-400 mb-2">1-click</p>
              <p className="text-sm text-zinc-500">Publish to CMS</p>
            </div>
          </div>
                </div>
      </section>

      {/* The Money Path - Core Workflow */}
      <section className="py-24 px-6 bg-zinc-900/30 border-y border-zinc-800/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              One workflow. Infinite content.
            </h2>
            <p className="text-zinc-400 max-w-xl mx-auto">
              From keyword to published article in minutes, not days.
            </p>
              </div>

          {/* The Flow */}
          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                step: "1",
                icon: Target,
                title: "Research",
                description: "AI finds keywords your competitors miss",
                time: "2 min",
              },
              {
                step: "2",
                icon: Sparkles,
                title: "Generate",
                description: "Full SEO article with one click",
                time: "5 min",
              },
              {
                step: "3",
                icon: Zap,
                title: "Optimize",
                description: "AI optimizes for Google + ChatGPT",
                time: "1 min",
              },
              {
                step: "4",
                icon: FileText,
                title: "Publish",
                description: "Direct to WordPress, Webflow, Shopify",
                time: "10 sec",
              },
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm font-bold">
                      {item.step}
                    </div>
                    <item.icon className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-white">{item.title}</h3>
                  <p className="text-sm text-zinc-400 mb-3">{item.description}</p>
                  <p className="text-xs text-emerald-400 font-medium">{item.time}</p>
                </div>
                {i < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                    <ChevronRight className="w-6 h-6 text-zinc-700" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Total Time */}
          <div className="mt-12 text-center">
            <p className="text-zinc-500">
              Total time: <span className="text-emerald-400 font-bold">~8 minutes</span> vs 
              <span className="text-zinc-600 line-through ml-2">8 hours manually</span>
            </p>
          </div>
        </div>
      </section>

      {/* Two Killer Features */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Feature 1: Content Generation */}
            <div className="p-8 bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-emerald-500/20 rounded-xl">
                  <Sparkles className="w-6 h-6 text-emerald-400" />
                </div>
                <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">Core Feature</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">
                Generate SEO articles that actually rank
              </h3>
              <p className="text-zinc-400 mb-6 leading-relaxed">
                AI-powered content that&apos;s optimized for both Google AND AI search engines. 
                Includes FAQ sections, definitions, and quotable snippets that ChatGPT loves to cite.
              </p>
              <ul className="space-y-3">
                {["SERP-analyzed outlines", "AI-optimized structure", "1-click CMS publishing", "Built-in internal linking"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-zinc-300">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Feature 2: Content Refresh */}
            <div className="p-8 bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20 rounded-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-purple-500/20 rounded-xl">
                  <RefreshCw className="w-6 h-6 text-purple-400" />
                </div>
                <span className="text-xs font-medium text-purple-400 uppercase tracking-wider">Hidden Gem</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">
                Refresh old content. Recover lost traffic.
              </h3>
              <p className="text-zinc-400 mb-6 leading-relaxed">
                The fastest ROI in SEO isn&apos;t new content—it&apos;s fixing what you already have. 
                AI identifies decay and rewrites sections to match current search intent.
              </p>
              <ul className="space-y-3">
                {["Identify traffic decay", "Update outdated info", "Add missing sections", "Re-optimize for 2025"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-zinc-300">
                    <Check className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* AIO - The Core Differentiator */}
      <section className="py-24 px-6 bg-gradient-to-b from-blue-500/5 to-transparent border-y border-zinc-800/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-6">
              <Bot className="w-3 h-3" />
              The Future of SEO
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Your SaaS needs to show up in AI answers
            </h2>
            <p className="text-zinc-400 max-w-xl mx-auto">
              When developers ask ChatGPT for &quot;best auth library&quot; or founders ask for &quot;best analytics tool&quot; — 
              is YOUR product being recommended? Track and optimize your AI visibility.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto mb-8">
            {[
              { name: "Google AI Overviews", icon: "🔍", desc: "60% of searches" },
              { name: "ChatGPT", icon: "🤖", desc: "200M+ users" },
              { name: "Perplexity", icon: "💡", desc: "Fastest growing" },
            ].map((platform, i) => (
              <div key={i} className="p-8 bg-zinc-900 border border-zinc-800 rounded-xl text-center hover:border-blue-500/30 transition-colors">
                <span className="text-4xl mb-4 block">{platform.icon}</span>
                <p className="text-base font-medium text-zinc-200">{platform.name}</p>
                <p className="text-sm text-blue-400 mt-2">{platform.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <p className="text-sm text-zinc-500 italic">
              &quot;The next generation of SEO isn&apos;t just Google—it&apos;s every AI that answers questions.&quot;
            </p>
          </div>
        </div>
      </section>

      {/* ROI Comparison */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              The math is simple
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-xl">
              <p className="text-sm text-red-400 font-medium mb-4">SEO Agency</p>
              <p className="text-3xl font-bold text-white mb-2">$3,000<span className="text-lg text-zinc-500">/mo</span></p>
              <ul className="text-sm text-zinc-500 space-y-2">
                <li>• Slow communication</li>
                <li>• 4-8 articles/month</li>
                <li>• Generic reports</li>
              </ul>
            </div>

            <div className="p-6 bg-amber-500/5 border border-amber-500/20 rounded-xl">
              <p className="text-sm text-amber-400 font-medium mb-4">Freelancer</p>
              <p className="text-3xl font-bold text-white mb-2">$1,500<span className="text-lg text-zinc-500">/mo</span></p>
              <ul className="text-sm text-zinc-500 space-y-2">
                <li>• Variable quality</li>
                <li>• Limited capacity</li>
                <li>• No AI expertise</li>
              </ul>
                  </div>
                  
            <div className="p-6 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-xl relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full">
                BEST VALUE
                      </div>
              <p className="text-sm text-emerald-400 font-medium mb-4">CabbageSEO Starter</p>
              <p className="text-3xl font-bold text-white mb-2">$29<span className="text-lg text-zinc-500">/mo</span></p>
              <ul className="text-sm text-zinc-300 space-y-2">
                <li>✓ Unlimited research</li>
                <li>✓ 25 articles/month</li>
                <li>✓ AI visibility tracking</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof - Keep it honest */}
      <section className="py-16 px-6 bg-zinc-900/30 border-y border-zinc-800/50">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "10×", label: "Faster content creation" },
              { value: "3", label: "AI platforms tracked" },
              { value: "$29", label: "Starting price" },
              { value: "5min", label: "To first article" },
            ].map((stat, i) => (
              <div key={i}>
                <p className="text-2xl md:text-3xl font-bold text-emerald-400">{stat.value}</p>
                <p className="text-sm text-zinc-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA - Action Focused */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Stop paying for SEO you can do yourself
              </h2>
          <p className="text-zinc-400 mb-8">
            Start with a free analysis. Generate your first article in 5 minutes.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/analyze">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 rounded-xl border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                Free analysis
              </Button>
            </Link>
                  <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white h-14 px-8 rounded-xl">
                Start creating content
                <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                  </Link>
          </div>
          
          <p className="text-sm text-zinc-600 mt-6">
            No credit card required • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-zinc-800">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
            <img 
              src="/cabbageseo_logo.png" 
              alt="CabbageSEO" 
              className="h-8 w-auto"
            />
            <span className="text-sm font-medium text-zinc-400">CabbageSEO</span>
            </div>
          <div className="flex items-center gap-6 text-sm text-zinc-500">
            <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
          </div>
          <p className="text-sm text-zinc-600">© 2025 CabbageSEO</p>
        </div>
      </footer>

      {/* Exit Intent Popup */}
      <ExitIntentPopup />
    </div>
  );
}
