import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Zap,
  Target,
  FileText,
  Link2,
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
    <div className="min-h-screen bg-[#0a0a0b] text-zinc-100 selection:bg-emerald-500/30">
      {/* Subtle gradient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/20 via-transparent to-transparent" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 border-b border-zinc-800/60 bg-[#0a0a0b]/80 backdrop-blur-sm sticky top-0">
        <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <Image src="/logo.png" alt="CabbageSEO" width={44} height={44} className="rounded-xl" />
            <span className="text-xl font-bold tracking-tight">CabbageSEO</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="text-zinc-400 hover:text-zinc-100 h-10 px-4" asChild>
              <Link href="/login">Log in</Link>
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-500 text-white border-0 h-10 px-5" asChild>
              <Link href="/signup">Get started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-16 pb-12">
        <div className="max-w-5xl mx-auto px-5">
          <div className="max-w-2xl">
            {/* Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400 mb-6">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Now in early access
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-5">
              <span className="text-zinc-100">The first SEO + AIO</span>
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-emerald-500 bg-clip-text text-transparent">Operating System.</span>
            </h1>
            
            <p className="text-lg text-zinc-400 leading-relaxed mb-8">
              Google, ChatGPT, Perplexity—search is changing. CabbageSEO unifies your 
              SEO tools and optimizes for AI search too. One workspace for traditional 
              rankings and AI visibility.
            </p>

            {/* CTA */}
            <div className="flex flex-wrap gap-3 mb-4">
              <Button size="lg" className="h-11 px-6 bg-emerald-600 hover:bg-emerald-500 text-white border-0 gap-2 text-base" asChild>
                <Link href="/signup">
                  Try it free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-11 px-6 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 gap-2 text-base" asChild>
                <Link href="/login">
                  <Terminal className="h-4 w-4" />
                  I have an account
                </Link>
              </Button>
            </div>

            <p className="text-sm text-zinc-500">
              No credit card required. Analyze your first site in under a minute.
            </p>
          </div>
        </div>

        {/* Terminal mockup */}
        <div className="max-w-5xl mx-auto px-5 mt-12">
          <div className="relative">
            <div className="absolute -inset-px bg-gradient-to-r from-emerald-500/30 via-emerald-500/10 to-violet-500/20 rounded-xl blur-sm" />
            <div className="relative rounded-xl border border-zinc-800 bg-[#111113] overflow-hidden shadow-2xl">
              {/* Terminal header */}
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-zinc-800/80 bg-zinc-900/50">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                </div>
                <span className="text-xs text-zinc-500 ml-3 font-mono">cabbageseo analyze example.com</span>
              </div>
              {/* Terminal content */}
              <div className="p-5 font-mono text-sm">
                <div className="space-y-2.5">
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-400">✓</span>
                    <span className="text-zinc-300">Crawled 47 pages</span>
                    <span className="text-zinc-600 text-xs">2.3s</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-400">✓</span>
                    <span className="text-zinc-300">Found 12 technical issues</span>
                    <span className="text-zinc-600 text-xs">0.8s</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-400">✓</span>
                    <span className="text-zinc-300">Discovered 156 keyword opportunities</span>
                    <span className="text-zinc-600 text-xs">3.1s</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-violet-400">✓</span>
                    <span className="text-zinc-300">Analyzed AI visibility</span>
                    <span className="text-zinc-600 text-xs">1.8s</span>
                  </div>
                  <div className="pt-3 mt-2 border-t border-zinc-800/80 flex flex-wrap gap-x-6 gap-y-1">
                    <div>
                      <span className="text-zinc-400">SEO Score: </span>
                      <span className="text-emerald-400 font-bold">74/100</span>
                    </div>
                    <div>
                      <span className="text-zinc-400">AIO Score: </span>
                      <span className="text-violet-400 font-bold">68/100</span>
                      <span className="text-zinc-600 ml-2 text-xs">(ChatGPT: 72 · Perplexity: 65 · Google AI: 67)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 border-t border-zinc-800/50">
        <div className="max-w-5xl mx-auto px-5">
          <div className="mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">
              One workspace. SEO + AI visibility.
            </h2>
            <p className="text-zinc-400 max-w-xl">
              We connect your existing tools—DataForSEO, Search Console, your CMS—and add 
              AI visibility scoring for ChatGPT, Perplexity, and Google AI Overviews.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              {
                icon: Target,
                title: "Keyword Research",
                desc: "Pull data from DataForSEO or SerpAPI. Cluster with AI.",
              },
              {
                icon: FileText,
                title: "Content Generation",
                desc: "Claude writes SEO + AI-optimized content.",
              },
              {
                icon: Sparkles,
                title: "AI Visibility Score",
                desc: "See how you rank in ChatGPT, Perplexity, Google AI.",
                badge: "NEW",
              },
              {
                icon: BarChart3,
                title: "Technical Audit",
                desc: "Scan for SEO issues and AI optimization gaps.",
              },
              {
                icon: Globe,
                title: "CMS Publishing",
                desc: "Publish directly to WordPress, Webflow, Shopify.",
              },
              {
                icon: Bot,
                title: "Autopilot Mode",
                desc: "Queue tasks. Let the system run.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="p-4 rounded-lg border border-zinc-800/60 bg-zinc-900/40 hover:bg-zinc-900/60 hover:border-zinc-700/60 transition-all"
              >
                <div className="flex items-center gap-2 mb-2">
                  <item.icon className="h-5 w-5 text-emerald-500" />
                  {"badge" in item && item.badge && (
                    <span className="px-2 py-0.5 text-[10px] font-medium bg-violet-500/20 text-violet-400 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </div>
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-zinc-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 border-t border-zinc-800/50 bg-zinc-900/20">
        <div className="max-w-5xl mx-auto px-5">
          <h2 className="text-2xl sm:text-3xl font-bold mb-10">How it works</h2>
          
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { 
                step: "01", 
                title: "Connect your site", 
                desc: "Paste your URL. We'll crawl it, audit SEO issues, and score your AI visibility." 
              },
              { 
                step: "02", 
                title: "Get dual scores", 
                desc: "See your SEO score and AIO score. Know how you rank in Google and AI search." 
              },
              { 
                step: "03", 
                title: "Optimize both", 
                desc: "Generate content optimized for traditional search and AI platforms simultaneously." 
              },
            ].map((item) => (
              <div key={item.step}>
                <div className="text-4xl font-bold text-emerald-500/30 mb-3">{item.step}</div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integration stack */}
      <section className="py-16 border-t border-zinc-800/50">
        <div className="max-w-5xl mx-auto px-5">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                SEO is evolving. Your tools should too.
              </h2>
              <div className="space-y-3 text-zinc-400 text-sm leading-relaxed">
                <p>
                  Google isn&apos;t the only search anymore. ChatGPT, Perplexity, Claude—they&apos;re 
                  answering questions with your content (or your competitor&apos;s).
                </p>
                <p>
                  CabbageSEO is the first Search Optimization OS. We unify your existing SEO tools 
                  and add AI Optimization (AIO)—visibility scores for ChatGPT, Perplexity, Google AI 
                  Overviews, and more.
                </p>
                <p className="text-zinc-300 font-medium">
                  Optimize for search today. And tomorrow.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {[
                { label: "Keyword Research", tools: "DataForSEO, SerpAPI" },
                { label: "Content", tools: "Claude, GPT-4" },
                { label: "Publishing", tools: "WordPress, Webflow" },
                { label: "Analytics", tools: "Google Search Console" },
              ].map((row) => (
                <div key={row.label} className="flex items-center gap-3 p-3 rounded-lg border border-zinc-800/60 bg-zinc-900/40">
                  <Layers className="h-4 w-4 text-emerald-500 shrink-0" />
                  <div>
                    <p className="font-medium text-sm">{row.label}</p>
                    <p className="text-xs text-zinc-500">{row.tools}</p>
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-3 p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5">
                <Code2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <div>
                  <p className="font-medium text-sm text-emerald-400">CabbageSEO</p>
                  <p className="text-xs text-zinc-500">Connects everything. Automates the rest.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 border-t border-zinc-800/50 bg-gradient-to-t from-emerald-950/10 to-transparent">
        <div className="max-w-5xl mx-auto px-5">
          <div className="max-w-xl mx-auto text-center">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-5">
              <Sparkles className="h-6 w-6 text-emerald-400" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">
              Ready to simplify your SEO?
            </h2>
            <p className="text-zinc-400 mb-6 text-sm">
              We&apos;re in early access. Analyze your first site for free—no credit card, 
              no 30-day trial countdown, no sales calls.
            </p>
            <Button size="lg" className="h-11 px-6 bg-emerald-600 hover:bg-emerald-500 text-white border-0 gap-2" asChild>
              <Link href="/signup">
                <Zap className="h-4 w-4" />
                Start analyzing
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 border-t border-zinc-800/50">
        <div className="max-w-5xl mx-auto px-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="CabbageSEO" width={28} height={28} className="rounded-lg" />
              <span className="text-sm text-zinc-500">CabbageSEO</span>
            </div>
            <div className="flex items-center gap-5 text-sm text-zinc-600">
              <Link href="/privacy" className="hover:text-zinc-400 transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-zinc-400 transition-colors">Terms</Link>
              <span>© {new Date().getFullYear()}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
