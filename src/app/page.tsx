import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Zap,
  Target,
  FileText,
  Link2,
  BarChart3,
  CheckCircle2,
  Sparkles,
  Globe,
  Bot,
  TrendingUp,
  Clock,
  Star,
  ChevronRight,
  Play,
  Shield,
  Layers,
  Cpu,
  ArrowUpRight,
} from "lucide-react";

// Features data
const features = [
  {
    icon: Target,
    title: "AI Keyword Discovery",
    description: "Find hidden keyword opportunities with AI-powered clustering and difficulty scoring.",
    color: "from-violet-500 to-purple-600",
  },
  {
    icon: FileText,
    title: "Content Generation",
    description: "Generate SEO-optimized articles with proper structure, meta tags, and internal links.",
    color: "from-blue-500 to-cyan-600",
  },
  {
    icon: Link2,
    title: "One-Click Internal Linking",
    description: "Automatically discover and add internal links across your entire site.",
    color: "from-emerald-500 to-green-600",
  },
  {
    icon: BarChart3,
    title: "SEO Score & Audit",
    description: "Get instant SEO scores with actionable recommendations for every page.",
    color: "from-orange-500 to-red-600",
  },
  {
    icon: Globe,
    title: "Publish Anywhere",
    description: "Direct integration with WordPress, Webflow, Shopify, and more.",
    color: "from-pink-500 to-rose-600",
  },
  {
    icon: Bot,
    title: "Full Autopilot",
    description: "Set it and forget it. CabbageSEO runs your entire SEO strategy automatically.",
    color: "from-amber-500 to-yellow-600",
  },
];

// Stats
const stats = [
  { value: "10x", label: "Faster than agencies" },
  { value: "90%", label: "Cost reduction" },
  { value: "47", label: "Integrations" },
  { value: "24/7", label: "Autonomous operation" },
];

