"use client";

/**
 * PRICING PAGE - CabbageSEO
 *
 * Sell OUTCOMES, not features.
 * Each tier has: tagline, "who this is for", outcome-driven feature list.
 * Monthly/yearly toggle with 20% savings on annual.
 * FAQ section at bottom.
 */

import { useState } from "react";
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
      "See your basic GEO visibility score",
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
      "Daily automated monitoring",
      "5 gap analyses per month — see exactly why competitors rank above you",
      "Trust Map: visualize who AI trusts in your space",
      "30-day sprint: structured program to improve your visibility",
      "Email alerts when your visibility changes",
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
      "Hourly automated monitoring",
      "Unlimited intelligence reports",
      "Weekly action plans — get told exactly what to do next",
      "Competitor deep dives: reverse-engineer why they win",
      "Query discovery: find high-intent questions you should own",
      "Watch your momentum grow week over week",
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
      "Full control across every brand and product line. White-label reports, API access, and a dedicated team behind you.",
    cta: "Get Dominate",
    href: "/signup?plan=dominate",
    icon: <Crown className="w-5 h-5 text-amber-400" />,
    features: [
      "25 sites monitored",
      "Track 25 competitors per site",
      "Real-time alerts: know the instant anything shifts",
      "White-label reports for clients",
      "API access for custom integrations",
      "Dedicated support with priority response",
      "Custom onboarding and strategy session",
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
];

// ============================================
// FAQ ACCORDION ITEM
// ============================================

function FAQAccordionItem({ item }: { item: FAQItem }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-zinc-800">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left group"
      >
        <h3 className="text-lg font-semibold text-white group-hover:text-emerald-400 transition-colors pr-4">
          {item.question}
        </h3>
        <ChevronDown
          className={`w-5 h-5 text-zinc-500 shrink-0 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          open ? "max-h-96 pb-5" : "max-h-0"
        }`}
      >
        <p className="text-zinc-400 leading-relaxed">{item.answer}</p>
      </div>
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

  return (
    <div
      className={`relative flex flex-col p-6 sm:p-8 rounded-2xl border transition-all duration-300 ${
        isPopular
          ? "bg-gradient-to-b from-emerald-500/15 via-zinc-900 to-zinc-900 border-emerald-500/40 shadow-lg shadow-emerald-500/10 scale-[1.02] lg:scale-105"
          : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
      }`}
    >
      {/* Popular badge */}
      {tier.highlight && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
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
              isPopular ? "bg-emerald-500/20" : "bg-zinc-800"
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
              <span className="text-4xl font-bold text-white">${price}</span>
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
                : "bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700"
          }`}
          variant={isPopular ? "default" : "outline"}
          size="lg"
        >
          {tier.cta}
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </Link>

      {/* Who this is for */}
      <div className="mb-6 p-4 rounded-xl bg-zinc-800/50 border border-zinc-800">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
          Who this is for
        </p>
        <p className="text-sm text-zinc-300 leading-relaxed italic">
          &ldquo;{tier.whoFor}&rdquo;
        </p>
      </div>

      {/* Features */}
      <ul className="space-y-3 flex-1">
        {tier.features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span className="text-sm text-zinc-300">{feature}</span>
          </li>
        ))}
      </ul>
    </div>
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
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-8">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400 text-sm font-medium">
              Free trial available &middot; No credit card required
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Pick the plan that matches
            <br className="hidden sm:block" />
            <span className="text-emerald-400"> your ambition</span>
          </h1>
          <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-10">
            Every plan shows you who AI recommends instead of you.
            The question is how fast you want to fix it.
          </p>

          {/* Monthly / Annual Toggle */}
          <div className="inline-flex items-center gap-4 p-1.5 bg-zinc-900 rounded-full border border-zinc-800">
            <button
              onClick={() => setAnnual(false)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                !annual
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                annual
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Annual
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-bold">
                Save 20%
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20 sm:pb-28 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4 xl:gap-6">
            {tiers.map((tier) => (
              <PricingCard key={tier.name} tier={tier} annual={annual} />
            ))}
          </div>

          {/* Trust line */}
          <p className="text-center text-sm text-zinc-600 mt-10">
            All plans include SSL encryption, SOC 2 compliant infrastructure,
            and data stored in US-based servers.
          </p>
        </div>
      </section>

      {/* Comparison Summary */}
      <section className="py-20 sm:py-24 px-6 border-t border-zinc-800/60">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-white mb-4">
            What changes at each level
          </h2>
          <p className="text-center text-zinc-500 mb-14 max-w-2xl mx-auto">
            Each tier builds on the previous one. The higher you go, the faster
            you move from &ldquo;awareness&rdquo; to &ldquo;dominance.&rdquo;
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Free Trial */}
            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
              <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center mb-4">
                <Target className="w-5 h-5 text-zinc-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">Free Trial</h3>
              <p className="text-sm text-emerald-400 font-medium mb-3">Awareness</p>
              <p className="text-sm text-zinc-500 leading-relaxed">
                See the gap. Discover which AI platforms recommend your
                competitors instead of you.
              </p>
            </div>

            {/* Scout */}
            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">Scout</h3>
              <p className="text-sm text-emerald-400 font-medium mb-3">Intelligence</p>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Daily tracking and structured 30-day plan. Know your blind spots
                and start closing them.
              </p>
            </div>

            {/* Command */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-emerald-500/10 to-zinc-900/50 border border-emerald-500/30">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-4">
                <Zap className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">Command</h3>
              <p className="text-sm text-emerald-400 font-medium mb-3">Offense</p>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Hourly monitoring, unlimited reports, and weekly plays.
                Actively compete for every recommendation.
              </p>
            </div>

            {/* Dominate */}
            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4">
                <Crown className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">Dominate</h3>
              <p className="text-sm text-emerald-400 font-medium mb-3">Control</p>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Multi-brand coverage, API access, and white-label
                reports. Own your entire category.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 sm:py-24 px-6 border-t border-zinc-800/60">
        <div className="max-w-3xl mx-auto">
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

          <div className="divide-y divide-zinc-800 border-t border-zinc-800">
            {faqs.map((faq, i) => (
              <FAQAccordionItem key={i} item={faq} />
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 sm:py-24 px-6 border-t border-zinc-800/60 bg-gradient-to-t from-zinc-950 via-zinc-950 to-zinc-900/30">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Your competitors are already tracking you
          </h2>
          <p className="text-lg text-zinc-400 mb-8 leading-relaxed">
            Every day you wait is another day AI sends customers to someone
            else. Start with a free trial &mdash; no credit card, no risk.
          </p>
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
                className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 hover:border-zinc-600 px-8"
              >
                See How It Works
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
