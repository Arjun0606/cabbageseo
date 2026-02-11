import Link from "next/link";
import {
  ArrowRight,
  Search,
  Brain,
  FileText,
  RefreshCw,
  BarChart3,
  Globe,
  Zap,
  CheckCircle,
  XCircle,
} from "lucide-react";

// ============================================
// PAGE — Server-rendered for SEO
// ============================================

export default function WhatIsGeoPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Hero */}
      <section className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border bg-emerald-500/10 border-emerald-500/20 text-emerald-400 mb-6">
            The definitive guide to GEO
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            What is <span className="text-emerald-400">GEO</span>?
            <br className="hidden sm:block" />
            Generative Engine Optimization Explained
          </h1>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-8">
            GEO is how you get AI to recommend your brand. When someone asks
            ChatGPT, Perplexity, or Google AI &ldquo;what&rsquo;s the best tool
            for X?&rdquo; — GEO determines whether the answer includes you.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-colors"
            >
              Check Your AI Visibility
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/features"
              className="inline-flex items-center gap-2 px-8 py-4 border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 rounded-xl transition-colors"
            >
              See How CabbageSEO Works
            </Link>
          </div>
        </div>
      </section>

      {/* What is GEO */}
      <section className="py-16 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-white mb-6">
            What is Generative Engine Optimization?
          </h2>
          <div className="space-y-4 text-zinc-400 leading-relaxed">
            <p>
              <strong className="text-white">
                Generative Engine Optimization (GEO)
              </strong>{" "}
              is the practice of optimizing your online presence so that AI-powered
              search engines recommend your brand, product, or service when users
              ask relevant questions.
            </p>
            <p>
              Traditional SEO focuses on ranking in Google&rsquo;s list of blue
              links. GEO focuses on a different target: the AI-generated answers
              that platforms like{" "}
              <strong className="text-zinc-300">ChatGPT</strong>,{" "}
              <strong className="text-zinc-300">Perplexity</strong>, and{" "}
              <strong className="text-zinc-300">Google AI Overviews</strong>{" "}
              produce when users ask for recommendations.
            </p>
            <p>
              When a buyer asks AI &ldquo;what&rsquo;s the best project
              management tool?&rdquo; or &ldquo;which CRM should I use?&rdquo;,
              the AI doesn&rsquo;t show 10 links — it gives a direct answer. GEO
              is how you make sure that answer includes your brand.
            </p>
          </div>
        </div>
      </section>

      {/* How GEO Works */}
      <section className="py-16 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-white mb-4">
            How does GEO work?
          </h2>
          <p className="text-zinc-400 mb-10 max-w-2xl">
            AI engines decide who to recommend based on trust signals — not
            just keywords. Here are the five pillars of GEO:
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: <Globe className="w-5 h-5" />,
                title: "Third-Party Mentions",
                desc: "AI trusts brands that are mentioned across authoritative sources — review sites, industry publications, forums, and comparison pages. The more independent sources cite you, the more likely AI is to recommend you.",
              },
              {
                icon: <FileText className="w-5 h-5" />,
                title: "Structured Comparisons",
                desc: "AI loves content that directly compares options. Pages like \"X vs Y\" or \"Best tools for Z\" give AI the structured data it needs to confidently include you in recommendations.",
              },
              {
                icon: <Brain className="w-5 h-5" />,
                title: "Entity Recognition",
                desc: "AI identifies brands as entities. The more consistently your brand appears in relevant contexts — with clear descriptions, categories, and use cases — the stronger your entity signal.",
              },
              {
                icon: <BarChart3 className="w-5 h-5" />,
                title: "Recency & Freshness",
                desc: "AI models update their knowledge regularly. Fresh content, recent reviews, and up-to-date comparisons signal that your brand is active and relevant in your market.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4">
                  {item.icon}
                </div>
                <h3 className="text-white font-semibold mb-2">{item.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GEO vs SEO */}
      <section className="py-16 border-t border-white/[0.06] bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-white mb-4">GEO vs SEO</h2>
          <p className="text-zinc-400 mb-8">
            GEO and SEO are complementary but target different systems.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="py-3 px-4 text-left text-zinc-500 font-medium" />
                  <th className="py-3 px-4 text-left text-zinc-400 font-semibold">
                    Traditional SEO
                  </th>
                  <th className="py-3 px-4 text-left text-emerald-400 font-semibold">
                    GEO
                  </th>
                </tr>
              </thead>
              <tbody className="text-zinc-400">
                {[
                  {
                    label: "Target",
                    seo: "Google search results (10 blue links)",
                    geo: "AI-generated answers (ChatGPT, Perplexity, Google AI)",
                  },
                  {
                    label: "Goal",
                    seo: "Rank higher in search results",
                    geo: "Get recommended in AI responses",
                  },
                  {
                    label: "Key signals",
                    seo: "Backlinks, keyword density, page speed",
                    geo: "Third-party mentions, comparisons, entity signals",
                  },
                  {
                    label: "Content format",
                    seo: "Blog posts, landing pages",
                    geo: "Comparison pages, FAQ schema, review presence",
                  },
                  {
                    label: "Measurement",
                    seo: "Keyword rankings, organic traffic",
                    geo: "AI recommendation rate, citation tracking",
                  },
                  {
                    label: "Update cycle",
                    seo: "Weeks to months for ranking changes",
                    geo: "Days to weeks as AI models refresh",
                  },
                ].map((row) => (
                  <tr
                    key={row.label}
                    className="border-b border-white/[0.04]"
                  >
                    <td className="py-3 px-4 text-white font-medium">
                      {row.label}
                    </td>
                    <td className="py-3 px-4">{row.seo}</td>
                    <td className="py-3 px-4 text-zinc-300">{row.geo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Why GEO Matters */}
      <section className="py-16 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-white mb-4">
            Why GEO matters now
          </h2>
          <div className="space-y-4 text-zinc-400 leading-relaxed">
            <p>
              AI search is replacing traditional search for buying decisions.
              When someone asks ChatGPT &ldquo;what&rsquo;s the best email
              marketing tool?&rdquo;, they get a direct answer — not a list of
              links to browse. If you&rsquo;re not in that answer, you don&rsquo;t
              exist to that buyer.
            </p>
            <p>
              This shift is accelerating. Perplexity is growing rapidly. Google
              AI Overviews now appear for the majority of searches. ChatGPT has
              hundreds of millions of users asking it for product recommendations
              daily. The brands that invest in GEO now will compound their
              advantage as AI search grows.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 mt-8">
            {[
              {
                stat: "40%+",
                label: "of product research now starts with AI",
              },
              {
                stat: "3-5",
                label: "brands get mentioned per AI response",
              },
              {
                stat: "Weekly",
                label: "AI recommendations shift as models update",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 text-center"
              >
                <p className="text-2xl font-bold text-emerald-400 mb-1">
                  {item.stat}
                </p>
                <p className="text-zinc-500 text-sm">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The GEO Loop */}
      <section className="py-16 border-t border-white/[0.06] bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-white mb-4">
            The GEO loop: How to optimize for AI search
          </h2>
          <p className="text-zinc-400 mb-10">
            GEO isn&rsquo;t a one-time fix. It&rsquo;s a continuous loop of
            scanning, identifying gaps, fixing them, and verifying results.
          </p>

          <div className="space-y-4">
            {[
              {
                step: "1",
                icon: <Search className="w-5 h-5" />,
                title: "Scan",
                desc: "Query AI platforms with real buyer questions about your market. Record exactly what they recommend and who they mention.",
              },
              {
                step: "2",
                icon: <Brain className="w-5 h-5" />,
                title: "Identify Gaps",
                desc: "Compare your presence against competitors. Find the queries where AI recommends them instead of you, and understand why.",
              },
              {
                step: "3",
                icon: <FileText className="w-5 h-5" />,
                title: "Fix",
                desc: "Create comparison pages, get mentioned on review sites, publish structured content that reinforces your authority in your category.",
              },
              {
                step: "4",
                icon: <RefreshCw className="w-5 h-5" />,
                title: "Verify",
                desc: "Re-scan to confirm AI now includes you in recommendations. Measure your visibility score over time.",
              },
              {
                step: "5",
                icon: <BarChart3 className="w-5 h-5" />,
                title: "Monitor",
                desc: "AI recommendations change as models update. Automated monitoring catches drops immediately so you can respond before competitors gain ground.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="flex items-start gap-4 bg-white/[0.03] border border-white/[0.06] rounded-xl p-5"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <span className="text-emerald-400 text-sm font-bold">
                    {item.step}
                  </span>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1 flex items-center gap-2">
                    {item.icon}
                    {item.title}
                  </h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GEO Checklist */}
      <section className="py-16 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-white mb-4">
            GEO checklist: Are you doing these?
          </h2>
          <p className="text-zinc-400 mb-8">
            Quick self-assessment for your GEO readiness:
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                Signs you&rsquo;re doing GEO right
              </h3>
              {[
                "AI mentions your brand by name",
                "You have comparison pages (vs competitors)",
                "Review sites list your product",
                "Your content includes structured FAQs",
                "You monitor AI recommendations regularly",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-zinc-300">{item}</span>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-400" />
                Signs you&rsquo;re invisible to AI
              </h3>
              {[
                "AI recommends competitors but not you",
                "No comparison or \"vs\" content exists",
                "No recent reviews or third-party mentions",
                "Your content is keyword-stuffed, not structured",
                "You've never checked what AI says about you",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2 text-sm">
                  <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span className="text-zinc-400">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How CabbageSEO Helps */}
      <section className="py-16 border-t border-white/[0.06] bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-white mb-4">
            How CabbageSEO automates your GEO strategy
          </h2>
          <p className="text-zinc-400 mb-8">
            CabbageSEO is a GEO platform purpose-built for this exact workflow.
            Instead of manually checking AI platforms, we automate the entire
            loop:
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                icon: <Search className="w-5 h-5" />,
                title: "Automated AI Scanning",
                desc: "Real API calls to ChatGPT, Perplexity & Google AI with actual buyer questions — on a schedule based on your plan.",
              },
              {
                icon: <Brain className="w-5 h-5" />,
                title: "Gap Analysis",
                desc: "See exactly which queries you're losing and what competitors have that you don't. Per-query breakdowns with actionable insights.",
              },
              {
                icon: <FileText className="w-5 h-5" />,
                title: "AI-Generated Fix Pages",
                desc: "Comparison pages, FAQs, and explainers built from your gap data. Designed to reinforce the trust signals AI looks for.",
              },
              {
                icon: <Zap className="w-5 h-5" />,
                title: "30-Day Sprint",
                desc: "A structured 4-week GEO program with prioritized actions. Week-by-week tasks — not a dashboard you stare at.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-3">
                  {item.icon}
                </div>
                <h3 className="text-white font-semibold mb-1">{item.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-colors"
            >
              Run a Free GEO Scan
              <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-zinc-600 text-sm mt-3">
              Takes 10 seconds. No signup required.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-white mb-8">
            Frequently asked questions about GEO
          </h2>

          <div className="space-y-4">
            {[
              {
                q: "What does GEO stand for?",
                a: "GEO stands for Generative Engine Optimization. It's the practice of optimizing your online presence so that AI-powered search engines — like ChatGPT, Perplexity, and Google AI Overviews — recommend your brand when users ask relevant questions.",
              },
              {
                q: "Is GEO the same as SEO?",
                a: "No. SEO (Search Engine Optimization) focuses on ranking in traditional search results like Google's 10 blue links. GEO focuses on getting recommended by AI systems that generate answers directly. The signals are different — AI looks for authoritative mentions, structured comparisons, and third-party trust signals rather than just backlinks and keyword density.",
              },
              {
                q: "Do I still need SEO if I do GEO?",
                a: "Yes. SEO and GEO are complementary. SEO helps you rank in traditional search. GEO helps you get recommended when someone asks AI for advice. As AI search grows, GEO becomes increasingly important — but traditional SEO remains valuable for organic traffic.",
              },
              {
                q: "How long does GEO take to show results?",
                a: "AI models update their knowledge regularly. After implementing GEO improvements — like publishing comparison pages, getting mentioned on review sites, and building structured content — most businesses see changes in AI recommendations within 2-4 weeks. CabbageSEO's 30-day sprint is designed around this timeline.",
              },
              {
                q: "Which AI platforms does GEO apply to?",
                a: "GEO applies to any AI system that recommends products or services. The main platforms today are ChatGPT (OpenAI), Perplexity, Google AI Overviews (formerly SGE), and Claude. CabbageSEO currently tracks ChatGPT, Perplexity, and Google AI.",
              },
              {
                q: "Can I do GEO myself without a tool?",
                a: "You can manually ask AI platforms about your brand, but it's slow and inconsistent. You'd need to check multiple platforms, track changes over time, identify competitors, and figure out what to fix — all manually. GEO tools like CabbageSEO automate scanning, tracking, gap analysis, and action planning so you can focus on implementation.",
              },
            ].map((item) => (
              <details
                key={item.q}
                className="group bg-white/[0.03] border border-white/[0.06] rounded-xl"
              >
                <summary className="cursor-pointer px-6 py-4 text-white font-medium flex items-center justify-between list-none">
                  {item.q}
                  <span className="text-zinc-500 group-open:rotate-180 transition-transform">
                    &#9662;
                  </span>
                </summary>
                <div className="px-6 pb-4 text-zinc-400 text-sm leading-relaxed">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 border-t border-emerald-900/30">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">
            Ready to start your GEO strategy?
          </h2>
          <p className="text-zinc-400 mb-6">
            Check if AI recommends your brand. Free scan, no signup required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-colors"
            >
              Free AI Visibility Scan
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-8 py-4 border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 rounded-xl transition-colors"
            >
              See Pricing Plans
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
