import Link from "next/link";
import { ArrowRight, Search, Brain, FileText, Timer, Bell } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "What is CabbageSEO? | AI Visibility Platform for GEO",
  description:
    "CabbageSEO is a Generative Engine Optimization (GEO) platform that helps businesses get recommended by ChatGPT, Perplexity, and Google AI. Scan, find gaps, fix, and monitor your AI visibility.",
  openGraph: {
    title: "CabbageSEO — AI Visibility Platform",
    description:
      "Get recommended by ChatGPT, Perplexity, and Google AI. CabbageSEO scans AI platforms, finds your visibility gaps, and helps you fix them.",
    type: "website",
    url: "https://cabbageseo.com/about",
  },
};

export default function AboutPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "CabbageSEO",
    url: "https://cabbageseo.com",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description:
      "CabbageSEO is a Generative Engine Optimization (GEO) platform that helps businesses track, improve, and monitor their visibility across AI recommendation engines including ChatGPT, Perplexity, and Google AI Overviews.",
    featureList: [
      "AI Citation Scanning across ChatGPT, Perplexity, and Google AI",
      "6-factor AI Visibility Scoring",
      "Gap Analysis — see where AI recommends competitors instead",
      "AI Fix Pages — targeted content to close visibility gaps",
      "30-Day AI Visibility Sprint with week-by-week actions",
      "Automated daily and hourly AI monitoring with alerts",
    ],
    offers: [
      {
        "@type": "Offer",
        name: "Scout",
        price: "49",
        priceCurrency: "USD",
        description: "1 website, daily monitoring, 5 fix pages/month, 30-day sprint",
        url: "https://cabbageseo.com/pricing",
      },
      {
        "@type": "Offer",
        name: "Command",
        price: "149",
        priceCurrency: "USD",
        description: "5 websites, hourly monitoring, 25 fix pages/month, weekly playbooks",
        url: "https://cabbageseo.com/pricing",
      },
      {
        "@type": "Offer",
        name: "Dominate",
        price: "349",
        priceCurrency: "USD",
        description: "25 websites, hourly monitoring, unlimited fix pages, monthly reports",
        url: "https://cabbageseo.com/pricing",
      },
    ],
    creator: {
      "@type": "Person",
      name: "Arjun",
      url: "https://x.com/Arjun06061",
    },
    category: "GEO (Generative Engine Optimization)",
    keywords: [
      "GEO",
      "Generative Engine Optimization",
      "AI visibility",
      "AI citations",
      "ChatGPT recommendations",
      "Perplexity citations",
      "Google AI Overviews",
      "AI SEO",
    ],
  };

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "CabbageSEO",
    url: "https://cabbageseo.com",
    logo: "https://cabbageseo.com/apple-touch-icon.png",
    description:
      "CabbageSEO builds tools for Generative Engine Optimization (GEO) — helping businesses get recommended by AI platforms like ChatGPT, Perplexity, and Google AI.",
    foundingDate: "2025",
    contactPoint: {
      "@type": "ContactPoint",
      email: "arjun@cabbageseo.com",
      contactType: "customer support",
    },
    sameAs: ["https://x.com/Arjun06061"],
  };

  const features = [
    {
      icon: <Search className="w-5 h-5 text-emerald-400" />,
      name: "AI Citation Scanning",
      description:
        "Real-time queries to ChatGPT, Perplexity, and Google AI with actual buyer questions. Not estimations — actual AI responses recorded and analyzed.",
    },
    {
      icon: <Brain className="w-5 h-5 text-emerald-400" />,
      name: "Gap Analysis",
      description:
        "Per-query breakdown of where AI sends buyers instead of to you, and exactly why. Actionable intelligence, not vanity metrics.",
    },
    {
      icon: <FileText className="w-5 h-5 text-emerald-400" />,
      name: "AI Fix Pages",
      description:
        "Targeted comparison pages, explainers, and FAQs generated from your actual gap data. Designed to improve how AI understands and recommends your brand.",
    },
    {
      icon: <Timer className="w-5 h-5 text-emerald-400" />,
      name: "30-Day Sprint",
      description:
        "A structured week-by-week program of prioritized actions. Not a dashboard to stare at — specific tasks with clear instructions based on your scan data.",
    },
    {
      icon: <Bell className="w-5 h-5 text-emerald-400" />,
      name: "Automated Monitoring",
      description:
        "Daily or hourly scans across all three AI platforms. Instant email alerts if your visibility drops so you can respond before it impacts pipeline.",
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />

      <div className="min-h-screen bg-zinc-950">
        {/* Hero */}
        <section className="pt-20 pb-16">
          <div className="max-w-5xl mx-auto px-6">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              CabbageSEO is a GEO platform that gets AI to recommend you
            </h1>
            <p className="text-lg text-zinc-300 mb-4 leading-relaxed">
              <strong className="text-white">CabbageSEO</strong> is a{" "}
              <strong className="text-emerald-400">
                Generative Engine Optimization (GEO)
              </strong>{" "}
              platform. It helps businesses track, improve, and monitor their
              visibility across AI recommendation engines — specifically ChatGPT,
              Perplexity, and Google AI Overviews.
            </p>
            <p className="text-zinc-400 mb-8 leading-relaxed">
              When buyers ask AI &quot;what&apos;s the best tool for X?&quot;, AI gives a
              direct answer — a shortlist of 3-5 brands. If you&apos;re not on that
              list, you&apos;re invisible to an increasingly large share of buyers.
              CabbageSEO scans these platforms, finds the gaps, and gives you a
              structured plan to fix them.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-colors"
              >
                Run a free scan
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 px-8 py-4 border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 rounded-xl transition-colors"
              >
                View pricing
              </Link>
            </div>
          </div>
        </section>

        {/* What GEO is */}
        <section className="py-16 border-t border-white/[0.06]">
          <div className="max-w-5xl mx-auto px-6">
            <h2 className="text-2xl font-bold text-white mb-4">
              What is GEO (Generative Engine Optimization)?
            </h2>
            <p className="text-zinc-400 leading-relaxed mb-4">
              GEO is the practice of optimizing your brand&apos;s presence so that AI
              platforms recommend you when users ask relevant questions. It&apos;s the
              equivalent of SEO, but for AI-generated answers instead of
              traditional search results.
            </p>
            <p className="text-zinc-400 leading-relaxed mb-4">
              Traditional SEO optimizes for Google&apos;s crawl-and-rank algorithm.
              GEO optimizes for AI&apos;s understand-and-recommend behavior. The
              signals are different: entity clarity, citation-worthiness,
              structured data, and authoritative mentions across trusted sources.
            </p>
            <p className="text-zinc-400 leading-relaxed">
              CabbageSEO automates the GEO cycle: scan AI platforms with real
              buyer queries, identify where you&apos;re missing, generate targeted
              content to close gaps, verify improvements, and monitor
              continuously.
            </p>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 border-t border-white/[0.06]">
          <div className="max-w-5xl mx-auto px-6">
            <h2 className="text-2xl font-bold text-white mb-4">
              How CabbageSEO works
            </h2>
            <ol className="space-y-6">
              <li className="flex gap-4">
                <span className="shrink-0 w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-sm font-bold">
                  1
                </span>
                <div>
                  <h3 className="text-white font-semibold mb-1">Scan</h3>
                  <p className="text-zinc-400 text-sm">
                    CabbageSEO queries ChatGPT, Perplexity, and Google AI with
                    real buyer questions in your category. It records the actual
                    AI responses — not estimates or projections.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="shrink-0 w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-sm font-bold">
                  2
                </span>
                <div>
                  <h3 className="text-white font-semibold mb-1">Score</h3>
                  <p className="text-zinc-400 text-sm">
                    A 6-factor scoring system evaluates your visibility: citation
                    presence, domain visibility, brand echo, position, mention
                    depth, and market density. Scores range from 0-100.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="shrink-0 w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-sm font-bold">
                  3
                </span>
                <div>
                  <h3 className="text-white font-semibold mb-1">Fix</h3>
                  <p className="text-zinc-400 text-sm">
                    For every gap, CabbageSEO generates targeted fix pages —
                    comparison pages, category explainers, FAQs — designed to
                    improve how AI platforms understand and cite your brand.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="shrink-0 w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-sm font-bold">
                  4
                </span>
                <div>
                  <h3 className="text-white font-semibold mb-1">Monitor</h3>
                  <p className="text-zinc-400 text-sm">
                    Automated daily or hourly scans track your visibility over
                    time. Instant alerts when your score drops. Monthly
                    checkpoint reports show progress.
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 border-t border-white/[0.06]">
          <div className="max-w-5xl mx-auto px-6">
            <h2 className="text-2xl font-bold text-white mb-8">
              Core capabilities
            </h2>
            <div className="space-y-6">
              {features.map((f) => (
                <div key={f.name} className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                    {f.icon}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">{f.name}</h3>
                    <p className="text-zinc-400 text-sm leading-relaxed">
                      {f.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing summary */}
        <section className="py-16 border-t border-white/[0.06]">
          <div className="max-w-5xl mx-auto px-6">
            <h2 className="text-2xl font-bold text-white mb-4">Pricing</h2>
            <p className="text-zinc-400 mb-6">
              CabbageSEO offers three plans. All include real AI scanning across
              ChatGPT, Perplexity, and Google AI.
            </p>
            <div className="space-y-4">
              {[
                {
                  name: "Scout",
                  price: "$49/mo",
                  desc: "1 website, daily monitoring, 5 fix pages/month, 30-day sprint, email alerts",
                },
                {
                  name: "Command",
                  price: "$149/mo",
                  desc: "5 websites, hourly monitoring, 25 fix pages/month, weekly playbooks, full GEO audit",
                },
                {
                  name: "Dominate",
                  price: "$349/mo",
                  desc: "25 websites, hourly monitoring, unlimited fix pages, monthly checkpoint reports",
                },
              ].map((plan) => (
                <div
                  key={plan.name}
                  className="flex items-baseline gap-4 py-3 border-b border-white/[0.06]"
                >
                  <span className="text-white font-semibold w-24">
                    {plan.name}
                  </span>
                  <span className="text-emerald-400 font-bold w-20">
                    {plan.price}
                  </span>
                  <span className="text-zinc-500 text-sm">{plan.desc}</span>
                </div>
              ))}
            </div>
            <p className="text-zinc-500 text-sm mt-4">
              Annual billing saves 20%. 14-day money-back guarantee on all
              plans.
            </p>
            <div className="mt-6">
              <Link
                href="/pricing"
                className="text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-colors"
              >
                View full pricing details &rarr;
              </Link>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 border-t border-emerald-900/30 bg-emerald-950/20">
          <div className="max-w-5xl mx-auto px-6 text-center">
            <h2 className="text-2xl font-bold text-white mb-3">
              Check your AI visibility in 10 seconds
            </h2>
            <p className="text-zinc-400 mb-6">
              Free scan. No signup required. See what ChatGPT, Perplexity, and
              Google AI say about your brand.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-colors"
            >
              Scan my domain free
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
