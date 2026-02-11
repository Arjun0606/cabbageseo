"use client";

/**
 * PRICING PAGE - CabbageSEO
 *
 * Simple, lean pricing page.
 * Monthly/yearly toggle with 20% savings on annual.
 * FAQ section at bottom.
 */

import { useState, useRef } from "react";
import Link from "next/link";
import {
  Check,
  ArrowRight,
  Zap,
  TrendingUp,
  Crown,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { AnimateIn } from "@/components/motion/animate-in";
import { Counter } from "@/components/motion/counter";
import { StaggerGroup, StaggerItem } from "@/components/motion/stagger-group";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientOrbs } from "@/components/backgrounds/gradient-orbs";

// ============================================
// TYPES
// ============================================

interface PricingTier {
  name: string;
  tagline: string;
  monthlyPrice: number;
  annualPrice: number;
  period: string;
  description: string;
  cta: string;
  href: string;
  popular?: boolean;
  icon: React.ReactNode;
  features: string[];
  highlight?: string;
  promise?: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

// ============================================
// DATA
// ============================================

const tiers: PricingTier[] = [
  {
    name: "Scout",
    tagline: "See your blind spots and start fixing them",
    monthlyPrice: 49,
    annualPrice: 39,
    period: "/mo",
    description: "Monitor + start fixing your AI visibility",
    cta: "Get Scout",
    href: "/signup?plan=scout",
    icon: <TrendingUp className="w-5 h-5 text-emerald-400" />,
    features: [
      "1 website",
      "10 queries tracked per scan",
      "Daily AI citation monitoring",
      "5 fix pages/month + 2 auto-generated per scan",
      "Site GEO Audit (top 10 pages)",
      "Schema markup generation",
      "5 gap analyses/month",
      "30-day AI sprint",
      "Weekly reports + email alerts",
    ],
    promise: "Daily monitoring catches every AI shift. Auto-generated fix pages close your gaps while you sleep.",
  },
  {
    name: "Command",
    tagline: "The complete toolkit to win AI recommendations",
    monthlyPrice: 149,
    annualPrice: 119,
    period: "/mo",
    description: "Full GEO intelligence + maximum visibility",
    cta: "Get Command",
    href: "/signup?plan=command",
    popular: true,
    icon: <Zap className="w-5 h-5 text-emerald-400" />,
    features: [
      "5 websites",
      "20 queries tracked per scan",
      "Hourly AI citation monitoring",
      "25 fix pages/month + 5 auto-generated per scan",
      "Full Site GEO Audit (100 pages)",
      "Entity optimization + schema markup",
      "Unlimited gap analysis + content ideas",
      "Weekly action playbooks",
      "CSV exports + 365-day history",
    ],
    highlight: "MOST POPULAR",
    promise: "Hourly monitoring + auto-generated fix pages mean gaps get closed before you even notice them.",
  },
  {
    name: "Dominate",
    tagline: "Scale GEO across all your brands",
    monthlyPrice: 349,
    annualPrice: 279,
    period: "/mo",
    description: "Own your category across every AI platform",
    cta: "Get Dominate",
    href: "/signup?plan=dominate",
    icon: <Crown className="w-5 h-5 text-amber-400" />,
    features: [
      "25 websites",
      "30 queries tracked per scan",
      "Hourly AI citation monitoring",
      "Unlimited fix pages + 10 auto-generated per scan",
      "Full Site GEO Audit (500 pages)",
      "Entity optimization + schema markup",
      "Unlimited action playbooks",
      "Monthly checkpoint reports + 365-day history",
    ],
    promise: "Every scan finds gaps and auto-generates fix pages. Unlimited everything. The AI never forgets you.",
  },
];

const faqs: FAQItem[] = [
  {
    question: "Is the data real?",
    answer:
      "Yes. Every data point comes from real API calls to ChatGPT, Perplexity, and Google AI Overviews. We query the actual AI platforms with real user prompts and record exactly what they cite and recommend. No synthetic data, no estimations \u2014 just what AI actually says when someone asks about your market.",
  },
  {
    question: "What\u2019s the 30-day AI sprint?",
    answer:
      "The 30-day AI sprint is a structured GEO program included with Scout and above. Each week you get specific, prioritized actions based on your current citation data: content to create, pages to optimize, entities to reference, and schema to implement. By day 30, most customers see measurable improvement in their AI citation rate. Think of it as a personal trainer for your GEO strategy.",
  },
  {
    question: "What are fix pages?",
    answer:
      "When CabbageSEO finds queries where AI doesn\u2019t recommend you, it generates targeted fix pages \u2014 comparison pages, explainers, and FAQs \u2014 designed to close those gaps. Unlike generic AI writing tools, these pages are driven by your actual citation data and gap analysis. Better yet, fix pages auto-generate after every scan: Scout creates 2 per scan, Command creates 5, and Dominate creates 10. You can also generate pages manually \u2014 Scout gets 5/month, Command 25, Dominate unlimited.",
  },
  {
    question: "What is a Site GEO Audit?",
    answer:
      "A Site GEO Audit crawls your pages and evaluates them for AI-readability: schema markup, entity clarity, content structure, and citation-worthiness. Scout audits your top 10 pages, Command audits up to 100, and Dominate covers up to 500. You get actionable recommendations for every page to improve how AI platforms understand and cite your content.",
  },
  {
    question: "How does AI citation monitoring work?",
    answer:
      "CabbageSEO queries ChatGPT, Perplexity, and Google AI Overviews with real user prompts about your market, then records exactly what they cite. Scout scans daily (10 queries), Command and Dominate scan hourly (20-30 queries). When your citation score drops, you get an instant email alert. After each scan, fix pages auto-generate for any new gaps found.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes. No contracts, no cancellation fees, no hoops. Cancel from your billing settings in two clicks. Your access continues until the end of your current billing period. If you\u2019re on an annual plan, you can cancel renewal and keep access for the remainder of your term.",
  },
  {
    question: "Do you offer refunds?",
    answer:
      "If you\u2019re unhappy after subscribing, contact us within 14 days of your first payment and we\u2019ll issue a full refund. After 14 days, you can cancel anytime and your access continues until the end of your billing period. You can also run a free scan before subscribing to see where you stand.",
  },
];

// ============================================
// FAQ ACCORDION ITEM
// ============================================

function FAQAccordionItem({ item }: { item: FAQItem }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-white/[0.06]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left group"
      >
        <h3 className="text-lg font-semibold text-white group-hover:text-emerald-400 transition-colors pr-4">
          {item.question}
        </h3>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
        >
          <ChevronDown className="w-5 h-5 text-zinc-500 shrink-0" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
            className="overflow-hidden"
          >
            <p className="text-zinc-400 leading-relaxed pb-5">
              {item.answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// PRICING CARD
// ============================================

function PricingCard({
  tier,
  annual,
}: {
  tier: PricingTier;
  annual: boolean;
}) {
  const price = tier.monthlyPrice === 0
    ? 0
    : annual
      ? tier.annualPrice
      : tier.monthlyPrice;

  const isPopular = tier.popular;

  const featuresRef = useRef(null);
  const featuresInView = useInView(featuresRef, { once: true, margin: "-60px" });

  return (
    <div className="relative flex flex-col">
      {/* Animated gradient border for popular tier */}
      {isPopular && (
        <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-b from-emerald-400/60 via-emerald-500/20 to-emerald-400/60 blur-[1px] animate-pulse" />
      )}
      <GlassCard
        className={`flex flex-col flex-1 !rounded-2xl ${
          isPopular
            ? "!bg-gradient-to-b from-emerald-500/15 via-white/[0.03] to-white/[0.03] !border-emerald-500/40 shadow-lg shadow-emerald-500/10 scale-[1.02] lg:scale-105"
            : ""
        }`}
        hover={!isPopular}
        glow={isPopular ? "none" : "emerald"}
        padding="lg"
      >
        {/* Popular badge */}
        {tier.highlight && (
          <div className="text-center -mt-2 mb-4">
            <span className="inline-flex items-center gap-1.5 bg-emerald-500 text-black text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
              <Sparkles className="w-3.5 h-3.5" />
              {tier.highlight}
            </span>
          </div>
        )}

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isPopular ? "bg-emerald-500/20" : "bg-white/[0.06]"
              }`}
            >
              {tier.icon}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{tier.name}</h2>
              <p className="text-sm text-zinc-500">{tier.tagline}</p>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-1 mb-1 mt-4">
            {price === 0 ? (
              <span className="text-4xl font-bold text-white">$0</span>
            ) : (
              <>
                <span className="text-4xl font-bold text-white">
                  $<Counter value={price} duration={0.8} />
                </span>
                <span className="text-zinc-500">{tier.period}</span>
              </>
            )}
          </div>
          {price === 0 ? (
            <p className="text-sm text-zinc-500">{tier.period}</p>
          ) : annual ? (
            <p className="text-sm text-emerald-400">
              Billed annually (${price * 12}/yr)
            </p>
          ) : (
            <p className="text-sm text-zinc-500">Billed monthly</p>
          )}

          {/* Description */}
          <p className="text-sm text-zinc-400 mt-4 leading-relaxed">
            {tier.description}
          </p>
        </div>

        {/* CTA */}
        <Link href={tier.href} className="block mb-6">
          <Button
            className={`w-full ${
              isPopular
                ? "bg-emerald-500 hover:bg-emerald-400 text-black font-semibold shadow-lg shadow-emerald-500/20"
                : tier.monthlyPrice === 0
                  ? "border-zinc-600 text-white hover:bg-zinc-800 hover:text-white"
                  : "bg-white/[0.06] hover:bg-white/[0.1] text-white border border-white/[0.06]"
            }`}
            variant={isPopular ? "default" : "outline"}
            size="lg"
          >
            {tier.cta}
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </Link>

        {/* Features */}
        <ul ref={featuresRef} className="space-y-3 flex-1">
          {tier.features.map((feature, i) => (
            <motion.li
              key={i}
              className="flex items-start gap-2.5"
              initial={{ opacity: 0, x: -10 }}
              animate={featuresInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
              transition={{
                duration: 0.35,
                delay: i * 0.06,
                ease: [0.25, 0.4, 0.25, 1],
              }}
            >
              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="text-sm text-zinc-300">{feature}</span>
            </motion.li>
          ))}
        </ul>

        {/* Promise */}
        {tier.promise && (
          <p className="mt-4 pt-4 border-t border-white/[0.06] text-sm text-emerald-400/80 italic">
            &rarr; {tier.promise}
          </p>
        )}
      </GlassCard>
    </div>
  );
}

// ============================================
// PAGE
// ============================================

export default function PricingPage() {
  const [annual, setAnnual] = useState(true);

  return (
    <div className="bg-zinc-950 min-h-screen">
      {/* Hero */}
      <section className="pt-20 pb-12 sm:pt-24 sm:pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <AnimateIn delay={0}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-8">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400 text-sm font-medium">
                Free scan available &middot; No credit card required
              </span>
            </div>
          </AnimateIn>

          <AnimateIn delay={0.1}>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Simple pricing.
              <br className="hidden sm:block" />
              <span className="text-emerald-400"> No surprises.</span>
            </h1>
          </AnimateIn>

          <AnimateIn delay={0.2}>
            <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-10">
              Every plan monitors real AI citations. Upgrade for more sites,
              faster monitoring, and full GEO intelligence.
            </p>
          </AnimateIn>

          {/* Monthly / Annual Toggle */}
          <AnimateIn delay={0.3}>
            <div className="inline-flex items-center p-1 bg-white/[0.04] rounded-full border border-white/[0.06]">
              <button
                onClick={() => setAnnual(false)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  !annual
                    ? "bg-white/[0.12] text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setAnnual(true)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                  annual
                    ? "bg-white/[0.12] text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                Annual
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-bold">
                  Save 20%
                </span>
              </button>
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20 sm:pb-28 px-6">
        <div className="max-w-7xl mx-auto">
          <StaggerGroup
            stagger={0.12}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-4 xl:gap-6"
          >
            {tiers.map((tier) => (
              <StaggerItem key={tier.name}>
                <PricingCard tier={tier} annual={annual} />
              </StaggerItem>
            ))}
          </StaggerGroup>

          {/* Trust line + guarantee */}
          <AnimateIn delay={0.2}>
            <div className="mt-10 text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 text-sm font-medium">
                  14-day money-back guarantee on all plans
                </span>
              </div>
              <p className="text-sm text-zinc-600">
                All plans include SSL encryption. Data stored on Supabase
                (US-based servers).
              </p>
            </div>
          </AnimateIn>

          {/* Your first week */}
          <AnimateIn delay={0.3}>
            <div className="mt-16 max-w-2xl mx-auto">
              <h3 className="text-lg font-semibold text-white text-center mb-6">
                Your first week
              </h3>
              <div className="space-y-3">
                {[
                  { day: "Day 1", action: "Full AI scan across ChatGPT, Perplexity & Google AI. See your score and every gap." },
                  { day: "Day 2", action: "Your 30-day sprint generates. Week 1 actions are ready to go." },
                  { day: "Day 3-6", action: "Fix pages auto-generate for your biggest gaps. Publish with one click." },
                  { day: "Day 7", action: "First progress check. See which actions moved your score." },
                ].map((item) => (
                  <div key={item.day} className="flex gap-4 items-start">
                    <span className="shrink-0 w-16 text-right text-emerald-400 text-sm font-bold pt-0.5">
                      {item.day}
                    </span>
                    <p className="text-zinc-400 text-sm">{item.action}</p>
                  </div>
                ))}
              </div>
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 sm:py-24 px-6 border-t border-white/[0.06]">
        <div className="max-w-3xl mx-auto">
          <AnimateIn>
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-white mb-4">
              Frequently asked questions
            </h2>
            <p className="text-center text-zinc-500 mb-12">
              Still have questions?{" "}
              <a
                href="mailto:arjun@cabbageseo.com"
                className="text-emerald-400 hover:text-emerald-300 underline underline-offset-4"
              >
                Email us
              </a>{" "}
              and we&apos;ll answer within 24 hours.
            </p>
          </AnimateIn>

          <AnimateIn delay={0.15}>
            <div className="divide-y divide-white/[0.06] border-t border-white/[0.06]">
              {faqs.map((faq, i) => (
                <FAQAccordionItem key={i} item={faq} />
              ))}
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-20 sm:py-24 px-6 border-t border-white/[0.06] bg-gradient-to-t from-zinc-950 via-zinc-950 to-zinc-900/30 overflow-hidden">
        <GradientOrbs variant="mixed" className="opacity-20" />
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <AnimateIn>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to see where you stand?
            </h2>
          </AnimateIn>
          <AnimateIn delay={0.1}>
            <p className="text-lg text-zinc-400 mb-8 leading-relaxed">
              Start with a free scan. Subscribe when you&apos;re ready.
            </p>
          </AnimateIn>
          <AnimateIn delay={0.2}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/">
                <Button
                  size="lg"
                  className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-8 shadow-lg shadow-emerald-500/20"
                >
                  Run a Free Scan
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/signup">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/[0.1] text-zinc-300 hover:text-white hover:bg-white/[0.06] hover:border-white/[0.15] px-8"
                >
                  Sign Up
                </Button>
              </Link>
            </div>
          </AnimateIn>
        </div>
      </section>
    </div>
  );
}
