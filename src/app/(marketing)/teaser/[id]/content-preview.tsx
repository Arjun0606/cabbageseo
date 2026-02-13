"use client";

import Link from "next/link";
import {
  ArrowRight,
  Lock,
  FileText,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  Globe,
  Search,
  Zap,
} from "lucide-react";

interface ContentPreviewProps {
  domain: string;
  preview: {
    title: string;
    metaDescription: string;
    firstParagraph: string;
    blurredBody: string;
    faqItems: Array<{ question: string; answer: string }>;
    wordCount: number;
    brandUsed: string;
  };
}

export default function ContentPreview({ domain, preview }: ContentPreviewProps) {
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
              We already started building this for you
            </p>
            <p className="text-xs text-emerald-400/60">
              AI-optimized fix page — ready to publish
            </p>
          </div>
        </div>
      </div>

      <div className="relative p-6">
        {/* What you get badges */}
        <div className="flex flex-wrap gap-2 mb-5">
          {[
            { icon: FileText, label: `${preview.wordCount} words` },
            { icon: HelpCircle, label: `${preview.faqItems.length} FAQ items` },
            { icon: Search, label: "Schema markup" },
            { icon: Globe, label: "AI-ready structure" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-800/80 border border-zinc-700/50 rounded-lg"
            >
              <Icon className="w-3 h-3 text-emerald-400" />
              <span className="text-xs text-zinc-400">{label}</span>
            </div>
          ))}
        </div>

        {/* Page title preview */}
        <div className="mb-5">
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2">
            Page Title
          </p>
          <h3 className="text-xl font-bold text-white leading-tight">
            {preview.title}
          </h3>
        </div>

        {/* Meta description */}
        <div className="mb-5 bg-zinc-800/40 border border-zinc-700/40 rounded-xl px-4 py-3">
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5">
            Meta Description
          </p>
          <p className="text-sm text-zinc-300 italic leading-relaxed">
            {preview.metaDescription}
          </p>
        </div>

        {/* Visible first paragraph */}
        <div className="mb-4">
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2">
            Introduction
          </p>
          <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4">
            <div className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">
              {preview.firstParagraph}
            </div>
          </div>
        </div>

        {/* Blurred body content */}
        <div className="relative mb-6">
          <div
            className="bg-zinc-800/30 border border-zinc-800 rounded-xl p-4 select-none blur-[6px] pointer-events-none"
            aria-hidden="true"
          >
            <div className="text-zinc-400 text-sm leading-relaxed whitespace-pre-wrap">
              {preview.blurredBody}
            </div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-zinc-900/95 backdrop-blur-sm border border-zinc-700/80 rounded-xl px-6 py-5 text-center shadow-2xl max-w-xs">
              <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center mx-auto mb-3">
                <Lock className="w-4 h-4 text-zinc-400" />
              </div>
              <p className="text-white font-semibold text-sm mb-1">
                Full {preview.wordCount}-word page ready
              </p>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Comparison sections, feature breakdowns, and structured data — ready to publish in one click
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Preview — first visible, rest blurred */}
        {preview.faqItems.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <HelpCircle className="w-3 h-3 text-emerald-400" />
              </div>
              <p className="text-sm font-medium text-zinc-300">
                FAQ Schema ({preview.faqItems.length} items)
              </p>
              <span className="ml-auto text-[10px] text-emerald-400/60 uppercase tracking-widest">AI-Citable</span>
            </div>
            <div className="space-y-2">
              {preview.faqItems.map((faq, i) => (
                <div
                  key={i}
                  className={`rounded-xl p-3.5 transition-colors ${
                    i === 0
                      ? "bg-zinc-800/60 border border-zinc-700/60"
                      : "bg-zinc-800/30 border border-zinc-800/60"
                  }`}
                >
                  <p className={`text-sm font-medium mb-1 ${i === 0 ? "text-white" : "text-zinc-300"}`}>
                    Q: {faq.question}
                  </p>
                  <p
                    className={`text-xs leading-relaxed ${
                      i === 0
                        ? "text-zinc-400"
                        : "text-zinc-600 select-none blur-[6px]"
                    }`}
                  >
                    {faq.answer}
                  </p>
                  {i > 0 && (
                    <div className="flex items-center gap-1 mt-1.5">
                      <Lock className="w-3 h-3 text-zinc-600" />
                      <span className="text-zinc-600 text-[11px]">Sign up to unlock</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* What's included checklist */}
        <div className="mb-6 bg-emerald-500/[0.04] border border-emerald-500/10 rounded-xl p-4">
          <p className="text-xs font-medium text-emerald-400 uppercase tracking-wide mb-3">
            What&apos;s in your fix page
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              "SEO-optimized comparison content",
              "FAQ schema for rich results",
              "AI-citable structure",
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
          <Zap className="w-4 h-4" />
          Get this page + your full action plan
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
        <p className="text-xs text-zinc-500 text-center mt-2">
          We generate the content — you just publish it
        </p>
      </div>
    </div>
  );
}