// Testimonials (placeholder)
const testimonials = [
  {
    quote: "CabbageSEO replaced our entire SEO team. We went from 5K to 50K monthly visitors in 3 months.",
    author: "Sarah Chen",
    role: "Founder, TechStartup",
    avatar: "SC",
  },
  {
    quote: "The AI content is better than what our agency was producing. And it costs 1/10th of what we were paying.",
    author: "Marcus Rodriguez",
    role: "Marketing Lead, E-commerce",
    avatar: "MR",
  },
  {
    quote: "Set up took 30 seconds. First optimized article published in 5 minutes. This is the future.",
    author: "Alex Kim",
    role: "Solo Founder",
    avatar: "AK",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white overflow-hidden">
      {/* Gradient Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-cabbage-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 border-b border-white/5">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cabbage-400 to-cabbage-600 flex items-center justify-center">
                <span className="text-xl">🥬</span>
              </div>
              <span className="text-xl font-bold">CabbageSEO</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-gray-400 hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm text-gray-400 hover:text-white transition-colors">How it works</a>
              <a href="#pricing" className="text-sm text-gray-400 hover:text-white transition-colors">Pricing</a>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white" asChild>
                <Link href="/login">Sign in</Link>
              </Button>
              <Button size="sm" className="bg-cabbage-500 hover:bg-cabbage-600" asChild>
                <Link href="/onboarding">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
              <Sparkles className="h-4 w-4 text-cabbage-400" />
              <span className="text-sm text-gray-300">AI-Powered SEO Automation</span>
              <Badge className="bg-cabbage-500 text-white border-0">New</Badge>
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-[1.1]">
              SEO on{" "}
              <span className="bg-gradient-to-r from-cabbage-400 via-emerald-400 to-cabbage-400 bg-clip-text text-transparent">
                Autopilot
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Stop paying agencies $5,000/month. Let AI handle your keyword research, content creation, and optimization—automatically.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Button size="lg" className="h-14 px-8 text-lg bg-cabbage-500 hover:bg-cabbage-600 gap-2" asChild>
                <Link href="/onboarding">
                  <Zap className="h-5 w-5" />
                  Analyze Your Site Free
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-white/20 hover:bg-white/5 gap-2">
                <Play className="h-5 w-5" />
                Watch Demo
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-cabbage-500" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-cabbage-500" />
                <span>30-second setup</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-cabbage-500" />
                <span>SOC 2 compliant</span>
              </div>
            </div>
          </div>

          {/* Hero Visual - Dashboard Preview */}
          <div className="relative mt-20">
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-transparent to-transparent z-10 pointer-events-none" />
            <div className="relative mx-auto max-w-5xl">
              <div className="absolute inset-0 bg-gradient-to-r from-cabbage-500/50 to-purple-500/50 rounded-2xl blur-3xl opacity-30" />
              <div className="relative rounded-2xl border border-white/10 bg-[#111113] p-2 shadow-2xl">
                <div className="rounded-xl bg-[#0A0A0B] overflow-hidden">
                  {/* Mock Dashboard */}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-lg font-semibold">SEO Score</h3>
                        <p className="text-sm text-gray-500">example.com</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cabbage-500/20 to-cabbage-600/20 flex items-center justify-center border-4 border-cabbage-500">
                          <span className="text-2xl font-bold text-cabbage-400">87</span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                      {["Keywords Found", "Content Ideas", "Links to Add", "Issues Fixed"].map((label, i) => (
                        <div key={label} className="p-4 rounded-lg bg-white/5 border border-white/5">
                          <p className="text-2xl font-bold text-white">{[147, 23, 89, 12][i]}</p>
                          <p className="text-xs text-gray-500">{label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-20 border-y border-white/5">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cabbage-400 to-emerald-400 bg-clip-text text-transparent">
                  {stat.value}
                </p>
                <p className="text-gray-500 mt-2">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-32">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <Badge className="bg-white/5 text-cabbage-400 border-cabbage-500/30 mb-4">Features</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Everything you need.{" "}
              <span className="text-gray-500">Nothing you don't.</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              A complete SEO suite that runs itself. No more juggling 10 different tools.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group relative p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative py-32 bg-white/[0.02]">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <Badge className="bg-white/5 text-cabbage-400 border-cabbage-500/30 mb-4">How it works</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              From zero to ranking{" "}
              <span className="text-gray-500">in minutes</span>
            </h2>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { step: 1, title: "Paste your URL", description: "Just enter your website. We'll do the rest.", icon: Globe },
                { step: 2, title: "Get instant insights", description: "AI analyzes your site in 30 seconds flat.", icon: Cpu },
                { step: 3, title: "Watch it grow", description: "Autopilot handles content, links, and optimization.", icon: TrendingUp },
              ].map((item) => (
                <div key={item.step} className="relative text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cabbage-500 to-cabbage-600 flex items-center justify-center mx-auto mb-6">
                    <item.icon className="h-8 w-8 text-white" />
                  </div>
                  <div className="absolute top-8 left-[60%] w-[calc(100%-60%)] h-px bg-gradient-to-r from-cabbage-500/50 to-transparent hidden md:block last:hidden" />
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-gray-400">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative py-32">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <Badge className="bg-white/5 text-cabbage-400 border-cabbage-500/30 mb-4">Testimonials</Badge>
            <h2 className="text-4xl md:text-5xl font-bold">
              Loved by founders{" "}
              <span className="text-gray-500">worldwide</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((testimonial, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-white/[0.02] border border-white/5"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-cabbage-500 text-cabbage-500" />
                  ))}
                </div>
                <p className="text-gray-300 mb-6 leading-relaxed">"{testimonial.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cabbage-500 to-purple-600 flex items-center justify-center text-sm font-medium">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-medium">{testimonial.author}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32">
        <div className="container mx-auto px-6">
          <div className="relative max-w-4xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-cabbage-500 to-emerald-500 rounded-3xl blur-3xl opacity-20" />
            <div className="relative rounded-3xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/10 p-12 md:p-16 text-center">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Ready to automate your SEO?
              </h2>
              <p className="text-xl text-gray-400 mb-8 max-w-xl mx-auto">
                Join thousands of founders who've replaced their SEO agencies with CabbageSEO.
              </p>
              <Button size="lg" className="h-14 px-10 text-lg bg-cabbage-500 hover:bg-cabbage-600 gap-2" asChild>
                <Link href="/onboarding">
                  <Zap className="h-5 w-5" />
                  Start Free Analysis
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <p className="text-sm text-gray-500 mt-6">
                Free forever for 1 site • No credit card required
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 border-t border-white/5">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cabbage-400 to-cabbage-600 flex items-center justify-center">
                <span className="text-sm">🥬</span>
              </div>
              <span className="font-semibold">CabbageSEO</span>
            </div>
            <div className="flex items-center gap-8 text-sm text-gray-500">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Twitter</a>
            </div>
            <p className="text-sm text-gray-500">
              © 2024 CabbageSEO. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
