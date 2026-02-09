"use client";

/**
 * PRICING PAGE - CabbageSEO
 *
 * Sell OUTCOMES, not features.
 * Each tier has: tagline, "who this is for", outcome-driven feature list.
 * Monthly/yearly toggle with 20% savings on annual.
 * FAQ section at bottom.
 */

import { useState, useRef } from "react";
import Link from "next/link";
import {
  Check,
  ArrowRight,
  Zap,
  Target,
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
  whoFor: string;
  description: string;
  cta: string;
  href: string;
  popular?: boolean;
  icon: React.ReactNode;
  features: string[];
  highlight?: string;
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
    name: "Free Trial",
    tagline: "The wake-up call",
    monthlyPrice: 0,
    annualPrice: 0,
    period: "for 7 days",
    whoFor:
      "Curious founder who heard AI is changing search. You want proof before you commit.",
    description:
      "See who AI recommends instead of you. No credit card. No commitment. Just the truth.",
    cta: "Start Free Trial",
    href: "/signup",
    icon: <Target className="w-5 h-5 text-zinc-400" />,
    features: [
      "1 site monitored",
      "3 manual checks per day",
      "See your GEO visibility score",
      "Find out who AI recommends instead of you",
      "7-day access to explore the platform",
    ],
  },
  {
    name: "Scout",
    tagline: "Know your blind spots",
    monthlyPrice: 49,
    annualPrice: 39,
    period: "/mo",
    whoFor:
      "Solo founder with one product. You want to know where you stand.",
    description:
      "Daily monitoring so you never get blindsided. See where you rank, who beats you, and what to fix first.",
    cta: "Get Scout",
    href: "/signup?plan=scout",
    icon: <TrendingUp className="w-5 h-5 text-emerald-400" />,
    features: [
      "1 site monitored",
      "Track 3 competitors side by side",
      "Weekly automated checks (Mondays)",
      "5 gap analyses per month",
      "3 authority pages per month",
      "5 custom query tracking slots",
      "Score drop alerts (email + Slack)",
      "30-day trend chart history",
      "Slack integration",
      "Trust Map + Get Listed Playbook",
      "30-day sprint + momentum scoring",
      "Weekly email digest + alerts",
    ],
  },
  {
    name: "Command",
    tagline: "Win the AI conversation",
    monthlyPrice: 149,
    annualPrice: 119,
    period: "/mo",
    whoFor:
      "Growing SaaS doing $5k-$50k MRR. Ready to actively compete for AI recommendations.",
    description:
      "Stop guessing. Get told exactly what to do next, every week, to climb the AI rankings.",
    cta: "Get Command",
    href: "/signup?plan=command",
    popular: true,
    icon: <Zap className="w-5 h-5 text-emerald-400" />,
    features: [
      "5 sites monitored",
      "Track 10 competitors per site",
      "Auto-checks every 3 days",
      "Unlimited intelligence reports",
      "15 authority pages per month",
      "Unlimited custom query tracking",
      "365-day trend chart history",
      "Weekly action plans — told exactly what to do",
      "Competitor deep dives",
      "5 team members",
      "Everything in Scout",
    ],
    highlight: "MOST POPULAR",
  },
  {
    name: "Dominate",
    tagline: "Own your category",
    monthlyPrice: 349,
    annualPrice: 279,
    period: "/mo",
    whoFor:
      "Agency or multi-product company. Track and win across multiple brands.",
    description:
      "Full control across every brand and product line. Priority support and unlimited team behind you.",
    cta: "Get Dominate",
    href: "/signup?plan=dominate",
    icon: <Crown className="w-5 h-5 text-amber-400" />,
    features: [
      "25 sites monitored",
      "Track 25 competitors per site",
      "Daily + hourly auto-checks",
      "Unlimited intelligence + authority pages",
      "Unlimited custom query tracking",
      "365-day trend chart history",
      "Unlimited team members",
      "Priority support",
      "Everything in Command",
    ],
  },
];

