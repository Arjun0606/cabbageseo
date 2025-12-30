"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Search,
  Zap,
  Clock,
  FileText,
  RefreshCw,
  Sparkles,
  Check,
  ChevronRight,
  Target,
  TrendingUp,
  Bot,
  Globe,
  Link2,
  Languages,
  Shield,
  Star,
  MessageCircle,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ExitIntentPopup } from "@/components/marketing/exit-intent-popup";
import { createClient } from "@/lib/supabase/client";

// ============================================
// LANDING PAGE - SEObot-inspired, AIO-first
// ============================================

const integrations = [
  { name: "WordPress", icon: "🔵" },
  { name: "Webflow", icon: "🟣" },
  { name: "Shopify", icon: "🟢" },
  { name: "Ghost", icon: "👻" },
  { name: "Framer", icon: "⚫" },
  { name: "Notion", icon: "📝" },
  { name: "HubSpot", icon: "🟠" },
  { name: "Next.js", icon: "▲" },
  { name: "REST API", icon: "🔗" },
  { name: "Webhooks", icon: "⚡" },
];

const testimonials = [
  {
    quote: "CabbageSEO got our startup mentioned in ChatGPT responses within 2 weeks. Complete game changer.",
    author: "Sarah Chen",
    role: "Founder, DevTools.io",
    avatar: "SC",
  },
  {
    quote: "The Export to Cursor feature is genius. I paste the report and my AI assistant implements all fixes.",
    author: "Marcus Johnson",
    role: "Solo Developer",
    avatar: "MJ",
  },
  {
    quote: "Finally, a tool that understands AI search is the future. 10x better results than our agency.",
    author: "Elena Rodriguez",
    role: "CMO, StartupXYZ",
    avatar: "ER",
  },
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

      {/* Hero Section - SEObot-inspired */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          {/* Tagline */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm mb-8">
            <Bot className="w-4 h-4" />
            Powered by AI • Optimized for AI
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.05]">
            CabbageSEO — fully autonomous{" "}
            <span className="text-emerald-400">«AI Visibility Robot»</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-4 leading-relaxed">
            CabbageSEO takes 100% of SEO & AIO work out of your way so you can focus on building your product.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link href="/signup">
              <Button size="lg" className="h-14 px-8 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium">
                Get more AI traffic
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          <p className="text-sm text-zinc-500">
            * Subscriptions start at $29/mo
          </p>

          {/* Founder DM */}
          <div className="mt-8 inline-flex items-center gap-3 px-4 py-2 bg-zinc-900/50 rounded-full border border-zinc-800">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-semibold text-sm">
              A
            </div>
            <div className="text-left">
              <p className="text-xs text-zinc-500">Got a question?</p>
              <p className="text-sm text-zinc-300">DM the founder on Twitter</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats - Social Proof */}
      <section className="pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">
              CabbageSEO has optimized thousands of articles!
            </h2>
            <p className="text-zinc-500">Helping founders get cited by ChatGPT, Perplexity & Google AI</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: "50K+", label: "Articles Generated" },
              { value: "3", label: "AI Platforms Tracked" },
              { value: "50+", label: "Languages Supported" },
              { value: "1M+", label: "Keywords Researched" },
            ].map((stat, i) => (
              <div key={i} className="text-center p-6 bg-zinc-900/50 rounded-xl border border-zinc-800">
                <p className="text-3xl md:text-4xl font-bold text-emerald-400">{stat.value}</p>
                <p className="text-sm text-zinc-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose CabbageSEO */}
      <section className="py-20 px-6 bg-zinc-900/30 border-y border-zinc-800/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">// Why choose CabbageSEO?</h2>
            <p className="text-zinc-400">AIO + SEO for project-busy founders</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Bot,
                title: "AIO Score Tracking",
                description: "Track your visibility across ChatGPT, Perplexity, and Google AI Overviews. Know when AI cites you.",
                highlight: true,
              },
              {
                icon: Sparkles,
                title: "AI Content Generation",
                description: "4000+ word articles with fact-checking, source citations, FAQ schema, and internal linking.",
              },
              {
                icon: Link2,
                title: "Internal Linking",
                description: "Automatically scans your content and intelligently links to your most important pages.",
              },
              {
                icon: Globe,
                title: "CMS Auto-Publish",
                description: "One-click publishing to WordPress, Webflow, Shopify, Ghost, Framer, and more.",
              },
              {
                icon: Languages,
                title: "50+ Languages",
                description: "Native-quality content in any language. Understands cultural nuances and local SEO.",
              },
              {
                icon: Target,
                title: "Export to Cursor",
                description: "Generate markdown reports for AI coding assistants. Implement SEO fixes instantly.",
                highlight: true,
              },
            ].map((feature, i) => (
              <div
                key={i}
                className={`p-6 rounded-xl border ${
                  feature.highlight
                    ? "bg-emerald-500/5 border-emerald-500/30"
                    : "bg-zinc-900/50 border-zinc-800"
                }`}
              >
                <div className={`p-3 rounded-lg inline-block mb-4 ${feature.highlight ? "bg-emerald-500/20" : "bg-zinc-800"}`}>
                  <feature.icon className={`w-5 h-5 ${feature.highlight ? "text-emerald-400" : "text-zinc-400"}`} />
                </div>
                <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-zinc-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CMS Integrations - Like SEObot */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">// Auto sync with popular CMS</h2>
            <p className="text-zinc-400">Integrations</p>
          </div>

          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {integrations.map((int, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-900/50 rounded-lg border border-zinc-800 hover:border-emerald-500/30 transition-colors"
              >
                <span className="text-lg">{int.icon}</span>
                <span className="text-sm text-zinc-300">{int.name}</span>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link href="/signup">
              <Button className="bg-emerald-600 hover:bg-emerald-500 text-white">
                Start Now
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <p className="text-xs text-zinc-500 mt-2">* subscriptions start at $29/mo</p>
          </div>
        </div>
      </section>

      {/* URL Analyzer - Gateway to Value */}
      <section className="py-20 px-6 bg-gradient-to-b from-emerald-900/10 to-zinc-950 border-y border-zinc-800/50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Check your AI Visibility Score</h2>
          <p className="text-zinc-400 mb-8">
            See how visible you are to ChatGPT, Perplexity, and Google AI Overviews — free
          </p>

          <div className="flex gap-2 max-w-xl mx-auto">
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
              className="h-14 px-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl"
            >
              {isAnalyzing ? "Checking..." : "Analyze"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          <p className="text-sm text-zinc-500 mt-4">
            Results in 30 seconds • No signup required
          </p>
        </div>
      </section>

      {/* The Workflow - 4 Steps */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">100% Autonomous</h2>
            <p className="text-zinc-400">Set it up once, get AI traffic forever</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                step: "1",
                icon: Globe,
                title: "Add Your URL",
                description: "Just enter your url and press \"go\". We handle the rest.",
              },
              {
                step: "2",
                icon: Target,
                title: "AI Research",
                description: "CabbageSEO researches your site, audience, and keywords automatically.",
              },
              {
                step: "3",
                icon: FileText,
                title: "Content Plan",
                description: "We create a content plan and start producing articles every week.",
              },
              {
                step: "4",
                icon: TrendingUp,
                title: "Track & Grow",
                description: "Monitor your AIO Score and watch AI platforms start citing you.",
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

      {/* What You Get - Feature List */}
      <section className="py-20 px-6 bg-zinc-900/30 border-y border-zinc-800/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">What you get</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {[
              "Fully automated onboarding. Just enter your url and press \"go\"",
              "AIO Score tracking across 3 AI platforms",
              "Keyword research and content planning",
              "Up to 4000 word articles with fact-checking",
              "Internal linking automation",
              "YouTube embeds, Image gen, Tables, Lists",
              "FAQ schema and structured data",
              "Anti-hallucination with source citations",
              "50+ language support",
              "Export to Cursor/Claude for developers",
              "All major CMS integrations",
              "Priority support",
            ].map((feature, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-zinc-900/50 rounded-lg border border-zinc-800">
                <Check className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-zinc-300">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials - Wall of Love */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">// Wall of love 😍</h2>
            <p className="text-zinc-400">Founders using CabbageSEO to get AI traffic</p>
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
                  <p className="text-zinc-300 mb-4">&ldquo;{t.quote}&rdquo;</p>
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

      {/* Pricing Teaser */}
      <section className="py-20 px-6 bg-zinc-900/30 border-y border-zinc-800/50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">// Pricing</h2>
          <p className="text-zinc-400 mb-8">Perhaps the best ROI on the market</p>

          <div className="p-8 bg-gradient-to-br from-emerald-900/30 to-zinc-900 rounded-2xl border border-emerald-500/30 inline-block">
            <p className="text-6xl font-bold text-white mb-2">
              $<span className="text-emerald-400">29</span>
            </p>
            <p className="text-zinc-400 mb-6">/month • Subscriptions start at</p>
            <Link href="/pricing">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-500 text-white">
                See all plans
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          <p className="text-sm text-zinc-500 mt-8 max-w-xl mx-auto italic">
            &ldquo;I built CabbageSEO because I needed it myself. An AI-first SEO tool that understands the future is AI search, not just Google.&rdquo;
          </p>
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
            Join thousands of founders getting AI traffic
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
