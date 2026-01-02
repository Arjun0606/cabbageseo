"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Brain,
  Target,
  Sparkles,
  Zap,
  Globe,
  TrendingUp,
  Users,
  Heart,
  Shield,
  Lightbulb,
  Rocket,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AboutPage() {
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
            <Brain className="w-3 h-3 mr-1" />
            The Future of Search
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white">
            We Help Websites Get<br />
            <span className="text-emerald-400">Recommended by AI</span>
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            CabbageSEO is the first platform focused entirely on Generative Engine Optimization (GEO) — 
            making your content visible to ChatGPT, Perplexity, Google AI, and the next generation of search.
          </p>
        </div>
      </section>

      {/* The Problem */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6 text-white">The Problem</h2>
              <div className="space-y-4 text-zinc-400">
                <p>
                  <strong className="text-white">Search is changing.</strong> Millions of people now get answers 
                  directly from AI — ChatGPT, Perplexity, Google AI Overviews, Bing Copilot.
                </p>
                <p>
                  These AI platforms cite sources. When someone asks "What's the best project management tool?", 
                  the AI recommends specific products and links to specific websites.
                </p>
                <p>
                  <strong className="text-red-400">If your content isn't optimized for AI, you're invisible.</strong> 
                  You could rank #1 on Google and still get zero traffic from AI platforms.
                </p>
                <p>
                  Traditional SEO tools don't help. They optimize for old Google, not for the AI-powered 
                  future of search.
                </p>
              </div>
            </div>
            <div className="relative">
              <Card className="bg-zinc-900 border-zinc-800 p-8">
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-red-500/10">
                      <Bot className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                      <p className="text-zinc-300 font-medium">User asks ChatGPT:</p>
                      <p className="text-zinc-400 italic">"What's the best CRM for startups?"</p>
                    </div>
                  </div>
                  <div className="border-l-2 border-zinc-700 pl-4 py-2">
                    <p className="text-zinc-400 text-sm">AI recommends 5 CRMs...</p>
                    <p className="text-emerald-400 font-medium">Is your product on this list?</p>
                  </div>
                  <div className="bg-zinc-800/50 rounded-lg p-4">
                    <p className="text-sm text-zinc-500">
                      Over <span className="text-white font-bold">200 million</span> people use ChatGPT weekly. 
                      That's traffic you could be getting.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* The Solution */}
      <section className="py-20 px-4 bg-zinc-900/50 border-y border-zinc-800">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <Card className="bg-zinc-900 border-zinc-800 p-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-bold text-white">GEO Score: 87</p>
                      <p className="text-sm text-emerald-400">+12 from last month</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 pt-4">
                    <div className="text-center p-3 bg-zinc-800/50 rounded-lg">
                      <p className="text-2xl font-bold text-white">23</p>
                      <p className="text-xs text-zinc-400">AI Citations</p>
                    </div>
                    <div className="text-center p-3 bg-zinc-800/50 rounded-lg">
                      <p className="text-2xl font-bold text-white">156</p>
                      <p className="text-xs text-zinc-400">Pages Optimized</p>
                    </div>
                    <div className="text-center p-3 bg-zinc-800/50 rounded-lg">
                      <p className="text-2xl font-bold text-white">4</p>
                      <p className="text-xs text-zinc-400">AI Platforms</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-3xl font-bold mb-6 text-white">Our Solution</h2>
              <div className="space-y-4 text-zinc-400">
                <p>
                  <strong className="text-white">CabbageSEO is the GEO platform.</strong> We analyze your content 
                  specifically for AI visibility and tell you exactly how to get cited.
                </p>
                <p>
                  We check what ChatGPT, Perplexity, and Google AI actually see when they look at your pages. 
                  Then we give you specific fixes to make your content more "quotable" to AI.
                </p>
                <p>
                  <strong className="text-emerald-400">The goal is simple:</strong> When someone asks an AI about 
                  your topic, your content gets recommended.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What is GEO */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-white">What is GEO?</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Generative Engine Optimization (GEO) is the practice of optimizing content to be 
              cited and recommended by AI platforms.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Globe className="w-6 h-6 text-blue-400" />
                  <h3 className="font-bold text-white">Traditional SEO</h3>
                </div>
                <ul className="space-y-2 text-sm text-zinc-400">
                  <li>• Optimize for Google Search rankings</li>
                  <li>• Focus on keywords and backlinks</li>
                  <li>• Get clicks from search results</li>
                  <li>• Measure: Rankings, organic traffic</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-emerald-500/30 ring-1 ring-emerald-500/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Brain className="w-6 h-6 text-emerald-400" />
                  <h3 className="font-bold text-white">GEO (What We Do)</h3>
                  <Badge className="bg-emerald-500/10 text-emerald-400 text-xs">NEW</Badge>
                </div>
                <ul className="space-y-2 text-sm text-zinc-400">
                  <li>• Optimize for AI recommendations</li>
                  <li>• Focus on structure and quotability</li>
                  <li>• Get cited in AI responses</li>
                  <li>• Measure: Citations, AI mentions</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 p-6 bg-zinc-900 border border-zinc-800 rounded-lg">
            <p className="text-center text-zinc-400">
              <strong className="text-white">The best strategy combines both.</strong> We help you rank on Google 
              AND get cited by AI. That's why CabbageSEO measures both SEO and AIO (AI Optimization) scores.
            </p>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-20 px-4 bg-zinc-900/50 border-y border-zinc-800">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-white">What We Believe</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Lightbulb,
                title: "Transparency First",
                description: "We show you exactly what AI sees. No black boxes. Every recommendation comes with an explanation of why it matters.",
              },
              {
                icon: Zap,
                title: "Actionable, Not Theoretical",
                description: "We don't just tell you what's wrong — we give you code snippets, templates, and one-click fixes you can implement today.",
              },
              {
                icon: Heart,
                title: "Built for Humans",
                description: "Our tools work for marketers, not just developers. No technical skills required. But if you're technical, we've got you covered too.",
              },
              {
                icon: Shield,
                title: "Ethical AI Optimization",
                description: "We help you create genuinely useful content that AI wants to cite. No tricks, no spam. Just better content.",
              },
              {
                icon: TrendingUp,
                title: "Results That Matter",
                description: "We track actual citations, not vanity metrics. When ChatGPT recommends your content, you'll know.",
              },
              {
                icon: Rocket,
                title: "Always Evolving",
                description: "AI search changes fast. We stay on top of how ChatGPT, Perplexity, and Google AI work so you don't have to.",
              },
            ].map((value, i) => (
              <Card key={i} className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-6">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4">
                    <value.icon className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h3 className="font-bold text-white mb-2">{value.title}</h3>
                  <p className="text-sm text-zinc-400">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team / Contact */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold mb-6 text-white">Built by Arjun</h2>
          <p className="text-zinc-400 mb-8 max-w-xl mx-auto">
            CabbageSEO is built by a solo founder obsessed with helping websites succeed in the 
            AI-first future of search. Every feature is designed with one goal: get your content cited.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="https://x.com/Arjun06061" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                Follow on X
              </Button>
            </a>
            <a href="mailto:arjun@cabbageseo.com">
              <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                <Mail className="w-4 h-4 mr-2" />
                arjun@cabbageseo.com
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-b from-emerald-500/10 to-zinc-950 border-t border-zinc-800">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold mb-4 text-white">Ready to Get Cited by AI?</h2>
          <p className="text-zinc-400 mb-8">
            Start with a free analysis. See exactly how AI-visible your content is today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/analyze">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-500 text-white">
                Free Analysis
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/how-it-works">
              <Button size="lg" variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                How It Works
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-8 px-4">
        <div className="container mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-zinc-500">© 2026 CabbageSEO. The AI-Native SEO OS.</p>
          <div className="flex items-center gap-6 text-sm text-zinc-500">
            <Link href="/features" className="hover:text-white transition-colors">Features</Link>
            <Link href="/how-it-works" className="hover:text-white transition-colors">How It Works</Link>
            <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