const faqs: FAQItem[] = [
  {
    question: "Is the data real?",
    answer:
      "Yes. Every data point comes from real API calls to ChatGPT, Perplexity, and Google AI Overviews. We query the actual AI platforms with real user prompts and record exactly what they recommend. No synthetic data, no estimations \u2014 just what AI actually says when someone asks about your market.",
  },
  {
    question: "What\u2019s the 30-day sprint?",
    answer:
      "The 30-day sprint is a structured program included with Scout and above. Each week you get specific, prioritized actions based on your current visibility data: content to create, pages to optimize, entities to reference, and comparisons to add. By day 30, most customers see measurable improvement in their AI recommendation rate. Think of it as a personal trainer for your AI visibility.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes. No contracts, no cancellation fees, no hoops. Cancel from your billing settings in two clicks. Your access continues until the end of your current billing period. If you\u2019re on an annual plan, you can cancel renewal and keep access for the remainder of your term.",
  },
  {
    question: "What if I\u2019m already visible in AI results?",
    answer:
      "Great \u2014 then you need to protect that position. AI recommendations shift constantly as competitors publish new content and platforms update their models. CabbageSEO tracks your visibility over time so you\u2019ll know the moment a competitor starts gaining ground, and you\u2019ll get actionable steps to maintain your lead.",
  },
  {
    question: "Do you support all AI platforms?",
    answer:
      "We monitor the three platforms that matter most for buying decisions: ChatGPT, Perplexity, and Google AI Overviews. These are where your potential customers are increasingly going when they search for solutions like yours. We\u2019re continuously evaluating additional platforms and will add them as they become significant sources of product recommendations.",
  },
  {
    question: "Can I change plans?",
    answer:
      "Yes. You can upgrade or downgrade at any time from your billing settings. When you upgrade, you get immediate access to the new tier\u2019s features. When you downgrade, your current tier remains active until the end of your billing period. No penalties, no hoops.",
  },
  {
    question: "Do you offer refunds?",
    answer:
      "We offer a 7-day free trial on all paid plans so you can evaluate the platform before committing. If you\u2019re unhappy after subscribing, contact us within 14 days of your first payment and we\u2019ll issue a full refund. After 14 days, you can cancel anytime and your access continues until the end of your billing period.",
  },
  {
    question: "How do automated checks work?",
    answer:
      "CabbageSEO automatically scans your AI visibility across ChatGPT, Perplexity, and Google AI on a schedule based on your plan. Scout gets weekly checks (every Monday), Command gets checks every 3 days, and Dominate gets daily checks plus hourly monitoring. If your visibility score drops by 5 or more points, you\u2019ll get an instant alert via email and Slack (if configured). No manual action required \u2014 the system works while you sleep.",
  },
  {
    question: "Does CabbageSEO integrate with Slack?",
    answer:
      "Yes. All paid plans include Slack integration. Connect your workspace by adding an incoming webhook URL in Settings > Notifications. You\u2019ll get automated messages for: check results (score and queries won/lost), score drop alerts (when visibility falls 5+ points), and weekly summary reports. Set it up once and alerts flow directly to your channel.",
  },
  {
    question: "What are Authority Pages?",
    answer:
      "Authority Pages are comparison pages, category explainers, and FAQs designed to reinforce your credibility with AI systems. Unlike generic AI writing tools, CabbageSEO uses your citation data, competitor intelligence, and gap analysis to create pages that reinforce the trust signals AI already looks for. Authority Pages support third-party trust signals (reviews, listings, mentions) so AI can confidently cite you \u2014 they don't cause recommendations on their own. Scout gets 3 pages/month, Command gets 15, and Dominate gets unlimited.",
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
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20">
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

        {/* Who this is for */}
        <div className="mb-6 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
            Who this is for
          </p>
          <p className="text-sm text-zinc-300 leading-relaxed italic">
            &ldquo;{tier.whoFor}&rdquo;
          </p>
        </div>

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
      </GlassCard>
    </div>
  );
}

