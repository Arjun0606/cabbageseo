import Link from "next/link";
import { ArrowRight, Calendar, Clock } from "lucide-react";
import { getAllPosts } from "@/lib/blog";
import { GradientOrbs } from "@/components/backgrounds/gradient-orbs";

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Hero */}
      <section className="pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            AI Visibility Blog
          </h1>
          <p className="text-lg text-zinc-400 max-w-xl mx-auto">
            Guides, research, and strategies for getting recommended by ChatGPT,
            Perplexity &amp; Google AI.
          </p>
        </div>
      </section>

      {/* Posts */}
      <section className="pb-24">
        <div className="max-w-7xl mx-auto px-6">
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-zinc-500">Articles coming soon.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="block group"
                >
                  <article className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 hover:border-emerald-500/30 hover:bg-emerald-500/[0.02] transition-all">
                    <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-500 mb-3">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(post.date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {post.readingTime} min read
                      </span>
                      {post.tags.length > 0 && (
                        <div className="flex gap-1.5">
                          {post.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                      {post.title}
                    </h2>
                    <p className="text-zinc-400 text-sm leading-relaxed mb-3">
                      {post.description}
                    </p>
                    <span className="inline-flex items-center gap-1 text-sm text-emerald-400 font-medium">
                      Read more <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden py-16 bg-emerald-950/30 border-t border-emerald-900/30">
        <GradientOrbs variant="emerald" />
        <div className="relative z-10 max-w-xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">
            Stop reading. Start checking.
          </h2>
          <p className="text-zinc-400 mb-6">
            Check your AI visibility score in 10 seconds. No signup.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-colors"
          >
            Check your score free <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
