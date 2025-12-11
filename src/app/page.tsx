import Link from "next/link";
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
    <div className="min-h-screen bg-[#09090b] text-zinc-100 selection:bg-emerald-500/30">
      {/* Grid pattern background */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.015]" 
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` 
        }}
      />

      {/* Navigation */}
      <nav className="relative z-50 border-b border-zinc-800/50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:border-emerald-500/40 transition-colors">
                <span className="text-lg">🥬</span>
              </div>
              <span className="text-lg font-semibold tracking-tight">CabbageSEO</span>
            </Link>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-zinc-100" asChild>
                <Link href="/login">Log in</Link>
              </Button>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white border-0" asChild>
                <Link href="/signup">Get started</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-24 pb-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-3xl">
            {/* Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-800/50 border border-zinc-700/50 text-sm text-zinc-400 mb-8">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Now in early access
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
              <span className="text-zinc-100">SEO tools are fragmented.</span>
              <br />
              <span className="text-emerald-400">We unified them.</span>
            </h1>
            
            <p className="text-xl text-zinc-400 leading-relaxed mb-10 max-w-2xl">
              You shouldn&apos;t need 10 subscriptions and an agency to do SEO. 
              CabbageSEO connects your existing tools, automates the boring stuff, 
              and lets you focus on what matters.
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <Button size="lg" className="h-12 px-6 bg-emerald-600 hover:bg-emerald-500 text-white border-0 gap-2" asChild>
                <Link href="/onboarding">
                  Try it free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-6 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 gap-2" asChild>
                <Link href="/login">
                  <Terminal className="h-4 w-4" />
                  I have an account
                </Link>
              </Button>
            </div>

            <p className="text-sm text-zinc-500">
              No credit card. Analyze your first site in under a minute.
            </p>
          </div>
        </div>

        {/* Code-like visual element */}
        <div className="max-w-6xl mx-auto px-6 mt-20">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 via-transparent to-emerald-500/10 rounded-xl blur-xl" />
            <div className="relative rounded-xl border border-zinc-800 bg-zinc-900/80 backdrop-blur overflow-hidden">
              {/* Terminal header */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800 bg-zinc-900">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-zinc-700" />
                  <div className="w-3 h-3 rounded-full bg-zinc-700" />
                  <div className="w-3 h-3 rounded-full bg-zinc-700" />
                </div>
                <span className="text-xs text-zinc-500 ml-2 font-mono">cabbageseo analyze example.com</span>
              </div>
              {/* Terminal content */}
              <div className="p-6 font-mono text-sm">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-400">✓</span>
                    <span className="text-zinc-400">Crawled 47 pages</span>
                    <span className="text-zinc-600">2.3s</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-400">✓</span>
                    <span className="text-zinc-400">Found 12 technical issues</span>
                    <span className="text-zinc-600">0.8s</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-400">✓</span>
                    <span className="text-zinc-400">Discovered 156 keyword opportunities</span>
                    <span className="text-zinc-600">3.1s</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-400">✓</span>
                    <span className="text-zinc-400">Generated 8 content ideas</span>
                    <span className="text-zinc-600">1.2s</span>
                  </div>
                  <div className="pt-3 border-t border-zinc-800">
                    <span className="text-zinc-300">SEO Score: </span>
                    <span className="text-emerald-400 font-bold">74/100</span>
                    <span className="text-zinc-500 ml-3">→ Ready for autopilot</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What it does */}
      <section className="py-24 border-t border-zinc-800/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-16">
            <h2 className="text-3xl font-bold mb-4">
              One workspace. All your SEO.
            </h2>
            <p className="text-zinc-400 text-lg max-w-2xl">
              We don&apos;t reinvent the wheel. We connect DataForSEO, Google Search Console, 
              your CMS, and AI—then orchestrate them into one clean interface.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: Target,
                title: "Keyword Research",
                desc: "Pull data from DataForSEO or SerpAPI. Cluster with AI. No manual spreadsheets.",
              },
              {
                icon: FileText,
                title: "Content Generation",
                desc: "Claude or GPT writes. You edit. Publish to WordPress, Webflow, or Shopify.",
              },
              {
                icon: Link2,
                title: "Internal Linking",
                desc: "Find link opportunities across your site. Apply them in one click.",
              },
              {
                icon: BarChart3,
                title: "Technical Audit",
                desc: "Scan for issues. Get fixes. Some are even auto-applied.",
              },
              {
                icon: Globe,
                title: "CMS Publishing",
                desc: "Connected to your CMS. Hit publish, it goes live with proper SEO meta.",
              },
              {
                icon: Bot,
                title: "Autopilot Mode",
                desc: "Queue tasks. Let the system run. Check back when it's done.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="p-5 rounded-lg border border-zinc-800/50 bg-zinc-900/30 hover:bg-zinc-900/50 hover:border-zinc-700/50 transition-all"
              >
                <item.icon className="h-5 w-5 text-emerald-500 mb-3" />
                <h3 className="font-semibold mb-1.5">{item.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Philosophy */}
      <section className="py-24 border-t border-zinc-800/50 bg-zinc-900/30">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">
                We&apos;re not building another SEO tool.
              </h2>
              <div className="space-y-4 text-zinc-400">
                <p>
                  There are already great keyword tools, crawlers, and content graders. 
                  The problem isn&apos;t the tools—it&apos;s that you need 10 of them, 
                  they don&apos;t talk to each other, and you spend more time switching tabs 
                  than actually improving your SEO.
                </p>
                <p>
                  CabbageSEO is the orchestration layer. Think of it like Cursor for coding, 
                  but for SEO. We connect your existing subscriptions, add AI where it helps, 
                  and give you one place to actually get things done.
                </p>
                <p className="text-zinc-300 font-medium">
                  Less tool-hopping. More shipping.
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { label: "Keyword Research", tools: "DataForSEO, SerpAPI, Ahrefs" },
                { label: "Content", tools: "Claude, GPT-4, Together.ai" },
                { label: "Publishing", tools: "WordPress, Webflow, Shopify" },
                { label: "Analytics", tools: "Google Search Console, GA4" },
              ].map((row) => (
                <div key={row.label} className="flex items-center gap-4 p-4 rounded-lg border border-zinc-800 bg-zinc-900/50">
                  <Layers className="h-4 w-4 text-emerald-500 shrink-0" />
                  <div>
                    <p className="font-medium text-sm">{row.label}</p>
                    <p className="text-xs text-zinc-500">{row.tools}</p>
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-4 p-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
                <Code2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <div>
                  <p className="font-medium text-sm text-emerald-400">CabbageSEO</p>
                  <p className="text-xs text-zinc-500">Connects everything. Automates the rest.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 border-t border-zinc-800/50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-12">How it works</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                step: "01", 
                title: "Connect your site", 
                desc: "Paste your URL. We'll crawl it, find issues, and pull in your GSC data if connected." 
              },
              { 
                step: "02", 
                title: "Get a strategy", 
                desc: "AI analyzes your niche, finds keyword gaps, and suggests content to create." 
              },
              { 
                step: "03", 
                title: "Execute (or autopilot)", 
                desc: "Generate content, fix issues, publish—manually or let the system handle it." 
              },
            ].map((item) => (
              <div key={item.step}>
                <div className="text-5xl font-bold text-zinc-800 mb-4">{item.step}</div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-zinc-800/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center">
            <Sparkles className="h-8 w-8 text-emerald-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">
              Ready to simplify your SEO?
            </h2>
            <p className="text-zinc-400 mb-8">
              We&apos;re in early access. Analyze your first site for free—no credit card, 
              no 30-day trial countdown, no sales calls.
            </p>
            <Button size="lg" className="h-12 px-8 bg-emerald-600 hover:bg-emerald-500 text-white border-0 gap-2" asChild>
              <Link href="/onboarding">
                <Zap className="h-4 w-4" />
                Start analyzing
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-zinc-800/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-emerald-500/10 flex items-center justify-center">
                <span className="text-xs">🥬</span>
              </div>
              <span className="text-sm text-zinc-500">CabbageSEO</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-zinc-600">
              <Link href="#" className="hover:text-zinc-400 transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-zinc-400 transition-colors">Terms</Link>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-400 transition-colors">Twitter</a>
            </div>
            <p className="text-sm text-zinc-600">
              © {new Date().getFullYear()} CabbageSEO
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
