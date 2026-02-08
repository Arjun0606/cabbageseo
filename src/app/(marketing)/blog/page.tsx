"use client";

import Link from "next/link";
import { ArrowRight, Clock, Tag } from "lucide-react";

interface BlogPost {
  slug: string;
  title: string;
  description: string;
  category: string;
  readTime: string;
  date: string;
  featured?: boolean;
}

const POSTS: BlogPost[] = [
  {
    slug: "is-your-brand-on-chatgpt",
    title: "Is Your Brand on ChatGPT? Here's How to Check (And What to Do If It's Not)",
    description:
      "ChatGPT recommends products to millions daily. Most brands have no idea if they're included. Here's how to find out in 10 seconds — and the 4-step fix if you're invisible.",
    category: "Guide",
    readTime: "8 min",
    date: "Feb 8, 2026",
    featured: true,
  },
  {
    slug: "ai-seo-vs-traditional-seo",
    title: "AI SEO vs Traditional SEO: Why Rankings Don't Matter Anymore",
    description:
      "Google rankings are table stakes. The new battleground is AI recommendations — ChatGPT, Perplexity, and Google AI Overview. Here's what changes.",
    category: "Strategy",
    readTime: "6 min",
    date: "Feb 5, 2026",
    featured: true,
  },
  {
    slug: "generative-engine-optimization-guide",
    title: "The Complete Guide to Generative Engine Optimization (GEO) in 2026",
    description:
      "GEO is to AI search what SEO is to Google. This guide covers everything: how AI picks recommendations, what signals matter, and how to optimize your brand.",
    category: "Guide",
    readTime: "15 min",
    date: "Feb 2, 2026",
    featured: true,
  },
  {
    slug: "how-perplexity-picks-recommendations",
    title: "How Perplexity Picks Its Recommendations (Reverse-Engineered)",
    description:
      "We analyzed 1,000+ Perplexity responses to understand its recommendation algorithm. Here's what signals drive citations — and what doesn't matter at all.",
    category: "Research",
    readTime: "10 min",
    date: "Jan 28, 2026",
  },
  {
    slug: "comparison-pages-that-ai-cites",
    title: "How to Write Comparison Pages That AI Actually Cites",
    description:
      "The 'You vs Competitor' page is the #1 highest-impact content format for AI visibility. Here's the exact structure, schema markup, and writing approach that works.",
    category: "Tactical",
    readTime: "7 min",
    date: "Jan 22, 2026",
  },
  {
    slug: "ai-visibility-for-saas",
    title: "AI Visibility for SaaS: The Unfair Advantage Nobody's Talking About",
    description:
      "SaaS buyers ask AI for recommendations before they Google. The companies that optimize for AI citations now will own their category for years.",
    category: "Strategy",
    readTime: "5 min",
    date: "Jan 15, 2026",
  },
  {
    slug: "what-makes-ai-recommend-a-brand",
    title: "What Makes AI Recommend a Brand? The 7 Signals That Matter",
    description:
      "Authority, recency, structured data, comparison content, review presence, citation density, and expert mentions. Here's how each signal works.",
    category: "Research",
    readTime: "12 min",
    date: "Jan 8, 2026",
  },
  {
    slug: "ai-seo-tools-compared",
    title: "AI SEO Tools Compared: CabbageSEO vs SEOBOT vs Manual Tracking",
    description:
      "There are now multiple tools for AI visibility. Here's an honest comparison of what each does, who it's for, and where the gaps are.",
    category: "Comparison",
    readTime: "8 min",
    date: "Jan 2, 2026",
  },
];

const CATEGORIES = ["All", "Guide", "Strategy", "Research", "Tactical", "Comparison"];

export default function BlogPage() {
  const featured = POSTS.filter((p) => p.featured);
  const rest = POSTS.filter((p) => !p.featured);

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Hero */}
      <section className="pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            AI Visibility Blog
          </h1>
          <p className="text-lg text-zinc-400 max-w-xl mx-auto">
            Guides, research, and strategies for getting recommended by ChatGPT,
            Perplexity &amp; Google AI.
          </p>
        </div>
      </section>

      {/* Featured Posts */}
      <section className="pb-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-6">
            {featured.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-emerald-500/30 transition-all"
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded font-medium">
                    {post.category}
                  </span>
                  <span className="flex items-center gap-1 text-zinc-500 text-xs">
                    <Clock className="w-3 h-3" />
                    {post.readTime}
                  </span>
                </div>
                <h2 className="text-lg font-semibold text-white group-hover:text-emerald-400 transition-colors mb-3 leading-snug">
                  {post.title}
                </h2>
                <p className="text-sm text-zinc-400 line-clamp-3 mb-4">
                  {post.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">{post.date}</span>
                  <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-emerald-400 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* All Posts */}
      <section className="pb-24">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-xl font-bold text-white mb-8">All Articles</h2>
          <div className="space-y-4">
            {rest.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group flex items-start gap-6 bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-5 hover:border-emerald-500/20 transition-all"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-xs rounded">
                      {post.category}
                    </span>
                    <span className="text-zinc-600 text-xs">{post.date}</span>
                  </div>
                  <h3 className="text-white font-medium group-hover:text-emerald-400 transition-colors mb-1">
                    {post.title}
                  </h3>
                  <p className="text-sm text-zinc-500 line-clamp-2">
                    {post.description}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-zinc-500 text-xs shrink-0 mt-1">
                  <Clock className="w-3 h-3" />
                  {post.readTime}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-emerald-950/30 border-t border-emerald-900/30">
        <div className="max-w-xl mx-auto px-6 text-center">
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
        </div>
      </section>
    </div>
  );
}
