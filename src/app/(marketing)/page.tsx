"use client";

/**
 * HOMEPAGE - AI REVENUE INTELLIGENCE
 * 
 * Every word answers: "Where is AI sending money instead of me?"
 * 
 * NO citations. NO GEO scores. NO monitoring language.
 * Only: Money lost. Competitors winning. Take it back.
 */

import Link from "next/link";
import { ArrowRight, DollarSign, Users, TrendingDown, Search, Zap, Lock, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="bg-black min-h-screen">
      {/* Hero - Lead with the fear */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-black to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-red-900/20 via-transparent to-transparent" />
        
        <div className="relative max-w-4xl mx-auto px-6 pt-32 pb-24">
          {/* Alert badge */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/30">
              <DollarSign className="w-4 h-4 text-red-400" />
              <span className="text-red-400 text-sm font-medium">
                AI is choosing your competitors right now
              </span>
            </div>
          </div>

          {/* Main headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-center leading-tight mb-6">
            <span className="text-white">See exactly how much money</span>
            <br />
            <span className="text-red-400">AI is sending to your competitors</span>
          </h1>

          <p className="text-xl text-zinc-400 text-center max-w-2xl mx-auto mb-8">
            ChatGPT, Perplexity, and Google AI recommend products to millions of buyers every day. 
            <strong className="text-white"> Are they recommending yours?</strong>
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link href="/signup">
              <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-8 py-6 text-lg">
                See Where Your Money Is Going
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <p className="text-sm text-zinc-500">Free check • No credit card</p>
          </div>

          {/* The money shot - Demo result */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-zinc-900/90 rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl">
              {/* Header */}
              <div className="bg-zinc-950 px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                </div>
                <span className="text-zinc-500 text-sm">yoursite.com</span>
              </div>
              
              {/* Content */}
              <div className="p-6">
                {/* Loss banner */}
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-8 h-8 text-red-400" />
                    <div>
                      <div className="text-3xl font-bold text-red-400">-$18,500<span className="text-lg">/mo</span></div>
                      <div className="text-sm text-zinc-400">Estimated revenue going to competitors</div>
                    </div>
                  </div>
                </div>

                {/* Competition table */}
                <div className="mb-6">
                  <div className="text-sm text-zinc-500 mb-3">Who AI recommends instead of you:</div>
                  <div className="space-y-2">
                    {[
                      { query: "best project management tools", winner: "Notion, ClickUp", value: "$8,200" },
                      { query: "best productivity apps 2025", winner: "Todoist, Asana", value: "$5,400" },
                      { query: "notion alternatives", winner: "Coda, Obsidian", value: "$4,900" },
                    ].map((row, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                        <div>
                          <div className="text-white text-sm">&ldquo;{row.query}&rdquo;</div>
                          <div className="text-zinc-500 text-xs">AI recommends: {row.winner}</div>
                        </div>
                        <div className="text-red-400 font-medium text-sm">-{row.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Market Share */}
                <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl">
                  <div>
                    <div className="text-zinc-500 text-sm">Your AI Market Share</div>
                    <div className="text-2xl font-bold text-white">8%</div>
                  </div>
                  <div className="text-right">
                    <div className="text-zinc-500 text-sm">Competitors</div>
                    <div className="text-2xl font-bold text-amber-400">92%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section className="py-24 px-6 border-t border-zinc-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-white mb-4">
            AI doesn&apos;t search. AI <span className="text-red-400">recommends.</span>
          </h2>
          <p className="text-lg text-zinc-400 text-center max-w-2xl mx-auto mb-16">
            When someone asks &ldquo;what&apos;s the best CRM?&rdquo; — AI picks winners. 
            If you&apos;re not on that list, you&apos;re invisible.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <TrendingDown className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Traffic Is Shifting</h3>
              <p className="text-zinc-400">
                30% of product searches now happen in AI. That number doubles every year.
              </p>
            </div>

            <div className="text-center p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-amber-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Buyers Trust AI</h3>
              <p className="text-zinc-400">
                When ChatGPT says &ldquo;the best tool is X&rdquo; — people buy X. Period.
              </p>
            </div>

            <div className="text-center p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">You&apos;re Flying Blind</h3>
              <p className="text-zinc-400">
                Google Analytics can&apos;t track AI. You have no idea who&apos;s winning.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section className="py-24 px-6 bg-gradient-to-b from-black to-zinc-950 border-t border-zinc-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-white mb-4">
            From &ldquo;I&apos;m invisible&rdquo; to &ldquo;I know how to win&rdquo;
          </h2>
          <p className="text-lg text-zinc-400 text-center max-w-2xl mx-auto mb-16">
            CabbageSEO shows you exactly where AI is sending money in your market — and how to take it.
          </p>

          <div className="space-y-8">
            <div className="flex gap-6 items-start p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
              <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
                <DollarSign className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">See Your Revenue Loss</h3>
                <p className="text-zinc-400">
                  Know exactly how much money AI is sending to your competitors. 
                  Not vanity metrics — real estimated revenue impact.
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                <BarChart2 className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Track Your AI Market Share</h3>
                <p className="text-zinc-400">
                  See your percentage of AI recommendations vs competitors. 
                  Watch it grow as you optimize.
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                <Zap className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Get One-Click Fixes</h3>
                <p className="text-zinc-400">
                  For every query you&apos;re losing, get an exact content plan: 
                  page titles, headings, entities, and comparison blocks.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Teaser */}
      <section className="py-24 px-6 border-t border-zinc-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Start seeing where money goes
          </h2>
          <p className="text-lg text-zinc-400 mb-12">
            Starts at $29/mo. Cancel anytime.
          </p>

          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800">
              <div className="text-2xl font-bold text-white mb-1">Starter</div>
              <div className="text-4xl font-bold text-white mb-1">$29<span className="text-lg text-zinc-500">/mo</span></div>
              <div className="text-zinc-500 mb-6">&ldquo;Where am I losing?&rdquo;</div>
              <ul className="text-left space-y-2 text-zinc-300 mb-6">
                <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> 3 sites</li>
                <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Daily AI checks</li>
                <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Revenue loss tracking</li>
                <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Competitor analysis</li>
              </ul>
              <Link href="/signup">
                <Button className="w-full" variant="outline">Get Started</Button>
              </Link>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-zinc-900 border border-emerald-500/30">
              <div className="text-2xl font-bold text-white mb-1">Pro</div>
              <div className="text-4xl font-bold text-white mb-1">$79<span className="text-lg text-zinc-500">/mo</span></div>
              <div className="text-zinc-500 mb-6">&ldquo;How do I win?&rdquo;</div>
              <ul className="text-left space-y-2 text-zinc-300 mb-6">
                <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> 10 sites</li>
                <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Hourly AI checks</li>
                <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> One-click content fixes</li>
                <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Competitor takeover alerts</li>
              </ul>
              <Link href="/signup">
                <Button className="w-full bg-emerald-500 hover:bg-emerald-400 text-black">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 bg-gradient-to-t from-zinc-950 to-black border-t border-zinc-900">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Don&apos;t let AI make you invisible
          </h2>
          <p className="text-lg text-zinc-400 mb-8">
            Every day you wait, competitors are getting recommended instead of you.
          </p>
          <Link href="/signup">
            <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-8">
              See Where Your Money Is Going
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-zinc-900">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🥬</span>
            <span className="font-semibold text-white">CabbageSEO</span>
          </div>
          <div className="text-sm text-zinc-500">
            AI Revenue Intelligence
          </div>
        </div>
      </footer>
    </div>
  );
}
