"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Eye,
  Search,
  Bot,
  Sparkles,
  Check,
  Bell,
  Target,
  TrendingUp,
  BarChart3,
  Brain,
  Zap,
  Shield,
  Globe,
  Play,
  ChevronRight,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

// ============================================
// CABBAGESEO - GEO PLATFORM LANDING PAGE
// Clean, modern design inspired by top SaaS
// ============================================

export default function LandingPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isYearly, setIsYearly] = useState(true);

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

  const handleGetStarted = () => {
    router.push("/signup");
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white overflow-hidden">
      
      {/* ============================================ */}
      {/* HEADER */}
      {/* ============================================ */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#09090b]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
              <Eye className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-lg">CabbageSEO</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm text-zinc-400 hover:text-white transition-colors">Features</Link>
            <Link href="#how-it-works" className="text-sm text-zinc-400 hover:text-white transition-colors">How it works</Link>
            <Link href="/pricing" className="text-sm text-zinc-400 hover:text-white transition-colors">Pricing</Link>
            <Link href="/docs" className="text-sm text-zinc-400 hover:text-white transition-colors">Docs</Link>
          </nav>

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
                  <Button size="sm" className="bg-white text-black hover:bg-zinc-200">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ============================================ */}
      {/* HERO SECTION */}
      {/* ============================================ */}
      <section className="relative pt-32 pb-20 px-6">
        {/* Background gradient */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-emerald-500/20 rounded-full blur-[120px] opacity-50" />
          <div className="absolute top-20 right-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-8">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm text-zinc-400">The GEO Platform for AI Search</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            <span className="text-white">Win </span>
            <span className="bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">AI Search</span>
          </h1>

          <p className="text-xl md:text-2xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Track when ChatGPT, Perplexity, and Google AI cite your website.
            <br className="hidden md:block" />
            Get insights to grow your AI visibility.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Button 
              onClick={handleGetStarted}
              size="lg" 
              className="bg-white text-black hover:bg-zinc-200 h-12 px-8 text-base font-medium"
            >
              Start Free
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Link href="#how-it-works">
              <Button 
                variant="outline" 
                size="lg" 
                className="border-white/20 text-white hover:bg-white/5 h-12 px-8 text-base"
              >
                <Play className="w-4 h-4 mr-2" />
                See how it works
              </Button>
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-zinc-500">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" />
              No credit card required
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" />
              Real AI platform APIs
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" />
              Results in seconds
            </div>
          </div>
        </div>

        {/* Platform logos */}
        <div className="max-w-3xl mx-auto mt-16">
          <p className="text-center text-sm text-zinc-600 mb-6">Tracking citations across</p>
          <div className="flex items-center justify-center gap-12">
            <div className="flex items-center gap-2 text-zinc-400">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Search className="w-5 h-5 text-purple-400" />
              </div>
              <span className="font-medium">Perplexity</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-400">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-blue-400" />
              </div>
              <span className="font-medium">Google AI</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-400">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Bot className="w-5 h-5 text-green-400" />
              </div>
              <span className="font-medium">ChatGPT</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* PRODUCT SHOWCASE */}
      {/* ============================================ */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Mock Dashboard Preview */}
          <div className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-1 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-transparent to-transparent z-10 pointer-events-none" />
            <div className="rounded-xl bg-[#0a0a0f] p-6 md:p-8">
              {/* Fake dashboard header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-white">Citation Dashboard</h3>
                  <p className="text-sm text-zinc-500">yoursite.com</p>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-400 border-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2" />
                  Live tracking
                </Badge>
              </div>
              
              {/* Stats row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label: "Total Citations", value: "47", change: "+12 this week" },
                  { label: "GEO Score", value: "78", change: "Grade B" },
                  { label: "Platforms", value: "3", change: "Active" },
                  { label: "Competitors", value: "5", change: "Tracking" },
                ].map((stat, i) => (
                  <div key={i} className="p-4 rounded-xl bg-white/5">
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-sm text-zinc-500">{stat.label}</p>
                    <p className="text-xs text-emerald-400 mt-1">{stat.change}</p>
                  </div>
                ))}
              </div>

              {/* Fake citation feed */}
              <div className="space-y-3">
                {[
                  { platform: "Perplexity", query: "best project management tools", time: "2 min ago" },
                  { platform: "ChatGPT", query: "how to improve team productivity", time: "15 min ago" },
                  { platform: "Google AI", query: "software for remote teams", time: "1 hour ago" },
                ].map((citation, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-white/[0.02] border border-white/5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      citation.platform === "Perplexity" ? "bg-purple-500/10" :
                      citation.platform === "ChatGPT" ? "bg-green-500/10" :
                      "bg-blue-500/10"
                    }`}>
                      {citation.platform === "Perplexity" ? <Search className="w-4 h-4 text-purple-400" /> :
                       citation.platform === "ChatGPT" ? <Bot className="w-4 h-4 text-green-400" /> :
                       <Sparkles className="w-4 h-4 text-blue-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">"{citation.query}"</p>
                      <p className="text-xs text-zinc-500">{citation.platform} • {citation.time}</p>
                    </div>
                    <Badge variant="outline" className="text-emerald-400 border-emerald-500/30">Cited</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* HOW IT WORKS */}
      {/* ============================================ */}
      <section id="how-it-works" className="py-20 px-6 bg-gradient-to-b from-transparent via-emerald-500/5 to-transparent">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="bg-emerald-500/10 text-emerald-400 border-0 mb-4">How it works</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Three steps to AI visibility
            </h2>
            <p className="text-lg text-zinc-400">
              From zero to citation tracking in under 2 minutes
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: Globe,
                title: "Add your website",
                description: "Enter your domain. We start monitoring immediately.",
              },
              {
                step: "02",
                icon: Search,
                title: "We check AI platforms",
                description: "Daily or hourly queries to Perplexity, Google AI, and ChatGPT.",
              },
              {
                step: "03",
                icon: Bell,
                title: "Get notified",
                description: "Instant alerts when AI starts citing your website.",
              },
            ].map((item, i) => (
              <div key={i} className="relative">
                {i < 2 && (
                  <div className="hidden md:block absolute top-12 left-full w-full h-px bg-gradient-to-r from-white/20 to-transparent -translate-x-4" />
                )}
                <div className="text-6xl font-bold text-white/5 mb-4">{item.step}</div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-zinc-400">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* FEATURES */}
      {/* ============================================ */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="bg-white/5 text-zinc-400 border-white/10 mb-4">Features</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Everything you need to win AI search
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Eye,
                title: "Citation Tracking",
                description: "Real-time monitoring across ChatGPT, Perplexity, and Google AI Overviews.",
              },
              {
                icon: Brain,
                title: "GEO Score",
                description: "AI analyzes your content and scores it for AI-friendliness (0-100).",
              },
              {
                icon: Target,
                title: "Competitor Intel",
                description: "See when competitors get cited. Find gaps in your coverage.",
              },
              {
                icon: Zap,
                title: "Instant Alerts",
                description: "Email notifications the moment AI starts talking about you.",
              },
              {
                icon: BarChart3,
                title: "Query Intelligence",
                description: "Discover what questions AI answers in your niche.",
              },
              {
                icon: TrendingUp,
                title: "Historical Trends",
                description: "Track your AI visibility growth over time with charts and exports.",
              },
            ].map((feature, i) => (
              <Card key={i} className="bg-white/[0.02] border-white/5 hover:border-white/10 transition-colors">
                <CardContent className="p-6">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-zinc-400">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* PRICING PREVIEW */}
      {/* ============================================ */}
      <section className="py-20 px-6 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="bg-emerald-500/10 text-emerald-400 border-0 mb-4">Pricing</Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Start free, scale as you grow
          </h2>
          <p className="text-lg text-zinc-400 mb-8">
            From solo creators to agencies. Fair, transparent pricing.
          </p>

          {/* Quick pricing cards */}
          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            <div className="p-6 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="text-2xl font-bold text-white mb-1">$0</div>
              <div className="text-sm text-zinc-500 mb-3">Free forever</div>
              <div className="text-xs text-zinc-400">1 site • 3 checks/day</div>
            </div>
            <div className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30 relative">
              <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-emerald-500 text-white">Popular</Badge>
              <div className="text-2xl font-bold text-white mb-1">$29<span className="text-sm font-normal text-zinc-400">/mo</span></div>
              <div className="text-sm text-zinc-300 mb-3">Starter</div>
              <div className="text-xs text-zinc-400">3 sites • 100 checks/mo</div>
            </div>
            <div className="p-6 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="text-2xl font-bold text-white mb-1">$79<span className="text-sm font-normal text-zinc-400">/mo</span></div>
              <div className="text-sm text-zinc-500 mb-3">Pro</div>
              <div className="text-xs text-zinc-400">10 sites • Unlimited</div>
            </div>
          </div>

          <Link href="/pricing">
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/5">
              View all plans
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ============================================ */}
      {/* FINAL CTA */}
      {/* ============================================ */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to win AI search?
          </h2>
          <p className="text-lg text-zinc-400 mb-8">
            Join today and see if AI knows about your website.
          </p>
          <Button 
            onClick={handleGetStarted}
            size="lg" 
            className="bg-emerald-600 hover:bg-emerald-500 h-12 px-8 text-base font-medium"
          >
            Start Free
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <p className="text-sm text-zinc-600 mt-4">
            No credit card required • Setup in 60 seconds
          </p>
        </div>
      </section>

      {/* ============================================ */}
      {/* FOOTER */}
      {/* ============================================ */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                <Eye className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold">CabbageSEO</span>
            </div>
            
            <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-zinc-500">
              <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
              <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
              <Link href="/feedback" className="hover:text-white transition-colors">Feedback</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            </nav>

            <a 
              href="https://x.com/Arjun06061" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-zinc-500 hover:text-white transition-colors"
            >
              Built by @Arjun06061
            </a>
          </div>
          
          <div className="mt-8 pt-8 border-t border-white/5 text-center">
            <p className="text-xs text-zinc-600">
              © {new Date().getFullYear()} CabbageSEO. The GEO Platform.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
