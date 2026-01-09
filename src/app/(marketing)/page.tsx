/**
 * Landing Page - AI Search War Room
 * 
 * Key insight: Fear + Action = Conversion
 * Lead with the problem (you're losing to competitors)
 * Show the solution (see why, know how to win)
 */

import Link from "next/link";
import { 
  Search, 
  ArrowRight,
  CheckCircle2,
  Users,
  Zap,
  Lightbulb,
  Target,
  FileText,
  XCircle,
  Trophy,
  Swords,
  TrendingDown,
  Clock,
  Shield
} from "lucide-react";
import { TRIAL_DAYS } from "@/lib/billing/citation-plans";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img 
              src="/apple-touch-icon.png" 
              alt="CabbageSEO" 
              className="w-9 h-9 rounded-xl"
            />
            <span className="font-bold text-white text-lg">CabbageSEO</span>
          </Link>
          
          <nav className="flex items-center gap-6">
            <Link href="/pricing" className="text-zinc-400 hover:text-white transition-colors">
              Pricing
            </Link>
            <Link href="/login" className="text-zinc-400 hover:text-white transition-colors">
              Login
            </Link>
            <Link
              href="/signup"
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-medium px-4 py-2 rounded-lg transition-colors"
            >
              See Who&apos;s Winning
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero - Lead with FEAR */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-red-950/10 via-transparent to-transparent" />
        
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-full px-4 py-1.5 mb-8">
            <TrendingDown className="w-4 h-4 text-red-400" />
            <span className="text-red-400 text-sm font-medium">
              Your competitors are being recommended. Are you?
            </span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">
            AI is recommending your competitors
            <span className="block text-red-400 mt-2">instead of you</span>
          </h1>
          
          <p className="mt-6 text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto">
            When people ask ChatGPT, Perplexity, or Google AI for recommendations in your industry, 
            <span className="text-white"> who do they mention?</span>
          </p>
          
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-8 py-4 rounded-xl transition-colors"
            >
              <Search className="w-5 h-5" />
              See Who&apos;s Winning Your Industry
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
          
          <p className="mt-4 text-sm text-zinc-500">
            Free check • No credit card • 30 seconds
          </p>
        </div>
      </section>

      {/* The Loss Demo */}
      <section className="py-12 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="ml-2 text-sm text-zinc-500">AI Search Battle Check</span>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Loss 1 */}
              <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-5 h-5 text-red-400" />
                  <span className="font-medium text-white">ChatGPT</span>
                  <span className="text-red-400 text-sm">Not citing you</span>
                </div>
                <p className="text-zinc-400 text-sm">
                  Query: &quot;Best project management software&quot;
                </p>
                <p className="text-zinc-500 text-sm mt-1">
                  Winner: Asana, Monday.com, Notion
                </p>
              </div>
              
              {/* Loss 2 */}
              <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-5 h-5 text-red-400" />
                  <span className="font-medium text-white">Perplexity</span>
                  <span className="text-red-400 text-sm">Not citing you</span>
                </div>
                <p className="text-zinc-400 text-sm">
                  Query: &quot;Which tools do startups use for task management?&quot;
                </p>
                <p className="text-zinc-500 text-sm mt-1">
                  Winner: Trello, ClickUp, Linear
                </p>
              </div>
              
              {/* Why Not You */}
              <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-5 h-5 text-amber-400" />
                  <span className="font-medium text-amber-400">Why Not You?</span>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2 text-zinc-300">
                    <span className="text-amber-400">•</span>
                    Competitors have comparison pages you don&apos;t
                  </li>
                  <li className="flex items-start gap-2 text-zinc-300">
                    <span className="text-amber-400">•</span>
                    Missing FAQ schema for common questions
                  </li>
                  <li className="flex items-start gap-2 text-zinc-500">
                    <span className="text-zinc-600">🔒</span>
                    3 more reasons (unlock with Pro)
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          <p className="text-center text-zinc-500 mt-4 text-sm">
            This is what your report could look like
          </p>
        </div>
      </section>

      {/* The Transformation */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Stop guessing. <span className="text-emerald-400">Start winning.</span>
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8 mt-12">
            {/* Before */}
            <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Without CabbageSEO</h3>
              <ul className="space-y-3 text-left">
                <li className="flex items-start gap-2 text-zinc-400">
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  &quot;I don&apos;t know if AI mentions us&quot;
                </li>
                <li className="flex items-start gap-2 text-zinc-400">
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  &quot;Competitors might be winning and I have no idea&quot;
                </li>
                <li className="flex items-start gap-2 text-zinc-400">
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  &quot;I&apos;m optimizing blindly for traditional SEO&quot;
                </li>
              </ul>
            </div>
            
            {/* After */}
            <div className="bg-gradient-to-br from-emerald-500/10 to-zinc-900 rounded-2xl p-8 border border-emerald-500/30">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                <Trophy className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">With CabbageSEO</h3>
              <ul className="space-y-3 text-left">
                <li className="flex items-start gap-2 text-zinc-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  &quot;I know exactly which AI platforms cite me&quot;
                </li>
                <li className="flex items-start gap-2 text-zinc-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  &quot;I see why competitors win and I don&apos;t&quot;
                </li>
                <li className="flex items-start gap-2 text-zinc-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  &quot;I have a weekly to-do list to beat them&quot;
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 bg-zinc-900/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white">
              How it works
            </h2>
            <p className="mt-4 text-zinc-400">
              From &quot;I have no idea&quot; to &quot;I know exactly what to do&quot; in 60 seconds
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center mx-auto mb-4 border border-zinc-700">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Enter your website</h3>
              <p className="text-zinc-400 text-sm">
                Pick your industry category for smarter AI queries
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center mx-auto mb-4 border border-zinc-700">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">See your losses</h3>
              <p className="text-zinc-400 text-sm">
                Discover which AI platforms recommend competitors over you
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                <span className="text-2xl font-bold text-emerald-400">3</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Get the fix</h3>
              <p className="text-zinc-400 text-sm">
                Receive specific action items to win those recommendations
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Intelligence Features */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 mb-6">
              <Zap className="w-4 h-4 text-violet-400" />
              <span className="text-violet-400 text-sm font-medium">
                Your AI Search War Room
              </span>
            </div>
            <h2 className="text-3xl font-bold text-white">
              Know what to do, not just what happened
            </h2>
            <p className="mt-4 text-zinc-400 max-w-xl mx-auto">
              We don&apos;t just show you data. We tell you exactly how to win.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800 hover:border-violet-500/30 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-violet-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                &quot;Why Not Me?&quot; Analysis
              </h3>
              <p className="text-zinc-400 mb-4">
                For every query where competitors win, see exactly why—missing entities, authority gaps, content holes.
              </p>
              <p className="text-sm text-violet-400 font-medium">
                → Stop guessing, start fixing
              </p>
            </div>
            
            <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800 hover:border-emerald-500/30 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-4">
                <Lightbulb className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                What To Publish Next
              </h3>
              <p className="text-zinc-400 mb-4">
                AI-powered content recommendations based on what&apos;s winning citations in your industry.
              </p>
              <p className="text-sm text-emerald-400 font-medium">
                → Create content that AI will cite
              </p>
            </div>
            
            <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800 hover:border-amber-500/30 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Weekly Action Playbook
              </h3>
              <p className="text-zinc-400 mb-4">
                Every Monday, get a prioritized to-do list: what you lost, who won, and exactly how to fight back.
              </p>
              <p className="text-sm text-amber-400 font-medium">
                → Your AI Search To-Do List
              </p>
            </div>
            
            <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800 hover:border-blue-500/30 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Competitor Deep Dive
              </h3>
              <p className="text-zinc-400 mb-4">
                Full breakdown of why each competitor wins—their strategy, their weaknesses, your opportunities.
              </p>
              <p className="text-sm text-blue-400 font-medium">
                → Turn their wins into your roadmap
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Platforms */}
      <section className="py-16 px-6 border-y border-zinc-800/50">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-zinc-500 mb-8">We monitor the AI platforms that matter</p>
          <div className="grid grid-cols-3 gap-8">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-3">
                <Search className="w-8 h-8 text-emerald-400" />
              </div>
              <span className="text-white font-medium">Perplexity</span>
              <span className="text-xs text-zinc-500">Real-time web search</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-3">
                <Zap className="w-8 h-8 text-blue-400" />
              </div>
              <span className="text-white font-medium">Google AI</span>
              <span className="text-xs text-zinc-500">AI Overview & Gemini</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center mb-3">
                <Swords className="w-8 h-8 text-violet-400" />
              </div>
              <span className="text-white font-medium">ChatGPT</span>
              <span className="text-xs text-zinc-500">Training data citations</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Simple pricing, serious results
          </h2>
          <p className="text-zinc-400 mb-12">
            Start free. Upgrade when you&apos;re ready to fight back.
          </p>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* Free */}
            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
              <h3 className="text-lg font-semibold text-white mb-2">Free Trial</h3>
              <div className="text-3xl font-bold text-white mb-4">$0</div>
              <p className="text-zinc-500 text-sm mb-6">{TRIAL_DAYS} days to explore</p>
              <ul className="space-y-2 text-sm text-left mb-6">
                <li className="flex items-center gap-2 text-zinc-400">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  See if AI cites you
                </li>
                <li className="flex items-center gap-2 text-zinc-400">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Basic loss detection
                </li>
                <li className="flex items-center gap-2 text-zinc-500">
                  <XCircle className="w-4 h-4 text-zinc-600" />
                  No &quot;Why Not Me?&quot; analysis
                </li>
              </ul>
              <Link
                href="/signup"
                className="block w-full py-3 rounded-lg bg-zinc-800 text-white font-medium text-center hover:bg-zinc-700 transition-colors"
              >
                Start Free
              </Link>
            </div>
            
            {/* Starter */}
            <div className="bg-gradient-to-b from-emerald-500/10 to-zinc-900 rounded-2xl p-6 border border-emerald-500/30 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-black text-xs font-bold px-3 py-1 rounded-full">
                POPULAR
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Starter</h3>
              <div className="text-3xl font-bold text-white mb-4">$29<span className="text-lg text-zinc-500">/mo</span></div>
              <p className="text-emerald-400 text-sm mb-6">Know why competitors win</p>
              <ul className="space-y-2 text-sm text-left mb-6">
                <li className="flex items-center gap-2 text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  10 queries per check
                </li>
                <li className="flex items-center gap-2 text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  &quot;Why Not Me?&quot; analysis
                </li>
                <li className="flex items-center gap-2 text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Daily auto-monitoring
                </li>
                <li className="flex items-center gap-2 text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Email alerts
                </li>
              </ul>
              <Link
                href="/signup?plan=starter"
                className="block w-full py-3 rounded-lg bg-emerald-500 text-black font-medium text-center hover:bg-emerald-400 transition-colors"
              >
                Start Winning →
              </Link>
            </div>
            
            {/* Pro */}
            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
              <h3 className="text-lg font-semibold text-white mb-2">Pro</h3>
              <div className="text-3xl font-bold text-white mb-4">$79<span className="text-lg text-zinc-500">/mo</span></div>
              <p className="text-violet-400 text-sm mb-6">Full war room access</p>
              <ul className="space-y-2 text-sm text-left mb-6">
                <li className="flex items-center gap-2 text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  20 queries per check
                </li>
                <li className="flex items-center gap-2 text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Unlimited custom queries
                </li>
                <li className="flex items-center gap-2 text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Weekly Action Playbook
                </li>
                <li className="flex items-center gap-2 text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Competitor Deep Dive
                </li>
              </ul>
              <Link
                href="/signup?plan=pro"
                className="block w-full py-3 rounded-lg bg-zinc-800 text-white font-medium text-center hover:bg-zinc-700 transition-colors"
              >
                Go Pro
              </Link>
            </div>
          </div>
          
          <p className="mt-8 text-zinc-500 text-sm">
            All plans include 3 AI platforms • Real-time monitoring • No contracts
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6 bg-gradient-to-t from-emerald-950/20 to-transparent">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Your competitors aren&apos;t waiting.
            <span className="block text-emerald-400">Neither should you.</span>
          </h2>
          <p className="text-zinc-400 mb-8">
            Every day you wait, AI is recommending someone else.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-8 py-4 rounded-xl transition-colors"
          >
            <Swords className="w-5 h-5" />
            See Who&apos;s Winning Your Industry
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-zinc-800/50">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img 
                src="/apple-touch-icon.png" 
                alt="CabbageSEO" 
                className="w-8 h-8 rounded-lg"
              />
              <div>
                <span className="font-semibold text-white">CabbageSEO</span>
                <span className="text-zinc-500 text-sm block">AI Search War Room</span>
              </div>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-zinc-500">
              <Link href="/pricing" className="hover:text-white transition-colors">
                Pricing
              </Link>
              <a href="mailto:arjun@cabbageseo.com" className="hover:text-white transition-colors">
                Contact
              </a>
              <a href="https://x.com/Arjun06061" target="_blank" rel="noopener" className="hover:text-white transition-colors">
                Twitter
              </a>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-zinc-800/50 text-center text-sm text-zinc-600">
            © {new Date().getFullYear()} CabbageSEO. Built for founders who refuse to lose.
          </div>
        </div>
      </footer>
    </main>
  );
}
