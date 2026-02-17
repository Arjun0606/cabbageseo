"use client";

/**
 * PRICING PAGE - CabbageSEO
 *
 * Premium confidence-based pricing. No discounts, no gimmicks.
 * The product sells itself.
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
  planKey: "scout" | "command" | "dominate";
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
    planKey: "scout",
    tagline: "See your blind spots and start fixing them",
    monthlyPrice: 49,
    annualPrice: 39,
    period: "/mo",
    description: "Monitor + start fixing your AI visibility",
    cta: "Get Scout",
    href: "/signup?plan=scout",
    icon: <TrendingUp className="w-5 h-5 text-emerald-400" />,
    features: [
      "10 queries tracked (5 custom)",
      "Daily AI scans across ChatGPT, Perplexity & Google AI",
      "5 fix pages/month + 2 auto-generated per scan",
      "5 gap analyses/month",
      "3 content ideas/month",
      "Site GEO Audit (10 pages, 2/month)",
      "Schema markup generation",
      "30-day score history",
      "Weekly reports + email alerts",
      "OpenClaw skill (free commands)",
    ],
    promise: "Every day: scan runs, gaps found, fix pages generated. You wake up to a dashboard that's already working.",
  },
  {
    name: "Command",
    planKey: "command",
    tagline: "Full GEO intelligence + developer API",
    monthlyPrice: 149,
    annualPrice: 119,
    period: "/mo",
    description: "Deep intelligence, API access, and high-volume content",
    cta: "Get Command",
    href: "/signup?plan=command",
    popular: true,
    icon: <Zap className="w-5 h-5 text-emerald-400" />,
    features: [
      "25 queries tracked (15 custom)",
      "Daily AI scans across ChatGPT, Perplexity & Google AI",
      "25 fix pages/month + 5 auto-generated per scan",
      "15 gap analyses/month",
      "10 content ideas/month",
      "4 action plans/month",
      "Site GEO Audit (100 pages, 4/month)",
      "REST API keys (200 calls/hr)",
      "Webhooks (scan_complete, score_drop)",
      "OpenClaw pro commands (deep scan, gaps, history)",
      "CSV exports + 365-day history",
      "Weekly reports + email alerts",
    ],
    highlight: "MOST POPULAR",
    promise: "Everything runs automatically. Plus full API access — integrate AI visibility into your CI/CD, dashboards, or internal tools.",
  },
  {
    name: "Dominate",
    planKey: "dominate",
    tagline: "Maximum AI visibility + highest API limits",
    monthlyPrice: 349,
    annualPrice: 279,
    period: "/mo",
    description: "Highest limits, fastest scans, full API, nothing held back",
    cta: "Get Dominate",
    href: "/signup?plan=dominate",
    icon: <Crown className="w-5 h-5 text-amber-400" />,
    features: [
      "50 queries tracked (30 custom)",
      "2x daily AI scans across ChatGPT, Perplexity & Google AI",
      "50 fix pages/month + 10 auto-generated per scan",
      "30 gap analyses/month",
      "20 content ideas/month",
      "8 action plans/month",
      "Site GEO Audit (500 pages, 4/month)",
      "REST API keys (500 calls/hr) + bulk scan",
      "Webhooks (all events)",
      "OpenClaw pro commands (deep scan, gaps, history)",
      "CSV exports + 365-day history",
      "Weekly reports + email alerts",
    ],
    promise: "Twice daily scans, 10 fix pages auto-generated, 500 API calls/hr, bulk scanning. The system never sleeps.",
  },
];

const faqs: FAQItem[] = [
  {
    question: "Is the data real?",
    answer:
      "Yes. Every data point comes from real API calls to ChatGPT, Perplexity, and Google AI Overviews. We query the actual AI platforms with real user prompts and record exactly what they cite and recommend. No synthetic data, no estimations \u2014 just what AI actually says when someone asks about your market.",
  },
  {
    question: "What are fix pages?",
    answer:
      "When CabbageSEO finds queries where AI doesn\u2019t recommend you, it generates targeted fix pages \u2014 comparison pages, explainers, and FAQs \u2014 designed to close those gaps. Unlike generic AI writing tools, these pages are driven by your actual citation data and gap analysis. Fix pages auto-generate after every scan: Scout creates 2 per scan, Command creates 5, and Dominate creates 10. You can also generate pages manually \u2014 Scout gets 5/month, Command 25, Dominate 50.",
  },
  {
    question: "What is a Site GEO Audit?",
    answer:
      "A Site GEO Audit crawls your pages and evaluates them for AI-readability: schema markup, entity clarity, content structure, and citation-worthiness. Scout audits your top 10 pages (2/month), Command audits up to 100 pages (4/month), and Dominate covers up to 500 pages (4/month). You get actionable recommendations for every page to improve how AI platforms understand and cite your content.",
  },
  {
    question: "How does AI citation monitoring work?",
    answer:
      "CabbageSEO queries ChatGPT, Perplexity, and Google AI Overviews with real user prompts about your market, then records exactly what they cite. Scout scans daily (10 queries), Command scans daily (25 queries), and Dominate scans twice daily (50 queries). When your citation score drops, you get an instant email alert. After each scan, fix pages auto-generate for any new gaps found.",
  },
  {
    question: "Why can\u2019t I just fix my visibility once and cancel?",
    answer:
      "AI models retrain regularly, new content gets published constantly, and the queries people ask AI evolve every week. A page that gets you cited today might not work next month. CabbageSEO scans continuously, catches every shift the moment it happens, and auto-generates new fix pages for any new gaps. Without ongoing monitoring, your visibility could drop and you\u2019d have no idea until customers stop finding you.",
  },
  {
    question: "What are action plans?",
    answer:
      "Action plans are AI-generated playbooks based on your scan data. They prioritize exactly what to do next to improve your AI visibility \u2014 which pages to publish, which trust sources to claim, which queries to target. Command gets 4/month, Dominate gets 8/month. Each plan is personalized to your specific gaps and industry.",
  },
  {
    question: "What are API keys and who needs them?",
    answer:
      "API keys let you integrate CabbageSEO programmatically \u2014 run scans from CI/CD pipelines, pull scores into monitoring dashboards, or build custom integrations. Command gets 200 API calls/hour, Dominate gets 500/hour with bulk scanning. API keys also unlock pro commands in the OpenClaw skill (deep scan, gap analysis, score history). If you just want the dashboard, you don\u2019t need API keys \u2014 they\u2019re for developers and teams with technical workflows.",
  },
  {
    question: "What is the OpenClaw skill?",
    answer:
      "OpenClaw is an AI agent platform with 145K+ GitHub stars. Our free skill lets anyone run AI visibility scans right from their terminal \u2014 scan domains, compare competitors head-to-head, view the leaderboard, and generate embeddable badges. No API key needed for basic commands. Paid users can set their API key to unlock pro commands like deep scans with fix recommendations, gap analysis, and score history. Install with: openclaw skills install cabbageseo-ai-visibility",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes. No contracts, no cancellation fees, no hoops. Cancel from your billing settings in two clicks. Your access continues until the end of your current billing period. If you\u2019re on an annual plan, you can cancel renewal and keep access for the remainder of your term.",
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
  const displayPrice = annual ? tier.annualPrice : tier.monthlyPrice;
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
          <div className="flex items-baseline gap-2 mb-1 mt-4">
            <span className="text-4xl font-bold text-white">
              $<Counter value={displayPrice} duration={0.8} />
            </span>
            <span className="text-zinc-500">{tier.period}</span>
          </div>
          {annual ? (
            <p className="text-sm text-emerald-400">
              Billed annually (${displayPrice * 12}/yr)
            </p>
          ) : (
            <p className="text-sm text-zinc-500">
              Billed monthly
            </p>
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
        <div className="max-w-7xl mx-auto text-center">
          <AnimateIn delay={0}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/30 mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
              <span className="text-red-400 text-sm font-medium">
                AI is replacing Google. Your competitors are already optimizing.
              </span>
            </div>
          </AnimateIn>

          <AnimateIn delay={0.1}>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Don&apos;t wait until you&apos;re
              <br className="hidden sm:block" />
              <span className="text-emerald-400"> invisible.</span>
            </h1>
          </AnimateIn>

          <AnimateIn delay={0.2}>
            <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-4">
              AI answers change every week. Every plan scans daily, finds gaps, and auto-generates
              fix pages so you never fall behind. The longer you wait, the further ahead competitors get.
            </p>
            <p className="text-sm text-amber-400/80 font-medium mb-10 max-w-lg mx-auto">
              Brands that start monitoring now are 3x more likely to be cited within 30 days.
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
            <div className="mt-10 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.08]">
                <Check className="w-4 h-4 text-zinc-400" />
                <span className="text-zinc-400 text-sm font-medium">
                  Cancel anytime, no contracts
                </span>
              </div>
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
                  { day: "Day 1", action: "Full AI scan across ChatGPT, Perplexity & Google AI. See your score, every gap, and trust source status." },
                  { day: "Day 2", action: "Fix pages auto-generate for your biggest gaps. Gap analysis explains exactly why you're not cited." },
                  { day: "Day 3-6", action: "Publish fix pages with one click. Run a Site GEO Audit to optimize existing pages." },
                  { day: "Day 7", action: "Weekly report arrives. See which gaps closed and what to tackle next." },
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

          {/* Every month after */}
          <AnimateIn delay={0.4}>
            <div className="mt-12 max-w-3xl mx-auto">
              <h3 className="text-lg font-semibold text-white text-center mb-2">
                Every month after that
              </h3>
              <p className="text-zinc-500 text-sm text-center mb-6">
                AI models retrain, competitors publish, and recommendations shift. Here&apos;s what runs automatically:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  {
                    tier: "Scout",
                    frequency: "Daily scans",
                    auto: "2 fix pages per scan",
                    manual: "5 pages/mo total",
                    intel: "5 gap analyses/mo",
                    api: "OpenClaw free commands",
                    color: "border-emerald-500/20",
                  },
                  {
                    tier: "Command",
                    frequency: "Daily scans",
                    auto: "5 fix pages per scan",
                    manual: "25 pages/mo total",
                    intel: "15 gap analyses + 4 action plans/mo",
                    api: "API (200/hr) + webhooks + pro commands",
                    color: "border-emerald-500/40",
                  },
                  {
                    tier: "Dominate",
                    frequency: "2x daily scans",
                    auto: "10 fix pages per scan",
                    manual: "50 pages/mo total",
                    intel: "30 gap analyses + 8 action plans/mo",
                    api: "API (500/hr) + bulk scan + webhooks",
                    color: "border-amber-500/30",
                  },
                ].map((t) => (
                  <div key={t.tier} className={`bg-zinc-900/80 border ${t.color} rounded-xl p-4 text-center`}>
                    <p className="text-white font-semibold text-sm mb-2">{t.tier}</p>
                    <div className="space-y-1.5 text-xs text-zinc-400">
                      <p>{t.frequency}</p>
                      <p>{t.auto}</p>
                      <p>{t.manual}</p>
                      <p>{t.intel}</p>
                      <p>{t.api}</p>
                      <p>Alerts on any drop</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-zinc-600 text-xs text-center mt-4">
                All of this runs automatically. You get emailed when something needs your attention.
              </p>
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 sm:py-24 px-6 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto">
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
              Every day without monitoring is a day competitors get ahead
            </h2>
          </AnimateIn>
          <AnimateIn delay={0.1}>
            <p className="text-lg text-zinc-400 mb-8 leading-relaxed">
              AI models retrain weekly. You could be visible today and gone tomorrow. Start scanning now.
            </p>
          </AnimateIn>
          <AnimateIn delay={0.2}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-8 shadow-lg"
                >
                  Get Started
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/[0.1] text-zinc-300 hover:text-white hover:bg-white/[0.06] hover:border-white/[0.15] px-8"
                >
                  Run a Free Scan First
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-zinc-600 text-sm">
              Cancel anytime &middot; No contracts
            </p>
          </AnimateIn>
        </div>
      </section>
    </div>
  );
}
