"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Globe,
  Sparkles,
  Zap,
  Target,
  Bot,
  FileText,
  BarChart3,
  RefreshCw,
  Settings,
  Mail,
  TrendingUp,
  Brain,
  Search,
  Clock,
  Users,
  Rocket,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function HowItWorksPage() {
  const steps = [
    {
      number: "01",
      title: "Add Your Website",
      description: "Enter your website URL. We'll automatically crawl and analyze every page for SEO and AI visibility issues.",
      details: [
        "Automatic sitemap detection",
        "Deep crawl of all pages",
        "No technical setup required",
        "Works with any CMS or framework",
      ],
      icon: Globe,
      color: "emerald",
    },
    {
      number: "02", 
      title: "Get Your GEO Score",
      description: "See exactly how visible your content is to AI platforms like ChatGPT, Perplexity, and Google AI Overviews.",
      details: [
        "Overall GEO Score (0-100)",
        "Platform-specific scores",
        "Comparison with competitors",
        "Historical tracking",
      ],
      icon: BarChart3,
      color: "blue",
    },
    {
      number: "03",
      title: "Review Recommendations",
      description: "Get specific, actionable fixes for every issue. Each recommendation explains WHY it matters for AI visibility.",
      details: [
        "Priority-ranked fixes",
        "Code examples included",
        "Export for developers",
        "One-click implementation guides",
      ],
      icon: Target,
      color: "violet",
    },
    {
      number: "04",
      title: "Enable Autopilot (Optional)",
      description: "Let AI generate and publish GEO-optimized content automatically. Set it and forget it.",
      details: [
        "Weekly content generation",
        "Auto-publish to your CMS",
        "Topic suggestions based on your niche",
        "Full editorial control",
      ],
      icon: Rocket,
      color: "orange",
    },
    {
      number: "05",
      title: "Track Your Citations",
      description: "See when AI platforms cite your content. Get email alerts for new citations.",
      details: [
        "Real Perplexity citation tracking",
        "Google AI Overview monitoring",
        "ChatGPT mention detection",
        "Weekly citation reports",
      ],
      icon: Sparkles,
      color: "pink",
    },
  ];

  const workflows = [
    {
      title: "For Marketers",
      description: "No coding required. Just paste your URL and follow the recommendations.",
      steps: [
        "Run free analysis at /analyze",
        "Sign up and add your site",
        "Review priority fixes",
        "Send report to dev team",
        "Track improvements over time",
      ],
      cta: "Start Free Analysis",
      href: "/analyze",
    },
    {
      title: "For Developers",
      description: "Get code-ready fixes you can implement directly or paste into AI assistants.",
      steps: [
        "Export report as Markdown",
        "Paste into Cursor/Claude",
        "Implement schema markup",
        "Add structured content",
        "Deploy and re-analyze",
      ],
      cta: "See Developer Docs",
      href: "/docs",
    },
    {
      title: "For Agencies",
      description: "Manage multiple client sites with white-label reports and bulk actions.",
      steps: [
        "Add all client sites",
        "Schedule weekly audits",
        "Export branded reports",
        "Track improvements per client",
        "Demonstrate ROI with citations",
      ],
      cta: "Contact for Agency Pricing",
      href: "mailto:arjun@cabbageseo.com",
    },
  ];

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
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">Log in</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white">Get Started Free</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-4 border-b border-zinc-800">
        <div className="container mx-auto max-w-4xl text-center">
          <Badge className="mb-6 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
            <Clock className="w-3 h-3 mr-1" />
            5 minutes to get started
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white">
            How to Get Your Content<br />
            <span className="text-emerald-400">Cited by AI</span>
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-8">
            Follow our simple 5-step process to optimize your website for ChatGPT, 
            Perplexity, Google AI Overviews, and other AI platforms.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/analyze">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-500 text-white">
                <Search className="w-5 h-5 mr-2" />
                Free Analysis
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="lg" variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                Create Account
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 text-white">The 5-Step GEO Process</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              From zero to AI-cited in days, not months. Here's exactly how it works.
            </p>
          </div>

          <div className="space-y-12">
            {steps.map((step, index) => (
              <div key={step.number} className="relative">
                {index < steps.length - 1 && (
                  <div className="absolute left-8 top-24 bottom-0 w-0.5 bg-gradient-to-b from-zinc-700 to-transparent hidden md:block" />
                )}
                <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-16 flex-shrink-0 bg-zinc-800/50 flex items-center justify-center p-6">
                      <span className="text-4xl font-bold text-zinc-600">{step.number}</span>
                    </div>
                    <CardContent className="flex-1 p-8">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg bg-${step.color}-500/10`}>
                          <step.icon className={`w-6 h-6 text-${step.color}-400`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-white mb-2">{step.title}</h3>
                          <p className="text-zinc-400 mb-4">{step.description}</p>
                          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {step.details.map((detail, i) => (
                              <li key={i} className="flex items-center gap-2 text-sm text-zinc-300">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                {detail}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflows by Role */}
      <section className="py-20 px-4 bg-zinc-900/50 border-y border-zinc-800">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 text-white">Workflows by Role</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Whether you're a marketer, developer, or agency, we have a workflow for you.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {workflows.map((workflow) => (
              <Card key={workflow.title} className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white">{workflow.title}</CardTitle>
                  <p className="text-sm text-zinc-400">{workflow.description}</p>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-3 mb-6">
                    {workflow.steps.map((step, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 text-xs flex items-center justify-center font-bold">
                          {i + 1}
                        </span>
                        <span className="text-sm text-zinc-300">{step}</span>
                      </li>
                    ))}
                  </ol>
                  <Link href={workflow.href}>
                    <Button className="w-full bg-zinc-800 hover:bg-zinc-700 text-white">
                      {workflow.cta}
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT YOU GET */}
      <section className="py-20 px-4 bg-zinc-900/50">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
              Real Results
            </Badge>
            <h2 className="text-3xl font-bold text-white mb-4">
              What Makes CabbageSEO Different
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              We don't just analyze your site—we actively help you get cited by AI.
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-6">
            <Card className="bg-zinc-900 border-zinc-800 text-center">
              <CardContent className="pt-6">
                <div className="w-14 h-14 mx-auto rounded-xl bg-emerald-500/20 flex items-center justify-center mb-4">
                  <Brain className="w-7 h-7 text-emerald-400" />
                </div>
                <h3 className="font-bold text-white mb-2">AI-Ready Content</h3>
                <p className="text-sm text-zinc-400">Content structured specifically for AI platforms to quote and cite</p>
              </CardContent>
            </Card>
            
            <Card className="bg-zinc-900 border-zinc-800 text-center">
              <CardContent className="pt-6">
                <div className="w-14 h-14 mx-auto rounded-xl bg-blue-500/20 flex items-center justify-center mb-4">
                  <Sparkles className="w-7 h-7 text-blue-400" />
                </div>
                <h3 className="font-bold text-white mb-2">Original Images</h3>
                <p className="text-sm text-zinc-400">Unique featured images generated for every article you create</p>
              </CardContent>
            </Card>
            
            <Card className="bg-zinc-900 border-zinc-800 text-center">
              <CardContent className="pt-6">
                <div className="w-14 h-14 mx-auto rounded-xl bg-purple-500/20 flex items-center justify-center mb-4">
                  <Search className="w-7 h-7 text-purple-400" />
                </div>
                <h3 className="font-bold text-white mb-2">Real Citations</h3>
                <p className="text-sm text-zinc-400">We check actual AI platforms to verify when you're being cited</p>
              </CardContent>
            </Card>
            
            <Card className="bg-zinc-900 border-zinc-800 text-center">
              <CardContent className="pt-6">
                <div className="w-14 h-14 mx-auto rounded-xl bg-orange-500/20 flex items-center justify-center mb-4">
                  <Zap className="w-7 h-7 text-orange-400" />
                </div>
                <h3 className="font-bold text-white mb-2">Full Autopilot</h3>
                <p className="text-sm text-zinc-400">Set it once, and we handle content creation and publishing weekly</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-12 text-center">
            <p className="text-zinc-500 text-sm">
              Have questions or feedback? We'd love to hear from you. 
              <Link href="/feedback" className="text-emerald-400 hover:underline ml-1">
                Reach out directly →
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold mb-12 text-center text-white">Common Questions</h2>
          
          <div className="space-y-6">
            {[
              {
                q: "How long until I see results?",
                a: "You'll see your GEO score immediately after analysis. Actual AI citations typically start appearing 2-4 weeks after implementing fixes, depending on how often AI platforms recrawl your site.",
              },
              {
                q: "Do I need technical skills?",
                a: "No! We provide one-click fixes and exportable reports. You can send the report to your developer or paste it into an AI coding assistant like Cursor or Claude to implement changes.",
              },
              {
                q: "What CMS platforms do you support?",
                a: "We support WordPress, Webflow, Shopify, Ghost, Notion, HubSpot, Framer, and custom webhooks. If you can publish content, we can integrate.",
              },
              {
                q: "How do you track AI citations?",
                a: "We directly check AI search platforms to see if they're citing your content. When we find new citations, you get email alerts immediately.",
              },
              {
                q: "What's the difference between SEO and GEO?",
                a: "SEO optimizes for Google Search rankings. GEO (Generative Engine Optimization) optimizes for AI platforms like ChatGPT, Perplexity, and Google AI Overviews. We do both.",
              },
            ].map((faq, i) => (
              <Card key={i} className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-6">
                  <h3 className="font-bold text-white mb-2">{faq.q}</h3>
                  <p className="text-zinc-400">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-b from-emerald-500/10 to-zinc-950 border-t border-zinc-800">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold mb-4 text-white">Ready to Get Started?</h2>
          <p className="text-zinc-400 mb-8">
            Run a free analysis now and see exactly what's holding your content back from AI visibility.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/analyze">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-500 text-white">
                Free Analysis
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/features">
              <Button size="lg" variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                See All Features
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-8 px-4">
        <div className="container mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-zinc-500">© 2026 CabbageSEO. The Ultimate GEO Machine.</p>
          <div className="flex items-center gap-6 text-sm text-zinc-500">
            <Link href="/about" className="hover:text-white transition-colors">About</Link>
            <Link href="/features" className="hover:text-white transition-colors">Features</Link>
            <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
            <Link href="/feedback" className="hover:text-emerald-400 transition-colors text-emerald-400/70">Feedback</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

