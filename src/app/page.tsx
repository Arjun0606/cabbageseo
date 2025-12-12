import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Zap,
  Target,
  FileText,
  BarChart3,
  Sparkles,
  Globe,
  Bot,
  Code2,
  Layers,
  Terminal,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0b] text-zinc-100 selection:bg-emerald-500/30 overflow-x-hidden">
      {/* Animated gradient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-violet-500/10 rounded-full blur-[100px] animate-pulse delay-1000" />
      </div>

      {/* Navigation - Full width */}
      <nav className="relative z-50 border-b border-zinc-800/60 bg-[#0a0a0b]/90 backdrop-blur-md sticky top-0">
        <div className="w-full px-6 lg:px-12 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group transition-transform hover:scale-[1.02]">
            <Image src="/logo.png" alt="CabbageSEO" width={44} height={44} className="rounded-xl transition-transform group-hover:rotate-3" />
            <span className="text-xl font-bold tracking-tight">CabbageSEO</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="text-zinc-400 hover:text-zinc-100 h-10 px-4 transition-all hover:bg-zinc-800" asChild>
              <Link href="/login">Log in</Link>
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-500 text-white border-0 h-10 px-5 transition-all hover:shadow-lg hover:shadow-emerald-500/20" asChild>
              <Link href="/signup">Get started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero - Full width with centered content */}
      <section className="relative pt-20 pb-16">
        <div className="w-full px-6 lg:px-12">
          <div className="max-w-3xl animate-fade-in-up">
            {/* Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-sm text-emerald-400 mb-8 animate-fade-in">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <div className="w-2 h-2 rounded-full bg-emerald-500 absolute" />
              Now in early access
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] mb-6">
              <span className="text-zinc-100 block animate-fade-in-up" style={{ animationDelay: '100ms' }}>The first SEO + AIO</span>
              <span className="bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-400 bg-clip-text text-transparent block animate-fade-in-up" style={{ animationDelay: '200ms' }}>Operating System.</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-zinc-400 leading-relaxed mb-10 max-w-2xl animate-fade-in-up" style={{ animationDelay: '300ms' }}>
              Google, ChatGPT, Perplexity—search is changing. CabbageSEO unifies your 
              SEO tools and optimizes for AI search too. One workspace for traditional 
              rankings and AI visibility.
            </p>

            {/* CTA */}
            <div className="flex flex-wrap gap-4 mb-5 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
              <Button size="lg" className="h-12 px-8 bg-emerald-600 hover:bg-emerald-500 text-white border-0 gap-2 text-base font-semibold transition-all hover:scale-105 hover:shadow-xl hover:shadow-emerald-500/25" asChild>
                <Link href="/signup">
                  Try it free
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 hover:border-zinc-600 gap-2 text-base transition-all hover:scale-105" asChild>
                <Link href="/login">
                  <Terminal className="h-5 w-5" />
                  I have an account
                </Link>
              </Button>
            </div>

            <p className="text-sm text-zinc-500 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
              No credit card required. Analyze your first site in under a minute.
            </p>
          </div>
        </div>

        {/* Terminal mockup - Edge to edge with padding */}
        <div className="w-full px-6 lg:px-12 mt-16 animate-fade-in-up" style={{ animationDelay: '600ms' }}>
          <div className="relative max-w-4xl">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/40 via-emerald-500/20 to-violet-500/30 rounded-2xl blur-xl opacity-60" />
            <div className="relative rounded-2xl border border-zinc-700/50 bg-[#111113] overflow-hidden shadow-2xl transition-transform hover:scale-[1.01]">
              {/* Terminal header */}
              <div className="flex items-center gap-2 px-5 py-3 border-b border-zinc-800/80 bg-zinc-900/60">
                <div className="flex gap-2">
                  <div className="w-3.5 h-3.5 rounded-full bg-red-500 transition-transform hover:scale-110" />
                  <div className="w-3.5 h-3.5 rounded-full bg-yellow-500 transition-transform hover:scale-110" />
                  <div className="w-3.5 h-3.5 rounded-full bg-green-500 transition-transform hover:scale-110" />
                </div>
                <span className="text-sm text-zinc-500 ml-4 font-mono">cabbageseo analyze example.com</span>
              </div>
              {/* Terminal content */}
              <div className="p-6 font-mono text-sm sm:text-base">
                <div className="space-y-3">
                  {[
                    { check: "emerald", text: "Crawled 47 pages", time: "2.3s", delay: "700ms" },
                    { check: "emerald", text: "Found 12 technical issues", time: "0.8s", delay: "900ms" },
                    { check: "emerald", text: "Discovered 156 keyword opportunities", time: "3.1s", delay: "1100ms" },
                    { check: "violet", text: "Analyzed AI visibility", time: "1.8s", delay: "1300ms" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4 animate-fade-in-left" style={{ animationDelay: item.delay }}>
                      <span className={`text-${item.check}-400 text-lg`}>✓</span>
                      <span className="text-zinc-200">{item.text}</span>
                      <span className="text-zinc-600 text-xs">{item.time}</span>
                    </div>
                  ))}
                  <div className="pt-4 mt-3 border-t border-zinc-800/80 flex flex-wrap gap-x-8 gap-y-2 animate-fade-in" style={{ animationDelay: '1500ms' }}>
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-400">SEO Score:</span>
                      <span className="text-emerald-400 font-bold text-xl">74/100</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-zinc-400">AIO Score:</span>
                      <span className="text-violet-400 font-bold text-xl">68/100</span>
                      <span className="text-zinc-600 text-xs">(ChatGPT: 72 · Perplexity: 65 · Google AI: 67)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features - Full width grid */}
      <section className="py-20 border-t border-zinc-800/50">
        <div className="w-full px-6 lg:px-12">
          <div className="mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              One workspace. SEO + AI visibility.
            </h2>
            <p className="text-zinc-400 text-lg max-w-2xl">
              We connect your existing tools and add AI visibility scoring for ChatGPT, Perplexity, and Google AI Overviews.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Target, title: "Keyword Research", desc: "Pull data from DataForSEO or SerpAPI. Cluster with AI." },
              { icon: FileText, title: "Content Generation", desc: "Claude writes SEO + AI-optimized content." },
              { icon: Sparkles, title: "AI Visibility Score", desc: "See how you rank in ChatGPT, Perplexity, Google AI.", badge: "NEW" },
              { icon: BarChart3, title: "Technical Audit", desc: "Scan for SEO issues and AI optimization gaps." },
              { icon: Globe, title: "CMS Publishing", desc: "Publish directly to WordPress, Webflow, Shopify." },
              { icon: Bot, title: "Autopilot Mode", desc: "Queue tasks. Let the system run." },
            ].map((item, i) => (
              <div
                key={item.title}
                className="group p-5 rounded-xl border border-zinc-800/60 bg-zinc-900/40 hover:bg-zinc-800/60 hover:border-emerald-500/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/5"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
                    <item.icon className="h-5 w-5 text-emerald-500" />
                  </div>
                  {"badge" in item && item.badge && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-violet-500/20 text-violet-400 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-lg mb-1.5">{item.title}</h3>
                <p className="text-sm text-zinc-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 border-t border-zinc-800/50 bg-gradient-to-b from-zinc-900/50 to-transparent">
        <div className="w-full px-6 lg:px-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-14">How it works</h2>
          
          <div className="grid sm:grid-cols-3 gap-8 lg:gap-12">
            {[
              { step: "01", title: "Connect your site", desc: "Paste your URL. We'll crawl it, audit SEO issues, and score your AI visibility." },
              { step: "02", title: "Get dual scores", desc: "See your SEO score and AIO score. Know how you rank in Google and AI search." },
              { step: "03", title: "Optimize both", desc: "Generate content optimized for traditional search and AI platforms simultaneously." },
            ].map((item, i) => (
              <div key={item.step} className="group">
                <div className="text-6xl font-black bg-gradient-to-br from-emerald-500/40 to-emerald-500/10 bg-clip-text text-transparent mb-4 transition-transform group-hover:scale-110 origin-left">{item.step}</div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-zinc-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integration stack */}
      <section className="py-20 border-t border-zinc-800/50">
        <div className="w-full px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                SEO is evolving.<br />Your tools should too.
              </h2>
              <div className="space-y-4 text-zinc-400 leading-relaxed">
                <p>
                  Google isn&apos;t the only search anymore. ChatGPT, Perplexity, Claude—they&apos;re 
                  answering questions with your content (or your competitor&apos;s).
                </p>
                <p>
                  CabbageSEO is the first Search Optimization OS. We unify your existing SEO tools 
                  and add AI Optimization (AIO).
                </p>
                <p className="text-emerald-400 font-semibold text-lg">
                  Optimize for search today. And tomorrow.
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { label: "Keyword Research", tools: "DataForSEO, SerpAPI" },
                { label: "Content", tools: "Claude, GPT-4" },
                { label: "Publishing", tools: "WordPress, Webflow" },
                { label: "Analytics", tools: "Google Search Console" },
              ].map((row, i) => (
                <div key={row.label} className="flex items-center gap-4 p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/40 hover:bg-zinc-800/50 transition-all hover:translate-x-2" style={{ animationDelay: `${i * 100}ms` }}>
                  <Layers className="h-5 w-5 text-emerald-500 shrink-0" />
                  <div>
                    <p className="font-medium">{row.label}</p>
                    <p className="text-sm text-zinc-500">{row.tools}</p>
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-4 p-4 rounded-xl border-2 border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/15 transition-all hover:translate-x-2">
                <Code2 className="h-5 w-5 text-emerald-400 shrink-0" />
                <div>
                  <p className="font-semibold text-emerald-400">CabbageSEO</p>
                  <p className="text-sm text-zinc-400">Connects everything. Automates the rest.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-zinc-800/50 bg-gradient-to-t from-emerald-950/20 to-transparent">
        <div className="w-full px-6 lg:px-12">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6 transition-transform hover:scale-110 hover:rotate-3">
              <Sparkles className="h-8 w-8 text-emerald-400" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to simplify your SEO?
            </h2>
            <p className="text-zinc-400 mb-8 text-lg">
              We&apos;re in early access. Analyze your first site for free—no credit card, 
              no 30-day trial countdown, no sales calls.
            </p>
            <Button size="lg" className="h-12 px-8 bg-emerald-600 hover:bg-emerald-500 text-white border-0 gap-2 text-base font-semibold transition-all hover:scale-105 hover:shadow-xl hover:shadow-emerald-500/25" asChild>
              <Link href="/signup">
                <Zap className="h-5 w-5" />
                Start analyzing
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-zinc-800/50">
        <div className="w-full px-6 lg:px-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="CabbageSEO" width={32} height={32} className="rounded-lg" />
              <span className="font-medium text-zinc-400">CabbageSEO</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-zinc-500">
              <Link href="/privacy" className="hover:text-zinc-300 transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-zinc-300 transition-colors">Terms</Link>
              <span>© {new Date().getFullYear()}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
