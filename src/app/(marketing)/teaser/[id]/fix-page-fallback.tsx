import Link from "next/link";
import {
  ArrowRight,
  Lock,
  FileText,
  Sparkles,
  HelpCircle,
  Search,
  CheckCircle2,
} from "lucide-react";

interface FixPageFallbackProps {
  domain: string;
  gapCount?: number;
}

export default function FixPageFallback({ domain, gapCount = 0 }: FixPageFallbackProps) {
  return (
    <div className="relative bg-zinc-900 border border-emerald-500/20 rounded-2xl overflow-hidden mb-8 shadow-2xl shadow-emerald-500/[0.06]">
      {/* Ambient glow */}
      <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-emerald-500/[0.06] rounded-full blur-[100px] pointer-events-none" />

      {/* Header banner */}
      <div className="relative bg-gradient-to-r from-emerald-500/15 via-emerald-500/10 to-teal-500/15 border-b border-emerald-500/20 px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-400">
              We can build fix pages for {domain}
            </p>
            <p className="text-xs text-emerald-400/60">
              AI-optimized content that earns citations
            </p>
          </div>
        </div>
      </div>

      <div className="relative p-6">
        {/* Feature badges */}
        <div className="flex flex-wrap gap-2 mb-5">
          {[
            { icon: FileText, label: "1,000+ words" },
            { icon: HelpCircle, label: "FAQ schema" },
            { icon: Search, label: "AI-citable structure" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-800/80 border border-zinc-700/50 rounded-lg">
              <Icon className="w-3 h-3 text-emerald-400" />
              <span className="text-xs text-zinc-400">{label}</span>
            </div>
          ))}
        </div>

        {/* Blurred mock content */}
        <div className="relative mb-6">
          <div className="bg-zinc-800/30 border border-zinc-800 rounded-xl p-5 select-none blur-[6px] pointer-events-none space-y-3" aria-hidden="true">
            <div className="h-6 bg-zinc-700/40 rounded w-3/4" />
            <div className="h-3 bg-zinc-700/30 rounded w-full" />
            <div className="h-3 bg-zinc-700/30 rounded w-5/6" />
            <div className="h-3 bg-zinc-700/30 rounded w-full" />
            <div className="h-3 bg-zinc-700/30 rounded w-2/3" />
            <div className="h-5 bg-zinc-700/40 rounded w-1/2 mt-4" />
            <div className="h-3 bg-zinc-700/30 rounded w-full" />
            <div className="h-3 bg-zinc-700/30 rounded w-4/5" />
            <div className="h-3 bg-zinc-700/30 rounded w-full" />
            <div className="h-3 bg-zinc-700/30 rounded w-3/4" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-zinc-900/95 backdrop-blur-sm border border-zinc-700/80 rounded-xl px-6 py-5 text-center shadow-2xl max-w-xs">
              <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center mx-auto mb-3">
                <Lock className="w-4 h-4 text-zinc-400" />
              </div>
              <p className="text-white font-semibold text-sm mb-1">
                {gapCount > 0
                  ? `${gapCount} fix page${gapCount > 1 ? "s" : ""} ready to generate`
                  : "Fix pages ready to generate"
                }
              </p>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Comparison content, FAQ schema, and meta tags &mdash; targeted at the exact queries where AI doesn&rsquo;t mention you
              </p>
            </div>
          </div>
        </div>

        {/* What's included checklist */}
        <div className="mb-6 bg-emerald-500/[0.04] border border-emerald-500/10 rounded-xl p-4">
          <p className="text-xs font-medium text-emerald-400 uppercase tracking-wide mb-3">
            Each fix page includes
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              "SEO-optimized comparison content",
              "FAQ schema for rich results",
              "AI-citable page structure",
              "Natural brand positioning",
              "Ready to copy-paste & publish",
              "Auto-generated meta tags",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500/60 shrink-0" />
                <span className="text-xs text-zinc-400">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <Link
          href={`/signup?domain=${encodeURIComponent(domain)}`}
          className="group flex items-center justify-center gap-2 w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98]"
        >
          Get your fix pages + full action plan
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
        <p className="text-xs text-zinc-500 text-center mt-2">
          We generate the content &mdash; you just publish it
        </p>
      </div>
    </div>
  );
}
