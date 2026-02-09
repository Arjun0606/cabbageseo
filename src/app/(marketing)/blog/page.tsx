"use client";

import Link from "next/link";
import { ArrowRight, FileText, Bell } from "lucide-react";
import { AnimateIn } from "@/components/motion/animate-in";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientOrbs } from "@/components/backgrounds/gradient-orbs";

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Hero */}
      <section className="pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <AnimateIn direction="up" delay={0} once>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              AI Visibility Blog
            </h1>
          </AnimateIn>
          <AnimateIn direction="up" delay={0.1} once>
            <p className="text-lg text-zinc-400 max-w-xl mx-auto">
              Guides, research, and strategies for getting recommended by ChatGPT,
              Perplexity &amp; Google AI.
            </p>
          </AnimateIn>
        </div>
      </section>

      {/* Coming Soon */}
      <section className="pb-24">
        <div className="max-w-3xl mx-auto px-6">
          <AnimateIn direction="up" delay={0.2} once>
            <GlassCard hover={false} padding="lg">
              <div className="text-center">
                <FileText className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">
                  Blog launching soon
                </h3>
                <p className="text-zinc-400 mb-6 max-w-md mx-auto">
                  We&apos;re working on in-depth guides about AI visibility, generative
                  engine optimization, and how to get your brand recommended by AI.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link
                    href="/teaser"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-colors"
                  >
                    Check your AI score free <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </GlassCard>
          </AnimateIn>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden py-16 bg-emerald-950/30 border-t border-emerald-900/30">
        <GradientOrbs variant="emerald" />
        <div className="relative z-10 max-w-xl mx-auto px-6 text-center">
          <AnimateIn direction="up" delay={0} once>
            <h2 className="text-2xl font-bold text-white mb-3">
              Stop reading. Start checking.
            </h2>
            <p className="text-zinc-400 mb-6">
              Check your AI visibility score in 10 seconds. No signup.
            </p>
            <Link
              href="/teaser"
              className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-colors"
            >
              Check your score free <ArrowRight className="w-5 h-5" />
            </Link>
          </AnimateIn>
        </div>
      </section>
    </div>
  );
}
