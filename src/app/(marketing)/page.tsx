/**
 * Landing Page
 * 
 * Positioning: AI Brand Intelligence
 * Contact: arjun@cabbageseo.com, X: @Arjun06061
 */

import Link from "next/link";
import { 
  Search, 
  Bell, 
  BarChart3, 
  Users, 
  ArrowRight,
  CheckCircle2,
  Globe,
  TrendingUp,
  Shield,
  Zap
} from "lucide-react";
import { TRIAL_DAYS } from "@/lib/billing/citation-plans";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-zinc-950">
      {/* Hero */}
      <section className="relative pt-24 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/20 via-transparent to-transparent" />
        
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 mb-8">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-emerald-400 text-sm font-medium">
              AI Brand Intelligence
            </span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">
            See when AI recommends
            <span className="block text-emerald-400">you or your competitors</span>
          </h1>
          
          <p className="mt-6 text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto">
            Track when ChatGPT, Perplexity, and Google AI mention your company.
            Know instantly if they&apos;re sending traffic to you—or your competition.
          </p>
          
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-8 py-4 rounded-xl transition-colors"
            >
              Start {TRIAL_DAYS}-Day Free Trial
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/pricing"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-medium px-8 py-4 rounded-xl transition-colors"
            >
              View Pricing
            </Link>
          </div>
          
          <p className="mt-4 text-sm text-zinc-500">
            No credit card required • Setup in 30 seconds
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-6 border-y border-zinc-800/50">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-white">3</div>
              <div className="text-sm text-zinc-500">AI Platforms</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-emerald-400">Real-time</div>
              <div className="text-sm text-zinc-500">Alerts</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">Auto</div>
              <div className="text-sm text-zinc-500">Monitoring</div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem / Solution */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-white mb-6">
                AI is the new search.
                <span className="block text-zinc-500">Do you know what it says about you?</span>
              </h2>
              <div className="space-y-4">
                <p className="text-zinc-400">
                  Millions ask ChatGPT and Perplexity for recommendations instead of Googling.
                </p>
                <p className="text-zinc-400">
                  When someone asks <em>&quot;What&apos;s the best [your category]?&quot;</em>—is 
                  AI recommending you, or your competitors?
                </p>
                <p className="text-emerald-400 font-medium">
                  CabbageSEO monitors this automatically.
                </p>
              </div>
            </div>
            
            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <div className="font-mono text-sm space-y-2">
                <p className="text-zinc-500">$ Auto-checking AI platforms...</p>
                <p className="text-emerald-400">✓ Perplexity: yoursite.com cited</p>
                <p className="text-emerald-400">✓ Google AI: yoursite.com mentioned</p>
                <p className="text-yellow-400">○ ChatGPT: competitor.com cited</p>
                <p className="text-zinc-500 mt-4">→ Email alert sent</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-zinc-900/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white">
              Everything you need
            </h2>
            <p className="mt-4 text-zinc-400">
              Set it up once, let it run on autopilot.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Search,
                title: "Citation Tracking",
                description: "We check Perplexity, Google AI, and ChatGPT for your brand—automatically.",
                color: "emerald",
              },
              {
                icon: Users,
                title: "Competitor Intel",
                description: "See when AI recommends your competitors. Know who's winning.",
                color: "blue",
              },
              {
                icon: Bell,
                title: "Instant Alerts",
                description: "Get emailed the moment AI mentions you. Never miss a citation.",
                color: "violet",
              },
              {
                icon: BarChart3,
                title: "GEO Score",
                description: "A 0-100 score showing how AI-friendly your content is.",
                color: "amber",
              },
              {
                icon: TrendingUp,
                title: "Weekly Reports",
                description: "Automated digest of your AI visibility vs competitors.",
                color: "rose",
              },
              {
                icon: Globe,
                title: "Multi-Site",
                description: "Track multiple domains from one dashboard.",
                color: "cyan",
              },
            ].map((feature, idx) => (
              <div 
                key={idx}
                className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 hover:border-zinc-700 transition-colors"
              >
                <feature.icon className={`w-10 h-10 mb-4 ${
                  feature.color === "emerald" ? "text-emerald-400" :
                  feature.color === "blue" ? "text-blue-400" :
                  feature.color === "violet" ? "text-violet-400" :
                  feature.color === "amber" ? "text-amber-400" :
                  feature.color === "rose" ? "text-rose-400" :
                  "text-cyan-400"
                }`} />
                <h3 className="text-lg font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-zinc-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white">How it works</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Add your domain",
                description: "Enter your website URL. Takes 30 seconds.",
              },
              {
                step: "2",
                title: "We monitor 24/7",
                description: "Auto-checks run daily (or hourly on Pro). No action needed.",
              },
              {
                step: "3",
                title: "Get notified",
                description: "Email alerts when AI mentions you or competitors.",
              },
            ].map((item, idx) => (
              <div key={idx} className="text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-emerald-400 font-bold text-lg">{item.step}</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-zinc-400">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="py-16 px-6 border-t border-zinc-800">
        <div className="max-w-3xl mx-auto">
          <div className="bg-zinc-900/50 rounded-2xl p-8 border border-zinc-800">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-6 h-6 text-emerald-400" />
              <h3 className="text-lg font-semibold text-white">Honest about how we work</h3>
            </div>
            
            <div className="space-y-4 text-sm text-zinc-400">
              <p>
                <strong className="text-white">Perplexity:</strong> Official API with citations array.
              </p>
              <p>
                <strong className="text-white">Google AI:</strong> Gemini with search grounding.
              </p>
              <p>
                <strong className="text-white">ChatGPT:</strong> Knowledge detection via GPT-4.
              </p>
              <p className="pt-2 text-zinc-500">
                We detect mentions through response analysis. Not official platform data.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white">Built for brands</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { title: "SaaS Companies", desc: "Know if AI recommends your tools." },
              { title: "E-commerce", desc: "See if AI suggests your products." },
              { title: "Service Businesses", desc: "Track if AI refers clients to you." },
              { title: "Agencies", desc: "Monitor AI visibility for clients." },
            ].map((item, idx) => (
              <div 
                key={idx}
                className="flex items-start gap-4 bg-zinc-900/50 rounded-xl p-6 border border-zinc-800"
              >
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-white">{item.title}</h3>
                  <p className="text-sm text-zinc-400 mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gradient-to-b from-zinc-900/50 to-zinc-950">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Find out what AI says about you
          </h2>
          <p className="text-lg text-zinc-400 mb-8">
            {TRIAL_DAYS}-day free trial. No credit card.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-8 py-4 rounded-xl transition-colors"
          >
            Start Free Trial
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-zinc-800">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                <span className="text-white font-bold text-xl">🥬</span>
              </div>
              <div>
                <span className="font-bold text-white text-lg">CabbageSEO</span>
                <p className="text-xs text-zinc-500">AI Brand Intelligence</p>
              </div>
            </div>
            
            {/* Links */}
            <div className="flex items-center gap-6 text-sm">
              <Link href="/pricing" className="text-zinc-400 hover:text-white transition-colors">
                Pricing
              </Link>
              <Link href="/login" className="text-zinc-400 hover:text-white transition-colors">
                Login
              </Link>
              <a href="mailto:arjun@cabbageseo.com" className="text-zinc-400 hover:text-white transition-colors">
                Contact
              </a>
            </div>
            
            {/* Social */}
            <div className="flex items-center gap-4">
              <a 
                href="https://x.com/Arjun06061" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <span className="text-zinc-600 text-sm">
                Questions? <a href="https://x.com/Arjun06061" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300">DM me on X</a>
              </span>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-zinc-800 text-center">
            <p className="text-sm text-zinc-600">
              © {new Date().getFullYear()} CabbageSEO. Built by{" "}
              <a href="https://x.com/Arjun06061" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-white">
                @Arjun06061
              </a>
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