// ============================================
// COMPARISON ROW (animated)
// ============================================

function ComparisonRow({
  children,
  index,
}: {
  children: React.ReactNode;
  index: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 15 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
      transition={{
        duration: 0.4,
        delay: index * 0.05,
        ease: [0.25, 0.4, 0.25, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// PAGE
// ============================================

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);

  return (
    <div className="bg-zinc-950 min-h-screen">
      {/* Hero */}
      <section className="pt-20 pb-12 sm:pt-24 sm:pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <AnimateIn delay={0}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-8">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400 text-sm font-medium">
                Free trial available &middot; No credit card required
              </span>
            </div>
          </AnimateIn>

          <AnimateIn delay={0.1}>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Pick the plan that matches
              <br className="hidden sm:block" />
              <span className="text-emerald-400"> your ambition</span>
            </h1>
          </AnimateIn>

          <AnimateIn delay={0.2}>
            <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-10">
              Every plan shows you who AI recommends instead of you.
              The question is how fast you want to fix it.
            </p>
          </AnimateIn>

          {/* Monthly / Annual Toggle */}
          <AnimateIn delay={0.3}>
            <div className="inline-flex items-center gap-4 p-1.5 bg-white/[0.03] rounded-full border border-white/[0.06] relative">
              {/* Animated slider background */}
              <motion.div
                className="absolute top-1.5 bottom-1.5 rounded-full bg-white/[0.08] shadow-sm"
                layout
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                style={{
                  left: annual ? "50%" : "6px",
                  right: annual ? "6px" : "50%",
                }}
              />
              <button
                onClick={() => setAnnual(false)}
                className={`relative z-10 px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                  !annual
                    ? "text-white"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setAnnual(true)}
                className={`relative z-10 px-5 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                  annual
                    ? "text-white"
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
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4 xl:gap-6"
          >
            {tiers.map((tier) => (
              <StaggerItem key={tier.name}>
                <PricingCard tier={tier} annual={annual} />
              </StaggerItem>
            ))}
          </StaggerGroup>

          {/* Trust line */}
          <AnimateIn delay={0.2}>
            <p className="text-center text-sm text-zinc-600 mt-10">
              All plans include SSL encryption, SOC 2 compliant infrastructure,
              and data stored in US-based servers.
            </p>
          </AnimateIn>
        </div>
      </section>

      {/* Which plan is right for you? */}
      <section className="py-20 sm:py-24 px-6 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto">
          <AnimateIn>
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-white mb-4">
              Which plan is right for you?
            </h2>
            <p className="text-center text-zinc-500 mb-14 max-w-2xl mx-auto">
              Find the tier that matches where you are right now.
            </p>
          </AnimateIn>

          <StaggerGroup stagger={0.15} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StaggerItem>
              <GlassCard className="!rounded-2xl" padding="lg">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-6">
                  <Target className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Solo founder, one product
                </h3>
                <p className="text-sm text-zinc-400 mb-6">
                  You have one SaaS product and want to know if AI recommends you.
                  You need daily monitoring and a structured plan to improve.
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-semibold text-sm">
                    Scout ($49/mo)
                  </span>
                  <ArrowRight className="w-4 h-4 text-emerald-400" />
                </div>
              </GlassCard>
            </StaggerItem>

            <StaggerItem>
              <GlassCard
                className="!rounded-2xl !border-emerald-500/30 !border-2"
                padding="lg"
                glow="emerald"
              >
                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-6">
                  <Zap className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Growing SaaS, ready to compete
                </h3>
                <p className="text-sm text-zinc-400 mb-6">
                  You&apos;re doing $5k-$50k MRR and want to actively win AI
                  recommendations. You need intelligence, action plans, and
                  content generation.
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-semibold text-sm">
                    Command ($149/mo)
                  </span>
                  <ArrowRight className="w-4 h-4 text-emerald-400" />
                </div>
              </GlassCard>
            </StaggerItem>

            <StaggerItem>
              <GlassCard className="!rounded-2xl" padding="lg">
                <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mb-6">
                  <Crown className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Agency or multi-brand company
                </h3>
                <p className="text-sm text-zinc-400 mb-6">
                  You manage multiple sites or client brands. You need scale,
                  unlimited team members, and priority support.
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 font-semibold text-sm">
                    Dominate ($349/mo)
                  </span>
                  <ArrowRight className="w-4 h-4 text-amber-400" />
                </div>
              </GlassCard>
            </StaggerItem>
          </StaggerGroup>
        </div>
      </section>

      {/* Comparison Summary */}
      <section className="py-20 sm:py-24 px-6 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto">
          <AnimateIn>
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-white mb-4">
              What changes at each level
            </h2>
            <p className="text-center text-zinc-500 mb-14 max-w-2xl mx-auto">
              Each tier builds on the previous one. The higher you go, the faster
              you move from &ldquo;awareness&rdquo; to &ldquo;dominance.&rdquo;
            </p>
          </AnimateIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Free Trial */}
            <ComparisonRow index={0}>
              <GlassCard className="!rounded-2xl !bg-white/[0.02]" padding="md" hover={false}>
                <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center mb-4">
                  <Target className="w-5 h-5 text-zinc-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">Free Trial</h3>
                <p className="text-sm text-emerald-400 font-medium mb-3">Awareness</p>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  See the gap. Discover which AI platforms recommend your
                  competitors instead of you.
                </p>
              </GlassCard>
            </ComparisonRow>

            {/* Scout */}
            <ComparisonRow index={1}>
              <GlassCard className="!rounded-2xl !bg-white/[0.02]" padding="md" hover={false}>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">Scout</h3>
                <p className="text-sm text-emerald-400 font-medium mb-3">Intelligence</p>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  Daily tracking and structured 30-day plan. Know your blind spots
                  and start closing them.
                </p>
              </GlassCard>
            </ComparisonRow>

            {/* Command */}
            <ComparisonRow index={2}>
              <GlassCard
                className="!rounded-2xl !bg-gradient-to-b from-emerald-500/10 to-white/[0.02] !border-emerald-500/30"
                padding="md"
                hover={false}
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-4">
                  <Zap className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">Command</h3>
                <p className="text-sm text-emerald-400 font-medium mb-3">Offense</p>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  Daily monitoring, unlimited reports, and weekly plays.
                  Actively compete for every recommendation.
                </p>
              </GlassCard>
            </ComparisonRow>

            {/* Dominate */}
            <ComparisonRow index={3}>
              <GlassCard className="!rounded-2xl !bg-white/[0.02]" padding="md" hover={false}>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4">
                  <Crown className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">Dominate</h3>
                <p className="text-sm text-emerald-400 font-medium mb-3">Control</p>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  Multi-brand coverage, unlimited team members, and
                  priority support. Own your entire category.
                </p>
              </GlassCard>
            </ComparisonRow>
          </div>
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
              Your competitors are already tracking you
            </h2>
          </AnimateIn>
          <AnimateIn delay={0.1}>
            <p className="text-lg text-zinc-400 mb-8 leading-relaxed">
              Every day you wait is another day AI sends customers to someone
              else. Start with a free trial &mdash; no credit card, no risk.
            </p>
          </AnimateIn>
          <AnimateIn delay={0.2}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-8 shadow-lg shadow-emerald-500/20"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/docs">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/[0.1] text-zinc-300 hover:text-white hover:bg-white/[0.06] hover:border-white/[0.15] px-8"
                >
                  See How It Works
                </Button>
              </Link>
            </div>
          </AnimateIn>
        </div>
      </section>
    </div>
  );
}
